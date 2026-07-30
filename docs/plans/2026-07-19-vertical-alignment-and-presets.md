# Vertical Alignment, Non-Social Presets, and Content-Fit Cropping — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add vertical alignment control, non-social size presets, and a content-fit crop so QuoteForge produces embedded web visuals without stranded whitespace.

**Architecture:** Alignment is a card-level enum injected as a CSS class on `.card`, coupled with a one-line `.block` flex change in `templates/_base.css` that stops blocks from growing to fill the canvas. Presets extend the existing `SIZES` map. `--fit-content` measures the content bounding box in the browser and clips the screenshot.

**Tech Stack:** Bun, TypeScript strict, Zod v4 (`zod/v4`), Nunjucks, Puppeteer (`puppeteer-core`), `bun:test`.

**Spec:** `docs/specs/2026-07-19-vertical-alignment-and-presets-design.md`

## Global Constraints

- Runtime is Bun. Tests run with `bun test` (the release gate; `bun run typecheck` is pre-existing red repo-wide and is informational only). No npm scripts, no Node-only APIs.
- TypeScript strict, no `any`.
- `src/cli/utils/validator.ts` is the schema authority. `SIZES` is mirrored in `studio/src/types/index.ts` and counted in `src/__tests__/validator.test.ts` — update all three together. This plan takes the count from 17 to 22.
- Never hardcode colors in template CSS — every color is a CSS custom property injected from theme JSON at `:root`. This plan touches layout CSS only; it adds no color.
- Default `align` is `center`. Absent `align` must resolve to `center`, not empty.
- New preset dimensions (exact): `og` 1200×630, `readme-hero` 1280×640, `slide-16x9` 1920×1080, `4x3` 1600×1200, `3x2` 1500×1000.
- No code comments unless a step requires them.
- Commit format: `type(app[scope]): brief description`. No bullet points, no author name/email, no body.

---

### Task 1: Non-social size presets

**Files:**
- Modify: `src/cli/utils/validator.ts` (the `SIZES` map)
- Modify: `studio/src/types/index.ts` (the `SIZES` mirror)
- Test: `src/__tests__/validator.test.ts`
- Test: `src/__tests__/dimensions.test.ts`

