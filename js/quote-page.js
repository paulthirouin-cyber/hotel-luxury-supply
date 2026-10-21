// HL Supply — Phase 7
// Quote Cart page (#/quote): Project Selections, Quote Summary,
// Project Details, gated Instant Quote PDF, Logo Upload, Submit to Concierge.

window.HLQuotePage = (function () {
  "use strict";

  var Q = window.HLQuote;
  var P = window.HLPricing;
  var R = window.HLRoutes;
  function U(route) { return R ? R.href(route) : "products.html" + route; }
  function HOME(anchor) { return R ? R.home(anchor) : "index.html" + (anchor ? "#" + anchor : ""); }

  var sessionFiles = []; // File objects live only for the session; names persist at submit

  var REQUIRED = [
    ["name", "Name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["property", "Property / Company / Event Name"],
    ["propertyType", "Property Type"],
    ["destination", "Shipping Destination"],
    ["deliveryDate", "Desired Delivery Date"]
  ];

  var PROPERTY_TYPES = ["Hotel / Resort", "Private Club", "Golf Property", "Beach Club",
    "Spa / Wellness", "Destination Event", "Corporate Retreat", "Other"];

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
  function mount() { return document.getElementById("quoteMount"); }

  /* ---------------- line pricing ---------------- */

  function lineData(item) {
    var p = prod(item.slug);
    if (!p) return null;
    var res = P.resolve(p, item.quantity);
    return {
      product: p,
      item: item,
      res: res,
      unitPrice: res.belowMOQ ? "\u2014" : P.formatUnit(res.unitPrice),
      lineTotal: res.belowMOQ ? "\u2014" :
        (typeof res.total === "number" ? P.formatTotal(res.total) : "Estimate pending final pricing review")
    };
  }

  /* ---------------- fragments ---------------- */

  function lineHTML(item) {
    var L = lineData(item);
    if (!L) return "";
    var p = L.product, res = L.res;
    return (
      '<article class="qline" data-qline="' + p.slug + '">' +
      '  <div class="qline__media ph' + (p.image ? " ph--photo" : "") + '">' +
      '    <div class="ph__art ' + p.tint + '"></div>' +
      (p.image
        ? '    <img class="ph__img" src="' + p.image + '" alt="' + esc(p.imageLabel) + '" loading="lazy" />'
        : '    <span class="ph__cap">' + esc(p.imageLabel) + "</span>") +
      "  </div>" +
      '  <div class="qline__body">' +
      '    <div class="qline__top">' +
      "      <div>" +
      '        <span class="pcard__cat">' + esc(catName(p.category)) + "</span>" +
      "        <h3>" + esc(p.name) + "</h3>" +
      "      </div>" +
      '      <button type="button" class="qline__remove" data-qline-remove="' + p.slug + '" aria-label="Remove ' + esc(p.name) + ' from quote">Remove</button>' +
      "    </div>" +
      '    <dl class="qline__meta">' +
      "      <div><dt>MOQ</dt><dd>" + P.formatQty(p.tiers[0].qty) + " " + esc(p.unitLabel) + "</dd></div>" +
      "      <div><dt>Customization</dt><dd>" + esc(p.customization.join(", ")) + "</dd></div>" +
      (res.belowMOQ ? "" :
      "      <div><dt>Active tier</dt><dd>" + P.formatQty(res.tier.qty) + "+ " + esc(p.unitLabel) + "</dd></div>" +
      "      <div><dt>Unit price</dt><dd>" + L.unitPrice + "</dd></div>") +
      "    </dl>" +
      '    <div class="qline__edit">' +
      '      <label for="qline-qty-' + p.slug + '">Quantity (' + esc(p.unitLabel) + ")</label>" +
      '      <input id="qline-qty-' + p.slug + '" type="number" inputmode="numeric" min="0" step="1"' +
      '        value="' + item.quantity + '" data-qline-qty="' + p.slug + '" />' +
      "    </div>" +
      '    <p class="qline__total" data-qline-total="' + p.slug + '">' +
      (res.belowMOQ
        ? '<span class="qline__moq">Minimum order for this item is ' + P.formatQty(res.moq) + " " + esc(p.unitLabel) + ".</span>"
        : "<span>Estimated line total</span><strong>" + L.lineTotal + "</strong>") +
      "    </p>" +
      '    <div class="qline__notes">' +
      '      <label for="qline-notes-' + p.slug + '">Product notes</label>' +
      '      <textarea id="qline-notes-' + p.slug + '" rows="2" data-qline-notes="' + p.slug + '"' +
      '        placeholder="Colors, placement, packaging, or anything the atelier should know.">' + esc(item.notes) + "</textarea>" +
      "    </div>" +
      "  </div>" +
      "</article>"
    );
  }

  function summaryHTML() {
    return (
      '<section class="qcard" aria-labelledby="qsumTitle">' +
      '  <h2 id="qsumTitle">Quote Summary</h2>' +
      '  <dl class="qsum">' +
      '    <div><dt>Product subtotal</dt><dd id="qsumSubtotal">Estimate pending</dd></div>' +
      "    <div><dt>Customization review</dt><dd>Pending</dd></div>" +
      "    <div><dt>Setup fees</dt><dd>Pending review</dd></div>" +
      "    <div><dt>Shipping</dt><dd>Calculated after review</dd></div>" +
      '    <div class="qsum__total"><dt>Estimated total</dt><dd id="qsumTotal">Estimate pending</dd></div>' +
      "  </dl>" +
      '  <p class="qnote">Final quote is confirmed after artwork, customization, shipping, and production review.</p>' +
      "</section>"
    );
  }

  function fieldHTML(key, label, value, type) {
    if (key === "propertyType") {
      var opts = ['<option value="">Select property type</option>'].concat(
        PROPERTY_TYPES.map(function (t) {
          return '<option value="' + esc(t) + '"' + (value === t ? " selected" : "") + ">" + esc(t) + "</option>";
        })
      ).join("");
      return (
        '<div class="qd-field" data-field="' + key + '">' +
        '  <label for="pd-' + key + '">' + esc(label) + "</label>" +
        '  <select id="pd-' + key + '" data-pd="' + key + '" required>' + opts + "</select>" +
        "</div>"
      );
    }
    return (
      '<div class="qd-field" data-field="' + key + '">' +
      '  <label for="pd-' + key + '">' + esc(label) + "</label>" +
      '  <input id="pd-' + key + '" type="' + (type || "text") + '" data-pd="' + key + '" value="' + esc(value) + '" required />' +
      "</div>"
    );
  }

  function detailsHTML() {
    var d = Q.details();
    return (
      '<section class="qcard" aria-labelledby="qpdTitle">' +
      '  <h2 id="qpdTitle">Project Details</h2>' +
      '  <p class="qcard__intro">Please provide your information to generate your instant quote PDF. This helps us prepare an accurate follow-up if you choose to submit your project for review.</p>' +
      '  <div class="qd-form">' +
      fieldHTML("name", "Name", d.name) +
      fieldHTML("email", "Email", d.email, "email") +
      fieldHTML("phone", "Phone", d.phone, "tel") +
      fieldHTML("property", "Property / Company / Event Name", d.property) +
      fieldHTML("propertyType", "Property Type", d.propertyType) +
      fieldHTML("destination", "Shipping Destination", d.destination) +
      fieldHTML("deliveryDate", "Desired Delivery Date", d.deliveryDate, "date") +
      '    <div class="qd-field qd-field--wide">' +
      '      <label for="pd-notes">Project Notes <span class="qd-optional">(optional)</span></label>' +
      '      <textarea id="pd-notes" rows="3" data-pd="notes" placeholder="Tell us anything important about your property, event, timeline, brand standards, packaging, or customization needs.">' + esc(d.notes) + "</textarea>" +
      "    </div>" +
      "  </div>" +
      '  <div class="qerror" id="pdError" role="alert" hidden></div>' +
      '  <button type="button" class="btn btn--solid qaction" id="btnPdf" aria-describedby="pdfHint">Download Instant Quote PDF</button>' +
      '  <p class="qnote" id="pdfHint">Available once your selections and project details are complete. Instant quotes are preliminary.</p>' +
      "</section>"
    );
  }

  function uploadHTML() {
    return (
      '<section class="qcard" aria-labelledby="qupTitle">' +
      '  <h2 id="qupTitle">Upload your logo or artwork</h2>' +
      '  <p class="qcard__intro">Please upload your logo before submitting your project to the concierge team. Vector files are preferred for embroidery, etching, debossing, printing, and production review.</p>' +
      '  <label class="qdrop" id="logoDrop" for="logoInput">' +
      '    <span class="qdrop__main">Drop files here or choose files</span>' +
      '    <span class="qdrop__sub">Vector artwork is preferred. AI, EPS, SVG, PDF, PNG, JPG.</span>' +
      '    <input type="file" id="logoInput" multiple accept=".ai,.eps,.svg,.pdf,.png,.jpg,.jpeg" />' +
      "  </label>" +
      '  <ul class="qfiles" id="logoFiles" aria-label="Uploaded artwork files"></ul>' +
      '  <div class="qerror" id="upError" role="alert" hidden></div>' +
      '  <button type="button" class="btn btn--solid qaction" id="btnSubmit">Submit to Concierge</button>' +
      '  <p class="qnote">Our team reviews artwork, customization, quantities, and production requirements, then follows up with a formal quote and proof.</p>' +
      "</section>"
    );
  }

  /* ---------------- states ---------------- */

  function emptyHTML() {
    return (
      '<div class="qempty">' +
      "  <h1>Your quote cart is waiting.</h1>" +
      "  <p>Explore the atelier and add the guest goods you would like quoted for your property, event, or collection.</p>" +
      '  <a class="btn btn--solid" href="' + U("#/products") + '">Explore Products</a>' +
      "</div>"
    );
  }

  function successHTML(sub) {
    var files = (sub.fileNames || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("");
    return (
      '<div class="qsuccess">' +
      '  <div class="qsuccess__rule" aria-hidden="true"></div>' +
      "  <h1>Your selections have been sent to the concierge.</h1>" +
      "  <p>Our team will review your artwork, customization details, quantities, and production requirements. We\u2019ll follow up with a formal quote and proof.</p>" +
      '  <dl class="qsuccess__meta">' +
      "    <div><dt>Quote reference</dt><dd>" + esc(sub.ref) + "</dd></div>" +
      "    <div><dt>Confirmation sent to</dt><dd>" + esc(sub.email) + "</dd></div>" +
      "    <div><dt>Artwork received</dt><dd><ul>" + files + "</ul></dd></div>" +
      "  </dl>" +
      '  <div class="btn-row">' +
      '    <a class="btn btn--solid" href="' + U("#/products") + '">Explore More Products</a>' +
      '    <a class="btn" href="' + HOME() + '">Back to Home</a>' +
      (Q.pdfDownloaded() ? "" : '    <button type="button" class="btn" id="btnPdfLate">Download Instant Quote PDF</button>') +
      "  </div>" +
      '  <p class="qnote"><button type="button" class="qreset" id="btnReset">Start a new project</button></p>' +
      "</div>"
    );
  }

  /* ---------------- validation ---------------- */

  function missingDetails() {
    var d = Q.details();
    return REQUIRED.filter(function (f) {
      var v = (d[f[0]] || "").trim();
      if (f[0] === "email") return !v || v.indexOf("@") === -1;
      return !v;
    });
  }

  function showError(id, msg, missing) {
    var box = document.getElementById(id);
    if (!box) return;
    box.textContent = msg;
    box.hidden = false;
    document.querySelectorAll(".qd-field.is-invalid").forEach(function (f) {
      f.classList.remove("is-invalid");
    });
    (missing || []).forEach(function (f) {
      var field = document.querySelector('.qd-field[data-field="' + f[0] + '"]');
      if (field) {
        field.classList.add("is-invalid");
        var input = field.querySelector("input, select");
        if (input) input.setAttribute("aria-invalid", "true");
      }
    });
    box.scrollIntoView({ block: "nearest" });
  }

  function clearError(id) {
    var box = document.getElementById(id);
    if (box) { box.hidden = true; box.textContent = ""; }
  }

  /* ---------------- quote document data ---------------- */

  function buildDocData() {
    var lines = Q.items().map(function (item) {
      var L = lineData(item);
      var p = L.product, res = L.res;
      return {
        name: p.name,
        category: catName(p.category),
        quantity: P.formatQty(item.quantity),
        unitLabel: p.unitLabel,
        tierQty: res.belowMOQ ? P.formatQty(res.moq) : P.formatQty(res.tier.qty),
        unitPrice: L.unitPrice === "\u2014" ? "$--" : L.unitPrice,
        lineTotal: typeof res.total === "number" ? P.formatTotal(res.total) : "Estimate pending",
        customization: p.customization.join(", "),
        notes: item.notes || ""
      };
    });
    var numeric = Q.items().every(function (item) {
      var L = lineData(item);
      return typeof L.res.total === "number";
    });
    var subtotal = "Estimate pending";
    if (numeric && Q.items().length) {
      var sum = 0;
      Q.items().forEach(function (item) { sum += lineData(item).res.total; });
      subtotal = P.formatTotal(sum);
    }
    return {
      ref: Q.ensureRef(),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      details: Q.details(),
      lines: lines,
      summary: { subtotal: subtotal }
    };
  }

  /* ---------------- actions ---------------- */

  function onPdfClick() {
    clearError("pdError");
    if (!Q.count()) return;
    var missing = missingDetails();
    if (missing.length) {
      showError("pdError", "Please complete your project details before downloading your instant quote.", missing);
      return;
    }
    var data = buildDocData();
    window.HLQuotePDF.open(data);
    Q.markPdfDownloaded();
    if (window.HLLeads && window.HLLeads.track) window.HLLeads.track("Instant Quote PDF", { ref: data.ref, lines: data.lines ? data.lines.length : 0 });
    Q.setLead(Q.buildLead(data.lines, data.summary));
    if (window.HLCatalog && window.HLCatalog.toast) {
      window.HLCatalog.toast("Your instant quote has been generated. Submit to Concierge when you\u2019re ready for formal review.");
    }
  }

  function onSubmitClick() {
    clearError("upError");
    clearError("pdError");
    if (!Q.count()) return;
    var missing = missingDetails();
    if (missing.length) {
      showError("pdError", "Please complete your project details before submitting to the concierge.", missing);
      return;
    }
    if (!sessionFiles.length) {
      showError("upError", "Please upload your logo or artwork before submitting your project for review.");
      return;
    }
    var sub = {
      ref: Q.ensureRef(),
      email: (Q.details().email || "").trim(),
      fileNames: sessionFiles.map(function (f) { return f.name; }),
      submittedAt: new Date().toISOString()
    };
    Q.setSubmission(sub);
    if (window.HLLeads && window.HLLeads.track) window.HLLeads.track("Quote Submit", { ref: sub.ref, lines: sub.items ? sub.items.length : 0 });
    if (window.HLLeads) {
      window.HLLeads.send("quote", {
        ref: sub.ref, email: sub.email, fileNames: sub.fileNames, submittedAt: sub.submittedAt,
        details: Q.details(), lead: Q.lead ? Q.lead() : null,
        items: Q.items().map(function (it) { var p = prod(it.slug); return { ref: p ? p.ref : it.slug, name: p ? p.name : it.slug, quantity: it.quantity, notes: it.notes || "" }; })
      });
    }
    render();
    window.scrollTo(0, 0);
  }

  function renderFileList() {
    var list = document.getElementById("logoFiles");
    if (!list) return;
    list.innerHTML = sessionFiles
      .map(function (f) { return "<li>" + esc(f.name) + "</li>"; })
      .join("");
  }

  function addFiles(fileList) {
    for (var i = 0; i < fileList.length; i++) sessionFiles.push(fileList[i]);
    renderFileList();
    clearError("upError");
  }

  /* ---------------- events (bound once) ---------------- */

  var bound = false;
  function bind() {
    if (bound) return;
    bound = true;
    var root = mount();
    if (!root) return;

    root.addEventListener("input", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-pd")) {
        Q.setDetail(t.getAttribute("data-pd"), t.value);
        var field = t.closest(".qd-field");
        if (field) { field.classList.remove("is-invalid"); t.removeAttribute("aria-invalid"); }
        return;
      }
      if (t.hasAttribute("data-qline-qty")) {
        var slug = t.getAttribute("data-qline-qty");
        Q.updateQty(slug, t.value);
        refreshLine(slug);
        if (window.HLCatalog) window.HLCatalog.refreshCount();
        return;
      }
      if (t.hasAttribute("data-qline-notes")) {
        Q.updateNotes(t.getAttribute("data-qline-notes"), t.value);
      }
    });

    root.addEventListener("change", function (e) {
      if (e.target.id === "logoInput" && e.target.files) addFiles(e.target.files);
      if (e.target.hasAttribute && e.target.hasAttribute("data-pd")) {
        Q.setDetail(e.target.getAttribute("data-pd"), e.target.value);
      }
    });

    root.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-qline-remove]");
      if (rm) {
        Q.remove(rm.getAttribute("data-qline-remove"));
        if (window.HLCatalog) window.HLCatalog.refreshCount();
        render();
        return;
      }
      if (e.target.id === "btnPdf") { onPdfClick(); return; }
      if (e.target.id === "btnSubmit") { onSubmitClick(); return; }
      if (e.target.id === "btnPdfLate") { onPdfClick(); render(); return; }
      if (e.target.id === "btnReset") {
        Q.reset();
        sessionFiles = [];
        if (window.HLCatalog) window.HLCatalog.refreshCount();
        render();
      }
    });

    // drag & drop on the upload zone (delegated so re-renders keep working)
    root.addEventListener("dragover", function (e) {
      var zone = e.target.closest && e.target.closest("#logoDrop");
      if (zone) { e.preventDefault(); zone.classList.add("is-drag"); }
    });
    root.addEventListener("dragleave", function (e) {
      var zone = e.target.closest && e.target.closest("#logoDrop");
      if (zone) zone.classList.remove("is-drag");
    });
    root.addEventListener("drop", function (e) {
      var zone = e.target.closest && e.target.closest("#logoDrop");
      if (zone) {
        e.preventDefault();
        zone.classList.remove("is-drag");
        if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
      }
    });
  }

  /* ---------------- partial refresh ---------------- */

  function refreshLine(slug) {
    var item = Q.items().filter(function (i) { return i.slug === slug; })[0];
    var box = document.querySelector('[data-qline-total="' + slug + '"]');
    if (!item || !box) return;
    var L = lineData(item);
    var p = L.product, res = L.res;
    box.innerHTML = res.belowMOQ
      ? '<span class="qline__moq">Minimum order for this item is ' + P.formatQty(res.moq) + " " + esc(p.unitLabel) + ".</span>"
      : "<span>Estimated line total</span><strong>" + L.lineTotal + "</strong>";
    // refresh tier/unit meta rows
    var line = document.querySelector('[data-qline="' + slug + '"] .qline__meta');
    if (line) {
      line.innerHTML =
        "<div><dt>MOQ</dt><dd>" + P.formatQty(p.tiers[0].qty) + " " + esc(p.unitLabel) + "</dd></div>" +
        "<div><dt>Customization</dt><dd>" + esc(p.customization.join(", ")) + "</dd></div>" +
        (res.belowMOQ ? "" :
        "<div><dt>Active tier</dt><dd>" + P.formatQty(res.tier.qty) + "+ " + esc(p.unitLabel) + "</dd></div>" +
        "<div><dt>Unit price</dt><dd>" + L.unitPrice + "</dd></div>");
    }
  }

  /* ---------------- render ---------------- */

  function render() {
    var root = mount();
    if (!root) return;
    bind();

    var sub = Q.submission();
    if (sub) {
      root.innerHTML = successHTML(sub);
      return;
    }

    if (!Q.count()) {
      root.innerHTML = emptyHTML();
      return;
    }

    root.innerHTML =
      '<header class="qhead">' +
      "  <h1>Quote Cart</h1>" +
      "  <p>Review your selections, provide your project details, and download an instant preliminary quote or submit your request to the HL Supply concierge team.</p>" +
      '  <p class="qhead__note">Instant quotes are preliminary. Final pricing is confirmed after artwork, customization, shipping, and production review.</p>' +
      "</header>" +
      '<div class="qgrid">' +
      '  <div class="qgrid__lines" aria-label="Project Selections">' +
      '    <h2 class="qgrid__lines-title">Project Selections</h2>' +
      Q.items().map(lineHTML).join("") +
      "  </div>" +
      '  <aside class="qgrid__side">' +
      summaryHTML() +
      detailsHTML() +
      uploadHTML() +
      "  </aside>" +
      "</div>" +
      '<p class="qnote qnote--foot">Final pricing is confirmed after artwork and production review.</p>';

    renderFileList();
  }

  return { render: render };
})();

// If the quote view is already active (deep link), render immediately.
(function () {
  var view = document.getElementById("viewQuote");
  if (view && !view.hidden && window.HLQuotePage) window.HLQuotePage.render();
})();
