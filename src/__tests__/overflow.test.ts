import { describe, test, expect } from "bun:test";
import { contentOverflows } from "../renderer/overflow.js";

describe("contentOverflows", () => {
  test("flags vertical overflow", () => {
    expect(contentOverflows({ scrollW: 1200, scrollH: 1400, clientW: 1200, clientH: 1200 })).toBe(true);
  });

  test("flags horizontal overflow", () => {
    expect(contentOverflows({ scrollW: 1300, scrollH: 1200, clientW: 1200, clientH: 1200 })).toBe(true);
  });

  test("flags overflow on both axes", () => {
    expect(contentOverflows({ scrollW: 1300, scrollH: 1400, clientW: 1200, clientH: 1200 })).toBe(true);
  });

  test("no overflow when content fits exactly", () => {
    expect(contentOverflows({ scrollW: 1200, scrollH: 1200, clientW: 1200, clientH: 1200 })).toBe(false);
  });

  test("no overflow when content is smaller than the canvas", () => {
    expect(contentOverflows({ scrollW: 900, scrollH: 800, clientW: 1200, clientH: 1200 })).toBe(false);
  });
});
