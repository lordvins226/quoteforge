import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, basename, join } from "node:path";
import { execFile } from "node:child_process";
import { detectAndValidate, ThemeSchema } from "../utils/validator.js";
import type { SizeName } from "../utils/validator.js";
import { renderCard } from "../../renderer/renderer.js";

export const generateCommand = new Command("generate")
  .description("Generate a PNG from a card content JSON file")
  .argument("<file>", "Path to card content JSON file")
  .option("-t, --theme <name>", "Override theme")
  .option("-s, --size <name>", "Override size")
  .option("-o, --output <path>", "Output file path")
  .option("--scale <n>", "Pixel ratio (default: 2)", "2")
  .option("--open", "Open output file after generation")
  .option("--no-timestamp", "Omit timestamp from filename")
  .action(async (file: string, opts: {
    theme?: string;
    size?: string;
    output?: string;
    scale: string;
    open?: boolean;
    timestamp: boolean;
  }) => {
    const filePath = resolve(file);

    let raw: string;
    try {
      raw = readFileSync(filePath, "utf-8");
    } catch {
      console.error(chalk.red(`✗ Could not read file: ${filePath}`));
      process.exit(1);
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      console.error(chalk.red(`✗ Invalid JSON in: ${filePath}`));
      process.exit(1);
    }

    const result = detectAndValidate(json);
    if (result.kind !== "card") {
      console.error(chalk.red("✗ File is a deck, not a card. Use `slides` command instead."));
      process.exit(1);
    }

    const card = result.data;
    const themeName = opts.theme ?? card.theme;
    const sizeName = (opts.size ?? card.size) as SizeName;
    const scale = parseInt(opts.scale, 10);

    const themePath = resolve("themes", `${themeName}.json`);
    let themeRaw: string;
    try {
      themeRaw = readFileSync(themePath, "utf-8");
    } catch {
      console.error(chalk.red(`✗ Theme not found: ${themeName}`));
      process.exit(2);
    }

    const theme = ThemeSchema.parse(JSON.parse(themeRaw));

    console.log(chalk.dim(`Rendering ${basename(filePath)} with theme "${themeName}" at size "${sizeName}"…`));

    const buf = await renderCard(card, theme, sizeName, scale);

    const outputDir = resolve("outputs");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    let outputPath: string;
    if (opts.output) {
      outputPath = resolve(opts.output);
    } else {
      const base = basename(filePath, ".json");
      const ts = opts.timestamp ? `-${Date.now()}` : "";
      outputPath = join(outputDir, `${base}${ts}.png`);
    }

    writeFileSync(outputPath, buf);
    console.log(chalk.green(`✓ Saved:`), chalk.dim(outputPath));

    if (opts.open) {
      execFile("open", [outputPath]);
    }
  });
