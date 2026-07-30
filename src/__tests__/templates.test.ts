import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderTemplate } from "../renderer/template-engine.js";
import { CardContentSchema, ThemeSchema } from "../cli/utils/validator.js";

const ROOT = resolve(import.meta.dir, "../..");

function loadJSON(relPath: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

function assertNoHardcodedHex(templateName: string): void {
  const styleCSS = readFileSync(resolve(ROOT, `templates/${templateName}/style.css`), "utf-8");
  const hexPattern = /#[0-9a-fA-F]{3,8}/g;
  expect(styleCSS.match(hexPattern)).toBeNull();
}

describe("split template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/dark-teal.json"));

  test("routes the first headline block into the rail", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/split-demo.json"));
    const html = renderTemplate(card, theme, { w: 1200, h: 630 });

    expect(html).toContain("split-rail");
    expect(html).toContain("split-main");
    expect(html).toContain("0.6");
  });

  test("falls back to label-only rail when the first block is not a headline", () => {
    const card = CardContentSchema.parse({
      template: "split",
      theme: "dark-teal",
      size: "og",
      blocks: [
        { type: "text", content: "Not a headline" },
        { type: "headline", parts: [{ text: "Falls through to main", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1200, h: 630 });

    expect(html).toContain("split-rail-label");
    expect(html).toContain("Falls through to main");

    const railSection = html.slice(html.indexOf("split-rail"), html.indexOf("split-main"));
    expect(railSection).not.toContain("block-headline");
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("split");
  });
});
