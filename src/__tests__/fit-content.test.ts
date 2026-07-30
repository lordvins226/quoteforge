import { describe, test, expect } from "bun:test";
import { computeContentClip } from "../renderer/fit-content.js";

describe("computeContentClip", () => {
  test("expands the content box by padding on all sides", () => {
    const clip = computeContentClip(
      { x: 100, y: 400, width: 880, height: 280 },
      40,
      { w: 1080, h: 1080 },
    );
    expect(clip).toEqual({ x: 60, y: 360, width: 960, height: 360 });
  });

  test("clamps to the canvas edges", () => {
    const clip = computeContentClip(
      { x: 10, y: 10, width: 1060, height: 1060 },
      40,
      { w: 1080, h: 1080 },
    );
    expect(clip).toEqual({ x: 0, y: 0, width: 1080, height: 1080 });
  });

  test("never returns negative origin or overflowing size", () => {
    const clip = computeContentClip(
      { x: 0, y: 0, width: 1080, height: 1080 },
      100,
      { w: 1080, h: 1080 },
    );
    expect(clip.x).toBe(0);
    expect(clip.y).toBe(0);
    expect(clip.width).toBe(1080);
    expect(clip.height).toBe(1080);
  });
});
