import assert from "node:assert/strict";
import test from "node:test";
import {
  COLS,
  ROWS,
  createGame,
  placeFood,
  step,
  tickDelay,
  turn,
  type SnakeState,
} from "./snake.ts";

/** Deterministic rng so food placement is predictable in tests. */
const fixedRng = (value: number) => () => value;

function gameWith(overrides: Partial<SnakeState>): SnakeState {
  return { ...createGame(fixedRng(0)), ...overrides };
}

test("the snake moves in its current direction", () => {
  const game = gameWith({
    snake: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ],
    direction: "right",
    food: { x: 20, y: 1 },
  });
  const next = step(game, fixedRng(0));
  assert.deepEqual(next.snake[0], { x: 6, y: 5 });
  assert.equal(next.snake.length, 2, "length is unchanged without food");
});

test("eating food grows the snake and scores", () => {
  const game = gameWith({
    snake: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ],
    direction: "right",
    food: { x: 6, y: 5 },
    score: 0,
  });
  const next = step(game, fixedRng(0));
  assert.equal(next.snake.length, 3, "grew by one");
  assert.equal(next.score, 10);
  assert.equal(next.justAte, true);
});

test("hitting a wall ends the game", () => {
  for (const [direction, snake] of [
    ["right", [{ x: COLS - 1, y: 5 }]],
    ["left", [{ x: 0, y: 5 }]],
    ["up", [{ x: 5, y: 0 }]],
    ["down", [{ x: 5, y: ROWS - 1 }]],
  ] as const) {
    const next = step(gameWith({ snake: [...snake], direction }), fixedRng(0));
    assert.equal(next.status, "over", `${direction} into the wall should end it`);
  }
});

test("running into your own body ends the game", () => {
  // Doubled back on itself: turning down drives the head into the segment
  // below, which is mid-body rather than the tail, so it does not move away.
  const game = gameWith({
    snake: [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 7, y: 6 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ],
    direction: "down",
    food: { x: 20, y: 1 },
  });
  assert.equal(step(game, fixedRng(0)).status, "over");
});

test("following your own tail is allowed, since it moves away", () => {
  const game = gameWith({
    snake: [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ],
    direction: "right",
    food: { x: 20, y: 1 },
  });
  assert.equal(step(game, fixedRng(0)).status, "running");
});

test("a 180 degree turn is ignored", () => {
  const game = gameWith({ direction: "right" });
  assert.equal(turn(game, "left").direction, "right");
  assert.equal(turn(game, "up").direction, "up");
});

test("food never spawns on the snake", () => {
  const snake = Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0 }));
  for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
    const food = placeFood(snake, fixedRng(r));
    assert.ok(
      !snake.some((p) => p.x === food.x && p.y === food.y),
      `food at ${food.x},${food.y} landed on the snake`
    );
    assert.ok(food.x >= 0 && food.x < COLS && food.y >= 0 && food.y < ROWS);
  }
});

test("a finished game ignores further input", () => {
  const over = gameWith({ status: "over" });
  assert.equal(step(over, fixedRng(0)), over);
  assert.equal(turn(over, "up"), over);
});

test("the game speeds up but stays playable", () => {
  assert.ok(tickDelay(0) > tickDelay(200), "higher scores tick faster");
  assert.ok(tickDelay(100000) >= 70, "never faster than the floor");
});
