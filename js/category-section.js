// HL Supply — Phase 3
// CategorySection: renders the "Explore the atelier" cards from
// window.HL_CATEGORIES and handles the staggered entrance reveal.
// Hover interactions are pure CSS (css/category-section.css).

(function CategorySection() {
  "use strict";

  var grid = document.getElementById("atelierGrid");
  var data = window.HL_CATEGORIES;
  if (!grid || !data) return;

  // ---------- render ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var arrowSVG =
    '<svg class="at-card__arrow" viewBox="0 0 26 10" aria-hidden="true">' +
    '<path d="M0 5h23.5M19.5 1l4.5 4-4.5 4" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
    "</svg>";

  var html = data
    .map(function (cat, i) {
      return (
        '<a class="at-card at-card--' + cat.size + " accent-" + cat.accent + " " + cat.micro + '"' +
        ' href="' + esc(window.HLRoutes ? window.HLRoutes.href("#/products/" + cat.slug) : "products.html#/products/" + cat.slug) + '"' +
        ' style="--stagger:' + i + '"' +
        ">" +
        '  <div class="at-card__media ph' + (cat.image ? " ph--cover" : "") + '">' +
        '    <div class="ph__art ' + cat.tint + '">' +
        '      <span class="ph__line"></span>' +
        '      <span class="at-card__micro" aria-hidden="true"></span>' +
        "    </div>" +
        (cat.image
          ? '    <img class="ph__img" src="' + cat.image + '" alt="' + esc(cat.imageLabel) + '" loading="lazy" />'
          : '    <span class="ph__cap">Image — ' + esc(cat.imageLabel) + "</span>") +
        "  </div>" +
        '  <div class="at-card__panel">' +
        '    <span class="at-card__accent" aria-hidden="true"></span>' +
        "    <h3>" + esc(cat.name) + "</h3>" +
        "    <p>" + esc(cat.line) + "</p>" +
        '    <span class="at-card__cta">View Category ' + arrowSVG + "</span>" +
        "  </div>" +
        "</a>"
      );
    })
    .join("");

  grid.innerHTML = html;

  // ---------- entrance reveal ----------

  var section = grid.closest(".categories") || grid;
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    section.classList.add("is-inview");
    return;
  }

  section.classList.add("will-reveal");

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          section.classList.add("is-inview");
          observer.disconnect();
        }
      });
    },
    { threshold: 0.12 }
  );

  observer.observe(section);
})();
