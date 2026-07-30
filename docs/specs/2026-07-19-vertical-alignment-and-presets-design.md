# Vertical Alignment, Non-Social Presets, and Content-Fit Cropping — Design

**Date:** 2026-07-19
**Status:** Approved
**Target release:** v0.5.0 (minor — contains a rendering-behavior change; see "Versioning")
**Depends on:** v0.4.0 lot 1 (`docs/specs/2026-07-19-strict-schema-and-custom-size-design.md`) — the
`resolveDimensions` resolver and strict schemas this builds on.

## Goal

Give the author control over where content sits vertically on the canvas, add size presets
for non-social targets, and offer a CLI crop that trims the canvas to the content. Together
these make QuoteForge usable for embedded web visuals — grid thumbnails, blog headers,
README banners — not only standalone social posts.

## Background — the actual defect

Every template distributes blocks over the full canvas height. The cause is in
`templates/_base.css`:

```css
.block { flex: 1 1 0; justify-content: center; }   /* line 33-40 */
```

Each block is a greedy flex item: it grows to absorb the remaining height, then centers its
content inside its own inflated box. With short content, a headline pinned near the top and a
list stranded at ~67% height leave a large void between them — the void is *inside* the second
block, not between blocks, which is why `-trim` in ImageMagick cannot remove it.

No template overrides `.card`'s `justify-content` (verified: the only per-template
`justify-content` is on `.block-bullet-list li` in `quote/style.css`, unrelated). So the fix
is centralized and clean.

## Scope

| Item | In this release |
|------|-----------------|
| `align: top \| center \| bottom \| spread` on card / deck defaults / slide | Yes |
| Non-social size presets (`og`, `4x3`, `3x2`, `slide-16x9`, `readme-hero`) | Yes |
| `--fit-content` / `--trim` CLI crop to content bounding box + theme padding | Yes |

## Non-goals

- Safe-area / `--safe-aspect` for centered crops — v0.6.0 (lot 3). It depends on this release's
  alignment control.
- Horizontal alignment control. Content is horizontally centered by template CSS; no request
  for per-card horizontal control exists. YAGNI.
- Per-block alignment. `align` is a card-level property. A block that needs isolation uses the
  existing `spacer`/`divider` blocks.

---

## 1. Vertical alignment

### Design

A card-level `align` field with four values, defaulting to `center`:

| Value | Placement | Mechanism |
|-------|-----------|-----------|
| `center` (default) | Content grouped, margins split top and bottom | `justify-content: center` |
| `top` | Content pinned to the top, void below | `justify-content: flex-start` |
| `bottom` | Content pinned to the bottom, void above | `justify-content: flex-end` |
| `spread` | Blocks pushed to the edges, gaps between | `justify-content: space-between` |

The field lives on `CardContent`, on deck `defaults`, and on individual slides (inheriting
defaults → slide the same way `size`/`theme` do). It is optional; when absent it is `center`.

### Mechanism

Two coupled changes in `templates/_base.css`:

1. `.block` changes from `flex: 1 1 0` to `flex: 0 0 auto`, so a block takes its natural
   content height instead of growing to fill. `justify-content: center` on `.block` (which
   centered content inside the inflated box) is removed — it no longer has a purpose once the
   box is content-sized.
2. `.card` gains an alignment class — `align-center`, `align-top`, `align-bottom`,
   `align-spread` — that sets its `justify-content`. `.card` already has
   `display: flex; flex-direction: column`, so `justify-content` is the vertical axis.

The template engine injects the class onto the `.card` element. The four templates render
`<div class="card">`; this becomes `<div class="card align-{{ align }}">`. Because no template
overrides `.card`'s `justify-content`, the class governs unambiguously.

`.block-headline`, `.block-divider`, and `.block-spacer` already carry `flex: 0 0 auto`
explicitly (lines 42-49); they are unaffected. The `spacer` block continues to insert fixed
vertical space, which composes naturally with any alignment.

### The breaking part

The pre-0.5.0 rendering distributed blocks with `flex: 1 1 0`. Every existing card re-renders
with content grouped and centered instead of spread. `spread` is the closest match to the old
look and is provided as the escape hatch, but it is `space-between`, not the old equal-grow
distribution — it is not byte-identical. This is a deliberate change to the default rendering
of all existing content and is called out in the CHANGELOG as breaking.

### Tests

- Each of the four `align` values validates and produces the expected `align-*` class in the
  rendered HTML.
- Absent `align` yields `align-center` (the default is applied, not left blank).
- `align` on deck defaults propagates to a slide that does not set its own; a slide's `align`
  overrides the default.
