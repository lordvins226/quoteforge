#!/usr/bin/env bun
import { Command } from "commander";
import { validateCommand } from "./commands/validate.js";
import { generateCommand } from "./commands/generate.js";

const program = new Command();

program
  .name("quoteforge")
  .description("Developer-native typographic social media card + carousel generator")
  .version("0.1.0");

program.addCommand(validateCommand);
program.addCommand(generateCommand);

program.parseAsync();
