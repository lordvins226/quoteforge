import puppeteer from "puppeteer";
import { renderTemplate } from "./template-engine.js";
import type { RenderMeta } from "./template-engine.js";
import type { CardContent, Theme, SizeName } from "../cli/utils/validator.js";
import { SIZES } from "../cli/utils/validator.js";

export async function renderCard(
  content: CardContent,
  theme: Theme,
  size: SizeName,
  scale = 2,
  meta?: Partial<RenderMeta>,
): Promise<Buffer> {
  const html = renderTemplate(content, theme, meta);
  const dimensions = SIZES[size];

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: dimensions.w,
      height: dimensions.h,
      deviceScaleFactor: scale,
    });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const screenshot = await page.screenshot({ type: "png" });
    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}
