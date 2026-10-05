export interface Project {
  id: "orderbook" | "interpreter" | "rag" | "proxy";
  title: string;
  period: string;
  /** One line for the grid; the bullets carry the detail. */
  summary: string;
  /** Résumé bullets, verbatim. */
  bullets: string[];
  tags: string[];
  demo?: { label: string; href: string };
  repo?: { label: string; href: string };
}

export const projects: Project[] = [
  {
    id: "orderbook",
    title: "Limit Order Book and Matching Engine",
    period: "Sep 2026 - Present",
    summary:
      "A price-time priority matching engine in C++, tested by diffing every fill against a deliberately simple Python reference.",
    bullets: [
      "Building a price-time priority matching engine in C++ supporting limit, market, and cancel orders, with sorted price levels and an order-id index so cancels do not scan the book.",
      "Testing it by replaying randomly generated order streams against a deliberately simple reference implementation in Python and diffing every fill; this catches partial-fill and cancel edge cases that hand-written unit tests missed.",
    ],
    tags: ["C++", "Python"],
  },
  {
    id: "interpreter",
    title: "Interpreter for a Small Functional Language",
    period: "Aug 2026 - Present",
    summary:
      "A parser and evaluator with closures, algebraic data types and pattern matching, plus Hindley-Milner type inference.",
    bullets: [
      "Writing a parser and evaluator for a language with closures, algebraic data types, and pattern matching.",
      "Adding Hindley-Milner type inference so ill-typed programs are rejected before they run, with errors that point at the offending expression; each example program is checked against its expected output.",
    ],
    tags: ["Python"],
  },
  {
    id: "rag",
    title: "Retrieval-Augmented Question Answering Service",
    period: "Jan 2026 - Apr 2026",
    summary:
      "Answers questions over a user-supplied corpus with embeddings, FAISS and an LLM, with a tool-use layer and an evaluation harness.",
    bullets: [
      "Built and deployed a service that answers questions over a user-supplied corpus using embeddings, FAISS, and an LLM.",
      "Added a tool-use layer so the model can choose between searching the corpus and answering directly, with automatic recovery when a step fails.",
      "Timed every stage before optimizing and found retrieval, not the model call, was the bottleneck; caching brought p95 latency under 200ms. Built an evaluation harness after noticing bad retrieval produced answers that looked right but were not.",
    ],
    tags: ["Python", "Flask", "FAISS", "Redis"],
    demo: {
      label: "Live demo",
      href: "https://ai-content-generation-tan.vercel.app",
    },
    repo: {
      label: "GitHub",
      href: "https://github.com/rajrathod-1/AI-Content-Generation",
    },
  },
  {
    id: "proxy",
    title: "TCP Proxy Server",
    period: "Sep 2025 - Dec 2025",
    summary:
      "A multithreaded Layer 4 proxy on Linux with event-driven I/O, routing, load balancing and per-connection telemetry.",
    bullets: [
      "Wrote a multithreaded Layer 4 TCP proxy on Linux handling concurrent connections with event-driven, asynchronous I/O, plus simple routing and load balancing.",
      "Added per-connection telemetry and tested under sustained load to see where throughput dropped and why.",
    ],
    tags: ["C++", "POSIX Sockets", "Linux"],
  },
];
