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

// Files prefixed with "_" stay out of the landing gallery: _og.json becomes public/og.png.
const jsonFiles = readdirSync(samplesSrc).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
if (jsonFiles.length === 0) {
  console.error("✗ no sample JSON files to render");
  process.exit(1);
}

console.log(`▸ rendering ${jsonFiles.length} landing samples...`);

function render(sourcePath: string, destPath: string): void {
  const pngOut = join(tmpOut, basename(destPath));

  const result = spawnSync(
    "bun",
    [
      "quoteforge",
      "generate",
      sourcePath,
      "--output",
      pngOut,
      "--no-timestamp",
    ],
    { cwd: repoRoot, stdio: "inherit" },
  );

  if (result.status !== 0) {
    console.error(`✗ failed to render ${basename(sourcePath)}`);
    process.exit(result.status ?? 1);
  }

  if (!existsSync(pngOut)) {
    console.error(`✗ expected output missing: ${pngOut}`);
    process.exit(1);
  }

  copyFileSync(pngOut, destPath);
}

for (const file of jsonFiles) {
  const name = basename(file, ".json");
  render(join(samplesSrc, file), join(publicOut, `${name}.png`));
  console.log(`  ✓ public/samples/${name}.png`);
}

const ogSrc = join(samplesSrc, "_og.json");
if (existsSync(ogSrc)) {
  render(ogSrc, join(siteDir, "public", "og.png"));
  console.log("  ✓ public/og.png");
}

const manifest = jsonFiles.map((f) => basename(f, ".json"));
writeFileSync(join(publicOut, "manifest.json"), JSON.stringify(manifest, null, 2));

rmSync(tmpOut, { recursive: true, force: true });
console.log(`✓ landing samples rendered to site/public/samples/`);
