import puppeteer from "puppeteer-core";
import type { Browser, Page } from "puppeteer-core";
import { renderTemplate } from "./template-engine.js";
import type { RenderMeta } from "./template-engine.js";
import type { CardContent, Theme, SizeName } from "../cli/utils/validator.js";
import { resolveChrome } from "./browser-resolver.js";
import { resolveDimensions } from "./dimensions.js";
import { computeContentClip } from "./fit-content.js";

async function launch(): Promise<Browser> {
  const { executablePath } = await resolveChrome();
  return puppeteer.launch({ headless: true, executablePath });
}

export async function renderCardOnPage(
  page: Page,
  content: CardContent,
  theme: Theme,
  size: SizeName,
  scale = 2,
  meta?: Partial<RenderMeta>,
  fitContent = false,
): Promise<Buffer> {
  const dimensions = resolveDimensions({
    size,
    width: content.width,
    height: content.height,
  });
  const html = renderTemplate(content, theme, dimensions, meta);

  await page.setViewport({
    width: dimensions.w,
    height: dimensions.h,
    deviceScaleFactor: scale,
  });
  await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
  await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 15_000 });

  if (fitContent) {
    const box = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll(".card > .block"));
      if (blocks.length === 0) return null;
      const rects = blocks.map((b) => b.getBoundingClientRect());
      const x = Math.min(...rects.map((r) => r.left));
      const y = Math.min(...rects.map((r) => r.top));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      const cardEl = document.querySelector(".card");
      const padding = cardEl ? parseFloat(getComputedStyle(cardEl).paddingTop) : 0;
      return { x, y, width: right - x, height: bottom - y, padding };
    });
    if (box) {
      const clip = computeContentClip(
        { x: box.x, y: box.y, width: box.width, height: box.height },
        box.padding,
        dimensions,
      );
      const shot = await page.screenshot({ type: "png", clip });
      return Buffer.from(shot);
    }
  }

  const screenshot = await page.screenshot({ type: "png" });
  return Buffer.from(screenshot);
}

export async function renderCard(
  content: CardContent,
  theme: Theme,
  size: SizeName,
  scale = 2,
  meta?: Partial<RenderMeta>,
  browser?: Browser,
  fitContent = false,
): Promise<Buffer> {
  const ownBrowser = !browser;
  const b = browser ?? await launch();
  try {
    const page = await b.newPage();
    try {
      return await renderCardOnPage(page, content, theme, size, scale, meta, fitContent);
    } finally {
      await page.close();
    }
  } finally {
    if (ownBrowser) {
      await b.close();
    }
  }
}

export async function launchBrowser(): Promise<Browser> {
  return launch();
}
