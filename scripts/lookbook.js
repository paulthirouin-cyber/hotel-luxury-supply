// HL Supply — Lookbook PDF (Phase 9.2), generated at build time from the
// same catalog data as the site. No prices (pricing is quote-based), no
// stock imagery: catalog cutouts (assets/catalog/<slug>-print.jpg, made by
// `npm run images`) and the category heroes. Draft pieces without
// photography render as a tinted frame with the piece name.
//
// Usage from build.js:  lookbook.build({ CATS, PRODS, COLS, root }) → Buffer

const path = require("path");
const fs = require("fs");
const { Doc } = require("./pdf");

const C = {
  ivory: [0.965, 0.945, 0.902],
  cream: [0.988, 0.976, 0.949],
  navy: [0.106, 0.165, 0.255],
  navySoft: [0.255, 0.314, 0.416],
  green: [0.247, 0.361, 0.310],
  beige: [0.906, 0.867, 0.776],
  terracotta: [0.769, 0.494, 0.365],
  chrome: [0.373, 0.416, 0.447],
  hairline: [0.847, 0.796, 0.682],
  white: [1, 1, 1]
};
const SITE = "hotelluxurysupply.com";
const EMAIL = "info@hotelluxurysupply.com";
const PHONE = "+1 (347) 669-4417";
const ESSENCE = "We don’t simply put hotel names on products. We help hotels create products worthy of carrying their names.";

