import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BlockSchema,
  CardContentSchema,
  DeckContentSchema,
  ThemeSchema,
  SizeNameSchema,
  PartStyleSchema,
  PartSchema,
  SIZES,
  detectAndValidate,
} from "../cli/utils/validator.js";

describe("PartStyle enum", () => {
  const validStyles = ["normal", "bold", "italic", "accent", "accent-italic", "mono", "muted"];

  test.each(validStyles)("accepts '%s'", (style) => {
    expect(() => PartStyleSchema.parse(style)).not.toThrow();
  });

  test("rejects unknown style", () => {
    expect(() => PartStyleSchema.parse("underline")).toThrow();
  });
});

describe("Part schema", () => {
  test("accepts valid part", () => {
    expect(() => PartSchema.parse({ text: "hello", style: "bold" })).not.toThrow();
  });

  test("rejects missing text", () => {
    expect(() => PartSchema.parse({ style: "bold" })).toThrow();
  });

  test("rejects missing style", () => {
    expect(() => PartSchema.parse({ text: "hello" })).toThrow();
  });
});

describe("Block schema — all 7 types", () => {
  test("headline with parts", () => {
    expect(() =>
      BlockSchema.parse({
        type: "headline",
        parts: [{ text: "Hello", style: "normal" }],
      })
    ).not.toThrow();
  });

  test("headline rejects empty parts", () => {
    expect(() =>
      BlockSchema.parse({ type: "headline", parts: [] })
    ).toThrow();
  });

  test("blockquote with parts", () => {
    expect(() =>
      BlockSchema.parse({
        type: "blockquote",
        parts: [{ text: "Quote", style: "italic" }],
      })
    ).not.toThrow();
  });

  test("text with content", () => {
    expect(() =>
      BlockSchema.parse({ type: "text", content: "Some text" })
    ).not.toThrow();
  });

  test("text rejects missing content", () => {
    expect(() => BlockSchema.parse({ type: "text" })).toThrow();
  });

  test("bullet-list with items", () => {
    expect(() =>
      BlockSchema.parse({
        type: "bullet-list",
        items: [{ label: "A", text: "desc" }],
      })
    ).not.toThrow();
  });

  test("bullet-list rejects empty items", () => {
    expect(() =>
      BlockSchema.parse({ type: "bullet-list", items: [] })
    ).toThrow();
  });

  test("callout with items", () => {
    expect(() =>
      BlockSchema.parse({
        type: "callout",
        items: [{ label: "Note", text: "important" }],
      })
    ).not.toThrow();
  });

  test("divider (no extra fields)", () => {
    expect(() => BlockSchema.parse({ type: "divider" })).not.toThrow();
  });

  test("spacer with size sm", () => {
    expect(() => BlockSchema.parse({ type: "spacer", size: "sm" })).not.toThrow();
  });

  test("spacer with size md", () => {
    expect(() => BlockSchema.parse({ type: "spacer", size: "md" })).not.toThrow();
  });

  test("spacer with size lg", () => {
    expect(() => BlockSchema.parse({ type: "spacer", size: "lg" })).not.toThrow();
  });

  test("spacer rejects invalid size", () => {
    expect(() => BlockSchema.parse({ type: "spacer", size: "xl" })).toThrow();
  });

  test("rejects unknown block type", () => {
    expect(() => BlockSchema.parse({ type: "unknown-block" })).toThrow();
  });

  test("optional id field accepted on all blocks", () => {
    expect(() =>
      BlockSchema.parse({ type: "divider", id: "my-divider" })
    ).not.toThrow();
  });
});

describe("Image block schema", () => {
  test("accepts a minimal image block and applies defaults", () => {
    const parsed = BlockSchema.parse({ type: "image", src: "https://example.com/a.png" });
    expect(parsed).toMatchObject({ type: "image", src: "https://example.com/a.png", width: "full", align: "center" });
  });

  test("accepts explicit width, align, alt", () => {
    expect(() =>
      BlockSchema.parse({ type: "image", src: "./a.jpg", alt: "A", width: "sm", align: "left" }),
    ).not.toThrow();
  });

  test("rejects an image block with no src", () => {
    expect(() => BlockSchema.parse({ type: "image", width: "full", align: "center" })).toThrow();
  });

  test("rejects empty src", () => {
    expect(() => BlockSchema.parse({ type: "image", src: "" })).toThrow();
  });

  test("rejects unknown width", () => {
    expect(() => BlockSchema.parse({ type: "image", src: "x", width: "huge" })).toThrow();
  });
});

