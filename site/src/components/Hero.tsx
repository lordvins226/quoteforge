import { Link } from "react-router-dom";
import { ArrowRight, Terminal } from "lucide-react";
import { CodeBlock } from "./CodeBlock";

export function Hero() {
  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #E5EAF0 1px, transparent 1px), linear-gradient(to bottom, #E5EAF0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-[1.05fr_1fr] gap-12 md:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-mint/10 border border-mint/30 text-mint text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            Open source · MIT
          </div>
          <h1 className="font-mono text-4xl md:text-6xl font-semibold tracking-tight text-fog leading-[1.05]">
            Social cards for<br />
            people who live in<br />
            the <span className="text-mint">terminal</span>.
          </h1>
          <p className="mt-6 text-lg text-fog-2 max-w-[54ch] leading-relaxed">
            A CLI and studio for generating quote cards and carousels from JSON. Version the source, script the output, ship the PNG — no cloud, no drag-and-drop drift.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#install"
              className="group inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-mint text-ink font-medium text-sm hover:bg-mint-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
            >
              <Terminal size={16} />
              Install in 30 seconds
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border border-line text-fog text-sm hover:bg-ink-3 hover:border-fog-3 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-fog-3 focus:ring-offset-2 focus:ring-offset-ink"
            >
              Read the docs
            </Link>
          </div>
          <p className="mt-6 font-mono text-xs text-fog-3">
            <span className="text-mint">✓</span> 17 sizes · 12 themes · carousel export · CLI + WYSIWYG studio
          </p>
        </div>

        <div className="relative">
          <CodeBlock title="~/quoteforge">
            <span className="text-fog-3">$ </span>
            <span className="text-mint">bun</span> quoteforge generate quote.json
            {"\n"}
            <span className="text-fog-3">  ↳ validating</span> <span className="text-mint">✓</span>
            {"\n"}
            <span className="text-fog-3">  ↳ rendering with</span> theme.obsidian
            {"\n"}
            <span className="text-fog-3">  ↳ size</span> instagram-sq <span className="text-fog-3">1080×1080</span>
            {"\n"}
            <span className="text-mint">✓</span> outputs/quote.png <span className="text-fog-3">(148KB · 420ms)</span>
            {"\n\n"}
            <span className="text-fog-3">$ </span>
            <span className="text-mint">bun</span> quoteforge slides deck.json
            {"\n"}
            <span className="text-fog-3">  ↳ 8 slides</span> <span className="text-amber">●●●●●●●●</span>
            {"\n"}
            <span className="text-mint">✓</span> outputs/deck.zip <span className="text-fog-3">(1.2MB)</span>
          </CodeBlock>
          <div
            aria-hidden
            className="absolute -z-10 inset-0 blur-3xl opacity-40"
            style={{ background: "radial-gradient(400px 200px at 50% 50%, rgba(34, 197, 94, 0.35), transparent)" }}
          />
        </div>
      </div>
    </section>
  );
}
