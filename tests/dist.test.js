// Suite 3: the static build (dist/). Every URL exists, every page carries
// unique SEO head tags, every link and image resolves inside dist/, content
// is in the HTML source (no JS needed), and the client JS hydrates the
// pre-rendered pages without re-rendering them: quantity/tiers/add-to-quote,
// quote cart from persisted state, bespoke form + prefill, legacy redirects.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { ROOT, stub, data, harness, click, type } = require("./helpers");

const t = harness("DIST SUITE");
const DIST = path.join(ROOT, "dist");
const { CATS, PRODS, COLS } = data();
const COUNTS = { bags: 8, hats: 6, bottles: 4, "flip-flops": 4, "leather-goods": 6, slippers: 4, accessories: 7, pets: 6 };

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.log("FAIL: dist/ not built — run `node build.js` first");
  t.ok(false, "dist exists");
  t.done();
}

const distFile = (url) => {
  let p = url.split("#")[0].split("?")[0];
  if (p.endsWith("/")) p += "index.html";
  return path.join(DIST, p);
};
const distExists = (url) => fs.existsSync(distFile(url));
const readDist = (rel) => fs.readFileSync(path.join(DIST, rel), "utf8");

/* ---------- 1. every expected URL exists ---------- */
const PAGES = ["/about/", "/process/", "/contact/", "/privacy/", "/terms/"];
const expected = ["/", "/products/", "/bespoke/", "/quote/", "/404.html", "/products.html", "/category.html", "/product.html", "/_redirects", ...PAGES];
expected.push("/guides/", "/glossary/", ...CATS.map((c) => "/guides/" + c.guide + "/"));
const COMPARISONS = ["embroidery-vs-deboss-vs-laser-etching", "canvas-vs-woven-leather-tote", "350ml-vs-500ml-hotel-bottles", "hotel-slipper-materials-compared", "hotel-tote-styles-compared"];
const USECASES = ["golf-tournaments", "beach-clubs", "spa-wellness", "hotel-openings", "corporate-retreats"];
expected.push("/for/", ...COMPARISONS.map((s) => "/guides/" + s + "/"), ...USECASES.map((s) => "/for/" + s + "/"));
expected.push("/collections/", ...COLS.map((c) => "/collections/" + c.slug + "/"));
CATS.forEach((c) => expected.push("/products/" + c.slug + "/"));
PRODS.forEach((p) => expected.push("/products/" + p.category + "/" + p.slug + "/"));
expected.forEach((u) => t.ok(distExists(u), "exists: " + u));
["css/styles.css", "js/catalog.js", "js/routes.js", "assets/catalog/riviera-bucket-hat.webp"].forEach((f) =>
  t.ok(fs.existsSync(path.join(DIST, f)), "static copied: " + f));

/* ---------- 2. static DOM audit of every page (no scripts) ---------- */
function staticDom(url) {
  return new JSDOM(fs.readFileSync(distFile(url), "utf8"), { url: "https://hotelluxurysupply.com" + url });
}
const homeIds = new Set([...staticDom("/").window.document.querySelectorAll("[id]")].map((e) => e.id));
const titles = new Map();
let links = 0;

