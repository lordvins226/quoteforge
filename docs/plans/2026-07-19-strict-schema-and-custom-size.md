# Strict Schemas, Custom Dimensions, and Version Reporting — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `quoteforge validate` mean "this file will render correctly" — reject unknown keys, honour `size: "custom"` dimensions, and report the real version.

**Architecture:** A single `resolveDimensions()` function becomes the only path from validated content to concrete pixel dimensions, so the `{ w: 0, h: 0 }` sentinel in `SIZES.custom` can never reach Puppeteer or the type-scale maths again. Schema strictness is applied per-object (including each discriminated-union member) after the new `width`/`height` keys are legitimate.

**Tech Stack:** Bun, TypeScript strict mode, Zod v4 (`zod/v4`), Puppeteer (`puppeteer-core`), `bun:test`.

**Spec:** `docs/specs/2026-07-19-strict-schema-and-custom-size-design.md`

## Global Constraints

- Runtime is Bun. Tests run with `bun test`. Never introduce npm scripts or Node-only APIs.
- TypeScript strict mode. No `any` — use `unknown` and narrow.
- `src/cli/utils/validator.ts` is the schema authority. `SIZES` is mirrored in `studio/src/types/index.ts` and counted in `src/__tests__/validator.test.ts` — all three stay in sync.
- No size is added or removed in this plan. The existing count of **17** sizes must remain 17.
- Custom dimension bounds: integers, minimum **1**, maximum **8000**.
- Zod v4: `.strict()` must be applied **before** `.superRefine()`. `superRefine()` returns a `ZodEffects`, which has no `.strict()` method. Verified: `.strict().superRefine(...)` keeps strictness active and fires the refinement.
- Zod v4 unknown-key errors read `Unrecognized key: "<name>"` and carry an **empty** `path`. Assert on the message, not the path.
- Rendering for existing preset-sized files must not change: same resolved dimensions, same computed `--type-scale` / `--headline-scale` / `--space-scale`.
- Commit format: `type(app[scope]): brief description`. No bullet points, no author name, no extra body.
- Never add code comments unless explicitly required by a step.

---

### Task 1: Version reporting

**Files:**
- Create: `src/version.ts`
- Modify: `src/cli/index.ts:15-18`
- Modify: `src/assetBundle.ts:80`
- Test: `src/__tests__/version.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `VERSION: string` exported from `src/version.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/version.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import { $ } from "bun";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { VERSION } from "../version.js";

const ROOT = resolve(import.meta.dir, "../..");

function packageVersion(): string {
  const raw = readFileSync(resolve(ROOT, "package.json"), "utf-8");
  return (JSON.parse(raw) as { version: string }).version;
}

describe("VERSION", () => {
  test("equals the version in package.json", () => {
    expect(VERSION).toBe(packageVersion());
  });
});

describe("CLI --version", () => {
  test("reports the version from package.json", async () => {
    const out = await $`bun run ${resolve(ROOT, "src/cli/index.ts")} --version`.text();
    expect(out.trim()).toBe(packageVersion());
  });
});
```

The expected value is read from `package.json` at test time and never written as a
literal. A hardcoded expectation would go stale exactly like the bug it guards.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/version.test.ts`
Expected: FAIL — `Cannot find module '../version.js'`.

- [ ] **Step 3: Create the version module**

Create `src/version.ts`:

```ts
import pkg from "../package.json";

export const VERSION = (pkg as { version: string }).version;
```

Bun inlines the imported JSON at `bun build --compile` time. `src/assetBundle.ts:39`
already imports `../package.json` this way, so the pattern is proven to survive
compilation into the released binaries.

- [ ] **Step 4: Wire it into the CLI**

In `src/cli/index.ts`, add the import after the existing command imports (line 11):

```ts
import { VERSION } from "../version.js";
```

Replace lines 15-18:

```ts
program
  .name("quoteforge")
  .description("Developer-native typographic card, carousel, and banner generator")
  .version(VERSION);
```

The description also changes: the old text read "Developer-native typographic social
media card + carousel generator", which contradicts the broadened description in
`package.json`.

- [ ] **Step 5: De-duplicate in assetBundle**

In `src/assetBundle.ts`, replace line 80:

```ts
const VERSION = (pkg as { version: string }).version;
```

