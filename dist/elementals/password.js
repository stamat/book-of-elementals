/* book-of-elementals v0.9.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/password/index.js
  var passwordCount = 0;
  function revealAfter(event, shown) {
    if (event === "toggle") return !shown;
    if (event === "submit" || event === "reset") return false;
    return shown;
  }
  var PasswordElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["shown"];
    }
    /** The field being revealed: the first password or text input in here. Both, because
     * once it has been revealed the type is what this element changed it to. */
    get control() {
      return this.querySelector('input[type="password"], input[type="text"]');
    }
    /** The button that reveals it. Direct child or not - a reveal button is often inside a
     * wrapper holding it against the field's right edge. */
    get button() {
      return this.querySelector("button");
    }
    /** Whether the value is visible. Reflected, so a page can reveal one from script. */
    get shown() {
      return this.hasAttribute("shown");
    }
    set shown(value) {
      if (value) this.setAttribute("shown", "");
      else this.removeAttribute("shown");
    }
    /** The button's accessible name. Does not change with the state - `aria-pressed` does. */
    get label() {
      return this.getAttribute("label") || "Show password";
    }
    /** What the live region says once the value is on screen. */
    get shownText() {
      return this.getAttribute("shown-text") || "Your password is visible";
    }
    /** And once it is not. */
    get hiddenText() {
      return this.getAttribute("hidden-text") || "Your password is hidden";
    }
    connectedCallback() {
      if (this.initialized) return;
      const control = this.control;
      const button = this.button;
      if (!control || !button) return;
      this.initialized = true;
      if (!button.hasAttribute("type")) button.type = "button";
      button.setAttribute("aria-pressed", this.shown ? "true" : "false");
      if (!button.hasAttribute("aria-label") && !button.textContent.trim()) button.setAttribute("aria-label", this.label);
      if (!button.hasAttribute("aria-controls")) {
        if (!control.id) control.id = "password-elemental-" + ++passwordCount;
        button.setAttribute("aria-controls", control.id);
      }
      if (!this.status) {
        const status = document.createElement("span");
        status.className = "password-elemental-status";
        status.setAttribute("role", "status");
        this.appendChild(status);
      }
      this.onClick = this.onClick.bind(this);
      this.onForm = this.onForm.bind(this);
      this.addEventListener("click", this.onClick);
      if (control.form) {
        control.form.addEventListener("submit", this.onForm);
        control.form.addEventListener("reset", this.onForm);
      }
      this.render();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      const control = this.control;
      if (control && control.form) {
        control.form.removeEventListener("submit", this.onForm);
        control.form.removeEventListener("reset", this.onForm);
      }
      clearTimeout(this.announceTimer);
      this.initialized = false;
    }
    attributeChangedCallback() {
      if (this.initialized) this.render();
    }
    /** The live region. Added at upgrade, because a live region only announces text that
     * lands in one already in the document. */
    get status() {
      return this.querySelector(":scope > .password-elemental-status");
    }
    /** Put the field and the button into the state the `shown` attribute says they are in. */
    render() {
      const control = this.control;
      const button = this.button;
      if (!control || !button) return;
      const shown = this.shown;
      control.type = shown ? "text" : "password";
      button.setAttribute("aria-pressed", shown ? "true" : "false");
    }
    /**
     * Say something in the live region.
     *
     * A live region announces a *change*, so the same message set twice in a row is silent.
     * Cleared first and set back in a later task, so the two writes cannot coalesce into no
     * change at all.
     */
    announce(message) {
      const status = this.status;
      if (!status) return;
      status.textContent = "";
      clearTimeout(this.announceTimer);
      this.announceTimer = setTimeout(() => {
        status.textContent = message;
      }, 0);
    }
    /** Move to the state `event` calls for, and say so if it changed anything. */
    update(event) {
      const was = this.shown;
      const now = revealAfter(event, was);
      if (now === was) return;
      this.shown = now;
      this.render();
      this.announce(now ? this.shownText : this.hiddenText);
      this.dispatchEvent(new CustomEvent("password-reveal", {
        bubbles: true,
        detail: { shown: now }
      }));
    }
    onClick(e) {
      const button = e.target.closest && e.target.closest("button");
      if (!button || button !== this.button || button.disabled) return;
      this.update("toggle");
    }
    /**
     * A submit or a reset masks the field.
     *
     * `submit` fires only when the form is really being submitted - a browser that refuses
     * the submit on a constraint never dispatches it, measured in Chromium - so this lands
     * exactly at the moment the value is about to leave the page and at no other. There is
     * no trade to weigh: a reader whose submit was refused keeps the field the way they left
     * it, and nothing was submitted for a browser to remember.
     */
    onForm(e) {
      this.update(e.type);
    }
  };
  define("password-elemental", PasswordElemental);
})();
//# sourceMappingURL=password.js.map
