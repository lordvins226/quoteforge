# Design — Inline Image Block (V1)

Date: 2026-06-22
Status: Approved

## Goal

Let users include images in cards and decks and control their inline placement.
Images are a new block type in the existing vertical block flow — stacked like
`headline`, `divider`, `spacer`. V1 ships horizontal alignment, width, and alt
text. No background images, no absolute positioning, no caption (deferred).

## Decisions

- **Layout model:** inline block (Option A). The image flows in block order; it is
  not absolutely positioned and not a background.
- **Source:** both a local file path (CLI) **and** a remote URL, plus data-URIs.
  Resolution happens server-side, never in React (CLAUDE.md #7).
- **Controls (V1):** `align` (left/center/right), `width` (sm/md/lg/full), `alt`.
- **Studio input:** URL paste **and** file upload (converted to a data-URI in the
  browser via `FileReader` — no filesystem access from React).

## Out of scope (deferred)

Rounded corners / border, caption text, background images, absolute (x/y)
positioning, drag-to-place.

## Architecture

The feature rides the existing rail: a discriminated-union Zod schema is the single
source of truth; each block type has a Nunjucks partial; templates `{% include %}`
the partial keyed on `block.type`. Image source resolution is the only genuinely new
concern, because Puppeteer renders HTML and the `<img src>` must be loadable at
render time.

### 1. Schema (source of truth)

`src/cli/utils/validator.ts` — add to the `BlockSchema` discriminated union:

```ts
const ImageBlockSchema = z.object({
  type: z.literal("image"),
  id: z.string().optional(),
  src: z.string().min(1),                          // URL, local path, or data-URI
  alt: z.string().optional(),
  width: z.enum(["sm", "md", "lg", "full"]).default("full"),
  align: z.enum(["left", "center", "right"]).default("center"),
});
```

Mirror the type in `studio/src/types/index.ts` (the browser copy of `Block` and
`BlockType`). Per CLAUDE.md, schema changes touch both files.

### 2. Image source resolution (new `src/renderer/image-resolver.ts`)

- `resolveImageSrc(src: string, baseDir: string): string`
  - `^(https?:|data:)` → return unchanged (pass-through).
  - otherwise → resolve relative to `baseDir`, read the file, infer MIME from the
    extension (`.jpg/.jpeg` → `image/jpeg`, `.png`, `.webp`, `.gif`, `.svg` →
    `image/svg+xml`), base64-encode, return `data:<mime>;base64,<...>`.
  - On a missing/unreadable local file: throw a clear error naming the path and the
    owning block, so the CLI can report it (consistent with existing command errors).
- `resolveImageBlocks(content, baseDir)` — walk blocks for a card, and every slide's
  blocks for a deck; return content with `image` block `src` resolved. Non-image
  blocks pass through untouched.

**Call sites (baseDir = `dirname(contentFilePath)`):** `generate.ts`, `batch.ts`,
`slides.ts` — resolve **before** calling `renderCard`/slide render.

**Studio:** `/api/preview` and `/export` receive card JSON whose image `src` is
already a URL or data-URI (the studio converts uploads in-browser). The resolver is
still applied as a pass-through; a bare relative path arriving from the studio
resolves against the server CWD as a best-effort fallback.

### 3. Template partial

`templates/_blocks/image.njk`:

```njk
<figure class="block block-image is-{{ block.width or 'full' }} align-{{ block.align or 'center' }}">
  <img src="{{ block.src }}" alt="{{ block.alt or '' }}">
</figure>
```

- Register the partial in `src/assetBundle.ts` (static `import block_image from
  "../templates/_blocks/image.njk"` + add to the AssetMap). Partials are NOT
  auto-discovered; the packaged binary only sees explicitly imported ones.
- Add `{% elif block.type == "image" %}{% include "_blocks/image.njk" %}` to all four
  templates: `quote`, `list`, `manifesto`, `minimal`.

### 4. CSS (`templates/_base.css`)

- `.block-image img { display: block; max-width: 100%; height: auto; }`
- Width: `.block-image.is-sm` 33%, `.is-md` 50%, `.is-lg` 75%, `.is-full` 100%
  (tune during implementation).
- Align: `.block-image.align-left { margin-right: auto; }`,
  `.align-right { margin-left: auto; }`, `.align-center { margin-left: auto;
  margin-right: auto; }` — applied to the `<figure>`.
- No hardcoded colors (CLAUDE.md #3) — image carries none in V1.

### 5. Studio UI

- `components/Editor/BlockList.tsx` — add `{ value: "image", label: "Image" }` to
  `BLOCK_TYPES`.
- `components/Editor/BlockEditor.tsx` — add `case "image"`: URL text input, file
  upload (`<input type="file">` → `FileReader.readAsDataURL` → store as `src`),
  width `Select` (sm/md/lg/full), align `Select` (left/center/right), alt text input.
- Default-block factory (in the store/`onAdd` path) — produce a valid empty image
  block: `{ type: "image", src: "", width: "full", align: "center" }`.

### 6. Tests

- `src/__tests__/validator.test.ts` — image block parses; `width`/`align` defaults
  applied; `src` required.
- New `src/__tests__/image-resolver.test.ts` — URL pass-through, data-URI
  pass-through, local file → data-URI with correct MIME, missing file throws.

## Data flow

```
content JSON ──► detectAndValidate (Zod) ──► resolveImageBlocks(baseDir)
   ──► renderTemplate (Nunjucks: image.njk) ──► Puppeteer setContent ──► PNG
```

Studio: React card store ──► /api/preview (src already URL/data-URI) ──► same
template engine ──► iframe.

## Risks / notes

- SVG via data-URI renders in Chromium; fine for Puppeteer.
- Very large local images inflate the data-URI; acceptable for V1, revisit if export
  payloads get heavy.
- `width` percentages are relative to the card content column (inside `--padding`),
  not the raw canvas — matches how other blocks behave.
