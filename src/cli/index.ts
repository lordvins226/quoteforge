#!/usr/bin/env bun
import { Command } from "commander";
import { validateCommand } from "./commands/validate.js";
import { generateCommand } from "./commands/generate.js";
import { slidesCommand } from "./commands/slides.js";
import { themesCommand } from "./commands/themes.js";
import { newCommand } from "./commands/new.js";
import { previewCommand } from "./commands/preview.js";
import { batchCommand } from "./commands/batch.js";

const program = new Command();

program
  .name("quoteforge")
  .description("Developer-native typographic social media card + carousel generator")
  .version("0.1.0");

program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(slidesCommand);
program.addCommand(themesCommand);
program.addCommand(newCommand);
program.addCommand(previewCommand);
program.addCommand(batchCommand);

program.parseAsync();
