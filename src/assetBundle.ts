import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { homedir } from "node:os";

import base_css from "../templates/_base.css" with { type: "text" };

import quote_template from "../templates/quote/template.njk" with { type: "text" };
import quote_style from "../templates/quote/style.css" with { type: "text" };
import minimal_template from "../templates/minimal/template.njk" with { type: "text" };
import minimal_style from "../templates/minimal/style.css" with { type: "text" };
import list_template from "../templates/list/template.njk" with { type: "text" };
import list_style from "../templates/list/style.css" with { type: "text" };
import manifesto_template from "../templates/manifesto/template.njk" with { type: "text" };
import manifesto_style from "../templates/manifesto/style.css" with { type: "text" };

import block_divider from "../templates/_blocks/divider.njk" with { type: "text" };
import block_blockquote from "../templates/_blocks/blockquote.njk" with { type: "text" };
import block_spacer from "../templates/_blocks/spacer.njk" with { type: "text" };
import block_bullet_list from "../templates/_blocks/bullet-list.njk" with { type: "text" };
import block_callout from "../templates/_blocks/callout.njk" with { type: "text" };
import block_text from "../templates/_blocks/text.njk" with { type: "text" };
import block_headline from "../templates/_blocks/headline.njk" with { type: "text" };
import block_slide_counter from "../templates/_blocks/slide-counter.njk" with { type: "text" };

import theme_paper_cream from "../themes/paper-cream.json";
import theme_terminal_green from "../themes/terminal-green.json";
import theme_noir_crimson from "../themes/noir-crimson.json";
import theme_sunset_rose from "../themes/sunset-rose.json";
import theme_dark_orange from "../themes/dark-orange.json";
import theme_light_minimal from "../themes/light-minimal.json";
import theme_brand_midnight from "../themes/brand-midnight.json";
import theme_brutal_white from "../themes/brutal-white.json";
import theme_oceanic from "../themes/oceanic.json";
import theme_dark_teal from "../themes/dark-teal.json";
import theme_kyoto from "../themes/kyoto.json";
import theme_mono_slate from "../themes/mono-slate.json";

import pkg from "../package.json";

type AssetMap = Record<string, string>;
type JsonMap = Record<string, unknown>;

const TEMPLATE_ASSETS: AssetMap = {
  "_base.css": base_css,
  "quote/template.njk": quote_template,
  "quote/style.css": quote_style,
  "minimal/template.njk": minimal_template,
  "minimal/style.css": minimal_style,
  "list/template.njk": list_template,
  "list/style.css": list_style,
  "manifesto/template.njk": manifesto_template,
  "manifesto/style.css": manifesto_style,
  "_blocks/divider.njk": block_divider,
  "_blocks/blockquote.njk": block_blockquote,
  "_blocks/spacer.njk": block_spacer,
  "_blocks/bullet-list.njk": block_bullet_list,
  "_blocks/callout.njk": block_callout,
  "_blocks/text.njk": block_text,
  "_blocks/headline.njk": block_headline,
  "_blocks/slide-counter.njk": block_slide_counter,
};

const THEME_ASSETS: JsonMap = {
  "paper-cream.json": theme_paper_cream,
  "terminal-green.json": theme_terminal_green,
  "noir-crimson.json": theme_noir_crimson,
  "sunset-rose.json": theme_sunset_rose,
  "dark-orange.json": theme_dark_orange,
  "light-minimal.json": theme_light_minimal,
  "brand-midnight.json": theme_brand_midnight,
  "brutal-white.json": theme_brutal_white,
  "oceanic.json": theme_oceanic,
  "dark-teal.json": theme_dark_teal,
  "kyoto.json": theme_kyoto,
  "mono-slate.json": theme_mono_slate,
};

const VERSION = (pkg as { version: string }).version;

let cached: { templatesDir: string; themesDir: string; mode: "repo" | "cache" } | null = null;

function detectRepoRoot(): string | null {
  try {
    const candidate = resolve(import.meta.dir, "..");
    const marker = join(candidate, "templates", "_base.css");
    if (existsSync(marker)) return candidate;
  } catch {
    // fall through
  }
  return null;
}

