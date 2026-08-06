# Overflow Warning — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Warn when a card's rendered content overflows its fixed canvas and gets silently clipped by `.card { overflow: hidden }`.

**Architecture:** A pure `contentOverflows()` function decides overflow from four measured numbers (`scrollWidth`/`scrollHeight` vs `clientWidth`/`clientHeight`). The CLI path measures `.card` inside Puppeteer via `page.evaluate` and threads the result out through `renderCardOnPage`/`renderCard`/`renderDeck`'s return values to `generate`/`slides`/`batch`, which print a warning in the same style as the existing `templateWarnings()` warnings. The studio path measures the same way inside its preview `<iframe>` (no Puppeteer involved there) and shows a banner.

**Tech Stack:** Bun, TypeScript strict, Puppeteer (`puppeteer-core`), React (studio), `bun:test`.

**Spec:** `docs/specs/2026-08-06-overflow-warning-design.md`

## Global Constraints

- Runtime is Bun. `bun test` and `bun run typecheck` (src + studio) must both stay green — TypeScript strict mode is the safety net for the `renderCardOnPage`/`renderCard`/`renderDeck` signature change, so every call site must be updated or the build fails.
- TypeScript strict, no `any`.
- The PNG/HTML output bytes are unchanged by this feature — only an added measurement after the existing screenshot/render call. No CSS or template markup changes.
- No test in this repo launches a real Puppeteer browser today; that stays true. Only `contentOverflows()` gets automated coverage. The `page.evaluate` wiring and the studio banner are verified manually.
- `/export`'s JSON response contract is unchanged — it drops `overflows`, no new field.
- No code comments unless a step requires them.
- Commit format: `type(app[scope]): brief description`. No bullet points, no author name/email, no body.

---

### Task 1: Pure overflow decision function

**Files:**
- Create: `src/renderer/overflow.ts`
- Test: `src/__tests__/overflow.test.ts`

**Interfaces:**
- Produces: `OverflowBox { scrollW: number; scrollH: number; clientW: number; clientH: number }` and `contentOverflows(box: OverflowBox): boolean`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/overflow.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import { contentOverflows } from "../renderer/overflow.js";

