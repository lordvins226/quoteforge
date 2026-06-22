# Inline Image Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `image` block type so cards and decks can include inline images with controllable width and alignment, sourced from a URL, a local file path, or a data-URI.

**Architecture:** A new member of the existing Zod discriminated-union `BlockSchema` (mirrored in the studio's browser type). A pure resolver converts each image `src` into a Puppeteer-loadable value (URL/data-URI pass-through; local path → base64 data-URI) before rendering. A Nunjucks partial renders the block; CLI call sites resolve sources against the content file's directory. The studio adds an editor (URL + upload-to-data-URI) and a default-block factory.

**Tech Stack:** Bun, TypeScript (strict), Zod v4, Nunjucks, Puppeteer, Vite + React 18 (studio), Zustand.

## Global Constraints

- Runtime is Bun; tests run with `bun test`. Do NOT use npm/node scripts.
- TypeScript strict everywhere — no `any`, use `unknown`. (Pre-existing `tsc` errors exist; verify no NEW errors in touched files only.)
- Schema authority is `src/cli/utils/validator.ts`; `SIZES` and `Block` are duplicated in `studio/src/types/index.ts` — schema changes touch both.
- NEVER hardcode colors in template CSS — colors come from theme CSS custom properties (image block carries none in V1).
- React components MUST NOT touch the filesystem — uploads become data-URIs in-browser via `FileReader`.
- No new dependencies without asking the user (none required by this plan).
- Block partials are NOT auto-discovered — a new partial must be registered in `src/assetBundle.ts`.
- Commit format: `type(quoteforge[scope]): description` — no bullet points, no author, no extra body.

**Source of truth spec:** `docs/specs/2026-06-22-image-block-design.md`
**Scope ADR:** `docs/adr/0001-inline-image-block-scope.md`

---

### Task 1: Image block schema (validator + studio type mirror)

**Files:**
- Modify: `src/cli/utils/validator.ts` (add `ImageBlockSchema`, extend `BlockSchema`)
- Modify: `studio/src/types/index.ts` (extend `BlockType` and `Block` union)
- Test: `src/__tests__/validator.test.ts`

**Interfaces:**
- Produces: `ImageBlock = { type: "image"; id?: string; src: string; alt?: string; width: "sm"|"md"|"lg"|"full"; height: ...}` — note `width`/`align` have schema defaults, so parsed output always has them.
- Produces (studio): `Block` union member `{ type: "image"; id?: string; src: string; alt?: string; width: "sm"|"md"|"lg"|"full"; align: "left"|"center"|"right" }`.

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/validator.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/validator.test.ts`
Expected: FAIL — the `image` type is not in the discriminated union (Zod reports invalid `type`).

- [ ] **Step 3: Add the schema**

In `src/cli/utils/validator.ts`, after `SpacerBlockSchema` (before `BlockSchema`):

```ts
const ImageBlockSchema = z.object({
  type: z.literal("image"),
  id: z.string().optional(),
  src: z.string().min(1),
  alt: z.string().optional(),
  width: z.enum(["sm", "md", "lg", "full"]).default("full"),
  align: z.enum(["left", "center", "right"]).default("center"),
});
```

Add `ImageBlockSchema` to the `BlockSchema` discriminated union array:

```ts
export const BlockSchema = z.discriminatedUnion("type", [
  HeadlineBlockSchema,
  BlockquoteBlockSchema,
  TextBlockSchema,
  BulletListBlockSchema,
  CalloutBlockSchema,
  DividerBlockSchema,
  SpacerBlockSchema,
  ImageBlockSchema,
]);
```

- [ ] **Step 4: Mirror the type in the studio**

In `studio/src/types/index.ts`, extend `BlockType`:

```ts
export type BlockType = "headline" | "blockquote" | "text" | "bullet-list" | "callout" | "divider" | "spacer" | "image";
```

Add to the `Block` union (after the `spacer` member):

```ts
  | { type: "image"; id?: string; src: string; alt?: string; width: "sm" | "md" | "lg" | "full"; align: "left" | "center" | "right" };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test src/__tests__/validator.test.ts`
Expected: PASS (all image block tests green).

- [ ] **Step 6: Commit**

```bash
git add src/cli/utils/validator.ts studio/src/types/index.ts src/__tests__/validator.test.ts
git commit -m "feat(quoteforge[image-block]): add image block schema and studio type"
```

---

### Task 2: Image source resolver

**Files:**
- Create: `src/renderer/image-resolver.ts`
- Test: `src/__tests__/image-resolver.test.ts`

**Interfaces:**
- Consumes: `CardContent`, `DeckContent`, `Block` from `../cli/utils/validator.js`.
- Produces:
  - `resolveImageSrc(src: string, baseDir: string): string`
  - `resolveImageBlocks<T extends CardContent | DeckContent>(content: T, baseDir: string): T`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/image-resolver.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveImageSrc, resolveImageBlocks } from "../renderer/image-resolver.js";
import type { CardContent } from "../cli/utils/validator.js";

describe("resolveImageSrc", () => {
  test("passes through http(s) URLs unchanged", () => {
    expect(resolveImageSrc("https://example.com/a.png", "/tmp")).toBe("https://example.com/a.png");
    expect(resolveImageSrc("http://example.com/a.png", "/tmp")).toBe("http://example.com/a.png");
  });

  test("passes through data URIs unchanged", () => {
    const uri = "data:image/png;base64,AAAA";
    expect(resolveImageSrc(uri, "/tmp")).toBe(uri);
  });

  test("encodes a local file as a data URI with the right MIME", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-img-"));
    writeFileSync(join(dir, "p.png"), Buffer.from([1, 2, 3]));
    const out = resolveImageSrc("./p.png", dir);
    expect(out).toBe(`data:image/png;base64,${Buffer.from([1, 2, 3]).toString("base64")}`);
  });

  test("maps .jpg and .svg extensions to correct MIME", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-img-"));
    writeFileSync(join(dir, "p.jpg"), Buffer.from([9]));
    writeFileSync(join(dir, "p.svg"), Buffer.from([9]));
    expect(resolveImageSrc("p.jpg", dir).startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(resolveImageSrc("p.svg", dir).startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  test("throws a clear error for a missing local file", () => {
    expect(() => resolveImageSrc("./nope.png", "/tmp")).toThrow(/nope\.png/);
  });
});

describe("resolveImageBlocks", () => {
  test("resolves image blocks in a card and leaves others untouched", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-img-"));
    writeFileSync(join(dir, "p.png"), Buffer.from([1]));
    const card: CardContent = {
      template: "quote",
      theme: "dark-teal",
      size: "twitter",
      blocks: [
        { type: "text", content: "hi" },
        { type: "image", src: "./p.png", width: "full", align: "center" },
      ],
    };
    const out = resolveImageBlocks(card, dir);
    expect(out.blocks[0]).toEqual({ type: "text", content: "hi" });
    expect((out.blocks[1] as { src: string }).src.startsWith("data:image/png;base64,")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/image-resolver.test.ts`
Expected: FAIL — module `../renderer/image-resolver.js` does not exist.

- [ ] **Step 3: Implement the resolver**

Create `src/renderer/image-resolver.ts`:

```ts
import { readFileSync } from "node:fs";
import { isAbsolute, join, extname } from "node:path";
import type { CardContent, DeckContent, Block } from "../cli/utils/validator.js";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export function resolveImageSrc(src: string, baseDir: string): string {
  if (/^(https?:|data:)/i.test(src)) return src;

  const path = isAbsolute(src) ? src : join(baseDir, src);
  const mime = MIME_BY_EXT[extname(path).toLowerCase()];
  if (!mime) {
    throw new Error(`Unsupported image type for: ${src} (expected png/jpg/jpeg/webp/gif/svg)`);
  }

  let buf: Buffer;
  try {
    buf = readFileSync(path);
  } catch {
    throw new Error(`Could not read image file: ${src} (resolved to ${path})`);
  }
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function resolveBlocks(blocks: Block[], baseDir: string): Block[] {
  return blocks.map((block) =>
    block.type === "image" ? { ...block, src: resolveImageSrc(block.src, baseDir) } : block,
  );
}

export function resolveImageBlocks<T extends CardContent | DeckContent>(content: T, baseDir: string): T {
  if ("slides" in content) {
    return {
      ...content,
      slides: content.slides.map((slide) => ({ ...slide, blocks: resolveBlocks(slide.blocks, baseDir) })),
    };
  }
  return { ...content, blocks: resolveBlocks(content.blocks, baseDir) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/__tests__/image-resolver.test.ts`
Expected: PASS (all resolver tests green).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/image-resolver.ts src/__tests__/image-resolver.test.ts
git commit -m "feat(quoteforge[image-block]): add image source resolver"
```

---

### Task 3: Template partial, asset registration, and CSS

**Files:**
- Create: `templates/_blocks/image.njk`
- Modify: `src/assetBundle.ts` (import + register partial)
- Modify: `templates/quote/template.njk`, `templates/list/template.njk`, `templates/manifesto/template.njk`, `templates/minimal/template.njk` (add `elif` branch)
- Modify: `templates/_base.css` (image width + align classes)
- Test: `src/__tests__/template-engine.test.ts`

**Interfaces:**
- Consumes: parsed `image` block (`src`, `alt?`, `width`, `align`) and `renderTemplate(content, theme, dimensions, meta)` from Task 1 and existing engine.

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/template-engine.test.ts`, inside the `describe("template-engine: renderTemplate", …)` block. It uses the file's existing `loadJSON` helper and `CardContentSchema`/`ThemeSchema` (already imported at the top):

```ts
test("renders an image block with width and align classes and the src", () => {
  const card = CardContentSchema.parse({
    template: "quote",
    theme: "dark-teal",
    size: "twitter",
    blocks: [{ type: "image", src: "data:image/png;base64,AAAA", alt: "Logo", width: "sm", align: "left" }],
  });
  const theme = ThemeSchema.parse(loadJSON("themes/dark-teal.json"));
  const html = renderTemplate(card, theme, { w: 1200, h: 675 });
  expect(html).toContain("block-image");
  expect(html).toContain("is-sm");
  expect(html).toContain("align-left");
  expect(html).toContain('src="data:image/png;base64,AAAA"');
  expect(html).toContain('alt="Logo"');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/template-engine.test.ts`
Expected: FAIL — no `block-image` markup (the `image` branch is missing from the template).

- [ ] **Step 3: Create the partial**

Create `templates/_blocks/image.njk`:

```njk
<figure class="block block-image is-{{ block.width or 'full' }} align-{{ block.align or 'center' }}">
  <img src="{{ block.src }}" alt="{{ block.alt or '' }}">
</figure>
```

- [ ] **Step 4: Register the partial in the asset bundle**

In `src/assetBundle.ts`, add the import alongside the other `block_*` imports (after `block_headline`):

```ts
import block_image from "../templates/_blocks/image.njk" with { type: "text" };
```

Add to the `TEMPLATE_ASSETS` map (after `"_blocks/headline.njk": block_headline,`):

```ts
  "_blocks/image.njk": block_image,
```

- [ ] **Step 5: Add the branch to all four templates**

In each of `templates/quote/template.njk`, `templates/list/template.njk`, `templates/manifesto/template.njk`, `templates/minimal/template.njk`, inside the `{% for block in card.blocks %}` chain, add before `{% endif %}`:

```njk
      {% elif block.type == "image" %}
        {% include "_blocks/image.njk" %}
```

- [ ] **Step 6: Add CSS**

In `templates/_base.css`, append:

```css
.block-image { display: flex; }
.block-image img { display: block; max-width: 100%; height: auto; }
.block-image.is-sm img { width: 33%; }
.block-image.is-md img { width: 50%; }
.block-image.is-lg img { width: 75%; }
.block-image.is-full img { width: 100%; }
.block-image.align-left { justify-content: flex-start; }
.block-image.align-center { justify-content: center; }
.block-image.align-right { justify-content: flex-end; }
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `bun test src/__tests__/template-engine.test.ts`
Expected: PASS (image markup, classes, src, alt present).

- [ ] **Step 8: Commit**

```bash
git add templates/_blocks/image.njk src/assetBundle.ts templates/quote/template.njk templates/list/template.njk templates/manifesto/template.njk templates/minimal/template.njk templates/_base.css src/__tests__/template-engine.test.ts
git commit -m "feat(quoteforge[image-block]): render image block in templates"
```

---

### Task 4: Wire source resolution into CLI render commands

**Files:**
- Modify: `src/cli/commands/generate.ts`
- Modify: `src/cli/commands/batch.ts`
- Modify: `src/cli/commands/slides.ts`
- Create (fixtures for manual verify): `content/image-demo.json`, `content/logo.svg`

**Interfaces:**
- Consumes: `resolveImageBlocks(content, baseDir)` from Task 2; `dirname` from `node:path`.

This task is integration wiring around Puppeteer; it is verified by an end-to-end render rather than a unit test (the resolver logic itself is unit-tested in Task 2).

- [ ] **Step 1: Resolve in `generate.ts`**

`generate.ts` already computes `const filePath = resolve(file);` and `const card = result.data;`. Import the resolver and `dirname`:

```ts
import { resolve, basename, join, dirname } from "node:path";
import { resolveImageBlocks } from "../../renderer/image-resolver.js";
```

Immediately after `const card = result.data;`, replace it with a resolved copy:

```ts
const card = resolveImageBlocks(result.data, dirname(filePath));
```

(If `card` is `const` and reused, rename: `const card = resolveImageBlocks(result.data, dirname(filePath));` keeps the same downstream usage.)

- [ ] **Step 2: Resolve in `slides.ts`**

After `const deck = result.data;` (the deck branch), wrap it:

```ts
import { resolve, basename, join, dirname } from "node:path";
import { detectAndValidate } from "../utils/validator.js";
import { resolveImageBlocks } from "../../renderer/image-resolver.js";
```

```ts
const deck = resolveImageBlocks(result.data, dirname(filePath));
```

`renderDeck(deck, …)` then receives resolved slide image sources.

- [ ] **Step 3: Resolve in `batch.ts`**

`batch.ts` loops files with `const filePath = join(dir, file);` and `const card = result.data;` per iteration. Add the import:

```ts
import { resolveImageBlocks } from "../../renderer/image-resolver.js";
```

and resolve per file against its directory:

```ts
const card = resolveImageBlocks(result.data, dir);
```

(`dir` is the batch directory; image paths in batch content resolve relative to it.)

- [ ] **Step 4: Create verification fixtures**

Create `content/logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><rect width="200" height="80" fill="#0bb"/><text x="100" y="48" font-size="28" text-anchor="middle" fill="#fff">LOGO</text></svg>
```

Create `content/image-demo.json`:

```json
{
  "template": "quote",
  "theme": "dark-teal",
  "size": "twitter",
  "blocks": [
    { "type": "headline", "parts": [{ "text": "Image block demo", "style": "bold" }] },
    { "type": "image", "src": "./logo.svg", "width": "md", "align": "center", "alt": "Logo" },
    { "type": "text", "content": "Local SVG resolved to a data-URI at render time." }
  ]
}
```

- [ ] **Step 5: Verify end-to-end render**

Run: `bun quoteforge generate content/image-demo.json --output outputs/image-demo.png`
Expected: command succeeds, prints the output path, and `outputs/image-demo.png` exists with the logo visible (centered, ~50% width). `outputs/` is gitignored — do not commit it.

Also verify a remote URL still works by temporarily setting `"src"` to an `https://` image and re-running (optional).

- [ ] **Step 6: Commit**

```bash
git add src/cli/commands/generate.ts src/cli/commands/batch.ts src/cli/commands/slides.ts content/image-demo.json content/logo.svg
git commit -m "feat(quoteforge[image-block]): resolve image sources in CLI render commands"
```

---

### Task 5: Studio editor (add menu, editor fields, default factory)

**Files:**
- Modify: `studio/src/components/Editor/BlockList.tsx` (add menu entry)
- Modify: `studio/src/components/Editor/BlockEditor.tsx` (add `case "image"`)
- Modify: `studio/src/store/cardStore.ts` (`defaultBlock` image case)
- Modify: `studio/src/store/deckStore.ts` (`defaultBlock` image case)

**Interfaces:**
- Consumes: the studio `Block` image member from Task 1; existing `Select` and `Button` UI primitives; Zustand `onChange(block)` editor contract.

Studio has no unit-test runner; verification is `bun run typecheck` (no NEW errors in touched files) plus a manual studio check.

- [ ] **Step 1: Add the default-block factory case in both stores**

In `studio/src/store/cardStore.ts` and `studio/src/store/deckStore.ts`, inside `defaultBlock`'s `switch`, add before the closing brace (after the `spacer` case):

```ts
    case "image":
      return { type, id: makeId(), src: "", width: "full", align: "center" };
```

- [ ] **Step 2: Add the menu entry**

In `studio/src/components/Editor/BlockList.tsx`, add to `BLOCK_TYPES`:

```ts
  { value: "image", label: "Image" },
```

- [ ] **Step 3: Add the editor case**

In `studio/src/components/Editor/BlockEditor.tsx`, add a `case "image"` to the `switch (block.type)`. It must read a file into a data-URI in-browser (no FS):

```tsx
    case "image":
      return (
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-neutral-400">Image URL or data-URI</label>
            <input
              type="text"
              value={block.src}
              onChange={(e) => onChange({ ...block, src: e.target.value })}
              placeholder="https://… or upload below"
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400">Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onChange({ ...block, src: String(reader.result) });
                reader.readAsDataURL(file);
              }}
              className="w-full mt-1 text-sm text-neutral-300 file:mr-2 file:rounded file:border-0 file:bg-neutral-700 file:px-2 file:py-1 file:text-neutral-100"
            />
          </div>
          <Select
            label="Width"
            value={block.width}
            onChange={(e) => onChange({ ...block, width: e.target.value as "sm" | "md" | "lg" | "full" })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
              { value: "full", label: "Full" },
            ]}
          />
          <Select
            label="Align"
            value={block.align}
            onChange={(e) => onChange({ ...block, align: e.target.value as "left" | "center" | "right" })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
          <div>
            <label className="text-xs text-neutral-400">Alt text</label>
            <input
              type="text"
              value={block.alt ?? ""}
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
              className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      );
```

(Confirm `Select` is already imported in `BlockEditor.tsx`; it is used by the `spacer` case, so the import exists.)

- [ ] **Step 4: Typecheck**

Run: `bun run typecheck`
Expected: No NEW errors referencing `BlockEditor.tsx`, `BlockList.tsx`, `cardStore.ts`, or `deckStore.ts`. (Pre-existing unrelated errors may remain — compare against a pre-change run if unsure.)

- [ ] **Step 5: Manual studio verification**

Run: `bun quoteforge studio`
In the browser: add an Image block, paste a URL (or upload a file), set width=md / align=center, confirm the live preview shows the image. The `/api/preview` route passes the data-URI/URL straight through the same template engine.

- [ ] **Step 6: Commit**

```bash
git add studio/src/components/Editor/BlockList.tsx studio/src/components/Editor/BlockEditor.tsx studio/src/store/cardStore.ts studio/src/store/deckStore.ts
git commit -m "feat(quoteforge[image-block]): add image block editor to studio"
```

---

### Task 6: Full test pass

**Files:** none (verification only)

- [ ] **Step 1: Run the whole suite**

Run: `bun test`
Expected: PASS — all existing tests plus the new validator, resolver, and template-engine image tests.

- [ ] **Step 2: Sanity-render a deck slide with an image (optional)**

Add an `image` block to one slide of an existing deck JSON under `decks/` and run `bun quoteforge slides <that-deck>.json` to confirm deck-path resolution. Revert the deck edit afterward (don't commit the scratch change).

---

## Notes for the implementer

- Width percentages are relative to the card content column (inside `--padding`), matching other blocks.
- Studio uploads can produce large data-URIs; acceptable for V1 (see ADR 0001).
- If `template-engine.test.ts` builds its theme differently than assumed in Task 3 Step 1, follow that file's existing fixture pattern — do not introduce a second theme-loading style.
