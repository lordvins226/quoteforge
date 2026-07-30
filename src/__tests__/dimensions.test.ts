import { describe, test, expect } from "bun:test";
import { resolveDimensions } from "../renderer/dimensions.js";
import { SIZES } from "../cli/utils/validator.js";

describe("resolveDimensions", () => {
  test("resolves a preset size from SIZES", () => {
    expect(resolveDimensions({ size: "twitter" })).toEqual({ w: 1200, h: 675 });
  });

  test("resolves custom dimensions from width and height", () => {
    expect(resolveDimensions({ size: "custom", width: 1200, height: 900 }))
      .toEqual({ w: 1200, h: 900 });
  });

  test("never returns the 0x0 sentinel for custom", () => {
    const resolved = resolveDimensions({ size: "custom", width: 800, height: 600 });
    expect(resolved.w).toBeGreaterThan(0);
    expect(resolved.h).toBeGreaterThan(0);
  });

  test("throws when custom is missing dimensions", () => {
    expect(() => resolveDimensions({ size: "custom" })).toThrow(/width/);
  });

  test("ignores width and height for a preset size", () => {
    expect(resolveDimensions({ size: "twitter", width: 999, height: 999 }))
      .toEqual({ w: 1200, h: 675 });
  });

  test.each(Object.keys(SIZES).filter((n) => n !== "custom"))(
    "preset '%s' resolves to its SIZES entry",
    (name) => {
      const entry = SIZES[name as keyof typeof SIZES];
      expect(resolveDimensions({ size: name as never })).toEqual({ w: entry.w, h: entry.h });
    },
  );
});
