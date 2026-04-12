import type { Block, Part, LabeledItem, PartStyle } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Plus, Trash2 } from "lucide-react";

const PART_STYLES: { value: PartStyle; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "accent", label: "Accent" },
  { value: "accent-italic", label: "Accent Italic" },
  { value: "mono", label: "Mono" },
  { value: "muted", label: "Muted" },
];

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
}

function PartsEditor({ parts, onChange }: { parts: Part[]; onChange: (parts: Part[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-neutral-400">Parts</span>
      {parts.map((part, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            value={part.text}
            onChange={(e) => {
              const updated = [...parts];
              updated[i] = { ...part, text: e.target.value };
              onChange(updated);
            }}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
          />
          <select
            value={part.style}
            onChange={(e) => {
              const updated = [...parts];
              updated[i] = { ...part, style: e.target.value as PartStyle };
              onChange(updated);
            }}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-300"
          >
            {PART_STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={() => onChange(parts.filter((_, j) => j !== i))}>
            <Trash2 size={12} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onChange([...parts, { text: "", style: "normal" }])}>
        <Plus size={12} className="mr-1" /> Add Part
      </Button>
    </div>
  );
}

function ItemsEditor({ items, onChange }: { items: LabeledItem[]; onChange: (items: LabeledItem[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-neutral-400">Items</span>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            value={item.label}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = { ...item, label: e.target.value };
              onChange(updated);
            }}
            placeholder="Label"
            className="w-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
          />
          <input
            value={item.text}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = { ...item, text: e.target.value };
              onChange(updated);
            }}
            placeholder="Text"
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
          />
          <Button variant="ghost" size="sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 size={12} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onChange([...items, { label: "", text: "" }])}>
        <Plus size={12} className="mr-1" /> Add Item
      </Button>
    </div>
  );
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  switch (block.type) {
    case "headline":
    case "blockquote":
      return <PartsEditor parts={block.parts} onChange={(parts) => onChange({ ...block, parts })} />;

    case "text":
      return (
        <div>
          <label className="text-xs text-neutral-400">Content</label>
          <textarea
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            rows={3}
            className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 resize-y focus:outline-none focus:border-teal-500"
          />
        </div>
      );

    case "bullet-list":
    case "callout":
      return <ItemsEditor items={block.items} onChange={(items) => onChange({ ...block, items })} />;

    case "spacer":
      return (
        <Select
          label="Size"
          value={block.size}
          onChange={(e) => onChange({ ...block, size: e.target.value as "sm" | "md" | "lg" })}
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ]}
        />
      );

    case "divider":
      return <p className="text-xs text-neutral-500 italic">No options for divider.</p>;
  }
}
