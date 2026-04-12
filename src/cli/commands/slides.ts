import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, basename, join } from "node:path";
import { detectAndValidate } from "../utils/validator.js";
import { renderDeck } from "../../renderer/slide-renderer.js";
import { buildZip } from "../utils/zip.js";

export const slidesCommand = new Command("slides")
  .description("Generate numbered PNGs + ZIP from a deck JSON file")
  .argument("<file>", "Path to deck JSON file")
  .option("-t, --theme <name>", "Override theme for all slides")
  .option("-s, --size <name>", "Override size for all slides")
  .option("-o, --output <dir>", "Output directory")
  .option("--slide <n>", "Render only slide N (1-indexed), no ZIP")
  .option("--no-zip", "Skip ZIP creation")
  .option("--no-counter", "Disable counter overlay for all slides")
  .option("--concurrency <n>", "Parallel render workers", "4")
  .option("--scale <n>", "Pixel ratio", "2")
  .option("--open", "Open output folder after generation")
  .action(async (file: string, opts: {
    theme?: string;
    size?: string;
    output?: string;
    slide?: string;
    zip: boolean;
    counter: boolean;
    concurrency: string;
    scale: string;
    open?: boolean;
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
    if (result.kind !== "deck") {
      console.error(chalk.red("✗ This file is a single card, not a deck."));
      console.error(chalk.dim(`  Try: bun quoteforge generate ${file}`));
      process.exit(1);
    }

    const deck = result.data;

    if (opts.slide) {
      const idx = parseInt(opts.slide, 10);
      if (isNaN(idx) || idx < 1 || idx > deck.slides.length) {
        console.error(chalk.red(`✗ Slide index out of range: ${opts.slide} (deck has ${deck.slides.length} slides)`));
        process.exit(1);
      }
    }

    const resolvedSize = opts.size ?? deck.defaults.size;
    if (resolvedSize && !resolvedSize.includes("square") && resolvedSize !== "instagram-sq") {
      const isFacebook = resolvedSize.startsWith("facebook");
      if (isFacebook) {
        console.warn(chalk.yellow(`⚠ Facebook carousels render best with facebook-square (1080×1080). Current size: ${resolvedSize}`));
      }
    }

    const slideIndex = opts.slide ? parseInt(opts.slide, 10) - 1 : undefined;
    const concurrency = parseInt(opts.concurrency, 10);
    const scale = parseInt(opts.scale, 10);

    const totalSlides = slideIndex !== undefined ? 1 : deck.slides.length;
    console.log(chalk.dim(`Rendering ${totalSlides} slide${totalSlides > 1 ? "s" : ""} from ${basename(filePath)}…`));

    const { buffers, names } = await renderDeck(deck, {
      sizeOverride: opts.size as typeof deck.defaults.size | undefined,
      themeOverride: opts.theme,
      slideIndex,
      noCounter: !opts.counter,
      concurrency,
      scale,
    });

    const deckName = basename(filePath, ".json");
    const outputDir = opts.output ? resolve(opts.output) : resolve("outputs", deckName);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 0; i < buffers.length; i++) {
      const buf = buffers[i];
      const name = names[i];
      if (buf && name) {
        const outPath = join(outputDir, name);
        writeFileSync(outPath, buf);
        console.log(chalk.green(`  ✓`), chalk.dim(outPath));
      }
    }

    if (opts.zip && slideIndex === undefined && buffers.length > 1) {
      const zipBuf = await buildZip(buffers, names);
      const zipPath = resolve("outputs", `${deckName}.zip`);
      writeFileSync(zipPath, zipBuf);
      console.log(chalk.green(`  ✓ ZIP:`), chalk.dim(zipPath));
    }

    console.log(chalk.green(`✓ Done.`));

    if (opts.open) {
      const { execFile } = await import("node:child_process");
      execFile("open", [outputDir]);
    }
  });
