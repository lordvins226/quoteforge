import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderTemplate } from "../renderer/template-engine.js";
import { CardContentSchema, DeckContentSchema, ThemeSchema } from "../cli/utils/validator.js";
import { buildSlideCardContent } from "../renderer/slide-renderer.js";

const ROOT = resolve(import.meta.dir, "../..");

function loadJSON(relPath: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), "utf-8"));
}

function assertNoHardcodedHex(templateName: string): void {
  const styleCSS = readFileSync(resolve(ROOT, `templates/${templateName}/style.css`), "utf-8");
  const hexPattern = /#[0-9a-fA-F]{3,8}/g;
  expect(styleCSS.match(hexPattern)).toBeNull();
}

function bodyOnly(html: string): string {
  return html.slice(html.indexOf("<body>"));
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

  test("falls back to eyebrow-only rail when the first block is not a headline", () => {
    const card = CardContentSchema.parse({
      template: "split",
      theme: "dark-teal",
      size: "og",
      eyebrow: "Featured",
      blocks: [
        { type: "text", content: "Not a headline" },
        { type: "headline", parts: [{ text: "Falls through to main", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1200, h: 630 });

    expect(html).toContain("split-rail-label");
    expect(html).toContain("Falls through to main");

    const railSection = html.slice(html.indexOf('<div class="split-rail">'), html.indexOf('<div class="split-main">'));
    expect(railSection).not.toContain("block-headline");
  });

  test("renders card.eyebrow in the rail when present", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/split-demo.json"));
    const html = renderTemplate(card, theme, { w: 1200, h: 630 });

    expect(card.eyebrow).toBeDefined();
    const railSection = html.slice(html.indexOf('<div class="split-rail">'), html.indexOf('<div class="split-main">'));
    expect(railSection).toContain(card.eyebrow as string);
  });

  test("renders no stray fallback text when eyebrow is absent", () => {
    const card = CardContentSchema.parse({
      template: "split",
      theme: "dark-teal",
      size: "og",
      blocks: [
        { type: "headline", parts: [{ text: "No eyebrow here", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1200, h: 630 });

    const railSection = html.slice(html.indexOf('<div class="split-rail">'), html.indexOf('<div class="split-main">'));
    expect(railSection).not.toContain("Featured");
  });

  test("a deck slide's editor label never renders as chrome text (regression guard)", () => {
    const deck = DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "split", theme: "dark-teal", size: "og" },
      slides: [
        {
          id: "s1",
          label: "Slide 2",
          blocks: [{ type: "headline", parts: [{ text: "Body headline", style: "normal" }] }],
        },
      ],
    });
    const slide = deck.slides[0]!;
    const card = buildSlideCardContent(slide, deck, {});
    const html = renderTemplate(card, theme, { w: 1200, h: 630 });

    const railSection = html.slice(html.indexOf('<div class="split-rail">'), html.indexOf('<div class="split-main">'));
    expect(railSection).not.toContain("split-rail-label");
    expect(railSection).not.toContain("Slide 2");
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("split");
  });
});

describe("terminal template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/terminal-green.json"));

  test("renders the window bar chrome and prompt/status sigils", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/terminal-demo.json"));
    const html = renderTemplate(card, theme, { w: 1200, h: 675 });

    expect(html).toContain("term-bar");
    expect(html).toContain("term-dot");
    expect(html).toContain("term-body");
  });

  test("renders card.eyebrow as the window title when present", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/terminal-demo.json"));
    const html = renderTemplate(card, theme, { w: 1200, h: 675 });

    expect(card.eyebrow).toBeDefined();
    expect(html).toContain(`<span class="term-title">${card.eyebrow as string}</span>`);
  });

  test("renders no window title when eyebrow is absent", () => {
    const card = CardContentSchema.parse({
      template: "terminal",
      theme: "terminal-green",
      size: "twitter",
      blocks: [
        { type: "headline", parts: [{ text: "No title here", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1200, h: 675 });

    expect(bodyOnly(html)).not.toContain("term-title");
  });

  test("a deck slide's editor label never renders as chrome text (regression guard)", () => {
    const deck = DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "terminal", theme: "terminal-green", size: "twitter" },
      slides: [
        {
          id: "s1",
          label: "Slide 2",
          blocks: [{ type: "headline", parts: [{ text: "Body headline", style: "normal" }] }],
        },
      ],
    });
    const slide = deck.slides[0]!;
    const card = buildSlideCardContent(slide, deck, {});
    const html = renderTemplate(card, theme, { w: 1200, h: 675 });

    expect(bodyOnly(html)).not.toContain("term-title");
    expect(html).not.toContain("Slide 2");
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("terminal");
  });
});

