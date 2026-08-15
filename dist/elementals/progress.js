/* book-of-elementals v0.8.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/progress/index.js
  function percent(value, max) {
    if (!(max > 0) || !Number.isFinite(value)) return 0;
    if (value <= 0) return 0;
    if (value >= max) return 100;
    return value * 100 / max;
  }
  var ProgressElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["buffer"];
    }
    /** The bar. Direct child, so a `<progress>` inside a card this element happens to wrap
     * is not mistaken for the one being measured. */
    get progress() {
      return this.querySelector(":scope > progress");
    }
    /**
     * The value, or `null` while there is none. Setting `null` takes the attribute off and
     * puts the bar back to indeterminate, which is what
     * [MDN says to do](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)
     * and the only way there is.
     */
    get value() {
      const progress = this.progress;
      return progress && progress.hasAttribute("value") ? progress.value : null;
    }
    set value(value) {
      const progress = this.progress;
      if (!progress) return;
      if (value === null || value === void 0) {
        progress.removeAttribute("value");
        return;
      }
      progress.value = value;
    }
    /** What counts as done. The `<progress>`'s own, which is `1` when it has none. */
    get max() {
      const progress = this.progress;
      return progress ? progress.max : null;
    }
    set max(value) {
      const progress = this.progress;
      if (progress) progress.max = value;
    }
    /** The second value, on the same scale. `null` is no buffer bar. */
    get buffer() {
      const value = this.getAttribute("buffer");
      if (value === null || value === "") return null;
      const number = parseFloat(value);
      return Number.isFinite(number) ? number : null;
    }
    set buffer(value) {
      if (value === null || value === void 0 || value === "") {
        this.removeAttribute("buffer");
        return;
      }
      this.setAttribute("buffer", value);
    }
    connectedCallback() {
      if (this.initialized) return;
      const progress = this.progress;
      if (!progress) return;
      this.initialized = true;
      this.apply = this.apply.bind(this);
      this.observer = new MutationObserver(this.apply);
      this.observer.observe(progress, { attributes: true, attributeFilter: ["value", "max"] });
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.observer.disconnect();
      this.observer = null;
      this.style.removeProperty("--progress-elemental-value");
      this.style.removeProperty("--progress-elemental-buffer");
      this.removeAttribute("data-indeterminate");
      this.initialized = false;
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.apply();
    }
    /**
     * Push the bar's state onto the element, where the CSS reads it. Public because a
     * `<progress>` swapped out from under this element is not something the observer is
     * watching for: replace the child and call this.
     *
     * `data-indeterminate` as well as the missing percentage, because CSS cannot ask whether
     * a custom property was set - an unset one inside `calc()` is a bar sitting at zero, and
     * a bar at zero is a claim that nothing has happened yet rather than that nobody knows.
     */
    apply() {
      const progress = this.progress;
      if (!progress) return;
      const max = progress.max;
      if (progress.hasAttribute("value")) {
        this.removeAttribute("data-indeterminate");
        this.style.setProperty("--progress-elemental-value", `${percent(progress.value, max)}%`);
      } else {
        this.setAttribute("data-indeterminate", "");
        this.style.removeProperty("--progress-elemental-value");
      }
      const buffer = this.buffer;
      if (buffer === null) {
        this.style.removeProperty("--progress-elemental-buffer");
        return;
      }
      this.style.setProperty("--progress-elemental-buffer", `${percent(buffer, max)}%`);
    }
  };
  define("progress-elemental", ProgressElemental);
})();
//# sourceMappingURL=progress.js.map
