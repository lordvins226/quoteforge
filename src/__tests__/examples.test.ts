import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CardContentSchema,
  DeckContentSchema,
  ThemeSchema,
  detectAndValidate,
} from "../cli/utils/validator.js";

const ROOT = resolve(import.meta.dir, "../..");

function loadJSON(relPath: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

describe("Example file: manifesto-wiki.json", () => {
  const raw = loadJSON("content/examples/manifesto-wiki.json");

  test("passes CardContent validation", () => {
    expect(() => CardContentSchema.parse(raw)).not.toThrow();
  });

  test("detectAndValidate identifies it as a card", () => {
    const result = detectAndValidate(raw);
    expect(result.kind).toBe("card");
  });
});

describe("Example file: intro-deck.json", () => {
  const raw = loadJSON("decks/examples/intro-deck.json");

  test("passes DeckContent validation", () => {
    expect(() => DeckContentSchema.parse(raw)).not.toThrow();
  });

  test("detectAndValidate identifies it as a deck", () => {
    const result = detectAndValidate(raw);
    expect(result.kind).toBe("deck");
  });

  test("has exactly 5 slides", () => {
    const parsed = DeckContentSchema.parse(raw);
    expect(parsed.slides).toHaveLength(5);
  });

  test("has type field set to 'deck'", () => {
    expect((raw as Record<string, unknown>).type).toBe("deck");
  });
});

describe("Theme file: dark-teal.json", () => {
  const raw = loadJSON("themes/dark-teal.json");

  test("passes Theme validation", () => {
    expect(() => ThemeSchema.parse(raw)).not.toThrow();
  });

  test("background is #1a1a1a", () => {
    const theme = ThemeSchema.parse(raw);
    expect(theme.colors.background).toBe("#1a1a1a");
  });

  test("accent is #4ecdc4", () => {
    const theme = ThemeSchema.parse(raw);
    expect(theme.colors.accent).toBe("#4ecdc4");
  });
});
