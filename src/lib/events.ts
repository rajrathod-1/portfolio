/** Cross-component signals, kept out of component files so fast refresh works. */

export const FOCUS_TERMINAL_EVENT = "terminal:focus";
export const OPEN_PALETTE_EVENT = "palette:open";

export function focusTerminal() {
  window.dispatchEvent(new Event(FOCUS_TERMINAL_EVENT));
}

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

function isMac() {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.userAgent)
  );
}

export function paletteShortcutLabel() {
  return isMac() ? "⌘K" : "Ctrl K";
}
