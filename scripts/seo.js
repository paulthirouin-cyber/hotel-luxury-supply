// HL Supply — SEO artefacts generated at build time (Phase 2).
// JSON-LD graphs per page type, sitemap.xml, robots.txt, llms.txt.
// Rule: never emit data we do not have (no offers/prices until pricing lands).

const SITE = "https://hotelluxurysupply.com";
const ORG_ID = SITE + "/#organization";
const SITE_ID = SITE + "/#website";

const ORG = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "HL Supply",
  alternateName: "Hotel Luxury Supply",
  url: SITE + "/",
  description: "Bespoke product design, development, and supply for luxury hospitality: custom branded guest goods for hotels, resorts, private clubs, spas, and destination events.",
  email: "info@hotelluxurysupply.com",
  telephone: "+1-347-669-4417",
  contactPoint: [{
    "@type": "ContactPoint",
    contactType: "sales",
    email: "info@hotelluxurysupply.com",
    telephone: "+1-347-669-4417",
    availableLanguage: ["English"]
  }],
  knowsAbout: ["custom hotel amenities", "branded resort merchandise", "bespoke hospitality products", "hotel pet amenities", "embroidery", "debossing", "laser etching"]
};

const WEBSITE = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE + "/",
  name: "HL Supply",
  publisher: { "@id": ORG_ID },
  inLanguage: "en"
};

function abs(p) { return SITE + "/" + String(p).replace(/^\/+/, ""); }

function breadcrumb(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: SITE + it.path
    }))
  };
}

function faqPage(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };
}

function webPage(meta, extra) {
  return Object.assign({
    "@type": "WebPage",
    "@id": SITE + meta.path + "#webpage",
    url: SITE + meta.path,
    name: meta.title,
    description: meta.description,
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en"
  }, extra || {});
}

function graph(nodes) {
  return { "@context": "https://schema.org", "@graph": [ORG, WEBSITE].concat(nodes.filter(Boolean)) };
}

/* ---------------- per page type ---------------- */

function homeLd(meta) {
  return graph([webPage(meta)]);
}

function landingLd(meta, CATS) {
  return graph([
    webPage(meta, {
      "@type": "CollectionPage",
      mainEntity: {
        "@type": "ItemList",
        name: "HL Supply product categories",
        numberOfItems: CATS.length,
        itemListElement: CATS.map((c, i) => ({
          "@type": "ListItem", position: i + 1, name: c.name, url: SITE + "/products/" + c.slug + "/"
        }))
      }
    }),
    breadcrumb([{ name: "Home", path: "/" }, { name: "Products", path: "/products/" }])
  ]);
}

function categoryLd(meta, cat, prods) {
  return graph([
    webPage(meta, {
      "@type": "CollectionPage",
      primaryImageOfPage: cat.image ? { "@type": "ImageObject", url: abs(cat.image) } : undefined,
      mainEntity: {
        "@type": "ItemList",
        name: cat.name,
        numberOfItems: prods.length,
        itemListElement: prods.map((p, i) => ({
          "@type": "ListItem", position: i + 1, name: p.name, url: SITE + "/products/" + p.category + "/" + p.slug + "/"
        }))
      }
    }),
    breadcrumb([{ name: "Home", path: "/" }, { name: "Products", path: "/products/" }, { name: cat.name, path: "/products/" + cat.slug + "/" }]),
    faqPage(cat.faqs)
  ]);
}

function productLd(meta, p, cat) {
  const spec = (label) => { const s = (p.specifications || []).find((x) => x.label === label); return s ? s.value : null; };
  const moq = p.tiers && p.tiers[0] ? p.tiers[0].qty : null;
  const product = {
    "@type": "Product",
    "@id": SITE + meta.path + "#product",
    name: p.name,
    sku: p.ref,
    mpn: p.ref,
    url: SITE + meta.path,
    image: p.image ? abs(p.image) : undefined,
    description: p.description,
    brand: { "@type": "Brand", name: "HL Supply" },
    manufacturer: { "@id": ORG_ID },
    category: cat ? cat.name : p.category,
    material: spec("Material") || undefined,
    audience: { "@type": "BusinessAudience", audienceType: "Luxury hotels, resorts, private clubs, spas, and destination events" },
    additionalProperty: [
      moq ? { "@type": "PropertyValue", name: "Minimum order quantity", value: moq, unitText: p.unitLabel } : null,
      { "@type": "PropertyValue", name: "Customization", value: (p.customization || []).join(", ") },
      spec("Dimensions") ? { "@type": "PropertyValue", name: "Dimensions", value: spec("Dimensions") } : null,
      spec("Lead time") ? { "@type": "PropertyValue", name: "Lead time", value: spec("Lead time") } : null
    ].filter(Boolean)
    // NO offers / price: pricing is quote-based and not yet published.
  };
  return graph([
    webPage(meta, { "@type": "ItemPage", mainEntity: { "@id": product["@id"] } }),
    product,
    breadcrumb([
      { name: "Home", path: "/" }, { name: "Products", path: "/products/" },
      { name: cat ? cat.name : p.category, path: "/products/" + p.category + "/" },
      { name: p.name, path: meta.path }
    ])
  ]);
}

