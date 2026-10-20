#!/usr/bin/env node
// Minimal static server for dist/ that mimics Cloudflare Pages routing:
// /path/ -> /path/index.html, /path -> 301 /path/, unknown -> 404.html.
// Usage: node scripts/serve.js [port] [dir]   (also exported for lighthouse.js)
const http = require("http");
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"
};

function serve(dir, port) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(root, url);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.endsWith("/")) { res.writeHead(301, { Location: url + "/" }); return res.end(); }
      file = path.join(file, "index.html");
    }
    let status = 200;
    if (!fs.existsSync(file)) { status = 404; file = path.join(root, "404.html"); }
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end("not found"); }
    const ext = path.extname(file).toLowerCase();
    const text = [".html", ".css", ".js", ".json", ".xml", ".txt", ".svg"].includes(ext);
    const gzip = text && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    res.writeHead(status, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      ...(gzip ? { "Content-Encoding": "gzip" } : {})
    });
    const stream = fs.createReadStream(file);
    if (gzip) stream.pipe(zlib.createGzip()).pipe(res); else stream.pipe(res);
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

if (require.main === module) {
  const port = Number(process.argv[2]) || 8787;
  const dir = process.argv[3] || path.join(__dirname, "..", "dist");
  serve(dir, port).then(() => console.log(`serving ${dir} at http://127.0.0.1:${port}/`));
}

module.exports = { serve };
