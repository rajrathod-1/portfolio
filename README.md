# Raj Rathod — portfolio

A personal portfolio built around a terminal you can actually type in. The hero
is a working shell: `ls`, `cd`, `cat` and Tab completion all behave the way you
would expect, and the files it browses are the same data that renders the rest
of the page.

Built with React 19, TypeScript, Vite 6 and Tailwind CSS 4. No backend.

## Try it

Start typing anywhere on the page — the first keystroke jumps to the prompt.

```
help                        list every command
ls                          experience/  projects/  technologies/  contact/
cd experience               change directory
cat citi.txt                read a file
tree                        print the whole file system
neofetch                    the short version of me
history                     commands from this session
theme light|dark            switch the site theme
resume                      download my resume
```

Tab completes, ↑/↓ walk back through history, `/` jumps to the prompt, and
<kbd>⌘K</kbd> (<kbd>Ctrl K</kbd> elsewhere) opens a command palette.

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
| `npm test` | Unit tests for date-status and chart geometry |
| `npm run smoke` | Server-renders the app and asserts its content |

## How it is put together

```
src/
├── App.tsx                 page shell: sections, skip link, motion config
├── main.tsx                entry point
├── index.css               ANSI colour tokens, fonts, focus styles
├── components/
│   ├── Hero.tsx            terminal window, name animation, status pill
│   ├── Terminal.tsx        the shell: commands, completion, history
│   ├── CommandPalette.tsx  ⌘K palette (cmdk)
│   ├── ProjectDiagram.tsx  per-project architecture sketches
│   ├── Connect.tsx         contact links, copy email, resume
│   ├── SectionHeading.tsx  headings that type themselves as prompts
│   ├── Neko.tsx            cursor-following cat (see Credits)
│   └── …                   custom cursor, floating shapes, toast
├── scenes/
│   ├── navbar.tsx          sticky bar, scroll progress, theme toggle
│   ├── experience.tsx      career timeline chart + entry list
│   ├── projects.tsx        bento grid and spotlight views
│   └── tools.tsx           grouped skills
└── lib/
    ├── experience.ts       career data — single source of truth
    ├── projects.ts         project data, and the terminal's projects/ files
    ├── filesystem.ts       the fake file system the shell browses
    ├── status.ts           Upcoming / Current / Completed from dates
    ├── chart.ts            timeline geometry
    └── theme.ts            theme switching + circular reveal
```

Two ideas hold the thing together:

**One source of truth per kind of content.** `lib/experience.ts` and
`lib/projects.ts` feed both the rendered page and the terminal's file system, so
`cat experience/citi.txt` and the timeline card can never disagree.

**Dates decide status, not hard-coded labels.** A role is Upcoming, Current or
Completed based on its start and end months compared with today, so the page
stays accurate without being edited. See `lib/status.ts`.

## Design

The palette is an ANSI terminal theme where colour carries meaning, the way it
does in a shell: blue for paths and links, amber for the prompt and cursor,
green for status, red for errors, violet for highlights. Colours are CSS
variables exposed to Tailwind through `@theme inline`, so utilities like
`bg-surface` and `text-mute` follow the theme. Both themes meet WCAG AA contrast.

Type is Martian Mono for anything shell-like and Instrument Sans for prose, both
self-hosted via Fontsource.

Switching themes uses the View Transitions API for a circular reveal from the
toggle, falling back to an instant swap where that is unsupported or when
`prefers-reduced-motion` is set. Motion throughout is feedback for what the
visitor did, not decoration, and it all respects reduced-motion preferences.

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Framer Motion 12 ·
Recharts (timeline) · cmdk (command palette) · lucide-react and react-icons

## Credits

- The cursor-following cat is a React port of
  [oneko.js](https://github.com/adryd325/oneko.js) by adryd, MIT licensed. The
  sprite sheet (`public/oneko.gif`) comes from that project; a copy of its
  licence is in [`licenses/`](licenses/oneko.js-LICENSE.txt).
- The Citi logo is the official mark, via
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Citi.svg).

## Contact

- Email: [rathodraj725@gmail.com](mailto:rathodraj725@gmail.com)
- LinkedIn: [linkedin.com/in/raj-rathod1](https://linkedin.com/in/raj-rathod1)
- GitHub: [github.com/rajrathod-1](https://github.com/rajrathod-1)
- LeetCode: [leetcode.com/u/popple_1](https://leetcode.com/u/popple_1)
