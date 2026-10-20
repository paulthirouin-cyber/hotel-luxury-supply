// HL Supply — Phase 7
// Instant Quote document. Renders a full, professional preliminary quote
// as a printable in-page document with a Print / Save as PDF action.
// (Frontend PDF libraries can be swapped in later; the UI is built for it.)

window.HLQuotePDF = (function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var lastFocused = null;

  function close() {
    var doc = document.getElementById("hlQuoteDoc");
    if (doc) doc.remove();
    document.body.classList.remove("quote-doc-open");
    document.removeEventListener("keydown", onKey);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  /**
   * data = {
   *   ref, date, details {name,email,phone,property,propertyType,destination,deliveryDate,notes},
   *   lines: [{name, category, quantity, unitLabel, tierQty, unitPrice, lineTotal, customization, notes}],
   *   summary: {subtotal}
   * }
   */
  function open(data) {
    close();
    lastFocused = document.activeElement;

    var d = data.details || {};

    var rows = data.lines
      .map(function (l) {
        return (
          "<tr>" +
          "<td><strong>" + esc(l.name) + "</strong>" +
          (l.notes ? '<span class="qdoc__linenote">' + esc(l.notes) + "</span>" : "") +
          "</td>" +
          "<td>" + esc(l.category) + "</td>" +
          "<td>" + esc(l.quantity) + " " + esc(l.unitLabel) + "</td>" +
          "<td>" + esc(l.tierQty) + "+</td>" +
          "<td>" + esc(l.unitPrice) + "</td>" +
          "<td>" + esc(l.lineTotal) + "</td>" +
          "<td>" + esc(l.customization) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    var el = document.createElement("div");
    el.id = "hlQuoteDoc";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "HL Supply Preliminary Quote");
    el.innerHTML =
      '<div class="qdoc__toolbar">' +
      '  <p>PDF export will be connected in production. Printable quote view is available now &mdash; use Print / Save as PDF.</p>' +
      '  <div class="qdoc__toolbar-actions">' +
      '    <button type="button" class="btn btn--solid" id="qdocPrint">Print / Save as PDF</button>' +
      '    <button type="button" class="btn" id="qdocClose">Close</button>' +
      "  </div>" +
      "</div>" +
      '<div class="qdoc" id="qdocPaper">' +
      '  <div class="qdoc__ribbon" aria-hidden="true"></div>' +
      '  <header class="qdoc__head">' +
      '    <span class="qdoc__wordmark">HL &middot; Supply</span>' +
      '    <div class="qdoc__refblock">' +
      '      <span>Quote Ref: <strong>' + esc(data.ref) + "</strong></span>" +
      "      <span>Date: " + esc(data.date) + "</span>" +
      "    </div>" +
      "  </header>" +
      "  <h1>HL Supply Preliminary Quote</h1>" +
      '  <p class="qdoc__sub">Custom hospitality goods for luxury properties and destination experiences.</p>' +
      '  <div class="qdoc__rule" aria-hidden="true"></div>' +
      '  <dl class="qdoc__meta">' +
      "    <div><dt>Prepared for</dt><dd>" + esc(d.name) + "</dd></div>" +
      "    <div><dt>Email</dt><dd>" + esc(d.email) + "</dd></div>" +
      "    <div><dt>Phone</dt><dd>" + esc(d.phone) + "</dd></div>" +
      "    <div><dt>Property / Event</dt><dd>" + esc(d.property) + "</dd></div>" +
      "    <div><dt>Property Type</dt><dd>" + esc(d.propertyType) + "</dd></div>" +
      "    <div><dt>Shipping Destination</dt><dd>" + esc(d.destination) + "</dd></div>" +
      "    <div><dt>Desired Delivery</dt><dd>" + esc(d.deliveryDate) + "</dd></div>" +
      (d.notes ? "    <div class='qdoc__meta-wide'><dt>Project Notes</dt><dd>" + esc(d.notes) + "</dd></div>" : "") +
      "  </dl>" +
      '  <table class="qdoc__table">' +
      "    <thead><tr><th>Product</th><th>Category</th><th>Quantity</th><th>Active Tier</th><th>Unit Price</th><th>Line Total</th><th>Customization</th></tr></thead>" +
      "    <tbody>" + rows + "</tbody>" +
      "  </table>" +
      '  <dl class="qdoc__summary">' +
      "    <div><dt>Product subtotal</dt><dd>" + esc(data.summary.subtotal) + "</dd></div>" +
      "    <div><dt>Customization review</dt><dd>Pending</dd></div>" +
      "    <div><dt>Setup fees</dt><dd>Pending review</dd></div>" +
      "    <div><dt>Shipping</dt><dd>Calculated after review</dd></div>" +
      '    <div class="qdoc__total"><dt>Estimated total</dt><dd>' + esc(data.summary.subtotal) + "</dd></div>" +
      "  </dl>" +
      '  <p class="qdoc__disclaimer">This is a preliminary instant quote generated from current selections. Final pricing, artwork suitability, setup fees, shipping, production timing, and customization details are confirmed after HL Supply review.</p>' +
      '  <footer class="qdoc__foot">HL Supply &mdash; Bespoke branded goods for luxury hospitality.<br />info@hotelluxurysupply.com &middot; +1 (347) 669-4417 &middot; hotelluxurysupply.com</footer>' +
      "</div>";

    document.body.appendChild(el);
    document.body.classList.add("quote-doc-open");

    document.getElementById("qdocPrint").addEventListener("click", function () {
      window.print();
    });
    document.getElementById("qdocClose").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.getElementById("qdocClose").focus();
  }

  return { open: open, close: close };
})();
