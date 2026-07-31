import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Read the site's own manifest, never the root one: the deploy platform builds
// with site/ as the Docker context, so nothing above this directory exists.
// The root release script keeps this version in sync, and a test guards the drift.
const sitePkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
) as { version: string };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(sitePkg.version),
  },
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: { dark: "github-dark-dimmed", light: "github-light" },
              keepBackground: false,
            },
          ],
        ],
        providerImportSource: "@mdx-js/react",
      }),
    },
    react(),
    tailwind(),
  ],
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
