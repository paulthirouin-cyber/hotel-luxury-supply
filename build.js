#!/usr/bin/env node
// HL Supply — static pre-render build (Phase 1).
//
// Turns the hash-routed catalog SPA into real, crawlable URLs in dist/:
//   /                                 homepage
//   /products/                        catalog landing
//   /products/:category/              8 category pages
//   /products/:category/:slug/        45 product pages
//   /bespoke/                         bespoke atelier
//   /quote/                           quote cart (noindex)
//   /404.html                         not found
//   /products.html, /category.html, /product.html   legacy redirect shims
//
// Each page is rendered by the SAME renderers the browser uses (executed in
// jsdom with <html data-static>), so content lives in the HTML source and
// the client JS only hydrates interactivity (quantity, tiers, quote, drawers).
//
// Usage: node build.js            → dist/
//        node build.js --out DIR  → custom output directory

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const seo = require("./scripts/seo");
const perf = require("./scripts/perf");
const content = require("./scripts/content");
const SITE_CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, "config", "site.json"), "utf8"));

const ROOT = __dirname;
const SITE = "https://hotelluxurysupply.com";
const OUT = (() => {
  const i = process.argv.indexOf("--out");
  return path.resolve(ROOT, i > -1 ? process.argv[i + 1] : "dist");
})();

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const CATALOG_SCRIPTS = [
  "js/routes.js", "js/leads.js", "js/main.js", "js/mobile-menu.js", "js/categories.js", "js/products.js",
  "js/collections.js", "js/pricing.js", "js/quote-store.js", "js/pages.js", "js/catalog.js", "js/quote-pdf.js",
  "js/quote-page.js", "js/bespoke-page.js", "js/bespoke-drawers.js"
];
const HOME_SCRIPTS = ["js/routes.js", "js/categories.js", "js/category-section.js"];
const STATIC_DIRS = ["css", "js", "assets"];

/* ---------------- data ---------------- */

function loadData() {
  const dom = new JSDOM("<!DOCTYPE html><html data-static><body></body></html>", { runScripts: "outside-only" });
  ["js/routes.js", "js/categories.js", "js/products.js", "js/collections.js"].forEach((f) => dom.window.eval(read(f)));
  return { CATS: dom.window.HL_CATEGORIES, PRODS: dom.window.HL_PRODUCTS, COLS: dom.window.HL_COLLECTIONS };
}

/* ---------------- page meta ---------------- */

const HOME_META = {
  title: "Bespoke Branded Goods for Luxury Hospitality | HL Supply",
  description: "HL Supply is a bespoke product atelier creating custom branded guest goods for luxury hotels, resorts, private clubs, spas, and destination events.",
  path: "/",
  image: "/assets/catalog/cat-bags.jpg"
};
const LANDING_META = {
  title: "Custom Hospitality Products Catalog | HL Supply",
  description: "Explore custom guest goods for hotels, resorts, private clubs, and destination events: bags, hats, bottles, flip-flops, leather goods, slippers, and accessories.",
  path: "/products/",
  image: "/assets/catalog/cat-bags.jpg"
};
const BESPOKE_META = {
  title: "Bespoke Hospitality Products & Custom Guest Goods | HL Supply",
  description: "Custom dimensions, materials, colors, trims, packaging, and logo treatments for hospitality goods that need to feel completely your own. Start a bespoke project.",
  path: "/bespoke/",
  image: "/assets/catalog/cat-leather-goods.jpg"
};
const QUOTE_META = {
  title: "Quote Cart | HL Supply",
  description: "Review your project selections and submit them to the HL Supply concierge for a formal quote and proof.",
  path: "/quote/",
  noindex: true
};
const NOT_FOUND_META = {
  title: "Page Not Found | HL Supply",
  description: "The page you were looking for isn’t in the atelier. Explore the catalog instead.",
  path: "/404.html",
  noindex: true
};

