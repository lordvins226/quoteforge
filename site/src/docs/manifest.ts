export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  section: "Introduction" | "Reference" | "Advanced";
}

export const DOCS: readonly DocMeta[] = [
  { slug: "getting-started", title: "Getting Started", description: "Install QuoteForge and render your first card.", section: "Introduction" },
  { slug: "studio", title: "Studio", description: "The WYSIWYG editor — blocks, previews, decks, exports.", section: "Introduction" },
  { slug: "cli", title: "CLI Reference", description: "Every command, every flag.", section: "Reference" },
  { slug: "content-schema", title: "Content Schema", description: "Cards, decks, and the 7 block types.", section: "Reference" },
  { slug: "themes", title: "Themes", description: "20 CSS variables, BYO theme JSON.", section: "Reference" },
  { slug: "templates", title: "Templates", description: "The 4 built-in layouts and how to add more.", section: "Advanced" },
] as const;

export const DOC_SECTIONS = ["Introduction", "Reference", "Advanced"] as const;

export function getDocIndex(slug: string): number {
  return DOCS.findIndex((d) => d.slug === slug);
}

export function getAdjacentDocs(slug: string): { prev: DocMeta | null; next: DocMeta | null } {
  const i = getDocIndex(slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? DOCS[i - 1] ?? null : null,
    next: i < DOCS.length - 1 ? DOCS[i + 1] ?? null : null,
  };
}