describe("Stat block schema", () => {
  test("accepts a valid stat block", () => {
    expect(() =>
      BlockSchema.parse({ type: "stat", value: "37", unit: "kb", label: "Bundle size", note: "Down from 214kb." }),
    ).not.toThrow();
  });

  test("accepts a minimal stat block (value only)", () => {
    expect(() => BlockSchema.parse({ type: "stat", value: "100" })).not.toThrow();
  });

  test("rejects an empty value", () => {
    expect(() => BlockSchema.parse({ type: "stat", value: "" })).toThrow();
  });

  test("rejects an unknown key", () => {
    expect(() => BlockSchema.parse({ type: "stat", value: "37", bogus: 1 })).toThrow(/bogus/);
  });
});

describe("Code block schema", () => {
  test("accepts a valid code block", () => {
    expect(() =>
      BlockSchema.parse({ type: "code", filename: "card.json", lang: "json", lines: ["{", "}"] }),
    ).not.toThrow();
  });

  test("accepts a minimal code block (lines only)", () => {
    expect(() => BlockSchema.parse({ type: "code", lines: ["// hi"] })).not.toThrow();
  });

  test("rejects an empty lines array", () => {
    expect(() => BlockSchema.parse({ type: "code", lines: [] })).toThrow();
  });

  test("rejects an unknown key", () => {
    expect(() => BlockSchema.parse({ type: "code", lines: ["a"], bogus: 1 })).toThrow(/bogus/);
  });
});

describe("Chart block schema", () => {
  test("accepts a valid chart block", () => {
    expect(() =>
      BlockSchema.parse({
        type: "chart",
        unit: "%",
        rows: [{ label: "Chrome launch", value: 61 }, { label: "Nunjucks", value: 11, muted: true }],
      }),
    ).not.toThrow();
  });

  test("rejects an empty rows array", () => {
    expect(() => BlockSchema.parse({ type: "chart", rows: [] })).toThrow();
  });

  test("rejects a row value over 100", () => {
    expect(() => BlockSchema.parse({ type: "chart", rows: [{ label: "x", value: 101 }] })).toThrow();
  });

  test("rejects a row value under 0", () => {
    expect(() => BlockSchema.parse({ type: "chart", rows: [{ label: "x", value: -1 }] })).toThrow();
  });

  test("rejects an unknown key on the chart block", () => {
    expect(() => BlockSchema.parse({ type: "chart", rows: [{ label: "x", value: 1 }], bogus: 1 })).toThrow(/bogus/);
  });

  test("rejects an unknown key inside a chart row", () => {
    expect(() => BlockSchema.parse({ type: "chart", rows: [{ label: "x", value: 1, bogus: 1 }] })).toThrow(/bogus/);
  });
});

describe("SizeName enum — all 22 sizes", () => {
  const allSizes = [
    "twitter", "twitter-square",
    "linkedin", "linkedin-square",
    "instagram-sq", "instagram-port", "instagram-land",
    "facebook-post", "facebook-square", "facebook-cover",
    "facebook-event", "facebook-group-cover",
    "threads-sq", "threads-port", "threads-land",
    "story", "custom",
    "og", "readme-hero", "slide-16x9", "4x3", "3x2",
  ];

  test("has exactly 22 sizes", () => {
    expect(Object.keys(SIZES)).toHaveLength(22);
  });

  test.each(allSizes)("accepts '%s'", (size) => {
    expect(() => SizeNameSchema.parse(size)).not.toThrow();
  });

  test("rejects unknown size", () => {
    expect(() => SizeNameSchema.parse("tiktok")).toThrow();
  });
});

describe("Non-social presets", () => {
  test.each([
    ["og", 1200, 630],
    ["readme-hero", 1280, 640],
    ["slide-16x9", 1920, 1080],
    ["4x3", 1600, 1200],
    ["3x2", 1500, 1000],
  ])("%s resolves to %i x %i", (name, w, h) => {
    expect(SIZES[name as keyof typeof SIZES]).toEqual(expect.objectContaining({ w, h }));
  });
});

