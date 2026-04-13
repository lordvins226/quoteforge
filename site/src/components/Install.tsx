import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "./CodeBlock";

export function Install() {
  return (
    <section id="install" className="py-20 md:py-28 border-t border-line/60 scroll-mt-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="font-mono text-xs text-mint uppercase tracking-wider mb-3">Get started</p>
        <h2 className="font-mono text-3xl md:text-4xl font-semibold tracking-tight text-fog leading-tight mb-4">
          Thirty seconds to your<br />
          first card.
        </h2>
        <p className="text-fog-2 mb-10 max-w-[52ch] mx-auto">
          Single binary. No Node, no Bun, no framework. Needs Chrome or Chromium
          for rendering — auto-downloaded on first run if you don't have it.
        </p>

        <div className="grid md:grid-cols-2 gap-4 text-left">
          <CodeBlock title="Homebrew">
            <span className="text-fog-3">$ </span>
            <span className="text-mint">brew</span> install lordvins226/quoteforge/quoteforge
          </CodeBlock>
          <CodeBlock title="curl installer (Linux/macOS)">
            <span className="text-fog-3">$ </span>
            <span className="text-mint">curl</span> -fsSL \
            {"\n    "}https://raw.githubusercontent.com/lordvins226/quoteforge/main/install.sh \
            {"\n  "}| sh
          </CodeBlock>
          <CodeBlock title="verify">
            <span className="text-fog-3">$ </span>quoteforge --version
            {"\n"}0.2.1
            {"\n"}
            <span className="text-fog-3">$ </span>quoteforge doctor
            {"\n"}
            <span className="text-mint">✓</span> Ready.
          </CodeBlock>
          <CodeBlock title="generate a card">
            <span className="text-fog-3">$ </span>
            <span className="text-mint">quoteforge</span> generate \
            {"\n    "}content/examples/manifesto-wiki.json
            {"\n"}
            <span className="text-mint">✓</span> outputs/manifesto-wiki.png
          </CodeBlock>
        </div>

        <p className="mt-6 text-xs text-fog-3 font-mono">
          Also available: pre-built binaries (5 platforms), <code>cargo</code>-style install from source with Bun, Windows <code>.zip</code>.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/docs/getting-started"
            className="group inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-mint text-ink font-medium text-sm hover:bg-mint-2 transition-colors cursor-pointer"
          >
            Full getting-started guide
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/docs/cli"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border border-line text-fog text-sm hover:bg-ink-3 hover:border-fog-3 transition-colors cursor-pointer"
          >
            CLI reference
          </Link>
        </div>
      </div>
    </section>
  );
}
