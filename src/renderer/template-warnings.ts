import { readFileSync } from "node:fs";
import { join } from "node:path";

import { templatesDir } from "../assetBundle.js";

interface WarnableBlock {
  type: string;
  items?: unknown[];
}

interface WarnableCard {
  template: string;
  eyebrow?: string;
  blocks: WarnableBlock[];
}

const GRID_CELLS = 4;

function templateSource(template: string): string {
  try {
    return readFileSync(join(templatesDir(), template, "template.njk"), "utf-8");
  } catch {
    return "";
  }
}

/**
 * Non-fatal layout advice. A card that trips one of these still renders — the
 * result just will not look like the template intends.
 */
export function templateWarnings(card: WarnableCard): string[] {
  const warnings: string[] = [];

  if (card.template === "grid") {
    const cells = card.blocks
      .filter((b) => b.type === "bullet-list" || b.type === "callout")
      .reduce((n, b) => n + (b.items?.length ?? 0), 0);

    if (cells !== GRID_CELLS) {
      warnings.push(
        `Template "grid" lays out a 2×2 of ${GRID_CELLS} cells; this card has ${cells}. ` +
          `Rows will be uneven.`,
      );
    }
  }

  if (card.eyebrow !== undefined && !templateSource(card.template).includes("eyebrow")) {
    warnings.push(
      `Template "${card.template}" has no eyebrow slot — the "eyebrow" field will not render.`,
    );
  }

  return warnings;
}
