import { useEffect, useState } from "react";

/** Live match for a media query, SSR-safe and cleaned up on unmount. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True only for real pointers: mouse, trackpad, stylus. */
export function useFinePointer(): boolean {
  return useMediaQuery("(pointer: fine)");
}
