import type { ReactNode } from "react";

interface CodeBlockProps {
  lang?: string;
  title?: string;
  children: ReactNode;
}

export function CodeBlock({ lang = "bash", title, children }: CodeBlockProps) {
  return (
    <figure className="rounded-xl overflow-hidden border border-line bg-ink-2 shadow-[0_0_0_1px_rgba(34,197,94,0.05),0_20px_60px_-20px_rgba(0,0,0,0.7)]">
      <header className="flex items-center justify-between px-4 h-9 border-b border-line bg-ink-3/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <span className="font-mono text-[11px] text-fog-3 uppercase tracking-wider">{title ?? lang}</span>
        <span className="w-10" />
      </header>
      <pre className="p-5 font-mono text-sm leading-relaxed text-fog overflow-x-auto">{children}</pre>
    </figure>
  );
}
