import { FileJson, Layers, Palette, Package, MonitorPlay, Gauge } from "lucide-react";
import type { ComponentType } from "react";

interface Feature {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  accent?: boolean;
  span?: string;
}

const FEATURES: Feature[] = [
  {
    icon: FileJson,
    title: "JSON in, PNG out",
    description:
      "Validated Zod schemas for cards and decks. Version them in git. Generate deterministic output every time.",
    accent: true,
    span: "md:col-span-2",
  },
  {
    icon: Layers,
    title: "Deck mode",
    description: "Carousels with shared defaults, per-slide overrides, numbered exports, and ZIP bundling.",
  },
  {
    icon: Palette,
    title: "Themeable",
    description: "20 CSS variables. No hardcoded colors. Bring your own theme JSON.",
  },
  {
    icon: MonitorPlay,
    title: "Studio",
    description: "WYSIWYG editor with live preview, drag-and-drop blocks, undo/redo, and theme builder.",
    span: "md:col-span-2",
  },
  {
    icon: Package,
    title: "14 sizes",
    description: "Twitter, Instagram, Facebook, Story, LinkedIn, and six more baked in.",
  },
  {
    icon: Gauge,
    title: "Fast",
    description: "Puppeteer browser pool, parallel slide rendering, <1s per card.",
  },
];

export function BentoFeatures() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="font-mono text-xs text-mint uppercase tracking-wider mb-3">Features</p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold tracking-tight text-fog leading-tight">
            Everything you need to ship<br />
            <span className="text-fog-2">quote cards at scale.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className={`group relative rounded-card border border-line bg-ink-2 p-6 transition-colors hover:border-fog-3 ${f.span ?? ""}`}
            >
              <div className={`inline-flex w-10 h-10 items-center justify-center rounded-lg mb-5 ${f.accent ? "bg-mint/15 text-mint" : "bg-ink-3 text-fog-2"}`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-mono text-base font-semibold text-fog mb-2">{f.title}</h3>
              <p className="text-sm text-fog-2 leading-relaxed">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
