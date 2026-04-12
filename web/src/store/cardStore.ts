import { create } from "zustand";
import type { CardContent, Block, BlockType, SizeName } from "../types";

interface CardStore {
  card: CardContent;
  isDirty: boolean;
  filePath: string | null;
  selectedBlockId: string | null;
  zoom: number;

  past: CardContent[];
  future: CardContent[];

  setCard: (card: CardContent, filePath?: string) => void;
  setBlock: (blockId: string, block: Block) => void;
  addBlock: (type: BlockType, afterId?: string) => void;
  removeBlock: (blockId: string) => void;
  reorderBlocks: (from: number, to: number) => void;
  selectBlock: (id: string | null) => void;
  setTheme: (name: string) => void;
  setSize: (size: SizeName) => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
}

function makeId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function defaultBlock(type: BlockType): Block {
  switch (type) {
    case "headline":
      return { type, id: makeId(), parts: [{ text: "New headline", style: "normal" }] };
    case "blockquote":
      return { type, id: makeId(), parts: [{ text: "New quote", style: "normal" }] };
    case "text":
      return { type, id: makeId(), content: "New text block" };
    case "bullet-list":
      return { type, id: makeId(), items: [{ label: "Item", text: "Description" }] };
    case "callout":
      return { type, id: makeId(), items: [{ label: "Note", text: "Details here" }] };
    case "divider":
      return { type, id: makeId() };
    case "spacer":
      return { type, id: makeId(), size: "md" };
  }
}

const INITIAL_CARD: CardContent = {
  template: "manifesto",
  theme: "dark-teal",
  size: "twitter",
  blocks: [],
};

export const useCardStore = create<CardStore>((set) => ({
  card: INITIAL_CARD,
  isDirty: false,
  filePath: null,
  selectedBlockId: null,
  zoom: 100,
  past: [],
  future: [],

  setCard: (card, filePath) =>
    set({ card, filePath: filePath ?? null, isDirty: false, past: [], future: [], selectedBlockId: null }),

  setBlock: (blockId, block) =>
    set((s) => {
      const blocks = s.card.blocks.map((b) => (b.id === blockId ? block : b));
      return { card: { ...s.card, blocks }, isDirty: true, past: [...s.past.slice(-49), s.card], future: [] };
    }),

  addBlock: (type, afterId) =>
    set((s) => {
      const newBlock = defaultBlock(type);
      const blocks = [...s.card.blocks];
      if (afterId) {
        const idx = blocks.findIndex((b) => b.id === afterId);
        blocks.splice(idx + 1, 0, newBlock);
      } else {
        blocks.push(newBlock);
      }
      return {
        card: { ...s.card, blocks },
        isDirty: true,
        selectedBlockId: newBlock.id ?? null,
        past: [...s.past.slice(-49), s.card],
        future: [],
      };
    }),

  removeBlock: (blockId) =>
    set((s) => {
      const blocks = s.card.blocks.filter((b) => b.id !== blockId);
      return {
        card: { ...s.card, blocks },
        isDirty: true,
        selectedBlockId: s.selectedBlockId === blockId ? null : s.selectedBlockId,
        past: [...s.past.slice(-49), s.card],
        future: [],
      };
    }),

  reorderBlocks: (from, to) =>
    set((s) => {
      const blocks = [...s.card.blocks];
      const [moved] = blocks.splice(from, 1);
      if (moved) blocks.splice(to, 0, moved);
      return { card: { ...s.card, blocks }, isDirty: true, past: [...s.past.slice(-49), s.card], future: [] };
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  setTheme: (name) =>
    set((s) => ({
      card: { ...s.card, theme: name },
      isDirty: true,
      past: [...s.past.slice(-49), s.card],
      future: [],
    })),

  setSize: (size) =>
    set((s) => ({
      card: { ...s.card, size },
      isDirty: true,
      past: [...s.past.slice(-49), s.card],
      future: [],
    })),

  setZoom: (zoom) => set({ zoom }),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return { card: prev, past: s.past.slice(0, -1), future: [s.card, ...s.future.slice(0, 49)], isDirty: true };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return { card: next, past: [...s.past.slice(-49), s.card], future: s.future.slice(1), isDirty: true };
    }),
}));
