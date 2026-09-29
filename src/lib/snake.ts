/**
 * Snake, as pure state transitions. The component owns the clock and the
 * keyboard; everything that decides what happens lives here so it can be
 * tested without a DOM.
 */

export const COLS = 28;
export const ROWS = 16;

export type Direction = "up" | "down" | "left" | "right";

export interface Point {
  x: number;
  y: number;
}

export interface SnakeState {
  /** Head first. */
  snake: Point[];
  direction: Direction;
  food: Point;
  score: number;
  status: "running" | "over";
  /** Set on the tick the snake eats, so the UI can react. */
  justAte: boolean;
}

const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export type Rng = () => number;

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

/** Picks a cell the snake is not occupying, so food is always reachable. */
export function placeFood(snake: Point[], rng: Rng = Math.random): Point {
  const taken = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }

  // A full board has no free cell; the caller treats that as a win.
  if (!free.length) return snake[0];
  return free[Math.floor(rng() * free.length)];
}

export function createGame(rng: Rng = Math.random): SnakeState {
  const startY = Math.floor(ROWS / 2);
  const snake = [
    { x: 6, y: startY },
    { x: 5, y: startY },
    { x: 4, y: startY },
  ];

  return {
    snake,
    direction: "right",
    food: placeFood(snake, rng),
    score: 0,
    status: "running",
    justAte: false,
  };
}

/**
 * Queues a turn. A 180° reversal is ignored: in a classic snake that is an
 * instant self-collision, which always reads as a bug to the player.
 */
export function turn(state: SnakeState, direction: Direction): SnakeState {
  if (state.status !== "running") return state;
  if (direction === OPPOSITES[state.direction]) return state;
  if (direction === state.direction) return state;
  return { ...state, direction };
}

export function step(state: SnakeState, rng: Rng = Math.random): SnakeState {
  if (state.status !== "running") return state;

  const vector = VECTORS[state.direction];
  const head = {
    x: state.snake[0].x + vector.x,
    y: state.snake[0].y + vector.y,
  };

  const hitWall =
    head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
  if (hitWall) return { ...state, status: "over", justAte: false };

  const eating = samePoint(head, state.food);

  // The tail cell frees up as the snake moves, so following it is legal —
  // unless the snake just grew into it.
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((part) => samePoint(part, head))) {
    return { ...state, status: "over", justAte: false };
  }

  const snake = [head, ...body];

  return {
    snake,
    direction: state.direction,
    food: eating ? placeFood(snake, rng) : state.food,
    score: eating ? state.score + 10 : state.score,
    status: "running",
    justAte: eating,
  };
}

/** Speeds up as the snake grows, with a floor so it stays playable. */
export function tickDelay(score: number): number {
  return Math.max(70, 130 - Math.floor(score / 50) * 10);
}

const HIGH_SCORE_KEY = "snake-high-score";

export function readHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function writeHighScore(score: number): void {
  try {
    if (score > readHighScore()) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    }
  } catch {
    /* storage can be blocked; the score just does not persist */
  }
}
