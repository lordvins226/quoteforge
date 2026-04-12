import type { Block, BlockType } from "../../types";
import { Button } from "../ui/Button";
import { BlockEditor } from "./BlockEditor";
import { GripVertical, Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: "headline", label: "Headline" },
  { value: "blockquote", label: "Blockquote" },
  { value: "text", label: "Text" },
  { value: "bullet-list", label: "Bullet List" },
  { value: "callout", label: "Callout" },
  { value: "divider", label: "Divider" },
  { value: "spacer", label: "Spacer" },
];

interface BlockListProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (blockId: string, block: Block) => void;
  onAdd: (type: BlockType, afterId?: string) => void;
  onRemove: (blockId: string) => void;
}

export function BlockList({ blocks, selectedBlockId, onSelect, onUpdate, onAdd, onRemove }: BlockListProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Blocks</h3>
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setAddMenuOpen(!addMenuOpen)}>
            <Plus size={14} />
          </Button>
          {addMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg py-1 z-20 w-36">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
                  onClick={() => { onAdd(bt.value); setAddMenuOpen(false); }}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {blocks.map((block) => {
        const isSelected = block.id === selectedBlockId;
        return (
          <div key={block.id ?? block.type} className="border border-neutral-800 rounded-lg overflow-hidden">
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                isSelected ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-800/50"
              }`}
              onClick={() => onSelect(isSelected ? null : (block.id ?? null))}
            >
              <GripVertical size={14} className="text-neutral-600 flex-shrink-0" />
              {isSelected ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="flex-1 truncate font-mono text-xs">{block.type}</span>
              <button
                onClick={(e) => { e.stopPropagation(); if (block.id) onRemove(block.id); }}
                className="text-neutral-600 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </button>

            {isSelected && (
              <div className="px-3 py-3 border-t border-neutral-800 bg-neutral-850">
                <BlockEditor block={block} onChange={(updated) => { if (block.id) onUpdate(block.id, updated); }} />
              </div>
            )}
          </div>
        );
      })}

      {blocks.length === 0 && (
        <p className="text-xs text-neutral-500 text-center py-4">No blocks. Click + to add one.</p>
      )}
    </div>
  );
}
