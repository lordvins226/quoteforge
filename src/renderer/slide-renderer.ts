import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderCard, launchBrowser } from "./renderer.js";
import type { RenderMeta } from "./template-engine.js";
import type { DeckContent, Theme, SizeName, CardContent } from "../cli/utils/validator.js";
import { ThemeSchema } from "../cli/utils/validator.js";

export interface SlideRenderOptions {
  sizeOverride?: SizeName;
  themeOverride?: string;
  slideIndex?: number;
  noCounter?: boolean;
  concurrency?: number;
  scale?: number;
}

function loadTheme(name: string): Theme {
  const themePath = resolve("themes", `${name}.json`);
  const raw = readFileSync(themePath, "utf-8");
  return ThemeSchema.parse(JSON.parse(raw));
}

async function semaphore<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      const task = tasks[index];
      if (task) {
        results[index] = await task();
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
  await Promise.all(workers);
  return results;
}

export async function renderDeck(
  deck: DeckContent,
  opts: SlideRenderOptions = {},
): Promise<{ buffers: Buffer[]; names: string[] }> {
  const {
    sizeOverride,
    themeOverride,
    slideIndex,
    noCounter = false,
    concurrency = 4,
    scale = 2,
  } = opts;

  const totalSlides = deck.slides.length;
  const padWidth = totalSlides > 99 ? 3 : 2;
  const deckName = deck.meta?.title?.toLowerCase().replace(/\s+/g, "-") ?? "deck";

  const slidesToRender = slideIndex !== undefined
    ? [{ slide: deck.slides[slideIndex], originalIndex: slideIndex }]
    : deck.slides.map((slide, i) => ({ slide, originalIndex: i }));

  const browser = await launchBrowser();
  try {
    const tasks = slidesToRender.map(({ slide, originalIndex }) => async () => {
      if (!slide) throw new Error(`Slide index ${originalIndex} out of range`);

      const themeName = themeOverride ?? slide.theme ?? deck.defaults.theme;
      const sizeName = (sizeOverride ?? slide.size ?? deck.defaults.size) as SizeName;
      const templateName = slide.template ?? deck.defaults.template;
      const showCounter = noCounter
        ? false
        : (slide.showCounter ?? deck.defaults.showCounter ?? false);
      const counter = slide.counter ?? deck.defaults.counter ?? {
        format: "{current} / {total}",
        position: "bottom-right" as const,
        style: "pill" as const,
      };

      const theme = loadTheme(themeName);

      const cardContent: CardContent = {
        template: templateName,
        theme: themeName,
        size: sizeName,
        blocks: slide.blocks,
      };

      const meta: Partial<RenderMeta> = {
        slideIndex: originalIndex,
        slideTotal: totalSlides,
        showCounter,
        counter,
      };

      const buffer = await renderCard(cardContent, theme, sizeName, scale, meta, browser);
      const paddedIndex = String(originalIndex + 1).padStart(padWidth, "0");
      const name = `${deckName}-${paddedIndex}.png`;

      return { buffer, name };
    });

    const results = await semaphore(tasks, concurrency);

    return {
      buffers: results.map((r) => r.buffer),
      names: results.map((r) => r.name),
    };
  } finally {
    await browser.close();
  }
}
