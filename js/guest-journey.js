// HL Supply — Phase 4
// GuestJourney: scroll-driven lifestyle section.
// Desktop: sticky viewport, five scenes driven by scroll progress.
// Mobile / tablet-narrow / reduced-motion: stacked scenes with simple fade-up.

(function GuestJourney() {
  "use strict";

  var mount = document.getElementById("guestJourney");
  var scenes = window.HL_SCENES;
  if (!mount || !scenes || !scenes.length) return;

  var COUNT = scenes.length;

  var mqDesktop = window.matchMedia("(min-width: 900px)");
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- shared fragments ----------

  function slideHTML(scene, i) {
    return (
      '<div class="journey__slide ph ' + (i === 0 ? "is-active" : "") + '" data-slide="' + i + '"' +
      (i === 0 ? "" : ' aria-hidden="true"') + ">" +
      '  <div class="ph__art ' + scene.tint + '"><span class="jt-detail" aria-hidden="true"></span></div>' +
      '  <span class="ph__cap">Image — ' + esc(scene.imageLabel) + "</span>" +
      "</div>"
    );
  }

  function chipsHTML(scene) {
    return scene.chips
      .map(function (chip, c) {
        return '<span class="journey__chip" style="--chip:' + c + '">' + esc(chip) + "</span>";
      })
      .join("");
  }

  function textHTML(scene, i) {
    return (
      '<div class="journey__text ' + (i === 0 ? "is-active" : "") + '" data-text="' + i + '"' +
      (i === 0 ? "" : ' aria-hidden="true"') + ">" +
      '  <p class="journey__scene-label">Scene ' + scene.number + " &mdash; " + esc(scene.name) + "</p>" +
      "  <h3>" + esc(scene.headline) + "</h3>" +
      "  <p class=\"journey__copy\">" + esc(scene.copy) + "</p>" +
      '  <div class="journey__chips">' + chipsHTML(scene) + "</div>" +
      '  <a class="tlink" href="products.html#/products">Explore Products</a>' +
      "</div>"
    );
  }

  // ---------- desktop sticky mode ----------

  function renderSticky() {
    var trackerItems = scenes
      .map(function (scene, i) {
        return (
          '<li><button type="button" class="journey__stop ' + (i === 0 ? "is-active" : "") + '" data-stop="' + i + '"' +
          ' aria-label="Go to scene ' + scene.number + ", " + esc(scene.name) + '"' +
          (i === 0 ? ' aria-current="true"' : "") + ">" +
          '<span class="journey__stop-num">' + scene.number + "</span>" +
          '<span class="journey__stop-name">' + esc(scene.name) + "</span>" +
          "</button></li>"
        );
      })
      .join("");

    mount.innerHTML =
      '<div class="journey__scroll" id="journeyScroll">' +
      '  <div class="journey__sticky">' +
      '    <div class="wrap journey__stage">' +
      '      <div class="journey__media">' + scenes.map(slideHTML).join("") + "</div>" +
      '      <div class="journey__side">' +
      '        <div class="journey__texts">' + scenes.map(textHTML).join("") + "</div>" +
      '        <nav class="journey__tracker" aria-label="Guest journey scenes">' +
      '          <span class="journey__rail" aria-hidden="true"><span class="journey__rail-dot"></span></span>' +
      "          <ol>" + trackerItems + "</ol>" +
      "        </nav>" +
      "      </div>" +
      "    </div>" +
      "  </div>" +
      "</div>";

    var scroller = document.getElementById("journeyScroll");
    var slides = mount.querySelectorAll(".journey__slide");
    var texts = mount.querySelectorAll(".journey__text");
    var stops = mount.querySelectorAll(".journey__stop");
    var rail = mount.querySelector(".journey__rail");

    var active = 0;
    var ticking = false;

    function setActive(i) {
      if (i === active) return;
      active = i;
      slides.forEach(function (el, n) {
        el.classList.toggle("is-active", n === i);
        if (n === i) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", "true");
      });
      texts.forEach(function (el, n) {
        el.classList.toggle("is-active", n === i);
        if (n === i) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", "true");
      });
      stops.forEach(function (el, n) {
        el.classList.toggle("is-active", n === i);
        if (n === i) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });
    }

    function update() {
      ticking = false;
      var rect = scroller.getBoundingClientRect();
      var range = scroller.offsetHeight - window.innerHeight;
      if (range <= 0) return;

      var progress = Math.min(1, Math.max(0, -rect.top / range));
      var idx = Math.min(COUNT - 1, Math.floor(progress * COUNT));
      setActive(idx);

      // rail dot position (continuous)
      if (rail) rail.style.setProperty("--jprog", progress.toFixed(4));

      // subtle parallax within the active zone: ±14px
      var zone = progress * COUNT - idx; // 0..1 within scene
      var shift = ((zone - 0.5) * 28).toFixed(2);
      slides[idx].style.setProperty("--drift", shift + "px");
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    // tracker shortcut (secondary to scroll)
    stops.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(btn.getAttribute("data-stop"), 10);
        var top = scroller.getBoundingClientRect().top + window.scrollY;
        var range = scroller.offsetHeight - window.innerHeight;
        var target = top + (range * (i + 0.5)) / COUNT;
        window.scrollTo({ top: target, behavior: mqReduce.matches ? "auto" : "smooth" });
      });
    });

    teardown = function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }

  // ---------- stacked mode (mobile / reduced motion) ----------

  function renderStacked() {
    mount.innerHTML =
      '<div class="wrap journey__stack">' +
      scenes
        .map(function (scene, i) {
          return (
            '<article class="journey__panel" style="--stagger:' + i + '">' +
            slideHTML(scene, 0).replace('data-slide="0"', 'data-slide="' + i + '"') +
            textHTML(scene, 0).replace('data-text="0"', 'data-text="' + i + '"') +
            "</article>"
          );
        })
        .join("") +
      "</div>";

    // remove aria-hidden artifacts from reuse of index-0 template
    mount.querySelectorAll("[aria-hidden]").forEach(function (el) {
      el.removeAttribute("aria-hidden");
    });

    if (mqReduce.matches || !("IntersectionObserver" in window)) return;

    var panels = mount.querySelectorAll(".journey__panel");
    panels.forEach(function (p) {
      p.classList.add("will-reveal");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    panels.forEach(function (p) {
      observer.observe(p);
    });

    teardown = function () {
      observer.disconnect();
    };
  }

  // ---------- mode switching ----------

  var teardown = null;

  function setup() {
    if (teardown) {
      teardown();
      teardown = null;
    }
    if (mqDesktop.matches && !mqReduce.matches) renderSticky();
    else renderStacked();
  }

  function onChange() {
    setup();
  }

  if (mqDesktop.addEventListener) {
    mqDesktop.addEventListener("change", onChange);
    mqReduce.addEventListener("change", onChange);
  } else if (mqDesktop.addListener) {
    mqDesktop.addListener(onChange);
    mqReduce.addListener(onChange);
  }

  setup();
})();
