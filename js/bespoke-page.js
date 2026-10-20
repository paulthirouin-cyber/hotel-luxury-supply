// HL Supply — Phase 8
// Bespoke system: structured submission store + the /bespoke page
// (hero, two paths, capabilities, project form, scenarios, concierge CTA).
// Drawers for product pages live in js/bespoke-drawers.js.

/* ================= submission store ================= */

window.HLBespoke = (function () {
  "use strict";

  var KEY = "hl_bespoke_submissions_v1";
  var list = [];
  try {
    var saved = window.localStorage.getItem(KEY);
    if (saved) list = JSON.parse(saved) || [];
  } catch (e) { /* memory only */ }

  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* memory only */ }
  }

  function newRef() {
    return "HLB-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000));
  }

  /** Structured bespoke submission — ready for email/CRM later. */
  function buildSubmission(source, productContext, contact, project, uploads) {
    return {
      type: "bespoke-request",
      reference: newRef(),
      source: source, // "bespoke-page" | "product-detail" | "category-page" | "mockup-request"
      productContext: productContext || null,
      contact: contact,
      project: project,
      uploads: uploads,
      timestamp: new Date().toISOString()
    };
  }

  function save(submission) {
    list.push(submission);
    persist();
    return submission;
  }

  function all() { return list.slice(); }

  return { buildSubmission: buildSubmission, save: save, all: all };
})();

/* ================= /bespoke page ================= */

