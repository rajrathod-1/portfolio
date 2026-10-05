import * as THREE from "three";
import { formAt, inversionAt } from "./form";
import { particleFragment, particleVertex, postFragment, postVertex } from "./shaders";
import { sampleText } from "./text";

export interface Frame {
  /** 0 noise … 5 ack, fractional while morphing. */
  form: number;
  /** 0 ink … 1 paper. */
  invert: number;
  /** The stream clock; stops while the visitor holds the mouse down. */
  flow: number;
  paused: boolean;
}

type Vec = [number, number, number];
type Pose = { pos: Vec; look: Vec };

// Camera per formation. On landscape screens the copy takes one half and the
// scene is framed into the other.
const POSES: { base: Pose; wide?: Pose }[] = [
  { base: { pos: [0, 0, 16], look: [0, 0, 0] } },
  { base: { pos: [0, 0, 11], look: [0, 0, 0] } },
  { base: { pos: [0, 4.4, 9], look: [0, -0.8, 0] } },
  {
    base: { pos: [0, 0, 6], look: [0, 0, -20] },
    wide: { pos: [0, 0, 6], look: [-5.5, 0, -20] },
  },
  {
    base: { pos: [0, 0, 14], look: [0, 0, 0] },
    wide: { pos: [5, 0, 12], look: [5, 0, 0] },
  },
  // The orb's lift is set per screen in resize() so it clears the contact copy.
  { base: { pos: [0, 0, 10], look: [0, -2, 0] } },
];

