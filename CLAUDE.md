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

## Current state (v1.0.0-rc — static site + content engine, pre-launch)

Zero frameworks. Source files are a hash-routed SPA (`index.html`,
`products.html`, `js/`, `css/`); **`node build.js` pre-renders every route
into `dist/`** (76 pages, 72 indexable) by running the same renderers in
jsdom under `<html data-static>`. Cloudflare Pages builds `dist/` from
`main` (production) and `dev` (preview). `npm test` = build + preview +
three jsdom suites (site, flows, dist); `npm run lighthouse` enforces ≥ 95.

- URLs: `/`, `/products/`, `/products/:cat/` ×7, `/products/:cat/:slug/` ×39,
  `/bespoke/`, `/quote/` (noindex), `/about/`, `/process/`, `/contact/`,
  `/privacy/` + `/terms/` (noindex placeholders), `/guides/` + 12 guides
  (7 buying guides, 5 comparisons), `/for/` + 5 program pages, `/glossary/`,
  `/404.html`, legacy `.html` shims, `sitemap.xml`, `robots.txt`, `llms.txt`,
  `_headers`, `_redirects`, IndexNow key file.
- `js/routes.js` (load first): `HLRoutes.href("#/products/hats")` emits hash
  routes in SPA/preview mode and clean URLs in static mode. Never hard-code
  `products.html#/…` in renderers.
- Pre-rendered views carry `data-prerendered`; client JS hydrates only
  (catalog.js, bespoke-page.js, pages.js). `/quote/` renders client-side.
- Trust pages live in `js/pages.js` (registry: path, meta, schemaType,
  render). Content pages live in `content/guides/*.md`, `content/for/*.md`,
  `content/glossary.json` and are rendered by `scripts/content.js` +
  `scripts/markdown.js` (front matter; link shorthands `product:` `category:`
  `guide:` `for:` `glossary:` `page:`; unknown targets fail the build).
- SEO: `scripts/seo.js` (JSON-LD graphs, sitemap, robots, llms.txt);
  `scripts/perf.js` (inline minified CSS, self-hosted fonts in `assets/fonts/`,
  deferred JS, image dimensions, eager LCP image). Meta fields: `metaTitle`,
  `metaDescription`, `keywords`, `directAnswer`, `faqs`, `guide` on categories;
  generated defaults on products.
- Leads: every form calls `HLLeads.send(type, payload)` → POST `/api/lead`
  (`functions/api/lead.js`, Resend; env vars pending Paul) + local outbox.
- Config: `config/site.json` (analytics gate, verification tags),
  `config/indexnow.key`. Paul's click-steps: `docs/LAUNCH-CHECKLIST.md`.
  Keyword map: `docs/KEYWORD-MAP.md`. Decisions: `docs/ROADMAP.md` log.
- Images: `assets/catalog/` holds 39 alpha-trimmed cutouts (`<slug>.webp`)
  and 7 lifestyle heroes (`cat-<slug>.jpg`) from the catalog PDF; Guest
  Journey and collection cards still use tint placeholders. Product copy
  source of truth: HL Supply Product Catalog 2025-2026 + `docs/BRAND-BRIEF.md`
  (essence line: "We don't simply put hotel names on products. We help
  hotels create products worthy of carrying their names.").
- **Homepage is lifestyle-only: no pricing, MOQs, SKUs, or quote UI. Ever.**
- Pricing stays `$--` / "Estimate pending" until Paul supplies numbers in
  `js/products.js`; schema deliberately has no `offers` until then.

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

`npm test` builds `dist/` and the single-file preview, then runs the jsdom
suites in `tests/`: `site.test.js` (data integrity, every SPA view, 1,500+
link audit, pricing/tier interactions, info pages), `flows.test.js` (quote,
bespoke, drawer and preview click-throughs, lead POST payloads) and
`dist.test.js` (every URL exists, per-page SEO head, JSON-LD, sitemap/robots/
llms, performance invariants, hydration without re-render, content pages,
inbound-link mesh, orphan crawl). `npm run lighthouse` audits dist/ with a
≥ 95 budget (needs Chrome; not part of `npm test`). **No phase is complete
until all suites pass.** Add a regression test for every bug fixed.

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

## Deployment model

GitHub repo → Cloudflare Pages (build command `node build.js`, output `dist`,
production branch `main`, preview branches all). The deployed site is plain
HTML plus one Pages Function (`functions/api/lead.js`). Claude Code runs the
build, tests, commit, and push; "deploy" = `git push`. After a publish to
`main`: tag the release and run `npm run indexnow`.
