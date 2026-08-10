/* book-of-elementals v0.7.2 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/navbar/index.js
  function stepIndex2(current, key, length) {
    if (length === 0) return null;
    const to = key === "ArrowDown" || key === "ArrowRight" ? current + 1 : key === "ArrowUp" || key === "ArrowLeft" ? current - 1 : key === "Home" ? 0 : key === "End" ? length - 1 : null;
    if (to === null || to < 0 || to >= length) return null;
    return to;
  }
  function navbarMode(matches, overflowed, total, minimum = 1) {
    if (!matches) return "stack";
    const floor = Number.isFinite(minimum) && minimum >= 1 ? minimum : 1;
    return total > 0 && total - overflowed < floor ? "stack" : "bar";
  }
  function probeState(hasPanel) {
    return hasPanel ? { "aria-expanded": "false" } : null;
  }
  function ownsRow(ancestors) {
    return !ancestors.some((tag) => tag.includes("-"));
  }
  function hoverIntent(branch, trigger) {
    if (!branch) return null;
    return { except: branch, open: trigger || null };
  }
  var OVERFLOW_TOLERANCE = 0.99;
  var VERTICAL = ["ArrowUp", "ArrowDown", "Home", "End"];
  var HOVER_CLOSE_DELAY = 250;
  var navbarCount = 0;
  var NavbarElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["media", "min-bar-items", "open"];
    }
    /**
     * The row: the first list in the element that no other custom element between them owns. A
     * nested `<navbar-elemental>` keeps its own, and so does anything else on the bar that
     * writes a list - see `ownsRow`.
     */
    get row() {
      const list = this.querySelector("ul, menu");
      if (!list) return null;
      const ancestors = [];
      for (let node = list.parentElement; node && node !== this; node = node.parentElement) {
        ancestors.push(node.localName);
      }
      return ownsRow(ancestors) ? list : null;
    }
    /**
     * The box the row is measured inside, which is whatever the page put the row in. The copy
     * goes in here beside it, so the two are the same width without either of them having to
     * be told what that width is.
     */
    get rail() {
      const row = this.row;
      return row ? row.parentElement : null;
    }
    /** The item holding the overflow button, if the page authored one. */
    get moreItem() {
      const row = this.row;
      return row ? row.querySelector(":scope > [data-navbar-more]") : null;
    }
    /** The list inside it, which the element fills with copies. */
    get morePanel() {
      const item = this.moreItem;
      return item ? item.querySelector("ul, menu") : null;
    }
    /** The button that opens the drawer in stack mode. */
    get toggle() {
      return this.querySelector("[data-navbar-toggle]");
    }
    /**
     * The items being measured: the row's own, minus the two kinds that are not links competing
     * for room - the overflow button, and anything the page has marked as the drawer's alone.
     */
    get items() {
      const row = this.row;
      if (!row) return [];
      return Array.from(row.querySelectorAll(":scope > li:not([data-navbar-more]):not([data-navbar-stack])"));
    }
    /** Every list in this navbar, the row included. */
    get lists() {
      const row = this.row;
      if (!row) return [];
      return [row].concat(Array.from(row.querySelectorAll("ul, menu")));
    }
    /**
     * How many links have to fit for this to still be a bar. One - a bar that keeps going until
     * nothing at all is left on it - unless the page says otherwise.
     */
    get minBarItems() {
      return Number.parseInt(this.getAttribute("min-bar-items"), 10);
    }
    /** Whether the bar is currently the drawer rather than the row. */
    get stacked() {
      return this.dataset.mode === "stack";
    }
    /** Whether the drawer is showing. Reflected, so `[open]` is a styling hook too. */
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      this.toggleAttribute("open", !!value);
    }
    /**
     * Whether a mouse opens a panel by pointing at it rather than by clicking.
     *
     * Opt-in, and only ever an addition. Off while stacked, where the panels are in the flow
     * and a pointer crossing the drawer on its way somewhere would open every one it passed.
     */
    get hover() {
      return this.hasAttribute("hover") && !this.stacked;
    }
    set hover(value) {
      this.toggleAttribute("hover", !!value);
    }
    connectedCallback() {
      if (this.initialized) return;
      const row = this.row;
      if (!row || !this.rail) return;
      this.initialized = true;
      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.onPointerOver = this.onPointerOver.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onMediaChange = this.onMediaChange.bind(this);
      this.onIntersect = this.onIntersect.bind(this);
      this.onBeforeMatch = this.onBeforeMatch.bind(this);
      this.watched = /* @__PURE__ */ new WeakSet();
      this.rail.setAttribute("data-navbar-rail", "");
      this.copies = this.fillMore();
      this.probe = this.buildProbe();
      this.probeItems = Array.from(this.probe.querySelectorAll(":scope > li:not([data-navbar-more])"));
      for (const list of this.lists) {
        if (list !== row) list.setAttribute("hidden", "");
      }
      this.addEventListener("click", this.onClick);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("focusout", this.onFocusOut);
      this.addEventListener("pointerover", this.onPointerOver);
      this.addEventListener("pointerleave", this.onPointerLeave);
      document.addEventListener("click", this.onDocumentClick);
      this.watchMedia();
      this.fillToggle();
      this.wire();
      this.observe();
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("focusout", this.onFocusOut);
      this.removeEventListener("pointerover", this.onPointerOver);
      this.removeEventListener("pointerleave", this.onPointerLeave);
      document.removeEventListener("click", this.onDocumentClick);
      clearTimeout(this.hoverTimer);
      if (this.observer) this.observer.disconnect();
      if (this.query) this.query.removeEventListener("change", this.onMediaChange);
      if (this.probe) this.probe.remove();
      const bars = this.toggle && this.toggle.querySelector(":scope > [data-navbar-bars]");
      if (bars) bars.remove();
      for (const copy of this.copies || []) copy.remove();
      for (const list of this.lists) list.removeAttribute("hidden");
      for (const item of this.items) item.removeAttribute("data-overflow");
      if (this.rail) this.rail.removeAttribute("data-navbar-rail");
      delete this.dataset.mode;
      this.removeAttribute("data-overflowing");
      this.initialized = false;
    }
    // ---- generated markup ----
    /**
     * The bars inside the drawer's button.
     *
     * A hamburger that crosses into an X is three lines, and a button has two pseudo-elements -
     * so one of the three has to be an element. It is written here rather than asked of the
     * page: every toggle already out there is an empty `<button>`, and a look that only works
     * for markup written after it shipped is a look nobody sees. `aria-hidden`, because the
     * button's label is its name and this is a picture of what the button does.
     *
     * Nothing is drawn without the optional theme; the attribute is a hook for whoever wants
     * to draw their own.
     */
    fillToggle() {
      const toggle = this.toggle;
      if (!toggle || toggle.querySelector(":scope > [data-navbar-bars]")) return;
      const bars = document.createElement("span");
      bars.setAttribute("data-navbar-bars", "");
      bars.setAttribute("aria-hidden", "true");
      toggle.prepend(bars);
    }
    /**
     * Put a copy of every item inside the overflow panel, and hand back the copies in the
     * order their originals are in.
     *
     * Copies rather than the items themselves, because moving an item out of the row would
     * move it out of the thing being measured - and because a link that is both on the bar and
     * in the panel is one link the reader can reach two ways, which is the point of an
     * overflow.
     */
    fillMore() {
      const panel = this.morePanel;
      if (!panel) return [];
      return this.items.map((item) => panel.appendChild(item.cloneNode(true)));
    }
    /**
     * Build the copy of the row that gets measured, and put it in the rail beside the row.
     *
     * Two things are done to it, and both are about width. The panels come out: an absolutely
     * positioned box adds nothing to a row's width, and a copy of one would be a second box
     * answering to the same anchor name. And the overflow item moves to the front, where its
     * box reserves exactly the room it is going to take at the other end - the row has to be
     * measured against the space that will be left once the overflow button is on it, or the
     * last link and the button would fight over the same pixels.
     *
     * The stylesheet hides it, but the copy is a second, focusable, announced navigation
     * until it does - so the neutralising is done here too, where it holds whether or not the
     * structure styles ever arrive.
     */
    buildProbe() {
      const probe = this.row.cloneNode(true);
      probe.setAttribute("data-navbar-probe", "");
      probe.inert = true;
      probe.setAttribute("aria-hidden", "true");
      for (const button of probe.querySelectorAll("li > button")) {
        const state = probeState(!!button.parentElement.querySelector(":scope > ul, :scope > menu"));
        for (const [name, value] of Object.entries(state || {})) button.setAttribute(name, value);
      }
      for (const panel of probe.querySelectorAll("ul, menu")) panel.remove();
      for (const one of probe.querySelectorAll("[data-navbar-stack]")) one.remove();
      for (const one of probe.querySelectorAll("[id]")) one.removeAttribute("id");
      probe.removeAttribute("id");
      const more = probe.querySelector("[data-navbar-more]");
      if (more) probe.prepend(more);
      return this.rail.appendChild(probe);
    }
    // ---- structure ----
    /** The items of one list: what its `<li>`s hold, and not what its panels do. */
    itemsOf(list) {
      return list ? Array.from(list.querySelectorAll(":scope > li > a, :scope > li > button")) : [];
    }
    /**
     * The row's own control whose branch this node sits in, however deep inside a panel it is.
     * A pointer over a link three levels down is still pointing at the item on the bar that
     * opened the panels above it.
     */
    branchOf(node) {
      const row = this.row;
      if (!row || !node || !node.closest) return null;
      let item = node.closest("li");
      while (item && item.parentElement !== row) {
        item = item.parentElement ? item.parentElement.closest("li") : null;
      }
      return item ? item.querySelector(":scope > a, :scope > button") : null;
    }
    /** The list a trigger opens, if it opens one. */
    panelOf(trigger) {
      return trigger.parentElement && trigger.parentElement.querySelector(":scope > ul, :scope > menu");
    }
    /** The trigger that opens a list: the button beside it in the same `<li>`. */
    triggerOf(list) {
      return list.parentElement && list.parentElement.querySelector(":scope > button");
    }
    isOpen(list) {
      return !list.hasAttribute("hidden");
    }
    /**
     * The set the arrow keys walk from here.
     *
     * A panel is its own surface, so inside one the arrows stay inside it. On the bar they walk
     * the bar. Stacked, there are no surfaces: the open panels are on screen, in the flow, and
     * stopping at the edge of a list the reader is looking straight through would be arbitrary.
     */
    navigable(from) {
      const panel = from.closest("ul, menu");
      if (this.stacked) return this.visibleItems(this.row);
      if (panel && panel !== this.row) return this.itemsOf(panel);
      return this.itemsOf(this.row).filter((item) => item.offsetParent);
    }
    /** Every item on screen from `list` down, in the order they are rendered. */
    visibleItems(list) {
      const out = [];
      for (const item of this.itemsOf(list)) {
        out.push(item);
        const panel = this.panelOf(item);
        if (panel && this.isOpen(panel)) out.push(...this.visibleItems(panel));
      }
      return out;
    }
    // ---- wiring ----
    watchMedia() {
      if (this.query) this.query.removeEventListener("change", this.onMediaChange);
      const media = this.getAttribute("media");
      this.query = media && window.matchMedia ? window.matchMedia(media) : null;
      if (this.query) this.query.addEventListener("change", this.onMediaChange);
    }
    onMediaChange() {
      this.apply();
    }
    /**
     * Point every trigger at what it opens. `aria-expanded` and `aria-controls` are the whole
     * of the ARIA here - there is no role to write, which is the pattern's point.
     */
    wire() {
      for (const list of this.lists) {
        if (!list.id) list.id = "navbar-elemental-" + ++navbarCount;
        if (!this.watched.has(list)) {
          list.addEventListener("beforematch", this.onBeforeMatch);
          this.watched.add(list);
        }
        const trigger = list === this.row ? this.toggle : this.triggerOf(list);
        if (!trigger) continue;
        if (!trigger.hasAttribute("type")) trigger.type = "button";
        trigger.setAttribute("aria-controls", list.id);
        trigger.setAttribute("aria-expanded", this.isOpen(list) ? "true" : "false");
      }
    }
    observe() {
      if (typeof IntersectionObserver === "undefined") return;
      this.observer = new IntersectionObserver(this.onIntersect, {
        root: this.probe,
        threshold: 1
      });
      for (const item of this.probeItems) this.observer.observe(item);
    }
    onIntersect(entries) {
      for (const entry of entries) {
        const at = this.probeItems.indexOf(entry.target);
        if (at < 0) continue;
        const overflowing = entry.intersectionRatio < OVERFLOW_TOLERANCE;
        this.items[at].toggleAttribute("data-overflow", overflowing);
        if (this.copies[at]) this.copies[at].hidden = !overflowing;
      }
      this.apply();
    }
    /**
     * Push the current mode onto the element, and the drawer's state onto the row.
     *
     * Crossing between the two closes whatever was open, because what was open belonged to the
     * other widget: a dropdown left open on a bar that has just become a drawer is a floating
     * panel in a stack.
     */
    apply() {
      const items = this.items;
      const overflowed = items.filter((item) => item.hasAttribute("data-overflow")).length;
      const mode = navbarMode(!this.query || this.query.matches, overflowed, items.length, this.minBarItems);
      const changed = this.dataset.mode !== mode;
      this.dataset.mode = mode;
      this.toggleAttribute("data-overflowing", mode === "bar" && overflowed > 0 && overflowed < items.length);
      if (changed) {
        this.closePanels(this.row);
        if (mode === "bar" && this.open) this.open = false;
      }
      this.applyDrawer();
      if (changed) this.wire();
    }
    /**
     * The drawer is the row itself, hidden behind the toggle while stacked and simply the bar
     * again while not - so there is one list in the page rather than a row and a copy of it in
     * a panel, and one set of links to keep in step with the site.
     */
    applyDrawer() {
      const row = this.row;
      const toggle = this.toggle;
      if (!row) return;
      if (toggle) toggle.setAttribute("aria-expanded", this.open ? "true" : "false");
      if (!this.stacked || this.open || !toggle) {
        row.removeAttribute("hidden");
        return;
      }
      row.setAttribute("hidden", "until-found");
    }
    // ---- opening and closing ----
    /**
     * Show or hide one panel.
     *
     * On the bar the panels overlap, so opening one closes its siblings - that is what makes a
     * bar readable. Stacked they are in the flow, and closing a branch the reader opened on
     * purpose only loses their place.
     */
    setPanel(trigger, open) {
      const panel = this.panelOf(trigger);
      if (!panel || this.isOpen(panel) === open) return;
      if (open && !this.stacked) this.closeSiblings(trigger);
      if (!open) this.closePanels(panel);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", this.stacked ? "until-found" : "");
      this.dispatchEvent(new CustomEvent("navbar-toggle", {
        bubbles: true,
        detail: { panel, open }
      }));
    }
    /** Close every other panel of the same list. */
    closeSiblings(trigger) {
      const list = trigger.closest("ul, menu");
      for (const other of this.itemsOf(list)) {
        if (other !== trigger && !this.holdsFocus(other)) this.setPanel(other, false);
      }
    }
    /** Close every open panel below a list, deepest first. */
    closePanels(list) {
      for (const item of this.itemsOf(list)) this.setPanel(item, false);
    }
    /** Whether the panel this trigger opens has focus in it. */
    holdsFocus(trigger) {
      const panel = this.panelOf(trigger);
      return !!panel && panel.contains(document.activeElement);
    }
    /** Close every panel on the bar, except one, and except any the keyboard is inside. */
    closeBar(except) {
      if (this.stacked) return;
      for (const item of this.itemsOf(this.row)) {
        if (item !== except && !this.holdsFocus(item)) this.setPanel(item, false);
      }
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "media") {
        this.watchMedia();
        this.apply();
        return;
      }
      if (name === "min-bar-items") {
        this.apply();
        return;
      }
      this.applyDrawer();
      this.dispatchEvent(new CustomEvent("navbar-toggle", {
        bubbles: true,
        detail: { panel: this.row, open: this.open }
      }));
    }
    // ---- input ----
    /** The control this event happened on, or null for anything outside this navbar. */
    controlFor(e) {
      const control = e.target.closest && e.target.closest("a, button");
      return control && control.closest("navbar-elemental") === this ? control : null;
    }
    onClick(e) {
      const control = this.controlFor(e);
      if (!control) return;
      if (control === this.toggle) {
        this.open = !this.open;
        return;
      }
      const panel = this.panelOf(control);
      if (panel) {
        this.setPanel(control, !this.isOpen(panel));
        return;
      }
      this.closeBar(null);
    }
    onKeyDown(e) {
      const control = this.controlFor(e);
      if (!control) return;
      if (e.key === "Escape") {
        const list = control.closest("ul, menu");
        if (!list) return;
        e.preventDefault();
        this.closeBranch(list);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if ((e.key === "ArrowDown" || e.key === "ArrowRight") && !this.stacked) {
        const panel = this.panelOf(control);
        if (panel && this.isOpen(panel)) {
          const first = this.itemsOf(panel)[0];
          if (first) {
            e.preventDefault();
            first.focus();
            return;
          }
        }
      }
      const set = this.navigable(control);
      const to = stepIndex2(set.indexOf(control), e.key, set.length);
      if (to === null) {
        const list = control.closest("ul, menu");
        const inside = this.stacked || list && list !== this.row;
        if (inside && VERTICAL.includes(e.key)) e.preventDefault();
        return;
      }
      e.preventDefault();
      set[to].focus();
    }
    /**
     * Close the list focus is in and hand focus back to whatever opened it. Off the end of a
     * panel, Escape goes to that panel's own trigger; on the bar itself it closes the drawer.
     */
    closeBranch(list) {
      if (list === this.row) {
        if (!this.open) return;
        this.open = false;
        if (this.toggle) this.toggle.focus();
        return;
      }
      const trigger = this.triggerOf(list);
      if (!trigger) return;
      this.setPanel(trigger, false);
      trigger.focus();
    }
    /**
     * Point at it and it opens - and pointing at one panel is also the instruction to close the
     * others, since they overlap and only one of them can be read at a time.
     *
     * `pointerover` rather than `pointerenter` because it bubbles, so one listener covers every
     * item; mouse only, because a touch "hover" is the tap that was about to choose something.
     */
    onPointerOver(e) {
      if (!this.hover || e.pointerType !== "mouse") return;
      clearTimeout(this.hoverTimer);
      const control = this.controlFor(e);
      const intent = hoverIntent(this.branchOf(e.target), control && this.panelOf(control) ? control : null);
      if (!intent) return;
      this.closeBar(intent.except);
      if (intent.open) this.setPanel(intent.open, true);
    }
    /**
     * The pointer has left the whole bar, so the panels close - after a beat, because the gap
     * between a label and its panel is a place the pointer passes through rather than a place
     * it means to be.
     */
    onPointerLeave(e) {
      if (!this.hover || e.pointerType !== "mouse") return;
      clearTimeout(this.hoverTimer);
      this.hoverTimer = setTimeout(() => this.closeBar(null), HOVER_CLOSE_DELAY);
    }
    /**
     * Tab out of a panel and it is behind you. The APG asks for this, and `1.4.13 Content on
     * Hover or Focus` asks for it too: `relatedTarget` is null when focus lands outside the
     * document altogether, which counts as leaving.
     */
    onFocusOut(e) {
      if (this.stacked) return;
      const next = e.relatedTarget;
      for (const item of this.itemsOf(this.row)) {
        const panel = this.panelOf(item);
        if (panel && !panel.contains(next) && item !== next) this.setPanel(item, false);
      }
    }
    onDocumentClick(e) {
      if (this.contains(e.target)) return;
      this.closeBar(null);
    }
    onBeforeMatch(e) {
      const list = e.currentTarget;
      if (list === this.row) {
        this.open = true;
        return;
      }
      const trigger = this.triggerOf(list);
      if (trigger) trigger.setAttribute("aria-expanded", "true");
    }
  };
  define("navbar-elemental", NavbarElemental);
})();
//# sourceMappingURL=navbar.js.map
