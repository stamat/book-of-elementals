/* book-of-elementals v0.2.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // src/core.js
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/switch/index.js
  var SwitchElemental = class extends ElementBase {
    // Opts the element into form ownership: `name`, submission, reset and state restore.
    static get formAssociated() {
      return true;
    }
    static get observedAttributes() {
      return ["checked", "value"];
    }
    constructor() {
      super();
      if (typeof this.attachInternals === "function") this.internals = this.attachInternals();
    }
    /** The `<button>` that flips. Direct child, so a button in a label beside it - or
     * in a second switch nested somewhere below - is not mistaken for the control. */
    get button() {
      return this.querySelector(":scope > button");
    }
    /** Whether the switch is on. Reflected, so `[checked]` is a styling hook too. */
    get checked() {
      return this.hasAttribute("checked");
    }
    set checked(value) {
      this.toggleAttribute("checked", !!value);
    }
    connectedCallback() {
      if (this.initialized) return;
      const button = this.button;
      if (!button) return;
      this.initialized = true;
      if (!button.hasAttribute("type")) button.type = "button";
      button.setAttribute("role", "switch");
      this.defaultChecked = this.checked;
      this.onClick = this.onClick.bind(this);
      this.addEventListener("click", this.onClick);
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      this.initialized = false;
    }
    /** What the form submits when the switch is on. `on`, as a checkbox's is. */
    get value() {
      const value = this.getAttribute("value");
      return value === null ? "on" : value;
    }
    set value(value) {
      this.setAttribute("value", value);
    }
    /** Push the current state onto the button, and onto the form if there is one. */
    apply() {
      const button = this.button;
      if (button) button.setAttribute("aria-checked", this.checked ? "true" : "false");
      if (this.internals) this.internals.setFormValue(this.checked ? this.value : null);
    }
    /** The form is putting its controls back to the state the markup arrived in. */
    formResetCallback() {
      this.checked = this.defaultChecked;
    }
    /**
     * The browser is restoring this control after a back-navigation or a session restore,
     * with whatever `setFormValue` last put in. Off submitted nothing, so nothing coming
     * back is off.
     */
    formStateRestoreCallback(state) {
      this.checked = state !== null;
    }
    /**
     * `checked` is the single source of truth, so everything that changes it - a click,
     * a script, a boot script stamping the saved preference - lands here and nowhere else.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.apply();
      if (name === "value") return;
      this.dispatchEvent(new CustomEvent("switch-toggle", {
        bubbles: true,
        detail: { checked: this.checked }
      }));
    }
    onClick(e) {
      const button = e.target.closest && e.target.closest("button");
      if (!button || button !== this.button) return;
      this.checked = !this.checked;
    }
  };
  define("switch-elemental", SwitchElemental);
})();
//# sourceMappingURL=switch.js.map
