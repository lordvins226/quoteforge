import { useDeckStore } from "../../store/deckStore";
import { ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { Button } from "../ui/Button";

export function SlideNav() {
  const { deck, activeSlideIndex, setActiveSlide, showCounter, toggleCounter } = useDeckStore();
  const total = deck.slides.length;

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        disabled={activeSlideIndex <= 0}
        onClick={() => setActiveSlide(activeSlideIndex - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <span className="text-sm text-neutral-300 font-mono">
        {activeSlideIndex + 1} / {total}
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={activeSlideIndex >= total - 1}
        onClick={() => setActiveSlide(activeSlideIndex + 1)}
      >
        <ChevronRight size={16} />
      </Button>
      <Button
        variant={showCounter ? "secondary" : "ghost"}
        size="sm"
        onClick={toggleCounter}
        title="Toggle slide counter"
      >
        <Hash size={14} />
      </Button>
    </div>
  );
}
