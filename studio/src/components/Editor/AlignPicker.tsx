type Align = "top" | "center" | "bottom" | "spread";
const OPTIONS: { value: Align; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
  { value: "spread", label: "Spread" },
];

interface AlignPickerProps {
  current: Align | undefined;
  onChange: (align: Align) => void;
}

export function AlignPicker({ current, onChange }: AlignPickerProps) {
  const active = current ?? "center";
  return (
    <div className="flex items-center gap-0.5 bg-neutral-800 rounded p-0.5" role="group" aria-label="Vertical alignment">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={active === opt.value}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            active === opt.value ? "bg-neutral-700 text-teal-400" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