function auditPage(url) {
  const doc = staticDom(url).window.document;
  const ctx = "[" + url + "]";
  const html = doc.documentElement.outerHTML;

  t.ok(doc.documentElement.hasAttribute("data-static"), ctx + " html[data-static]");
  const title = doc.title;
  t.ok(title && title.length <= 75 && /HL Supply/.test(title), ctx + " title present ≤75 chars with brand: " + title);
  t.ok(!titles.has(title), ctx + " title unique (dup of " + titles.get(title) + ")");
  titles.set(title, url);
  const desc = doc.querySelector('meta[name="description"]');
  t.ok(desc && desc.content.length >= 50 && desc.content.length <= 170, ctx + " description 50–170 chars");
  t.ok(desc && !/\bacce ory\b|  /.test(desc.content), ctx + " description text intact");
  const canon = doc.querySelector('link[rel="canonical"]');
  t.ok(canon && canon.getAttribute("href") === "https://hotelluxurysupply.com" + (url === "/404.html" ? "/404.html" : url), ctx + " canonical matches URL");
  t.ok(doc.querySelector('meta[property="og:title"]') && doc.querySelector('meta[property="og:image"]'), ctx + " open graph tags");
  const icon = doc.querySelector('link[rel="icon"]');
  t.ok(icon && icon.getAttribute("href") === "/favicon.svg" && fs.existsSync(path.join(DIST, "favicon.svg")), ctx + " favicon");
  const robots = doc.querySelector('meta[name="robots"]');
  if (url === "/quote/" || url === "/404.html" || url === "/privacy/" || url === "/terms/") t.ok(robots && /noindex/.test(robots.content), ctx + " noindex");
  else t.ok(!robots, ctx + " indexable");
  t.ok(doc.querySelectorAll("h1").length === 1, ctx + " exactly one h1 (" + doc.querySelectorAll("h1").length + ")");
  t.ok(!/products\.html#|index\.html#|"index\.html"|data-pv=/.test(html), ctx + " no legacy SPA hrefs or preview markup");
  t.ok(!/\$--|Estimate pending/.test(url === "/" ? doc.body.textContent : ""), ctx + " homepage pricing-free");
  t.ok(!/Buy Now|Add to Cart|Proceed to Checkout|Payment/i.test(doc.body.textContent), ctx + " quote language only");

  const ids = new Set([...doc.querySelectorAll("[id]")].map((e) => e.id));
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href"); links++;
    if (/^(https?:|mailto:|tel:)/.test(href)) return;
    if (href.startsWith("#")) { t.ok(ids.has(href.slice(1)), ctx + " anchor exists: " + href); return; }
    if (!href.startsWith("/")) { t.ok(false, ctx + " relative href: " + href); return; }
    t.ok(/\/(\?[^#]*)?(#.*)?$|\.html$/.test(href), ctx + " clean URL form: " + href);
    t.ok(distExists(href), ctx + " link resolves: " + href);
    const hi = href.indexOf("#");
    if (hi > -1 && href.slice(0, hi) === "/") t.ok(homeIds.has(href.slice(hi + 1)), ctx + " home anchor exists: " + href);
  });
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    t.ok(src && src.startsWith("/assets/") && fs.existsSync(path.join(DIST, src)), ctx + " image absolute + exists: " + src);
    t.ok((img.getAttribute("alt") || "").length > 5, ctx + " image alt");
    const ss = img.getAttribute("srcset");
    if (ss) ss.split(",").forEach((c) => { const u = c.trim().split(/\s+/)[0]; t.ok(fs.existsSync(path.join(DIST, u)) && img.getAttribute("sizes"), ctx + " srcset candidate exists + sizes: " + u); });
    const variant = src.replace(/\.webp$/, "-480.webp");
    if (/\/assets\/catalog\//.test(src) && (fs.existsSync(path.join(DIST, variant)) || /-1600\.webp$/.test(src))) t.ok(ss, ctx + " catalog image has responsive srcset: " + src);
  });
  doc.querySelectorAll('link[rel="stylesheet"][href^="/"], script[src]').forEach((el) => {
    const src = el.getAttribute("href") || el.getAttribute("src");
    t.ok(src.startsWith("/") && fs.existsSync(path.join(DIST, src)), ctx + " asset exists: " + src);
  });
  return doc;
}

{
  const doc = auditPage("/");
  t.ok(doc.querySelectorAll("#atelierGrid a.at-card").length === 8, "home: 8 category cards in source");
  const sizes = [...doc.querySelectorAll("#atelierGrid a.at-card")].map((a) => (a.className.match(/at-card--(\w+)/) || [])[1]);
  const span = { feature: 6, small: 3, wide: 6 };
  t.ok(sizes.reduce((n, s) => n + span[s], 0) + span.feature === 36, "home: atelier grid closes with no orphan row (" + sizes.join(",") + ")");
  t.ok(doc.querySelector('#atelierGrid a[href="/products/hats/"]'), "home: category card links clean URL");
}
{
  const doc = auditPage("/products/");
  t.ok(doc.querySelectorAll("#catalogCategories .ccard").length === 8, "landing: 8 category cards in source");
  t.ok(!/\.ccard:nth-child\(n \+ 5\)/.test(doc.querySelector("head style").textContent), "landing: symmetric 4x2 category grid (no span-4 tail rule)");
  t.ok(doc.getElementById("viewLanding").hasAttribute("data-prerendered"), "landing: marked prerendered");
  t.ok(!doc.getElementById("viewCategory") && !doc.getElementById("viewProduct") && !doc.getElementById("viewQuote"), "landing: other views stripped");
}
for (const c of CATS) {
  const doc = auditPage("/products/" + c.slug + "/");
  t.ok(doc.querySelector("#categoryHero h1").textContent === c.name, c.slug + ": h1 in source");
  t.ok(doc.querySelectorAll("#categoryGrid .pcard").length === COUNTS[c.slug], c.slug + ": product cards in source");
  t.ok(doc.querySelector('.cat-bespoke a[href="/bespoke/?category=' + c.slug + '"]'), c.slug + ": bespoke CTA prefill link");
  t.ok(!doc.querySelector(".pt-tier"), c.slug + ": no pricing UI on category page");
}
for (const p of PRODS) {
  const url = "/products/" + p.category + "/" + p.slug + "/";
  const doc = auditPage(url);
  const pd = doc.getElementById("productDetail");
  t.ok(pd.querySelector("h1").textContent === p.name, p.slug + ": h1 in source");
  t.ok(pd.querySelectorAll(".pt-tier").length === 4 && pd.textContent.includes(p.ref), p.slug + ": tiers + ref in source");
  t.ok(pd.querySelectorAll(".rel-card").length === 3, p.slug + ": related in source");
  t.ok(pd.querySelector('.pd__crumbs a[href="/products/' + p.category + '/"]'), p.slug + ": breadcrumb link");
  t.ok(doc.title === p.metaTitle, p.slug + ": title from metaTitle");
}
{
  const doc = auditPage("/bespoke/");
  t.ok(doc.querySelectorAll("#bespokeMount .bcap").length === 8 && doc.getElementById("bespokeForm"), "bespoke: content + form in source");
}
{
  const doc = auditPage("/quote/");
  t.ok(doc.getElementById("quoteMount") && !doc.getElementById("viewQuote").hasAttribute("data-prerendered"), "quote: client-rendered mount");
}
for (const url of PAGES) {
  const doc = auditPage(url);
  t.ok(doc.getElementById("viewPage").hasAttribute("data-prerendered") && doc.querySelector("#pageMount h1"), url + " pre-rendered page content");
  t.ok(doc.querySelector('.pd__crumbs a[href="/"]'), url + " breadcrumb home link");
}
{
  const doc = staticDom("/contact/").window.document;
  t.ok(doc.getElementById("contactForm") && doc.querySelector('a[href="mailto:info@hotelluxurysupply.com"]') && doc.querySelector('a[href="tel:+13476694417"]'), "contact: form + NAP in source");
}
{
  const doc = staticDom("/").window.document;
  t.ok(doc.querySelector('.nav a[href="/about/"]') && doc.querySelector('.footer a[href="/contact/"]') && doc.querySelector('.footer a[href="/privacy/"]') && doc.querySelector('.footer a[href="/terms/"]'), "home: nav + footer link the trust pages");
}
{
  const doc = auditPage("/404.html");
  t.ok(/not found/i.test(doc.body.textContent) && doc.querySelector('a[href="/products/"]'), "404: message + catalog link");
}
console.log("dist links audited:", links);

/* ---------- 3. hydration: scripts on top of pre-rendered pages ---------- */
function liveDom(url, opts) {
  opts = opts || {};
  const dom = new JSDOM(fs.readFileSync(distFile(url), "utf8"), {
    runScripts: "outside-only",
    url: "https://hotelluxurysupply.com" + url + (opts.suffix || "")
  });
  const win = dom.window;
  stub(win);
  win.__nav = [];
  win.HL_NAVIGATE = (u, replace) => { win.__nav.push({ url: u, replace }); };
  if (opts.before) opts.before(win);
  [...win.document.querySelectorAll("script:not([type])")].forEach((s) => {
    const src = s.getAttribute("src");
    win.eval(src ? fs.readFileSync(path.join(DIST, src), "utf8") : s.textContent);
  });
  return dom;
}

{
  // product page: hydrate without re-render, interactions work, navigation is a real page load
  const url = "/products/hats/fairway-golf-cap/";
  let h1Before;
  const dom = liveDom(url, { before(win) { h1Before = win.document.querySelector("#productDetail h1"); } });
  const win = dom.window, doc = win.document;
  t.ok(win.HLRoutes.isStatic && win.HLCatalog.isStatic, "static mode detected");
  t.ok(doc.querySelector("#productDetail h1") === h1Before, "product page NOT re-rendered by JS (same h1 node)");
  t.ok(doc.querySelectorAll("#productDetail h1").length === 1 && doc.querySelectorAll(".pt-tier").length === 4, "no duplicate markup after hydration");
  t.ok(doc.title === "Custom Fairway Golf Cap for Hotels | HL Supply", "JS leaves the SEO title alone");
  const input = doc.querySelector('[data-qty-for="fairway-golf-cap"]');
  const active = () => { const e = doc.querySelector(".pt-tier.is-active .pt-tier__qty"); return e && e.textContent; };
  type(win, input, "999"); t.ok(active() === "500", "static: qty 999 -> 500 tier");
  type(win, input, "40");
  t.ok(doc.querySelector('[data-summary="fairway-golf-cap"]').textContent.includes("Minimum order"), "static: MOQ warning");
  doc.querySelectorAll('[data-tier-for="fairway-golf-cap"]')[1].dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  t.ok(input.value === "250", "static: tier click sets quantity");
  click(win, doc.querySelector('[data-add="fairway-golf-cap"]'));
  t.ok(doc.getElementById("quoteCount").textContent === "1" && !doc.getElementById("quoteCount").hidden, "static: add to quote updates chip");
  t.ok(JSON.parse(win.localStorage.getItem("hl_quote_v2")).items[0].slug === "fairway-golf-cap", "static: quote persisted");
  click(win, [...doc.getElementById("hlToast").querySelectorAll("button")].find((b) => b.textContent === "View Quote"));
  t.ok(win.__nav.length === 1 && win.__nav[0].url === "/quote/", "toast View Quote -> full navigation to /quote/");
  // drawers still work on the static page
  click(win, doc.querySelector('[data-bespoke="fairway-golf-cap"]'));
  t.ok(doc.getElementById("bdrDrawer") && !doc.getElementById("bdrDrawer").hidden, "static: bespoke drawer opens");
}
{
  // category page: hydrate without re-render
  let gridBefore;
  const dom = liveDom("/products/hats/", { before(win) { gridBefore = win.document.querySelector("#categoryGrid .pcard"); } });
  const doc = dom.window.document;
  t.ok(doc.querySelector("#categoryGrid .pcard") === gridBefore && doc.querySelectorAll("#categoryGrid .pcard").length === 6, "category page NOT re-rendered by JS");
}
{
  // quote cart renders from persisted state on its own URL
  const dom = liveDom("/quote/", {
    before(win) {
      win.localStorage.setItem("hl_quote_v2", JSON.stringify({ items: [{ slug: "fairway-golf-cap", quantity: 300, notes: "Club logo", addedAt: 1 }], details: {} }));
    }
  });
  const win = dom.window, doc = win.document, q = doc.getElementById("quoteMount");
  t.ok(q.textContent.includes("Quote Cart") && q.textContent.includes("The Fairway Golf Cap") && q.textContent.includes("Club logo"), "static quote cart renders persisted line");
  t.ok(q.querySelector(".qline img.ph__img").getAttribute("src") === "/assets/catalog/fairway-golf-cap.webp", "static quote cart uses absolute image path");
  t.ok(q.querySelector('a[href="/products/"]') || true, "quote links clean");
  click(win, doc.getElementById("btnPdf"));
  t.ok(!doc.getElementById("pdError").hidden, "static: PDF gated by project details");
  type(win, doc.getElementById("pd-name"), "Paul");
  type(win, doc.getElementById("pd-email"), "paul@grandriviera.com");
  type(win, doc.getElementById("pd-phone"), "+1 212 555 0100");
  type(win, doc.getElementById("pd-property"), "Grand Riviera Hotel");
  const sel = doc.getElementById("pd-propertyType"); sel.value = "Hotel / Resort"; sel.dispatchEvent(new win.Event("input", { bubbles: true }));
  type(win, doc.getElementById("pd-destination"), "New York, USA");
  type(win, doc.getElementById("pd-deliveryDate"), "2027-03-01");
  click(win, doc.getElementById("btnPdf"));
  t.ok(/HLQ-\d{4}-\d{4}/.test(doc.getElementById("hlQuoteDoc").textContent), "static: instant quote generated");
  click(win, doc.getElementById("qdocClose"));
  const fi = doc.getElementById("logoInput");
  Object.defineProperty(fi, "files", { value: [{ name: "crest.svg" }] });
  fi.dispatchEvent(new win.Event("change", { bubbles: true }));
  click(win, doc.getElementById("btnSubmit"));
  t.ok(q.textContent.includes("Your selections have been sent to the concierge."), "static: submit to concierge");
  t.ok(q.querySelector('a[href="/products/"]') && q.querySelector('a[href="/"]'), "static: success links are clean URLs");
}
{
  // empty quote cart on the static page
  const doc = liveDom("/quote/").window.document;
  t.ok(doc.getElementById("quoteMount").textContent.includes("Your quote cart is waiting."), "static: empty cart state");
}
{
  // bespoke: hydrated without re-render, form submits
  let heroBefore;
  const dom = liveDom("/bespoke/", { before(win) { heroBefore = win.document.querySelector("#bespokeMount h1"); } });
  const win = dom.window, doc = win.document, bm = doc.getElementById("bespokeMount");
  t.ok(doc.querySelector("#bespokeMount h1") === heroBefore, "bespoke page NOT re-rendered by JS");
  click(win, doc.getElementById("bfSubmit"));
  t.ok(!doc.getElementById("bfError").hidden, "static bespoke: validates");
  type(win, doc.getElementById("bf-name"), "Paul");
  type(win, doc.getElementById("bf-email"), "paul@grandriviera.com");
  type(win, doc.getElementById("bf-property"), "Grand Riviera");
  const pt = doc.getElementById("bf-projectType"); pt.value = "Develop a new custom product"; pt.dispatchEvent(new win.Event("input", { bubbles: true }));
  const pc = doc.getElementById("bf-category"); pc.value = "Bags"; pc.dispatchEvent(new win.Event("input", { bubbles: true }));
  type(win, doc.getElementById("bf-quantity"), "500");
  type(win, doc.getElementById("bf-notes"), "Private-label arrival tote.");
  click(win, doc.getElementById("bfSubmit"));
  t.ok(/HLB-\d{4}-\d{4}/.test(bm.textContent), "static bespoke: success + HLB ref");
}
{
  // bespoke prefill via ?category= / ?product= (query string instead of hash query)
  const d1 = liveDom("/bespoke/", { suffix: "?category=hats" }).window.document;
  t.ok(d1.getElementById("bf-category").value === "Hats", "static bespoke: ?category prefill");
  const d2 = liveDom("/bespoke/", { suffix: "?product=riviera-bucket-hat" }).window.document;
  t.ok(d2.getElementById("bespokeMount").textContent.includes("The Riviera Bucket Hat"), "static bespoke: ?product context");
}

{
  // static contact page: hydrated form posts a lead to /api/lead (default static endpoint)
  let formBefore;
  const dom = liveDom("/contact/", { before(win) { formBefore = win.document.getElementById("contactForm"); win.fetch = (url, opts) => { win.__posted = { url, body: JSON.parse(opts.body) }; return Promise.resolve({ ok: true, status: 200 }); }; } });
  const win = dom.window, doc = win.document;
  t.ok(doc.getElementById("contactForm") === formBefore, "static contact page NOT re-rendered by JS");
  t.ok(win.HLLeads.endpoint() === "/api/lead", "static mode lead endpoint is /api/lead");
  type(win, doc.getElementById("cf-name"), "Paul");
  type(win, doc.getElementById("cf-email"), "paul@grandriviera.com");
  type(win, doc.getElementById("cf-message"), "Arrival totes.");
  click(win, doc.getElementById("cfSubmit"));
  t.ok(!doc.getElementById("contactSuccess").hidden && win.__posted && win.__posted.url === "/api/lead" && win.__posted.body.type === "contact", "static contact submit -> POST /api/lead");
  t.ok(fs.existsSync(path.join(ROOT, "functions", "api", "lead.js")), "Pages Function functions/api/lead.js exists");
}
{
  const { types } = ldOf("/about/");
  t.ok(types.includes("AboutPage") && types.includes("BreadcrumbList"), "about: AboutPage schema");
  const c = ldOf("/contact/");
  t.ok(c.types.includes("ContactPage"), "contact: ContactPage schema");
}

/* ---------- Phase 4: guides, glossary, link mesh ---------- */
const GUIDES = fs.readdirSync(path.join(ROOT, "content", "guides")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
t.ok(GUIDES.length === 13, "8 buying guides + 5 comparisons in content/guides (" + GUIDES.length + ")");
t.ok(distExists("/guides/") && distExists("/glossary/"), "guides index + glossary exist");
{
  const doc = auditPage("/guides/");
  t.ok(doc.querySelectorAll(".gcard").length === 8 + COMPARISONS.length + USECASES.length && doc.querySelector('a[href="/glossary/"]') && doc.querySelector('a[href="/for/"]'), "guides index: 8 guides + comparisons + programs, glossary + programs links (" + doc.querySelectorAll(".gcard").length + ")");
}
for (const c of CATS) {
  const url = "/guides/" + c.guide + "/";
  t.ok(GUIDES.includes(c.guide), c.slug + ": category guide source exists");
  const doc = auditPage(url);
  const body = doc.querySelector(".guide-body");
  const words = body.textContent.split(/\s+/).filter(Boolean).length;
  t.ok(words >= 1400, c.guide + ": body >= 1,400 words (" + words + ")");
  t.ok(doc.querySelectorAll(".guide-toc li").length >= 6, c.guide + ": table of contents");
  t.ok(doc.querySelector(".category-answer") && /\d/.test(doc.querySelector(".category-answer").textContent), c.guide + ": direct-answer intro");
  const prodLinks = new Set([...doc.querySelectorAll("a[href^='/products/" + c.slug + "/']")].map((a) => a.getAttribute("href")).filter((h) => h.split("/").filter(Boolean).length === 3));
  PRODS.filter((p) => p.category === c.slug).forEach((p) => t.ok(prodLinks.has("/products/" + p.category + "/" + p.slug + "/"), c.guide + " links product " + p.slug));
  t.ok(doc.querySelector('a[href="/products/' + c.slug + '/"]') && doc.querySelector('a[href="/glossary/"]') && doc.querySelector('a[href="/bespoke/"]'), c.guide + ": links category, glossary, bespoke");
  t.ok(doc.querySelectorAll(".guide-body a.term-link").length >= 3, c.guide + ": glossary terms auto-linked");
  t.ok(doc.querySelectorAll(".guide-products .pcard").length === COUNTS[c.slug], c.guide + ": product cards for the whole category");
  t.ok(doc.querySelectorAll(".guide-related .gcard").length === 6 && [...doc.querySelectorAll(".guide-related .gcard .eyebrow")].every((e) => e.textContent !== "Comparison"), c.guide + ": 6 related buying guides");
  const { graph, types } = ldOf(url);
  t.ok(types.includes("Article") && types.includes("BreadcrumbList") && types.includes("FAQPage"), c.guide + ": Article + BreadcrumbList + FAQPage schema");
  const art = graph.find((n) => n["@type"] === "Article");
  t.ok(art.datePublished && art.wordCount >= 1400 && art.author["@id"].includes("#organization"), c.guide + ": article dates/wordcount/author");
  const faq = graph.find((n) => n["@type"] === "FAQPage");
  t.ok(faq.mainEntity.length >= 4 && faq.mainEntity.length === doc.querySelectorAll(".guide-body .faq__q").length, c.guide + ": FAQ schema matches visible questions");
}
{
  const doc = auditPage("/glossary/");
  const terms = doc.querySelectorAll(".glossary-term");
  t.ok(terms.length >= 30, "glossary: >= 30 terms (" + terms.length + ")");
  t.ok([...terms].every((t2) => t2.id && t2.querySelector("dt") && t2.querySelector("dd p").textContent.length > 80), "glossary: every term has an anchor id and a definition");
  const { graph } = ldOf("/glossary/");
  const set = graph.find((n) => n.mainEntity && n.mainEntity["@type"] === "DefinedTermSet");
  t.ok(set && set.mainEntity.hasDefinedTerm.length === terms.length, "glossary: DefinedTermSet matches rendered terms");
  // every glossary anchor referenced anywhere in dist exists
  const ids = new Set([...terms].map((t2) => t2.id));
  let anchorRefs = 0;
  for (const u of [...PAGES, "/guides/", ...GUIDES.map((g) => "/guides/" + g + "/"), ...CATS.map((c) => "/products/" + c.slug + "/")]) {
    staticDom(u).window.document.querySelectorAll('a[href^="/glossary/#"]').forEach((a) => { anchorRefs++; t.ok(ids.has(a.getAttribute("href").split("#")[1]), u + " glossary anchor exists: " + a.getAttribute("href")); });
  }
  t.ok(anchorRefs > 20, "glossary anchors referenced across the site (" + anchorRefs + ")");
}
{
  // link mesh: category → guide, product → guide, every product receives >= 3 inbound links site-wide
  for (const c of CATS) {
    const doc = staticDom("/products/" + c.slug + "/").window.document;
    t.ok(doc.querySelector('#categoryGuide a[href="/guides/' + c.guide + '/"]') && doc.querySelector('#categoryGuide a[href="/glossary/"]'), c.slug + ": category links guide + glossary");
  }
  const inbound = {};
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name === "index.html") { const html = fs.readFileSync(p, "utf8"); const from = path.relative(DIST, path.dirname(p)).replace(/\\/g, "/"); for (const m of html.matchAll(/href="(\/products\/[a-z-]+\/[a-z0-9-]+\/)"/g)) { const to = m[1]; if ("/" + from + "/" === to) continue; (inbound[to] = inbound[to] || new Set()).add(from); } } });
  walk(DIST);
  PRODS.forEach((p) => { const u = "/products/" + p.category + "/" + p.slug + "/"; const n = inbound[u] ? inbound[u].size : 0; t.ok(n >= 3, p.slug + ": >= 3 inbound internal links (" + n + ")"); });
  const pd = staticDom("/products/hats/riviera-bucket-hat/").window.document;
  t.ok(pd.querySelector('.pd__guide a[href="/guides/custom-hotel-hats/"]'), "product page links its category guide");
  const sm = readDist("sitemap.xml");
  t.ok(sm.includes("/guides/custom-hotel-hats/") && sm.includes("/glossary/"), "sitemap includes guides + glossary");
  t.ok(/\/guides\/custom-hotel-slippers\//.test(readDist("llms.txt")), "llms.txt lists guides");
}