**Interfaces:**
- Produces: five new `SizeName` values (`og`, `readme-hero`, `slide-16x9`, `4x3`, `3x2`) resolvable via the existing `resolveDimensions` from lot 1.

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/validator.test.ts`, update the size-count describe block — it currently asserts `toHaveLength(17)` in a block titled "all 17 sizes". Change both the title and the number to 22, and add value assertions:

```ts
describe("SizeName enum — all 22 sizes", () => {
  test("has exactly 22 sizes", () => {
    expect(Object.keys(SIZES)).toHaveLength(22);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/__tests__/validator.test.ts`
Expected: FAIL — count is 17, new keys undefined.

- [ ] **Step 3: Add the presets**

In `src/cli/utils/validator.ts`, add these entries to the `SIZES` object (before the `custom` entry, so `custom` stays last):

```ts
  "og":                    { w: 1200, h: 630,  ratio: "1.91:1", label: "Open Graph / link preview" },
  "readme-hero":           { w: 1280, h: 640,  ratio: "2:1",    label: "README / docs hero banner" },
  "slide-16x9":            { w: 1920, h: 1080, ratio: "16:9",   label: "Presentation slide" },
  "4x3":                   { w: 1600, h: 1200, ratio: "4:3",    label: "4:3 slide / web tile" },
  "3x2":                   { w: 1500, h: 1000, ratio: "3:2",    label: "3:2 card / web tile" },
```

- [ ] **Step 4: Mirror into the studio types**

In `studio/src/types/index.ts`, add the same five keys to the `SIZES` mirror with the same `w`/`h`/`ratio`/`label` values, in the same position relative to `custom`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test src/__tests__/validator.test.ts src/__tests__/dimensions.test.ts`
Expected: PASS. The `dimensions.test.ts` per-preset regression test (`test.each(Object.keys(SIZES).filter(n => n !== "custom"))`) now covers the five new presets automatically and must stay green.

Run: `bun test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/cli/utils/validator.ts studio/src/types/index.ts src/__tests__/validator.test.ts
git commit -m "feat(quoteforge[schema]): add og, readme-hero, slide-16x9, 4x3, 3x2 size presets"
```

---

### Task 2: Vertical alignment

**Files:**
- Modify: `src/cli/utils/validator.ts` (`CardContentSchema`, `SlideSchema`, `DeckDefaultsSchema`)
- Modify: `studio/src/types/index.ts` (`CardContent`, `Slide`, `DeckContent.defaults`)
- Modify: `templates/_base.css`
- Modify: `templates/quote/template.njk`, `templates/manifesto/template.njk`, `templates/list/template.njk`, `templates/minimal/template.njk`
- Modify: `src/renderer/template-engine.ts` (`renderTemplate` — expose the align class)
- Test: `src/__tests__/validator.test.ts`
- Test: `src/__tests__/template-engine.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: an optional `align?: "top" | "center" | "bottom" | "spread"` on card, slide, and deck defaults; a rendered `.card` element carrying an `align-<value>` class, defaulting to `align-center`.

- [ ] **Step 1: Write the failing schema tests**

Append to `src/__tests__/validator.test.ts`:

```ts
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
```

Note the `.strict()` schemas from lot 1: `align` must be a declared field or strict validation rejects it. That is what the "accepts align" tests prove.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/__tests__/validator.test.ts`
Expected: FAIL — `align` is an unknown key under strict validation, so even valid values throw.

- [ ] **Step 3: Add the align field to the schemas**

In `src/cli/utils/validator.ts`, add above `CardContentSchema`:

```ts
export const AlignSchema = z.enum(["top", "center", "bottom", "spread"]);
export type Align = z.infer<typeof AlignSchema>;
```

Add `align: AlignSchema.optional(),` as a field to each of `CardContentSchema`, `SlideSchema`, and `DeckDefaultsSchema`. Place it before the `blocks` / trailing fields. Do not give it a Zod `.default()` — the default is applied at render time (Step 6) so that "absent" is distinguishable and inheritance works correctly (a slide with no `align` must fall back to deck defaults, not to a parsed-in `center`).

- [ ] **Step 4: Change the block flex and add alignment classes in _base.css**

In `templates/_base.css`, replace the `.block` rule (lines 33-40):

```css
.block {
  width: 100%;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
```

(`flex: 1 1 0` → `flex: 0 0 auto`; the `justify-content: center` line is removed — it centered content inside the previously-inflated box and has no purpose once the box is content-sized.)

Add the alignment classes immediately after the `.card` rule (after line 31):

```css
.card.align-top    { justify-content: flex-start; }
.card.align-center { justify-content: center; }
.card.align-bottom { justify-content: flex-end; }
.card.align-spread { justify-content: space-between; }
```

- [ ] **Step 5: Inject the align class in every template**

In each of the four `templates/<name>/template.njk` files, change the card element from:

```html
  <div class="card">
```

to:

```html
  <div class="card align-{{ card.align or 'center' }}">
```

The `or 'center'` in the Nunjucks expression is the render-time default: an absent `align`
becomes `align-center`. All four templates (`quote`, `manifesto`, `list`, `minimal`) use the
identical `<div class="card">` opening, so the change is the same in each.

- [ ] **Step 6: Resolve align inheritance for slides**

Slides inherit `align` from deck defaults the same way `size`/`theme` do. In
`src/renderer/slide-renderer.ts`, the `buildSlideCardContent` helper (added in lot 1's
follow-up) constructs the per-slide `CardContent`. Add `align` to it, resolving
`slide.align ?? deck.defaults.align`:

```ts
const align = slide.align ?? deck.defaults.align;
// ... include `align` in the returned CardContent object
```

When both are absent, `align` stays `undefined` and the template's `or 'center'` applies. Add
`align` to the `CardContent` object the helper returns.

- [ ] **Step 7: Write the render test**

Append to `src/__tests__/template-engine.test.ts` (which already imports `renderTemplate`):

```ts
describe("Vertical alignment rendering", () => {
  const theme = /* load dark-teal via the same helper the file already uses */;
  const card = {
    template: "quote",
    theme: "dark-teal",
    size: "instagram-sq" as const,
    blocks: [{ type: "headline" as const, parts: [{ text: "T", style: "normal" as const }] }],
  };

  test("defaults to align-center when align is absent", () => {
    const html = renderTemplate({ ...card }, theme, { w: 1080, h: 1080 });
    expect(html).toContain('class="card align-center"');
  });

  test("emits the requested align class", () => {
    const html = renderTemplate({ ...card, align: "bottom" }, theme, { w: 1080, h: 1080 });
    expect(html).toContain('class="card align-bottom"');
  });

  test("blocks no longer grow to fill the canvas", () => {
    const html = renderTemplate({ ...card }, theme, { w: 1080, h: 1080 });
    expect(html).not.toContain("flex: 1 1 0");
    expect(html).toContain("flex: 0 0 auto");
  });
});
```

Match the existing test file's helper for loading a theme (it already renders templates, so a
theme-loading pattern exists there — reuse it rather than inventing one).

- [ ] **Step 8: Run tests to verify they pass**

Run: `bun test src/__tests__/validator.test.ts src/__tests__/template-engine.test.ts`
Expected: PASS.

Run: `bun test`
Expected: PASS.

- [ ] **Step 9: Sync studio types**

In `studio/src/types/index.ts`, add `align?: "top" | "center" | "bottom" | "spread";` to the
`CardContent` interface, the `Slide` interface, and the `DeckContent.defaults` object type.

- [ ] **Step 10: Visual verification**

Render the spec's reproduction (short list card) at the default and confirm the void is gone:

```bash
bun quoteforge generate /tmp/qf-align.json --output /tmp/qf-align.png --no-timestamp
```

with `/tmp/qf-align.json`:

```json
{
  "type": "card", "template": "list", "theme": "terminal-green", "size": "facebook-square",
  "blocks": [
    { "type": "headline", "parts": [{ "text": "Mobile Money", "style": "normal" }] },
    { "type": "bullet-list", "items": [
      { "label": "01", "text": "Flutter + Firebase" },
      { "label": "02", "text": "Domain-Driven Design" }] }
  ]
}
```

Open the PNG: the headline and list must sit together, vertically centered, with no large gap
between them. Then render the same file with `"align": "spread"` added and confirm the blocks
move to the edges. If the render environment lacks Chrome, say so; do not skip silently.

- [ ] **Step 11: Commit**

```bash
git add src/cli/utils/validator.ts studio/src/types/index.ts templates/_base.css templates/*/template.njk src/renderer/slide-renderer.ts src/renderer/template-engine.ts src/__tests__/validator.test.ts src/__tests__/template-engine.test.ts
git commit -m "feat(quoteforge[renderer]): add vertical alignment control with center default"
```

---

### Task 3: Content-fit cropping

**Files:**
- Create: `src/renderer/fit-content.ts`
- Modify: `src/renderer/renderer.ts` (`renderCardOnPage` — optional clip)
- Modify: `src/cli/commands/generate.ts`, `src/cli/commands/slides.ts`, `src/cli/commands/batch.ts` (the `--fit-content` / `--trim` flag)
- Test: `src/__tests__/fit-content.test.ts`

**Interfaces:**
- Consumes: `resolveDimensions` (lot 1), the theme's resolved padding.
- Produces:
  - `computeContentClip(box: Rect, padding: number, canvas: Dimensions): Rect` — pure function mapping a measured content box + padding to a clamped clip rect.
  - `renderCardOnPage(..., fitContent?: boolean)` — when true, screenshots the computed clip instead of the full viewport.

- [ ] **Step 1: Write the failing test for the pure clip computation**

Create `src/__tests__/fit-content.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import { computeContentClip } from "../renderer/fit-content.js";

describe("computeContentClip", () => {
  test("expands the content box by padding on all sides", () => {
    const clip = computeContentClip(
      { x: 100, y: 400, width: 880, height: 280 },
      40,
      { w: 1080, h: 1080 },
    );
    expect(clip).toEqual({ x: 60, y: 360, width: 960, height: 360 });
  });

  test("clamps to the canvas edges", () => {
    const clip = computeContentClip(
      { x: 10, y: 10, width: 1060, height: 1060 },
      40,
      { w: 1080, h: 1080 },
    );
    expect(clip).toEqual({ x: 0, y: 0, width: 1080, height: 1080 });
  });

  test("never returns negative origin or overflowing size", () => {
    const clip = computeContentClip(
      { x: 0, y: 0, width: 1080, height: 1080 },
      100,
      { w: 1080, h: 1080 },
    );
    expect(clip.x).toBe(0);
    expect(clip.y).toBe(0);
    expect(clip.width).toBe(1080);
    expect(clip.height).toBe(1080);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/fit-content.test.ts`
Expected: FAIL — `Cannot find module '../renderer/fit-content.js'`.

- [ ] **Step 3: Implement the pure clip computation**

Create `src/renderer/fit-content.ts`:

```ts
import type { Dimensions } from "./dimensions.js";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeContentClip(box: Rect, padding: number, canvas: Dimensions): Rect {
  const left = Math.max(0, box.x - padding);
  const top = Math.max(0, box.y - padding);
  const right = Math.min(canvas.w, box.x + box.width + padding);
  const bottom = Math.min(canvas.h, box.y + box.height + padding);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/__tests__/fit-content.test.ts`
Expected: PASS.

- [ ] **Step 5: Measure the content box in the renderer and clip**

In `src/renderer/renderer.ts`, extend `renderCardOnPage` with an optional `fitContent` flag.
After fonts settle and before the screenshot, when `fitContent` is set, measure the union of
the block rects and the resolved padding in the page, compute the clip, and pass it to
`page.screenshot`:

```ts
if (fitContent) {
  const box = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll(".card > .block"));
    if (blocks.length === 0) return null;
    const rects = blocks.map((b) => b.getBoundingClientRect());
    const x = Math.min(...rects.map((r) => r.left));
    const y = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const padding = parseFloat(getComputedStyle(document.querySelector(".card")!).paddingTop);
    return { x, y, width: right - x, height: bottom - y, padding };
  });
  if (box) {
    const clip = computeContentClip(
      { x: box.x, y: box.y, width: box.width, height: box.height },
      box.padding,
      dimensions,
    );
    const shot = await page.screenshot({ type: "png", clip });
    return Buffer.from(shot);
  }
}
```

The existing full-viewport screenshot remains the path when `fitContent` is false or the box is
null. Thread `fitContent` through `renderCard` and its deck equivalent as an optional argument
defaulting to `false`, so all existing callers are unaffected.

- [ ] **Step 6: Add the CLI flag**

In `src/cli/commands/generate.ts`, add the flag (both spellings map to one option):

```ts
  .option("--fit-content", "Crop the output to the content bounding box plus theme padding")
  .option("--trim", "Alias for --fit-content")
```

In the action, pass `fitContent: Boolean(opts.fitContent || opts.trim)` down to `renderCard`.
Add the same flag and wiring to `src/cli/commands/slides.ts` and `src/cli/commands/batch.ts`.
For `slides`, emit a one-line warning (via the existing chalk logger) when `--fit-content` is
combined with a deck, noting that slides may end up with differing heights — warn, do not block.

- [ ] **Step 7: End-to-end verification**

```bash
bun quoteforge generate /tmp/qf-align.json --output /tmp/qf-fit.png --no-timestamp --fit-content
file /tmp/qf-fit.png
```

Expected: the PNG height is markedly less than the full `facebook-square` 2160px (at scale 2) —
the void is cropped — while a padding band of the theme background remains around the content
(the content is not flush to the edge). Confirm `--trim` produces the same result.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/fit-content.ts src/renderer/renderer.ts src/cli/commands/generate.ts src/cli/commands/slides.ts src/cli/commands/batch.ts src/__tests__/fit-content.test.ts
git commit -m "feat(quoteforge[cli]): add --fit-content/--trim to crop output to content"
```

---

### Task 4: Documentation and changelog

**Files:**
- Modify: `README.md` (sizes list, a vertical-alignment note, the `--fit-content` flag)
- Modify: `site/src/docs/content-schema.mdx` (sizes table + `align` field)
- Modify: `site/src/docs/cli.mdx` if present (the `--fit-content`/`--trim` flag) — otherwise the CLI section of the schema/getting-started docs
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the shipped behavior from Tasks 1-3. No code.

- [ ] **Step 1: Locate the CLI doc**

Run: `ls site/src/docs/*.mdx` and identify the file documenting `generate` flags. Add the
`--fit-content`/`--trim` flag there. If no dedicated CLI page exists, add it to the same page
that documents `generate` today.

- [ ] **Step 2: Document the size presets**

In `site/src/docs/content-schema.mdx`, add the five new presets to the sizes table with their
dimensions and ratios, grouped or labeled as non-social so a reader scanning for a blog/README
target finds them. Update any "17 sizes" count mentioned in prose to 22. Do the same for the
sizes list in `README.md`.

- [ ] **Step 3: Document vertical alignment**

Add an `align` subsection to `site/src/docs/content-schema.mdx`, documenting the four values,
the `center` default, and that it applies to cards, deck defaults, and slides. State plainly
that the default changed in v0.5.0 and that `"align": "spread"` approximates the pre-0.5
distribution. Add a short note to `README.md`.

- [ ] **Step 4: Document --fit-content**

Document `--fit-content` (and its `--trim` alias) in the CLI docs and README: what it does
(crops to content + padding), that output dimensions become content-dependent, that it is
intended for single cards, and that combining it with `slides` can yield unequal slide heights.

- [ ] **Step 5: Changelog**

Prepend to `CHANGELOG.md`:

```markdown
## 0.5.0

### Added
- Five non-social size presets: `og` (1200×630), `readme-hero` (1280×640),
  `slide-16x9` (1920×1080), `4x3` (1600×1200), `3x2` (1500×1000).
- `align` (`top` | `center` | `bottom` | `spread`) on cards, deck defaults, and slides,
  controlling vertical placement of content.
- `--fit-content` (alias `--trim`) on `generate`/`slides`/`batch`, cropping the output to the
  content bounding box plus theme padding.

### Changed
- **Rendering change:** content is now vertically centered by default instead of distributed
  over the full canvas height. Existing cards re-render with content grouped. Add
  `"align": "spread"` to approximate the previous look.
```

The Changed entry is why 0.5.0 is a minor: every existing card's rendering changes.

- [ ] **Step 6: Verify documented commands run**

Run the commands shown in the new docs (`generate --fit-content`, a render with each `align`
value) and confirm they succeed as written. Fix the docs to match reality if any command fails.

- [ ] **Step 7: Commit**

```bash
git add README.md CHANGELOG.md site/src/docs/
git commit -m "docs(quoteforge[renderer]): document alignment, non-social presets, and --fit-content"
```

---

### Task 5: Studio (web UI) integration

**Files:**
- Modify: `studio/src/types/index.ts` (`SIZE_GROUPS`)
- Modify: `studio/src/store/cardStore.ts` (`setAlign`), `studio/src/store/deckStore.ts` (`setDeckAlign`)
- Create: `studio/src/components/Editor/AlignPicker.tsx`
- Modify: `studio/src/components/Editor/Toolbar.tsx` (align picker + fit-content toggle)
- Modify: `studio/src/App.tsx` (wire align setters, fit-content state, export body)
- Modify: `src/server/routes/export.ts`, `src/server/routes/exportDeck.ts` (read `fitContent`)

**Interfaces:**
- Consumes: `align` field and the presets (Tasks 1-2), the `renderCard(..., fitContent)` and `renderDeck({ ..., fitContent })` seams (Task 3).
- Produces: studio users can pick the new presets, set `align`, and export with fit-content.

Context: the studio types were synced in Tasks 1-2, but the UI was not wired. `align` already
flows to the render automatically because the export/preview routes pass the whole card object
to `renderCard`/`renderTemplate` — so align needs only store state + a UI control, no route
change. Presets need adding to `SIZE_GROUPS` (the picker iterates groups, not raw `SIZES`).
fit-content is an export-time option and needs both a UI toggle and route changes.

- [ ] **Step 1: Add the presets to the size picker**

In `studio/src/types/index.ts`, add a group to `SIZE_GROUPS` before the `Custom` group:

```ts
  { label: "Web / Docs", sizes: ["og", "readme-hero", "slide-16x9", "4x3", "3x2"] },
```

Launch nothing yet; the picker (`SizePicker.tsx`) iterates `SIZE_GROUPS`, so the five presets
now appear under "Web / Docs".

- [ ] **Step 2: Add align setters to the stores**

In `studio/src/store/cardStore.ts`, add `setAlign: (align: Align) => void;` to the `CardStore`
interface (import `Align` — a union type; add `type Align = "top" | "center" | "bottom" | "spread"`
locally in the store or export it from `../types` if a shared alias is cleaner) and implement it
mirroring `setSize`:

```ts
  setAlign: (align) =>
    set((s) => ({
      card: { ...s.card, align },
      isDirty: true,
      past: [...s.past.slice(-49), s.card],
      future: [],
    })),
```

In `studio/src/store/deckStore.ts`, add `setDeckAlign` mirroring `setDeckSize`, writing to
`deck.defaults.align`:

```ts
  setDeckAlign: (align) =>
    set((s) => ({
      deck: { ...s.deck, defaults: { ...s.deck.defaults, align } },
      isDirty: true,
    })),
```

Add the matching signatures to each store's interface.

- [ ] **Step 3: Create the AlignPicker component**

Create `studio/src/components/Editor/AlignPicker.tsx` — a small segmented control matching the
studio's Tailwind idiom (built from scratch, no component library, per project rules):

```tsx
import type { SizeName } from "../../types";

type Align = "top" | "center" | "bottom" | "spread";
const OPTIONS: { value: Align; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
  { value: "spread", label: "Spread" },
];

interface AlignPickerProps {
  current: Align | undefined;
  onChange: (align: Align) => void;
}

export function AlignPicker({ current, onChange }: AlignPickerProps) {
  const active = current ?? "center";
  return (
    <div className="flex items-center gap-0.5 bg-neutral-800 rounded p-0.5" role="group" aria-label="Vertical alignment">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={active === opt.value}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            active === opt.value ? "bg-neutral-700 text-teal-400" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

The `SizeName` import is unused; remove it — this note exists to catch a copy-paste artifact, not
to keep it.

- [ ] **Step 4: Wire the align picker and fit-content toggle into the Toolbar**

In `studio/src/components/Editor/Toolbar.tsx`, add props `align`, `onAlignChange`, `fitContent`,
and `onFitContentChange`, render the `AlignPicker` next to the `SizePicker`, and add a
fit-content checkbox/toggle near the export button:

```tsx
<AlignPicker current={align} onChange={onAlignChange} />
```

For fit-content, a labeled checkbox styled with Tailwind:

```tsx
<label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer select-none">
  <input type="checkbox" checked={fitContent} onChange={(e) => onFitContentChange(e.target.checked)} />
  Fit content
</label>
```

Add the corresponding entries to the Toolbar's props interface.

- [ ] **Step 5: Wire state and export in App.tsx**

In `studio/src/App.tsx`:
- Pass `align` and the align setter to the Toolbar, mode-aware like theme/size:
  `align={mode === "card" ? cardStore.card.align : deckStore.deck.defaults.align}` and
  `onAlignChange={mode === "card" ? cardStore.setAlign : deckStore.setDeckAlign}`.
- Add `const [fitContent, setFitContent] = useState(false);` and pass `fitContent` /
  `onFitContentChange={setFitContent}` to the Toolbar.
- Include `fitContent` in the `/api/export` request body object (alongside `card`, `theme`,
  `size`) and in the `/api/export-deck` body. Add `fitContent` to the `handleExportPng` /
  `handleExportDeck` `useCallback` dependency arrays.

- [ ] **Step 6: Read fitContent in the server routes**

In `src/server/routes/export.ts`, extend the body type with `fitContent?: boolean;` and pass it
to `renderCard` (7th argument, after `scale`, `meta`, `browser` — pass `undefined` for meta and
browser):

```ts
const buf = await renderCard(body.card, theme, body.size, body.scale ?? 2, undefined, undefined, body.fitContent ?? false);
```

In `src/server/routes/exportDeck.ts`, extend the body type with `fitContent?: boolean;` and add
`fitContent: body.fitContent ?? false` to the `renderDeck(body.deck, { ... })` options object.

- [ ] **Step 7: Verify the studio builds and the wiring is sound**

The studio has no unit-test suite; verify by build and by exercising the flow. Run the studio's
build (`cd studio && bunx vite build`, or the build script the repo uses) and confirm it
completes without errors in the files this task touched. Then launch `bun quoteforge studio`,
confirm: the five new presets appear under "Web / Docs" in the size dropdown; the align control
changes the live preview; the "Fit content" toggle produces a cropped PNG on export. If the
environment cannot launch a browser/studio, say so and rely on the build plus a careful re-read
of the data flow, and report that explicitly rather than claiming a visual check that did not
happen.

- [ ] **Step 8: Commit**

```bash
git add studio/src/types/index.ts studio/src/store/cardStore.ts studio/src/store/deckStore.ts studio/src/components/Editor/AlignPicker.tsx studio/src/components/Editor/Toolbar.tsx studio/src/App.tsx src/server/routes/export.ts src/server/routes/exportDeck.ts
git commit -m "feat(quoteforge[studio]): expose alignment, presets, and fit-content in the editor"
```

---

## Verification

After all five tasks:

- [ ] `bun test` — whole suite passes.
- [ ] The reproduction short-content card renders with content centered, no mid-canvas void.
- [ ] `"align": "spread"` moves blocks to the edges.
- [ ] Each new preset renders at its documented dimensions.
- [ ] `--fit-content` crops the void while keeping a theme-padding band; `--trim` matches.
- [ ] `SIZES` count is 22 in validator.ts, studio/src/types/index.ts, and validator.test.ts.

Release with `bun run release:minor`.
