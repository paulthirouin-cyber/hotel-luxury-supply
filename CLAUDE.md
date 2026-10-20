# HL Supply — Project Instructions for Claude Code

HL Supply is a bespoke product atelier for luxury hospitality (hotels, resorts,
private clubs, beach clubs, golf properties, spas, destination events). It sells
custom branded guest goods: bags, hats, bottles, flip-flops, leather goods,
slippers, accessories. B2B quote-based sales — **never** ecommerce checkout.

The owner (Paul) is non-technical and busy with customers. He drives this repo
with one-line prompts. **When he says "run the roadmap" / "continue the
roadmap" (or similar), open `docs/ROADMAP.md` and execute unchecked phases
continuously, in order, without asking for new input between phases** — each
phase: implement, pass all tests, check off with a dated note, commit, push
`dev`, proceed to the next. Stop ONLY at the roadmap's defined blockers
(ASK PAUL items, steps only Paul can click, or an unfixable failing test);
never to ask "shall I continue?". Reversible decisions: decide yourself and
log them in the roadmap's Decision log.

## Mission

Launch fast, then engineer this site to dominate organic search and AI-engine
answers ("the standard on the internet for these products"). The strategy is in
`docs/SEO-MASTER-PLAN.md` — read it before any SEO/content phase. Everything is
reverse-engineered for compounding organic growth, MrBeast-style: every page has
a job, every job is measured, and measurements feed the next content cycle.

## Current state (v8 — feature-complete prototype, pre-SEO)

Static site, zero frameworks, zero build step, vanilla JS + CSS. All verified by
seven automated jsdom test suites (rebuild them if missing — see Testing).

- `index.html` — homepage: header, hero, Guest Journey (scroll-driven, 5 scenes),
  Explore the Atelier (7 category cards), lifestyle statement, collections,
  client logos, process, concierge CTA, footer, floating concierge bell + drawer,
  mobile menu. **Homepage is lifestyle-only: no pricing, MOQs, SKUs, or quote UI. Ever.**
- `products.html` — hash-routed catalog SPA:
  - `#/products` landing (7 categories)
  - `#/products/:category` (7 pages) — product cards WITHOUT pricing
    (image, type, name, description, MOQ, customization, View Details only)
    + per-category bespoke CTA
  - `#/products/:category/:slug` (39 product pages) — gallery, specs, ref,
    4-tier Quantity Pricing, quantity selector w/ active-tier highlight +
    MOQ warning, Add to Quote, Make It Bespoke drawer, Request Mockup drawer
    (logo required), related products
  - `#/quote` — Quote Cart: line items, summary, Project Details (gates the
    Instant Quote PDF, ref `HLQ-YYYY-NNNN`), logo upload (gates Submit to
    Concierge), printable quote document, success state
  - `#/bespoke` (+ `?category=` / `?product=` prefill) — Bespoke Atelier page,
    form, ref `HLB-YYYY-NNNN`
- `category.html` / `product.html` — legacy redirect stubs to hash routes.
- Data: `js/products.js` (39 products, factory-generated: ref, slug, type,
  tiers×4 with `price: null` → "$--", customization, specifications, imageLabel,
  gallery), `js/categories.js` (7 categories + homepage + catalog copy).
- Logic: `js/pricing.js` (tier resolution — lower qualifying tier),
  `js/catalog.js` (router + renderers + self-contained nav interception),
  `js/quote-store.js`, `js/quote-page.js`, `js/quote-pdf.js`,
  `js/bespoke-page.js`, `js/bespoke-drawers.js`.