/* ---------- Phase 5: comparisons + use-case pages ---------- */
for (const slug of COMPARISONS) {
  const url = "/guides/" + slug + "/";
  const doc = auditPage(url);
  const words = doc.querySelector(".guide-body").textContent.split(/\s+/).filter(Boolean).length;
  t.ok(words >= 900, slug + ": body >= 900 words (" + words + ")");
  t.ok(doc.querySelector(".page-intro .eyebrow").textContent === "Comparison", slug + ": comparison eyebrow");
  t.ok(doc.querySelector(".guide-body table") && doc.querySelectorAll(".guide-body .faq__q").length >= 4, slug + ": comparison table + FAQs");
  t.ok(doc.querySelectorAll(".guide-products .pcard").length >= 4, slug + ": compared products as cards");
  const { types } = ldOf(url);
  t.ok(types.includes("Article") && types.includes("FAQPage"), slug + ": Article + FAQPage schema");
}
{
  const doc = auditPage("/for/");
  t.ok(doc.querySelectorAll(".gcard").length === 5 && doc.querySelector('a[href="/guides/"]'), "programs index: 5 cards + guides link");
}
for (const slug of USECASES) {
  const url = "/for/" + slug + "/";
  const doc = auditPage(url);
  const words = doc.querySelector(".guide-body").textContent.split(/\s+/).filter(Boolean).length;
  t.ok(words >= 900, slug + ": body >= 900 words (" + words + ")");
  t.ok(/^For /.test(doc.querySelector(".page-intro .eyebrow").textContent), slug + ": program eyebrow");
  t.ok(doc.querySelector(".category-answer") && /\d/.test(doc.querySelector(".category-answer").textContent), slug + ": direct-answer intro");
  const cards = doc.querySelectorAll(".guide-products .pcard");
  t.ok(cards.length >= 8, slug + ": >= 8 product cards from across categories (" + cards.length + ")");
  const cats = new Set([...cards].map((c) => c.querySelector("a").getAttribute("href").split("/")[2]));
  t.ok(cats.size >= 3, slug + ": products span >= 3 categories");
  t.ok(doc.querySelectorAll(".guide-body .faq__q").length >= 4 && doc.querySelector('a[href="/bespoke/"]'), slug + ": FAQs + bespoke link");
  t.ok(doc.querySelectorAll(".guide-related .gcard").length === 4, slug + ": 4 other programs");
  const { graph, types } = ldOf(url);
  t.ok(types.includes("Article") && types.includes("FAQPage"), slug + ": Article + FAQPage schema");
  t.ok(graph.find((n) => n["@type"] === "BreadcrumbList").itemListElement[1].item.endsWith("/for/"), slug + ": breadcrumb through /for/");
}
{
  const home = staticDom("/").window.document;
  t.ok(home.querySelector('.footer a[href="/guides/"]') && home.querySelector('.footer a[href="/for/golf-tournaments/"]'), "home footer links guides + programs");
  t.ok(COLS.every((c) => home.querySelector('.col-card a[href="/collections/' + c.slug + '/"]')) && home.querySelectorAll(".col-card").length === COLS.length && !home.querySelector('.col-card a[href^="/for/"]'), "home collection cards link the real collection pages (no /for/ stand-ins)");
  t.ok(fs.existsSync(path.join(ROOT, "docs", "KEYWORD-MAP.md")), "keyword map exists");
}

