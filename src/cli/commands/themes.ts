import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { ThemeSchema } from "../utils/validator.js";
import { listAllThemes, resolveThemeRead, resolveThemeWrite } from "../../assetBundle.js";

function loadAllThemes() {
  return listAllThemes().map(({ name, source, path }) => {
    const raw = readFileSync(path, "utf-8");
    return { file: `${name}.json`, source, theme: ThemeSchema.parse(JSON.parse(raw)) };
  });
}

const listCmd = new Command("list")
  .description("List all available themes")
  .action(() => {
    const themes = loadAllThemes();
    if (themes.length === 0) {
      console.log(chalk.dim("No themes found."));
      return;
    }

    const rows = themes.map(({ file, source, theme }) => ({
      slug: basename(file, ".json"),
      name: theme.displayName,
      source,
      colors: [
        theme.colors.background,
        theme.colors.headline,
        theme.colors.accent,
        theme.colors.body,
        theme.colors.label,
      ],
      fonts: `${theme.typography["font-headline"]} · ${theme.typography["font-body"]}`,
    }));

    const nameWidth = Math.max(...rows.map((r) => r.name.length));
    const slugWidth = Math.max(...rows.map((r) => r.slug.length));
    const userCount = rows.filter((r) => r.source === "user").length;

    console.log();
    console.log(
      chalk.bold(`  Themes`) +
        chalk.dim(`  ${rows.length} total${userCount ? ` · ${userCount} user` : ""}`),
    );
    console.log(chalk.dim("  ────────────────────────────────────────────────────────────"));

    for (const row of rows) {
      const swatch = row.colors.map((c) => chalk.hex(c)("██")).join(" ");
      const name = chalk.bold(row.name.padEnd(nameWidth));
      const slug = chalk.dim(row.slug.padEnd(slugWidth));
      const fonts = chalk.dim(row.fonts);
      const tag = row.source === "user" ? chalk.cyan(" ●") : "";
      console.log(`  ${swatch}  ${name}  ${slug}  ${fonts}${tag}`);
    }

    if (userCount > 0) {
      console.log(chalk.dim(`\n  ${chalk.cyan("●")} user theme`));
    }
    console.log();
  });

const showCmd = new Command("show")
  .description("Show details of a specific theme")
  .argument("<name>", "Theme name")
  .action((name: string) => {
    const themePath = resolveThemeRead(name);
    if (!themePath) {
      console.error(chalk.red(`✗ Theme not found: ${name}`));
      process.exit(2);
    }
    const raw = readFileSync(themePath, "utf-8");
    const theme = ThemeSchema.parse(JSON.parse(raw));
    console.log(chalk.bold(`\n${theme.displayName}\n`));
    console.log(chalk.dim("Colors:"));
    for (const [key, val] of Object.entries(theme.colors)) {
      console.log(`  ${chalk.hex(val)("██")} ${key}: ${chalk.dim(val)}`);
    }
    console.log(chalk.dim("\nTypography:"));
    for (const [key, val] of Object.entries(theme.typography)) {
      console.log(`  ${key}: ${chalk.dim(val)}`);
    }
    console.log(chalk.dim("\nSpacing:"));
    for (const [key, val] of Object.entries(theme.spacing)) {
      console.log(`  ${key}: ${chalk.dim(val)}`);
    }
    console.log();
  });

const createCmd = new Command("create")
  .description("Create a new theme from scratch")
  .argument("<name>", "Theme name (kebab-case)")
  .action((name: string) => {
    if (resolveThemeRead(name)) {
      console.error(chalk.red(`✗ Theme already exists: ${name}`));
      process.exit(1);
    }
    const themePath = resolveThemeWrite(name);
    const template = {
      name,
      displayName: name.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" "),
      colors: {
        background: "#1a1a1a",
        headline: "#ffffff",
        accent: "#00ff88",
        body: "#cccccc",
        label: "#00ff88",
        "blockquote-border": "#00ff88",
        "blockquote-text": "#dddddd",
        "callout-bg": "#252525",
        "callout-border": "#333333",
        "bullet-dot": "#00ff88",
        "slide-counter-bg": "#00000066",
        "slide-counter-text": "#ffffff",
      },
      typography: {
        "font-headline": "Inter",
        "font-headline-url": "https://fonts.googleapis.com/css2?family=Inter:wght@700",
        "font-body": "Inter",
        "font-body-url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;700",
        "headline-size": "clamp(3rem, 7vw, 5rem)",
        "body-size": "1rem",
        "line-height": "1.5",
      },
      spacing: {
        padding: "64px",
        "block-gap": "2rem",
      },
    };
    writeFileSync(themePath, JSON.stringify(template, null, 2) + "\n");
    console.log(chalk.green(`✓ Created theme:`), chalk.dim(themePath));
    console.log(chalk.dim("  Edit the file to customize colors, fonts, and spacing."));
  });

const duplicateCmd = new Command("duplicate")
  .description("Duplicate an existing theme with a new name")
  .argument("<source>", "Source theme name")
  .argument("<new-name>", "New theme name")
  .action((source: string, newName: string) => {
    const srcPath = resolveThemeRead(source);
    if (!srcPath) {
      console.error(chalk.red(`✗ Source theme not found: ${source}`));
      process.exit(2);
    }
    if (resolveThemeRead(newName)) {
      console.error(chalk.red(`✗ Theme already exists: ${newName}`));
      process.exit(1);
    }
    const destPath = resolveThemeWrite(newName);
    const raw = readFileSync(srcPath, "utf-8");
    const theme = JSON.parse(raw);
    theme.name = newName;
    theme.displayName = newName.split("-").map((w: string) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
    writeFileSync(destPath, JSON.stringify(theme, null, 2) + "\n");
    console.log(chalk.green(`✓ Duplicated ${source} →`), chalk.dim(destPath));
  });

const validateCmd = new Command("validate")
  .description("Validate a theme JSON file")
  .argument("<file>", "Theme file path")
  .action((file: string) => {
    const filePath = resolve(file);
    const raw = readFileSync(filePath, "utf-8");
    try {
      ThemeSchema.parse(JSON.parse(raw));
      console.log(chalk.green("✓ Valid theme:"), chalk.dim(filePath));
    } catch (err: unknown) {
      console.error(chalk.red("✗ Invalid theme:"), chalk.dim(filePath));
      if (err instanceof Error) console.error(chalk.red(err.message));
      process.exit(1);
    }
  });

export const themesCommand = new Command("themes")
  .description("Theme management commands")
  .addCommand(listCmd)
  .addCommand(showCmd)
  .addCommand(createCmd)
  .addCommand(duplicateCmd)
  .addCommand(validateCmd);
