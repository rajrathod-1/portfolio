import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import World from "@/components/scene/World";
import { useTheme } from "@/lib/theme";

/**
 * Hosts the canvas. Kept separate from the backdrop so the whole three.js
 * dependency sits behind one lazy boundary.
 */
const SceneCanvas: React.FC<{ progress: React.RefObject<number> }> = ({
  progress,
}) => {
  const theme = useTheme();
  const [hidden, setHidden] = useState(false);

  // Stop rendering when the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      // Remounting on a theme change is the simplest way to re-read the
      // palette tokens, and it happens at most once per toggle.
      key={theme}
      camera={{ position: [0, 1.8, 9.5], fov: 45 }}
      dpr={[1, 1.5]}
      frameloop={hidden ? "never" : "always"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <World progress={progress} />
    </Canvas>
  );
};

export default SceneCanvas;
