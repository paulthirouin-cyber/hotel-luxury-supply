// Cloudflare Pages Function — POST /api/lead
// Receives every website form submission (contact, concierge, quote, bespoke,
// mockup) as JSON and emails it to the concierge inbox through Resend.
//
// Environment variables (Pages → Settings → Environment variables):
//   RESEND_API_KEY  — API key from resend.com (free tier is enough)
//   LEAD_TO         — inbox that receives leads, e.g. info@hotelluxurysupply.com
//   LEAD_FROM       — verified sender, e.g. concierge@hotelluxurysupply.com
// Without them the function still answers 202 so the site never breaks;
// the submission is simply not forwarded (the browser keeps a local copy).

const MAX_BODY = 64 * 1024;
const TYPES = new Set(["contact", "concierge", "quote", "bespoke", "mockup", "lookbook", "sample-kit"]);
const SITE = "https://hotelluxurysupply.com";

// Phase 9.4: auto-reply to the sender (LEAD_AUTOREPLY=off disables it)
const TYPE_LABEL = { contact: "message", concierge: "concierge request", quote: "quote", bespoke: "bespoke request", mockup: "mockup request", lookbook: "lookbook request", "sample-kit": "sample kit request" };
function autoReply(lead, email) {
  const label = TYPE_LABEL[lead.type] || "request";
  const ref = lead.payload.ref || lead.payload.reference || "";
  const name = String(lead.payload.name || lead.payload.details?.name || "").trim();
  const greet = name ? `Dear ${esc(name.split(" ")[0])},` : "Hello,";
  const refLine = ref ? ` Your reference is <strong>${esc(ref)}</strong>; quote it in any reply.` : "";
  const next = lead.type === "lookbook"
    ? `The lookbook opened on the page you submitted from; if you need it again, write back and we will send the PDF. If a piece caught your eye, build a quote at <a href="${SITE}/products/">${SITE}/products/</a> and the concierge replies with direction.`
    : lead.type === "sample-kit"
      ? "We will confirm the sample kit and the delivery address by email before it ships."
      : `The concierge reviews every ${label} personally and replies the same business day (Monday to Friday) with product direction and next steps, usually with a few questions to shape the brief.${refLine}`;
  const html = `<div style="font-family:Jost,Helvetica,Arial,sans-serif;color:#1b2a41;max-width:600px;line-height:1.55">
<p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#5f6a72">HL Supply · Concierge</p>
<h2 style="font-family:Marcellus,Georgia,serif;font-weight:400;margin:0 0 16px">Your HL Supply request — next steps</h2>
<p>${greet}</p>
<p>Thank you. We have your ${esc(label)}.</p>
<p>${next}</p>
<p>Meanwhile, the <a href="${SITE}/products/">catalog</a>, the <a href="${SITE}/collections/">collections</a>, and the <a href="${SITE}/bespoke/">Bespoke Atelier</a> are open, and you can reply to this email with artwork, a brand guide, or questions.</p>
<p style="margin-top:24px">HL Supply<br><a href="mailto:info@hotelluxurysupply.com" style="color:#1b2a41">info@hotelluxurysupply.com</a> · +1 (347) 669-4417 · <a href="${SITE}/" style="color:#1b2a41">hotelluxurysupply.com</a></p>
<p style="font-size:12px;color:#5f6a72;margin-top:24px">We don't simply put hotel names on products. We help hotels create products worthy of carrying their names.</p>
</div>`;
  const text = `${greet.replace(/<[^>]+>/g, "")}

Thank you. We have your ${label}.

${next.replace(/<[^>]+>/g, "")}

Meanwhile, the catalog (${SITE}/products/), the collections (${SITE}/collections/), and the Bespoke Atelier (${SITE}/bespoke/) are open, and you can reply to this email with artwork, a brand guide, or questions.

HL Supply · info@hotelluxurysupply.com · +1 (347) 669-4417 · hotelluxurysupply.com`;
  return { subject: "Your HL Supply request — next steps", html, text };
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function flatten(obj, prefix, out) {
  out = out || [];
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? prefix + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out.push([key, Array.isArray(v) ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(", ") : String(v == null ? "" : v)]);
  }
  return out;
}

function render(lead) {
  const rows = flatten(lead.payload).filter(([k]) => k !== "website")
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5f6a72;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join("");
  const text = flatten(lead.payload).filter(([k]) => k !== "website").map(([k, v]) => `${k}: ${v}`).join("\n");
  return {
    subject: `[HL Supply] New ${lead.type} request` + (lead.payload.property ? ` — ${lead.payload.property}` : "") + (lead.payload.ref || lead.payload.reference ? ` (${lead.payload.ref || lead.payload.reference})` : ""),
    html: `<div style="font-family:Jost,Helvetica,Arial,sans-serif;color:#1b2a41;max-width:640px">
<p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#5f6a72">HL Supply · Concierge</p>
<h2 style="font-family:Marcellus,Georgia,serif;font-weight:400;margin:0 0 16px">New ${esc(lead.type)} request</h2>
<table style="border-collapse:collapse;font-size:14px">${rows}</table>
<p style="font-size:12px;color:#5f6a72;margin-top:24px">Sent ${esc(lead.sentAt)} from ${esc(lead.page)}</p>
</div>`,
    text: `New ${lead.type} request\n\n${text}\n\nSent ${lead.sentAt} from ${lead.page}`
  };
}

export async function onRequestPost({ request, env }) {
  const json = (body, status) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return json({ ok: false, error: "too large" }, 413);

  let lead;
  try { lead = await request.json(); } catch (e) { return json({ ok: false, error: "invalid json" }, 400); }
  if (!lead || !TYPES.has(lead.type) || typeof lead.payload !== "object") return json({ ok: false, error: "invalid lead" }, 400);

  // honeypot: bots fill the hidden "website" field
  if (lead.payload.website) return json({ ok: true, delivered: false }, 202);

  const email = String(lead.payload.email || lead.payload.details?.email || "");
  if (!email.includes("@")) return json({ ok: false, error: "email required" }, 400);

  if (!env.RESEND_API_KEY || !env.LEAD_TO) return json({ ok: true, delivered: false, reason: "endpoint not configured" }, 202);

  const mail = render(lead);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.LEAD_FROM || "HL Supply Concierge <onboarding@resend.dev>",
      to: String(env.LEAD_TO).split(",").map((s) => s.trim()).filter(Boolean),
      reply_to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text
    })
  });
  if (!res.ok) return json({ ok: false, delivered: false, status: res.status }, 502);

  let autoReplied = false;
  if (env.LEAD_AUTOREPLY !== "off") {
    try {
      const reply = autoReply(lead, email);
      const r2 = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.LEAD_FROM || "HL Supply Concierge <onboarding@resend.dev>",
          to: [email],
          reply_to: String(env.LEAD_TO).split(",")[0].trim(),
          subject: reply.subject,
          html: reply.html,
          text: reply.text
        })
      });
      autoReplied = r2.ok;
    } catch (e) { autoReplied = false; } // the lead is already delivered; never fail the request over the courtesy reply
  }
  return json({ ok: true, delivered: true, autoReply: autoReplied }, 200);
}

export function onRequest({ request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
  return new Response("Method not allowed", { status: 405, headers: { Allow: "POST, OPTIONS" } });
}
