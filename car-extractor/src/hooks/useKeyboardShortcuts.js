import { useEffect, useCallback } from "react";

/**
 * useKeyboardShortcuts — registers global keyboard shortcuts.
 *
 * Shortcuts:
 *   /        — focus URL input (like GitHub / search)
 *   Ctrl+K   — focus URL input
 *   Ctrl+S   — save current result
 *   Ctrl+E   — run / re-analyze
 *   1/2/3    — switch main tabs (Search / Filters / Database)
 *   ?        — open keyboard shortcut cheatsheet
 *   H        — open history drawer
 *   Escape   — close any open overlay
 *
 * All shortcuts are disabled when focus is inside an input/select/textarea.
 */
export function useKeyboardShortcuts({
  onFocusUrl,
  onSave,
  onRun,
  onTabSwitch,    // (tabKey: string) => void
  onToggleHelp,
  onToggleHistory,
}) {
  const isFocusingInput = useCallback(() => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K  or  /  → focus URL bar
      if ((e.ctrlKey && e.key === "k") || (!isFocusingInput() && e.key === "/")) {
        e.preventDefault();
        onFocusUrl?.();
        return;
      }

      // Ctrl+S → save
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Ctrl+Enter → run analysis
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        onRun?.();
        return;
      }

      // When not focused on an input, allow single-key shortcuts
      if (isFocusingInput()) return;

      switch (e.key) {
        case "1": onTabSwitch?.("search");   break;
        case "2": onTabSwitch?.("filters");  break;
        case "3": onTabSwitch?.("database"); break;
        case "?": onToggleHelp?.();          break;
        case "h":
        case "H": onToggleHistory?.();       break;
        default: break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFocusingInput, onFocusUrl, onSave, onRun, onTabSwitch, onToggleHelp, onToggleHistory]);
}

export const SHORTCUT_DEFINITIONS = [
  { key: "/  or  Ctrl+K", label: "Skup na pole URL" },
  { key: "Ctrl+Enter",    label: "Analizuj ogłoszenie" },
  { key: "Ctrl+S",        label: "Zapisz w bazie" },
  { key: "1",             label: 'Przełącz na „Wyszukaj"' },
  { key: "2",             label: 'Przełącz na „Filtry"' },
  { key: "3",             label: 'Przełącz na „Baza pojazdów"' },
  { key: "H",             label: "Otwórz historię wyszukiwań" },
  { key: "?",             label: "Ten panel pomocy" },
  { key: "Escape",        label: "Zamknij panel / szufladę" },
];
