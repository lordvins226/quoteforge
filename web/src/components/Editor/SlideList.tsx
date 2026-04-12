import { useDeckStore } from "../../store/deckStore";
import { Button } from "../ui/Button";
import { Plus, Trash2, Copy } from "lucide-react";

export function SlideList() {
  const { deck, activeSlideIndex, setActiveSlide, addSlide, removeSlide, duplicateSlide, setSlideLabel } = useDeckStore();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Slides</h3>
        <Button variant="ghost" size="sm" onClick={() => addSlide()}>
          <Plus size={14} />
        </Button>
      </div>

      {deck.slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
            i === activeSlideIndex ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-800/50"
          }`}
          onClick={() => setActiveSlide(i)}
        >
          <span className="text-xs font-mono text-neutral-500 w-5">{String(i + 1).padStart(2, "0")}</span>
          <input
            value={slide.label ?? `Slide ${i + 1}`}
            onChange={(e) => setSlideLabel(i, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent text-sm focus:outline-none focus:bg-neutral-900 rounded px-1"
          />
          <div className="hidden group-hover:flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} className="text-neutral-500 hover:text-neutral-300">
              <Copy size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); removeSlide(i); }} className="text-neutral-500 hover:text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
