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

## Source of Truth

- Schema authority: `src/cli/utils/validator.ts` — SIZES, Block/Card/Deck/Theme Zod schemas.
  Read it before writing any docs, sample JSON, or type definition.
- SIZES is duplicated in `studio/src/types/index.ts` (browser) and counted in `src/__tests__/validator.test.ts` — update all 3 when adding a size.
- Block schemas are NOT uniform: `headline`/`blockquote` use `parts: Part[]`; `text` uses `content: string`; `bullet-list`/`callout` use `items: LabeledItem[]`.

## Repo Layout

- `src/` — CLI + renderer (Bun + Nunjucks + Puppeteer)
- `studio/` — bundled WYSIWYG editor (was `web/`; PRD.md comments may still say web/)
- `site/` — separate landing + MDX docs SPA (React Router v7, deployed via its own nginx Dockerfile)
- `templates/_base.css` — shared responsive base, injected into every template render
- `themes/_schema.json` — reference; actual validator is Zod in src/

## Releases

- `bun run release:patch | release:minor | release:major` — runs typecheck + tests
  (preversion hook), bumps `package.json`, commits `vX.Y.Z`, creates an annotated
  tag, then pushes commit + tag via `--follow-tags` (postversion hook).
- The tag push triggers `.github/workflows/release.yml`, which builds binaries,
  publishes the GitHub Release, and bumps the Homebrew formula. Do NOT
  hand-craft tags or push bumps without these scripts unless the workflow is broken.

## Gotchas

- `bun quoteforge generate <file> --output <path>` expects a FILE path (not directory); errors with `EISDIR` otherwise.
- `lucide-react@1.8.0` is current latest but dropped brand icons (Github, etc.) — use inline Simple Icons SVGs for brand marks.
- Puppeteer + Google Fonts `opsz` axis syntax (e.g. `9..144`) is unreliable; prefer plain `wght@400;700` URLs in theme JSON.
- Block-level `blockquote` is capped at 28px in `_base.css`; use a `headline` block for hero-size quote cards.
- In React, do not call `lazy(loader)` inside `useMemo` — it caches stale trees across param changes. Keep `lazy()` at module level.
