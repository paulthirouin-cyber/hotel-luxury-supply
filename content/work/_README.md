# Case studies (/work/)

Drop one Markdown file per project in this folder. The build renders
`/work/` and `/work/<file-name>/` only when at least one non-draft file
exists; until then the section, the footer link, and the "Related projects"
blocks on program and collection pages do not appear at all.

Files starting with `_` are drafts and are never built.

Front matter (all on one line each):

```
---
title: A pool-deck collection for a Riviera beach club
metaTitle: Beach Club Pool Deck Collection Case Study | HL Supply
description: 120–160 characters for search results.
type: work
propertyType: Beach club, French Riviera
programs: beach-clubs, spa-wellness          (slugs under content/for/)
collections: poolside, beach-club            (slugs in js/collections.js)
products: nautical-striped-tote, riviera-bucket-hat, marquis-bottle
keywords: beach club merchandise case study, custom pool deck amenities
published: 2026-11-01
updated: 2026-11-01
summary: One sentence for the card.
answer: Optional 2–3 sentence direct answer shown under the title.
---
```

Then the body: `# Title`, sections (`## The brief`, `## The pieces`,
`## The outcome`), an optional `## Frequently asked questions` block with
`### Question` headings, and links with the usual shorthands
(`[The Signature Solid Tote](product:signature-tote)`, `category:`, `guide:`,
`for:`, `collection:`, `glossary:`).

Rules: real projects only; a property's name appears only with its written
permission (otherwise describe it: "a 120-key beach resort"). No invented
quotes, no invented results.
