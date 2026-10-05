# Raj Rathod — Signal / Noise

A portfolio told through a single medium: about 64,000 particles, each one a
"message", rendered by one Three.js shader. As you scroll, the same particles
reorganise into five states. Together they tell the story of someone who builds
event streams, matching engines and proxies.

| Chapter | The particles become | The page shows |
| --- | --- | --- |
| 01 Signal | static that resolves into the name | role, status |
| 02 Stream | lanes of packets, like partitions of a topic | about, tools |
| 03 Offsets | a tunnel the camera flies inside | every role, oldest first |
| 04 Matched | two sides of an order book colliding, on paper | projects |
| 05 Ack | a single orb with a disk | contact |

Things to find:

- **The cursor is wind.** Particles part around it in every chapter.
- **Hold the mouse anywhere** (not on a link) and the stream freezes. Move
  while holding to orbit the frozen frame. Let go and it rushes to catch up.
- **Scroll speed is throughput.** Scroll fast and the stream runs hot and the
  frame tears at the edges.
- **The world flips to paper** for Matched. Each matched pair flashes vermilion.
- **Click the email** and the final orb blows apart, then pulls itself back together.

## Running it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the whole project |
| `npm test` | Unit tests for date status and the scroll → formation mapping |
| `npm run smoke` | Server-renders the app and asserts its content |

## How it is put together

```
src/
├── App.tsx            HUD, cursor, reveals; mounts the world
├── sections.tsx       the five chapters' copy, rendered from lib/
├── index.css          tokens, type, layout, the paper flip
├── world/
│   ├── World.ts       renderer, camera choreography, input, resize, cleanup
│   ├── shaders.ts     the six formations + post pass (inversion, grain, split)
│   ├── form.ts        scroll position → formation (tested)
│   └── text.ts        samples the name's glyphs into particle targets
└── lib/
    ├── experience.ts  roles — single source of truth
    ├── projects.ts    projects
    ├── status.ts      Upcoming / Current / Completed from dates
    └── site.ts        contact details, copy-email
```

**Every formation is a pure function of a particle's random seed and a clock.**
There is no simulation state on the CPU. A morph mixes two formations, staggered
per particle so it ripples through the cloud. The "hold to pause" works by
stopping the clock that every formation reads.

**Scroll drives the story, but never hijacks it.** Native scrolling is untouched.
Each section boundary adds one formation, morphing over a single viewport
height centred on the boundary (`world/form.ts`). Long sections hold still, and
the camera eases toward the target.

**The paper inversion is a post pass,** `paper + ink − colour`, applied channel
by channel. The background lands exactly on paper, and the shader pre-inverts the
vermilion so it still reads as vermilion after the flip.

## Robustness

- three.js loads lazily, alongside the display font, after the copy has painted.
- 26k particles on small or low-core devices, 64k elsewhere. Pixel ratio is
  capped at 1.75, and drops to 1 automatically if the first seconds after the
  intro run slow.
- On portrait screens the camera keeps its horizontal field of view, and
  formations that sit behind copy are thinned.
- Without WebGL, the name renders as type and the page works as a plain
  editorial site.
- `prefers-reduced-motion` skips the intro, slows the stream, removes the
  chromatic split and shows all copy immediately.
- The canvas is `aria-hidden`; every word on the page is real, selectable DOM.

## Design

Ink `#0b0b0c`, paper `#ebe7df`, one signal colour: vermilion `#ff4b1f`
(darkened to `#b3300e` on paper for contrast). The type is Instrument Serif for
display, Instrument Sans for prose and Martian Mono for the HUD, all
self-hosted via Fontsource. The HUD and cursor use `mix-blend-mode: difference`,
so they stay legible on ink, on paper and over particles.

## Contact

- Email: [rajrathod2323@gmail.com](mailto:rajrathod2323@gmail.com)
- LinkedIn: [linkedin.com/in/raj-rathod1](https://linkedin.com/in/raj-rathod1)
- GitHub: [github.com/rajrathod-1](https://github.com/rajrathod-1)
- LeetCode: [leetcode.com/u/popple_1](https://leetcode.com/u/popple_1)
