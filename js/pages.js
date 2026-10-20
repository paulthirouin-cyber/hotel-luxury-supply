// HL Supply — Phase 3: trust & entity pages.
// /about/, /process/, /contact/, /privacy/, /terms/ — content lives here
// (brand voice from docs/BRAND-BRIEF.md), rendered by the catalog router in
// SPA mode and pre-rendered by build.js in static mode. Each page declares
// its own SEO meta so the build and sitemap stay generic.

window.HL_PAGES = (function () {
  "use strict";

  var R = window.HLRoutes;
  function U(route) { return R ? R.href(route) : "products.html" + route; }
  function HOME(anchor) { return R ? R.home(anchor) : "index.html" + (anchor ? "#" + anchor : ""); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CONTACT = {
    email: "info@hotelluxurysupply.com",
    phone: "+1 (347) 669-4417",
    phoneHref: "+13476694417",
    domain: "hotelluxurysupply.com"
  };

  function crumbs(name) {
    return (
      '<nav class="pd__crumbs" aria-label="Breadcrumb">' +
      '<a href="' + HOME() + '">Home</a><span aria-hidden="true">/</span>' +
      '<span aria-current="page">' + esc(name) + "</span></nav>"
    );
  }

  function hero(eyebrow, title, lede) {
    return (
      '<header class="page-intro">' +
      '  <span class="eyebrow">' + esc(eyebrow) + "</span>" +
      "  <h1>" + esc(title) + "</h1>" +
      (lede ? '  <p class="page-intro__lede">' + esc(lede) + "</p>" : "") +
      "</header>"
    );
  }

  function conciergeCTA(title, copy) {
    return (
      '<section class="page-cta">' +
      "  <h2>" + esc(title) + "</h2>" +
      "  <p>" + esc(copy) + "</p>" +
      '  <div class="btn-row">' +
      '    <a class="btn btn--solid" href="' + U("#/contact") + '">Speak with the Concierge</a>' +
      '    <a class="btn" href="' + U("#/products") + '">Explore Products</a>' +
      "  </div>" +
      "</section>"
    );
  }

  /* ================= ABOUT ================= */

  function aboutHTML() {
    return (
      crumbs("About") +
      hero("HL Supply / The Atelier", "Bespoke product design and development for luxury hospitality.",
        "HL Supply partners with five-star resorts, luxury hotel groups, and independent boutique properties to create guest goods that feel inherently connected to the place they come from.") +
      '<div class="page-body">' +
      "<section class=\"page-section\">" +
      "<h2>Who we are</h2>" +
      "<p>HL Supply is a bespoke product design, development, and supply company specializing in luxury hospitality. We work at the intersection of product design, luxury hospitality, and custom manufacturing, helping properties translate their identities into beautiful, functional, and distinctive physical products: resort totes, headwear, bottles, footwear, slippers, leather goods, in-room accessories, and the guest extras that complete a stay.</p>" +
      "<p>Our clientele is primarily five-star resorts, internationally recognized luxury hotel groups, independent luxury hotels, and boutique properties where presentation, individuality, and attention to detail are fundamental to the guest experience.</p>" +
      "</section>" +
      "<section class=\"page-section\">" +
      "<h2>Our philosophy</h2>" +
      "<p>Every exceptional hotel has its own identity, and the products associated with that property should reflect it. Luxury is defined not only by architecture, interiors, and service, but by the smaller details guests interact with throughout their stay. A beach tote, a cap worn on the course, the bottle waiting in the suite, the slippers remembered after checkout: these objects become part of the property’s experience.</p>" +
      '<blockquote class="page-quote"><p>We don’t simply put hotel names on products. We help hotels create products worthy of carrying their names.</p></blockquote>' +
      "<p>Sometimes that means a bold, recognizable signature piece. Other times it means understated colors, refined materials, subtle branding, and thoughtful construction. The objective is always the same: something that feels authentic to the property.</p>" +
      "</section>" +
      "<section class=\"page-section\">" +
      "<h2>The catalog is a starting point, not a limit</h2>" +
      "<p>Unlike merchandise suppliers that offer standardized products with added logos, HL Supply has a full design team able to substantially modify existing products or develop entirely original creations. A property may find a bag it likes in the collection and envision something different: new dimensions, shape, materials, construction, handles, interior details, or colors. We explore those changes together and develop the product around the property’s vision.</p>" +
      "<p>If a property has an original concept, a sketch, a reference image, or simply an idea, our team can collaborate to bring it to life from the ground up. Every concept is evaluated with materials, production feasibility, quantities, and commercial requirements in mind.</p>" +
      '<p><a class="tlink" href="' + U("#/bespoke") + '">Visit the Bespoke Atelier</a></p>' +
      "</section>" +
      "<section class=\"page-section\">" +
      "<h2>Our approach to luxury</h2>" +
      "<p>Luxury is not a single aesthetic. A historic European estate, a contemporary urban hotel, a secluded tropical resort, and an intimate mountain retreat each interpret it differently, so we do not impose one design style across every client. Our role is to understand the property’s existing identity and work within that creative direction, whether it calls for traditional craftsmanship and natural materials or contemporary silhouettes, minimal branding, and architectural simplicity.</p>" +
      "<p>True sophistication often comes from restraint. A product does not need an oversized logo to feel unmistakably associated with a property: materials, proportions, colors, function, and the smallest details can express its identity together.</p>" +
      "</section>" +
      "<section class=\"page-section\">" +
      "<h2>What we bring to a property</h2>" +
      '<div class="page-cols">' +
      "<article><h3>Express identity</h3><p>Products consistent with the property’s aesthetic, personality, and brand standards.</p></article>" +
      "<article><h3>Enhance the guest experience</h3><p>Thoughtful, useful, beautifully considered items in the moments and environments guests encounter.</p></article>" +
      "<article><h3>Develop distinctive merchandise</h3><p>Retail collections and signature accessories guests find appealing, functional, and meaningful as reminders of their stay.</p></article>" +
      "</div>" +
      "<p>These objectives must also work commercially and operationally. Beautiful design matters, but so do specifications, quality expectations, purchasing requirements, and practical usability. Our intention is to bring creative ambition and commercial practicality together.</p>" +
      "</section>" +
      "<section class=\"page-section\">" +
      "<h2>How we work</h2>" +
      "<p>We want to understand not just which product a hotel is interested in, but why it matters, how it will be used, who will interact with it, and what it should communicate about the property. A boutique director seeking a collection guests genuinely want to own, a director of rooms matching accessories to a renovated suite, a spa director coordinating a wellness set, an owner with an idea that does not yet exist: each begins the same way. Understand the vision first, then explore the product that best brings it to life.</p>" +
      '<p><a class="tlink" href="' + U("#/process") + '">See the process, step by step</a></p>' +
      "</section>" +
      "</div>" +
      conciergeCTA("Ready to explore an idea?", "Tell us about the property, the guest moment, and the product you have in mind. We’ll help shape the right direction.")
    );
  }

  /* ================= PROCESS ================= */

  var STEPS = [
    ["I", "Select", "Choose a direction",
      "Start from a catalog category, a specific product, or a guest moment you want to design for. Share the property, the audience, the setting (suite, spa, pool deck, course, boutique), and a target quantity.",
      "Your part: a brief, a logo or brand guide, and the quantity range. Ours: product recommendations and the questions that shape the piece.",
      "Day one"],
    ["II", "Customize", "Shape the piece",
      "Colors are matched to your palette, the logo method is chosen (embroidery, deboss, or laser etching), and dimensions, materials, trims, hardware, and packaging are refined. The atelier prepares mockups and a proof for approval.",
      "Your part: artwork files and feedback on the proof. Ours: mockups, material and color guidance, and a quote built on four quantity tiers.",
      "Proof and quote"],
    ["III", "Produce", "Make it, properly",
      "Once the proof is approved, production begins. Each piece is customized in-house to the approved specification and inspected before packing.",
      "Your part: proof approval. Ours: production, quality review, and updates from the concierge.",
      "4–6 weeks after proof approval"],
    ["IV", "Deliver", "Arrive at the property",
      "Goods are packed individually, with custom gift packaging where specified, and shipped to the destination named in your quote. Staged deliveries can be planned for large amenity programs.",
      "Your part: the delivery address and any receiving requirements. Ours: logistics coordination and confirmation.",
      "Transit quoted to your destination"]
  ];

  function processHTML() {
    var steps = STEPS.map(function (s) {
      return (
        '<article class="pstep">' +
        '  <div class="pstep__num" aria-hidden="true">' + s[0] + "</div>" +
        '  <div class="pstep__body">' +
        '    <span class="eyebrow">' + esc(s[1]) + "</span>" +
        "    <h2>" + esc(s[2]) + "</h2>" +
        "    <p>" + esc(s[3]) + "</p>" +
        '    <p class="pstep__roles">' + esc(s[4]) + "</p>" +
        '    <p class="pstep__time"><span>Timeline</span> ' + esc(s[5]) + "</p>" +
        "  </div>" +
        "</article>"
      );
    }).join("");
    return (
      crumbs("Process") +
      hero("HL Supply / The Process", "From idea to property-ready goods.",
        "Four steps, one concierge. Custom hospitality products are selected, customized, produced, and delivered on a timeline you can plan an opening or a season around.") +
      '<p class="category-answer">HL Supply’s process runs Select, Customize, Produce, Deliver. Production takes 4–6 weeks after proof approval; before that, artwork, mockups, and a quote on four quantity tiers are prepared with the concierge. Minimums start at 100 units for hats and leather goods, 200 for bags, bottles, and flip-flops, and 1,000 pairs for slippers.</p>' +
      '<div class="psteps">' + steps + "</div>" +
      '<section class="page-section page-section--tint">' +
      "<h2>Planning your timeline</h2>" +
      '<table class="ptable">' +
      "<thead><tr><th scope=\"col\">Milestone</th><th scope=\"col\">What happens</th><th scope=\"col\">Typical timing</th></tr></thead>" +
      "<tbody>" +
      "<tr><th scope=\"row\">Brief</th><td>Direction, quantity, and artwork shared with the concierge</td><td>Day one</td></tr>" +
      "<tr><th scope=\"row\">Mockup and proof</th><td>Logo placement, colors, materials, and packaging confirmed</td><td>Confirmed with your quote</td></tr>" +
      "<tr><th scope=\"row\">Production</th><td>Customization and quality review</td><td>4–6 weeks after proof approval</td></tr>" +
      "<tr><th scope=\"row\">Delivery</th><td>Shipping to the destination in your quote</td><td>Quoted per destination</td></tr>" +
      "</tbody></table>" +
      "<p class=\"page-note\">For an opening, a tournament, or a seasonal launch, share the date in your quote or bespoke request and the concierge will build the schedule backwards from it.</p>" +
      "</section>" +
      '<section class="page-section">' +
      "<h2>Minimums and quantity tiers</h2>" +
      "<p>Every product carries four quantity pricing tiers. Minimum order quantities by category: hats 100, leather goods 100, bags 200, bottles 200, flip-flops 200, slippers 1,000 pairs, and accessories from 100 to 250 depending on the item. Pricing is confirmed by the atelier at quote review, after artwork and customization are settled.</p>" +
      '<p><a class="tlink" href="' + U("#/products") + '">Browse the catalog</a></p>' +
      "</section>" +
      conciergeCTA("Start with a conversation.", "Send the brief, the date, and the quantity you have in mind. The concierge replies with product direction and next steps.")
    );
  }

  /* ================= CONTACT ================= */

  var PROJECT_TYPES = ["Hotel / Resort", "Private Club", "Golf Property", "Beach Club", "Spa / Wellness", "Destination Event", "Corporate Retreat", "Other"];

  function contactHTML() {
    var options = PROJECT_TYPES.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + "</option>"; }).join("");
    return (
      crumbs("Contact") +
      hero("HL Supply / Concierge", "Speak with the concierge.",
        "Tell us what you are building. We’ll help guide the right product direction for your property, event, or guest experience.") +
      '<div class="contact-grid">' +
      '  <aside class="contact-card">' +
      "    <h2>HL Supply</h2>" +
      '    <p class="contact-card__tag">Bespoke branded goods for luxury hospitality.</p>' +
      '    <dl class="contact-card__nap">' +
      '      <div><dt>Email</dt><dd><a href="mailto:' + CONTACT.email + '">' + CONTACT.email + "</a></dd></div>" +
      '      <div><dt>Telephone</dt><dd><a href="tel:' + CONTACT.phoneHref + '">' + CONTACT.phone + "</a></dd></div>" +
      "      <div><dt>Web</dt><dd>" + CONTACT.domain + "</dd></div>" +
      "    </dl>" +
      "    <h3>What to include</h3>" +
      "    <ul class=\"contact-card__list\"><li>The property, club, or event</li><li>The guest moment or program (arrival, suite, spa, pool, course, boutique)</li><li>Products or categories of interest</li><li>Target quantity and a delivery date, if known</li><li>Logo files or a brand guide, when you have them</li></ul>" +
      '    <p class="page-note">Prefer a structured request? <a href="' + U("#/quote") + '">Build a quote</a> from the catalog or <a href="' + U("#/bespoke") + '">start a bespoke project</a>.</p>' +
      "  </aside>" +
      '  <section class="qcard contact-form" aria-labelledby="contactFormTitle">' +
      '    <h2 id="contactFormTitle">Send a request</h2>' +
      '    <form id="contactForm" class="qd-form" novalidate>' +
      '      <div class="qd-field" data-field="name"><label for="cf-name">Name</label><input id="cf-name" name="name" type="text" autocomplete="name" required /></div>' +
      '      <div class="qd-field" data-field="email"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" autocomplete="email" required /></div>' +
      '      <div class="qd-field" data-field="phone"><label for="cf-phone">Phone <span class="qd-optional">(optional)</span></label><input id="cf-phone" name="phone" type="tel" autocomplete="tel" /></div>' +
      '      <div class="qd-field" data-field="property"><label for="cf-property">Property / Company</label><input id="cf-property" name="property" type="text" autocomplete="organization" /></div>' +
      '      <div class="qd-field" data-field="projectType"><label for="cf-type">Project Type</label><select id="cf-type" name="projectType">' + options + "</select></div>" +
      '      <div class="qd-field qd-field--wide" data-field="message"><label for="cf-message">Message</label><textarea id="cf-message" name="message" rows="5" required placeholder="The property, the guest moment, the products you have in mind, quantity, and timing."></textarea></div>' +
      '      <input type="text" name="website" id="cf-website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
      '      <div class="qerror" id="cfError" role="alert" hidden></div>' +
      '      <button type="submit" class="btn btn--solid qaction" id="cfSubmit">Send to Concierge</button>' +
      '      <p class="qnote">Reviewed by the concierge team. We reply by email, usually with a few questions to shape the direction.</p>' +
      "    </form>" +
      '    <div class="qsuccess contact-success" id="contactSuccess" hidden>' +
      '      <div class="qsuccess__rule" aria-hidden="true"></div>' +
      "      <h2>The concierge has your request.</h2>" +
      "      <p>We’ll be in touch shortly. In the meantime, the catalog and the Bespoke Atelier are open.</p>" +
      '      <div class="btn-row"><a class="btn btn--solid" href="' + U("#/products") + '">Explore Products</a><a class="btn" href="' + HOME() + '">Back to Home</a></div>' +
      "    </div>" +
      "  </section>" +
      "</div>"
    );
  }

  function bindContact(root) {
    var form = root.querySelector("#contactForm");
    if (!form || form.__bound) return;
    form.__bound = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = root.querySelector("#cfError");
      var name = form.querySelector("#cf-name"), email = form.querySelector("#cf-email"), msg = form.querySelector("#cf-message");
      var missing = [];
      [name, email, msg].forEach(function (el) {
        var field = el.closest(".qd-field");
        var bad = !el.value.trim() || (el === email && el.value.indexOf("@") === -1);
        if (field) field.classList.toggle("is-invalid", bad);
        if (bad) missing.push(field ? field.querySelector("label").textContent.replace(/\(optional\)/, "").trim() : el.id);
      });
      if (missing.length) {
        err.textContent = "Please complete: " + missing.join(", ") + ".";
        err.hidden = false;
        return;
      }
      err.hidden = true;
      var payload = {
        name: name.value.trim(), email: email.value.trim(),
        phone: (form.querySelector("#cf-phone").value || "").trim(),
        property: (form.querySelector("#cf-property").value || "").trim(),
        projectType: form.querySelector("#cf-type").value,
        message: msg.value.trim(),
        website: (form.querySelector("#cf-website") || {}).value || ""
      };
      if (window.HLLeads) window.HLLeads.send("contact", payload);
      form.hidden = true;
      var ok = root.querySelector("#contactSuccess");
      ok.hidden = false;
      var h = ok.querySelector("h2");
      if (h) { h.setAttribute("tabindex", "-1"); try { h.focus(); } catch (x) { /* ignore */ } }
    });
    form.addEventListener("input", function (e) {
      var field = e.target.closest && e.target.closest(".qd-field");
      if (field) field.classList.remove("is-invalid");
    });
  }

  /* ================= LEGAL (placeholders until counsel supplies final text) ================= */

  function privacyHTML() {
    return (
      crumbs("Privacy") +
      hero("HL Supply / Legal", "Privacy notice", "How HL Supply handles the information you share when you request a quote, a mockup, or a conversation.") +
      '<div class="page-body page-body--legal">' +
      '<p class="page-note">Last updated October 2026. This notice is a plain-language summary; a formal policy prepared with counsel will replace it before launch.</p>' +
      "<h2>What we collect</h2><p>When you build a quote, submit a bespoke or mockup request, or contact the concierge, we collect the details you enter: your name, email, telephone, property or company, project details, quantities, delivery destination, and any artwork or reference files you upload. Quote and project selections are also stored in your browser so you can return to them.</p>" +
      "<h2>How we use it</h2><p>We use this information to prepare quotes, mockups, proofs, and production plans, to reply to your requests, and to coordinate delivery. We do not sell personal information, and we do not use it for advertising.</p>" +
      "<h2>Who sees it</h2><p>Your request is delivered to the HL Supply concierge team by email. Service providers that host this website and relay form submissions process the data only on our behalf.</p>" +
      "<h2>Cookies and analytics</h2><p>This site sets no advertising cookies. Browser storage is used only to keep your quote cart and project details between visits. Privacy-respecting, cookie-free analytics may be used to understand which pages are read.</p>" +
      "<h2>Your choices</h2><p>To review, correct, or delete information you have shared, write to <a href=\"mailto:" + CONTACT.email + "\">" + CONTACT.email + "</a>. Clearing your browser storage removes locally saved quote selections.</p>" +
      "</div>"
    );
  }

  function termsHTML() {
    return (
      crumbs("Terms") +
      hero("HL Supply / Legal", "Terms of use", "The basics of how this website and its quote tools work.") +
      '<div class="page-body page-body--legal">' +
      '<p class="page-note">Last updated October 2026. This is a plain-language summary; formal terms of sale accompany every quote, and a counsel-reviewed version will replace this page before launch.</p>' +
      "<h2>Quotes, not orders</h2><p>This website does not sell products online. Instant quotes, quote references (HLQ-), bespoke references (HLB-), and mockup requests are preliminary and non-binding. Final pricing, quantities, specifications, lead times, and delivery terms are confirmed in writing by HL Supply after artwork, customization, and production review.</p>" +
      "<h2>Artwork and trademarks</h2><p>You confirm that you hold the rights to any logos, artwork, and brand assets you upload, and you authorize HL Supply to use them solely to prepare mockups, proofs, and production for your project.</p>" +
      "<h2>Catalog information</h2><p>Product descriptions, dimensions, materials, and minimum order quantities are provided as a starting point and may be refined during proofing. Images are representative; custom colors and finishes are confirmed on the proof.</p>" +
      "<h2>Website content</h2><p>Text, photography, and design on this site belong to HL Supply or its licensors and may not be reproduced without permission.</p>" +
      "<h2>Contact</h2><p>Questions about these terms: <a href=\"mailto:" + CONTACT.email + "\">" + CONTACT.email + "</a>.</p>" +
      "</div>"
    );
  }

  /* ================= registry ================= */

  var PAGES = {
    about: {
      path: "/about/",
      title: "About HL Supply: Bespoke Hospitality Product Atelier",
      description: "HL Supply designs, develops, and supplies bespoke branded guest goods for luxury hotels, resorts, private clubs, and spas. Our story, philosophy, and approach to luxury.",
      keywords: ["bespoke hospitality products", "luxury hotel merchandise supplier", "hotel product design atelier"],
      schemaType: "AboutPage",
      crumb: "About",
      render: aboutHTML
    },
    process: {
      path: "/process/",
      title: "How It Works: Select, Customize, Produce | HL Supply",
      description: "How custom hotel products are made with HL Supply: brief, mockup and proof, 4–6 week production after proof approval, then delivery. Minimums and tiers explained.",
      keywords: ["custom hotel products process", "how to order custom hotel amenities", "custom merchandise lead time"],
      schemaType: "WebPage",
      crumb: "Process",
      render: processHTML
    },
    contact: {
      path: "/contact/",
      title: "Contact the Concierge | HL Supply",
      description: "Contact HL Supply for custom branded guest goods: info@hotelluxurysupply.com, +1 (347) 669-4417. Send a request and the concierge replies with product direction.",
      keywords: ["contact HL Supply", "hotel luxury supply contact"],
      schemaType: "ContactPage",
      crumb: "Contact",
      render: contactHTML,
      bind: bindContact
    },
    privacy: {
      path: "/privacy/",
      title: "Privacy Notice | HL Supply",
      description: "How HL Supply handles the information shared through quotes, bespoke requests, and concierge messages.",
      schemaType: "WebPage",
      crumb: "Privacy",
      noindex: true,
      render: privacyHTML
    },
    terms: {
      path: "/terms/",
      title: "Terms of Use | HL Supply",
      description: "Terms of use for the HL Supply website and its quote tools. Quotes are preliminary; final terms accompany every confirmed project.",
      schemaType: "WebPage",
      crumb: "Terms",
      noindex: true,
      render: termsHTML
    }
  };

  // Render a page into the shared mount. Static build: skip when pre-rendered.
  function render(slug, mount) {
    var page = PAGES[slug];
    if (!page || !mount) return false;
    var view = document.getElementById("viewPage");
    var pre = !!(view && view.hasAttribute("data-prerendered"));
    if (pre) view.removeAttribute("data-prerendered");
    if (!pre) mount.innerHTML = page.render();
    mount.setAttribute("data-page", slug);
    if (page.bind) page.bind(mount);
    return true;
  }

  // Guides and the glossary are generated at build time from content/*.
  // In SPA/preview mode (source files) they are not available, so show a
  // calm pointer instead of a broken page. Static pages are pre-rendered.
  function renderContent(seg, mount) {
    if (!mount) return;
    var view = document.getElementById("viewPage");
    if (view && view.hasAttribute("data-prerendered")) { view.removeAttribute("data-prerendered"); return; }
    var isGlossary = seg[0] === "glossary";
    var label = isGlossary ? "Glossary" : (seg[0] === "for" ? "Programs" : "Guides");
    mount.innerHTML =
      crumbs(label) +
      hero("HL Supply / " + label,
        isGlossary ? "Hospitality customization glossary" : (seg[0] === "for" ? "Custom goods by property and event" : "Buying guides"),
        "This content is generated for the published site. Open the preview deployment to read it, or continue to the catalog.") +
      '<div class="btn-row"><a class="btn btn--solid" href="' + U("#/products") + '">Explore Products</a><a class="btn" href="' + U("#/contact") + '">Speak with the Concierge</a></div>';
    mount.setAttribute("data-page", seg.join("/"));
  }

  PAGES.__render = render;
  PAGES.__renderContent = renderContent;
  PAGES.__list = function () {
    return Object.keys(PAGES).filter(function (k) { return k.indexOf("__") !== 0; });
  };
  return PAGES;
})();