- Images: real catalog photography is integrated. `assets/catalog/` holds the
  39 alpha-trimmed product cutouts (`<slug>.webp`, rendered contained on a
  softened tint via `.ph--photo`) and 7 lifestyle category heroes
  (`cat-<slug>.jpg`, rendered full-bleed via `.ph--cover`), all extracted from
  the official catalog PDF. The homepage hero and lifestyle statement use
  lifestyle shots; Guest Journey scenes and collections still use designed
  tint placeholders until dedicated photography exists. Product data/copy
  source of truth: HL Supply Product Catalog 2025-2026 + `docs/BRAND-BRIEF.md`
  (the company brief — use its voice and its essence line for About/content:
  "We don't simply put hotel names on products. We help hotels create products
  worthy of carrying their names.").

## Brand system (non-negotiable)

- Palette: warm ivory `#f6f1e6`, cream `#fcf9f2`, deep navy `#1b2a41`, resort
  green `#3f5c4f`, pool blue `#7fb3c1`, canvas beige `#e7ddc6`, terracotta
  `#c47e5d`, muted chrome `#9aa3a8`. CSS vars in `css/styles.css`.
  No gold, no black-and-gold, no bright gradients, no cartoons.
- Type: Marcellus (display serif) + Jost (body sans), Google Fonts.
- Voice: French Riviera, yacht club, hotel stationery. Editorial, calm.
- Language: Quote Cart, Project Selections, Add to Quote, Submit to Concierge,
  Request Mockup, Bespoke. **Never:** Buy Now, Add to Cart, Checkout, Payment,
  sale/discount language, swag, merch, fake reviews, fake client names.
- Pricing stays `$--` / "Estimate pending" until Paul supplies real numbers in
  `js/products.js` (then everything calculates automatically).

## Hard-won engineering rules (bugs we already paid for)

1. `[hidden] { display:none !important; }` global guard exists in styles.css —
   never create a fixed full-screen layer hidden only by the `hidden` attribute.
2. Interactive state updates must be **scoped to their container** (see
   `scopeFor()` in catalog.js) — duplicate slugs must never coexist in the DOM
   (views are cleared on route change).
3. Navigation never depends on `location.hash` being writable (sandboxed
   iframes reject it) — the router accepts explicit route strings.
4. Every suite must pass before any commit: routing, links (validates every
   href on every rendered view), overlay regression (hit-test class of bugs),
   preview click-through, user flow, quote E2E, bespoke E2E.

## Testing

`npm test` runs the jsdom suites in `tests/` (`site.test.js` +
`flows.test.js`): data integrity against the catalog, every view rendered,
1,500+ link audit, image existence + alt text, pricing/tier interactions,
quote and bespoke E2E, and a sandbox click-through of the built preview
(`npm run build:preview` first). **No phase is complete until all suites
pass.** Add a regression test for every bug fixed.

## Company facts (from the catalog & brief — use everywhere relevant)

- Domain: **hotelluxurysupply.com** · Email: info@hotelluxurysupply.com ·
  Phone: +1 (347) 669-4417. Footer and quote documents already carry these.
- Clientele: five-star resorts, luxury hotel groups, independent and boutique
  luxury properties. Positioning: bespoke product design & development, not a
  merchandise supplier; the catalog is "a starting point for inspiration."

## Branching & publish discipline (IMPORTANT)

Two lanes, enforced always:
- **`dev`** — ALL work happens here. Every roadmap phase, content piece, fix,
  and experiment is committed and pushed to `dev`. Cloudflare Pages builds a
  preview URL per push (branch alias: dev.<project>.pages.dev) where Paul
  reviews work-in-progress.
- **`main`** — the live site. **Never commit to or merge into `main` unless
  Paul explicitly says to publish** (words like "publish", "go live", "push
  to live", "release"). When he does: verify `npm test` is green on `dev`,
  merge `dev` into `main` (no squash needed), push, confirm the production
  deploy, and tag the release. If a session somehow starts on `main`, switch
  to `dev` before changing anything.

"Continue the roadmap" therefore always means: work on `dev`, push `dev`,
report the preview URL. Publishing is a separate, explicit instruction.

## Deployment model (target)

GitHub repo → Cloudflare Pages (or Netlify) auto-deploy on push to `main`.
After Phase 0 (static pre-rendering), the deployed site is plain HTML files —
no server, no build service required beyond running `node build.js`.
Claude Code runs the build, tests, commit, and push; "deploy" = `git push`.
