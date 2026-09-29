import React, { useEffect, useRef, useState } from "react";
import {
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Terminal from "@/components/Terminal";
import LinuxHintsCard from "@/components/LinuxHintsCard";
import { SITE } from "@/lib/site";
import { currentRole, statusOf, upcomingRole } from "@/lib/experience";

interface Letter {
  char: string;
  id: number;
  isNew: boolean;
}

const nameVariants: string[] = [
  "raj",
  "rajrathod",
  "developer",
  "ai engineer",
  "full stack",
  "raj rathod",
];

/**
 * Diffs the current letters against the next name with an LCS so shared
 * letters keep their identity (and slide) while only new ones pop in.
 */
function diffAssign(
  prev: Letter[],
  nextStr: string,
  idCounter: React.RefObject<number>
): Letter[] {
  const m = prev.length;
  const n = nextStr.length;

  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        prev[i - 1].char === nextStr[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matches: { prevIndex: number; newIndex: number }[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (prev[i - 1].char === nextStr[j - 1]) {
      matches.unshift({ prevIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const result: Letter[] = [];
  const matchedNew = new Set(matches.map((m) => m.newIndex));

  let matchIdx = 0;
  for (let k = 0; k < n; k++) {
    if (matchedNew.has(k)) {
      const pIdx = matches[matchIdx].prevIndex;
      result.push({ ...prev[pIdx], char: nextStr[k] });
      matchIdx++;
    } else {
      result.push({ char: nextStr[k], id: idCounter.current++, isNew: true });
    }
  }

  return result;
}

const StatusPill: React.FC = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-mute">
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-green opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
    </span>
    {SITE.status}
  </div>
);

const Hero: React.FC = () => {
  const reducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (reducedMotion) return;
    const { currentTarget, clientX, clientY } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - (left + width / 2));
    y.set(clientY - (top + height / 2));
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Restrained tilt: enough to feel physical, not enough to distort text.
  const rotateX = useTransform(mouseY, [-300, 300], [4, -4]);
  const rotateY = useTransform(mouseX, [-300, 300], [-4, 4]);

  const [step, setStep] = useState(0);
  const [letters, setLetters] = useState<Letter[]>(
    nameVariants[0].split("").map((c, i) => ({ char: c, id: i, isNew: false }))
  );
  const idCounter = useRef(letters.length);

  useEffect(() => {
    const iv = setInterval(
      () => setStep((s) => (s + 1) % nameVariants.length),
      1500
    );
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setLetters((prev) => diffAssign(prev, nameVariants[step], idCounter));
  }, [step]);

  const current = currentRole();
  const next = upcomingRole();
  const currentIsActive = current ? statusOf(current) === "Current" : false;

  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex w-full min-w-0 justify-center"
        style={{ perspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          style={
            reducedMotion
              ? undefined
              : { rotateX, rotateY, transformStyle: "preserve-3d" }
          }
          className="w-full overflow-hidden rounded-xl border border-line bg-surface/90 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.08),0_12px_32px_-12px_rgba(0,0,0,0.35)]"
        >
          {/* Title bar */}
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green/70" />
            </div>
            <div className="flex items-center font-mono text-xs text-mute">
              <LayoutGroup>
                <motion.div layout className="inline-flex lowercase">
                  {letters.map(({ char, id, isNew }) => {
                    const currentName = nameVariants[step];
                    const colorClass =
                      currentName === "raj rathod" || isNew
                        ? "text-amber"
                        : "text-fog";
                    return (
                      <motion.span key={id} layout className={colorClass}>
                        {char}
                      </motion.span>
                    );
                  })}
                </motion.div>
              </LayoutGroup>
              <span className="text-mute">@portfolio:~</span>
            </div>
            <div className="w-12" />
          </div>

          {/* Terminal body */}
          <div className="px-5 py-5 font-mono text-sm sm:px-8 sm:py-7 md:text-[0.95rem]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mb-4"
            >
              <span className="text-amber">raj@portfolio</span>
              <span className="text-mute">:</span>
              <span className="text-blue">~</span>
              <span className="text-mute">$ whoami</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="mb-6"
            >
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-fog md:text-4xl">
                {SITE.name}
              </h1>
              <p className="mt-1 font-mono text-xs text-mute md:text-sm">
                {SITE.role}
                {current
                  ? ` · ${currentIsActive ? "currently" : "most recently"} at ${
                      current.company
                    }`
                  : ""}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.4 }}
              className="mb-4"
            >
              <span className="text-amber">raj@portfolio</span>
              <span className="text-mute">:</span>
              <span className="text-blue">~</span>
              <span className="text-mute">$ cat about.txt</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.4 }}
              className="mb-6 max-w-[68ch] font-sans text-[0.95rem] leading-relaxed text-fog/90 md:text-base"
            >
              <p className="mb-3">
                Hi, I'm <span className="font-semibold text-amber">Raj Rathod</span>, a{" "}
                <span className="font-semibold text-blue">Computer Science</span>{" "}
                student at the University of Manitoba. I'm passionate about
                building scalable, reliable systems and working with
                cutting-edge AI/ML technologies to solve real-world problems.
              </p>
              <p className="mb-3">
                From training AI models at Outlier to building production
                services at Proofpoint, Ericsson, and Citi, I focus on writing
                clean, maintainable code while implementing robust CI/CD
                pipelines and automated testing frameworks.
                {next ? ` Joining ${next.company} in ${next.dates}.` : ""}
              </p>
              <p className="mb-3">
                Beyond coding, I lead hackathons at UM DevClub, mentor junior
                developers, and constantly explore emerging technologies to stay
                at the forefront of innovation.
              </p>
              <p>Let's build something amazing together!</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.3, duration: 0.4 }}
              className="mb-6"
            >
              <StatusPill />
            </motion.div>

            <Terminal />
          </div>
        </motion.div>
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.6, duration: 0.5 }}
        className="w-full lg:sticky lg:top-20"
      >
        <LinuxHintsCard />
      </motion.aside>
    </div>
  );
};

export default Hero;
