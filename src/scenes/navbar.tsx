import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { openCommandPalette, paletteShortcutLabel } from "@/lib/events";
import { toggleTheme, useTheme } from "@/lib/theme";
import { SITE } from "@/lib/site";

const SECTIONS = [
  { id: "home", label: "Home", path: "~" },
  { id: "experience", label: "Experience", path: "~/experience" },
  { id: "projects", label: "Projects", path: "~/projects" },
  { id: "connect", label: "Connect", path: "~/connect" },
];

const TerminalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h16v3H4V6zm0 5h16v7H4v-7zm2 2v1h2v-1H6zm4 0v1h6v-1h-6z" />
    <path d="M6 8.5l1.5 1L6 10.5V8.5z" />
  </svg>
);

/** Ticks on the minute boundary instead of drifting by a fixed interval. */
function useClock(): Date {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    let timeout: number;

    const schedule = () => {
      const now = new Date();
      const msToNextMinute =
        60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
      timeout = window.setTimeout(() => {
        setTime(new Date());
        schedule();
      }, msToNextMinute);
    };

    schedule();
    return () => window.clearTimeout(timeout);
  }, []);

  return time;
}

const Navbar: React.FC = () => {
  const [currentSection, setCurrentSection] = useState("home");
  const theme = useTheme();
  const isDark = theme === "dark";
  const time = useClock();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const { id } of SECTIONS) {
        const element = document.getElementById(id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setCurrentSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    document
      .querySelector(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const path =
    SECTIONS.find((section) => section.id === currentSection)?.path ?? "~";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, "#home")}
            className="rounded p-1.5 text-mute transition-colors hover:text-fog"
            aria-label="Back to top"
          >
            <TerminalIcon className="h-4 w-4" />
          </a>
          <span className="truncate font-mono text-xs">
            <span className="text-amber">raj@portfolio</span>
            <span className="text-mute">:</span>
            <span className="text-blue">{path}</span>
            <span className="text-mute">$</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {SECTIONS.slice(1).map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => handleLinkClick(e, `#${id}`)}
                aria-current={currentSection === id ? "true" : undefined}
                className={`rounded px-2 py-1 font-mono text-xs transition-colors hover:text-fog ${
                  currentSection === id ? "text-fog" : "text-mute"
                }`}
              >
                {label.toLowerCase()}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-2 py-1 font-mono text-xs text-mute transition-colors hover:text-fog"
            >
              github
            </a>
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-2 py-1 font-mono text-xs text-mute transition-colors hover:text-fog"
            >
              linkedin
            </a>
            <a
              href={SITE.leetcode}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-2 py-1 font-mono text-xs text-mute transition-colors hover:text-fog"
            >
              leetcode
            </a>
          </div>

          <button
            type="button"
            onClick={() => openCommandPalette()}
            className="ml-1 hidden items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[0.7rem] text-mute transition-colors hover:text-fog sm:flex"
            aria-label="Open command palette"
          >
            <span aria-hidden="true">{paletteShortcutLabel()}</span>
          </button>

          <button
            type="button"
            onClick={(e) =>
              toggleTheme({
                x: e.clientX,
                y: e.clientY,
              })
            }
            className="relative grid h-8 w-8 place-items-center rounded-md border border-line text-mute transition-colors hover:text-fog"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4 text-amber" aria-hidden="true" />
            )}
          </button>

          <time
            className="ml-1 hidden font-mono text-xs text-mute md:block"
            dateTime={time.toISOString()}
          >
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </div>

      {/* Scroll progress */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-amber"
      />
    </nav>
  );
};

export default Navbar;
