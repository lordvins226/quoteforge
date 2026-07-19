# Strict Schemas, Custom Dimensions, and Version Reporting — Design

**Date:** 2026-07-19
**Status:** Approved
**Target release:** v0.4.0 (minor — see "Versioning" below)

## Goal

Make `quoteforge validate` mean "this file will render correctly." Today a file can
pass validation and then render blank, because unknown keys are silently dropped and
`size: "custom"` resolves to a 0×0 viewport. Also fix `--version`, which reports a
stale hardcoded number, and document the custom-theme workflow that already works.

## Scope

This spec covers **lot 1 of 3**. The reported items were split by blast radius so
that blocking fixes ship without waiting on feature design:

| Lot | Contents | Status |
|-----|----------|--------|
| **1 (this spec)** | Strict schemas, custom dimensions, `--version`, theme docs | Approved |
| 2 | Vertical alignment control, non-social size presets | Separate spec |
| 3 | Safe area / `--safe-aspect` for cropped containers | Separate spec |

Lot 3 depends on lot 2: a safe area is only meaningful once content placement is
controllable.

## Non-goals

- Vertical alignment (`align: top|center|bottom|spread`) — lot 2.
- New size presets (`og`, `4x3`, `3x2`, `slide-16x9`, `readme-hero`) — lot 2.
- Safe area, `--trim`, `--fit-content` — lot 3.
- Any change to how existing presets render. A card using a preset size must resolve
  to the same dimensions and the same computed type/space scales before and after
  this work. (Dimensions and scales are asserted directly; pixel-level comparison is
  not used, since it varies with the resolved Chrome build and font availability.)

---

## 1. Version reporting

### Problem

`quoteforge --version` prints `0.1.0` on a v0.3.0 install. Users conclude their
install is stale and waste time "updating" an already-current binary.

### Root cause (verified)

`src/cli/index.ts:18` hardcodes the string:

```ts
.version("0.1.0");
```

`src/assetBundle.ts:80` already reads the real version from `package.json`:

```ts
const VERSION = (pkg as { version: string }).version;
```

So the correct pattern is already proven to survive `bun build --compile` — Bun
inlines the imported JSON at build time.

### Design

Export the version from a single module and consume it in the CLI. `package.json`
stays the one source of truth, which keeps it consistent with the `release:*` scripts
that bump it.

### Tests

A regression test asserts the CLI's reported version equals `package.json`'s version,
read dynamically at test time. The expected value must never be a literal string in
the test — a hardcoded expectation would go stale exactly like the bug it guards.

---

## 2. Strict schemas

### Problem

Unknown keys are accepted and discarded. The reported file declared `width` and
`height` at the root; validation passed, both keys were dropped, and the render used
default dimensions. A validator that accepts input it will not honour is worse than
no validator, because it converts a loud failure into a silent one.

### Design

Every object schema in `src/cli/utils/validator.ts` rejects unknown keys:
`CardContentSchema`, `DeckContentSchema`, `SlideSchema`, `DeckDefaultsSchema`, all
eight block schemas, `PartSchema`, `LabeledItemSchema`, `CounterConfigSchema`,
`MetaSchema`, and the theme schemas (`ThemeSchema`, `ThemeColorsSchema`,
`ThemeTypographySchema`, `ThemeSpacingSchema`).

Validation errors name the offending key, so the message points at the typo rather
than merely reporting that the file is invalid.

`meta` and `$schema` remain the sanctioned extension points for user metadata.

**Zod v4 subtlety:** members of a discriminated union must each be strict.
Strictness applied to the union wrapper does not propagate to its members. Without
per-member strictness, a typo inside a block (`"part"` for `"parts"`) still passes —
which is the same class of bug this section exists to close.

### Tests

- A card with an unknown root key fails validation, and the error names that key.
- A block with a misspelled field fails validation (this is the discriminated-union
  case and would pass if strictness were applied only at the root).
- A theme file with an unknown key fails validation.
- Every existing example under `content/examples/` and `decks/examples/` still
  validates. These files are the regression net proving strictness rejects only
  genuine mistakes.

---

## 3. Custom dimensions

### Problem

`size: "custom"` is in the size enum and documented in the README, but supplying
dimensions has no effect. The render comes out blank at the browser's default
viewport.

### Root cause (verified)

`SIZES.custom` is defined as `{ w: 0, h: 0 }` (`validator.ts:20`). The renderer reads
it directly:

```ts
const dimensions = SIZES[size];   // renderer.ts:22
// ... width: dimensions.w, height: dimensions.h   (renderer.ts:26-27)
```

A 0×0 viewport makes Puppeteer fall back to its 800×600 default — which at
`--scale 2` is exactly the 1600×1200 output observed.

There is a second consequence: `src/renderer/template-engine.ts:52` computes
`areaScale = Math.sqrt(dimensions.w * dimensions.h) / 1080`. With 0×0 this is `0`,
collapsing every font size and spacing value to zero. That is why the image is not
merely mis-sized but *empty* — the text is rendered at zero pixels. Both call sites
must receive real dimensions.

