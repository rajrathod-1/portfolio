/**
 * The camera path for the 3D backdrop. Scroll progress (0 at the top of the
 * page, 1 at the bottom) is mapped to a camera pose by interpolating between
 * these stations, so each section of the page arrives at its own viewpoint.
 *
 * Pure maths, kept out of the scene so it can be tested.
 */

export interface Pose {
  position: [number, number, number];
  /** Where the camera looks. */
  target: [number, number, number];
}

export interface Station extends Pose {
  /** Scroll progress this pose belongs to, 0-1. */
  at: number;
  name: string;
}

export const STATIONS: Station[] = [
  {
    name: "hero",
    at: 0,
    position: [0, 1.8, 9.5],
    target: [0, 1.1, 0],
  },
  {
    name: "experience",
    at: 0.34,
    position: [-7.5, 4.2, 4.5],
    target: [-1.5, 1.4, -7],
  },
  {
    name: "projects",
    at: 0.68,
    position: [1.5, 2.6, -9],
    target: [0, 1.2, -17.5],
  },
  {
    name: "connect",
    at: 1,
    position: [0, 10, 12],
    target: [0, 0, -7],
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smoothstep, so arrivals and departures ease rather than snap. */
const ease = (t: number) => t * t * (3 - 2 * t);

function lerpTriple(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** The camera pose for a given scroll progress. Clamps outside 0-1. */
export function poseAt(progress: number, stations: Station[] = STATIONS): Pose {
  const p = Math.max(0, Math.min(1, progress));

  if (p <= stations[0].at) {
    return { position: stations[0].position, target: stations[0].target };
  }
  const last = stations[stations.length - 1];
  if (p >= last.at) {
    return { position: last.position, target: last.target };
  }

  for (let i = 0; i < stations.length - 1; i++) {
    const from = stations[i];
    const to = stations[i + 1];
    if (p >= from.at && p <= to.at) {
      const span = to.at - from.at;
      const t = ease(span === 0 ? 0 : (p - from.at) / span);
      return {
        position: lerpTriple(from.position, to.position, t),
        target: lerpTriple(from.target, to.target, t),
      };
    }
  }

  return { position: last.position, target: last.target };
}

/** Document scroll as 0-1. Returns 0 when the page is too short to scroll. */
export function scrollProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number
): number {
  const max = scrollHeight - viewportHeight;
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, scrollY / max));
}