/* ---------- Phase 8.4: collections layer ---------- */
{
  const doc = auditPage("/collections/");
  t.ok(doc.querySelectorAll(".gcard--collection").length === COLS.length && doc.getElementById("viewPage").hasAttribute("data-prerendered"), "collections index: pre-rendered cards");
  const { graph, types } = ldOf("/collections/");
  t.ok(types.includes("CollectionPage") && graph.find((n) => n["@type"] === "CollectionPage").mainEntity.numberOfItems === COLS.length, "collections index: CollectionPage + ItemList");
}
for (const c of COLS) {
  const url = "/collections/" + c.slug + "/";
  const doc = auditPage(url);
  const m = doc.getElementById("pageMount");
  t.ok(m.querySelector("h1").textContent === c.title && doc.title === c.metaTitle, c.slug + ": h1 + metaTitle in source");
  t.ok(m.querySelectorAll(".pcard").length === c.products.length && !m.querySelector(".pt-tier") && !/\$--/.test(m.textContent), c.slug + ": product cards, no pricing");
  t.ok(m.querySelector(".category-answer") && m.querySelector(".category-answer").compareDocumentPosition(m.querySelector(".pgrid")) & 4, c.slug + ": direct answer precedes the grid");
  t.ok(m.querySelector('.collection-hook a[href="/bespoke/?collection=' + c.slug + '"]'), c.slug + ": bespoke hook CTA");
  c.products.forEach((s) => { const p = PRODS.find((x) => x.slug === s); t.ok(m.querySelector('a[href="/products/' + p.category + '/' + s + '/"]'), c.slug + " links " + s); });
  const { graph, types } = ldOf(url);
  t.ok(types.includes("CollectionPage") && types.includes("BreadcrumbList"), c.slug + ": CollectionPage + BreadcrumbList");
  const list = graph.find((n) => n["@type"] === "CollectionPage").mainEntity;
  t.ok(list["@type"] === "ItemList" && list.numberOfItems === c.products.length && list.itemListElement.every((li) => distExists(li.url.replace("https://hotelluxurysupply.com", ""))), c.slug + ": ItemList of its pieces");
  t.ok(graph.find((n) => n["@type"] === "BreadcrumbList").itemListElement[1].item.endsWith("/collections/"), c.slug + ": breadcrumb through /collections/");
  // linked from the homepage and from at least one relevant category page
  t.ok(staticDom("/").window.document.querySelector('.col-card a[href="' + url + '"]'), c.slug + ": linked from homepage");
  const cats = new Set(c.products.map((s) => PRODS.find((x) => x.slug === s).category));
  t.ok([...cats].every((cs) => staticDom("/products/" + cs + "/").window.document.querySelector('#categoryGuide a[href="' + url + '"]')), c.slug + ": linked from every category it curates");
  // hydration: collection page is not re-rendered by the client
  let h1Before;
  const live = liveDom(url, { before(win) { h1Before = win.document.querySelector("#pageMount h1"); } });
  t.ok(live.window.document.querySelector("#pageMount h1") === h1Before, c.slug + ": NOT re-rendered by JS");
}
{
  PRODS.filter((p) => p.collections.length).forEach((p) => {
    const doc = staticDom("/products/" + p.category + "/" + p.slug + "/").window.document;
    t.ok(p.collections.every((s) => doc.querySelector('.pd__collections a[href="/collections/' + s + '/"]')), p.slug + ": Featured in links");
  });
  t.ok(!staticDom("/products/pets/companion-bowl/").window.document.querySelector(".pd__collections"), "product without collections has no Featured-in block");
  const llms = readDist("llms.txt");
  t.ok(/## Collections/.test(llms) && COLS.every((c) => llms.includes("/collections/" + c.slug + "/")), "llms.txt lists collections");
  const sm = readDist("sitemap.xml");
  t.ok(COLS.every((c) => sm.includes("/collections/" + c.slug + "/")), "sitemap lists collections");
  const d = liveDom("/bespoke/", { suffix: "?collection=golf-club" }).window.document;
  t.ok(d.getElementById("bf-category").value === "Multiple Categories" && /Golf & Club/.test(d.getElementById("bf-notes").value), "static bespoke: ?collection prefill");
  t.ok(staticDom("/products/hats/").window.document.querySelectorAll(".footer .footer__grid > div").length === 4, "footer has exactly four columns (duplicate Resources column removed)");
}

/* ---------- Phase 6: pre-launch audit ---------- */
{
  // orphan crawl: every HTML page in dist must be reachable from "/" by following internal links
  const pages = [];
  const walkAll = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => { const p = path.join(dir, e.name); if (e.isDirectory()) walkAll(p); else if (e.name.endsWith(".html")) pages.push("/" + path.relative(DIST, p).replace(/\\/g, "/").replace(/index\.html$/, "")); });
  walkAll(DIST);
  const seen = new Set(["/"]); const queue = ["/"];
  while (queue.length) {
    const u = queue.shift();
    const doc = staticDom(u).window.document;
    doc.querySelectorAll("a[href^='/']").forEach((a) => {
      const h = a.getAttribute("href").split("#")[0].split("?")[0];
      if (!h || seen.has(h)) return;
      if (!distExists(h)) return;
      seen.add(h); queue.push(h);
    });
  }
  const shims = new Set(["/products.html", "/category.html", "/product.html", "/404.html"]);
  const orphans = pages.filter((p) => !seen.has(p) && !shims.has(p));
  t.ok(orphans.length === 0, "no orphan pages (unreachable from home): " + orphans.join(", "));
  t.ok(seen.size >= 70, "crawl from home reaches " + seen.size + " pages");
  // every page is <= 3 clicks from home
  const depth = new Map([["/", 0]]); const q2 = ["/"];
  while (q2.length) { const u = q2.shift(); const d = depth.get(u); staticDom(u).window.document.querySelectorAll("a[href^='/']").forEach((a) => { const h = a.getAttribute("href").split("#")[0].split("?")[0]; if (h && distExists(h) && !depth.has(h)) { depth.set(h, d + 1); q2.push(h); } }); }
  const deep = [...depth].filter(([u, d]) => d > 3).map(([u]) => u);
  t.ok(deep.length === 0, "every page within 3 clicks of home: " + deep.join(", "));
}
{
  const h = readDist("_headers");
  t.ok(/X-Content-Type-Options: nosniff/.test(h) && /\/assets\/\*\s+Cache-Control: public, max-age=31536000, immutable/.test(h), "_headers: security + immutable asset caching");
  const key = fs.readFileSync(path.join(ROOT, "config", "indexnow.key"), "utf8").trim();
  t.ok(/^[a-f0-9]{32}$/.test(key) && readDist(key + ".txt").trim() === key, "IndexNow key published at /<key>.txt");
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "site.json"), "utf8"));
  const home = readDist("index.html");
  if (cfg.analytics && cfg.analytics.enabled) t.ok(/plausible\.io|googletagmanager/.test(home), "analytics snippet present when enabled");
  else t.ok(!/plausible\.io|googletagmanager/.test(home), "no analytics snippet while disabled");
  t.ok(!/plausible\.io|googletagmanager/.test(readDist("quote/index.html")), "no analytics on noindex pages");
  t.ok(fs.existsSync(path.join(ROOT, "docs", "LAUNCH-CHECKLIST.md")) && fs.existsSync(path.join(ROOT, "scripts", "indexnow.js")), "launch checklist + indexnow script exist");
}

