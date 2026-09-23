import React from "react";

interface LinuxHintsCardProps {
  className?: string;
}

const COMMANDS: { cmd: string; hint: string }[] = [
  { cmd: "help", hint: "list every command" },
  { cmd: "ls", hint: "list files here" },
  { cmd: "cd experience", hint: "open a directory" },
  { cmd: "cat experience/citi.txt", hint: "read a file" },
  { cmd: "tree", hint: "see the whole tree" },
  { cmd: "neofetch", hint: "the short version of me" },
  { cmd: "history", hint: "what you have typed" },
  { cmd: "theme dark", hint: "switch the theme" },
  { cmd: "resume", hint: "download my resume" },
];

const KEYS: { keys: string; hint: string }[] = [
  { keys: "Tab", hint: "complete the current word" },
  { keys: "↑ ↓", hint: "walk back through commands" },
  { keys: "/", hint: "jump to the prompt" },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-[0.7rem] text-fog">
    {children}
  </kbd>
);

/** A quiet reference panel beside the terminal. Nothing here animates. */
const LinuxHintsCard: React.FC<LinuxHintsCardProps> = ({ className = "" }) => (
  <div
    className={`rounded-xl border border-line bg-surface p-4 ${className}`}
  >
    <p className="mb-3 font-mono text-[0.7rem] tracking-wide text-mute">
      Try typing
    </p>

    <ul className="mb-4 space-y-2">
      {COMMANDS.map(({ cmd, hint }) => (
        <li key={cmd} className="flex flex-col gap-0.5">
          <Kbd>{cmd}</Kbd>
          <span className="pl-0.5 text-xs text-mute">{hint}</span>
        </li>
      ))}
    </ul>

    <p className="mb-2 font-mono text-[0.7rem] tracking-wide text-mute">
      Keys
    </p>
    <ul className="space-y-2">
      {KEYS.map(({ keys, hint }) => (
        <li key={keys} className="flex items-center gap-2">
          <Kbd>{keys}</Kbd>
          <span className="text-xs text-mute">{hint}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default LinuxHintsCard;
