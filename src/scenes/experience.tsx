import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/SectionHeading";
import {
  experienceData,
  statusOf,
  type ExperienceEntry,
  type Status,
} from "@/lib/experience";
import { projects } from "@/lib/projects";
import {
  buildCareerGraph,
  formatDate,
  type GraphNode,
  type ProjectInput,
  type RoleInput,
} from "@/lib/career-graph";
import { useFinePointer } from "@/lib/useMediaQuery";

const ROW_HEIGHT = 34;
const LANE_WIDTH = 18;
const GRAPH_LEFT = 12;

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

const laneX = (lane: number) => GRAPH_LEFT + lane * LANE_WIDTH;
const rowY = (row: number) => row * ROW_HEIGHT + ROW_HEIGHT / 2;

/**
 * The rails behind the commits: the trunk, and a curved branch per project
 * that leaves main where the work started and rejoins where it finished.
 */
const GraphRails: React.FC<{
  graph: ReturnType<typeof buildCareerGraph>;
  activeId: string | null;
}> = ({ graph, activeId }) => {
  const height = graph.rows.length * ROW_HEIGHT;
  const width = laneX(graph.laneCount) + 8;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      className="shrink-0"
      style={{ minWidth: width }}
    >
      {/* main */}
      <line
        x1={laneX(0)}
        y1={rowY(0)}
        x2={laneX(0)}
        y2={rowY(graph.rows.length - 1)}
        stroke="var(--line)"
        strokeWidth={1.5}
      />

      {graph.branches.map((branch) => {
        const x = laneX(branch.lane);
        const top = rowY(branch.fromRow);
        const bottom = rowY(branch.toRow);
        const active = activeId === branch.id;
        const stroke = active ? "var(--violet)" : "var(--line)";

        // Diverge from main at the bottom, and merge back at the top unless
        // the work is still going.
        const d = [
          `M ${laneX(0)} ${bottom}`,
          `C ${x} ${bottom}, ${x} ${bottom - ROW_HEIGHT / 2}, ${x} ${bottom - ROW_HEIGHT / 2}`,
          `L ${x} ${top + (branch.open ? 0 : ROW_HEIGHT / 2)}`,
          branch.open
            ? ""
            : `C ${x} ${top}, ${laneX(0)} ${top}, ${laneX(0)} ${top}`,
        ].join(" ");

        return (
          <g key={branch.id}>
            <path
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={active ? 2 : 1.5}
              strokeDasharray={branch.open ? "3 3" : undefined}
            />
            {branch.open && (
              // An unmerged tip, the way git draws a branch that is still open.
              <circle cx={x} cy={top - 4} r={2} fill="var(--violet)" />
            )}
          </g>
        );
      })}

      {graph.rows.map((node, i) => {
        const active = activeId === node.id;
        const isRole = node.kind === "role";
        return (
          <circle
            key={node.id}
            cx={laneX(node.lane)}
            cy={rowY(i)}
            r={active ? 6 : isRole ? 5 : 4}
            fill={active ? "var(--amber)" : "var(--ink)"}
            stroke={
              active
                ? "var(--amber)"
                : isRole
                  ? "var(--blue)"
                  : "var(--violet)"
            }
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
};

const CommitDetail: React.FC<{
  node: GraphNode;
  entry?: ExperienceEntry;
}> = ({ node, entry }) => {
  const project = projects.find((p) => p.id === node.sourceId);
  const status = entry ? statusOf(entry) : null;
  const bullets = entry?.bullets ?? project?.bullets ?? [];
  const tags = entry?.tags ?? project?.tags ?? [];

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rounded-lg border border-line bg-ink/60 p-4">
        <p className="mb-3 font-mono text-[0.7rem] text-mute">
          <span className="text-mute">$ git show </span>
          <span className="text-amber">{node.hash}</span>
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="font-mono text-sm text-fog">{node.subtitle}</h3>
          {status && <StatusBadge status={status} />}
          {node.kind === "project" && (
            <span className="rounded-full border border-violet/40 px-2 py-0.5 font-mono text-[0.7rem] text-violet">
              branch
            </span>
          )}
        </div>

        <p className="mb-3 font-mono text-xs text-blue">
          {node.label}
          {entry?.location ? (
            <span className="text-mute"> · {entry.location}</span>
          ) : null}
          {entry?.dates ? <span className="text-mute"> · {entry.dates}</span> : null}
          {project?.period ? (
            <span className="text-mute"> · {project.period}</span>
          ) : null}
        </p>

        {entry?.metrics && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {entry.metrics.map((metric) => (
              <li
                key={metric}
                className="rounded-md border border-green/30 bg-green/5 px-2 py-1 font-mono text-[0.7rem] text-green"
              >
                {metric}
              </li>
            ))}
          </ul>
        )}

        {bullets.length > 0 ? (
          <ul className="mb-3 max-w-[72ch] space-y-2">
            {bullets.map((bullet) => (
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
          entry?.story && (
            <p className="mb-3 max-w-[72ch] font-sans text-sm leading-relaxed text-fog/90">
              {entry.story}
            </p>
          )
        )}

        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded border border-line px-2 py-0.5 font-mono text-[0.7rem] text-mute"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

const Experience: React.FC = () => {
  const finePointer = useFinePointer();
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const graph = useMemo(() => {
    const roles: RoleInput[] = experienceData
      .filter((entry) => entry.company !== "?")
      .map((entry) => ({
        id: `${entry.company}-${entry.year}`,
        company: entry.company,
        title: entry.title,
        start: entry.start ?? null,
        year: Math.floor(entry.year),
      }));

    const projectInputs: ProjectInput[] = projects.map((project) => ({
      id: project.id,
      title: project.title,
      period: project.period,
      tags: project.tags,
    }));

    return buildCareerGraph(roles, projectInputs);
  }, []);

  const entryFor = (node: GraphNode) =>
    node.kind === "role"
      ? experienceData.find((e) => `${e.company}-${e.year}` === node.sourceId)
      : undefined;

  const active = hoveredId ?? openId;
  const selected =
    graph.rows.find((row) => row.id === openId) ??
    graph.rows.find((row) => row.ref) ??
    graph.rows[0];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-8 flex justify-center">
        <SectionHeading path="~/experience" label="Experience" />
      </div>

      <div className="rounded-2xl border border-line bg-surface/85 p-4 backdrop-blur-md sm:p-6 lg:p-8">
        <p className="mb-4 font-mono text-xs text-mute">
          <span className="text-amber">raj@portfolio</span>
          <span className="text-mute">:</span>
          <span className="text-blue">~</span>
          <span className="text-mute">$ git log --graph --all</span>
        </p>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="flex gap-3 overflow-x-auto">
          <GraphRails graph={graph} activeId={active} />

          <ol className="min-w-0 flex-1">
            {graph.rows.map((node) => {
              const entry = entryFor(node);
              const status = entry ? statusOf(entry) : null;
              const isOpen = openId === node.id;
              const dimmed =
                finePointer && hoveredId !== null && hoveredId !== node.id;

              return (
                <li
                  key={node.id}
                  style={{ height: ROW_HEIGHT }}
                  className="flex items-center"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(node.id)}
                    onBlur={() => setHoveredId(null)}
                    aria-current={isOpen ? "true" : undefined}
                    className={`flex w-full items-baseline gap-2 rounded px-1 text-left font-mono text-xs transition-opacity duration-200 sm:gap-3 ${
                      dimmed ? "opacity-50" : "opacity-100"
                    } ${isOpen ? "bg-blue/10" : ""}`}
                  >
                    <span className="shrink-0 text-amber/80">{node.hash}</span>
                    <span className="hidden shrink-0 text-mute sm:inline">
                      {formatDate(node.date)}
                    </span>
                    {node.ref && (
                      <span className="shrink-0 rounded border border-amber/40 px-1 text-[0.65rem] text-amber">
                        {node.ref}
                      </span>
                    )}
                    <span className="truncate text-fog">
                      {node.kind === "project" ? (
                        <span className="text-violet">feat: </span>
                      ) : null}
                      {node.label}
                    </span>
                    {status === "Current" && (
                      <span className="shrink-0 text-green">●</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* git show, for whichever commit is selected. */}
        <div className="mt-6 lg:mt-0">
          <AnimatePresence mode="wait" initial={false}>
            {selected && (
              <CommitDetail
                key={selected.id}
                node={selected}
                entry={entryFor(selected)}
              />
            )}
          </AnimatePresence>
        </div>

        </div>

        <p className="mt-4 font-mono text-[0.7rem] text-mute">
          {graph.rows.length} commits · select one to see it ·{" "}
          <span className="text-violet">violet</span> branches are projects
        </p>
      </div>
    </div>
  );
};

export default Experience;