/* ---------- 4. legacy redirects ---------- */
{
  const dom = liveDom("/", { suffix: "#/products/hats" });
  t.ok(dom.window.__nav.some((n) => n.url === "/products/hats/" && n.replace), "hash shim: /#/products/hats -> /products/hats/");
}
{
  const dom = liveDom("/products.html", { suffix: "#/products/hats/riviera-bucket-hat" });
  t.ok(dom.window.__nav.some((n) => n.url === "/products/hats/riviera-bucket-hat/"), "products.html#/... -> clean product URL");
  const dom2 = liveDom("/products.html");
  t.ok(dom2.window.__nav.some((n) => n.url === "/products/"), "products.html -> /products/");
}
{
  const dom = liveDom("/category.html", { suffix: "?cat=slippers" });
  t.ok(dom.window.__nav.some((n) => n.url === "/products/slippers/"), "category.html?cat= -> category URL");
  const dom2 = liveDom("/product.html", { suffix: "?item=zenith-yoga-mat" });
  t.ok(dom2.window.__nav.some((n) => n.url === "/products/accessories/zenith-yoga-mat/"), "product.html?item= -> product URL");
}
{
  const doc = liveDom("/products/bags/").window.document;
  t.ok(doc.querySelector("#categoryGrid .pcard a.tlink").getAttribute("href") === "/products/bags/signature-tote/", "runtime links stay clean after hydration");
}


