/* book-of-elementals v0.7.2 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/helpers.mjs
  var objProto = Object.prototype;
  var foldF64 = new Float64Array(1);
  var foldU32 = new Uint32Array(foldF64.buffer);
  function isFunction(o) {
    return typeof o === "function";
  }
  var PLAIN = {
    \u00C6: "AE",
    \u00E6: "ae",
    \u0152: "OE",
    \u0153: "oe",
    \u00DF: "ss",
    "\u1E9E": "SS",
    \u00DE: "TH",
    \u00FE: "th",
    \u0110: "D",
    \u0111: "d",
    \u00D0: "D",
    \u00F0: "d",
    \u00D8: "O",
    \u00F8: "o",
    \u0141: "L",
    \u0142: "l",
    \u013F: "L",
    \u0140: "l",
    \u0126: "H",
    \u0127: "h",
    \u0166: "T",
    \u0167: "t",
    \u01E4: "G",
    \u01E5: "g",
    \u014A: "N",
    \u014B: "n",
    \u0131: "i"
  };
  var PLAIN_RE = new RegExp(`[${Object.keys(PLAIN).join("")}]`, "g");

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

  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/disclosure/index.js
  function disclosureState(open) {
    return {
      expanded: open ? "true" : "false",
      hidden: open ? null : "until-found",
      state: open ? "open" : "closed"
    };
  }
  function slideFrom(open, hidden, height) {
    return open && hidden ? 0 : height;
  }
  function mediaOpen(query) {
    return query ? query.matches : null;
  }
  function mediaMode(open) {
    if (open === null) return null;
    return open ? "pinned" : "free";
  }
  var REGION_CLASS = "disclosure-elemental-region";
  var regionCount = 0;
  var DisclosureElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["open", "media"];
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
      this.onMediaChange = this.onMediaChange.bind(this);
      this.watchMedia();
      const pinned = mediaOpen(this.query);
      if (pinned !== null) this.open = pinned;
      this.initialized = true;
      if (!button.hasAttribute("type")) button.type = "button";
      if (!region.id) region.id = "disclosure-elemental-" + ++regionCount;
      region.classList.add(REGION_CLASS);
      button.setAttribute("aria-controls", region.id);
      this.reflectMode();
      this.onClick = this.onClick.bind(this);
      this.onBeforeMatch = this.onBeforeMatch.bind(this);
      this.addEventListener("click", this.onClick);
      region.addEventListener("beforematch", this.onBeforeMatch);
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      if (this.query) this.query.removeEventListener("change", this.onMediaChange);
      this.query = null;
      delete this.dataset.mode;
      const region = this.region;
      if (region) {
        delete region.dataset.mode;
        delete region.dataset.state;
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
      const { expanded, hidden, state } = disclosureState(this.open);
      button.setAttribute("aria-expanded", expanded);
      region.dataset.state = state;
      if (!animate) {
        if (hidden === null) region.removeAttribute("hidden");
        else region.setAttribute("hidden", hidden);
        return;
      }
      const from = slideFrom(this.open, region.hasAttribute("hidden"), region.offsetHeight);
      if (this.open) {
        region.removeAttribute("hidden");
        slide(region, from, true);
        return;
      }
      slide(region, from, false, () => {
        if (this.initialized && !this.open) region.setAttribute("hidden", hidden);
      });
    }
    /** Start watching whatever `media` names now, and stop watching whatever it named
     * before. Both halves matter: the attribute can be rewritten at runtime. */
    watchMedia() {
      if (this.query) this.query.removeEventListener("change", this.onMediaChange);
      const media = this.getAttribute("media");
      this.query = media && window.matchMedia ? window.matchMedia(media) : null;
      if (this.query) this.query.addEventListener("change", this.onMediaChange);
    }
    /**
     * The breakpoint moved, so the state follows it.
     *
     * Instant, unlike a click. Crossing a breakpoint is the layout being rearranged around
     * the reader - a rotation, a window drag, a zoom - and animating the region through
     * that is animating something nobody asked to happen. It also keeps a resize from
     * queueing a slide per frame.
     */
    onMediaChange() {
      this.reflectMode();
      const pinned = mediaOpen(this.query);
      if (pinned === null) return;
      this.instant = true;
      this.open = pinned;
      this.instant = false;
    }
    /**
     * Put the current mode on the element and on the region, or take it off both.
     *
     * On the region as well as the element because `for` lets the two live at opposite ends
     * of the document, and a panel that has to reach back up to its button through
     * `:root:has(…)` for every rule is a stylesheet nobody wants to read. It is one more
     * attribute on a box the element is already writing `hidden`, `id` and a class to.
     */
    reflectMode() {
      const mode = mediaMode(mediaOpen(this.query));
      const region = this.region;
      if (mode === null) {
        delete this.dataset.mode;
        if (region) delete region.dataset.mode;
        return;
      }
      this.dataset.mode = mode;
      if (region) region.dataset.mode = mode;
    }
    /**
     * `open` is the single source of truth, so everything that changes it - a click,
     * a script, find-in-page - lands here and nowhere else.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "media") {
        this.watchMedia();
        this.onMediaChange();
        return;
      }
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
//# sourceMappingURL=disclosure.js.map