function build(data) {
  const { CATS, PRODS, COLS } = data;
  const root = data.root || path.join(__dirname, "..");
  const year = new Date().getFullYear();
  const doc = new Doc({ title: `HL Supply Lookbook ${year}`, author: "HL Supply", subject: "Custom branded guest goods for luxury hospitality" });
  const W = doc.width, H = doc.height, M = 48;
  const asset = (p) => path.join(root, String(p).replace(/^\//, ""));
  let pageNo = 0;

  function chrome(label) {
    // running footer on every page after the cover
    pageNo++;
    doc.line(M, 40, W - M, 40, C.hairline, 0.5);
    doc.text("HL · Supply", M, 28, { size: 8, bold: true, color: C.navy, letterSpacing: 1.2 });
    doc.text(label || "", W / 2, 28, { size: 7.5, color: C.chrome, align: "center", letterSpacing: 0.8 });
    doc.text(String(pageNo), W - M, 28, { size: 8, color: C.chrome, align: "right" });
  }
  function bg() { doc.rect(0, 0, W, H, C.cream); }

  /* ---------- cover ---------- */
  doc.addPage();
  doc.rect(0, 0, W, H, C.ivory);
  doc.text("HL · SUPPLY", M, H - 70, { size: 11, bold: true, color: C.navy, letterSpacing: 3 });
  doc.text("Bespoke branded goods for luxury hospitality", W - M, H - 70, { size: 8.5, color: C.chrome, align: "right", letterSpacing: 0.6 });
  const heroFile = asset(CATS[0].image || "assets/catalog/cat-bags.jpg");
  doc.image(heroFile, M, H - 470, W - 2 * M, 360, { cover: true });
  doc.rect(M, H - 470, W - 2 * M, 1, C.hairline);
  doc.text("THE ATELIER LOOKBOOK", M, H - 520, { size: 9, color: C.terracotta, letterSpacing: 3 });
  doc.text(`Custom guest goods, ${year}`, M, H - 560, { size: 30, bold: true, color: C.navy });
  doc.paragraph(ESSENCE, M, H - 600, W - 2 * M - 120, { size: 11.5, color: C.navySoft, leading: 17 });
  doc.line(M, 120, W - M, 120, C.hairline, 0.5);
  doc.text(`${SITE}  ·  ${EMAIL}  ·  ${PHONE}`, M, 100, { size: 8.5, color: C.navy, letterSpacing: 0.4 });
  doc.text(`${CATS.length} categories  ·  ${PRODS.length} pieces  ·  ${COLS.length} collections  ·  quote-based, no online checkout`, M, 84, { size: 8, color: C.chrome });

  /* ---------- how it works + key facts ---------- */
  doc.addPage(); bg();
  doc.text("HOW TO USE THIS LOOKBOOK", M, H - 72, { size: 9, color: C.terracotta, letterSpacing: 3 });
  doc.text("A starting point for inspiration", M, H - 104, { size: 22, bold: true, color: C.navy });
  let y = H - 134;
  y = doc.paragraph("HL Supply is a bespoke product atelier for hotels, resorts, private clubs, beach clubs, golf properties, and spas. Every piece in this lookbook is produced in your property’s colors with your mark applied by embroidery, debossing, laser etching, or print. Dimensions, materials, trims, and packaging can be adapted; the catalog is where a project starts, not where it ends.", M, y, W - 2 * M, { size: 10.5, color: C.navySoft, leading: 16 });
  y -= 10;
  const facts = [
    ["Minimums", "Hats and leather goods from 100 units; bags, bottles, and flip-flops from 200; slippers from 1,000 pairs; accessories 100–250; pet pieces 100–200. Four quantity tiers per piece."],
    ["Pricing", "Confirmed by the atelier at quote review, after artwork and customization are settled. Build a quote on the website and the concierge replies with direction."],
    ["Lead time", "4–6 weeks after proof approval, plus delivery. Share the opening, season, or event date and the schedule is planned to it."],
    ["Logo methods", "Embroidery (textiles), debossing (leather), laser etching (steel, acetate, wood), print and woven labels. Placement and scale are confirmed on the proof."],
    ["Bespoke", "Adapt any piece or develop a new one: dimensions, materials, colors, trims, packaging. Start at " + SITE + "/bespoke/."]
  ];
  for (const [k, v] of facts) {
    doc.line(M, y + 4, W - M, y + 4, C.hairline, 0.5);
    y -= 14;
    doc.text(k.toUpperCase(), M, y, { size: 8, bold: true, color: C.navy, letterSpacing: 1.4 });
    y = doc.paragraph(v, M + 120, y, W - 2 * M - 120, { size: 9.5, color: C.navySoft, leading: 14 }) - 6;
  }
  y -= 10;
  doc.text("COLLECTIONS", M, y, { size: 9, color: C.terracotta, letterSpacing: 3 });
  y -= 22;
  doc.text("Curated sets by guest moment", M, y, { size: 16, bold: true, color: C.navy });
  y -= 16;
  for (const col of COLS) {
    const names = col.products.map((s) => (PRODS.find((p) => p.slug === s) || {}).name).filter(Boolean).map((n) => n.replace(/^The /, ""));
    y -= 4;
    doc.text(col.name, M, y, { size: 10, bold: true, color: C.navy });
    y = doc.paragraph(names.join(", ") + ".", M + 130, y, W - 2 * M - 130, { size: 9, color: C.navySoft, leading: 13 }) - 4;
    if (y < 80) break;
  }
  chrome("How it works");

  /* ---------- categories ---------- */
  const COLS_N = 2, CELL_W = (W - 2 * M - 20) / 2, IMG_H = 140, CELL_H = 230;
  for (const cat of CATS) {
    const prods = PRODS.filter((p) => p.category === cat.slug);
    let i = 0, part = 0;
    while (i < prods.length) {
      doc.addPage(); bg();
      let top = H - M;
      if (part === 0) {
        if (cat.image) {
          doc.image(asset(cat.image), M, H - 48 - 120, W - 2 * M, 120, { cover: true });
        } else {
          doc.rect(M, H - 48 - 120, W - 2 * M, 120, C.beige);
          doc.text(cat.imageLabel || cat.name, M + 16, H - 48 - 120 + 14, { size: 8, color: C.chrome });
        }
        top = H - 48 - 120 - 30;
        doc.text(cat.tagline ? cat.tagline.toUpperCase() : "THE ATELIER CATALOG", M, top, { size: 8.5, color: C.terracotta, letterSpacing: 2.5 });
        top -= 28;
        doc.text(cat.name, M, top, { size: 26, bold: true, color: C.navy });
        top -= 18;
        top = doc.paragraph(cat.catalogSubtitle || cat.line, M, top, W - 2 * M, { size: 10, color: C.navySoft, leading: 14 });
        top -= 8;
      } else {
        doc.text(cat.name + "  (continued)", M, top - 12, { size: 14, bold: true, color: C.navy });
        top -= 36;
      }
      const rows = Math.max(1, Math.floor((top - 56) / CELL_H));
      const perPage = rows * COLS_N;
      const slice = prods.slice(i, i + perPage);
      slice.forEach((p, k) => {
        const col = k % COLS_N, row = Math.floor(k / COLS_N);
        const x = M + col * (CELL_W + 20);
        const yTop = top - row * CELL_H;
        const imgY = yTop - IMG_H;
        doc.rect(x, imgY, CELL_W, IMG_H, C.white);
        doc.rect(x, imgY, CELL_W, 0.6, C.hairline); doc.rect(x, yTop - 0.6, CELL_W, 0.6, C.hairline);
        const print = p.image ? asset(p.image.replace(/\.webp$/, "-print.jpg")) : null;
        if (!(print && doc.image(print, x + 10, imgY + 10, CELL_W - 20, IMG_H - 20))) {
          doc.rect(x + 10, imgY + 10, CELL_W - 20, IMG_H - 20, C.beige);
          doc.text("Photography to follow", x + CELL_W / 2, imgY + IMG_H / 2 - 3, { size: 8, color: C.chrome, align: "center", letterSpacing: 0.8 });
        }
        let ty = imgY - 16;
        doc.text(p.name, x, ty, { size: 10.5, bold: true, color: C.navy });
        ty -= 13;
        doc.text(`${p.ref}  ·  ${p.type}`, x, ty, { size: 8, color: C.chrome, letterSpacing: 0.3 });
        ty -= 13;
        const mat = (p.specifications.find((s) => s.label === "Material") || {}).value || "";
        ty = doc.paragraph(mat, x, ty, CELL_W, { size: 8.5, color: C.navySoft, leading: 11.5 });
        ty = doc.paragraph("Customization: " + p.customization.join(", "), x, ty, CELL_W, { size: 8.5, color: C.navySoft, leading: 11.5 });
        doc.text(`MOQ ${p.tiers[0].qty.toLocaleString("en-US")} ${p.unitLabel}  ·  4 quantity tiers  ·  any custom color`, x, ty, { size: 8, color: C.green });
      });
      chrome(cat.name + (prods.length > perPage ? `  ·  ${part + 1}` : ""));
      i += perPage; part++;
    }
  }

  /* ---------- closing ---------- */
  doc.addPage(); bg();
  doc.text("FROM SELECTION TO DELIVERY", M, H - 72, { size: 9, color: C.terracotta, letterSpacing: 3 });
  doc.text("How a project runs", M, H - 104, { size: 22, bold: true, color: C.navy });
  y = H - 136;
  const steps = [
    ["01  Select", "Choose pieces from the catalog, a collection, or a guide. Add them to a quote on the website with quantities and notes, or send the brief to the concierge."],
    ["02  Customize", "Colors, logo method and placement, trims, packaging. The atelier prepares a mockup, then a proof on the confirmed material; nothing is produced before the proof is approved."],
    ["03  Produce", "4–6 weeks after proof approval. Every piece is inspected and individually wrapped; custom gift packaging is quoted alongside the goods."],
    ["04  Deliver", "Shipped to the property, staged by season or program where needed. The concierge stays on the project through delivery."]
  ];
  for (const [k, v] of steps) {
    doc.text(k, M, y, { size: 11, bold: true, color: C.navy });
    y = doc.paragraph(v, M + 120, y, W - 2 * M - 120, { size: 10, color: C.navySoft, leading: 14.5 }) - 10;
    doc.line(M, y + 4, W - M, y + 4, C.hairline, 0.5);
    y -= 14;
  }
  y -= 10;
  doc.text("BESPOKE", M, y, { size: 9, color: C.terracotta, letterSpacing: 3 });
  y -= 20;
  y = doc.paragraph("Beyond the catalog, the atelier designs and develops products from a brief: a tote with a property-specific pocket, a slipper in a new texture, a pet program, a tennis or padel kit, a room-drop vehicle for an incentive group. Send the guest moment, the materials you have in mind, the artwork, and the quantity, and the concierge replies with direction, a mockup, and a quote.", M, y, W - 2 * M, { size: 10.5, color: C.navySoft, leading: 16 });
  y -= 24;
  doc.rect(M, y - 92, W - 2 * M, 96, C.ivory);
  doc.text("Speak with the concierge", M + 20, y - 24, { size: 14, bold: true, color: C.navy });
  doc.text(`${EMAIL}   ·   ${PHONE}   ·   ${SITE}`, M + 20, y - 46, { size: 10, color: C.navy });
  doc.text("Pricing is confirmed by the atelier at quote review. This lookbook carries no prices; quantity tiers are shown on every product page.", M + 20, y - 66, { size: 8.5, color: C.chrome });
  chrome("Process and contact");

  return doc.render();
}

module.exports = { build };
