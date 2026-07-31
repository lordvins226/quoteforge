import type { Block, Part, LabeledItem, PartStyle, ChartRow } from "../../types";
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
            placeholder="e.g. 01"
            className="w-24 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
          />
          <input
            value={item.text}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = { ...item, text: e.target.value };
              onChange(updated);
            }}
            placeholder="Item text"
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

function LinesEditor({ lines, onChange }: { lines: string[]; onChange: (lines: string[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-neutral-400">Lines</span>
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            value={line}
            onChange={(e) => {
              const updated = [...lines];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm font-mono text-neutral-100 focus:outline-none focus:border-teal-500"
          />
          <Button variant="ghost" size="sm" onClick={() => onChange(lines.filter((_, j) => j !== i))}>
            <Trash2 size={12} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onChange([...lines, ""])}>
        <Plus size={12} className="mr-1" /> Add Line
      </Button>
    </div>
  );
}

function ChartRowsEditor({ rows, onChange }: { rows: ChartRow[]; onChange: (rows: ChartRow[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-neutral-400">Rows</span>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            value={row.label}
            onChange={(e) => {
              const updated = [...rows];
              updated[i] = { ...row, label: e.target.value };
              onChange(updated);
            }}
            placeholder="Label"
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={row.value}
            onChange={(e) => {
              const updated = [...rows];
              updated[i] = { ...row, value: Number(e.target.value) };
              onChange(updated);
            }}
            className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
          />
          <Button variant="ghost" size="sm" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
            <Trash2 size={12} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onChange([...rows, { label: "", value: 0 }])}>
        <Plus size={12} className="mr-1" /> Add Row
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

    case "image":
      return (
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-neutral-400">Image URL or data-URI</label>
            <input
              type="text"
              value={block.src}
              onChange={(e) => onChange({ ...block, src: e.target.value })}
              placeholder="https://… or upload below"
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400">Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange({ ...block, src: String(reader.result) });
                reader.readAsDataURL(file);
              }}
              className="w-full mt-1 text-sm text-neutral-300 file:mr-2 file:rounded file:border-0 file:bg-neutral-700 file:px-2 file:py-1 file:text-neutral-100"
            />
          </div>
          <Select
            label="Width"
            value={block.width}
            onChange={(e) => onChange({ ...block, width: e.target.value as "sm" | "md" | "lg" | "full" })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
              { value: "full", label: "Full" },
            ]}
          />
          <Select
            label="Align"
            value={block.align}
            onChange={(e) => onChange({ ...block, align: e.target.value as "left" | "center" | "right" })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
          <div>
            <label className="text-xs text-neutral-400">Alt text</label>
            <input
              type="text"
              value={block.alt ?? ""}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      );

    case "stat":
      return (
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-neutral-400">Value</label>
            <input
              type="text"
              value={block.value}
              onChange={(e) => onChange({ ...block, value: e.target.value })}
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400">Unit</label>
            <input
              type="text"
              value={block.unit ?? ""}
              onChange={(e) => onChange({ ...block, unit: e.target.value })}
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400">Label</label>
            <input
              type="text"
              value={block.label ?? ""}
              onChange={(e) => onChange({ ...block, label: e.target.value })}
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400">Note</label>
            <textarea
              value={block.note ?? ""}
              onChange={(e) => onChange({ ...block, note: e.target.value })}
              rows={2}
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 resize-y focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      );

    case "code":
      return (
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-neutral-400">Filename</label>
            <input
              type="text"
              value={block.filename ?? ""}
              onChange={(e) => onChange({ ...block, filename: e.target.value })}
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
          <LinesEditor lines={block.lines} onChange={(lines) => onChange({ ...block, lines })} />
        </div>
      );

    case "chart":
      return (
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-neutral-400">Unit</label>
            <input
              type="text"
              value={block.unit ?? ""}
              onChange={(e) => onChange({ ...block, unit: e.target.value })}
              placeholder="%"
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
          <ChartRowsEditor rows={block.rows} onChange={(rows) => onChange({ ...block, rows })} />
        </div>
      );
  }
}
