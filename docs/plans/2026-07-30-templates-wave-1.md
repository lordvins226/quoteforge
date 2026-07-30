# Templates Wave 1 — Pure Layout

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Eight templates that need no schema change — layout only, over blocks that already exist.

**Shared constraints:** see `docs/plans/2026-07-30-six-new-templates.md` → *Global Constraints* and *Per-template checklist*. They bind every task here and are not repeated.

**Visual reference:** the published proposals page, source at
`/private/tmp/claude-501/-Users-kevin-workspace-personal-quoteforge/ec317175-84a1-45b7-b66c-fe478d3e6a47/scratchpad/template-proposals.html`.
Find each template's `.p-<name>` CSS block for the intended composition. Those previews use
container-query units (`cqw`) because they are scaled mocks — **translate to the injected
`--type-scale` / `--headline-scale` / `--space-scale` variables, never copy the numbers**.

**The `eyebrow` field:** cards now carry an optional `eyebrow` string (max 48) for template
chrome, inheriting slide → deck defaults. Templates below that show chrome text use
`card.eyebrow`, and render nothing when it is absent — never a hardcoded fallback string.
Do not confuse it with `slide.label`, which is the studio's slide name and must never render.

## Batching

These are dispatched in two batches of four. Batching matters because every template edits two
shared files — `src/assetBundle.ts` and `src/__tests__/templates.test.ts` — so parallel agents
would collide. Within a batch, one agent does all four sequentially.

- **Batch A:** `terminal`, `spotlight`, `frame`, `cover`
- **Batch B:** `sticky`, `polaroid`, `window`, `profile`

---

### `terminal` — shell session

**Composition:** a window bar (three dots, then `card.eyebrow` as the title, hairline in
`--callout-border`) above a monospace body. Body is vertically centered: a prompt line with a
`$` sigil in `--accent`, the headline as command output at display size, a status line with a
`✓` sigil in `--accent`.

**Blocks:** `headline` → output. `text` → prompt/status lines. Style `.block-text p` inside this
template to take the mono face; render the sigil via a `::before` on the first and last text
block so the JSON stays clean.

**Sizes:** 16:9, 1.91:1. **Sample:** `terminal-demo.json`, theme `terminal-green`, size `twitter`.

---

### `spotlight` — poster scale

**Composition:** three zones pinned by `space-between` — a small uppercase kicker
(`card.eyebrow`), an enormous headline, a footer line. Headline `line-height` near `0.86` with
tight negative tracking; it should occupy the majority of the frame.

**Blocks:** `headline` (required). A trailing `text` block becomes the footer.

**Sizes:** 1:1, 4:5, 9:16. **Sample:** `spotlight-demo.json`, size `instagram-sq`.

**Verify:** a 3-word headline fills the frame without clipping AND a 6-word headline still fits.
That range is the whole test of this template.

---

### `frame` — bordered plate

**Composition:** an inset hairline border in `--callout-border` with four corner marks in
`--accent`, each an absolutely-positioned square using only two of its borders — no SVG.
Content centered, `text-align: center`. An attribution line in uppercase mono `--accent`.

**Blocks:** `blockquote` or `headline`; a trailing `text` becomes the attribution.

**Sizes:** 1:1, 4:5. **Sample:** `frame-demo.json`, theme `kyoto`, size `instagram-sq`.

**Note:** inherently centered — say so in its docs row rather than fighting `align-top`.

---

### `cover` — bottom-weighted title

**Composition:** `space-between` pins two clusters to the top and bottom edges. Top: `card.eyebrow`
as a small uppercase meta line, plus a single `--accent` square mark. Bottom: a very large title,
then a hairline `--callout-border` rule with a byline row beneath.

**Blocks:** `headline` → the anchored title. `text` blocks → the byline row.

**Sizes:** 4:5, 1:1, 2:3. **Sample:** `cover-demo.json`, size `instagram-port`.

---

### `sticky` — note on accent

**Composition:** the card is the desk. A square note on `--accent` occupying ~76% width, rotated
`-2.2deg`, with a soft drop shadow. Note text in `--bg` (so it inverts correctly on every theme),
a signature line at the bottom at reduced opacity.

**Blocks:** `headline` or `text` → note body. A trailing `text` → signature.

**Sizes:** 1:1, 4:5. **Sample:** `sticky-demo.json`, theme `brutal-white`, size `instagram-sq`.

**Note:** the shadow is the one place a non-theme color is acceptable — use
`rgba(0,0,0,0.35)`, not a theme var, since it is a shadow rather than a palette color. Flag it in
the report so the hex-guard test is written to allow shadows specifically.

---

### `polaroid` — instant photo plate

**Composition:** a centered plate on `--headline` ground with a thick border and a deep bottom
margin. The image sits in a 1:1 well; the caption sits in the bottom margin in `--bg` text.

**Blocks:** `image` (required) plus one `text` caption. If no `image` block is present, the well
renders empty rather than breaking the layout.

**Sizes:** 1:1, 4:5. **Sample:** `polaroid-demo.json`, theme `mono-slate`, size `instagram-sq`.
Use an existing asset or a data-URI so the sample renders offline.

**Note:** first template built around the `image` block — verify it composes with the block's
existing `width` and `align` options rather than overriding them.

---

### `window` — browser chrome

**Composition:** browser chrome around a landing-page fragment. Bar with three dot outlines and a
pill-shaped URL field (`card.eyebrow` as the URL) in `--callout-border`. Body: large headline,
a supporting mono line, and a final solid `--accent` button with `--bg` text.

**Blocks:** `headline`, `text`, and a trailing `callout` rendered as the button.

**Sizes:** 16:9, 1.91:1. **Sample:** `window-demo.json`, theme `kyoto`, size `twitter`.

---

### `profile` — single-voice testimonial

**Composition:** a large quote above an attribution row: a circular avatar, then name over role.
When no `image` block is present the avatar falls back to initials on an `--accent` disc — derive
the initials from the name text so the layout never breaks on missing art.

**Blocks:** `blockquote` → the quote. `callout` first item → name/role. Optional `image` → avatar.

**Sizes:** 1:1, 4:5, 1.91:1. **Sample:** `profile-demo.json`, theme `dark-teal`, size `instagram-sq`.

---

## Per-template steps (repeat for each)

- [ ] Create `templates/<name>/template.njk` and `style.css`
- [ ] Register both in `src/assetBundle.ts` (two imports + two `TEMPLATE_ASSETS` entries)
- [ ] Add `content/examples/<name>-demo.json`
- [ ] Append a case to `src/__tests__/templates.test.ts`: renders its distinguishing element, and its style.css carries no literal hex (shadows excepted where noted)
- [ ] Render the sample at two different aspect ratios and actually look at the PNGs
- [ ] Commit: `feat(quoteforge[templates]): add <name> template`

## Verification

- [ ] `bun test` green
- [ ] Each template renders at two ratios without clipping or overflow
- [ ] `grep -nE '#[0-9a-fA-F]{3,8}' templates/*/style.css` returns only the documented shadow
- [ ] Every new template appears in `TEMPLATE_ASSETS` — otherwise it ships broken to Homebrew users
