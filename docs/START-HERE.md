# START HERE — Paul's one-page launch guide

Your total hands-on work to launch: **~45–60 minutes, spread over a few days.**
Everything else is one-line prompts to Claude Code while you talk to customers.

## One-time setup (today, ~5 min)

Your repo already exists and **the site files are already inside it**:
`OneDrive\Documents\hotel-luxury-supply` (placed directly from this chat
on Oct 19). Nothing to copy or unzip.

1. Open Terminal (or PowerShell) → `cd` into the repo folder → run `claude`
   (if Claude Code isn't installed: `npm install -g @anthropic-ai/claude-code`,
   requires Node 18+; or use the desktop app which bundles it).
2. Paste the kickoff prompt below. That's it — walk away.

Worth doing when convenient: move the repo OUT of OneDrive (e.g. to
`C:\Users\hlsup\Projects\`). OneDrive and Git fight over file locks and
needlessly syncs `node_modules`; GitHub is already your backup. Claude Code
will offer to handle the move in Phase 0.

## The only prompt you need (paste as your first Claude Code message)

```
run the roadmap
```

That's it. Claude Code reads CLAUDE.md and docs/ROADMAP.md on its own, then
executes phase after phase automatically — build, test, commit, push, next
phase — without asking you for anything between phases. It only stops when
it genuinely needs YOU: the few Cloudflare/DNS clicks (it prints exact
instructions), an "ASK PAUL" decision, or a problem it can't fix. Whenever
it stops or a session ends, typing `continue the roadmap` picks up exactly
where it left off — progress is tracked inside the roadmap file itself.

Early on, Claude Code will show permission prompts for things like running
git and npm — choose the "Yes, allow always" style option each time and it
will stop asking for those.

All building happens on a separate **dev** version of the site with its own
preview link (dev.…pages.dev) — Claude Code gives you the link as it works.
The live site never changes until you type **"publish to live"**, and your
real domain isn't connected at all until Phase 6, when you say so.

## Your four physical tasks (only you can do these)

| When | Task | Time |
|---|---|---|
| Phase 0 asks | Create a free GitHub account (if none) and approve the repo | 5 min |
| Phase 0 prints steps | Connect the repo to Cloudflare Pages (free hosting) | 15 min |
| Phase 6 | Buy the domain (Cloudflare Registrar, at-cost) + click "connect" | 10 min |
| Phase 6 prints records | Verify Google Search Console + Bing (paste 2 DNS records) | 15 min |

Claude Code prints exact click-by-click instructions at each of these moments.

## Later, on your schedule (each is one prompt)

- Real product photos → drop them in `assets/photos/` →
  "swap in the real photography".
- Real pricing → "here are the prices: …" (paste a list) →
  it updates the data file and everything recalculates.
- Monthly → export Search Console data (2 min) →
  "run the monthly SEO review".
- Content → "continue the content calendar".

## Division of labor with your claude.ai project

- **Claude Code (the repo):** builds, tests, deploys, writes pages. Minimal input.
- **claude.ai "Please Be final Project":** strategy and research. It has the
  full project history + the SEO plan in its knowledge, and the HarborRank SEO
  skills — ask it things like "research keywords for custom golf tournament
  gifts" or "who ranks for custom hotel slippers and where are the gaps", then
  tell Claude Code "commit this research to docs/KEYWORD-MAP.md: …".

## Sanity rules (so nothing ever regresses)

- Homepage never shows pricing. Quote language only — never checkout language.
- No phase ships with failing tests. Claude Code enforces both automatically.