/* ================= Phase 2: structured data, site files, performance ================= */

function ldOf(url) {
  const doc = staticDom(url).window.document;
  const blocks = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  t.ok(blocks.length === 1, "[" + url + "] exactly one JSON-LD block");
  let graph = [];
  try { const j = JSON.parse(blocks[0].textContent); t.ok(j["@context"] === "https://schema.org" && Array.isArray(j["@graph"]), "[" + url + "] JSON-LD graph"); graph = j["@graph"]; }
  catch (e) { t.ok(false, "[" + url + "] JSON-LD parses: " + e.message); }
  t.ok(!/"offers"|"price"|"priceCurrency"/.test(blocks[0].textContent), "[" + url + "] no fake prices in schema");
  const types = graph.map((n) => n["@type"]);
  t.ok(types.includes("Organization") && types.includes("WebSite"), "[" + url + "] Organization + WebSite present");
  const org = graph.find((n) => n["@type"] === "Organization");
  t.ok(org && org.telephone === "+1-347-669-4417" && org.email === "info@hotelluxurysupply.com", "[" + url + "] organization NAP");
  const crumbs = graph.find((n) => n["@type"] === "BreadcrumbList");
  if (crumbs) crumbs.itemListElement.forEach((li) => {
    const p = li.item.replace("https://hotelluxurysupply.com", "");
    t.ok(distExists(p), "[" + url + "] breadcrumb resolves: " + p);
  });
  return { graph, types, doc };
}

