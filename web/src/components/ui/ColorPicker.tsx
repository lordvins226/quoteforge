interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
      />
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="text-xs text-neutral-500 font-mono">{value}</span>
    </label>
  );
}
