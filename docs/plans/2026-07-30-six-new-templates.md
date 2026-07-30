# Six New Templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six card templates — `split`, `terminal`, `spotlight`, `frame`, `cover`, `ledger` — that reach layouts the existing four cannot.

**Architecture:** Each template is a self-contained folder (`template.njk` + `style.css`) under `templates/`, registered in `src/assetBundle.ts`. Templates own their full HTML document, so they may restructure blocks (a rail, a window frame, cells) rather than only restyling the standard vertical flow.

**Tech Stack:** Nunjucks, CSS (theme custom properties only), Bun, `bun:test`, Puppeteer.

**Visual reference:** `/private/tmp/claude-501/-Users-kevin-workspace-personal-quoteforge/ec317175-84a1-45b7-b66c-fe478d3e6a47/scratchpad/template-proposals.html` — open/read it for the exact intended composition of each template. The previews there use container-query units (`cqw`); **do not copy those values**. Translate per "Scaling" below.

## Global Constraints

- **Never hardcode a color.** Every color comes from a theme custom property already injected at `:root`: `--bg --headline --accent --body --label --bq-border --bq-text --callout-bg --callout-border --bullet-dot --counter-bg --counter-text`. A literal hex in template CSS is a defect.
- **Scaling:** never fixed px for type. Use the injected `--type-scale`, `--headline-scale`, `--space-scale` the way `_base.css` does, e.g. `font-size: clamp(30px, calc(var(--headline-size) * var(--headline-scale)), 128px)`. Cards render from 1080² to 1920×1080; a layout that only works at one size is not done.
- **Compose with `align`:** `_base.css` sets `.card` `justify-content` from an `align-*` class and `.block` is `flex: 0 0 auto`. Templates that impose their own vertical structure must not fight this — if a template is inherently centered (`frame`, `spotlight`), say so in its docs row rather than silently overriding.
- Templates receive `card.blocks`; the standard loop with `{% include "_blocks/<type>.njk" %}` is in every existing `template.njk` — copy that structure and adapt.
- Runtime is Bun; `bun test` is the gate (`bun run typecheck` is pre-existing red repo-wide — ignore it, add no new `any`).
- Commit format: `type(app[scope]): brief description`. No bullet points, no author name/email, no body.
- No code comments in TS. CSS may carry a single top-of-file comment naming the template, matching existing style.css files.

## Per-template checklist (every task)

1. `templates/<name>/template.njk` — full HTML doc, modeled on `templates/quote/template.njk`
2. `templates/<name>/style.css` — layout, theme vars only
3. `src/assetBundle.ts` — two `import ... with { type: "text" }` lines + two `TEMPLATE_ASSETS` entries
4. A sample card under `content/examples/<name>-demo.json`
5. A render assertion in `src/__tests__/templates.test.ts` (create the file in Task 1; later tasks append)
6. Render the sample to confirm it looks like the reference, at two different sizes

**Registration is not optional.** `docs`/`templates.mdx` claims templates are auto-discovered; that is true only when running from a repo checkout. The compiled binary ships only what `assetBundle.ts` imports, so an unregistered template is missing for every Homebrew user.

---

### Task 1: `split` — asymmetric rail

**Files:** `templates/split/{template.njk,style.css}`, `src/assetBundle.ts`, `content/examples/split-demo.json`, `src/__tests__/templates.test.ts` (create)

**Composition:** Two columns, `38%` accent rail + content panel. The rail takes the **first `headline` block**; every remaining block flows in the right panel. Rail ground is `--accent` with `--bg` as its text — the one deliberate palette inversion in the set. Rail content is top-and-bottom split (`justify-content: space-between`): a small uppercase label at top, the large headline at the bottom.

**Why it exists:** every existing template stacks vertically, so wide formats (`og`, `readme-hero`, `facebook-cover`) get a tall layout squeezed into a short frame. This is the answer to those.

**njk shape:** iterate `card.blocks`; route the first `headline` into the rail (`{% if loop.first and block.type == "headline" %}`) and everything else into the main panel. Guard the case where the first block is not a headline — the rail then shows only its label and the headline flows in the main panel.