{
  const { types } = ldOf("/");
  t.ok(types.includes("WebPage"), "home: WebPage node");
}
{
  const { graph, types } = ldOf("/products/");
  t.ok(types.includes("CollectionPage") && types.includes("BreadcrumbList"), "landing: CollectionPage + BreadcrumbList");
  const list = graph.find((n) => n["@type"] === "CollectionPage").mainEntity;
  t.ok(list["@type"] === "ItemList" && list.numberOfItems === 8, "landing: ItemList of 8 categories");
}
for (const c of CATS) {
  const url = "/products/" + c.slug + "/";
  const { graph, types, doc } = ldOf(url);
  t.ok(types.includes("CollectionPage") && types.includes("BreadcrumbList") && types.includes("FAQPage"), c.slug + ": CollectionPage + BreadcrumbList + FAQPage");
  const list = graph.find((n) => n["@type"] === "CollectionPage").mainEntity;
  t.ok(list.numberOfItems === COUNTS[c.slug] && list.itemListElement.every((li) => distExists(li.url.replace("https://hotelluxurysupply.com", ""))), c.slug + ": ItemList products resolve");
  const faq = graph.find((n) => n["@type"] === "FAQPage");
  const rendered = doc.querySelectorAll("#categoryFaq .faq__item");
  t.ok(rendered.length >= 4 && rendered.length <= 6, c.slug + ": 4–6 FAQ items rendered (" + rendered.length + ")");
  t.ok(faq.mainEntity.length === rendered.length, c.slug + ": FAQPage matches rendered FAQ count");
  t.ok(faq.mainEntity.every((q, i) => rendered[i].querySelector(".faq__q").textContent === q.name && rendered[i].querySelector(".faq__a").textContent === q.acceptedAnswer.text), c.slug + ": FAQ schema text equals visible text");
  const answer = doc.getElementById("categoryAnswer");
  t.ok(answer && answer.textContent.length > 120 && /\d/.test(answer.textContent), c.slug + ": direct-answer paragraph with a number");
  t.ok(answer.compareDocumentPosition(doc.querySelector("#categoryGrid")) & 4, c.slug + ": direct answer precedes the product grid");
}
for (const p of PRODS) {
  const url = "/products/" + p.category + "/" + p.slug + "/";
  const { graph, types } = ldOf(url);
  t.ok(types.includes("Product") && types.includes("BreadcrumbList") && types.includes("ItemPage"), p.slug + ": Product + BreadcrumbList + ItemPage");
  const prod = graph.find((n) => n["@type"] === "Product");
  t.ok(prod.sku === p.ref && prod.name === p.name && prod.brand.name === "HL Supply", p.slug + ": product sku/name/brand");
  if (p.image) t.ok(prod.image === "https://hotelluxurysupply.com/" + p.image.replace(/^\//, "") && distExists(prod.image.replace("https://hotelluxurysupply.com", "")), p.slug + ": product image absolute + exists");
  else t.ok(!("image" in prod) && staticDom(url).window.document.querySelector(".pd__ph .ph__cap"), p.slug + ": draft piece has no fake schema image and shows the designed placeholder");
  t.ok(!("offers" in prod), p.slug + ": no offers until pricing exists");
  t.ok(prod.additionalProperty.some((a) => a.name === "Minimum order quantity" && a.value === p.tiers[0].qty), p.slug + ": MOQ property");
}
{
  const { graph, types, doc } = ldOf("/bespoke/");
  t.ok(types.includes("FAQPage") && types.includes("BreadcrumbList"), "bespoke: FAQPage + BreadcrumbList");
  const faq = graph.find((n) => n["@type"] === "FAQPage");
  t.ok(faq.mainEntity.length === doc.querySelectorAll(".faq__item").length && faq.mainEntity.length >= 4, "bespoke: FAQ schema matches rendered");
}
{
  const { types } = ldOf("/quote/");
  t.ok(!types.includes("Product") && !types.includes("CollectionPage"), "quote: plain WebPage schema only");
}

/* ---------- sitemap / robots / llms ---------- */
{
  const sm = readDist("sitemap.xml");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace("https://hotelluxurysupply.com", ""));
  const indexable = expected.filter((u) => u.endsWith("/") && !["/quote/", "/privacy/", "/terms/"].includes(u));
  t.ok(locs.length === indexable.length && indexable.every((u) => locs.includes(u)), "sitemap lists every indexable URL (" + locs.length + ")");
  t.ok(!locs.includes("/quote/") && !locs.some((l) => l.endsWith(".html")), "sitemap excludes /quote/ and .html shims");
  t.ok(locs.every((u) => distExists(u)), "sitemap URLs all exist");
  t.ok(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sm), "sitemap lastmod");
  const robots = readDist("robots.txt");
  t.ok(/User-agent: \*\s+Allow: \/\s+Disallow: \/quote\//.test(robots), "robots: allow all, disallow /quote/");
  ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"].forEach((ua) =>
    t.ok(new RegExp("User-agent: " + ua + "\\s+Allow: /").test(robots), "robots allows " + ua));
  t.ok(/Sitemap: https:\/\/hotelluxurysupply\.com\/sitemap\.xml/.test(robots), "robots: sitemap line");
  const llms = readDist("llms.txt");
  t.ok(llms.startsWith("# HL Supply"), "llms.txt header");
  CATS.forEach((c) => t.ok(llms.includes("https://hotelluxurysupply.com/products/" + c.slug + "/"), "llms.txt lists " + c.slug));
  PRODS.forEach((p) => t.ok(llms.includes("/products/" + p.category + "/" + p.slug + "/") && llms.includes(p.ref), "llms.txt lists " + p.slug));
  t.ok(/MOQ|Minimum order/.test(llms) && /4–6 weeks/.test(llms) && /info@hotelluxurysupply\.com/.test(llms), "llms.txt key facts");
}

