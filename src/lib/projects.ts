export interface Project {
  id: "orderbook" | "interpreter" | "rag" | "proxy";
  title: string;
  period: string;
  /** One line for the grid; the bullets carry the detail. */
  summary: string;
  /** The detail behind the summary. */
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
      "A price-time priority matching engine in C++20, 2.2x faster than a std::map book on a full day of real Nasdaq data, and running live in the browser through WebAssembly.",
    bullets: [
      "Built the book on a flat tick-indexed array with intrusive per-level queues, 32-byte orders from a preallocated pool, and a three-level occupancy bitmap that finds the next best price in at most three word operations, so the hot path never allocates or walks a tree.",
      "Replayed a full Nasdaq TotalView-ITCH 5.0 session (1.5M AAPL messages) at 27M operations a second, 2.2x faster than a std::map baseline, with exact-percentile latencies of 108 ns p50 per insert and 24 ns per cancel.",
      "Proved the two books agree with differential tests over hundreds of thousands of random operations and mid-session cross-checks on real data: 73 tests, CI on Linux and macOS, plus ASan and UBSan.",
      "Compiled the engine to WebAssembly for a live demo where visitors sweep the book with market orders and run the array-versus-std::map benchmark in their own browser.",
    ],
    tags: ["C++20", "CMake", "GoogleTest", "Google Benchmark", "WebAssembly"],
    demo: {
      label: "Live demo",
      href: "https://raj-rathod-order-book.vercel.app",
    },
    repo: {
      label: "GitHub",
      href: "https://github.com/rajrathod-1/limit-order-book",
    },
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
