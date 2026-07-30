# Template Spec — all remaining templates

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

Single spec for the 19 templates still to build. Supersedes the wave-1 file for everything not
yet shipped.

**Shipped so far:** `split`, `terminal`, `spotlight`, `frame`, `cover`.

## Shared constraints — bind every template below

- **Never hardcode a color.** All colors come from theme custom properties injected at `:root`:
  `--bg --headline --accent --body --label --bq-border --bq-text --callout-bg --callout-border
  --bullet-dot --counter-bg --counter-text`. A literal hex in template CSS is a defect. The one
  exception is a drop shadow (`rgba(0,0,0,…)`), which is a shadow rather than a palette color —
  flag it in your report when you use one so the hex-guard test allows it.
- **Scaling:** never fixed px for type. Use the injected `--type-scale`, `--headline-scale`,
  `--space-scale` the way `templates/_base.css` does. Cards render from 1080² to 1920×1080; a
  layout that only works at one size is not finished.
- `_base.css` is injected first and sets `.card { display:flex; flex-direction:column }`,
  `.block { flex: 0 0 auto }`, and `.card.align-*` classes driving `justify-content`. Keep the
  `<div class="card align-{{ card.align or 'center' }}">` element.
- **`card.eyebrow`** is an optional string (max 48) for chrome — window titles, kickers, meta
  lines, letterheads. Render nothing when absent; never a hardcoded fallback. It is NOT
  `slide.label`, which is the studio's slide name and must never render as visible text (a
  regression test locks this).
- **Registration is mandatory.** Each template needs two `import ... with { type: "text" }` lines
  and two `TEMPLATE_ASSETS` entries in `src/assetBundle.ts`. The compiled binary ships only what
  is registered — an unregistered template works in dev and is missing for every Homebrew user.
- Runtime is Bun; `bun test` is the gate (`bun run typecheck` is pre-existing red repo-wide —
  ignore it, add no new `any`).
- Commit format: `feat(quoteforge[templates]): add <name> template`. No bullet points, no author
  name/email, no body.

## Per-template checklist

1. `templates/<name>/template.njk` + `style.css` (model on `templates/quote/`, or
   `templates/split/` for a restructuring layout)
2. Register both in `src/assetBundle.ts`
3. `content/examples/<name>-demo.json`
4. A case appended to `src/__tests__/templates.test.ts`: renders its distinguishing element, and
   its style.css carries no literal hex (documented shadows excepted)
5. Render the sample at **two different aspect ratios** and actually look at the PNGs
6. Commit

**Visual reference for every template below:**
`/private/tmp/claude-501/-Users-kevin-workspace-personal-quoteforge/ec317175-84a1-45b7-b66c-fe478d3e6a47/scratchpad/template-proposals.html`
— find the `.p-<name>` CSS block. Those previews use container-query units (`cqw`) because they
are scaled mocks. **Translate the composition; never copy the numbers.**

## Sequencing note (mechanical, not editorial)

Templates may be built in any order, but every one edits two shared files — `src/assetBundle.ts`
and `src/__tests__/templates.test.ts`. Agents working in parallel on those will collide, so work
through them sequentially within a single agent, or hand disjoint sets to agents that run one
after another.

---

# Group 1 — layout only, existing blocks

## `sticky` — note on accent
Card is the desk. A square note on `--accent` at ~76% width, rotated `-2.2deg`, soft drop shadow.
Note text in `--bg` so it inverts correctly on every theme; signature line at reduced opacity.
**Blocks:** `headline`/`text` → body; trailing `text` → signature.
**Sizes:** 1:1, 4:5. **Sample:** theme `brutal-white`, size `instagram-sq`.
**Note:** uses the documented shadow exception.

## `polaroid` — instant photo plate
Centered plate on `--headline` ground, thick border, deep bottom margin. Image in a 1:1 well;
caption in the bottom margin in `--bg`.
**Blocks:** `image` (required) + one `text` caption. No image → empty well, layout intact.
**Sizes:** 1:1, 4:5. **Sample:** theme `mono-slate`, size `instagram-sq`; use a data-URI so it
renders offline.
**Note:** first template built on the `image` block — it must compose with that block's existing
`width`/`align` options rather than overriding them.

## `window` — browser chrome
Bar with three dot outlines and a pill URL field (`card.eyebrow`) in `--callout-border`. Body:
large headline, supporting mono line, trailing solid `--accent` button with `--bg` text.
**Blocks:** `headline`, `text`, trailing `callout` → button.
**Sizes:** 16:9, 1.91:1. **Sample:** theme `kyoto`, size `twitter`.

