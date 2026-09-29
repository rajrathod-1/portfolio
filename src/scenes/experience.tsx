import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SectionHeading from "@/components/SectionHeading";
import {
  experienceData,
  statusOf,
  type ExperienceEntry,
  type Status,
} from "@/lib/experience";
import { useFinePointer } from "@/lib/useMediaQuery";
import { ACTIVE_BUMP, DOMAIN, MARGIN, badgeRadius } from "@/lib/chart";

const STATUS_CLASS: Record<Status, string> = {
  Current: "border-green/40 text-green",
  Upcoming: "border-violet/40 text-violet",
  Completed: "border-line text-mute",
};

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => (
  <span
    className={`rounded-full border px-2 py-0.5 font-mono text-[0.7rem] ${STATUS_CLASS[status]}`}
  >
    {status}
  </span>
);

/** Company logos sit on a light plate so every brand stays legible in both themes. */
const LogoBadge: React.FC<{
  cx: number;
  cy: number;
  entry: ExperienceEntry;
  active: boolean;
  radius: number;
  onSelect: () => void;
  onHover: (entry: ExperienceEntry | null) => void;
}> = ({ cx, cy, entry, active, radius, onSelect, onHover }) => {
  const r = active ? radius + ACTIVE_BUMP : radius;
  // Wordmarks are wider than they are tall, so the image box is a rectangle
  // rather than the inscribed square: it fills far more of the circle.
  const boxWidth = r * 1.55;
  const boxHeight = r * 1.15;

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={onSelect}
      onMouseEnter={() => onHover(entry)}
      onMouseLeave={() => onHover(null)}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="#ffffff"
        stroke={active ? "var(--amber)" : "var(--line)"}
        strokeWidth={active ? 2.5 : 1.5}
      />
      {entry.image ? (
        <image
          href={entry.image}
          x={cx - boxWidth / 2}
          y={cy - boxHeight / 2}
          width={boxWidth}
          height={boxHeight}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <text
          x={cx}
          y={cy + r * 0.35}
          textAnchor="middle"
          fontSize={r}
          fill="#5a6480"
          fontFamily="monospace"
        >
          ?
        </text>
      )}
    </g>
  );
};

interface TooltipPayload {
  payload: ExperienceEntry;
}

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayload[];
}> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-lg">
      <p className="font-mono text-xs text-amber">{entry.company}</p>
      <p className="font-mono text-xs text-fog">{entry.title}</p>
      {entry.dates && (
        <p className="font-mono text-[0.7rem] text-mute">{entry.dates}</p>
      )}
    </div>
  );
};

