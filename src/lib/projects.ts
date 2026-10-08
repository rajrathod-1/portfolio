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
      "A typed functional language with closures, algebraic data types and pattern matching, checked by Hindley-Milner inference before it runs, and running live in the browser on Pyodide.",
    bullets: [
      "Wrote the lexer, a recursive-descent parser with OCaml's precedence rules, and an interpreter for a language with closures, algebraic data types, pattern matching and let-polymorphism, in about 2,000 lines of dependency-free Python.",
      "Implemented Hindley-Milner type inference with destructive unification and level-based generalization, rolling back failed unifications so each error shows both types as written and points at the offending expression.",
      "Added exhaustiveness and unused-case checks with Maranget's usefulness algorithm, which name a concrete value that no case matches, such as Triangle _.",
      "Ran the evaluator on an explicit stack with proper tail calls, so recursion 100,000 calls deep works past Python's limit of about 1,000 frames; 99 table-driven test cases plus seven example programs checked against expected output, with CI on Python 3.10 to 3.14.",
    ],
    tags: ["Python", "Pyodide"],
    demo: {
      label: "Live demo",
      href: "https://raj-rathod-mini-ml.vercel.app",
    },
    repo: {
      label: "GitHub",
      href: "https://github.com/rajrathod-1/mini-ml",
    },
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
      "A multithreaded Layer 4 proxy in C++20 with an epoll event loop per worker, least-connections balancing, retries and ejection of failing backends, and per-connection telemetry, load-tested on Linux.",
    bullets: [
      "Wrote a multithreaded Layer 4 TCP proxy for Linux with one epoll event loop per worker and each connection owned by a single worker, so the data path takes no locks; backpressure comes from interest management, half-close is relayed, and shutdown drains open connections.",
      "Added round-robin, least-connections and rendezvous-hash balancing, with passive health checks that retry a refused connect on another backend before the client loses a byte and eject the failing backend; with one of three backends killed mid-run, failed requests fell from 273,434 to 10.",
      "Logged one JSON telemetry line per connection and load-tested with my own load generator to see where throughput dropped and why: one worker relays 250,000 requests a second at 3.9 µs of CPU each, 90% of it in the kernel, and bulk throughput tracks system calls per byte, from 4.5 Gbit/s with 4 KiB buffers to 24 Gbit/s with 16 KiB.",
      "Showed least connections delivering 15 times the throughput of round robin when one backend is slow, with 36 tests including end-to-end runs on real sockets, CI on Linux and macOS under sanitizers, and the balancer compiled to WebAssembly for a live demo.",
    ],
    tags: ["C++20", "epoll", "Linux", "CMake", "GoogleTest", "WebAssembly"],
    demo: {
      label: "Live demo",
      href: "https://raj-rathod-tcp-proxy.vercel.app",
    },
    repo: {
      label: "GitHub",
      href: "https://github.com/rajrathod-1/tcp-proxy",
    },
  },
];
