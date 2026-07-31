import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, basename, join, dirname } from "node:path";
import { execFile } from "node:child_process";
import { detectAndValidate, ThemeSchema } from "../utils/validator.js";
import type { SizeName } from "../utils/validator.js";
import { renderCard } from "../../renderer/renderer.js";
import { resolveThemeRead } from "../../assetBundle.js";
import { resolveImageBlocks } from "../../renderer/image-resolver.js";
import { resolveDimensions } from "../../renderer/dimensions.js";
import { parseAspectRatio, computeSafeInset } from "../../renderer/safe-aspect.js";
import { templateWarnings } from "../../renderer/template-warnings.js";
import type { SafeInset } from "../../renderer/safe-aspect.js";

export const generateCommand = new Command("generate")
  .description("Generate a PNG from a card content JSON file")
  .argument("<file>", "Path to card content JSON file")
  .option("-t, --theme <name>", "Override theme")
  .option("-s, --size <name>", "Override size")
  .option("-o, --output <path>", "Output file path")
  .option("--scale <n>", "Pixel ratio", "2")
  .option("--open", "Open output file after generation")
  .option("--no-timestamp", "Omit timestamp from filename")
  .option("--fit-content", "Crop the output to the content bounding box plus theme padding")
  .option("--trim", "Alias for --fit-content")
  .option("--safe-aspect <ratio>", "Constrain layout to survive a center-crop toward this ratio (e.g. 4:3)")
  .action(async (file: string, opts: {
    theme?: string;
    size?: string;
    output?: string;
    scale: string;
    open?: boolean;
    timestamp: boolean;
    fitContent?: boolean;
    trim?: boolean;
    safeAspect?: string;
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
      console.error(chalk.red("✗ This file is a deck, not a single card."));
      console.error(chalk.dim(`  Try: quoteforge slides ${file}`));
      process.exit(1);
    }

    const card = resolveImageBlocks(result.data, dirname(filePath));
    const themeName = opts.theme ?? card.theme;
    const sizeName = (opts.size ?? card.size) as SizeName;
    const scale = parseInt(opts.scale, 10);

    const themePath = resolveThemeRead(themeName);
    if (!themePath) {
      console.error(chalk.red(`✗ Theme not found: ${themeName}`));
      process.exit(2);
    }
    const themeRaw = readFileSync(themePath, "utf-8");

    const theme = ThemeSchema.parse(JSON.parse(themeRaw));

    for (const warning of templateWarnings(card)) {
      console.warn(chalk.yellow(`⚠ ${warning}`));
    }

    console.log(chalk.dim(`Rendering ${basename(filePath)} with theme "${themeName}" at size "${sizeName}"…`));

    const fitContent = Boolean(opts.fitContent || opts.trim);

    let safeInset: SafeInset | undefined;
    if (opts.safeAspect) {
      let ratio: number;
      try {
        ratio = parseAspectRatio(opts.safeAspect);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`✗ ${msg}`));
        process.exit(1);
      }
      const dimensions = resolveDimensions({ size: sizeName, width: card.width, height: card.height });
      safeInset = computeSafeInset(dimensions, ratio);
    }

    let buf: Buffer;
    try {
      buf = await renderCard(card, theme, sizeName, scale, undefined, undefined, fitContent, safeInset);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`✗ ${msg}`));
      process.exit(1);
    }

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
