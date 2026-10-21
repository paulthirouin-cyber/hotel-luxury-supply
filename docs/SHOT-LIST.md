# HL Supply — Campaign Prompts
*Usage: every image = ONE scene prompt + THE MASTER PROMPT appended.
Master = image quality + the world (no objects). Scene prompt = the
objects, their materials, and where they sit — the master resolves what
kind of suite, pool, or veranda it is.*

## MASTER PROMPT (append to every scene prompt)

Ultra-refined editorial campaign photograph for a luxury hospitality brand.
The world is a contemporary five-star flagship property in the register of
Four Seasons or Mandarin Oriental — old money, modern hand. Warm ivory and
cream light with accents of deep navy, resort green, and soft terracotta;
soft directional sunlight or warm lamplight, long gentle shadows, generous
negative space, subtle film grain, shallow depth of field, medium-format
look. No people, no text, no logos. Portrait, 4:5 aspect ratio.

## A. Front-page Guest Journey scenes — 4:5 portrait → assets/scenes/

**01 arrival.jpg** — In the entry of a hotel suite, a VIP welcome kit
arranged on a walnut console: a small structured tote in heavyweight
natural canvas with tissue paper rising from it, a matte brushed
stainless-steel bottle with a machined cap beside it, a charcoal fabric
sleep mask resting at its base, a brass room key laid in front; a bronze
table lamp, a single white orchid stem, sheer curtains blurred behind.

**02 poolside.jpg** — On a pool lounger, a guest's afternoon setup: a
structured tote in cream heavyweight canvas, a cotton-twill cap, a matte
brushed stainless-steel bottle, and acetate sunglasses arranged on white
linen cushions; the edge of a navy-and-cream striped umbrella above, pool
water shimmering out of focus.

**03 beach-club.jpg** — On the sand at the beach club, a pair of minimal
flip-flops kicked off beside a striped heavyweight canvas beach bag and a
relaxed cotton bucket hat, a matte brushed stainless-steel bottle standing
upright; cabana-stripe fabric and a coiled rope detail at the frame's edge,
late-afternoon sea light.

**04 the-suite.jpg** — Evening turndown in a hotel suite: plush terry
slippers placed precisely on the stone floor beside the bed's pressed white
linens, a charcoal fabric sleep mask laid on the turned-down sheet; on the
walnut nightstand, a full-grain navy leather valet tray with painted edges
holding a brass key and a watch, a slim matte brushed stainless-steel
bottle beside the lamp.

**05 the-club.jpg** — On the clubhouse veranda, a performance-twill cap and
a matte brushed stainless-steel bottle resting on a teak bench, a navy
heavyweight canvas tote leaning against the bench leg, a wooden-handled
umbrella propped alongside; clipped hedge and canvas awning softly blurred,
low golden afternoon sun.

## B. Homepage hero — 16:9 landscape (keep left third calm for text) → assets/

**hero.jpg** — At the edge of the resort pool, a lounger set for the
afternoon: a structured tote in natural heavyweight canvas, folded cream
towels, a cotton-twill cap and a matte brushed stainless-steel bottle, the
striped umbrella edge overhead; infinity-pool water and palms softly
blurred beyond, wide cinematic composition with the left third kept calm.

## C. Category cards — 4:3 landscape → assets/catalog/cat-<slug>.jpg

**cat-bags.jpg** — In a boutique niche, three structured totes in
heavyweight canvas — ivory, navy, resort green — lined on a walnut shelf,
one casting a long soft shadow, folded linen beside them.

**cat-hats.jpg** — On a tennis-court bench, a structured cotton-twill cap
and a relaxed bucket hat resting brim-to-brim, clay court blurred behind,
afternoon light.

**cat-bottles.jpg** — On a marble spa counter, two matte brushed
stainless-steel bottles with machined caps — one deep navy, one cream —
beside a rolled towel, soft light from a high window.

**cat-flip-flops.jpg** — At the tiled edge of the pool, a pair of minimal
flip-flops, one askew, water reflections dancing on terracotta tile.

**cat-leather-goods.jpg** — On a suite writing desk, a full-grain navy
leather valet tray with painted edges, a leather luggage tag, and a leather
cable snap arranged on hotel stationery, warm lamp glow.

**cat-slippers.jpg** — On a marble bathroom floor, white waffle-weave
slippers side by side, the hem of a robe and a towel stack blurred above.

**cat-accessories.jpg** — On a linen tray in a suite, acetate aviator
sunglasses, a charcoal fabric sleep mask, and a folded microfiber lens
cloth composed with an olive sprig.

**cat-pets.jpg** — On a stone terrace, a matte brushed stainless-steel pet
bowl beside a neatly coiled woven leash with a leather handle and a folded
cotton bandana, dappled parasol shade, pool in the far blur. (Pets —
Phase 8.)

---

## Working notes (not part of any prompt)

- Structure rule (Paul, 2026-10-21): the MASTER carries image quality and
  the world only — never objects. Each INDIVIDUAL prompt carries objects,
  their materials, and the specific setting noun; the master's FS/MO
  register resolves what kind of suite/pool/veranda appears.
- Scene-logic rule: every shot is a real guest-service moment; products
  appear exactly as they'd be used. Non-product objects (key, watch, lamp,
  orchid) are scenery.
- Arrival = the sellable Welcome Kit bundle (Petite Mini Tote + bottle +
  sleep mask). Swap option if Arrival is ever dropped: "The Spa" (yoga mat
  on a wellness terrace, waffle slippers, bottle, rolled towel).
- Consistency: generate 01 arrival first; use it as a style reference
  (--sref / "style reference") for the rest.
- Aspect ratios: scenes 4:5, hero 16:9, cards 4:3 — change the master's
  final line (or --ar) accordingly.
- Delivery: drop files into the paths above, then tell Claude Code: "wire
  the scene photography." This file doubles as the brief for real
  photography later.
