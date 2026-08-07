/* book-of-elementals v0.6.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/switch/index.js
  function formValue(checked, disabled, value) {
    return checked && !disabled ? value : null;
  }
  function validityState(required, checked, customMessage, missingMessage) {
    if (customMessage) return { flags: { customError: true }, message: customMessage };
    if (required && !checked) return { flags: { valueMissing: true }, message: missingMessage };
    return { flags: {}, message: "" };
  }
  var borrowed;
  function borrowedValueMissingMessage() {
    if (borrowed === void 0) {
      let message = "";
      if (typeof document !== "undefined") {
        const probe = document.createElement("input");
        probe.type = "checkbox";
        probe.required = true;
        message = probe.validationMessage;
      }
      borrowed = message || "Please switch this on.";
    }
    return borrowed;
  }
  var SwitchElemental = class extends ElementBase {
    // Opts the element into form ownership: `name`, submission, reset, state restore,
    // validation and the disabled state a `<fieldset disabled>` hands down.
    static get formAssociated() {
      return true;
    }
    static get observedAttributes() {
      return ["checked", "value", "disabled", "required", "required-message"];
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
    /**
     * Disabled by its own attribute, or by a `<fieldset disabled>` somewhere above it -
     * which the button already answers for, since `:disabled` matches a button inside a
     * disabled fieldset whether or not it carries the attribute itself.
     */
    get disabled() {
      const button = this.button;
      return this.hasAttribute("disabled") || !!(button && button.matches(":disabled"));
    }
    set disabled(value) {
      this.toggleAttribute("disabled", !!value);
    }
    /** Whether the form refuses to submit while this is off. */
    get required() {
      return this.hasAttribute("required");
    }
    set required(value) {
      this.toggleAttribute("required", !!value);
    }
    /**
     * What this switch says while it is required and off, in three steps: its own
     * `required-message`, then whatever the page put on `SwitchElemental.requiredMessage`,
     * then the browser's own translated one. One switch, one page, or every language.
     */
    get requiredMessage() {
      return this.getAttribute("required-message") || this.constructor.requiredMessage || borrowedValueMissingMessage();
    }
    set requiredMessage(value) {
      this.setAttribute("required-message", value);
    }
    // The rest of the constraint API is the platform's, read straight off the internals so
    // there is no second copy of the state to disagree with it. Without `attachInternals`
    // there is no validation either, and a switch that always validates is the honest
    // answer there - the form it is in has no value from it to check in the first place.
    get validity() {
      return this.internals && this.internals.validity;
    }
    get validationMessage() {
      return this.internals ? this.internals.validationMessage : "";
    }
    get willValidate() {
      return this.internals ? this.internals.willValidate : false;
    }
    checkValidity() {
      return this.internals ? this.internals.checkValidity() : true;
    }
    reportValidity() {
      return this.internals ? this.internals.reportValidity() : true;
    }
    /** Your own message, for the constraint the browser cannot know about. `''` clears it. */
    setCustomValidity(message) {
      this.customMessage = message || "";
      this.validate();
    }
    /**
     * Push the current constraint onto the form. The button is the anchor, so the
     * browser's own bubble points at the control the reader has to flip - and not at an
     * element that is `display: contents` and has no box to point at.
     */
    validate() {
      if (!this.internals || !this.internals.setValidity) return;
      const { flags, message } = validityState(this.required, this.checked, this.customMessage, this.requiredMessage);
      this.internals.setValidity(flags, message, this.button || void 0);
    }
    connectedCallback() {
      if (this.initialized) return;
      const button = this.button;
      if (!button) return;
      this.initialized = true;
      if (!button.hasAttribute("type")) button.type = "button";
      button.setAttribute("role", "switch");
      this.defaultChecked = this.checked;
      this.buttonDisabled = button.hasAttribute("disabled");
      if (this.hasAttribute("disabled")) button.disabled = true;
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
      if (this.internals && this.internals.setFormValue) {
        this.internals.setFormValue(formValue(this.checked, this.disabled, this.value));
      }
      this.validate();
    }
    /**
     * The element's own `disabled` attribute, or a `<fieldset disabled>` above it. The
     * button is disabled with it, because a switch that takes focus and then does nothing
     * is worse than one that is plainly out of reach - and the form value goes with it.
     */
    formDisabledCallback(disabled) {
      const button = this.button;
      if (button) button.disabled = disabled || this.buttonDisabled;
      this.apply();
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
      if (name === "disabled") {
        this.formDisabledCallback(current !== null);
        return;
      }
      this.apply();
      if (name !== "checked") return;
      this.dispatchEvent(new CustomEvent("switch-toggle", {
        bubbles: true,
        detail: { checked: this.checked }
      }));
    }
    onClick(e) {
      const button = e.target.closest && e.target.closest("button");
      if (!button || button !== this.button || this.disabled) return;
      this.checked = !this.checked;
    }
  };
  /**
   * The page-wide default for what a required switch says while it is off. `null` means
   * the browser's own translated message is used, which is the right answer until a page
   * has a reason of its own - one line at boot changes every switch on it.
   */
  __publicField(SwitchElemental, "requiredMessage", null);
  define("switch-elemental", SwitchElemental);
})();
//# sourceMappingURL=switch.js.map