describe("contentOverflows", () => {
  test("flags vertical overflow", () => {
    expect(contentOverflows({ scrollW: 1200, scrollH: 1400, clientW: 1200, clientH: 1200 })).toBe(true);
  });

  test("flags horizontal overflow", () => {
    expect(contentOverflows({ scrollW: 1300, scrollH: 1200, clientW: 1200, clientH: 1200 })).toBe(true);
  });

  test("flags overflow on both axes", () => {
    expect(contentOverflows({ scrollW: 1300, scrollH: 1400, clientW: 1200, clientH: 1200 })).toBe(true);
  });

  test("no overflow when content fits exactly", () => {
    expect(contentOverflows({ scrollW: 1200, scrollH: 1200, clientW: 1200, clientH: 1200 })).toBe(false);
  });

  test("no overflow when content is smaller than the canvas", () => {
    expect(contentOverflows({ scrollW: 900, scrollH: 800, clientW: 1200, clientH: 1200 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/__tests__/overflow.test.ts`
Expected: FAIL — `Cannot find module '../renderer/overflow.js'`.

- [ ] **Step 3: Implement**

Create `src/renderer/overflow.ts`:

```ts
export interface OverflowBox {
  scrollW: number;
  scrollH: number;
  clientW: number;
  clientH: number;
}

export function contentOverflows(box: OverflowBox): boolean {
  return box.scrollW > box.clientW || box.scrollH > box.clientH;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/__tests__/overflow.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/overflow.ts src/__tests__/overflow.test.ts
git commit -m "feat(quoteforge[renderer]): add pure overflow decision function"
```

---

### Task 2: Measure overflow in the Puppeteer render path

**Files:**
- Modify: `src/renderer/renderer.ts`

**Interfaces:**
- Consumes: `contentOverflows`, `OverflowBox` from Task 1.
- Produces: `renderCardOnPage(...): Promise<{ buffer: Buffer; overflows: boolean }>` and `renderCard(...): Promise<{ buffer: Buffer; overflows: boolean }>` — same parameters as before, only the return type changes.

This task only changes `renderer.ts` itself. It will not compile against its callers until Task 3 updates them — that's expected; do not modify any other file in this task.

- [ ] **Step 1: Add the measurement and change the return shape**

In `src/renderer/renderer.ts`, add the import:

```ts
import { contentOverflows } from "./overflow.js";
```

Replace the body of `renderCardOnPage` (currently returns `Promise<Buffer>`) so it measures `.card` right after the fonts-ready wait and returns both the buffer and the overflow flag:

```ts
export async function renderCardOnPage(
  page: Page,
  content: CardContent,
  theme: Theme,
  size: SizeName,
  scale = 2,
  meta?: Partial<RenderMeta>,
  fitContent = false,
  safeInset?: SafeInset,
): Promise<{ buffer: Buffer; overflows: boolean }> {
  const dimensions = resolveDimensions({
    size,
    width: content.width,
    height: content.height,
  });
  const html = renderTemplate(content, theme, dimensions, meta, safeInset);

  await page.setViewport({
    width: dimensions.w,
    height: dimensions.h,
    deviceScaleFactor: scale,
  });
  await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
  await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 15_000 });

  const overflowBox = await page.evaluate(() => {
    const el = document.querySelector(".card");
    if (!el) return null;
    return {
      scrollW: el.scrollWidth,
      scrollH: el.scrollHeight,
      clientW: el.clientWidth,
      clientH: el.clientHeight,
    };
  });
  const overflows = overflowBox ? contentOverflows(overflowBox) : false;

  if (fitContent) {
    const box = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll(".card > .block"));
      if (blocks.length === 0) return null;
      const rects = blocks.map((b) => b.getBoundingClientRect());
      const x = Math.min(...rects.map((r) => r.left));
      const y = Math.min(...rects.map((r) => r.top));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      const cardEl = document.querySelector(".card");
      const padding = cardEl ? parseFloat(getComputedStyle(cardEl).paddingTop) : 0;
      return { x, y, width: right - x, height: bottom - y, padding };
    });
    if (box) {
      const clip = computeContentClip(
        { x: box.x, y: box.y, width: box.width, height: box.height },
        box.padding,
        dimensions,
      );
      const shot = await page.screenshot({ type: "png", clip });
      return { buffer: Buffer.from(shot), overflows };
    }
  }

  const screenshot = await page.screenshot({ type: "png" });
  return { buffer: Buffer.from(screenshot), overflows };
}
```

Update `renderCard` to match the new return type and forward it unchanged:

```ts
export async function renderCard(
  content: CardContent,
  theme: Theme,
  size: SizeName,
  scale = 2,
  meta?: Partial<RenderMeta>,
  browser?: Browser,
  fitContent = false,
  safeInset?: SafeInset,
): Promise<{ buffer: Buffer; overflows: boolean }> {
  const ownBrowser = !browser;
  const b = browser ?? await launch();
  try {
    const page = await b.newPage();
    try {
      return await renderCardOnPage(page, content, theme, size, scale, meta, fitContent, safeInset);
    } finally {
      await page.close();
    }
  } finally {
    if (ownBrowser) {
      await b.close();
    }
  }
}
```

- [ ] **Step 2: Confirm the expected compile failures**

Run: `bun run typecheck`
Expected: FAIL, with errors in `src/cli/commands/generate.ts`, `src/cli/commands/batch.ts`, `src/server/routes/export.ts`, and `src/renderer/slide-renderer.ts` — each assigns the new `{ buffer, overflows }` object where a `Buffer` is expected. This is the expected, temporary state until Task 3 fixes every call site.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/renderer.ts
git commit -m "feat(quoteforge[renderer]): measure content overflow in the Puppeteer render path"
```

---

### Task 3: Propagate the overflow flag through every call site

**Files:**
- Modify: `src/renderer/slide-renderer.ts`
- Modify: `src/cli/commands/generate.ts`
- Modify: `src/cli/commands/slides.ts`
- Modify: `src/cli/commands/batch.ts`
- Modify: `src/server/routes/export.ts`

**Interfaces:**
- Consumes: `renderCardOnPage`/`renderCard` returning `{ buffer: Buffer; overflows: boolean }` (Task 2).
- Produces: `renderDeck(...): Promise<{ buffers: Buffer[]; names: string[]; overflows: boolean[] }>` (index-aligned with `buffers`/`names`).

- [ ] **Step 1: Update `renderDeck` in `slide-renderer.ts`**

In `src/renderer/slide-renderer.ts`, the per-slide task currently does:

```ts
      const page = await pool.acquire();
      let buffer: Buffer;
      try {
        buffer = await renderCardOnPage(page, cardContent, theme, sizeName, scale, meta, fitContent, safeInset);
      } finally {
        pool.release(page);
      }
      const paddedIndex = String(originalIndex + 1).padStart(padWidth, "0");
      const name = `${deckName}-${paddedIndex}.png`;

      return { buffer, name };
```

Change it to destructure the new return shape and carry `overflows` through:

```ts
      const page = await pool.acquire();
      let buffer: Buffer;
      let overflows: boolean;
      try {
        ({ buffer, overflows } = await renderCardOnPage(page, cardContent, theme, sizeName, scale, meta, fitContent, safeInset));
      } finally {
        pool.release(page);
      }
      const paddedIndex = String(originalIndex + 1).padStart(padWidth, "0");
      const name = `${deckName}-${paddedIndex}.png`;

      return { buffer, name, overflows };
```

And update the function's return statement and signature:

```ts
export async function renderDeck(
  deck: DeckContent,
  opts: SlideRenderOptions = {},
): Promise<{ buffers: Buffer[]; names: string[]; overflows: boolean[] }> {
```

```ts
    return {
      buffers: results.map((r) => r.buffer),
      names: results.map((r) => r.name),
      overflows: results.map((r) => r.overflows),
    };
```

- [ ] **Step 2: Update `generate.ts`**

In `src/cli/commands/generate.ts`, change:

```ts
    let buf: Buffer;
    try {
      buf = await renderCard(card, theme, sizeName, scale, undefined, undefined, fitContent, safeInset);
    } catch (err: unknown) {
```

to:

```ts
    let buf: Buffer;
    try {
      const rendered = await renderCard(card, theme, sizeName, scale, undefined, undefined, fitContent, safeInset);
      buf = rendered.buffer;
      if (rendered.overflows) {
        console.warn(chalk.yellow("⚠ Content overflows the canvas — some text or blocks may be cut off."));
      }
    } catch (err: unknown) {
```

- [ ] **Step 3: Update `slides.ts`**

In `src/cli/commands/slides.ts`, change:

```ts
    const { buffers, names } = await renderDeck(deck, {
      sizeOverride: opts.size as typeof deck.defaults.size | undefined,
      themeOverride: opts.theme,
      slideIndex,
      noCounter: !opts.counter,
      concurrency,
      scale,
      fitContent,
      safeAspectRatio,
    });
```

to:

```ts
    const { buffers, names, overflows } = await renderDeck(deck, {
      sizeOverride: opts.size as typeof deck.defaults.size | undefined,
      themeOverride: opts.theme,
      slideIndex,
      noCounter: !opts.counter,
      concurrency,
      scale,
      fitContent,
      safeAspectRatio,
    });

    overflows.forEach((overflowed, i) => {
      if (overflowed) {
        const slideNumber = slideIndex !== undefined ? slideIndex + 1 : i + 1;
        console.warn(chalk.yellow(`⚠ Slide ${slideNumber}: content overflows the canvas — some text or blocks may be cut off.`));
      }
    });
```

- [ ] **Step 4: Update `batch.ts`**

In `src/cli/commands/batch.ts`, change the card branch:

```ts
          const buf = await renderCard(card, theme, sizeName, 2, undefined, undefined, fitContent, safeInset);
          const outPath = join(outputDir, `${basename(file, ".json")}.png`);
          writeFileSync(outPath, buf);
```

to:

```ts
          const rendered = await renderCard(card, theme, sizeName, 2, undefined, undefined, fitContent, safeInset);
          if (rendered.overflows) {
            console.warn(chalk.yellow(`  ⚠ ${file}: content overflows the canvas — some text or blocks may be cut off.`));
          }
          const outPath = join(outputDir, `${basename(file, ".json")}.png`);
          writeFileSync(outPath, rendered.buffer);
```

Leave the deck branch (`renderDeck` call) as-is beyond the type fix — `batch.ts` does not print per-slide `templateWarnings()` for decks either today, so per-slide overflow warnings for the deck branch are out of scope for this task, consistent with that existing asymmetry. Destructure `overflows` out of the `renderDeck` result so the object still matches its new type, but don't act on it:

```ts
          const { buffers, names } = await renderDeck(deck, {
```

stays exactly as it is — extra returned properties don't break destructuring, so this line needs no change.

- [ ] **Step 5: Update `export.ts`**

In `src/server/routes/export.ts`, change:

```ts
  const buf = await renderCard(body.card, theme, body.size, body.scale ?? 2, undefined, undefined, body.fitContent ?? false);
```

to:

```ts
  const { buffer: buf } = await renderCard(body.card, theme, body.size, body.scale ?? 2, undefined, undefined, body.fitContent ?? false);
```

Everything after this line in the file (which uses `buf`) stays unchanged — `overflows` is intentionally dropped, per the spec's decision not to thread a text warning through this route's JSON contract.

- [ ] **Step 6: Run typecheck and the full test suite**

Run: `bun run typecheck`
Expected: PASS on both `src/` and `studio/`.

Run: `bun test`
Expected: PASS — all existing tests, no behavior change to any PNG output.

- [ ] **Step 7: Manual verification**

Create a card that clearly overflows — e.g. a `bullet-list` with many long items on a small size:

```bash
cat > /tmp/overflow-demo.json << 'EOF'
{
  "template": "list",
  "theme": "dark-teal",
  "size": "twitter",
  "blocks": [
    { "type": "headline", "parts": [{ "text": "Overflow test", "style": "normal" }] },
    { "type": "bullet-list", "items": [
      { "label": "1", "text": "Line one is fairly long to help push past the bottom edge" },
      { "label": "2", "text": "Line two is fairly long to help push past the bottom edge" },
      { "label": "3", "text": "Line three is fairly long to help push past the bottom edge" },
      { "label": "4", "text": "Line four is fairly long to help push past the bottom edge" },
      { "label": "5", "text": "Line five is fairly long to help push past the bottom edge" },
      { "label": "6", "text": "Line six is fairly long to help push past the bottom edge" },
      { "label": "7", "text": "Line seven is fairly long to help push past the bottom edge" },
      { "label": "8", "text": "Line eight is fairly long to help push past the bottom edge" }
    ] }
  ]
}
EOF
bun run src/cli/index.ts generate /tmp/overflow-demo.json --output /tmp/overflow-demo.png --no-timestamp
```

Expected: the command prints `⚠ Content overflows the canvas — some text or blocks may be cut off.` and still writes the PNG. Render the same file through `quoteforge slides` wrapped in a one-slide deck to confirm the `Slide 1:` prefix, and through `quoteforge batch` on a directory containing this file to confirm the filename-prefixed message. If Chrome is unavailable in this environment, say so rather than skipping this step.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/slide-renderer.ts src/cli/commands/generate.ts src/cli/commands/slides.ts src/cli/commands/batch.ts src/server/routes/export.ts
git commit -m "feat(quoteforge[cli]): warn on the CLI when rendered content overflows the canvas"
```

---

### Task 4: Studio preview overflow banner

**Files:**
- Modify: `studio/src/components/Preview/PreviewPane.tsx`

**Interfaces:**
- Consumes: none from earlier tasks (the studio build does not import from `src/` — it has its own runtime, matching how `studio/src/types/index.ts` already duplicates `Block` rather than importing the Zod-inferred type). The overflow check is reimplemented as a small inline predicate matching `contentOverflows`'s logic.

- [ ] **Step 1: Add overflow state and the client-side check**

In `studio/src/components/Preview/PreviewPane.tsx`, add a new state alongside the existing `error`/`loading` state:

```ts
  const [overflows, setOverflows] = useState(false);
```

In the effect that writes the iframe document (currently):

```ts
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [html]);
```

change it to measure `.card` right after writing, resetting the flag first so a fixed card clears a stale warning:

```ts
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    setOverflows(false);
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      const el = doc.querySelector(".card");
      if (el) {
        setOverflows(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
      }
    }
  }, [html]);
