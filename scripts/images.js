#!/usr/bin/env node
// Image pipeline: generates responsive variants next to the originals in
// assets/catalog/ (committed, so Cloudflare needs no image tooling).
//   cat-<slug>.jpg      → cat-<slug>-1600.webp, cat-<slug>-960.webp  (lifestyle heroes)
//   <slug>.webp         → <slug>-480.webp                             (product cutouts, card size)
//   <slug>.webp         → <slug>-print.jpg                             (lookbook PDF: JPEG on cream, 600px)
// perf.js adds srcset/sizes at build time whenever a variant exists;
// scripts/lookbook.js embeds the -print.jpg files (PDF needs JPEG, not WebP).
// Run after dropping new photography into assets/catalog/:  npm run images
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = path.join(__dirname, "..", "assets", "catalog");
const HERO_WIDTHS = [2600, 1600, 960]; // largest first
const CARD_WIDTH = 480;
const PRINT_WIDTH = 600;
const CREAM = { r: 252, g: 249, b: 242 }; // brand cream #FFFDF8

async function main() {
  const files = fs.readdirSync(DIR);
  let made = 0, skipped = 0;
  const jobs = [];
  for (const f of files) {
    const full = path.join(DIR, f);
    const base = f.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    if (/-\d+\.webp$/.test(f) || /-print\.jpg$/.test(f) || f === "cover.webp") continue; // already a variant / not referenced
    if (/^cat-.*\.(jpg|jpeg|png)$/i.test(f)) {
      const hmeta = await sharp(full).metadata();
      let built = false;
      const sw = hmeta.width || 0;
      HERO_WIDTHS.forEach((w, i) => {
        const out = path.join(DIR, `${base}-${w}.webp`);
        const next = HERO_WIDTHS[i + 1];
        // build widths the source can honour (~90%), plus the first width above the source size
        // (capped at the original) so a 1024px photo is never downscaled to 960
        const wanted = sw >= w * 0.9 || (!built && (next === undefined || sw > next));
        if (!wanted) { if (fs.existsSync(out)) fs.unlinkSync(out); skipped++; return; }
        built = true;
        if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(full).mtimeMs) { skipped++; return; }
        jobs.push(sharp(full).resize({ width: w, withoutEnlargement: true }).webp({ quality: 84 }).toFile(out).then(() => { made++; }));
      });
      await Promise.all(jobs.splice(0));
    } else if (/\.webp$/i.test(f)) {
      // print variant for the lookbook PDF (alpha flattened on brand cream)
      const print = path.join(DIR, `${base}-print.jpg`);
      if (!(fs.existsSync(print) && fs.statSync(print).mtimeMs >= fs.statSync(full).mtimeMs)) {
        await sharp(full).resize({ width: PRINT_WIDTH, withoutEnlargement: true }).flatten({ background: CREAM }).jpeg({ quality: 82, progressive: false }).toFile(print);
        made++;
      }
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
