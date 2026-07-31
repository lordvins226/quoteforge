#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const SITE_PKG = resolve(ROOT, "site/package.json");

const rootVersion = (
  JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8")) as {
    version: string;
  }
).version;

const raw = readFileSync(SITE_PKG, "utf-8");
const updated = raw.replace(
  /("version":\s*")[^"]*(")/,
  `$1${rootVersion}$2`,
);

if (updated === raw) {
  console.log(`site/package.json already at ${rootVersion}`);
} else {
  writeFileSync(SITE_PKG, updated);
  console.log(`site/package.json → ${rootVersion}`);
}
