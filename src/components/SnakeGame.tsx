import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  COLS,
  ROWS,
  createGame,
  readHighScore,
  step,
  tickDelay,
  turn,
  writeHighScore,
  type Direction,
  type SnakeState,
} from "@/lib/snake";

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

/** One row of the board as coloured cells. */
const Row: React.FC<{ y: number; game: SnakeState }> = ({ y, game }) => {
  const head = game.snake[0];
  const cells = [];

  for (let x = 0; x < COLS; x++) {
    let char = "·"; // faint dot for empty space
    let className = "text-line";

    if (game.food.x === x && game.food.y === y) {
      char = "◈";
      className = "text-amber";
    }
    if (game.snake.some((p, i) => i > 0 && p.x === x && p.y === y)) {
      char = "█";
      className = "text-green";
    }
    if (head.x === x && head.y === y) {
      char = "█";
      className = game.status === "over" ? "text-red" : "text-blue";
    }

    cells.push(
      <span key={x} className={className}>
        {char}
      </span>
    );
  }

  return <div className="flex">{cells}</div>;
};

const DPadButton: React.FC<{
  label: string;
  onPress: () => void;
  className?: string;
}> = ({ label, onPress, className = "" }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onPress}
    className={`h-10 w-10 rounded-md border border-line text-mute active:bg-blue/20 ${className}`}
  >
    {label === "up" ? "↑" : label === "down" ? "↓" : label === "left" ? "←" : "→"}
  </button>
);

interface SnakeGameProps {
  onQuit: (score: number) => void;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ onQuit }) => {
  const [game, setGame] = useState<SnakeState>(() => createGame());
  const [highScore, setHighScore] = useState(0);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => setHighScore(readHighScore()), []);

  const quit = useCallback(() => {
    writeHighScore(gameRef.current.score);
    onQuit(gameRef.current.score);
  }, [onQuit]);

  const restart = useCallback(() => {
    writeHighScore(gameRef.current.score);
    setHighScore(readHighScore());
    setGame(createGame());
  }, []);

  const steer = useCallback((direction: Direction) => {
    setGame((prev) => turn(prev, direction));
  }, []);

  // The game owns the keyboard while it runs, so the prompt never sees these.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q" || e.key === "Escape") {
        e.preventDefault();
        quit();
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        restart();
        return;
      }
      const direction = KEY_DIRECTIONS[e.key];
      if (direction) {
        e.preventDefault();
        steer(direction);
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [quit, restart, steer]);

  // Clock. Re-created whenever the speed changes so it stays in step.
  useEffect(() => {
    if (game.status !== "running") {
      writeHighScore(game.score);
      setHighScore(readHighScore());
      return;
    }
    const id = setInterval(
      () => setGame((prev) => step(prev)),
      tickDelay(game.score)
    );
    return () => clearInterval(id);
  }, [game.status, game.score]);

  return (
    <div className="mb-4">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-mute">
          score <span className="text-fog">{game.score}</span>
        </span>
        <span className="text-mute">
          best <span className="text-fog">{Math.max(highScore, game.score)}</span>
        </span>
        <span className="text-mute">
          length <span className="text-fog">{game.snake.length}</span>
        </span>
      </div>

      {/* The board is decorative for screen readers; the status line below
          carries the state in words. */}
      <div
        aria-hidden="true"
        className="inline-block select-none rounded border border-line bg-ink p-2 leading-none tracking-[0.12em]"
      >
        {Array.from({ length: ROWS }, (_, y) => (
          <Row key={y} y={y} game={game} />
        ))}
      </div>

      <div aria-live="polite" className="sr-only">
        {game.status === "over"
          ? `Game over. Final score ${game.score}.`
          : `Score ${game.score}.`}
      </div>

      {game.status === "over" ? (
        <div className="mt-2 text-sm">
          <p className="text-red">Game over — score {game.score}</p>
          <p className="text-mute">
            press <span className="text-fog">r</span> to play again,{" "}
            <span className="text-fog">q</span> to return to the prompt
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-mute">
          arrows or <span className="text-fog">wasd</span> to steer ·{" "}
          <span className="text-fog">r</span> restart ·{" "}
          <span className="text-fog">q</span> quit
        </p>
      )}

      {/* Touch controls: there are no arrow keys on a phone. */}
      <div className="mt-3 grid w-32 grid-cols-3 gap-1 sm:hidden">
        <span />
        <DPadButton label="up" onPress={() => steer("up")} />
        <span />
        <DPadButton label="left" onPress={() => steer("left")} />
        <button
          type="button"
          onClick={game.status === "over" ? restart : quit}
          className="h-10 w-10 rounded-md border border-line text-[0.6rem] text-mute"
        >
          {game.status === "over" ? "r" : "q"}
        </button>
        <DPadButton label="right" onPress={() => steer("right")} />
        <span />
        <DPadButton label="down" onPress={() => steer("down")} />
        <span />
      </div>
    </div>
  );
};

export default SnakeGame;
