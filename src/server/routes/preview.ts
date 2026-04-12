import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ThemeSchema, SIZES } from "../../cli/utils/validator.js";
import { renderTemplate } from "../../renderer/template-engine.js";
import type { CardContent, Theme, SizeName } from "../../cli/utils/validator.js";

function loadTheme(name: string): Theme {
  const raw = readFileSync(resolve("themes", `${name}.json`), "utf-8");
  return ThemeSchema.parse(JSON.parse(raw));
}

export async function previewRoute(req: Request, url: URL): Promise<Response> {
  const body = await req.json() as {
    card: CardContent;
    theme: string;
    size?: SizeName;
    slideIndex?: number;
    slideTotal?: number;
    showCounter?: boolean;
  };

  const theme = loadTheme(body.theme);
  const sizeName = (body.size ?? body.card.size ?? "twitter") as SizeName;
  const dimensions = SIZES[sizeName] ?? { w: 1200, h: 675 };

  const html = renderTemplate(body.card, theme, dimensions, {
    slideIndex: body.slideIndex ?? 0,
    slideTotal: body.slideTotal ?? 1,
    showCounter: body.showCounter ?? false,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
