// HL Supply — Phase 5
// Mobile menu: refined full-screen panel, not a generic dropdown.

(function MobileMenu() {
  "use strict";

  var toggle = document.getElementById("menuToggle");
  var menu = document.getElementById("mobileMenu");
  if (!toggle || !menu) return;

  var isOpen = false;

  function open() {
    isOpen = true;
    menu.hidden = false;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        menu.classList.add("is-open");
      });
    });
    toggle.textContent = "Close";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    isOpen = false;
    menu.classList.remove("is-open");
    toggle.textContent = "Menu";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    window.setTimeout(function () {
      if (!isOpen) menu.hidden = true;
    }, 420);
    toggle.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
  }

  toggle.addEventListener("click", function () {
    if (isOpen) close();
    else open();
  });

  // close after choosing a destination
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", close);
  });

  // if the viewport grows past the mobile breakpoint, reset state
  var mq = window.matchMedia("(min-width: 941px)");
  function onChange() {
    if (mq.matches && isOpen) close();
  }
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();
