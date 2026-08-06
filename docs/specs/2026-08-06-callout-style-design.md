# Design — Callout Style Variants (filled / outline / subtle)

Date: 2026-08-06
Status: Approved
Issue: #17

## Goal

Let a `callout` block choose a visual treatment via an optional `style` field:
`filled` (current look, unchanged), `outline` (border only, no fill), or
`subtle` (light tinted fill, no border). Default stays `filled` so every
existing card/deck renders identically with no content changes required.

## Out of scope (deferred)

A style picker in the studio's `BlockEditor.tsx` — for this PR the field is only
settable by hand in the content JSON. The `ItemsEditor` UI used for both
`bullet-list` and `callout` is left untouched.

## Architecture

Same rail as every other block field: the Zod schema is the source of truth,
the browser copy of the type mirrors it, the Nunjucks partial reads the field
and emits a modifier class, and `_base.css` defines what that class does. No
new files, no renderer changes — `style` is inert data that only affects CSS
class output.

### 1. Schema (source of truth)

`src/cli/utils/validator.ts` — `CalloutBlockSchema` gains one field:

```ts
const CalloutBlockSchema = z.object({
  type: z.literal("callout"),
  id: z.string().optional(),
  items: z.array(LabeledItemSchema).min(1),
  style: z.enum(["filled", "outline", "subtle"]).default("filled"),
}).strict();
```

`.default("filled")` means `detectAndValidate()` output always has `style` set
— no `or "filled"` fallback needed anywhere downstream.

Mirror in `studio/src/types/index.ts` (the browser copy of `Block`):

```ts
| { type: "callout"; id?: string; items: LabeledItem[]; style?: "filled" | "outline" | "subtle" }
```

(Kept optional here since the studio never runs it through Zod — a card loaded
without `style` must still satisfy the TS type.)

### 2. Template partial

`templates/_blocks/callout.njk` — root `<div>` class gains the modifier:

```njk
<div class="block block-callout block-callout--{{ block.style }}">
```

Items markup (`.callout-item`, `.callout-label`, `.callout-text`) is unchanged.

### 3. CSS (`templates/_base.css`)

Existing `.block-callout .callout-item` background+border rule is renamed to
the `filled` modifier; two siblings added:

```css
.block-callout--filled .callout-item {
  background: var(--callout-bg);
  border: 1px solid var(--callout-border);
}

.block-callout--outline .callout-item {
  background: transparent;
  border: 1px solid var(--callout-border);
}

.block-callout--subtle .callout-item {
  background: color-mix(in srgb, var(--callout-border) 15%, transparent);
  border: none;
}
```

`border-radius`, `padding`, `margin-bottom`, and `font-size` stay on the
shared `.callout-item` base rule (unchanged) — only background/border move
into the modifiers. No hardcoded colors introduced (CLAUDE.md #3); `subtle`
derives its tint from the existing `--callout-border` custom property via
`color-mix`.

### 4. Tests

`src/__tests__/validator.test.ts`:
- `style: "outline"` / `"subtle"` parse without throwing.
- Omitting `style` defaults to `"filled"`.
- An invalid value (e.g. `"bogus"`) throws.

If `src/__tests__/templates.test.ts` already renders callout blocks and
asserts on output HTML, extend it to check the `block-callout--<style>` class
appears for each variant; otherwise this is covered by the validator test
alone.

## Data flow

```
content JSON ─► detectAndValidate (Zod, style defaulted) ─► renderTemplate
   (callout.njk emits block-callout--<style>) ─► _base.css modifier ─► PNG
```

## Risks / notes

- `color-mix()` requires a Chromium version that supports it (Chrome 111+).
  The Puppeteer/Chrome-for-Testing version pinned in this repo is well past
  that baseline, so no renderer compatibility concern.
- Backward compatible by construction: the default preserves the exact CSS
  the `filled` style had before this change, so no existing snapshot/example
  output changes.
