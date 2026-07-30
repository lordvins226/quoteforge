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

describe("sticky template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/brutal-white.json"));

  test("renders the tilted note with body and a trailing signature line", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/sticky-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(html).toContain("sticky-note");
    expect(html).toContain("sticky-sign");
    expect(html).toContain("pinned to the monitor");
  });

  test("without a trailing text block, the whole note is body and no signature renders", () => {
    const card = CardContentSchema.parse({
      template: "sticky",
      theme: "brutal-white",
      size: "instagram-sq",
      blocks: [
        { type: "headline", parts: [{ text: "No signature here", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(bodyOnly(html)).not.toContain('class="sticky-sign"');
    expect(html).toContain("No signature here");
  });

  test("style.css allows the documented rgba() drop-shadow but no literal hex", () => {
    assertNoHardcodedHex("sticky");
    const styleCSS = readFileSync(resolve(ROOT, "templates/sticky/style.css"), "utf-8");
    expect(styleCSS).toContain("rgba(0, 0, 0,");
  });
});

describe("polaroid template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/mono-slate.json"));

  test("renders the plate, photo well, and caption", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/polaroid-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(html).toContain("polaroid-plate");
    expect(html).toContain("polaroid-well");
    expect(html).toContain("polaroid-caption");
    expect(html).toContain("block-image");
    expect(html).toContain("first render, 3am");
  });

  test("composes with the image block's own width and align options instead of overriding them", () => {
    const card = CardContentSchema.parse({
      template: "polaroid",
      theme: "mono-slate",
      size: "instagram-sq",
      blocks: [
        { type: "image", src: "data:image/png;base64,abc", width: "sm", align: "right" },
        { type: "text", content: "cropped tight" },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(html).toContain('is-sm');
    expect(html).toContain('align-right');
  });

  test("survives a missing image block — empty well, nothing broken", () => {
    const card = CardContentSchema.parse({
      template: "polaroid",
      theme: "mono-slate",
      size: "instagram-sq",
      blocks: [
        { type: "text", content: "no photo yet" },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(bodyOnly(html)).toContain("polaroid-well");
    expect(bodyOnly(html)).not.toContain("block-image");
    expect(html).toContain("no photo yet");
  });

  test("style.css allows the documented rgba() drop-shadow but no literal hex", () => {
    assertNoHardcodedHex("polaroid");
    const styleCSS = readFileSync(resolve(ROOT, "templates/polaroid/style.css"), "utf-8");
    expect(styleCSS).toContain("rgba(0, 0, 0,");
  });
});

describe("window template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/kyoto.json"));

  test("renders the three dots, the eyebrow as the URL pill, and the CTA button", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/window-demo.json"));
    const html = renderTemplate(card, theme, { w: 1200, h: 675 });

    expect(html).toContain("window-dot");
    expect(html).toContain(`<span class="window-url">${card.eyebrow as string}</span>`);
    expect(html).toContain("Install in 30s");
    expect(html).toContain("block-callout");
  });

  test("renders an empty URL pill when eyebrow is absent", () => {
    const card = CardContentSchema.parse({
      template: "window",
      theme: "kyoto",
      size: "twitter",
      blocks: [
        { type: "headline", parts: [{ text: "No chrome label here", style: "normal" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1200, h: 675 });

    expect(html).toContain('<span class="window-url"></span>');
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("window");
  });
});

describe("profile template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/dark-teal.json"));

  test("renders the quote and falls back to initials derived from the name when no image block is present", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/profile-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(bodyOnly(html)).toContain("profile-who");
    expect(bodyOnly(html)).toContain("profile-avatar--initials");
    expect(html).toContain(">KW<");
    expect(html).toContain("Kevin W.");
    expect(html).toContain("Maintainer, QuoteForge");
    expect(bodyOnly(html)).not.toContain("profile-avatar--image");
  });

  test("renders an image avatar instead of initials when an image block is present", () => {
    const card = CardContentSchema.parse({
      template: "profile",
      theme: "dark-teal",
      size: "instagram-sq",
      blocks: [
        { type: "blockquote", parts: [{ text: "Great tool.", style: "normal" }] },
        { type: "image", src: "data:image/png;base64,abc", alt: "Ada L." },
        { type: "callout", items: [{ label: "Ada Lovelace", text: "Engineer" }] },
      ],
    });
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(bodyOnly(html)).toContain("profile-avatar--image");
    expect(bodyOnly(html)).not.toContain("profile-avatar--initials");
    expect(html).toContain('src="data:image/png;base64,abc"');
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("profile");
  });
});

describe("ledger template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/paper-cream.json"));

  test("renders the header rule, keyed rows, and footer", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/ledger-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1350 });

    expect(html).toContain("ledger-head");
    expect(html).toContain("ledger-row");
    expect(html).toContain('<span class="ledger-key">01</span>');
    expect(html).toContain("ledger-foot");
    expect(html).toContain("quoteforge validate card.json");
  });

  test("rows stay aligned regardless of item count (3 vs 6)", () => {
    const build = (count: number) =>
      CardContentSchema.parse({
        template: "ledger",
        theme: "paper-cream",
        size: "instagram-port",
        blocks: [
          {
            type: "bullet-list",
            items: Array.from({ length: count }, (_, i) => ({ label: String(i + 1), text: `Row ${i + 1}` })),
          },
        ],
      });

    const body3 = bodyOnly(renderTemplate(build(3), theme, { w: 1080, h: 1350 }));
    const body6 = bodyOnly(renderTemplate(build(6), theme, { w: 1080, h: 1350 }));

    expect(body3.match(/class="ledger-row"/g)?.length).toBe(3);
    expect(body6.match(/class="ledger-row"/g)?.length).toBe(6);
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("ledger");
  });
});

describe("index template", () => {
  const theme = ThemeSchema.parse(loadJSON("themes/paper-cream.json"));

  test("renders the title and dot-leader rows with label as the trailing figure", () => {
    const card = CardContentSchema.parse(loadJSON("content/examples/index-demo.json"));
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });

    expect(html).toContain("index-title");
    expect(html).toContain("index-leader");
    expect(html).toContain('<span class="index-entry">Install</span>');
    expect(html).toContain('<span class="index-figure">01</span>');
  });

  test("style.css has no literal hex color outside theme-injected :root vars", () => {
    assertNoHardcodedHex("index");
  });
});
