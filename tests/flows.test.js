// Suite 2: end-to-end flows — Quote Cart (gated PDF, logo-gated submit),
// Bespoke page + drawers, and the built single-file preview under a
// frozen-location sandbox (artifact-viewer conditions) when it exists.
const fs = require("fs");
const path = require("path");
const { catalogDom, previewDom, harness, click, type } = require("./helpers");

const t = harness("FLOWS SUITE");

/* ================= Quote Cart E2E ================= */
{
  const dom = catalogDom("#/products/hats/fairway-golf-cap");
  const win = dom.window, doc = win.document;
  type(win, doc.querySelector('[data-qty-for="fairway-golf-cap"]'), "300");
  type(win, doc.getElementById("notes-fairway-golf-cap"), "Club logo left panel");
  click(win, doc.querySelector('[data-add="fairway-golf-cap"]'));
  const toast = doc.getElementById("hlToast");
  t.ok([...toast.querySelectorAll("button")].some((b) => b.textContent === "View Quote"), "toast View Quote action");
  click(win, [...toast.querySelectorAll("button")].find((b) => b.textContent === "View Quote"));
  const q = doc.getElementById("quoteMount");
  t.ok(!doc.getElementById("viewQuote").hidden && q.textContent.includes("Quote Cart"), "quote cart opens");
  t.ok(q.querySelector(".qline img.ph__img"), "line item shows catalog photo");
  t.ok(q.textContent.includes("Club logo left panel"), "notes carried");
  t.ok(q.textContent.includes("250+ units"), "active tier for qty 300");
  // edit + MOQ
  type(win, doc.getElementById("qline-qty-fairway-golf-cap"), "40");
  t.ok(q.textContent.includes("Minimum order for this item is 100 units."), "MOQ warning in cart");
  type(win, doc.getElementById("qline-qty-fairway-golf-cap"), "600");
  // PDF gated
  click(win, doc.getElementById("btnPdf"));
  t.ok(!doc.getElementById("pdError").hidden, "PDF blocked without details");
  type(win, doc.getElementById("pd-name"), "Paul Laurent");
  type(win, doc.getElementById("pd-email"), "paul@grandriviera.com");
  type(win, doc.getElementById("pd-phone"), "+1 212 555 0100");
  type(win, doc.getElementById("pd-property"), "Grand Riviera Hotel");
  const sel = doc.getElementById("pd-propertyType"); sel.value = "Hotel / Resort";
  sel.dispatchEvent(new win.Event("input", { bubbles: true }));
  type(win, doc.getElementById("pd-destination"), "New York, USA");
  type(win, doc.getElementById("pd-deliveryDate"), "2027-03-01");
  click(win, doc.getElementById("btnPdf"));
  const qdoc = doc.getElementById("hlQuoteDoc");
  t.ok(qdoc && /HLQ-\d{4}-\d{4}/.test(qdoc.textContent), "quote doc + HLQ ref");
  t.ok(qdoc.textContent.includes("The Fairway Golf Cap") && qdoc.textContent.includes("hotelluxurysupply.com"), "doc content + real contact");
  click(win, doc.getElementById("qdocClose"));
  // submit gated by logo
  click(win, doc.getElementById("btnSubmit"));
  t.ok(!doc.getElementById("upError").hidden, "submit blocked without artwork");
  const fi = doc.getElementById("logoInput");
  Object.defineProperty(fi, "files", { value: [{ name: "crest.svg" }] });
  fi.dispatchEvent(new win.Event("change", { bubbles: true }));
  click(win, doc.getElementById("btnSubmit"));
  t.ok(q.textContent.includes("Your selections have been sent to the concierge."), "quote success");
  t.ok(/HLQ-\d{4}-\d{4}/.test(q.textContent) && q.textContent.includes("crest.svg"), "success ref + files");
  t.ok(!/Checkout|Payment|Buy Now/i.test(q.textContent), "no checkout language");
}

