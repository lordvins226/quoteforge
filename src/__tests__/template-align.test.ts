import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { listTemplates } from "../renderer/templates.js";
import { templatesDir } from "../assetBundle.js";

/**
 * A template whose content lives in a full-height inner body (`flex: 1 1 auto`)
 * strands the card's `align-*` class: the body eats the free space, so the
 * card has nothing left to distribute. Such a body must defer to
 * `--content-justify`, which `_base.css` derives from the align class.
 */
function offendingRules(css: string): string[] {
  const rules = css.match(/\{[^}]*\}/g) ?? [];
  return rules.filter((rule) => {
    if (!/flex:\s*1\s+1\s+auto/.test(rule)) return false;

    const declarations = [...rule.matchAll(/justify-content:([^;]*)/g)].map(
      (m) => m[1]!.trim(),
    );

    return declarations.some((value) => !value.startsWith("var(--content-justify"));
  });
}

describe("vertical alignment reaches every template", () => {
  test("_base.css derives --content-justify from each align class", () => {
    const base = readFileSync(join(templatesDir(), "_base.css"), "utf-8");

    for (const align of ["top", "center", "bottom", "spread"]) {
      const rule = base.match(new RegExp(`\\.card\\.align-${align}\\s*\\{[^}]*\\}`));
      expect(rule?.[0]).toContain("--content-justify");
    }
  });

  test("no template hardcodes justify-content on a full-height body", () => {
    const offenders = listTemplates().filter((name) => {
      const css = readFileSync(join(templatesDir(), name, "style.css"), "utf-8");
      return offendingRules(css).length > 0;
    });

    expect(offenders).toEqual([]);
  });
});
