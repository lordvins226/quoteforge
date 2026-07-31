import { describe, expect, test } from "bun:test";

import { templateWarnings } from "../renderer/template-warnings.js";

const cells = (n: number) => [
  {
    type: "bullet-list",
    items: Array.from({ length: n }, (_, i) => ({ label: `L${i}`, text: `T${i}` })),
  },
];

describe("templateWarnings", () => {
  test("stays silent when grid has exactly four cells", () => {
    expect(templateWarnings({ template: "grid", blocks: cells(4) })).toEqual([]);
  });

  test("warns when grid has too few cells", () => {
    const [warning] = templateWarnings({ template: "grid", blocks: cells(3) });
    expect(warning).toContain("grid");
    expect(warning).toContain("this card has 3");
  });

  test("warns when grid has too many cells", () => {
    const [warning] = templateWarnings({ template: "grid", blocks: cells(6) });
    expect(warning).toContain("this card has 6");
  });

  test("counts callout items as grid cells too", () => {
    const blocks = [
      { type: "bullet-list", items: [{}, {}] },
      { type: "callout", items: [{}, {}] },
    ];
    expect(templateWarnings({ template: "grid", blocks })).toEqual([]);
  });

  test("does not apply the cell rule to other templates", () => {
    expect(templateWarnings({ template: "list", blocks: cells(7) })).toEqual([]);
  });

  test("warns when eyebrow is set on a template with no eyebrow slot", () => {
    const [warning] = templateWarnings({
      template: "list",
      eyebrow: "Checklist",
      blocks: [],
    });
    expect(warning).toContain("no eyebrow slot");
  });

  test("stays silent when the template does render eyebrow", () => {
    expect(
      templateWarnings({ template: "cover", eyebrow: "Issue 01", blocks: [] }),
    ).toEqual([]);
  });

  test("stays silent when no eyebrow is set", () => {
    expect(templateWarnings({ template: "list", blocks: [] })).toEqual([]);
  });

  test("warns when a template drops a block type it cannot render", () => {
    const [warning] = templateWarnings({
      template: "memo",
      blocks: [
        { type: "headline" },
        { type: "callout", items: [{}] },
      ],
    });
    expect(warning).toContain("memo");
    expect(warning).toContain("headline");
    expect(warning).toContain("will not appear");
  });

  test("names every dropped type once, without repeating duplicates", () => {
    const [warning] = templateWarnings({
      template: "prompt",
      blocks: [{ type: "headline" }, { type: "headline" }, { type: "text" }],
    });
    expect(warning).toContain("headline");
    expect(warning).toContain("text");
    expect((warning ?? "").match(/headline/g)).toHaveLength(1);
  });

  test("stays silent when every block is one the template renders", () => {
    expect(
      templateWarnings({
        template: "memo",
        blocks: [{ type: "callout", items: [{}] }, { type: "text" }],
      }),
    ).toEqual([]);
  });

  test("stays silent for templates that render every block type", () => {
    expect(
      templateWarnings({
        template: "manifesto",
        blocks: [{ type: "headline" }, { type: "code" }, { type: "chart" }],
      }),
    ).toEqual([]);
  });

  test("says nothing about blocks when the template is unknown", () => {
    expect(
      templateWarnings({ template: "no-such-template", blocks: [{ type: "headline" }] }),
    ).toEqual([]);
  });

  test("every shipped example renders all of its own blocks", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const dir = "content/examples";
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const card = JSON.parse(readFileSync(`${dir}/${file}`, "utf-8")) as {
        template: string;
        eyebrow?: string;
        blocks: { type: string }[];
      };
      expect([file, templateWarnings(card)]).toEqual([file, []]);
    }
  });
});