function analyticsHTML() {
  const a = SITE_CONFIG.analytics || {};
  if (!a.enabled) return "";
  if (a.provider === "ga4" && a.measurementId) {
    return `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(a.measurementId)}"></script>` +
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${esc(a.measurementId)}');</script>`;
  }
  return `<script defer data-domain="${esc(a.domain || new URL(SITE).host)}" src="https://plausible.io/js/script.js"></script>`;
}

function verificationHTML() {
  const v = SITE_CONFIG.verification || {};
  return [
    v.google ? `<meta name="google-site-verification" content="${esc(v.google)}" />` : "",
    v.bing ? `<meta name="msvalidate.01" content="${esc(v.bing)}" />` : ""
  ].filter(Boolean).join("\n");
}

function headHTML(meta) {
  const url = SITE + meta.path;
  const img = SITE + (meta.image || "/assets/catalog/cat-bags.jpg");
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    meta.noindex ? `<meta name="robots" content="noindex,follow" />` : "",
    meta.keywords && meta.keywords.length ? `<meta name="keywords" content="${esc(meta.keywords.join(", "))}" />` : "",
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="theme-color" content="#1b2a41" />`,
    `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`,
    `<meta property="og:site_name" content="HL Supply" />`,
    `<meta property="og:type" content="${meta.ogType || "website"}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    verificationHTML(),
    meta.noindex ? "" : analyticsHTML()
  ].filter(Boolean).map((l) => "  " + l).join("\n");
}

/* ---------------- URL rewriting ---------------- */

