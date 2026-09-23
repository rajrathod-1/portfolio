import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Shape {
  x: string;
  y: string;
  size: number;
  duration: number;
  delay: number;
}

/** Thin wireframe cube: six faces, no fill. */
const Cube: React.FC<{ size: number }> = ({ size }) => {
  const half = size / 2;
  const faceStyle: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    border: "1px solid var(--line)",
  };

  return (
    <>
      <div style={{ ...faceStyle, transform: `translateZ(${half}px)` }} />
      <div
        style={{
          ...faceStyle,
          transform: `rotateY(180deg) translateZ(${half}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          transform: `rotateY(90deg) translateZ(${half}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          transform: `rotateY(-90deg) translateZ(${half}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          transform: `rotateX(90deg) translateZ(${half}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          transform: `rotateX(-90deg) translateZ(${half}px)`,
        }}
      />
    </>
  );
};

const SHAPES: Shape[] = [
  { x: "8%", y: "22%", size: 56, duration: 48, delay: 0 },
  { x: "86%", y: "16%", size: 72, duration: 60, delay: 2 },
  { x: "78%", y: "78%", size: 44, duration: 54, delay: 1 },
];

/** Quiet background texture. Sits still entirely under reduced motion. */
const FloatingShapes: React.FC = () => {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-40"
    >
      {SHAPES.map((shape, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
          animate={
            reducedMotion
              ? undefined
              : { rotateX: [0, 360], rotateY: [0, 360], y: [0, -20, 0] }
          }
          transition={{
            rotateX: { duration: shape.duration, repeat: Infinity, ease: "linear" },
            rotateY: {
              duration: shape.duration * 1.3,
              repeat: Infinity,
              ease: "linear",
            },
            y: {
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shape.delay,
            },
          }}
        >
          <Cube size={shape.size} />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingShapes;
