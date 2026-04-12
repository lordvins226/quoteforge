import { describe, test, expect } from "bun:test";
import { buildZip } from "../cli/utils/zip.js";

describe("buildZip", () => {
  test("produces a buffer with ZIP magic bytes (PK)", async () => {
    const buf = await buildZip(
      [Buffer.from("slide1"), Buffer.from("slide2")],
      ["slide-01.png", "slide-02.png"],
    );
    expect(buf[0]).toBe(0x50); // P
    expect(buf[1]).toBe(0x4b); // K
  });

  test("output size grows with more entries", async () => {
    const small = await buildZip([Buffer.from("a")], ["a.png"]);
    const big = await buildZip(
      [Buffer.from("a"), Buffer.from("b"), Buffer.from("c")],
      ["a.png", "b.png", "c.png"],
    );
    expect(big.length).toBeGreaterThan(small.length);
  });

  test("handles empty arrays", async () => {
    const buf = await buildZip([], []);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });
});
