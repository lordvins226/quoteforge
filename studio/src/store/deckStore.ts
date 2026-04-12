import { create } from "zustand";
import type { DeckContent, Block, BlockType, SizeName, Slide } from "../types";

interface DeckStore {
  deck: DeckContent;
  isDirty: boolean;
  filePath: string | null;
  activeSlideIndex: number;
  selectedBlockId: string | null;
  zoom: number;
  showCounter: boolean;

  past: DeckContent[];
  future: DeckContent[];

  setDeck: (deck: DeckContent, filePath?: string) => void;
  setActiveSlide: (index: number) => void;
  addSlide: (afterIndex?: number) => void;
  removeSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  reorderSlides: (from: number, to: number) => void;
  setSlideLabel: (index: number, label: string) => void;
  setBlock: (slideIndex: number, blockId: string, block: Block) => void;
  addBlock: (slideIndex: number, type: BlockType, afterId?: string) => void;
  removeBlock: (slideIndex: number, blockId: string) => void;
  reorderBlocks: (slideIndex: number, from: number, to: number) => void;
  selectBlock: (id: string | null) => void;
  setDeckTheme: (name: string) => void;
  setDeckSize: (size: SizeName) => void;
  toggleCounter: () => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
}

function makeId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeSlideId(index: number) {
  return `slide-${String(index).padStart(2, "0")}`;
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

function snapshot(past: DeckContent[], current: DeckContent): DeckContent[] {
  return [...past.slice(-49), current];
}

const INITIAL_DECK: DeckContent = {
  type: "deck",
  defaults: { template: "manifesto", theme: "dark-teal", size: "instagram-sq" },
  slides: [],
};

export const useDeckStore = create<DeckStore>((set) => ({
  deck: INITIAL_DECK,
  isDirty: false,
  filePath: null,
  activeSlideIndex: 0,
  selectedBlockId: null,
  zoom: 100,
  showCounter: true,
  past: [],
  future: [],

  setDeck: (deck, filePath) =>
    set({
      deck,
      filePath: filePath ?? null,
      isDirty: false,
      activeSlideIndex: 0,
      selectedBlockId: null,
      past: [],
      future: [],
      showCounter: deck.defaults.showCounter ?? true,
    }),

  setActiveSlide: (index) => set({ activeSlideIndex: index, selectedBlockId: null }),

  addSlide: (afterIndex) =>
    set((s) => {
      const slides = [...s.deck.slides];
      const newSlide: Slide = {
        id: makeSlideId(slides.length + 1),
        label: `Slide ${slides.length + 1}`,
        blocks: [{ type: "text" as const, id: makeId(), content: "Edit this slide." }],
      };
      const insertAt = afterIndex !== undefined ? afterIndex + 1 : slides.length;
      slides.splice(insertAt, 0, newSlide);
      return {
        deck: { ...s.deck, slides },
        isDirty: true,
        activeSlideIndex: insertAt,
        past: snapshot(s.past, s.deck),
        future: [],
      };
    }),

  removeSlide: (index) =>
    set((s) => {
      if (s.deck.slides.length <= 1) return s;
      const slides = s.deck.slides.filter((_, i) => i !== index);
      const newActive = Math.min(s.activeSlideIndex, slides.length - 1);
      return {
        deck: { ...s.deck, slides },
        isDirty: true,
        activeSlideIndex: newActive,
        past: snapshot(s.past, s.deck),
        future: [],
      };
    }),

  duplicateSlide: (index) =>
    set((s) => {
      const source = s.deck.slides[index];
      if (!source) return s;
      const slides = [...s.deck.slides];
      const dup: Slide = {
        ...structuredClone(source),
        id: makeSlideId(slides.length + 1),
        label: `${source.label ?? "Slide"} (copy)`,
      };
      slides.splice(index + 1, 0, dup);
      return {
        deck: { ...s.deck, slides },
        isDirty: true,
        activeSlideIndex: index + 1,
        past: snapshot(s.past, s.deck),
        future: [],
      };
    }),

  reorderSlides: (from, to) =>
    set((s) => {
      const slides = [...s.deck.slides];
      const [moved] = slides.splice(from, 1);
      if (moved) slides.splice(to, 0, moved);
      return {
        deck: { ...s.deck, slides },
        isDirty: true,
        activeSlideIndex: to,
        past: snapshot(s.past, s.deck),
        future: [],
      };
    }),

  setSlideLabel: (index, label) =>
    set((s) => {
      const slides = s.deck.slides.map((sl, i) => (i === index ? { ...sl, label } : sl));
      return { deck: { ...s.deck, slides }, isDirty: true, past: snapshot(s.past, s.deck), future: [] };
    }),

  setBlock: (slideIndex, blockId, block) =>
    set((s) => {
      const slides = s.deck.slides.map((sl, i) => {
        if (i !== slideIndex) return sl;
        return { ...sl, blocks: sl.blocks.map((b) => (b.id === blockId ? block : b)) };
      });
      return { deck: { ...s.deck, slides }, isDirty: true, past: snapshot(s.past, s.deck), future: [] };
    }),

  addBlock: (slideIndex, type, afterId) =>
    set((s) => {
      const newBlock = defaultBlock(type);
      const slides = s.deck.slides.map((sl, i) => {
        if (i !== slideIndex) return sl;
        const blocks = [...sl.blocks];
        if (afterId) {
          const idx = blocks.findIndex((b) => b.id === afterId);
          blocks.splice(idx + 1, 0, newBlock);
        } else {
          blocks.push(newBlock);
        }
        return { ...sl, blocks };
      });
      return {
        deck: { ...s.deck, slides },
        isDirty: true,
        selectedBlockId: newBlock.id ?? null,
        past: snapshot(s.past, s.deck),
        future: [],
      };
    }),

  removeBlock: (slideIndex, blockId) =>
    set((s) => {
      const slides = s.deck.slides.map((sl, i) => {
        if (i !== slideIndex) return sl;
        return { ...sl, blocks: sl.blocks.filter((b) => b.id !== blockId) };
      });
      return {
        deck: { ...s.deck, slides },
        isDirty: true,
        selectedBlockId: s.selectedBlockId === blockId ? null : s.selectedBlockId,
        past: snapshot(s.past, s.deck),
        future: [],
      };
    }),

  reorderBlocks: (slideIndex, from, to) =>
    set((s) => {
      const slides = s.deck.slides.map((sl, i) => {
        if (i !== slideIndex) return sl;
        const blocks = [...sl.blocks];
        const [moved] = blocks.splice(from, 1);
        if (moved) blocks.splice(to, 0, moved);
        return { ...sl, blocks };
      });
      return { deck: { ...s.deck, slides }, isDirty: true, past: snapshot(s.past, s.deck), future: [] };
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  setDeckTheme: (name) =>
    set((s) => ({
      deck: { ...s.deck, defaults: { ...s.deck.defaults, theme: name } },
      isDirty: true,
      past: snapshot(s.past, s.deck),
      future: [],
    })),

  setDeckSize: (size) =>
    set((s) => ({
      deck: { ...s.deck, defaults: { ...s.deck.defaults, size } },
      isDirty: true,
      past: snapshot(s.past, s.deck),
      future: [],
    })),

  toggleCounter: () =>
    set((s) => {
      const show = !s.showCounter;
      return {
        showCounter: show,
        deck: { ...s.deck, defaults: { ...s.deck.defaults, showCounter: show } },
        isDirty: true,
        past: snapshot(s.past, s.deck),
        future: [],
      };
    }),

  setZoom: (zoom) => set({ zoom }),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return { deck: prev, past: s.past.slice(0, -1), future: [s.deck, ...s.future.slice(0, 49)], isDirty: true };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return { deck: next, past: [...s.past.slice(-49), s.deck], future: s.future.slice(1), isDirty: true };
    }),
}));
