import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid, List } from "lucide-react";
import ProjectDiagram from "@/components/ProjectDiagram";
import { projects, type Project } from "@/lib/projects";
import { useFinePointer } from "@/lib/useMediaQuery";

type ViewMode = "spotlight" | "grid";

/** Tags read as syntax tokens: languages violet, everything else blue-grey. */
const LANGUAGE_TAGS = new Set([
  "Python",
  "Java",
  "Kotlin",
  "TypeScript",
  "JavaScript",
  "C++",
  "SQL",
]);

const TagList: React.FC<{ tags: string[] }> = ({ tags }) => (
  <ul className="flex flex-wrap gap-1.5">
    {tags.map((tag) => (
      <li
        key={tag}
        className={`rounded border px-2 py-0.5 font-mono text-[0.7rem] ${
          LANGUAGE_TAGS.has(tag)
            ? "border-violet/30 text-violet"
            : "border-line text-mute"
        }`}
      >
        {tag}
      </li>
    ))}
  </ul>
);

const PaneHeader: React.FC<{ project: Project; className?: string }> = ({
  project,
  className = "",
}) => (
  <div
    className={`flex items-center justify-between gap-2 border-b border-line px-4 py-2 ${className}`}
  >
    <span className="truncate font-mono text-xs text-mute">{project.file}</span>
    <span className="shrink-0 font-mono text-[0.7rem] text-mute">
      {project.period}
    </span>
  </div>
);

