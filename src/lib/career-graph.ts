/**
 * Builds a git-style commit graph from the career and project data: roles are
 * commits on main, projects are branches that diverge when they start and
 * merge back when they finish.
 *
 * Pure: the component only draws what this returns.
 */

export interface YearMonth {
  year: number;
  month: number;
}

/** Only what the graph needs; the caller keeps the full records. */
export interface RoleInput {
  id: string;
  company: string;
  title: string;
  /** Undated entries (the degree itself) fall back to `year`. */
  start?: { year: number; month: number } | null;
  year: number;
}

export interface ProjectInput {
  id: string;
  title: string;
  /** e.g. "Sep 2026 - Present". */
  period: string;
  tags: string[];
}

export interface GraphNode {
  id: string;
  /** The id of the role or project this came from. */
  sourceId: string;
  kind: "role" | "project";
  /** 0 is main; projects take 1, 2, … so overlapping work sits side by side. */
  lane: number;
  date: YearMonth;
  label: string;
  subtitle: string;
  /** Stable fake short hash, so the graph reads like real output. */
  hash: string;
  /** Shown as a git ref chip, e.g. "HEAD -> main". */
  ref?: string;
  /** Still running, so its branch never merges. */
  open?: boolean;
}

export interface Branch {
  id: string;
  lane: number;
  /** Index into the rows array, which runs newest first. */
  fromRow: number;
  toRow: number;
  /** Still open, so it never merges back. */
  open: boolean;
}

export interface CareerGraph {
  rows: GraphNode[];
  branches: Branch[];
  laneCount: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthLabel({ year, month }: YearMonth): string {
  return `${MONTHS[month - 1]} ${year}`;
}

const toKey = (d: YearMonth) => d.year * 12 + d.month;

/** Deterministic 7-character hash, so the same input always renders the same. */
export function shortHash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 7);
}

/** Parses "Sep 2026 - Present" / "Jan 2026 - Apr 2026" into month bounds. */
export function parsePeriod(period: string): {
  start: YearMonth;
  end: YearMonth | null;
} {
  const [rawStart, rawEnd] = period.split(/\s*[-–]\s*/);

  const parse = (text: string): YearMonth | null => {
    if (!text || /present/i.test(text)) return null;
    const match = text.trim().match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/);
    if (match) {
      const month = MONTHS.findIndex(
        (m) => m.toLowerCase() === match[1].toLowerCase()
      );
      return { year: Number(match[2]), month: month >= 0 ? month + 1 : 1 };
    }
    const yearOnly = text.trim().match(/(\d{4})/);
    return yearOnly ? { year: Number(yearOnly[1]), month: 1 } : null;
  };

  return {
    start: parse(rawStart) ?? { year: 2021, month: 9 },
    end: parse(rawEnd),
  };
}

/** Greedy lane assignment: a branch reuses a lane once the previous one ends. */
function assignLanes(
  intervals: { id: string; start: number; end: number }[]
): Map<string, number> {
  const lanes: number[] = []; // lane -> earliest start still occupied
  const assigned = new Map<string, number>();

  // Oldest first, so lanes fill in the order the work began.
  const ordered = [...intervals].sort((a, b) => a.start - b.start);

  for (const interval of ordered) {
    let lane = lanes.findIndex((occupiedUntil) => occupiedUntil <= interval.start);
    if (lane === -1) {
      lanes.push(interval.end);
      lane = lanes.length - 1;
    } else {
      lanes[lane] = interval.end;
    }
    assigned.set(interval.id, lane + 1); // lane 0 is reserved for main
  }

  return assigned;
}

export function buildCareerGraph(
  roleInputs: RoleInput[],
  projectInputs: ProjectInput[],
  now: Date = new Date()
): CareerGraph {
  const nowKey = now.getFullYear() * 12 + (now.getMonth() + 1);

  const roles: GraphNode[] = roleInputs.map((role) => ({
    id: `role-${role.id}`,
    sourceId: role.id,
    kind: "role" as const,
    lane: 0,
    date: role.start ?? { year: role.year, month: 9 },
    label: role.company,
    subtitle: role.title,
    hash: shortHash(`${role.company}${role.title}`),
  }));

  const projectNodes: GraphNode[] = projectInputs.map((project) => {
    const { start, end } = parsePeriod(project.period);
    return {
      id: `project-${project.id}`,
      sourceId: project.id,
      kind: "project" as const,
      lane: 0, // replaced below
      date: start,
      label: project.title,
      subtitle: project.tags.slice(0, 3).join(", "),
      hash: shortHash(project.title),
      open: end === null,
    };
  });

  const laneFor = assignLanes(
    projectInputs.map((project) => {
      const { start, end } = parsePeriod(project.period);
      return {
        id: `project-${project.id}`,
        start: toKey(start),
        end: end ? toKey(end) : Number.MAX_SAFE_INTEGER,
      };
    })
  );
  for (const node of projectNodes) {
    node.lane = laneFor.get(node.id) ?? 1;
  }

  const rows = [...roles, ...projectNodes].sort(
    (a, b) => toKey(b.date) - toKey(a.date)
  );

  // The newest commit on main carries the HEAD ref.
  const newestRole = rows.find((row) => row.kind === "role");
  if (newestRole) newestRole.ref = "HEAD -> main";

  const branches: Branch[] = projectNodes.map((node) => {
    const { end } = parsePeriod(
      projectInputs.find((p) => `project-${p.id}` === node.id)!.period
    );
    const startRow = rows.findIndex((row) => row.id === node.id);
    const endKey = end ? toKey(end) : nowKey;
    let mergeRow = rows.findIndex((row) => toKey(row.date) <= endKey);
    if (mergeRow === -1 || mergeRow > startRow) mergeRow = 0;

    return {
      id: node.id,
      lane: node.lane,
      fromRow: Math.min(mergeRow, startRow),
      toRow: startRow,
      open: !end,
    };
  });

  const laneCount = Math.max(1, ...rows.map((row) => row.lane + 1));

  return { rows, branches, laneCount };
}