describe("SIZES dimensions", () => {
  test("twitter: 1200×675", () => {
    expect(SIZES.twitter).toEqual(expect.objectContaining({ w: 1200, h: 675 }));
  });

  test("facebook-post: 1200×630", () => {
    expect(SIZES["facebook-post"]).toEqual(expect.objectContaining({ w: 1200, h: 630 }));
  });

  test("facebook-cover: 1640×624", () => {
    expect(SIZES["facebook-cover"]).toEqual(expect.objectContaining({ w: 1640, h: 624 }));
  });

  test("facebook-square: 1080×1080", () => {
    expect(SIZES["facebook-square"]).toEqual(expect.objectContaining({ w: 1080, h: 1080 }));
  });

  test("facebook-event: 1920×1080", () => {
    expect(SIZES["facebook-event"]).toEqual(expect.objectContaining({ w: 1920, h: 1080 }));
  });

  test("facebook-group-cover: 1640×856", () => {
    expect(SIZES["facebook-group-cover"]).toEqual(expect.objectContaining({ w: 1640, h: 856 }));
  });

  test("instagram-sq: 1080×1080", () => {
    expect(SIZES["instagram-sq"]).toEqual(expect.objectContaining({ w: 1080, h: 1080 }));
  });

  test("story: 1080×1920", () => {
    expect(SIZES.story).toEqual(expect.objectContaining({ w: 1080, h: 1920 }));
  });
});

describe("detectAndValidate", () => {
  const minCard = {
    template: "manifesto",
    theme: "dark-teal",
    size: "twitter",
    blocks: [{ type: "text", content: "hello" }],
  };

  const minDeck = {
    type: "deck" as const,
    defaults: { template: "manifesto", theme: "dark-teal", size: "twitter" },
    slides: [
      { id: "s1", blocks: [{ type: "text", content: "hello" }] },
    ],
  };

  test("detects card when type is missing", () => {
    const result = detectAndValidate(minCard);
    expect(result.kind).toBe("card");
  });

  test("detects card when type is 'card'", () => {
    const result = detectAndValidate({ ...minCard, type: "card" });
    expect(result.kind).toBe("card");
  });

  test("detects deck when type is 'deck'", () => {
    const result = detectAndValidate(minDeck);
    expect(result.kind).toBe("deck");
  });

  test("throws on completely invalid input", () => {
    expect(() => detectAndValidate({ foo: "bar" })).toThrow();
  });

  test("throws on null input", () => {
    expect(() => detectAndValidate(null)).toThrow();
  });
});

describe("Custom dimensions", () => {
  const base = {
    template: "manifesto",
    theme: "dark-teal",
    blocks: [{ type: "headline", parts: [{ text: "Test", style: "normal" }] }],
  };

  test("accepts size 'custom' with width and height", () => {
    const parsed = CardContentSchema.parse({ ...base, size: "custom", width: 1200, height: 900 });
    expect(parsed.width).toBe(1200);
    expect(parsed.height).toBe(900);
  });

  test("rejects size 'custom' without width", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", height: 900 }))
      .toThrow(/width/);
  });

  test("rejects size 'custom' without height", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", width: 1200 }))
      .toThrow(/height/);
  });

  test("rejects size 'custom' with neither dimension", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom" })).toThrow();
  });

  test("rejects width/height on a preset size", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "twitter", width: 1200, height: 900 }))
      .toThrow(/only allowed when size is \\?"custom\\?"/);
  });

  test("accepts a preset size with no dimensions", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "twitter" })).not.toThrow();
  });

  test.each([0, -100, 1.5, 8001])("rejects invalid dimension %p", (bad) => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", width: bad, height: 900 }))
      .toThrow();
  });

  test("accepts the maximum dimension", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", width: 8000, height: 8000 }))
      .not.toThrow();
  });
});

describe("Custom dimensions in decks", () => {
  const slideBlocks = [{ type: "headline", parts: [{ text: "S", style: "normal" }] }];

  test("accepts custom dimensions in deck defaults", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "custom", width: 1600, height: 1200 },
      slides: [{ id: "s1", blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).not.toThrow();
  });

  test("rejects deck defaults with size 'custom' and no dimensions", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "custom" },
      slides: [{ id: "s1", blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).toThrow(/width/);
  });

  test("accepts a per-slide custom size", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "instagram-sq" },
      slides: [{ id: "s1", size: "custom", width: 800, height: 600, blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).not.toThrow();
  });

  test("rejects slide dimensions without an explicit custom size", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "instagram-sq" },
      slides: [{ id: "s1", width: 800, height: 600, blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).toThrow(/only allowed when size is \\?"custom\\?"/);
  });
});

