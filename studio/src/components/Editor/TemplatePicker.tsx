import { useState } from "react";
import { TEMPLATE_FAMILIES, TEMPLATES } from "../../types";

interface TemplatePickerProps {
  current: string;
  onChange: (template: string) => void;
}

export function TemplatePicker({ current, onChange }: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const currentInfo = TEMPLATES[current];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
      >
        <span>{currentInfo?.label ?? current}</span>
      </button>

      {open && (
        <div role="listbox" aria-label="Select template" className="absolute top-full left-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 z-30 w-72 max-h-96 overflow-y-auto">
          {TEMPLATE_FAMILIES.map((family) => (
            <div key={family.label}>
              <div className="px-3 py-1.5 text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                {family.label}
              </div>
              {family.templates.map((tpl) => (
                <button
                  key={tpl.name}
                  className={`w-full text-left px-3 py-1.5 hover:bg-neutral-700 ${
                    tpl.name === current ? "text-teal-400" : "text-neutral-200"
                  }`}
                  onClick={() => { onChange(tpl.name); setOpen(false); }}
                >
                  <span className="block text-sm">{tpl.label}</span>
                  <span className="block text-xs text-neutral-500">{tpl.blurb}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