with an import of the shared constant. Add to the imports:

```ts
import { VERSION } from "./version.js";
```

and delete line 80. Leave the existing `import pkg from "../package.json";` on line 39
in place only if `pkg` is still referenced elsewhere in the file; if line 80 was its
only use, remove that import too.

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun test src/__tests__/version.test.ts`
Expected: PASS, 2 tests.

Run: `bun test`
Expected: PASS, whole suite green.

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/version.ts src/cli/index.ts src/assetBundle.ts src/__tests__/version.test.ts
git commit -m "fix(quoteforge[cli]): report version from package.json instead of hardcoded string"
```

---

### Task 2: Custom dimension schema

**Files:**
- Modify: `src/cli/utils/validator.ts:163-200`
- Test: `src/__tests__/validator.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `CardContentSchema` accepting optional `width?: number` and `height?: number`.
  - `SlideSchema` and `DeckDefaultsSchema` accepting the same two optional keys.
  - The relational rule enforced on all three.

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/validator.test.ts`:

```ts
describe("Custom dimensions", () => {
  const base = {
    template: "manifesto",
    theme: "dark-teal",
    blocks: [{ type: "headline", parts: [{ text: "Test", style: "normal" }] }],
  };

  test("accepts size 'custom' with width and height", () => {
    const parsed = CardContentSchema.parse({ ...base, size: "custom", width: 1200, height: 900 });
    expect(parsed.width).toBe(1200);
    expect(parsed.height).toBe(900);
  });

  test("rejects size 'custom' without width", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", height: 900 }))
      .toThrow(/width/);
  });

  test("rejects size 'custom' without height", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", width: 1200 }))
      .toThrow(/height/);
  });

  test("rejects size 'custom' with neither dimension", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom" })).toThrow();
  });

  test("rejects width/height on a preset size", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "twitter", width: 1200, height: 900 }))
      .toThrow(/only allowed when size is "custom"/);
  });

  test("accepts a preset size with no dimensions", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "twitter" })).not.toThrow();
  });

  test.each([0, -100, 1.5, 8001])("rejects invalid dimension %p", (bad) => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", width: bad, height: 900 }))
      .toThrow();
  });

  test("accepts the maximum dimension", () => {
    expect(() => CardContentSchema.parse({ ...base, size: "custom", width: 8000, height: 8000 }))
      .not.toThrow();
  });
});

describe("Custom dimensions in decks", () => {
  const slideBlocks = [{ type: "headline", parts: [{ text: "S", style: "normal" }] }];

  test("accepts custom dimensions in deck defaults", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "custom", width: 1600, height: 1200 },
      slides: [{ id: "s1", blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).not.toThrow();
  });

  test("rejects deck defaults with size 'custom' and no dimensions", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "custom" },
      slides: [{ id: "s1", blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).toThrow(/width/);
  });

  test("accepts a per-slide custom size", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "instagram-sq" },
      slides: [{ id: "s1", size: "custom", width: 800, height: 600, blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).not.toThrow();
  });

  test("rejects slide dimensions without an explicit custom size", () => {
    const deck = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "instagram-sq" },
      slides: [{ id: "s1", width: 800, height: 600, blocks: slideBlocks }],
    };
    expect(() => DeckContentSchema.parse(deck)).toThrow(/only allowed when size is "custom"/);
  });
});
```

The last test pins a decision worth stating: a slide that omits `size` inherits it
from `defaults`, so dimensions on that slide would be silently ignored. Ignoring
supplied values is the exact failure this whole task exists to eliminate, so it is
rejected rather than tolerated.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/__tests__/validator.test.ts`
Expected: FAIL — the "accepts size 'custom' with width and height" test fails because
`width` is stripped and `parsed.width` is `undefined`; the rejection tests fail
because nothing throws.

- [ ] **Step 3: Add the dimension fields and the shared refinement**

In `src/cli/utils/validator.ts`, add above `CardContentSchema` (currently line 163):

```ts
const DimensionSchema = z.number().int().min(1).max(8000);