describe("spotlight template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/noir-crimson.json"));

  test("renders the poster-scale headline and kicker", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/spotlight-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(html).toContain("spot-kicker");
    expect(html).toContain("Delete more code");
  });

  test("renders card.eyebrow as the kicker when present", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/spotlight-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(card.eyebrow).toBeDefined();
    expect(html).toContain(`<div class="spot-kicker">${card.eyebrow as string}</div>`);
  });

  test("renders no kicker when eyebrow is absent", () => {
    const card = CardContentSchema.parse({
      template: "spotlight",
      theme: "noir-crimson",
      size: "instagram-sq",
      blocks: [
        { type: "headline", parts: [{ text: "No kicker here", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(bodyOnly(html)).not.toContain("spot-kicker");
  });

  test("a deck slide's editor label never renders as chrome text (regression guard)", () => {
    const deck = DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "spotlight", theme: "noir-crimson", size: "instagram-sq" },
      slides: [
        {
          id: "s1",
          label: "Slide 2",
          blocks: [{ type: "headline", parts: [{ text: "Body headline", style: "normal" }] }],
        },
      ],
    });
    const slide = deck.slides[0]!;
    const card = buildSlideCardContent(slide, deck, {});
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(bodyOnly(html)).not.toContain("spot-kicker");
    expect(html).not.toContain("Slide 2");
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("spotlight");
  });
});

describe("frame template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/kyoto.json"));

  test("renders the four corner marks and the bordered plate", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/frame-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(html).toContain('frame-mark tl');
    expect(html).toContain('frame-mark tr');
    expect(html).toContain('frame-mark bl');
    expect(html).toContain('frame-mark br');
    expect(html).toContain("frame-inner");
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("frame");
  });
});

describe("cover template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/mono-slate.json"));

  test("anchors the title at the bottom with a byline row", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/cover-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1350 });

    expect(html).toContain("cover-top");
    expect(html).toContain("cover-bottom");
    expect(html).toContain("cover-byline");
    expect(html).toContain("cover-mark");
  });

  test("renders card.eyebrow as the top meta line when present", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/cover-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1350 });

    expect(card.eyebrow).toBeDefined();
    expect(html).toContain(`<span class="cover-meta">${card.eyebrow as string}</span>`);
  });

  test("renders an empty meta line when eyebrow is absent", () => {
    const card = CardContentSchema.parse({
      template: "cover",
      theme: "mono-slate",
      size: "instagram-port",
      blocks: [
        { type: "headline", parts: [{ text: "No meta here", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1080, h: 1350 });

    expect(html).toContain('<span class="cover-meta"></span>');
  });

  test("a deck slide's editor label never renders as chrome text (regression guard)", () => {
    const deck = DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "cover", theme: "mono-slate", size: "instagram-port" },
      slides: [
        {
          id: "s1",
          label: "Slide 2",
          blocks: [{ type: "headline", parts: [{ text: "Body headline", style: "normal" }] }],
        },
      ],
    });
    const slide = deck.slides[0]!;
    const card = buildSlideCardContent(slide, deck, {});
    const html = renderTemplate(card, theme, { w: 1080, h: 1350 });

    expect(html).toContain('<span class="cover-meta"></span>');
    expect(html).not.toContain("Slide 2");
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("cover");
  });
});
