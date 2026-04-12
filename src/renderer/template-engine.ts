import nunjucks from "nunjucks";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { buildFontImports } from "./font-loader.js";
import type { CardContent, Theme, Part, PartStyle } from "../cli/utils/validator.js";

const TEMPLATES_DIR = resolve(import.meta.dir, "../../templates");

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(TEMPLATES_DIR, { noCache: true }),
  { autoescape: true },
);

export interface RenderMeta {
  slideIndex: number;
  slideTotal: number;
  showCounter: boolean;
  counter: {
    format: string;
    position: string;
    style: string;
  };
}

const DEFAULT_META: RenderMeta = {
  slideIndex: 0,
  slideTotal: 1,
  showCounter: false,
  counter: {
    format: "{current} / {total}",
    position: "bottom-right",
    style: "pill",
  },
};

function buildCssVars(theme: Theme): string {
  const vars: Record<string, string> = {
    "--bg": theme.colors.background,
    "--headline": theme.colors.headline,
    "--accent": theme.colors.accent,
    "--body": theme.colors.body,
    "--label": theme.colors.label,
    "--bq-border": theme.colors["blockquote-border"],
    "--bq-text": theme.colors["blockquote-text"],
    "--callout-bg": theme.colors["callout-bg"],
    "--callout-border": theme.colors["callout-border"],
    "--bullet-dot": theme.colors["bullet-dot"],
    "--counter-bg": theme.colors["slide-counter-bg"],
    "--counter-text": theme.colors["slide-counter-text"],
    "--padding": theme.spacing.padding,
    "--gap": theme.spacing["block-gap"],
    "--font-headline": `'${theme.typography["font-headline"]}', serif`,
    "--font-body": `'${theme.typography["font-body"]}', monospace`,
    "--headline-size": theme.typography["headline-size"],
    "--body-size": theme.typography["body-size"],
    "--line-height": theme.typography["line-height"],
  };

  return Object.entries(vars)
    .map(([key, val]) => `${key}: ${val};`)
    .join("\n    ");
}

// TODO(human): Implement renderPart
// Convert a Part ({text, style}) into an HTML string fragment.
// This is the core content-to-presentation bridge — every block with
// mixed inline styles (headline, blockquote) depends on this function.
//
// Parameters:
//   part: Part — { text: string, style: PartStyle }
//
// Returns:
//   string — an HTML fragment, e.g. '<span class="part-bold">Hello</span>'
//
// The text MUST be HTML-escaped (Nunjucks handles this if output via
// template, but if you build raw HTML here you need to escape manually).
//
// See the PartStyle type for the 7 style variants: normal, bold, italic,
// accent, accent-italic, mono, muted.
export function renderPart(part: Part): string {
  const escapedText = part.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<span class="part-${part.style}">${escapedText}</span>`;
}

env.addGlobal("renderPart", renderPart);

export function renderTemplate(
  content: CardContent,
  theme: Theme,
  meta?: Partial<RenderMeta>,
): string {
  const resolvedMeta = { ...DEFAULT_META, ...meta };
  const fontImports = buildFontImports(theme);
  const cssVars = buildCssVars(theme);

  const templatePath = `${content.template}/template.njk`;
  const stylePath = join(TEMPLATES_DIR, content.template, "style.css");
  const styleCSS = readFileSync(stylePath, "utf-8");

  return env.render(templatePath, {
    card: content,
    theme,
    meta: resolvedMeta,
    cssVars,
    fontImports,
    styleCSS,
  });
}
