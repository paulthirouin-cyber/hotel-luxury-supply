// Suite 1: data integrity, catalog imagery, every view renders,
// full link audit, pricing interactions, routing, not-found, overlay guard.
const { read, exists, catalogDom, homeDom, data, harness, click, type } = require("./helpers");

const t = harness("SITE SUITE");
const { CATS, PRODS, COLS } = data();
const catSlugs = new Set(CATS.map((c) => c.slug));
const colSlugs = new Set(COLS.map((c) => c.slug));
const prodBy = Object.fromEntries(PRODS.map((p) => [p.slug, p]));
const PAGE_SLUGS = ["about", "process", "contact", "privacy", "terms"];

/* ---------- 1. data integrity (catalog as source of truth) ---------- */
t.ok(PRODS.length === 45, "45 products");
t.ok(CATS.length === 8, "8 categories");
const COUNTS = { bags: 8, hats: 6, bottles: 4, "flip-flops": 4, "leather-goods": 6, slippers: 4, accessories: 7, pets: 6 };
// draft pieces (no catalog photography yet) render the designed tint placeholder instead of a photo
const DRAFT_CATS = new Set(["pets"]);
for (const [slug, n] of Object.entries(COUNTS)) {
  t.ok(PRODS.filter((p) => p.category === slug).length === n, `${slug} has ${n} products`);
}
for (const p of PRODS) {
  t.ok(p.tiers.length === 4, `${p.slug}: 4 tiers`);
  t.ok(p.ref && p.type && p.description && p.customization.length && p.features && p.features.length, `${p.slug}: catalog copy complete`);
  t.ok(p.image ? exists(p.image) : DRAFT_CATS.has(p.category), `${p.slug}: image file exists or draft placeholder (${p.image})`);
  t.ok(p.imageLabel && p.imageLabel.length > 10, `${p.slug}: alt text present`);
  t.ok(p.specifications.some((s) => s.label === "Reference" && s.value === p.ref), `${p.slug}: ref spec`);
}
for (const c of CATS) {
  t.ok(c.image ? exists(c.image) : DRAFT_CATS.has(c.slug), `${c.slug}: category hero image exists or draft placeholder`);
  t.ok(c.tagline, `${c.slug}: catalog tagline`);
}
// spot-check official catalog names + real dimensions survived
t.ok(prodBy["signature-tote"].name === "The Signature Solid Tote", "catalog name: Signature Solid Tote");
t.ok(prodBy["atelier-woven-tote"].name === "The Atelier Woven Leather Tote", "catalog name: Atelier Woven Leather Tote");
t.ok(prodBy["link-cable-snap"].name === "The Link Leather Cable Snap", "catalog name: Link Leather Cable Snap");
t.ok(/16.+14/.test(prodBy["signature-tote"].specifications.find((s) => s.label === "Dimensions").value), "B-001 real dimensions");