- An unknown `align` value fails validation (strict enum), naming the field.
- A rendered short-content card no longer places its last block in the lower third: assert the
  `.card` element carries `align-center` and that `.block` no longer carries `flex: 1 1 0` in
  the emitted CSS. (Pixel position is Chrome-dependent; assert the CSS contract, not geometry.)

---

## 2. Non-social size presets

### Design

Five presets added to `SIZES` in `src/cli/utils/validator.ts`, chosen to cover the web targets
the README already advertises:

| Name | Dimensions | Ratio | Use |
|------|-----------|-------|-----|
| `og` | 1200 × 630 | 1.91:1 | Open Graph / blog link preview |
| `readme-hero` | 1280 × 640 | 2:1 | GitHub README / docs hero banner |
| `slide-16x9` | 1920 × 1080 | 16:9 | Presentation / talk slide |
| `4x3` | 1600 × 1200 | 4:3 | Classic 4:3 slide / web grid tile |
| `3x2` | 1500 × 1000 | 3:2 | Photo-ratio card / web grid tile |

`og` at 1200×630 duplicates the dimensions of the existing `facebook-post` but under a
platform-neutral name, so a user targeting a generic OG image is not forced to name a social
network. This is intentional and documented.

### Duplication obligations

Per `CLAUDE.md`, `SIZES` is mirrored in three places. All three update together:

1. `src/cli/utils/validator.ts` — the `SIZES` authority (source of the Zod enum).
2. `studio/src/types/index.ts` — the browser mirror.
3. `src/__tests__/validator.test.ts` — the count assertion, which moves from 17 to **22**.

### Tests

- Each new preset validates as a `size`.
- Each resolves through `resolveDimensions` to exactly its tabulated dimensions.
- The size count is 22 in all three synchronized locations.

---

## 3. Content-fit cropping

### Design

A CLI flag on `generate` (and the equivalent on `slides`/`batch`) that, after the normal
render, crops the PNG to the content's bounding box plus the theme's padding, discarding the
surrounding void:

```bash
quoteforge generate card.json --fit-content
```

`--trim` is accepted as an alias for the same behavior, since that is the word ImageMagick
users reach for.

### Mechanism

The crop is measured in the browser, where the layout already exists, not by post-processing
pixels:

1. After `page.setContent` and font settling, `page.evaluate` measures the bounding box of the
   rendered content — the union of the block elements' rects inside `.card`.
2. The box is expanded by the theme's resolved padding on all sides (the same
   `--padding * --space-scale` value the card uses), clamped to the canvas.
3. `page.screenshot({ clip })` captures only that region, at the same `deviceScaleFactor`.

The output PNG's dimensions therefore depend on the content. This is the point — a short card
crops to a compact image with no void — but it means `--fit-content` and a fixed target size
are different intents. When both a non-square deck warning and `--fit-content` apply, the crop
wins on dimensions.

### Interaction with alignment

`--fit-content` makes `align` irrelevant to the output, because the void alignment would
position is cropped away. That is fine: `align` shapes a fixed-size canvas; `--fit-content`
removes the canvas margins entirely. A user picks one intent. The docs state this.

### Interaction with decks

`slides` renders many cards. `--fit-content` applied to a deck crops each slide independently,
so slides can end up with differing heights. For a carousel this is usually undesirable, so the
docs recommend `--fit-content` for single cards and warn (not block) when it is combined with
`slides`.

### Tests

- `--fit-content` on a short card produces a PNG shorter than the full canvas height.
- The cropped PNG retains the theme padding around the content (the content is not flush to the
  edge — assert a padding band exists, e.g. the corner pixels match the background color).
- `--trim` behaves identically to `--fit-content`.
- A full-bleed card (content already filling the canvas) is effectively unchanged by
  `--fit-content` (dimensions within a small tolerance of the uncropped render).

The browser-measurement path needs headless Chrome. The repo's suite currently avoids full
renders; these tests follow whatever gating the render tests introduced in lot 1's follow-up
use, or extract the measurement/clip computation into a pure function tested without a browser.

---

## Versioning

**v0.5.0**, a minor. The alignment change re-renders every existing card (content grouped and
centered rather than distributed). No schema *rejects* previously-valid files — unlike lot 1 —
but the visual output changes, which is a behavior change worth a minor bump and an explicit
CHANGELOG note: existing cards now center by default; add `"align": "spread"` to approximate
the previous distribution.

The presets and `--fit-content` are purely additive.

## Implementation order

1. Size presets — additive, no interaction with the others, lands first.
2. Vertical alignment — the schema field, the CSS change, the template class injection.
3. `--fit-content` — depends on nothing in 1-2 structurally but is documented against both.
4. Documentation — README and `site/src/docs` reflect the final behavior.
