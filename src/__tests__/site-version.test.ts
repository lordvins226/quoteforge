import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function version(relPath: string): string {
  const pkg = JSON.parse(readFileSync(join(ROOT, relPath), "utf-8")) as {
    version?: string;
  };
  return pkg.version ?? "";
}

/**
 * The site is built with site/ as the Docker context, so vite.config.ts reads
 * site/package.json rather than the root manifest. The `version` npm lifecycle
 * script syncs the two during a release; this test catches a hand-edit that skips it.
 */
describe("site version tracks the root version", () => {
  test("site/package.json declares a version", () => {
    expect(version("site/package.json")).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("site/package.json matches the root version", () => {
    expect(version("site/package.json")).toBe(version("package.json"));
  });
});
