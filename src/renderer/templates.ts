import { readdirSync } from "node:fs";
import { templatesDir } from "../assetBundle.js";

export function listTemplates(): string[] {
  const dir = templatesDir();
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

export function assertTemplateExists(name: string): void {
  const available = listTemplates();
  if (!available.includes(name)) {
    throw new Error(
      `Unknown template "${name}". Available: ${available.join(", ")}.`,
    );
  }
}
