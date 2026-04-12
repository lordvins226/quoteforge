import { Command } from "commander";
import chalk from "chalk";
import { ensureAssets, assetBundleVersion, listBundledThemes, listAllThemes, userThemesDir } from "../../assetBundle.js";
import { resolveChrome } from "../../renderer/browser-resolver.js";

export const doctorCommand = new Command("doctor")
  .description("Report environment, Chrome, and asset status")
  .action(async () => {
    console.log(chalk.bold(`\nQuoteForge ${assetBundleVersion()}\n`));

    const assets = ensureAssets();
    console.log(chalk.dim("Assets:"));
    console.log(`  mode:      ${assets.mode}`);
    console.log(`  templates: ${assets.templatesDir}`);
    console.log(`  themes:    ${assets.themesDir}`);
    const all = listAllThemes();
    const userCount = all.filter((t) => t.source === "user").length;
    console.log(`  bundled:   ${listBundledThemes().length} themes`);
    if (assets.mode === "cache") {
      console.log(`  user dir:  ${userThemesDir()}`);
      console.log(`  user:      ${userCount} themes`);
    }

    console.log(chalk.dim("\nChrome:"));
    try {
      const chrome = await resolveChrome();
      console.log(`  source:    ${chrome.source}`);
      console.log(`  path:      ${chrome.executablePath}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  ✗ ${msg}`));
      console.log(chalk.dim("  hint: set $QUOTEFORGE_CHROME to an existing Chrome executable"));
      process.exit(1);
    }

    console.log(chalk.dim("\nRuntime:"));
    console.log(`  platform:  ${process.platform} ${process.arch}`);
    console.log(`  node:      ${process.version}`);
    if (typeof Bun !== "undefined") {
      console.log(`  bun:       ${Bun.version}`);
    }

    console.log(chalk.green("\n✓ Ready.\n"));
  });
