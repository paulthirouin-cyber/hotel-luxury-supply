# HL Supply — SEO & AI-Search Master Plan ("The Demon Spec")

Objective: make **hotelluxurysupply.com** (the company's real domain, per the catalog) the definitive organic result — in Google,
Bing, and AI answer engines (ChatGPT, Perplexity, Claude, Google AI Overviews) —
for custom branded guest goods in luxury hospitality. The MrBeast principle
applies: nothing on a page is accidental. Every page has one search job, one
reader job, and one conversion job, and a monthly measurement loop feeds what
we learn back into the next content cycle. Rankings compound; we engineer the
compounding.

---

## 0. The one structural prerequisite (do first, non-negotiable)

The v8 prototype routes through `products.html#/...` hash fragments. **Search
engines treat all hash routes as ONE page.** Nothing else in this plan works
until every route is a real, pre-rendered URL:

```
/                                   homepage
/products/                          catalog landing
/products/hats/                     8 category pages (incl. pets)
/products/hats/riviera-bucket-hat/  45 product pages
/collections/poolside/              5 collection pages (cross-category curation)
/bespoke/                           bespoke atelier
/quote/                             quote cart (noindex)
/guides/...                         content engine (Phase SEO-2+)
```

Implementation: a Node build script (`build.js`) that imports the existing data
files (`js/products.js`, `js/categories.js`) and the existing render functions'
HTML, and writes one static `index.html` per route into `dist/`. The site stays
zero-framework. Client JS keeps powering interactivity (quantity, tiers, quote,
drawers) on top of server-rendered markup — content must be in the HTML source,
not injected after load. Old hash URLs get a tiny redirect script. `/quote/`
is `noindex,follow` (it's a tool, not content).

Why this is the whole ballgame: it turns 1 indexable page into ~60 on day one,
each with its own title, description, schema, and internal links — and it makes
every later content page a first-class citizen.

## 1. Keyword architecture (the demand map)

Head → mid → long-tail, mapped one-to-one onto page types so pages never
cannibalize each other:

- **Category pages** own commercial head/mid terms:
  "custom hotel tote bags", "branded resort hats wholesale", "custom hotel
  slippers with logo", "luxury hotel amenities supplier", "custom beach club
  merchandise", "golf resort merchandise", "custom spa slippers".
- **Product pages** own specific long-tail: "custom embroidered bucket hat for
  resorts", "debossed leather valet tray hotel", "custom logo flip flops MOQ".
- **Guides** (content engine) own informational intent: "hotel welcome gift
  ideas", "what MOQ means in custom products", "embroidery vs deboss vs laser
  etching", "how much do custom hotel totes cost", "resort retail program guide".
- **Use-case pages** own vertical intent: /for/golf-resorts/,
  /for/beach-clubs/, /for/spa-wellness/, /for/hotel-openings/,
  /for/corporate-retreats/, /for/incentive-travel/ — each linking to relevant
  products.
- **Collection pages** own guest-moment intent: "hotel pool amenities",
  "hotel spa amenities", "golf resort merchandise", "hotel fitness amenities",
  "beach club merchandise" — curated across categories, never duplicating a
  product URL.
- **Pets** is the first category with no incumbent supplier: "hotel pet
  amenities", "luxury hotel pet program" are owned by the category + guide.
- Homepage owns the brand + the single broadest term ("bespoke branded goods
  for luxury hospitality" / "custom hospitality products").

Rule: one primary keyword per page, recorded in a `keywords` field in the data
files so titles/descriptions/H1s are generated from it. A keyword map lives in
`docs/KEYWORD-MAP.md` and is updated monthly from Search Console data (research
runs happen in the claude.ai project with HarborRank; output gets committed here).

## 2. On-page engine (generated, never hand-maintained)

Build-time, from data, for every page:

- `<title>` ≤ 60 chars, primary keyword first, brand last:
  "Custom Hotel Tote Bags & Resort Totes | HL Supply".
- Meta description ≤ 155 chars, written per category/product (add `metaTitle`
  / `metaDescription` fields to the data; generate defaults, hand-tune the top 15).
- One H1 per page = primary keyword phrase; semantic heading hierarchy; real
  `<main>`, `<nav>`, `<article>`, breadcrumb `<nav>` markup.
- Canonical URL, OG + Twitter card tags, favicon set, `theme-color`.
- Descriptive `alt` text generated from each product's `imageLabel` (already a
  perfect photo description) — this also pre-wires the real photography.
- Internal-link mesh: breadcrumbs (exists), related products (exists), category
  ↔ guide cross-links, footer links to all categories. Target: every page ≤ 2
  clicks from home; every product page receives ≥ 3 internal links.

## 3. Structured data (JSON-LD on every page)

- Site-wide: `Organization` (logo, sameAs, contactPoint) + `WebSite`.
- Category pages: `CollectionPage` + `ItemList` of products + `BreadcrumbList`.
- Product pages: `Product` (name, sku=ref, brand, description, image, material
  from specs) + `BreadcrumbList`. **No `offers` with fake prices** — omit price
  until real pricing exists; when prices land, emit `priceSpecification` per
  tier honestly. Fake data gets rich results revoked.
- Guides: `Article` or `FAQPage` / `HowTo` where the format genuinely matches.
- FAQ blocks on category + key pages: real buyer questions with ~50-word
  definitive answers ("What is the minimum order for custom hotel totes? HL
  Supply's resort totes start at 200 units…"). These are the sentences AI
  engines quote verbatim.

## 4. AI-engine optimization (AEO/GEO — becoming the citable source)

AI assistants cite pages that are crawlable, declarative, and structured:

- `llms.txt` at root: plain-text site guide (what HL Supply is, categories,
  MOQs, customization methods, key URLs) — plus `robots.txt` that explicitly
  ALLOWS GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot. We want to
  be ingested; being in the training/citation set IS the moat.
- Every category/guide opens with a 2–3 sentence **direct answer paragraph**
  (definition + number + differentiator) before the editorial copy — the
  extractable snippet.
- Stat-bait: publish concrete, quotable facts (MOQ tables, lead times,
  tier structures, a glossary with crisp definitions of deboss/emboss/laser
  etch/MOQ/Pantone matching). AI engines love citing the page that defines
  the term.
- Entity building: About page (company, process, expertise — E-E-A-T), a real
  contact page, consistent NAP, `sameAs` to social profiles once they exist.
- Semantic HTML + content present in source (handled by Phase 0) — most AI
  crawlers do not execute JS.

## 5. The content engine (the compounding monster)

Cadence: 2–3 pieces/week, generated by Claude Code from briefs, each mapped to
a keyword-map slot. Streams:

1. **Category buying guides** (7, cornerstone, 1,500–2,500 words):
   "Custom Hotel Tote Bags: The Complete Buyer's Guide" — covers materials,
   MOQs, logo methods, timelines, costs framework, FAQ block; links to every
   product in the category.
2. **Comparison pages**: embroidery vs debossing, canvas vs woven, 350ml vs
   500ml bottles — high AI-citation formats.
3. **Use-case pages** (see §1) — commercial intent by vertical.
4. **Glossary** (/glossary/) — 30+ terms, one anchor each.
5. **Programmatic long-tail** (later, carefully): "custom [product type] for
   [property type]" pages ONLY where copy is genuinely differentiated — thin
   doorway pages get the whole site punished. Quality gate: every programmatic
   page must contain ≥ 3 facts unique to that combination or it doesn't ship.

Every piece ends with a soft CTA into a category or the concierge. Every piece
gets an entry in the sitemap, internal links from and to it, and schema.

## 6. Performance & Core Web Vitals (ranking + conversion)

- Budget: LCP < 1.8s, CLS < 0.05, INP < 200ms, Lighthouse ≥ 95 across the board.
- Inline critical CSS per template; defer the rest. Self-host the two fonts
  with `font-display: swap` + preload (removes Google Fonts round-trips).
- JS audit: catalog pages need far less JS once pre-rendered — ship per-page
  bundles, defer everything.
- Image pipeline ready for photography day: AVIF/WebP + srcset + lazy-loading
  below the fold + width/height attributes (CLS). The placeholder caption
  becomes the alt text.
- Host on a global CDN (Cloudflare Pages) — TTFB solved for free.

## 7. Infrastructure & indexing

- `sitemap.xml` generated by build.js (all indexable routes, lastmod).
- `robots.txt` (allow all + AI bots; disallow /quote/).
- 404 page on-brand; trailing-slash + www/non-www canonical policy; HTTPS.
- Google Search Console + Bing Webmaster verified; sitemap submitted;
  **IndexNow** key installed so Bing/others index new content within minutes.
- Analytics: Plausible or GA4 (owner's choice; Plausible = zero cookie banner).
- Git tags per release; CHANGELOG.md.

## 8. The measurement loop (reverse-engineering, monthly)

A `docs/SEO-LOG.md` ledger, updated monthly by a Claude Code session
("run the monthly SEO review"):

1. Pull GSC data (CSV export by Paul, 2 min, or API later): queries, pages,
   CTR, position.
2. Classify: **strike-distance** (pos 5–20 → strengthen page + add internal
   links), **CTR laggards** (impressions high, CTR low → rewrite title/meta),
   **new query clusters** (demand we don't have a page for → add to keyword
   map → next content cycle), **decay** (refresh content).
3. Ship the fixes in the same session. Log before/after.

Deeper research (keyword volumes, competitor gaps, SERP analysis) runs in the
claude.ai project chat with the HarborRank skills; conclusions get committed to
`docs/KEYWORD-MAP.md` for Claude Code to execute against.

## 9. What we will NOT do (protect the domain)

No bought links, no PBNs, no spun/thin programmatic pages, no fake reviews or
schema, no keyword stuffing, no AI-sludge published unedited (every piece gets
one human-voice pass constraint in the brief), no doorway pages, no cloaking.
The brand voice (Riviera, editorial, calm) IS the differentiation signal —
generic supplier copy is what everyone else has.

## Success metrics

- 30 days: 60+ pages indexed, GSC verified, CWV green, first impressions.
- 90 days: ranking page 1–3 for ≥ 10 long-tail terms; first AI-engine citation;
  500+ organic impressions/day.
- 12 months: page 1 for ≥ 3 category head terms; cited by name in AI answers
  for "custom hotel amenities / totes / slippers"; organic = primary lead source.
