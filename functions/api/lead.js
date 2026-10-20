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
const TYPES = new Set(["contact", "concierge", "quote", "bespoke", "mockup"]);

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
  return json({ ok: true, delivered: true }, 200);
}

export function onRequest({ request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
  return new Response("Method not allowed", { status: 405, headers: { Allow: "POST, OPTIONS" } });
}
