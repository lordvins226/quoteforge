import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const rootPkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf-8"),
) as { version: string };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version),
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
