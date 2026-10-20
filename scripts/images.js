#!/usr/bin/env node
// Image pipeline: generates responsive variants next to the originals in
// assets/catalog/ (committed, so Cloudflare needs no image tooling).
//   cat-<slug>.jpg      → cat-<slug>-1600.webp, cat-<slug>-960.webp  (lifestyle heroes)
//   <slug>.webp         → <slug>-480.webp                             (product cutouts, card size)
// perf.js adds srcset/sizes at build time whenever a variant exists.
// Run after dropping new photography into assets/catalog/:  npm run images
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = path.join(__dirname, "..", "assets", "catalog");
const HERO_WIDTHS = [1600, 960];
const CARD_WIDTH = 480;

async function main() {
  const files = fs.readdirSync(DIR);
  let made = 0, skipped = 0;
  for (const f of files) {
    const full = path.join(DIR, f);
    const base = f.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    if (/-\d+\.webp$/.test(f) || f === "cover.webp") continue; // already a variant / not referenced
    if (/^cat-.*\.(jpg|jpeg|png)$/i.test(f)) {
      const hmeta = await sharp(full).metadata();
      for (const w of HERO_WIDTHS) {
        const out = path.join(DIR, `${base}-${w}.webp`);
        // the largest width always exists (capped at the original size); smaller ones only if they actually reduce
        if (w !== HERO_WIDTHS[0] && (hmeta.width || 0) <= w) { if (fs.existsSync(out)) fs.unlinkSync(out); skipped++; continue; }
        if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(full).mtimeMs) { skipped++; continue; }
        await sharp(full).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
        made++;
      }
    } else if (/\.webp$/i.test(f)) {
      const out = path.join(DIR, `${base}-${CARD_WIDTH}.webp`);
      const meta = await sharp(full).metadata();
      if ((meta.width || 0) <= CARD_WIDTH) { if (fs.existsSync(out)) fs.unlinkSync(out); skipped++; continue; }
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(full).mtimeMs) { skipped++; continue; }
      await sharp(full).resize({ width: CARD_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
      made++;
    }
  }
  console.log(`images: ${made} variant(s) generated, ${skipped} up to date`);
}

main().catch((e) => { console.error(e); process.exit(1); });