window.HLBespokePage = (function () {
  "use strict";

  var R = window.HLRoutes;
  function U(route) { return R ? R.href(route) : "products.html" + route; }
  function HOME(anchor) { return R ? R.home(anchor) : "index.html" + (anchor ? "#" + anchor : ""); }

  var B = window.HLBespoke;

  var PROPERTY_TYPES = ["Hotel / Resort", "Private Club", "Golf Property", "Beach Club",
    "Spa / Wellness", "Destination Event", "Corporate Retreat", "Other"];

  var PROJECT_TYPES = ["Adapt an existing catalog item", "Develop a new custom product",
    "Build a coordinated collection", "Request help choosing products", "Other"];

  var CATEGORY_OPTIONS = ["Bags", "Hats", "Bottles", "Flip-flops", "Leather Goods",
    "Slippers", "Accessories", "Multiple Categories", "Not Sure Yet"];

  var CAPABILITIES = [
    ["Dimensions", "Adjust size, proportion, pocketing, capacity, or product structure.", "swatch-canvas"],
    ["Materials", "Explore canvas, cotton twill, performance fabric, vegan leather, leather details, foam, terry, waffle, microfiber, and more.", "swatch-linen"],
    ["Color", "Match property colors, seasonal palettes, cabana stripes, Pantone references, or custom combinations.", "swatch-pool"],
    ["Logo Treatment", "Embroidery, debossing, laser etching, printed logos, molded details, all-over artwork, and more.", "swatch-navy"],
    ["Trim & Hardware", "Customize straps, closures, buckles, snaps, handles, edging, woven labels, and finish details.", "swatch-chrome"],
    ["Packaging", "Add gift packaging, welcome presentation, retail hangtags, tissue, belly bands, or property-specific finishing.", "swatch-terra"],
    ["Collections", "Build coordinated sets for poolside, spa, golf, beach club, suite, arrival, or retail moments.", "swatch-green"],
    ["Production Review", "Our team reviews artwork, material, quantity, timing, and feasibility before confirming production.", "swatch-stone"]
  ];

  var REQUIRED = [
    ["name", "Name"], ["email", "Email"], ["property", "Property / Company / Event Name"],
    ["projectType", "Project Type"], ["category", "Product Category"],
    ["quantity", "Target Quantity"], ["notes", "Project Notes"]
  ];

  var logoFiles = [];
  var inspoFiles = [];
  var context = null; // {productName, category, ref, slug} when prefilled

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
    return c ? c.name : "";
  }
  function mount() { return document.getElementById("bespokeMount"); }

  /* ---------------- fragments ---------------- */

  function selectHTML(key, label, options, value, required, placeholder) {
    var opts = ['<option value="">' + esc(placeholder || "Select") + "</option>"].concat(
      options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (value === o ? " selected" : "") + ">" + esc(o) + "</option>";
      })
    ).join("");
    return (
      '<div class="qd-field" data-field="' + key + '">' +
      '  <label for="bf-' + key + '">' + esc(label) + (required ? "" : ' <span class="qd-optional">(optional)</span>') + "</label>" +
      '  <select id="bf-' + key + '" data-bf="' + key + '"' + (required ? " required" : "") + ">" + opts + "</select>" +
      "</div>"
    );
  }

  function inputHTML(key, label, required, type, value, placeholder) {
    return (
      '<div class="qd-field" data-field="' + key + '">' +
      '  <label for="bf-' + key + '">' + esc(label) + (required ? "" : ' <span class="qd-optional">(optional)</span>') + "</label>" +
      '  <input id="bf-' + key + '" type="' + (type || "text") + '" data-bf="' + key + '" value="' + esc(value || "") + '"' +
      (placeholder ? ' placeholder="' + esc(placeholder) + '"' : "") + (required ? " required" : "") + " />" +
      "</div>"
    );
  }

  function uploadHTML(id, label, helper) {
    return (
      '<div class="qd-field qd-field--wide">' +
      '  <label for="' + id + '">' + esc(label) + ' <span class="qd-optional">(optional)</span></label>' +
      '  <label class="qdrop qdrop--slim" for="' + id + '">' +
      '    <span class="qdrop__main">Drop files here or choose files</span>' +
      '    <span class="qdrop__sub">' + esc(helper) + "</span>" +
      '    <input type="file" id="' + id + '" multiple accept=".ai,.eps,.svg,.pdf,.png,.jpg,.jpeg" />' +
      "  </label>" +
      '  <ul class="qfiles" id="' + id + 'List" aria-label="' + esc(label) + ' files"></ul>' +
      "</div>"
    );
  }

  var FAQS = [
    { q: "What does \u201cbespoke\u201d mean at HL Supply?", a: "Bespoke means the catalog is a starting point, not a limit. We adapt an existing piece (dimensions, materials, colors, trims, hardware, packaging, logo method) or develop an entirely new product from a sketch, reference image, or guest moment." },
    { q: "What is the minimum order for a bespoke product?", a: "Minimums follow the closest catalog category: hats and leather goods from 100 units, bags, bottles, and flip-flops from 200, slippers from 1,000 pairs. Fully custom developments are quoted individually once the design is defined." },
    { q: "How long does a bespoke project take?", a: "Catalog adaptations typically follow the standard 4\u20136 week production window after proof approval. New product developments add design and sampling time, which the atelier confirms in the project proposal." },
    { q: "Can you match our property\u2019s Pantone colors and materials?", a: "Yes. Pantone matching, alternate fabrics and leathers, custom hardware, and coordinated packaging are all part of the bespoke process, evaluated against production feasibility and quantity." },
    { q: "Do we need finished artwork to start?", a: "No. Start with a logo, a brand guide, a sketch, or a reference image. The atelier prepares mockups and a proof; logo files are uploaded at quote or mockup submission." },
    { q: "How do we begin?", a: "Submit the bespoke form below, or open any catalog product and choose Make It Bespoke. The concierge replies with questions, directions, and a project reference (HLB-) to track the inquiry." }
  ];

  function faqHTML() {
    if (window.HLCatalog && window.HLCatalog.faqHTML) return window.HLCatalog.faqHTML(FAQS, "Questions about bespoke projects");
    return "";
  }

  function heroHTML() {
    return (
      '<section class="bhero">' +
      '  <div class="bhero__grid">' +
      '    <div class="bhero__copy">' +
      '      <span class="eyebrow">HL Supply / Bespoke Atelier</span>' +
      "      <h1>Beyond the catalog.</h1>" +
      "      <p>Custom dimensions, materials, colors, trims, packaging, and logo treatments for hospitality goods that need to feel completely your own.</p>" +
      '      <div class="btn-row">' +
      '        <a class="btn btn--solid" href="#bespokeForm">Start Bespoke Project</a>' +
      '        <a class="btn" href="#bespokeForm">Request a Mockup</a>' +
      "      </div>" +
      "    </div>" +
      '    <div class="ph bhero__ph">' +
      '      <div class="ph__art jt-tint-arrival"><span class="ph__line"></span></div>' +
      '      <span class="ph__cap">Image \u2014 Riviera atelier desk with fabric swatches, embroidered cap, canvas tote, leather tag, Pantone cards, and hotel stationery.</span>' +
      "    </div>" +
      "  </div>" +
      "</section>"
    );
  }

  function pathsHTML() {
    return (
      '<section class="bsection">' +
      '  <div class="section-head">' +
      '    <span class="eyebrow">Two Ways In</span>' +
      "    <h2>Start with a signature item. Make it entirely your own.</h2>" +
      "    <p>Choose a product from the atelier catalog, then refine the details \u2014 size, material, color, trim, logo method, packaging, and finish. Some projects begin with a tote or cap. Others become a full property collection.</p>" +
      "  </div>" +
      '  <div class="bpaths">' +
      '    <article class="bpath">' +
      '      <span class="bpath__num">I</span>' +
      "      <h3>Adapt a Signature Product</h3>" +
      "      <p>Begin with an existing HL Supply item and adjust the details to suit your property, event, or brand standards.</p>" +
      '      <ul><li>Change dimensions</li><li>Match a Pantone color</li><li>Select alternate fabric or material</li><li>Adjust logo placement</li><li>Change strap, trim, or hardware</li><li>Add custom packaging</li></ul>' +
      '      <a class="tlink" href="' + U("#/products") + '">Browse Products</a>' +
      "    </article>" +
      '    <article class="bpath">' +
      '      <span class="bpath__num">II</span>' +
      "      <h3>Develop Something Custom</h3>" +
      "      <p>Share a product idea, reference image, or guest moment and let our team help shape the right hospitality object.</p>" +
      '      <ul><li>Custom guest amenity</li><li>Private-label resort retail item</li><li>Bespoke golf event product</li><li>Suite-specific leather good</li><li>Custom beach club accessory</li></ul>' +
      '      <a class="tlink" href="#bespokeForm">Start Bespoke Project</a>' +
      "    </article>" +
      "  </div>" +
      "</section>"
    );
  }

  function capabilitiesHTML() {
    var tiles = CAPABILITIES.map(function (c) {
      return (
        '<article class="bcap">' +
        '  <span class="bcap__swatch ' + c[2] + '" aria-hidden="true"></span>' +
        "  <h3>" + esc(c[0]) + "</h3>" +
        "  <p>" + esc(c[1]) + "</p>" +
        "</article>"
      );
    }).join("");
    return (
      '<section class="bsection bsection--tint">' +
      '  <div class="section-head">' +
      '    <span class="eyebrow">Capabilities</span>' +
      "    <h2>What can be customized</h2>" +
      "  </div>" +
      '  <div class="bcaps">' + tiles + "</div>" +
      "</section>"
    );
  }

  function scenariosHTML() {
    return (
      '<section class="bsection">' +
      '  <div class="section-head">' +
      '    <span class="eyebrow">In Practice</span>' +
      "    <h2>How properties use the atelier</h2>" +
      "  </div>" +
      '  <div class="bscen">' +
      '    <article><h3>The cabana-stripe tote</h3><p>A beach club matched The Nautical Striped Tote to its umbrella stripe, added a woven label, and built a retail run.</p></article>' +
      '    <article><h3>The tournament cap</h3><p>A golf property adapted The Fairway Golf Cap with a Pantone-matched crown and side embroidery for a member-guest event.</p></article>' +
      '    <article><h3>The suite collection</h3><p>A resort coordinated slippers, a valet tray, and a sleep mask into a single arrival presentation with custom packaging.</p></article>' +
      "  </div>" +
      "</section>"
    );
  }

  function contextChipHTML() {
    if (!context) return "";
    return (
      '<p class="bcontext">Starting from <strong>' + esc(context.productName) + "</strong>" +
      (context.ref ? " (" + esc(context.ref) + ")" : "") +
      ' <button type="button" class="bcontext__clear" id="bfClearContext">Start fresh instead</button></p>'
    );
  }

  function formHTML() {
    return (
      '<section class="bsection" id="bespokeForm">' +
      '  <div class="bform qcard">' +
      '    <h2>Start a Bespoke Project</h2>' +
      '    <p class="qcard__intro">Tell us what you are building. We\u2019ll review your direction and help translate it into the right product, material, and production path.</p>' +
      contextChipHTML() +
      '    <div class="qd-form bform__grid">' +
      inputHTML("name", "Name", true) +
      inputHTML("email", "Email", true, "email") +
      inputHTML("phone", "Phone", false, "tel") +
      inputHTML("property", "Property / Company / Event Name", true) +
      selectHTML("propertyType", "Property Type", PROPERTY_TYPES, "", false, "Select property type") +
      selectHTML("projectType", "Project Type", PROJECT_TYPES,
        context ? "Adapt an existing catalog item" : "", true, "Select project type") +
      selectHTML("category", "Product Category", CATEGORY_OPTIONS,
        context ? catName(context.category) : "", true, "Select category") +
      inputHTML("quantity", "Target Quantity", true, "number") +
      inputHTML("deliveryDate", "Desired Delivery Date", false, "date") +
      '      <div class="qd-field qd-field--wide" data-field="notes">' +
      '        <label for="bf-notes">Project Notes</label>' +
      '        <textarea id="bf-notes" rows="4" data-bf="notes" required placeholder="Tell us about the property, guest moment, product idea, materials, colors, quantity, timeline, and any special requirements."></textarea>' +
      "      </div>" +
      inputHTML("pantone", "Pantone / Color Reference", false) +
      inputHTML("material", "Desired Material", false) +
      inputHTML("dimensions", "Custom Dimensions", false) +
      inputHTML("packaging", "Packaging Requirements", false) +
      uploadHTML("bfLogo", "Upload Logo / Artwork", "Vector files are preferred for logos. AI, EPS, SVG, PDF, PNG, JPG.") +
      uploadHTML("bfInspo", "Upload Inspiration / Reference Images", "Pantone references, sketches, inspiration images, or brand standards.") +
      "    </div>" +
      '    <div class="qerror" id="bfError" role="alert" hidden></div>' +
      '    <button type="button" class="btn btn--solid qaction" id="bfSubmit">Submit Bespoke Request</button>' +
      '    <p class="qnote">Reviewed by the concierge team. Final direction, pricing, and production path are confirmed after review.</p>' +
      "  </div>" +
      "</section>"
    );
  }

  function successHTML(ref) {
    return (
      '<div class="qsuccess bsuccess">' +
      '  <div class="qsuccess__rule" aria-hidden="true"></div>' +
      "  <h1>Your bespoke request has been sent to the concierge.</h1>" +
      "  <p>Our team will review your product direction, customization details, artwork, quantity, and timeline before preparing next steps.</p>" +
      '  <dl class="qsuccess__meta"><div><dt>Reference</dt><dd>' + esc(ref) + "</dd></div></dl>" +
      '  <div class="btn-row">' +
      '    <a class="btn btn--solid" href="' + U("#/products") + '">Explore Products</a>' +
      '    <a class="btn" href="' + HOME() + '">Back to Home</a>' +
      "  </div>" +
      "</div>"
    );
  }

  function conciergeHTML() {
    return (
      '<section class="bsection bsection--tint">' +
      '  <div class="section-head">' +
      '    <span class="eyebrow">Concierge</span>' +
      "    <h2>Not sure where to begin?</h2>" +
      "    <p>Send the guest moment you have in mind and the concierge team will suggest the right product direction.</p>" +
      "  </div>" +
      '  <div class="btn-row">' +
      '    <a class="btn btn--solid" href="#bespokeForm">Start Bespoke Project</a>' +
      '    <a class="btn" href="' + HOME("concierge") + '">Speak with the Concierge</a>' +
      "  </div>" +
      "</section>"
    );
  }

  /* ---------------- validation & submit ---------------- */

  function val(key) {
    var el = document.getElementById("bf-" + key);
    return el ? (el.value || "").trim() : "";
  }

  function missing() {
    return REQUIRED.filter(function (f) {
      var v = val(f[0]);
      if (f[0] === "email") return !v || v.indexOf("@") === -1;
      return !v;
    });
  }

  function showError(msg, fields) {
    var box = document.getElementById("bfError");
    if (!box) return;
    box.textContent = msg;
    box.hidden = false;
    document.querySelectorAll("#bespokeForm .qd-field.is-invalid").forEach(function (f) {
      f.classList.remove("is-invalid");
    });
    (fields || []).forEach(function (f) {
      var field = document.querySelector('#bespokeForm .qd-field[data-field="' + f[0] + '"]');
      if (field) {
        field.classList.add("is-invalid");
        var input = field.querySelector("input, select, textarea");
        if (input) input.setAttribute("aria-invalid", "true");
      }
    });
    box.scrollIntoView({ block: "nearest" });
  }

  function submit() {
    var box = document.getElementById("bfError");
    if (box) { box.hidden = true; box.textContent = ""; }
    var miss = missing();
    if (miss.length) {
      showError("Please complete the required fields: " + miss.map(function (f) { return f[1]; }).join(", ") + ".", miss);
      return;
    }
    var submission = B.buildSubmission(
      context ? "product-detail" : "bespoke-page",
      context,
      { name: val("name"), email: val("email"), phone: val("phone"), property: val("property") },
      {
        propertyType: val("propertyType"),
        projectType: val("projectType"),
        category: val("category"),
        targetQuantity: val("quantity"),
        desiredDeliveryDate: val("deliveryDate"),
        notes: val("notes"),
        pantone: val("pantone"),
        material: val("material"),
        dimensions: val("dimensions"),
        packaging: val("packaging")
      },
      {
        logoFiles: logoFiles.map(function (f) { return f.name; }),
        inspirationFiles: inspoFiles.map(function (f) { return f.name; })
      }
    );
    B.save(submission);
    if (window.HLLeads) window.HLLeads.send("bespoke", submission);
    var root = mount();
    if (root) {
      root.innerHTML = successHTML(submission.reference);
      window.scrollTo(0, 0);
    }
  }

  /* ---------------- events (bound once) ---------------- */

  var bound = false;
  function bind() {
    if (bound) return;
    bound = true;
    var root = mount();
    if (!root) return;

    root.addEventListener("click", function (e) {
      if (e.target.id === "bfSubmit") { submit(); return; }
      if (e.target.id === "bfClearContext") {
        context = null;
        renderInto();
        return;
      }
    });

    root.addEventListener("input", function (e) {
      var field = e.target.closest && e.target.closest(".qd-field");
      if (field) { field.classList.remove("is-invalid"); e.target.removeAttribute("aria-invalid"); }
    });

    root.addEventListener("change", function (e) {
      if (e.target.id === "bfLogo" && e.target.files) {
        for (var i = 0; i < e.target.files.length; i++) logoFiles.push(e.target.files[i]);
        fileList("bfLogoList", logoFiles);
      }
      if (e.target.id === "bfInspo" && e.target.files) {
        for (var j = 0; j < e.target.files.length; j++) inspoFiles.push(e.target.files[j]);
        fileList("bfInspoList", inspoFiles);
      }
    });
  }

  function fileList(id, files) {
    var list = document.getElementById(id);
    if (list) list.innerHTML = files.map(function (f) { return "<li>" + esc(f.name) + "</li>"; }).join("");
  }

  /* ---------------- render ---------------- */

  function renderInto() {
    var root = mount();
    if (!root) return;
    root.innerHTML =
      heroHTML() + pathsHTML() + capabilitiesHTML() + formHTML() + scenariosHTML() + faqHTML() + conciergeHTML();
    fileList("bfLogoList", logoFiles);
    fileList("bfInspoList", inspoFiles);
  }

  function render(params) {
    params = params || {};
    context = null;
    if (params.product) {
      var p = prod(params.product);
      if (p) context = { productName: p.name, category: p.category, ref: p.ref, slug: p.slug };
    } else if (params.category) {
      var cn = catName(params.category);
      if (cn) context = null; // category prefill handled via select below
    }
    bind();
    // Static build: the page arrives pre-rendered. Hydrate only, unless a
    // prefill (product/category) requires fresh markup.
    var view = document.getElementById("viewBespoke");
    var pre = !!(view && view.hasAttribute("data-prerendered"));
    if (pre) view.removeAttribute("data-prerendered");
    if (!pre || params.product || params.category) renderInto();
    // category prefill (no product context chip)
    if (!params.product && params.category) {
      var cn2 = catName(params.category);
      var sel = document.getElementById("bf-category");
      if (sel && cn2) sel.value = cn2;
    }
  }

  return { render: render, FAQS: FAQS };
})();

// If the bespoke view is already active (deep link), render immediately —
// the router may have run before this module loaded.
(function () {
  var view = document.getElementById("viewBespoke");
  if (view && !view.hidden && window.HLBespokePage) {
    var params = {};
    try { params = window.HLRoutes ? window.HLRoutes.query() : {}; } catch (e) { /* ignore */ }
    window.HLBespokePage.render(params);
  }
})();
