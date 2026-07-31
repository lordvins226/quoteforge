# Changelog

## Unreleased

### Added
- **`generate` and `slides` now warn when a template drops a block.** 15 of the 28 templates
  render only a subset of block types and silently discard the rest — a `headline` on `memo`,
  a `text` block on `ticket`, anything but `bullet-list`/`callout` on `grid`, `versus`, and
  `prompt`. The card validated, rendered, exited 0, and was missing content the author had
  written. The warning names the template and the dropped types. It reads each template's own
  `block.type` guards at runtime, so it cannot drift from the markup.

## 1.1.0

### Changed
- **Body text now scales with the canvas.** `headline-size` was viewport-relative while
  `body-size` was a fixed `1rem` capped by a `--type-scale` ceiling of 1.25, so body text
  rendered at 20px on every canvas — the same on a 400×400 card as on a 1920×1080 slide, and
  the templates' own 28–32px `clamp()` maxima never engaged. The scale multiplier is now 1.85
  (was 1.5) and its ceiling 1.6 (was 1.25). Square, portrait, and story cards go from 20px to
  26px; 16:9 from 14px to 17px; Open Graph from 13px to 16px.

  **This changes existing output.** Regenerating a card authored against 1.0.0 produces larger
  type. Nothing overflows in the built-in templates — the densest were re-rendered and checked
  — but a custom template with tight vertical budgets should be re-rendered before upgrading.

### Added
- Theme colour token `on-accent`: the text colour used on accent-filled surfaces
  (sticky note, split rail, chat bubble, calendar date block, window CTA, profile avatar).
  Optional — defaults to `background`, so existing themes are unaffected.

### Fixed
- `code` blocks rendered in the theme's body font, which is proportional in most themes
  (IBM Plex Sans on `terminal-green`), breaking indentation alignment. They now use a
  monospace stack.
- Text on accent-filled surfaces was hardcoded to `background`, which fails whenever a theme's
  accent and background sit close in luminance. `brutal-white` rendered white-on-yellow at a
  1.32:1 contrast ratio; it is now 15.93:1. `light-minimal`, `sunset-rose`, and `noir-crimson`
  were also below the 4.5:1 threshold and now carry an explicit `on-accent`.
- `align` was inert on templates whose content lives in a full-height inner body — `terminal`,
  `diff`, and `frame` ignored `top`, `bottom`, and `spread` entirely.
- Docs images rendered unstyled at full resolution; template samples are now contained and
  captioned.
- `spotlight` and `frame` samples did not match their designs — the first lost its accent word,
  the second rendered at body size because it used a `blockquote` block.

## 1.0.0

### Added
- 24 new templates, bringing the total to 28, grouped into five families:
  - **Statement:** `spotlight`, `frame`, `sticky` (alongside existing `manifesto`, `quote`,
    `minimal`).
  - **Structure & data:** `ledger`, `index`, `grid`, `timeline`, `versus`, `stat`, `chart`
    (alongside existing `list`).
  - **Developer:** `terminal`, `code`, `diff`, `window`.
  - **Editorial:** `cover`, `split`, `memo`, `receipt`, `ticket`, `calendar`.
  - **People & media:** `profile`, `chat`, `prompt`, `polaroid`.
- Three new block types: `stat` (one figure with unit/note), `code` (filename tab over
  numbered lines), and `chart` (horizontal bars, pure CSS).
- `eyebrow`: an optional string (max 48 chars) on a card, deck `defaults`, or slide, rendering
  as small chrome above the main content on the 8 templates with an eyebrow slot (`cover`,
  `memo`, `receipt`, `split`, `spotlight`, `terminal`, `ticket`, `window`).
- Studio: a grouped template picker organized by the same five families, with catalog drift
  tests keeping it in sync with the template set.
- Non-fatal warnings for layout mismatches that used to render silently wrong: `grid` cards
  without exactly 4 items, and `eyebrow` set on a template with no eyebrow slot.

### Fixed
- Unknown template names now fail with a clear error naming the available templates, instead
  of a raw `ENOENT` stack trace for the template's missing `style.css`.
- `quoteforge new` offered only four templates from a hardcoded list; it now offers every
  installed template and rejects an unknown `--template`.
- Studio: adding a `stat`, `code`, or `chart` block to a deck slide crashed the editor —
  the deck store's block factory had not been extended for the new types.

### Changed
- `bun run typecheck` is now green and gates releases (`preversion` runs it before the test
  suite). `src/` and `studio/` are checked as separate TypeScript projects.

## 0.6.0

### Added
- `--safe-aspect <ratio>` on `generate`/`slides`/`batch`: constrains the layout so all content
  survives a center-crop toward the given ratio (e.g. `--safe-aspect 4:3`), for images embedded
  in mismatched `object-fit: cover` containers. Opt-in; no effect when absent.

## 0.5.0

### Added
- Five non-social size presets: `og` (1200×630), `readme-hero` (1280×640),
  `slide-16x9` (1920×1080), `4x3` (1600×1200), `3x2` (1500×1000).
- `align` (`top` | `center` | `bottom` | `spread`) on cards, deck defaults, and slides,
  controlling vertical placement of content.
- `--fit-content` (alias `--trim`) on `generate`/`slides`/`batch`, cropping the output to the
  content bounding box plus theme padding.

### Fixed
- Studio: `size: "custom"` cards and deck slides now render at their given dimensions in preview and export (previously blank).

### Changed
- **Rendering change:** content is now vertically centered by default instead of distributed
  over the full canvas height. Existing cards re-render with content grouped. Add
  `"align": "spread"` to approximate the previous look.

## 0.4.0

### Fixed
- `--version` reported a hardcoded `0.1.0` regardless of the installed version.
- `size: "custom"` produced a blank image at the browser's default viewport. Custom
  dimensions are now applied to both the viewport and the type-scale calculation.

### Changed
- **Breaking:** unknown keys are now rejected by every content and theme schema.
  Files that previously validated with stray keys will now fail, naming the key.
  `meta` and `$schema` remain the supported extension points.
- **Breaking:** `size: "custom"` now requires `width` and `height`. Supplying them
  alongside a preset size is rejected rather than silently ignored.

### Documentation
- Documented the custom-theme workflow (duplicate, edit, render) and custom dimensions.