function refineCustomDimensions(
  data: { size?: string; width?: number; height?: number },
  ctx: z.RefinementCtx,
): void {
  if (data.size === "custom") {
    if (data.width === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["width"],
        message: 'size "custom" requires "width"',
      });
    }
    if (data.height === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["height"],
        message: 'size "custom" requires "height"',
      });
    }
    return;
  }

  if (data.width !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["width"],
      message: '"width" is only allowed when size is "custom"',
    });
  }
  if (data.height !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["height"],
      message: '"height" is only allowed when size is "custom"',
    });
  }
}
```

The `else` branch deliberately covers both a preset size and an absent size. On a
slide, an absent `size` means "inherit from defaults", so dimensions there would never
be read.

- [ ] **Step 4: Apply to the three schemas**

Replace `CardContentSchema` (lines 163-171):

```ts
export const CardContentSchema = z.object({
  $schema: z.string().optional(),
  type: z.literal("card").optional(),
  template: z.string(),
  theme: z.string(),
  size: SizeNameSchema,
  width: DimensionSchema.optional(),
  height: DimensionSchema.optional(),
  meta: MetaSchema.optional(),
  blocks: z.array(BlockSchema).min(1),
}).superRefine(refineCustomDimensions);
export type CardContent = z.infer<typeof CardContentSchema>;
```

Replace `SlideSchema` (lines 174-183):

```ts
const SlideSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  template: z.string().optional(),
  theme: z.string().optional(),
  size: SizeNameSchema.optional(),
  width: DimensionSchema.optional(),
  height: DimensionSchema.optional(),
  showCounter: z.boolean().optional(),
  counter: CounterConfigSchema.optional(),
  blocks: z.array(BlockSchema).min(1),
}).superRefine(refineCustomDimensions);
```

Replace `DeckDefaultsSchema` (lines 185-191):

```ts
const DeckDefaultsSchema = z.object({
  template: z.string(),
  theme: z.string(),
  size: SizeNameSchema,
  width: DimensionSchema.optional(),
  height: DimensionSchema.optional(),
  showCounter: z.boolean().optional(),
  counter: CounterConfigSchema.optional(),
}).superRefine(refineCustomDimensions);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test src/__tests__/validator.test.ts`
Expected: PASS, including all new tests.

Run: `bun test`
Expected: PASS, whole suite green.

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/cli/utils/validator.ts src/__tests__/validator.test.ts
git commit -m "feat(quoteforge[schema]): accept and require width/height for custom size"
```

---

### Task 3: Dimension resolution in the render path

**Files:**
- Create: `src/renderer/dimensions.ts`
- Modify: `src/renderer/renderer.ts:14-34`
- Modify: `studio/src/types/index.ts:100-108` and the `Slide` interface below it
- Test: `src/__tests__/dimensions.test.ts`

**Interfaces:**
- Consumes: `CardContentSchema` from Task 2 (`width?: number`, `height?: number`).
- Produces:
  - `interface Dimensions { w: number; h: number }`
  - `resolveDimensions(input: { size: SizeName; width?: number; height?: number }): Dimensions`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/dimensions.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import { resolveDimensions } from "../renderer/dimensions.js";
import { SIZES } from "../cli/utils/validator.js";

describe("resolveDimensions", () => {
  test("resolves a preset size from SIZES", () => {
    expect(resolveDimensions({ size: "twitter" })).toEqual({ w: 1200, h: 675 });
  });

  test("resolves custom dimensions from width and height", () => {
    expect(resolveDimensions({ size: "custom", width: 1200, height: 900 }))
      .toEqual({ w: 1200, h: 900 });
  });

  test("never returns the 0x0 sentinel for custom", () => {
    const resolved = resolveDimensions({ size: "custom", width: 800, height: 600 });
    expect(resolved.w).toBeGreaterThan(0);
    expect(resolved.h).toBeGreaterThan(0);
  });

  test("throws when custom is missing dimensions", () => {
    expect(() => resolveDimensions({ size: "custom" })).toThrow(/width/);
  });

  test("ignores width and height for a preset size", () => {
    expect(resolveDimensions({ size: "twitter", width: 999, height: 999 }))
      .toEqual({ w: 1200, h: 675 });
  });

  test.each(Object.keys(SIZES).filter((n) => n !== "custom"))(
    "preset '%s' resolves to its SIZES entry",
    (name) => {
      const entry = SIZES[name as keyof typeof SIZES];
      expect(resolveDimensions({ size: name as never })).toEqual({ w: entry.w, h: entry.h });
    },
  );
});
```

The last case is the regression net for the "no rendering change" constraint: every
one of the 16 presets must still resolve to exactly its `SIZES` entry.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/dimensions.test.ts`
Expected: FAIL — `Cannot find module '../renderer/dimensions.js'`.

