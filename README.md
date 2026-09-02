# QuoteForge

Developer-native typographic card, carousel, and banner generator. Define content in JSON, pick a theme, run one command, get production-ready PNGs. Great for social posts and carousels, but equally slides, blog/Open Graph headers, article covers, and announcement graphics.

No cloud. No subscriptions. No drag-and-drop. Just code.

Full documentation: **[quoteforge.kevwilfried.dev/docs](https://quoteforge.kevwilfried.dev/docs)**

## Install

```bash
brew install lordvins226/quoteforge/quoteforge
```

Without Homebrew:

```bash
curl -fsSL https://raw.githubusercontent.com/lordvins226/quoteforge/main/install.sh | sh
```

Pre-built binaries for macOS, Linux, and Windows are on the [releases page](https://github.com/lordvins226/quoteforge/releases), each with a `.sha256` sibling. From source: clone the repo, then `bun install`.

Rendering needs Chrome or Chromium. QuoteForge uses your system install if it finds one, otherwise it downloads a pinned Chrome for Testing (~170MB) on first run. `quoteforge doctor` reports what it resolved.

PATH setup, version pinning, and the macOS Gatekeeper note are in [getting started](https://quoteforge.kevwilfried.dev/docs/getting-started).

## Quick start

```bash
quoteforge generate content/examples/manifesto-wiki.json   # one card
quoteforge slides decks/examples/intro-deck.json           # deck plus ZIP
quoteforge new                                             # interactive creator
quoteforge preview content/examples/manifesto-wiki.json    # hot-reloading preview
quoteforge studio                                          # WYSIWYG editor
```

A card is JSON:

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

A deck is the same shape with `"type": "deck"`, shared `defaults`, and a `slides` array. Both, along with all 11 block types and the inline part styles, are in the [content schema](https://quoteforge.kevwilfried.dev/docs/content-schema).

## Commands

| Command | Does |
|---------|------|
| `generate <file>` | Render one card to PNG |
| `slides <deck>` | Render a deck to numbered PNGs plus a ZIP |
| `batch <dir>` | Render every card and deck in a folder |
| `preview <file>` | Live browser preview with hot reload |
| `studio` | WYSIWYG editor in the browser |
| `new` | Interactive card or deck creator |
| `themes` | list, show, duplicate, create, validate |
| `validate <file>` | Zod-validate a card, deck, or theme. Exits non-zero on failure, so it wires into CI |
| `doctor` | Report bundled assets, resolved Chrome, and runtime versions |

Every flag is in the [CLI reference](https://quoteforge.kevwilfried.dev/docs/cli).

## What ships

28 templates in five families: statement, structure and data, developer, editorial, people and media. 12 themes covering terminal, editorial, brutalist, and zen palettes. 22 size presets from `twitter` to `slide-16x9`, plus `custom` for arbitrary dimensions.

Themes are fork points, not a fixed menu:

```bash
quoteforge themes duplicate terminal-green my-brand
```

That writes hand-editable JSON to `~/.config/quoteforge/themes/`, where changing one accent colour is usually enough to match a brand.

Browse every layout and palette: [templates](https://quoteforge.kevwilfried.dev/docs/templates), [themes](https://quoteforge.kevwilfried.dev/docs/themes).

## Repo layout

- `src/`: CLI + renderer (Bun + Nunjucks + Puppeteer)
- `studio/`: bundled WYSIWYG editor (Vite + React + Zustand, launched by `quoteforge studio`)
- `site/`: standalone landing + MDX docs SPA (separate nginx Dockerfile for deployment)
- `templates/`: 28 built-in card layouts sharing a responsive base CSS
- `themes/`: 12 JSON theme files conforming to `_schema.json`

## Stack

Bun · TypeScript · Commander.js · Nunjucks · Puppeteer · Zod · archiver · Vite · React · Zustand · Tailwind · MDX

## License

MIT
