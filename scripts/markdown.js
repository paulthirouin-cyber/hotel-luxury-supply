// HL Supply — tiny Markdown → HTML converter for the content engine.
// Supports: front matter (--- key: value ---), # ## ### headings, paragraphs,
// - and 1. lists, > blockquotes, | tables |, **bold**, *em*, `code`, links.
// Internal link shorthands resolve at build time:
//   [text](product:slug)  [text](category:slug)  [text](guide:slug)
//   [text](glossary:term-slug)  [text](page:contact)  [text](quote)
// Optional glossary auto-linking: the first mention of each term in body
// paragraphs links to /glossary/#term (never inside headings or links).

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function slugify(s) {
  return String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(":");
    if (i < 0) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (k === "keywords") v = v.split(",").map((x) => x.trim()).filter(Boolean);
    meta[k] = v;
  });
  return { meta, body: src.slice(m[0].length) };
}

function resolveHref(href, resolver) {
  const m = href.match(/^(product|category|guide|for|collection|glossary|page):([a-z0-9-]+)$/);
  if (m) return resolver ? resolver(m[1], m[2]) : href;
  if (href === "quote" || href === "bespoke") return resolver ? resolver("page", href) : href;
  return href;
}

function inline(text, ctx) {
  // protect code spans
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_, c) => { codes.push("<code>" + esc(c) + "</code>"); return "\u0000" + (codes.length - 1) + "\u0000"; });
  text = esc(text);
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => {
    const href = resolveHref(h, ctx.resolver);
    if (ctx.onLink) ctx.onLink(href);
    return '<a href="' + esc(href) + '">' + t + "</a>";
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
  return text;
}

// Link the first occurrence of each glossary term inside a rendered paragraph's text nodes.
function autoLinkTerms(html, ctx) {
  if (!ctx.terms || !ctx.terms.length || ctx.autoLinked >= ctx.maxAutoLinks) return html;
  // split into text outside tags vs tags; only touch text that is not inside <a>
  const parts = html.split(/(<[^>]+>)/);
  let depthA = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("<")) { if (/^<a[\s>]/i.test(p)) depthA++; if (/^<\/a>/i.test(p)) depthA--; continue; }
    if (depthA > 0 || !p.trim()) continue;
    let text = p;
    for (const term of ctx.terms) {
      if (ctx.autoLinked >= ctx.maxAutoLinks) break;
      if (ctx.linkedTerms.has(term.slug)) continue;
      const re = new RegExp("(^|[^\\w-])(" + term.pattern + ")(?![\\w-])", "i");
      const m = text.match(re);
      if (!m) continue;
      const idx = m.index + m[1].length;
      text = text.slice(0, idx) + '<a class="term-link" href="' + ctx.glossaryHref + "#" + term.slug + '">' + m[2] + "</a>" + text.slice(idx + m[2].length);
      ctx.linkedTerms.add(term.slug);
      ctx.autoLinked++;
    }
    parts[i] = text;
  }
  return parts.join("");
}

function render(markdown, options) {
  options = options || {};
  const { meta, body } = parseFrontMatter(markdown);
  const ctx = {
    resolver: options.resolver,
    onLink: options.onLink,
    terms: (options.terms || []).map((t) => ({ slug: t.slug, pattern: t.pattern || t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") })),
    glossaryHref: options.glossaryHref || "/glossary/",
    maxAutoLinks: options.maxAutoLinks || 10,
    autoLinked: 0,
    linkedTerms: new Set()
  };
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const headings = [];
  const faqs = [];
  let words = 0;
  let i = 0;
  let inFaq = false;
  let currentQ = null;

  const flushQ = () => { if (currentQ) { faqs.push(currentQ); currentQ = null; } };
  const para = (txt) => {
    words += txt.split(/\s+/).filter(Boolean).length;
    let html = inline(txt, ctx);
    html = autoLinkTerms(html, ctx);
    return html;
  };

  while (i < lines.length) {
    let line = lines[i];
    if (!line.trim()) { i++; continue; }

    let h;
    if ((h = line.match(/^(#{1,3})\s+(.+?)\s*#*$/))) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugify(text);
      if (level === 2) {
        flushQ();
        inFaq = /^frequently asked questions$|^faq/i.test(text);
        headings.push({ id, text });
        out.push('<h2 id="' + id + '">' + inline(text, ctx) + "</h2>");
      } else if (level === 3) {
        if (inFaq) { flushQ(); currentQ = { q: text, a: "" }; out.push('<h3 class="faq__q" id="' + id + '">' + esc(text) + "</h3>"); }
        else out.push('<h3 id="' + id + '">' + inline(text, ctx) + "</h3>");
      } else {
        out.push("<h1>" + inline(text, ctx) + "</h1>");
      }
      i++; continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
      const html = "<ul>" + items.map((it) => "<li>" + para(it) + "</li>").join("") + "</ul>";
      if (currentQ) currentQ.a += " " + items.join("; "); // keep schema answer plain
      out.push(html);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      out.push("<ol>" + items.map((it) => "<li>" + para(it) + "</li>").join("") + "</ol>");
      continue;
    }
    if (/^>\s?/.test(line)) {
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push('<blockquote class="page-quote"><p>' + para(q.join(" ")) + "</p></blockquote>");
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]);
      const bodyRows = rows.slice(1).filter((r) => !/^\|\s*:?-+/.test(r)).map(cells);
      out.push('<div class="table-wrap"><table class="ptable"><thead><tr>' + head.map((c) => '<th scope="col">' + inline(c, ctx) + "</th>").join("") + "</tr></thead><tbody>" +
        bodyRows.map((r) => "<tr>" + r.map((c, j) => (j === 0 ? '<th scope="row">' : "<td>") + inline(c, ctx) + (j === 0 ? "</th>" : "</td>")).join("") + "</tr>").join("") +
        "</tbody></table></div>");
      words += bodyRows.flat().join(" ").split(/\s+/).filter(Boolean).length;
      continue;
    }
    // paragraph: gather until blank line
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*[-*]\s|\s*\d+\.\s|>|\|)/.test(lines[i])) { buf.push(lines[i].trim()); i++; }
    const txt = buf.join(" ");
    if (currentQ) currentQ.a += (currentQ.a ? " " : "") + txt;
    out.push("<p>" + para(txt) + "</p>");
  }
  flushQ();
  faqs.forEach((f) => { f.a = f.a.trim(); });

  return { meta, html: out.join("\n"), headings, faqs, words };
}

module.exports = { render, parseFrontMatter, slugify, esc };
