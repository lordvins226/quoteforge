# Safe-Aspect Cropping Guard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `--safe-aspect <ratio>` so all content survives a center-crop toward a target aspect ratio.

**Architecture:** A pure function computes per-side safe insets from the canvas dimensions and target ratio; the renderer injects them as CSS variables that the card's padding consumes (defaulting to zero, so absent the flag nothing changes). A CLI flag on `generate`/`slides`/`batch` parses the ratio and threads it through.

**Tech Stack:** Bun, TypeScript strict, Nunjucks, Puppeteer (`puppeteer-core`), `bun:test`.

**Spec:** `docs/specs/2026-07-19-safe-aspect-design.md`

## Global Constraints

- Runtime is Bun. `bun test` is the release gate; `bun run typecheck` is pre-existing red repo-wide and informational only. No npm scripts, no Node-only APIs.
- TypeScript strict, no `any`.
- Never hardcode colors in template CSS. This plan adds layout CSS variables only.
- The safe-inset CSS variables default to `0`, so a render without `--safe-aspect` produces byte-identical output to before this plan.
- `--safe-aspect` accepts `W:H`, `WxH`, or a positive decimal. Invalid input is a CLI error, never a silent no-op.
- No code comments unless a step requires them.
- Commit format: `type(app[scope]): brief description`. No bullet points, no author name/email, no body.

---

### Task 1: Safe-inset computation and ratio parsing

**Files:**
- Create: `src/renderer/safe-aspect.ts`
- Test: `src/__tests__/safe-aspect.test.ts`

**Interfaces:**
- Consumes: `Dimensions` from `src/renderer/dimensions.ts` (lot 1).
- Produces:
  - `parseAspectRatio(input: string): number` — returns `tw / th`, throws on invalid input.
  - `SafeInset { top: number; right: number; bottom: number; left: number }`
  - `computeSafeInset(dimensions: Dimensions, ratio: number): SafeInset`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/safe-aspect.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import { parseAspectRatio, computeSafeInset } from "../renderer/safe-aspect.js";

describe("parseAspectRatio", () => {
  test.each([
    ["4:3", 4 / 3],
    ["16:9", 16 / 9],
    ["4x3", 4 / 3],
    ["1.91", 1.91],
  ])("parses %s", (input, expected) => {
    expect(parseAspectRatio(input)).toBeCloseTo(expected, 5);
  });

  test.each(["0:3", "-1", "abc", "4:", ":3", "4:0"])("rejects %s", (bad) => {
    expect(() => parseAspectRatio(bad)).toThrow();
  });
});