### Design

Dimensions are supplied as root-level `width` and `height`, matching the syntax users
reach for unprompted:

```json
{
  "type": "card",
  "template": "manifesto",
  "theme": "dark-teal",
  "size": "custom",
  "width": 1200,
  "height": 900,
  "blocks": [ ... ]
}
```

The relationship between `size` and the dimension keys is enforced in both
directions:

| `size` | `width` / `height` | Result |
|--------|--------------------|--------|
| `"custom"` | both present | Valid — dimensions applied |
| `"custom"` | missing or partial | **Rejected** — names the missing key |
| preset | absent | Valid — preset dimensions applied |
| preset | present | **Rejected** — dimensions would be ignored, so accepting them silently is the original bug |

Because the constraint is relational rather than structural, it is expressed with a
refinement over the parsed object rather than by making the keys structurally
required. The same rule applies to deck `defaults` and to per-slide overrides, so a
deck can set custom dimensions once or vary them per slide.

**Bounds:** `width` and `height` are positive integers, minimum 1, maximum 8000.
The ceiling protects against a typo like `999999` exhausting memory in headless
Chrome; 8000 comfortably exceeds any real print or display target.

**Resolution:** a single function maps validated content to concrete dimensions —
returning the preset's values for a named size, or the explicit values for `custom`.
Both `renderer.ts` and `template-engine.ts` consume it, so the 0×0 sentinel can never
reach a consumer again. `SIZES.custom` keeps its entry (it is a legitimate enum
member and appears in `themes`/`sizes` listings) but its `w`/`h` are never read.

**Duplication:** per `CLAUDE.md`, `SIZES` is mirrored in
`studio/src/types/index.ts` and counted in `src/__tests__/validator.test.ts`. No size
is added or removed here, so the count is unchanged, but the studio's `Card` type
gains the optional `width`/`height` fields to stay in sync with the schema.

### Tests

- A card with `size: "custom"` and valid dimensions validates, and resolves to
  exactly those dimensions.
- `size: "custom"` without `width` fails validation, naming `width`.
- A preset size with `width`/`height` present fails validation.
- Dimensions of `0`, negative values, non-integers, and values above the ceiling all
  fail validation.
- The reported reproduction file renders a PNG of the requested dimensions (×
  scale factor) containing non-blank pixels. This is the end-to-end test for the
  original bug: the unit tests above would all pass even if `areaScale` still
  collapsed to zero, because that failure lives in the renderer, not the schema.
- Deck `defaults` and per-slide custom sizes resolve correctly.

---

## 4. Theme documentation

### Problem

The custom-theme workflow works well but is not discoverable. `themes duplicate` is
listed among the commands (`README.md:170`) with no worked example, and the Themes
section (`README.md:221-240`) presents the twelve built-ins as a closed menu, ending
with a single line: "Create your own: `quoteforge themes create my-brand`".

Adapting a theme to an existing brand took one colour substitution. That is a strong
selling point presented as a footnote.

### Design

Rewrite the README Themes section to frame the built-ins as **fork points** rather
than a fixed menu, with a complete worked example: duplicate an existing theme, edit
the accent, render with it. State where user themes are persisted
(`~/.config/quoteforge/themes/`) so the file is findable, and note that
`terminal-green` is a well-suited base for a dark developer palette.

`references/content-schema.md` (the skill's schema reference) gets the same treatment
for the theme field, and its size table — which currently lists `custom | free | —`
with no indication of how to supply dimensions — is updated with the syntax from
section 3.

### Tests

Documentation is verified by review, not by automated tests. The one testable claim
is that every command shown in the README exists and runs; the worked example's
commands are exercised as part of the theme-workflow test.

---

## Versioning

This ships as **v0.4.0**, not a patch.

Strict validation rejects files that previously passed. A user with a stray key —
a leftover `"_note"`, a field from another tool — sees `validate` start failing after
what a patch number advertises as a safe upgrade. The version number is the only
signal available before the upgrade, so it should carry the warning.

The `CHANGELOG` entry states explicitly that unknown keys are now rejected and that
`size: "custom"` requires `width`/`height`, so anyone hitting a new failure can map
it to a deliberate change rather than a regression.

Rendering output is unchanged for every existing valid file — the alignment change
that *does* alter existing renders is deliberately held back to lot 2.

## Implementation order

1. Version fix — independent, no schema interaction, lands first as a clean win.
2. Custom dimensions — schema refinement plus the shared resolver.
3. Strict schemas — applied after custom dimensions so that `width`/`height` are
   already legitimate keys and do not have to be exempted and then un-exempted.
4. Documentation — reflects the final shipped behaviour.

Step 3 after step 2 matters: reversing them would make the example files fail
validation in between, leaving the tree red for no reason.
