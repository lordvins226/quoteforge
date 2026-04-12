import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { ThemeSchema } from "../../cli/utils/validator.js";

const THEMES_DIR = resolve("themes");

export async function themesRoute(req: Request, url: URL): Promise<Response> {
  if (req.method === "GET" && url.pathname === "/api/themes") {
    const files = readdirSync(THEMES_DIR).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_"),
    );
    const themes = files.map((f) => {
      const raw = readFileSync(resolve(THEMES_DIR, f), "utf-8");
      return JSON.parse(raw);
    });
    return Response.json(themes);
  }

  if (req.method === "POST" && url.pathname === "/api/themes") {
    const body = await req.json();
    const theme = ThemeSchema.parse(body);
    const filePath = resolve(THEMES_DIR, `${theme.name}.json`);
    if (existsSync(filePath)) {
      return Response.json({ error: "Theme already exists" }, { status: 409 });
    }
    writeFileSync(filePath, JSON.stringify(theme, null, 2) + "\n");
    return Response.json(theme, { status: 201 });
  }

  const nameMatch = url.pathname.match(/^\/api\/themes\/([^/]+)$/);
  if (req.method === "PUT" && nameMatch) {
    const name = nameMatch[1];
    const body = await req.json();
    const theme = ThemeSchema.parse(body);
    const filePath = resolve(THEMES_DIR, `${name}.json`);
    writeFileSync(filePath, JSON.stringify(theme, null, 2) + "\n");
    return Response.json(theme);
  }

  return new Response("Not found", { status: 404 });
}