- [ ] **Step 3: Create the resolver**

Create `src/renderer/dimensions.ts`:

```ts
import { SIZES } from "../cli/utils/validator.js";
import type { SizeName } from "../cli/utils/validator.js";

export interface Dimensions {
  w: number;
  h: number;
}

export interface SizedContent {
  size: SizeName;
  width?: number;
  height?: number;
}

export function resolveDimensions(input: SizedContent): Dimensions {
  if (input.size === "custom") {
    if (input.width === undefined || input.height === undefined) {
      throw new Error('size "custom" requires both "width" and "height"');
    }
    return { w: input.width, h: input.height };
  }

  const preset = SIZES[input.size];
  return { w: preset.w, h: preset.h };
}
```

- [ ] **Step 4: Wire it into the renderer**

In `src/renderer/renderer.ts`, replace the `SIZES` import on line 6:

```ts
import { resolveDimensions } from "./dimensions.js";
```

Replace line 22 inside `renderCardOnPage`:

```ts
  const dimensions = resolveDimensions({
    size,
    width: content.width,
    height: content.height,
  });
```

Nothing else in the function changes. `renderTemplate(content, theme, dimensions, meta)`
on line 23 already receives the resolved object, so `buildCssVars` in
`template-engine.ts:48` gets real values and `areaScale` on line 52 stops collapsing
to zero. That is the second half of the blank-render bug and needs no edit in
`template-engine.ts` itself.

- [ ] **Step 5: Sync the studio types**

In `studio/src/types/index.ts`, add the two optional fields to `CardContent`
(currently lines 100-108):

```ts
export interface CardContent {
  $schema?: string;
  type?: "card";
  template: string;
  theme: string;
  size: SizeName;
  width?: number;
  height?: number;
  meta?: { title?: string; created?: string; tags?: string[] };
  blocks: Block[];
}
```

Add the same two fields to the `Slide` interface immediately below it, after its
`size?: SizeName;` line:

```ts
  width?: number;
  height?: number;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun test src/__tests__/dimensions.test.ts`
Expected: PASS.

Run: `bun test`
Expected: PASS, whole suite green — in particular
`src/__tests__/template-engine-scaling.test.ts`, which pins the computed scales for
preset sizes and would catch any drift in the maths.

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 7: Verify the original bug end to end**

Create the reported reproduction file at `/tmp/qf-custom.json`:

```json
{
  "type": "card",
  "template": "manifesto",
  "theme": "dark-teal",
  "size": "custom",
  "width": 1200,
  "height": 900,
  "blocks": [{ "type": "headline", "parts": [{ "text": "Test", "style": "normal" }] }]
}
```

Run:

```bash
bun quoteforge generate /tmp/qf-custom.json --output /tmp/qf-custom.png --no-timestamp
```

Expected: the command succeeds and the PNG is **2400×1800** (1200×900 at the default
`--scale 2`), not 1600×1200. Confirm with:

```bash
file /tmp/qf-custom.png
```

Expected output contains `2400 x 1800`.

Open the PNG and confirm the word "Test" is visible. A correctly sized but blank image
means `areaScale` is still zero and Step 4 was not applied correctly.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/dimensions.ts src/renderer/renderer.ts studio/src/types/index.ts src/__tests__/dimensions.test.ts
git commit -m "fix(quoteforge[renderer]): resolve custom dimensions instead of 0x0 sentinel"
```

---

### Task 4: Strict schemas

**Files:**
- Modify: `src/cli/utils/validator.ts` (all object schemas)
- Test: `src/__tests__/validator.test.ts`
- Test: `src/__tests__/examples.test.ts`

**Interfaces:**
- Consumes: the schemas as left by Task 2, including `width`/`height` on card, slide, and deck defaults.
- Produces: no new exports. All existing schemas reject unknown keys.

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/validator.test.ts`:

