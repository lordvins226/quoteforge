import { describe, test, expect } from "bun:test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveImageSrc, resolveImageBlocks } from "../renderer/image-resolver.js";
import type { CardContent, DeckContent } from "../cli/utils/validator.js";

describe("resolveImageSrc", () => {
  test("passes through http(s) URLs unchanged", () => {
    expect(resolveImageSrc("https://example.com/a.png", "/tmp")).toBe("https://example.com/a.png");
    expect(resolveImageSrc("http://example.com/a.png", "/tmp")).toBe("http://example.com/a.png");
  });

  test("passes through data URIs unchanged", () => {
    const uri = "data:image/png;base64,AAAA";
    expect(resolveImageSrc(uri, "/tmp")).toBe(uri);
  });

  test("encodes a local file as a data URI with the right MIME", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-img-"));
    writeFileSync(join(dir, "p.png"), Buffer.from([1, 2, 3]));
    const out = resolveImageSrc("./p.png", dir);
    expect(out).toBe(`data:image/png;base64,${Buffer.from([1, 2, 3]).toString("base64")}`);
  });

  test("maps .jpg and .svg extensions to correct MIME", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-img-"));
    writeFileSync(join(dir, "p.jpg"), Buffer.from([9]));
    writeFileSync(join(dir, "p.svg"), Buffer.from([9]));
    expect(resolveImageSrc("p.jpg", dir).startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(resolveImageSrc("p.svg", dir).startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  test("throws a clear error for a missing local file", () => {
    expect(() => resolveImageSrc("./nope.png", "/tmp")).toThrow(/nope\.png/);
  });
});

describe("resolveImageBlocks", () => {
  test("resolves image blocks in a card and leaves others untouched", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-img-"));
    writeFileSync(join(dir, "p.png"), Buffer.from([1]));
    const card: CardContent = {
      template: "quote",
      theme: "dark-teal",
      size: "twitter",
      blocks: [
        { type: "text", content: "hi" },
        { type: "image", src: "./p.png", width: "full", align: "center" },
      ],
    };
    const out = resolveImageBlocks(card, dir);
    expect(out.blocks[0]).toEqual({ type: "text", content: "hi" });
    expect((out.blocks[1] as { src: string }).src.startsWith("data:image/png;base64,")).toBe(true);
  });

  test("resolves image blocks in a deck and leaves non-image blocks untouched", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-img-"));
    writeFileSync(join(dir, "p.png"), Buffer.from([2, 3, 4]));
    const deck: DeckContent = {
      type: "deck",
      defaults: { template: "quote", theme: "dark-teal", size: "twitter" },
      slides: [
        {
          id: "s1",
          blocks: [
            { type: "text", content: "unchanged" },
            { type: "image", src: "./p.png", width: "full", align: "center" },
          ],
        },
      ],
    };
    const out = resolveImageBlocks(deck, dir);
    expect(out.slides[0].blocks[0]).toEqual({ type: "text", content: "unchanged" });
    expect((out.slides[0].blocks[1] as { src: string }).src.startsWith("data:image/png;base64,")).toBe(true);
  });
});
