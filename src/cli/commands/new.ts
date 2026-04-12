import { Command } from "commander";
import chalk from "chalk";
import * as clack from "@clack/prompts";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { listAllThemes } from "../../assetBundle.js";

function getAvailableThemes(): string[] {
  return listAllThemes().map((t) => t.name);
}

const TEMPLATES = ["manifesto", "quote", "list", "minimal"];

export const newCommand = new Command("new")
  .description("Interactively create a new card or deck JSON file")
  .option("--type <type>", "card or deck")
  .option("--template <name>", "Template name")
  .option("--theme <name>", "Theme name")
  .option("--slides <n>", "Number of blank slides (deck only, default: 5)", "5")
  .option("--size <name>", "Size name")
  .option("--name <filename>", "Output filename (without .json)")
  .action(async (opts: {
    type?: string;
    template?: string;
    theme?: string;
    slides: string;
    size?: string;
    name?: string;
  }) => {
    clack.intro(chalk.bold("QuoteForge — Create new content"));

    const type = opts.type ?? await clack.select({
      message: "What do you want to create?",
      options: [
        { value: "card", label: "Card — single content card" },
        { value: "deck", label: "Deck — multi-slide carousel" },
      ],
    });

    if (clack.isCancel(type)) {
      clack.cancel("Cancelled.");
      process.exit(0);
    }

    const template = opts.template ?? await clack.select({
      message: "Pick a template:",
      options: TEMPLATES.map((t) => ({ value: t, label: t })),
    });

    if (clack.isCancel(template)) {
      clack.cancel("Cancelled.");
      process.exit(0);
    }

    const themes = getAvailableThemes();
    const theme = opts.theme ?? await clack.select({
      message: "Pick a theme:",
      options: themes.map((t) => ({ value: t, label: t })),
    });

    if (clack.isCancel(theme)) {
      clack.cancel("Cancelled.");
      process.exit(0);
    }

    const size = opts.size ?? await clack.select({
      message: "Pick a size:",
      options: [
        { value: "twitter", label: "Twitter (1200×675)" },
        { value: "instagram-sq", label: "Instagram square (1080×1080)" },
        { value: "instagram-port", label: "Instagram portrait (1080×1350)" },
        { value: "linkedin", label: "LinkedIn (1200×627)" },
        { value: "facebook-post", label: "Facebook post (1200×630)" },
        { value: "facebook-square", label: "Facebook square (1080×1080)" },
        { value: "story", label: "Story (1080×1920)" },
      ],
    });

    if (clack.isCancel(size)) {
      clack.cancel("Cancelled.");
      process.exit(0);
    }

    const name = opts.name ?? await clack.text({
      message: "Filename (without .json):",
      placeholder: type === "deck" ? "my-deck" : "my-card",
      validate: (val) => {
        if (!val.trim()) return "Name is required";
        if (!/^[a-z0-9-]+$/.test(val)) return "Use kebab-case (lowercase, hyphens only)";
        return undefined;
      },
    });

    if (clack.isCancel(name)) {
      clack.cancel("Cancelled.");
      process.exit(0);
    }

    const dir = type === "deck" ? "decks" : "content";
    const outPath = resolve(dir, `${name}.json`);

    if (existsSync(outPath)) {
      console.error(chalk.red(`✗ File already exists: ${outPath}`));
      process.exit(1);
    }

    let content: Record<string, unknown>;

    if (type === "deck") {
      const slideCount = parseInt(opts.slides, 10);
      const slides = Array.from({ length: slideCount }, (_, i) => ({
        id: `slide-${String(i + 1).padStart(2, "0")}`,
        label: i === 0 ? "Cover" : i === slideCount - 1 ? "CTA" : `Slide ${i + 1}`,
        blocks: [
          {
            type: "headline",
            parts: [{ text: `Slide ${i + 1}`, style: "normal" }],
          },
          { type: "text", content: "Edit this slide content." },
        ],
      }));

      content = {
        type: "deck",
        meta: { title: name, created: new Date().toISOString().split("T")[0] },
        defaults: {
          template,
          theme,
          size,
          showCounter: true,
          counter: {
            format: "{current} / {total}",
            position: "bottom-right",
            style: "pill",
          },
        },
        slides,
      };
    } else {
      content = {
        template,
        theme,
        size,
        meta: { title: name, created: new Date().toISOString().split("T")[0] },
        blocks: [
          {
            id: "headline",
            type: "headline",
            parts: [{ text: "Your headline here.", style: "normal" }],
          },
          {
            id: "body",
            type: "text",
            content: "Edit this content to build your card.",
          },
        ],
      };
    }

    writeFileSync(outPath, JSON.stringify(content, null, 2) + "\n");
    clack.outro(chalk.green(`✓ Created: ${outPath}`));
  });
