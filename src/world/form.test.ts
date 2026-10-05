import { test } from "node:test";
import assert from "node:assert/strict";
import { formAt, inversionAt } from "./form.ts";

const vh = 1000;
const bounds = [1200, 3200, 9000, 12000];

test("holds the name at the top of the page", () => {
  assert.equal(formAt(bounds, 0, vh), 1);
});

test("is mid-morph exactly when a boundary crosses the viewport centre", () => {
  assert.equal(formAt(bounds, 1200 - vh / 2, vh), 1.5);
});

test("holds a whole formation inside a long section", () => {
  assert.equal(formAt(bounds, 5000, vh), 3);
  assert.equal(formAt(bounds, 8000, vh), 3);
});

test("ends on the last formation", () => {
  assert.equal(formAt(bounds, 20000, vh), 5);
});

test("only the Matched formation is inverted", () => {
  assert.equal(inversionAt(4), 1);
  assert.equal(inversionAt(3), 0);
  assert.equal(inversionAt(5), 0);
  assert.equal(inversionAt(3.5), 0.5);
});
