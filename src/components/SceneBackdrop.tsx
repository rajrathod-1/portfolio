import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { scrollProgress } from "@/lib/scroll-stations";

// three.js loads as its own chunk, and only where the scene will actually run.
const SceneCanvas = lazy(() => import("@/components/scene/SceneCanvas"));

/**
 * The 3D world behind the page. Content stays ordinary DOM on top of it, so
 * the terminal is still typeable and everything is still readable; this is
 * only atmosphere.
 *
 * Skipped entirely on small screens, coarse pointers and under reduced motion,
 * where a scroll-driven camera is the wrong thing to serve.
 */
const SceneBackdrop: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const wideEnough = useMediaQuery("(min-width: 1024px)");
  const finePointer = useMediaQuery("(pointer: fine)");
  const enabled = wideEnough && finePointer && !reducedMotion;

  const progress = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      progress.current = scrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Fade in after mount so the canvas does not pop in mid-paint.
    const id = window.setTimeout(() => setVisible(true), 80);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(id);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-1000 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Suspense fallback={null}>
        <SceneCanvas progress={progress} />
      </Suspense>
    </div>
  );
};

export default SceneBackdrop;
