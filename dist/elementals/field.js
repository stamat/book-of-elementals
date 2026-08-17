/* book-of-elementals v0.11.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/field/index.js
  var fieldCount = 0;
  function fieldAction(type, valid, showing, dirty) {
    if (type === "invalid") return "show";
    if (type === "reset") return "clear";
    if (type === "blur") {
      if (valid) return showing ? "clear" : "ignore";
      return dirty ? "show" : "ignore";
    }
    if (type === "input" || type === "change") {
      if (!showing) return "ignore";
      return valid ? "clear" : "show";
    }
    return "ignore";
  }
  var NOT_THE_CONTROL = /* @__PURE__ */ new Set(["hidden", "submit", "reset", "button", "image"]);
  var FieldElemental = class extends ElementBase {
    /**
     * The control being validated: the first one in here that a reader could put a value in.
     *
     * First rather than every, because a message belongs to a field and a field holds one
     * answer. A set of radios or checkboxes sharing one question is a `<fieldset>` and a
     * different element - wrapping one here would point the message at the first radio and
     * describe the group by whichever of them the reader happened to land on.
     */
    get control() {
      for (const el of this.querySelectorAll("input, select, textarea")) {
        if (el.type && NOT_THE_CONTROL.has(el.type)) continue;
        return el;
      }
      return null;
    }
    /** The message. The author's if they rendered one, otherwise the one added at upgrade. */
    get error() {
      return this.querySelector(":scope > .field-elemental-error");
    }
    /** Whether a message is on screen. */
    get showing() {
      const error = this.error;
      return !!error && !error.hidden;
    }
    /**
     * Whether the reader has put anything in the field.
     *
     * A tick box holds its answer in `checked`; its `value` is the string that would be
     * submitted and is `"on"` whether or not it has been ticked, so reading `value` here
     * would call every untouched box filled in and complain at a reader tabbing past it.
     */
    get dirty() {
      const control = this.control;
      if (!control) return false;
      if (control.type === "checkbox" || control.type === "radio") return control.checked;
      return control.value !== "";
    }
    connectedCallback() {
      if (this.initialized) return;
      const control = this.control;
      if (!control) return;
      this.initialized = true;
      if (!control.id) control.id = "field-elemental-" + ++fieldCount;
      let error = this.error;
      if (!error) {
        error = document.createElement("p");
        error.className = "field-elemental-error";
        error.hidden = true;
        this.append(error);
      }
      if (!error.id) error.id = control.id + "-error";
      this.describedBy = control.getAttribute("aria-describedby") || "";
      if (this.serverMessage === void 0) this.serverMessage = error.textContent.trim();
      if (this.serverMessage) this.show(this.serverMessage);
      else this.clear();
      this.onEvent = this.onEvent.bind(this);
      for (const type of ["invalid", "blur", "input", "change"]) control.addEventListener(type, this.onEvent);
      if (control.form) control.form.addEventListener("reset", this.onEvent);
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      const control = this.control;
      if (control) {
        for (const type of ["invalid", "blur", "input", "change"]) control.removeEventListener(type, this.onEvent);
        if (control.form) control.form.removeEventListener("reset", this.onEvent);
      }
      this.initialized = false;
    }
    onEvent(e) {
      if (e.type === "invalid") {
        e.preventDefault();
        this.takeFocus();
      }
      setTimeout(() => this.settle(e.type), 0);
    }
    /**
     * What the control says now, and what to do about it.
     *
     * `validity.valid` rather than `checkValidity()`, which is the same answer with an
     * `invalid` event fired alongside it - straight back into `onEvent`, where every blur
     * would arrive as a refused submit and light up a field nobody has filled in yet.
     */
    settle(type) {
      if (!this.initialized) return;
      const control = this.control;
      if (!control) return;
      const action = fieldAction(type, control.validity.valid, this.showing, this.dirty);
      if (action === "clear" && type === "reset" && this.serverMessage) this.show(this.serverMessage);
      else if (action === "show") this.show(control.validationMessage);
      else if (action === "clear") this.clear();
    }
    /**
     * Put focus on this control if it is the first thing in the form standing in the way.
     *
     * Cancelling `invalid` is what drops the bubble, and it drops the browser's focus with
     * it: measured in Chromium and WebKit, a refused submit then leaves focus on the button
     * (Chromium) or on `<body>` (WebKit). Either one is a form that says nothing and goes
     * nowhere, which is worse than the bubble this element was replacing.
     *
     * Every invalid control in the form gets its own `invalid` event, so without the check
     * the last of them would win the race and the reader would land past the field that
     * stopped the submit.
     */
    takeFocus() {
      const control = this.control;
      const form = control && control.form;
      if (!form) return;
      const first = form.querySelector(":is(input, select, textarea):invalid");
      if (!first || first === control) control.focus();
    }
    /** Put the message on screen and tie the control to it. */
    show(message) {
      const control = this.control;
      const error = this.error;
      if (!control || !error) return;
      error.textContent = message;
      error.hidden = false;
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", [this.describedBy, error.id].filter(Boolean).join(" "));
      this.announce(false, message);
    }
    /**
     * Take it down.
     *
     * Hidden rather than emptied, and unpointed-at rather than pointed at an empty
     * paragraph: a description that is there and says nothing is still read out as part of
     * the field, and `aria-invalid` left on a field that is now fine is the field lying about
     * itself.
     */
    clear() {
      const control = this.control;
      const error = this.error;
      if (!control || !error) return;
      const was = this.showing;
      error.textContent = "";
      error.hidden = true;
      control.removeAttribute("aria-invalid");
      if (this.describedBy) control.setAttribute("aria-describedby", this.describedBy);
      else control.removeAttribute("aria-describedby");
      if (was) this.announce(true, "");
    }
    announce(valid, message) {
      this.dispatchEvent(new CustomEvent("field-validity", {
        bubbles: true,
        detail: { valid, message }
      }));
    }
  };
  define("field-elemental", FieldElemental);
})();
//# sourceMappingURL=field.js.map
