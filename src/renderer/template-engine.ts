import nunjucks from "nunjucks";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFontImports } from "./font-loader.js";
import { templatesDir } from "../assetBundle.js";
import type { CardContent, Theme, Part, PartStyle } from "../cli/utils/validator.js";

const TEMPLATES_DIR = templatesDir();
const IS_DEV = process.env.NODE_ENV === "development";

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(TEMPLATES_DIR, { noCache: IS_DEV }),
  { autoescape: true },
);

const cssCache = new Map<string, string>();
function readCssCached(path: string): string {
  if (IS_DEV) return readFileSync(path, "utf-8");
  const hit = cssCache.get(path);
  if (hit !== undefined) return hit;
  const value = readFileSync(path, "utf-8");
  cssCache.set(path, value);
  return value;
}

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

function buildCssVars(theme: Theme, dimensions: { w: number; h: number }): string {
  const shortSide = Math.min(dimensions.w, dimensions.h);
  const longSide = Math.max(dimensions.w, dimensions.h);
  const aspectRatio = shortSide / longSide;
  const areaScale = Math.sqrt(dimensions.w * dimensions.h) / 1080;
  const aspectPenalty = Math.max(0.6, Math.pow(aspectRatio, 0.65));
  const typeScale = +Math.min(areaScale * aspectPenalty * 1.5, 1.25).toFixed(3);
  const headlineScale = +Math.min(typeScale * 1.06, 1.15).toFixed(3);
  const spaceScale = +Math.max(0.9, Math.min(typeScale, 1.18)).toFixed(3);

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
    "--type-scale": String(typeScale),
    "--headline-scale": String(headlineScale),
    "--space-scale": String(spaceScale),
    "--body-min": "14px",
  };

  return Object.entries(vars)
    .map(([key, val]) => `${key}: ${val};`)
    .join("\n    ");
}

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
  dimensions: { w: number; h: number } = { w: 1200, h: 675 },
  meta?: Partial<RenderMeta>,
): string {
  const resolvedMeta = { ...DEFAULT_META, ...meta };
  const fontImports = buildFontImports(theme);
  const cssVars = buildCssVars(theme, dimensions);

  const templatePath = `${content.template}/template.njk`;
  const basePath = join(TEMPLATES_DIR, "_base.css");
  const stylePath = join(TEMPLATES_DIR, content.template, "style.css");
  const baseCSS = readCssCached(basePath);
  const styleCSS = readCssCached(stylePath);

  return env.render(templatePath, {
    card: content,
    theme,
    meta: resolvedMeta,
    cssVars,
    fontImports,
    baseCSS,
    styleCSS,
  });
}
