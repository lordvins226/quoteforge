import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ThemeSchema } from "../../cli/utils/validator.js";
import { renderCard } from "../../renderer/renderer.js";
import type { CardContent, SizeName } from "../../cli/utils/validator.js";

export async function exportRoute(req: Request): Promise<Response> {
  const body = await req.json() as {
    card: CardContent;
    theme: string;
    size: SizeName;
    scale?: number;
  };

  const themePath = resolve("themes", `${body.theme}.json`);
  const theme = ThemeSchema.parse(JSON.parse(readFileSync(themePath, "utf-8")));

  const buf = await renderCard(body.card, theme, body.size, body.scale ?? 2);

  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "attachment; filename=quoteforge-export.png",
    },
  });
}
