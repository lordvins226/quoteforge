import { readFileSync } from "node:fs";
import { isAbsolute, join, extname } from "node:path";
import type { CardContent, DeckContent, Block } from "../cli/utils/validator.js";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export function resolveImageSrc(src: string, baseDir: string): string {
  if (/^(https?:|data:)/i.test(src)) return src;

  const path = isAbsolute(src) ? src : join(baseDir, src);
  const mime = MIME_BY_EXT[extname(path).toLowerCase()];
  if (!mime) {
    throw new Error(`Unsupported image type for: ${src} (expected png/jpg/jpeg/webp/gif/svg)`);
  }

  let buf: Buffer;
  try {
    buf = readFileSync(path);
  } catch {
    throw new Error(`Could not read image file: ${src} (resolved to ${path})`);
  }
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function resolveBlocks(blocks: Block[], baseDir: string): Block[] {
  return blocks.map((block) =>
    block.type === "image" ? { ...block, src: resolveImageSrc(block.src, baseDir) } : block,
  );
}

export function resolveImageBlocks<T extends CardContent | DeckContent>(content: T, baseDir: string): T {
  if ("slides" in content) {
    return {
      ...content,
      slides: content.slides.map((slide) => ({ ...slide, blocks: resolveBlocks(slide.blocks, baseDir) })),
    } as T;
  }
  return { ...content, blocks: resolveBlocks(content.blocks, baseDir) } as T;
}
