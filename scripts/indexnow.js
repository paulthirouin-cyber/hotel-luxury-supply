#!/usr/bin/env node
// IndexNow submission (Bing, Yandex, Naver, Seznam share the index; Google does not use it).
// Run after a publish to main:  npm run indexnow            (all sitemap URLs)
//                               npm run indexnow -- /guides/new-page/   (specific paths)
// The key lives in config/indexnow.key and the build copies it to dist/<key>.txt,
// which is how the engines verify ownership.
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "site.json"), "utf8")).site;
const KEY = fs.readFileSync(path.join(ROOT, "config", "indexnow.key"), "utf8").trim();
const HOST = new URL(SITE).host;

function urlsFromSitemap() {
  const sm = fs.readFileSync(path.join(ROOT, "dist", "sitemap.xml"), "utf8");
  return [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function submit(urlList) {
  const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: SITE + "/" + KEY + ".txt", urlList });
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: "api.indexnow.org", path: "/indexnow", method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) } }, (res) => {
      let data = ""; res.on("data", (c) => (data += c)); res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

(async () => {
  const args = process.argv.slice(2);
  const urls = args.length ? args.map((p) => (p.startsWith("http") ? p : SITE + p)) : urlsFromSitemap();
  if (!urls.length) { console.error("no URLs to submit"); process.exit(1); }
  const r = await submit(urls);
  console.log(`IndexNow: submitted ${urls.length} URL(s) for ${HOST} → HTTP ${r.status} ${r.status === 200 || r.status === 202 ? "OK" : r.data}`);
  process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
