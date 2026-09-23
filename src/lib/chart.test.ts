import assert from "node:assert/strict";
import test from "node:test";
import { badgeRadius, closestGap, drawnDiameter } from "./chart.ts";

// The chart is hidden below 700px, so those are the widths that matter.
const WIDTHS = [700, 768, 900, 1100, 1280, 1440, 1920, 2560];

test("the two 2026 badges never overlap at any rendered width", () => {
  for (const width of WIDTHS) {
    const drawn = drawnDiameter(badgeRadius(width));
    const gap = closestGap(width);
    assert.ok(
      drawn < gap,
      `at ${width}px the badges paint ${drawn.toFixed(1)}px across but sit only ${gap.toFixed(1)}px apart`
    );
  }
});

test("badges grow with the chart, within bounds", () => {
  assert.ok(badgeRadius(700) < badgeRadius(1280));
  assert.equal(badgeRadius(2560), 26, "caps so badges never look cartoonish");
  assert.ok(badgeRadius(600) >= 11, "stays legible if it ever renders narrow");
});

test("an unmeasured container still gets a usable radius", () => {
  assert.equal(badgeRadius(0), 14);
});
