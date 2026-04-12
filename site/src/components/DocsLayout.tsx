import { NavLink, Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { DOCS, DOC_SECTIONS, getAdjacentDocs, type DocMeta } from "../docs/manifest";

interface DocsLayoutProps {
  currentSlug?: string;
  title?: string;
  children: ReactNode;
}

export function DocsLayout({ currentSlug, title, children }: DocsLayoutProps) {
  const { prev, next } = currentSlug ? getAdjacentDocs(currentSlug) : { prev: null, next: null };

  return (
    <>
      <Nav />
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-[220px_minmax(0,1fr)] gap-10 py-10 md:py-16">
        <aside className="md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
          <nav aria-label="Docs navigation" className="space-y-6">
            {DOC_SECTIONS.map((section) => {
              const items = DOCS.filter((d) => d.section === section);
              if (items.length === 0) return null;
              return (
                <div key={section}>
                  <p className="font-mono text-[10px] text-fog-3 uppercase tracking-[0.12em] mb-2">{section}</p>
                  <ul className="space-y-0.5">
                    {items.map((d) => (
                      <li key={d.slug}>
                        <DocLink doc={d} active={d.slug === currentSlug} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          {title && (
            <h1 className="font-mono text-3xl md:text-4xl font-semibold tracking-tight text-fog mb-8">{title}</h1>
          )}
          <article className="prose-invert max-w-none">{children}</article>

          {(prev || next) && (
            <nav aria-label="Adjacent pages" className="mt-16 pt-8 border-t border-line grid grid-cols-2 gap-4">
              {prev ? (
                <Link to={`/docs/${prev.slug}`} className="group rounded-lg border border-line p-4 hover:border-fog-3 transition-colors">
                  <span className="flex items-center gap-1.5 text-xs text-fog-3"><ArrowLeft size={12} />Previous</span>
                  <span className="block mt-1 font-mono text-sm text-fog group-hover:text-mint transition-colors">{prev.title}</span>
                </Link>
              ) : <span />}
              {next ? (
                <Link to={`/docs/${next.slug}`} className="group rounded-lg border border-line p-4 hover:border-fog-3 transition-colors text-right">
                  <span className="flex items-center gap-1.5 justify-end text-xs text-fog-3">Next<ArrowRight size={12} /></span>
                  <span className="block mt-1 font-mono text-sm text-fog group-hover:text-mint transition-colors">{next.title}</span>
                </Link>
              ) : <span />}
            </nav>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}

function DocLink({ doc, active }: { doc: DocMeta; active: boolean }) {
  return (
    <NavLink
      to={`/docs/${doc.slug}`}
      className={`block px-2.5 py-1.5 rounded-md font-mono text-sm transition-colors ${
        active ? "bg-ink-3 text-mint" : "text-fog-2 hover:text-fog hover:bg-ink-3/60"
      }`}
    >
      {doc.title}
    </NavLink>
  );
}
