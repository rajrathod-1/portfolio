import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { poseAt } from "@/lib/scroll-stations";

/** Reads a theme token, so the world follows the site's palette. */
function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Wireframe box: the visual language the site already uses. */
const WireBox: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  opacity?: number;
}> = ({ position, size, color, opacity = 0.5 }) => {
  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)),
    [size]
  );
  return (
    <lineSegments position={position} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
};

/** Station 1: the terminal, as a slab floating over the grid. */
const TerminalSlab: React.FC<{ colors: Palette }> = ({ colors }) => {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.14) * 0.16;
    group.current.position.y = 1.1 + Math.sin(t * 0.35) * 0.08;
  });

  return (
    <group ref={group} position={[0, 1.1, 0]}>
      {/* The screen: a dim emissive face, so it reads as lit from within. */}
      <mesh>
        <boxGeometry args={[4.6, 2.7, 0.14]} />
        <meshBasicMaterial color={colors.surface} transparent opacity={0.55} />
      </mesh>
      <WireBox position={[0, 0, 0]} size={[4.6, 2.7, 0.14]} color={colors.blue} opacity={0.75} />
      {/* Prompt bar across the top, echoing the window chrome. */}
      <mesh position={[0, 1.12, 0.08]}>
        <planeGeometry args={[4.6, 0.36]} />
        <meshBasicMaterial color={colors.blue} transparent opacity={0.12} />
      </mesh>
      <mesh position={[-2.0, 1.12, 0.09]}>
        <circleGeometry args={[0.06, 12]} />
        <meshBasicMaterial color={colors.amber} />
      </mesh>
      <mesh position={[-1.78, 1.12, 0.09]}>
        <circleGeometry args={[0.06, 12]} />
        <meshBasicMaterial color={colors.green} />
      </mesh>
    </group>
  );
};

/** Station 2: the career timeline as a ribbon receding into depth. */
const TimelineRibbon: React.FC<{ colors: Palette }> = ({ colors }) => {
  const points = useMemo(() => {
    // Mirrors the growth curve on the page: rising, steeper near the present.
    const growth = [0.1, 0.25, 0.45, 0.65, 0.8, 0.9, 0.98];
    return growth.map(
      (g, i) =>
        new THREE.Vector3(-2.2 + i * 0.28, g * 3.1, -3 - i * 1.7)
    );
  }, []);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points),
    [points]
  );
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)),
    [curve]
  );

  return (
    <group>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color={colors.blue} transparent opacity={0.85} />
      </line>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <octahedronGeometry args={[i === points.length - 2 ? 0.16 : 0.1]} />
          <meshBasicMaterial
            color={i === points.length - 2 ? colors.amber : colors.mute}
          />
        </mesh>
      ))}
    </group>
  );
};

/** Station 3: the order book, as depth either side of the spread. */
const BookDepth: React.FC<{ colors: Palette }> = ({ colors }) => {
  const group = useRef<THREE.Group>(null);

  const bars = useMemo(() => {
    const out: { x: number; h: number; side: "bid" | "ask"; phase: number }[] =
      [];
    for (let i = 1; i <= 9; i++) {
      out.push({
        x: -i * 0.42,
        h: 0.25 + (9 - i) * 0.12,
        side: "bid",
        phase: i * 0.7,
      });
      out.push({
        x: i * 0.42,
        h: 0.25 + (9 - i) * 0.11,
        side: "ask",
        phase: i * 0.5,
      });
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const bar = bars[i];
      if (!bar) return;
      const h = bar.h * (0.75 + Math.sin(t * 0.9 + bar.phase) * 0.25);
      child.scale.y = h;
      child.position.y = (h * 1) / 2;
    });
  });

  return (
    <group ref={group} position={[0, 0, -17.5]}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.h / 2, bar.side === "bid" ? -0.3 : 0.3]}>
          <boxGeometry args={[0.3, 1, 0.45]} />
          <meshBasicMaterial
            color={bar.side === "bid" ? colors.green : colors.red}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
};

/** Slowly drifting debris, for parallax depth cues. */
const Drift: React.FC<{ colors: Palette }> = ({ colors }) => {
  const shapes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        position: [
          (Math.sin(i * 12.9898) * 43758.5453) % 14,
          ((Math.sin(i * 78.233) * 43758.5453) % 6) + 1,
          -((Math.sin(i * 39.425) * 43758.5453) % 20) - 2,
        ] as [number, number, number],
        size: 0.25 + ((i * 37) % 5) * 0.08,
        speed: 0.05 + ((i * 13) % 7) * 0.01,
      })),
    []
  );

  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      child.rotation.x = clock.elapsedTime * shapes[i].speed;
      child.rotation.y = clock.elapsedTime * shapes[i].speed * 0.7;
    });
  });

  return (
    <group ref={group}>
      {shapes.map((shape, i) => (
        <group key={i} position={shape.position}>
          <WireBox
            position={[0, 0, 0]}
            size={[shape.size, shape.size, shape.size]}
            color={colors.line}
            opacity={0.55}
          />
        </group>
      ))}
    </group>
  );
};

export interface Palette {
  blue: string;
  amber: string;
  green: string;
  red: string;
  violet: string;
  line: string;
  mute: string;
  surface: string;
}

/** Drives the camera from scroll progress, damped so it feels weighted. */
const CameraRig: React.FC<{ progress: React.RefObject<number> }> = ({
  progress,
}) => {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.1, 0));

  useFrame((_, delta) => {
    const pose = poseAt(progress.current ?? 0);
    const damping = 1 - Math.pow(0.0015, delta);

    camera.position.lerp(
      new THREE.Vector3(...pose.position),
      damping
    );
    target.current.lerp(new THREE.Vector3(...pose.target), damping);
    camera.lookAt(target.current);
  });

  return null;
};

const World: React.FC<{ progress: React.RefObject<number> }> = ({
  progress,
}) => {
  const colors = useMemo<Palette>(
    () => ({
      blue: token("--blue", "#7aa2f7"),
      amber: token("--amber", "#f0b45c"),
      green: token("--green", "#9ece6a"),
      red: token("--red", "#f7768e"),
      violet: token("--violet", "#bb9af7"),
      line: token("--line", "#26304a"),
      mute: token("--mute", "#8e98b0"),
      surface: token("--surface", "#161e30"),
    }),
    []
  );

  return (
    <>
      <CameraRig progress={progress} />
      <fog attach="fog" args={[token("--ink", "#0e1422"), 12, 34]} />

      <TerminalSlab colors={colors} />
      <TimelineRibbon colors={colors} />
      <BookDepth colors={colors} />
      <Drift colors={colors} />

      {/* The ground plane everything sits over. */}
      <gridHelper
        args={[70, 46, colors.line, colors.line]}
        position={[0, -1.6, -8]}
      />
    </>
  );
};

export default World;