function collectionsIndexLd(meta, COLS) {
  return graph([
    webPage(meta, {
      "@type": "CollectionPage",
      mainEntity: {
        "@type": "ItemList",
        name: "HL Supply collections",
        numberOfItems: COLS.length,
        itemListElement: COLS.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, url: SITE + "/collections/" + c.slug + "/" }))
      }
    }),
    breadcrumb([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections/" }])
  ]);
}

function collectionLd(meta, col, prods) {
  return graph([
    webPage(meta, {
      "@type": "CollectionPage",
      primaryImageOfPage: col.image ? { "@type": "ImageObject", url: abs(col.image) } : undefined,
      mainEntity: {
        "@type": "ItemList",
        name: col.title,
        numberOfItems: prods.length,
        itemListElement: prods.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: SITE + "/products/" + p.category + "/" + p.slug + "/" }))
      }
    }),
    breadcrumb([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections/" }, { name: col.name, path: "/collections/" + col.slug + "/" }])
  ]);
}

function bespokeLd(meta, faqs) {
  return graph([
    webPage(meta),
    breadcrumb([{ name: "Home", path: "/" }, { name: "Bespoke Atelier", path: "/bespoke/" }]),
    faqPage(faqs)
  ]);
}

function articleLd(meta, guide) {
  const article = {
    "@type": "Article",
    "@id": SITE + meta.path + "#article",
    headline: guide.meta.title,
    description: meta.description,
    url: SITE + meta.path,
    mainEntityOfPage: { "@id": SITE + meta.path + "#webpage" },
    image: guide.category && guide.category.image ? abs(guide.category.image) : (meta.image ? abs(meta.image) : undefined),
    datePublished: guide.meta.published,
    dateModified: guide.meta.updated || guide.meta.published,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    articleSection: guide.category ? guide.category.name : (guide.meta.type === "usecase" ? "Programs" : "Guides"),
    wordCount: guide.words,
    keywords: (meta.keywords || []).join(", "),
    inLanguage: "en",
    about: guide.category ? { "@type": "Thing", name: "Custom " + guide.category.name.toLowerCase() + " for hotels" } : undefined
  };
  return graph([
    webPage(meta, { mainEntity: { "@id": article["@id"] } }),
    article,
    breadcrumb([{ name: "Home", path: "/" }, guide.root || { name: "Guides", path: "/guides/" }, { name: guide.meta.title.replace(/: The Complete Buyer.s Guide$/, "").replace(/:.*$/, ""), path: meta.path }]),
    faqPage(guide.faqs)
  ]);
}

