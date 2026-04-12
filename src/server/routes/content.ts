import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export async function contentRoute(req: Request, url: URL): Promise<Response> {
  if (req.method === "GET" && url.pathname === "/api/content/load") {
    const filePath = url.searchParams.get("path");
    if (!filePath) {
      return Response.json({ error: "Missing path parameter" }, { status: 400 });
    }
    try {
      const raw = readFileSync(resolve(filePath), "utf-8");
      return Response.json(JSON.parse(raw));
    } catch {
      return Response.json({ error: "File not found" }, { status: 404 });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/content/save") {
    const body = await req.json() as { path: string; content: unknown };
    if (!body.path) {
      return Response.json({ error: "Missing path" }, { status: 400 });
    }
    writeFileSync(resolve(body.path), JSON.stringify(body.content, null, 2) + "\n");
    return Response.json({ ok: true });
  }

  return new Response("Not found", { status: 404 });
}
