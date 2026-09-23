import React, { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface SectionHeadingProps {
  /** Path shown after the prompt, e.g. "~/experience". */
  path: string;
  /** Accessible heading text, e.g. "Experience". */
  label: string;
  className?: string;
}

const TYPE_DURATION = 400;

/**
 * Section headings read as shell prompts and type themselves out once, the
 * first time they scroll into view.
 */
const SectionHeading: React.FC<SectionHeadingProps> = ({
  path,
  label,
  className = "",
}) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const [typed, setTyped] = useState(() => (reducedMotion ? path.length : 0));

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setTyped(path.length);
      return;
    }

    const step = Math.max(16, TYPE_DURATION / path.length);
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setTyped(count);
      if (count >= path.length) clearInterval(id);
    }, step);

    return () => clearInterval(id);
  }, [inView, path.length, reducedMotion]);

  return (
    <h2
      ref={ref}
      className={`font-mono text-lg tracking-tight sm:text-xl md:text-2xl ${className}`}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        <span className="text-amber">raj@portfolio</span>
        <span className="text-mute">:</span>
        <span className="text-blue">{path.slice(0, typed)}</span>
        <span className="text-mute">$</span>
        {typed < path.length && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-amber align-middle" />
        )}
      </span>
    </h2>
  );
};

export default SectionHeading;
