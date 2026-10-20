// HL Supply — build-time performance pass (Phase 2.4).
// - inline every template stylesheet (minified) so no CSS request blocks render
// - preload the two primary self-hosted font files
// - defer every script
// - width/height on every local image (CLS) read from the file headers

const fs = require("fs");
const path = require("path");

const PRELOAD_FONTS = ["/assets/fonts/marcellus-latin.woff2", "/assets/fonts/jost-latin.woff2"];

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

// Inline CSS is resolved against the page URL, so relative asset urls must become root-absolute.
function absolutizeCssUrls(css) {
  return css.replace(/url\((["']?)(?:\.\.\/)+(assets|css|js)\//g, "url($1/$2/");
}

function inlineStyles(doc, distDir) {
  const links = [...doc.querySelectorAll('link[rel="stylesheet"][href^="/"]')];
  if (!links.length) return;
  const css = links.map((l) => {
    const file = path.join(distDir, l.getAttribute("href"));
    return absolutizeCssUrls(minifyCss(fs.readFileSync(file, "utf8")));
  }).join("");
  const style = doc.createElement("style");
  style.textContent = css;
  links[0].replaceWith(style);
  links.slice(1).forEach((l) => l.remove());
}

function preloadFonts(doc) {
  const head = doc.head;
  const anchor = head.querySelector("style") || head.lastElementChild;
  PRELOAD_FONTS.forEach((href) => {
    const link = doc.createElement("link");
    link.setAttribute("rel", "preload");
    link.setAttribute("as", "font");
    link.setAttribute("type", "font/woff2");
    link.setAttribute("href", href);
    link.setAttribute("crossorigin", "");
    head.insertBefore(link, anchor);
  });
}

function deferScripts(doc) {
  doc.querySelectorAll("script[src]").forEach((s) => s.setAttribute("defer", ""));
}

/* ---------------- image dimensions ---------------- */

function readDims(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 30) return null;
  // WebP
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
    }
    if (chunk === "VP8 ") {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    return null;
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  // PNG
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return null;
}

const dimCache = new Map();
function imageDims(doc, distDir) {
  doc.querySelectorAll("img[src^='/assets/']").forEach((img) => {
    if (img.hasAttribute("width") && img.hasAttribute("height")) return;
    const src = img.getAttribute("src");
    if (!dimCache.has(src)) {
      const file = path.join(distDir, src);
      dimCache.set(src, fs.existsSync(file) ? readDims(file) : null);
    }
    const d = dimCache.get(src);
    if (d && d.width && d.height) {
      img.setAttribute("width", String(d.width));
      img.setAttribute("height", String(d.height));
    }
  });
}

// The largest above-the-fold image must not be lazy-loaded (LCP).
function eagerHero(doc) {
  const hero = doc.querySelector(".hero__img, .page-hero img, .pd__ph img");
  if (!hero) return;
  hero.removeAttribute("loading");
  hero.setAttribute("fetchpriority", "high");
  hero.setAttribute("decoding", "async");
}

// Responsive sources: use generated variants (scripts/images.js) when present.
//   /assets/catalog/cat-x.jpg  → src cat-x-1600.webp, srcset 960w/1600w (hero, full-bleed)
//   /assets/catalog/x.webp     → srcset x-480.webp 480w, x.webp <orig>w (cards, contained)
function responsiveImages(doc, distDir) {
  doc.querySelectorAll("img[src^='/assets/catalog/']").forEach((img) => {
    const src = img.getAttribute("src");
    const m = src.match(/^\/assets\/catalog\/(cat-[a-z-]+)\.(jpg|jpeg|png)$/);
    if (m) {
      const big = "/assets/catalog/" + m[1] + "-1600.webp", mid = "/assets/catalog/" + m[1] + "-960.webp";
      if (fs.existsSync(path.join(distDir, big))) {
        img.setAttribute("src", big);
        const dm = fs.existsSync(path.join(distDir, mid)) ? readDims(path.join(distDir, mid)) : null, db = readDims(path.join(distDir, big));
        img.setAttribute("srcset", (dm && db && dm.width < db.width) ? mid + " " + dm.width + "w, " + big + " " + db.width + "w" : big + " " + (db ? db.width : 1600) + "w");
        img.setAttribute("sizes", img.classList.contains("hero__img") ? "100vw" : "(max-width: 900px) 100vw, 50vw");
        const d = readDims(path.join(distDir, big));
        if (d) { img.setAttribute("width", String(d.width)); img.setAttribute("height", String(d.height)); }
      }
      return;
    }
    const p = src.match(/^\/assets\/catalog\/([a-z0-9-]+)\.webp$/);
    if (p && !/-\d+$/.test(p[1])) {
      const small = "/assets/catalog/" + p[1] + "-480.webp";
      if (!fs.existsSync(path.join(distDir, small))) return;
      const d = readDims(path.join(distDir, src));
      const w = d ? d.width : 800;
      img.setAttribute("srcset", small + " 480w, " + src + " " + w + "w");
      const main = img.closest(".pd__ph");
      img.setAttribute("sizes", main ? "(max-width: 900px) 100vw, 50vw" : "(max-width: 600px) 90vw, 400px");
    }
  });
}

function apply(doc, distDir) {
  eagerHero(doc);
  responsiveImages(doc, distDir);
  inlineStyles(doc, distDir);
  preloadFonts(doc);
  deferScripts(doc);
  imageDims(doc, distDir);
}

module.exports = { apply, minifyCss, absolutizeCssUrls, readDims, PRELOAD_FONTS };
