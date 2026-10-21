// HL Supply — Phase 6
// Catalog renderer for products.html, category.html, and product.html.
// Reads window.HL_CATEGORIES + window.HL_PRODUCTS, uses window.HLPricing
// and window.HLQuote. Exposed as window.HLCatalog so a preview shell or
// future router can drive it directly.

(function () {
  "use strict";

  var CATS = window.HL_CATEGORIES || [];
  var PRODS = window.HL_PRODUCTS || [];
  var COLS = window.HL_COLLECTIONS || [];
  var COLS = window.HL_COLLECTIONS || [];
  var P = window.HLPricing;
  var Q = window.HLQuote;
  var R = window.HLRoutes;
  var STATIC = !!(R && R.isStatic);

  // link helper — emits hash routes (SPA) or clean URLs (static build)
  function U(route) { return R ? R.href(route) : "products.html" + route; }
  function HOME() { return R ? R.home() : "index.html"; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function catBySlug(slug) {
    return CATS.filter(function (c) { return c.slug === slug; })[0] || null;
  }

  function prodBySlug(slug) {
    return PRODS.filter(function (p) { return p.slug === slug; })[0] || null;
  }

  function prodsInCat(slug) {
    return PRODS.filter(function (p) { return p.category === slug; });
  }

  function colBySlug(slug) {
    return COLS.filter(function (c) { return c.slug === slug; })[0] || null;
  }

  // collections that curate at least one piece from a category
  function colsForCat(slug) {
    return COLS.filter(function (c) {
      return c.products.some(function (s) { var p = prodBySlug(s); return p && p.category === slug; });
    });
  }

  function colLinksHTML(cols) {
    return cols.map(function (c) {
      return '<a href="' + U("#/collections/" + c.slug) + '">' + esc(c.name) + "</a>";
    }).join(", ");
  }

  function colBySlug(slug) {
    return COLS.filter(function (c) { return c.slug === slug; })[0] || null;
  }

  // collections that curate at least one piece from a category
  function colsForCat(slug) {
    return COLS.filter(function (c) {
      return c.products.some(function (s) { var p = prodBySlug(s); return p && p.category === slug; });
    });
  }

  function colLinksHTML(cols) {
    return cols.map(function (c) {
      return '<a href="' + U("#/collections/" + c.slug) + '">' + esc(c.name) + "</a>";
    }).join(", ");
  }

  /* ---------------- toast ---------------- */

  var toastTimer = null;

  function toast(msg, withQuoteActions) {
    var el = document.getElementById("hlToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "hlToast";
      el.className = "hl-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    if (withQuoteActions) {
      var actions = document.createElement("div");
      actions.className = "hl-toast__actions";
      var view = document.createElement("button");
      view.type = "button";
      view.textContent = "View Quote";
      view.addEventListener("click", function () {
        el.classList.remove("is-visible");
        navigate("#/quote");
      });
      var cont = document.createElement("button");
      cont.type = "button";
      cont.textContent = "Continue Browsing";
      cont.addEventListener("click", function () {
        el.classList.remove("is-visible");
      });
      actions.appendChild(view);
      actions.appendChild(cont);
      el.appendChild(actions);
    }
    el.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.classList.remove("is-visible");
    }, withQuoteActions ? 6500 : 3400);
  }

  /* ---------------- quote count chip ---------------- */

  function refreshCount() {
    var chip = document.getElementById("quoteCount");
    if (!chip || !Q) return;
    var n = Q.count();
    chip.textContent = n;
    chip.hidden = n === 0;
  }

  /* ---------------- shared fragments ---------------- */

  function phHTML(tint, label, extraClass, img, cover) {
    if (img) {
      return (
        '<div class="ph ' + (extraClass || "") + (cover ? " ph--cover" : " ph--photo") + '">' +
        (cover ? "" : '  <div class="ph__art ' + tint + '"></div>') +
        '  <img class="ph__img" src="' + img + '" alt="' + esc(label) + '" loading="lazy" decoding="async" />' +
        "</div>"
      );
    }
    return (
      '<div class="ph ' + (extraClass || "") + '">' +
      '  <div class="ph__art ' + tint + '"><span class="ph__line"></span></div>' +
      '  <span class="ph__cap">Image — ' + esc(label) + "</span>" +
      "</div>"
    );
  }

  function tiersHTML(product, activeIndex) {
    var rows = product.tiers
      .map(function (t, i) {
        var active = i === activeIndex;
        return (
          '<button type="button" class="pt-tier' + (active ? " is-active" : "") + '"' +
          ' data-tier-qty="' + t.qty + '" data-tier-for="' + product.slug + '"' +
          ' aria-pressed="' + (active ? "true" : "false") + '"' +
          ' title="Set quantity to ' + P.formatQty(t.qty) + " " + product.unitLabel + '">' +
          '  <span class="pt-tier__qty">' + P.formatQty(t.qty) + "</span>" +
          '  <span class="pt-tier__price">' + P.formatUnit(t.price) + " / unit</span>" +
          (active ? '<span class="pt-tier__mark">Active tier</span>' : "") +
          "</button>"
        );
      })
      .join("");
    return (
      '<div class="pt" data-tiers="' + product.slug + '">' +
      '  <span class="pt__label">Quantity Pricing</span>' +
      '  <div class="pt__rows">' + rows + "</div>" +
      "</div>"
    );
  }

  function summaryHTML(product, res, qty, detail) {
    if (res.belowMOQ) {
      return (
        '<p class="pcard__moqwarn">Minimum order for this item is ' +
        P.formatQty(res.moq) + " " + esc(product.unitLabel) + ".</p>"
      );
    }
    var totalText =
      typeof res.total === "number"
        ? P.formatTotal(res.total)
        : detail
          ? "Estimate pending final pricing review"
          : "Estimate pending";
    return (
      '<p class="pcard__total"><span>Estimated total</span><strong>' +
      totalText +
      "</strong></p>"
    );
  }

  function cardHTML(product) {
    var moq = product.tiers[0].qty;
    var res = P.resolve(product, moq);
    var cat = catBySlug(product.category);
    return (
      '<article class="pcard" data-product="' + product.slug + '">' +
      '  <a class="pcard__media-link" href="' + U("#/products/" + product.category + "/" + product.slug) + '" aria-label="View details for ' + esc(product.name) + '">' +
      phHTML(product.tint, product.imageLabel, "pcard__media", product.image) +
      "  </a>" +
      '  <div class="pcard__body">' +
      '    <span class="pcard__cat">' + esc(cat ? cat.name : product.category) + " \u2014 " + esc(product.type || "") + "</span>" +
      "    <h3>" + esc(product.name) + "</h3>" +
      '    <p class="pcard__desc">' + esc(product.description) + "</p>" +
      '    <dl class="pcard__meta">' +
      "      <div><dt>MOQ</dt><dd>" + P.formatQty(moq) + " " + esc(product.unitLabel) + "</dd></div>" +
      "      <div><dt>Customization</dt><dd>" + esc(product.customization.join(", ")) + "</dd></div>" +
      "    </dl>" +
      '    <p class="pcard__pricing-note">Quantity pricing shown on the product page.</p>' +
      '    <div class="pcard__ctas pcard__ctas--single">' +
      '      <a class="tlink" href="' + U("#/products/" + product.category + "/" + product.slug) + '">View Details</a>' +
      "    </div>" +
      "  </div>" +
      "</article>"
    );
  }

  // Guide + glossary pointer (internal-link mesh: category → guide → glossary)
  function guideLinkHTML(cat) {
    if (!cat || !cat.guide) return "";
    return (
      '<aside class="guide-link">' +
      '  <span class="eyebrow">Buying guide</span>' +
      '  <p><a href="' + U("#/guides/" + cat.guide) + '">' + esc(cat.guideTitle || "Read the buying guide") + "</a></p>" +
      '  <small>Materials, minimums, logo methods, and timelines, plus the <a href="' + U("#/glossary") + '">customization glossary</a>.</small>' +
      (colsForCat(cat.slug).length
        ? '  <small class="guide-link__collections">Curated in: ' + colLinksHTML(colsForCat(cat.slug)) + ".</small>"
        : "") +
      "</aside>"
    );
  }

  // FAQ block (real buyer questions; the build emits matching FAQPage schema)
  function faqHTML(faqs, heading) {
    if (!faqs || !faqs.length) return "";
    return (
      '<section class="faq" aria-labelledby="faqTitle">' +
      '  <div class="section-head"><span class="eyebrow">Questions</span><h2 id="faqTitle">' + esc(heading || "Frequently asked questions") + "</h2></div>" +
      '  <div class="faq__list">' +
      faqs.map(function (f) {
        return '<article class="faq__item"><h3 class="faq__q">' + esc(f.q) + '</h3><p class="faq__a">' + esc(f.a) + "</p></article>";
      }).join("") +
      "  </div>" +
      "</section>"
    );
  }

  function categoryCardHTML(cat) {
    return (
      '<a class="ccard" href="' + U("#/products/" + cat.slug) + '">' +
      phHTML(cat.tint, cat.imageLabel, "ccard__media", cat.image, true) +
      '  <div class="ccard__body">' +
      "    <h3>" + esc(cat.name) + "</h3>" +
      "    <p>" + esc(cat.line) + "</p>" +
      '    <span class="tlink">View Category</span>' +
      "  </div>" +
      "</a>"
    );
  }

  /* ---------------- interactions (event delegation) ---------------- */

  function scopeFor(el) {
    return (el && el.closest && el.closest("[data-product], #productDetail")) || document;
  }

  function updateProductUI(slug, scope) {
    var product = prodBySlug(slug);
    if (!product) return;
    scope = scope || document;
    var input = scope.querySelector('[data-qty-for="' + slug + '"]');
    var qty = input ? Math.floor(Number(input.value) || 0) : 0;
    var res = P.resolve(product, qty);

    // tiers
    var tiers = scope.querySelectorAll('[data-tier-for="' + slug + '"]');
    tiers.forEach(function (el, i) {
      var active = i === res.tierIndex;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-pressed", active ? "true" : "false");
      var mark = el.querySelector(".pt-tier__mark");
      if (active && !mark) {
        mark = document.createElement("span");
        mark.className = "pt-tier__mark";
        mark.textContent = "Active tier";
        el.appendChild(mark);
      } else if (!active && mark) {
        mark.remove();
      }
    });

    // summary
    var summary = scope.querySelector('[data-summary="' + slug + '"]');
    if (summary) summary.innerHTML = summaryHTML(product, res, qty, summary.hasAttribute("data-detail"));
  }

  function bindGlobalHandlers() {
    if (bindGlobalHandlers.done) return;
    bindGlobalHandlers.done = true;

    document.addEventListener("input", function (e) {
      var t = e.target;
      if (t && t.hasAttribute && t.hasAttribute("data-qty-for")) {
        updateProductUI(t.getAttribute("data-qty-for"), scopeFor(t));
      }
    });

    document.addEventListener("click", function (e) {
      var tierBtn = e.target.closest ? e.target.closest("[data-tier-qty]") : null;
      if (tierBtn) {
        var slug = tierBtn.getAttribute("data-tier-for");
        var tierScope = scopeFor(tierBtn);
        var input = tierScope.querySelector('[data-qty-for="' + slug + '"]');
        if (input) {
          input.value = tierBtn.getAttribute("data-tier-qty");
          updateProductUI(slug, tierScope);
        }
        return;
      }

      var addBtn = e.target.closest ? e.target.closest("[data-add]") : null;
      if (addBtn) {
        var pslug = addBtn.getAttribute("data-add");
        var product = prodBySlug(pslug);
        var qinput = scopeFor(addBtn).querySelector('[data-qty-for="' + pslug + '"]');
        var qty = qinput ? Math.floor(Number(qinput.value) || 0) : 0;
        var res = P.resolve(product, qty);
        if (res.belowMOQ) {
          toast("Minimum order for this item is " + P.formatQty(res.moq) + " " + product.unitLabel + ".");
          return;
        }
        var noteEl = scopeFor(addBtn).querySelector('textarea[id^="notes-"]');
        Q.add(pslug, qty, noteEl ? noteEl.value : "");
        refreshCount();
        toast("Added to quote selections.", true);
        return;
      }

      var noteBtn = e.target.closest ? e.target.closest(".js-quote-note") : null;
      if (noteBtn) {
        e.preventDefault();
        navigate("#/quote");
        return;
      }

      var mockBtn = e.target.closest ? e.target.closest(".js-mockup-note") : null;
      if (mockBtn) {
        e.preventDefault();
        toast("Mockup request noted. The concierge will confirm details at quote review.");
        return;
      }

      // ---- self-contained catalog navigation ----
      // Handle any link that targets a catalog route, without depending on
      // location.hash being writable (sandboxed iframes may reject it).
      if (e.defaultPrevented) return; // an outer shell already handled it
      if (STATIC) return; // static site: every link is a real page load
      var nav = e.target.closest ? e.target.closest("a[href]") : null;
      if (!nav) return;
      var href = nav.getAttribute("href") || "";
      var hi = href.indexOf("#/");
      if (hi === -1) return;
      var routeStr = href.slice(hi);
      var first = routeStr.slice(2).split(/[\/?#]/)[0];
      if (routeStr.indexOf("#/products") !== 0 && routeStr.indexOf("#/quote") !== 0 &&
          routeStr.indexOf("#/bespoke") !== 0 && first !== "guides" && first !== "glossary" && first !== "for" && first !== "for" &&
          !(window.HL_PAGES && window.HL_PAGES[first])) return;
      if (!document.getElementById("catalogViews")) return;
      e.preventDefault();
      navigate(routeStr);
    });
  }

  /* ---------------- page renderers ---------------- */

  function renderLanding() {
    var grid = document.getElementById("catalogCategories");
    if (grid) grid.innerHTML = CATS.map(categoryCardHTML).join("");

  }

  function notFoundHTML(kind) {
    return (
      '<div class="wrap pd nf">' +
      '<nav class="pd__crumbs" aria-label="Breadcrumb"><a href="' + U("#/products") + '">Products</a></nav>' +
      '<h1 class="nf__title">' + kind + " not found</h1>" +
      '<p class="nf__copy">The page you were looking for isn\u2019t in the atelier catalog. It may have moved.</p>' +
      '<div class="btn-row"><a class="btn btn--solid" href="' + U("#/products") + '">Back to Catalog</a></div>' +
      "</div>"
    );
  }

  function renderCategory(slug) {
    var cat = catBySlug(slug);
    if (!cat) {
      var heroM = document.getElementById("categoryHero");
      var gridM = document.getElementById("categoryGrid");
      var introM = document.getElementById("categoryIntro");
      if (introM) introM.textContent = "";
      var headM = document.getElementById("categoryHeading");
      if (headM) headM.textContent = "";
      if (gridM) gridM.innerHTML = "";
      var ansM = document.getElementById("categoryAnswer");
      var faqM = document.getElementById("categoryFaq");
      var guideM = document.getElementById("categoryGuide");
      if (ansM) ansM.textContent = "";
      if (faqM) faqM.innerHTML = "";
      if (guideM) guideM.innerHTML = "";
      if (heroM) heroM.innerHTML = notFoundHTML("Category");
      document.title = "Category not found \u2014 HL Supply";
      return;
    }

    if (!STATIC) document.title = cat.name + " \u2014 HL Supply";

    var hero = document.getElementById("categoryHero");
    if (hero) {
      hero.innerHTML =
        '<div class="page-hero__media">' + phHTML(cat.tint, cat.imageLabel, "page-hero__ph", cat.image, true) + "</div>" +
        '<div class="page-hero__copy">' +
        '  <span class="eyebrow">The Atelier Catalog</span>' +
        "  <h1>" + esc(cat.name) + "</h1>" +
        (cat.tagline ? '<p class="page-hero__tagline">' + esc(cat.tagline) + "</p>" : "") +
        "  <p>" + esc(cat.catalogSubtitle || cat.line) + "</p>" +
        '  <a class="btn btn--solid" href="#categoryGrid">Explore ' + esc(cat.name) + "</a>" +
        "</div>";
    }

    var intro = document.getElementById("categoryIntro");
    if (intro) intro.textContent = cat.catalogIntro || "";
    var heading = document.getElementById("categoryHeading");
    if (heading) heading.textContent = cat.collectionTitle || ("Custom " + cat.name.toLowerCase() + " for hotels, resorts, and clubs");
    var answer = document.getElementById("categoryAnswer");
    if (answer) answer.textContent = cat.directAnswer || "";
    var faq = document.getElementById("categoryFaq");
    if (faq) faq.innerHTML = faqHTML(cat.faqs, "Questions about custom " + cat.name.toLowerCase());
    var guideEl = document.getElementById("categoryGuide");
    if (guideEl) guideEl.innerHTML = guideLinkHTML(cat);

    var BESPOKE_CTA = {
      "bags": ["Need a custom size, handle, pocket, or material?", "Start from one of our bag styles or send us your desired canvas, straps, dimensions, logo placement, and quantity.", "Start Bespoke Bag Project"],
      "hats": ["Need a specific fabric, closure, brim, or color?", "Start from one of our hat styles or send us your desired fabric, closure, color, logo placement, and quantity.", "Start Bespoke Hat Project"],
      "bottles": ["Need a specific finish, size, handle, or color?", "Start from one of our bottle styles or send us your desired finish, capacity, etching, and quantity.", "Start Bespoke Bottle Project"],
      "flip-flops": ["Need custom artwork, strap design, outsole mold, or color?", "Start from one of our flip-flop styles or send us your artwork, strap direction, and quantity.", "Start Bespoke Flip-flop Project"],
      "leather-goods": ["Need a suite-specific size, leather color, debossing, or packaging detail?", "Start from one of our leather pieces or send us your dimensions, deboss artwork, and quantity.", "Start Bespoke Leather Project"],
      "slippers": ["Need a specific texture, color, fabric, or suite standard?", "Start from one of our slipper styles or send us your texture, embroidery, and quantity.", "Start Bespoke Slipper Project"],
      "accessories": ["Need a custom guest accessory or coordinated retail detail?", "Send us the guest moment, artwork direction, and quantity and we\u2019ll shape the right accessory.", "Start Bespoke Accessories Project"],
      "pets": ["Need a pet piece we don\u2019t make yet, or a program-specific finish?", "Start from one of the six pet pieces or send us the program moment, materials, logo treatment, and quantity.", "Start Bespoke Pet Project"]
    };

    var grid = document.getElementById("categoryGrid");
    if (grid) {
      var bc = BESPOKE_CTA[cat.slug];
      grid.innerHTML = prodsInCat(cat.slug).map(cardHTML).join("") +
        (bc
          ? '<div class="cat-bespoke" style="grid-column: 1 / -1;">' +
            "<div><h3>" + bc[0] + "</h3><p>" + bc[1] + "</p></div>" +
            '<a class="btn btn--solid" href="' + U("#/bespoke?category=" + cat.slug) + '">' + bc[2] + "</a>" +
            "</div>"
          : "");
    }

    // mark active nav crumb
    var crumb = document.getElementById("categoryCrumb");
    if (crumb) crumb.textContent = cat.name;
  }

  function relatedHTML(product) {
    var pool = prodsInCat(product.category).filter(function (p) { return p.slug !== product.slug; });
    // rotate so different products show different neighbours
    var idx = prodsInCat(product.category).indexOf(product);
    var picks = [];
    for (var i = 0; i < pool.length && picks.length < 3; i++) {
      picks.push(pool[(idx + i) % pool.length]);
    }
    if (!picks.length) return "";
    var cat = catBySlug(product.category);
    var cards = picks
      .map(function (p) {
        return (
          '<a class="rel-card" href="' + U("#/products/" + p.category + "/" + p.slug) + '">' +
          phHTML(p.tint, p.imageLabel, "rel-card__media", p.image) +
          '  <div class="rel-card__body"><h3>' + esc(p.name) + '</h3><span class="tlink">View Details</span></div>' +
          "</a>"
        );
      })
      .join("");
    return (
      '<section class="pd__related" aria-label="Related products">' +
      '  <h2>More from ' + esc(cat ? cat.name : product.category) + "</h2>" +
      '  <div class="rel-grid">' + cards + "</div>" +
      "</section>"
    );
  }

  function renderProduct(slug) {
    var product = prodBySlug(slug);
    var mountNF = document.getElementById("productDetail");
    if (!product) {
      if (mountNF) mountNF.innerHTML = notFoundHTML("Product");
      document.title = "Product not found \u2014 HL Supply";
      return;
    }
    var cat = catBySlug(product.category);
    var moq = product.tiers[0].qty;
    var res = P.resolve(product, moq);

    if (!STATIC) document.title = product.name + " \u2014 HL Supply";

    var mount = document.getElementById("productDetail");
    if (!mount) return;

    var gallery =
      (product.image
        ? '<div class="pd__thumb ph ph--photo is-active">' +
          '  <div class="ph__art ' + product.tint + '"></div>' +
          '  <img class="ph__img" src="' + product.image + '" alt="' + esc(product.name) + ' \u2014 catalog photo" loading="lazy" />' +
          "</div>"
        : "") +
      (product.gallery || [])
        .slice(0, product.image ? 2 : 3)
        .map(function (label) {
          return (
            '<div class="pd__thumb ph">' +
            '  <div class="ph__art ' + product.tint + '"></div>' +
            '  <span class="ph__cap">' + esc(label) + "</span>" +
            "</div>"
          );
        })
        .join("");

    var specs = (product.specifications || [])
      .map(function (s) {
        return "<div><dt>" + esc(s.label) + "</dt><dd>" + esc(s.value) + "</dd></div>";
      })
      .join("");

    mount.innerHTML =
      '<nav class="pd__crumbs" aria-label="Breadcrumb">' +
      '  <a href="' + U("#/products") + '">Products</a><span aria-hidden="true">/</span>' +
      '  <a href="' + U("#/products/" + product.category) + '">' + esc(cat ? cat.name : "") + "</a>" +
      '<span aria-hidden="true">/</span><span aria-current="page">' + esc(product.name) + "</span>" +
      "</nav>" +
      '<div class="pd__grid">' +
      '  <div class="pd__media">' +
      phHTML(product.tint, product.imageLabel, "pd__ph", product.image) +
      '    <div class="pd__thumbs" aria-label="Product image gallery placeholders">' + gallery + "</div>" +
      "  </div>" +
      '  <div class="pd__info">' +
      '    <span class="pcard__cat">' + esc(cat ? cat.name : "") + " \u2014 " + esc(product.type || "") + "</span>" +
      "    <h1>" + esc(product.name) + "</h1>" +
      '    <p class="pd__desc">' + esc(product.description) + "</p>" +
      '    <dl class="pcard__meta pd__meta">' +
      "      <div><dt>MOQ</dt><dd>" + P.formatQty(moq) + " " + esc(product.unitLabel) + "</dd></div>" +
      "      <div><dt>Customization</dt><dd>" + esc(product.customization.join(", ")) + "</dd></div>" +
      "    </dl>" +
      tiersHTML(product, res.tierIndex) +
      '    <p class="pd__pricenote">Final pricing is confirmed after artwork, customization, and production review.</p>' +
      '    <div class="pcard__qtyrow">' +
      '      <label for="qty-' + product.slug + '">Quantity (' + esc(product.unitLabel) + ")</label>" +
      '      <input id="qty-' + product.slug + '" class="pcard__qty" type="number" inputmode="numeric"' +
      '        min="0" step="1" value="' + moq + '" data-qty-for="' + product.slug + '" />' +
      "    </div>" +
      '    <div class="pcard__summary" data-summary="' + product.slug + '" data-detail="1">' + summaryHTML(product, res, moq, true) + "</div>" +
      '    <div class="pd__specs">' +
      '      <h2>Product Specifications</h2>' +
      '      <dl>' + specs + "</dl>" +
      "    </div>" +
      '    <div class="pd__notes">' +
      '      <label for="notes-' + product.slug + '">Product notes</label>' +
      '      <textarea id="notes-' + product.slug + '" rows="3" placeholder="Colors, packaging, event date, or anything the atelier should know."></textarea>' +
      "    </div>" +
      '    <div class="pd__ctas">' +
      '      <button type="button" class="btn btn--solid" data-add="' + product.slug + '">Add to Quote</button>' +
      '      <button type="button" class="btn" data-bespoke="' + product.slug + '">Make It Bespoke</button>' +
      '      <button type="button" class="btn" data-mockup="' + product.slug + '">Request Mockup</button>' +
      "    </div>" +
      '    <p class="pd__logonote">Logo upload happens at quote submission.</p>' +
      (cat && cat.guide
        ? '    <p class="pd__guide">Planning a program? Read <a href="' + U("#/guides/" + cat.guide) + '">' + esc(cat.guideTitle || "the buying guide") + "</a>.</p>"
        : "") +
      (product.collections && product.collections.length
        ? '    <p class="pd__collections">Featured in: ' + colLinksHTML(product.collections.map(colBySlug).filter(Boolean)) + ".</p>"
        : "") +
      "  </div>" +
      "</div>" +
      relatedHTML(product);
  }

  /* ---------------- collections (cross-category curation) ---------------- */

  function crumbsHTML(items) {
    return '<nav class="pd__crumbs" aria-label="Breadcrumb">' +
      items.map(function (it, i) {
        return i < items.length - 1
          ? '<a href="' + it.href + '">' + esc(it.name) + '</a><span aria-hidden="true">/</span>'
          : '<span aria-current="page">' + esc(it.name) + "</span>";
      }).join("") +
      "</nav>";
  }

  function collectionCardHTML(col) {
    return (
      '<a class="gcard gcard--collection" href="' + U("#/collections/" + col.slug) + '">' +
      '<span class="eyebrow">Collection</span>' +
      "<h3>" + esc(col.title) + "</h3>" +
      "<p>" + esc(col.line) + "</p>" +
      '<span class="tlink">Explore the collection</span></a>'
    );
  }

  function renderCollectionsIndex(mount) {
    if (!STATIC) document.title = "Collections \u2014 HL Supply";
    mount.setAttribute("data-page", "collections");
    mount.innerHTML =
      crumbsHTML([{ name: "Home", href: HOME() }, { name: "Collections" }]) +
      '<header class="page-intro"><span class="eyebrow">HL Supply / Collections</span><h1>Collections built around the way guests move through a property</h1>' +
      '<p class="page-intro__lede">Five curated sets drawn from across the catalog: poolside, beach club, spa suite, golf and club, and sports and wellness. Each lists the catalog pieces that belong to one guest moment, in one colorway, with a bespoke path for what the catalog does not yet hold.</p></header>' +
      '<div class="gcards gcards--index">' + COLS.map(collectionCardHTML).join("") + "</div>" +
      '<section class="page-section page-section--tint"><h2>Browse by category instead</h2><p>Every piece in a collection lives in one of the eight product categories, where pricing tiers, specifications, and the buying guide sit beside it.</p>' +
      '<p><a class="tlink" href="' + U("#/products") + '">Open the catalog</a></p></section>';
  }

  function renderCollection(slug, mount) {
    var col = colBySlug(slug);
    if (!col) {
      mount.innerHTML = notFoundHTML("Collection");
      document.title = "Collection not found \u2014 HL Supply";
      return;
    }
    if (!STATIC) document.title = col.title + " \u2014 HL Supply";
    var prods = col.products.map(prodBySlug).filter(Boolean);
    var cats = [];
    prods.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    var others = COLS.filter(function (c) { return c.slug !== col.slug; });
    mount.setAttribute("data-page", "collection");
    mount.innerHTML =
      crumbsHTML([{ name: "Home", href: HOME() }, { name: "Collections", href: U("#/collections") }, { name: col.name }]) +
      '<header class="page-intro collection-intro"><span class="eyebrow">Collection</span>' +
      "<h1>" + esc(col.title) + "</h1>" +
      '<p class="page-intro__lede">' + esc(col.intro) + "</p></header>" +
      '<p class="category-answer">' + esc(col.directAnswer) + "</p>" +
      '<p class="collection-framing">' + esc(col.framing) + "</p>" +
      '<section class="guide-products collection-products" aria-labelledby="colProductsTitle">' +
      '<div class="section-head"><span class="eyebrow">The pieces</span><h2 id="colProductsTitle">' + prods.length + " catalog pieces, one colorway</h2></div>" +
      '<div class="pgrid">' + prods.map(cardHTML).join("") + "</div>" +
      "</section>" +
      '<div class="cat-bespoke collection-hook"><div><h3>' + esc(col.hook.title) + "</h3><p>" + esc(col.hook.copy) + "</p></div>" +
      '<a class="btn btn--solid" href="' + U("#/bespoke?collection=" + col.slug) + '">' + esc(col.hook.cta) + "</a></div>" +
      '<section class="page-section"><div class="section-head"><span class="eyebrow">Categories</span><h2>Where these pieces live</h2></div>' +
      "<p>" + cats.map(function (slug) { var c = catBySlug(slug); return '<a href="' + U("#/products/" + slug) + '">' + esc(c ? c.name : slug) + "</a>"; }).join(", ") +
      ". Each category page carries quantity tiers, specifications, and a buying guide.</p></section>" +
      '<p class="page-note">Other collections: ' + colLinksHTML(others) + ".</p>" +
      '<div class="btn-row"><a class="btn btn--solid" href="' + U("#/quote") + '">Build a Quote</a><a class="btn" href="' + U("#/collections") + '">All collections</a></div>';
  }

  /* ---------------- hash router ---------------- */
  // Routes (work on products.html and in single-file previews):
  //   #/products                      -> catalog landing
  //   #/products/:category            -> category page
  //   #/products/:category/:product   -> product detail

  function showView(name) {
    ["viewLanding", "viewCategory", "viewProduct", "viewQuote", "viewBespoke", "viewPage"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = id !== name;
    });
    // clear stale dynamic content so slugs never exist twice in the DOM
    if (name !== "viewCategory") {
      var g = document.getElementById("categoryGrid");
      if (g) g.innerHTML = "";
    }
    if (name !== "viewProduct") {
      var d = document.getElementById("productDetail");
      if (d) d.innerHTML = "";
    }
    if (name !== "viewPage") {
      var pm = document.getElementById("pageMount");
      if (pm) { pm.innerHTML = ""; pm.removeAttribute("data-page"); }
    }
  }

  function navigate(routeStr) {
    if (STATIC) {
      try { R.go(U(routeStr)); return; } catch (err) { /* fall through */ }
    }
    if (window.HL_ON_NAVIGATE) window.HL_ON_NAVIGATE(routeStr); // preview hook
    route(routeStr);
    try {
      if (window.location.hash !== routeStr) window.location.hash = routeStr;
    } catch (err) { /* hash immutable (srcdoc iframe) — routing already done */ }
  }

  function route(forcedHash) {
    if (!document.getElementById("catalogViews")) return;

    var hash = (typeof forcedHash === "string" ? forcedHash : (R ? R.current() : window.location.hash)) || "";
    if (hash && hash.indexOf("#/") !== 0) return; // plain #anchor — native scroll
    if (!hash) hash = "#/products";

    // split off ?query (e.g. #/bespoke?category=hats)
    var query = {};
    var qpos = hash.indexOf("?");
    if (qpos > -1) {
      hash.slice(qpos + 1).split("&").forEach(function (kv) {
        if (!kv) return;
        var p = kv.split("=");
        query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
      });
      hash = hash.slice(0, qpos);
    }

    var seg = hash.slice(2).split("/").filter(Boolean); // ["products", cat?, slug?]

    if (seg[0] === "bespoke") {
      showView("viewBespoke");
      if (!STATIC) document.title = "Bespoke Atelier \u2014 HL Supply";
      if (window.HLBespokePage) window.HLBespokePage.render(query);
      scrollTop();
      return;
    }

    if (seg[0] === "collections") {
      showView("viewPage");
      if (!prerendered("viewPage")) {
        var cm = document.getElementById("pageMount");
        if (cm) { if (seg.length >= 2) renderCollection(seg[1], cm); else renderCollectionsIndex(cm); }
      }
      scrollTop();
      return;
    }

    if (seg[0] === "collections") {
      showView("viewPage");
      if (!prerendered("viewPage")) {
        var cm = document.getElementById("pageMount");
        if (cm) { if (seg.length >= 2) renderCollection(seg[1], cm); else renderCollectionsIndex(cm); }
      }
      scrollTop();
      return;
    }

    if (window.HL_PAGES && (seg[0] === "guides" || seg[0] === "glossary" || seg[0] === "for")) {
      showView("viewPage");
      window.HL_PAGES.__renderContent(seg, document.getElementById("pageMount"));
      scrollTop();
      return;
    }

    if (window.HL_PAGES && window.HL_PAGES[seg[0]] && seg.length === 1) {
      showView("viewPage");
      if (!STATIC) document.title = window.HL_PAGES[seg[0]].title;
      window.HL_PAGES.__render(seg[0], document.getElementById("pageMount"));
      scrollTop();
      return;
    }

    if (seg[0] === "quote") {
      showView("viewQuote");
      if (!STATIC) document.title = "Quote Cart \u2014 HL Supply";
      if (window.HLQuotePage) window.HLQuotePage.render();
      scrollTop();
      return;
    }

    if (seg[0] !== "products") seg = ["products"];

    // Pre-rendered views (static build) already contain their markup:
    // hydrate interactivity only, never re-render what is in the source.
    if (seg.length >= 3) {
      showView("viewProduct");
      if (!prerendered("viewProduct")) renderProduct(seg[2]);
    } else if (seg.length >= 2) {
      showView("viewCategory");
      if (!prerendered("viewCategory")) renderCategory(seg[1]);
    } else {
      showView("viewLanding");
      if (!STATIC) document.title = "The Atelier Catalog \u2014 HL Supply";
      if (!prerendered("viewLanding")) renderLanding();
    }
    scrollTop();
  }

  function prerendered(viewId) {
    var v = document.getElementById(viewId);
    return !!(v && v.hasAttribute("data-prerendered"));
  }

  function scrollTop() {
    if (STATIC) return; // real page loads: let the browser honour anchors
    window.scrollTo(0, 0);
  }

  /* ---------------- init ---------------- */

  function init() {
    bindGlobalHandlers();
    refreshCount();

    if (document.getElementById("catalogViews")) {
      window.addEventListener("hashchange", function () { route(); });
      route();
    }
  }

  window.HLCatalog = {
    init: init,
    route: route,
    navigate: navigate,
    renderLanding: renderLanding,
    renderCategory: renderCategory,
    renderProduct: renderProduct,
    renderCollection: renderCollection,
    renderCollectionsIndex: renderCollectionsIndex,
    notFoundHTML: notFoundHTML,
    faqHTML: faqHTML,
    cardHTML: cardHTML,
    guideLinkHTML: guideLinkHTML,
    isStatic: STATIC,
    refreshCount: refreshCount,
    toast: toast
  };

  init();
})();
