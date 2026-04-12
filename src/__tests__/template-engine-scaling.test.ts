import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderTemplate } from "../renderer/template-engine.js";
import { CardContentSchema, ThemeSchema, SIZES } from "../cli/utils/validator.js";

const ROOT = resolve(import.meta.dir, "../..");

function loadJSON(relPath: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

function extractVar(html: string, name: string): string | null {
  const match = html.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match ? (match[1]?.trim() ?? null) : null;
}

interface ScaleExpectation {
  size: keyof typeof SIZES;
  typeScale: string;
  headlineScale: string;
  spaceScale: string;
}

const GOLDEN: readonly ScaleExpectation[] = [
  { size: "instagram-sq",   typeScale: "1.25",  headlineScale: "1.15",  spaceScale: "1.18" },
  { size: "twitter",        typeScale: "0.86",  headlineScale: "0.912", spaceScale: "0.9"  },
  { size: "story",          typeScale: "1.25",  headlineScale: "1.15",  spaceScale: "1.18" },
  { size: "facebook-cover", typeScale: "0.843", headlineScale: "0.894", spaceScale: "0.9"  },
];

describe("template-engine: dimension-aware scaling", () => {
  const card = CardContentSchema.parse(loadJSON("content/examples/manifesto-wiki.json"));
  const theme = ThemeSchema.parse(loadJSON("themes/dark-teal.json"));

  for (const { size, typeScale, headlineScale, spaceScale } of GOLDEN) {
    test(`${size} → computed scales match golden values`, () => {
      const dims = SIZES[size];
      const html = renderTemplate(card, theme, { w: dims.w, h: dims.h });

      expect(extractVar(html, "--type-scale")).toBe(typeScale);
      expect(extractVar(html, "--headline-scale")).toBe(headlineScale);
      expect(extractVar(html, "--space-scale")).toBe(spaceScale);
    });
  }

  test("type-scale is capped at 1.25 for oversized dimensions", () => {
    const html = renderTemplate(card, theme, { w: 3000, h: 3000 });
    expect(extractVar(html, "--type-scale")).toBe("1.25");
  });

  test("space-scale floor is 0.9 for tiny/stretched dimensions", () => {
    const html = renderTemplate(card, theme, { w: 200, h: 200 });
    expect(extractVar(html, "--space-scale")).toBe("0.9");
  });

  test("headline-scale is capped at 1.15 regardless of input", () => {
    const html = renderTemplate(card, theme, { w: 5000, h: 5000 });
    expect(extractVar(html, "--headline-scale")).toBe("1.15");
  });

  test("aspect penalty floor (0.6) activates on ultra-wide ratios", () => {
    // facebook-cover (1640×624, ~2.63:1) is wide enough to trigger the penalty floor.
    // Ratio 0.38^0.65 ≈ 0.53, so max(0.6, 0.53) = 0.6 locks in.
    const html = renderTemplate(card, theme, { w: 1640, h: 624 });
    // With aspectPenalty=0.6, typeScale = min(sqrt(1640*624)/1080 * 0.6 * 1.5, 1.25) = 0.843
    expect(extractVar(html, "--type-scale")).toBe("0.843");
  });
});