const Experience: React.FC = () => {
  const finePointer = useFinePointer();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const node = chartRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setChartWidth(entry.contentRect.width)
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const radius = badgeRadius(chartWidth);
  const [selectedYear, setSelectedYear] = useState<number>(
    // Open on whatever role is running now, else the newest finished one.
    () => {
      const active = experienceData.filter((e) => statusOf(e) === "Current");
      return (active.at(-1) ?? experienceData[experienceData.length - 2]).year;
    }
  );
  const [hovered, setHovered] = useState<ExperienceEntry | null>(null);

  const selected = useMemo(
    () =>
      experienceData.find((entry) => entry.year === selectedYear) ??
      experienceData[0],
    [selectedYear]
  );

  const ticks = [2021, 2022, 2023, 2024, 2025, 2026, 2027];
  const status = statusOf(selected);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-10 flex justify-center">
        <SectionHeading path="~/experience" label="Experience" />
      </div>

      <div className="rounded-2xl border border-line bg-surface/85 p-4 backdrop-blur-md sm:p-6 lg:p-8">
        {/* Chart: pointer-driven, and mirrored by the list below for keyboard
            and small screens. */}
        <div className="hidden sm:block" aria-hidden="true" ref={chartRef}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={experienceData}
              margin={MARGIN}
            >
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--blue)"
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--blue)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="var(--line)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                type="number"
                domain={DOMAIN}
                ticks={ticks}
                tickFormatter={(value: number) => String(Math.round(value))}
                stroke="var(--line)"
                tick={{ fill: "var(--mute)", fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 108]}
                hide
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--line)" }}
              />

              <Area
                type="monotone"
                dataKey="growth"
                stroke="var(--blue)"
                strokeWidth={2}
                fill="url(#growthFill)"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />

              <Scatter
                dataKey="growth"
                isAnimationActive={false}
                shape={(props: unknown) => {
                  const { cx, cy, payload } = props as {
                    cx: number;
                    cy: number;
                    payload: ExperienceEntry;
                  };
                  return (
                    <LogoBadge
                      cx={cx}
                      cy={cy}
                      entry={payload}
                      radius={radius}
                      active={payload.year === selected.year}
                      onSelect={() => setSelectedYear(payload.year)}
                      onHover={setHovered}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Entry list: the keyboard and small-screen path to the same data. */}
        <ul className="mt-2 divide-y divide-line sm:mt-6">
          {experienceData.map((entry) => {
            const isSelected = entry.year === selected.year;
            const dimmed =
              finePointer && hovered !== null && hovered.year !== entry.year;
            const entryStatus = statusOf(entry);

            return (
              <li key={entry.year}>
                <button
                  type="button"
                  onClick={() => setSelectedYear(entry.year)}
                  onMouseEnter={() => setHovered(entry)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(entry)}
                  onBlur={() => setHovered(null)}
                  aria-pressed={isSelected}
                  className={`flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md px-2 py-3 text-left transition-opacity duration-200 ${
                    dimmed ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <span
                    className={`font-mono text-xs ${
                      isSelected ? "text-amber" : "text-mute"
                    }`}
                  >
                    {entry.dates ?? Math.round(entry.year)}
                  </span>
                  <span
                    className={`font-mono text-sm ${
                      isSelected ? "text-fog" : "text-fog/80"
                    }`}
                  >
                    {entry.title}
                  </span>
                  <span className="font-mono text-sm text-blue">
                    {entry.company}
                  </span>
                  {entryStatus && <StatusBadge status={entryStatus} />}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Story card */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 overflow-hidden rounded-xl border border-line bg-ink p-5 sm:p-6"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected.year}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="mb-4 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-mono text-lg text-fog">
                      {selected.title}
                    </h3>
                    {status && <StatusBadge status={status} />}
                  </div>

                  <p className="font-mono text-sm text-blue">
                    {selected.company}
                    {selected.location ? (
                      <span className="text-mute"> · {selected.location}</span>
                    ) : null}
                    {selected.dates ? (
                      <span className="text-mute"> · {selected.dates}</span>
                    ) : null}
                  </p>
                </div>

                {/* The logo at a readable size: the chart badges are too small
                    to actually look at. White plate keeps every brand legible. */}
                {selected.image && (
                  <a
                    href={selected.link || undefined}
                    target={selected.link ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={selected.company}
                    className="flex h-20 w-40 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-3 transition-colors hover:border-amber"
                  >
                    <img
                      src={selected.image}
                      alt={`${selected.company} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </a>
                )}
              </div>

              {selected.metrics && (
                <ul className="mb-4 flex flex-wrap gap-2">
                  {selected.metrics.map((metric) => (
                    <li
                      key={metric}
                      className="rounded-md border border-green/30 bg-green/5 px-2 py-1 font-mono text-[0.7rem] text-green"
                    >
                      {metric}
                    </li>
                  ))}
                </ul>
              )}

              {selected.bullets ? (
                <ul className="mb-4 max-w-[72ch] space-y-2">
                  {selected.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 font-sans text-sm leading-relaxed text-fog/90"
                    >
                      <span aria-hidden="true" className="text-blue">
                        ▸
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 max-w-[72ch] font-sans text-sm leading-relaxed text-fog/90">
                  {selected.story}
                </p>
              )}

              {selected.tags && (
                <ul className="flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded border border-line px-2 py-0.5 font-mono text-[0.7rem] text-mute"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}

              {selected.link && (
                <a
                  href={selected.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block font-mono text-xs text-blue underline-offset-4 hover:underline"
                >
                  {selected.company} ↗
                </a>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Experience;
