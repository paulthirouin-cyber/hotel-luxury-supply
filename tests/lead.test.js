// Suite 4: the Pages Function functions/api/lead.js in isolation (Node's
// global Request/Response + a stubbed fetch): validation, honeypot, delivery,
// and the Phase 9.4 auto-reply to the sender.
const path = require("path");
const { pathToFileURL } = require("url");
const { harness } = require("./helpers");

const t = harness("LEAD SUITE");

(async () => {
  const mod = await import(pathToFileURL(path.join(__dirname, "..", "functions", "api", "lead.js")).href);
  const calls = [];
  const realFetch = global.fetch;
  global.fetch = async (url, opts) => { calls.push({ url, body: JSON.parse(opts.body) }); return { ok: true, status: 200 }; };
  const post = (body, env) => mod.onRequestPost({
    request: new Request("https://hotelluxurysupply.com/api/lead", { method: "POST", headers: { "content-type": "application/json", "content-length": String(JSON.stringify(body).length) }, body: JSON.stringify(body) }),
    env: env || {}
  });
  const ENV = { RESEND_API_KEY: "re_test", LEAD_TO: "info@hotelluxurysupply.com", LEAD_FROM: "HL Supply Concierge <concierge@hotelluxurysupply.com>" };
  const lead = (type, payload) => ({ type, payload, page: "https://hotelluxurysupply.com/contact/", sentAt: "2026-10-21T10:00:00.000Z" });

  let res = await post(lead("contact", { name: "Paul Laurent", email: "paul@grandriviera.com", message: "Arrival totes." }), ENV);
  let body = await res.json();
  t.ok(res.status === 200 && body.delivered === true && body.autoReply === true, "configured: lead delivered + auto-reply sent");
  t.ok(calls.length === 2 && calls[0].body.to[0] === "info@hotelluxurysupply.com" && calls[0].body.reply_to === "paul@grandriviera.com", "lead email goes to the concierge inbox with reply-to the sender");
  t.ok(calls[1].body.to[0] === "paul@grandriviera.com" && calls[1].body.subject === "Your HL Supply request — next steps" && /same business day/.test(calls[1].body.text) && /Dear Paul,/.test(calls[1].body.text) && calls[1].body.reply_to === "info@hotelluxurysupply.com", "auto-reply: to the sender, SLA copy, first-name greeting, reply-to concierge");
  t.ok(!/Buy Now|Checkout|Payment/i.test(calls[1].body.html), "auto-reply: quote language only");

  calls.length = 0;
  res = await post(lead("quote", { ref: "HLQ-2026-0042", details: { name: "Paul", email: "paul@grandriviera.com" }, items: [{ ref: "H-005", quantity: 600 }] }), ENV);
  body = await res.json();
  t.ok(res.status === 200 && calls.length === 2 && /HLQ-2026-0042/.test(calls[1].body.text) && /Your HL Supply request/.test(calls[1].body.subject), "quote lead: nested email found, reference echoed in the auto-reply");

  calls.length = 0;
  res = await post(lead("lookbook", { name: "Paul", email: "paul@grandriviera.com" }), ENV);
  t.ok(res.status === 200 && calls.length === 2 && /lookbook/.test(calls[1].body.text), "lookbook type accepted with a lookbook-specific reply");
  calls.length = 0;
  res = await post(lead("sample-kit", { name: "Paul", email: "paul@grandriviera.com", request: "sample kit" }), ENV);
  t.ok(res.status === 200 && calls.length === 2 && /sample kit/.test(calls[1].body.text), "sample-kit type accepted");

  calls.length = 0;
  res = await post(lead("contact", { name: "Paul", email: "paul@grandriviera.com", message: "x" }), { ...ENV, LEAD_AUTOREPLY: "off" });
  body = await res.json();
  t.ok(res.status === 200 && calls.length === 1 && body.autoReply === false, "LEAD_AUTOREPLY=off disables the courtesy reply");

  calls.length = 0;
  res = await post(lead("contact", { name: "Paul", email: "paul@grandriviera.com", message: "x" }), {});
  t.ok(res.status === 202 && calls.length === 0, "unconfigured: 202, nothing sent, site never breaks");
  res = await post(lead("contact", { name: "Bot", email: "bot@spam.test", message: "x", website: "http://spam" }), ENV);
  t.ok(res.status === 202 && calls.length === 0, "honeypot: 202, nothing sent");
  res = await post(lead("checkout", { email: "x@y.z" }), ENV);
  t.ok(res.status === 400, "unknown lead type rejected");
  res = await post(lead("contact", { name: "No Email" }), ENV);
  t.ok(res.status === 400, "email required");

  global.fetch = realFetch;
  t.done();
})().catch((e) => { console.log("FAIL: lead suite crashed: " + e.stack); process.exit(1); });
