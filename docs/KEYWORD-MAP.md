# HL Supply — Keyword Map

One primary keyword per page, mapped so pages never cannibalize each other
(see `docs/SEO-MASTER-PLAN.md` §1). Volumes and difficulty are **not yet
researched** — this is the default map derived from the catalog and the
content engine on 2026-10-20. Research runs in the claude.ai project (HarborRank
skills); commit findings here and the next content cycle executes against them.

Legend: **P** = primary (title/H1 lead), **S** = secondary (body, FAQ, meta).
Status: `live` (page exists in dist/), `planned`.

## Brand + homepage

| Page | P | S | Status |
| --- | --- | --- | --- |
| `/` | bespoke branded goods for luxury hospitality | hotel amenities supplier, custom hotel room amenities, HL Supply | live |
| `/about/` | bespoke hospitality products | hotel amenities supplier, hotel boutique merchandise, hotel product design atelier | live |
| `/process/` | custom hotel products process | how to order custom hotel amenities, custom merchandise lead time | live |
| `/contact/` | contact HL Supply | hotel luxury supply contact | live |

## Category pages (commercial head/mid terms)

| Page | P | S | Status |
| --- | --- | --- | --- |
| `/products/bags/` | custom hotel tote bags | branded resort totes, custom beach bags for resorts | live |
| `/products/hats/` | custom resort hats | embroidered hotel caps, golf club hats with logo | live |
| `/products/bottles/` | custom hotel water bottles | branded insulated bottles for resorts, laser etched logo bottles | live |
| `/products/flip-flops/` | custom hotel flip flops | branded resort flip flops, spa flip flops with logo | live |
| `/products/leather-goods/` | custom hotel leather goods | debossed leather valet tray, hotel luggage tags with logo | live |
| `/products/slippers/` | custom hotel slippers | embroidered spa slippers, luxury hotel slippers with logo | live |
| `/products/accessories/` | custom hotel accessories | branded resort accessories, hotel guest amenities with logo | live |
| `/products/pets/` | hotel pet amenities | pet friendly hotel supplies, custom dog bandana, luxury hotel pet program | live |

## Collections (guest-moment intent)

| Page | P | S | Status |
| --- | --- | --- | --- |
| `/collections/poolside/` | hotel pool amenities | pool deck amenities custom, resort pool merchandise | live |
| `/collections/beach-club/` | beach club merchandise | beach club branded goods, custom beach amenities | live |
| `/collections/spa-suite/` | hotel spa amenities | custom spa amenities, luxury spa slippers with logo | live |
| `/collections/golf-club/` | golf resort merchandise | golf club pro shop merchandise, custom golf club gifts | live |
| `/collections/sports-wellness/` | hotel fitness amenities | resort wellness products, hotel tennis program merchandise, padel club merchandise | live |

## Product pages (long-tail)

Generated: `custom <type> for hotels` / `branded <type> for resorts` /
`<name> HL Supply` (see `js/products.js` `keywords`). Hand-tune the top 15
once Search Console shows which products draw impressions.

## Guides (informational intent)

| Page | P | S | Status |
| --- | --- | --- | --- |
| `/guides/custom-hotel-tote-bags/` | custom hotel tote bags buyer's guide | hotel boutique tote, resort tote materials | live |
| `/guides/custom-hotel-hats/` | custom resort hats guide | structured vs unstructured cap, embroidered golf cap | live |
| `/guides/custom-hotel-water-bottles/` | custom hotel water bottles guide | hotel suite water bottle, insulated bottle logo | live |
| `/guides/custom-hotel-flip-flops/` | custom hotel flip flops guide | sand print flip flops, spa flip flops | live |
| `/guides/custom-hotel-leather-goods/` | custom hotel leather goods guide | leather suite accessories, debossed valet tray | live |
| `/guides/custom-hotel-slippers/` | custom hotel slippers guide | eco-friendly hotel slippers, hotel slipper minimum order | live |
| `/guides/custom-hotel-accessories/` | custom hotel accessories guide | custom resort sunglasses, branded sleep mask | live |
| `/guides/custom-hotel-pet-amenities/` | luxury hotel pet program | hotel pet amenities, branded pet amenities, custom dog bandana | live |
| `/guides/embroidery-vs-deboss-vs-laser-etching/` | embroidery vs debossing | laser etching vs embroidery, debossed vs embossed logo | live |
| `/guides/canvas-vs-woven-leather-tote/` | canvas vs leather tote | woven leather tote hotel, hotel boutique tote bag | live |
| `/guides/350ml-vs-500ml-hotel-bottles/` | 350ml vs 500ml bottle | hotel water bottle size, spa water bottle | live |
| `/guides/hotel-slipper-materials-compared/` | hotel slipper materials | terry vs waffle slippers, best hotel slippers | live |
| `/guides/hotel-tote-styles-compared/` | tote bag styles | resort tote comparison, hotel welcome bag styles | live |
| `/glossary/` | hospitality customization glossary | what is MOQ custom products, embroidery vs deboss vs laser etching | live |

## Use-case pages (vertical intent)

| Page | P | S | Status |
| --- | --- | --- | --- |
| `/for/golf-resorts/` | golf resort merchandise | pro shop branded goods, golf club member gifts, custom golf caps for clubs | live |
| `/for/beach-clubs/` | custom beach club merchandise | beach club branded goods, pool deck amenities | live |
| `/for/spa-wellness/` | custom spa amenities | spa slippers with logo, hotel wellness program merchandise | live |
| `/for/hotel-openings/` | hotel opening amenities | new hotel branded products, hotel pre-opening merchandise | live |
| `/for/corporate-retreats/` | corporate retreat welcome kit | hotel group welcome gifts, destination wedding welcome bags | live |
| `/for/incentive-travel/` | incentive trip gifts | room drop gifts, corporate incentive travel welcome gifts, DMC welcome amenities | live |

## Next content cycle (planned — "continue the content calendar")

| Slot | Working title | P | Type |
| --- | --- | --- | --- |
| 1 | Hotel welcome gift ideas that guests actually keep | hotel welcome gift ideas | guide |
| 2 | What MOQ means when buying custom products | what MOQ means custom products | guide |
| 3 | How much do custom hotel totes cost? A framework | how much do custom hotel totes cost | guide |
| 4 | Building a resort retail program from scratch | resort retail program guide | guide |
| 5 | Hotel amenity programs: replace-per-stay vs launder-and-reissue | hotel slipper amenity program | comparison |
| 6 | Custom goods for private members' clubs | private club merchandise custom | use-case |
| 7 | Custom goods for yacht clubs and marinas | yacht club merchandise | use-case |

## Vocabulary (updated 2026-10-21)

HL Supply is a hotel and resort supplier first: **rooms** (amenity programs)
and **retail** (the boutique). Primary vocabulary tilts to *hotel amenities
supplier*, *custom hotel room amenities*, *hotel boutique merchandise*, plus the
pet (*hotel pet amenities*, *luxury hotel pet program*) and incentive
(*incentive trip gifts*, *room drop gifts*) terms. Golf is property surface
(pro shop, member gifts, amenity program), never an events vertical:
tournament-first terms are dropped from the map.

## Rules

- One primary keyword per page; a new page only if the keyword is not owned.
- Titles ≤ 60 chars, primary keyword first, brand last; descriptions ≤ 155.
- Every new page: direct-answer opener, FAQ block, links to products +
  category + glossary, entry in sitemap (automatic), inbound links from ≥ 2 pages.
- Monthly: update from Search Console (`run the monthly SEO review`).
