import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import Neko from "./Neko";
import { useMediaQuery, useFinePointer } from "@/lib/useMediaQuery";

/**
 * Custom cursor plus the Neko follower. Both are pointer-only decoration, so
 * touch devices keep the native cursor and skip the cat entirely.
 */
const CreativeAdditions: React.FC = () => {
  const finePointer = useFinePointer();
  const wideEnoughForNeko = useMediaQuery("(min-width: 850px)");
  const reducedMotion = useReducedMotion();

  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Under reduced motion the follower tracks exactly instead of lagging.
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const followerX = reducedMotion ? mouseX : springX;
  const followerY = reducedMotion ? mouseY : springY;

  useEffect(() => {
    if (!finePointer) return;

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button");

      setIsHovered(!!isClickable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [finePointer, mouseX, mouseY]);

  if (!finePointer) return null;

  return (
    <>
      {wideEnoughForNeko && !reducedMotion && <Neko />}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[10000]"
      >
        {/* Ring that widens over anything clickable */}
        <motion.div
          className="absolute rounded-full border border-amber"
          style={{
            x: followerX,
            y: followerY,
            translateX: "-50%",
            translateY: "-50%",
            width: isHovered ? 34 : 22,
            height: isHovered ? 34 : 22,
            opacity: 0.7,
          }}
        />

        {/* Solid centre dot */}
        <motion.div
          className="absolute rounded-full bg-amber"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: "-50%",
            translateY: "-50%",
            width: 6,
            height: 6,
            scale: isClicking ? 0.6 : 1,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        />
      </div>
    </>
  );
};

export default CreativeAdditions;
