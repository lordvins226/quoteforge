# Safe-Aspect Cropping Guard — Design

**Date:** 2026-07-19
**Status:** Approved
**Target release:** v0.6.0 (minor — additive)
**Depends on:** v0.5.0 lot 2 (`docs/specs/2026-07-19-vertical-alignment-and-presets-design.md`) —
the alignment control that centers content, which `--safe-aspect` relies on to keep content
inside the safe region.

## Goal

Let an author guarantee that all text survives a center-crop toward a target aspect ratio, so a
QuoteForge image dropped into a mismatched `object-fit: cover` container — a grid thumbnail, an
avatar, a blog card — is not silently truncated at the edges.

## Background — the problem

A rendered image often lands in a container whose ratio differs from the image's. The browser
scales to cover and crops from the center, and QuoteForge's content, pushed toward the edges,
is the first thing cut. Alignment (lot 2) centers content, which helps, but does not *guarantee*
survival for a specific target ratio: content can still be wide or tall enough to enter the crop
zone.

## Approach

A CLI flag, not a content field:

```bash
quoteforge generate card.json --size instagram-sq --safe-aspect 4:3
```

`--safe-aspect <ratio>` constrains the layout so that every block stays within the largest
centered rectangle of that ratio inscribed in the canvas. The image still renders at the card's
full size; the guarantee is that a center-crop toward `<ratio>` keeps all content visible.

This was chosen over a content-level "safe area" field because it is opt-in per render, adds no
schema surface, changes no default rendering, and composes with the existing `align` control
without a second placement system to reconcile. The trade-off — it is not versioned with the
content — is acceptable: the target container ratio is a property of where the image is being
*used*, not of the content itself, so a render-time flag is the honest home for it.

## Non-goals

- A content-schema `safeArea` field. Rejected per the approach above (one placement mechanism,
  not two).
- Multiple simultaneous safe ratios. One ratio per render. A user targeting several containers
  renders several times.
- Automatic detection of the target ratio. The author states it.

---

## Mechanism

The safe rectangle is the largest centered box of the target ratio that fits in the canvas.
Given canvas `w × h` (from `resolveDimensions`) and target ratio `r = tw / th`:

- Canvas ratio `c = w / h`.
- If `r > c` (target wider than canvas): a cover-crop toward `r` trims top and bottom. The safe
  height is `w / r`; the inset on each of top and bottom is `(h − w / r) / 2`.
- If `r < c` (target narrower/taller): the crop trims left and right. The safe width is `h · r`;
  the inset on each of left and right is `(w − h · r) / 2`.
- If `r == c`: no inset — the ratios already match.

The inset is injected as **additional** padding on the cropped axis, on top of the theme's
padding, via a CSS variable the template applies to `.card`. Because lot 2 makes content
non-growing and centered by default, the extra symmetric inset keeps content inside the safe
rectangle without any per-block change. The theme padding still applies *inside* the safe box,
so content is not flush against the crop line.

The core computation is a pure function:

```
computeSafeInset(dimensions, ratio) -> { top, right, bottom, left }
```

returning per-side pixel insets (two sides zero, two sides equal), testable without a browser.

### Ratio parsing

`--safe-aspect` accepts `W:H` (e.g. `4:3`, `16:9`), `WxH` (e.g. `4x3`), or a positive decimal
(e.g. `1.91`). Both components must be positive numbers. An unparseable or non-positive value is
a CLI error with a message showing the accepted forms — it does not silently no-op.

### Interaction with other flags

- **`align` (lot 2):** `--safe-aspect` works with any alignment. With `center` (the default) the
  content is centered within the safe box, which is the intended and safest combination. With
  `top`/`bottom` the content is pushed to an edge of the *safe* box, still inside the crop-safe
  region. The docs recommend `center` with `--safe-aspect`.
- **`--fit-content` (lot 2):** the two express opposite intents — `--safe-aspect` shapes a
  fixed-size canvas for a known crop; `--fit-content` removes the canvas margins entirely.
  Combining them crops away the safe padding, defeating the guard. The docs state they are not
  meant to be combined; the tool does not block it (warn, not error).

---

## Tests

- `computeSafeInset` for `r > c` (e.g. 1080×1080 toward 16:9) insets top/bottom only, by the
  computed amount, left/right zero.
- `computeSafeInset` for `r < c` (e.g. 1920×1080 toward 4:5) insets left/right only.
- `computeSafeInset` for `r == c` returns all-zero.
- Ratio parsing accepts `4:3`, `4x3`, `1.91`; rejects `0:3`, `-1`, `abc`, `4:` with a clear
  error.
- End-to-end: a card rendered with `--safe-aspect 16:9` on a square size places all content
  within the central 16:9 band — assert via the emitted inset padding value, not pixel geometry.

The end-to-end render needs headless Chrome; follow the render-test gating established in the
lot 1 / lot 2 follow-ups, and keep `computeSafeInset` and the ratio parser pure so the bulk of
the logic is covered without a browser.

## Versioning

**v0.6.0**, a minor and purely additive. No existing behavior changes; `--safe-aspect` is opt-in
and absent by default.

## Implementation order

1. `computeSafeInset` + ratio parser — pure, fully unit-tested first.
2. Renderer wiring — inject the inset as a CSS variable the card padding consumes.
3. CLI flag on `generate`/`slides`/`batch`.
4. Documentation — README and `site/src/docs`.
