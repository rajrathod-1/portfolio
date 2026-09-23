import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { fileSystem, neofetchLines, treeLines } from "@/lib/filesystem";
import { SITE, downloadResume } from "@/lib/site";
import { getTheme, setTheme } from "@/lib/theme";
import { FOCUS_TERMINAL_EVENT } from "@/lib/events";

interface CommandOutput {
  command: string;
  output: string[];
  directory: string;
}

const COMMANDS = [
  "ls",
  "cat",
  "cd",
  "pwd",
  "clear",
  "help",
  "neofetch",
  "tree",
  "history",
  "theme",
  "resume",
];

const ERROR_PATTERN =
  /command not found|No such file|No such directory|missing file operand|Is a directory/;

/** Colors output the way a shell does: paths blue, files fog, errors red. */
function lineClass(line: string): string {
  const trimmed = line.trim();
  if (ERROR_PATTERN.test(line)) return "text-red";
  if (/^[\w.@-]+\/$/.test(trimmed)) return "text-blue";
  if (trimmed.endsWith(".txt")) return "text-fog";
  return "";
}

const Prompt: React.FC<{ directory: string }> = ({ directory }) => (
  <>
    <span className="text-amber">raj@portfolio</span>
    <span className="text-mute">:</span>
    <span className="text-blue">{directory}</span>
    <span className="text-mute">$</span>
  </>
);

const Caret: React.FC = () => (
  <motion.span
    animate={{ opacity: [0, 1, 0] }}
    transition={{ duration: 1, repeat: Infinity }}
    className="ml-1 inline-block h-4 w-2 bg-amber align-middle"
  />
);

