import { useState } from "react";
import type { SizeName, ContentMode } from "../../types";
import { SIZE_GROUPS, SIZES } from "../../types";

interface SizePickerProps {
  current: SizeName;
  onChange: (size: SizeName) => void;
  mode: ContentMode;
}

export function SizePicker({ current, onChange, mode }: SizePickerProps) {
  const [open, setOpen] = useState(false);
  const currentInfo = SIZES[current];

  const isFacebookNonSquare = mode === "deck" && current.startsWith("facebook") && current !== "facebook-square";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800 rounded"
      >
        <span>{currentInfo?.label ?? current}</span>
        <span className="text-xs text-neutral-500">{currentInfo?.w}×{currentInfo?.h}</span>
      </button>

      {isFacebookNonSquare && (
        <span className="text-xs text-yellow-400 ml-2">
          Facebook carousels render best with facebook-square (1080×1080).
        </span>
      )}

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 z-30 w-64 max-h-80 overflow-y-auto">
          {SIZE_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                {group.label}
              </div>
              {group.sizes.map((size) => {
                const info = SIZES[size];
                return (
                  <button
                    key={size}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-neutral-700 ${
                      size === current ? "text-teal-400" : "text-neutral-200"
                    }`}
                    onClick={() => { onChange(size); setOpen(false); }}
                  >
                    <span>{info.label}</span>
                    <span className="text-xs text-neutral-500">{info.w}×{info.h}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