- [ ] **Step 1: Create the template and style**
- [ ] **Step 2: Register in `src/assetBundle.ts`**
- [ ] **Step 3: Sample card** at `content/examples/split-demo.json` using `"size": "og"`
- [ ] **Step 4: Create `src/__tests__/templates.test.ts`** with a case asserting `renderTemplate` for `split` emits the rail element and does not contain a literal `#` hex outside of theme-injected `:root` vars
- [ ] **Step 5: Render at `og` (1200×630) and `twitter` (1200×675)**; confirm the rail holds and the headline does not overflow
- [ ] **Step 6: Commit** — `feat(quoteforge[templates]): add split template for wide formats`

---

### Task 2: `terminal` — shell session

**Composition:** A window bar (three dots + a title, separated by a `--callout-border` hairline) above a body. The body is monospace: a prompt line (`$` in `--accent`), the headline as command output at display size, and a status line (`✓` in `--accent`). Vertically centered in the body area.

**Why it exists:** QuoteForge's whole positioning is "for people who live in the terminal" and no template says it.

**njk shape:** fixed window chrome, then the block loop inside `.term-body`. `headline` blocks render as output; `text` blocks render as prompt/status lines — style `.block-text p` inside this template to take the mono face and accent sigil treatment.

- [ ] **Step 1: Create the template and style**
- [ ] **Step 2: Register in `src/assetBundle.ts`**
- [ ] **Step 3: Sample card** at `content/examples/terminal-demo.json` (`"theme": "terminal-green"`, `"size": "twitter"`)
- [ ] **Step 4: Append a render case** to `src/__tests__/templates.test.ts`
- [ ] **Step 5: Render and confirm** the window bar and prompt read correctly at 16:9 and 1.91:1
- [ ] **Step 6: Commit** — `feat(quoteforge[templates]): add terminal template`

---

### Task 3: `spotlight` — poster scale

**Composition:** Three zones pinned by `space-between`: a small uppercase kicker, an enormous headline (target ~19% of card width per line, `line-height` near `0.86`, tight negative tracking), and a footer line. Content scales to the type, not the reverse.

**Why it exists:** the existing templates size type to fit content; this one composes around the type itself.

**njk shape:** standard block loop, but `.block-headline .headline` is massively upscaled in this template's style.css. A `text` block before the headline reads as the kicker, one after reads as the footer — document that convention.

- [ ] **Step 1: Create the template and style**
- [ ] **Step 2: Register in `src/assetBundle.ts`**
- [ ] **Step 3: Sample card** at `content/examples/spotlight-demo.json` (`"size": "instagram-sq"`)
- [ ] **Step 4: Append a render case**
- [ ] **Step 5: Render at 1:1 and 4:5**; confirm a 3-word headline fills the frame without clipping and a 6-word headline still fits
- [ ] **Step 6: Commit** — `feat(quoteforge[templates]): add spotlight template`

---

### Task 4: `frame` — bordered plate

**Composition:** An inset hairline border (`--callout-border`) with four corner marks in `--accent`, each built from two borders on an absolutely-positioned square — no SVG. Content centered inside, text-align center. An attribution line in uppercase mono `--accent` beneath the quote.

**Why it exists:** `quote` centers text in open space; this gives the text an edge to sit against, which reads as deliberate rather than sparse.

- [ ] **Step 1: Create the template and style**
- [ ] **Step 2: Register in `src/assetBundle.ts`**
- [ ] **Step 3: Sample card** at `content/examples/frame-demo.json` (`"theme": "kyoto"`, `"size": "instagram-sq"`)
- [ ] **Step 4: Append a render case** asserting the four corner-mark elements are present
- [ ] **Step 5: Render and confirm** the corner marks sit exactly on the border corners at 1:1 and 4:5
- [ ] **Step 6: Commit** — `feat(quoteforge[templates]): add frame template`

---

### Task 5: `cover` — bottom-weighted title

**Composition:** `space-between` pins two clusters to the top and bottom edges. Top: a small uppercase meta line and a single `--accent` square mark. Bottom: a very large title, then a hairline rule with a byline row beneath it.

**Why it exists:** a genuine title treatment. The existing four all place the title as the first item of a stack; here it anchors the floor.

**njk shape:** first `text` block → top meta; `headline` → the anchored title; remaining `text` blocks → the byline row.

- [ ] **Step 1: Create the template and style**
- [ ] **Step 2: Register in `src/assetBundle.ts`**
- [ ] **Step 3: Sample card** at `content/examples/cover-demo.json` (`"size": "instagram-port"`)
- [ ] **Step 4: Append a render case**
- [ ] **Step 5: Render at 4:5 and 1:1**
- [ ] **Step 6: Commit** — `feat(quoteforge[templates]): add cover template`

