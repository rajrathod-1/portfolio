export interface Project {
  /** Also selects the architecture sketch in ProjectDiagram. */
  id: "agentic" | "commerce" | "shortener";
  title: string;
  /** Shown in the pane's header tab. */
  file: string;
  period: string;
  /** One line for the grid; the bullets carry the detail. */
  summary: string;
  /** Résumé bullets, verbatim. */
  bullets: string[];
  tags: string[];
  demo?: { label: string; href: string };
  repo?: { label: string; href: string };
  featured?: boolean;
}

export const projects: Project[] = [
  {
    id: "agentic",
    title: "Agentic Content Generation System",
    file: "agentic-content-system/README.md",
    period: "Jan 2026 - April 2026",
    summary:
      "An enterprise agent system: LLMs with a tool-use layer over a retrieval pipeline, benchmarked on quality, latency and cost.",
    bullets: [
      "Designed and shipped a production-grade enterprise agent system integrating LLMs with a tool-use layer and an information retrieval (RAG) pipeline, supporting multi-step workflows and automated failure recovery.",
      "Built evaluation infrastructure benchmarking model variants across quality, latency, and cost; achieved sub-200ms p95 response times via Redis caching and A/B tested endpoints across 3 model variants.",
    ],
    tags: [
      "Python",
      "Flask",
      "OpenAI API",
      "LangChain",
      "RAG",
      "FAISS",
      "Redis",
    ],
    demo: {
      label: "Live demo",
      href: "https://ai-content-generation-tan.vercel.app",
    },
    repo: {
      label: "GitHub",
      href: "https://github.com/rajrathod-1/AI-Content-Generation",
    },
    featured: true,
  },
  {
    id: "commerce",
    title: "E-Commerce Marketplace Backend",
    file: "ecommerce-backend/README.md",
    period: "Sept 2025 - Dec 2025",
    summary:
      "Event-driven marketplace services with GraphQL for client data fetching and MongoDB for the product catalog.",
    bullets: [
      "Architected event-driven backend services for a consumer-focused e-commerce marketplace, utilizing GraphQL for optimized client data fetching and MongoDB for flexible product catalog storage.",
      "Accelerated development lifecycle by 30% leveraging AI-enhanced tools like GitHub Copilot and Cursor for code generation, ensuring clean code practices and comprehensive unit testing.",
    ],
    tags: [
      "Java",
      "Kotlin",
      "GraphQL",
      "MongoDB",
      "GitHub Copilot",
      "Cursor",
    ],
    repo: { label: "GitHub", href: "https://github.com/rajrathod-1" },
  },
  {
    id: "shortener",
    title: "Distributed URL Shortener & Analytics Service",
    file: "url-shortener/README.md",
    period: "Jan 2024 - Apr 2024",
    summary:
      "A distributed system on AWS serving 100K+ redirects, with a cached hot path and a click-through analytics backend.",
    bullets: [
      "Applied large-scale system design to deploy a distributed system on AWS handling 100K+ URL redirects, using DynamoDB for sub-10ms lookups and Redis for hot-path caching across scaled EC2 instances.",
      "Built an analytics backend exposing click-through metrics with A/B redirect testing; containerized with Docker and deployed via CI/CD pipeline with full end-to-end observability.",
    ],
    tags: ["Python", "AWS EC2", "AWS S3", "DynamoDB", "Redis", "Docker"],
    repo: { label: "GitHub", href: "https://github.com/rajrathod-1" },
  },
];

/** projects/ in the terminal, rendered from the same data. */
export function projectFiles(): Record<string, string> {
  const files: Record<string, string> = {};

  for (const project of projects) {
    const name = `${project.file.split("/")[0]}.txt`;
    files[name] = [
      project.title,
      `Tech: ${project.tags.join(", ")}`,
      `When: ${project.period}`,
      "",
      ...project.bullets.map((bullet) => `• ${bullet}`),
    ].join("\n");
  }

  files["portfolio.txt"] = `Interactive Portfolio Website
Tech: React, TypeScript, Framer Motion, Tailwind CSS

• Built responsive portfolio with Linux terminal interface
• Implemented custom cursor with Neko cat follower
• Tab completion and command history for command-line navigation
• Command palette on ${"⌘"}K, with a circular theme reveal
• Dark mode support with smooth animations`;

  return files;
}
