/* book-of-elementals v1.0.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/copy/index.js
  function sourceText(target, value) {
    if (value != null) return value;
    if (!target) return "";
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      return target.value == null ? "" : String(target.value);
    }
    const text = target.innerText != null ? target.innerText : target.textContent;
    return text == null ? "" : text.replace(/^\n+/, "").replace(/\s+$/, "");
  }
  var FEEDBACK_MS = 2e3;
  var CopyElemental = class extends ElementBase {
    /** The `<button>` that copies. Direct child, so a button inside the block being
     * copied - or in a second copy button below - is not mistaken for the trigger. */
    get button() {
      return this.querySelector(":scope > button");
    }
    /** The element being copied: what `for` names, or nothing. Resolved on every press
     * rather than held, so a block that was re-rendered since the last one still copies. */
    get target() {
      const id = this.dataset.for != null ? this.dataset.for : this.getAttribute("for");
      return id ? document.getElementById(id) : null;
    }
    /** What a press would put on the clipboard, right now. */
    get text() {
      return sourceText(this.target, this.value);
    }
    /** The literal text to copy, or `null` for whatever `for` names. Reflected, so setting it
     * is how a page copies something it computed - a link's `href`, a formatted number. */
    get value() {
      return this.getAttribute("value");
    }
    set value(value) {
      if (value == null) this.removeAttribute("value");
      else this.setAttribute("value", value);
    }
    /** What the live region says on success. */
    get copiedText() {
      return this.getAttribute("copied-text") || "Copied";
    }
    /** What it says when there was nothing to copy, or the clipboard refused. */
    get errorText() {
      return this.getAttribute("error-text") || "Copy failed";
    }
    connectedCallback() {
      if (this.initialized) return;
      const button = this.button;
      if (!button) return;
      const named = this.hasAttribute("for") || this.dataset.for != null || this.hasAttribute("value");
      if (!named || typeof navigator === "undefined" || !navigator.clipboard || !navigator.clipboard.writeText) {
        this.dataset.unavailable = "";
        return;
      }
      delete this.dataset.unavailable;
      this.initialized = true;
      if (!button.hasAttribute("type")) button.type = "button";
      if (!this.status) {
        const status = document.createElement("span");
        status.className = "copy-elemental-status";
        status.setAttribute("role", "status");
        this.appendChild(status);
      }
      this.onClick = this.onClick.bind(this);
      this.addEventListener("click", this.onClick);
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      clearTimeout(this.announceTimer);
      clearTimeout(this.resetTimer);
      this.initialized = false;
    }
    /** The live region. Added at upgrade, because a live region only announces text that
     * lands in one already in the document. */
    get status() {
      return this.querySelector(":scope > .copy-elemental-status");
    }
    /**
     * Say something in the live region.
     *
     * A live region announces a *change*, so the same message set twice in a row is silent -
     * which would make every copy after the first one say nothing. Cleared first and set back
     * in a later task, so the two writes cannot coalesce into no change at all.
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
    /** Show and say how it went, then go quiet again. */
    feedback(ok, text) {
      this.dataset.state = ok ? "copied" : "error";
      this.announce(ok ? this.copiedText : this.errorText);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => {
        delete this.dataset.state;
        const status = this.status;
        if (status) status.textContent = "";
      }, FEEDBACK_MS);
      this.dispatchEvent(new CustomEvent("copy-done", {
        bubbles: true,
        detail: { ok, text }
      }));
    }
    onClick(e) {
      const button = e.target.closest && e.target.closest("button");
      if (!button || button !== this.button || button.disabled) return;
      const text = this.text;
      if (!text) {
        this.feedback(false, "");
        return;
      }
      navigator.clipboard.writeText(text).then(
        () => this.feedback(true, text),
        // The clipboard can refuse: a page that is not the active document, a permission
        // policy, a browser that wants the write closer to the gesture than a promise allows.
        () => this.feedback(false, text)
      );
    }
  };
  define("copy-elemental", CopyElemental);
})();
//# sourceMappingURL=copy.js.map
