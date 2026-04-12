import { useState, useEffect, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import type { Theme } from "../../types";
import { ThemeEditorModal } from "./ThemeEditorModal";

interface ThemePickerProps {
  current: string;
  onChange: (name: string) => void;
}

export function ThemePicker({ current, onChange }: ThemePickerProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadThemes = useCallback(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => setThemes(data as Theme[]))
      .catch(() => setThemes([]));
  }, []);

  useEffect(() => { loadThemes(); }, [loadThemes]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const currentTheme = themes.find((t) => t.name === current);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
      >
        {currentTheme && (
          <span
            className="w-3 h-3 rounded-full border border-neutral-600"
            style={{ backgroundColor: currentTheme.colors.accent }}
          />
        )}
        <span>{current}</span>
      </button>

      {open && (
        <div role="listbox" aria-label="Select theme" className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 z-30 w-52 max-h-80 overflow-y-auto">
          {themes.map((theme) => (
            <button
              key={theme.name}
              role="option"
              aria-selected={theme.name === current}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-700 transition-colors ${
                theme.name === current ? "text-teal-400" : "text-neutral-200"
              }`}
              onClick={() => { onChange(theme.name); setOpen(false); }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.background }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
              <span className="flex-1">{theme.displayName}</span>
            </button>
          ))}
          <div className="border-t border-neutral-700 mt-1 pt-1">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors"
              onClick={() => { setOpen(false); setEditorOpen(true); }}
            >
              <Plus size={14} />
              <span>New Theme</span>
            </button>
          </div>
        </div>
      )}

      <ThemeEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onCreated={(name) => {
          loadThemes();
          onChange(name);
        }}
      />
    </div>
  );
}
