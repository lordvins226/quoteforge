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
          Requires Bun 1.2+. No Node, no npm scripts, no framework lock-in.
        </p>

        <div className="grid md:grid-cols-2 gap-4 text-left">
          <CodeBlock title="clone + install">
            <span className="text-fog-3">$ </span>git clone lordvins226/quoteforge
            {"\n"}
            <span className="text-fog-3">$ </span>cd quoteforge
            {"\n"}
            <span className="text-fog-3">$ </span>
            <span className="text-mint">bun</span> install
          </CodeBlock>
          <CodeBlock title="generate a card">
            <span className="text-fog-3">$ </span>
            <span className="text-mint">bun</span> quoteforge generate \
            {"\n    "}content/examples/manifesto-wiki.json
            {"\n"}
            <span className="text-mint">✓</span> outputs/manifesto-wiki.png
          </CodeBlock>
        </div>

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
