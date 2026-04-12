# QuoteForge

Developer-native typographic social media card and carousel generator. Define content in JSON, pick a theme, run one command — get production-ready PNGs.

No cloud. No subscriptions. No drag-and-drop. Just code.

## Install

```bash
git clone https://github.com/lordvins226/quoteforge
cd quoteforge
bun install
```

## Quick Start

```bash
# Generate a card
bun quoteforge generate content/examples/manifesto-wiki.json

# Generate a slide deck + ZIP
bun quoteforge slides decks/examples/intro-deck.json

# Create a new card interactively
bun quoteforge new

# Preview in browser with hot-reload
bun quoteforge preview content/examples/manifesto-wiki.json
```

## Commands

### `generate` — Single card → PNG

```
bun quoteforge generate <file> [options]

  -t, --theme <name>   Override theme
  -s, --size <name>    Override size (see Size Reference below)
  -o, --output <path>  Output file path
  --scale <n>          Pixel ratio (default: 2)
  --open               Open output file after generation
  --no-timestamp       Omit timestamp from filename
```

**Examples:**

```bash
bun quoteforge generate content/my-card.json
bun quoteforge generate content/my-card.json --size facebook-post --theme dark-orange
bun quoteforge generate content/my-card.json --no-timestamp --open
```

### `slides` — Deck → numbered PNGs + ZIP

```
bun quoteforge slides <file> [options]

  -t, --theme <name>   Override theme for all slides
  -s, --size <name>    Override size for all slides
  -o, --output <dir>   Output directory
  --slide <n>          Render only slide N (1-indexed), no ZIP
  --no-zip             Skip ZIP creation
  --no-counter         Disable counter overlay for all slides
  --concurrency <n>    Parallel render workers (default: 4)
  --scale <n>          Pixel ratio (default: 2)
  --open               Open output folder after generation
```

**Examples:**

```bash
bun quoteforge slides decks/intro-deck.json
bun quoteforge slides decks/intro-deck.json --size facebook-square
bun quoteforge slides decks/intro-deck.json --slide 3
bun quoteforge slides decks/intro-deck.json --no-counter --theme light-minimal
```

### `preview` — Live browser preview

```
bun quoteforge preview <file> [options]

  -p, --port <n>       Port (default: 4242)
  --no-open            Don't auto-open browser
  --slide <n>          Start on slide N for deck files (default: 1)
```

- Watches content + theme files for changes and hot-reloads via SSE
- Deck files show ◀ ▶ navigation with keyboard arrow key support

### `new` — Interactive content creator

```
bun quoteforge new [options]

  --type <type>        card or deck
  --template <name>    Template name (manifesto, quote, list, minimal)
  --theme <name>       Theme name
  --slides <n>         Number of blank slides (deck only, default: 5)
  --size <name>        Size name
  --name <filename>    Output filename (without .json)
```

All options are interactive when omitted.

### `themes` — Theme management

```
bun quoteforge themes list                           # List all themes with color swatches
bun quoteforge themes show <name>                    # Show theme details
bun quoteforge themes create <name>                  # Create a new theme from template
bun quoteforge themes duplicate <source> <new-name>  # Duplicate an existing theme
bun quoteforge themes validate <file>                # Validate a theme file
```

### `batch` — Folder → multiple PNGs

```
bun quoteforge batch <directory> [options]

  -t, --theme <name>   Override theme for all files
  -s, --size <name>    Override size for all files
  -o, --output <dir>   Output directory
  --concurrency <n>    Parallel workers (default: 2)
  --decks              Also process deck files into individual ZIPs
```

### `validate` — Validate content files

```
bun quoteforge validate <file>

# Auto-detects card vs deck from the "type" field
# Exits 0 if valid, 1 with Zod error details if invalid
```

## Size Reference

All formats with exact pixel dimensions:

| Name | Dimensions | Ratio | Platform |
|------|-----------|-------|----------|
| `twitter` | 1200 × 675 | 16:9 | Twitter/X post |
| `twitter-square` | 1080 × 1080 | 1:1 | Twitter/X square |
| `linkedin` | 1200 × 627 | 1.91:1 | LinkedIn post |
| `linkedin-square` | 1080 × 1080 | 1:1 | LinkedIn square |
| `instagram-sq` | 1080 × 1080 | 1:1 | Instagram square |
| `instagram-port` | 1080 × 1350 | 4:5 | Instagram portrait |
| `instagram-land` | 1080 × 566 | 1.91:1 | Instagram landscape |
| `facebook-post` | 1200 × 630 | 1.91:1 | Facebook post / link |
| `facebook-square` | 1080 × 1080 | 1:1 | Facebook square post |
| `facebook-cover` | 1640 × 624 | 2.63:1 | Facebook page cover |
| `facebook-event` | 1920 × 1080 | 16:9 | Facebook event cover |
| `facebook-group-cover` | 1640 × 856 | 1.91:1 | Facebook group cover |
| `story` | 1080 × 1920 | 9:16 | Stories (IG / FB / TW) |
| `custom` | variable | free | Custom dimensions |

> Facebook carousels render best with `facebook-square` (1080×1080).

## Themes

4 built-in themes:

| Theme | Background | Accent | Fonts |
|-------|-----------|--------|-------|
| `dark-teal` | `#1a1a1a` | `#4ecdc4` | Playfair Display / JetBrains Mono |
| `dark-orange` | `#1c1917` | `#f97316` | Playfair Display / JetBrains Mono |
| `light-minimal` | `#fafaf9` | `#0ea5e9` | Inter / Inter |
| `brand-midnight` | `#0f172a` | `#a78bfa` | Space Grotesk / IBM Plex Mono |

Create your own: `bun quoteforge themes create my-brand`

## Templates

| Template | Layout | Best for |
|----------|--------|----------|
| `manifesto` | Top-down flow, large headline | Statement posts, thought leadership |
| `quote` | Centered, vertically centered | Quotes, key takeaways |
| `list` | Compact, tight spacing | Data-heavy, bullet-heavy content |
| `minimal` | Extra whitespace, restrained | Wide formats (covers), clean CTAs |

## Content Model

### Card (single image)

```json
{
  "template": "manifesto",
  "theme": "dark-teal",
  "size": "twitter",
  "blocks": [
    { "type": "headline", "parts": [{ "text": "Hello ", "style": "normal" }, { "text": "world.", "style": "accent-italic" }] },
    { "type": "text", "content": "Body text here." }
  ]
}
```

### Deck (carousel)

```json
{
  "type": "deck",
  "defaults": { "template": "manifesto", "theme": "dark-teal", "size": "instagram-sq", "showCounter": true },
  "slides": [
    { "id": "slide-01", "blocks": [{ "type": "headline", "parts": [{ "text": "Slide 1", "style": "normal" }] }] },
    { "id": "slide-02", "blocks": [{ "type": "text", "content": "Slide 2 content" }] }
  ]
}
```

### Block Types

| Type | Description | Key Fields |
|------|-------------|------------|
| `headline` | Large display text with mixed inline styles | `parts[]` |
| `blockquote` | Left-bordered quote block | `parts[]` |
| `text` | Plain body paragraph | `content` |
| `bullet-list` | Label + text items with accent dot | `items[]{label, text}` |
| `callout` | Rounded box highlight | `items[]{label, text}` |
| `divider` | Full-width horizontal rule | — |
| `spacer` | Vertical whitespace | `size: sm\|md\|lg` |

### Inline Part Styles

`normal` · `bold` · `italic` · `accent` · `accent-italic` · `mono` · `muted`

## Stack

Bun · TypeScript · Commander.js · Nunjucks · Puppeteer · Zod · archiver

## License

MIT
