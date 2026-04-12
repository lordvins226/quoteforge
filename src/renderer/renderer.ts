import puppeteer from "puppeteer-core";
import type { Browser } from "puppeteer-core";
import { renderTemplate } from "./template-engine.js";
import type { RenderMeta } from "./template-engine.js";
import type { CardContent, Theme, SizeName } from "../cli/utils/validator.js";
import { SIZES } from "../cli/utils/validator.js";
import { resolveChrome } from "./browser-resolver.js";

async function launch(): Promise<Browser> {
  const { executablePath } = await resolveChrome();
  return puppeteer.launch({ headless: true, executablePath });
}

export async function renderCard(
  content: CardContent,
  theme: Theme,
  size: SizeName,
  scale = 2,
  meta?: Partial<RenderMeta>,
  browser?: Browser,
): Promise<Buffer> {
  const dimensions = SIZES[size];
  const html = renderTemplate(content, theme, dimensions, meta);

  const ownBrowser = !browser;
  const b = browser ?? await launch();
  try {
    const page = await b.newPage();
    await page.setViewport({
      width: dimensions.w,
      height: dimensions.h,
      deviceScaleFactor: scale,
    });
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 30_000 });
    await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 15_000 });
    const screenshot = await page.screenshot({ type: "png" });
    await page.close();
    return Buffer.from(screenshot);
  } finally {
    if (ownBrowser) {
      await b.close();
    }
  }
}

export async function launchBrowser(): Promise<Browser> {
  return launch();
}