function cacheRoot(): string {
  const xdg = process.env.XDG_CACHE_HOME;
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), ".cache");
  return join(base, "quoteforge", VERSION);
}

function writeTextAssets(root: string, subdir: string, assets: AssetMap): string {
  const dir = join(root, subdir);
  for (const [rel, contents] of Object.entries(assets)) {
    const dest = join(dir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    if (!existsSync(dest) || readFileSync(dest, "utf-8") !== contents) {
      writeFileSync(dest, contents);
    }
  }
  return dir;
}

function writeJsonAssets(root: string, subdir: string, assets: JsonMap): string {
  const dir = join(root, subdir);
  for (const [rel, value] of Object.entries(assets)) {
    const dest = join(dir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    const serialized = JSON.stringify(value, null, 2) + "\n";
    if (!existsSync(dest) || readFileSync(dest, "utf-8") !== serialized) {
      writeFileSync(dest, serialized);
    }
  }
  return dir;
}

export function ensureAssets(): { templatesDir: string; themesDir: string; mode: "repo" | "cache" } {
  if (cached) return cached;

  const repo = detectRepoRoot();
  if (repo) {
    cached = {
      templatesDir: join(repo, "templates"),
      themesDir: join(repo, "themes"),
      mode: "repo",
    };
    return cached;
  }

  const root = cacheRoot();
  const templatesDir = writeTextAssets(root, "templates", TEMPLATE_ASSETS);
  const themesDir = writeJsonAssets(root, "themes", THEME_ASSETS);
  cached = { templatesDir, themesDir, mode: "cache" };
  return cached;
}

export function templatesDir(): string {
  return ensureAssets().templatesDir;
}

export function themesDir(): string {
  return ensureAssets().themesDir;
}

export function listBundledThemes(): string[] {
  return Object.keys(THEME_ASSETS).map((f) => f.replace(/\.json$/, ""));
}

export function assetBundleVersion(): string {
  return VERSION;
}

function configRoot(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), ".config");
  return join(base, "quoteforge");
}

export function userThemesDir(): string {
  if (ensureAssets().mode === "repo") {
    return ensureAssets().themesDir;
  }
  const dir = join(configRoot(), "themes");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function resolveThemeRead(name: string): string | null {
  const file = `${name}.json`;
  if (ensureAssets().mode === "cache") {
    const userPath = join(userThemesDir(), file);
    if (existsSync(userPath)) return userPath;
  }
  const bundledPath = join(ensureAssets().themesDir, file);
  return existsSync(bundledPath) ? bundledPath : null;
}

export function resolveThemeWrite(name: string): string {
  return join(userThemesDir(), `${name}.json`);
}

export function listAllThemes(): { name: string; source: "bundled" | "user" | "repo"; path: string }[] {
  const assets = ensureAssets();
  const out = new Map<string, { name: string; source: "bundled" | "user" | "repo"; path: string }>();

  if (assets.mode === "repo") {
    const repoSource = "repo" as const;
    try {
      const files = readdirSync(assets.themesDir);
      for (const f of files) {
        if (!f.endsWith(".json") || f.startsWith("_")) continue;
        const name = f.replace(/\.json$/, "");
        out.set(name, { name, source: repoSource, path: join(assets.themesDir, f) });
      }
    } catch {
      // ignore
    }
    return Array.from(out.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  for (const f of Object.keys(THEME_ASSETS)) {
    const name = f.replace(/\.json$/, "");
    out.set(name, { name, source: "bundled", path: join(assets.themesDir, f) });
  }
  try {
    const userDir = userThemesDir();
    const files = readdirSync(userDir);
    for (const f of files) {
      if (!f.endsWith(".json") || f.startsWith("_")) continue;
      const name = f.replace(/\.json$/, "");
      out.set(name, { name, source: "user", path: join(userDir, f) });
    }
  } catch {
    // ignore
  }

  return Array.from(out.values()).sort((a, b) => a.name.localeCompare(b.name));
}
