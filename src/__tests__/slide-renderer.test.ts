import { describe, expect, test } from "bun:test";
import { buildSlideCardContent } from "../renderer/slide-renderer.js";
import { resolveDimensions } from "../renderer/dimensions.js";
import type { DeckContent } from "../cli/utils/validator.js";

function makeDeck(overrides: Partial<DeckContent["defaults"]>): DeckContent {
  return {
    type: "deck",
    defaults: {
      template: "basic",
      theme: "default",
      size: "instagram-sq",
      ...overrides,
    },
    slides: [
      {
        id: "slide-1",
        blocks: [{ type: "text", content: "hello" }],
      },
    ],
  } as DeckContent;
}

describe("buildSlideCardContent", () => {
  test("inherits custom width/height from deck defaults", () => {
    const deck = makeDeck({ size: "custom", width: 1200, height: 900 });
    const slide = deck.slides[0]!;

    const cardContent = buildSlideCardContent(slide, deck, {});

    expect(cardContent.size).toBe("custom");
    expect(cardContent.width).toBe(1200);
    expect(cardContent.height).toBe(900);
    expect(resolveDimensions(cardContent)).toEqual({ w: 1200, h: 900 });
  });

  test("uses per-slide custom width/height when defaults are a preset", () => {
    const deck = makeDeck({ size: "instagram-sq" });
    const slide = {
      id: "slide-1",
      size: "custom" as const,
      width: 500,
      height: 700,
      blocks: [{ type: "text", content: "hello" }],
    };

    const cardContent = buildSlideCardContent(slide, deck, {});

    expect(cardContent.size).toBe("custom");
    expect(cardContent.width).toBe(500);
    expect(cardContent.height).toBe(700);
    expect(resolveDimensions(cardContent)).toEqual({ w: 500, h: 700 });
  });

  test("slide preset override with custom defaults uses preset dimensions", () => {
    const deck = makeDeck({ size: "custom", width: 1200, height: 900 });
    const slide = {
      id: "slide-1",
      size: "instagram-sq" as const,
      blocks: [{ type: "text", content: "hello" }],
    };

    const cardContent = buildSlideCardContent(slide, deck, {});

    expect(cardContent.size).toBe("instagram-sq");
    expect(resolveDimensions(cardContent)).toEqual({ w: 1080, h: 1080 });
  });
});
