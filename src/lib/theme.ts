import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";

const THEME_EVENT = "themechange";

/** Intersecting keeps us compatible with lib.dom's own typing when it has one. */
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* storage can be blocked; the class alone still themes the page */
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

/**
 * The single entry point for theme changes (navbar toggle, command palette,
 * `theme` command). Pass the click origin for the circular reveal.
 */
export function setTheme(theme: Theme, origin?: { x: number; y: number }) {
  const doc = document as ViewTransitionDocument;

  if (!doc.startViewTransition || !origin || prefersReducedMotion()) {
    applyTheme(theme);
    return;
  }

  const transition = doc.startViewTransition(() => {
    // Flush so the class and any subscribed React state land in the same frame
    // the transition snapshots.
    flushSync(() => applyTheme(theme));
  });

  transition.ready
    .then(() => {
      const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y)
      );
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: 480,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {
      /* transition was skipped; the theme is already applied */
    });
}

export function toggleTheme(origin?: { x: number; y: number }) {
  setTheme(getTheme() === "dark" ? "light" : "dark", origin);
}

/** Reads the live theme and re-renders on any change, whatever triggered it. */
export function useTheme(): Theme {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document === "undefined" ? "dark" : getTheme()
  );

  useEffect(() => {
    setThemeState(getTheme());
    const onChange = (e: Event) =>
      setThemeState((e as CustomEvent<Theme>).detail);
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  return theme;
}
