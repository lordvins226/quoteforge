#!/usr/bin/env bun
import { $ } from "bun";
import { mkdirSync, existsSync, rmSync, createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

interface Target {
  bunTarget: string;
  triple: string;
  archive: "tar.gz" | "zip";
  binExt: "" | ".exe";
}

const TARGETS: Target[] = [
  { bunTarget: "bun-darwin-arm64", triple: "aarch64-apple-darwin", archive: "tar.gz", binExt: "" },
  { bunTarget: "bun-darwin-x64", triple: "x86_64-apple-darwin", archive: "tar.gz", binExt: "" },
  { bunTarget: "bun-linux-x64", triple: "x86_64-unknown-linux-gnu", archive: "tar.gz", binExt: "" },
  { bunTarget: "bun-linux-arm64", triple: "aarch64-unknown-linux-gnu", archive: "tar.gz", binExt: "" },
  { bunTarget: "bun-windows-x64", triple: "x86_64-pc-windows-msvc", archive: "zip", binExt: ".exe" },
];

const DIST = resolve("dist");
const ENTRY = resolve("src/cli/index.ts");

async function sha256(file: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((res, rej) => {
    const s = createReadStream(file);
    s.on("data", (c) => hash.update(c));
    s.on("end", () => res());
    s.on("error", rej);
  });
  return hash.digest("hex");
}

async function adhocSignDarwin(binPath: string): Promise<void> {
  if (process.platform !== "darwin") {
    throw new Error("Darwin binaries must be ad-hoc signed on macOS with codesign.");
  }
  await $`codesign --sign - --force ${binPath}`;
}

async function tarGz(binPath: string, archivePath: string, binName: string): Promise<void> {
  const cwd = resolve(binPath, "..");
  await $`tar -czf ${archivePath} -C ${cwd} ${binName}`;
}

async function zip(binPath: string, archivePath: string, binName: string): Promise<void> {
  if (process.platform === "win32") {
    await $`powershell -NoProfile -Command Compress-Archive -Path ${binPath} -DestinationPath ${archivePath} -Force`;
    return;
  }
  const cwd = resolve(binPath, "..");
  await $`cd ${cwd} && zip -q ${archivePath} ${binName}`;
}

async function buildOne(target: Target): Promise<{ archive: string; sha256: string }> {
  const binName = `quoteforge${target.binExt}`;
  const buildDir = join(DIST, target.triple);
  mkdirSync(buildDir, { recursive: true });
  const binPath = join(buildDir, binName);

  console.log(`→ ${target.bunTarget}`);
  await $`bun build ${ENTRY} --compile --minify --target=${target.bunTarget} --outfile=${binPath}`.quiet();

  if (target.bunTarget.startsWith("bun-darwin-")) {
    await adhocSignDarwin(binPath);
  }

  const archiveName = target.archive === "tar.gz"
    ? `quoteforge-${target.triple}.tar.gz`
    : `quoteforge-${target.triple}.zip`;
  const archivePath = join(DIST, archiveName);
  if (existsSync(archivePath)) rmSync(archivePath);

  if (target.archive === "tar.gz") {
    await tarGz(binPath, archivePath, binName);
  } else {
    await zip(binPath, archivePath, binName);
  }

  const digest = await sha256(archivePath);
  await writeFile(`${archivePath}.sha256`, `${digest}  ${archiveName}\n`);
  console.log(`  ✓ ${archiveName}  ${digest.slice(0, 12)}…`);
  return { archive: archivePath, sha256: digest };
}

async function main(): Promise<void> {
  const only = process.argv[2];
  mkdirSync(DIST, { recursive: true });

  const results: { target: Target; archive: string; sha256: string }[] = [];
  for (const t of TARGETS) {
    if (only && only !== "all" && t.bunTarget !== only && t.triple !== only) continue;
    try {
      const out = await buildOne(t);
      results.push({ target: t, ...out });
    } catch (err) {
      if (only) throw err;
      console.warn(`  ⚠ ${t.bunTarget} failed: ${(err as Error).message}`);
    }
  }

  console.log(`\n${results.length}/${TARGETS.length} builds ok`);
  for (const r of results) {
    console.log(`  ${r.target.triple}  ${r.sha256}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
