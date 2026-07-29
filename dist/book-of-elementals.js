/* book-of-elementals v0.1.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // src/core.js
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function readOptions(el, schema) {
    const options = {};
    for (const key in schema) {
      const kebab = key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      const raw = el.dataset[key] != null ? el.dataset[key] : el.getAttribute(kebab);
      if (raw == null) continue;
      if (schema[key] === "boolean") {
        options[key] = raw !== "false" && raw !== "0";
      } else if (schema[key] === "number") {
        const num = parseFloat(raw);
        if (!Number.isNaN(num)) options[key] = num;
      } else {
        options[key] = raw;
      }
    }
    return options;
  }
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/accordion/index.js
  function nextIndex(current, key, length) {
    if (length === 0) return null;
    switch (key) {
      case "ArrowDown":
        return (current + 1) % length;
      case "ArrowUp":
        return (current - 1 + length) % length;
      case "Home":
        return 0;
      case "End":
        return length - 1;
      default:
        return null;
    }
  }
  var OPTIONS = { exclusive: "boolean" };
  var groupCount = 0;
  var AccordionElemental = class extends ElementBase {
    /** Direct-child panels only, so a nested accordion is not swallowed. */
    get panels() {
      return Array.from(this.querySelectorAll(":scope > details"));
    }
    /** The `<summary>` of each panel, in document order. */
    get headers() {
      return this.panels.map((panel) => panel.querySelector(":scope > summary")).filter(Boolean);
    }
    connectedCallback() {
      if (this.initialized || !this.panels.length) return;
      this.initialized = true;
      this.options = Object.assign({ exclusive: false }, readOptions(this, OPTIONS));
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onToggle = this.onToggle.bind(this);
      this.onHashChange = this.onHashChange.bind(this);
      if (this.options.exclusive) this.applyExclusive();
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("toggle", this.onToggle, true);
      window.addEventListener("hashchange", this.onHashChange);
      this.openFromHash();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("toggle", this.onToggle, true);
      window.removeEventListener("hashchange", this.onHashChange);
      this.initialized = false;
    }
    /**
     * Give every panel the same `name`, which is what makes native `<details>`
     * mutually exclusive.
     */
    applyExclusive() {
      const panels = this.panels;
      let seenOpen = false;
      for (const panel of panels) {
        if (!panel.open) continue;
        if (seenOpen) panel.open = false;
        seenOpen = true;
      }
      if (!this.groupName) {
        this.groupName = this.getAttribute("name") || "accordion-elemental-" + ++groupCount;
      }
      for (const panel of panels) panel.name = this.groupName;
    }
    onKeyDown(e) {
      const summary = e.target.closest && e.target.closest("summary");
      if (!summary) return;
      const headers = this.headers;
      const current = headers.indexOf(summary);
      if (current === -1) return;
      const next = nextIndex(current, e.key, headers.length);
      if (next === null) return;
      e.preventDefault();
      headers[next].focus();
    }
    onToggle(e) {
      const panel = e.target;
      if (!this.panels.includes(panel)) return;
      this.dispatchEvent(new CustomEvent("accordion-toggle", {
        bubbles: true,
        detail: { panel, open: panel.open }
      }));
    }
    onHashChange() {
      this.openFromHash();
    }
    /**
     * Open the panel containing the element the URL fragment points at, so a link
     * to a single question lands on it opened.
     *
     * ponytail: Chrome already auto-expands `<details>` on fragment navigation;
     * this covers the browsers that do not. Drop it once that is everywhere.
     */
    openFromHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target || !this.contains(target)) return;
      let panel = target.closest("details");
      while (panel && this.contains(panel)) {
        panel.open = true;
        panel = panel.parentElement && panel.parentElement.closest("details");
      }
    }
  };
  define("accordion-elemental", AccordionElemental);
})();
//# sourceMappingURL=book-of-elementals.js.map
