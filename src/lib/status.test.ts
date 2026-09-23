import assert from "node:assert/strict";
import test from "node:test";
import { statusOf } from "./status.ts";

const citi = { start: { year: 2026, month: 5 }, end: { year: 2026, month: 9 } };
const ericsson = {
  start: { year: 2026, month: 1 },
  end: { year: 2026, month: 4 },
};
const devclub = { start: { year: 2022, month: 9 }, end: null };

test("a role is current through the last day of its end month", () => {
  assert.equal(statusOf(citi, new Date(2026, 8, 30, 23, 0)), "Current");
  assert.equal(statusOf(citi, new Date(2026, 9, 1)), "Completed");
});

test("a role that has not started yet is upcoming", () => {
  assert.equal(statusOf(citi, new Date(2026, 3, 30)), "Upcoming");
  assert.equal(statusOf(citi, new Date(2026, 4, 1)), "Current");
});

test("an open-ended role stays current", () => {
  assert.equal(statusOf(devclub, new Date(2030, 0, 1)), "Current");
});

test("finished roles report completed", () => {
  assert.equal(statusOf(ericsson, new Date(2026, 8, 19)), "Completed");
});

test("undated entries have no status", () => {
  assert.equal(statusOf({}, new Date()), null);
});
