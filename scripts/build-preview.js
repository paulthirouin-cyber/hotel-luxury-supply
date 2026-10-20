#!/usr/bin/env node
// Build the single-file preview: homepage + full catalog SPA in one HTML file,
// all CSS/JS inlined and every assets/catalog/* image embedded as a data URI.
// Navigation in the preview is state-driven (sandboxed iframes may reject
// location.hash writes). The multi-page site itself is unaffected.
//
// Output: dist-preview/hl-supply-preview.html

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const CSS = ["css/fonts.css", "css/styles.css", "css/guest-journey.css", "css/category-section.css",
  "css/concierge-bell.css", "css/polish.css"];
const HOME_JS = ["js/routes.js", "js/main.js", "js/mobile-menu.js", "js/homepage-scenes.js",
  "js/guest-journey.js", "js/categories.js", "js/category-section.js", "js/concierge-bell.js"];
const EXTRA_CSS = ["css/catalog.css", "css/quote.css", "css/bespoke.css"];
const CATALOG_JS = ["js/products.js", "js/pricing.js", "js/quote-store.js", "js/catalog.js",
  "js/quote-pdf.js", "js/quote-page.js", "js/bespoke-page.js", "js/bespoke-drawers.js"];

let html = read("index.html");

// inline homepage css/js
for (const f of CSS) {
  const tag = `<link rel="stylesheet" href="${f}" />`;
  if (!html.includes(tag)) throw new Error("missing tag: " + tag);
  if (f === "css/fonts.css") {
    // single-file preview cannot carry font files: fall back to Google Fonts
    html = html.replace(tag, '<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />');
    continue;
  }
  html = html.replace(tag, "<style>\n" + read(f) + "\n</style>");
}
for (const f of HOME_JS) {
  const tag = `<script src="${f}"></script>`;
  if (!html.includes(tag)) throw new Error("missing tag: " + tag);
  html = html.replace(tag, "<script>\n" + read(f) + "\n</script>");
}
html = html.replace("</head>", EXTRA_CSS.map((f) => "<style>\n" + read(f) + "\n</style>").join("\n") + "\n</head>");

// wrap homepage sections in a view container
const heroStart = html.indexOf("  <!-- ================= HERO =================");
const footerStart = html.indexOf("  <!-- ================= FOOTER =================");
if (heroStart < 0 || footerStart < 0) throw new Error("hero/footer anchors not found");
html = html.slice(0, heroStart) + '<div data-pv="home">\n' +
  html.slice(heroStart, footerStart) + "</div>\n\n" + html.slice(footerStart);

// embed the catalog main from products.html
const prods = read("products.html");
const catMain = prods.slice(prods.indexOf('<main id="catalogViews">'), prods.indexOf("</main>") + 7);
html = html.replace("  <!-- ================= FOOTER =================",
  '\n<div data-pv="catalog" hidden>\n' + catMain + "\n</div>\n\n  <!-- ================= FOOTER =================");

// catalog scripts + preview shell
// product image paths are built at runtime ("assets/catalog/"+slug+".webp"),
// so inject an embed map into products.js and route the factory through it.
function inlineCatalogScript(f) {
  let src = read(f);
  if (f === "js/products.js") {
    const map = {};
    const dir = path.join(ROOT, "assets", "catalog");
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".webp") && file !== "cover.webp") {
        map[file.replace(/\.webp$/, "")] =
          "data:image/webp;base64," + fs.readFileSync(path.join(dir, file)).toString("base64");
      }
    }
    const hook = '  "use strict";';
    if (!src.includes(hook)) throw new Error("products.js hook missing");
    src = src.replace(hook, hook + "\n\n  var HL_EMBED = " + JSON.stringify(map) + ";");
    const line = 'image: asset("assets/catalog/" + o.slug + ".webp"),';
    if (!src.includes(line)) throw new Error("products.js image line missing");
    src = src.replace(line, 'image: HL_EMBED[o.slug] || ("assets/catalog/" + o.slug + ".webp"),');
  }
  return "<script>\n" + src + "\n</script>\n";
}
const catalogJs = CATALOG_JS.map(inlineCatalogScript).join("");
const shell = `<script>
// ---- preview-only shell. Catalog navigation lives inside catalog.js itself
// (self-contained, hash-optional). This shell only switches the homepage and
// catalog wrappers and handles homepage-bound links. ----
(function () {
  "use strict";
  var homeView = document.querySelector('[data-pv="home"]');
  var catView = document.querySelector('[data-pv="catalog"]');

  function showHome(anchorId) {
    homeView.hidden = false;
    catView.hidden = true;
    if (anchorId) {
      var el = document.getElementById(anchorId);
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }

  window.HL_ON_NAVIGATE = function () {
    homeView.hidden = true;
    catView.hidden = false;
  };

  if ((window.location.hash || "").indexOf("#/") === 0) {
    window.HL_ON_NAVIGATE();
    window.HLCatalog.route(window.location.hash);
  } else {
    showHome();
  }

  window.addEventListener("hashchange", function () {
    var h = window.location.hash || "";
    if (h.indexOf("#/") === 0) {
      window.HL_ON_NAVIGATE();
      window.HLCatalog.route(h);
    }
  });

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    if (a.classList.contains("js-quote-note") || a.hasAttribute("data-open-concierge")) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("#/") > -1) return; // catalog.js owns catalog routes

    if (href.indexOf("index.html") === 0) {
      e.preventDefault();
      var j = href.indexOf("#");
      showHome(j > -1 ? href.slice(j + 1) : "");
    } else if (href.charAt(0) === "#") {
      var el = document.getElementById(href.slice(1));
      if (el) {
        e.preventDefault();
        if (homeView.contains(el) && homeView.hidden) showHome(href.slice(1));
        else el.scrollIntoView();
      }
    } else if (/^[a-z-]+\\.html/.test(href)) {
      e.preventDefault();
      window.HL_ON_NAVIGATE();
      window.HLCatalog.route("#/products");
    }
  });
})();
</script>`;
html = html.replace("</body>", catalogJs + shell + "\n</body>");

// embed every referenced catalog asset as a data URI
const assetDir = path.join(ROOT, "assets", "catalog");
const MIME = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
let embedded = 0;
for (const file of fs.readdirSync(assetDir)) {
  const refs = "assets/catalog/" + file;
  if (!html.includes(refs)) continue;
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) continue;
  const data = fs.readFileSync(path.join(assetDir, file)).toString("base64");
  html = html.split(refs).join(`data:${mime};base64,${data}`);
  embedded++;
}

const outDir = path.join(ROOT, "dist-preview");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "hl-supply-preview.html");
fs.writeFileSync(outPath, html);
console.log(`preview built: ${outPath} (${(html.length / 1048576).toFixed(1)} MB, ${embedded} images embedded)`);
