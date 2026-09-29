import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCareerGraph,
  type ProjectInput,
  type RoleInput,
  formatDate,
  monthLabel,
  parsePeriod,
  shortHash,
} from "./career-graph.ts";

test("periods parse into month bounds", () => {
  assert.deepEqual(parsePeriod("Jan 2026 - Apr 2026"), {
    start: { year: 2026, month: 1 },
    end: { year: 2026, month: 4 },
  });
  assert.deepEqual(parsePeriod("Sep 2026 - Present").end, null);
  assert.deepEqual(parsePeriod("Sep 2025 - Dec 2025").start, {
    year: 2025,
    month: 9,
  });
});

test("hashes are stable and look like git hashes", () => {
  assert.equal(shortHash("Citigroup"), shortHash("Citigroup"));
  assert.notEqual(shortHash("Citigroup"), shortHash("Ericsson"));
  assert.match(shortHash("anything"), /^[0-9a-f]{7}$/);
});

test("dates format for display", () => {
  assert.equal(formatDate({ year: 2026, month: 5 }), "2026-05");
  assert.equal(monthLabel({ year: 2026, month: 5 }), "May 2026");
});

// Stands in for the real data, so the model is tested rather than the resume.
const ROLES: RoleInput[] = [
  { id: "um", company: "University of Manitoba", title: "BSc Computer Science", year: 2021, start: null },
  { id: "devclub", company: "UM DevClub", title: "Hackathon Organizer", year: 2022, start: { year: 2022, month: 9 } },
  { id: "proofpoint", company: "Proofpoint", title: "Software Developer Intern", year: 2024, start: { year: 2024, month: 10 } },
  { id: "ericsson", company: "Ericsson", title: "Software Developer Intern", year: 2026, start: { year: 2026, month: 1 } },
  { id: "citi", company: "Citigroup", title: "Software Developer Intern", year: 2026, start: { year: 2026, month: 5 } },
];

const PROJECTS: ProjectInput[] = [
  { id: "orderbook", title: "Limit Order Book", period: "Sep 2026 - Present", tags: ["C++"] },
  { id: "interpreter", title: "Interpreter", period: "Aug 2026 - Present", tags: ["Python"] },
  { id: "rag", title: "RAG Service", period: "Jan 2026 - Apr 2026", tags: ["Python"] },
  { id: "proxy", title: "TCP Proxy", period: "Sep 2025 - Dec 2025", tags: ["C++"] },
];

const build = (now = new Date(2026, 8, 29)) =>
  buildCareerGraph(ROLES, PROJECTS, now);

test("rows run newest first", () => {
  const { rows } = build();
  for (let i = 1; i < rows.length; i++) {
    const previous = rows[i - 1].date.year * 12 + rows[i - 1].date.month;
    const current = rows[i].date.year * 12 + rows[i].date.month;
    assert.ok(previous >= current, `row ${i} is out of order`);
  }
});

test("roles sit on main and projects branch off it", () => {
  const { rows } = build();
  const roles = rows.filter((r) => r.kind === "role");
  const branchNodes = rows.filter((r) => r.kind === "project");

  assert.ok(roles.length >= 4, "the career commits are present");
  assert.ok(branchNodes.length >= 3, "the projects are present");
  assert.ok(
    roles.every((r) => r.lane === 0),
    "every role is on main"
  );
  assert.ok(
    branchNodes.every((r) => r.lane >= 1),
    "no project sits on main"
  );
});

test("overlapping projects get their own lanes", () => {
  const { rows } = build();
  const open = rows.filter((r) => r.kind === "project" && r.open);
  const lanes = new Set(open.map((r) => r.lane));
  assert.equal(
    lanes.size,
    open.length,
    "projects running at the same time must not share a lane"
  );
});

test("exactly one commit carries HEAD", () => {
  const { rows } = build();
  const heads = rows.filter((r) => r.ref?.includes("HEAD"));
  assert.equal(heads.length, 1);
  assert.equal(heads[0].kind, "role", "HEAD belongs on main");
});

test("branches span from their merge point down to where they started", () => {
  const { rows, branches } = build();
  assert.ok(branches.length >= 3);

  for (const branch of branches) {
    assert.ok(branch.fromRow <= branch.toRow, `${branch.id} runs backwards`);
    assert.ok(branch.toRow < rows.length, `${branch.id} points past the end`);
    assert.equal(
      rows[branch.toRow].id,
      branch.id,
      "a branch starts at its own commit"
    );
  }
});

test("open branches are marked, finished ones are not", () => {
  const { branches } = build();
  assert.ok(
    branches.some((b) => b.open),
    "work in progress stays unmerged"
  );
  assert.ok(
    branches.some((b) => !b.open),
    "finished work merges back"
  );
});
