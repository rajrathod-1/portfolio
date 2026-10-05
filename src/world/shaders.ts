// Every particle is one "message". Each formation is a pure function of the
// particle's seed and the stream clock, so morphing is just mixing two of them.

const common = /* glsl */ `
  const float TAU = 6.28318530718;
  const vec3 INK = vec3(0.043, 0.043, 0.047);
  const vec3 PAPER = vec3(0.922, 0.906, 0.875);
  const vec3 SIGNAL = vec3(1.0, 0.294, 0.122);
`;

export const particleVertex = /* glsl */ `
  ${common}
  uniform float uFlow;
  uniform float uFrom;
  uniform float uTo;
  uniform float uMix;
  uniform vec2 uMouse;
  uniform float uMouseForce;
  uniform float uAspect;
  uniform float uSize;
  uniform float uInvert;
  uniform float uNova;
  uniform float uFocus;
  uniform float uCalm; // portrait: copy covers the scene, so thin it out

  attribute vec4 aSeed;
  varying float vAlpha;
  varying vec3 vColor;

  // fx.x = alpha, fx.y = flash (a matched trade, a burst)

  vec3 noiseForm(vec4 s, float t, inout vec2 fx) {
    vec3 p = (s.zxy - 0.5) * vec3(28.0, 17.0, 16.0) + vec3(0.0, 0.0, 2.0);
    p += 0.9 * vec3(sin(t * 0.21 + s.w * 40.0), cos(t * 0.17 + s.x * 40.0), sin(t * 0.13 + s.y * 40.0));
    fx.x = 1.0;
    return p;
  }

  vec3 nameForm(vec4 s, float t, inout vec2 fx) {
    fx.x = 0.9;
    return position + 0.025 * vec3(sin(t * 1.3 + s.x * 40.0), cos(t * 1.1 + s.y * 40.0), 0.0);
  }

  // Lanes of packets, like partitions of a topic seen from above.
  vec3 streamForm(vec4 s, float t, inout vec2 fx) {
    const float LANES = 9.0;
    float lane = floor(s.x * LANES);
    float li = lane - (LANES - 1.0) * 0.5;
    // Bunch particles toward the front of each segment, then move the bunches:
    // that reads as discrete packets with a fading tail.
    float k = 11.0;
    float seg = s.y * k;
    float packed = (floor(seg) + 1.0 - pow(1.0 - fract(seg), 2.4)) / k;
    float speed = 0.03 + 0.025 * fract(lane * 0.618);
    float u = fract(packed + t * speed);
    float x = (u - 0.5) * 38.0;
    float y = sin(x * 0.22 + lane * 0.9 + t * 0.5) * 0.45
            + sin(x * 0.09 - t * 0.2 + lane * 0.3) * 0.6
            + (s.w - 0.5) * 0.14;
    float z = li * 0.9 + (s.z - 0.5) * 0.24;
    fx.x = 0.8 * smoothstep(0.0, 0.08, u) * smoothstep(1.0, 0.9, u);
    return vec3(x, y, z);
  }

  // The camera sits inside the stream: twisted strands flowing past.
  vec3 tunnelForm(vec4 s, float t, inout vec2 fx) {
    float zf = fract(s.y + t * (0.035 + 0.025 * s.w));
    float z = -44.0 + zf * 52.0;
    float strand = floor(s.x * 14.0);
    float lined = step(0.3, s.z);
    float a = mix(s.x * TAU, (strand + (s.z - 0.5) * 0.1) / 14.0 * TAU, lined)
            + z * 0.05 + t * 0.04;
    float r = 3.4 + (s.w - 0.5) * mix(2.2, 0.3, lined) + 0.4 * sin(z * 0.22 + strand);
    fx.x = 0.75 - uCalm * 0.25;
    return vec3(cos(a) * r, sin(a) * r, z);
  }

  // Two sides of an order book closing on the spread. Matched pairs flash and vanish.
  vec3 matchForm(vec4 s, float t, inout vec2 fx) {
    float side = s.x < 0.5 ? -1.0 : 1.0;
    float level = floor(fract(s.x * 2.0) * 18.0);
    float speed = (0.045 + 0.04 * fract(level * 0.618 + side * 0.31)) * (1.0 + uFocus * 1.8);
    float u = fract(s.y + t * speed);
    float hit = smoothstep(0.94, 1.0, u);
    float x = side * (0.05 + pow(1.0 - u, 1.7) * 12.0);
    float y = (level - 8.5) * 0.34 + (s.w - 0.5) * 0.1 + hit * (s.z - 0.5) * 1.6;
    float z = (s.z - 0.5) * 1.4 + hit * (s.w - 0.5) * 3.0;
    fx.x = (0.75 - uCalm * 0.4) * smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.985, 1.0, u));
    fx.y = hit;
    return vec3(x, y, z);
  }

  // Everything collapses into one point with a disk around it.
  vec3 orbForm(vec4 s, float t, inout vec2 fx) {
    float th = s.x * TAU + t * 0.15;
    float ph = acos(2.0 * fract(s.y * 13.7 + s.z * 5.3) - 1.0);
    float r = 0.95 + (s.z - 0.5) * 0.08 + 0.02 * sin(t * 2.0 + s.x * 40.0);
    vec3 shell = r * vec3(sin(ph) * cos(th), cos(ph), sin(ph) * sin(th));

    float rr = 1.6 + pow(s.z, 1.8) * 3.0;
    float a = s.x * TAU + t * (0.9 / rr);
    vec3 disk = vec3(cos(a) * rr, (s.y - 0.5) * 0.06, sin(a) * rr);
    float c = cos(0.42), sn = sin(0.42);
    disk.yz = mat2(c, sn, -sn, c) * disk.yz;

    float inDisk = step(0.4, s.w);
    vec3 p = mix(shell, disk, inDisk);
    p *= 1.0 + 0.035 * sin(t * 1.4);
    p += normalize(p + 1e-4) * uNova * (3.0 + 10.0 * s.z);
    fx.x = mix(0.3, 0.8, inDisk);
    fx.y = uNova * step(0.75, s.z);
    return p;
  }

  vec3 form(float k, vec4 s, float t, inout vec2 fx) {
    if (k < 0.5) return noiseForm(s, t, fx);
    if (k < 1.5) return nameForm(s, t, fx);
    if (k < 2.5) return streamForm(s, t, fx);
    if (k < 3.5) return tunnelForm(s, t, fx);
    if (k < 4.5) return matchForm(s, t, fx);
    return orbForm(s, t, fx);
  }

  void main() {
    float t = uFlow;
    // Staggered per particle so a morph ripples through the cloud.
    float m = clamp(uMix * 1.6 - aSeed.w * 0.6, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);

    vec2 fa = vec2(1.0, 0.0);
    vec2 fb = vec2(1.0, 0.0);
    vec3 p = mix(form(uFrom, aSeed, t, fa), form(uTo, aSeed, t, fb), m);
    vec2 fx = mix(fa, fb, m);
    p += sin(m * 3.14159) * 1.8 * vec3(
      sin(aSeed.x * TAU + t), cos(aSeed.y * TAU + t * 0.8), sin(aSeed.z * TAU + t * 0.6));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // Cursor wake, in screen space so it works the same in every formation.
    vec4 clip = projectionMatrix * mv;
    vec2 d = (clip.xy / clip.w - uMouse) * vec2(uAspect, 1.0);
    float r2 = dot(d, d);
    float f = exp(-r2 / 0.03) * uMouseForce * step(0.0, clip.w);
    vec2 dir = d / (sqrt(r2) + 1e-4);
    mv.xy += (dir + vec2(-dir.y, dir.x) * 0.7) * f * (-mv.z) * 0.11;

    gl_Position = projectionMatrix * mv;

    float depth = -mv.z;
    gl_PointSize = uSize * (0.55 + aSeed.z * 0.9) * (1.0 + fx.y * 2.2) / depth;
    vAlpha = fx.x * smoothstep(0.6, 3.0, depth) * (1.0 - smoothstep(30.0, 50.0, depth));

    // The post pass inverts the frame in Matched; pre-invert the signal colour
    // so it still lands as vermilion on paper.
    vec3 sig = mix(SIGNAL, PAPER + INK - SIGNAL, uInvert);
    float isSignal = max(step(0.982, aSeed.y), fx.y);
    vColor = mix(PAPER, sig, isSignal);
  }
`;

export const particleFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }
`;

export const postVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const postFragment = /* glsl */ `
  ${common}
  uniform sampler2D tScene;
  uniform float uInvert;
  uniform float uVelocity;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 fromCentre = vUv - 0.5;
    // Speed tears the colour channels apart toward the edges.
    vec2 split = fromCentre * (0.002 + uVelocity * 0.012);
    vec3 c = vec3(
      texture2D(tScene, vUv + split).r,
      texture2D(tScene, vUv).g,
      texture2D(tScene, vUv - split).b
    );
    c *= mix(1.0, smoothstep(0.95, 0.25, length(fromCentre)), 0.55);
    // Ink ↔ paper, channel by channel: the background lands on paper exactly.
    c = mix(c, PAPER + INK - c, uInvert);
    c += (hash(vUv * uResolution + fract(uTime) * 100.0) - 0.5) * 0.05;
    gl_FragColor = vec4(c, 1.0);
  }
`;
