# Launch checklist — Paul's clicks

Everything Claude Code can do is done and tested on `dev`. The items below
are the ones only you can click. Each is 5–15 minutes. Do them in order;
tell Claude Code "continue the roadmap" after each and it verifies.

Two lanes, always: **`dev`** = the building site you review, **`main`** =
the live site. Nothing reaches `main` until you say "publish to live".

---

## 1. Connect the repo to Cloudflare Pages (one time, ~15 min)

1. Go to https://dash.cloudflare.com → sign in (create a free account if needed).
2. Left menu → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Authorize GitHub, choose **paulthirouin-cyber/hotel-luxury-supply**.
4. Set up builds and deployments:
   - Project name: `hotel-luxury-supply` (this becomes `hotel-luxury-supply.pages.dev`)
   - Production branch: **`main`**
   - Framework preset: **None**
   - Build command: **`node build.js`**
   - Build output directory: **`dist`**
   - Root directory: leave blank
5. Click **Save and Deploy**. The first build takes ~1 minute.
6. Then **Settings → Builds & deployments → Preview deployments**: choose
   **All branches** (so `dev` gets its own URL).
7. Push nothing — Claude Code already pushes `dev`. Your two URLs:
   - Live lane: `https://hotel-luxury-supply.pages.dev` (updates only on publish)
   - Review lane: `https://dev.hotel-luxury-supply.pages.dev` (updates on every `dev` push)

Optional, recommended: **Settings → General → Access policy → Enable** to
password-protect the preview URLs so only you see work in progress.

## 2. Lead emails (Resend, free tier, ~10 min)

Forms already post to `/api/lead` (a Cloudflare Pages Function). To make it
email you:

1. https://resend.com → sign up (free: 3,000 emails/month).
2. **Domains → Add domain** → `hotelluxurysupply.com` → add the DNS records it
   shows (in Cloudflare DNS once the domain is there, or at your current
   registrar). Until the domain is verified you can still test with the
   default `onboarding@resend.dev` sender.
3. **API Keys → Create** → copy the key.
4. Cloudflare → your Pages project → **Settings → Environment variables →
   Production** (and **Preview**): add
   - `RESEND_API_KEY` = the key
   - `LEAD_TO` = `info@hotelluxurysupply.com` (or any inbox; comma-separate for several)
   - `LEAD_FROM` = `HL Supply Concierge <concierge@hotelluxurysupply.com>` (after domain verification; before that leave unset)
5. Redeploy (Deployments → ⋯ → Retry) and send a test from `/contact/`.

**Decision needed from you:** which inbox should receive leads? Default is
info@hotelluxurysupply.com.

## 3. Domain cutover (Phase 6.1, only when you say "go live")

Custom domains attach to the **production** deployment (`main`). `dev`
previews stay on pages.dev.

Option A — move DNS to Cloudflare (recommended, free, fastest site):
1. Cloudflare dashboard → **Add a site** → `hotelluxurysupply.com` → Free plan.
2. Cloudflare shows two nameservers (e.g. `xxx.ns.cloudflare.com`). At your
   current registrar, replace the nameservers with those two. Propagation: minutes to 24 h.
3. Pages project → **Custom domains → Set up a custom domain** → `hotelluxurysupply.com`
   → Cloudflare adds the records automatically. Add `www.hotelluxurysupply.com` too
   (it redirects to the apex).

Option B — keep DNS at the registrar:
1. Pages project → **Custom domains → Set up a custom domain** → `hotelluxurysupply.com`.
2. At the registrar add: `CNAME  @  hotel-luxury-supply.pages.dev` (if the registrar
   refuses a CNAME on `@`, use its ALIAS/ANAME record) and
   `CNAME  www  hotel-luxury-supply.pages.dev`.
3. Wait for the Pages dashboard to show the domain as **Active** (SSL is automatic).

Keep any existing **MX** records (email) exactly as they are.

## 4. Search Console + Bing + IndexNow (Phase 6.2, ~15 min, after the domain is live)

Google Search Console:
1. https://search.google.com/search-console → **Add property** → **Domain** →
   `hotelluxurysupply.com`.
2. Google shows a TXT record like `google-site-verification=abc123…`. Add it in
   Cloudflare DNS (or the registrar): **TXT  @  google-site-verification=…**.
3. Click **Verify**. Then **Sitemaps → Add** `https://hotelluxurysupply.com/sitemap.xml`.

Bing Webmaster Tools:
1. https://www.bing.com/webmasters → **Add site** → easiest: **Import from Google
   Search Console** (one click, no DNS). Otherwise choose DNS verification and
   add the TXT record it shows.
2. Sitemap is imported automatically; if not, **Sitemaps → Submit** the same URL.

IndexNow (already installed): the key is in `config/indexnow.key` and the build
publishes it at `https://hotelluxurysupply.com/<key>.txt`. After each publish
Claude Code runs `npm run indexnow` to notify Bing/Yandex instantly. Nothing to click.

## 5. Analytics (Phase 6.3)

Default is Plausible (no cookie banner needed, ~$9/month):
1. https://plausible.io → sign up → **Add website** → `hotelluxurysupply.com`.
2. Tell Claude Code: "enable Plausible" — it flips `config/site.json` →
   `analytics.enabled: true` and the snippet ships on every page.

Prefer Google Analytics 4 (free, needs a cookie notice)? Tell Claude Code
"use GA4 with G-XXXXXXX" and it switches the snippet.

## 6. Move the repo out of OneDrive (optional, recommended, 5 min)

OneDrive and Git fight over file locks, and OneDrive syncs `node_modules`.
GitHub is your backup, not OneDrive.

PowerShell, one line at a time:
```
robocopy "C:\Users\hlsup\OneDrive\Documents\hotel-luxury-supply" "C:\Users\hlsup\Projects\hotel-luxury-supply" /E /XD node_modules dist dist-preview dist-reports
cd C:\Users\hlsup\Projects\hotel-luxury-supply
npm install
npm test
```
Then open Claude Code from the new folder and delete the OneDrive copy once
`npm test` is green there.

## 7. Publishing

When the review lane looks right: tell Claude Code **"publish to live"**.
It merges `dev` → `main`, pushes, waits for the production deploy, tags the
release, and runs IndexNow. The custom domain (step 3) decides whether
"live" means pages.dev or hotelluxurysupply.com.
