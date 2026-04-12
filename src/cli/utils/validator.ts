import { z } from "zod/v4";

export const SIZES = {
  "twitter":               { w: 1200, h: 675,  ratio: "16:9",   label: "Twitter post" },
  "twitter-square":        { w: 1080, h: 1080, ratio: "1:1",    label: "Twitter square" },
  "linkedin":              { w: 1200, h: 627,  ratio: "1.91:1", label: "LinkedIn post" },
  "linkedin-square":       { w: 1080, h: 1080, ratio: "1:1",    label: "LinkedIn square" },
  "instagram-sq":          { w: 1080, h: 1080, ratio: "1:1",    label: "Instagram square" },
  "instagram-port":        { w: 1080, h: 1350, ratio: "4:5",    label: "Instagram portrait" },
  "instagram-land":        { w: 1080, h: 566,  ratio: "1.91:1", label: "Instagram landscape" },
  "facebook-post":         { w: 1200, h: 630,  ratio: "1.91:1", label: "Facebook post / link" },
  "facebook-square":       { w: 1080, h: 1080, ratio: "1:1",    label: "Facebook square post" },
  "facebook-cover":        { w: 1640, h: 624,  ratio: "2.63:1", label: "Facebook page cover" },
  "facebook-event":        { w: 1920, h: 1080, ratio: "16:9",   label: "Facebook event cover" },
  "facebook-group-cover":  { w: 1640, h: 856,  ratio: "1.91:1", label: "Facebook group cover" },
  "threads-sq":            { w: 1080, h: 1080, ratio: "1:1",    label: "Threads square" },
  "threads-port":          { w: 1080, h: 1350, ratio: "4:5",    label: "Threads portrait" },
  "threads-land":          { w: 1080, h: 566,  ratio: "1.91:1", label: "Threads landscape" },
  "story":                 { w: 1080, h: 1920, ratio: "9:16",   label: "Story (IG / FB / TW)" },
  "custom":                { w: 0,    h: 0,    ratio: "free",   label: "Custom dimensions" },
} as const;

const sizeNames = Object.keys(SIZES) as [string, ...string[]];
export const SizeNameSchema = z.enum(sizeNames);
export type SizeName = z.infer<typeof SizeNameSchema>;

export const PartStyleSchema = z.enum([
  "normal",
  "bold",
  "italic",
  "accent",
  "accent-italic",
  "mono",
  "muted",
]);
export type PartStyle = z.infer<typeof PartStyleSchema>;

export const PartSchema = z.object({
  text: z.string(),
  style: PartStyleSchema,
});
export type Part = z.infer<typeof PartSchema>;

export const LabeledItemSchema = z.object({
  label: z.string(),
  text: z.string(),
});
export type LabeledItem = z.infer<typeof LabeledItemSchema>;

const HeadlineBlockSchema = z.object({
  type: z.literal("headline"),
  id: z.string().optional(),
  parts: z.array(PartSchema).min(1),
});

const BlockquoteBlockSchema = z.object({
  type: z.literal("blockquote"),
  id: z.string().optional(),
  parts: z.array(PartSchema).min(1),
});

const TextBlockSchema = z.object({
  type: z.literal("text"),
  id: z.string().optional(),
  content: z.string(),
});

const BulletListBlockSchema = z.object({
  type: z.literal("bullet-list"),
  id: z.string().optional(),
  items: z.array(LabeledItemSchema).min(1),
});

const CalloutBlockSchema = z.object({
  type: z.literal("callout"),
  id: z.string().optional(),
  items: z.array(LabeledItemSchema).min(1),
});

const DividerBlockSchema = z.object({
  type: z.literal("divider"),
  id: z.string().optional(),
});

const SpacerBlockSchema = z.object({
  type: z.literal("spacer"),
  id: z.string().optional(),
  size: z.enum(["sm", "md", "lg"]),
});

export const BlockSchema = z.discriminatedUnion("type", [
  HeadlineBlockSchema,
  BlockquoteBlockSchema,
  TextBlockSchema,
  BulletListBlockSchema,
  CalloutBlockSchema,
  DividerBlockSchema,
  SpacerBlockSchema,
]);
export type Block = z.infer<typeof BlockSchema>;

const MetaSchema = z.object({
  title: z.string().optional(),
  created: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const ThemeColorsSchema = z.object({
  background: z.string(),
  headline: z.string(),
  accent: z.string(),
  body: z.string(),
  label: z.string(),
  "blockquote-border": z.string(),
  "blockquote-text": z.string(),
  "callout-bg": z.string(),
  "callout-border": z.string(),
  "bullet-dot": z.string(),
  "slide-counter-bg": z.string(),
  "slide-counter-text": z.string(),
});

export const ThemeTypographySchema = z.object({
  "font-headline": z.string(),
  "font-headline-url": z.string().optional(),
  "font-body": z.string(),
  "font-body-url": z.string().optional(),
  "headline-size": z.string(),
  "body-size": z.string(),
  "line-height": z.string(),
});

export const ThemeSpacingSchema = z.object({
  padding: z.string(),
  "block-gap": z.string(),
});

export const ThemeSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  colors: ThemeColorsSchema,
  typography: ThemeTypographySchema,
  spacing: ThemeSpacingSchema,
});
export type Theme = z.infer<typeof ThemeSchema>;

const CounterConfigSchema = z.object({
  format: z.string(),
  position: z.enum(["bottom-right", "bottom-left", "bottom-center", "top-right"]),
  style: z.enum(["pill", "plain", "dots"]),
});

export const CardContentSchema = z.object({
  $schema: z.string().optional(),
  type: z.literal("card").optional(),
  template: z.string(),
  theme: z.string(),
  size: SizeNameSchema,
  meta: MetaSchema.optional(),
  blocks: z.array(BlockSchema).min(1),
});
export type CardContent = z.infer<typeof CardContentSchema>;

const SlideSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  template: z.string().optional(),
  theme: z.string().optional(),
  size: SizeNameSchema.optional(),
  showCounter: z.boolean().optional(),
  counter: CounterConfigSchema.optional(),
  blocks: z.array(BlockSchema).min(1),
});

const DeckDefaultsSchema = z.object({
  template: z.string(),
  theme: z.string(),
  size: SizeNameSchema,
  showCounter: z.boolean().optional(),
  counter: CounterConfigSchema.optional(),
});

export const DeckContentSchema = z.object({
  $schema: z.string().optional(),
  type: z.literal("deck"),
  meta: MetaSchema.optional(),
  defaults: DeckDefaultsSchema,
  slides: z.array(SlideSchema).min(1),
});
export type DeckContent = z.infer<typeof DeckContentSchema>;

export type ValidationResult =
  | { kind: "card"; data: CardContent }
  | { kind: "deck"; data: DeckContent };

export function detectAndValidate(json: unknown): ValidationResult {
  if (
    typeof json === "object" &&
    json !== null &&
    "type" in json &&
    (json as Record<string, unknown>).type === "deck"
  ) {
    const data = DeckContentSchema.parse(json);
    return { kind: "deck", data };
  }

  const data = CardContentSchema.parse(json);
  return { kind: "card", data };
}