describe("Strict schemas", () => {
  const card = {
    template: "manifesto",
    theme: "dark-teal",
    size: "twitter",
    blocks: [{ type: "headline", parts: [{ text: "Test", style: "normal" }] }],
  };

  test("rejects an unknown root key and names it", () => {
    expect(() => CardContentSchema.parse({ ...card, bogusKey: 1 }))
      .toThrow(/bogusKey/);
  });

  test("rejects a misspelled field inside a block", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      blocks: [{ type: "headline", part: [{ text: "Test", style: "normal" }] }],
    })).toThrow();
  });

  test("rejects an unknown key inside a block", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      blocks: [{ type: "headline", parts: [{ text: "T", style: "normal" }], bogus: 1 }],
    })).toThrow(/bogus/);
  });

  test("rejects an unknown key inside a part", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      blocks: [{ type: "headline", parts: [{ text: "T", style: "normal", bogus: 1 }] }],
    })).toThrow(/bogus/);
  });

  test("rejects an unknown key inside meta", () => {
    expect(() => CardContentSchema.parse({ ...card, meta: { title: "x", bogus: 1 } }))
      .toThrow(/bogus/);
  });

  test("rejects an unknown key in a theme", () => {
    const theme = JSON.parse(
      readFileSync(resolve(import.meta.dir, "../../themes/dark-teal.json"), "utf-8"),
    ) as Record<string, unknown>;
    expect(() => ThemeSchema.parse({ ...theme, bogus: 1 })).toThrow(/bogus/);
  });

  test("rejects an unknown key in deck defaults", () => {
    expect(() => DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "twitter", bogus: 1 },
      slides: [{ id: "s1", blocks: card.blocks }],
    })).toThrow(/bogus/);
  });

  test("rejects an unknown key on a slide", () => {
    expect(() => DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "twitter" },
      slides: [{ id: "s1", blocks: card.blocks, bogus: 1 }],
    })).toThrow(/bogus/);
  });

  test("still accepts the documented extension points", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      $schema: "./schema.json",
      meta: { title: "T", created: "2026-07-19", tags: ["a"] },
    })).not.toThrow();
  });
});

describe("Vertical alignment", () => {
  const base = {
    template: "quote",
    theme: "dark-teal",
    size: "instagram-sq",
    blocks: [{ type: "headline", parts: [{ text: "T", style: "normal" }] }],
  };

  test.each(["top", "center", "bottom", "spread"])("accepts align '%s'", (a) => {
    expect(() => CardContentSchema.parse({ ...base, align: a })).not.toThrow();
  });

  test("accepts a card with no align (defaults later, not at parse)", () => {
    expect(() => CardContentSchema.parse(base)).not.toThrow();
  });

  test("rejects an unknown align value, naming the field", () => {
    expect(() => CardContentSchema.parse({ ...base, align: "middle" })).toThrow(/align/);
  });

  test("accepts align on deck defaults and on a slide", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "instagram-sq", align: "bottom" },
      slides: [{ id: "s1", align: "top", blocks: base.blocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).not.toThrow();
  });
});

describe("Card eyebrow", () => {
  const base = {
    template: "split",
    theme: "dark-teal",
    size: "instagram-sq",
    blocks: [{ type: "headline", parts: [{ text: "T", style: "normal" }] }],
  };

  test("accepts a card with a valid eyebrow", () => {
    const parsed = CardContentSchema.parse({ ...base, eyebrow: "Featured" });
    expect(parsed.eyebrow).toBe("Featured");
  });

  test("accepts a card with no eyebrow", () => {
    expect(() => CardContentSchema.parse(base)).not.toThrow();
  });

  test("rejects an eyebrow over 48 characters", () => {
    expect(() => CardContentSchema.parse({ ...base, eyebrow: "x".repeat(49) }))
      .toThrow(/eyebrow/);
  });

  test("a deck slide inherits eyebrow from defaults and can override it", () => {
    const inheritedDeck = {
      type: "deck",
      defaults: { template: "split", theme: "dark-teal", size: "instagram-sq", eyebrow: "From Defaults" },
      slides: [{ id: "s1", blocks: base.blocks }],
    };
    const overriddenDeck = {
      type: "deck",
      defaults: { template: "split", theme: "dark-teal", size: "instagram-sq", eyebrow: "From Defaults" },
      slides: [{ id: "s1", eyebrow: "Slide Override", blocks: base.blocks }],
    };

    const inherited = DeckContentSchema.parse(inheritedDeck);
    const overridden = DeckContentSchema.parse(overriddenDeck);

    expect(inherited.defaults.eyebrow).toBe("From Defaults");
    expect(inherited.slides[0]?.eyebrow).toBeUndefined();
    expect(overridden.slides[0]?.eyebrow).toBe("Slide Override");
  });

  test("slide's pre-existing editor label is a distinct field from eyebrow", () => {
    const deck = {
      type: "deck",
      defaults: { template: "split", theme: "dark-teal", size: "instagram-sq" },
      slides: [{ id: "s1", label: "Slide 2", blocks: base.blocks }],
    };
    const parsed = DeckContentSchema.parse(deck);
    expect(parsed.slides[0]?.label).toBe("Slide 2");
    expect(parsed.slides[0]?.eyebrow).toBeUndefined();
  });
});
