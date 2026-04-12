export type PartStyle = "normal" | "bold" | "italic" | "accent" | "accent-italic" | "mono" | "muted";

export interface Part {
  text: string;
  style: PartStyle;
}

export interface LabeledItem {
  label: string;
  text: string;
}

export type BlockType = "headline" | "blockquote" | "text" | "bullet-list" | "callout" | "divider" | "spacer";

export type Block =
  | { type: "headline"; id?: string; parts: Part[] }
  | { type: "blockquote"; id?: string; parts: Part[] }
  | { type: "text"; id?: string; content: string }
  | { type: "bullet-list"; id?: string; items: LabeledItem[] }
  | { type: "callout"; id?: string; items: LabeledItem[] }
  | { type: "divider"; id?: string }
  | { type: "spacer"; id?: string; size: "sm" | "md" | "lg" };

export type SizeName =
  | "twitter" | "twitter-square"
  | "linkedin" | "linkedin-square"
  | "instagram-sq" | "instagram-port" | "instagram-land"
  | "facebook-post" | "facebook-square" | "facebook-cover"
  | "facebook-event" | "facebook-group-cover"
  | "story" | "custom";

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
  "story":                 { w: 1080, h: 1920, ratio: "9:16",   label: "Story (IG / FB / TW)" },
  "custom":                { w: 0,    h: 0,    ratio: "free",   label: "Custom dimensions" },
};

export const SIZE_GROUPS: { label: string; sizes: SizeName[] }[] = [
  { label: "Twitter/X",  sizes: ["twitter", "twitter-square"] },
  { label: "LinkedIn",   sizes: ["linkedin", "linkedin-square"] },
  { label: "Instagram",  sizes: ["instagram-sq", "instagram-port", "instagram-land"] },
  { label: "Facebook",   sizes: ["facebook-post", "facebook-square", "facebook-cover", "facebook-event", "facebook-group-cover"] },
  { label: "Stories",    sizes: ["story"] },
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
  meta?: { title?: string; created?: string; tags?: string[] };
  blocks: Block[];
}

export interface Slide {
  id: string;
  label?: string;
  template?: string;
  theme?: string;
  size?: SizeName;
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
    showCounter?: boolean;
    counter?: CounterConfig;
  };
  slides: Slide[];
}

export type ContentMode = "card" | "deck";
