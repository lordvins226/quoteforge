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
});
