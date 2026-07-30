import { describe, test, expect } from "bun:test";
import { parseAspectRatio, computeSafeInset } from "../renderer/safe-aspect.js";

describe("parseAspectRatio", () => {
  test.each([
    ["4:3", 4 / 3],
    ["16:9", 16 / 9],
    ["4x3", 4 / 3],
    ["1.91", 1.91],
  ])("parses %s", (input, expected) => {
    expect(parseAspectRatio(input)).toBeCloseTo(expected, 5);
  });

  test.each(["0:3", "-1", "abc", "4:", ":3", "4:0"])("rejects %s", (bad) => {
    expect(() => parseAspectRatio(bad)).toThrow();
  });
});

describe("computeSafeInset", () => {
  test("target wider than canvas insets top and bottom only", () => {
    // 1080x1080 (c=1) toward 16:9 (r=1.777) -> safe height = 1080/1.777 = 607.5
    // inset each = (1080 - 607.5)/2 = 236.25
    const inset = computeSafeInset({ w: 1080, h: 1080 }, 16 / 9);
    expect(inset.left).toBe(0);
    expect(inset.right).toBe(0);
    expect(inset.top).toBeCloseTo(236.25, 1);
    expect(inset.bottom).toBeCloseTo(236.25, 1);
  });

  test("target narrower than canvas insets left and right only", () => {
    // 1920x1080 (c=1.777) toward 4:5 (r=0.8) -> safe width = 1080*0.8 = 864
    // inset each = (1920 - 864)/2 = 528
    const inset = computeSafeInset({ w: 1920, h: 1080 }, 4 / 5);
    expect(inset.top).toBe(0);
    expect(inset.bottom).toBe(0);
    expect(inset.left).toBeCloseTo(528, 1);
    expect(inset.right).toBeCloseTo(528, 1);
  });

  test("matching ratio yields no inset", () => {
    const inset = computeSafeInset({ w: 1920, h: 1080 }, 16 / 9);
    expect(inset).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });
});