## `profile` — single-voice testimonial
Large quote above an attribution row: circular avatar, then name over role. No `image` block →
avatar falls back to initials derived from the name on an `--accent` disc.
**Blocks:** `blockquote` → quote; `callout` first item → name/role; optional `image` → avatar.
**Sizes:** 1:1, 4:5, 1.91:1. **Sample:** theme `dark-teal`, size `instagram-sq`.

---

# Group 2 — reinterpret `{label, text}` pairs

`bullet-list` and `callout` items already carry `{label, text}`. Each template below assigns a
different meaning to `label`. **Document that meaning in the template's docs row** — without it,
the same JSON renders nonsense in a neighbouring template, which is the main risk in this group.

## `ledger` — ruled key/value rows
Header label with a heavy 2px `--headline` rule, then rows. Each row is a `20% 1fr` grid: key in
`--accent` mono with `font-variant-numeric: tabular-nums`, value in the headline face. Hairline
`--callout-border` separators. Muted mono footer.
**`label` means:** the key. **Sizes:** 4:5, 1:1. **Sample:** theme `paper-cream`, `instagram-port`.
**Verify:** rows stay aligned with 3 and with 6 items.

## `index` — dot leaders
Title, then rows tying two edges together with a dotted leader.
**`label` means:** the figure at the right edge; `text` is the entry.
**Sizes:** 1:1, 4:5. **Sample:** theme `paper-cream`, `instagram-sq`.

## `grid` — 2×2 peers
Four cells, internal borders only (via `:nth-child`, so outer edges stay clean). Label sits on
`--accent` as a solid chip.
**`label` means:** the cell's chip. **Requires exactly 4 items** — warn (do not fail) at other counts.
**Sizes:** 1:1, 4:5. **Sample:** theme `brutal-white`, `instagram-sq`.

## `chat` — two voices
Alternating bubbles. Incoming on `--callout-border`, outgoing on `--accent` with `--bg` text. One
squared corner per bubble supplies the tail — no SVG.
**`label` means:** the speaker; `them` (or any value ≠ `me`) is incoming, `me` is outgoing.
**Sizes:** 1:1, 4:5, 9:16. **Sample:** theme `dark-orange`, `instagram-sq`.

## `diff` — removals and additions
Struck-through removals above accented additions, monospace.
**`label` means:** the marker — `-` renders as a removal (`--body`, reduced opacity, line-through),
`+` as an addition (`--headline` text with an `--accent` sigil). No red/green literals.
**Sizes:** 16:9, 1.91:1. **Sample:** theme `dark-orange`, `twitter`.

## `timeline` — spine with nodes
A 1px `--callout-border` spine behind nodes. Completed nodes fill with `--accent`; pending stay
`--bg` with a ring.
**`label` means:** the time marker (`Shipped`, `Q3`, a date). A trailing `*` marks the node complete.
**Sizes:** 4:5, 9:16, 1:1. **Sample:** theme `oceanic`, `instagram-port`.

## `receipt` — itemized slip
Centered header, dashed `--callout-border` tear rules, item rows, a total that lands in `--accent`,
uppercase footer. Amounts use tabular figures.
**`label` means:** the amount column; the **last item** becomes the total row.
**Sizes:** 4:5, 9:16, 1:1. **Sample:** theme `paper-cream`, `instagram-port`.

## `ticket` — stub and perforation
Main panel plus a stub separated by a perforation built from a `repeating-linear-gradient` in
`--callout-border`. Stub carries a number and a short uppercase label.
**`label` means:** in the meta row, the field value; the **last item** supplies the stub number.
**Sizes:** 16:9, 1.91:1. **Sample:** theme `noir-crimson`, `twitter`.

## `calendar` — date block leads
A bordered tear-off block: month band on `--accent` with `--bg` text, day numeral in the headline
face with tabular figures. A sentence beside/below it.
**`label` means:** on the first `callout` item, the month; its `text` is the day.
**Sizes:** 1:1, 4:5, 1.91:1. **Sample:** theme `noir-crimson`, `instagram-sq`.

## `memo` — letterhead
Letterhead row (`card.eyebrow` as the org, a kind marker in `--accent`), 2px `--headline` rule,
then a `max-content 1fr` field grid so colons align regardless of label length, then the body.
**`label` means:** the field name (`To`, `From`, `Re`).
**Sizes:** 4:5, 1:1. **Sample:** theme `mono-slate`, `instagram-port`.

