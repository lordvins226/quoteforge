# Design — Warn When Content Overflows the Canvas

Date: 2026-08-06
Status: Approved
Issue: #22

## Goal

`.card` has a fixed size (`height: 100vh`, matching the resolved canvas
dimensions) and `overflow: hidden`. Today, content that doesn't fit is
silently clipped — the user gets a PNG with text cut off and no signal that
anything went wrong. This adds a non-fatal warning, surfaced the same way
`templateWarnings()` already surfaces layout advice: the render still
succeeds, the warning just tells the user to look closer.

## Detection

The only reliable signal is a real DOM measurement after render, not a static
estimate — text wrapping and font metrics aren't knowable from the content
JSON alone. Compare `.card`'s `scrollWidth`/`scrollHeight` to its
`clientWidth`/`clientHeight`: `overflow: hidden` means anything past the
client box is exactly the content being silently clipped.

### Pure decision function (new `src/renderer/overflow.ts`)

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

Pure and unit-tested directly — same split as `fit-content.ts`
(`computeContentClip` is pure/tested, the `page.evaluate` box measurement in
`renderer.ts` is untested glue). No test in this repo currently launches a
real Puppeteer browser; that stays true here. `contentOverflows` is the only
part of this feature with automated coverage. The `page.evaluate` wiring and
the studio's iframe measurement are verified manually.

## CLI path (Puppeteer)

`src/renderer/renderer.ts`:

- After `page.waitForFunction(() => document.fonts.ready...)` and **before**
  the optional `--fit-content` clip (overflow is about the nominal canvas,
  not the crop), measure `.card` via `page.evaluate` and run it through
  `contentOverflows`.
- `renderCardOnPage` and `renderCard` change return type from
  `Promise<Buffer>` to `Promise<{ buffer: Buffer; overflows: boolean }>`.

This is a breaking signature change with 4 call sites. TypeScript strict mode
(`noEmit` fails to compile otherwise) is the safety net that guarantees none
are missed:

- `src/cli/commands/generate.ts` — on `overflows`, `console.warn(chalk.yellow(
  "⚠ Content overflows the canvas — some text or blocks may be cut off."))`,
  same style as the existing warnings in this file.
- `src/cli/commands/slides.ts` (via `renderCardOnPage` in
  `slide-renderer.ts`) — same message prefixed `Slide N:`, matching the
  existing `templateWarnings` call at line 89.
- `src/cli/commands/batch.ts` — same message prefixed with the source
  filename, matching the existing batch warning style.
- `src/server/routes/export.ts` — destructures `.buffer` and returns it
  unchanged; `overflows` is intentionally dropped here. This route has no
  text-warning channel back to the studio, and the studio gets its own
  detection path (below), so no behavior changes on this route.

The render output (the PNG bytes) is unchanged by this feature — only an
additional measurement is added after the same screenshot call.

## Studio path (browser, no Puppeteer)

`PreviewPane.tsx` never goes through Puppeteer — `/api/preview` returns raw
HTML that the studio writes into an `<iframe>` and the browser renders it
directly. Detection happens client-side, after `doc.write(html)`:

```ts
const el = iframe.contentDocument?.querySelector(".card");
if (el && contentOverflows({
  scrollW: el.scrollWidth, scrollH: el.scrollHeight,
  clientW: el.clientWidth, clientH: el.clientHeight,
})) {
  setOverflows(true);
}
```

Reuses the same `contentOverflows` function — only how the four numbers are
obtained differs between the two runtimes (Puppeteer page vs. browser DOM),
which can't be unified. A small banner (styled like the existing `error`
state: `text-neutral-500 text-sm`) renders above the iframe when true, reset
on each new render pass.

## Out of scope

- No warning threading through `/export`'s JSON response — the export route
  keeps its current contract.
- No automated test for the actual Puppeteer measurement or the React banner
  — manual verification only, consistent with the rest of the render path.

## Data flow

```
CLI:    page.setContent → fonts.ready → page.evaluate (measure .card)
           → contentOverflows() → { buffer, overflows } → command prints warning

Studio: /api/preview (raw HTML) → iframe doc.write → measure .card in iframe
           → contentOverflows() → banner shown/hidden
```
