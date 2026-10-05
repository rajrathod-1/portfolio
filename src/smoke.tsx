/**
 * Render-once smoke test: `npm run smoke`.
 *
 * Builds the app for the server, renders it to HTML and asserts the content
 * that must never silently disappear. It catches crashes and missing copy, not
 * the WebGL scene — check the browser for anything visual.
 */
import { renderToString } from "react-dom/server";
import App from "./App";
import { experienceData } from "./lib/experience";
import { projects } from "./lib/projects";
import { SITE } from "./lib/site";

const html = renderToString(<App />);
// Headings are split into per-word spans, so match against the visible text.
const text = html.replace(/<[^>]+>/g, "");
const failures: string[] = [];

/** React escapes &, <, > and quotes in text, so escape the needle the same way. */
const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;");

function inHtml(name: string, needle: string) {
  if (!text.includes(escapeHtml(needle)) && !html.includes(escapeHtml(needle))) failures.push(`${name} — missing ${JSON.stringify(needle)}`);
}

inHtml("name for screen readers", "Raj Rathod");
inHtml("status", SITE.status);

for (const role of experienceData.filter((e) => e.file)) {
  inHtml(`${role.company}`, role.company);
  inHtml(`${role.company} dates`, role.dates!);
  if (role.location) inHtml(`${role.company} location`, role.location);
  role.bullets?.forEach((b, i) => inHtml(`${role.company} bullet ${i + 1} verbatim`, b));
}

for (const project of projects) {
  inHtml(`project ${project.title}`, project.title);
  project.bullets.forEach((b, i) => inHtml(`${project.id} bullet ${i + 1} verbatim`, b));
  if (project.repo) inHtml(`${project.id} repo link`, project.repo.href);
}

for (const tool of ["Spring Boot", "Apache Kafka", "Elasticsearch"]) inHtml(`tool ${tool}`, tool);

inHtml("email", SITE.email);
inHtml("GitHub", SITE.github);
inHtml("LinkedIn", SITE.linkedin);
inHtml("LeetCode", SITE.leetcode);
inHtml("résumé", SITE.resume);
if (/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(html)) failures.push("a phone number is on the page");

console.log(`rendered ${html.length} bytes of HTML`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("all smoke checks passed");