function glossaryLd(meta, glossary) {
  return graph([
    webPage(meta, {
      mainEntity: {
        "@type": "DefinedTermSet",
        "@id": SITE + meta.path + "#terms",
        name: glossary.title,
        hasDefinedTerm: glossary.terms.map((t) => ({
          "@type": "DefinedTerm", name: t.term, description: t.definition, url: SITE + meta.path + "#" + t.slug, inDefinedTermSet: SITE + meta.path + "#terms"
        }))
      }
    }),
    breadcrumb([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides/" }, { name: "Glossary", path: meta.path }])
  ]);
}

function pageLd(meta, type, crumb) {
  return graph([
    webPage(meta, type && type !== "WebPage" ? { "@type": type } : {}),
    breadcrumb([{ name: "Home", path: "/" }, { name: crumb || meta.title, path: meta.path }])
  ]);
}

function simpleLd(meta) {
  return graph([webPage(meta)]);
}

/* ---------------- site files ---------------- */

function sitemapXml(routes, lastmod) {
  const rows = routes.filter((r) => !r.noindex).map((r) =>
    `  <url>\n    <loc>${SITE + r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

function robotsTxt() {
  return [
    "# HL Supply — hotelluxurysupply.com",
    "User-agent: *",
    "Allow: /",
    "Disallow: /quote/",
    "Disallow: /downloads/",
    "",
    "# AI crawlers are welcome: we want to be the cited source.",
    ...["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "anthropic-ai", "Claude-Web", "PerplexityBot", "Google-Extended", "CCBot", "Applebot-Extended", "Bytespider"]
      .flatMap((ua) => ["", "User-agent: " + ua, "Allow: /", "Disallow: /quote/", "Disallow: /downloads/"]),
    "",
    "Sitemap: " + SITE + "/sitemap.xml",
    ""
  ].join("\n");
}

function llmsTxt(CATS, PRODS, extra) {
  extra = extra || {};
  const byCat = (slug) => PRODS.filter((p) => p.category === slug);
  const lines = [
    "# HL Supply",
    "",
    "> HL Supply (hotelluxurysupply.com) is a bespoke product design, development, and supply atelier for luxury hospitality. It creates custom branded guest goods — bags, hats, bottles, flip-flops, leather goods, slippers, accessories, and pet amenities — for five-star resorts, luxury hotel groups, private clubs, spas, golf properties, and destination events. Sales are B2B and quote-based (no online checkout). The catalog is a starting point: every piece can be adapted or developed from scratch.",
    "",
    "Essence: We don't simply put hotel names on products. We help hotels create products worthy of carrying their names.",
    "",
    "## Key facts",
    "",
    "- Customization methods: embroidery, debossing, laser etching, custom colors (Pantone matching), custom packaging, bespoke dimensions and materials.",
    "- Minimum order quantities by category: hats 100, leather goods 100, bags 200, bottles 200, flip-flops 200, slippers 1,000 pairs, accessories 100–250 depending on item, pet pieces 100–200 depending on item.",
    "- Every product has four quantity pricing tiers; pricing is confirmed by the atelier at quote review.",
    "- Lead time: 4–6 weeks after proof approval, plus delivery.",
    "- Contact: info@hotelluxurysupply.com · +1 (347) 669-4417",
    "",
    "## Pages",
    "",
    `- [Homepage](${SITE}/)`,
    `- [Product catalog](${SITE}/products/)`,
    `- [Bespoke Atelier](${SITE}/bespoke/): adapt a catalog piece or develop a new product`,
    `- [About HL Supply](${SITE}/about/)`,
    `- [How it works](${SITE}/process/): Select, Customize, Produce, Deliver`,
    `- [Contact the concierge](${SITE}/contact/)`,
    `- [Buying guides](${SITE}/guides/)`,
    `- [Glossary of customization terms](${SITE}/glossary/)`,
    `- [Collections](${SITE}/collections/): curated sets by guest moment (poolside, beach club, spa suite, golf and club, sports and wellness)`,
    `- [Lookbook](${SITE}/lookbook/): the catalog as a PDF, sent by email on request`,
    ...((extra.guides || []).map((g) => `- [${g.title}](${SITE}${g.path}): ${g.summary}`)),
    ""
  ];
  if (extra.collections && extra.collections.length) {
    lines.push("## Collections", "");
    for (const c of extra.collections) {
      const names = c.products.map((s) => (PRODS.find((p) => p.slug === s) || {}).name).filter(Boolean);
      lines.push(`- [${c.title}](${SITE}/collections/${c.slug}/): ${c.line} Pieces: ${names.join(", ")}.`);
    }
    lines.push("");
  }
  for (const c of CATS) {
    lines.push(`## ${c.name}`, "", `- [${c.name} category](${SITE}/products/${c.slug}/): ${c.catalogSubtitle || c.line}`);
    for (const p of byCat(c.slug)) {
      const moq = p.tiers[0].qty;
      lines.push(`- [${p.name}](${SITE}/products/${p.category}/${p.slug}/): ${p.type}; ref ${p.ref}; MOQ ${moq} ${p.unitLabel}; ${p.customization.join(", ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

module.exports = { SITE, homeLd, landingLd, categoryLd, productLd, collectionLd, collectionsIndexLd, bespokeLd, pageLd, articleLd, glossaryLd, simpleLd, sitemapXml, robotsTxt, llmsTxt };
