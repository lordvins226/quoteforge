import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DocsLayout } from "../components/DocsLayout";
import { DOCS, DOC_SECTIONS } from "../docs/manifest";

export function Docs() {
  return (
    <DocsLayout title="Documentation">
      <p className="text-fog-2 leading-7 mb-10 max-w-[60ch]">
        Everything you need to turn JSON into beautifully typeset social cards — from your first
        generate command to building custom themes and templates.
      </p>

      {DOC_SECTIONS.map((section) => {
        const items = DOCS.filter((d) => d.section === section);
        if (items.length === 0) return null;
        return (
          <section key={section} className="mb-10">
            <h2 className="font-mono text-xs text-mint uppercase tracking-wider mb-4">{section}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((doc) => (
                <Link
                  key={doc.slug}
                  to={`/docs/${doc.slug}`}
                  className="group rounded-lg border border-line bg-ink-2 p-5 transition-colors hover:border-fog-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-mono text-base font-semibold text-fog mb-1.5">{doc.title}</h3>
                      <p className="text-sm text-fog-2 leading-snug">{doc.description}</p>
                    </div>
                    <ArrowRight size={16} className="text-fog-3 group-hover:text-mint group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </DocsLayout>
  );
}
