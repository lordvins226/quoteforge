import { renderDeck } from "../../renderer/slide-renderer.js";
import { buildZip } from "../../cli/utils/zip.js";
import type { DeckContent, SizeName } from "../../cli/utils/validator.js";

export async function exportDeckRoute(req: Request): Promise<Response> {
  const body = await req.json() as {
    deck: DeckContent;
    size?: SizeName;
    theme?: string;
    scale?: number;
  };

  const { buffers, names } = await renderDeck(body.deck, {
    sizeOverride: body.size,
    themeOverride: body.theme,
    scale: body.scale ?? 2,
  });

  const zipBuf = await buildZip(buffers, names);

  return new Response(zipBuf, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=quoteforge-deck.zip",
    },
  });
}
