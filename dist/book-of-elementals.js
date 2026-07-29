/* book-of-elementals v0.2.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
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
})();
//# sourceMappingURL=book-of-elementals.js.map
