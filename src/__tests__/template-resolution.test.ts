import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { listTemplates, assertTemplateExists } from "../renderer/templates.js";
import { renderTemplate } from "../renderer/template-engine.js";
import { CardContentSchema, ThemeSchema } from "../cli/utils/validator.js";

const ROOT = resolve(import.meta.dir, "../..");

function loadJSON(relPath: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

describe("listTemplates", () => {
  test("returns real template folders and excludes _blocks", () => {
    const templates = listTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates).toContain("quote");
    expect(templates).toContain("minimal");
    expect(templates).not.toContain("_blocks");
    expect(templates).toEqual([...templates].sort());
  });
});

describe("assertTemplateExists", () => {
  test("passes for a known template", () => {
    expect(() => assertTemplateExists("quote")).not.toThrow();
  });

  test("throws for an unknown template", () => {
    expect(() => assertTemplateExists("does-not-exist")).toThrow();
  });

  test("message names the offending value and lists available templates", () => {
    try {
      assertTemplateExists("does-not-exist");
      throw new Error("expected assertTemplateExists to throw");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).toContain('"does-not-exist"');
      expect(message).toContain("quote");
      expect(message).toContain("minimal");
    }
  });
});

describe("renderTemplate with unknown template", () => {
  test("throws the clean error, not ENOENT", () => {
    const theme = ThemeSchema.parse(loadJSON("themes/dark-teal.json"));
    const card = CardContentSchema.parse({
      template: "does-not-exist",
      theme: "dark-teal",
      size: "og",
      blocks: [{ type: "text", content: "hello" }],
    });

    expect(() => renderTemplate(card, theme, { w: 1200, h: 630 })).toThrow(
      /Unknown template "does-not-exist"/,
    );
  });
});
