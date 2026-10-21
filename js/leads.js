// HL Supply — Phase 3.5: lead delivery.
// Every form (concierge, contact, quote submit, bespoke, mockup) calls
// HLLeads.send(type, payload). Submissions are POSTed as JSON to the lead
// endpoint (Cloudflare Pages Function at /api/lead on the static site) and
// always mirrored to a local outbox, so the UX never depends on the network.
//
// Endpoint resolution: window.HL_LEAD_ENDPOINT if set, else "/api/lead" in
// static mode, else none (SPA source files / single-file preview).

window.HLLeads = (function () {
  "use strict";

  var OUTBOX = "hl_leads_outbox_v1";
  var R = window.HLRoutes;

  function endpoint() {
    if (typeof window.HL_LEAD_ENDPOINT === "string") return window.HL_LEAD_ENDPOINT || null;
    return R && R.isStatic ? "/api/lead" : null;
  }

  function outbox() {
    try { return JSON.parse(window.localStorage.getItem(OUTBOX) || "[]"); } catch (e) { return []; }
  }

  function remember(entry) {
    try {
      var list = outbox();
      list.push(entry);
      window.localStorage.setItem(OUTBOX, JSON.stringify(list.slice(-50)));
    } catch (e) { /* memory only */ }
  }

  function send(type, payload) {
    var entry = {
      type: type,
      payload: payload || {},
      page: (window.location && window.location.href) || "",
      sentAt: new Date().toISOString(),
      delivered: null
    };
    remember(entry);
    var url = endpoint();
    if (!url || typeof window.fetch !== "function") return Promise.resolve({ ok: false, skipped: true });
    var body = JSON.stringify({ type: type, payload: payload || {}, page: entry.page, sentAt: entry.sentAt });
    return window.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true
    }).then(function (res) {
      return { ok: !!res.ok, status: res.status };
    }).catch(function () {
      return { ok: false, status: 0 };
    });
  }

  // Custom events (Phase 9.3). The analytics snippet is injected at build only
  // when config/site.json enables it, so this is a no-op everywhere else.
  function track(name, props) {
    try {
      if (typeof window.plausible === "function") window.plausible(name, props ? { props: props } : undefined);
      else if (typeof window.gtag === "function") window.gtag("event", name, props || {});
    } catch (e) { /* analytics must never break the UI */ }
  }

  return { send: send, outbox: outbox, endpoint: endpoint, track: track };
})();
