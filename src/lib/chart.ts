/** Chart geometry for the experience timeline. Pure, so it can be tested. */

/** X-axis domain: wide enough that the 2021 and 2027 badges are not clipped. */
export const DOMAIN: [number, number] = [2020.7, 2027.3];

/** Recharts margins, needed to turn container width into plot width. */
export const MARGIN = { top: 32, right: 28, bottom: 8, left: 4 };

/** The closest pair on the timeline: Ericsson (2026.00) and Citi (2026.33). */
export const CLOSEST_PAIR_YEARS = 0.33;

export function plotWidth(containerWidth: number): number {
  return Math.max(0, containerWidth - MARGIN.left - MARGIN.right);
}

/** Horizontal distance between the two closest points, in pixels. */
export function closestGap(containerWidth: number): number {
  const span = DOMAIN[1] - DOMAIN[0];
  return (CLOSEST_PAIR_YEARS / span) * plotWidth(containerWidth);
}

/**
 * Logo badge radius: as large as the chart can carry, but never large enough
 * for the two 2026 badges to touch. The selected badge draws 2px larger with a
 * 2.5px ring, which `drawnDiameter` accounts for.
 */
export function badgeRadius(containerWidth: number): number {
  if (!containerWidth) return 14;
  return Math.max(11, Math.min(26, (containerWidth - 30) / 52));
}

export const ACTIVE_BUMP = 2;
const RING_WIDTH = 2.5;

/** Widest a badge ever paints: selected radius plus its ring. */
export function drawnDiameter(radius: number): number {
  return 2 * (radius + ACTIVE_BUMP) + RING_WIDTH;
}
