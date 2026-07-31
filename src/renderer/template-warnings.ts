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
 * The block types a template actually renders, read from its own `block.type ==`
 * guards so the answer cannot drift from the markup. Every shipped template
 * dispatches this way and none has a catch-all `{% else %}`, so a type absent
 * here is genuinely dropped. Scanning the whole file rather than a single loop
 * keeps the set over-permissive on purpose: a missed warning costs less than one
 * that cries about a card which renders fine.
 *
 * Returns undefined when the template is unknown or dispatches some other way —
 * callers stay quiet rather than guess.
 */
function handledBlockTypes(template: string): Set<string> | undefined {
  const matches = templateSource(template).matchAll(/block\.type\s*==\s*"([a-z-]+)"/g);
  const types = new Set([...matches].map((m) => m[1] as string));
  return types.size > 0 ? types : undefined;
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

  const handled = handledBlockTypes(card.template);
  if (handled) {
    const dropped = [...new Set(card.blocks.map((b) => b.type))].filter(
      (type) => !handled.has(type),
    );

    if (dropped.length > 0) {
      const list = dropped.map((type) => `"${type}"`).join(", ");
      warnings.push(
        `Template "${card.template}" does not render ${list} — that content will not appear ` +
          `in the image. Pick a template that handles it, or move the text into a block the ` +
          `template renders.`,
      );
    }
  }

  return warnings;
}