/* ================= Bespoke E2E ================= */
{
  const dom = catalogDom("#/bespoke");
  const win = dom.window, doc = win.document;
  const bm = doc.getElementById("bespokeMount");
  t.ok(bm.textContent.includes("Beyond the catalog.") && bm.querySelectorAll(".bcap").length === 8, "bespoke page renders");
  click(win, doc.getElementById("bfSubmit"));
  t.ok(!doc.getElementById("bfError").hidden, "bespoke form validates");
  type(win, doc.getElementById("bf-name"), "Paul");
  type(win, doc.getElementById("bf-email"), "paul@grandriviera.com");
  type(win, doc.getElementById("bf-property"), "Grand Riviera");
  const pt = doc.getElementById("bf-projectType"); pt.value = "Develop a new custom product"; pt.dispatchEvent(new win.Event("input", { bubbles: true }));
  const pc = doc.getElementById("bf-category"); pc.value = "Bags"; pc.dispatchEvent(new win.Event("input", { bubbles: true }));
  type(win, doc.getElementById("bf-quantity"), "500");
  type(win, doc.getElementById("bf-notes"), "Private-label arrival tote.");
  click(win, doc.getElementById("bfSubmit"));
  t.ok(/HLB-\d{4}-\d{4}/.test(bm.textContent), "bespoke success + HLB ref");
}
{
  // product drawers
  const dom = catalogDom("#/products/hats/fairway-golf-cap");
  const win = dom.window, doc = win.document;
  click(win, doc.querySelector('[data-bespoke="fairway-golf-cap"]'));
  const drawer = doc.getElementById("bdrDrawer");
  t.ok(drawer && !drawer.hidden && doc.getElementById("bdrSub").textContent.includes("The Fairway Golf Cap"), "bespoke drawer opens with product context");
  t.ok(drawer.textContent.includes("H-005"), "drawer shows ref");
  type(win, doc.getElementById("bd-name"), "Paul");
  type(win, doc.getElementById("bd-email"), "p@g.com");
  type(win, doc.getElementById("bd-property"), "GR");
  click(win, doc.getElementById("bdSubmit"));
  t.ok(drawer.textContent.includes("Your bespoke inquiry for The Fairway Golf Cap"), "bespoke drawer success");
  click(win, doc.getElementById("bdrDone"));
  click(win, doc.querySelector('[data-mockup="fairway-golf-cap"]'));
  type(win, doc.getElementById("bd-name"), "Paul");
  type(win, doc.getElementById("bd-email"), "p@g.com");
  type(win, doc.getElementById("bd-property"), "GR");
  type(win, doc.getElementById("bd-quantity"), "250");
  type(win, doc.getElementById("bd-notes"), "Left panel.");
  click(win, doc.getElementById("bdSubmit"));
  t.ok(doc.getElementById("bdError").textContent.includes("upload your logo"), "mockup logo-gated");
  const mf = doc.getElementById("bdLogo");
  Object.defineProperty(mf, "files", { value: [{ name: "crest.eps" }] });
  mf.dispatchEvent(new win.Event("change", { bubbles: true }));
  click(win, doc.getElementById("bdSubmit"));
  t.ok(drawer.textContent.includes("Your mockup request for The Fairway Golf Cap has been sent."), "mockup success");
}

/* ================= Preview click-through (frozen hash) ================= */
{
  const previewPath = process.env.HL_PREVIEW || path.join(__dirname, "..", "dist-preview", "hl-supply-preview.html");
  if (!fs.existsSync(previewPath)) {
    console.log("(preview file not built — skipping sandbox click-through)");
  } else {
    const dom = previewDom(previewPath);
    const win = dom.window, doc = win.document;
    const homeView = doc.querySelector('[data-pv="home"]');
    t.ok(!homeView.hidden, "preview starts on homepage");
    t.ok(doc.querySelector(".hero__img") && doc.querySelector(".hero__img").getAttribute("src").startsWith("data:image"), "preview hero image embedded");
    click(win, [...doc.querySelectorAll("#atelierGrid a")].find((a) => a.getAttribute("href").includes("/hats")));
    t.ok(homeView.hidden && !doc.getElementById("viewCategory").hidden, "homepage Hats card -> category (no hash needed)");
    const grid = doc.getElementById("categoryGrid");
    t.ok(grid.querySelectorAll(".pcard").length === 6, "6 hats listed");
    t.ok(grid.querySelector('.pcard img.ph__img') && grid.querySelector('.pcard img.ph__img').getAttribute("src").startsWith("data:image"), "preview product photos embedded");
    click(win, [...grid.querySelectorAll(".pcard")].find((c) => c.textContent.includes("Riviera Bucket Hat")).querySelector("a.tlink"));
    const pd = doc.getElementById("productDetail");
    t.ok(pd.querySelector("h1").textContent === "The Riviera Bucket Hat", "bucket hat page");
    t.ok(pd.querySelectorAll(".pt-tier").length === 4 && pd.textContent.includes("H-002"), "pricing + specs");
    type(win, pd.querySelector('[data-qty-for="riviera-bucket-hat"]'), "300");
    const act = pd.querySelector(".pt-tier.is-active .pt-tier__qty");
    t.ok(act && act.textContent === "250", "qty 300 -> 250 tier in preview");
    click(win, doc.querySelector(".header .wordmark"));
    t.ok(!homeView.hidden, "wordmark returns home");
  }
}

t.done();
