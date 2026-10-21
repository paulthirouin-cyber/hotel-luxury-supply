# HL Supply — Photography / AI-Image Shot List
*One campaign, one photographer's eye. Every image uses the SHARED STYLE
BLOCK + PRODUCT-RENDERING STANDARD below. Products are always plain/unbranded (awaiting the client's
monogram) — never show text or logos. No people in any shot.*

**SCENE-LOGIC RULE (applies to every image):** each shot depicts a real
guest-service moment, and every product appears exactly as it would be used
in that moment — a luggage tag on a suitcase handle, slippers placed at
turndown, flip-flops kicked off in sand. Non-product objects (a suitcase, a
brass bell, a key, a watch) are scenery that sells the moment; our products
are the quiet stars. If an object combination wouldn't happen in a real
hotel, the shot is wrong.

## Shared style block (append to every prompt)

Editorial luxury-hotel campaign photograph. Setting register: contemporary
five-star flagship in the manner of Four Seasons or Mandarin Oriental —
classical proportion executed in modern materials: walnut and natural oak
millwork, honed marble and limestone, bronze and brushed-brass hardware,
linen upholstery, architectural recessed lighting mixed with warm lamplight,
a single fresh orchid or olive stem. Old money, modern hand. Warm ivory and
cream light with accents of deep navy, resort green, and soft terracotta.
Soft directional light, long gentle shadows, generous negative space,
subtle film grain, shallow depth of field. No people, no text, no logos.

## Product-rendering standard (append after the style block, every prompt)

All products rendered at flagship-boutique quality: the bottle is matte
brushed stainless steel with a precisely machined cap and soft satin sheen
— sculptural, weighty, never glossy gym-bottle plastic. The tote is
heavyweight tight-weave natural canvas that stands structured on its own,
reinforced base, fine double-needle stitching, full-grain leather trim.
Leather goods show clean edge-painting and a soft matte grain. Every object
looks hand-finished, deliberate, and quietly expensive.

## A. Guest Journey scenes — PORTRAIT 4:5 (e.g. 1024×1280+)
Save to assets/scenes/<name>.jpg. Objects match each scene's category chips.

1. arrival.jpg (moment: the VIP welcome kit, awaiting the guest) — A VIP
   welcome kit in a modern five-star suite entry: on a walnut console with
   a honed marble top, a structured natural canvas mini-tote stands crisply
   with tissue paper rising from it, a matte brushed-steel bottle beside it
   catching a soft satin highlight, a sleep mask in smooth charcoal fabric
   resting at its base, a brass room key laid in front; behind, fluted oak
   panelling, a bronze table lamp glowing warm, a single white orchid stem,
   and the soft-blurred suggestion of a tall window with sheer linen
   curtains. The first quiet moment of a stay.
   (Products: Petite Mini Tote, bottle, sleep mask — the sellable "Welcome
   Kit" bundle. Scenery: key, console, lamp, orchid. Decision 2026-10-21:
   arrival is told through the welcome-kit vessel; doubles as the rooms-
   program "Welcome Kit" sales story.)
   SWAP OPTION if the journey ever drops Arrival: "The Spa" — a yoga mat
   unrolled on a wellness terrace at morning light, waffle slippers side by
   side at its edge, a steel bottle and rolled towel beside; journey order
   then runs Spa → Poolside → Beach Club → Suite → Club.
2. poolside.jpg (moment: the guest's claimed lounger) — A cream canvas
   tote, a structured unbranded cap, and a brushed-steel bottle arranged on
   a white linen pool lounger, sunglasses tossed beside them; the edge of a
   navy-and-cream striped umbrella above, sun-lit pool water shimmering out
   of focus behind.
3. beach-club.jpg (moment: walked down to the water) — A pair of minimal
   flip-flops kicked off on pale sand beside a striped canvas beach bag and
   a relaxed bucket hat, a steel bottle standing in the sand; cabana stripe
   fabric and a coiled rope detail at the frame's edge, late-afternoon
   seaside light, yacht-club nostalgia.
4. the-suite.jpg (moment: evening turndown service) — Evening turndown in
   a modern five-star suite: soft terry slippers placed precisely on a
   honed limestone floor beside a low oak bed with pressed white linens and
   a charcoal sleep mask laid on the turned-down sheet; on the walnut
   nightstand, a deep-navy leather valet tray with clean painted edges
   holding a brass key and a watch, a slim matte-steel bottle beside a
   bronze lamp casting warm light; fluted panelling and sheer curtains
   softly blurred. Calm, precise, quietly expensive. (Scenery: key, watch,
   lamp.)
5. the-club.jpg (moment: the member's kit on the clubhouse veranda) — A
   performance cap and brushed-steel bottle resting on a teak bench, a navy
   canvas tote leaning against its leg and a wooden-handled umbrella
   propped alongside; deep green hedge and navy canvas softly blurred
   behind, low golden afternoon sun, private-club polish.

## B. Homepage hero — LANDSCAPE 16:9 (keep the left third calm for text)

hero.jpg (moment: the lounger, set for the afternoon) — A poolside still
life at a Riviera resort: natural canvas tote on a linen lounger, folded
cream towels, a structured cap and brushed-steel bottle, striped umbrella
edge overhead, infinity-pool water and palms softly blurred beyond; wide
cinematic composition with the left third kept calm for headline text.

## C. Category lifestyle cards — LANDSCAPE 4:3 (also used at 16:9.5 crops)
Save to assets/catalog/cat-<slug>.jpg (replacing current catalog-page scans).

1. cat-bags.jpg (boutique display) — Three canvas totes in ivory, navy, and
   resort green lined on a weathered teak shelf in a boutique niche, one
   casting a long soft shadow; folded linen beside them.
2. cat-hats.jpg (courtside) — A structured cap and a relaxed bucket hat
   resting brim-to-brim on a tennis-court bench, clay court blurred behind,
   afternoon light.
3. cat-bottles.jpg (spa counter) — Two brushed-steel bottles, one matte
   navy and one cream, standing on a marble spa counter beside a rolled
   towel, steam-soft light from a high window.
4. cat-flip-flops.jpg (pool edge) — A pair of flip-flops at the tiled edge
   of a pool, one askew, water reflections dancing on terracotta tile.
5. cat-leather-goods.jpg (suite desk) — A debossed-ready leather valet
   tray, luggage tag, and cable snap arranged on hotel-desk stationery,
   warm lamp glow.
6. cat-slippers.jpg (spa bathroom) — White waffle slippers side by side on
   a marble bathroom floor, the hem of a robe and a towel stack blurred
   above.
7. cat-accessories.jpg (suite tray) — Aviator sunglasses, a sleep mask, and
   a folded lens cloth composed on a linen tray with a sprig of rosemary,
   suite light.
8. cat-pets.jpg (pet arrival on the terrace) — A brushed-steel pet bowl on
   a stone terrace beside a neatly coiled woven leash with a leather handle
   and a folded bandana, dappled shade from a parasol, pool in the far
   blur. (Pets category — Phase 8.)

## Workflow
Generate at 4:5 (scenes), 16:9 (hero), 4:3 (cards) — Midjourney: --ar 4:5
etc. For consistency, generate arrival.jpg first and use it as a style
reference (--sref / "style reference") for all remaining shots. Drop
finished files into assets/scenes/ and assets/catalog/, then tell Claude
Code: "wire the scene photography" — the image pipeline (WebP, srcset,
width/height, alt text) and tests handle the rest.