---

### Task 6: `ledger` — ruled key/value rows

**Composition:** A header label with a heavy 2px `--headline` rule beneath it, then rows. Each row is a two-column grid (`20% 1fr`): key in `--accent` mono with `font-variant-numeric: tabular-nums`, value in the headline face. Hairline `--callout-border` separators between rows. A muted mono footer.

**Why it exists:** `list` gives rhythm; this gives alignment, which is what a glossary, spec, or comparison needs.

**njk shape:** `bullet-list` and `callout` blocks already carry `{label, text}` — map `label` to the key column and `text` to the value. Style `.block-bullet-list li` into the two-column grid rather than inventing a new block type.

- [ ] **Step 1: Create the template and style**
- [ ] **Step 2: Register in `src/assetBundle.ts`**
- [ ] **Step 3: Sample card** at `content/examples/ledger-demo.json` (`"theme": "paper-cream"`, `"size": "instagram-port"`)
- [ ] **Step 4: Append a render case**
- [ ] **Step 5: Render at 4:5 and 1:1**; confirm rows stay aligned with 3 and with 6 items
- [ ] **Step 6: Commit** — `feat(quoteforge[templates]): add ledger template`

---

### Task 7: Documentation

**Files:** `site/src/docs/templates.mdx`, `README.md`, `CHANGELOG.md`, `studio/src/types/index.ts` if the studio hardcodes a template list

- [ ] **Step 1: Check whether the studio has a template picker** with a hardcoded list; if so, add the six names
- [ ] **Step 2: Document the six templates** in `site/src/docs/templates.mdx` — one entry each, describing composition, the blocks it expects, and the sizes it suits
- [ ] **Step 3: Correct the auto-discovery claim** in `templates.mdx`: adding a template to a repo checkout works immediately, but shipping one in a release requires registering it in `src/assetBundle.ts`
- [ ] **Step 4: Show the rendered samples.** `site/public/samples/` already holds one PNG per existing template and `CardGallery` uses them on the landing page; render the six new samples into the same folder and display all ten in `templates.mdx` so the docs show what each template looks like
- [ ] **Step 5: CHANGELOG** — a `## 0.7.0` section, `### Added`, listing the six templates
- [ ] **Step 6: Commit** — `docs(quoteforge[templates]): document the six new templates`

---

## Verification

- [ ] `bun test` green
- [ ] Each of the six renders at two different aspect ratios without clipping or overflow
- [ ] `grep -nE '#[0-9a-fA-F]{3,8}' templates/*/style.css` returns nothing for the new templates
- [ ] A release build would ship them: every new template appears in `TEMPLATE_ASSETS`

---

## Decisions taken mid-flight

### Card `label` field (replaces the `meta.title` improvisation)

Task 1 needed a short rail label and reached for `card.meta.title`. That is wrong: `meta.title`
already drives the **output filename** for deck slides (`slide-renderer.ts` derives `deckName`
from it), so rendering it as visible chrome conflates document metadata with card content.

Add an optional card-level `label` instead — one short string a template may render as chrome
(a rail label, a window title, a letterhead, a kicker). Templates without chrome ignore it.

- `label: z.string().max(48).optional()` on `CardContentSchema`, `SlideSchema`, `DeckDefaultsSchema`
- Inherits slide → deck defaults, exactly like `align` (no Zod `.default()`)
- Mirrored in `studio/src/types/index.ts` on `CardContent`, `Slide`, and `DeckContent.defaults`
- Each template documents what it renders `label` as; templates that ignore it say so

### Template families (studio picker + site docs grouping)

28 templates need grouping in both the studio picker and `templates.mdx`:

| Family | Templates |
|--------|-----------|
| Statement | manifesto, quote, minimal, spotlight, frame, sticky |
| Structure & data | list, ledger, index, grid, timeline, versus, stat, chart |
| Developer | terminal, code, diff, window |
| Editorial | cover, split, memo, receipt, ticket, calendar |
| People & media | profile, chat, prompt, polaroid |

Export as `TEMPLATE_FAMILIES` from `studio/src/types/index.ts`, mirroring the existing
`SIZE_GROUPS` shape, and use the same grouping as the heading structure in `templates.mdx`.
