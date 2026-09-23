import { SITE } from "./site";
import { projectFiles } from "./projects";
import {
  currentRole,
  experienceData,
  statusOf,
  terminalFileText,
  upcomingRole,
} from "./experience";

export type FileSystem = Record<string, Record<string, string>>;

/** experience/ mirrors the résumé data, so the two can never drift apart. */
function experienceFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const entry of experienceData) {
    if (entry.file) files[entry.file] = terminalFileText(entry);
  }
  return files;
}

function contactInfo(): string {
  const current = currentRole();
  const next = upcomingRole();

  const lines = [
    "Contact Information:",
    `📧 Email: ${SITE.email}`,
    `💼 LinkedIn: ${SITE.linkedinHandle}`,
    `🐙 GitHub: ${SITE.githubHandle}`,
    `🧩 LeetCode: ${SITE.leetcodeHandle}`,
    "🎓 University of Manitoba - Computer Science",
    "📍 Location: Winnipeg, MB, Canada",
    "",
  ];

  if (current) {
    const label = statusOf(current) === "Current" ? "Currently" : "Most recent";
    lines.push(`${label}: ${current.title} @ ${current.company}`);
  }
  if (next) {
    lines.push(`Next: ${next.title} @ ${next.company} (${next.dates})`);
  }

  lines.push("", "Feel free to reach out for collaborations or opportunities!");
  return lines.join("\n");
}

export const fileSystem: FileSystem = {
  experience: experienceFiles(),
  projects: projectFiles(),
  technologies: {
    "languages.txt": `Programming Languages:
• Java - Enterprise applications and Android development
• Python - AI/ML, automation, and backend services
• JavaScript/TypeScript - Full-stack web development
• C/C++ - Systems programming and algorithms
• SQL - Database design and optimization`,
    "frameworks.txt": `Frameworks & Libraries:
• React.js - Modern web applications
• Flask - Python web framework
• Node.js - Backend services
• Android SDK - Mobile development
• OpenAI APIs - AI integration`,
    "tools.txt": `Tools & Technologies:
• Docker - Containerization and deployment
• AWS - Cloud infrastructure and services
• Git/GitHub - Version control
• MySQL/Redis - Databases and caching
• CI/CD - Jenkins, GitHub Actions
• FAISS - Vector similarity search`,
  },
  contact: {
    "info.txt": contactInfo(),
  },
};

/** `tree` output for the whole fake file system. */
export function treeLines(fs: FileSystem = fileSystem): string[] {
  const lines: string[] = ["."];
  const dirs = Object.keys(fs);

  dirs.forEach((dir, dirIndex) => {
    const lastDir = dirIndex === dirs.length - 1;
    lines.push(`${lastDir ? "└──" : "├──"} ${dir}/`);

    const files = Object.keys(fs[dir]);
    files.forEach((file, fileIndex) => {
      const lastFile = fileIndex === files.length - 1;
      lines.push(
        `${lastDir ? "   " : "│  "} ${lastFile ? "└──" : "├──"} ${file}`
      );
    });
  });

  const fileCount = dirs.reduce((n, dir) => n + Object.keys(fs[dir]).length, 0);
  lines.push("");
  lines.push(`${dirs.length} directories, ${fileCount} files`);
  return lines;
}

/** Small original mark: a block prompt caret, not a distro logo. */
const NEOFETCH_ART = [
  "  ╔══════════╗",
  "  ║ ❯ _      ║",
  "  ║          ║",
  "  ║  ▄▄  ▄▄  ║",
  "  ║  ██  ██  ║",
  "  ╚══════════╝",
];

export function neofetchLines(): string[] {
  const current = currentRole();
  const info: string[] = [
    `${SITE.name.toLowerCase().replace(" ", "")}@portfolio`,
    "-----------------------",
    "School: University of Manitoba",
    "Program: Computer Science, Co-op",
    "Minor: Mathematics & Statistics",
    current ? `Role: ${current.title} @ ${current.company}` : "",
    "Languages: C++, C, Python, Java, JavaScript, TypeScript, SQL",
    `GitHub: ${SITE.githubHandle}`,
    `LinkedIn: ${SITE.linkedinHandle}`,
    `LeetCode: ${SITE.leetcodeHandle}`,
  ].filter(Boolean);

  const rows = Math.max(NEOFETCH_ART.length, info.length);
  const pad = " ".repeat(16);

  return Array.from({ length: rows }, (_, i) => {
    const art = (NEOFETCH_ART[i] ?? "").padEnd(16, " ");
    return `${NEOFETCH_ART[i] ? art : pad}${info[i] ?? ""}`;
  });
}