// Any legacy/SPA href → clean static URL. Same-page anchors are left alone.
function cleanHref(href, pageIsHome) {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|\/)/.test(href)) return href;
  let m;
  if ((m = href.match(/^products\.html(#\/.*)?$/))) return routeToPath(m[1] || "#/products");
  if (href.indexOf("#/") === 0) return routeToPath(href);
  if ((m = href.match(/^index\.html(#.*)?$/))) return pageIsHome && m[1] ? m[1] : "/" + (m[1] || "");
  if ((m = href.match(/^category\.html\?cat=([a-z-]+)$/))) return "/products/" + m[1] + "/";
  if ((m = href.match(/^product\.html\?item=([a-z-]+)$/))) return "/products/by-ref/" + m[1] + "/"; // resolved by shim
  return href; // "#anchor" or an unknown relative path
}

function routeToPath(route) {
  let r = route.replace(/^#\//, "");
  let q = "";
  const i = r.indexOf("?");
  if (i > -1) { q = r.slice(i); r = r.slice(0, i); }
  r = r.replace(/\/+$/, "");
  return "/" + (r ? r + "/" : "") + q;
}

function absolutizeAssets(doc) {
  doc.querySelectorAll("[src],[href],[srcset]").forEach((el) => {
    ["src", "href", "srcset"].forEach((attr) => {
      const v = el.getAttribute(attr);
      if (v && /^(css|js|assets)\//.test(v)) el.setAttribute(attr, "/" + v);
    });
  });
}

function rewriteLinks(doc, pageIsHome) {
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    const next = cleanHref(href, pageIsHome);
    if (next !== href) a.setAttribute("href", next);
  });
}

/* ---------------- rendering ---------------- */

function stub(win) {
  win.matchMedia = win.matchMedia || (() => ({ matches: false, addEventListener() {}, addListener() {} }));
  win.scrollTo = () => {};
  win.IntersectionObserver = win.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
  win.requestAnimationFrame = win.requestAnimationFrame || ((fn) => setTimeout(fn, 0));
}

function withStatic(html) {
  if (!/<html lang="en">/.test(html)) throw new Error("expected <html lang=\"en\"> in template");
  return html.replace('<html lang="en">', '<html lang="en" data-static>');
}

function replaceHead(doc, meta) {
  const head = doc.head;
  ["title", 'meta[name="description"]', 'link[rel="canonical"]', 'meta[name="robots"]', 'link[rel="icon"]'].forEach((sel) => {
    head.querySelectorAll(sel).forEach((n) => n.remove());
  });
  const marker = head.querySelector('meta[name="viewport"]');
  if (marker) marker.insertAdjacentHTML("afterend", "\n" + headHTML(meta));
  else head.insertAdjacentHTML("afterbegin", headHTML(meta) + "\n");
}

function injectLd(doc, ld) {
  if (!ld) return;
  const s = doc.createElement("script");
  s.setAttribute("type", "application/ld+json");
  s.textContent = JSON.stringify(ld);
  doc.head.appendChild(s);
}

function serialize(dom) {
  let html = dom.serialize();
  if (!/^<!DOCTYPE html>/i.test(html)) html = "<!DOCTYPE html>\n" + html;
  return html;
}

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return rel;
}

// Render one catalog route into a standalone page containing only its view.
function renderCatalogPage(route, meta, opts) {
  opts = opts || {};
  const dom = new JSDOM(withStatic(read("products.html")), {
    runScripts: "outside-only",
    url: SITE + routeToPath(route),
    pretendToBeVisual: true
  });
  const win = dom.window, doc = win.document;
  stub(win);
  CATALOG_SCRIPTS.forEach((f) => win.eval(read(f)));

  const activeView = opts.view;
  ["viewLanding", "viewCategory", "viewProduct", "viewBespoke", "viewQuote", "viewPage"].forEach((id) => {
    const el = doc.getElementById(id);
    if (!el) return;
    if (id !== activeView) { el.remove(); return; }
    el.removeAttribute("hidden");
    if (opts.prerendered !== false) el.setAttribute("data-prerendered", "");
  });
  if (opts.mutate) opts.mutate(doc, win);

  // runtime state must never leak into the static source
  const toast = doc.getElementById("hlToast");
  if (toast) toast.remove();
  const chip = doc.getElementById("quoteCount");
  if (chip) { chip.textContent = "0"; chip.setAttribute("hidden", ""); }
  doc.body.setAttribute("data-route", routeToPath(route));

  rewriteLinks(doc, false);
  absolutizeAssets(doc);
  replaceHead(doc, meta);
  injectLd(doc, opts.ld ? opts.ld(win) : seo.simpleLd(meta));
  perf.apply(doc, OUT);
  return serialize(dom);
}

function renderHome() {
  const dom = new JSDOM(withStatic(read("index.html")), { runScripts: "outside-only", url: SITE + "/" });
  const win = dom.window, doc = win.document;
  stub(win);
  HOME_SCRIPTS.forEach((f) => win.eval(read(f)));
  // category cards are now in the source; the browser re-runs the same
  // renderer (identical markup) and adds the reveal animation on top.
  const section = doc.querySelector(".categories");
  if (section) section.classList.remove("will-reveal", "is-inview");
  rewriteLinks(doc, true);
  absolutizeAssets(doc);
  replaceHead(doc, HOME_META);
  injectLd(doc, seo.homeLd(HOME_META));
  perf.apply(doc, OUT);
  return serialize(dom);
}

/* ---------------- shims ---------------- */

function shimPage(title, body, script) {
  return `<!DOCTYPE html>
<html lang="en" data-static>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="robots" content="noindex" />
<script src="/js/routes.js"></script>
<script>${script}</script>
</head>
<body><p style="font-family:Jost,sans-serif;padding:2rem">${body}</p></body>
</html>
`;
}

const PRODUCTS_SHIM = shimPage("HL Supply", 'Redirecting to the <a href="/products/">Atelier Catalog</a>&hellip;',
  `// legacy hash routes (#/products/...) are handled by routes.js; otherwise go to the catalog
  if ((window.location.hash || "").indexOf("#/") !== 0) window.HLRoutes.go("/products/", true);`);

const CATEGORY_SHIM = shimPage("HL Supply", 'Redirecting to the <a href="/products/">Atelier Catalog</a>&hellip;',
  `var cat = new URLSearchParams(window.location.search).get("cat") || "";
  window.HLRoutes.go("/products/" + (cat ? cat.replace(/[^a-z0-9-]/g, "") + "/" : ""), true);`);

function productShim(PRODS) {
  const map = {};
  PRODS.forEach((p) => { map[p.slug] = "/products/" + p.category + "/" + p.slug + "/"; });
  return shimPage("HL Supply", 'Redirecting to the <a href="/products/">Atelier Catalog</a>&hellip;',
    `var MAP = ${JSON.stringify(map)};
  var item = new URLSearchParams(window.location.search).get("item") || "";
  window.HLRoutes.go(MAP[item] || "/products/", true);`);
}

/* ---------------- copy static dirs ---------------- */

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/* ---------------- main ---------------- */

function build() {
  const { CATS, PRODS, COLS } = loadData();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  STATIC_DIRS.forEach((d) => copyDir(path.join(ROOT, d), path.join(OUT, d)));
  fs.copyFileSync(path.join(ROOT, "favicon.svg"), path.join(OUT, "favicon.svg"));

  const pages = [];
  const routes = []; // { path, title, noindex } — reused by sitemap/llms generation later

  function emit(rel, html, meta) {
    pages.push(write(rel, html));
    routes.push({ path: meta.path, title: meta.title, noindex: !!meta.noindex });
  }

  emit("index.html", renderHome(), HOME_META);
  emit("products/index.html", renderCatalogPage("#/products", { ...LANDING_META, keywords: ["custom hospitality products", "hotel guest goods catalog"] },
    { view: "viewLanding", ld: () => seo.landingLd(LANDING_META, CATS) }), LANDING_META);

  for (const c of CATS) {
    const meta = {
      title: c.metaTitle, description: c.metaDescription, keywords: c.keywords,
      path: "/products/" + c.slug + "/", image: c.image ? "/" + c.image.replace(/^\//, "") : undefined
    };
    emit("products/" + c.slug + "/index.html", renderCatalogPage("#/products/" + c.slug, meta,
      { view: "viewCategory", ld: () => seo.categoryLd(meta, c, PRODS.filter((p) => p.category === c.slug)) }), meta);
  }

  for (const p of PRODS) {
    const meta = {
      title: p.metaTitle, description: p.metaDescription, keywords: p.keywords,
      path: "/products/" + p.category + "/" + p.slug + "/", image: p.image ? "/" + p.image.replace(/^\//, "") : undefined, ogType: "product"
    };
    emit("products/" + p.category + "/" + p.slug + "/index.html",
      renderCatalogPage("#/products/" + p.category + "/" + p.slug, meta,
        { view: "viewProduct", ld: () => seo.productLd(meta, p, CATS.find((c) => c.slug === p.category)) }), meta);
  }

  // collections: cross-category curation rendered by catalog.js into the page view
  {
    const colsMeta = { title: "Collections: Custom Guest Goods by Property Moment | HL Supply", description: "Five curated collections from the HL Supply catalog: poolside, beach club, spa suite, golf and club, sports and wellness. One guest moment, one colorway.", path: "/collections/", keywords: ["hotel amenity collections", "resort merchandise collections"] };
    emit("collections/index.html", renderCatalogPage("#/collections", colsMeta,
      { view: "viewPage", ld: () => seo.collectionsIndexLd(colsMeta, COLS) }), colsMeta);
    for (const c of COLS) {
      const meta = { title: c.metaTitle, description: c.metaDescription, keywords: c.keywords, path: "/collections/" + c.slug + "/", image: c.image ? "/" + c.image.replace(/^\//, "") : undefined };
      emit("collections/" + c.slug + "/index.html", renderCatalogPage("#/collections/" + c.slug, meta,
        { view: "viewPage", ld: () => seo.collectionLd(meta, c, c.products.map((s) => PRODS.find((p) => p.slug === s)).filter(Boolean)) }), meta);
    }
  }

  emit("bespoke/index.html", renderCatalogPage("#/bespoke", BESPOKE_META,
    { view: "viewBespoke", ld: (win) => seo.bespokeLd(BESPOKE_META, win.HLBespokePage.FAQS) }), BESPOKE_META);
  // info pages (about, process, contact, legal) declared in js/pages.js
  {
    const probe = new JSDOM(withStatic(read("products.html")), { runScripts: "outside-only", url: SITE + "/" });
    stub(probe.window);
    ["js/routes.js", "js/pages.js"].forEach((f) => probe.window.eval(read(f)));
    const PAGES = probe.window.HL_PAGES;
    for (const slug of PAGES.__list()) {
      const pg = PAGES[slug];
      const meta = { title: pg.title, description: pg.description, keywords: pg.keywords, path: pg.path, noindex: !!pg.noindex };
      emit(pg.path.replace(/^\//, "") + "index.html", renderCatalogPage("#/" + slug, meta,
        { view: "viewPage", ld: () => seo.pageLd(meta, pg.schemaType, pg.crumb) }), meta);
    }
  }

  // content engine: guides + glossary from content/ (Node only)
  const GUIDE_SUMMARIES = [];
  {
    const probe = new JSDOM(withStatic(read("products.html")), { runScripts: "outside-only", url: SITE + "/" });
    stub(probe.window);
    CATALOG_SCRIPTS.forEach((f) => probe.window.eval(read(f)));
    const PAGES = probe.window.HL_PAGES;
    const helpers = { cardHTML: probe.window.HLCatalog.cardHTML };
    const GUIDES = content.loadGuides();
    const USECASES = content.loadUseCases();
    const GLOSSARY = content.loadGlossary();
    const data = { CATS, PRODS, GUIDES, USECASES, PAGES, GLOSSARY };
    GUIDES.forEach((g) => { const c = CATS.find((x) => x.slug === g.meta.category); g.categoryName = c ? c.name : ""; });
    // every category must point at an existing guide and vice versa
    CATS.forEach((c) => { if (c.guide && !GUIDES.find((g) => g.slug === c.guide)) throw new Error("category " + c.slug + " points at missing guide " + c.guide); });

    for (const g of GUIDES) {
      const r = content.renderGuide(g, data, helpers);
      const meta = { title: r.meta.metaTitle || r.meta.title, description: r.meta.description, keywords: r.meta.keywords, path: g.path, image: r.category && r.category.image ? "/" + r.category.image.replace(/^\//, "") : undefined, ogType: "article" };
      emit(g.path.replace(/^\//, "") + "index.html", renderCatalogPage("#/guides/" + g.slug, meta, {
        view: "viewPage",
        mutate(doc) { doc.getElementById("pageMount").innerHTML = r.html; doc.getElementById("pageMount").setAttribute("data-page", "guide"); },
        ld: () => seo.articleLd(meta, { meta: r.meta, faqs: r.faqs, words: r.words, category: r.category })
      }), meta);
      GUIDE_SUMMARIES.push({ title: r.meta.title, path: g.path, summary: r.meta.summary || r.meta.description, words: r.words });
    }
    for (const g of USECASES) {
      const r = content.renderGuide(g, data, helpers);
      const meta = { title: r.meta.metaTitle || r.meta.title, description: r.meta.description, keywords: r.meta.keywords, path: g.path, image: r.products.find((p) => p.image) ? "/" + r.products.find((p) => p.image).image.replace(/^\//, "") : undefined, ogType: "article" };
      emit(g.path.replace(/^\//, "") + "index.html", renderCatalogPage("#/for/" + g.slug, meta, {
        view: "viewPage",
        mutate(doc) { doc.getElementById("pageMount").innerHTML = r.html; doc.getElementById("pageMount").setAttribute("data-page", "usecase"); },
        ld: () => seo.articleLd(meta, { meta: r.meta, faqs: r.faqs, words: r.words, category: null, root: { name: "For", path: "/for/" } })
      }), meta);
      GUIDE_SUMMARIES.push({ title: r.meta.title, path: g.path, summary: r.meta.summary || r.meta.description, words: r.words });
    }
    const forMeta = { title: "Custom Guest Goods by Property and Event | HL Supply", description: "What golf tournaments, beach clubs, spas, hotel openings, and corporate retreats commission from HL Supply, with the quantities and timelines that fit each program.", path: "/for/", keywords: ["custom hospitality products by use case", "hotel merchandise programs"] };
    emit("for/index.html", renderCatalogPage("#/for", forMeta, {
      view: "viewPage",
      mutate(doc) { doc.getElementById("pageMount").innerHTML = content.renderUseCasesIndex(data); },
      ld: () => seo.pageLd(forMeta, "CollectionPage", "For")
    }), forMeta);

    const idxMeta = { title: "Buying Guides for Custom Hospitality Products | HL Supply", description: "One buyer\u2019s guide per category: custom hotel totes, hats, bottles, flip-flops, leather goods, slippers, and accessories. Materials, minimums, logo methods, and timelines.", path: "/guides/", keywords: ["custom hotel products guide", "hotel merchandise buying guide"] };
    emit("guides/index.html", renderCatalogPage("#/guides", idxMeta, {
      view: "viewPage",
      mutate(doc) { doc.getElementById("pageMount").innerHTML = content.renderGuidesIndex(data); },
      ld: () => seo.pageLd(idxMeta, "CollectionPage", "Guides")
    }), idxMeta);
    const glMeta = { title: "Hospitality Customization Glossary | HL Supply", description: "Plain definitions of " + GLOSSARY.terms.length + " terms used when commissioning custom branded guest goods: MOQ, quantity tiers, proof, embroidery, deboss, laser etching, lead time.", path: "/glossary/", keywords: ["hospitality customization glossary", "what is MOQ custom products", "embroidery vs deboss vs laser etching"] };
    emit("glossary/index.html", renderCatalogPage("#/glossary", glMeta, {
      view: "viewPage",
      mutate(doc) { doc.getElementById("pageMount").innerHTML = content.renderGlossary(data); },
      ld: () => seo.glossaryLd(glMeta, GLOSSARY)
    }), glMeta);
  }

  // quote cart is user state: ship the empty state, the client renders the real cart
  emit("quote/index.html", renderCatalogPage("#/quote", QUOTE_META, { view: "viewQuote", prerendered: false }), QUOTE_META);

  emit("404.html", renderCatalogPage("#/products", NOT_FOUND_META, {
    view: "viewLanding",
    mutate(doc, win) {
      const view = doc.getElementById("viewLanding");
      view.innerHTML = win.HLCatalog.notFoundHTML("Page");
      view.id = "viewNotFound";
    }
  }), NOT_FOUND_META);

  write("products.html", PRODUCTS_SHIM);
  write("category.html", CATEGORY_SHIM);
  write("product.html", productShim(PRODS));
  write("_redirects", "/index.html / 301\n");
  write("_headers", [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: SAMEORIGIN",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/css/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/js/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/favicon.svg",
    "  Cache-Control: public, max-age=604800",
    ""
  ].join("\n"));
  // IndexNow ownership file (config/indexnow.key → /<key>.txt)
  const keyFile = path.join(ROOT, "config", "indexnow.key");
  if (fs.existsSync(keyFile)) {
    const key = fs.readFileSync(keyFile, "utf8").trim();
    if (/^[a-f0-9]{32}$/.test(key)) write(key + ".txt", key + "\n");
  }
  const today = new Date().toISOString().slice(0, 10);
  write("sitemap.xml", seo.sitemapXml(routes, today));
  write("robots.txt", seo.robotsTxt());
  write("llms.txt", seo.llmsTxt(CATS, PRODS, { guides: GUIDE_SUMMARIES, collections: COLS }));
  write("build-manifest.json", JSON.stringify({ builtAt: new Date().toISOString(), site: SITE, routes }, null, 2));

  console.log(`built ${pages.length} pages into ${path.relative(ROOT, OUT) || "."}/ (${routes.filter((r) => !r.noindex).length} indexable)`);
  return { pages, routes };
}

if (require.main === module) build();
module.exports = { build, cleanHref, routeToPath, SITE, OUT };
