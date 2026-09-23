/*
 * Neko: a React port of oneko.js by adryd — https://github.com/adryd325/oneko.js
 * The sprite sheet (public/oneko.gif) and the sprite/animation tables below are
 * taken from that project.
 *
 * Copyright © 2022 adryd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useEffect, useRef } from 'react';

const Neko: React.FC = () => {
  const nekoRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 32, y: 32 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const idleTimeRef = useRef(0);
  const idleAnimationRef = useRef<string | null>(null);
  const idleAnimationFrameRef = useRef(0);
  const lastFrameTimestampRef = useRef<number | null>(null);

  const nekoSpeed = 10;
  const spriteSets: { [key: string]: number[][] } = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('mousemove', handleMouseMove);

    const setSprite = (name: string, frame: number) => {
      if (!nekoRef.current) return;
      const sprite = spriteSets[name][frame % spriteSets[name].length];
      nekoRef.current.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    };

    const resetIdleAnimation = () => {
      idleAnimationRef.current = null;
      idleAnimationFrameRef.current = 0;
    };

    const idle = () => {
      idleTimeRef.current += 1;

      // every ~ 20 seconds
      if (
        idleTimeRef.current > 10 &&
        Math.floor(Math.random() * 200) === 0 &&
        idleAnimationRef.current === null
      ) {
        const availableIdleAnimations = ["sleeping", "scratchSelf"];
        if (posRef.current.x < 32) {
          availableIdleAnimations.push("scratchWallW");
        }
        if (posRef.current.y < 32) {
          availableIdleAnimations.push("scratchWallN");
        }
        if (posRef.current.x > window.innerWidth - 32) {
          availableIdleAnimations.push("scratchWallE");
        }
        if (posRef.current.y > window.innerHeight - 32) {
          availableIdleAnimations.push("scratchWallS");
        }
        idleAnimationRef.current =
          availableIdleAnimations[
            Math.floor(Math.random() * availableIdleAnimations.length)
          ];
      }

      switch (idleAnimationRef.current) {
        case "sleeping":
          if (idleAnimationFrameRef.current < 8) {
            setSprite("tired", 0);
            break;
          }
          setSprite("sleeping", Math.floor(idleAnimationFrameRef.current / 4));
          if (idleAnimationFrameRef.current > 192) {
            resetIdleAnimation();
          }
          break;
        case "scratchWallN":
        case "scratchWallS":
        case "scratchWallE":
        case "scratchWallW":
        case "scratchSelf":
          setSprite(idleAnimationRef.current, idleAnimationFrameRef.current);
          if (idleAnimationFrameRef.current > 9) {
            resetIdleAnimation();
          }
          break;
        default:
          setSprite("idle", 0);
          return;
      }
      idleAnimationFrameRef.current += 1;
    };

    const frame = () => {
      frameCountRef.current += 1;
      const diffX = posRef.current.x - mouseRef.current.x;
      const diffY = posRef.current.y - mouseRef.current.y;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      // Stop at the edge of the cursor circle (about 40px radius to account for gooey effect)
      const stopDistance = 50;

      if (distance < stopDistance) {
        idle();
        return;
      }

      idleAnimationRef.current = null;
      idleAnimationFrameRef.current = 0;

      if (idleTimeRef.current > 1) {
        setSprite("alert", 0);
        // count down after being alerted before moving
        idleTimeRef.current = Math.min(idleTimeRef.current, 7);
        idleTimeRef.current -= 1;
        return;
      }

      let direction = "";
      direction = diffY / distance > 0.5 ? "N" : "";
      direction += diffY / distance < -0.5 ? "S" : "";
      direction += diffX / distance > 0.5 ? "W" : "";
      direction += diffX / distance < -0.5 ? "E" : "";
      setSprite(direction, frameCountRef.current);

      posRef.current.x -= (diffX / distance) * nekoSpeed;
      posRef.current.y -= (diffY / distance) * nekoSpeed;

      posRef.current.x = Math.min(Math.max(16, posRef.current.x), window.innerWidth - 16);
      posRef.current.y = Math.min(Math.max(16, posRef.current.y), window.innerHeight - 16);

      if (nekoRef.current) {
        nekoRef.current.style.left = `${posRef.current.x - 16}px`;
        nekoRef.current.style.top = `${posRef.current.y - 16}px`;
      }
    };

    const onAnimationFrame = (timestamp: number) => {
      if (!lastFrameTimestampRef.current) {
        lastFrameTimestampRef.current = timestamp;
      }
      if (timestamp - lastFrameTimestampRef.current > 100) {
        lastFrameTimestampRef.current = timestamp;
        frame();
      }
      requestAnimationFrame(onAnimationFrame);
    };

    const animationId = requestAnimationFrame(onAnimationFrame);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Use a ref for frameCount to avoid closure staleness if we were using state, 
  // but here everything is in refs so it's fine.
  const frameCountRef = useRef(0);

  return (
    <div
      ref={nekoRef}
      style={{
        width: '32px',
        height: '32px',
        position: 'fixed',
        pointerEvents: 'none',
        imageRendering: 'pixelated',
        zIndex: 9999,
        backgroundImage: 'url("/oneko.gif")',
        transform: 'scale(1.25)',
        transformOrigin: 'center center',
      }}
    />
  );
};

export default Neko;
