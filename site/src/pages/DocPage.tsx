import { useParams } from "react-router-dom";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { DocsLayout } from "../components/DocsLayout";
import { DOCS } from "../docs/manifest";
import { NotFound } from "./NotFound";

const docModules = import.meta.glob<{ default: ComponentType }>("../docs/*.mdx");

const lazyDocs: Record<string, LazyExoticComponent<ComponentType>> = {};
for (const [path, loader] of Object.entries(docModules)) {
  const slug = path.replace("../docs/", "").replace(/\.mdx$/, "");
  lazyDocs[slug] = lazy(loader);
}

export function DocPage() {
  const { slug } = useParams<{ slug: string }>();
  const meta = slug ? DOCS.find((d) => d.slug === slug) : undefined;
  const MDX = slug ? lazyDocs[slug] : undefined;

  if (!meta || !MDX) return <NotFound />;

  return (
    <DocsLayout currentSlug={meta.slug} title={meta.title}>
      <Suspense key={slug} fallback={<p className="text-fog-3 text-sm">Loading…</p>}>
        <MDX />
      </Suspense>
    </DocsLayout>
  );
}