```ts
describe("Strict schemas", () => {
  const card = {
    template: "manifesto",
    theme: "dark-teal",
    size: "twitter",
    blocks: [{ type: "headline", parts: [{ text: "Test", style: "normal" }] }],
  };

  test("rejects an unknown root key and names it", () => {
    expect(() => CardContentSchema.parse({ ...card, bogusKey: 1 }))
      .toThrow(/bogusKey/);
  });

  test("rejects a misspelled field inside a block", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      blocks: [{ type: "headline", part: [{ text: "Test", style: "normal" }] }],
    })).toThrow();
  });

  test("rejects an unknown key inside a block", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      blocks: [{ type: "headline", parts: [{ text: "T", style: "normal" }], bogus: 1 }],
    })).toThrow(/bogus/);
  });

  test("rejects an unknown key inside a part", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      blocks: [{ type: "headline", parts: [{ text: "T", style: "normal", bogus: 1 }] }],
    })).toThrow(/bogus/);
  });

  test("rejects an unknown key inside meta", () => {
    expect(() => CardContentSchema.parse({ ...card, meta: { title: "x", bogus: 1 } }))
      .toThrow(/bogus/);
  });

  test("rejects an unknown key in a theme", () => {
    const theme = JSON.parse(
      readFileSync(resolve(import.meta.dir, "../../themes/dark-teal.json"), "utf-8"),
    ) as Record<string, unknown>;
    expect(() => ThemeSchema.parse({ ...theme, bogus: 1 })).toThrow(/bogus/);
  });

  test("rejects an unknown key in deck defaults", () => {
    expect(() => DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "twitter", bogus: 1 },
      slides: [{ id: "s1", blocks: card.blocks }],
    })).toThrow(/bogus/);
  });

  test("rejects an unknown key on a slide", () => {
    expect(() => DeckContentSchema.parse({
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "twitter" },
      slides: [{ id: "s1", blocks: card.blocks, bogus: 1 }],
    })).toThrow(/bogus/);
  });

  test("still accepts the documented extension points", () => {
    expect(() => CardContentSchema.parse({
      ...card,
      $schema: "./schema.json",
      meta: { title: "T", created: "2026-07-19", tags: ["a"] },
    })).not.toThrow();
  });
});
```

Add these imports at the top of `src/__tests__/validator.test.ts` if not already present:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
```

The "misspelled field inside a block" case is the one that fails if strictness is
applied only at the root. `parts` is required, so `part` produces a missing-field
error regardless — but only per-member strictness also reports the stray `part` key.

- [ ] **Step 2: Replace the hand-listed example test with a glob**

Replace the whole body of `src/__tests__/examples.test.ts` with:

```ts
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  CardContentSchema,
  DeckContentSchema,
  ThemeSchema,
  detectAndValidate,
} from "../cli/utils/validator.js";

const ROOT = resolve(import.meta.dir, "../..");

function loadJSON(absPath: string): unknown {
  return JSON.parse(readFileSync(absPath, "utf-8"));
}

function jsonFilesIn(relDir: string): string[] {
  const dir = resolve(ROOT, relDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => join(dir, f));
}

const cardFiles = jsonFilesIn("content/examples");
const deckFiles = jsonFilesIn("decks/examples");
const themeFiles = jsonFilesIn("themes").filter((f) => !f.endsWith("_schema.json"));

describe("Shipped card examples", () => {
  test("at least one example exists", () => {
    expect(cardFiles.length).toBeGreaterThan(0);
  });

  test.each(cardFiles)("%s validates as a card", (file) => {
    const raw = loadJSON(file);
    expect(() => CardContentSchema.parse(raw)).not.toThrow();
    expect(detectAndValidate(raw).kind).toBe("card");
  });
});

describe("Shipped deck examples", () => {
  test("at least one deck exists", () => {
    expect(deckFiles.length).toBeGreaterThan(0);
  });

  test.each(deckFiles)("%s validates as a deck", (file) => {
    const raw = loadJSON(file);
    expect(() => DeckContentSchema.parse(raw)).not.toThrow();
    expect(detectAndValidate(raw).kind).toBe("deck");
  });
});

describe("Shipped themes", () => {
  test("all 12 built-in themes are present", () => {
    expect(themeFiles).toHaveLength(12);
  });

  test.each(themeFiles)("%s validates as a theme", (file) => {
    expect(() => ThemeSchema.parse(loadJSON(file))).not.toThrow();
  });
});

