# QuoteForge — Full Project Document
> Typographic social media card generator · CLI + Web UI · Slides/Carousel support
> Author: Kevin Ilboudo / Kewi Tech · Version 1.1

---

## Table of Contents

1. [Product Requirements Document (PRD)](#1-product-requirements-document)
2. [Architecture & File Structure](#2-architecture--file-structure)
3. [Content Model & Schemas](#3-content-model--schemas)
4. [Social Media Formats Reference](#4-social-media-formats-reference)
5. [Slides / Carousel Specification](#5-slides--carousel-specification)
6. [CLI Specification](#6-cli-specification)
7. [Web UI Specification](#7-web-ui-specification)
8. [Templates & Themes System](#8-templates--themes-system)
9. [Build Plan (Phases)](#9-build-plan-phases)
10. [CLAUDE.md — Project Constraints](#10-claudemd--project-constraints)
11. [Prompt Contracts for Claude Code](#11-prompt-contracts-for-claude-code)

---

## 1. Product Requirements Document

### 1.1 Problem Statement

Creating high-impact typographic content cards for social media (the kind that perform well
on Twitter/X, LinkedIn, Instagram, Facebook) currently requires either Canva (slow,
web-dependent, bad for batching) or Figma (too manual). There is no developer-native,
scriptable, version-controllable tool that produces pixel-perfect cards AND multi-slide
carousels from structured content definitions with full control over typography and color.

### 1.2 Vision

QuoteForge is a **developer-native content card and slide deck generator**. You define
content in JSON, pick a theme, run one command, and get production-ready PNGs or a ZIP
of carousel slides. Optionally, open a live WYSIWYG Web UI with a full multi-slide
deck editor. Everything is local — no cloud, no subscriptions, no API keys needed.

### 1.3 Goals

| Priority | Goal |
|----------|------|
| P0 | Generate a pixel-perfect PNG from a JSON content file in one command |
| P0 | Support all major social media formats — Twitter, LinkedIn, Instagram, **Facebook**, Story |
| P0 | Full color theme system — swap any theme with a single flag |
| P0 | Generate a slide deck (carousel) as a numbered PNG sequence from a single JSON file |
| P1 | Live Web UI preview with hot-reload |
| P1 | WYSIWYG block editor in the Web UI |
| P1 | Slide deck editor — add/remove/reorder slides, preview all slides in sequence |
| P2 | Theme editor (create/edit themes visually) |
| P2 | Batch generation from a directory of JSON files |
| P2 | Export slide deck as a ZIP of numbered PNGs ready for carousel upload |
| P3 | Export to multiple formats simultaneously |

### 1.4 Non-Goals

- No cloud hosting, no SaaS, no backend
- No user accounts or auth
- No AI content generation (QuoteForge renders, not invents)
- No mobile app
- No database

### 1.5 User Stories

```
As a developer/creator, I want to:

US-01  Define a content card in JSON and generate a PNG with one command
US-02  Switch color themes without touching the content file
US-03  Preview my card live in the browser while I edit the JSON
US-04  Edit blocks visually in a Web UI and export the result
US-05  Reuse my brand colors across all cards via a persistent theme file
US-06  Generate multiple cards from a folder in one batch command
US-07  Save my card configuration and regenerate it later, exactly the same
US-08  Use custom fonts (Google Fonts or local) per theme
US-09  Target Facebook (post, square, cover, event cover) with correct dimensions
US-10  Create a slide deck (carousel) from a single JSON with multiple slides
US-11  Preview all slides in sequence in the Web UI with slide navigation
US-12  Export a slide deck as a ZIP of numbered PNGs ready to upload as a carousel
US-13  Share a theme and template across all slides in a deck, override per slide
US-14  Regenerate a single slide from a deck by index (--slide 3)
US-15  Show a slide counter overlay on each slide (e.g. "3 / 7") — toggleable
```

### 1.6 Success Metrics

- Time from `bun install` to first generated PNG < 2 minutes
- `bun quoteforge generate` completes in < 3 seconds per single card
- `bun quoteforge slides` generates a 10-slide deck and ZIP in < 25 seconds
- Theme swap produces visually correct output with zero manual changes
- Web UI hot-reload latency < 200ms
- Slide navigation in Web UI is instantaneous (client-side, no re-render needed)

---

## 2. Architecture & File Structure

```
quoteforge/
│
├── CLAUDE.md
├── package.json
├── bunfig.toml
│
├── src/
│   ├── cli/
│   │   ├── index.ts                  # CLI entrypoint (Commander.js)
│   │   ├── commands/
│   │   │   ├── generate.ts           # bun qf generate <file>     — single card → PNG
│   │   │   ├── slides.ts             # bun qf slides <deck-file>  — deck → PNGs + ZIP
│   │   │   ├── preview.ts            # bun qf preview <file>      — live browser preview
│   │   │   ├── new.ts                # bun qf new                 — interactive creator
│   │   │   ├── themes.ts             # bun qf themes list|create|…
│   │   │   └── batch.ts              # bun qf batch <dir>         — folder → PNGs
│   │   └── utils/
│   │       ├── logger.ts             # Chalk logger (info|success|error|warn)
│   │       ├── validator.ts          # Zod schemas for cards, decks, themes
│   │       └── zip.ts                # ZIP archive builder (archiver)
│   │
│   ├── renderer/
│   │   ├── renderer.ts               # (content, theme, size, scale?) → Buffer (Puppeteer)
│   │   ├── slide-renderer.ts         # (deck, opts?) → Buffer[] with numbering + counter
│   │   ├── template-engine.ts        # Nunjucks render + CSS var injection from theme
│   │   └── font-loader.ts            # Resolve Google Fonts / local font URLs
│   │
│   └── server/                       # Bun.serve Web UI backend
│       ├── server.ts
│       ├── routes/
│       │   ├── preview.ts            # GET /preview?slide=N&thumb=true
│       │   ├── export.ts             # POST /export  → PNG Buffer
│       │   ├── export-deck.ts        # POST /export-deck → ZIP Buffer
│       │   └── themes.ts             # GET /themes · POST /themes · PUT /themes/:name
│       └── ws.ts                     # WebSocket broadcast on content change
│
├── web/                              # Vite + React WYSIWYG studio
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                   # Mode switch: card vs deck (from loaded file type)
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   │   ├── BlockList.tsx     # dnd-kit sortable blocks (scoped to active slide)
│   │   │   │   ├── BlockEditor.tsx   # Per-block form (all 7 block types)
│   │   │   │   ├── SlideList.tsx     # Deck panel: thumbnails, drag/add/remove slides
│   │   │   │   ├── SlideNav.tsx      # ◀ 2 / 7 ▶ navigation + counter toggle
│   │   │   │   ├── ThemePicker.tsx   # Theme grid with color swatches
│   │   │   │   ├── SizePicker.tsx    # Format/platform picker (grouped by platform)
│   │   │   │   └── Toolbar.tsx       # New/Open/Save/Theme/Size/Export/Export Deck
│   │   │   ├── Preview/
│   │   │   │   ├── PreviewPane.tsx   # <iframe> + zoom controls
│   │   │   │   ├── PreviewControls.tsx
│   │   │   │   └── DeckStrip.tsx     # Horizontal filmstrip of slide thumbnails
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Select.tsx
│   │   │       ├── ColorPicker.tsx
│   │   │       ├── Toast.tsx
│   │   │       └── Modal.tsx
│   │   ├── hooks/
│   │   │   ├── useCard.ts
│   │   │   ├── useDeck.ts
│   │   │   ├── useTheme.ts
│   │   │   └── useLivePreview.ts     # WebSocket → preview iframe sync
│   │   ├── store/
│   │   │   ├── cardStore.ts          # Zustand: single card + undo/redo
│   │   │   └── deckStore.ts          # Zustand: deck/carousel + undo/redo
│   │   └── types/
│   │       └── index.ts              # All shared TypeScript types
│   └── package.json
│
├── templates/
│   ├── _blocks/                      # Shared Nunjucks partials (all templates use these)
│   │   ├── headline.njk
│   │   ├── blockquote.njk
│   │   ├── bullet-list.njk
│   │   ├── callout.njk
│   │   ├── text.njk
│   │   ├── divider.njk
│   │   ├── spacer.njk
│   │   └── slide-counter.njk         # Counter overlay (injected when showCounter=true)
│   ├── manifesto/                    # Style from the reference image
│   │   ├── template.njk
│   │   └── style.css
│   ├── quote/
│   │   ├── template.njk
│   │   └── style.css
│   ├── list/
│   │   ├── template.njk
│   │   └── style.css
│   └── minimal/
│       ├── template.njk
│       └── style.css
│
├── themes/
│   ├── dark-teal.json                # Reference image: #1a1a1a bg, #4ecdc4 accent
│   ├── dark-orange.json
│   ├── light-minimal.json
│   ├── brand-midnight.json
│   └── _schema.json
│
├── content/                          # Single-card JSON files
│   ├── examples/
│   │   ├── manifesto-wiki.json       # Exact replica of the brief image
│   │   └── quote-sample.json
│   └── _schema.json
│
├── decks/                            # Slide deck JSON files
│   ├── examples/
│   │   └── intro-deck.json           # 5-slide example carousel
│   └── _schema.json
│
└── outputs/                          # PNGs + ZIPs (gitignored)
    └── .gitkeep
```

---

## 3. Content Model & Schemas

### 3.1 Single Card Content File

```json
{
  "$schema": "../content/_schema.json",
  "template": "manifesto",
  "theme": "dark-teal",
  "size": "twitter",
  "meta": {
    "title": "Wiki is disposable",
    "created": "2024-01-15",
    "tags": ["devops", "knowledge-management"]
  },
  "blocks": [
    {
      "id": "headline",
      "type": "headline",
      "parts": [
        { "text": "The wiki is disposable. That is the ", "style": "normal" },
        { "text": "point.", "style": "accent-italic" }
      ]
    },
    {
      "id": "intro",
      "type": "blockquote",
      "parts": [
        { "text": "raw/ is the only thing you protect.", "style": "bold" },
        { "text": " Everything else can be recompiled from scratch, any time, cleaner than before.", "style": "normal" }
      ]
    },
    {
      "id": "breakdown",
      "type": "bullet-list",
      "items": [
        { "label": "raw/",     "text": "sacred, append-only" },
        { "label": "wiki/",    "text": "regenerable, trust the compile" },
        { "label": "outputs/", "text": "dated, cited, feed back" }
      ]
    },
    {
      "id": "callout",
      "type": "callout",
      "items": [
        {
          "label": "No original content lives only in wiki/.",
          "text": "If Claude wrote it, raw/ can rebuild it."
        }
      ]
    }
  ]
}
```

### 3.2 Block Types

| Type | Description | Key Fields |
|------|-------------|------------|
| `headline` | Large display text — supports mixed inline styles | `parts[]` |
| `blockquote` | Left-bordered quote block | `parts[]` |
| `bullet-list` | Label + text items with accent dot | `items[]{label, text}` |
| `callout` | Rounded box highlight | `items[]{label, text}` |
| `text` | Plain body paragraph | `content` |
| `divider` | Full-width horizontal rule | — |
| `spacer` | Vertical whitespace | `size: sm\|md\|lg` |

### 3.3 Inline Part Styles

| Style | Renders as |
|-------|-----------|
| `normal` | Regular body weight |
| `bold` | Bold / strong |
| `italic` | Italic |
| `accent` | Accent color from theme |
| `accent-italic` | Accent color + italic |
| `mono` | Monospace font (for `raw/` style labels) |
| `muted` | Reduced opacity |

### 3.4 Theme File Schema

```json
{
  "name": "dark-teal",
  "displayName": "Dark Teal",
  "colors": {
    "background":         "#1a1a1a",
    "headline":           "#f0ebe0",
    "accent":             "#4ecdc4",
    "body":               "#c8c8c8",
    "label":              "#4ecdc4",
    "blockquote-border":  "#4ecdc4",
    "blockquote-text":    "#e0dbd0",
    "callout-bg":         "#252525",
    "callout-border":     "#333333",
    "bullet-dot":         "#4ecdc4",
    "slide-counter-bg":   "#00000066",
    "slide-counter-text": "#ffffff"
  },
  "typography": {
    "font-headline":      "Playfair Display",
    "font-headline-url":  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700",
    "font-body":          "JetBrains Mono",
    "font-body-url":      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700",
    "headline-size":      "clamp(3.5rem, 8vw, 6rem)",
    "body-size":          "1rem",
    "line-height":        "1.5"
  },
  "spacing": {
    "padding":   "64px",
    "block-gap": "2rem"
  }
}
```

---

## 4. Social Media Formats Reference

All formats with exact pixel dimensions. **Facebook is fully integrated.**

```typescript
export const SIZES = {
  // Twitter / X
  "twitter":               { w: 1200, h: 675,  ratio: "16:9",   label: "Twitter post" },
  "twitter-square":        { w: 1080, h: 1080, ratio: "1:1",    label: "Twitter square" },

  // LinkedIn
  "linkedin":              { w: 1200, h: 627,  ratio: "1.91:1", label: "LinkedIn post" },
  "linkedin-square":       { w: 1080, h: 1080, ratio: "1:1",    label: "LinkedIn square" },

  // Instagram
  "instagram-sq":          { w: 1080, h: 1080, ratio: "1:1",    label: "Instagram square" },
  "instagram-port":        { w: 1080, h: 1350, ratio: "4:5",    label: "Instagram portrait" },
  "instagram-land":        { w: 1080, h: 566,  ratio: "1.91:1", label: "Instagram landscape" },

  // Facebook
  "facebook-post":         { w: 1200, h: 630,  ratio: "1.91:1", label: "Facebook post / link" },
  "facebook-square":       { w: 1080, h: 1080, ratio: "1:1",    label: "Facebook square post" },
  "facebook-cover":        { w: 1640, h: 624,  ratio: "2.63:1", label: "Facebook page cover" },
  "facebook-event":        { w: 1920, h: 1080, ratio: "16:9",   label: "Facebook event cover" },
  "facebook-group-cover":  { w: 1640, h: 856,  ratio: "1.91:1", label: "Facebook group cover" },

  // Stories — same dimensions across Instagram, Facebook, TikTok
  "story":                 { w: 1080, h: 1920, ratio: "9:16",   label: "Story (IG / FB / TW)" },

  // Custom
  "custom":                { w: 0,    h: 0,    ratio: "free",   label: "Custom dimensions" },
} as const
```

### Facebook usage notes

- `facebook-post` (1200×630): Standard single-image post and link previews.
- `facebook-square` (1080×1080): Best choice for **Facebook carousels** — renders equally
  well in feed and when shared. Recommended for all FB carousel decks.
- `facebook-cover` (1640×624): Very wide aspect ratio — use `minimal` or `list` templates,
  not `manifesto` (headline will overflow).
- `facebook-event` (1920×1080): 16:9 — identical layout to `twitter`, just larger canvas.
- `facebook-group-cover` (1640×856): Group page header banner.
- When generating a carousel deck for Facebook, always use `--size facebook-square`.
  The CLI will warn if a non-square size is used with a deck targeting Facebook.

### SizePicker grouping in Web UI

The SizePicker groups formats by platform for clarity:

```
Twitter/X  ────  twitter · twitter-square
LinkedIn   ────  linkedin · linkedin-square
Instagram  ────  instagram-sq · instagram-port · instagram-land
Facebook   ────  facebook-post · facebook-square · facebook-cover
                 facebook-event · facebook-group-cover
Stories    ────  story
Custom     ────  custom (W × H inputs appear)
```

---

## 5. Slides / Carousel Specification

### 5.1 Concept

A **deck** is a single JSON file with `"type": "deck"` that defines a sequence of slides.
Each slide is a standalone card using the same block model, sharing deck-level defaults
(theme, size, template) but able to override any of them individually.

The `slides` command outputs:
- N numbered PNGs: `deck-name-01.png`, `deck-name-02.png`, …
- One ZIP: `deck-name.zip` containing all slides in order

### 5.2 Deck Content File Schema

```json
{
  "$schema": "../decks/_schema.json",
  "type": "deck",
  "meta": {
    "title": "Why your docs rot",
    "created": "2024-01-15",
    "tags": ["devops", "knowledge"]
  },
  "defaults": {
    "template": "manifesto",
    "theme": "dark-teal",
    "size": "instagram-sq",
    "showCounter": true,
    "counter": {
      "format":   "{current} / {total}",
      "position": "bottom-right",
      "style":    "pill"
    }
  },
  "slides": [
    {
      "id": "slide-01",
      "label": "Cover",
      "blocks": [
        {
          "type": "headline",
          "parts": [
            { "text": "Why your ", "style": "normal" },
            { "text": "docs", "style": "accent-italic" },
            { "text": " always rot.", "style": "normal" }
          ]
        },
        { "type": "spacer", "size": "lg" },
        { "type": "text", "content": "A 7-slide breakdown." }
      ]
    },
    {
      "id": "slide-02",
      "label": "The Problem",
      "blocks": [
        {
          "type": "headline",
          "parts": [{ "text": "The wiki is disposable.", "style": "normal" }]
        },
        {
          "type": "blockquote",
          "parts": [
            { "text": "raw/ is the only thing you protect.", "style": "bold" },
            { "text": " Everything else can be recompiled from scratch.", "style": "normal" }
          ]
        },
        {
          "type": "bullet-list",
          "items": [
            { "label": "raw/",     "text": "sacred, append-only" },
            { "label": "wiki/",    "text": "regenerable, trust the compile" },
            { "label": "outputs/", "text": "dated, cited, feed back" }
          ]
        }
      ]
    },
    {
      "id": "slide-07",
      "label": "CTA",
      "template": "minimal",
      "theme": "dark-orange",
      "showCounter": false,
      "blocks": [
        {
          "type": "headline",
          "parts": [{ "text": "Follow for more.", "style": "accent-italic" }]
        },
        { "type": "text", "content": "@kewitech" }
      ]
    }
  ]
}
```

### 5.3 Per-slide Overrides

Each slide can override these deck `defaults` fields:

| Field | Type | Notes |
|-------|------|-------|
| `template` | string | Use a different template for this slide only |
| `theme` | string | Use a different theme for this slide only |
| `size` | SizeName | Override size — caution: ZIP should be consistent |
| `showCounter` | boolean | Hide/show counter for this slide only |
| `counter` | object | Override counter format/position/style for this slide |

### 5.4 Slide Counter Overlay

When `showCounter: true`, each slide gets a badge overlay.

```
┌─────────────────────────────┐
│                             │
│   [slide content]           │
│                             │
│                    ┌──────┐ │
│                    │ 2/7  │ │  ← bottom-right pill (default)
│                    └──────┘ │
└─────────────────────────────┘
```

Counter config:

```typescript
interface CounterConfig {
  format:   string    // "{current} / {total}" · "{current}" · "slide {current}"
  position: "bottom-right" | "bottom-left" | "bottom-center" | "top-right"
  style:    "pill"    // rounded badge with semi-transparent bg
           | "plain"  // text only, no background
           | "dots"   // filled dot sequence (● ● ○ ○ ○)
}
```

### 5.5 Slide Renderer Pipeline

```
deck.json
    │
    ▼
slide-renderer.ts
    │
    ├── For each slide[i]:
    │     ├── Merge: deck.defaults ← slide overrides
    │     ├── Inject meta: { slideIndex: i, slideTotal: N,
    │     │                  showCounter, counterConfig }
    │     ├── template-engine.ts → HTML string
    │     └── renderer.ts → PNG Buffer
    │
    ├── Buffer[] collected (concurrency: P-limit, default 4)
    │
    ├── Write files: outputs/deck-name/deck-name-01.png …
    │                (zero-padded to deck length)
    │
    └── zip.ts → outputs/deck-name.zip
```

### 5.6 Web UI — Deck Mode

Mode is auto-detected: if the loaded file has `"type": "deck"`, the UI switches to
deck mode. The user can also toggle manually via a pill toggle in the toolbar.

**Deck mode layout:**

```
┌───────────────────────────────────────────────────────────────────────────┐
│ TOOLBAR  [New] [Open] [Save]  QuoteForge  [Theme▾] [Size▾] [PNG] [Deck▾] │
├─────────────────┬──────────────────────────┬──────────────────────────────┤
│                 │                          │                              │
│  SLIDE LIST     │    EDITOR PANEL          │    PREVIEW PANEL             │
│  (220px)        │    (360px)               │                              │
│                 │                          │  ┌────────────────────────┐  │
│  ┌───────────┐  │  ┌─ Blocks ────────────┐ │  │                        │  │
│  │01 Cover ● │  │  │ ☰ headline          │ │  │  [Active slide]        │  │
│  │02 Problem │  │  │ ☰ blockquote        │ │  │                        │  │
│  │03 Rule 1  │  │  │ ☰ bullet-list       │ │  └────────────────────────┘  │
│  │04 Rule 2  │  │  │ [+ Add Block]       │ │                              │
│  │05 CTA     │  │  └─────────────────────┘ │   ◀  2 / 5  ▶  [●counter]  │
│  │           │  │                          │                              │
│  │[+ Slide]  │  │  ┌─ Block Editor ──────┐ │  ┌─ DeckStrip ───────────┐  │
│  └───────────┘  │  │ (active block form) │ │  │ [1] [●2] [3] [4] [5]  │  │
│                 │  └─────────────────────┘ │  └───────────────────────┘  │
└─────────────────┴──────────────────────────┴──────────────────────────────┘
```

**DeckStrip** — horizontal scrollable filmstrip at the bottom of the preview panel:
- 120px-wide thumbnails fetched lazily from `GET /preview?slide=N&thumb=true&w=120`
- Active slide has a 2px accent-colored border
- Clicking a thumbnail activates that slide

**SlideList** — left panel:
- Rows: `[⠿] [01] [Cover — editable label] [×]`
- Drag-to-reorder via dnd-kit
- Right-click: Duplicate / Delete / Move to top / Move to bottom
- `[+ Add Slide]` appends a blank slide inheriting deck defaults

---

## 6. CLI Specification

### 6.1 Installation

```bash
git clone https://github.com/kewitech/quoteforge
cd quoteforge
bun install
bun link   # optional: enables `qf` global alias
```

### 6.2 Commands

#### `generate` — Single card → PNG

```bash
bun quoteforge generate <content-file> [options]

  -t, --theme <name>       Override theme
  -s, --size  <name>       Override size (see full list in §4)
  -o, --output <path>      Output path (default: outputs/<file>-<timestamp>.png)
  --scale <n>              Pixel ratio, default 2 (retina)
  --open                   Open output after generation
  --no-timestamp           Omit timestamp from filename

Examples:
  bun quoteforge generate content/wiki-post.json
  bun quoteforge generate content/wiki-post.json --size facebook-post --theme dark-orange
```

#### `slides` — Slide deck → numbered PNGs + ZIP

```bash
bun quoteforge slides <deck-file> [options]

  -t, --theme <name>       Override theme for all slides
  -s, --size  <name>       Override size for all slides
  -o, --output <dir>       Output directory (default: outputs/<deck-name>/)
  --slide <n>              Render only slide N (1-indexed), no ZIP
  --no-zip                 Skip ZIP creation
  --no-counter             Disable counter overlay for all slides
  --concurrency <n>        Parallel render workers (default: 4)
  --scale <n>              Pixel ratio, default 2
  --open                   Open output folder after generation

Outputs:
  outputs/deck-name/deck-name-01.png
  outputs/deck-name/deck-name-02.png
  ...
  outputs/deck-name.zip

Examples:
  bun quoteforge slides decks/intro-deck.json
  bun quoteforge slides decks/intro-deck.json --size facebook-square
  bun quoteforge slides decks/intro-deck.json --slide 3   # only slide 3
  bun quoteforge slides decks/intro-deck.json --no-counter --size instagram-sq
```

#### `preview` — Live browser preview

```bash
bun quoteforge preview <content-or-deck-file> [options]

  -p, --port <n>           Port (default: 4242)
  --no-open                Don't auto-open browser
  --slide <n>              Start on slide N for deck files (default: 1)

Behavior:
  - Watches content/deck + theme for changes, hot-reloads via SSE (< 500ms)
  - Deck files: shows ← → nav, keyboard arrow keys work
```

#### `studio` — Full WYSIWYG Web UI

```bash
bun quoteforge studio [content-or-deck-file] [options]

  -p, --port <n>           Port (default: 4242)
  --no-open

Behavior:
  - Detects card vs deck from file type field, opens correct editor mode
  - Ctrl+S saves, Export PNG/Export Deck ZIP in toolbar

Examples:
  bun quoteforge studio
  bun quoteforge studio decks/intro-deck.json   # opens in deck mode
```

#### `new` — Interactive creator

```bash
bun quoteforge new [options]

  --type <card|deck>       (interactive prompt if omitted)
  --template <name>
  --theme <name>
  --slides <n>             Blank slides to create (deck only, default: 5)
  --size <name>
  --name <filename>
```

#### `themes` — Theme management

```bash
bun quoteforge themes list
bun quoteforge themes show <name>
bun quoteforge themes create <name>
bun quoteforge themes duplicate <name> <new-name>
bun quoteforge themes validate <file>
```

#### `batch` — Folder → multiple PNGs

```bash
bun quoteforge batch <directory> [options]

  -t, --theme <name>
  -s, --size  <name>
  -o, --output <dir>
  --concurrency <n>
  --decks              Also process deck files → individual ZIPs
```

#### `validate` — Validate a card or deck file

```bash
bun quoteforge validate <file>
# Exits 0 if valid, 1 with full Zod error tree if invalid
# Auto-detects card vs deck from "type" field
```

### 6.3 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Validation error (Zod failure, bad JSON) |
| 2 | Theme not found |
| 3 | Template not found |
| 4 | Puppeteer / render error |
| 5 | Output directory not writable |
| 6 | Slide index out of range |

---

## 7. Web UI Specification

### 7.1 Two Modes

| | Card Mode | Deck Mode |
|-|-----------|-----------|
| **Loaded from** | file with `"type": "card"` or no type | file with `"type": "deck"` |
| **Left panel** | Block list | Slide list |
| **Bottom of preview** | — | DeckStrip (thumbnail filmstrip) |
| **Export** | Export PNG | Export PNG (active slide) + Export Deck ZIP |
| **Undo/redo scope** | Block changes | Block + slide changes |

### 7.2 Toolbar

| Control | Card Mode | Deck Mode |
|---------|-----------|-----------|
| **New** | New card | New deck |
| **Open** | Load card `.json` | Load deck `.json` |
| **Save** (`Ctrl+S`) | Write card file | Write deck file |
| **Theme ▾** | Theme picker | Deck-level default theme |
| **Size ▾** | Size/platform picker | Deck-level default size |
| **Export PNG** | Current card → PNG download | Active slide → PNG download |
| **Deck ▾** | N/A | [Export all slides as ZIP] / [Export individual PNGs] |

### 7.3 Block Editor Forms

**Headline / Blockquote / Text:**
```
Parts:
  [text: _______________________________________] [Style: accent-italic ▾]  [×]
  [+ Add Part]
```

**Bullet List / Callout:**
```
Items:
  Label: [__________]  Text: [_____________________________]  [×]
  [+ Add Item]
```

**Spacer:**
```
  Size: [sm ▾]   (sm | md | lg)
```

### 7.4 SizePicker Grouping

The SizePicker shows sizes grouped by platform, not as a flat list:

```
── Twitter/X ──────────  twitter · twitter-square
── LinkedIn ───────────  linkedin · linkedin-square
── Instagram ──────────  instagram-sq · instagram-port · instagram-land
── Facebook ───────────  facebook-post · facebook-square · facebook-cover
                         facebook-event · facebook-group-cover
── Stories ────────────  story
── Custom ─────────────  [W px] × [H px]
```

When in deck mode and a Facebook non-square size is selected, a yellow inline warning
appears: "Facebook carousels render best with facebook-square (1080×1080)."

### 7.5 Deck Store (Zustand)

```typescript
interface DeckStore {
  deck: DeckContent
  isDirty: boolean
  filePath: string | null
  activeSlideIndex: number
  selectedBlockId: string | null
  zoom: number
  showCounter: boolean

  // Undo/redo
  past: DeckContent[]
  future: DeckContent[]

  // Actions
  setActiveSlide: (index: number) => void
  addSlide: (afterIndex?: number) => void
  removeSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  reorderSlides: (from: number, to: number) => void
  setSlideLabel: (index: number, label: string) => void
  setBlock: (slideIndex: number, blockId: string, block: Block) => void
  addBlock: (slideIndex: number, type: BlockType, afterId?: string) => void
  removeBlock: (slideIndex: number, blockId: string) => void
  reorderBlocks: (slideIndex: number, from: number, to: number) => void
  setDeckTheme: (name: string) => void
  setDeckSize: (size: SizeName) => void
  toggleCounter: () => void
  undo: () => void
  redo: () => void
  save: () => Promise<void>
  load: (file: File) => Promise<void>
  exportSlide: (index: number) => Promise<void>
  exportDeckZip: () => Promise<void>
}
```

---

## 8. Templates & Themes System

### 8.1 Template Variables

Every template receives:

- `card` — the current slide/card content object
- `theme` — the resolved theme object
- `meta` — `{ slideIndex: number, slideTotal: number, showCounter: boolean, counter: CounterConfig }`

### 8.2 CSS Custom Properties (injected at :root)

All colors come from the theme via CSS vars — never hardcoded:

```css
:root {
  --bg:               {{ theme.colors.background }};
  --headline:         {{ theme.colors.headline }};
  --accent:           {{ theme.colors.accent }};
  --body:             {{ theme.colors.body }};
  --label:            {{ theme.colors.label }};
  --bq-border:        {{ theme.colors['blockquote-border'] }};
  --callout-bg:       {{ theme.colors['callout-bg'] }};
  --counter-bg:       {{ theme.colors['slide-counter-bg'] }};
  --counter-text:     {{ theme.colors['slide-counter-text'] }};
  --padding:          {{ theme.spacing.padding }};
  --gap:              {{ theme.spacing['block-gap'] }};
}
```

### 8.3 Rendering Pipeline

```
(card or deck-slide) + theme
        │
        ▼
  template-engine.ts
  Nunjucks → HTML string with injected CSS vars + font @import
        │
        ▼
  renderer.ts
  Puppeteer:
    newPage()
    → setViewport({ width, height, deviceScaleFactor: 2 })
    → setContent(html, { waitUntil: 'networkidle0' })  ← waits for fonts
    → screenshot({ type: 'png' })
    → Buffer
        │
        ▼
  single card  → write PNG
  deck slides  → collect Buffer[] → zip.ts → ZIP
```

### 8.4 Slide Counter Partial

```html
<!-- templates/_blocks/slide-counter.njk -->
<div class="counter counter--{{ meta.counter.position }}
            counter--{{ meta.counter.style }}">
  {{ meta.counter.format
     | replace('{current}', meta.slideIndex + 1)
     | replace('{total}',   meta.slideTotal) }}
</div>
```

---

## 9. Build Plan (Phases)

### Phase 0 — Bootstrap (Day 1, ~2h)

- [ ] Bun project + TypeScript strict config
- [ ] Full directory structure from §2
- [ ] Install: `puppeteer`, `nunjucks`, `commander`, `zod`, `chalk`, `@clack/prompts`, `archiver`
- [ ] `CLAUDE.md` at root
- [ ] Zod schemas: `CardContent`, `DeckContent`, `Theme`, all `Block` types
- [ ] `dark-teal.json` theme (exact reference colors)
- [ ] `manifesto` template with all block partials
- [ ] `content/examples/manifesto-wiki.json` (reference card)
- [ ] `decks/examples/intro-deck.json` (5-slide example)

**Deliverable:** `bun quoteforge validate content/examples/manifesto-wiki.json` → exits 0
**Deliverable:** `bun quoteforge validate decks/examples/intro-deck.json` → exits 0

---

### Phase 1 — Single Card Renderer (Day 1–2, ~3h)

- [ ] `template-engine.ts`: Nunjucks + CSS var injection
- [ ] `renderer.ts`: Puppeteer pipeline (retina 2x, networkidle0)
- [ ] All 7 block types render correctly
- [ ] All 14 sizes including all 5 Facebook formats
- [ ] `generate` command: `--theme`, `--size`, `--output`, `--scale`, `--open`

**Deliverable:** `bun quoteforge generate content/examples/manifesto-wiki.json` produces
a pixel-perfect replica of the reference image. `--size facebook-post` produces 1200×630.

---

### Phase 2 — Slides / Carousel Renderer (Day 2–3, ~3h)

- [ ] `slide-renderer.ts`: deck merge logic (defaults ← per-slide overrides)
- [ ] Slide counter partial (all 3 styles, 4 positions)
- [ ] `zip.ts`: archiver-based ZIP builder
- [ ] `slides` command: `--slide`, `--no-zip`, `--no-counter`, `--concurrency`
- [ ] Zero-padded filenames (`01`, `02` … or `001` if deck > 99 slides)
- [ ] Facebook non-square size warning in `slides` command
- [ ] `decks/examples/intro-deck.json` generates 5 PNGs + 1 ZIP

**Deliverable:** `bun quoteforge slides decks/examples/intro-deck.json --size instagram-sq`
→ 5 PNGs + `intro-deck.zip` in `outputs/intro-deck/`

---

### Phase 3 — Full CLI Suite (Day 3–4, ~3h)

- [ ] `new` command (`@clack/prompts`, `--type card|deck`)
- [ ] `preview` command (Bun.serve + chokidar + SSE + deck slide nav + arrow keys)
- [ ] `themes` command suite (chalk swatches in list)
- [ ] `batch` command (concurrency + `--decks` flag)
- [ ] `validate` command (auto-detects card vs deck)
- [ ] 3 additional themes + 3 additional templates

**Deliverable:** All CLI commands work end-to-end. `--help` is clean for all commands.

---

### Phase 4 — Web UI Core (Day 4–6, ~6h)

- [ ] Vite + React in `web/`
- [ ] `studio` command (proxies Vite through Bun, single port 4242)
- [ ] WebSocket live sync
- [ ] Card mode: BlockList + BlockEditor + ThemePicker + SizePicker + Toolbar
- [ ] Deck mode: SlideList + SlideNav + DeckStrip + deckStore
- [ ] Mode auto-detection from loaded file
- [ ] SizePicker grouped by platform with Facebook warning
- [ ] Export PNG (single) + Export Deck ZIP
- [ ] Ctrl+S save

**Deliverable:** `bun quoteforge studio decks/examples/intro-deck.json` → working deck
editor. Slides navigable, blocks editable, Export Deck ZIP downloads correctly.

---

### Phase 5 — Polish (Day 6–7, ~3h)

- [ ] Theme Editor modal (create new themes from UI)
- [ ] Undo/Redo (both stores, max 50, immutable snapshots)
- [ ] Keyboard shortcuts: `Ctrl+S`, `Ctrl+Z/Y`, `Ctrl+E` (export)
- [ ] Counter toggle button in deck mode toolbar
- [ ] All error states (invalid JSON banner, render fail toast, font fallback)
- [ ] Toast system from scratch
- [ ] README with install guide, CLI reference, size table

---

## 10. CLAUDE.md — Project Constraints

```markdown
# CLAUDE.md — QuoteForge Constraints
# Read this FIRST every session.
# Echo the stack and the 3 most important hard rules before doing anything.

## Stack (non-negotiable)

- Runtime:           Bun (not Node.js, not npm scripts)
- Language:          TypeScript strict mode everywhere — no `any`, use `unknown`
- CLI:               Commander.js (not yargs, not meow)
- Templating:        Nunjucks (not Handlebars, not EJS, not JSX for templates)
- Rendering:         Puppeteer (not node-canvas, not sharp, not playwright)
- Validation:        Zod for all content, deck, and theme schemas
- ZIP:               archiver (not adm-zip, not jszip, not fflate)
- Web UI:            Vite + React 18 (not Next.js, not Remix, not Astro)
- Web UI state:      Zustand — cardStore.ts (single card) + deckStore.ts (deck)
- Web UI DnD:        dnd-kit (not react-beautiful-dnd)
- Web UI styling:    Tailwind CSS utility classes only (no CSS modules, no styled-components)
- Web UI icons:      lucide-react — import individually (no barrel: `import { X } from 'lucide-react'`)
- CLI prompts:       @clack/prompts (not inquirer)
- CLI logger:        chalk (not picocolors)

## Hard Rules

1. NEVER install a package without asking the user first
2. NEVER use a UI component library — no shadcn, Radix, MUI, Ant Design, PrimeNG, etc.
   All Web UI components are built from scratch with Tailwind
3. NEVER hardcode colors in template CSS — every color is a CSS custom property
   injected from the theme JSON at :root level
4. NEVER write to a file unless the user explicitly triggers it
   (--output flag, Save button, or Ctrl+S)
5. NEVER put business logic inside CLI command files — commands are thin:
   parse args → validate with Zod → call renderer → log result
6. outputs/ is gitignored — never treat it as a source of truth
7. React components MUST NOT make direct filesystem calls — all FS goes
   through Bun server routes (/export, /export-deck, /themes, etc.)
8. Facebook carousel decks should use facebook-square (1080×1080).
   Warn (don't block) if the user picks a non-square size for a deck.

## Content Type Detection

- `"type": "deck"` at root → deck file (use DeckContent schema, deck mode in studio)
- `"type": "card"` or no type field → single card (use CardContent schema, card mode)
- validate, preview, studio, and slides commands all auto-detect from this field

## File Naming Conventions

- TypeScript:    camelCase.ts
- React:         PascalCase.tsx
- Templates:     template.njk (in named folder under templates/)
- Themes:        kebab-case.json (in themes/)
- Card content:  kebab-case.json (in content/)
- Deck content:  kebab-case.json (in decks/)
- Block partials: <block-type>.njk (in templates/_blocks/)
```

---

## 11. Prompt Contracts for Claude Code

Start every Claude Code session with:

> "Read CLAUDE.md and confirm you understand the constraints by echoing the stack
> and the 3 most important hard rules before doing anything."

---

### Contract 0 — Bootstrap

> Bootstrap the QuoteForge project: structure, schemas, example files, validate command
>
> GOAL: Both of these exit 0:
> `bun quoteforge validate content/examples/manifesto-wiki.json`
> `bun quoteforge validate decks/examples/intro-deck.json`
> Both exit 1 with Zod error details when given a malformed file.
>
> CONSTRAINTS:
> - Follow CLAUDE.md exactly
> - Install only: puppeteer, nunjucks, commander, zod, chalk, @clack/prompts, archiver
> - Zod schemas in src/cli/utils/validator.ts: CardContent, DeckContent, Theme, all Blocks
> - manifesto-wiki.json must have all 4 block types from the reference image
> - dark-teal.json: bg #1a1a1a, accent #4ecdc4 — exact match to reference
> - intro-deck.json must have "type": "deck" at root and 5 slides
> - validate auto-detects card vs deck from "type" field
>
> FORMAT:
> 1. package.json — deps + "quoteforge"/"qf" bin entries
> 2. tsconfig.json — strict mode
> 3. src/cli/utils/validator.ts — all Zod schemas
> 4. content/_schema.json · decks/_schema.json · themes/_schema.json
> 5. content/examples/manifesto-wiki.json
> 6. decks/examples/intro-deck.json (5 slides, "type": "deck")
> 7. themes/dark-teal.json
> 8. src/cli/commands/validate.ts
> 9. src/cli/index.ts (validate wired)
>
> FAILURE CONDITIONS:
> - Any unlisted package installed
> - `any` TypeScript type used
> - intro-deck.json missing "type": "deck" root field
> - validate does not auto-detect card vs deck schema
> - dark-teal.json colors don't match (#1a1a1a bg, #4ecdc4 accent)

---

### Contract 1 — Single Card Renderer

> Implement single-card rendering: CardContent + Theme → PNG via Puppeteer
>
> GOAL: `bun quoteforge generate content/examples/manifesto-wiki.json` produces
> a PNG matching the reference image (fonts, colors, all 4 blocks). < 5 seconds.
> `--size facebook-post` produces 1200×630. `--size facebook-cover` produces 1640×624.
>
> CONSTRAINTS:
> - renderer.ts: pure function (content, theme, size, scale) → Promise<Buffer>
> - No hardcoded colors in any CSS — all CSS custom properties
> - Puppeteer: waitUntil 'networkidle0', deviceScaleFactor 2
> - All 14 sizes from §4 in the SIZES constant (including all 5 Facebook formats)
> - generate command: thin — only arg parse + Zod validate + call renderCard + log
>
> FORMAT:
> 1. src/renderer/renderer.ts — renderCard(…) → Promise<Buffer>
> 2. src/renderer/template-engine.ts — renderTemplate(content, theme, meta?) → string
> 3. src/renderer/font-loader.ts
> 4. templates/_blocks/ — all 7 block partials + slide-counter.njk
> 5. templates/manifesto/template.njk + style.css (zero hardcoded colors)
> 6. src/cli/commands/generate.ts — thin command
> 7. src/cli/index.ts (generate wired)
>
> FAILURE CONDITIONS:
> - Any color hardcoded in CSS
> - Puppeteer not using networkidle0
> - Missing any Facebook size in SIZES
> - generate command has rendering logic inside it
> - Font falls back to system font in the PNG

---

### Contract 2 — Slides / Carousel Renderer

> Add full deck rendering: DeckContent → N PNGs + ZIP
>
> GOAL: `bun quoteforge slides decks/examples/intro-deck.json --size instagram-sq`
> produces outputs/intro-deck/intro-deck-01.png through 05.png (zero-padded)
> plus intro-deck.zip. Each slide shows counter "X / 5" pill bottom-right.
> `--slide 3` produces only slide 3, no ZIP.
>
> CONSTRAINTS:
> - slide-renderer.ts: pure (deck, opts?) → Promise<Buffer[]>
> - Merge order: deck.defaults ← slide overrides (all 5 overrideable fields)
> - Zero-padding: 2 digits for decks ≤ 99 slides, 3 for > 99
> - archiver only for ZIP — no other library
> - Concurrency: p-limit or manual semaphore, default 4 workers
> - Facebook non-square deck: log a yellow chalk warning (don't block)
> - --slide N: render only that slide, skip ZIP entirely
>
> FORMAT:
> 1. src/renderer/slide-renderer.ts
> 2. src/cli/utils/zip.ts — buildZip(buffers, names) → Promise<Buffer>
> 3. templates/_blocks/slide-counter.njk (all 3 styles, 4 positions)
> 4. src/cli/commands/slides.ts — thin command
> 5. src/cli/index.ts (slides wired)
>
> FAILURE CONDITIONS:
> - Filenames not zero-padded
> - Counter rendered when showCounter is false
> - Per-slide theme/template override ignored
> - Any ZIP library other than archiver
> - --slide still renders all slides before filtering

---

### Contract 3 — Full CLI Suite

> Complete all remaining CLI commands
>
> GOAL:
> (1) `bun qf new --type deck --slides 5 --name test` → decks/test.json
> (2) `bun qf preview decks/test.json` → browser opens, arrow keys navigate slides, reload < 500ms
> (3) `bun qf themes list` → chalk color swatch table
> (4) `bun qf batch content/examples/ --size facebook-post` → 2 PNGs
> (5) 3 new themes + 3 new templates are valid
>
> CONSTRAINTS:
> - @clack/prompts for new command interactive flow
> - preview: Bun.serve + chokidar + SSE (not WebSocket)
> - preview for deck: keyboard arrow nav + SSE slide-change events
> - Each command file has zero imports from other command files
>
> FORMAT:
> 1. src/cli/commands/new.ts
> 2. src/cli/commands/preview.ts
> 3. src/cli/commands/themes.ts
> 4. src/cli/commands/batch.ts
> 5. src/cli/utils/logger.ts
> 6. themes/dark-orange.json · light-minimal.json · brand-midnight.json
> 7. templates/quote/ · list/ · minimal/ (template.njk + style.css each)
> 8. src/cli/index.ts — all commands wired, --help polished
>
> FAILURE CONDITIONS:
> - preview opens browser before server is ready
> - Deck preview has no keyboard navigation
> - batch ignores --concurrency
> - new writes file without user confirmation
> - Any cross-command imports

---

### Contract 4 — Web UI (Studio)

> Build the Vite + React WYSIWYG studio: card mode + deck mode
>
> GOAL: `bun quoteforge studio decks/examples/intro-deck.json` → http://localhost:4242
> in deck mode. All 5 slides in SlideList and DeckStrip. Clicking a thumbnail activates
> it. Editing a block updates preview < 200ms. Export Deck ZIP downloads a working ZIP.
> `bun quoteforge studio content/examples/manifesto-wiki.json` → card mode.
> SizePicker shows Facebook sizes grouped under "Facebook" heading.
>
> CONSTRAINTS:
> - NO UI component libraries
> - cardStore.ts + deckStore.ts (Zustand) — no Context for global state
> - Mode auto-detected from "type" field on load
> - dnd-kit for all drag-and-drop (slide list + block list)
> - Preview <iframe> updated via WS push (not page navigation)
> - DeckStrip thumbnails fetched lazily (not all on load)
> - studio: Vite proxied through Bun → single port 4242
> - SizePicker grouped by platform (§4 grouping), FB non-square warning in deck mode
>
> FORMAT:
> 1. web/vite.config.ts
> 2. web/src/types/index.ts
> 3. web/src/store/cardStore.ts + deckStore.ts (full per §7.5)
> 4. web/src/hooks/ — useCard, useDeck, useTheme, useLivePreview
> 5. web/src/components/Editor/ — BlockList, BlockEditor, SlideList, SlideNav,
     >    ThemePicker, SizePicker (with platform groups), Toolbar
> 6. web/src/components/Preview/ — PreviewPane, PreviewControls, DeckStrip
> 7. web/src/components/ui/ — Button, Input, Select, ColorPicker, Modal, Toast
> 8. web/src/App.tsx (mode switch)
> 9. src/server/server.ts + routes/ (preview, export, export-deck, themes) + ws.ts
> 10. src/cli/commands/studio.ts
>
> FAILURE CONDITIONS:
> - Any UI component library imported
> - Global state in React Context
> - DeckStrip loads all thumbnails at once on mount
> - Export Deck re-implements rendering (must use POST /export-deck)
> - BlockEditor missing any of the 7 block types
> - Studio requires two browser ports
> - Facebook non-square warning absent in deck mode SizePicker

---

### Contract 5 — Polish & Theme Editor

> Add Theme Editor, undo/redo, keyboard shortcuts, error states
>
> GOAL: (1) [+ New Theme] → theme editor modal → save creates .json and applies it.
> (2) Ctrl+Z / Ctrl+Y undo/redo works in both card and deck mode.
> (3) All error states handled: invalid JSON shows error banner, render fail shows
> toast with message, missing font falls back without crashing.
>
> CONSTRAINTS:
> - Undo/redo: immutable snapshots in Zustand, max 50, works for both stores
> - Color inputs: native <input type="color"> — no third-party color picker library
> - Google Fonts list: fetched once, cached in sessionStorage
> - Toasts built from scratch — no react-hot-toast, sonner, or any toast library
> - Error boundaries wrap preview iframe AND editor panel separately
> - Facebook size warning is non-blocking (yellow inline text, not a modal)
>
> FORMAT:
> 1. web/src/components/Editor/ThemeEditorModal.tsx
> 2. web/src/store/cardStore.ts — add past[], future[], undo(), redo()
> 3. web/src/store/deckStore.ts — add past[], future[], undo(), redo()
> 4. web/src/hooks/useKeyboardShortcuts.ts (Ctrl+S, Z, Y, E)
> 5. web/src/components/ui/Toast.tsx — queue, auto-dismiss 4s
> 6. web/src/components/ui/Modal.tsx — accessible wrapper
> 7. web/src/hooks/useFontList.ts — Google Fonts API + sessionStorage cache
> 8. src/server/routes/themes.ts — POST + PUT /themes/:name
> 9. README.md (install, CLI reference, size table with Facebook formats)
>
> FAILURE CONDITIONS:
> - Undo/redo corrupts state (must be standard past/future stack pattern)
> - Theme saved without Zod validation
> - Toast library installed
> - Google Fonts re-fetched on every modal open
> - Error in one slide crashes the entire studio
> - Facebook non-square warning blocks export (must only warn)
```