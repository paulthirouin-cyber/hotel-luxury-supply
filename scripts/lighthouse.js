#!/usr/bin/env node
// Lighthouse CI check for the static build (Phase 2.4).
// Serves dist/ locally, audits representative pages with Lighthouse
// (fetched on demand via npx, so it is not a project dependency) and fails
// if any category score drops below the budget.
//
// Usage: npm run lighthouse            (budget 95, mobile preset)
//        LH_BUDGET=90 npm run lighthouse
//        LH_URLS="/,/bespoke/" npm run lighthouse
// Requires Chrome or Edge on this machine (CHROME_PATH to override).

const { spawn } = require("child_process");

// async spawn: the local server runs in this process, so never block the event loop
function run(cmd, args, opts) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, opts);
    child.on("close", (status) => resolve({ status }));
    child.on("error", () => resolve({ status: 1 }));
  });
}
const fs = require("fs");
const path = require("path");
const { serve } = require("./serve");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PORT = 8790;
const BUDGET = Number(process.env.LH_BUDGET || 95);
const URLS = (process.env.LH_URLS || "/,/products/,/products/hats/,/products/hats/riviera-bucket-hat/,/bespoke/").split(",");
const OUT = path.join(ROOT, "dist-reports");

function findLighthouse() {
  try { return require.resolve("lighthouse/cli/index.js"); } catch (e) { /* not installed locally */ }
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const caches = [path.join(home, "AppData", "Local", "npm-cache", "_npx"), path.join(home, ".npm", "_npx")];
  for (const c of caches) {
    if (!fs.existsSync(c)) continue;
    for (const d of fs.readdirSync(c)) {
      const cli = path.join(c, d, "node_modules", "lighthouse", "cli", "index.js");
      if (fs.existsSync(cli)) return cli;
    }
  }
  return null;
}

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"
  ];
  return candidates.find((c) => fs.existsSync(c)) || null;
}

async function main() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error("dist/ not built — run `node build.js` first");
    process.exit(1);
  }
  const lh = findLighthouse();
  if (!lh) {
    console.error("Lighthouse not found. Run once:  npx --yes lighthouse@12 --version   (or npm i -D lighthouse)");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error("No Chrome/Edge found. Install Chrome or set CHROME_PATH.");
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve(DIST, PORT);
  const base = `http://127.0.0.1:${PORT}`;
  const rows = [];
  let failed = false;

  for (const u of URLS) {
    const name = (u === "/" ? "home" : u.replace(/^\/|\/$/g, "").replace(/\//g, "_")) || "home";
    const outPath = path.join(OUT, name + ".json");
    const args = [
      lh, base + u,
      "--output=json", "--output-path=" + outPath,
      "--only-categories=performance,accessibility,best-practices,seo",
      '--chrome-flags="--headless=new --no-sandbox --disable-gpu"',
      "--quiet"
    ];
    const r = await run(process.execPath, args, {
      stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, CHROME_PATH: chrome }
    });
    if (r.status !== 0 || !fs.existsSync(outPath)) { console.error("lighthouse failed for " + u); failed = true; continue; }
    const j = JSON.parse(fs.readFileSync(outPath, "utf8"));
    const c = j.categories;
    const s = {
      url: u,
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      best: Math.round(c["best-practices"].score * 100),
      seo: Math.round(c.seo.score * 100),
      lcp: j.audits["largest-contentful-paint"] ? (j.audits["largest-contentful-paint"].numericValue / 1000).toFixed(2) + "s" : "-",
      cls: j.audits["cumulative-layout-shift"] ? j.audits["cumulative-layout-shift"].numericValue.toFixed(3) : "-"
    };
    rows.push(s);
    const below = ["perf", "a11y", "best", "seo"].filter((k) => s[k] < BUDGET);
    if (below.length) {
      failed = true;
      const audits = Object.values(j.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative")
        .map((a) => `    - ${a.id} (${Math.round((a.score || 0) * 100)}): ${a.title}`).slice(0, 12).join("\n");
      console.log(`BELOW BUDGET ${u}: ${below.join(", ")}\n${audits}`);
    }
  }
  server.close();
  console.log("\nLighthouse (mobile, budget " + BUDGET + "):");
  console.table(rows);
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ budget: BUDGET, at: new Date().toISOString(), rows }, null, 2));
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
