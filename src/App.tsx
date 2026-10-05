import { useEffect, useRef, useState } from "react";
import type { Frame, World } from "@/world/World";
import { FORMS } from "@/world/form";
import { TOAST_EVENT } from "@/lib/site";
import { Ack, Hero, Matched, Offsets, Stream } from "@/sections";

const NAV = [
  ["#about", "About"],
  ["#experience", "Experience"],
  ["#work", "Projects"],
  ["#contact", "Contact"],
];

export default function App() {
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<World | null>(null);
  const offset = useRef<HTMLSpanElement>(null);
  const chapter = useRef<HTMLSpanElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");

  // The world: built once fonts are in (the name is sampled from one).
  useEffect(() => {
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let instance: World | null = null;
    let cancelled = false;
    let tone = "";
    let shown = -1;
    let paused = false;

    const onFrame = (f: Frame) => {
      if (offset.current)
        offset.current.textContent = (1_048_576 + Math.floor(f.flow * 4211)).toLocaleString("en-US");
      const c = Math.round(f.form);
      if (c !== shown && chapter.current) {
        shown = c;
        chapter.current.textContent = `${String(c).padStart(2, "0")} / ${FORMS[c]}`;
      }
      const t = f.invert > 0.5 ? "paper" : "ink";
      if (t !== tone) root.dataset.tone = tone = t;
      if (f.paused !== paused) root.classList.toggle("is-paused", (paused = f.paused));
    };

    const measure = () =>
      instance?.setBoundaries(
        [...document.querySelectorAll<HTMLElement>("main > section")]
          .slice(1)
          .map((s) => s.getBoundingClientRect().top + window.scrollY)
      );
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    // three.js is most of the bundle: load it alongside the font, after the copy paints.
    const fontIn = Promise.race([
      document.fonts.load('220px "Instrument Serif"'),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
    Promise.all([import("@/world/World"), fontIn]).then(([{ World }]) => {
      if (cancelled || !stage.current) return;
      try {
        instance = world.current = new World(stage.current, onFrame, reduced);
        measure();
      } catch {
        root.classList.add("no-webgl");
      }
      root.classList.add("is-ready");
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      instance?.dispose();
      world.current = null;
      root.classList.remove("is-ready");
    };
  }, []);

  // Copy reveals as it scrolls in, once.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -12% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // A ring that trails the cursor, and controls that lean toward it.
  useEffect(() => {
    let magnet: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      cursor.current?.style.setProperty("transform", `translate(${e.clientX}px, ${e.clientY}px)`);
      const target = e.target as Element;
      document.documentElement.classList.toggle("is-link", !!target.closest?.("a, button, summary"));

      const next = target.closest?.<HTMLElement>(".magnet") ?? null;
      if (magnet && magnet !== next) magnet.style.transform = "";
      magnet = next;
      if (!magnet) return;
      const r = magnet.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      magnet.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    let timer = 0;
    const onToast = (e: Event) => {
      setToast(`Ack · ${(e as CustomEvent<string>).detail}`);
      clearTimeout(timer);
      timer = window.setTimeout(() => setToast(""), 2600);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <>
      <a className="skip mono" href="#about">
        Skip to content
      </a>
      <div className="stage" ref={stage} aria-hidden="true" />
      <p className="mono loader" aria-hidden="true">
        Receiving signal
      </p>

      <header className="hud hud-top">
        <a className="mono" href="#top">
          Raj Rathod
        </a>
        <nav className="mono" aria-label="Sections">
          {NAV.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
      </header>
      <div className="hud hud-bottom mono" aria-hidden="true">
        <span>
          offset <span ref={offset}>1,048,576</span>
        </span>
        <span ref={chapter}>01 / Signal</span>
        <span className="hint">Hold anywhere · pause the stream</span>
      </div>

      <main>
        <Hero />
        <Stream />
        <Offsets />
        <Matched onFocus={(on) => world.current?.setFocus(on)} />
        <Ack onAck={() => world.current?.ack()} />
      </main>

      <p className="mono toast" role="status">
        {toast}
      </p>
      <div className="cursor" ref={cursor} aria-hidden="true" />
    </>
  );
}
