// HL Supply — Phase 7
// Quote Cart store: line items, project details, quote reference,
// PDF status, submission snapshot, and structured lead object.
// localStorage persistence is best-effort (sandboxed frames may block it).

window.HLQuote = (function () {
  "use strict";

  var KEY = "hl_quote_v2";
  var state = {
    items: [],        // [{slug, quantity, notes, addedAt}]
    details: {},      // {name,email,phone,property,propertyType,destination,deliveryDate,notes}
    ref: null,        // "HLQ-YYYY-NNNN"
    pdfDownloaded: false,
    lead: null,       // structured lead object built at PDF generation
    submission: null  // {ref,email,fileNames,submittedAt}
  };

  try {
    var saved = window.localStorage.getItem(KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        state.items = parsed.items || [];
        state.details = parsed.details || {};
        state.ref = parsed.ref || null;
        state.pdfDownloaded = !!parsed.pdfDownloaded;
        state.lead = parsed.lead || null;
        state.submission = parsed.submission || null;
      }
    }
  } catch (e) { /* memory-only */ }

  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* memory-only */ }
  }

  function find(slug) {
    return state.items.filter(function (it) { return it.slug === slug; })[0] || null;
  }

  function add(slug, quantity, notes) {
    var qty = Math.floor(Number(quantity) || 0);
    var existing = find(slug);
    if (existing) {
      existing.quantity = qty;
      if (notes) existing.notes = notes;
    } else {
      state.items.push({ slug: slug, quantity: qty, notes: notes || "", addedAt: Date.now() });
    }
    persist();
    return state.items.length;
  }

  function updateQty(slug, quantity) {
    var it = find(slug);
    if (it) { it.quantity = Math.floor(Number(quantity) || 0); persist(); }
  }

  function updateNotes(slug, notes) {
    var it = find(slug);
    if (it) { it.notes = notes; persist(); }
  }

  function remove(slug) {
    state.items = state.items.filter(function (it) { return it.slug !== slug; });
    persist();
    return state.items.length;
  }

  function items() { return state.items.slice(); }
  function count() { return state.items.length; }

  function details() {
    var d = {};
    for (var k in state.details) d[k] = state.details[k];
    return d;
  }
  function setDetail(key, value) { state.details[key] = value; persist(); }

  function ensureRef() {
    if (!state.ref) {
      state.ref = "HLQ-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000));
      persist();
    }
    return state.ref;
  }
  function ref() { return state.ref; }

  function markPdfDownloaded() { state.pdfDownloaded = true; persist(); }
  function pdfDownloaded() { return state.pdfDownloaded; }

  function setLead(lead) { state.lead = lead; persist(); }

  function setSubmission(sub) { state.submission = sub; persist(); }
  function submission() { return state.submission; }

  function reset() {
    state = { items: [], details: {}, ref: null, pdfDownloaded: false, lead: null, submission: null };
    persist();
  }

  /** Structured quote lead — ready for a CRM/email endpoint later. */
  function buildLead(lineItems, summary) {
    return {
      quoteReference: ensureRef(),
      projectDetails: details(),
      lineItems: lineItems,
      summary: summary,
      timestamp: new Date().toISOString(),
      pdfDownloaded: true
    };
  }

  return {
    add: add,
    updateQty: updateQty,
    updateNotes: updateNotes,
    remove: remove,
    items: items,
    count: count,
    details: details,
    setDetail: setDetail,
    ensureRef: ensureRef,
    ref: ref,
    markPdfDownloaded: markPdfDownloaded,
    pdfDownloaded: pdfDownloaded,
    buildLead: buildLead,
    setLead: setLead,
    setSubmission: setSubmission,
    submission: submission,
    reset: reset
  };
})();
