// Local dev server: serves out/ statically and routes /api/* + /auth/callback
// through worker/_worker.js with the ASSETS binding backed by the filesystem.
// Usage: npm run build && npm run serve
// (default port 8331 — 8330 dipakai apk-builder).
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../worker/_worker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "out");
const PORT = Number(process.env.PORT || 8331);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".mp4": "video/mp4",
};

const ASSETS = {
  async fetch(req) {
    const url = new URL(req.url);
    let p = decodeURIComponent(url.pathname);
    if (p === "/") p = "/index.html";
    // Static export: /app/dashboard → out/app/dashboard/index.html
    // (dan halaman dinamis /app/result/[id] tidak punya file statis —
    // worker ASSETS mengembalikan 404, jadi tangani di sini: rute /app/*
    // tanpa file = sajikan halaman 404.html bila ada).
    const file = path.join(OUT, p);
    if (!file.startsWith(OUT) || !existsSync(file) || statSync(file).isDirectory()) {
      const indexFile = path.join(OUT, p, "index.html");
      if (existsSync(indexFile)) {
        return new Response(await readFile(indexFile), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      // Next static export menyimpan halaman sebagai <rute>.html.
      const htmlFile = `${file}.html`;
      if (existsSync(htmlFile)) {
        return new Response(await readFile(htmlFile), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      const notFound = path.join(OUT, "404.html");
      if (existsSync(notFound)) {
        return new Response(await readFile(notFound), {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return new Response("Not found", { status: 404 });
    }
    const ext = path.extname(file);
    return new Response(await readFile(file), {
      headers: { "content-type": MIME[ext] || "application/octet-stream" },
    });
  },
};

const server = http.createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host}${req.url}`;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : await new Response(req).arrayBuffer(),
      duplex: "half",
    });
    const response = await worker.fetch(request, { ASSETS });
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (response.body) {
      for await (const chunk of response.body) res.write(chunk);
    }
    res.end();
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`serve-worker error: ${e.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`docsumm serve: http://127.0.0.1:${PORT}/`);
});
