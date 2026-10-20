// Shared jsdom helpers for the HL Supply test suites.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const CATALOG_SCRIPTS = [
  "js/routes.js", "js/leads.js", "js/main.js", "js/mobile-menu.js", "js/categories.js", "js/products.js",
  "js/pricing.js", "js/quote-store.js", "js/pages.js", "js/catalog.js", "js/quote-pdf.js",
  "js/quote-page.js", "js/bespoke-page.js", "js/bespoke-drawers.js"
];

function stub(win) {
  win.matchMedia = win.matchMedia || (() => ({ matches: false, addEventListener() {}, addListener() {} }));
  win.scrollTo = () => {};
  win.print = () => { win.__printed = true; };
  win.Element.prototype.scrollIntoView = win.Element.prototype.scrollIntoView || function () {};
  win.IntersectionObserver = win.IntersectionObserver || class { observe(){} unobserve(){} disconnect(){} };
  win.requestAnimationFrame = win.requestAnimationFrame || ((fn) => setTimeout(fn, 0));
}

/** products.html at a given hash route, all scripts executed. */
function catalogDom(hash) {
  const dom = new JSDOM(read("products.html"), {
    runScripts: "outside-only",
    url: "https://test.local/products.html" + (hash || "")
  });
  stub(dom.window);
  CATALOG_SCRIPTS.forEach((f) => dom.window.eval(read(f)));
  return dom;
}

/** index.html with homepage scripts (category cards rendered). */
function homeDom() {
  const dom = new JSDOM(read("index.html"), {
    runScripts: "outside-only",
    url: "https://test.local/index.html"
  });
  stub(dom.window);
  ["js/routes.js", "js/categories.js", "js/category-section.js"].forEach((f) => dom.window.eval(read(f)));
  return dom;
}

/** The built single-file preview, with location.hash frozen (artifact sandbox). */
function previewDom(previewPath) {
  const html = fs.readFileSync(previewPath, "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://artifact.test/p" });
  const win = dom.window;
  stub(win);
  win.eval('window.__FROZEN={get hash(){return ""},set hash(v){}}');
  [...win.document.querySelectorAll("script")].forEach((s) => {
    if (s.textContent.trim()) {
      win.eval(s.textContent.split("window.location.hash").join("window.__FROZEN.hash"));
    }
  });
  return dom;
}

/** Load raw data files in a sandbox window. */
function data() {
  const dom = new JSDOM("", { runScripts: "outside-only" });
  dom.window.eval(read("js/categories.js"));
  dom.window.eval(read("js/products.js"));
  return { CATS: dom.window.HL_CATEGORIES, PRODS: dom.window.HL_PRODUCTS };
}

function harness(name) {
  let failures = 0;
  return {
    ok(cond, msg) { if (!cond) { failures++; console.log("FAIL:", msg); } },
    done() {
      console.log(failures === 0 ? `\n${name}: ALL PASSED` : `\n${name}: ${failures} FAILURES`);
      process.exit(failures ? 1 : 0);
    }
  };
}

const click = (win, el) => el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
const type = (win, el, v) => { el.value = v; el.dispatchEvent(new win.Event("input", { bubbles: true })); };

module.exports = { ROOT, read, exists, stub, catalogDom, homeDom, previewDom, data, harness, click, type };