describe("dark-teal theme values", () => {
  const theme = ThemeSchema.parse(loadJSON(resolve(ROOT, "themes/dark-teal.json")));

  test("background is #1a1a1a", () => {
    expect(theme.colors.background).toBe("#1a1a1a");
  });

  test("accent is #4ecdc4", () => {
    expect(theme.colors.accent).toBe("#4ecdc4");
  });
});
```

The previous version named three files by hand. Under strict validation every shipped
file is a potential casualty, so the net has to cover all of them — a stray key in an
untested example would otherwise ship broken.

The "at least one" guards exist because `test.each([])` silently registers zero tests;
without them an empty glob would look like a pass.

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun test src/__tests__/validator.test.ts src/__tests__/examples.test.ts`
Expected: the strictness tests FAIL (nothing throws — unknown keys are stripped). The
example tests should PASS already; if any fails now, that file has a real stray key
that must be fixed in Step 5.

- [ ] **Step 4: Apply strictness to every object schema**

In `src/cli/utils/validator.ts`, add `.strict()` to each `z.object(...)` call. The
complete list, with current line numbers:

| Schema | Line |
|--------|------|
| `PartSchema` | 38 |
| `LabeledItemSchema` | 44 |
| `HeadlineBlockSchema` | 50 |
| `BlockquoteBlockSchema` | 56 |
| `TextBlockSchema` | 62 |
| `BulletListBlockSchema` | 68 |
| `CalloutBlockSchema` | 74 |
| `DividerBlockSchema` | 80 |
| `SpacerBlockSchema` | 85 |
| `ImageBlockSchema` | 91 |
| `MetaSchema` | 112 |
| `ThemeColorsSchema` | 118 |
| `ThemeTypographySchema` | 133 |
| `ThemeSpacingSchema` | 143 |
| `ThemeSchema` | 148 |
| `CounterConfigSchema` | 157 |
| `CardContentSchema` | 163 |
| `SlideSchema` | 174 |
| `DeckDefaultsSchema` | 185 |
| `DeckContentSchema` | 193 |

Each of the eight block schemas must get its own `.strict()`. Strictness on the
`z.discriminatedUnion` wrapper does not propagate to its members.

For the three schemas that Task 2 gave a `.superRefine()`, `.strict()` goes **before**
it — `superRefine()` returns a `ZodEffects`, which has no `.strict()` method:

```ts
export const CardContentSchema = z.object({
  // ... fields unchanged ...
}).strict().superRefine(refineCustomDimensions);
```

The same ordering applies to `SlideSchema` and `DeckDefaultsSchema`.

- [ ] **Step 5: Run tests and fix any shipped file that now fails**

Run: `bun test`
Expected: PASS.

If a shipped example or theme now fails, read the error, remove the stray key from
that JSON file, and re-run. Do not relax a schema to accommodate a shipped file — the
stray key is the bug.

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Verify the original reproduction is now rejected**

Create `/tmp/qf-bad.json` — the file from the bug report, with dimensions on a preset
size:

```json
{
  "type": "card",
  "template": "manifesto",
  "theme": "dark-teal",
  "size": "twitter",
  "width": 1200,
  "height": 900,
  "blocks": [{ "type": "headline", "parts": [{ "text": "Test", "style": "normal" }] }]
}
```

Run:

```bash
bun quoteforge validate /tmp/qf-bad.json
```

Expected: fails, and the message mentions `width`. Before this task it passed and then
rendered at the wrong size.

- [ ] **Step 7: Commit**

```bash
git add src/cli/utils/validator.ts src/__tests__/validator.test.ts src/__tests__/examples.test.ts
git commit -m "feat(quoteforge[schema]): reject unknown keys in all content and theme schemas"
```

---

### Task 5: Documentation and changelog

**Files:**
- Modify: `README.md:221-240` (Themes section)
- Modify: `site/src/docs/content-schema.mdx:183` (sizes table `custom` row) and the section below it
- Create: `CHANGELOG.md`

**Interfaces:**
- Consumes: the shipped behaviour from Tasks 1-4.
- Produces: no code.

