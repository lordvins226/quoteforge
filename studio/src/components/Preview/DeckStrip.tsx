import { useDeckStore } from "../../store/deckStore";

export function DeckStrip() {
  const { deck, activeSlideIndex, setActiveSlide } = useDeckStore();

  return (
    <div className="flex gap-2 p-2 bg-neutral-900 border-t border-neutral-800 overflow-x-auto">
      {deck.slides.map((slide, i) => (
        <button
          key={slide.id}
          className={`flex-shrink-0 w-20 h-14 rounded text-xs font-mono flex items-center justify-center transition-all ${
            i === activeSlideIndex
              ? "bg-neutral-700 border-2 border-teal-500 text-teal-400"
              : "bg-neutral-800 border border-neutral-700 text-neutral-400 hover:border-neutral-600"
          }`}
          onClick={() => setActiveSlide(i)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