/* ---------- 2. homepage: images, links, pricing-free ---------- */
{
  const dom = homeDom(); const doc = dom.window.document;
  const cards = [...doc.querySelectorAll("#atelierGrid a.at-card")];
  t.ok(cards.length === 8, "homepage renders 8 category cards");
  cards.forEach((card) => {
    const img = card.querySelector("img.ph__img");
    const draft = DRAFT_CATS.has(card.getAttribute("href").split("/").filter(Boolean).pop());
    t.ok(draft ? (!img && card.querySelector(".ph__cap")) : (img && img.getAttribute("alt")), "homepage card has real image with alt (or draft placeholder): " + card.getAttribute("href"));
  });
  const hero = doc.querySelector(".hero__img");
  t.ok(hero && exists(hero.getAttribute("src")) && hero.getAttribute("alt"), "hero uses real catalog photo with alt");
  t.ok(!/\$--|MOQ|Quantity Pricing|Add to Quote/.test(doc.body.textContent), "homepage is pricing-free");
  t.ok(/hotelluxurysupply\.com/.test(doc.body.textContent) && /\+1 \(347\) 669-4417/.test(doc.body.textContent), "real contact in footer");
  t.ok(/\[hidden\]\s*\{\s*display:\s*none\s*!important/.test(read("css/styles.css")), "[hidden] overlay guard present");
}

/* ---------- 3. link audit + render check across all 48 views ---------- */
const homeIds = new Set([...homeDom().window.document.querySelectorAll("[id]")].map((e) => e.id));
let linkCount = 0;
function auditDoc(doc, ctx) {
  const ids = new Set([...doc.querySelectorAll("[id]")].map((e) => e.id));
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href"); linkCount++;
    const hi = href.indexOf("#/");
    if (hi > -1) {
      let route = href.slice(hi + 2);
      const qp = route.indexOf("?");
      const q = qp > -1 ? route.slice(qp + 1) : "";
      if (qp > -1) route = route.slice(0, qp);
      const seg = route.split("/").filter(Boolean);
      if (seg[0] === "quote") return;
      if (PAGE_SLUGS.includes(seg[0]) && seg.length === 1) return;
      if (seg[0] === "glossary" && seg.length === 1) return;
      if (seg[0] === "collections") { if (seg[1] && !colSlugs.has(seg[1])) t.ok(false, ctx + " unknown collection: " + href); return; }
      if (seg[0] === "guides" || seg[0] === "for") {
        if (seg[1] && !exists("content/" + seg[0] + "/" + seg[1] + ".md")) t.ok(false, ctx + " missing content file: " + href);
        return;
      }
      if (seg[0] === "bespoke") {
        for (const kv of q.split("&")) {
          const [k, v] = kv.split("=");
          if (k === "category" && v && !catSlugs.has(v)) t.ok(false, ctx + " bad bespoke category: " + href);
          if (k === "product" && v && !prodBy[v]) t.ok(false, ctx + " bad bespoke product: " + href);
          if (k === "collection" && v && !colSlugs.has(v)) t.ok(false, ctx + " bad bespoke collection: " + href);
        }
        return;
      }
      if (seg[0] !== "products") return t.ok(false, ctx + " unknown route: " + href);
      if (seg[1] && !catSlugs.has(seg[1])) return t.ok(false, ctx + " unknown category: " + href);
      if (seg[2] && (!prodBy[seg[2]] || prodBy[seg[2]].category !== seg[1])) return t.ok(false, ctx + " bad product route: " + href);
      return;
    }
    if (href.startsWith("products.html") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (href.startsWith("index.html")) {
      const j = href.indexOf("#");
      if (j > -1 && !homeIds.has(href.slice(j + 1))) t.ok(false, ctx + " missing home anchor: " + href);
      return;
    }
    if (href.startsWith("#")) {
      if (href.length > 1 && !href.startsWith("#/") && !ids.has(href.slice(1))) t.ok(false, ctx + " missing anchor: " + href);
      return;
    }
    t.ok(false, ctx + " unrecognized href: " + href);
  });
  // every rendered catalog image must exist and carry alt
  doc.querySelectorAll("img.ph__img").forEach((img) => {
    t.ok(exists(img.getAttribute("src")), ctx + " image exists: " + img.getAttribute("src"));
    t.ok((img.getAttribute("alt") || "").length > 5, ctx + " image has alt");
  });
}
auditDoc(homeDom().window.document, "[home]");
{
  const doc = catalogDom("#/products").window.document;
  t.ok(doc.querySelectorAll("#catalogCategories .ccard").length === 8, "landing: 8 category cards");
  t.ok(doc.querySelectorAll("#catalogCategories .ccard img.ph__img").length === CATS.filter((c) => c.image).length, "landing: real category images for every photographed category");
  auditDoc(doc, "[landing]");
}
for (const c of CATS) {
  const doc = catalogDom("#/products/" + c.slug).window.document;
  t.ok(!doc.getElementById("viewCategory").hidden, "category view visible: " + c.slug);
  t.ok(c.guide && exists("content/guides/" + c.guide + ".md") && doc.querySelector('#categoryGuide a[href="products.html#/guides/' + c.guide + '"]'), c.slug + ": links its buying guide");
  t.ok(doc.querySelector("#categoryHero h1") && doc.querySelector("#categoryHero h1").textContent === c.name, c.slug + " hero title");
  t.ok(c.image ? doc.querySelector("#categoryHero img.ph__img") : doc.querySelector("#categoryHero .ph__cap"), c.slug + " hero uses real lifestyle image (or draft placeholder)");
  t.ok(doc.getElementById("categoryHero").textContent.includes(c.tagline), c.slug + " shows catalog tagline");
  const cards = doc.querySelectorAll("#categoryGrid .pcard");
  t.ok(cards.length === COUNTS[c.slug], c.slug + " product count");
  cards.forEach((card) => {
    t.ok(prodBy[card.getAttribute("data-product")].image ? card.querySelector("img.ph__img") : card.querySelector(".ph__cap"), c.slug + " card has product photo (or draft placeholder)");
    t.ok(!card.querySelector(".pt-tier") && !card.querySelector("[data-qty-for]") && !card.querySelector("[data-add]"),
      c.slug + " card has no pricing UI / Add to Quote");
    t.ok(/MOQ/.test(card.textContent), c.slug + " card shows MOQ");
  });
  auditDoc(doc, "[cat:" + c.slug + "]");
}
for (const p of PRODS) {
  const doc = catalogDom("#/products/" + p.category + "/" + p.slug).window.document;
  const pd = doc.getElementById("productDetail");
  t.ok(pd.querySelector("h1") && pd.querySelector("h1").textContent === p.name, p.slug + " name renders");
  t.ok(p.image ? pd.querySelector(".pd__ph img.ph__img") : pd.querySelector(".pd__ph .ph__cap"), p.slug + " main catalog photo (or draft placeholder)");
  t.ok(pd.textContent.includes(p.description.slice(0, 40)), p.slug + " catalog description");
  t.ok(pd.querySelectorAll(".pt-tier").length === 4, p.slug + " 4 tiers");
  t.ok(pd.querySelector('[data-qty-for="' + p.slug + '"]'), p.slug + " quantity input");
  t.ok(pd.querySelector('[data-add="' + p.slug + '"]') && pd.querySelector('[data-mockup="' + p.slug + '"]') && pd.querySelector('[data-bespoke="' + p.slug + '"]'), p.slug + " CTAs");
  t.ok(pd.textContent.includes("Product Specifications") && pd.textContent.includes(p.ref), p.slug + " specifications + ref");
  t.ok(pd.querySelectorAll(".rel-card").length === 3, p.slug + " 3 related");
  auditDoc(doc, "[prod:" + p.slug + "]");
}
console.log("links audited:", linkCount);

