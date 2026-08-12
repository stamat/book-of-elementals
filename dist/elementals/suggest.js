/* book-of-elementals v0.7.3 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }
  function nextIndex(current, key, length) {
    if (length === 0) return null;
    switch (key) {
      case "ArrowDown":
        return (current + 1) % length;
      case "ArrowUp":
        return current <= 0 ? length - 1 : current - 1;
      case "Home":
        return 0;
      case "End":
        return length - 1;
      default:
        return null;
    }
  }
  function fits(at, size, limit) {
    return at >= 0 && at + size <= limit;
  }
  function placeFlyout(trigger, panel, viewport, rtl, centred) {
    const below = fits(trigger.bottom, panel.height, viewport.height);
    const above = fits(trigger.top - panel.height, panel.height, viewport.height);
    const side = below || !above ? "block-end" : "block-start";
    const middle = trigger.left + (trigger.right - trigger.left - panel.width) / 2;
    if (centred && fits(middle, panel.width, viewport.width)) return { side, align: "center" };
    const start = rtl ? trigger.right - panel.width : trigger.left;
    const end = rtl ? trigger.left : trigger.right - panel.width;
    return {
      side,
      align: fits(start, panel.width, viewport.width) || !fits(end, panel.width, viewport.width) ? "start" : "end"
    };
  }

  // src/elementals/suggest/index.js
  function suggestAction(key, altKey, open, cursor, tabCompletes) {
    if (!open) {
      if (key === "ArrowDown") return altKey ? "open" : "open-first";
      if (key === "ArrowUp") return "open-last";
      return null;
    }
    if (key === "ArrowUp" && altKey) return "close";
    if (key === "ArrowDown" || key === "ArrowUp") return "move";
    if (key === "Home" && cursor) return "first";
    if (key === "End" && cursor) return "last";
    if (key === "Enter") return "activate";
    if (key === "Escape") return "close";
    if (key === "Tab") return cursor && tabCompletes ? "activate" : "leave";
    return null;
  }
  function suggestState(open, activeId) {
    return {
      expanded: open ? "true" : "false",
      hidden: !open,
      activedescendant: open && activeId ? activeId : null
    };
  }
  var suggestCount = 0;
  var SuggestElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["open"];
    }
    /** The text field driving this popup - what `for` names. */
    get control() {
      const id = this.dataset.for != null ? this.dataset.for : this.getAttribute("for");
      return id ? document.getElementById(id) : null;
    }
    /** The options, in document order. Links only: an `<a>` with no `href` is not a
     * destination, and a listbox option that goes nowhere is a dead row on the list. */
    get options() {
      return Array.from(this.querySelectorAll("a[href]"));
    }
    /** Whether the popup is showing. Reflected, so `[open]` is a styling hook too. */
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      this.toggleAttribute("open", !!value);
    }
    /** Whether Tab takes the row under the cursor rather than leaving the field. */
    get tabCompletes() {
      return this.hasAttribute("tab-completes");
    }
    set tabCompletes(value) {
      this.toggleAttribute("tab-completes", !!value);
    }
    connectedCallback() {
      if (this.initialized) return;
      const control = this.control;
      if (!control) return;
      this.initialized = true;
      if (!this.id) this.id = "suggest-elemental-" + ++suggestCount;
      this.setAttribute("role", "listbox");
      control.setAttribute("role", "combobox");
      control.setAttribute("aria-controls", this.id);
      control.setAttribute("aria-autocomplete", "list");
      control.setAttribute("aria-expanded", "false");
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onClick = this.onClick.bind(this);
      control.addEventListener("keydown", this.onKeyDown);
      control.addEventListener("focusout", this.onFocusOut);
      this.addEventListener("pointermove", this.onPointerMove);
      this.addEventListener("mousedown", this.onMouseDown);
      this.addEventListener("click", this.onClick);
      this.observer = new MutationObserver(() => this.mark());
      this.observer.observe(this, { childList: true, subtree: true });
      this.mark();
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      this.removeEventListener("pointermove", this.onPointerMove);
      this.removeEventListener("mousedown", this.onMouseDown);
      this.removeEventListener("click", this.onClick);
      const control = this.control;
      if (!control) return;
      control.removeEventListener("keydown", this.onKeyDown);
      control.removeEventListener("focusout", this.onFocusOut);
      control.removeAttribute("role");
      control.removeAttribute("aria-controls");
      control.removeAttribute("aria-autocomplete");
      control.removeAttribute("aria-expanded");
      control.removeAttribute("aria-activedescendant");
    }
    /**
     * Give the current children the roles and `id`s the pattern needs.
     *
     * A `listbox` may only own `option`s, and the markup between them here is a `<ul>` and
     * an `<li>` per row - both of which carry list semantics of their own. `presentation`
     * takes those off without taking the boxes away, so the options are owned by the listbox
     * directly and the CSS still has its list to lay out.
     */
    mark() {
      const rows = this.querySelectorAll("ul, ol, li");
      for (const row of rows) row.setAttribute("role", "presentation");
      const options = this.options;
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        option.setAttribute("role", "option");
        if (!option.id) option.id = this.id + "-option-" + i;
      }
      this.active = null;
      this.applyCursor();
    }
    /** Push `open` onto the popup and its control. */
    apply() {
      const control = this.control;
      if (!control) return;
      const { expanded, hidden } = suggestState(this.open, null);
      control.setAttribute("aria-expanded", expanded);
      this.hidden = hidden;
      if (this.open) this.place();
      this.applyCursor();
    }
    /** Write the cursor - `aria-activedescendant` on the control, a marker on the option. */
    applyCursor() {
      const control = this.control;
      if (!control) return;
      for (const option of this.options) {
        if (option === this.active) option.setAttribute("data-active", "");
        else option.removeAttribute("data-active");
      }
      const { activedescendant } = suggestState(this.open, this.active ? this.active.id : null);
      if (activedescendant) control.setAttribute("aria-activedescendant", activedescendant);
      else control.removeAttribute("aria-activedescendant");
    }
    /**
     * Move the cursor to an index, and scroll it into view.
     *
     * `nearest` rather than `center`: the cursor usually moves one row at a time, and a
     * popup that re-centres on every arrow key slides the whole list under the reader when
     * only one line needed to come into view.
     *
     * @param {number|null} index
     */
    moveTo(index) {
      const options = this.options;
      this.active = index === null ? null : options[index];
      if (this.active) this.active.scrollIntoView({ block: "nearest" });
      this.applyCursor();
    }
    /**
     * Put the popup where there is room for it, as two attributes for the CSS to key off.
     *
     * The element does not write coordinates: a light-DOM popup lives in the page's own
     * stacking and layout, and an element setting `top` and `left` on it is an element
     * fighting whatever the page already decided. `data-side` and `data-align` say which
     * corner won, and the stylesheet spends them.
     */
    place() {
      const control = this.control;
      if (!control) return;
      const placement = placeFlyout(
        control.getBoundingClientRect(),
        { width: this.offsetWidth, height: this.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
        getComputedStyle(this).direction === "rtl"
      );
      this.dataset.side = placement.side;
      this.dataset.align = placement.align;
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.apply();
      this.dispatchEvent(new CustomEvent("suggest-toggle", {
        bubbles: true,
        detail: { open: this.open }
      }));
    }
    onKeyDown(e) {
      const action = suggestAction(e.key, e.altKey, this.open, !!this.active, this.tabCompletes);
      if (!action) return;
      const options = this.options;
      if (action === "close" || action === "leave") {
        if (!this.open) return;
        if (action === "close") e.preventDefault();
        this.open = false;
        return;
      }
      if (action === "activate") {
        if (!this.active) return;
        e.preventDefault();
        this.active.click();
        this.open = false;
        return;
      }
      if (!options.length) return;
      e.preventDefault();
      if (action === "first" || action === "last") {
        this.moveTo(action === "first" ? 0 : options.length - 1);
        return;
      }
      if (action === "move") {
        this.moveTo(nextIndex(options.indexOf(this.active), e.key, options.length));
        return;
      }
      this.open = true;
      if (action === "open-first") this.moveTo(0);
      else if (action === "open-last") this.moveTo(options.length - 1);
    }
    onFocusOut(e) {
      if (e.relatedTarget && this.contains(e.relatedTarget)) return;
      this.open = false;
    }
    onPointerMove(e) {
      const option = e.target.closest ? e.target.closest('[role="option"]') : null;
      if (!option || option === this.active) return;
      this.active = option;
      this.applyCursor();
    }
    onMouseDown(e) {
      e.preventDefault();
    }
    onClick(e) {
      const option = e.target.closest ? e.target.closest('[role="option"]') : null;
      if (!option) return;
      this.open = false;
    }
  };
  define("suggest-elemental", SuggestElemental);
})();
//# sourceMappingURL=suggest.js.map
