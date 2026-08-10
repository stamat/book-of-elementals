/* book-of-elementals v0.7.2 | https://stamat.github.io/book-of-elementals/ | MIT License */
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

  // src/elementals/tabs/index.js
  function tabKey(key, vertical) {
    if (key === "Home" || key === "End") return key;
    if (key === (vertical ? "ArrowDown" : "ArrowRight")) return "ArrowDown";
    if (key === (vertical ? "ArrowUp" : "ArrowLeft")) return "ArrowUp";
    return null;
  }
  function selectedIndex(value, length) {
    const at = Math.trunc(Number(value));
    if (!(at > 0)) return 0;
    return Math.min(at, Math.max(length - 1, 0));
  }
  var FOCUSABLE = "a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]";
  function fragment(hash) {
    const raw = hash.slice(1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  var tabsCount = 0;
  var TabsElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["selected", "vertical"];
    }
    /** The tablist: the first list in the element. A nested `<tabs-elemental>` keeps its own. */
    get tablist() {
      const list = this.querySelector("ul, menu");
      return list && list.closest("tabs-elemental") === this ? list : null;
    }
    /** The tabs, in order. What the `<li>`s hold, so a link inside a panel is not one. */
    get tabs() {
      const list = this.tablist;
      return list ? Array.from(list.querySelectorAll(":scope > li > a, :scope > li > button")) : [];
    }
    /** The panels, in tab order. A tab with nothing to show keeps its place as `null`. */
    get panels() {
      return this.tabs.map((tab) => this.panelOf(tab));
    }
    /**
     * The panel a tab shows: what its `aria-controls` or its own `#fragment` names, and
     * failing both, the child sitting in the same position.
     *
     * The fragment is the one worth writing markup for. A tab authored as a link to its own
     * panel is a working in-page link before this element exists and after it fails to
     * upgrade, and it means the relationship is stated once rather than in an `id` and an
     * `aria-controls` that can drift apart.
     */
    panelOf(tab) {
      const href = tab.getAttribute("href") || "";
      const id = tab.getAttribute("aria-controls") || (href.startsWith("#") ? fragment(href) : "");
      const named = id && document.getElementById(id);
      if (named) return named;
      const list = this.tablist;
      const rest = Array.from(this.children).filter((child) => child !== list);
      return rest[this.tabs.indexOf(tab)] || null;
    }
    /** Index of the selected tab. Reflected, so `[selected]` is a styling hook too. */
    get selected() {
      return selectedIndex(this.getAttribute("selected"), this.tabs.length);
    }
    set selected(value) {
      this.setAttribute("selected", value);
    }
    /** Whether the tablist runs down the page. The arrow keys go with it. */
    get vertical() {
      return this.hasAttribute("vertical");
    }
    set vertical(value) {
      this.toggleAttribute("vertical", !!value);
    }
    /**
     * Whether moving focus along the tablist also selects.
     *
     * Automatic is the default because it is what the APG recommends wherever showing a
     * panel is instant, which it is when the panel is already in the page. `manual` is for
     * the case that is not: a panel whose content arrives over the network, where arrowing
     * past four tabs would start four requests nobody asked for.
     */
    get manual() {
      return this.hasAttribute("manual");
    }
    set manual(value) {
      this.toggleAttribute("manual", !!value);
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.tablist || !this.tabs.length) return;
      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onBeforeMatch = this.onBeforeMatch.bind(this);
      this.onHashChange = this.onHashChange.bind(this);
      this.addEventListener("click", this.onClick);
      this.addEventListener("keydown", this.onKeyDown);
      window.addEventListener("hashchange", this.onHashChange);
      this.selectFromHash();
      this.initialized = true;
      this.wire();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("keydown", this.onKeyDown);
      window.removeEventListener("hashchange", this.onHashChange);
      const list = this.tablist;
      if (list) {
        list.removeAttribute("role");
        list.removeAttribute("aria-orientation");
        list.removeAttribute("data-tabs-list");
        for (const item of list.querySelectorAll(":scope > li")) item.removeAttribute("role");
      }
      for (const tab of this.tabs) {
        tab.removeAttribute("role");
        tab.removeAttribute("aria-selected");
        tab.removeAttribute("aria-controls");
        tab.removeAttribute("tabindex");
      }
      for (const panel of this.wired || []) this.release(panel);
      this.wired = [];
      this.initialized = false;
    }
    /** Take everything this element wrote back off a panel, and hand it to the page as it
     * was found. */
    release(panel) {
      panel.removeEventListener("beforematch", this.onBeforeMatch);
      panel.removeAttribute("hidden");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-labelledby");
      panel.removeAttribute("data-tabs-panel");
      panel.removeAttribute("tabindex");
    }
    /**
     * Read the markup and put the pattern on it - the roles, the pairings, the ids either
     * side of them - then push the current state through `apply`.
     *
     * Public and idempotent, because the tabs are the page's to change: add one, remove one,
     * swap the labels, and this is the one call that says so. Nothing observes the markup on
     * the element's behalf, which would be a `MutationObserver` running on every page that
     * never touches its tabs to save this one line on the pages that do.
     */
    wire() {
      const list = this.tablist;
      if (!list) return;
      const previous = this.wired || [];
      this.wired = [];
      list.setAttribute("role", "tablist");
      list.setAttribute("data-tabs-list", "");
      if (this.vertical) list.setAttribute("aria-orientation", "vertical");
      else list.removeAttribute("aria-orientation");
      for (const item of list.querySelectorAll(":scope > li")) item.setAttribute("role", "none");
      for (const tab of this.tabs) {
        if (!tab.id) tab.id = "tabs-elemental-tab-" + ++tabsCount;
        tab.setAttribute("role", "tab");
        if (tab.tagName === "BUTTON" && !tab.hasAttribute("type")) tab.type = "button";
        const panel = this.panelOf(tab);
        if (!panel) continue;
        if (!panel.id) panel.id = "tabs-elemental-panel-" + ++tabsCount;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        panel.setAttribute("data-tabs-panel", "");
        tab.setAttribute("aria-controls", panel.id);
        this.wired.push(panel);
        panel.addEventListener("beforematch", this.onBeforeMatch);
      }
      for (const panel of previous) {
        if (!this.wired.includes(panel)) this.release(panel);
      }
      this.apply();
    }
    /**
     * Push the selection onto the tabs and their panels.
     *
     * The roving tabindex is the half of this that is easy to miss: a tab strip is one stop
     * on the way through the page, not one stop per tab, so the selected tab is the only one
     * `Tab` can land on and the arrows do the rest.
     */
    apply() {
      const at = this.selected;
      this.tabs.forEach((tab, index) => {
        const on = index === at;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        const panel = this.panelOf(tab);
        if (!panel) return;
        if (!on) {
          panel.setAttribute("hidden", "until-found");
          panel.removeAttribute("tabindex");
          return;
        }
        panel.removeAttribute("hidden");
        if (panel.querySelector(FOCUSABLE)) panel.removeAttribute("tabindex");
        else panel.tabIndex = 0;
      });
    }
    /**
     * `selected` is the single source of truth, so a click, an arrow key, a script and a
     * deep link all land here and nowhere else.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "vertical") {
        this.wire();
        return;
      }
      this.apply();
      const tab = this.tabs[this.selected];
      this.dispatchEvent(new CustomEvent("tabs-select", {
        bubbles: true,
        detail: { tab: tab || null, panel: tab ? this.panelOf(tab) : null, index: this.selected }
      }));
    }
    /** The tab this event happened on, or null for anything else - a link inside a panel,
     * or a nested tab set's. */
    tabFor(e) {
      const control = e.target.closest && e.target.closest("a, button");
      if (!control) return null;
      return control.closest("ul, menu") === this.tablist ? control : null;
    }
    onClick(e) {
      const tab = this.tabFor(e);
      if (!tab) return;
      e.preventDefault();
      this.selected = this.tabs.indexOf(tab);
    }
    onKeyDown(e) {
      const tab = this.tabFor(e);
      if (!tab) return;
      if (e.key === " " && tab.tagName === "A") {
        e.preventDefault();
        tab.click();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const tabs = this.tabs;
      const to = nextIndex(tabs.indexOf(tab), tabKey(e.key, this.vertical), tabs.length);
      if (to === null) return;
      e.preventDefault();
      tabs[to].focus();
      if (!this.manual) this.selected = to;
    }
    onHashChange() {
      this.selectFromHash();
    }
    onBeforeMatch(e) {
      const at = this.panels.indexOf(e.currentTarget);
      if (at >= 0) this.selected = at;
    }
    /**
     * Select the tab whose panel holds the element the URL fragment points at, so a link
     * into a panel lands on it showing. Which is also the no-script story arriving: the tabs
     * are in-page links, and following one before this element upgrades leaves exactly this
     * fragment in the URL.
     */
    selectFromHash() {
      const id = fragment(window.location.hash);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      const at = this.panels.findIndex((panel) => panel && (panel === target || panel.contains(target)));
      if (at >= 0) this.selected = at;
    }
  };
  define("tabs-elemental", TabsElemental);
})();
//# sourceMappingURL=tabs.js.map