const TerminalNavigation: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [terminalMode, setTerminalMode] = useState<"navigation" | "command">(
    "navigation"
  );
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<CommandOutput[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState("~");
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Just the commands typed this session, for ↑/↓ and `history`. */
  const typedCommands = useMemo(
    () => commandHistory.map((entry) => entry.command),
    [commandHistory]
  );

  const options = useMemo(
    () => [
      {
        label: "View my work experience",
        action: () =>
          document
            .getElementById("experience")
            ?.scrollIntoView({ behavior: "smooth" }),
      },
      {
        label: "Check out what I've built",
        action: () =>
          document
            .getElementById("projects")
            ?.scrollIntoView({ behavior: "smooth" }),
      },
      {
        label: "Connect with me",
        action: () =>
          document
            .getElementById("connect")
            ?.scrollIntoView({ behavior: "smooth" }),
      },
    ],
    []
  );

  /** Switch to the prompt, optionally seeding the keystroke that got us here. */
  const enterCommandMode = (seed = "") => {
    setTerminalMode("command");
    setShowPrompt(false);
    if (seed) setCurrentInput((prev) => prev + seed);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /** Only scrolls when the prompt is actually off screen. */
  const revealTerminal = () => {
    const input = inputRef.current;
    if (!input) return;
    const { top, bottom } = input.getBoundingClientRect();
    const offScreen = top < 64 || bottom > window.innerHeight - 16;
    if (offScreen) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    const focusFromEvent = () => {
      enterCommandMode();
      setTimeout(revealTerminal, 0);
    };
    window.addEventListener(FOCUS_TERMINAL_EVENT, focusFromEvent);
    return () =>
      window.removeEventListener(FOCUS_TERMINAL_EVENT, focusFromEvent);
  }, []);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Handle numeric shortcuts for Quick Actions
    if (["1", "2", "3"].includes(trimmed)) {
      const index = parseInt(trimmed) - 1;
      if (options[index]) {
        options[index].action();
        setCommandHistory((prev) => [
          ...prev,
          {
            command: trimmed,
            output: [`Navigating to ${options[index].label}...`],
            directory: currentDirectory,
          },
        ]);
        setCurrentInput("");
        return;
      }
    }

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    let output: string[] = [];

    switch (command) {
      case "help":
        output = [
          "Available Commands:",
          "  ls [dir]        - List files in directory",
          "  cat <file>      - Display file contents",
          "  cd <dir>        - Change directory",
          "  pwd             - Print working directory",
          "  clear           - Clear terminal",
          "  tree            - Show the whole file system",
          "  neofetch        - Show a summary of who I am",
          "  history         - List commands from this session",
          "  theme [light|dark] - Switch the site theme",
          "  resume          - Download my resume",
          "",
          "Directories: experience/, projects/, technologies/, contact/",
          "",
          "Examples:",
          "  cd experience",
          "  ls",
          "  cat proofpoint.txt",
          "  cd ..",
          "",
          "💡 Press TAB for autocomplete",
        ];
        break;

      case "clear":
        setCommandHistory([]);
        setCurrentInput("");
        // Scroll to top of the terminal section
        setTimeout(() => {
          const terminalSection = document.querySelector("#home");
          if (terminalSection) {
            terminalSection.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 0);
        return;

      case "cd":
        if (args.length === 0) {
          setCurrentDirectory("~");
          output = [];
        } else {
          const target = args[0].replace(/\/$/, "");
          if (target === ".." || target === "~") {
            setCurrentDirectory("~");
            output = [];
          } else if (fileSystem[target as keyof typeof fileSystem]) {
            setCurrentDirectory(target);
            output = [];
          } else {
            output = [`cd: ${args[0]}: No such directory`];
          }
        }
        break;

      case "ls":
        if (currentDirectory === "~") {
          if (args.length === 0) {
            output = [
              "experience/",
              "projects/",
              "technologies/",
              "contact/",
            ];
          } else {
            const dir = args[0].replace(/\/$/, "");
            if (fileSystem[dir as keyof typeof fileSystem]) {
              output = Object.keys(fileSystem[dir as keyof typeof fileSystem]);
            } else {
              output = [`ls: ${args[0]}: No such file or directory`];
            }
          }
        } else {
          // Already in a directory
          const directory =
            fileSystem[currentDirectory as keyof typeof fileSystem];
          if (directory) {
            output = Object.keys(directory);
          }
        }
        break;

      case "cat":
        if (args.length === 0) {
          output = [
            "cat: missing file operand",
            "Try 'cat <file>' or use 'ls' to see available files",
          ];
        } else {
          let path = args[0];

          // If we're in a subdirectory and path doesn't contain /, prepend current dir
          if (currentDirectory !== "~" && !path.includes("/")) {
            path = `${currentDirectory}/${path}`;
          }

          // Check if it's just a directory
          if (fileSystem[path.replace(/\/$/, "") as keyof typeof fileSystem]) {
            const dir = path.replace(/\/$/, "");
            output = [
              `cat: ${path}: Is a directory`,
              `Available files in ${dir}/:`,
              ...Object.keys(fileSystem[dir as keyof typeof fileSystem]),
              "",
              `Try: cat ${dir}/<filename>`,
            ];
          } else {
            const pathParts = path.split("/");
            if (pathParts.length === 2) {
              const [dir, file] = pathParts;
              const directory = fileSystem[dir as keyof typeof fileSystem];
              if (directory && directory[file as keyof typeof directory]) {
                output = (
                  directory[file as keyof typeof directory] as string
                ).split("\n");
              } else if (directory) {
                output = [
                  `cat: ${path}: No such file`,
                  `Available files in ${dir}/:`,
                  ...Object.keys(directory),
                ];
              } else {
                output = [`cat: ${path}: No such file or directory`];
              }
            } else if (pathParts.length === 1 && currentDirectory !== "~") {
              // Single file in current directory
              const directory =
                fileSystem[currentDirectory as keyof typeof fileSystem];
              if (directory && directory[path as keyof typeof directory]) {
                output = (
                  directory[path as keyof typeof directory] as string
                ).split("\n");
              } else {
                output = [
                  `cat: ${path}: No such file`,
                  `Available files:`,
                  ...Object.keys(directory),
                ];
              }
            } else {
              output = [
                `cat: ${path}: No such file or directory`,
                "Use format: cat <directory>/<file>",
                "Example: cat experience/proofpoint.txt",
              ];
            }
          }
        }
        break;

      case "pwd":
        output =
          currentDirectory === "~"
            ? ["/home/raj/portfolio"]
            : [`/home/raj/portfolio/${currentDirectory}`];
        break;

      case "tree":
        output = treeLines();
        break;

      case "neofetch":
        output = neofetchLines();
        break;

      case "history":
        output = typedCommands.length
          ? typedCommands.map(
              (entry, i) => `  ${String(i + 1).padStart(3, " ")}  ${entry}`
            )
          : ["No commands yet this session"];
        break;

      case "theme": {
        const requested = args[0]?.toLowerCase();
        if (requested && requested !== "light" && requested !== "dark") {
          output = [
            `theme: ${args[0]}: No such theme`,
            "Usage: theme [light|dark]",
          ];
          break;
        }
        const next =
          (requested as "light" | "dark" | undefined) ??
          (getTheme() === "dark" ? "light" : "dark");
        setTheme(next);
        output = [`Theme set to ${next}`];
        break;
      }

      case "resume":
        downloadResume();
        output = [
          `Downloading ${SITE.resumeFile}...`,
          "If the download did not start, use the link in the Connect section.",
        ];
        break;

      default:
        output = [
          `bash: ${command}: command not found`,
          "Type 'help' for available commands",
        ];
    }

    setCommandHistory((prev) => [
      ...prev,
      { command: trimmed, output, directory: currentDirectory },
    ]);
    setCurrentInput("");
    setHistoryIndex(null);
  };

  /**
   * Candidate completions for the current input. Shared by Tab and the ghost
   * preview so the two can never disagree.
   */
  const completionsFor = (input: string): string[] => {
    const parts = input.split(/\s+/);
    const command = parts[0];
    const arg = parts[parts.length - 1] || "";

    let completions: string[] = [];

    if (parts.length === 1 && !input.endsWith(" ")) {
      // Complete command names
      completions = COMMANDS.filter((cmd) => cmd.startsWith(command));
    } else {
      const cmd = parts[0].toLowerCase();

      if (cmd === "cd") {
        // Complete directory names for cd
        const dirs = Object.keys(fileSystem).filter((d) => d.startsWith(arg));
        if (arg === "" || arg === ".") {
          completions = ["..", ...dirs.map((d) => `${d}/`)];
        } else {
          completions = dirs.map((d) => `${d}/`);
        }
      } else if (cmd === "ls" || cmd === "cat") {
        // If we're in a subdirectory and no path separator, complete files in current dir
        if (currentDirectory !== "~" && !arg.includes("/")) {
          const directory =
            fileSystem[currentDirectory as keyof typeof fileSystem];
          if (directory) {
            completions = Object.keys(directory).filter((f) =>
              f.startsWith(arg)
            );
          }
        } else if (arg.includes("/")) {
          // Complete file in specified directory
          const [dir, filePrefix] = arg.split("/");
          const directory = fileSystem[dir as keyof typeof fileSystem];
          if (directory) {
            completions = Object.keys(directory)
              .filter((f) => f.startsWith(filePrefix))
              .map((f) => `${dir}/${f}`);
          }
        } else {
          // Complete directory names
          completions = Object.keys(fileSystem)
            .filter((d) => d.startsWith(arg))
            .map((d) => `${d}/`);
        }
      }
    }

    return completions;
  };

  /** The faint remainder Tab would accept, shown after the caret. */
  const ghostSuffix = useMemo(() => {
    if (!currentInput || currentInput.endsWith(" ")) return "";
    const parts = currentInput.split(/\s+/);
    const arg = parts[parts.length - 1] || "";
    const completions = completionsFor(currentInput);
    if (completions.length !== 1) return "";
    const only = completions[0];
    return only.startsWith(arg) ? only.slice(arg.length) : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInput, currentDirectory]);

  const handleTabCompletion = () => {
    const parts = currentInput.split(/\s+/);
    const arg = parts[parts.length - 1] || "";
    const completions = completionsFor(currentInput);

    // Apply completion
    if (completions.length === 1) {
      // Single match - complete it
      const beforeLastWord = parts.slice(0, -1).join(" ");
      const separator = beforeLastWord ? " " : "";
      const addSpace =
        !completions[0].endsWith("/") && parts[0].toLowerCase() !== "cd";
      setCurrentInput(
        beforeLastWord + separator + completions[0] + (addSpace ? " " : "")
      );
    } else if (completions.length > 1) {
      // Multiple matches - find common prefix
      const commonPrefix = completions.reduce((acc, curr) => {
        let i = 0;
        while (i < acc.length && i < curr.length && acc[i] === curr[i]) {
          i++;
        }
        return acc.substring(0, i);
      });

      if (commonPrefix.length > arg.length) {
        const beforeLastWord = parts.slice(0, -1).join(" ");
        const separator = beforeLastWord ? " " : "";
        setCurrentInput(beforeLastWord + separator + commonPrefix);
      } else {
        // Show all options
        setCommandHistory((prev) => [
          ...prev,
          {
            command: currentInput,
            output: completions,
            directory: currentDirectory,
          },
        ]);
      }
    }
  };

  /** ↑/↓ walk previously typed commands, newest first. */
  const recallHistory = (direction: "up" | "down") => {
    if (!typedCommands.length) return;

    if (direction === "up") {
      const next =
        historyIndex === null
          ? typedCommands.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setCurrentInput(typedCommands[next]);
      return;
    }

    if (historyIndex === null) return;
    const next = historyIndex + 1;
    if (next >= typedCommands.length) {
      setHistoryIndex(null);
      setCurrentInput("");
      return;
    }
    setHistoryIndex(next);
    setCurrentInput(typedCommands[next]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoadComplete(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Never steal keystrokes from a real field: the prompt itself, the
      // command palette's search box, anything else focused.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // While the numbered menu is up, its keys keep priority.
      if (terminalMode === "navigation" && !isComplete) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + options.length) % options.length
          );
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % options.length);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          setShowPrompt(false);
          setIsComplete(true);
          options[selectedIndex].action();
          return;
        }
        if (e.key >= "1" && e.key <= "3") {
          e.preventDefault();
          setSelectedIndex(parseInt(e.key) - 1);
          return;
        }
      }

      // Anywhere else on the page, typing a character goes straight to the
      // prompt, with that first keystroke kept. "/" opens it empty, and space
      // is left alone so it still scrolls the page.
      if (e.key === "/") {
        e.preventDefault();
        enterCommandMode();
        setTimeout(revealTerminal, 0);
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        enterCommandMode();
        setTimeout(revealTerminal, 0);
        return;
      }
      if (e.key.length === 1 && e.key !== " ") {
        e.preventDefault();
        enterCommandMode(e.key);
        setTimeout(revealTerminal, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
     
  }, [selectedIndex, isComplete, options, terminalMode]);

  if (isComplete && terminalMode === "navigation" && !commandHistory.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex items-center"
      >
        <Prompt directory="~" />
        <Caret />
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="w-full"
        aria-live="polite"
        aria-label="Terminal output"
        role="log"
      >
        {commandHistory.map((entry, index) => (
          <div key={index} className="mb-3">
            <div className="mb-1 flex flex-wrap items-center gap-x-1">
              <Prompt directory={entry.directory} />
              <span className="ml-1 text-fog">{entry.command}</span>
            </div>
            <div className="whitespace-pre-wrap break-words pl-4 text-fog/90">
              {entry.output.map((line, i) => (
                <div key={i} className={lineClass(line)}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {terminalMode === "command" && (
        <div className="mb-4 flex items-center gap-x-1">
          <Prompt directory={currentDirectory} />
          <label htmlFor="terminal-input" className="sr-only">
            Terminal input. Type help and press Enter for a list of commands.
          </label>
          {/* The ghost layer sits under a transparent input, same metrics. */}
          <div className="relative ml-1 min-w-0 flex-1">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre"
            >
              <span className="invisible">{currentInput}</span>
              <span className="text-mute">{ghostSuffix}</span>
            </div>
            <input
              id="terminal-input"
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  executeCommand(currentInput);
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  handleTabCompletion();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  recallHistory("up");
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  recallHistory("down");
                }
              }}
              className="relative w-full bg-transparent p-0 text-fog caret-amber outline-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {terminalMode === "navigation" && (
        <>
          {showPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.3, duration: 0.5 }}
              className="mb-4 text-fog"
            >
              Where would you like to go first?
            </motion.div>
          )}

          {!isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.8, duration: 0.5 }}
              className="mb-6"
            >
              <div className="w-full max-w-lg">
                {options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    className="mb-1 flex w-full items-center rounded pl-4 text-left"
                    onClick={() => {
                      setSelectedIndex(index);
                      setShowPrompt(false);
                      setIsComplete(true);
                      option.action();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span
                      className={
                        selectedIndex === index
                          ? "mr-2 text-amber"
                          : "mr-2 text-transparent"
                      }
                    >
                      ❯
                    </span>
                    <span className="mr-3 text-blue">{index + 1}.</span>
                    <span
                      className={
                        selectedIndex === index
                          ? "font-semibold text-amber"
                          : "text-fog"
                      }
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
                <div className="mb-6 mt-3 pl-4 text-xs text-mute">
                  Use ↑↓ arrow keys or type 1-3 to navigate, Enter to select, or
                  start typing commands
                </div>

                {/* Prompt line in navigation mode when not complete */}
                <div className="mt-2 flex items-center">
                  <Prompt directory={currentDirectory} />
                  <Caret />
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {terminalMode === "command" && isInitialLoadComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <div className="mb-2 text-sm text-mute">Quick Actions:</div>
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              className="mb-1 flex w-full items-center rounded pl-4 text-left"
              onClick={() => option.action()}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span
                className={
                  selectedIndex === index
                    ? "mr-2 text-amber"
                    : "mr-2 text-transparent"
                }
              >
                ❯
              </span>
              <span className="mr-3 text-blue">{index + 1}.</span>
              <span className="text-fog">{option.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default TerminalNavigation;
