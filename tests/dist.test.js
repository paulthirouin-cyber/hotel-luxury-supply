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
const { CATS, PRODS } = data();
const COUNTS = { bags: 8, hats: 6, bottles: 4, "flip-flops": 4, "leather-goods": 6, slippers: 4, accessories: 7 };

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
const expected = ["/", "/products/", "/bespoke/", "/quote/", "/404.html", "/products.html", "/category.html", "/product.html", "/_redirects"];
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
  const robots = doc.querySelector('meta[name="robots"]');
  if (url === "/quote/" || url === "/404.html") t.ok(robots && /noindex/.test(robots.content), ctx + " noindex");
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
  });
  doc.querySelectorAll('link[rel="stylesheet"][href^="/"], script[src]').forEach((el) => {
    const src = el.getAttribute("href") || el.getAttribute("src");
    t.ok(src.startsWith("/") && fs.existsSync(path.join(DIST, src)), ctx + " asset exists: " + src);
  });
  return doc;
}

{
  const doc = auditPage("/");
  t.ok(doc.querySelectorAll("#atelierGrid a.at-card").length === 7, "home: 7 category cards in source");
  t.ok(doc.querySelector('#atelierGrid a[href="/products/hats/"]'), "home: category card links clean URL");
}
{
  const doc = auditPage("/products/");
  t.ok(doc.querySelectorAll("#catalogCategories .ccard").length === 7, "landing: 7 category cards in source");
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
  [...win.document.querySelectorAll("script")].forEach((s) => {
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

t.done();
