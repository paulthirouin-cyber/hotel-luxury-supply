// Holding page build: copies the coming-soon page into dist/ for Cloudflare Pages.
// The full site lives on the `dev` branch and is published to `main` only on request.
const fs = require("fs");
const path = require("path");
const out = path.join(__dirname, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const page = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
fs.writeFileSync(path.join(out, "index.html"), page);
fs.writeFileSync(path.join(out, "404.html"), page);
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
fs.writeFileSync(path.join(out, "_headers"), "/*\n  X-Robots-Tag: noindex\n");
console.log("Holding page built to dist/");
