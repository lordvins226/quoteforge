import { useState, useEffect, useCallback } from "react";
import type { ContentMode, CardContent, DeckContent } from "./types";
import { useCardStore } from "./store/cardStore";
import { useDeckStore } from "./store/deckStore";
import { Toolbar } from "./components/Editor/Toolbar";
import { BlockList } from "./components/Editor/BlockList";
import { SlideList } from "./components/Editor/SlideList";
import { SlideNav } from "./components/Editor/SlideNav";
import { PreviewPane } from "./components/Preview/PreviewPane";
import { DeckStrip } from "./components/Preview/DeckStrip";
import { ToastProvider, useToast } from "./components/ui/Toast";

function StudioApp() {
  const [mode, setMode] = useState<ContentMode>("card");
  const { toast } = useToast();

  const cardStore = useCardStore();
  const deckStore = useDeckStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filePath = params.get("file");
    if (!filePath) return;

    fetch(`/api/content/load?path=${encodeURIComponent(filePath)}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const d = data as Record<string, unknown>;
        if (d.type === "deck") {
          setMode("deck");
          deckStore.setDeck(data as DeckContent, filePath);
        } else {
          setMode("card");
          cardStore.setCard(data as CardContent, filePath);
        }
      })
      .catch(() => toast("Failed to load file", "error"));
  }, []);

  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        mode === "card" ? cardStore.undo() : deckStore.undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        mode === "card" ? cardStore.redo() : deckStore.redo();
      }
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [mode]);

  const handleExportPng = useCallback(async () => {
    const body = mode === "card"
      ? { card: cardStore.card, theme: cardStore.card.theme, size: cardStore.card.size }
      : (() => {
          const slide = deckStore.deck.slides[deckStore.activeSlideIndex];
          if (!slide) return null;
          const card: CardContent = {
            template: slide.template ?? deckStore.deck.defaults.template,
            theme: slide.theme ?? deckStore.deck.defaults.theme,
            size: slide.size ?? deckStore.deck.defaults.size,
            blocks: slide.blocks,
          };
          return { card, theme: card.theme, size: card.size };
        })();

    if (!body) return;

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quoteforge-export.png";
      a.click();
      URL.revokeObjectURL(url);
      toast("PNG exported", "success");
    } catch {
      toast("Export failed", "error");
    }
  }, [mode, cardStore.card, deckStore.deck, deckStore.activeSlideIndex]);

  const handleExportDeck = useCallback(async () => {
    try {
      const res = await fetch("/api/export-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: deckStore.deck }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quoteforge-deck.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast("Deck ZIP exported", "success");
    } catch {
      toast("Deck export failed", "error");
    }
  }, [deckStore.deck]);

  const activeSlide = mode === "deck" ? deckStore.deck.slides[deckStore.activeSlideIndex] : null;
  const previewCard: CardContent = mode === "card"
    ? cardStore.card
    : {
        template: activeSlide?.template ?? deckStore.deck.defaults.template,
        theme: activeSlide?.theme ?? deckStore.deck.defaults.theme,
        size: activeSlide?.size ?? deckStore.deck.defaults.size,
        blocks: activeSlide?.blocks ?? [],
      };

  const currentTheme = mode === "card" ? cardStore.card.theme : deckStore.deck.defaults.theme;
  const currentSize = mode === "card" ? cardStore.card.size : deckStore.deck.defaults.size;

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        mode={mode}
        theme={currentTheme}
        size={currentSize}
        onThemeChange={mode === "card" ? cardStore.setTheme : deckStore.setDeckTheme}
        onSizeChange={mode === "card" ? cardStore.setSize : deckStore.setDeckSize}
        onExportPng={handleExportPng}
        onExportDeck={mode === "deck" ? handleExportDeck : undefined}
        onUndo={mode === "card" ? cardStore.undo : deckStore.undo}
        onRedo={mode === "card" ? cardStore.redo : deckStore.redo}
        canUndo={mode === "card" ? cardStore.past.length > 0 : deckStore.past.length > 0}
        canRedo={mode === "card" ? cardStore.future.length > 0 : deckStore.future.length > 0}
        isDirty={mode === "card" ? cardStore.isDirty : deckStore.isDirty}
      />

      <div className="flex-1 flex overflow-hidden">
        {mode === "deck" && (
          <div className="w-52 border-r border-neutral-800 p-3 overflow-y-auto">
            <SlideList />
          </div>
        )}

        <div className="w-80 border-r border-neutral-800 p-3 overflow-y-auto">
          <BlockList
            blocks={mode === "card" ? cardStore.card.blocks : (activeSlide?.blocks ?? [])}
            selectedBlockId={mode === "card" ? cardStore.selectedBlockId : deckStore.selectedBlockId}
            onSelect={mode === "card" ? cardStore.selectBlock : deckStore.selectBlock}
            onUpdate={(blockId, block) => {
              if (mode === "card") cardStore.setBlock(blockId, block);
              else deckStore.setBlock(deckStore.activeSlideIndex, blockId, block);
            }}
            onAdd={(type, afterId) => {
              if (mode === "card") cardStore.addBlock(type, afterId);
              else deckStore.addBlock(deckStore.activeSlideIndex, type, afterId);
            }}
            onRemove={(blockId) => {
              if (mode === "card") cardStore.removeBlock(blockId);
              else deckStore.removeBlock(deckStore.activeSlideIndex, blockId);
            }}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <PreviewPane
            card={previewCard}
            theme={currentTheme}
            size={currentSize}
            slideIndex={mode === "deck" ? deckStore.activeSlideIndex : 0}
            slideTotal={mode === "deck" ? deckStore.deck.slides.length : 1}
            showCounter={mode === "deck" ? deckStore.showCounter : false}
          />

          {mode === "deck" && (
            <>
              <div className="flex items-center justify-center py-2 border-t border-neutral-800">
                <SlideNav />
              </div>
              <DeckStrip />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StudioApp />
    </ToastProvider>
  );
}
