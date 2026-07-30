export type PartStyle = "normal" | "bold" | "italic" | "accent" | "accent-italic" | "mono" | "muted";

export interface Part {
  text: string;
  style: PartStyle;
}

export interface LabeledItem {
  label: string;
  text: string;
}

export interface ChartRow {
  label: string;
  value: number;
  muted?: boolean;
}

export type BlockType = "headline" | "blockquote" | "text" | "bullet-list" | "callout" | "divider" | "spacer" | "image" | "stat" | "code" | "chart";

export type Block =
  | { type: "headline"; id?: string; parts: Part[] }
  | { type: "blockquote"; id?: string; parts: Part[] }
  | { type: "text"; id?: string; content: string }
  | { type: "bullet-list"; id?: string; items: LabeledItem[] }
  | { type: "callout"; id?: string; items: LabeledItem[] }
  | { type: "divider"; id?: string }
  | { type: "spacer"; id?: string; size: "sm" | "md" | "lg" }
  | { type: "image"; id?: string; src: string; alt?: string; width: "sm" | "md" | "lg" | "full"; align: "left" | "center" | "right" }
  | { type: "stat"; id?: string; value: string; unit?: string; label?: string; note?: string }
  | { type: "code"; id?: string; filename?: string; lang?: string; lines: string[] }
  | { type: "chart"; id?: string; unit?: string; rows: ChartRow[] };

export type SizeName =
  | "twitter" | "twitter-square"
  | "linkedin" | "linkedin-square"
  | "instagram-sq" | "instagram-port" | "instagram-land"
  | "facebook-post" | "facebook-square" | "facebook-cover"
  | "facebook-event" | "facebook-group-cover"
  | "threads-sq" | "threads-port" | "threads-land"
  | "story" | "og" | "readme-hero" | "slide-16x9" | "4x3" | "3x2" | "custom";

export interface SizeInfo {
  w: number;
  h: number;
  ratio: string;
  label: string;
}

export const SIZES: Record<SizeName, SizeInfo> = {
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
  "og":                    { w: 1200, h: 630,  ratio: "1.91:1", label: "Open Graph / link preview" },
  "readme-hero":           { w: 1280, h: 640,  ratio: "2:1",    label: "README / docs hero banner" },
  "slide-16x9":            { w: 1920, h: 1080, ratio: "16:9",   label: "Presentation slide" },
  "4x3":                   { w: 1600, h: 1200, ratio: "4:3",    label: "4:3 slide / web tile" },
  "3x2":                   { w: 1500, h: 1000, ratio: "3:2",    label: "3:2 card / web tile" },
  "custom":                { w: 0,    h: 0,    ratio: "free",   label: "Custom dimensions" },
};

export const SIZE_GROUPS: { label: string; sizes: SizeName[] }[] = [
  { label: "Twitter/X",  sizes: ["twitter", "twitter-square"] },
  { label: "LinkedIn",   sizes: ["linkedin", "linkedin-square"] },
  { label: "Instagram",  sizes: ["instagram-sq", "instagram-port", "instagram-land"] },
  { label: "Facebook",   sizes: ["facebook-post", "facebook-square", "facebook-cover", "facebook-event", "facebook-group-cover"] },
  { label: "Threads",    sizes: ["threads-sq", "threads-port", "threads-land"] },
  { label: "Stories",    sizes: ["story"] },
  { label: "Web / Docs", sizes: ["og", "readme-hero", "slide-16x9", "4x3", "3x2"] },
  { label: "Custom",     sizes: ["custom"] },
];

export interface CounterConfig {
  format: string;
  position: "bottom-right" | "bottom-left" | "bottom-center" | "top-right";
  style: "pill" | "plain" | "dots";
}

export interface ThemeColors {
  background: string;
  headline: string;
  accent: string;
  body: string;
  label: string;
  "blockquote-border": string;
  "blockquote-text": string;
  "callout-bg": string;
  "callout-border": string;
  "bullet-dot": string;
  "slide-counter-bg": string;
  "slide-counter-text": string;
}

export interface Theme {
  name: string;
  displayName: string;
  colors: ThemeColors;
  typography: Record<string, string>;
  spacing: Record<string, string>;
}

export interface CardContent {
  $schema?: string;
  type?: "card";
  template: string;
  theme: string;
  size: SizeName;
  width?: number;
  height?: number;
  align?: "top" | "center" | "bottom" | "spread";
  eyebrow?: string;
  meta?: { title?: string; created?: string; tags?: string[] };
  blocks: Block[];
}

export interface Slide {
  id: string;
  label?: string;
  template?: string;
  theme?: string;
  size?: SizeName;
  width?: number;
  height?: number;
  align?: "top" | "center" | "bottom" | "spread";
  eyebrow?: string;
  showCounter?: boolean;
  counter?: CounterConfig;
  blocks: Block[];
}

export interface DeckContent {
  $schema?: string;
  type: "deck";
  meta?: { title?: string; created?: string; tags?: string[] };
  defaults: {
    template: string;
    theme: string;
    size: SizeName;
    width?: number;
    height?: number;
    align?: "top" | "center" | "bottom" | "spread";
    eyebrow?: string;
    showCounter?: boolean;
    counter?: CounterConfig;
  };
  slides: Slide[];
}

export type ContentMode = "card" | "deck";

export type Align = "top" | "center" | "bottom" | "spread";