const NAME_FONT = '"Instrument Serif", Georgia, serif';
const INTRO_MS = 3600;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const damp = (from: number, to: number, rate: number, dt: number) =>
  from + (to - from) * Math.min(1, rate * dt);

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private postScene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
  private target = new THREE.WebGLRenderTarget(1, 1);
  private geometry = new THREE.BufferGeometry();
  private postGeometry = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  private postMaterial: THREE.ShaderMaterial;
  private count: number;
  private dpr: number;

  private raf = 0;
  private start = performance.now();
  private last = this.start;
  private boundaries: number[] = [];
  private scrollY = window.scrollY;
  private velocity = 0;
  private form = 0;
  private flow = 0;
  private timeScale = 1;
  private rush = 0;
  private holding = false;
  private hold = 0;
  private holdTimer = 0;
  private nova = 1;
  private focus = 0;
  private focusTarget = 0;
  private mouse = new THREE.Vector2();
  private mouseTarget = new THREE.Vector2();
  private mouseForce = 0;
  private pointerIn = 0;
  private wide = true;
  private orbPose: Pose = { pos: [0, 0, 10], look: [0, -2, 0] };
  private nameWidth = 0;
  private nameTimer = 0;
  private sampled = 0;
  private frames = 0;
  private slowFrames = 0;
  private pos = new THREE.Vector3();
  private look = new THREE.Vector3();
  private tmp = new THREE.Vector3();

  constructor(
    host: HTMLElement,
    private onFrame: (frame: Frame) => void,
    private reduced: boolean
  ) {
    // Throws when WebGL is unavailable; the caller falls back to plain type.
    this.renderer = new THREE.WebGLRenderer({ powerPreference: "high-performance" });
    this.renderer.setClearColor(0x0b0b0c);
    host.appendChild(this.renderer.domElement);

    const small =
      matchMedia("(max-width: 760px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    this.count = small ? 26000 : 64000;
    this.dpr = Math.min(window.devicePixelRatio, small ? 1.5 : 1.75);

    const seeds = new Float32Array(this.count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(this.count * 3), 3)
    );
    this.geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uFlow: { value: 0 },
        uFrom: { value: 0 },
        uTo: { value: 1 },
        uMix: { value: 0 },
        uMouse: { value: this.mouse },
        uMouseForce: { value: 0 },
        uAspect: { value: 1 },
        uSize: { value: 1 },
        uInvert: { value: 0 },
        uNova: { value: 0 },
        uFocus: { value: 0 },
        uCalm: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(this.geometry, this.material);
    points.frustumCulled = false;
    this.scene.add(points);

    // One triangle that covers the screen, for the post pass.
    this.postGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)
    );
    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader: postVertex,
      fragmentShader: postFragment,
      uniforms: {
        tScene: { value: this.target.texture },
        uInvert: { value: 0 },
        uVelocity: { value: 0 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
      },
      depthTest: false,
    });
    const quad = new THREE.Mesh(this.postGeometry, this.postMaterial);
    quad.frustumCulled = false;
    this.postScene.add(quad);

    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
    window.addEventListener("blur", this.onUp);
    document.documentElement.addEventListener("pointerleave", this.onLeave);

    this.resize();
    this.loop();
  }

  /** Document y of each section boundary, top to bottom. */
  setBoundaries(boundaries: number[]) {
    this.boundaries = boundaries;
  }

  /** Something the visitor is pointing at wants the stream to run hot. */
  setFocus(on: boolean) {
    this.focusTarget = on ? 1 : 0;
  }

  /** Blow the final singularity apart; it pulls itself back together. */
  ack() {
    this.nova = 0;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.holdTimer);
    clearTimeout(this.nameTimer);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("blur", this.onUp);
    document.documentElement.removeEventListener("pointerleave", this.onLeave);
    this.geometry.dispose();
    this.postGeometry.dispose();
    this.material.dispose();
    this.postMaterial.dispose();
    this.target.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    // Keep the horizontal field of view on portrait screens so nothing crops.
    const stretch = Math.min(1.9, Math.max(1, 0.9 / aspect));
    this.camera.aspect = aspect;
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(Math.PI / 8) * stretch));
    this.camera.updateProjectionMatrix();
    this.wide = aspect > 1.1;
    // Put the orb a fifth of the way down the screen, whatever the aspect.
    const halfH = 10 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.orbPose.look[1] = -0.58 * halfH;

    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.target.setSize(Math.round(w * this.dpr), Math.round(h * this.dpr));

    const u = this.material.uniforms;
    u.uAspect.value = aspect;
    u.uCalm.value = aspect < 0.9 ? 1 : 0;
    u.uSize.value = 30 * this.dpr * Math.min(1.3, h / 900);
    this.postMaterial.uniforms.uResolution.value.set(w * this.dpr, h * this.dpr);

    // Mobile toolbars change the height constantly; only re-lay the name when
    // the width does.
    if (w !== this.nameWidth) {
      this.nameWidth = w;
      clearTimeout(this.nameTimer);
      if (this.sampled) this.nameTimer = window.setTimeout(this.layoutName, 200);
      else this.layoutName();
    }
  };

  private layoutName = () => {
    const portrait = this.camera.aspect < 0.9;
    const visH = 2 * POSES[1].base.pos[2] * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const visW = visH * this.camera.aspect;
    const points = sampleText(
      portrait ? ["RAJ", "RATHOD"] : ["RAJ RATHOD"],
      NAME_FONT,
      this.count,
      visW * (portrait ? 0.84 : 0.8),
      visH * (portrait ? 0.34 : 0.42)
    );
    const attr = this.geometry.getAttribute("position") as THREE.BufferAttribute;
    (attr.array as Float32Array).set(points);
    attr.needsUpdate = true;
    this.sampled++;
  };

  private onMove = (e: PointerEvent) => {
    this.mouseTarget.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    this.pointerIn = 1;
  };

  private onLeave = () => {
    this.pointerIn = 0;
  };

  // Holding the mouse anywhere that isn't a control freezes the stream.
  private onDown = (e: PointerEvent) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    if ((e.target as Element).closest("a, button, summary, input, textarea")) return;
    clearTimeout(this.holdTimer);
    this.holdTimer = window.setTimeout(() => (this.holding = true), 160);
  };

  private onUp = () => {
    clearTimeout(this.holdTimer);
    if (this.holding) this.rush = 2.4;
    this.holding = false;
  };

  private poseOf(i: number): Pose {
    return i === 5 ? this.orbPose : (this.wide && POSES[i].wide) || POSES[i].base;
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const vh = window.innerHeight;

    // Scroll: where we are in the story, and how fast we're moving through it.
    const y = window.scrollY;
    const v = Math.abs(y - this.scrollY) / vh / Math.max(dt, 1e-3);
    this.scrollY = y;
    this.velocity = damp(this.velocity, Math.min(v, 4), 6, dt);
    const intro = this.reduced ? 1 : ease(clamp01((now - this.start) / INTRO_MS - 0.22));
    this.form = damp(this.form, formAt(this.boundaries, y, vh) * intro, 4, dt);

    // The stream clock: runs hot while scrolling, stops while held, rushes on release.
    const speed = this.holding ? 0 : (this.reduced ? 0.3 : 1) * (1 + this.velocity * 0.8) + this.rush;
    this.timeScale = damp(this.timeScale, speed, this.holding ? 3 : 2, dt);
    this.rush = Math.max(0, this.rush - dt * 1.5);
    this.flow += dt * this.timeScale;
    this.hold = damp(this.hold, this.holding ? 1 : 0, 3, dt);

    const mx = this.mouse.x;
    const my = this.mouse.y;
    this.mouse.lerp(this.mouseTarget, Math.min(1, dt * 8));
    const cursorSpeed = Math.hypot(this.mouse.x - mx, this.mouse.y - my) / Math.max(dt, 1e-3);
    const force = Math.min(0.2 + cursorSpeed * 0.5, 2.2) * this.pointerIn * (this.reduced ? 0.3 : 1);
    this.mouseForce = damp(this.mouseForce, force, 5, dt);

    this.focus = damp(this.focus, this.focusTarget, 3, dt);
    this.nova = Math.min(1, this.nova + dt / 2.6);
    const nova = (1 - this.nova) ** 2.2 * ease(clamp01(this.nova / 0.05));

    const from = Math.min(Math.floor(this.form), POSES.length - 2);
    const mix = this.form - from;
    const invert = inversionAt(this.form);

    const u = this.material.uniforms;
    u.uFlow.value = this.flow;
    u.uFrom.value = from;
    u.uTo.value = from + 1;
    u.uMix.value = mix;
    u.uMouseForce.value = this.mouseForce;
    u.uInvert.value = invert;
    u.uNova.value = nova;
    u.uFocus.value = this.focus;
    const p = this.postMaterial.uniforms;
    p.uInvert.value = invert;
    p.uVelocity.value = this.reduced ? 0 : Math.min(this.velocity, 3) + nova;
    p.uTime.value = now / 1000;

    this.placeCamera(from, mix);
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.camera);

    this.onFrame({ form: this.form, invert, flow: this.flow, paused: this.hold > 0.5 });
    this.adapt(now, dt);
  };

  private placeCamera(from: number, mix: number) {
    const e = ease(mix);
    const a = this.poseOf(from);
    const b = this.poseOf(from + 1);
    this.pos.fromArray(a.pos).lerp(this.tmp.fromArray(b.pos), e);
    this.look.fromArray(a.look).lerp(this.tmp.fromArray(b.look), e);
    this.pos.x += this.mouse.x * 0.5;
    this.pos.y += this.mouse.y * 0.3;
    // While held, the cursor orbits the frozen frame so its depth shows.
    this.tmp.subVectors(this.pos, this.look).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.hold * this.mouse.x * 0.9);
    this.camera.position.addVectors(this.look, this.tmp);
    this.camera.lookAt(this.look);
  }

  /** One-shot: if the first seconds after the intro run slow, drop to 1x pixels. */
  private adapt(now: number, dt: number) {
    if (this.frames > 120 || now - this.start < INTRO_MS + 500) return;
    this.frames++;
    if (dt > 1 / 40) this.slowFrames++;
    if (this.frames === 120 && this.slowFrames > 60 && this.dpr > 1) {
      this.dpr = 1;
      this.resize();
    }
  }
}
