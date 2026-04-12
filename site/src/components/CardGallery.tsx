import { useState } from "react";

const SAMPLES = [
  { src: "/samples/manifesto-wiki.png", label: "manifesto · terminal-green" },
  { src: "/samples/quote-twain.png", label: "quote · noir-crimson" },
  { src: "/samples/list-tips.png", label: "list · paper-cream" },
  { src: "/samples/minimal-stoic.png", label: "minimal · kyoto" },
] as const;

function GalleryCard({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="group">
      <div className="aspect-square rounded-card overflow-hidden border border-line bg-ink-3 transition-all duration-300 group-hover:border-mint/50 group-hover:-translate-y-0.5">
        {failed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 border border-dashed border-line rounded-card p-4 text-center">
            <span className="font-mono text-[10px] text-fog-3 uppercase tracking-wider">Sample unavailable</span>
            <span className="font-mono text-xs text-fog-2 break-all">{label}</span>
          </div>
        ) : (
          <img
            src={src}
            alt={label}
            loading="lazy"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <figcaption className="mt-3 font-mono text-xs text-fog-3">{label}</figcaption>
    </figure>
  );
}

export function CardGallery() {
  return (
    <section className="py-20 md:py-28 border-t border-line/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="font-mono text-xs text-mint uppercase tracking-wider mb-3">Gallery</p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold tracking-tight text-fog leading-tight">
            Every card you see below<br />
            <span className="text-fog-2">was rendered by the CLI.</span>
          </h2>
          <p className="mt-4 text-fog-2 max-w-[54ch]">
            These PNGs aren't mockups. Every time this site is built, the Docker image runs
            <code className="mx-1 px-1.5 py-0.5 bg-ink-3 border border-line rounded font-mono text-xs">quoteforge generate</code>
            against the same JSON source files you'd write.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SAMPLES.map((s) => (
            <GalleryCard key={s.src} src={s.src} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