Verified before writing this task: `docs/references/content-schema.md` does not exist
in this repo — the schema reference lives at `site/src/docs/content-schema.mdx`, and
its sizes table carries the `custom` row at line 183. `CHANGELOG.md` does not exist
and is created here.

The skill's copy at `~/workspace/personal/skills/quoteforge-cards/references/content-schema.md`
is a **separate repository** and is out of scope. Do not edit it from this repo.

- [ ] **Step 1: Document custom dimensions in the size table**

In `site/src/docs/content-schema.mdx`, line 183 currently reads:

```markdown
| `custom` | user-defined | free | Custom dimensions |
```

Leave the row itself but add this section immediately below the sizes table:

````markdown
### Custom dimensions

When no preset fits, use `custom` and supply both dimensions at the root of the card:

```json
{
  "template": "manifesto",
  "theme": "dark-teal",
  "size": "custom",
  "width": 1200,
  "height": 900,
  "blocks": [ ... ]
}
```

`width` and `height` are integers between 1 and 8000, and both are required when
`size` is `"custom"`. Supplying them alongside a preset size is rejected, because the
preset would win and the values would be silently ignored.

The same keys work in a deck's `defaults`, and on an individual slide that sets
`"size": "custom"` explicitly.
````

- [ ] **Step 2: Rewrite the README Themes section**

Replace the closing line of the Themes section (`README.md:240`, currently
"Create your own: `quoteforge themes create my-brand`") with:

````markdown
### Themes are fork points, not a fixed menu

The twelve built-ins are starting points. Duplicating one and changing a single colour
is usually enough to match an existing brand:

```bash
quoteforge themes duplicate terminal-green my-brand
```

That writes `~/.config/quoteforge/themes/my-brand.json` — plain, hand-editable JSON.
Change the accent:

```json
{
  "name": "my-brand",
  "displayName": "My Brand",
  "colors": {
    "accent": "#4ecdc4"
  }
}
```

Then render with it:

```bash
quoteforge generate card.json --theme my-brand
```

`quoteforge themes show my-brand` prints the resolved theme with colour swatches, and
`quoteforge themes list` includes it alongside the built-ins.

`terminal-green` is a good base for a dark developer palette — JetBrains Mono on a
near-black background. `paper-cream` and `light-minimal` suit editorial and print-like
work.
````

- [ ] **Step 3: Write the changelog**

Create `CHANGELOG.md` with a `# Changelog` heading followed by:

```markdown
## 0.4.0

### Fixed
- `--version` reported a hardcoded `0.1.0` regardless of the installed version.
- `size: "custom"` produced a blank image at the browser's default viewport. Custom
  dimensions are now applied to both the viewport and the type-scale calculation.

### Changed
- **Breaking:** unknown keys are now rejected by every content and theme schema.
  Files that previously validated with stray keys will now fail, naming the key.
  `meta` and `$schema` remain the supported extension points.
- **Breaking:** `size: "custom"` now requires `width` and `height`. Supplying them
  alongside a preset size is rejected rather than silently ignored.

### Documentation
- Documented the custom-theme workflow (duplicate, edit, render) and custom dimensions.
```

The two Breaking entries are why this is a minor rather than a patch: a file that
validated on 0.3.0 can fail on 0.4.0.

- [ ] **Step 4: Verify every command shown actually works**

Run each command that appears in the new documentation:

```bash
bun quoteforge themes duplicate terminal-green my-brand
bun quoteforge themes show my-brand
bun quoteforge themes list
```

Expected: all three succeed and `my-brand` appears in the list output.

Clean up afterwards:

```bash
rm -f ~/.config/quoteforge/themes/my-brand.json
```

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md site/src/docs/content-schema.mdx
git commit -m "docs(quoteforge[schema]): document custom dimensions and theme forking"
```

---

## Verification

After all five tasks:

- [ ] `bun test` — whole suite passes.
- [ ] `bun run typecheck` — no errors.
- [ ] `bun quoteforge --version` prints `0.4.0` after the release bump (it prints the
      current `package.json` version before the bump, which is correct behaviour).
- [ ] The reproduction file from the bug report renders at 2400×1800 with visible text.
- [ ] A preset-sized example renders at its documented dimensions, unchanged.

Release with `bun run release:minor`, which runs `bun test` in the `preversion` hook,
bumps `package.json`, tags, and pushes. Do not hand-craft the tag.