```

- [ ] **Step 2: Render the banner**

In the component's returned JSX, currently:

```tsx
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-neutral-950 p-6 overflow-hidden">
      {error ? (
        <div className="text-neutral-500 text-sm">{error}</div>
      ) : loading && !html ? (
        <div className="text-neutral-600 text-xs animate-pulse">Loading preview…</div>
      ) : (
        <div style={{ width: scaledW, height: scaledH, position: "relative" }}>
```

Add the banner as a sibling above the sized preview box, inside the same final branch:

```tsx
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-neutral-950 p-6 overflow-hidden">
      {error ? (
        <div className="text-neutral-500 text-sm">{error}</div>
      ) : loading && !html ? (
        <div className="text-neutral-600 text-xs animate-pulse">Loading preview…</div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {overflows && (
            <div className="text-neutral-500 text-sm">
              ⚠ Content overflows the canvas — some text or blocks may be cut off.
            </div>
          )}
          <div style={{ width: scaledW, height: scaledH, position: "relative" }}>
```

Close the added wrapping `<div>` after the existing `</div>` that currently closes the sized preview box (the one right before the final `)}`) — add one more `</div>` there to match the new wrapper opened above.

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck`
Expected: PASS (this only touches `studio/`, checked by `tsc --noEmit -p studio`).

- [ ] **Step 4: Manual verification**

Run: `bun run src/cli/index.ts studio`
Open the studio, load or build a card whose content clearly overflows the canvas (e.g. the same long `bullet-list` from Task 3's manual check, on a small size like `twitter`). Confirm the banner appears above the preview. Edit the card so it fits (e.g. delete items) and confirm the banner disappears without a page reload.

- [ ] **Step 5: Commit**

```bash
git add studio/src/components/Preview/PreviewPane.tsx
git commit -m "feat(quoteforge[studio]): show a banner when preview content overflows the canvas"
```

---

### Task 5: Documentation and changelog

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add the changelog entry**

Prepend to `CHANGELOG.md`, above the current `## 1.2.0` entry:

```markdown
## 1.3.0

### Added
- **`generate`, `slides`, `batch`, and the studio preview now warn when content overflows the
  canvas.** `.card` clips overflow silently — text or blocks that don't fit were cut off with no
  signal. The CLI commands print a warning after rendering; the studio preview shows the same
  warning as a banner above the live preview, live-updating as the card is edited.
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs(quoteforge[changelog]): note the overflow warning"
```

---

## Verification

After all five tasks:

- [ ] `bun test` — whole suite passes, including the new `overflow.test.ts`.
- [ ] `bun run typecheck` — clean on `src/` and `studio/`.
- [ ] `generate`, `slides`, and `batch` each print the overflow warning for a deliberately overflowing card, and still write correct output.
- [ ] A card that fits produces no warning anywhere (CLI or studio).
- [ ] The studio preview banner appears and disappears live as a card is edited in and out of overflow.

Release with `bun run release:minor`.