## `prompt` — question and answer
A prompt turn in `--body`, then an answer turn with a 2px `--accent` left rule and full
`--headline` contrast, closed by a caret block.
**`label` means:** the role shown above each turn. **Exactly 2 items.**
**Sizes:** 1:1, 4:5, 9:16. **Sample:** theme `dark-teal`, `instagram-sq`.

## `versus` — symmetric comparison
`1fr 1px 1fr` grid. The centre marker is a `::after` on the rule with `--bg` padding so it sits
over the line. Right side is right-aligned.
**`label` means:** the side's caption (`Before`/`After`). **Exactly 2 items.**
**Sizes:** 16:9, 1:1, 1.91:1. **Sample:** theme `oceanic`, `twitter`.

---

# Group 3 — new block types

These three need schema work. Do the schema for **all three together** in one commit before
building their templates, so validation, studio types, and docs are touched once rather than
three times.

## Schema additions — `src/cli/utils/validator.ts`

Add three block schemas to the `BlockSchema` discriminated union. Each member must carry its own
`.strict()` — strictness on the union wrapper does not propagate to members.

```ts
const StatBlockSchema = z.object({
  type: z.literal("stat"),
  id: z.string().optional(),
  value: z.string().min(1),
  unit: z.string().optional(),
  label: z.string().optional(),
  note: z.string().optional(),
}).strict();

const CodeBlockSchema = z.object({
  type: z.literal("code"),
  id: z.string().optional(),
  filename: z.string().optional(),
  lang: z.string().optional(),
  lines: z.array(z.string()).min(1),
}).strict();

const ChartBlockSchema = z.object({
  type: z.literal("chart"),
  id: z.string().optional(),
  unit: z.string().optional(),
  rows: z.array(z.object({
    label: z.string(),
    value: z.number().min(0).max(100),
    muted: z.boolean().optional(),
  }).strict()).min(1),
}).strict();
```

Also required for each new block type:
- A partial at `templates/_blocks/<type>.njk`, **registered in `src/assetBundle.ts`** — block
  partials are not auto-discovered either.
- The `{% elif block.type == "<type>" %}` branch added to **every** template that loops blocks.
- Mirrored in `studio/src/types/index.ts` (`BlockType` union + `Block` union member).
- A `defaultBlock` case in `studio/src/store/cardStore.ts`.
- An editor case in `studio/src/components/Editor/BlockEditor.tsx` and a menu entry in `BlockList.tsx`.
- Schema tests: each accepts a valid block and rejects an unknown key.

## `stat` — one figure
Label in `--accent`, an enormous figure with the unit as a superscript in `--accent`, a hairline
rule, then a note. Tabular figures, tight negative tracking.
**Sizes:** 1:1, 4:5, 1.91:1. **Sample:** theme `terminal-green`, `instagram-sq`.

## `code` — snippet card
Filename tab (border-bottom in `--accent`), then numbered lines. Three-color scheme only:
keywords `--accent`, identifiers `--headline`, strings `--body`. Line numbers `--body` at low
opacity. No tokenizer — the JSON supplies pre-split lines and the template does not parse syntax.
**Sizes:** 16:9, 1:1, 4:5. **Sample:** theme `terminal-green`, `twitter`.

## `chart` — horizontal bars
Rows of label + value with a track in `--callout-border` and a fill in `--accent`; muted rows drop
to `--body` at low opacity. Widths are percentages — no chart library, no canvas.
**Sizes:** 4:5, 1:1, 16:9. **Sample:** theme `oceanic`, `instagram-port`.

---

# Final task — docs and studio

- [ ] `TEMPLATE_FAMILIES` exported from `studio/src/types/index.ts`, mirroring the `SIZE_GROUPS`
      shape, and used to group the studio's template picker:
      **Statement** manifesto, quote, minimal, spotlight, frame, sticky ·
      **Structure & data** list, ledger, index, grid, timeline, versus, stat, chart ·
      **Developer** terminal, code, diff, window ·
      **Editorial** cover, split, memo, receipt, ticket, calendar ·
      **People & media** profile, chat, prompt, polaroid
- [ ] `site/src/docs/templates.mdx` rewritten with the same family grouping. Per template:
      composition, which blocks it expects, **what `label` means where it reinterprets pairs**,
      the sizes it suits, and a rendered PNG.
- [ ] Render one sample PNG per template into `site/public/samples/` and display them in
      `templates.mdx`. `CardGallery` already uses that folder for the landing page.
- [ ] Correct the auto-discovery claim in `templates.mdx`: adding a template to a repo checkout
      works immediately, but shipping one in a release requires registering it in
      `src/assetBundle.ts`.
- [ ] `CHANGELOG.md` — a `## 0.7.0` section listing the new templates and the `eyebrow` field.
