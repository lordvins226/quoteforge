import { Command } from "commander";
import chalk from "chalk";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectAndValidate } from "../utils/validator.js";

export const validateCommand = new Command("validate")
  .description("Validate a card or deck JSON file against QuoteForge schemas")
  .argument("<file>", "Path to card or deck JSON file")
  .action((file: string) => {
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

    try {
      const result = detectAndValidate(json);
      console.log(
        chalk.green(`✓ Valid ${result.kind} file:`),
        chalk.dim(filePath),
      );
    } catch (err: unknown) {
      console.error(chalk.red(`✗ Validation failed for: ${filePath}\n`));
      if (err instanceof Error) {
        console.error(chalk.yellow(err.message));
      }
      process.exit(1);
    }
  });
