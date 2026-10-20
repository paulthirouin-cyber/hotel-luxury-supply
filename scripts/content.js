// HL Supply — content engine (Phase 4): guides + glossary rendered at build.
// Reads content/guides/*.md and content/glossary.json, resolves internal
// link shorthands against the live data, and returns page HTML + schema
// inputs for build.js. Everything here runs in Node only.

const fs = require("fs");
const path = require("path");
const md = require("./markdown");

const ROOT = path.join(__dirname, "..");
const esc = md.esc;

// A collection is a content folder served under its own URL prefix:
//   content/guides/*.md → /guides/<slug>/   (type: guide | comparison)
//   content/for/*.md    → /for/<slug>/      (type: usecase)
function loadCollection(folder, prefix) {
  const dir = path.join(ROOT, "content", folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
    const slug = f.replace(/\.md$/, "");
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    const { meta } = md.parseFrontMatter(src);
    meta.type = meta.type || (folder === "for" ? "usecase" : "guide");
    return { slug, src, meta, path: prefix + slug + "/", collection: folder };
  }).sort((a, b) => a.slug.localeCompare(b.slug));
}

function loadGuides() { return loadCollection("guides", "/guides/"); }
function loadUseCases() { return loadCollection("for", "/for/"); }

function loadGlossary() {
  const file = path.join(ROOT, "content", "glossary.json");
  if (!fs.existsSync(file)) return { title: "Glossary", intro: "", terms: [] };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Resolve [text](kind:slug) shorthands to real URLs; throws on unknown targets
// so a broken internal link fails the build instead of shipping.
function makeResolver(data) {
  const { CATS, PRODS, GUIDES, PAGES, GLOSSARY } = data;
  return function resolve(kind, slug) {
    if (kind === "product") {
      const p = PRODS.find((x) => x.slug === slug);
      if (!p) throw new Error("unknown product link: " + slug);
      return "/products/" + p.category + "/" + p.slug + "/";
    }
    if (kind === "category") {
      if (!CATS.find((c) => c.slug === slug)) throw new Error("unknown category link: " + slug);
      return "/products/" + slug + "/";
    }
    if (kind === "guide") {
      if (!GUIDES.find((g) => g.slug === slug)) throw new Error("unknown guide link: " + slug);
      return "/guides/" + slug + "/";
    }
    if (kind === "for") {
      if (!(data.USECASES || []).find((g) => g.slug === slug)) throw new Error("unknown use-case link: " + slug);
      return "/for/" + slug + "/";
    }
    if (kind === "for") {
      if (!(data.USECASES || []).find((g) => g.slug === slug)) throw new Error("unknown use-case link: " + slug);
      return "/for/" + slug + "/";
    }
    if (kind === "glossary") {
      if (!GLOSSARY.terms.find((t) => t.slug === slug)) throw new Error("unknown glossary link: " + slug);
      return "/glossary/#" + slug;
    }
    if (kind === "page") {
      if (slug === "quote") return "/quote/";
      if (slug === "bespoke") return "/bespoke/";
      if (!PAGES[slug]) throw new Error("unknown page link: " + slug);
      return PAGES[slug].path;
    }
    throw new Error("unknown link kind: " + kind);
  };
}

function labelFor(ref, data) {
  const [kind, slug] = ref.includes(":") ? ref.split(":") : ["page", ref];
  if (kind === "product") { const p = data.PRODS.find((x) => x.slug === slug); return p ? p.name : slug; }
  if (kind === "category") { const c = data.CATS.find((x) => x.slug === slug); return c ? c.name : slug; }
  if (kind === "guide") { const g = data.GUIDES.find((x) => x.slug === slug); return g ? g.meta.title.replace(/:.*$/, "") : slug; }
  if (kind === "for") { const g = (data.USECASES || []).find((x) => x.slug === slug); return g ? g.meta.title : slug; }
  if (kind === "for") { const g = (data.USECASES || []).find((x) => x.slug === slug); return g ? g.meta.title : slug; }
  if (kind === "glossary") { const t = data.GLOSSARY.terms.find((x) => x.slug === slug); return t ? t.term : slug; }
  if (slug === "quote") return "Quote cart";
  if (slug === "bespoke") return "Bespoke Atelier";
  const pg = data.PAGES[slug];
  return pg ? pg.crumb || pg.title : slug;
}

function crumbs(items) {
  return '<nav class="pd__crumbs" aria-label="Breadcrumb">' +
    items.map((it, i) => (i < items.length - 1
      ? '<a href="' + esc(it.href) + '">' + esc(it.name) + '</a><span aria-hidden="true">/</span>'
      : '<span aria-current="page">' + esc(it.name) + "</span>")).join("") +
    "</nav>";
}

function readingTime(words) { return Math.max(1, Math.round(words / 230)); }

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function cardEyebrow(g) {
  if (g.meta.type === "comparison") return "Comparison";
  if (g.meta.type === "usecase") return "For " + (g.meta.audience || "properties");
  return g.categoryName || "Guide";
}

function guideCard(g) {
  return '<a class="gcard" href="' + esc(g.path) + '">' +
    '<span class="eyebrow">' + esc(cardEyebrow(g)) + "</span>" +
    "<h3>" + esc(g.meta.title.replace(/: The Complete Buyer.s Guide$/, "")) + "</h3>" +
    "<p>" + esc(g.meta.summary || g.meta.description) + "</p>" +
    '<span class="tlink">Read the guide</span></a>';
}

/* ---------------- guide page ---------------- */

function renderGuide(guide, data, helpers) {
  const { CATS, PRODS, GUIDES, GLOSSARY } = data;
  const resolver = makeResolver(data);
  const links = new Set();
  const terms = GLOSSARY.terms.map((t) => ({ slug: t.slug, term: t.term, pattern: t.pattern }));
  const r = md.render(guide.src, { resolver, onLink: (h) => links.add(h), terms, glossaryHref: "/glossary/", maxAutoLinks: 12 });
  const meta = r.meta;
  const cat = CATS.find((c) => c.slug === meta.category);
  const listed = meta.products ? String(meta.products).split(",").map((s) => s.trim()).filter(Boolean) : null;
  if (listed) listed.forEach((s) => { if (!PRODS.find((p) => p.slug === s)) throw new Error(guide.slug + ": unknown product in front matter: " + s); });
  const prods = listed ? listed.map((s) => PRODS.find((p) => p.slug === s)) : PRODS.filter((p) => p.category === meta.category);
  const isUse = meta.type === "usecase";
  const pool = isUse ? (data.USECASES || []) : GUIDES;
  const sameType = pool.filter((g) => g.slug !== guide.slug && (g.meta.type || "guide") === (meta.type || "guide"));
  const otherType = pool.filter((g) => g.slug !== guide.slug && (g.meta.type || "guide") !== (meta.type || "guide"));
  const others = sameType.concat(otherType).slice(0, 6);
  const rootCrumb = isUse ? { name: "For", href: "/for/" } : { name: "Guides", href: "/guides/" };
  const eyebrow = isUse ? "For " + (meta.audience || "properties") : (meta.type === "comparison" ? "Comparison" : "Buying guide" + (cat ? " \u00b7 " + cat.name : ""));

  // body without the H1 (the template renders it) and with FAQ answers kept
  const body = r.html.replace(/^<h1>[\s\S]*?<\/h1>\n?/, "");

  const toc = r.headings.length
    ? '<aside class="guide-toc"><nav aria-label="Contents"><span class="eyebrow">Contents</span><ol>' +
      r.headings.map((h) => '<li><a href="#' + esc(h.id) + '">' + esc(h.text) + "</a></li>").join("") + "</ol></nav></aside>"
    : "";

  const productsTitle = listed
    ? (isUse ? "The pieces this program is built from" : "Products compared in this guide")
    : (cat ? "Every " + cat.name.toLowerCase() + " style in the catalog" : "Products");
  const products = prods.length
    ? '<section class="guide-products" aria-labelledby="guideProductsTitle">' +
      '<div class="section-head"><span class="eyebrow">' + (isUse ? "The collection" : "In this guide") + '</span><h2 id="guideProductsTitle">' + esc(productsTitle) + "</h2></div>" +
      '<div class="pgrid">' + prods.map((p) => helpers.cardHTML(p)).join("") + "</div>" +
      '<div class="btn-row">' + (cat ? '<a class="btn btn--solid" href="/products/' + esc(meta.category) + '/">View the ' + esc(cat.name) + " collection</a>" : '<a class="btn btn--solid" href="/products/">Explore the catalog</a>') + '<a class="btn" href="/quote/">Build a Quote</a></div>' +
      "</section>"
    : "";

  const related = '<section class="guide-related"><div class="section-head"><span class="eyebrow">' + (isUse ? "Other programs" : "More guides") + '</span><h2>' + (isUse ? "Custom goods for other properties and events" : "Other guides") + "</h2></div>" +
    '<div class="gcards">' + others.map(guideCard).join("") + "</div>" +
    '<p class="page-note">Unfamiliar term? The <a href="/glossary/">hospitality customization glossary</a> defines MOQs, tiers, proofs, embroidery, debossing, laser etching, and more.</p></section>';

  const html =
    crumbs([{ name: "Home", href: "/" }, rootCrumb, { name: meta.title.replace(/: The Complete Buyer.s Guide$/, "").replace(/:.*$/, "") }]) +
    '<header class="page-intro guide-intro">' +
    '<span class="eyebrow">' + esc(eyebrow) + "</span>" +
    "<h1>" + esc(meta.title) + "</h1>" +
    '<p class="guide-meta"><span>Published <time datetime="' + esc(meta.published) + '">' + esc(fmtDate(meta.published)) + "</time></span>" +
    (meta.updated && meta.updated !== meta.published ? '<span>Updated <time datetime="' + esc(meta.updated) + '">' + esc(fmtDate(meta.updated)) + "</time></span>" : "") +
    "<span>" + readingTime(r.words) + " min read</span><span>By HL Supply</span></p>" +
    "</header>" +
    (meta.answer ? '<p class="category-answer">' + esc(meta.answer) + "</p>" : "") +
    '<div class="guide-layout">' + toc + '<article class="guide-body">' + body + "</article></div>" +
    products + related;

  return { html, meta, faqs: r.faqs, words: r.words, headings: r.headings, links: [...links], category: cat, products: prods };
}

/* ---------------- guides index ---------------- */

function renderGuidesIndex(data) {
  const { GUIDES } = data;
  const buying = GUIDES.filter((g) => g.meta.type !== "comparison");
  const comparisons = GUIDES.filter((g) => g.meta.type === "comparison");
  const usecases = data.USECASES || [];
  return crumbs([{ name: "Home", href: "/" }, { name: "Guides" }]) +
    '<header class="page-intro"><span class="eyebrow">HL Supply / Guides</span><h1>Buying guides for custom hospitality products</h1>' +
    '<p class="page-intro__lede">What to specify, what it costs to get wrong, and how the atelier produces it: one guide per category, written for the people who commission guest goods for hotels, resorts, clubs, and spas.</p></header>' +
    '<div class="gcards gcards--index">' + buying.map(guideCard).join("") + "</div>" +
    (comparisons.length ? '<section class="page-section"><div class="section-head"><span class="eyebrow">Comparisons</span><h2>Side by side</h2></div><div class="gcards">' + comparisons.map(guideCard).join("") + "</div></section>" : "") +
    (usecases.length ? '<section class="page-section"><div class="section-head"><span class="eyebrow">By property and event</span><h2>Custom goods for your program</h2></div><div class="gcards">' + usecases.map(guideCard).join("") + '</div><p class="page-note"><a href="/for/">All programs</a></p></section>' : "") +
    '<section class="page-section page-section--tint"><h2>Glossary</h2><p>Every term used in these guides, defined in plain language: MOQ, quantity tiers, proof, mockup, embroidery, deboss, laser etching, Pantone matching, lead time, and more.</p><p><a class="tlink" href="/glossary/">Open the glossary</a></p></section>';
}

/* ---------------- glossary ---------------- */

function renderGlossary(data) {
  const { GLOSSARY } = data;
  const sorted = [...GLOSSARY.terms].sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
  const letters = [];
  const groups = {};
  sorted.forEach((t) => {
    const L = t.term.replace(/^\d/, "#").charAt(0).toUpperCase();
    if (!groups[L]) { groups[L] = []; letters.push(L); }
    groups[L].push(t);
  });
  const resolver = makeResolver(data);
  const relLinks = (t) => (t.related || []).map((ref) => {
    const [kind, slug] = ref.includes(":") ? ref.split(":") : ["page", ref];
    return '<a href="' + esc(resolver(kind, slug)) + '">' + esc(labelFor(ref, data)) + "</a>";
  }).join("");

  return crumbs([{ name: "Home", href: "/" }, { name: "Guides", href: "/guides/" }, { name: "Glossary" }]) +
    '<header class="page-intro"><span class="eyebrow">HL Supply / Glossary</span><h1>' + esc(GLOSSARY.title) + "</h1>" +
    '<p class="page-intro__lede">' + esc(GLOSSARY.intro) + "</p></header>" +
    '<nav class="glossary-index" aria-label="Alphabetical index">' + letters.map((L) => '<a href="#letter-' + L.toLowerCase() + '">' + L + "</a>").join("") + "</nav>" +
    letters.map((L) =>
      '<section class="glossary-group" id="letter-' + L.toLowerCase() + '"><h2>' + L + "</h2><dl>" +
      groups[L].map((t) =>
        '<div class="glossary-term" id="' + esc(t.slug) + '"><dt>' + esc(t.term) + "</dt><dd><p>" + esc(t.definition) + "</p>" +
        (t.related && t.related.length ? '<p class="glossary-related"><span>See</span>' + relLinks(t) + "</p>" : "") + "</dd></div>").join("") +
      "</dl></section>").join("") +
    '<section class="page-cta"><h2>Need a term defined for your project?</h2><p>The concierge answers specification questions before a quote is ever built. Send the brief and we’ll translate it into product terms.</p>' +
    '<div class="btn-row"><a class="btn btn--solid" href="/contact/">Speak with the Concierge</a><a class="btn" href="/guides/">Read the guides</a></div></section>';
}

function renderUseCasesIndex(data) {
  const usecases = data.USECASES || [];
  return crumbs([{ name: "Home", href: "/" }, { name: "For" }]) +
    '<header class="page-intro"><span class="eyebrow">HL Supply / Programs</span><h1>Custom guest goods by property and event</h1>' +
    '<p class="page-intro__lede">Golf tournaments, beach clubs, spas, openings, and retreats each ask something different of a branded collection. These pages show what properties commission for each, built from the catalog, with the quantities and timelines that fit.</p></header>' +
    '<div class="gcards gcards--index">' + usecases.map(guideCard).join("") + "</div>" +
    '<section class="page-section page-section--tint"><h2>Buying guides and comparisons</h2><p>Materials, minimums, logo methods, and timelines by category, plus side-by-side comparisons of the decisions buyers ask about most.</p><p><a class="tlink" href="/guides/">Read the guides</a></p></section>';
}

module.exports = { loadGuides, loadUseCases, loadCollection, loadGlossary, makeResolver, renderGuide, renderGuidesIndex, renderUseCasesIndex, renderGlossary, readingTime };
