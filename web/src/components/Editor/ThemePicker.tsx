import { useState, useEffect } from "react";
import type { Theme } from "../../types";

interface ThemePickerProps {
  current: string;
  onChange: (name: string) => void;
}

export function ThemePicker({ current, onChange }: ThemePickerProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => setThemes(data as Theme[]))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800 rounded"
      >
        {themes.find((t) => t.name === current) && (
          <span
            className="w-3 h-3 rounded-full border border-neutral-600"
            style={{ backgroundColor: themes.find((t) => t.name === current)?.colors.accent }}
          />
        )}
        <span>{current}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 z-30 w-52">
          {themes.map((theme) => (
            <button
              key={theme.name}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-700 ${
                theme.name === current ? "text-teal-400" : "text-neutral-200"
              }`}
              onClick={() => { onChange(theme.name); setOpen(false); }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.background }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
              <span className="flex-1">{theme.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
