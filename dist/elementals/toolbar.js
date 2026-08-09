/* book-of-elementals v0.6.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }
  function stepIndex(current, key, length) {
    if (length === 0) return null;
    const to = key === "ArrowDown" || key === "ArrowRight" ? current + 1 : key === "ArrowUp" || key === "ArrowLeft" ? current - 1 : key === "Home" ? 0 : key === "End" ? length - 1 : null;
    if (to === null || to < 0 || to >= length) return null;
    return to;
  }

  // src/elementals/toolbar/index.js
  function toolbarKey(key, vertical) {
    if (key === "Home" || key === "End") return key;
    if (key === (vertical ? "ArrowDown" : "ArrowRight")) return key;
    if (key === (vertical ? "ArrowUp" : "ArrowLeft")) return key;
    return null;
  }
  var CONTROLS = "button, a[href]";
  var ToolbarElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["vertical"];
    }
    /** Whether the bar runs down the page. Reflected, so `[vertical]` is a styling hook. */
    get vertical() {
      return this.hasAttribute("vertical");
    }
    set vertical(value) {
      this.toggleAttribute("vertical", !!value);
    }
    /**
     * The controls the arrows walk, in document order.
     *
     * A `disabled` button is left out because the platform will not focus one, and a cursor
     * that lands where focus cannot follow is a bar that stops moving. Keeping such a control
     * reachable is `aria-disabled` on it instead - still focusable, still announced, and this
     * list still has it.
     */
    get controls() {
      return Array.from(this.querySelectorAll(CONTROLS)).filter((control) => !control.disabled);
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.controls.length) return;
      this.initialized = true;
      this.setAttribute("role", "toolbar");
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("focusin", this.onFocusIn);
      this.observer = new MutationObserver(() => this.wire());
      this.observer.observe(this, { childList: true, subtree: true, attributeFilter: ["disabled"] });
      this.wire();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("focusin", this.onFocusIn);
      this.removeAttribute("role");
      this.removeAttribute("aria-orientation");
      for (const control of this.controls) control.removeAttribute("tabindex");
    }
    /**
     * Put the axis on the bar and the single tab stop inside it.
     *
     * The stop follows focus where there is any, so a bar entered by clicking its last button
     * is a bar the arrows carry on from there rather than one that jumps back to the start.
     */
    wire() {
      if (this.vertical) this.setAttribute("aria-orientation", "vertical");
      else this.removeAttribute("aria-orientation");
      const controls = this.controls;
      if (!controls.length) return;
      const focused = controls.find((control) => control === document.activeElement);
      const held = controls.find((control) => control.getAttribute("tabindex") === "0");
      const stop = focused || held || controls[0];
      for (const control of controls) control.tabIndex = control === stop ? 0 : -1;
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.wire();
    }
    onFocusIn() {
      this.wire();
    }
    onKeyDown(e) {
      const key = toolbarKey(e.key, this.vertical);
      if (!key) return;
      const controls = this.controls;
      const at = controls.indexOf(e.target);
      if (at === -1) return;
      const to = stepIndex(at, key, controls.length);
      if (to === null) return;
      e.preventDefault();
      controls[to].focus();
    }
  };
  define("toolbar-elemental", ToolbarElemental);
})();
//# sourceMappingURL=toolbar.js.map
