import React, { useRef } from "react";
import { MotionConfig, motion, useInView } from "framer-motion";
import Navbar from "@/scenes/navbar";
import Experience from "@/scenes/experience";
import Projects from "@/scenes/projects";
import ToolsSection from "@/scenes/tools";
import CreativeAdditions from "@/components/CreativeAdditions";
import Hero from "@/components/Hero";
import Connect from "@/components/Connect";
import CommandPalette from "@/components/CommandPalette";
import Toast from "@/components/Toast";
import SectionHeading from "@/components/SectionHeading";

/** Fades a section in once, on entry. Nothing fades back out on the way past. */
const AnimatedSection: React.FC<{
  id: string;
  children: React.ReactNode;
  className?: string;
}> = ({ id, children, className = "" }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const App: React.FC = () => (
  <MotionConfig reducedMotion="user">
    <div className="app">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:border focus:border-line focus:bg-surface focus:px-3 focus:py-2 focus:font-mono focus:text-sm focus:text-fog"
      >
        Skip to content
      </a>

      <CreativeAdditions />
      <Navbar />
      <CommandPalette />
      <Toast />

      <main id="main">
        <AnimatedSection
          id="home"
          className="flex min-h-[85vh] flex-col items-center justify-center px-4 pt-20 sm:px-6 lg:px-8"
        >
          <Hero />
        </AnimatedSection>

        <AnimatedSection id="experience" className="px-4 pt-32 sm:px-6 lg:px-8">
          <Experience />
        </AnimatedSection>

        <AnimatedSection
          id="projects"
          className="mx-auto mt-24 max-w-[1600px] px-4 pb-20 pt-32 sm:px-6 lg:px-8"
        >
          <div className="mb-10 flex justify-center">
            <SectionHeading path="~/projects" label="Projects" />
          </div>
          <Projects />
        </AnimatedSection>

        <ToolsSection />

        <AnimatedSection id="connect" className="relative mt-20 pt-32">
          <Connect />
        </AnimatedSection>
      </main>
    </div>
  </MotionConfig>
);

export default App;
