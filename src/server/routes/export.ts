import { readFileSync } from "node:fs";
import { ThemeSchema } from "../../cli/utils/validator.js";
import { renderCard } from "../../renderer/renderer.js";
import { resolveThemeRead } from "../../assetBundle.js";
import type { CardContent, SizeName } from "../../cli/utils/validator.js";

export async function exportRoute(req: Request): Promise<Response> {
  const body = await req.json() as {
    card: CardContent;
    theme: string;
    size: SizeName;
    scale?: number;
  };

  const themePath = resolveThemeRead(body.theme);
  if (!themePath) {
    return Response.json({ error: `Theme not found: ${body.theme}` }, { status: 404 });
  }
  const theme = ThemeSchema.parse(JSON.parse(readFileSync(themePath, "utf-8")));

  const buf = await renderCard(body.card, theme, body.size, body.scale ?? 2);

  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "attachment; filename=quoteforge-export.png",
    },
  });
}