describe("computeSafeInset", () => {
  test("target wider than canvas insets top and bottom only", () => {
    // 1080x1080 (c=1) toward 16:9 (r=1.777) -> safe height = 1080/1.777 = 607.5
    // inset each = (1080 - 607.5)/2 = 236.25
    const inset = computeSafeInset({ w: 1080, h: 1080 }, 16 / 9);
    expect(inset.left).toBe(0);
    expect(inset.right).toBe(0);
    expect(inset.top).toBeCloseTo(236.25, 1);
    expect(inset.bottom).toBeCloseTo(236.25, 1);
  });

  test("target narrower than canvas insets left and right only", () => {
    // 1920x1080 (c=1.777) toward 4:5 (r=0.8) -> safe width = 1080*0.8 = 864
    // inset each = (1920 - 864)/2 = 528
    const inset = computeSafeInset({ w: 1920, h: 1080 }, 4 / 5);
    expect(inset.top).toBe(0);
    expect(inset.bottom).toBe(0);
    expect(inset.left).toBeCloseTo(528, 1);
    expect(inset.right).toBeCloseTo(528, 1);
  });

  test("matching ratio yields no inset", () => {
    const inset = computeSafeInset({ w: 1920, h: 1080 }, 16 / 9);
    expect(inset).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/__tests__/safe-aspect.test.ts`
Expected: FAIL — `Cannot find module '../renderer/safe-aspect.js'`.

- [ ] **Step 3: Implement**

Create `src/renderer/safe-aspect.ts`:

```ts
import type { Dimensions } from "./dimensions.js";

export interface SafeInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function parseAspectRatio(input: string): number {
  const trimmed = input.trim();
  const pair = trimmed.match(/^(\d*\.?\d+)\s*[:x]\s*(\d*\.?\d+)$/i);
  if (pair) {
    const tw = Number(pair[1]);
    const th = Number(pair[2]);
    if (tw > 0 && th > 0) return tw / th;
    throw new Error(`Invalid aspect ratio "${input}": both parts must be positive`);
  }
  const decimal = Number(trimmed);
  if (Number.isFinite(decimal) && decimal > 0) return decimal;
  throw new Error(`Invalid aspect ratio "${input}": use W:H (e.g. 4:3), WxH, or a positive decimal`);
}

export function computeSafeInset(dimensions: Dimensions, ratio: number): SafeInset {
  const canvasRatio = dimensions.w / dimensions.h;
  const zero: SafeInset = { top: 0, right: 0, bottom: 0, left: 0 };

  if (ratio > canvasRatio) {
    const safeHeight = dimensions.w / ratio;
    const inset = (dimensions.h - safeHeight) / 2;
    return { ...zero, top: inset, bottom: inset };
  }
  if (ratio < canvasRatio) {
    const safeWidth = dimensions.h * ratio;
    const inset = (dimensions.w - safeWidth) / 2;
    return { ...zero, left: inset, right: inset };
  }
  return zero;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/__tests__/safe-aspect.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/safe-aspect.ts src/__tests__/safe-aspect.test.ts
git commit -m "feat(quoteforge[renderer]): add safe-aspect inset computation and ratio parsing"
```

---

### Task 2: Inject safe insets into the card padding

**Files:**
- Modify: `templates/_base.css` (the `.card` padding)
- Modify: `src/renderer/template-engine.ts` (`buildCssVars`, `renderTemplate`)
- Modify: `src/renderer/renderer.ts` (`renderCardOnPage` — accept and forward the inset)
- Test: `src/__tests__/template-engine.test.ts`

**Interfaces:**
- Consumes: `SafeInset` from Task 1.
- Produces: `renderTemplate(content, theme, dimensions, meta, safeInset?)` emitting
  `--safe-top/right/bottom/left` CSS variables (default `0px`); `.card` padding includes them.

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/template-engine.test.ts`:

```ts
describe("Safe-aspect insets", () => {
  const theme = /* reuse the file's existing theme-loading helper */;
  const card = {
    template: "quote",
    theme: "dark-teal",
    size: "instagram-sq" as const,
    blocks: [{ type: "headline" as const, parts: [{ text: "T", style: "normal" as const }] }],
  };

  test("emits zero safe insets when none supplied", () => {
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 });
    expect(html).toContain("--safe-top: 0px");
    expect(html).toContain("--safe-left: 0px");
  });

  test("emits supplied safe insets", () => {
    const html = renderTemplate(card, theme, { w: 1080, h: 1080 }, undefined, {
      top: 236, right: 0, bottom: 236, left: 0,
    });
    expect(html).toContain("--safe-top: 236px");
    expect(html).toContain("--safe-bottom: 236px");
    expect(html).toContain("--safe-left: 0px");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/template-engine.test.ts`
Expected: FAIL — the `--safe-*` variables are not emitted.

- [ ] **Step 3: Emit the variables**

In `src/renderer/template-engine.ts`, give `buildCssVars` an optional `safeInset` parameter and
add the four variables to its `vars` record (defaulting to zero when absent):

```ts
function buildCssVars(
  theme: Theme,
  dimensions: { w: number; h: number },
  safeInset: { top: number; right: number; bottom: number; left: number } = { top: 0, right: 0, bottom: 0, left: 0 },
): string {
  // ... existing vars ...
  vars["--safe-top"] = `${safeInset.top}px`;
  vars["--safe-right"] = `${safeInset.right}px`;
  vars["--safe-bottom"] = `${safeInset.bottom}px`;
  vars["--safe-left"] = `${safeInset.left}px`;
  // ... return as before ...
}
```

Add a matching optional `safeInset` parameter to `renderTemplate` and pass it through to
`buildCssVars`.

- [ ] **Step 4: Apply the variables in the card padding**

In `templates/_base.css`, replace the `.card` `padding` line (currently
`padding: clamp(24px, calc(var(--padding) * var(--space-scale)), 72px);`) with per-side padding
that adds the safe inset to the base padding:

```css
  padding:
    calc(clamp(24px, calc(var(--padding) * var(--space-scale)), 72px) + var(--safe-top))
    calc(clamp(24px, calc(var(--padding) * var(--space-scale)), 72px) + var(--safe-right))
    calc(clamp(24px, calc(var(--padding) * var(--space-scale)), 72px) + var(--safe-bottom))
    calc(clamp(24px, calc(var(--padding) * var(--space-scale)), 72px) + var(--safe-left));
```

With the variables at `0px` (the default), this is identical to the previous single-value
padding, so existing renders are unchanged.

- [ ] **Step 5: Forward from the renderer**

In `src/renderer/renderer.ts`, add an optional `safeInset` parameter to `renderCardOnPage` and
pass it to `renderTemplate`. Thread an optional `safeInset` through `renderCard` and its deck
equivalent, defaulting to undefined so existing callers are unaffected.

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun test src/__tests__/template-engine.test.ts`
Expected: PASS.

Run: `bun test`
Expected: PASS — existing render/scaling tests stay green because the default insets are zero.

- [ ] **Step 7: Commit**

```bash
git add templates/_base.css src/renderer/template-engine.ts src/renderer/renderer.ts src/__tests__/template-engine.test.ts
git commit -m "feat(quoteforge[renderer]): inject safe-aspect insets into card padding"
```

---

### Task 3: The --safe-aspect CLI flag

**Files:**
- Modify: `src/cli/commands/generate.ts`, `src/cli/commands/slides.ts`, `src/cli/commands/batch.ts`
- Test: `src/__tests__/safe-aspect.test.ts` (extend with a flag-to-inset integration check if the command layer exposes a testable seam; otherwise rely on the pure tests plus the end-to-end step)

**Interfaces:**
- Consumes: `parseAspectRatio`, `computeSafeInset` (Task 1); `resolveDimensions` (lot 1); the
  `renderCard(..., safeInset)` seam (Task 2).

- [ ] **Step 1: Add the flag to `generate`**

In `src/cli/commands/generate.ts`, add:

```ts
  .option("--safe-aspect <ratio>", "Constrain layout to survive a center-crop toward this ratio (e.g. 4:3)")
```

In the action, when `opts.safeAspect` is set: parse it with `parseAspectRatio` (a parse failure
should surface as a clean CLI error via the command's existing error path, not an unhandled
throw), resolve the card's dimensions with `resolveDimensions`, compute the inset with
`computeSafeInset`, and pass the inset into `renderCard`. When the flag is absent, pass nothing
(undefined), preserving current behavior.

- [ ] **Step 2: Add the flag to `slides` and `batch`**

Add the same `--safe-aspect <ratio>` option and wiring to `src/cli/commands/slides.ts` and
`src/cli/commands/batch.ts`. For decks, compute the inset per slide from that slide's resolved
dimensions (slides can differ in size), so the guard is correct for each slide's canvas.

- [ ] **Step 3: End-to-end verification**

```bash
bun quoteforge generate /tmp/qf-align.json --size instagram-sq --safe-aspect 16:9 --output /tmp/qf-safe.png --no-timestamp
```

Render the same card without the flag for comparison. Confirm the `--safe-aspect` render places
all content within the central band (visually, the content sits inside the middle 16:9 region
with clear top/bottom margins). Confirm an invalid ratio (`--safe-aspect 0:3`) exits with a
clear error and no partial output. If Chrome is unavailable, say so rather than skipping.

- [ ] **Step 4: Commit**

```bash
git add src/cli/commands/generate.ts src/cli/commands/slides.ts src/cli/commands/batch.ts src/__tests__/safe-aspect.test.ts
git commit -m "feat(quoteforge[cli]): add --safe-aspect flag for crop-safe layout"
```

---

### Task 4: Documentation and changelog

**Files:**
- Modify: `README.md`
- Modify: `site/src/docs/content-schema.mdx` (or the CLI doc page identified in lot 2's Task 4)
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Document the flag**

Document `--safe-aspect <ratio>` in the CLI docs and README: what it guarantees (content
survives a center-crop toward the ratio), the accepted ratio forms (`W:H`, `WxH`, decimal), the
recommendation to pair it with `align: center` (the default), and that it is not meant to be
combined with `--fit-content` (opposite intents). Include a worked example — a square card made
safe for a 16:9 embed.

- [ ] **Step 2: Changelog**

Prepend to `CHANGELOG.md`:

```markdown
## 0.6.0

### Added
- `--safe-aspect <ratio>` on `generate`/`slides`/`batch`: constrains the layout so all content
  survives a center-crop toward the given ratio (e.g. `--safe-aspect 4:3`), for images embedded
  in mismatched `object-fit: cover` containers. Opt-in; no effect when absent.
```

- [ ] **Step 3: Verify documented commands run**

Run the example commands from the docs and confirm they succeed as written; fix the docs if any
command fails.

- [ ] **Step 4: Commit**

```bash
git add README.md CHANGELOG.md site/src/docs/
git commit -m "docs(quoteforge[cli]): document --safe-aspect"
```

---

## Verification

After all four tasks:

- [ ] `bun test` — whole suite passes.
- [ ] A square card with `--safe-aspect 16:9` keeps all content in the central 16:9 band.
- [ ] An invalid ratio exits with a clear error and no output.
- [ ] A render without `--safe-aspect` is unchanged (safe insets default to zero).

Release with `bun run release:minor`.
