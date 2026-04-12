import { readdirSync, mkdirSync, existsSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve, basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const siteDir = resolve(import.meta.dir, "..");
const repoRoot = resolve(siteDir, "..");
const samplesSrc = join(siteDir, "samples");
const publicOut = join(siteDir, "public", "samples");
const tmpOut = join(repoRoot, "outputs", "_site-samples");

if (!existsSync(samplesSrc)) {
  console.error(`✗ samples source not found: ${samplesSrc}`);
  process.exit(1);
}

mkdirSync(publicOut, { recursive: true });
mkdirSync(tmpOut, { recursive: true });

const jsonFiles = readdirSync(samplesSrc).filter((f) => f.endsWith(".json"));
if (jsonFiles.length === 0) {
  console.error("✗ no sample JSON files to render");
  process.exit(1);
}

console.log(`▸ rendering ${jsonFiles.length} landing samples…`);

for (const file of jsonFiles) {
  const filePath = join(samplesSrc, file);
  const name = basename(file, ".json");

  const pngOut = join(tmpOut, `${name}.png`);

  const result = spawnSync(
    "bun",
    [
      "quoteforge",
      "generate",
      filePath,
      "--output",
      pngOut,
      "--no-timestamp",
    ],
    { cwd: repoRoot, stdio: "inherit" },
  );

  if (result.status !== 0) {
    console.error(`✗ failed to render ${file}`);
    process.exit(result.status ?? 1);
  }

  if (!existsSync(pngOut)) {
    console.error(`✗ expected output missing: ${pngOut}`);
    process.exit(1);
  }

  copyFileSync(pngOut, join(publicOut, `${name}.png`));
  console.log(`  ✓ public/samples/${name}.png`);
}

const manifest = jsonFiles.map((f) => basename(f, ".json"));
writeFileSync(join(publicOut, "manifest.json"), JSON.stringify(manifest, null, 2));

rmSync(tmpOut, { recursive: true, force: true });
console.log(`✓ landing samples rendered to site/public/samples/`);
