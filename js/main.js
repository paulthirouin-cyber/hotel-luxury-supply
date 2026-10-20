// HL Supply — Phase 1
// Single interaction: header scroll state.

(function () {
  var header = document.getElementById("header");
  if (!header) return;

  var ticking = false;

  function update() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  update();
})();
