import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { listTemplates } from "../renderer/templates.js";

const ROOT = join(import.meta.dir, "..", "..");

describe("template catalog stays in sync across its three sources", () => {
  const onDisk = listTemplates();

  test("every template on disk is registered in assetBundle.ts", () => {
    const bundle = readFileSync(join(ROOT, "src", "assetBundle.ts"), "utf-8");

    const registered = [
      ...bundle.matchAll(/templates\/([a-z0-9-]+)\/template\.njk/g),
    ].map((m) => m[1]);
    const styled = [
      ...bundle.matchAll(/templates\/([a-z0-9-]+)\/style\.css/g),
    ].map((m) => m[1]);

    expect([...new Set(registered)].sort()).toEqual(onDisk);
    expect([...new Set(styled)].sort()).toEqual(onDisk);
  });

  test("studio TEMPLATE_FAMILIES lists every template exactly once", () => {
    const types = readFileSync(
      join(ROOT, "studio", "src", "types", "index.ts"),
      "utf-8",
    );

    const families = types.slice(types.indexOf("TEMPLATE_FAMILIES"));
    const names = [...families.matchAll(/\{ name: "([a-z0-9-]+)"/g)].map(
      (m) => m[1],
    );

    expect(names.length).toBe(new Set(names).size);
    expect([...names].sort()).toEqual(onDisk);
  });

  test("every template has a demo example", () => {
    const examples = listTemplates().map((name) =>
      join(ROOT, "content", "examples", `${name}-demo.json`),
    );

    const missing = examples.filter((path) => {
      try {
        readFileSync(path);
        return false;
      } catch {
        return true;
      }
    });

    expect(missing).toEqual([]);
  });
});
