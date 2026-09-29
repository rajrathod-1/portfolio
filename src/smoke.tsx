/**
 * Render-once smoke test: `npm run smoke`.
 *
 * Builds the app for the server, renders it to HTML and asserts the things
 * that must never silently disappear. It catches crashes and missing content,
 * not layout — check the browser for anything visual.
 */
import { renderToString } from "react-dom/server";
import App from "./App";
import { fileSystem, neofetchLines, treeLines } from "./lib/filesystem";
import { experienceData, statusOf } from "./lib/experience";
import { projects } from "./lib/projects";

const html = renderToString(<App />);
const failures: string[] = [];

function check(name: string, pass: boolean, detail = "") {
  if (!pass) failures.push(`${name}${detail ? " — " + detail : ""}`);
}

/** React escapes &, < and > in text, so escape the needle the same way. */
function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inHtml(name: string, needle: string) {
  check(name, html.includes(escapeHtml(needle)), `missing ${JSON.stringify(needle)}`);
}

// Hero
inHtml("hero name", "Raj Rathod");
inHtml("terminal prompt", "raj@portfolio");
inHtml("status pill", "Open to new grad software roles");

// Experience: Citi and the résumé sync
inHtml("Citi in the timeline", "Citi");
inHtml("Citi location", "Toronto, ON");
inHtml("Citi dates", "May 2026 - Sept 2026");
inHtml("Ericsson dates", "Jan 2026 - April 2026");
inHtml("Proofpoint dates", "Oct 2024 - Dec 2025");
inHtml("computed status badge", "Completed");

// Projects and tools
for (const project of projects) {
  inHtml(`project ${project.title}`, project.title);
}
check(
  "exactly one featured project",
  projects.filter((p) => p.featured).length === 1
);
check(
  "the shipped project links to its repo",
  projects.filter((p) => p.repo?.href).length >= 1
);
check(
  "the featured project drives the live panel",
  projects.find((p) => p.featured)?.live === true
);
for (const tool of ["Spring Boot", "Apache Kafka", "Elasticsearch"]) {
  inHtml(`tool ${tool}`, tool);
}

// Contact details, and never a phone number. SVG path data is stripped first,
// since coordinate runs look like digit soup to any phone pattern.
inHtml("email in connect", "rathodraj725@gmail.com");
inHtml("leetcode in connect", "leetcode.com/u/popple_1");
check("headshot is gone from the hero", !html.includes("head%20image"));
const PHONE = /(\+\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/;
const prose = html.replace(/ d="[^"]*"/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "");
const phone = prose.match(PHONE);
check("no phone number in the page", !phone, phone?.[0] ?? "");

// Terminal file system
const experience = fileSystem.experience;
check("experience/citi.txt exists", "citi.txt" in experience);
check(
  "citi.txt header",
  experience["citi.txt"].startsWith("Software Developer Intern @ Citi (May 2026 - Sept 2026)")
);
check(
  "citi.txt keeps all four bullets",
  (experience["citi.txt"].match(/•/g) ?? []).length === 4
);
check(
  "citi.txt quotes the résumé verbatim",
  experience["citi.txt"].includes(
    "reducing data retrieval latency by 40% through optimized API design."
  )
);
check(
  "outlier.txt is untouched",
  experience["outlier.txt"].startsWith(
    "AI Model Training Engineer @ Outlier (May 2024 - Aug 2024)"
  )
);

const contact = fileSystem.contact["info.txt"];
check("contact/info.txt has the email", contact.includes("rathodraj725@gmail.com"));
check("contact/info.txt has LinkedIn", contact.includes("linkedin.com/in/raj-rathod1"));
check("contact/info.txt has GitHub", contact.includes("github.com/rajrathod-1"));
check("contact/info.txt has LeetCode", contact.includes("leetcode.com/u/popple_1"));
check("contact/info.txt dropped the placeholder", !contact.includes("Available on request"));
check("contact/info.txt has no phone", !PHONE.test(contact));

for (const project of projects) {
  const name = `${project.file.split("/")[0]}.txt`;
  check(`projects/${name} exists`, name in fileSystem.projects);
  check(
    `projects/${name} quotes the resume`,
    fileSystem.projects[name].includes(project.bullets[0])
  );
}
check(
  "projects/ still has the portfolio entry",
  "portfolio.txt" in fileSystem.projects
);

check("tree lists every directory", treeLines().join("\n").includes("experience/"));
check("neofetch names the school", neofetchLines().join("\n").includes("University of Manitoba"));

// Timeline placement
const byCompany = (name: string) =>
  experienceData.find((entry) => entry.company === name);
check("Citi location recorded", byCompany("Citi")?.location === "Toronto, ON");
check(
  "Ericsson location recorded",
  byCompany("Ericsson")?.location === "Montreal, QC"
);
check("Citi sits at 2026.33", byCompany("Citi")?.year === 2026.33);
check("Ericsson sits at 2026.00", byCompany("Ericsson")?.year === 2026.0);
check("Proofpoint sits at 2024.75", byCompany("Proofpoint")?.year === 2024.75);
check(
  "growth increases chronologically",
  experienceData.every(
    (entry, i) => i === 0 || entry.growth > experienceData[i - 1].growth
  )
);
check(
  "no status is hard-coded",
  experienceData
    .filter((entry) => entry.start)
    .every((entry) => statusOf(entry) !== null)
);

console.log(`rendered ${html.length} bytes of HTML`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("all smoke checks passed");
