import { describe, test, expect } from "bun:test";
import { previewRoute } from "../server/routes/preview.js";
import type { CardContent } from "../cli/utils/validator.js";

function makeCard(overrides: Partial<CardContent> = {}): CardContent {
  return {
    template: "quote",
    theme: "brutal-white",
    size: "custom",
    blocks: [{ type: "headline", parts: [{ text: "Hello", style: "normal" }] }],
    ...overrides,
  } as CardContent;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("previewRoute", () => {
  test("returns 400 for a custom-size card missing width/height", async () => {
    const req = makeRequest({
      card: makeCard(),
      theme: "brutal-white",
      size: "custom",
    });
    const res = await previewRoute(req, new URL("http://localhost/api/preview"));
    expect(res.status).toBe(400);
  });

  test("resolves custom width/height instead of the 0x0 sentinel", async () => {
    const req = makeRequest({
      card: makeCard({ width: 800, height: 600 }),
      theme: "brutal-white",
      size: "custom",
    });
    const res = await previewRoute(req, new URL("http://localhost/api/preview"));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toMatch(/width:\s*0px/);
    expect(html).not.toMatch(/height:\s*0px/);
  });
});
