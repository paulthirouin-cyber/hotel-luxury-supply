// HL Supply — Phase 6
// Reusable pricing helper. Works with placeholder (null) prices now
// and real numeric prices later without any component changes.

window.HLPricing = (function () {
  "use strict";

  /**
   * Resolve the active pricing tier for a product and quantity.
   *
   * Rule: a quantity between two tiers uses the lower qualifying tier.
   * e.g. tiers 200 / 500 / 1000 / 2500 → qty 200–499 uses the 200 tier.
   *
   * @param {Object} product  product record with tiers[{qty, price}]
   * @param {number} quantity requested quantity
   * @returns {{
   *   belowMOQ: boolean,
   *   moq: number,
   *   tier: Object|null,
   *   tierIndex: number,      // -1 when below MOQ
   *   unitPrice: number|null, // null while pricing is placeholder
   *   total: number|null
   * }}
   */
  function resolve(product, quantity) {
    var tiers = product.tiers || [];
    var moq = tiers.length ? tiers[0].qty : 0;
    var qty = Math.floor(Number(quantity) || 0);

    if (!tiers.length || qty < moq) {
      return {
        belowMOQ: true,
        moq: moq,
        tier: null,
        tierIndex: -1,
        unitPrice: null,
        total: null
      };
    }

    var idx = 0;
    for (var i = 0; i < tiers.length; i++) {
      if (qty >= tiers[i].qty) idx = i;
      else break;
    }

    var tier = tiers[idx];
    var unitPrice = typeof tier.price === "number" ? tier.price : null;

    return {
      belowMOQ: false,
      moq: moq,
      tier: tier,
      tierIndex: idx,
      unitPrice: unitPrice,
      total: unitPrice === null ? null : unitPrice * qty
    };
  }

  /** Format a unit price; placeholder prices render as "$--". */
  function formatUnit(price) {
    if (typeof price !== "number") return "$--";
    return "$" + price.toFixed(2);
  }

  /** Format an estimated total; pending prices render as text. */
  function formatTotal(total) {
    if (typeof total !== "number") return "Estimate pending";
    return "$" + total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Format a tier quantity, e.g. 2500 → "2,500". */
  function formatQty(qty) {
    return Number(qty).toLocaleString("en-US");
  }

  return {
    resolve: resolve,
    formatUnit: formatUnit,
    formatTotal: formatTotal,
    formatQty: formatQty
  };
})();