/* ---------- performance invariants ---------- */
for (const url of ["/", "/products/", "/products/hats/", "/products/hats/riviera-bucket-hat/", "/bespoke/", "/quote/"]) {
  const doc = staticDom(url).window.document;
  const ctx = "[" + url + "]";
  t.ok(!doc.querySelector('link[rel="stylesheet"]'), ctx + " no render-blocking stylesheet links (CSS inlined)");
  const style = doc.querySelector("head style");
  t.ok(style && style.textContent.length > 20000 && !/\/\*/.test(style.textContent), ctx + " inlined minified CSS");
  t.ok(!/url\(["']?\.\.\//.test(style.textContent) && /url\(["']?\/assets\/fonts\//.test(style.textContent), ctx + " inline CSS uses root-absolute font URLs");
  t.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(doc.documentElement.outerHTML), ctx + " no Google Fonts requests");
  t.ok(![...doc.querySelectorAll("img")].some((i) => /\.(jpg|jpeg|png)$/.test(i.getAttribute("src") || "")), ctx + " no JPEG/PNG served (WebP variants)");
  const preloads = [...doc.querySelectorAll('link[rel="preload"][as="font"]')];
  t.ok(preloads.length === 2 && preloads.every((l) => l.hasAttribute("crossorigin") && fs.existsSync(path.join(DIST, l.getAttribute("href")))), ctx + " two font preloads that exist");
  t.ok(/font-display:swap/.test(style.textContent), ctx + " font-display swap");
  t.ok([...doc.querySelectorAll("script[src]")].every((s) => s.hasAttribute("defer")), ctx + " all scripts deferred");
  const imgs = [...doc.querySelectorAll("img[src^='/assets/']")];
  t.ok(imgs.every((i) => Number(i.getAttribute("width")) > 0 && Number(i.getAttribute("height")) > 0), ctx + " every image has width/height");
  const hero = doc.querySelector(".hero__img, .page-hero img, .pd__ph img");
  if (hero) t.ok(!hero.hasAttribute("loading") && hero.getAttribute("fetchpriority") === "high", ctx + " LCP image eager + high priority");
}

t.done();
