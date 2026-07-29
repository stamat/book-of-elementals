/* book-of-elementals v0.2.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // src/core.js
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/disclosure/index.js
  function disclosureState(open) {
    return {
      expanded: open ? "true" : "false",
      hidden: open ? null : "until-found"
    };
  }
  var REGION_CLASS = "disclosure-elemental-region";
  var regionCount = 0;
  var DisclosureElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["open"];
    }
    /** The `<button>` that toggles the region. Direct child, so a button inside the
     * region - or inside a nested disclosure - is not mistaken for the trigger. */
    get button() {
      return this.querySelector(":scope > button");
    }
    /** The region the button shows and hides: what `for` names, else the button's
     * next sibling. */
    get region() {
      const id = this.dataset.for != null ? this.dataset.for : this.getAttribute("for");
      if (id) return document.getElementById(id);
      const button = this.button;
      return button ? button.nextElementSibling : null;
    }
    /** Whether the region is showing. Reflected, so `[open]` is a styling hook too. */
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      this.toggleAttribute("open", !!value);
    }
    connectedCallback() {
      if (this.initialized) return;
      const button = this.button;
      const region = this.region;
      if (!button || !region) return;
      this.initialized = true;
      if (!button.hasAttribute("type")) button.type = "button";
      if (!region.id) region.id = "disclosure-elemental-" + ++regionCount;
      region.classList.add(REGION_CLASS);
      button.setAttribute("aria-controls", region.id);
      this.onClick = this.onClick.bind(this);
      this.onBeforeMatch = this.onBeforeMatch.bind(this);
      this.addEventListener("click", this.onClick);
      region.addEventListener("beforematch", this.onBeforeMatch);
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      const region = this.region;
      if (region) {
        region.removeEventListener("beforematch", this.onBeforeMatch);
        if (!this.contains(region)) region.removeAttribute("hidden");
      }
      this.initialized = false;
    }
    /** Push the current state onto the button and the region. */
    apply() {
      const button = this.button;
      const region = this.region;
      if (!button || !region) return;
      const state = disclosureState(this.open);
      button.setAttribute("aria-expanded", state.expanded);
      if (state.hidden === null) region.removeAttribute("hidden");
      else region.setAttribute("hidden", state.hidden);
    }
    /**
     * `open` is the single source of truth, so everything that changes it - a click,
     * a script, find-in-page - lands here and nowhere else.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.apply();
      this.dispatchEvent(new CustomEvent("disclosure-toggle", {
        bubbles: true,
        detail: { region: this.region, open: this.open }
      }));
    }
    onClick(e) {
      const button = e.target.closest && e.target.closest("button");
      if (!button || button !== this.button) return;
      this.open = !this.open;
    }
    onBeforeMatch() {
      this.open = true;
    }
  };
  define("disclosure-elemental", DisclosureElemental);
})();
//# sourceMappingURL=disclosure.js.map
