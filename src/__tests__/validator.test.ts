import { describe, test, expect } from "bun:test";
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

describe("SizeName enum — all 17 sizes", () => {
  const allSizes = [
    "twitter", "twitter-square",
    "linkedin", "linkedin-square",
    "instagram-sq", "instagram-port", "instagram-land",
    "facebook-post", "facebook-square", "facebook-cover",
    "facebook-event", "facebook-group-cover",
    "threads-sq", "threads-port", "threads-land",
    "story", "custom",
  ];

  test("has exactly 17 sizes", () => {
    expect(Object.keys(SIZES)).toHaveLength(17);
  });

  test.each(allSizes)("accepts '%s'", (size) => {
    expect(() => SizeNameSchema.parse(size)).not.toThrow();
  });

  test("rejects unknown size", () => {
    expect(() => SizeNameSchema.parse("tiktok")).toThrow();
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
