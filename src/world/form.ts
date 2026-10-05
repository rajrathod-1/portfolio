/** The particle formations, in story order. Index = shader formation id. */
export const FORMS = ["Noise", "Signal", "Stream", "Offsets", "Matched", "Ack"] as const;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Scroll position → formation. Formation 1 (the name) holds at the top; each
 * section boundary adds one, morphing over a single viewport height centred
 * on the boundary, so long sections hold still and short ones don't drag.
 */
export function formAt(boundaries: number[], scrollY: number, vh: number): number {
  const centre = scrollY + vh / 2;
  return boundaries.reduce(
    (form, b) => form + smoothstep(-0.5, 0.5, (centre - b) / vh),
    1
  );
}

/** How far the world has flipped to paper: only around the Matched formation. */
export function inversionAt(form: number): number {
  return smoothstep(0.62, 0.38, Math.abs(form - 4));
}
