/* book-of-elementals v0.2.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/book-of-spells/src/helpers.mjs
  function stringToNumber(str) {
    if (/^\s*-?\d+\s*$/.test(str)) return parseInt(str);
    if (/^\s*-?\d+\.\d+\s*$/.test(str)) return parseFloat(str);
  }
  function isFunction(o) {
    return typeof o === "function";
  }
  function transformCamelCaseToDash(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  // node_modules/book-of-spells/src/dom.mjs
  function cssTimeToMilliseconds(duration) {
    const regExp = new RegExp("([0-9.]+)([a-z]+)", "i");
    const matches = regExp.exec(duration);
    if (!matches) return 0;
    const unit = matches[2];
    switch (unit) {
      case "ms":
        return parseFloat(matches[1]);
      case "s":
        return parseFloat(matches[1]) * 1e3;
      default:
        return 0;
    }
  }
  function getTransitionDurations(element) {
    if (!element) return {};
    const styles = getComputedStyle(element);
    const transitionProperties = styles.getPropertyValue("transition-property").split(",");
    const transitionDurations = styles.getPropertyValue("transition-duration").split(",");
    const map = {};
    for (let i = 0; i < transitionProperties.length; i++) {
      const property = transitionProperties[i].trim();
      map[property] = cssTimeToMilliseconds(transitionDurations[i % transitionDurations.length].trim());
    }
    return map;
  }
  function readOptions(element, schema) {
    const options = {};
    if (!element || !schema) return options;
    for (const key in schema) {
      const raw = element.dataset[key] != null ? element.dataset[key] : element.getAttribute(transformCamelCaseToDash(key));
      if (raw == null) continue;
      if (schema[key] === "boolean") {
        options[key] = raw !== "false" && raw !== "0";
      } else if (schema[key] === "number") {
        const num = stringToNumber(raw);
        if (num !== void 0) options[key] = num;
      } else {
        options[key] = raw;
      }
    }
    return options;
  }
  function getTransitionDuration(element, property = "all") {
    const durations = getTransitionDurations(element);
    if (durations.hasOwnProperty(property)) return durations[property];
    if (durations.hasOwnProperty("all")) return durations.all;
    return 0;
  }

  // node_modules/book-of-spells/src/browser.mjs
  function mediaMatcher(query, callback) {
    if (isFunction(callback)) {
      const mql = matchMedia(query);
      mql.addEventListener("change", (e) => {
        callback(e.matches);
      });
      callback(mql.matches);
      return mql.matches;
    }
    return matchMedia(query).matches;
  }
  function prefersReducedMotion(callback) {
    if (typeof matchMedia !== "function") return false;
    return mediaMatcher("(prefers-reduced-motion: reduce)", callback);
  }

  // node_modules/book-of-spells/src/animations.mjs
  var TRANSITION_TIMER_GRACE = 10;
  function clearTransitionTimer(element, property = "all") {
    if (!element) return;
    const dataPropName = `${property}TransitionTimer`;
    if (!element.dataset[dataPropName]) return;
    clearTimeout(parseInt(element.dataset[dataPropName]));
    delete element.dataset[dataPropName];
  }
  function setTransitionTimer(element, property = "all", timeout, callback) {
    if (!element) return;
    const dataPropName = `${property}TransitionTimer`;
    const timer = setTimeout(() => {
      clearTransitionTimer(element, property);
      if (isFunction(callback)) callback(element);
    }, timeout);
    element.dataset[dataPropName] = timer.toString();
    return timer;
  }
  function slide(element, from, open, callback) {
    if (!element) return;
    clearTransitionTimer(element, "height");
    const duration = prefersReducedMotion() ? 0 : getTransitionDuration(element, "height");
    const done = (element2) => {
      element2.style.removeProperty("height");
      element2.style.removeProperty("overflow");
      if (isFunction(callback)) callback(element2);
    };
    if (!duration) return done(element);
    element.style.overflow = "hidden";
    element.style.height = `${from}px`;
    const full = element.scrollHeight;
    element.style.height = `${open ? full : 0}px`;
    setTransitionTimer(element, "height", duration + TRANSITION_TIMER_GRACE, done);
  }

  // src/core.js
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

  // src/elementals/accordion/index.js
  var OPTIONS = { exclusive: "boolean" };
  var WRAPPER_CLASS = "accordion-elemental-content-wrapper";
  var CONTENT_CLASS = "accordion-elemental-content";
  var CLOSING_CLASS = "accordion-elemental-closing";
  var DETACHED_NAME = Symbol("detachedName");
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
      this.onClick = this.onClick.bind(this);
      this.onToggle = this.onToggle.bind(this);
      this.onHashChange = this.onHashChange.bind(this);
      this.wrapPanels();
      if (this.options.exclusive) this.applyExclusive();
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("click", this.onClick);
      this.addEventListener("toggle", this.onToggle, true);
      window.addEventListener("hashchange", this.onHashChange);
      this.openFromHash();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("toggle", this.onToggle, true);
      window.removeEventListener("hashchange", this.onHashChange);
      this.initialized = false;
    }
    /**
     * Wrap each panel body in two divs, because a height transition needs one box to
     * measure and clip and `<details>` hands you a bare run of siblings. Idempotent,
     * so moving the group in the DOM does not nest a second wrapper.
     *
     * Two rather than one because the box being animated cannot be padded: block
     * padding is a floor the height cannot get under, since `box-sizing: border-box`
     * renders `height: 0` as the padding, and the panel would slide shut down to it
     * and then cut. The outer box is the library's and stays inert; the inner one is
     * where a stylesheet puts the panel's inset, on one box rather than spread over
     * whichever children it thought to name.
     *
     * ponytail: `::details-content` is the wrapper the platform already has, but
     * animating it from 0 to `auto` also needs `interpolate-size`, which is not
     * everywhere yet. Drop the outer div for the pseudo-element once it is.
     */
    wrapPanels() {
      for (const panel of this.panels) {
        const summary = panel.querySelector(":scope > summary");
        if (!summary) continue;
        if (panel.querySelector(":scope > ." + WRAPPER_CLASS)) continue;
        const wrapper = document.createElement("div");
        wrapper.className = WRAPPER_CLASS;
        const content = document.createElement("div");
        content.className = CONTENT_CLASS;
        wrapper.appendChild(content);
        let node = summary.nextSibling;
        while (node) {
          const next = node.nextSibling;
          content.appendChild(node);
          node = next;
        }
        panel.appendChild(wrapper);
      }
    }
    /** @returns {HTMLElement|null} The box a panel's height is animated on. */
    wrapperOf(panel) {
      return panel.querySelector(":scope > ." + WRAPPER_CLASS);
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
        this.groupName = this.getAttribute("name") || panels[0] && panels[0].getAttribute("name") || "accordion-elemental-" + ++groupCount;
      }
      for (const panel of panels) panel.name = this.groupName;
    }
    /**
     * Open a panel and slide its body down. The panel opens first, since the body
     * is `display: none` until it does and an unrendered box has no height.
     */
    openPanel(panel) {
      const wrapper = this.wrapperOf(panel);
      if (!wrapper) {
        panel.open = true;
        return;
      }
      if (this.options.exclusive) {
        for (const other of this.panels) {
          if (other !== panel && other.open && !other.classList.contains(CLOSING_CLASS)) {
            this.closePanel(other);
          }
        }
      }
      const from = panel.open ? wrapper.offsetHeight : 0;
      panel.classList.remove(CLOSING_CLASS);
      this.restoreName(panel);
      panel.open = true;
      slide(wrapper, from, true);
    }
    /**
     * Slide a panel's body up, and only then actually close it - `<details>` sets
     * its contents to `display: none` on close, which would cut the animation off
     * at frame one.
     */
    closePanel(panel) {
      const wrapper = this.wrapperOf(panel);
      if (!wrapper) {
        panel.open = false;
        return;
      }
      panel.classList.add(CLOSING_CLASS);
      if (panel.hasAttribute("name")) {
        panel[DETACHED_NAME] = panel.getAttribute("name");
        panel.removeAttribute("name");
      }
      slide(wrapper, wrapper.offsetHeight, false, () => {
        panel.classList.remove(CLOSING_CLASS);
        panel.open = false;
        this.restoreName(panel);
      });
    }
    restoreName(panel) {
      if (panel[DETACHED_NAME] == null) return;
      panel.setAttribute("name", panel[DETACHED_NAME]);
      panel[DETACHED_NAME] = null;
    }
    /**
     * Take over the toggle so the close can outlive the click. Enter and Space on a
     * `<summary>` dispatch a click too, so this covers the keyboard as well.
     */
    onClick(e) {
      const summary = e.target.closest && e.target.closest("summary");
      if (!summary) return;
      const panel = summary.parentElement;
      if (!panel || !this.panels.includes(panel)) return;
      if (!this.wrapperOf(panel)) return;
      e.preventDefault();
      if (panel.open && !panel.classList.contains(CLOSING_CLASS)) this.closePanel(panel);
      else this.openPanel(panel);
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
     * to a single question lands on it opened. Instant rather than animated: a deep
     * link should arrive at the content, not at a panel still on its way open.
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

  // src/elementals/disclosure/index.js
  function disclosureState(open) {
    return {
      expanded: open ? "true" : "false",
      hidden: open ? null : "until-found"
    };
  }
  function slideFrom(open, hidden, height) {
    return open && hidden ? 0 : height;
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
    /**
     * Push the current state onto the button and the region, sliding the region's height
     * on the way if asked to.
     *
     * `animate` is off by default, because most of what lands here is not a state change
     * to animate: the state a page loads with is where the region starts, and one the
     * browser has already put on screen for find-in-page is already there.
     *
     * @param {boolean} [animate=false]
     */
    apply(animate = false) {
      const button = this.button;
      const region = this.region;
      if (!button || !region) return;
      const state = disclosureState(this.open);
      button.setAttribute("aria-expanded", state.expanded);
      if (!animate) {
        if (state.hidden === null) region.removeAttribute("hidden");
        else region.setAttribute("hidden", state.hidden);
        return;
      }
      const from = slideFrom(this.open, region.hasAttribute("hidden"), region.offsetHeight);
      if (this.open) {
        region.removeAttribute("hidden");
        slide(region, from, true);
        return;
      }
      slide(region, from, false, () => {
        if (this.initialized && !this.open) region.setAttribute("hidden", state.hidden);
      });
    }
    /**
     * `open` is the single source of truth, so everything that changes it - a click,
     * a script, find-in-page - lands here and nowhere else.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.apply(!this.instant);
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
      this.instant = true;
      this.open = true;
      this.instant = false;
    }
  };
  define("disclosure-elemental", DisclosureElemental);

  // src/elementals/menu/index.js
  function typeAheadIndex(labels, current, buffer) {
    if (!buffer) return null;
    const query = buffer.toLowerCase();
    const repeated = query.length > 1 && query.split("").every((c) => c === query[0]);
    const prefix = repeated ? query[0] : query;
    const from = prefix.length === 1 ? current + 1 : current;
    for (let i = 0; i < labels.length; i++) {
      const at = (from + i + labels.length) % labels.length;
      if (labels[at].trim().toLowerCase().startsWith(prefix)) return at;
    }
    return null;
  }
  var TYPE_AHEAD_WINDOW = 500;
  var HOVER_CLOSE_DELAY = 250;
  var menuCount = 0;
  function set(element, name, value) {
    if (!element) return;
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }
  var MenuElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["open", "media"];
    }
    /**
     * Whether a mouse opens the menu by pointing at it rather than by clicking.
     *
     * Opt-in, and only ever an addition: click, Enter and the arrow keys are what the
     * pattern promises, and a menu nobody can open without a steady hand is not one. Off
     * for touch, where there is no hovering to do and the first tap would open and pick
     * in one gesture, and off inline, where the branches are stacked in the page and a
     * pointer crossing the stack would open every one it passed.
     */
    get hover() {
      return this.hasAttribute("hover") && !this.inline;
    }
    set hover(value) {
      this.toggleAttribute("hover", !!value);
    }
    /** The `<button>` that opens the root list. Direct child, so a submenu's trigger -
     * or a nested menu's button - is not mistaken for it. */
    get button() {
      return this.querySelector(":scope > button");
    }
    /** The root list. */
    get menu() {
      return this.querySelector(":scope > ul, :scope > menu");
    }
    /** Every list in this menu, root first. A nested `<menu-elemental>` keeps its own. */
    get menus() {
      return Array.from(this.querySelectorAll("ul, menu")).filter((list) => list.closest("menu-elemental") === this);
    }
    /** Whether the root list is showing. Reflected, so `[open]` is a styling hook too. */
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      this.toggleAttribute("open", !!value);
    }
    /**
     * Whether this is currently the stack-of-disclosures rather than the flyout: a
     * `media` that is not matching right now. No `media` at all means a menu that is
     * a menu at every width, which is what a menu button is when nothing says otherwise.
     */
    get inline() {
      return !!this.query && !this.query.matches;
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.button || !this.menu) return;
      this.initialized = true;
      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onMediaChange = this.onMediaChange.bind(this);
      this.onPointerOver = this.onPointerOver.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.addEventListener("click", this.onClick);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("pointerover", this.onPointerOver);
      this.addEventListener("pointerleave", this.onPointerLeave);
      this.addEventListener("focusout", this.onFocusOut);
      document.addEventListener("click", this.onDocumentClick);
      for (const menu of this.menus) {
        if (menu !== this.menu) menu.setAttribute("hidden", "");
      }
      this.watchMedia();
      this.wire();
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
      if (this.query) this.query.removeEventListener("change", this.onMediaChange);
      for (const menu of this.menus) {
        menu.removeAttribute("hidden");
        set(menu, "role", null);
        for (const item of this.itemsOf(menu)) {
          set(item.parentElement, "role", null);
          set(item, "role", null);
          set(item, "tabindex", null);
        }
      }
      this.initialized = false;
    }
    // ---- structure ----
    /** The items of one list: what its `<li>`s hold, and not what its submenus do. */
    itemsOf(menu) {
      return menu ? Array.from(menu.querySelectorAll(":scope > li > a, :scope > li > button")) : [];
    }
    /** The list an item belongs to. */
    menuOf(item) {
      return item.closest("ul, menu");
    }
    /** The list an item opens, if it opens one. */
    submenuOf(item) {
      return item.parentElement && item.parentElement.querySelector(":scope > ul, :scope > menu");
    }
    /**
     * The item that opens a list. For a submenu that is the item beside it in the same
     * `<li>`; for the root list the element's own button, which is the same query one
     * level up.
     */
    triggerOf(menu) {
      return menu.parentElement && menu.parentElement.querySelector(":scope > a, :scope > button");
    }
    isOpen(menu) {
      return !menu.hasAttribute("hidden");
    }
    /**
     * The items the arrows walk from here.
     *
     * A flyout is walked one list at a time - the submenu is a separate surface and
     * Left/Right are how you cross between them. Inline there are no surfaces: the
     * open submenus are on screen, in the flow, and stopping at the edge of a list the
     * reader is looking straight through would be arbitrary.
     */
    navigable(menu) {
      return this.inline ? this.visibleItems(this.menu) : this.itemsOf(menu);
    }
    /** Every item on screen from `menu` down, in the order they are rendered. */
    visibleItems(menu) {
      const out = [];
      for (const item of this.itemsOf(menu)) {
        out.push(item);
        const submenu = this.submenuOf(item);
        if (submenu && this.isOpen(submenu)) out.push(...this.visibleItems(submenu));
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
      this.closeAll();
      this.wire();
    }
    /**
     * Put the current mode's roles on the markup: a menu with items that are not in the
     * tab order, or a set of nested disclosures that are nothing but an ordinary list.
     *
     * `aria-controls` and `aria-expanded` are the only two that survive the switch,
     * because they are true of both - a button that shows and hides a thing, and which
     * thing it is.
     */
    wire() {
      const inline = this.inline;
      this.dataset.mode = inline ? "inline" : "flyout";
      for (const menu of this.menus) {
        if (!menu.id) menu.id = "menu-elemental-" + ++menuCount;
        set(menu, "role", inline ? null : "menu");
        const trigger = this.triggerOf(menu);
        if (trigger) {
          if (trigger.tagName === "BUTTON" && !trigger.hasAttribute("type")) trigger.type = "button";
          trigger.setAttribute("aria-controls", menu.id);
          set(trigger, "aria-haspopup", inline ? null : "menu");
          trigger.setAttribute("aria-expanded", this.isOpen(menu) ? "true" : "false");
        }
        for (const item of this.itemsOf(menu)) {
          set(item.parentElement, "role", inline ? null : "none");
          set(item, "role", inline ? null : "menuitem");
          set(item, "tabindex", inline ? null : "-1");
        }
      }
    }
    /** Push the root list's state onto it and its button. */
    apply() {
      const menu = this.menu;
      const button = this.button;
      if (!menu || !button) return;
      button.setAttribute("aria-expanded", this.open ? "true" : "false");
      menu.toggleAttribute("hidden", !this.open);
      if (!this.open) this.closeSubmenus(menu);
    }
    // ---- opening and closing ----
    /**
     * Show or hide one submenu.
     *
     * Floating, the branches overlap, so opening one closes its siblings - that is what
     * makes a flyout readable. Inline they are stacked in the flow and closing a branch
     * the reader opened on purpose only loses their place.
     */
    setSubmenu(trigger, open) {
      const submenu = this.submenuOf(trigger);
      if (!submenu || this.isOpen(submenu) === open) return;
      if (open && !this.inline) {
        for (const sibling of this.itemsOf(this.menuOf(trigger))) {
          if (sibling !== trigger) this.setSubmenu(sibling, false);
        }
      }
      if (!open) this.closeSubmenus(submenu);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      submenu.toggleAttribute("hidden", !open);
      this.dispatchEvent(new CustomEvent("menu-toggle", {
        bubbles: true,
        detail: { menu: submenu, open }
      }));
    }
    /** Close every open branch below a list, deepest first. */
    closeSubmenus(menu) {
      for (const item of this.itemsOf(menu)) this.setSubmenu(item, false);
    }
    closeAll() {
      if (this.menu) this.closeSubmenus(this.menu);
      this.open = false;
    }
    /**
     * Move focus to one item of a list, counting from the end for a negative index -
     * `-1` is the last item, which is where Up on the closed button lands.
     */
    focusItem(menu, index) {
      const items = this.itemsOf(menu);
      const item = items[index < 0 ? items.length + index : index];
      if (item) item.focus();
      return item;
    }
    /**
     * `open` is the single source of truth for the root list, so a click, a script and
     * a media change all land here.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "media") {
        this.watchMedia();
        this.onMediaChange();
        return;
      }
      this.apply();
      this.dispatchEvent(new CustomEvent("menu-toggle", {
        bubbles: true,
        detail: { menu: this.menu, open: this.open }
      }));
    }
    // ---- input ----
    /** The item this event happened on, or null for anything outside this menu. */
    itemFor(e) {
      const item = e.target.closest && e.target.closest("a, button");
      return item && item.closest("menu-elemental") === this ? item : null;
    }
    onClick(e) {
      const item = this.itemFor(e);
      if (!item) return;
      if (item === this.button) {
        this.open = !this.open;
        if (this.open && !this.inline) this.focusItem(this.menu, 0);
        return;
      }
      const submenu = this.submenuOf(item);
      if (submenu) {
        const open = !this.isOpen(submenu);
        this.setSubmenu(item, open);
        if (open && !this.inline) this.focusItem(submenu, 0);
        return;
      }
      this.closeAll();
    }
    /**
     * Point at it and it opens: the root list from the button, a branch from its own
     * item, and a branch closed again by pointing at any other item of the same list -
     * which is the sibling rule `setSubmenu` already keeps for clicks.
     *
     * `pointerover` rather than `pointerenter` because it bubbles, so one listener covers
     * every item; mouse only, because a touch "hover" is the tap that was about to pick
     * something.
     */
    onPointerOver(e) {
      if (!this.hover || e.pointerType !== "mouse") return;
      clearTimeout(this.hoverTimer);
      const item = this.itemFor(e);
      if (!item) return;
      if (item === this.button) {
        this.open = true;
        return;
      }
      if (this.submenuOf(item)) this.setSubmenu(item, true);
      else this.closeSubmenus(this.menuOf(item));
    }
    /**
     * The pointer has left the whole element, so the menu closes - after a beat, because
     * the gap between a button and its panel, or between a panel and the one beside it,
     * is a place the pointer passes through rather than a place it means to be.
     */
    onPointerLeave(e) {
      if (!this.hover || e.pointerType !== "mouse") return;
      clearTimeout(this.hoverTimer);
      this.hoverTimer = setTimeout(() => {
        if (!this.contains(document.activeElement)) this.closeAll();
      }, HOVER_CLOSE_DELAY);
    }
    onKeyDown(e) {
      const item = this.itemFor(e);
      if (!item) return;
      if (item === this.button) {
        const to2 = e.key === "ArrowDown" ? 0 : e.key === "ArrowUp" ? -1 : null;
        if (to2 === null || this.inline) return;
        e.preventDefault();
        this.open = true;
        this.focusItem(this.menu, to2);
        return;
      }
      const menu = this.menuOf(item);
      if (!menu) return;
      if (e.key === "Escape") {
        e.preventDefault();
        this.closeBranch(menu);
        return;
      }
      if (e.key === "Tab") {
        this.closeAll();
        return;
      }
      if (e.key === " " && item.tagName === "A") {
        e.preventDefault();
        item.click();
        return;
      }
      if (!this.inline && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        if (e.key === "ArrowRight") {
          const submenu = this.submenuOf(item);
          if (submenu) {
            this.setSubmenu(item, true);
            this.focusItem(submenu, 0);
          }
          return;
        }
        if (menu !== this.menu) this.closeBranch(menu);
        return;
      }
      const items = this.navigable(menu);
      const to = nextIndex(items.indexOf(item), e.key, items.length);
      if (to !== null) {
        e.preventDefault();
        items[to].focus();
        return;
      }
      if (this.inline || e.key.length !== 1 || e.key === " " || e.metaKey || e.ctrlKey || e.altKey) return;
      const now = Date.now();
      this.buffer = now - this.bufferedAt < TYPE_AHEAD_WINDOW ? this.buffer + e.key : e.key;
      this.bufferedAt = now;
      const at = typeAheadIndex(items.map((one) => one.textContent), items.indexOf(item), this.buffer);
      if (at === null) return;
      e.preventDefault();
      items[at].focus();
    }
    /**
     * Close the list focus is in and hand focus back to whatever opened it - a submenu
     * goes back to its trigger, the root list back to the button.
     */
    closeBranch(menu) {
      const trigger = this.triggerOf(menu);
      if (menu === this.menu) this.open = false;
      else this.setSubmenu(trigger, false);
      if (trigger) trigger.focus();
    }
    onFocusOut(e) {
      const next = e.relatedTarget;
      if (next && this.contains(next)) return;
      if (!this.inline) this.closeAll();
    }
    onDocumentClick(e) {
      if (this.contains(e.target) || this.inline) return;
      this.closeAll();
    }
  };
  define("menu-elemental", MenuElemental);

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
      if (this.internals) this.internals.setFormValue(formValue(this.checked, this.disabled, this.value));
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
//# sourceMappingURL=book-of-elementals.js.map
