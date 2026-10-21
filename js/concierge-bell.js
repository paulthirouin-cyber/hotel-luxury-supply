// HL Supply — Phase 2
// ConciergeBell component (static JS version).
// Injects its own markup so the Phase 1 homepage stays untouched.

(function ConciergeBell() {
  "use strict";

  // ---------- markup ----------

  var bellSVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 4.5c-3.6 0-6 2.7-6 6.5 0 3.2-.9 4.6-1.8 5.6-.3.35-.05.9.4.9h14.8c.45 0 .7-.55.4-.9-.9-1-1.8-2.4-1.8-5.6 0-3.8-2.4-6.5-6-6.5z"/>' +
    '<path d="M12 4.5V3"/>' +
    '<path d="M10 20a2 2 0 0 0 4 0"/>' +
    "</svg>";

  var root = document.createElement("div");
  root.innerHTML =
    '<button type="button" class="cbell-btn" id="cbellBtn" aria-label="Ring the Concierge" aria-haspopup="dialog" aria-expanded="false">' +
    '  <span class="cbell-icon"><span class="cbell-rings" aria-hidden="true"></span>' + bellSVG + "</span>" +
    '  <span class="cbell-label">Ring the Concierge</span>' +
    "</button>" +
    '<div class="cbell-overlay" id="cbellOverlay" hidden></div>' +
    '<aside class="cbell-drawer" id="cbellDrawer" role="dialog" aria-modal="true" aria-labelledby="cbellTitle" hidden>' +
    '  <div class="cbell-drawer__inner">' +
    '    <div class="cbell-drawer__top">' +
    "      <div>" +
    '        <span class="cbell-drawer__eyebrow">HL Supply / Concierge</span>' +
    '        <h2 id="cbellTitle">Ring the Concierge</h2>' +
    "      </div>" +
    '      <button type="button" class="cbell-close" id="cbellClose" aria-label="Close concierge drawer">&times;</button>' +
    "    </div>" +
    '    <p class="cbell-drawer__intro">Tell us what you are building. We\u2019ll help guide the right product direction for your property, event, or guest experience.</p>' +
    '    <div class="cbell-divider" aria-hidden="true"></div>' +
    '    <form class="cbell-form" id="cbellForm" novalidate>' +
    '      <div class="cbell-field">' +
    '        <label for="cbellName">Name</label>' +
    '        <input id="cbellName" name="name" type="text" autocomplete="name" required />' +
    "      </div>" +
    '      <div class="cbell-field">' +
    '        <label for="cbellEmail">Email</label>' +
    '        <input id="cbellEmail" name="email" type="email" autocomplete="email" required />' +
    "      </div>" +
    '      <div class="cbell-field">' +
    '        <label for="cbellProperty">Property / Company</label>' +
    '        <input id="cbellProperty" name="property" type="text" autocomplete="organization" />' +
    "      </div>" +
    '      <div class="cbell-field">' +
    '        <label for="cbellType">Project Type</label>' +
    '        <select id="cbellType" name="projectType">' +
    '          <option value="Hotel / Resort">Hotel / Resort</option>' +
    '          <option value="Private Club">Private Club</option>' +
    '          <option value="Golf Event">Golf Event</option>' +
    '          <option value="Beach Club">Beach Club</option>' +
    '          <option value="Spa / Wellness">Spa / Wellness</option>' +
    '          <option value="Destination Event">Destination Event</option>' +
    '          <option value="Other">Other</option>' +
    "        </select>" +
    "      </div>" +
    '      <div class="cbell-field">' +
    '        <label for="cbellMessage">Message</label>' +
    '        <textarea id="cbellMessage" name="message"></textarea>' +
    "      </div>" +
    '      <button type="submit" class="cbell-submit">Send Request</button>' +
    "    </form>" +
    '    <div class="cbell-success" role="status">' +
    '      <div class="cbell-success__rule" aria-hidden="true"></div>' +
    "      <p>The concierge has your request. We\u2019ll be in touch shortly.</p>" +
    "    </div>" +
    "  </div>" +
    "</aside>";

  while (root.firstChild) document.body.appendChild(root.firstChild);

  // ---------- elements ----------

  var btn = document.getElementById("cbellBtn");
  var overlay = document.getElementById("cbellOverlay");
  var drawer = document.getElementById("cbellDrawer");
  var closeBtn = document.getElementById("cbellClose");
  var form = document.getElementById("cbellForm");

  var lastFocused = null;
  var isOpen = false;

  // ---------- reveal after scrolling past the hero ----------

  var hero = document.querySelector(".hero");

  function updateBellVisibility() {
    var threshold = hero ? hero.offsetHeight * 0.85 : 480;
    btn.classList.toggle("is-visible", window.scrollY > threshold && !isOpen);
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          updateBellVisibility();
          ticking = false;
        });
      }
    },
    { passive: true }
  );
  updateBellVisibility();

  // ---------- focus trap ----------

  function focusables() {
    return Array.prototype.filter.call(
      drawer.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ),
      function (el) {
        return !el.disabled && el.offsetParent !== null;
      }
    );
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---------- open / close ----------

  function openDrawer() {
    lastFocused = document.activeElement;
    isOpen = true;
    overlay.hidden = false;
    drawer.hidden = false;
    // allow transition to run after unhiding
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        overlay.classList.add("is-open");
        drawer.classList.add("is-open");
      });
    });
    btn.setAttribute("aria-expanded", "true");
    btn.classList.remove("is-visible");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
    window.setTimeout(function () {
      closeBtn.focus();
    }, 80);
  }

  function closeDrawer() {
    isOpen = false;
    overlay.classList.remove("is-open");
    drawer.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    window.setTimeout(function () {
      overlay.hidden = true;
      drawer.hidden = true;
      updateBellVisibility();
    }, 520);
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      closeDrawer();
      return;
    }
    trapFocus(e);
  }

  btn.addEventListener("click", openDrawer);
  document.querySelectorAll("[data-open-concierge]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openDrawer();
    });
  });
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  // ---------- submit (frontend-only success state) ----------

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = document.getElementById("cbellName");
    var email = document.getElementById("cbellEmail");

    if (!name.value.trim()) {
      name.focus();
      return;
    }
    if (!email.value.trim() || email.value.indexOf("@") === -1) {
      email.focus();
      return;
    }

    if (window.HLLeads) {
      window.HLLeads.send("concierge", {
        name: name.value.trim(), email: email.value.trim(),
        property: (document.getElementById("cbellProperty") || {}).value || "",
        projectType: (document.getElementById("cbellType") || {}).value || "",
        message: (document.getElementById("cbellMessage") || {}).value || ""
      });
    }
    if (window.HLLeads && window.HLLeads.track) window.HLLeads.track("Concierge Submit");
    drawer.classList.add("is-sent");
    var status = drawer.querySelector(".cbell-success p");
    if (status) status.setAttribute("tabindex", "-1");
    window.setTimeout(function () {
      if (status) status.focus();
    }, 60);
  });
})();
