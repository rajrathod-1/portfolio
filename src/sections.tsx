import { Fragment, type CSSProperties } from "react";
import { experienceData, statusOf } from "@/lib/experience";
import { projects } from "@/lib/projects";
import { SITE, copyEmail } from "@/lib/site";

/** Splits a line into words that rise out of a mask when revealed. */
function Words({ text, from = 0 }: { text: string; from?: number }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      <span className="w">
        <span style={{ "--i": from + i } as CSSProperties}>{word}</span>
      </span>{" "}
    </Fragment>
  ));
}

function Chapter({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <header className="chapter">
      {label && (
        <p className="mono label" data-reveal>
          {label}
        </p>
      )}
      {children}
    </header>
  );
}

export function Hero() {
  return (
    <section id="top" className="hero">
      <h1 className="hero-name">Raj Rathod</h1>
      <p className="mono hero-role intro">Software developer</p>
      <div className="hero-foot">
        <p className="hero-line intro" style={{ "--i": 1 } as CSSProperties}>
          Computer science at the University of Manitoba. Previously at Citi, Ericsson and
          Proofpoint.
        </p>
        <p className="mono status intro" style={{ "--i": 2 } as CSSProperties}>
          <span className="dot" aria-hidden="true" /> {SITE.status}
        </p>
      </div>
      <p className="mono cue intro" style={{ "--i": 3 } as CSSProperties} aria-hidden="true">
        Scroll · follow the stream
      </p>
    </section>
  );
}

const PARTITIONS = [
  ["Languages", "Java · Python · TypeScript · JavaScript · C++ · SQL"],
  ["Frameworks", "React · Node.js · Spring Boot · Flask"],
  ["Infrastructure", "Docker · Kubernetes · AWS · Linux · CI/CD · Git"],
  ["Data", "Apache Kafka · Elasticsearch · Redis · MySQL · Oracle · MS SQL Server"],
  ["AI", "OpenAI APIs · FAISS · Retrieval & evaluation"],
];

export function Stream() {
  return (
    <section id="about" className="stream">
      <Chapter label="About">
        <h2 className="display" data-reveal="words">
          <Words text="I build" />
          <em>
            <Words text="backend systems." from={2} />
          </em>
        </h2>
      </Chapter>
      <div className="about">
        <p data-reveal>
          I'm Raj, a computer science student at the University of Manitoba with a minor in
          Mathematics &amp; Statistics. I build backend services that move messages reliably:
          Kafka pipelines at Citi, Kubernetes microservices at Ericsson, Flask services at
          Proofpoint.
        </p>
        <p data-reveal>
          On my own time I go a layer lower. A matching engine, an interpreter, a TCP proxy, each
          built from first principles and tested against something deliberately simpler than
          itself.
        </p>
      </div>
      <dl className="partitions" aria-label="Tools and technologies">
        {PARTITIONS.map(([name, items], i) => (
          <div key={name} data-reveal style={{ "--i": i } as CSSProperties}>
            <dt className="mono">
              p{i} · {name}
            </dt>
            <dd>{items}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** "99.9% uptime" → ["99.9%", "uptime"]. */
const splitMetric = (m: string) => [m.slice(0, m.indexOf(" ")), m.slice(m.indexOf(" ") + 1)];

export function Offsets() {
  // Most recent first. Offsets still count up with time, like a log.
  const roles = experienceData.filter((e) => e.file).sort((a, b) => b.year - a.year);
  return (
    <section id="experience" className="offsets">
      <Chapter>
        <h2 className="display" data-reveal="words">
          <Words text="Experience" />
        </h2>
        <p className="lede" data-reveal>
          Every role, most recent first.
        </p>
      </Chapter>
      {roles.map((role, i) => (
        <article className="offset" key={role.company}>
          <p className="mono label" data-reveal>
            offset {String(roles.length - i).padStart(4, "0")} · {statusOf(role)}
          </p>
          <h3 className="company" data-reveal="words">
            <Words text={role.company} />
          </h3>
          <p className="role" data-reveal>
            {role.title}
            <span className="mono">
              {role.dates}
              {role.location && ` · ${role.location}`}
            </span>
          </p>
          {role.metrics && (
            <ul className="metrics" data-reveal>
              {role.metrics.map((m) => {
                const [value, label] = splitMetric(m);
                return (
                  <li key={m}>
                    <strong>{value}</strong> {label}
                  </li>
                );
              })}
            </ul>
          )}
          <ul className="bullets">
            {role.bullets?.map((b, j) => (
              <li key={j} data-reveal style={{ "--i": j } as CSSProperties}>
                {b}
              </li>
            ))}
          </ul>
          {role.tags && (
            <p className="mono tags" data-reveal>
              {role.tags.join(" / ")}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}

// Projects with a live demo first; otherwise the order in lib/projects.ts.
const shown = [...projects].sort((a, b) => Number(!!b.demo) - Number(!!a.demo));

export function Matched({ onFocus }: { onFocus: (on: boolean) => void }) {
  return (
    <section id="work" className="matched">
      <Chapter>
        <h2 className="display" data-reveal="words">
          <Words text="Projects" />
        </h2>
        <p className="lede" data-reveal>
          Two have live demos you can try.
        </p>
      </Chapter>
      <ol className="projects">
        {shown.map((p, i) => (
          <li
            key={p.id}
            className="project"
            data-reveal
            onPointerEnter={() => onFocus(true)}
            onPointerLeave={() => onFocus(false)}
            onFocus={() => onFocus(true)}
            onBlur={() => onFocus(false)}
          >
            <span className="mono idx">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{p.title}</h3>
              <p className="mono meta">
                {p.period} · {p.tags.join(" / ")}
              </p>
              <p className="summary">{p.summary}</p>
              <details>
                <summary className="mono">How it works</summary>
                <ul>
                  {p.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </details>
              {(p.demo || p.repo) && (
                <p className="mono links">
                  {[p.demo, p.repo].map(
                    (l) =>
                      l && (
                        <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                          {l.label} ↗
                        </a>
                      )
                  )}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const LINKS = [
  ["GitHub", SITE.github],
  ["LinkedIn", SITE.linkedin],
  ["LeetCode", SITE.leetcode],
];

export function Ack({ onAck }: { onAck: () => void }) {
  return (
    <section id="contact" className="ack">
      <p className="mono label" data-reveal>
        Contact
      </p>
      <h2 className="display" data-reveal="words">
        <Words text="Looking for" />
        <em>
          <Words text="new grad software roles." from={2} />
        </em>
      </h2>
      <a className="email magnet" href={`mailto:${SITE.email}`} onClick={onAck} data-reveal>
        {SITE.email}
      </a>
      <p className="mono actions" data-reveal>
        <button
          type="button"
          className="magnet"
          onClick={() => {
            copyEmail();
            onAck();
          }}
        >
          Copy address
        </button>
        {LINKS.map(([label, href]) => (
          <a key={label} className="magnet" href={href} target="_blank" rel="noreferrer">
            {label} ↗
          </a>
        ))}
        <a className="magnet" href={SITE.resume} download={SITE.resumeFile}>
          Résumé ↓
        </a>
      </p>
      <footer className="mono colophon">
        <span>© {new Date().getFullYear()} Raj Rathod</span>
        <span>Three.js · one shader · ~64k messages</span>
      </footer>
    </section>
  );
}
