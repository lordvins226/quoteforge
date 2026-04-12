import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { resolve, basename, join } from "node:path";
import { detectAndValidate, ThemeSchema } from "../utils/validator.js";
import type { SizeName } from "../utils/validator.js";
import { renderCard } from "../../renderer/renderer.js";
import { renderDeck } from "../../renderer/slide-renderer.js";
import { buildZip } from "../utils/zip.js";
import { resolveThemeRead } from "../../assetBundle.js";

export const batchCommand = new Command("batch")
  .description("Generate PNGs from a directory of card/deck JSON files")
  .argument("<directory>", "Directory containing JSON files")
  .option("-t, --theme <name>", "Override theme for all files")
  .option("-s, --size <name>", "Override size for all files")
  .option("-o, --output <dir>", "Output directory")
  .option("--concurrency <n>", "Parallel workers", "2")
  .option("--decks", "Also process deck files into individual ZIPs")
  .action(async (directory: string, opts: {
    theme?: string;
    size?: string;
    output?: string;
    concurrency: string;
    decks?: boolean;
  }) => {
    const dir = resolve(directory);
    const files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));

    if (files.length === 0) {
      console.error(chalk.red(`✗ No JSON files found in: ${dir}`));
      console.error(chalk.dim("  Check the path or try: quoteforge batch content/examples/"));
      process.exit(1);
    }

    const outputDir = opts.output ? resolve(opts.output) : resolve("outputs");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const concurrency = parseInt(opts.concurrency, 10);
    let processed = 0;
    let skipped = 0;

    console.log(chalk.dim(`Processing ${files.length} file(s) from ${dir}…\n`));

    for (const file of files) {
      const filePath = join(dir, file);
      const raw = readFileSync(filePath, "utf-8");

      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        console.warn(chalk.yellow(`  ⚠ Skipping invalid JSON: ${file}`));
        skipped++;
        continue;
      }

      try {
        const result = detectAndValidate(json);

        if (result.kind === "card") {
          const card = result.data;
          const themeName = opts.theme ?? card.theme;
          const sizeName = (opts.size ?? card.size) as SizeName;
          const themePath = resolveThemeRead(themeName);
          if (!themePath) throw new Error(`Theme not found: ${themeName}`);
          const theme = ThemeSchema.parse(JSON.parse(readFileSync(themePath, "utf-8")));

          const buf = await renderCard(card, theme, sizeName);
          const outPath = join(outputDir, `${basename(file, ".json")}.png`);
          writeFileSync(outPath, buf);
          console.log(chalk.green("  ✓"), chalk.dim(outPath));
          processed++;
        } else if (result.kind === "deck") {
          if (!opts.decks) {
            console.log(chalk.dim(`  ⏭ Skipping deck: ${file} (use --decks to include)`));
            skipped++;
            continue;
          }

          const deck = result.data;
          const deckName = basename(file, ".json");
          const deckDir = join(outputDir, deckName);
          if (!existsSync(deckDir)) {
            mkdirSync(deckDir, { recursive: true });
          }

          const { buffers, names } = await renderDeck(deck, {
            sizeOverride: opts.size as SizeName | undefined,
            themeOverride: opts.theme,
            concurrency,
          });

          for (let i = 0; i < buffers.length; i++) {
            const buf = buffers[i];
            const name = names[i];
            if (buf && name) {
              writeFileSync(join(deckDir, name), buf);
            }
          }

          const zipBuf = await buildZip(buffers, names);
          writeFileSync(join(outputDir, `${deckName}.zip`), zipBuf);
          console.log(chalk.green("  ✓"), chalk.dim(`${deckName}/ (${buffers.length} slides + ZIP)`));
          processed++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(chalk.yellow(`  ⚠ Failed: ${file} — ${msg}`));
        skipped++;
      }
    }

    console.log(
      chalk.green(`\n✓ Done.`),
      chalk.dim(`${processed} processed, ${skipped} skipped.`),
    );
  });
