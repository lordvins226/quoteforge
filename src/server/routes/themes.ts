import { readFileSync, writeFileSync } from "node:fs";
import { ThemeSchema } from "../../cli/utils/validator.js";
import { listAllThemes, resolveThemeWrite, resolveThemeRead } from "../../assetBundle.js";

export async function themesRoute(req: Request, url: URL): Promise<Response> {
  if (req.method === "GET" && url.pathname === "/api/themes") {
    const themes = listAllThemes().map(({ path }) => JSON.parse(readFileSync(path, "utf-8")));
    return Response.json(themes);
  }

  if (req.method === "POST" && url.pathname === "/api/themes") {
    const body = await req.json();
    const theme = ThemeSchema.parse(body);
    if (resolveThemeRead(theme.name)) {
      return Response.json({ error: "Theme already exists" }, { status: 409 });
    }
    const filePath = resolveThemeWrite(theme.name);
    writeFileSync(filePath, JSON.stringify(theme, null, 2) + "\n");
    return Response.json(theme, { status: 201 });
  }

  const nameMatch = url.pathname.match(/^\/api\/themes\/([^/]+)$/);
  if (req.method === "PUT" && nameMatch) {
    const name = nameMatch[1];
    const body = await req.json();
    const theme = ThemeSchema.parse(body);
    const filePath = resolveThemeWrite(name);
    writeFileSync(filePath, JSON.stringify(theme, null, 2) + "\n");
    return Response.json(theme);
  }

  return new Response("Not found", { status: 404 });
}
