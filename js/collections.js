// HL Supply — Phase 8.4
// Collections: cross-category curation. Categories remain the single canonical
// product URL; a collection lists and links catalog pieces for a guest moment
// (/collections/<slug>/), never duplicates them. Load after js/products.js:
// this file also annotates every product with its `collections` memberships.

(function () {
  "use strict";

  var A = function (p) { return window.HLRoutes ? window.HLRoutes.asset(p) : p; };

  window.HL_COLLECTIONS = [
    {
      slug: "poolside",
      name: "Poolside",
      title: "The Poolside Collection",
      line: "Totes, hats, bottles, and sun accessories for long afternoons on the deck.",
      intro: "Long afternoons, striped shade, the tote on the lounger. The Poolside Collection gathers the pieces a guest reaches for between the cabana and the bar, produced in the property’s colors so the whole deck reads as one.",
      framing: "For the director of guest experience or the retail buyer dressing a pool deck: issue the pieces at the cabana, sell the same colorway at the boutique, and brief quantities per lounger rather than per guest.",
      directAnswer: "The Poolside Collection curates six catalog pieces for pool decks: the Signature and Nautical Striped totes, the Riviera bucket hat, the Essential flip-flop, the Pilot aviator sunglasses, and the Marquis bottle. Minimums run from 100 units for the hat to 250 for the sunglasses, every piece in any custom color, produced in 4–6 weeks after proof approval.",
      hook: {
        title: "Need a cabana set the catalog doesn’t hold yet?",
        copy: "Send the deck plan, the stripe, and the number of loungers; the atelier develops the towel clip, the lounger tag, or the cabana kit around these pieces.",
        cta: "Start a Poolside Project"
      },
      products: ["signature-tote", "nautical-striped-tote", "riviera-bucket-hat", "essential-flip-flop", "pilot-aviator-sunglasses", "marquis-bottle"],
      metaTitle: "Poolside Collection: Custom Pool Deck Amenities | HL Supply",
      metaDescription: "Custom pool deck amenities for hotels and resorts: striped totes, bucket hats, flip-flops, sunglasses, and insulated bottles in your colors. Quote-based, from 100 units.",
      keywords: ["hotel pool amenities", "pool deck amenities custom", "resort pool merchandise"],
      image: A("assets/catalog/cat-bags.jpg"),
      imageLabel: "Loungers, striped shade, and a canvas tote along the pool deck.",
      tint: "tint-pool"
    },
    {
      slug: "beach-club",
      name: "Beach Club",
      title: "The Beach Club Collection",
      line: "Beach bags, flip-flops, and shade-ready goods made for sand, salt, and sunlight.",
      intro: "Sand, salt, and the hour before sunset. The Beach Club Collection is the drawstring tote, the sand-print flip-flop, the trucker hat, and the mini tote that leave the club in photographs and come back the next summer.",
      framing: "For beach club managers and boutique buyers: pieces that survive sand and salt, restock easily, and sell at the club shop in the same stripe they were issued in.",
      directAnswer: "The Beach Club Collection curates five catalog pieces for beach clubs: the Nomad drawstring tote, the Canvas and Impression sand-print flip-flops, the Summit trucker hat, and the Petite mini tote. Minimums run from 100 units for the hat to 200 for the totes and flip-flops, in any custom color, produced in 4–6 weeks after proof approval.",
      hook: {
        title: "Need a club-specific stripe, strap, or sand-print mold?",
        copy: "Send the club’s stripe, the artwork, and the season date; the atelier develops the outsole mold, the stripe weave, or the day-pass kit around these pieces.",
        cta: "Start a Beach Club Project"
      },
      products: ["nomad-drawstring-tote", "canvas-flip-flop", "impression-sand-print-flip-flop", "summit-trucker-hat", "petite-mini-tote"],
      metaTitle: "Beach Club Collection: Custom Beach Amenities | HL Supply",
      metaDescription: "Custom beach club goods for resorts and private clubs: drawstring totes, sand-print flip-flops, trucker hats, and mini totes in the club's colors. Quote-based.",
      keywords: ["beach club merchandise", "beach club branded goods", "custom beach amenities"],
      image: A("assets/catalog/cat-flip-flops.jpg"),
      imageLabel: "Beach bags and flip-flops at the club entrance, cabana stripes behind.",
      tint: "tint-sand"
    },
    {
      slug: "spa-suite",
      name: "Spa Suite",
      title: "The Spa Suite Collection",
      line: "Slippers, bottles, and soft in-room details for rest, ritual, and recovery.",
      intro: "Quiet objects for rest, ritual, and recovery: four slippers, a sleep mask, the bathroom box, the tissue cover, and a bottle for the treatment ledge, all in one calm palette so the suite and the spa speak the same language.",
      framing: "For spa directors and housekeeping leads building a suite-and-treatment-room standard: amenity pieces at property scale, matched tone-on-tone to the spa’s stone, linen, and timber.",
      directAnswer: "The Spa Suite Collection curates eight catalog pieces: the Cloud, Lattice, Linear, and Verdant slippers, the Solace sleeping mask, the Vanity bathroom box, the Hideaway tissue box cover, and the Marquis bottle. Slippers start at 1,000 pairs, leather pieces at 100 units, the mask at 250, and the bottle at 200, produced in 4–6 weeks after proof approval.",
      hook: {
        title: "Need a robe, a treatment-room set, or a turndown ritual we don’t make yet?",
        copy: "Send the spa’s palette and materials; the atelier develops the robe program, the treatment tray, or the turndown set around these pieces.",
        cta: "Start a Spa Project"
      },
      products: ["cloud-fleece-slipper", "lattice-waffle-slipper", "linear-ribbed-slipper", "verdant-eco-friendly-slipper", "solace-sleeping-mask", "vanity-bathroom-box", "hideaway-tissue-box-cover", "marquis-bottle"],
      metaTitle: "Spa Suite Collection: Custom Hotel Spa Amenities | HL Supply",
      metaDescription: "Custom spa amenities for luxury hotels: embroidered slippers, sleep masks, leather bathroom pieces, and insulated bottles in one calm palette. Quote-based.",
      keywords: ["hotel spa amenities", "custom spa amenities", "luxury spa slippers with logo"],
      image: A("assets/catalog/cat-slippers.jpg"),
      imageLabel: "Slippers and wellness details beside the bed in a spa suite.",
      tint: "tint-linen"
    },
    {
      slug: "golf-club",
      name: "Golf & Club",
      title: "The Golf & Club Collection",
      line: "Caps, leather goods, and course-day accessories for members and the pro shop.",
      intro: "From the first tee to the member lounge: caps that carry the crest cleanly, an umbrella for the course, a luggage tag for the member who travels, and a bottle for the cart. The pro shop, the member gift, and the amenity program, briefed as one colorway.",
      framing: "For golf directors, pro shop buyers, and club managers: pieces that sell in the shop, work as member gifts, and sit in the locker room, all on property and all in the club’s colors.",
      directAnswer: "The Golf & Club Collection curates six catalog pieces for golf resorts and private clubs: the Fairway golf cap, the Regent classic cap, the Heritage dad hat, the Canopy umbrella, the Wayfarer luggage tag, and the Vanguard bottle. Hats and leather start at 100 units, the umbrella and bottle at 200, embroidered or laser-etched, produced in 4–6 weeks after proof approval.",
      hook: {
        title: "Need a member gift, a locker-room set, or a season colorway?",
        copy: "Send the crest, the season, and the member count; the atelier develops the gift box, the locker amenity, or the event edition around these pieces.",
        cta: "Start a Club Project"
      },
      products: ["fairway-golf-cap", "regent-classic-cap", "heritage-dad-hat", "canopy-premium-umbrella", "wayfarer-luggage-tag", "vanguard-bottle"],
      metaTitle: "Golf & Club Collection: Golf Resort Merchandise | HL Supply",
      metaDescription: "Golf resort and private club merchandise: embroidered golf caps, umbrellas, leather luggage tags, and bottles in the club's colors. Quote-based, from 100 units.",
      keywords: ["golf resort merchandise", "golf club pro shop merchandise", "custom golf club gifts"],
      image: A("assets/catalog/cat-hats.jpg"),
      imageLabel: "Embroidered caps and a leather luggage tag at the first tee.",
      tint: "tint-green"
    },
    {
      slug: "sports-wellness",
      name: "Sports & Wellness",
      title: "The Sports & Wellness Collection",
      line: "Caps, mats, bottles, and carryalls for golf, tennis, fitness, and spa days.",
      intro: "Golf, tennis, fitness, spa: the pieces that move with a guest through an active day on the property. A light cap, a mat, a bottle, a drawstring tote, and a cloth for the lenses, in one palette from the court to the studio to the treatment room.",
      framing: "For wellness and fitness directors, tennis and padel program leads, and resorts building an active-guest offer: pieces that work on court, in the studio, and at the spa, briefed together so the program reads as one.",
      directAnswer: "The Sports & Wellness Collection curates six catalog pieces for golf, tennis, fitness, and spa programs: the Aero sports cap, the Fairway golf cap, the Zenith yoga mat, the Vanguard bottle, the Nomad drawstring tote, and the Clarity lens cloth. Minimums run from 100 units for the caps and mat to 250 for the lens cloth, every piece in any custom color, produced in 4–6 weeks after proof approval.",
      hook: {
        title: "Building a tennis or padel program?",
        copy: "The atelier develops the program pieces the catalog does not yet hold, from racquet covers and court towels to sweatbands and the welcome kit, around these pieces and in the property’s colors.",
        cta: "Start a Sports Program"
      },
      products: ["aero-sports-cap", "fairway-golf-cap", "zenith-yoga-mat", "vanguard-bottle", "nomad-drawstring-tote", "clarity-lens-cloth"],
      metaTitle: "Sports & Wellness: Hotel Fitness Amenities | HL Supply",
      metaDescription: "Hotel fitness and wellness amenities with your logo: sports caps, yoga mats, insulated bottles, and drawstring totes for golf, tennis, fitness, and spa programs.",
      keywords: ["hotel fitness amenities", "resort wellness products", "hotel tennis program merchandise", "padel club merchandise"],
      image: A("assets/catalog/cat-bottles.jpg"),
      imageLabel: "Sports cap, yoga mat, and bottle on a terrace before a morning session.",
      tint: "tint-chrome"
    }
  ];

  // Annotate products with their memberships (collections are optional per product).
  var PRODS = window.HL_PRODUCTS || [];
  var byCollection = {};
  window.HL_COLLECTIONS.forEach(function (c) {
    c.products.forEach(function (slug) { (byCollection[slug] = byCollection[slug] || []).push(c.slug); });
  });
  PRODS.forEach(function (p) { p.collections = byCollection[p.slug] || []; });
})();
