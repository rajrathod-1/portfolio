import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { SITE, copyEmail, downloadResume } from "@/lib/site";
import { setTheme, getTheme } from "@/lib/theme";
import { OPEN_PALETTE_EVENT, focusTerminal } from "@/lib/events";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const onOpen = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  /** Close first, then act, so focus lands where the action expects it. */
  const run = (action: () => void) => {
    setOpen(false);
    window.setTimeout(action, 0);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      // cmdk puts `className` on the Command element, so the backdrop and the
      // positioning wrapper have to be styled through their own props.
      overlayClassName="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[12vh] z-[71] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2"
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
    >
      <div>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <span aria-hidden="true" className="font-mono text-sm text-amber">
            ❯
          </span>
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full bg-transparent py-3.5 font-mono text-sm text-fog caret-amber outline-none placeholder:text-mute"
          />
        </div>

        <Command.List className="scroll-slim max-h-[19rem] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center font-mono text-xs text-mute">
            No matching command
          </Command.Empty>

          <Command.Group
            heading="Go to"
            className="font-mono text-[0.7rem] text-mute [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1"
          >
            <Item onSelect={() => run(() => scrollToSection("home"))}>
              Home
            </Item>
            <Item onSelect={() => run(() => scrollToSection("experience"))}>
              Experience
            </Item>
            <Item onSelect={() => run(() => scrollToSection("projects"))}>
              Projects
            </Item>
            <Item onSelect={() => run(() => scrollToSection("connect"))}>
              Connect
            </Item>
          </Command.Group>

          <Command.Group
            heading="Actions"
            className="font-mono text-[0.7rem] text-mute [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1"
          >
            <Item onSelect={() => run(focusTerminal)}>Focus terminal</Item>
            <Item
              onSelect={() =>
                run(() =>
                  // Reveal from the middle of the screen: there is no button to
                  // start from when the palette triggered it.
                  setTheme(getTheme() === "dark" ? "light" : "dark", {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                  })
                )
              }
            >
              Toggle theme
            </Item>
            <Item onSelect={() => run(copyEmail)}>Copy email</Item>
            <Item onSelect={() => run(downloadResume)}>Download resume</Item>
            <Item
              onSelect={() =>
                run(() => window.open(SITE.github, "_blank", "noopener"))
              }
            >
              Open GitHub
            </Item>
            <Item
              onSelect={() =>
                run(() => window.open(SITE.linkedin, "_blank", "noopener"))
              }
            >
              Open LinkedIn
            </Item>
            <Item
              onSelect={() =>
                run(() => window.open(SITE.leetcode, "_blank", "noopener"))
              }
            >
              Open LeetCode
            </Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center gap-3 border-t border-line px-4 py-2 font-mono text-[0.7rem] text-mute">
          <span>
            <kbd className="text-fog">↑↓</kbd> move
          </span>
          <span>
            <kbd className="text-fog">↵</kbd> select
          </span>
          <span>
            <kbd className="text-fog">esc</kbd> close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
};

const Item: React.FC<{
  children: React.ReactNode;
  onSelect: () => void;
}> = ({ children, onSelect }) => (
  <Command.Item
    onSelect={onSelect}
    className="cursor-pointer rounded-md border-l-2 border-transparent px-2.5 py-2 font-mono text-sm text-fog data-[selected=true]:border-l-amber data-[selected=true]:bg-blue/10 data-[selected=true]:text-blue"
  >
    {children}
  </Command.Item>
);

export default CommandPalette;