/* ---------- 4. pricing interactions + nav + not-found ---------- */
{
  const dom = catalogDom("#/products/hats/fairway-golf-cap");
  const win = dom.window, doc = win.document;
  const input = doc.querySelector('[data-qty-for="fairway-golf-cap"]');
  const active = () => { const e = doc.querySelector('.pt-tier.is-active .pt-tier__qty'); return e && e.textContent; };
  type(win, input, "249"); t.ok(active() === "100", "qty 249 -> 100 tier (lower qualifying)");
  type(win, input, "250"); t.ok(active() === "250", "qty 250 -> 250 tier");
  type(win, input, "999"); t.ok(active() === "500", "qty 999 -> 500 tier");
  type(win, input, "40");
  t.ok(doc.querySelector('[data-summary="fairway-golf-cap"]').textContent.includes("Minimum order for this item is 100 units."), "MOQ warning");
  doc.querySelectorAll('[data-tier-for="fairway-golf-cap"]')[2].dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  t.ok(input.value === "500", "tier click sets quantity");
  click(win, doc.querySelector('[data-add="fairway-golf-cap"]'));
  t.ok(doc.getElementById("hlToast").textContent.indexOf("Added to quote selections.") === 0, "add toast");
  t.ok(doc.getElementById("quoteCount").textContent === "1", "quote chip increments");
  // hashchange navigation
  win.location.hash = "#/products/hats"; win.dispatchEvent(new win.Event("hashchange"));
  t.ok(!doc.getElementById("viewCategory").hidden && doc.getElementById("categoryGrid").textContent.includes("The Summit Trucker Hat"), "hashchange -> category");
  win.location.hash = "#/products"; win.dispatchEvent(new win.Event("hashchange"));
  t.ok(!doc.getElementById("viewLanding").hidden, "hashchange -> landing");
}
t.ok(catalogDom("#/products/nope").window.document.getElementById("categoryHero").textContent.includes("Category not found"), "category not-found");

