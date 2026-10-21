# HL Supply — Build Roadmap (executed by Claude Code)

**Standing instruction — CONTINUOUS MODE:** when Paul says "run the roadmap"
(or "continue the roadmap", or similar), execute unchecked phases below IN
ORDER, one after another, WITHOUT waiting for new input between phases. For
each phase: implement → run ALL test suites → update this file (check the
box, add a one-line dated note of what shipped and any decisions made) →
commit with a descriptive message → push `dev`. Then immediately start the
next phase. Keep going until you hit a TRUE blocker, meaning only:
  (a) an item explicitly marked **ASK PAUL**,
  (b) a step only Paul can physically do (Cloudflare/DNS/account clicks —
      then print his exact click-by-click instructions, continue any phases
      that don't depend on it, and only stop when nothing else can proceed),
  (c) a failing test you cannot fix after honest attempts.
Never stop just to report progress or ask "shall I continue?" — the answer
is always yes. For decisions that are reversible, decide yourself and log it
in the Decision log. When you do stop, summarize everything completed, list
exactly what you need from Paul, and say that "continue the roadmap" resumes
from the next unchecked item. This file is the single source of progress —
any new session reads it and knows precisely where things stand.
Strategy context: `docs/SEO-MASTER-PLAN.md`. Project rules: `CLAUDE.md`.

---

## Phase 0 — Repo, tests, and deploy pipeline
- [x] 0.1 The GitHub repo already exists: **hotel-luxury-supply**, cloned at
      `C:\Users\hlsup\OneDrive\Documents\hotel-luxury-supply`. All site
      files were placed directly into the clone on 2026-10-19 (the stub index
      was replaced). First session: run `npm install` + `npm test`, then
      `git add -A`, commit everything, push to origin `main` ONCE as the
      baseline, then immediately create and switch to a **`dev`** branch and
      push it. From here on, all work lives on `dev` (see CLAUDE.md
      "Branching & publish discipline"); `main` changes only when Paul says
      "publish to live".
      **OneDrive caveat:** a git repo under OneDrive causes sync/lock trouble
      (especially `.git` and `node_modules`). Recommend to Paul moving the
      clone to `C:\Users\hlsup\Projects\hotel-luxury-supply` (print exact
      GitHub Desktop or robocopy steps and offer to do it); GitHub is the
      backup, not OneDrive. Proceed either way if he declines.
      ✔ 2026-10-20: Node 24 LTS installed (was missing on this PC), npm install + all suites green, baseline committed to main (4a7481b), `dev` created and pushed. OneDrive move recommended to Paul (steps in session summary); proceeding in place.
- [x] 0.2 Test suites live in `tests/` (`site.test.js`: data integrity, catalog
      imagery, all 48 views, 1,500+ link audit, pricing interactions, routing,
      not-found, overlay guard; `flows.test.js`: quote E2E, bespoke E2E, preview
      sandbox click-through). All green. *(Pre-built 2026-10-19 during catalog
      integration; keep extending with a regression test per bug.)*
- [x] 0.3 Verify `git remote -v` points at the existing GitHub repo. Print
      the exact Cloudflare Pages connection steps for Paul (one-time, ~15 min):
      production branch **`main`**, preview branches **all** (so `dev` gets
      its own URL), for now NO build command, output directory `/`. Tell Paul
      his two URLs: `<project>.pages.dev` = live lane (only updates on
      publish), `dev.<project>.pages.dev` = the building site he reviews.
      Optional, offer it: protect preview URLs with Cloudflare Access so only
      he can view them. (Phase 1 switches Pages to build command
      `node build.js`, output `dist/`.)
      ✔ 2026-10-20: remote verified (github.com/paulthirouin-cyber/hotel-luxury-supply). Cloudflare Pages click-steps printed for Paul with build `node build.js`, output `dist` (Phase 1 already landed, so the no-build interim is skipped). PAUL ACTION PENDING: connect Pages.
      ◻ 2026-10-20 PAUL: connect Cloudflare Pages — exact clicks in `docs/LAUNCH-CHECKLIST.md` §1 (build `node build.js`, output `dist`, preview branches = all). Blocks the preview URL.

      ✔ 2026-10-21: Cloudflare Pages is connected — `hotel-luxury-supply.pages.dev` (live lane, baseline only) and `dev.hotel-luxury-supply.pages.dev` (review lane) both resolve. Every push to `dev` now rebuilds the preview.
## Phase 1 — Static pre-rendering (THE SEO unlock)
- [x] 1.1 `build.js`: generate real URLs into `dist/` from the data files:
      `/`, `/products/`, 7× `/products/:cat/`, 39× `/products/:cat/:slug/`,
      `/bespoke/`, `/quote/` (noindex), `/404.html`. Full content in HTML
      source; existing JS hydrates interactivity (quantity, tiers, quote,
      drawers, menus) on top without re-rendering what's already there.
      ✔ 2026-10-20: `build.js` renders 51 pages into dist/ (49 indexable) by running the browser renderers in jsdom under `<html data-static>`; views carry `data-prerendered` and catalog.js / bespoke-page.js hydrate without re-rendering.
- [x] 1.2 Shared head partial: per-page title/meta/canonical/OG from new
      `metaTitle`/`metaDescription`/`keywords` fields added to
      `js/categories.js` and `js/products.js` (generate sensible defaults).
      ✔ 2026-10-20: `metaTitle` / `metaDescription` / `keywords` added to all 7 categories (hand-written) and generated for 39 products; build emits title, description, keywords, canonical, OG/Twitter, theme-color; /quote/ and /404.html are noindex.
- [x] 1.3 Clean-URL internal links everywhere; hash-route redirect shim for
      old links; `category.html`/`product.html` stubs redirect to clean URLs.
      ✔ 2026-10-20: new `js/routes.js` (HLRoutes) emits hash routes in SPA/preview mode and clean URLs in static mode; every renderer uses it. Hash shim (`/#/...` → clean URL) plus dist shims for products.html / category.html / product.html.
- [x] 1.4 Port the test suites to run against `dist/` (every URL exists, every
      link resolves, every interactive flow still passes). All green.
      ✔ 2026-10-20: `tests/dist.test.js` — all URLs exist, per-page SEO head, 1,409 links + images resolve, content in source, hydration without re-render, quote cart from storage, bespoke prefill via ?query, legacy redirects. `npm test` = build + preview + 3 suites. ALL GREEN.

## Phase 2 — Technical SEO layer
- [x] 2.1 JSON-LD: Organization + WebSite (all pages), CollectionPage+ItemList+
      BreadcrumbList (categories), Product+BreadcrumbList (products — NO fake
      prices). Validate with a schema test in the suite.
      ✔ 2026-10-20: `scripts/seo.js` emits one JSON-LD @graph per page: Organization + WebSite everywhere; CollectionPage + ItemList + BreadcrumbList (landing, categories); Product (sku=ref, brand, material, MOQ property, NO offers) + ItemPage + BreadcrumbList (products); FAQPage (categories, bespoke). Dist suite validates every block, breadcrumb and list URL, and asserts no price keys.
- [x] 2.2 `sitemap.xml` + `robots.txt` (allow GPTBot, ClaudeBot, PerplexityBot,
      Google-Extended, CCBot; disallow /quote/) + `llms.txt` generated by build.
      ✔ 2026-10-20: build writes `sitemap.xml` (49 indexable URLs, lastmod), `robots.txt` (allow all + GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot/OAI-SearchBot…, disallow /quote/, Sitemap line) and `llms.txt` (company essence, key facts, every category + product URL with ref/MOQ/customization).
- [x] 2.3 FAQ blocks (4–6 real buyer Q&As, FAQPage schema) on all 7 category
      pages + /bespoke/; direct-answer opening paragraph on each category page.
      ✔ 2026-10-20: 5–6 verified-fact FAQs + a direct-answer paragraph per category in `js/categories.js` (rendered by catalog.js above the grid / in a FAQ section), 6 bespoke FAQs in `bespoke-page.js`; FAQPage schema text is asserted equal to the visible text. Category pages also gained a keyword h2 ("Custom hats for hotels, resorts, and clubs").
- [x] 2.4 Performance pass: self-host fonts (swap+preload), inline critical
      CSS per template, defer JS, width/height on media. Add a Lighthouse CI
      check; budget: Perf/SEO/A11y/Best ≥ 95.
      ✔ 2026-10-20: self-hosted Marcellus + Jost variable (woff2, swap, preloaded), all CSS inlined + minified per page, scripts deferred, width/height on every image, LCP image eager + fetchpriority=high, SVG favicon, WCAG-AA text tones (`--chrome-text`, `--terracotta-text`), heading order fixed. `npm run lighthouse` (scripts/lighthouse.js + gzip static server) budget ≥95: home 99/100/100/100, catalog 100/100/100/100, category 95/100/100/100, product 97/96/100/100, bespoke 100/100/100/100 (mobile).

## Phase 3 — Trust & entity pages (E-E-A-T)
- [x] 3.1 `/about/` — the atelier story, process, expertise (brand voice).
      ✔ 2026-10-20: `/about/` written from docs/BRAND-BRIEF.md (who we are, philosophy, catalog-as-starting-point, approach to luxury, value, how we work) with the essence line as a pull quote; AboutPage schema. Lives in `js/pages.js` with the other trust pages.
- [x] 3.2 `/contact/` — concierge contact page (reuse drawer form inline).
      ✔ 2026-10-20: `/contact/` with NAP block (email, phone, domain), what-to-include list, inline concierge form (honeypot, validation, success state) posting through `js/leads.js`; ContactPage schema. Homepage keeps the bell drawer, which now also posts leads.
- [x] 3.3 `/process/` — Select → Customize → Produce expanded with timelines.
      ✔ 2026-10-20: `/process/` — Select → Customize → Produce → Deliver with roles per step, a milestone/timing table (4–6 weeks after proof approval), minimums + tiers paragraph and a direct-answer opener.
- [x] 3.4 Footer/legal: privacy + terms placeholders, NAP block, copyright.
      ✔ 2026-10-20: footer on every page links Products / Bespoke / Process / About / Contact / Collections, carries the NAP line (© HL Supply · hotelluxurysupply.com, email, phone) and Privacy / Terms (plain-language placeholders at `/privacy/`, `/terms/`, noindex until counsel text lands). Header nav is now Products · Bespoke · Process · About · Concierge.
- [x] 3.5 Wire all forms (concierge, quote submit, bespoke, mockup) to a real
      endpoint: Cloudflare Pages Function or Formspree → email to Paul.
      ASK PAUL: which email receives leads. Store submissions as before too.
      ✔ 2026-10-20: all five forms (contact, concierge bell, quote submit, bespoke, mockup) call `HLLeads.send()` → POST `/api/lead` (Cloudflare Pages Function `functions/api/lead.js`, honeypot + validation, emails via Resend) and mirror to a local outbox; the UX never waits on the network. Tests assert the POST payload for each form. **ASK PAUL (not blocking the build):** which inbox receives leads (default info@hotelluxurysupply.com) and create a free resend.com key → set `RESEND_API_KEY`, `LEAD_TO`, `LEAD_FROM` in Pages → Settings → Environment variables. Until then the endpoint answers 202 and nothing is emailed.
      ◻ 2026-10-20 PAUL: create Resend key + set `RESEND_API_KEY`, `LEAD_TO`, `LEAD_FROM` in Pages env vars — `docs/LAUNCH-CHECKLIST.md` §2. Until then /api/lead answers 202 and nothing is emailed.

## Phase 4 — Content engine, wave 1 (cornerstones)
- [x] 4.1 `/guides/` template + index page, Article schema, build integration.
      ✔ 2026-10-20: content engine = `scripts/markdown.js` (front matter, headings, lists, tables, quotes, internal link shorthands `product:` `category:` `guide:` `glossary:` `page:`, glossary auto-linking) + `scripts/content.js` (guide template with breadcrumb, meta, reading time, sticky TOC, direct answer, product grid for the whole category, related guides; guides index; glossary). `/guides/` index + Article/FAQPage/BreadcrumbList schema; unknown internal links fail the build.
- [x] 4.2 Write the 7 category buying guides (1,500–2,500 words each, brand
      voice, FAQ block, direct-answer intro, links to every category product).
      ✔ 2026-10-20: seven buying guides in `content/guides/*.md` (bags, hats, bottles, flip-flops, leather goods, slippers, accessories), each ≥ 1,400 body words (Article wordCount asserted), brand voice, direct-answer intro, comparison table, brief-writing + common-mistakes sections, 6 FAQs, links to every product in the category, the category, the glossary, and the Bespoke Atelier. Facts drawn only from `js/products.js`.
- [x] 4.3 `/glossary/` with 30+ hospitality-customization terms.
      ✔ 2026-10-20: `/glossary/` with 47 terms in `content/glossary.json` (MOQ, tiers, proof, mockup, embroidery, deboss, emboss, laser etching, Pantone, vector artwork, digitizing, lead time, materials, cap constructions, programs…), alphabetical index, anchor per term, related links resolved against live data, DefinedTermSet schema.
- [x] 4.4 Internal-link mesh pass: category ↔ guide ↔ glossary ↔ products.
      Link-audit test extended to cover all new pages.
      ✔ 2026-10-20: link mesh — category pages link their guide + glossary (`#categoryGuide`), product pages link the category guide, guides link every product/category/glossary/bespoke and auto-link glossary terms (≥ 3 per guide), glossary links products/categories/guides/pages, llms.txt + sitemap include guides and glossary. Dist suite asserts every product page receives ≥ 3 inbound internal links site-wide and every glossary anchor referenced anywhere exists. Lighthouse: guide 99/100/100/100, glossary 100/100/100/100.

## Phase 5 — Content engine, wave 2 (verticals + comparisons)
- [x] 5.1 5 use-case pages: /for/golf-tournaments/, /for/beach-clubs/,
      /for/spa-wellness/, /for/hotel-openings/, /for/corporate-retreats/.
      ✔ 2026-10-20: five use-case pages in `content/for/*.md` → `/for/golf-tournaments/`, `/for/beach-clubs/`, `/for/spa-wellness/`, `/for/hotel-openings/`, `/for/corporate-retreats/` (+ `/for/` index). Each ≥ 900 words, direct-answer opener, `products:` list spanning ≥ 3 categories rendered as cards, timeline table, 5 FAQs, Article + FAQPage + BreadcrumbList schema. Homepage collection cards and the new footer Resources column link them.
- [x] 5.2 5 comparison guides (embroidery vs deboss vs etch; canvas vs woven;
      bottle sizes; slipper materials; tote styles).
      ✔ 2026-10-20: five comparison guides at `/guides/…/` (`type: comparison`): embroidery vs deboss vs laser etching; canvas vs woven leather tote; 350 ml vs 500 ml bottles; slipper materials (terry/waffle/knit/eco); tote styles. Comparison table + FAQs + compared products as cards; guides index now sections buying guides, comparisons, and programs.
- [x] 5.3 Update keyword map from `docs/KEYWORD-MAP.md` if Paul has committed
      research; otherwise proceed with defaults.
      ✔ 2026-10-20: no `docs/KEYWORD-MAP.md` existed, so the default map was written from the catalog + content engine (every live page with P/S keywords, product-page generation rule, next 7 content slots, rules). Research from the claude.ai project gets committed here and the next cycle executes against it.

## Phase 6 — Launch checklist (needs Paul, ~45 min total, guided)
- [ ] 6.1 Domain **hotelluxurysupply.com** (already in use — see catalog back page)
      pointed at Cloudflare Pages — custom domains attach to the PRODUCTION
      (`main`) deployment only; `dev` previews stay on pages.dev. Print exact
      DNS steps for its registrar. Confirm with Paul before cutover — this is
      the one moment the public site changes.
      ◻ 2026-10-20 prepared: DNS cutover steps (Cloudflare nameservers or registrar CNAME/ALIAS) written in `docs/LAUNCH-CHECKLIST.md` §3. PAUL: run them only when saying "go live".
- [ ] 6.2 Google Search Console + Bing Webmaster verified (DNS TXT — print
      exact records); sitemap submitted; IndexNow key generated + installed.
      ◻ 2026-10-20 prepared: IndexNow key generated (`config/indexnow.key`), published by the build at `/<key>.txt`, `npm run indexnow` submits every sitemap URL (run after each publish). GSC/Bing DNS-TXT steps in `docs/LAUNCH-CHECKLIST.md` §4. PAUL: verify both properties + submit the sitemap once the domain is live.
- [ ] 6.3 Analytics installed (Plausible default; ASK PAUL only if he wants GA4).
      ◻ 2026-10-20 prepared: analytics snippet is build-time and gated by `config/site.json` (`analytics.enabled`, provider plausible|ga4; never on noindex pages). PAUL: create the Plausible site (or say "use GA4 with G-…") then "enable Plausible".
- [x] 6.4 Final pre-launch audit: all suites + Lighthouse + schema validation +
      crawl of dist/ for orphans. Tag `v1.0.0`.
      ✔ 2026-10-20: pre-launch audit — all three suites green (76 pages, orphan crawl: every page reachable ≤ 3 clicks from home), JSON-LD validated per page type by the dist suite, `_headers` (security + immutable asset caching), image pipeline (`npm run images`: WebP heroes + 480px card variants with srcset/sizes, sharp as devDependency) brought forward from Phase 7 to clear the budget on image-heavy category pages. Lighthouse on 10 representative pages ≥ 95 (see Decision log). Tagged `v1.0.0-rc.1` on dev; `v1.0.0` is applied at publish.

## Phase 7 — Recurring (after launch; run on request)
- [ ] "run the monthly SEO review" → the §8 measurement loop in the master
      plan: ingest GSC export from `data/gsc/`, classify, fix strike-distance /
      CTR / decay pages, extend keyword map, append to `docs/SEO-LOG.md`.
- [ ] "continue the content calendar" → next 2–3 pieces from the keyword map.
- [ ] Photography day: when real images land in `assets/photos/`, build the
      image pipeline (AVIF/WebP, srcset, lazy, alt from imageLabel) and swap
      placeholders site-wide.
- [ ] Pricing day: when Paul supplies numbers, fill `price` values in
      `js/products.js`; totals/schema update automatically; verify with tests.

---

## Phase 8 — Catalog expansion & repositioning (added 2026-10-21 from the strategy session)

*Business context for every item below: HL Supply is a hotel/resort supplier
first — ROOMS and RETAIL. Golf is property surface (pro shop, member gifts),
never an events vertical. Incentive travel (MICE) is a welcome-inbound,
no-outbound secondary channel. All work on `dev`; keep every suite green and
update ALL count assertions deliberately (products 39→45, categories 7→8).*

- [x] 8.1 **Eighth category: Pets** (slug `pets`, display name "Pets",
      positioned as "The Pet Collection"). Rationale (Paul, 2026-10-21):
      selection filter = merch-type, NO incumbent industry supplier,
      strictly one-size, never clothing. Pets wins on all counts: luxury
      properties now run VIP pet programs with nothing branded behind
      them — no "hotel pet amenities" supplier exists, so HL Supply can
      be first to define the category. Reuses existing methods (laser-
      etched stainless like bottles, debossed vegan leather like trays,
      embroidery/print). Serves both engines: in-room pet program (bowl +
      toy waiting in the room) and boutique retail (guests photograph
      pets in branded gear — organic social from every stay).
      Category data in `js/categories.js` (tagline "Etched Steel &
      Debossed Leather"; line "Bowls, bandanas, and leads made for the
      four-legged guest."; hand-written metaTitle/description; keywords:
      hotel pet amenities, pet friendly hotel supplies, custom dog
      bandana, luxury hotel pet program, branded pet amenities; 5–6 FAQs
      + direct-answer opener per the Phase 2.3 pattern). Six DRAFT
      products in `js/products.js` (flag in a code comment: specs pending
      Paul's sourcing confirmation — adjust freely later; all one-size,
      no beds or collars):
      P-001 The Companion Bowl — laser-etched stainless steel, non-slip
        base, any custom color, MOQ 100 (t100);
      P-002 The Scout Bandana — printed or embroidered, one-size tie
        style, any custom color, MOQ 200 (t200);
      P-003 The Promenade Leash — woven lead with metal hardware and a
        debossed vegan leather handle wrap, MOQ 100 (t100);
      P-004 The Voyager Travel Bowl — foldable, printed logo, MOQ 200
        (t200);
      P-005 The Beacon Waste-Bag Pouch — debossed vegan leather with
        clip, MOQ 100 (t100);
      P-006 The Harbor Rope Toy — custom colors with woven label,
        MOQ 200 (t200).
      No catalog photography exists for these: use the designed tint
      placeholders (the pre-image pattern), add them to the photography-
      day shot list, descriptions in catalog voice with features/specs
      rows matching existing conventions.
      *(Games & Leisure — G-001–G-006 specs preserved in the project
      playbook — is the designated 9th category for a later phase.)*
      ✔ 2026-10-21: `pets` category (The Pet Collection) added to `js/categories.js` with hand-written meta, 5 keywords, direct answer, 6 FAQs, bespoke CTA, guide pairing; six DRAFT pieces P-001–P-006 in `js/products.js` (`noImage: true` → designed tint placeholder; code comment flags specs pending sourcing). Image-less products/categories are now first-class: build meta, JSON-LD (no fake image), preview builder, and all three suites handle them. Bespoke form lists Pets; Guest Journey chips add Pets to Arrival and The Suite. 84 pages (80 indexable), all suites green.
- [x] 8.2 Write the eighth category buying guide (`content/guides/`,
      ≥1,400 words, Phase 4.2 conventions, angled as "building a hotel
      pet program": comparison table — etched steel vs debossed leather
      vs printed textile by use —, in-room program vs retail section,
      brief-writing section, 6 FAQs, links to all six products +
      glossary + bespoke). Pair it in `js/categories.js`. Add pet
      amenity program and any new finishing terms to the glossary.
      ✔ 2026-10-21: `content/guides/custom-hotel-pet-amenities.md` (≈1,650 words): finish comparison table (etched steel vs debossed leather vs printed textile), in-room vs retail section, brief-writing section, common mistakes, 6 FAQs, links to all six pieces + category + glossary + bespoke. Glossary +3 terms (pet amenity program, woven label, powder-coat finish; 50 total).
- [x] 8.3 **Catalog symmetry:** /products/ landing renders the 8 category
      cards as a clean symmetric 4×2 grid; homepage atelier section stays
      editorial (Bags feature card) but balances to 8 cards with no orphan
      row. Guest Journey chips: add "Pets" to the Arrival and The Suite
      scenes (the pet arrival gift and the in-room program are the two
      natural moments).
      ✔ 2026-10-21: /products/ landing is a symmetric 4×2 grid (`.ccard` span-4 tail rule removed; 2-up / 1-up at breakpoints); homepage atelier grid balances 8 cards as feature + 4 small | small + wide + small (slippers small, accessories wide, pets small) — regression test asserts the grid closes with no orphan row.
- [x] 8.4 **Collections layer** (cross-category curation; categories remain
      the single canonical product URL — collections list and link, never
      duplicate pages): `js/collections.js` with five collections —
      poolside, beach-club, spa-suite, golf-club, sports-wellness — each
      with brand-voice intro, buyer framing, and tailored bespoke hook
      (sports-wellness: golf, tennis, fitness, spa; hook offers tennis/
      padel program development). `collections` array field on products.
      Suggested memberships (Claude Code finalizes sensibly): poolside =
      signature-tote, nautical-striped-tote, riviera-bucket-hat,
      essential-flip-flop, pilot-aviator-sunglasses, marquis-bottle;
      beach-club = nomad-drawstring-tote, canvas-flip-flop, impression-
      sand-print-flip-flop, summit-trucker-hat,
      petite-mini-tote; spa-suite = all slippers, solace-sleeping-
      mask, vanity-bathroom-box, hideaway-tissue-box-cover, marquis-
      bottle; golf-club = fairway-golf-cap, regent-classic-cap, heritage-
      dad-hat, canopy-premium-umbrella, wayfarer-luggage-tag, vanguard-
      bottle; sports-wellness = aero-sports-cap, fairway-golf-cap,
      zenith-yoga-mat, vanguard-bottle, nomad-drawstring-tote, clarity-
      lens-cloth. Pet products need no collection membership for now
      (collections are optional per product); a sixth "Pet Program"
      collection can come later if the category earns it. Pages:
      /collections/ index + /collections/<slug>/ pre-rendered like
      categories (CollectionPage + ItemList + BreadcrumbList schema,
      direct-answer opener, product cards without pricing, bespoke CTA).
      Product pages show "Featured in: <collections>" links. Homepage
      collection cards link to the real /collections/ pages now (add a
      Sports & Wellness card; retire the /for/beach-clubs/ stand-in).
      Collection keywords: hotel fitness amenities, resort wellness
      products, golf resort merchandise, hotel spa amenities, hotel pool
      amenities.
      ✔ 2026-10-21: `js/collections.js` holds five collections (poolside, beach-club, spa-suite, golf-club, sports-wellness) with brand-voice intro, buyer framing, direct answer, tailored bespoke hook (sports-wellness offers tennis/padel program development) and memberships; it annotates every product with `collections`. `/collections/` + 5 pages pre-rendered by `catalog.js` (CollectionPage + ItemList + BreadcrumbList, direct-answer opener, product cards without pricing, hook CTA to `/bespoke/?collection=`, which prefills category + notes). Product pages show “Featured in”; category pages list the collections curating them; homepage cards (now 5, 3-up + 2-wide, no orphan) link the real pages and the /for/beach-clubs stand-in is retired; footer “Collections” links the index. Also fixed the duplicated Resources column in the products.html footer. 90 pages (86 indexable), all suites green.
- [ ] 8.5 **/for/ repositioning to match the business:** rename
      /for/golf-tournaments/ → /for/golf-resorts/ (content reframed to
      on-property: pro shop retail, member gifts, amenity program; redirect
      the old URL in dist + sitemap swap); retitle corporate-retreats
      toward "Groups & Retreats at Your Property"; ADD
      /for/incentive-travel/ (incentive travel houses, DMCs, corporate
      event agencies; room drops, welcome gifts; steer copy toward the
      100-MOQ items and the Petite Mini Tote as the room-drop vehicle;
      keywords: incentive trip gifts, room drop gifts, corporate incentive
      travel welcome gifts). Update docs/KEYWORD-MAP.md: tilt primary
      vocabulary to hotel amenities supplier / custom hotel room amenities /
      hotel boutique merchandise + the pet and incentive terms; drop
      tournament-first terms.
- [ ] 8.6 Propagate: sitemap, llms.txt, footer Resources, internal-link
      mesh (each new product ≥3 inbound links; each collection linked from
      homepage + relevant categories), CLAUDE.md + SEO plan count updates
      (8 categories / 45 products / collections layer), extend all suites
      (collections render, memberships link back, redirects work, new
      category passes every category-level assertion). Lighthouse spot-check
      a collection page + the towels category ≥95.

## Phase 9 — Conversion & proof (added 2026-10-21)

- [ ] 9.1 /work/ case-study section: template + index (`content/work/*.md`,
      Article schema, same pipeline), placeholder-free — renders only when
      Paul adds entries; /for/ and collection pages link related work when
      it exists.
- [ ] 9.2 Lookbook lead magnet: generate a lookbook PDF from catalog data at
      build time, gate the download behind an email field wired through
      HLLeads; thank-you state offers the sample kit.
- [ ] 9.3 Plausible custom events: add-to-quote, instant-quote PDF, quote
      submit, bespoke submit, lookbook download (only when analytics
      enabled).
- [ ] 9.4 Auto-reply email on every lead via the existing Pages Function
      ("Your HL Supply request — next steps", same-business-day SLA copy);
      needs the Resend env vars Paul already owes from 3.5.
- [ ] 9.5 Contact page: phone-call CTA + scheduling-link placeholder
      (config-driven so Paul can paste a Calendly URL later).

### Decision log
*(Claude Code appends dated entries here as phases complete.)*

- 2026-10-20 — Static site uses full page loads between routes (no pushState SPA); the hash router remains only for the source files and the single-file preview. Simpler, crawler-identical, keeps the "content in source" guarantee honest.
- 2026-10-20 — Product title default is `Custom <Name> for Hotels | HL Supply` (≤ 60 chars); category titles are hand-written in `js/categories.js`. Hand-tune the top 15 products later from Search Console data.
- 2026-10-20 — Homepage pre-renders the 7 category cards (internal links); the Guest Journey stays JS-rendered because its markup depends on viewport (desktop sticky vs mobile). Revisit if AEO needs that copy in source.
- 2026-10-20 — `/quote/` ships the empty-cart markup and the client renders the real cart from localStorage (user state is never pre-rendered). `jsdom` moved to `dependencies` so Cloudflare Pages can run `node build.js`.
- 2026-10-20 — Line endings normalized via `.gitattributes` (LF in repo) to stop CRLF churn on Windows. Node was installed with winget (OpenJS.NodeJS.LTS).
- 2026-10-20 — Muted chrome `#9aa3a8` and terracotta `#c47e5d` stay the brand palette for surfaces/borders/decor; running text in those hues uses the darker `--chrome-text` / `--terracotta-text` tones so every label passes WCAG AA. Visually the same family, legible on ivory.
- 2026-10-20 — All CSS is inlined per page (≈25 KB gzipped) instead of extracting "critical" CSS: zero render-blocking requests, no FOUC, trivially cacheable by the CDN. Revisit only if page weight becomes a problem.
- 2026-10-20 — Lighthouse is NOT part of `npm test` (needs Chrome, ~1 min/page). It is `npm run lighthouse`, run at the end of each phase that touches templates. Lighthouse CLI is fetched once via `npx --yes lighthouse@12 --version` and found in the npx cache; not a project dependency (keeps Pages installs lean).
- 2026-10-20 — Remaining perf headroom is image delivery (JPEG heroes → WebP/AVIF, product cutouts → srcset). That is the Photography-day image pipeline in Phase 7; the current scores already clear the budget.
- 2026-10-20 — Trust pages are content modules in `js/pages.js` (registry with path/meta/schemaType/render) rendered by the same router and pre-rendered by the same build; adding a page = adding a registry entry. Clients section stays on the homepage but left the nav (placeholder logos are not a destination).
- 2026-10-20 — Lead delivery uses a Pages Function + Resend (MailChannels free tier is gone). Formspree would have worked without code but puts the lead list in a third party; Resend keeps the inbox as the system of record. Switching is a one-file change.
- 2026-10-20 — Legal pages ship as honest plain-language placeholders (noindex) so the footer is complete; counsel text replaces them before Phase 6 cutover.
- 2026-10-20 — Guides and the glossary are build-time content (Markdown + JSON in `content/`), not JS data: they never ship in the client bundle, and future pieces are just new `.md` files with front matter. In SPA/preview mode those routes show a calm pointer to the preview deployment.
- 2026-10-20 — Category ↔ guide pairing is declared in `js/categories.js` (`guide`, `guideTitle`) so the SPA can link guides without loading content; the build verifies every declared guide exists.
- 2026-10-20 — Glossary auto-linking is capped at 12 links per guide and skips headings and existing links, to keep the mesh useful rather than spammy.
- 2026-10-20 — Content collections are folders: `content/guides/` (type guide|comparison) and `content/for/` (type usecase), same Markdown pipeline and template; a page's product grid comes from a `products:` front-matter list when it spans categories. Related cards show same-type pages first, capped at 6.
- 2026-10-20 — Homepage collection cards (Poolside, Beach Club, Spa Suite, Golf & Club) now link to the matching program pages instead of a dead `#collections` anchor; Poolside and Beach Club both go to /for/beach-clubs/ until a dedicated poolside page exists.
- 2026-10-20 — Footer gained a fourth Resources column (guides, glossary, five programs) on every page: the cheapest site-wide inbound links the content engine can get.
- 2026-10-20 — `v1.0.0` is tagged on `main` at the moment Paul says "publish to live"; the pre-launch state on `dev` is `v1.0.0-rc.1` so the audit is pinned without touching the live lane.
- 2026-10-20 — Analytics is Plausible by default, injected at build only when `config/site.json` → `analytics.enabled` is true and never on noindex pages; GA4 is a config switch. Verification meta tags are likewise config-driven, but DNS-TXT verification is the recommended path.
- 2026-10-20 — Image variants are committed to the repo (generated locally with sharp) so Cloudflare's build stays `node build.js` with no native image tooling. Re-run `npm run images` whenever photography lands.
- 2026-10-21 — Draft products without photography carry `image: null` (never a stock or placeholder photo file): the UI shows the designed tint placeholder, the build omits og:image/Product.image rather than emitting a fake one, and tests enforce the placeholder. Photography day replaces them by dropping `<slug>.webp` in `assets/catalog/` and deleting the `noImage` flag.
- 2026-10-21 — The Pet Collection reuses existing finishing methods only (laser etch, deboss, embroidery/print, woven label) and is one-size by rule (no beds, collars, clothing), per Paul's selection filter. Games & Leisure (G-001–G-006) stays parked as the 9th category.
- 2026-10-21 — Collections are JS data (`js/collections.js`), not Markdown: they are rendered by the same `catalog.js` renderer in SPA, preview, and static modes, so a collection works everywhere a category does and never duplicates a product URL. Homepage collection cards stay hand-written in `index.html` (editorial copy); a test asserts one card per collection.
- 2026-10-21 — Pet products carry no collection membership yet; a “Pet Program” collection is added only if the category earns it in Search Console.
