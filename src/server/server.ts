import { previewRoute } from "./routes/preview.js";
import { exportRoute } from "./routes/export.js";
import { exportDeckRoute } from "./routes/exportDeck.js";
import { themesRoute } from "./routes/themes.js";
import { contentRoute } from "./routes/content.js";

export function createApiServer(port: number) {
  return Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      let response: Response;

      if (path.startsWith("/api/preview")) {
        response = await previewRoute(req, url);
      } else if (path === "/api/export" && req.method === "POST") {
        response = await exportRoute(req);
      } else if (path === "/api/export-deck" && req.method === "POST") {
        response = await exportDeckRoute(req);
      } else if (path.startsWith("/api/themes")) {
        response = await themesRoute(req, url);
      } else if (path.startsWith("/api/content")) {
        response = await contentRoute(req, url);
      } else {
        response = new Response("Not found", { status: 404 });
      }

      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(corsHeaders)) {
        headers.set(k, v);
      }

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    },
  });
}