/* ---------- 5. info pages (about / process / contact / legal) ---------- */
for (const slug of PAGE_SLUGS) {
  const dom = catalogDom("#/" + slug); const doc = dom.window.document;
  t.ok(!doc.getElementById("viewPage").hidden && doc.getElementById("viewLanding").hidden, slug + ": page view shown");
  const h1s = doc.querySelectorAll("#pageMount h1");
  t.ok(h1s.length === 1 && h1s[0].textContent.length > 10, slug + ": one h1");
  t.ok(doc.title === dom.window.HL_PAGES[slug].title, slug + ": title set");
  auditDoc(doc, "[page:" + slug + "]");
}
{
  const doc = catalogDom("#/about").window.document;
  t.ok(doc.getElementById("pageMount").textContent.includes("products worthy of carrying their names"), "about: essence line present");
}
{
  const doc = catalogDom("#/process").window.document;
  t.ok(doc.querySelectorAll(".pstep").length === 4 && doc.querySelector(".ptable") && /4\u20136 weeks/.test(doc.getElementById("pageMount").textContent), "process: 4 steps + timeline table");
}
{
  const dom = catalogDom("#/contact"); const win = dom.window, doc = win.document;
  const sent = []; win.fetch = (url, opts) => { sent.push({ url, body: JSON.parse(opts.body) }); return Promise.resolve({ ok: true, status: 200 }); };
  win.HL_LEAD_ENDPOINT = "/api/lead";
  t.ok(/info@hotelluxurysupply\.com/.test(doc.getElementById("pageMount").textContent) && /\+1 \(347\) 669-4417/.test(doc.getElementById("pageMount").textContent), "contact: NAP present");
  click(win, doc.getElementById("cfSubmit"));
  t.ok(!doc.getElementById("cfError").hidden, "contact: validates");
  type(win, doc.getElementById("cf-name"), "Paul");
  type(win, doc.getElementById("cf-email"), "paul@grandriviera.com");
  type(win, doc.getElementById("cf-message"), "Arrival totes for a spring opening.");
  click(win, doc.getElementById("cfSubmit"));
  t.ok(!doc.getElementById("contactSuccess").hidden && doc.getElementById("contactForm").hidden, "contact: success state");
  t.ok(sent.length === 1 && sent[0].url === "/api/lead" && sent[0].body.type === "contact" && sent[0].body.payload.email === "paul@grandriviera.com", "contact: lead POSTed");
  t.ok(win.HLLeads.outbox().length === 1 && win.HLLeads.outbox()[0].type === "contact", "contact: lead mirrored to local outbox");
}
{
  // SPA-mode navigation to an info page from a nav link
  const dom = catalogDom("#/products"); const win = dom.window, doc = win.document;
  click(win, doc.querySelector('.nav a[href="products.html#/about"]'));
  t.ok(!doc.getElementById("viewPage").hidden && doc.querySelector("#pageMount h1"), "nav link -> about renders in SPA mode");
}
t.ok(catalogDom("#/products/hats/nope").window.document.getElementById("productDetail").textContent.includes("Product not found"), "product not-found");

/* ---------- 6. collections (Phase 8.4) ---------- */
t.ok(COLS.length === 5 && COLS.every((c) => c.products.length >= 5 && c.intro && c.framing && c.directAnswer && c.hook && c.hook.cta), "5 collections with >= 5 pieces, intro, framing, answer, hook");
COLS.forEach((c) => c.products.forEach((s) => t.ok(prodBy[s] && prodBy[s].collections.includes(c.slug), c.slug + ": member exists + annotated: " + s)));
{
  const doc = catalogDom("#/collections").window.document;
  t.ok(!doc.getElementById("viewPage").hidden && doc.querySelectorAll("#pageMount .gcard--collection").length === 5 && doc.querySelector("#pageMount h1"), "collections index renders 5 cards");
  auditDoc(doc, "[collections]");
}
for (const c of COLS) {
  const doc = catalogDom("#/collections/" + c.slug).window.document;
  const m = doc.getElementById("pageMount");
  t.ok(m.querySelector("h1") && m.querySelector("h1").textContent === c.title, c.slug + ": collection h1");
  t.ok(m.querySelectorAll(".pcard").length === c.products.length && !m.querySelector(".pt-tier") && !m.querySelector("[data-add]"), c.slug + ": product cards without pricing UI");
  t.ok(m.querySelector(".category-answer") && /\d/.test(m.querySelector(".category-answer").textContent), c.slug + ": direct answer with a number");
  t.ok(m.querySelector('.collection-hook a[href="products.html#/bespoke?collection=' + c.slug + '"]'), c.slug + ": bespoke hook link");
  auditDoc(doc, "[collection:" + c.slug + "]");
}
{
  const p = PRODS.find((x) => x.collections.length);
  const doc = catalogDom("#/products/" + p.category + "/" + p.slug).window.document;
  t.ok(p.collections.every((s) => doc.querySelector('.pd__collections a[href="products.html#/collections/' + s + '"]')), "product page lists its collections");
  const cat = catalogDom("#/products/" + p.category).window.document;
  t.ok(cat.querySelector('#categoryGuide a[href="products.html#/collections/' + p.collections[0] + '"]'), "category page links the collections curating it");
  const b = catalogDom("#/bespoke?collection=sports-wellness").window.document;
  t.ok(b.getElementById("bf-category").value === "Multiple Categories" && /Sports & Wellness/.test(b.getElementById("bf-notes").value), "bespoke ?collection= prefills category + notes");
}
t.ok(catalogDom("#/collections/nope").window.document.getElementById("pageMount").textContent.includes("Collection not found"), "collection not-found");

t.done();
