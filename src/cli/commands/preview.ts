import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, watch } from "node:fs";
import { resolve, basename } from "node:path";
import { execFile } from "node:child_process";
import { detectAndValidate, ThemeSchema, SIZES } from "../utils/validator.js";
import { renderTemplate } from "../../renderer/template-engine.js";
import { themesDir, resolveThemeRead, userThemesDir } from "../../assetBundle.js";
import type { CardContent, DeckContent, Theme, SizeName } from "../utils/validator.js";

function loadTheme(name: string): Theme {
  const path = resolveThemeRead(name);
  if (!path) throw new Error(`Theme not found: ${name}`);
  const raw = readFileSync(path, "utf-8");
  return ThemeSchema.parse(JSON.parse(raw));
}

function buildPreviewHTML(
  content: CardContent,
  theme: Theme,
  size: SizeName,
  deckMode: boolean,
  slideIndex: number,
  totalSlides: number,
): string {
  const dimensions = SIZES[size] ?? { w: 1200, h: 675 };
  const cardHTML = renderTemplate(content, theme, dimensions, {
    slideIndex,
    slideTotal: totalSlides,
    showCounter: false,
  });
  const navBar = deckMode
    ? `<div id="nav" style="position:fixed;bottom:0;left:0;right:0;background:#111;padding:12px 24px;display:flex;align-items:center;justify-content:center;gap:16px;font-family:monospace;color:#aaa;font-size:14px;z-index:999">
        <button onclick="prev()" style="background:none;border:1px solid #555;color:#ccc;padding:4px 12px;border-radius:4px;cursor:pointer">◀</button>
        <span id="counter">${slideIndex + 1} / ${totalSlides}</span>
        <button onclick="next()" style="background:none;border:1px solid #555;color:#ccc;padding:4px 12px;border-radius:4px;cursor:pointer">▶</button>
      </div>
      <script>
        let slide = ${slideIndex};
        const total = ${totalSlides};
        function go(n) { slide = Math.max(0, Math.min(total-1, n)); location.href = '/?slide=' + (slide+1); }
        function prev() { go(slide-1); }
        function next() { go(slide+1); }
        document.addEventListener('keydown', e => {
          if (e.key === 'ArrowLeft') prev();
          if (e.key === 'ArrowRight') next();
        });
        const es = new EventSource('/sse');
        es.onmessage = () => location.reload();
      </script>`
    : `<script>
        const es = new EventSource('/sse');
        es.onmessage = () => location.reload();
      </script>`;

  return cardHTML.replace("</body>", `${navBar}</body>`);
}

export const previewCommand = new Command("preview")
  .description("Live browser preview with hot-reload")
  .argument("<file>", "Path to card or deck JSON file")
  .option("-p, --port <n>", "Port", "4242")
  .option("--no-open", "Don't auto-open browser")
  .option("--slide <n>", "Start on slide N for deck files (default: 1)", "1")
  .action(async (file: string, opts: {
    port: string;
    open: boolean;
    slide: string;
  }) => {
    const filePath = resolve(file);
    const port = parseInt(opts.port, 10);

    const sseClients = new Set<ReadableStreamDefaultController>();

    function notifyClients() {
      for (const ctrl of sseClients) {
        try { ctrl.enqueue("data: reload\n\n"); } catch { sseClients.delete(ctrl); }
      }
    }

    const server = Bun.serve({
      port,
      fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/sse") {
          const stream = new ReadableStream({
            start(controller) {
              sseClients.add(controller);
              req.signal.addEventListener("abort", () => sseClients.delete(controller));
            },
          });
          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }

        const raw = readFileSync(filePath, "utf-8");
        const json = JSON.parse(raw);
        const result = detectAndValidate(json);

        if (result.kind === "card") {
          const theme = loadTheme(result.data.theme);
          const html = buildPreviewHTML(result.data, theme, result.data.size, false, 0, 1);
          return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        const deck = result.data;
        const slideParam = url.searchParams.get("slide");
        const slideIdx = slideParam ? parseInt(slideParam, 10) - 1 : 0;
        const clampedIdx = Math.max(0, Math.min(deck.slides.length - 1, slideIdx));
        const slide = deck.slides[clampedIdx];
        if (!slide) {
          return new Response("Slide not found", { status: 404 });
        }

        const themeName = slide.theme ?? deck.defaults.theme;
        const theme = loadTheme(themeName);
        const cardContent: CardContent = {
          template: slide.template ?? deck.defaults.template,
          theme: themeName,
          size: slide.size ?? deck.defaults.size,
          blocks: slide.blocks,
        };

        const sizeName = (slide.size ?? deck.defaults.size) as SizeName;
        const html = buildPreviewHTML(cardContent, theme, sizeName, true, clampedIdx, deck.slides.length);
        return new Response(html, { headers: { "Content-Type": "text/html" } });
      },
    });

    console.log(chalk.green(`✓ Preview server running at`), chalk.bold(`http://localhost:${port}`));
    console.log(chalk.dim(`  Watching: ${basename(filePath)}`));
    console.log(chalk.dim("  Press Ctrl+C to stop.\n"));

    watch(filePath, () => {
      console.log(chalk.dim(`  ↻ File changed, reloading…`));
      notifyClients();
    });

    const onThemeChange = () => {
      console.log(chalk.dim(`  ↻ Theme changed, reloading…`));
      notifyClients();
    };
    watch(themesDir(), onThemeChange);
    try {
      watch(userThemesDir(), onThemeChange);
    } catch {
      // user themes dir may not exist yet in some modes
    }

    if (opts.open) {
      const startSlide = parseInt(opts.slide, 10);
      const url = startSlide > 1 ? `http://localhost:${port}/?slide=${startSlide}` : `http://localhost:${port}`;
      execFile("open", [url]);
    }
  });
