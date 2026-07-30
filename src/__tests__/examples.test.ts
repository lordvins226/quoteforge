import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  CardContentSchema,
  DeckContentSchema,
  ThemeSchema,
  detectAndValidate,
} from "../cli/utils/validator.js";

const ROOT = resolve(import.meta.dir, "../..");

function loadJSON(absPath: string): unknown {
  return JSON.parse(readFileSync(absPath, "utf-8"));
}

function jsonFilesIn(relDir: string): string[] {
  const dir = resolve(ROOT, relDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => join(dir, f));
}

const cardFiles = jsonFilesIn("content/examples");
const deckFiles = jsonFilesIn("decks/examples");
const themeFiles = jsonFilesIn("themes").filter((f) => !f.endsWith("_schema.json"));

describe("Shipped card examples", () => {
  test("at least one example exists", () => {
    expect(cardFiles.length).toBeGreaterThan(0);
  });

  test.each(cardFiles)("%s validates as a card", (file) => {
    const raw = loadJSON(file);
    expect(() => CardContentSchema.parse(raw)).not.toThrow();
    expect(detectAndValidate(raw).kind).toBe("card");
  });
});

describe("Shipped deck examples", () => {
  test("at least one deck exists", () => {
    expect(deckFiles.length).toBeGreaterThan(0);
  });

  test.each(deckFiles)("%s validates as a deck", (file) => {
    const raw = loadJSON(file);
    expect(() => DeckContentSchema.parse(raw)).not.toThrow();
    expect(detectAndValidate(raw).kind).toBe("deck");
  });
});

describe("Shipped themes", () => {
  test("all 12 built-in themes are present", () => {
    expect(themeFiles).toHaveLength(12);
  });

  test.each(themeFiles)("%s validates as a theme", (file) => {
    expect(() => ThemeSchema.parse(loadJSON(file))).not.toThrow();
  });
});

describe("dark-teal theme values", () => {
  const theme = ThemeSchema.parse(loadJSON(resolve(ROOT, "themes/dark-teal.json")));

  test("background is #1a1a1a", () => {
    expect(theme.colors.background).toBe("#1a1a1a");
  });

  test("accent is #4ecdc4", () => {
    expect(theme.colors.accent).toBe("#4ecdc4");
  });
});