const ProjectLinks: React.FC<{ project: Project; compact?: boolean }> = ({
  project,
  compact = false,
}) => (
  <div className="flex flex-wrap gap-2">
    {project.demo && (
      <a
        href={project.demo.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 rounded-md border border-blue/40 px-3 py-1.5 font-mono text-blue transition-colors hover:bg-blue/10 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {project.demo.label} ↗
      </a>
    )}
    {project.repo && (
      <a
        href={project.repo.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 font-mono text-fog transition-colors hover:border-fog ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {project.repo.label} ↗
      </a>
    )}
  </div>
);

/** A pane whose border lights up under the cursor, on fine pointers only. */
const SpotlightPane: React.FC<{
  children: React.ReactNode;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  dimmed?: boolean;
}> = ({ children, className = "", onMouseEnter, onMouseLeave, dimmed = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const finePointer = useFinePointer();

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!finePointer || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: finePointer
          ? "radial-gradient(180px circle at var(--mx, -200px) var(--my, -200px), var(--blue), transparent 65%), linear-gradient(var(--line), var(--line))"
          : "var(--line)",
      }}
      className={`rounded-xl p-px transition-opacity duration-200 ${
        dimmed ? "opacity-50" : "opacity-100"
      } ${className}`}
    >
      <div className="h-full overflow-hidden rounded-[11px] bg-surface">
        {children}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  onOpen: () => void;
  dimmed: boolean;
  onHover: (id: string | null) => void;
}> = ({ project, onOpen, dimmed, onHover }) => {
  const featured = !!project.featured;

  return (
    <SpotlightPane
      dimmed={dimmed}
      onMouseEnter={() => onHover(project.id)}
      onMouseLeave={() => onHover(null)}
      className={featured ? "md:col-span-2" : ""}
    >
      {/* The featured pane runs full width, so the sketch sits beside the text
          rather than leaving a column of dead space under it. */}
      <article
        className={`flex h-full flex-col ${featured ? "lg:flex-row" : ""}`}
      >
        <PaneHeader project={project} className={featured ? "lg:hidden" : ""} />
        <ProjectDiagram
          id={project.id}
          className={
            featured
              ? "h-44 border-b border-line lg:h-auto lg:min-h-[16rem] lg:w-[40%] lg:shrink-0 lg:border-b-0 lg:border-r"
              : "h-32 border-b border-line"
          }
        />

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {featured && (
            <PaneHeader
              project={project}
              className="-mx-5 -mt-5 mb-4 hidden border-b lg:flex"
            />
          )}
          <h3
            className={`mb-2 font-mono font-semibold text-fog ${
              featured ? "text-lg md:text-xl" : "text-base"
            }`}
          >
            {project.title}
          </h3>

          {featured ? (
            <ul className="mb-4 max-w-[68ch] space-y-2">
              {project.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-2 font-sans text-sm leading-relaxed text-fog/80"
                >
                  <span aria-hidden="true" className="text-blue">
                    ▸
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 font-sans text-sm leading-relaxed text-fog/80">
              {project.summary}
            </p>
          )}

          <div className="mt-auto space-y-3">
            <TagList tags={featured ? project.tags : project.tags.slice(0, 4)} />
            <div className="flex flex-wrap items-center gap-2">
              <ProjectLinks project={project} compact={!featured} />
              <button
                type="button"
                onClick={onOpen}
                className="rounded-md px-2 py-1.5 font-mono text-xs text-mute transition-colors hover:text-fog"
              >
                Open in spotlight
              </button>
            </div>
          </div>
        </div>
      </article>
    </SpotlightPane>
  );
};

const Projects: React.FC = () => {
  const [activeProject, setActiveProject] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const finePointer = useFinePointer();

  const openSpotlight = (index: number) => {
    setActiveProject(index);
    setViewMode("spotlight");
    document
      .getElementById("projects")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const step = (delta: number) =>
    setActiveProject(
      (prev) => (prev + delta + projects.length) % projects.length
    );

  const project = projects[activeProject];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <div className="mb-8 flex justify-center">
        <button
          type="button"
          onClick={() =>
            setViewMode(viewMode === "spotlight" ? "grid" : "spotlight")
          }
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-mute transition-colors hover:border-blue hover:text-blue"
        >
          {viewMode === "spotlight" ? (
            <>
              <Grid className="h-4 w-4" aria-hidden="true" />
              Grid view
            </>
          ) : (
            <>
              <List className="h-4 w-4" aria-hidden="true" />
              Spotlight view
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {projects.map((item, index) => (
              <ProjectCard
                key={item.id}
                project={item}
                dimmed={
                  finePointer && hoveredId !== null && hoveredId !== item.id
                }
                onHover={setHoveredId}
                onOpen={() => openSpotlight(index)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]"
          >
            {/* Project switcher */}
            <ul className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
              {projects.map((item, index) => (
                <li key={item.id} className="shrink-0 md:shrink">
                  <button
                    type="button"
                    onClick={() => setActiveProject(index)}
                    aria-pressed={index === activeProject}
                    className={`w-full rounded-lg border px-3 py-2 text-left font-mono text-xs transition-colors ${
                      index === activeProject
                        ? "border-blue/50 bg-blue/10 text-blue"
                        : "border-line text-mute hover:text-fog"
                    }`}
                  >
                    <span className="block truncate">
                      {item.file.split("/")[0]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SpotlightPane>
                    <article className="flex h-full flex-col">
                      <PaneHeader project={project} />
                      <ProjectDiagram
                        id={project.id}
                        className="h-56 border-b border-line"
                      />

                      <div className="p-5 sm:p-7">
                        <h3 className="mb-3 font-mono text-xl font-semibold text-fog md:text-2xl">
                          {project.title}
                        </h3>

                        <ul className="mb-5 max-w-[70ch] space-y-2">
                          {project.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex gap-2 font-sans text-sm leading-relaxed text-fog/85 md:text-base"
                            >
                              <span aria-hidden="true" className="text-blue">
                                ▸
                              </span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mb-5">
                          <TagList tags={project.tags} />
                        </div>
                        <ProjectLinks project={project} />
                      </div>
                    </article>
                  </SpotlightPane>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mute transition-colors hover:text-fog"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>
                <span className="font-mono text-xs text-mute">
                  {activeProject + 1} / {projects.length}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mute transition-colors hover:text-fog"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
