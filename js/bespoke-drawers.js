// HL Supply — Phase 8
// Product-page drawers: "Make It Bespoke" and "Request Mockup".
// Both auto-fill product context, trap focus, close on Escape/overlay,
// validate, and store structured submissions via window.HLBespoke.

window.HLBespokeDrawers = (function () {
  "use strict";

  var B = window.HLBespoke;

  var CUSTOMIZE_OPTIONS = ["Size / dimensions", "Material", "Color", "Logo placement",
    "Logo method", "Strap / trim", "Hardware", "Packaging", "Full custom version", "Not sure yet"];

  var state = { open: false, mode: null, product: null, files: [], inspo: [], lastFocused: null };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function prod(slug) {
    return (window.HL_PRODUCTS || []).filter(function (p) { return p.slug === slug; })[0] || null;
  }
  function catName(slug) {
    var c = (window.HL_CATEGORIES || []).filter(function (c) { return c.slug === slug; })[0];
    return c ? c.name : slug;
  }

  /* ---------------- fragments ---------------- */

  function field(key, label, required, type, placeholder) {
    return (
      '<div class="qd-field" data-field="' + key + '">' +
      '  <label for="bd-' + key + '">' + esc(label) + (required ? "" : ' <span class="qd-optional">(optional)</span>') + "</label>" +
      '  <input id="bd-' + key + '" type="' + (type || "text") + '" data-bd="' + key + '"' +
      (placeholder ? ' placeholder="' + esc(placeholder) + '"' : "") + (required ? " required" : "") + " />" +
      "</div>"
    );
  }

  function area(key, label, required, placeholder, rows) {
    return (
      '<div class="qd-field" data-field="' + key + '">' +
      '  <label for="bd-' + key + '">' + esc(label) + (required ? "" : ' <span class="qd-optional">(optional)</span>') + "</label>" +
      '  <textarea id="bd-' + key + '" rows="' + (rows || 3) + '" data-bd="' + key + '"' +
      (placeholder ? ' placeholder="' + esc(placeholder) + '"' : "") + (required ? " required" : "") + "></textarea>" +
      "</div>"
    );
  }

  function upload(id, helper) {
    return (
      '<div class="qd-field" data-field="' + id + '">' +
      '  <label for="' + id + '">Upload Logo / Artwork</label>' +
      '  <label class="qdrop qdrop--slim" for="' + id + '">' +
      '    <span class="qdrop__main">Drop files here or choose files</span>' +
      '    <span class="qdrop__sub">' + esc(helper) + "</span>" +
      '    <input type="file" id="' + id + '" multiple accept=".ai,.eps,.svg,.pdf,.png,.jpg,.jpeg" />' +
      "  </label>" +
      '  <ul class="qfiles" id="' + id + 'List" aria-label="Uploaded files"></ul>' +
      "</div>"
    );
  }

  function contextHTML(p) {
    return (
      '<dl class="bdr__context">' +
      "  <div><dt>Product</dt><dd>" + esc(p.name) + "</dd></div>" +
      "  <div><dt>Category</dt><dd>" + esc(catName(p.category)) + "</dd></div>" +
      "  <div><dt>Type</dt><dd>" + esc(p.type) + "</dd></div>" +
      "  <div><dt>Ref</dt><dd>" + esc(p.ref) + "</dd></div>" +
      "</dl>"
    );
  }

  function bespokeFormHTML(p) {
    var checks = CUSTOMIZE_OPTIONS.map(function (o, i) {
      return (
        '<label class="bdr__check"><input type="checkbox" value="' + esc(o) + '" data-bd-check /> <span>' + esc(o) + "</span></label>"
      );
    }).join("");
    return (
      contextHTML(p) +
      '<div class="bdr__form">' +
      field("name", "Name", true) +
      field("email", "Email", true, "email") +
      field("property", "Property / Company", true) +
      field("quantity", "Target Quantity", false, "number") +
      field("deliveryDate", "Desired Delivery Date", false, "date") +
      '<fieldset class="bdr__fieldset" data-field="customize">' +
      '  <legend>What would you like to customize?</legend>' +
      '  <div class="bdr__checks">' + checks + "</div>" +
      "</fieldset>" +
      field("pantone", "Custom Color / Pantone", false) +
      field("material", "Material Preference", false) +
      field("placement", "Logo Placement", false) +
      field("packaging", "Packaging Needs", false) +
      upload("bdLogo", "Vector files are preferred for logos. AI, EPS, SVG, PDF, PNG, JPG.") +
      upload2() +
      area("notes", "Notes", false, "Anything else the atelier should know.") +
      "</div>" +
      '<div class="qerror" id="bdError" role="alert" hidden></div>' +
      '<button type="button" class="btn btn--solid qaction" id="bdSubmit">Send Bespoke Inquiry</button>'
    );
  }

  function upload2() {
    return (
      '<div class="qd-field" data-field="bdInspo">' +
      '  <label for="bdInspo">Upload Inspiration / Reference Images <span class="qd-optional">(optional)</span></label>' +
      '  <label class="qdrop qdrop--slim" for="bdInspo">' +
      '    <span class="qdrop__main">Drop files here or choose files</span>' +
      '    <span class="qdrop__sub">Sketches, reference images, or brand standards.</span>' +
      '    <input type="file" id="bdInspo" multiple accept=".ai,.eps,.svg,.pdf,.png,.jpg,.jpeg" />' +
      "  </label>" +
      '  <ul class="qfiles" id="bdInspoList" aria-label="Inspiration files"></ul>' +
      "</div>"
    );
  }

  function mockupFormHTML(p) {
    return (
      contextHTML(p) +
      '<div class="bdr__form">' +
      field("name", "Name", true) +
      field("email", "Email", true, "email") +
      field("property", "Property / Company", true) +
      field("quantity", "Estimated Quantity", true, "number") +
      field("deliveryDate", "Desired Delivery Date", false, "date") +
      field("color", "Preferred Color", false) +
      field("placement", "Logo Placement Notes", false) +
      upload("bdLogo", "Vector artwork is preferred for embroidery, etching, debossing, or production-ready review.") +
      area("notes", "Notes", true, "Placement, colors, event date, or anything the atelier should know.") +
      "</div>" +
      '<div class="qerror" id="bdError" role="alert" hidden></div>' +
      '<button type="button" class="btn btn--solid qaction" id="bdSubmit">Request Mockup</button>'
    );
  }

  /* ---------------- drawer shell ---------------- */

  function ensureShell() {
    if (document.getElementById("bdrDrawer")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="bdr-overlay" id="bdrOverlay" hidden></div>' +
      '<aside class="bdr" id="bdrDrawer" role="dialog" aria-modal="true" aria-labelledby="bdrTitle" hidden>' +
      '  <div class="bdr__inner">' +
      '    <div class="bdr__top">' +
      "      <div>" +
      '        <span class="cbell-drawer__eyebrow bdr__eyebrow">HL Supply / Bespoke</span>' +
      '        <h2 id="bdrTitle"></h2>' +
      '        <p class="bdr__sub" id="bdrSub"></p>' +
      "      </div>" +
      '      <button type="button" class="bdr__close" id="bdrClose" aria-label="Close">&times;</button>' +
      "    </div>" +
      '    <div class="bdr__body" id="bdrBody"></div>' +
      "  </div>" +
      "</aside>";
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    document.getElementById("bdrClose").addEventListener("click", close);
    document.getElementById("bdrOverlay").addEventListener("click", close);

    var body = document.getElementById("bdrBody");

    body.addEventListener("change", function (e) {
      if (e.target.id === "bdLogo" && e.target.files) {
        for (var i = 0; i < e.target.files.length; i++) state.files.push(e.target.files[i]);
        renderFiles("bdLogoList", state.files);
        clearError();
      }
      if (e.target.id === "bdInspo" && e.target.files) {
        for (var j = 0; j < e.target.files.length; j++) state.inspo.push(e.target.files[j]);
        renderFiles("bdInspoList", state.inspo);
      }
    });

    body.addEventListener("input", function (e) {
      var f = e.target.closest && e.target.closest(".qd-field");
      if (f) { f.classList.remove("is-invalid"); e.target.removeAttribute("aria-invalid"); }
    });

    body.addEventListener("click", function (e) {
      if (e.target.id === "bdSubmit") submit();
      if (e.target.id === "bdrDone") close();
    });
  }

  function renderFiles(id, files) {
    var list = document.getElementById(id);
    if (list) list.innerHTML = files.map(function (f) { return "<li>" + esc(f.name) + "</li>"; }).join("");
  }

  function focusables() {
    var drawer = document.getElementById("bdrDrawer");
    return Array.prototype.filter.call(
      drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && el.offsetParent !== null; }
    );
  }

  function onKeydown(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(mode, slug) {
    var p = prod(slug);
    if (!p) return;
    ensureShell();

    state.open = true;
    state.mode = mode;
    state.product = p;
    state.files = [];
    state.inspo = [];
    state.lastFocused = document.activeElement;

    var title = document.getElementById("bdrTitle");
    var sub = document.getElementById("bdrSub");
    var body = document.getElementById("bdrBody");

    if (mode === "bespoke") {
      title.textContent = "Make this item bespoke";
      sub.textContent = "Customize " + p.name + " beyond the standard catalog details.";
      body.innerHTML = bespokeFormHTML(p);
    } else {
      title.textContent = "Request a Mockup";
      sub.textContent = "Send us your product direction and artwork. We\u2019ll review the details and help prepare the next step.";
      body.innerHTML = mockupFormHTML(p);
    }

    var overlay = document.getElementById("bdrOverlay");
    var drawer = document.getElementById("bdrDrawer");
    overlay.hidden = false;
    drawer.hidden = false;
    var raf = window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : function (fn) { window.setTimeout(fn, 16); };
    raf(function () {
      raf(function () {
        overlay.classList.add("is-open");
        drawer.classList.add("is-open");
      });
    });
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    window.setTimeout(function () { document.getElementById("bdrClose").focus(); }, 80);
  }

  function close() {
    if (!state.open) return;
    state.open = false;
    var overlay = document.getElementById("bdrOverlay");
    var drawer = document.getElementById("bdrDrawer");
    overlay.classList.remove("is-open");
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    window.setTimeout(function () {
      if (!state.open) { overlay.hidden = true; drawer.hidden = true; }
    }, 520);
    if (state.lastFocused && state.lastFocused.focus) state.lastFocused.focus();
  }

  /* ---------------- validation & submit ---------------- */

  function val(key) {
    var el = document.getElementById("bd-" + key);
    return el ? (el.value || "").trim() : "";
  }

  function showError(msg, keys) {
    var box = document.getElementById("bdError");
    if (!box) return;
    box.textContent = msg;
    box.hidden = false;
    document.querySelectorAll("#bdrBody .qd-field.is-invalid").forEach(function (f) {
      f.classList.remove("is-invalid");
    });
    (keys || []).forEach(function (k) {
      var field = document.querySelector('#bdrBody .qd-field[data-field="' + k + '"]');
      if (field) {
        field.classList.add("is-invalid");
        var input = field.querySelector("input, textarea");
        if (input) input.setAttribute("aria-invalid", "true");
      }
    });
    box.scrollIntoView({ block: "nearest" });
  }

  function clearError() {
    var box = document.getElementById("bdError");
    if (box) { box.hidden = true; box.textContent = ""; }
  }

  function submit() {
    clearError();
    var p = state.product;
    var required = state.mode === "mockup"
      ? [["name"], ["email"], ["property"], ["quantity"], ["notes"]]
      : [["name"], ["email"], ["property"]];

    var miss = required.filter(function (f) {
      var v = val(f[0]);
      if (f[0] === "email") return !v || v.indexOf("@") === -1;
      return !v;
    }).map(function (f) { return f[0]; });

    if (miss.length) {
      showError("Please complete the required fields before sending.", miss);
      return;
    }

    if (state.mode === "mockup" && !state.files.length) {
      showError("Please upload your logo or artwork to request a mockup.", ["bdLogo"]);
      return;
    }

    var checks = Array.prototype.map.call(
      document.querySelectorAll("#bdrBody [data-bd-check]:checked"),
      function (c) { return c.value; }
    );

    var submission = B.buildSubmission(
      state.mode === "mockup" ? "mockup-request" : "product-detail",
      { productName: p.name, category: p.category, ref: p.ref, slug: p.slug },
      { name: val("name"), email: val("email"), phone: "", property: val("property") },
      {
        propertyType: "",
        projectType: state.mode === "mockup" ? "Mockup request" : "Adapt an existing catalog item",
        category: p.category,
        targetQuantity: val("quantity"),
        desiredDeliveryDate: val("deliveryDate"),
        notes: val("notes"),
        pantone: val("pantone") || val("color"),
        material: val("material"),
        dimensions: "",
        packaging: val("packaging"),
        customize: checks,
        logoPlacement: val("placement")
      },
      {
        logoFiles: state.files.map(function (f) { return f.name; }),
        inspirationFiles: state.inspo.map(function (f) { return f.name; })
      }
    );
    B.save(submission);

    var body = document.getElementById("bdrBody");
    var msg = state.mode === "mockup"
      ? "Your mockup request for " + p.name + " has been sent."
      : "Your bespoke inquiry for " + p.name + " has been sent to the concierge.";
    body.innerHTML =
      '<div class="bdr__success">' +
      '  <div class="qsuccess__rule" aria-hidden="true"></div>' +
      "  <p>" + esc(msg) + "</p>" +
      '  <dl class="qsuccess__meta"><div><dt>Reference</dt><dd>' + esc(submission.reference) + "</dd></div></dl>" +
      '  <button type="button" class="btn btn--solid" id="bdrDone">Done</button>' +
      "</div>";
  }

  /* ---------------- trigger delegation ---------------- */

  document.addEventListener("click", function (e) {
    var mk = e.target.closest && e.target.closest("[data-bespoke]");
    if (mk) { e.preventDefault(); open("bespoke", mk.getAttribute("data-bespoke")); return; }
    var mo = e.target.closest && e.target.closest("[data-mockup]");
    if (mo) { e.preventDefault(); open("mockup", mo.getAttribute("data-mockup")); }
  });

  return { open: open, close: close };
})();
