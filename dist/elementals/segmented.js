/* book-of-elementals v1.0.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/core.js
  function define2(tag, ctor) {
    if (typeof document === "undefined" || document.readyState !== "loading") {
      define(tag, ctor);
      return;
    }
    document.addEventListener("DOMContentLoaded", () => define(tag, ctor), { once: true });
  }

  // src/elementals/segmented/index.js
  function checkedIndex(inputs) {
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) return i;
    }
    return -1;
  }
  var SegmentedElemental = class extends ElementBase {
    /** The segments, in document order. Direct children, so a radio group inside one
     * segment's popover is not mistaken for part of this one. */
    get inputs() {
      return Array.from(this.querySelectorAll(':scope > label > input[type="radio"]'));
    }
    /** Index of the checked segment, or `-1` when the group has no selection. */
    get selectedIndex() {
      return checkedIndex(this.inputs);
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.inputs.length) return;
      this.initialized = true;
      this.apply = this.apply.bind(this);
      this.onReset = this.onReset.bind(this);
      this.addEventListener("change", this.apply);
      this.form = this.closest("form");
      if (this.form) this.form.addEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.addEventListener("pageshow", this.apply);
      if (!this.hasAttribute("role") && (this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby"))) {
        this.setAttribute("role", "group");
      }
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("change", this.apply);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.removeEventListener("pageshow", this.apply);
      this.form = null;
      this.initialized = false;
    }
    /** A form is only put back to its defaults once the `reset` event has been dispatched,
     * so the selection is read on the next task rather than in the handler. */
    onReset() {
      setTimeout(this.apply);
    }
    /**
     * Push the selection onto the element, where the CSS reads it. Public because the count
     * is read here: add or remove a segment and this is the one call that catches up.
     *
     * `data-index` as well as the custom property, because CSS cannot ask whether a custom
     * property was set - an unset one inside `calc()` leaves the knob at zero, which is a
     * knob claiming the first segment. The attribute is what the knob's existence hangs
     * off, so no script and no selection both come out as no knob.
     */
    apply() {
      const inputs = this.inputs;
      const index = checkedIndex(inputs);
      this.style.setProperty("--segmented-elemental-count", inputs.length);
      if (index < 0) {
        this.removeAttribute("data-index");
        this.style.removeProperty("--segmented-elemental-index");
        return;
      }
      this.style.setProperty("--segmented-elemental-index", index);
      this.setAttribute("data-index", index);
    }
  };
  define2("segmented-elemental", SegmentedElemental);
})();
//# sourceMappingURL=segmented.js.map
