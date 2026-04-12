import type { ComponentProps } from "react";
import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: (props: ComponentProps<"h1">) => (
    <h1 className="font-mono text-3xl font-semibold tracking-tight text-fog mt-0 mb-6" {...props} />
  ),
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="font-mono text-xl font-semibold tracking-tight text-fog mt-12 mb-4 pb-2 border-b border-line" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="font-mono text-base font-semibold text-fog mt-8 mb-3" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="text-fog-2 leading-7 mb-4 max-w-[70ch]" {...props} />
  ),
  a: (props: ComponentProps<"a">) => (
    <a className="text-mint underline-offset-4 hover:underline transition-colors" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="list-disc pl-6 text-fog-2 leading-7 mb-4 space-y-1" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="list-decimal pl-6 text-fog-2 leading-7 mb-4 space-y-1" {...props} />
  ),
  li: (props: ComponentProps<"li">) => <li {...props} />,
  code: (props: ComponentProps<"code">) => (
    <code className="font-mono text-[0.9em] bg-ink-3 border border-line px-1.5 py-0.5 rounded text-fog" {...props} />
  ),
  pre: (props: ComponentProps<"pre">) => <pre {...props} />,
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote className="border-l-4 border-mint pl-4 italic text-fog-2 my-6" {...props} />
  ),
  table: (props: ComponentProps<"table">) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border border-line rounded-lg overflow-hidden" {...props} />
    </div>
  ),
  th: (props: ComponentProps<"th">) => (
    <th className="bg-ink-2 text-left font-semibold text-fog px-4 py-2 border-b border-line" {...props} />
  ),
  td: (props: ComponentProps<"td">) => (
    <td className="px-4 py-2 border-b border-line text-fog-2" {...props} />
  ),
  hr: () => <hr className="border-line my-8" />,
};
