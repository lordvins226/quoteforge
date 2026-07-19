import { describe, test, expect } from "bun:test";
import { $ } from "bun";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { VERSION } from "../version.js";

const ROOT = resolve(import.meta.dir, "../..");

function packageVersion(): string {
  const raw = readFileSync(resolve(ROOT, "package.json"), "utf-8");
  return (JSON.parse(raw) as { version: string }).version;
}

describe("VERSION", () => {
  test("equals the version in package.json", () => {
    expect(VERSION).toBe(packageVersion());
  });
});

describe("CLI --version", () => {
  test("reports the version from package.json", async () => {
    const out = await $`bun run ${resolve(ROOT, "src/cli/index.ts")} --version`.text();
    expect(out.trim()).toBe(packageVersion());
  });
});
