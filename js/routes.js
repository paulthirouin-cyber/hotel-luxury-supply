// HL Supply — URL strategy shared by every page. Load this script FIRST.
//
// Two modes, decided once from <html data-static>:
//   SPA mode    (source files + single-file preview): hash routes on
//                products.html, e.g. products.html#/products/hats
//   Static mode (built dist/, <html data-static>): clean pre-rendered URLs,
//                e.g. /products/hats/ — every link is a real page load.
//
// Every renderer builds links with HLRoutes.href("#/products/hats") so the
// same code emits the right form in both modes.

window.HLRoutes = (function () {
  "use strict";

  var root = document.documentElement;
  var STATIC = !!(root && root.hasAttribute("data-static"));

  // "#/products/hats?x=1" -> { path: "products/hats", query: "x=1" }
  function split(route) {
    var r = String(route || "");
    if (r.charAt(0) === "#") r = r.slice(1);
    if (r.charAt(0) === "/") r = r.slice(1);
    var q = "";
    var i = r.indexOf("?");
    if (i > -1) { q = r.slice(i + 1); r = r.slice(0, i); }
    return { path: r.replace(/\/+$/, ""), query: q };
  }

  function href(route) {
    var s = split(route);
    if (STATIC) return "/" + (s.path ? s.path + "/" : "") + (s.query ? "?" + s.query : "");
    return "products.html#/" + s.path + (s.query ? "?" + s.query : "");
  }

  function home(anchor) {
    if (STATIC) return "/" + (anchor ? "#" + anchor : "");
    return "index.html" + (anchor ? "#" + anchor : "");
  }

  function asset(p) {
    return STATIC ? "/" + String(p).replace(/^\/+/, "") : p;
  }

  // Route string ("#/...") for the catalog router, derived from the URL.
  function current() {
    var loc = window.location;
    if (!STATIC) return loc.hash || "";
    var path = (loc.pathname || "/").replace(/\/index\.html$/, "/").replace(/^\/+|\/+$/g, "");
    if (!path) return "";
    return "#/" + path + (loc.search || "");
  }

  function parseQuery(qs) {
    var out = {};
    String(qs || "").replace(/^\?/, "").split("&").forEach(function (kv) {
      if (!kv) return;
      var p = kv.split("=");
      try { out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ""); } catch (e) { /* skip */ }
    });
    return out;
  }

  // Query params of the current route (hash query in SPA, ?search in static).
  function query() {
    return parseQuery(split(current()).query);
  }

  // Full page navigation. window.HL_NAVIGATE lets tests/previews observe it.
  function go(url, replace) {
    if (typeof window.HL_NAVIGATE === "function") return window.HL_NAVIGATE(url, !!replace);
    if (replace) window.location.replace(url); else window.location.assign(url);
  }

  // Legacy hash URLs on the static site (/anything#/products/hats) → clean URL.
  if (STATIC) {
    try {
      var h = window.location.hash || "";
      if (h.indexOf("#/") === 0) go(href(h), true);
    } catch (e) { /* ignore */ }
  }

  return { isStatic: STATIC, split: split, href: href, home: home, asset: asset,
    current: current, query: query, parseQuery: parseQuery, go: go };
})();
