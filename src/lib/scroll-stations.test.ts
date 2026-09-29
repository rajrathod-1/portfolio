import assert from "node:assert/strict";
import test from "node:test";
import { STATIONS, poseAt, scrollProgress } from "./scroll-stations.ts";

test("each station is reached at its own scroll position", () => {
  for (const station of STATIONS) {
    const pose = poseAt(station.at);
    assert.deepEqual(
      pose.position.map((n) => Math.round(n * 100) / 100),
      station.position,
      `${station.name} position`
    );
    assert.deepEqual(
      pose.target.map((n) => Math.round(n * 100) / 100),
      station.target,
      `${station.name} target`
    );
  }
});

test("stations are ordered and span the whole page", () => {
  assert.equal(STATIONS[0].at, 0, "the first station is the top of the page");
  assert.equal(STATIONS[STATIONS.length - 1].at, 1, "the last is the bottom");
  for (let i = 1; i < STATIONS.length; i++) {
    assert.ok(
      STATIONS[i].at > STATIONS[i - 1].at,
      `${STATIONS[i].name} must come after ${STATIONS[i - 1].name}`
    );
  }
});

test("progress outside 0-1 clamps to the end stations", () => {
  assert.deepEqual(poseAt(-3), poseAt(0));
  assert.deepEqual(poseAt(9), poseAt(1));
});

test("the camera moves continuously between stations", () => {
  let previous = poseAt(0).position;
  let biggestJump = 0;

  for (let p = 0.01; p <= 1; p += 0.01) {
    const current = poseAt(p).position;
    const jump = Math.hypot(
      current[0] - previous[0],
      current[1] - previous[1],
      current[2] - previous[2]
    );
    biggestJump = Math.max(biggestJump, jump);
    previous = current;
  }

  // A teleport between frames would read as a glitch, not a fly-through.
  assert.ok(
    biggestJump < 1.2,
    `camera jumped ${biggestJump.toFixed(2)} units in one step`
  );
});

test("scroll progress maps the document to 0-1", () => {
  assert.equal(scrollProgress(0, 4000, 1000), 0);
  assert.equal(scrollProgress(3000, 4000, 1000), 1);
  assert.equal(scrollProgress(1500, 4000, 1000), 0.5);
});

test("a page too short to scroll sits at the first station", () => {
  assert.equal(scrollProgress(0, 800, 1000), 0);
  assert.equal(scrollProgress(50, 800, 1000), 0);
});
