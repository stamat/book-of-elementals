/* book-of-elementals v0.10.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/book-of-spells/src/helpers.mjs
  var objProto = Object.prototype;
  var foldF64 = new Float64Array(1);
  var foldU32 = new Uint32Array(foldF64.buffer);
  function stringToNumber(str) {
    if (/^\s*-?\d+\s*$/.test(str)) return parseInt(str);
    if (/^\s*-?\d+\.\d+\s*$/.test(str)) return parseFloat(str);
  }
  function isObject(o) {
    return typeof o === "object" && !Array.isArray(o) && o !== null;
  }
  function isFunction(o) {
    return typeof o === "function";
  }
  function transformCamelCaseToDash(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
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
  function removeAccents(inputString) {
    return inputString.replace(PLAIN_RE, (c) => PLAIN[c]).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
  }
  function matchesSearch(label, search) {
    const needle = removeAccents(search.trim()).toLowerCase();
    return needle === "" || removeAccents(label).toLowerCase().includes(needle);
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
  function swipe(element, callback, threshold = 150, timeThreshold = 0) {
    let mouse = true;
    let start = null;
    let swiped = false;
    if (isObject(callback)) {
      const options = callback;
      callback = options.callback;
      threshold = options.threshold || threshold;
      timeThreshold = options.timeThreshold || timeThreshold;
      if (options.mouse === false) mouse = false;
    }
    if (!element) return null;
    const handleStart = function(e) {
      swiped = false;
      if (start || !mouse && e.pointerType === "mouse") {
        start = null;
        return;
      }
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, time: Date.now() };
      if (element.setPointerCapture) {
        try {
          element.setPointerCapture(e.pointerId);
        } catch {
        }
      }
      element.dispatchEvent(new CustomEvent("swipestart", { detail: { target: element, startX: start.x, startY: start.y, startTime: start.time } }));
    };
    const handleEnd = function(e) {
      const from = start;
      start = null;
      if (!from || e.pointerId !== from.id) return;
      const endX = e.clientX;
      const endY = e.clientY;
      const endTime = Date.now();
      const deltaX = Math.abs(endX - from.x);
      const deltaY = Math.abs(endY - from.y);
      const left = endX < from.x;
      const up = endY < from.y;
      const horizontal = deltaX > deltaY && deltaX > threshold;
      const vertical = deltaY > deltaX && deltaY > threshold;
      const timeElapsed = endTime - from.time;
      if (horizontal || vertical) {
        if (!timeThreshold || timeElapsed <= timeThreshold) {
          const res = {
            target: element,
            deltaX,
            deltaY,
            startX: from.x,
            startY: from.y,
            endX,
            endY,
            threshold,
            horizontal,
            vertical,
            horizontalDirection: left ? "left" : "right",
            verticalDirection: up ? "up" : "down",
            direction: horizontal ? left ? "left" : "right" : up ? "up" : "down",
            timeElapsed,
            timeThreshold
          };
          swiped = true;
          if (isFunction(callback)) callback(res);
          element.dispatchEvent(new CustomEvent("swipe", { detail: res }));
        }
      }
      element.dispatchEvent(new CustomEvent("swipeend", { detail: { target: element, startX: from.x, startY: from.y, startTime: from.time, endX, endY, endTime } }));
    };
    const handleCancel = function() {
      start = null;
    };
    const handleClick = function(e) {
      if (!swiped) return;
      swiped = false;
      if (!e.detail) return;
      e.preventDefault();
      e.stopPropagation();
    };
    element.addEventListener("pointerdown", handleStart);
    element.addEventListener("pointerup", handleEnd);
    element.addEventListener("pointercancel", handleCancel);
    element.addEventListener("click", handleClick, true);
    return {
      destroy: function() {
        element.removeEventListener("pointerdown", handleStart);
        element.removeEventListener("pointerup", handleEnd);
        element.removeEventListener("pointercancel", handleCancel);
        element.removeEventListener("click", handleClick, true);
        start = null;
        swiped = false;
      }
    };
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
  function stepIndex(current, key, length) {
    if (length === 0) return null;
    const to = key === "ArrowDown" || key === "ArrowRight" ? current + 1 : key === "ArrowUp" || key === "ArrowLeft" ? current - 1 : key === "Home" ? 0 : key === "End" ? length - 1 : null;
    if (to === null || to < 0 || to >= length) return null;
    return to;
  }
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
  function placeSubmenu(item, panel, viewport, rtl) {
    const inlineEnd = rtl ? item.left - panel.width : item.right;
    const inlineStart = rtl ? item.right : item.left - panel.width;
    const down = fits(item.top, panel.height, viewport.height);
    const up = fits(item.bottom - panel.height, panel.height, viewport.height);
    return {
      side: fits(inlineEnd, panel.width, viewport.width) || !fits(inlineStart, panel.width, viewport.width) ? "inline-end" : "inline-start",
      align: down || !up ? "start" : "end"
    };
  }

  // src/elementals/accordion/index.js
  var OPTIONS = { exclusive: "boolean" };
  var WRAPPER_CLASS = "accordion-elemental-content-wrapper";
  var CONTENT_CLASS = "accordion-elemental-content";
  var CLOSING_CLASS = "accordion-elemental-closing";
  var DETACHED_NAME = /* @__PURE__ */ Symbol("detachedName");
  var groupCount = 0;
  function exclusiveOpen(states) {
    let seen = false;
    return states.map((open) => {
      const keep = open && !seen;
      seen = seen || open;
      return keep;
    });
  }
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
      const open = exclusiveOpen(panels.map((panel) => panel.open));
      panels.forEach((panel, at) => {
        panel.open = open[at];
      });
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

  // src/elementals/carousel/index.js
  function rotationInterval(value, fallback = 5e3) {
    const ms = Number(value);
    if (!Number.isFinite(ms) || ms <= 0) return fallback;
    return Math.max(ms, 1e3);
  }
  function stepSlide(current, delta, count) {
    if (count <= 0) return 0;
    return Math.min(Math.max(current + delta, 0), count - 1);
  }
  var SWIPE = 40;
  function swipeStep(direction, rtl) {
    return direction === (rtl ? "right" : "left") ? 1 : -1;
  }
  function scrollEdges(offset, visible, total) {
    const at = Math.abs(offset);
    return { start: at <= 1, end: at + visible >= total - 1 };
  }
  function startInset(styles, rtl) {
    const inset = parseFloat(rtl ? styles.scrollPaddingRight : styles.scrollPaddingLeft);
    return Number.isFinite(inset) ? inset : 0;
  }
  function swapHeight(from, to, reduced) {
    return !reduced && from !== to;
  }
  function rotationHeld(hovering, focused) {
    return hovering || focused;
  }
  var POSITION = "{n} of {total}";
  function slideName(index, count, template) {
    const text = template == null || template.trim() === "" ? POSITION : template;
    return text.replace(/\{n\}/g, index + 1).replace(/\{total\}/g, count);
  }
  function markerName(word, index) {
    const number = index + 1;
    if (word.indexOf("{n}") === -1) return word + " " + number;
    return word.replace(/\{n\}/g, number);
  }
  function roleDescription(raw, fallback) {
    return raw == null || raw.trim() === "" ? fallback : raw;
  }
  function currentSlide(starts, inset, fallback) {
    if (!starts.length) return fallback;
    for (let i = 0; i < starts.length; i++) {
      if (starts[i] >= inset - 1) return i;
    }
    return starts.length - 1;
  }
  var FOCUSABLE = "a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]";
  var carouselCount = 0;
  var ICON = {
    prev: {
      d: "M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z",
      box: "0 0 16 16"
    },
    next: {
      d: "M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z",
      box: "0 0 16 16"
    },
    // `play-24` is two paths, a triangle inside a ring, and this is the triangle: the button it
    // goes in is already a circle with a countdown ring around it, and the icon's own would be
    // the third concentric circle inside 28 pixels. `triangle-right-16` is the shape that looks
    // like the obvious answer and is not - it is drawn as a disclosure twisty, 3.8 units wide
    // against 7.1 tall, where a play triangle is nearly as wide as it is high.
    //
    // The box is cropped to 13.5 of the 24 it is drawn in, which renders the triangle at the
    // height of the chevrons it is read beside, and sits half a unit left of the shape's centre.
    // That half unit is the correction every play button wants and no geometry gives you: a
    // triangle carries its area behind its point, so one centred on its bounding box reads as
    // too far left. The square is symmetrical and keeps the box it came with.
    play: {
      d: "M9.5 15.584V8.416a.5.5 0 0 1 .77-.42l5.576 3.583a.5.5 0 0 1 0 .842l-5.576 3.584a.5.5 0 0 1-.77-.42Z",
      box: "5.47 5.25 13.5 13.5"
    },
    stop: {
      d: "M7.75 6h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 16.25 18h-8.5A1.75 1.75 0 0 1 6 16.25v-8.5C6 6.784 6.784 6 7.75 6Z",
      box: "0 0 24 24"
    }
  };
  function icon({ d, box }) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", box);
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.append(path);
    return svg;
  }
  function reducedMotion() {
    return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  var CarouselElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["autoplay", "interval", "fade"];
    }
    /** The scroller: the first list in the element. A carousel inside a slide keeps its own. */
    get scroller() {
      const list = this.querySelector("ul, ol, menu");
      return list && list.closest("carousel-elemental") === this ? list : null;
    }
    /** The slides, in order. What the list holds, so a list inside a slide is not one. */
    get slides() {
      const list = this.scroller;
      return list ? Array.from(list.querySelectorAll(":scope > li")) : [];
    }
    /** The picker buttons, in slide order. */
    get markers() {
      return this.picker ? Array.from(this.picker.children) : [];
    }
    /**
     * Cross-fade in place rather than scroll a row.
     *
     * The one mode where the scroller is not the state: stacked slides have nothing to scroll,
     * so the index is what this element holds and the stylesheet reads through
     * `data-carousel-current`. Everything above it - the controls, the picker, the rotation,
     * the events - is the same code either way.
     */
    get fade() {
      return this.hasAttribute("fade");
    }
    set fade(value) {
      this.toggleAttribute("fade", !!value);
    }
    /** Rotate on a timer. Reflected, so `[autoplay]` is a styling hook too. */
    get autoplay() {
      return this.hasAttribute("autoplay");
    }
    set autoplay(value) {
      this.toggleAttribute("autoplay", !!value);
    }
    /** Milliseconds between slides while rotating. */
    get interval() {
      return rotationInterval(this.getAttribute("interval"));
    }
    set interval(value) {
      this.setAttribute("interval", value);
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.scroller) return;
      this.onClick = this.onClick.bind(this);
      this.onIntersect = this.onIntersect.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onSwipe = this.onSwipe.bind(this);
      this.onHeightEnd = this.onHeightEnd.bind(this);
      this.onHoverIn = this.onHoverIn.bind(this);
      this.onHoverOut = this.onHoverOut.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.hovering = false;
      this.focused = false;
      this.wroteRole = false;
      this.index = 0;
      this.inset = 0;
      this.painted = false;
      this.settling = null;
      this.settleTimer = null;
      this.swipes = null;
      this.heights = null;
      this.named = /* @__PURE__ */ new WeakMap();
      this.addEventListener("click", this.onClick);
      this.addEventListener("mouseenter", this.onHoverIn);
      this.addEventListener("mouseleave", this.onHoverOut);
      this.addEventListener("focusin", this.onFocusIn);
      this.addEventListener("focusout", this.onFocusOut);
      this.initialized = true;
      this.wire();
      if (this.autoplay && this.slides.length > 1 && !reducedMotion()) this.play();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.clearTimer();
      this.rotating = false;
      this.pinned = false;
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("mouseenter", this.onHoverIn);
      this.removeEventListener("mouseleave", this.onHoverOut);
      this.removeEventListener("focusin", this.onFocusIn);
      this.removeEventListener("focusout", this.onFocusOut);
      this.hovering = false;
      this.focused = false;
      this.strip();
      this.initialized = false;
    }
    /**
     * Take the pattern back off, leaving the markup the page wrote: a list.
     *
     * Two callers, which are the same event approached from opposite sides - a carousel leaving
     * the document, and one whose page has taken its slides away. Everything written comes back
     * off in both, because a `role="group"` with `aria-roledescription="slide"` on a row nothing
     * is driving is a carousel announced to a screen reader that no longer has controls, and a
     * scroller left with a tab stop is a stop onto nothing.
     */
    strip() {
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      if (this.scrolls) this.scrolls.removeEventListener("scroll", this.onScroll);
      this.scrolls = null;
      this.unswipe();
      this.unpin();
      this.arrived();
      this.removeControls();
      this.painted = false;
      this.removeAttribute("data-carousel-at-start");
      this.removeAttribute("data-carousel-at-end");
      this.removeAttribute("aria-roledescription");
      if (this.wroteRole) this.removeAttribute("role");
      this.wroteRole = false;
      const scroller = this.scroller;
      if (scroller) {
        scroller.removeAttribute("data-carousel-slides");
        scroller.removeAttribute("role");
        scroller.removeAttribute("tabindex");
        scroller.removeAttribute("aria-live");
      }
      for (const slide2 of this.slides) {
        slide2.removeAttribute("role");
        slide2.removeAttribute("aria-roledescription");
        slide2.removeAttribute("data-carousel-slide");
        slide2.removeAttribute("data-carousel-current");
        if (slide2.getAttribute("aria-label") === this.named.get(slide2)) slide2.removeAttribute("aria-label");
      }
    }
    /**
     * Read the markup and put the pattern on it - the roles, the controls, the observer that
     * watches the row - then push the current state onto the controls.
     *
     * Public and idempotent, because the slides are the page's to change: add one, remove one,
     * reorder them, and this is the one call that says so. Nothing observes the markup on the
     * element's behalf, which would be a `MutationObserver` running on every page that never
     * touches its slides to save this one line on the pages that do.
     */
    wire() {
      const scroller = this.scroller;
      if (!scroller) return;
      const slides = this.slides;
      if (slides.length < 2) {
        this.strip();
        return;
      }
      this.setAttribute("aria-roledescription", roleDescription(this.getAttribute("roledescription-text"), "carousel"));
      if (!this.hasAttribute("role")) {
        const named = this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby");
        this.setAttribute("role", named ? "region" : "group");
        this.wroteRole = true;
      }
      if (!scroller.id) scroller.id = "carousel-elemental-slides-" + ++carouselCount;
      scroller.setAttribute("data-carousel-slides", "");
      scroller.setAttribute("role", "group");
      if (this.fade || scroller.querySelector(FOCUSABLE)) scroller.removeAttribute("tabindex");
      else scroller.tabIndex = 0;
      const position = this.getAttribute("position-text");
      const slideRole = roleDescription(this.getAttribute("slide-roledescription-text"), "slide");
      slides.forEach((slide2, at) => {
        slide2.setAttribute("role", "group");
        slide2.setAttribute("aria-roledescription", slideRole);
        slide2.setAttribute("data-carousel-slide", "");
        const label = slide2.getAttribute("aria-label");
        const authored = slide2.hasAttribute("aria-labelledby") || label !== null && label !== this.named.get(slide2);
        if (authored) return;
        const name = slideName(at, slides.length, position);
        slide2.setAttribute("aria-label", name);
        this.named.set(slide2, name);
      });
      this.writeControls();
      this.painted = false;
      this.applyLive();
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      if (this.scrolls) this.scrolls.removeEventListener("scroll", this.onScroll);
      this.scrolls = null;
      this.unswipe();
      this.unpin();
      this.arrived();
      if (this.fade) {
        this.swipes = swipe(scroller, { callback: this.onSwipe, threshold: SWIPE, mouse: false });
        scroller.addEventListener("transitionend", this.onHeightEnd);
        scroller.addEventListener("transitioncancel", this.onHeightEnd);
        this.heights = scroller;
      } else {
        this.observer = new IntersectionObserver(this.onIntersect, {
          root: scroller,
          threshold: [0, 0.25, 0.5, 0.75, 1]
        });
        for (const slide2 of slides) this.observer.observe(slide2);
        scroller.addEventListener("scroll", this.onScroll, { passive: true });
        this.scrolls = scroller;
      }
      this.apply(Math.min(this.index, Math.max(slides.length - 1, 0)));
    }
    /**
     * Write the controls, or write them again after the slides changed.
     *
     * The rotation control is a child of the element rather than of the control bar, and it is
     * first: the APG asks for it at the head of the tab sequence inside the carousel, so that
     * a reader who lands in a moving carousel can stop it before reading anything. Putting it
     * in the bar under the row and moving it visually would be a tab order that disagrees with
     * the page, which is the trade this project does not make - so it is drawn where it sits,
     * over the top corner of the row.
     */
    writeControls() {
      this.removeControls();
      const id = this.scroller.id;
      if (this.autoplay) {
        this.rotateButton = this.control("data-carousel-rotate", "", id);
        this.prepend(this.rotateButton);
        this.labelRotation();
      }
      this.controls = document.createElement("div");
      this.controls.setAttribute("data-carousel-controls", "");
      this.prevButton = this.control("data-carousel-prev", this.getAttribute("prev-text") || "Previous slide", id);
      this.prevButton.append(icon(ICON.prev));
      this.picker = document.createElement("div");
      this.picker.setAttribute("data-carousel-markers", "");
      this.picker.setAttribute("role", "group");
      this.picker.setAttribute("aria-label", this.getAttribute("picker-text") || "Choose slide to display");
      const word = this.getAttribute("slide-text") || "Slide";
      this.slides.forEach((slide2, at) => {
        const marker = this.control("data-carousel-marker", markerName(word, at), id);
        marker.textContent = String(at + 1);
        this.picker.append(marker);
      });
      this.nextButton = this.control("data-carousel-next", this.getAttribute("next-text") || "Next slide", id);
      this.nextButton.append(icon(ICON.next));
      this.controls.append(this.prevButton, this.picker, this.nextButton);
      this.append(this.controls);
    }
    /** One control button: named, typed, and pointed at the row it drives. */
    control(flag, label, id) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute(flag, "");
      button.setAttribute("aria-controls", id);
      if (label) button.setAttribute("aria-label", label);
      return button;
    }
    /** Take the controls back out, so `wire()` and `disconnectedCallback` leave the markup as
     * they found it. */
    removeControls() {
      if (this.rotateButton) this.rotateButton.remove();
      if (this.controls) this.controls.remove();
      this.rotateButton = null;
      this.controls = null;
      this.picker = null;
      this.prevButton = null;
      this.nextButton = null;
    }
    /**
     * The rotation control's name says what pressing it will do, and it has no `aria-pressed`.
     * That is the APG's own answer for this button: a name that changes and a state that does
     * not, rather than both, which would have a screen reader read the two against each other.
     */
    labelRotation() {
      if (!this.rotateButton) return;
      const stop = this.getAttribute("pause-text") || "Stop slide rotation";
      const start = this.getAttribute("play-text") || "Start slide rotation";
      this.rotateButton.setAttribute("aria-label", this.rotating ? stop : start);
      this.rotateButton.replaceChildren(icon(this.rotating ? ICON.stop : ICON.play));
    }
    /**
     * Where the row is now, read off the layout.
     *
     * Called from both of the things that can move it, which is not belt and braces: the
     * observer fires when a slide crosses one of its thresholds, and a press that shifts the row
     * by less than that - the last step into a clamped end, or any step at all on a row of wide
     * slides - crosses nothing and would leave the index behind. A stale index is not a cosmetic
     * problem: the next press is measured from it, so previous appears to work once and then do
     * nothing at all, and next jumps several slides at a time.
     */
    readIndex() {
      const scroller = this.scroller;
      if (!scroller || !scroller.clientWidth) return;
      const edge = scroller.getBoundingClientRect().left;
      const starts = this.slides.map((slide2) => slide2.getBoundingClientRect().left - edge);
      this.apply(currentSlide(starts, this.inset, this.index));
    }
    /**
     * The observer's whole job: notice that the layout changed and re-read it.
     *
     * A resize, a container query flipping how many slides fit, a webfont landing - none of
     * them fire a scroll event, and this is the callback that would otherwise have to be a
     * resize listener. The `scroll-padding` is re-read here rather than on every scroll,
     * because a media query is the only thing that changes it and this is where layout changes
     * arrive.
     */
    onIntersect() {
      const scroller = this.scroller;
      if (!scroller) return;
      const styles = getComputedStyle(scroller);
      this.inset = startInset(styles, styles.direction === "rtl");
      this.readIndex();
    }
    /** Scrolled: the edges are the scroller's to report, and they change without the set of
     * visible slides changing. */
    onScroll() {
      const scroller = this.scroller;
      if (this.settling !== null && scroller && Math.abs(scroller.scrollLeft - this.settling) <= 1) {
        this.arrived();
      }
      this.readIndex();
    }
    /** The programmatic scroll is over: the scroller speaks for itself again. */
    arrived() {
      if (this.settleTimer) clearTimeout(this.settleTimer);
      this.settleTimer = null;
      this.settling = null;
    }
    /**
     * Push the current slide onto the picker and the slides, and tell the page when it moved.
     */
    apply(at) {
      const moved = at !== this.index;
      this.index = at;
      this.applyEdges();
      if (!moved && this.painted) return;
      const swap = this.fade && this.painted && moved;
      this.painted = true;
      this.markers.forEach((marker, index) => {
        if (index === at) marker.setAttribute("aria-disabled", "true");
        else marker.removeAttribute("aria-disabled");
      });
      const from = swap ? this.scroller.getBoundingClientRect().height : 0;
      this.slides.forEach((slide2, index) => {
        if (index === at) slide2.setAttribute("data-carousel-current", "");
        else slide2.removeAttribute("data-carousel-current");
      });
      if (swap) this.resize(from);
      if (!moved) return;
      this.dispatchEvent(new CustomEvent("carousel-change", {
        bubbles: true,
        detail: { index: at, slide: this.slides[at] || null }
      }));
    }
    /**
     * Whether there is anywhere left to go, either way - onto the two buttons as `aria-disabled`
     * and onto the element as a styling hook.
     *
     * Both at once is a row short enough to fit, and both buttons go dim: a carousel with
     * nothing to scroll is a list, and two live buttons over a list that cannot move is the
     * kind of thing that gets pressed twice and then distrusted.
     */
    applyEdges() {
      const scroller = this.scroller;
      if (!scroller) return;
      const offset = this.settling === null || this.settling === void 0 ? scroller.scrollLeft : this.settling;
      const at = this.fade ? { start: this.index <= 0, end: this.index >= this.slides.length - 1 } : scrollEdges(offset, scroller.clientWidth, scroller.scrollWidth);
      this.toggleAttribute("data-carousel-at-start", at.start);
      this.toggleAttribute("data-carousel-at-end", at.end);
      if (this.prevButton) this.prevButton.setAttribute("aria-disabled", String(at.start));
      if (this.nextButton) this.nextButton.setAttribute("aria-disabled", String(at.end));
    }
    /**
     * Carry the stack's height from the slide that left to the slide that arrived.
     *
     * A transition needs two numbers and `auto` is neither of them, so the height the box had a
     * moment ago is written back on, read once so the browser takes it as a start, and replaced
     * with the height it is going to. `transitionend` hands the box back to `auto` as soon as it
     * lands - which is what leaves a resize, a font arriving or an image that finally loaded to
     * the layout, instead of to a pixel count taken before any of them happened.
     *
     * Measured off the scroller rather than off the slide, so whatever padding or `box-sizing`
     * the page gave the list is inside both numbers instead of neither.
     *
     * @param {number} from The height the stack had before the current marker moved.
     */
    resize(from) {
      const scroller = this.scroller;
      scroller.style.height = "";
      const to = scroller.getBoundingClientRect().height;
      if (!swapHeight(from, to, reducedMotion())) return;
      scroller.style.height = from + "px";
      scroller.getBoundingClientRect();
      scroller.style.height = to + "px";
    }
    /**
     * Show a slide: scroll it to the start of the row, or cross-fade to it.
     *
     * The delta comes from the two boxes rather than from `offsetLeft`, which is measured
     * against whichever ancestor happens to be positioned and is a different number for the
     * slide and the scroller as soon as a page positions one of them. Assigning `scrollLeft`
     * rather than calling `scrollTo` leaves the smoothness to CSS, where the reduced-motion
     * query already lives - see `index.scss`.
     */
    to(at) {
      const slide2 = this.slides[at];
      if (!slide2) return;
      if (this.fade) {
        this.apply(at);
        return;
      }
      const scroller = this.scroller;
      const styles = getComputedStyle(scroller);
      this.inset = startInset(styles, styles.direction === "rtl");
      const delta = slide2.getBoundingClientRect().left - scroller.getBoundingClientRect().left - this.inset;
      const wanted = scroller.scrollLeft + delta;
      const reach = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
      this.settling = Math.sign(wanted) * Math.min(Math.abs(wanted), reach);
      if (this.settleTimer) clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => {
        this.arrived();
        this.applyEdges();
      }, 1e3);
      scroller.scrollLeft += delta;
      this.applyEdges();
    }
    /** One on, stopping at the end - where the button is dim and says so. */
    next() {
      if (this.hasAttribute("data-carousel-at-end")) return;
      this.to(stepSlide(this.index, 1, this.slides.length));
    }
    previous() {
      if (this.hasAttribute("data-carousel-at-start")) return;
      this.to(stepSlide(this.index, -1, this.slides.length));
    }
    /**
     * One on for the rotation, which is the only thing here that wraps.
     *
     * A carousel that rotates to its last slide and stops is a carousel that quietly died, so
     * the end goes back to the beginning. The buttons do not, because they are dim there and a
     * control that looks spent must not still act.
     */
    advance() {
      if (this.hasAttribute("data-carousel-at-end")) this.to(0);
      else this.to(stepSlide(this.index, 1, this.slides.length));
    }
    /**
     * Start rotating.
     *
     * `pinned` is what the rotation control sets, and it is the APG's rule that a rotation the
     * reader asked for by hand is not stopped again by a stray mouse crossing the row: hover
     * and focus are ignored until the same button stops it.
     */
    play(pinned) {
      this.rotating = true;
      this.pinned = !!pinned;
      this.tick();
      this.labelRotation();
      this.applyLive();
    }
    pause() {
      this.rotating = false;
      this.pinned = false;
      this.clearTimer();
      this.labelRotation();
      this.applyLive();
    }
    /**
     * The live region, and only in `fade`.
     *
     * Stacked, one slide is all there is, so a reader who cannot see the cross-fade is owed the
     * announcement - `polite` when the slides move because somebody pressed something. `off`
     * while it rotates, which is the half people leave out: a carousel announcing itself every
     * five seconds interrupts whatever else is being read, forever.
     *
     * Scrolling there is no region at all. Every slide is in the tree the whole time, so there
     * is nothing to announce that the reader cannot already reach.
     */
    applyLive() {
      const scroller = this.scroller;
      if (!scroller) return;
      if (!this.fade) {
        scroller.removeAttribute("aria-live");
        return;
      }
      scroller.setAttribute("aria-live", this.rotating ? "off" : "polite");
    }
    /**
     * Start the clock, and say so on the element.
     *
     * `data-carousel-rotating` is the timer and not `rotating`: the two part company every time
     * a pointer crosses the row, where the rotation is held but the button still says `Stop`.
     * A theme drawing a countdown off `rotating` would be one that keeps counting while nothing
     * is moving - so the hook is written where the clock is, out of the same two calls that
     * start and stop it, and cannot say otherwise. `--carousel-elemental-tick` goes with it for
     * the same reason: an animation is only honest at the length of the interval it is drawing,
     * and only this knows what that is.
     */
    tick() {
      this.clearTimer();
      this.timer = setInterval(() => this.advance(), this.interval);
      this.style.setProperty("--carousel-elemental-tick", this.interval + "ms");
      this.setAttribute("data-carousel-rotating", "");
    }
    clearTimer() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.removeAttribute("data-carousel-rotating");
      this.style.removeProperty("--carousel-elemental-tick");
    }
    /**
     * A finger has come up on a stacked slide, having travelled far enough across to have meant
     * it. The ends hold, exactly as they do for the buttons: the arrow is dim there, and a
     * gesture that still moved would be the carousel disagreeing with its own controls.
     *
     * A gesture more down the page than across it is the page scrolling and never arrives here -
     * `swipe` reports the axis it travelled furthest along, and only that one.
     */
    onSwipe(e) {
      const scroller = this.scroller;
      if (!e.horizontal || !scroller) return;
      const step = swipeStep(e.horizontalDirection, getComputedStyle(scroller).direction === "rtl");
      if (step > 0) this.next();
      else this.previous();
    }
    /** Every swipe listener comes back off, and the half-finished gesture with it. */
    unswipe() {
      if (this.swipes) this.swipes.destroy();
      this.swipes = null;
    }
    /** Give the stack its height back, and stop listening for the swap that pinned it. The
     * inline height is this element's own writing, so leaving one behind is leaving the list a
     * size the page never asked for. */
    unpin() {
      if (!this.heights) return;
      this.heights.removeEventListener("transitionend", this.onHeightEnd);
      this.heights.removeEventListener("transitioncancel", this.onHeightEnd);
      this.heights.style.height = "";
      this.heights = null;
    }
    /** The end of the height the swap pinned - or the end of any hope of one. */
    onHeightEnd(e) {
      if (e.target !== this.heights || e.propertyName !== "height") return;
      this.heights.style.height = "";
    }
    /** Rotation held while the pointer or the focus is in the carousel - still rotating as far
     * as the button's name is concerned, because it will be again on the way out. */
    suspend() {
      if (this.rotating && !this.pinned) this.clearTimer();
    }
    resume() {
      if (rotationHeld(this.hovering, this.focused)) return;
      if (this.rotating && !this.pinned && !this.timer) this.tick();
    }
    onHoverIn() {
      this.hovering = true;
      this.suspend();
    }
    onHoverOut() {
      this.hovering = false;
      this.resume();
    }
    onFocusIn() {
      this.focused = true;
      this.suspend();
    }
    /** Focus moving between two controls is focus that never left. */
    onFocusOut(e) {
      if (this.contains(e.relatedTarget)) return;
      this.focused = false;
      this.resume();
    }
    onClick(e) {
      const button = e.target.closest && e.target.closest("button");
      if (!button || button.closest("carousel-elemental") !== this) return;
      if (button === this.rotateButton) {
        if (this.rotating) this.pause();
        else this.play(true);
        return;
      }
      if (button === this.prevButton) {
        this.previous();
        return;
      }
      if (button === this.nextButton) {
        this.next();
        return;
      }
      const at = this.markers.indexOf(button);
      if (at >= 0) this.to(at);
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "fade") {
        this.wire();
        this.applyLive();
        return;
      }
      if (name === "autoplay") {
        this.writeControls();
        this.apply(this.index);
        if (this.autoplay && !reducedMotion()) this.play();
        else this.pause();
        return;
      }
      if (this.rotating && this.timer) this.tick();
    }
  };
  define("carousel-elemental", CarouselElemental);

  // src/elementals/checkbox-group/index.js
  function classify(states) {
    if (states.every((on) => on)) return states.length ? "all" : "none";
    return states.some((on) => on) ? "some" : "none";
  }
  function cycle(states, memory) {
    const now = classify(states);
    if (now === "some") return states.map(() => true);
    if (now === "all") return states.map(() => false);
    const restorable = memory && memory.length === states.length && classify(memory) === "some";
    return restorable ? memory.slice() : states.map(() => true);
  }
  var CheckboxGroupElemental = class extends ElementBase {
    /**
     * The "select all". The first checkbox in the element, in document order, which is where
     * it has to be for the reader too - a heading for a list comes before the list.
     */
    get parent() {
      return this.boxes()[0] || null;
    }
    /**
     * The checkboxes the parent stands for: every one below it, minus a nested group's own.
     *
     * Not `children`, which is `Element`'s own and means every child node that is an
     * element. Shadowing it would leave this element lying to any code that walks the DOM
     * generically - including the browser's own devtools.
     */
    get checkboxes() {
      return this.boxes().slice(1);
    }
    /** Every checkbox this element owns. A nested group keeps its own, parent included. */
    boxes() {
      return Array.from(this.querySelectorAll('input[type="checkbox"]')).filter((box) => box.closest("checkbox-group-elemental") === this);
    }
    /**
     * The checkboxes the parent can actually move, which is the set it speaks for.
     *
     * A disabled one is not in it, and that decides both halves at once. It cannot be
     * counted, because a group holding one disabled and unticked box could never reach "all"
     * - every press would compute "some", set everything it is allowed to, change nothing,
     * and the cycle would be stuck on the step it was already on. And it cannot be moved,
     * because a checkbox the reader could not have clicked is not one the parent gets to
     * click for them. So the parent's tick means "everything selectable is selected", which
     * is the only reading under which pressing it does what it says.
     */
    movable() {
      return this.checkboxes.filter((box) => !box.disabled);
    }
    /** `all`, `some` or `none` - the same word the element writes onto itself. */
    get state() {
      return classify(this.movable().map((box) => box.checked));
    }
    connectedCallback() {
      if (this.initialized) return;
      if (this.checkboxes.length === 0) return;
      this.initialized = true;
      this.onClick = this.onClick.bind(this);
      this.onChange = this.onChange.bind(this);
      this.onReset = this.onReset.bind(this);
      this.apply = this.apply.bind(this);
      this.parentWasHidden = this.parent.hasAttribute("hidden");
      if (this.parentWasHidden) this.parent.hidden = false;
      this.addEventListener("click", this.onClick);
      this.addEventListener("change", this.onChange);
      this.form = this.parent && this.parent.form;
      if (this.form) this.form.addEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.addEventListener("pageshow", this.apply);
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("change", this.onChange);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.removeEventListener("pageshow", this.apply);
      const parent = this.parent;
      if (parent) {
        parent.indeterminate = false;
        if (this.parentWasHidden) parent.hidden = true;
      }
      delete this.dataset.state;
      this.form = null;
      this.initialized = false;
    }
    /**
     * Read the children and put what they say onto the parent. Public because that is the
     * one thing no event announces: add or remove a checkbox and this is the call that
     * catches up.
     *
     * The memory is taken here rather than at the click, so a combination the reader built
     * by hand - ticking two of twenty themselves - is the one that comes back. Any way of
     * arriving at mixed is the group being mixed.
     */
    apply() {
      const parent = this.parent;
      if (!parent) return;
      const state = this.state;
      if (state === "some") this.memory = this.movable().map((box) => box.checked);
      parent.checked = state === "all";
      parent.indeterminate = state === "some";
      this.dataset.state = state;
    }
    /**
     * A press of the parent. `click` and not `keydown`, because `Space` on a checkbox *is* a
     * click - there is no keyboard here that the platform has not already written.
     *
     * The children are the source of truth, so the cycle is read off them and not off the
     * parent, whose `checked` the browser has already flipped and whose `indeterminate` it
     * has already cleared by the time this runs. `apply` puts both back.
     */
    onClick(e) {
      const parent = this.parent;
      if (!parent || e.target !== parent || parent.disabled) return;
      const children = this.movable();
      const next = cycle(children.map((box) => box.checked), this.memory);
      this.applying = true;
      for (let i = 0; i < children.length; i++) {
        const box = children[i];
        if (box.checked === next[i]) continue;
        box.checked = next[i];
        box.dispatchEvent(new Event("input", { bubbles: true }));
        box.dispatchEvent(new Event("change", { bubbles: true }));
      }
      this.applying = false;
      this.apply();
    }
    /** A child was ticked, so the parent has something new to say. */
    onChange(e) {
      if (this.applying || e.target === this.parent) return;
      this.apply();
    }
    /** A form is only put back to its defaults once the `reset` event has been dispatched,
     * so the checkboxes are read on the next task rather than in the handler. */
    onReset() {
      setTimeout(() => {
        this.memory = null;
        this.apply();
      });
    }
  };
  define("checkbox-group-elemental", CheckboxGroupElemental);

  // src/elementals/combobox/index.js
  function flipsUp(field, panelHeight, viewportHeight) {
    const below = viewportHeight - field.bottom;
    if (panelHeight <= below) return false;
    return field.top > below;
  }
  function focusAfterRemoval(count, index) {
    return index < count - 1 ? index : -1;
  }
  function removeName(verb, label) {
    return fillLabel(verb, label);
  }
  function fillLabel(template, label) {
    if (template.indexOf("{label}") === -1) return template + " " + label;
    return template.replace(/\{label\}/g, () => label);
  }
  function offersCustom(query, texts) {
    const value = String(query == null ? "" : query).trim().toLowerCase();
    if (!value) return false;
    return !texts.some((text) => String(text == null ? "" : text).trim().toLowerCase() === value);
  }
  var comboboxCount = 0;
  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }
  var ComboboxElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["open", "placeholder", "empty-text", "remove-text", "custom-values", "add-text"];
    }
    /** The control. Direct child, so a `<select>` inside a popover of your own is not
     * mistaken for it. */
    get select() {
      return this.querySelector(":scope > select");
    }
    /** Whether the popup is showing. Reflected, so `[open]` is a styling hook too. */
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      this.toggleAttribute("open", !!value);
    }
    /** Whether this holds more than one value, which is the `<select>`'s own `multiple`. */
    get multiple() {
      const select = this.select;
      return !!select && select.multiple;
    }
    /** Disabled by its own attribute or by a `<fieldset disabled>` above it, which
     * `:disabled` answers for in one selector. */
    get disabled() {
      const select = this.select;
      return !!select && select.matches(":disabled");
    }
    /**
     * What the empty field says. A single select usually has the answer in its own markup
     * already - the `<option value="">Choose a fruit</option>` at the top is a placeholder
     * that has been written down as an option since forms had options.
     */
    get placeholder() {
      if (this.hasAttribute("placeholder")) return this.getAttribute("placeholder");
      const select = this.select;
      if (!select || select.multiple) return "";
      const blank = Array.from(select.options).find((option) => option.value === "");
      return blank ? blank.text : "";
    }
    set placeholder(value) {
      this.setAttribute("placeholder", value);
    }
    get emptyText() {
      return this.getAttribute("empty-text") || "No matches";
    }
    get removeText() {
      return this.getAttribute("remove-text") || "Remove";
    }
    /** The `<select>`'s value, so a single select reads as one string and a multiple one
     * as the first of its selections - exactly as the native property does. */
    get value() {
      const select = this.select;
      return select ? select.value : "";
    }
    set value(value) {
      const select = this.select;
      if (!select) return;
      select.value = value;
      this.sync();
    }
    /** Every selected value, in document order. The one a multiple select has no property
     * for. */
    get values() {
      const select = this.select;
      return select ? Array.from(select.selectedOptions).map((option) => option.value) : [];
    }
    /**
     * Whether a value the list does not hold may be typed into it.
     *
     * Off by default, and it has to be: a `<select>` is a closed set of answers, and an
     * element that quietly widened one would be answering a question the markup did not ask.
     */
    get customValues() {
      return this.hasAttribute("custom-values");
    }
    /** What the popup's add row says, with `{label}` standing in for what was typed. */
    get addText() {
      return this.getAttribute("add-text") || "Add {label}";
    }
    connectedCallback() {
      if (this.initialized) return;
      const select = this.select;
      if (!select) return;
      this.initialized = true;
      this.query = "";
      this.onInput = this.onInput.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onSelectChange = this.onSelectChange.bind(this);
      this.onPointerOver = this.onPointerOver.bind(this);
      this.onInvalid = this.onInvalid.bind(this);
      this.onReset = this.onReset.bind(this);
      this.place = this.place.bind(this);
      this.sync = this.sync.bind(this);
      this.build();
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("mousedown", this.onMouseDown);
      this.addEventListener("pointerover", this.onPointerOver);
      this.addEventListener("click", this.onClick);
      this.addEventListener("focusout", this.onFocusOut);
      this.input.addEventListener("input", this.onInput);
      select.addEventListener("invalid", this.onInvalid);
      select.addEventListener("change", this.onSelectChange);
      document.addEventListener("click", this.onDocumentClick);
      window.addEventListener("resize", this.place);
      this.form = select.form;
      if (this.form) this.form.addEventListener("reset", this.onReset);
      window.addEventListener("pageshow", this.sync);
      this.apply();
      this.applyOpen();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("mousedown", this.onMouseDown);
      this.removeEventListener("pointerover", this.onPointerOver);
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("focusout", this.onFocusOut);
      this.input.removeEventListener("input", this.onInput);
      document.removeEventListener("click", this.onDocumentClick);
      window.removeEventListener("resize", this.place);
      window.removeEventListener("pageshow", this.sync);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      const select = this.select;
      if (select) {
        select.removeEventListener("change", this.onSelectChange);
        select.removeEventListener("invalid", this.onInvalid);
      }
      this.form = null;
      this.teardown();
      this.initialized = false;
    }
    // ---- structure ----
    /**
     * Build the view: a field holding the chips, the text input and the popup indicator,
     * and the listbox under it.
     *
     * Inserted **before** the `<select>` rather than after, because a `<label>` wrapping
     * this element names the first labelable thing inside it, and the `<select>` staying
     * first would leave the visible field anonymous while the hidden control wore the name.
     */
    build() {
      const select = this.select;
      const id = "combobox-elemental-" + ++comboboxCount;
      this.field = el("div", "combobox-elemental-field");
      this.chips = el("span", "combobox-elemental-chips");
      this.input = el("input", "combobox-elemental-input");
      this.list = el("ul", "combobox-elemental-list");
      this.error = el("p", "combobox-elemental-error");
      this.indicator = select.multiple ? null : el("button", "combobox-elemental-indicator");
      this.input.id = id;
      this.input.type = "text";
      this.input.autocomplete = "off";
      this.input.spellcheck = false;
      this.input.setAttribute("role", "combobox");
      this.input.setAttribute("aria-expanded", "false");
      this.input.setAttribute("aria-controls", id + "-list");
      this.input.setAttribute("aria-autocomplete", "list");
      if (this.indicator) {
        this.indicator.type = "button";
        this.indicator.tabIndex = -1;
        this.indicator.setAttribute("aria-hidden", "true");
      }
      this.list.id = id + "-list";
      this.list.setAttribute("role", "listbox");
      this.list.hidden = true;
      if (select.multiple) this.list.setAttribute("aria-multiselectable", "true");
      this.error.id = id + "-error";
      this.error.hidden = true;
      this.field.append(this.chips, this.input);
      if (this.indicator) this.field.append(this.indicator);
      this.insertBefore(this.field, select);
      this.insertBefore(this.list, select);
      this.insertBefore(this.error, select);
      this.labels = Array.from(select.labels || []).filter((label) => label.htmlFor);
      for (const label of this.labels) label.htmlFor = this.input.id;
      for (const name of ["aria-label", "aria-labelledby", "aria-describedby"]) {
        if (select.hasAttribute(name)) this.input.setAttribute(name, select.getAttribute(name));
      }
      this.describedBy = select.getAttribute("aria-describedby") || "";
      select.tabIndex = -1;
      select.setAttribute("aria-hidden", "true");
      select.classList.add("combobox-elemental-native");
    }
    /** Put the markup back the way it arrived: the view goes, the `<select>` returns to
     * being an ordinary, focusable, announced control. An element that is no longer here
     * leaves nothing behind that only it knew how to drive. */
    teardown() {
      const select = this.select;
      if (select) {
        select.removeAttribute("tabindex");
        select.removeAttribute("aria-hidden");
        select.classList.remove("combobox-elemental-native");
        for (const label of this.labels || []) label.htmlFor = select.id;
      }
      if (this.field) this.field.remove();
      if (this.list) this.list.remove();
      if (this.error) this.error.remove();
      this.pairs = [];
    }
    /**
     * Read the `<select>` again: rebuild the options and redraw everything from them.
     * Public because that is the one thing no event announces - replace the `<option>`s
     * from script and this is the call that catches up.
     */
    apply() {
      const select = this.select;
      if (!select) return;
      this.list.textContent = "";
      this.pairs = [];
      for (const node of select.children) {
        if (node.tagName === "OPTGROUP") {
          const holder = el("li", "combobox-elemental-group");
          holder.setAttribute("role", "presentation");
          const label = el("span", "combobox-elemental-group-label");
          label.setAttribute("aria-hidden", "true");
          label.textContent = node.label;
          const group = el("ul");
          group.setAttribute("role", "group");
          group.setAttribute("aria-label", node.label);
          holder.append(label, group);
          for (const option of node.children) this.addOption(option, group);
          this.list.append(holder);
          continue;
        }
        if (node.tagName === "OPTION") this.addOption(node, this.list);
      }
      this.empty = el("li", "combobox-elemental-empty");
      this.empty.setAttribute("role", "option");
      this.empty.setAttribute("aria-disabled", "true");
      this.empty.hidden = true;
      this.list.append(this.empty);
      this.add = el("li", "combobox-elemental-add");
      this.add.id = this.list.id + "-add";
      this.add.setAttribute("role", "option");
      this.add.setAttribute("aria-selected", "false");
      this.add.hidden = true;
      this.list.append(this.add);
      this.filter();
      this.sync();
    }
    addOption(option, parent) {
      if (option.tagName !== "OPTION") return;
      const item = el("li", "combobox-elemental-option");
      item.id = this.list.id + "-" + this.pairs.length;
      item.setAttribute("role", "option");
      item.textContent = option.text;
      if (option.disabled) item.setAttribute("aria-disabled", "true");
      parent.append(item);
      this.pairs.push({ option, item });
    }
    // ---- state ----
    /**
     * Push the `<select>` onto the view: the chips, the selected states, the field's text
     * and whether any of it can be touched.
     *
     * The field's text is the selection and nothing else, so a query typed and abandoned -
     * by tabbing away, by Escape, by picking something - never survives as a label for a
     * value it does not name.
     */
    sync() {
      const select = this.select;
      if (!select || !this.initialized) return;
      const multiple = select.multiple;
      const disabled = this.disabled;
      for (const pair of this.pairs) {
        pair.item.setAttribute("aria-selected", pair.option.selected ? "true" : "false");
      }
      this.chips.textContent = "";
      if (multiple) {
        for (const option of select.selectedOptions) {
          const chip = el("span", "combobox-elemental-chip");
          const label = el("span", "combobox-elemental-chip-label");
          label.textContent = option.text;
          const remove = el("button", "combobox-elemental-chip-remove");
          remove.type = "button";
          remove.disabled = disabled;
          remove.setAttribute("aria-label", removeName(this.removeText, option.text));
          chip.append(label, remove);
          this.chips.append(chip);
        }
      } else {
        const option = select.selectedOptions[0];
        this.input.value = option && option.value !== "" ? option.text : "";
      }
      this.input.placeholder = this.placeholder;
      this.input.disabled = disabled;
      if (this.indicator) this.indicator.disabled = disabled;
      if (select.required) this.input.setAttribute("aria-required", "true");
      else this.input.removeAttribute("aria-required");
      if (disabled && this.open) this.open = false;
      if (!this.error.hidden && select.checkValidity()) this.clearError();
    }
    /**
     * The browser has refused to submit. Its own bubble is dropped and the message kept,
     * because the bubble would be pointing at the `<select>` - which is transparent,
     * `aria-hidden`, and about to take focus away from the field the reader has to fill in.
     *
     * The text is the browser's own `validationMessage`, so it arrives already translated
     * into the reader's language and says what the platform would have said.
     */
    onInvalid(e) {
      e.preventDefault();
      this.error.textContent = this.select.validationMessage;
      this.error.hidden = false;
      this.input.setAttribute("aria-invalid", "true");
      this.input.setAttribute("aria-describedby", [this.describedBy, this.error.id].filter(Boolean).join(" "));
      const form = this.select.form;
      const first = form && form.querySelector(":is(input, select, textarea, fieldset):invalid");
      if (!first || first === this.select) this.input.focus();
    }
    clearError() {
      this.error.hidden = true;
      this.error.textContent = "";
      this.input.removeAttribute("aria-invalid");
      if (this.describedBy) this.input.setAttribute("aria-describedby", this.describedBy);
      else this.input.removeAttribute("aria-describedby");
    }
    /** Hide the options the query does not answer, and the groups that are left holding
     * none of them. */
    filter() {
      let shown = 0;
      for (const pair of this.pairs) {
        const hit = matchesSearch(pair.option.text, this.query);
        pair.item.hidden = !hit;
        if (hit) shown++;
      }
      for (const group of this.list.querySelectorAll(".combobox-elemental-group")) {
        group.hidden = !group.querySelector('[role="option"]:not([hidden])');
      }
      const custom = this.customValues && offersCustom(this.query, this.pairs.map((pair) => pair.option.text));
      this.add.hidden = !custom;
      if (custom) this.add.textContent = fillLabel(this.addText, this.query.trim());
      this.empty.textContent = this.emptyText;
      this.empty.hidden = shown > 0 || custom;
    }
    /** The options an arrow key can reach: on screen, and not disabled. The add row is one of
     * them while it is showing, which is what makes it reachable by keyboard at all. */
    navigable() {
      const pairs = this.pairs.filter((pair) => !pair.item.hidden && !pair.option.disabled);
      if (this.add && !this.add.hidden) pairs.push({ option: null, item: this.add, custom: true });
      return pairs;
    }
    /** Where the popup's own cursor is - `aria-activedescendant`, read back as an index
     * into the list the arrows walk. */
    activeIndex() {
      const id = this.input.getAttribute("aria-activedescendant");
      return id ? this.navigable().findIndex((pair) => pair.item.id === id) : -1;
    }
    /**
     * Move the popup's cursor. Focus itself never moves - it stays in the field, which is
     * what `aria-activedescendant` is for and what lets typing carry on narrowing the list
     * while an option is "focused".
     */
    setActive(index) {
      for (const pair2 of this.pairs) pair2.item.removeAttribute("data-active");
      if (this.add) this.add.removeAttribute("data-active");
      const pair = this.navigable()[index];
      if (!pair) {
        this.input.removeAttribute("aria-activedescendant");
        return;
      }
      pair.item.setAttribute("data-active", "");
      this.input.setAttribute("aria-activedescendant", pair.item.id);
      pair.item.scrollIntoView({ block: "nearest" });
    }
    /**
     * Point the popup at whichever side of the field it fits on, and write that on it for
     * the stylesheet to act on - the measuring is the element's, the positioning is CSS's.
     */
    place() {
      if (!this.open) return;
      const up = flipsUp(this.field.getBoundingClientRect(), this.list.offsetHeight, window.innerHeight);
      this.list.setAttribute("data-side", up ? "block-start" : "block-end");
      this.list.scrollIntoView({ block: "nearest" });
    }
    /**
     * `open` is the single source of truth for the popup, so a click, a key and a script
     * setting the attribute all land here.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "open") this.applyOpen();
      else {
        this.filter();
        this.sync();
      }
    }
    /** Show or hide the popup, and put the cursor somewhere sensible inside it. */
    applyOpen() {
      const open = this.open;
      this.input.setAttribute("aria-expanded", open ? "true" : "false");
      this.list.hidden = !open;
      if (!open) {
        this.setActive(-1);
        this.list.removeAttribute("data-side");
        return;
      }
      this.place();
      const selected = this.navigable().findIndex((pair) => pair.option.selected);
      this.setActive(selected < 0 ? 0 : selected);
    }
    // ---- editing ----
    /** Choose, or in a multiple select un-choose, one option. */
    pick(pair) {
      if (!pair || this.disabled) return;
      if (pair.custom) {
        this.addValue();
        return;
      }
      if (pair.option.disabled) return;
      if (this.multiple) {
        pair.option.selected = !pair.option.selected;
        this.query = "";
        this.input.value = "";
        this.filter();
        this.sync();
        this.emit();
        this.place();
        this.setActive(this.navigable().indexOf(pair));
      } else {
        pair.option.selected = true;
        this.query = "";
        this.open = false;
        this.filter();
        this.sync();
        this.emit();
      }
      this.input.focus();
    }
    /**
     * Turn what has been typed into an `<option>` of the `<select>`, and choose it.
     *
     * A real `<option>`, appended to the control, because the control is what submits - a
     * value held anywhere else is a value the form does not have. From that moment it is an
     * option like the ones the page wrote: it filters, it gets a chip, its remove button is
     * named the same way, and picking it again toggles it. That is the whole reason this is an
     * attribute on the combobox and not a second element - the machinery already existed.
     *
     * Rebuilding the view rather than splicing one row into it: `apply()` is what keeps the
     * `<option>` order, the `id`s and the pair list agreeing with the `<select>`, and one
     * rebuild on a keystroke the reader made deliberately is cheaper than a second code path
     * that can drift from the first.
     */
    addValue() {
      const select = this.select;
      const value = this.query.trim();
      if (!select || !value) return;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
      this.apply();
      this.pick(this.pairs.find((pair) => pair.option === option));
    }
    /** Drop the `index`th selection, and put focus somewhere that still exists. */
    removeAt(index) {
      if (this.disabled) return;
      const selected = Array.from(this.select.selectedOptions);
      const option = selected[index];
      if (!option || option.disabled) return;
      option.selected = false;
      this.sync();
      this.emit();
      const to = focusAfterRemoval(selected.length, index);
      const buttons = this.chips.querySelectorAll(".combobox-elemental-chip-remove");
      if (to >= 0 && buttons[to]) buttons[to].focus();
      else this.input.focus();
    }
    /**
     * Tell the page, in the events it is already listening for. The `<select>` is the
     * control, so `input` and `change` fire on it and in that order, exactly as they do
     * when a reader uses a native one - which is why this element has no event of its own.
     */
    emit() {
      this.emitting = true;
      this.select.dispatchEvent(new Event("input", { bubbles: true }));
      this.select.dispatchEvent(new Event("change", { bubbles: true }));
      this.emitting = false;
    }
    // ---- input ----
    onSelectChange() {
      if (!this.emitting) this.sync();
    }
    /** A form is only put back to its defaults after the `reset` event has been
     * dispatched, so the options are read on the next task rather than in the handler. */
    onReset() {
      setTimeout(() => {
        this.query = "";
        this.open = false;
        this.filter();
        this.sync();
      });
    }
    onInput() {
      this.query = this.input.value;
      this.filter();
      if (!this.open) this.open = true;
      else this.place();
      this.setActive(0);
    }
    /**
     * A pointer press inside the popup would blur the field before the click landed, and a
     * combobox whose field loses focus is one whose popup has just closed. The press is
     * cancelled instead; the click that follows still arrives.
     *
     * `mousedown` and not `pointerdown`, which reads as the modern spelling and breaks
     * touch: cancelling `pointerdown` suppresses the compatibility mouse events, and on iOS
     * the tap's `click` is the last of that same synthesised run - so the press keeps the
     * field's focus and takes the tap with it. The compatibility `mousedown` arrives before
     * the focus change and before `click`, so cancelling that one costs nothing.
     */
    onMouseDown(e) {
      if (this.list.contains(e.target)) e.preventDefault();
    }
    /**
     * Pointing at an option moves the popup's cursor onto it, so the mouse and the arrow
     * keys drive the same one thing. Without this the pointer lights up one option while
     * `aria-activedescendant` sits on another, and two options look chosen at once - with
     * Enter belonging to the one the reader is not pointing at.
     */
    onPointerOver(e) {
      const item = e.target.closest && e.target.closest('[role="option"]');
      if (!item || !this.list.contains(item)) return;
      const index = this.navigable().findIndex((pair) => pair.item === item);
      if (index >= 0) this.setActive(index);
    }
    onClick(e) {
      if (this.disabled) return;
      const remove = e.target.closest(".combobox-elemental-chip-remove");
      if (remove) {
        const buttons = Array.from(this.chips.querySelectorAll(".combobox-elemental-chip-remove"));
        this.removeAt(buttons.indexOf(remove));
        return;
      }
      const item = e.target.closest('[role="option"]');
      if (item) {
        this.pick(this.pairs.find((pair) => pair.item === item));
        return;
      }
      if (!this.field.contains(e.target)) return;
      this.open = this.indicator && this.indicator.contains(e.target) ? !this.open : true;
      this.input.focus();
    }
    onKeyDown(e) {
      if (this.disabled || e.target !== this.input) return;
      const key = e.key;
      if (key === "Escape") {
        if (!this.open) return;
        e.preventDefault();
        this.query = "";
        this.open = false;
        this.filter();
        this.sync();
        return;
      }
      if (key === "Tab") {
        if (this.open) this.open = false;
        this.query = "";
        this.filter();
        this.sync();
        return;
      }
      if (key === "Enter") {
        if (!this.open) return;
        e.preventDefault();
        this.pick(this.navigable()[this.activeIndex()]);
        return;
      }
      if (key === "Backspace" && this.multiple && !this.input.value) {
        const count = this.select.selectedOptions.length;
        if (!count) return;
        e.preventDefault();
        this.removeAt(count - 1);
        return;
      }
      if (e.altKey && (key === "ArrowDown" || key === "ArrowUp")) {
        e.preventDefault();
        this.open = key === "ArrowDown";
        return;
      }
      const items = this.navigable();
      const to = nextIndex(this.activeIndex(), key, items.length);
      if (to === null) return;
      e.preventDefault();
      if (!this.open) {
        this.open = true;
        return;
      }
      this.setActive(to);
    }
    onFocusOut(e) {
      if (e.relatedTarget && this.contains(e.relatedTarget)) return;
      this.query = "";
      this.open = false;
      this.filter();
      this.sync();
    }
    onDocumentClick(e) {
      if (this.contains(e.target) || !this.open) return;
      this.query = "";
      this.open = false;
      this.filter();
      this.sync();
    }
  };
  define("combobox-elemental", ComboboxElemental);

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
      for (const el2 of this.querySelectorAll("input, select, textarea")) {
        if (el2.type && NOT_THE_CONTROL.has(el2.type)) continue;
        return el2;
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

  // src/elementals/marquee/index.js
  var DEFAULT_SPEED = 50;
  var MAX_CLONES = 20;
  function cloneCount(trackWidth, gapWidth, containerWidth, max = MAX_CLONES) {
    if (!(trackWidth > 0) || !(containerWidth > 0)) return 0;
    const gap = gapWidth > 0 ? gapWidth : 0;
    return Math.min(max, Math.ceil((containerWidth + gap) / (trackWidth + gap)));
  }
  function cycleDuration(distance, speed) {
    if (!(distance > 0)) return 0;
    return distance / (speed > 0 ? speed : DEFAULT_SPEED);
  }
  function reducedMotion2() {
    return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  var ICON2 = {
    play: {
      d: "M9.5 15.584V8.416a.5.5 0 0 1 .77-.42l5.576 3.583a.5.5 0 0 1 0 .842l-5.576 3.584a.5.5 0 0 1-.77-.42Z",
      box: "5.47 5.25 13.5 13.5"
    },
    stop: {
      d: "M7.75 6h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 16.25 18h-8.5A1.75 1.75 0 0 1 6 16.25v-8.5C6 6.784 6.784 6 7.75 6Z",
      box: "0 0 24 24"
    }
  };
  function icon2({ d, box }) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", box);
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.append(path);
    return svg;
  }
  var MarqueeElemental = class extends ElementBase {
    constructor() {
      super(...arguments);
      /** What the author wrote, captured at upgrade. Held rather than re-read, because after the
       * first lap the element's own children are mostly copies of it. */
      __publicField(this, "track", []);
    }
    /** The copies. */
    get clones() {
      return Array.from(this.querySelectorAll(":scope > [data-marquee-clone]"));
    }
    /** The pause button, when this wrote one. */
    get control() {
      return this.querySelector(":scope > .marquee-elemental-control");
    }
    /** Pixels a second. */
    get speed() {
      return Number(this.getAttribute("speed"));
    }
    set speed(value) {
      this.setAttribute("speed", value);
    }
    /** Whether it is moving. Setting it is the same as pressing the button. */
    get playing() {
      return !this.hasAttribute("data-marquee-paused");
    }
    set playing(value) {
      if (value) this.play();
      else this.pause();
    }
    connectedCallback() {
      if (this.initialized) return;
      this.track = Array.from(this.children);
      if (!this.track.length) return;
      this.initialized = true;
      this.track.forEach((node) => {
        if ((node.tagName === "UL" || node.tagName === "OL") && !node.hasAttribute("role")) {
          node.setAttribute("role", "list");
        }
      });
      if (!this.hasAttribute("no-controls")) this.addControl();
      if (reducedMotion2()) this.pause();
      else this.play();
      if (typeof ResizeObserver === "function") {
        this.observer = new ResizeObserver(() => this.measure());
        this.observer.observe(this);
        this.track.forEach((node) => this.observer.observe(node));
      }
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      this.initialized = false;
    }
    static get observedAttributes() {
      return ["speed"];
    }
    attributeChangedCallback(name, previous, value) {
      if (!this.initialized || previous === value) return;
      if (name === "speed") this.applyTiming();
    }
    /**
     * Write the pause button.
     *
     * Appended rather than expected in the markup, for the reason the carousel's controls are:
     * a button authored by hand is a button that does nothing until the script lands, and a
     * dead control is a worse promise than no control.
     *
     * Its name says what pressing it will do and it carries no `aria-pressed` - the APG's own
     * answer for this button, rather than both, which would have a screen reader read the two
     * against each other.
     */
    addControl() {
      if (this.control) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "marquee-elemental-control";
      button.addEventListener("click", () => {
        this.playing = !this.playing;
      });
      this.append(button);
      this.labelControl();
    }
    labelControl() {
      const button = this.control;
      if (!button) return;
      const stop = this.getAttribute("pause-text") || "Stop the moving content";
      const start = this.getAttribute("play-text") || "Start the moving content";
      button.setAttribute("aria-label", this.playing ? stop : start);
      button.replaceChildren(icon2(this.playing ? ICON2.stop : ICON2.play));
    }
    /**
     * Measure the track against the container, and make the strip cover it.
     *
     * **Guarded on the width it last saw**, and that guard is load-bearing twice over. Rebuilding
     * the copies restarts the animation from its first frame, so doing it on a resume would put
     * a jump behind the one gesture that means hold still - and an observer that rebuilt on
     * every callback would be one whose own writes are what it hears next, which is a loop with
     * no bottom to it.
     *
     * The clones come off before the read, because the number wanted is the width of what the
     * author wrote and a strip with copies in it is the width of the last answer. It is
     * measured across the track's own boxes and **not** off the element's `scrollWidth`, which
     * is the trap here: `scrollWidth` never reports less than the box it is on, so a short
     * track in a wide container measures as the container - one copy, and a hole in the loop
     * exactly where more copies were needed. Both ends are taken by extent rather than in
     * order, because `dir="rtl"` lays the same children out the other way round.
     *
     * The gap goes into the distance rather than beside it: a lap has to land the second copy
     * exactly where the first one started, which with a gap between them is one track plus one
     * gap. It is read off the computed style, so an author's own `--marquee-elemental-gap` is
     * in the sum without this having to parse it.
     */
    measure() {
      if (!this.initialized || !this.playing) return;
      const width = this.clientWidth;
      const gap = parseFloat(getComputedStyle(this).columnGap) || 0;
      const edges = this.track.map((node) => node.getBoundingClientRect());
      const track = Math.max(...edges.map((box) => box.right)) - Math.min(...edges.map((box) => box.left));
      const distance = track + gap;
      const copies = cloneCount(track, gap, width);
      if (copies === this.copies && distance === this.distance) return;
      this.copies = copies;
      this.distance = distance;
      this.removeAttribute("data-marquee-running");
      this.removeClones();
      void this.offsetWidth;
      if (!copies) {
        this.style.removeProperty("--marquee-elemental-distance");
        this.style.removeProperty("--marquee-elemental-duration");
        return;
      }
      for (let i = 0; i < copies; i++) this.append(...this.copyTrack());
      this.applyTiming();
      this.setAttribute("data-marquee-running", "");
    }
    /** How far a lap goes and how long it takes, onto the element for the keyframes to read.
     * Split out of the measuring because `speed` changes the second number and not the first,
     * and remeasuring to answer it would rebuild the strip to say the same thing. */
    applyTiming() {
      if (!(this.distance > 0)) return;
      this.style.setProperty("--marquee-elemental-distance", this.distance + "px");
      this.style.setProperty("--marquee-elemental-duration", cycleDuration(this.distance, this.speed) + "s");
    }
    /**
     * One copy of the track.
     *
     * `inert` and `aria-hidden` are two different readers and both are owed an answer: the
     * second keeps the copies out of the accessibility tree, and the first is the one every
     * other marquee is missing - without it <kbd>Tab</kbd> walks into copies of the same links,
     * scrolling past under the focus ring. `id`s come off on the way out, because a document
     * with twenty of the same `id` is one where every `aria-labelledby` and every `#anchor`
     * resolves to whichever came first.
     */
    copyTrack() {
      return this.track.map((node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute("data-marquee-clone", "");
        clone.setAttribute("aria-hidden", "true");
        clone.inert = true;
        if (clone.id) clone.removeAttribute("id");
        clone.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"));
        return clone;
      });
    }
    removeClones() {
      this.clones.forEach((clone) => clone.remove());
    }
    /** Start moving, making the copies it takes to do it seamlessly if they are not there yet. */
    play() {
      this.removeAttribute("data-marquee-paused");
      this.measure();
      this.labelControl();
      this.dispatchEvent(new CustomEvent("marquee-toggle", { bubbles: true, detail: { playing: true } }));
    }
    /**
     * Stop.
     *
     * The copies stay where they are. Taking them out would reflow the strip back to the
     * author's one track under a reader who has just asked for the movement to stop, which is
     * a jump asked for by the one gesture that means "hold still".
     */
    pause() {
      this.setAttribute("data-marquee-paused", "");
      this.labelControl();
      this.dispatchEvent(new CustomEvent("marquee-toggle", { bubbles: true, detail: { playing: false } }));
    }
  };
  define("marquee-elemental", MarqueeElemental);

  // src/elementals/menu/index.js
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
      this.placeOpen = this.placeOpen.bind(this);
      this.addEventListener("click", this.onClick);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("pointerover", this.onPointerOver);
      this.addEventListener("pointerleave", this.onPointerLeave);
      this.addEventListener("focusout", this.onFocusOut);
      document.addEventListener("click", this.onDocumentClick);
      window.addEventListener("resize", this.placeOpen);
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
      window.removeEventListener("resize", this.placeOpen);
      clearTimeout(this.hoverTimer);
      if (this.query) this.query.removeEventListener("change", this.onMediaChange);
      for (const menu of this.menus) {
        menu.removeAttribute("hidden");
        set(menu, "role", null);
        const trigger = this.triggerOf(menu);
        set(trigger, "aria-controls", null);
        set(trigger, "aria-haspopup", null);
        set(trigger, "aria-expanded", null);
        for (const item of this.itemsOf(menu)) {
          set(item.parentElement, "role", null);
          set(item, "role", null);
          set(item, "tabindex", null);
        }
      }
      delete this.dataset.mode;
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
      else this.place(menu);
    }
    /**
     * Point a list at whichever corner it fits in, and write that on it so the stylesheet
     * can put it there - the same trade as `data-mode`, and for the same reason: the
     * measuring is the element's, the positioning is CSS's.
     *
     * Measured from the preferred placement rather than from wherever the last flip left
     * it, so a panel does not decide where to go from a position it only has because it
     * went there last time.
     *
     * The carets read this back too: a submenu that opened to the left is announced by an
     * arrow that points left, which no `position-try` fallback can say.
     */
    place(menu) {
      const isRoot = menu === this.menu;
      const trigger = isRoot ? this.button : this.triggerOf(menu);
      if (!trigger || this.inline) {
        menu.removeAttribute("data-side");
        menu.removeAttribute("data-align");
        return;
      }
      menu.removeAttribute("data-side");
      menu.removeAttribute("data-align");
      const panel = { width: menu.offsetWidth, height: menu.offsetHeight };
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const rtl = window.getComputedStyle(menu).direction === "rtl";
      const at = isRoot ? placeFlyout(trigger.getBoundingClientRect(), panel, viewport, rtl) : placeSubmenu(trigger.getBoundingClientRect(), panel, viewport, rtl);
      menu.setAttribute("data-side", at.side);
      menu.setAttribute("data-align", at.align);
    }
    /** Re-place every open list. The viewport moved under them. */
    placeOpen() {
      for (const menu of this.menus) {
        if (this.isOpen(menu) && (menu !== this.menu || this.open)) this.place(menu);
      }
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
      if (open) this.place(submenu);
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

  // src/elementals/modal/index.js
  function dismissMode(value) {
    const mode = (value || "").trim().toLowerCase();
    return mode === "any" || mode === "none" ? mode : "closerequest";
  }
  function dismissible(mode, source) {
    if (mode === "none") return false;
    if (source === "pointer") return mode === "any";
    return true;
  }
  function commandAction(command) {
    const name = (command || "").trim().toLowerCase();
    if (name === "show-modal") return "open";
    if (name === "close" || name === "request-close") return "close";
    return null;
  }
  function adoption(open, modal, known) {
    if (!open || known) return null;
    return modal ? "modal" : "inline";
  }
  function settleLimit(endTimes) {
    const times = endTimes.filter((time) => typeof time === "number" && isFinite(time));
    if (!times.length) return 0;
    return Math.min(SETTLE_CEILING, Math.max(...times) + 50);
  }
  function outside(rect, x, y) {
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
  }
  var stack = [];
  var dialogCount = 0;
  var SETTLE_CEILING = 2e3;
  var listening = false;
  function listen() {
    if (listening) return;
    listening = true;
    document.addEventListener("click", onCommand);
    window.addEventListener("hashchange", syncHash);
  }
  function hostOf(id) {
    const dialog = id ? document.getElementById(id) : null;
    if (!dialog || dialog.localName !== "dialog") return null;
    const host = dialog.parentElement;
    return host && host.localName === "modal-elemental" && host.initialized ? host : null;
  }
  function onCommand(e) {
    if (e.defaultPrevented) return;
    const invoker = e.target.closest && e.target.closest("[commandfor]");
    if (!invoker) return;
    const action = commandAction(invoker.getAttribute("command"));
    const host = action && hostOf(invoker.getAttribute("commandfor"));
    if (!host) return;
    e.preventDefault();
    if (action === "open") host.show();
    else host.close();
  }
  function syncHash() {
    const id = window.location.hash.slice(1);
    for (const modal of [...stack]) {
      if (modal.fromHash && modal.dialog.id !== id) modal.close();
    }
    const host = hostOf(id);
    if (host && !host.open) host.show({ fromHash: true, pushed: true });
  }
  function settle(dialog) {
    if (typeof dialog.getAnimations !== "function") return Promise.resolve();
    let running;
    try {
      running = dialog.getAnimations({ subtree: true }).filter((animation) => {
        const effect = animation.effect;
        return effect && effect.target === dialog && effect.getComputedTiming().iterations !== Infinity;
      });
    } catch {
      return Promise.resolve();
    }
    const limit = settleLimit(running.map((animation) => animation.effect.getComputedTiming().endTime));
    if (!limit) return Promise.resolve();
    return Promise.race([
      Promise.allSettled(running.map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, limit))
    ]);
  }
  function stopMedia(dialog) {
    for (const media of dialog.querySelectorAll("video, audio")) {
      if (!media.paused) media.pause();
    }
    for (const frame of dialog.querySelectorAll("iframe[src]")) {
      const src = frame.src;
      frame.src = src;
    }
  }
  var CLOSE_CLASS = "modal-elemental-close";
  function writesClose(mode) {
    return mode !== "none";
  }
  var ModalElemental = class extends ElementBase {
    /** The dialog this element upgrades. Direct child, so a nested modal's dialog is not
     * mistaken for this one's. */
    get dialog() {
      return this.querySelector(":scope > dialog");
    }
    /** Whether the modal is on screen. Closing counts as open until the animation is over,
     * which is what the dialog is doing for that quarter second. */
    get open() {
      const dialog = this.dialog;
      return !!dialog && dialog.open;
    }
    connectedCallback() {
      if (this.initialized) return;
      const dialog = this.dialog;
      if (!dialog) return;
      this.initialized = true;
      listen();
      if (!dialog.id) dialog.id = "modal-elemental-" + ++dialogCount;
      const authored = dialog.getAttribute("closedby");
      if (authored !== null && !this.hasAttribute("closedby")) this.setAttribute("closedby", authored);
      dialog.removeAttribute("closedby");
      this.name(dialog);
      this.writeClose(dialog);
      this.adopt();
      this.observer = new MutationObserver(() => this.adopt());
      this.observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
      this.onCancel = this.onCancel.bind(this);
      this.onNativeClose = this.onNativeClose.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
      dialog.addEventListener("cancel", this.onCancel);
      dialog.addEventListener("close", this.onNativeClose);
      dialog.addEventListener("pointerdown", this.onPointerDown);
      dialog.addEventListener("click", this.onClick);
      dialog.addEventListener("submit", this.onSubmit, true);
      if (!dialog.open && window.location.hash.slice(1) === dialog.id) this.show({ fromHash: true });
    }
    /**
     * Write the cross in the corner.
     *
     * First child rather than last, so the tab order and the reading order agree with where it
     * is drawn - and so focus lands on it when the dialog opens, which is the right first stop
     * for a dialog that is read rather than filled in. Put `autofocus` on a field to move it.
     *
     * `command="request-close"` rather than a handler of its own: it is the same door the
     * Escape key uses, animation and all, and it is markup an author could have written.
     *
     * The cross is text, not a background image, so a page that loaded the script but not the
     * stylesheet still has a button with something in it. `aria-label` is what is announced -
     * a cross is a shape and reads as nothing.
     */
    writeClose(dialog) {
      if (!writesClose(this.closedBy)) return;
      if (dialog.querySelector(":scope > ." + CLOSE_CLASS)) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = CLOSE_CLASS;
      button.setAttribute("command", "request-close");
      button.setAttribute("commandfor", dialog.id);
      button.setAttribute("aria-label", this.getAttribute("close-text") || "Close");
      button.textContent = "\u2715";
      dialog.prepend(button);
      this.closeButton = button;
    }
    /**
     * Take over a dialog somebody else opened, so it looks like one this element opened.
     *
     * A modal joins the stack and is numbered with the rest, since the backdrops have to be
     * counted whoever asked for them. A non-modal `show()` gets the visible state and nothing
     * else: it is a dialog in the page, not over it, and putting it in the stack would dim
     * the page and lock its scroll for a box the reader can still click past.
     */
    adopt() {
      const dialog = this.dialog;
      if (!dialog) return;
      const modal = typeof dialog.matches === "function" && dialog.matches(":modal");
      const what = adoption(dialog.open, modal, stack.includes(this) || this.closing);
      if (!what) return;
      if (what === "modal") {
        stack.push(this);
        depths();
      }
      dialog.getBoundingClientRect();
      dialog.dataset.state = "open";
      this.toggled(true);
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      const dialog = this.dialog;
      const index = stack.indexOf(this);
      if (index !== -1) stack.splice(index, 1);
      depths();
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      if (this.closeButton) this.closeButton.remove();
      this.closeButton = null;
      if (dialog) {
        dialog.removeEventListener("cancel", this.onCancel);
        dialog.removeEventListener("close", this.onNativeClose);
        dialog.removeEventListener("pointerdown", this.onPointerDown);
        dialog.removeEventListener("click", this.onClick);
        dialog.removeEventListener("submit", this.onSubmit, true);
        delete dialog.dataset.state;
        delete dialog.dataset.depth;
      }
      this.closing = false;
      this.initialized = false;
    }
    /** What `closedby` says, whether it was written here or on the dialog. */
    get closedBy() {
      return dismissMode(this.getAttribute("closedby"));
    }
    /**
     * Give the dialog a name if it has none, from the first heading inside it.
     *
     * A dialog with no accessible name is announced as "dialog" and nothing else, which is
     * the most common failure of the pattern and the one an author is least likely to see -
     * their own modal has a heading at the top of it, right there on screen. `aria-labelledby`
     * points at that heading rather than copying its words, so the two cannot drift apart.
     *
     * Only a heading of this dialog: a nested modal written inside this one has headings too,
     * and they name a different dialog.
     */
    name(dialog) {
      if (dialog.hasAttribute("aria-label") || dialog.hasAttribute("aria-labelledby")) return;
      const headings = dialog.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const heading = [...headings].find((node) => node.closest("dialog") === dialog);
      if (!heading) return;
      if (!heading.id) heading.id = dialog.id + "-title";
      dialog.setAttribute("aria-labelledby", heading.id);
    }
    /**
     * Open the modal.
     *
     * @param {{fromHash?: boolean, pushed?: boolean}} [options] - `fromHash` marks the URL as
     *   what opened it, so closing takes the fragment back off again. `pushed` says that
     *   fragment was navigated to rather than loaded with, which decides how it comes off.
     */
    show(options) {
      const dialog = this.dialog;
      if (!dialog) return;
      if (dialog.open) {
        if (this.closing) {
          this.closing = false;
          stack.push(this);
          depths();
          dialog.dataset.state = "open";
        }
        return;
      }
      if (this.hasAttribute("close-others")) {
        for (const modal of [...stack]) modal.close();
      }
      this.fromHash = !!(options && options.fromHash);
      this.hashPushed = !!(options && options.pushed);
      stack.push(this);
      depths();
      dialog.showModal();
      dialog.getBoundingClientRect();
      dialog.dataset.state = "open";
      this.toggled(true);
    }
    /**
     * Close the modal, once its animation has finished.
     *
     * Every way out lands here - Escape, the backdrop, a close button, a form, the fragment
     * changing - so there is one close, and it is animated whichever door was used. The
     * exception is an author calling `close()` on the `<dialog>` itself, which the platform
     * performs immediately and this element only tidies up after.
     *
     * @param {string} [returnValue] - What `dialog.returnValue` should say afterwards.
     */
    async close(returnValue) {
      const dialog = this.dialog;
      if (!dialog || !dialog.open || this.closing) return;
      this.closing = true;
      const index = stack.indexOf(this);
      if (index !== -1) stack.splice(index, 1);
      depths();
      dialog.dataset.state = "closing";
      try {
        await settle(dialog);
      } catch {
      }
      if (!this.closing) return;
      this.closing = false;
      if (returnValue === void 0) dialog.close();
      else dialog.close(returnValue);
    }
    /** Bookkeeping for a dialog that has closed, however it closed - including from script
     * that never went through this element. */
    onNativeClose() {
      const dialog = this.dialog;
      if (!dialog) return;
      const index = stack.indexOf(this);
      if (index !== -1) stack.splice(index, 1);
      depths();
      this.closing = false;
      delete dialog.dataset.state;
      delete dialog.dataset.depth;
      stopMedia(dialog);
      if (this.fromHash && window.location.hash.slice(1) === dialog.id) {
        if (this.hashPushed) window.history.back();
        else window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      this.fromHash = false;
      this.toggled(false);
    }
    /**
     * Escape, and every other close request the platform makes.
     *
     * Always prevented, never because the dialog should stay: the close it would perform is
     * instant, and this element owns an animated one. `closedby="none"` is the one case where
     * preventing it is the whole answer - and a second Escape will still force the dialog
     * shut, because a close watcher only lets itself be argued with once.
     */
    onCancel(e) {
      e.preventDefault();
      if (dismissible(this.closedBy, "escape")) this.close();
    }
    /** Where a click started, since a selection dragged out of the dialog and released on
     * the backdrop is not a click on the backdrop. */
    onPointerDown(e) {
      this.fromBackdrop = e.target === this.dialog && outside(this.dialog.getBoundingClientRect(), e.clientX, e.clientY);
    }
    /**
     * A click on the backdrop, which is a click on the dialog: the backdrop is a
     * pseudo-element and cannot be a target of its own.
     *
     * Two things have to agree for it to count. The target, so a click on a button inside is
     * never one - including the click a keyboard makes, which reports its position as the
     * origin of the viewport and would otherwise read as the far corner of the backdrop. And
     * the geometry, because the dialog's own padding is part of the dialog.
     */
    onClick(e) {
      const dialog = this.dialog;
      if (e.target !== dialog || !this.fromBackdrop) return;
      this.fromBackdrop = false;
      if (!outside(dialog.getBoundingClientRect(), e.clientX, e.clientY)) return;
      if (dismissible(this.closedBy, "pointer")) this.close();
    }
    /** `<form method="dialog">`, held back long enough to animate and then performed by
     * hand, `returnValue` and all. */
    onSubmit(e) {
      const form = e.target;
      const submitter = e.submitter;
      const method = submitter && submitter.getAttribute("formmethod") || form.getAttribute("method");
      if ((method || "").toLowerCase() !== "dialog") return;
      e.preventDefault();
      this.close(submitter ? submitter.value : "");
    }
    toggled(open) {
      const dialog = this.dialog;
      this.dispatchEvent(new CustomEvent("modal-toggle", {
        bubbles: true,
        detail: { open, dialog, depth: open ? stack.indexOf(this) + 1 : 0 }
      }));
    }
  };
  function depths() {
    stack.forEach((modal, index) => {
      const dialog = modal.dialog;
      if (dialog) dialog.dataset.depth = index + 1;
    });
  }
  define("modal-elemental", ModalElemental);

  // src/elementals/navbar/index.js
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
  var HOVER_CLOSE_DELAY2 = 250;
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
      for (const list of this.lists) {
        list.removeEventListener("beforematch", this.onBeforeMatch);
        list.removeAttribute("hidden");
      }
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
        list.addEventListener("beforematch", this.onBeforeMatch);
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
      const set2 = this.navigable(control);
      const to = stepIndex(set2.indexOf(control), e.key, set2.length);
      if (to === null) {
        const list = control.closest("ul, menu");
        const inside = this.stacked || list && list !== this.row;
        if (inside && VERTICAL.includes(e.key)) e.preventDefault();
        return;
      }
      e.preventDefault();
      set2[to].focus();
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
      this.hoverTimer = setTimeout(() => this.closeBar(null), HOVER_CLOSE_DELAY2);
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

  // src/elementals/progress/index.js
  function percent(value, max) {
    if (!(max > 0) || !Number.isFinite(value)) return 0;
    if (value <= 0) return 0;
    if (value >= max) return 100;
    return value * 100 / max;
  }
  var ProgressElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["buffer"];
    }
    /** The bar. Direct child, so a `<progress>` inside a card this element happens to wrap
     * is not mistaken for the one being measured. */
    get progress() {
      return this.querySelector(":scope > progress");
    }
    /**
     * The value, or `null` while there is none. Setting `null` takes the attribute off and
     * puts the bar back to indeterminate, which is what
     * [MDN says to do](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)
     * and the only way there is.
     */
    get value() {
      const progress = this.progress;
      return progress && progress.hasAttribute("value") ? progress.value : null;
    }
    set value(value) {
      const progress = this.progress;
      if (!progress) return;
      if (value === null || value === void 0) {
        progress.removeAttribute("value");
        return;
      }
      progress.value = value;
    }
    /** What counts as done. The `<progress>`'s own, which is `1` when it has none. */
    get max() {
      const progress = this.progress;
      return progress ? progress.max : null;
    }
    set max(value) {
      const progress = this.progress;
      if (progress) progress.max = value;
    }
    /** The second value, on the same scale. `null` is no buffer bar. */
    get buffer() {
      const value = this.getAttribute("buffer");
      if (value === null || value === "") return null;
      const number = parseFloat(value);
      return Number.isFinite(number) ? number : null;
    }
    set buffer(value) {
      if (value === null || value === void 0 || value === "") {
        this.removeAttribute("buffer");
        return;
      }
      this.setAttribute("buffer", value);
    }
    connectedCallback() {
      if (this.initialized) return;
      const progress = this.progress;
      if (!progress) return;
      this.initialized = true;
      this.apply = this.apply.bind(this);
      this.observer = new MutationObserver(this.apply);
      this.observer.observe(progress, { attributes: true, attributeFilter: ["value", "max"] });
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.observer.disconnect();
      this.observer = null;
      this.style.removeProperty("--progress-elemental-value");
      this.style.removeProperty("--progress-elemental-buffer");
      this.removeAttribute("data-indeterminate");
      this.initialized = false;
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.apply();
    }
    /**
     * Push the bar's state onto the element, where the CSS reads it. Public because a
     * `<progress>` swapped out from under this element is not something the observer is
     * watching for: replace the child and call this.
     *
     * `data-indeterminate` as well as the missing percentage, because CSS cannot ask whether
     * a custom property was set - an unset one inside `calc()` is a bar sitting at zero, and
     * a bar at zero is a claim that nothing has happened yet rather than that nobody knows.
     */
    apply() {
      const progress = this.progress;
      if (!progress) return;
      const max = progress.max;
      if (progress.hasAttribute("value")) {
        this.removeAttribute("data-indeterminate");
        this.style.setProperty("--progress-elemental-value", `${percent(progress.value, max)}%`);
      } else {
        this.setAttribute("data-indeterminate", "");
        this.style.removeProperty("--progress-elemental-value");
      }
      const buffer = this.buffer;
      if (buffer === null) {
        this.style.removeProperty("--progress-elemental-buffer");
        return;
      }
      this.style.setProperty("--progress-elemental-buffer", `${percent(buffer, max)}%`);
    }
  };
  define("progress-elemental", ProgressElemental);

  // src/elementals/search/index.js
  var DELAY_MS = 200;
  var MIN_LENGTH = 1;
  function searchAction(value, min, last) {
    const query = String(value == null ? "" : value).trim();
    if (query.length < min) return "clear";
    if (query === last) return "idle";
    return "query";
  }
  function searchStatus(state, count, texts) {
    const strings = texts || {};
    if (state === "results") {
      if (strings.results) return strings.results.replace(/\{n\}/g, count);
      return count === 1 ? "1 result" : count + " results";
    }
    if (state === "empty") return strings.empty || "No results";
    if (state === "error") return strings.error || "Search failed";
    return "";
  }
  function searchOpen(state, filled) {
    if (state === "results") return true;
    if (state === "empty") return !!filled;
    return false;
  }
  function readNumber(raw, fallback) {
    if (raw == null || raw.trim() === "") return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
  var SearchElemental = class extends ElementBase {
    /** The field being typed in: the first `<input>` inside. */
    get field() {
      return this.querySelector("input");
    }
    /** Where results land. Counting the links in it is how the element knows what to
     * announce, so this is a DOM query and not a call into the other element - a page that
     * loaded this bundle and not that one still gets its states and its announcement. */
    get panel() {
      return this.querySelector("suggest-elemental");
    }
    /** The live region. Added at upgrade, because a live region only announces text that
     * lands in one already in the document. */
    get status() {
      return this.querySelector(":scope > .search-elemental-status");
    }
    /** Milliseconds the field has to stop changing before a query goes out. */
    get delay() {
      return readNumber(this.getAttribute("delay"), DELAY_MS);
    }
    /** Characters needed before one goes out at all. */
    get min() {
      return readNumber(this.getAttribute("min"), MIN_LENGTH);
    }
    /** What the live region says, in the page's own words where it gave any. */
    get texts() {
      return {
        results: this.getAttribute("results-text"),
        empty: this.getAttribute("empty-text"),
        error: this.getAttribute("error-text")
      };
    }
    connectedCallback() {
      if (this.initialized) return;
      const field = this.field;
      if (!field) return;
      this.initialized = true;
      this.sequence = 0;
      this.last = null;
      if (!this.status) {
        const status = document.createElement("span");
        status.className = "search-elemental-status";
        status.setAttribute("role", "status");
        this.appendChild(status);
      }
      this.onInput = this.onInput.bind(this);
      field.addEventListener("input", this.onInput);
      this.dataset.state = "idle";
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      const field = this.field;
      if (field) field.removeEventListener("input", this.onInput);
      this.cancel();
      clearTimeout(this.announceTimer);
      const panel = this.panel;
      if (panel) panel.removeAttribute("aria-busy");
    }
    /** Stop whatever is in flight: the query that has not gone out yet, and the one that
     * has. Both, because a keystroke lands in one of those two windows and never says
     * which. */
    cancel() {
      clearTimeout(this.timer);
      if (this.controller) this.controller.abort();
      this.controller = null;
    }
    /**
     * Write the state onto the element, and onto the panel where it is the panel's to
     * report.
     *
     * `data-state` is the whole of the loading API: `[data-state="pending"]` is what a
     * spinner hangs off, and there is no second way to ask. `aria-busy` goes on the panel
     * rather than here because the panel is the region whose contents are being fetched.
     *
     * @param {"idle"|"pending"|"results"|"empty"|"error"} name
     */
    mark(name) {
      this.dataset.state = name;
      const panel = this.panel;
      if (!panel) return;
      if (name === "pending") panel.setAttribute("aria-busy", "true");
      else panel.removeAttribute("aria-busy");
    }
    /**
     * Say something in the live region.
     *
     * A live region announces a *change*, so the same message set twice in a row is silent -
     * which would make the second search for the same number of hits say nothing. Cleared
     * first and set back in a later task, so the two writes cannot coalesce into no change
     * at all.
     */
    announce(message) {
      const status = this.status;
      if (!status) return;
      status.textContent = "";
      clearTimeout(this.announceTimer);
      if (!message) return;
      this.announceTimer = setTimeout(() => {
        status.textContent = message;
      }, 0);
    }
    /**
     * How many answers landed. Links only, which is the rule the panel itself counts an
     * option by.
     *
     * The panel where there is one, and otherwise the element's own links with the form's
     * left out - a search whose results are a list in the page rather than a popup still has
     * a count to announce, and the "advanced search" link beside the field is not one of
     * them. Results rendered outside the element are outside what it can count, and it says
     * so rather than guessing.
     */
    get count() {
      const panel = this.panel;
      if (panel) return panel.querySelectorAll("a[href]").length;
      return Array.from(this.querySelectorAll("a[href]")).filter((link) => !link.closest("form")).length;
    }
    /**
     * Whether the panel has anything in it at all, which is a different question from how
     * many answers are in it.
     *
     * Text rather than a selector, because an empty state is whatever the page wrote - a
     * `<li>`, a paragraph, a line about what to try instead - and a list of shapes to match
     * would be this element having an opinion about markup it does not own. An empty `<ul>`
     * has no text; anything a reader could read does.
     */
    get filled() {
      const panel = this.panel;
      return !!panel && panel.textContent.trim() !== "";
    }
    /**
     * A search has finished: show it, open or close the panel, say what happened.
     *
     * @param {"idle"|"results"|"empty"|"error"} state
     * @param {number} count
     */
    settle(state, count) {
      this.mark(state);
      const panel = this.panel;
      if (panel) panel.toggleAttribute("open", searchOpen(state, this.filled));
      this.announce(searchStatus(state, count, this.texts));
    }
    /** Settle from whatever ended up in the panel. */
    settleFromPanel() {
      const count = this.count;
      this.settle(count > 0 ? "results" : "empty", count);
    }
    /**
     * Ask the page for results, and take whatever it does with that.
     *
     * The sequence number is the bug this element exists to fix: two requests in flight
     * settle in whatever order the network feels like, and the slow answer to the query
     * before last is the one that ends up on screen. `signal` asks the page to abort the
     * old one and the number makes sure it does not matter whether it did.
     *
     * @param {string} query
     */
    run(query) {
      this.cancel();
      this.last = query;
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      this.controller = controller;
      const mine = ++this.sequence;
      let waited = null;
      this.dispatchEvent(new CustomEvent("search-query", {
        bubbles: true,
        detail: {
          query,
          signal: controller ? controller.signal : null,
          wait: (promise) => {
            waited = promise;
          }
        }
      }));
      if (!waited) {
        this.settleFromPanel();
        return;
      }
      this.mark("pending");
      Promise.resolve(waited).then(
        () => {
          if (mine === this.sequence) this.settleFromPanel();
        },
        (error) => {
          if (mine !== this.sequence) return;
          if (error && error.name === "AbortError") {
            this.settle("idle", 0);
            return;
          }
          this.settle("error", 0);
        }
      );
    }
    onInput() {
      const field = this.field;
      if (!field) return;
      const action = searchAction(field.value, this.min, this.last);
      if (action === "idle") return;
      if (action === "clear") {
        this.cancel();
        this.last = null;
        this.settle("idle", 0);
        return;
      }
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.run(field.value.trim()), this.delay);
    }
  };
  define("search-elemental", SearchElemental);

  // src/elementals/segmented/index.js
  function checkedIndex(inputs) {
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) return i;
    }
    return -1;
  }
  var SegmentedElemental = class extends ElementBase {
    /** The segments, in document order. Direct children, so a radio group inside one
     * segment's popover is not mistaken for part of this one. */
    get inputs() {
      return Array.from(this.querySelectorAll(':scope > label > input[type="radio"]'));
    }
    /** Index of the checked segment, or `-1` when the group has no selection. */
    get selectedIndex() {
      return checkedIndex(this.inputs);
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.inputs.length) return;
      this.initialized = true;
      this.apply = this.apply.bind(this);
      this.onReset = this.onReset.bind(this);
      this.addEventListener("change", this.apply);
      this.form = this.closest("form");
      if (this.form) this.form.addEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.addEventListener("pageshow", this.apply);
      if (!this.hasAttribute("role") && (this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby"))) {
        this.setAttribute("role", "group");
      }
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("change", this.apply);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.removeEventListener("pageshow", this.apply);
      this.form = null;
      this.initialized = false;
    }
    /** A form is only put back to its defaults once the `reset` event has been dispatched,
     * so the selection is read on the next task rather than in the handler. */
    onReset() {
      setTimeout(this.apply);
    }
    /**
     * Push the selection onto the element, where the CSS reads it. Public because the count
     * is read here: add or remove a segment and this is the one call that catches up.
     *
     * `data-index` as well as the custom property, because CSS cannot ask whether a custom
     * property was set - an unset one inside `calc()` leaves the knob at zero, which is a
     * knob claiming the first segment. The attribute is what the knob's existence hangs
     * off, so no script and no selection both come out as no knob.
     */
    apply() {
      const inputs = this.inputs;
      const index = checkedIndex(inputs);
      this.style.setProperty("--segmented-elemental-count", inputs.length);
      if (index < 0) {
        this.removeAttribute("data-index");
        this.style.removeProperty("--segmented-elemental-index");
        return;
      }
      this.style.setProperty("--segmented-elemental-index", index);
      this.setAttribute("data-index", index);
    }
  };
  define("segmented-elemental", SegmentedElemental);

  // src/elementals/slider/index.js
  function ratio(value, min, max) {
    if (!(max > min) || !Number.isFinite(value)) return 0;
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
  }
  function clampPair(start, end, gap, moved, min, max, step) {
    if (end - start >= gap) return [start, end];
    if (moved === "start") {
      const pushed2 = end - gap;
      if (pushed2 >= min) return [snapToStep(pushed2, min, max, step, -1), end];
      return [min, snapToStep(Math.min(min + gap, max), min, max, step, 1)];
    }
    const pushed = start + gap;
    if (pushed <= max) return [start, snapToStep(pushed, min, max, step, 1)];
    return [snapToStep(Math.max(max - gap, min), min, max, step, -1), max];
  }
  function stackedThumb(start, end, max) {
    if (start !== end) return null;
    return end >= max ? "start" : "end";
  }
  function nearerThumb(value, start, end) {
    const toStart = Math.abs(value - start);
    const toEnd = Math.abs(value - end);
    if (toStart === toEnd) return value > end ? "end" : "start";
    return toStart < toEnd ? "start" : "end";
  }
  function alongTrack(x, left, width, thumb, rtl) {
    const travel = width - thumb;
    if (!(travel > 0)) return 0;
    const along = (x - left - thumb / 2) / travel;
    return Math.min(Math.max(rtl ? 1 - along : along, 0), 1);
  }
  function decimals(value) {
    const text = String(value);
    return text.includes("e") ? 0 : (text.split(".")[1] || "").length;
  }
  function snapToStep(value, min, max, step, direction) {
    if (!(step > 0)) return Math.min(Math.max(value, min), max);
    const places = Math.max(decimals(step), decimals(min));
    const trim = (number) => places ? Number(number.toFixed(places)) : number;
    const steps = (value - min) / step;
    const nearest = Math.round(steps);
    const count = Math.abs(steps - nearest) < 1e-9 ? nearest : direction < 0 ? Math.floor(steps) : direction > 0 ? Math.ceil(steps) : nearest;
    const snapped = min + count * step;
    if (snapped < min) return min;
    if (snapped > max) return trim(min + Math.floor((max - min) / step) * step);
    return trim(snapped);
  }
  function stepOf(input) {
    return input.step === "any" ? 0 : bound(input.step, 1);
  }
  function thumbUnder(x, left, width, thumb, ratios, rtl) {
    const travel = Math.max(width - thumb, 0);
    for (let i = 0; i < ratios.length; i++) {
      const at = rtl ? 1 - ratios[i] : ratios[i];
      if (Math.abs(x - (left + thumb / 2 + at * travel)) <= thumb / 2) return i;
    }
    return -1;
  }
  function draggedThumb(under, count) {
    if (under >= 0) return under;
    return count === 1 ? 0 : -1;
  }
  function tooltipModes(value) {
    if (value === null || value === void 0) return { thumb: false, track: false };
    const tokens = value.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return { thumb: true, track: false };
    return { thumb: tokens.includes("thumb"), track: tokens.includes("track") };
  }
  function bound(value, fallback) {
    const number = parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  }
  var SliderElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["gap", "tooltip"];
    }
    /** The thumbs, in document order. Direct children, so a range input inside a card this
     * element happens to wrap is not mistaken for one of them. */
    get inputs() {
      return Array.from(this.querySelectorAll(':scope > input[type="range"]'));
    }
    /**
     * The readouts, in document order, each following the input at the same index.
     *
     * Anywhere inside, unlike the inputs: a readout is nearly always wrapped in the
     * punctuation that gives it meaning - a currency symbol, a unit, the word "to" between a
     * pair - and a rule that only saw direct children would refuse the shape everybody
     * writes. `closest` is what keeps a nested slider's readouts its own.
     *
     * The `tooltip` bubble is an `<output>` too and is not one of these. Counted in, it would
     * take an index off the end of the list and the readouts would each be showing the value
     * of the thumb before their own.
     */
    get outputs() {
      return Array.from(this.querySelectorAll("output:not([data-tooltip])")).filter((output) => output.closest("slider-elemental") === this);
    }
    /** Least distance between the two thumbs, in the scale's own units. */
    get gap() {
      return bound(this.getAttribute("gap"), 0);
    }
    set gap(value) {
      this.setAttribute("gap", value);
    }
    /** Whether the control runs right to left. Computed style rather than `:dir()`, which
     * throws on the browsers that do not know it instead of quietly not matching. */
    get rtl() {
      return typeof getComputedStyle === "function" && getComputedStyle(this).direction === "rtl";
    }
    connectedCallback() {
      if (this.initialized) return;
      const inputs = this.inputs;
      if (!inputs.length) return;
      this.initialized = true;
      this.apply = this.apply.bind(this);
      this.onInput = this.onInput.bind(this);
      this.onReset = this.onReset.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onTooltipDown = this.onTooltipDown.bind(this);
      this.onTooltipUp = this.onTooltipUp.bind(this);
      this.tooltipX = null;
      this.tooltipElement = null;
      this.format = null;
      this.dragging = -1;
      this.addEventListener("input", this.onInput, true);
      this.form = this.closest("form");
      if (this.form) this.form.addEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.addEventListener("pageshow", this.apply);
      if (inputs.length > 1) {
        this.addEventListener("pointerdown", this.onPointerDown);
        if (!this.hasAttribute("role") && (this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby"))) {
          this.setAttribute("role", "group");
          this.wroteRole = true;
        }
      }
      this.apply();
      this.syncTooltip();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("input", this.onInput, true);
      this.removeEventListener("pointerdown", this.onPointerDown);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.removeEventListener("pageshow", this.apply);
      this.form = null;
      this.removeTooltip();
      this.style.removeProperty("--slider-elemental-start");
      this.style.removeProperty("--slider-elemental-end");
      this.removeAttribute("data-stacked");
      if (this.wroteRole) this.removeAttribute("role");
      this.wroteRole = false;
      this.initialized = false;
    }
    /** A new `gap` is a new distance the thumbs may already be inside of. */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "tooltip") {
        this.syncTooltip();
        return;
      }
      this.clamp("end");
      this.apply();
    }
    /** A form is only put back to its defaults once the `reset` event has been dispatched,
     * so the values are read on the next task rather than in the handler. */
    onReset() {
      setTimeout(this.apply);
    }
    onInput(e) {
      const inputs = this.inputs;
      const index = inputs.indexOf(e.target);
      if (index < 0) return;
      if (index < 2) this.clamp(index === 0 ? "start" : "end");
      this.apply();
    }
    /**
     * Stop the two thumbs crossing, and keep `gap` between them. Public because it is what
     * catches up a pair moved by script, which fires no `input` of its own.
     *
     * Both inputs keep the `min` and `max` the markup gave them, rather than the low one's
     * `max` being pulled down to the high one's value as the
     * [multi-thumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)
     * describes: these are stacked native inputs, so shrinking one's scale moves every pixel
     * on it and the two tracks stop agreeing about where a value is. The pattern's
     * `aria-valuemin`/`aria-valuemax` go with it, and are not written for a second reason -
     * [HTML-ARIA says authors should not put them on `input type=range`](https://www.w3.org/TR/html-aria/),
     * where the browser computes them from `min`, `max` and `value` already.
     */
    clamp(moved) {
      const inputs = this.inputs;
      if (inputs.length < 2) return;
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      const start = bound(inputs[0].value, min);
      const end = bound(inputs[1].value, max);
      const clamped = clampPair(start, end, this.gap, moved, min, max, stepOf(inputs[0]));
      if (clamped[0] !== start) inputs[0].value = clamped[0];
      if (clamped[1] !== end) inputs[1].value = clamped[1];
    }
    /**
     * Push the thumb positions onto the element, where the CSS reads them. Public because the
     * inputs are read here: swap one out, or move it from script, and this is the one call
     * that catches up.
     */
    apply() {
      const inputs = this.inputs;
      if (!inputs.length) return;
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      const first = bound(inputs[0].value, min);
      const second = inputs.length > 1 ? bound(inputs[1].value, max) : null;
      this.style.setProperty("--slider-elemental-start", second === null ? 0 : ratio(first, min, max));
      this.style.setProperty("--slider-elemental-end", ratio(second === null ? first : second, min, max));
      const stacked = second === null ? null : stackedThumb(first, second, max);
      if (stacked) {
        this.setAttribute("data-stacked", stacked);
      } else {
        this.removeAttribute("data-stacked");
      }
      const outputs = this.outputs;
      for (let i = 0; i < outputs.length && i < inputs.length; i++) {
        outputs[i].textContent = inputs[i].value;
      }
      if (this.tooltipX !== null) this.showTooltipAt(this.tooltipX);
    }
    /**
     * Put the value bubble in, or take it out, to match the `tooltip` attribute.
     *
     * Written by this element rather than asked of the author: a box reading out where the
     * *pointer* is has no markup anyone would have written anyway, and an `<output>` the page
     * forgot would be a tooltip that silently never appeared. `aria-hidden`, because the input
     * beneath it announces its own value already.
     */
    syncTooltip() {
      const modes = tooltipModes(this.getAttribute("tooltip"));
      const wanted = modes.thumb || modes.track;
      if (wanted && !this.tooltipElement) {
        const bubble = document.createElement("output");
        bubble.setAttribute("aria-hidden", "true");
        bubble.dataset.tooltip = "thumb";
        bubble.hidden = true;
        this.appendChild(bubble);
        this.tooltipElement = bubble;
        this.addEventListener("pointermove", this.onPointerMove);
        this.addEventListener("pointerleave", this.onPointerLeave);
        this.addEventListener("pointerdown", this.onTooltipDown);
        this.addEventListener("pointerup", this.onTooltipUp);
        this.addEventListener("pointercancel", this.onTooltipUp);
      }
      if (!wanted) this.removeTooltip();
      if (this.tooltipElement && this.tooltipX !== null) this.showTooltipAt(this.tooltipX);
    }
    /** The bubble and the listeners that draw it, gone together. The element wrote the bubble,
     * so the element is what takes it back off the page. */
    removeTooltip() {
      if (!this.tooltipElement) return;
      this.removeEventListener("pointermove", this.onPointerMove);
      this.removeEventListener("pointerleave", this.onPointerLeave);
      this.removeEventListener("pointerdown", this.onTooltipDown);
      this.removeEventListener("pointerup", this.onTooltipUp);
      this.removeEventListener("pointercancel", this.onTooltipUp);
      this.tooltipElement.remove();
      this.tooltipElement = null;
      this.tooltipX = null;
      this.dragging = -1;
    }
    onPointerMove(e) {
      if (e.pointerType === "touch") return;
      this.tooltipX = e.clientX;
      this.showTooltipAt(e.clientX);
    }
    /** A press pins the bubble to whatever it is about to drag, for as long as it is held. */
    onTooltipDown(e) {
      if (e.pointerType === "touch") return;
      const m = this.metrics(e.clientX);
      this.dragging = m ? draggedThumb(m.under, m.inputs.length) : -1;
      this.tooltipX = e.clientX;
      this.showTooltipAt(e.clientX);
    }
    /**
     * Let go, and where the pointer is decides again - including that it may have been let go
     * somewhere the bubble has no business still being.
     *
     * Answered from the coordinates rather than from `target` or from a `pointerleave` that
     * follows, because neither survives the drag. A range input holds pointer capture until
     * the release, so `target` is the input wherever on the screen the pointer actually is;
     * and the leave that would have covered it is not something every engine sends - Chromium
     * fires one after the capture ends and WebKit fires none at all, which is a bubble left
     * on the page after every drag that ended off the control.
     */
    onTooltipUp(e) {
      if (e.pointerType === "touch") return;
      this.dragging = -1;
      const rect = this.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (inside) this.showTooltipAt(e.clientX);
      else this.onPointerLeave();
    }
    onPointerLeave() {
      if (this.dragging >= 0) return;
      this.tooltipX = null;
      if (this.tooltipElement) this.tooltipElement.hidden = true;
    }
    /**
     * Everything a bubble is drawn from, measured in one go: the scale, where each thumb sits
     * on it, and which one a pointer at `x` is over. `null` where there is nothing to measure.
     */
    metrics(x) {
      const inputs = this.inputs;
      if (!inputs.length) return null;
      const rect = this.getBoundingClientRect();
      const thumb = inputs[0].getBoundingClientRect().height;
      const rtl = this.rtl;
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      const ratios = inputs.map((input) => ratio(bound(input.value, min), min, max));
      return { inputs, rect, thumb, rtl, min, max, ratios, under: thumbUnder(x, rect.left, rect.width, thumb, ratios, rtl) };
    }
    /**
     * Draw the bubble for a pointer at `x`, in viewport coordinates, or hide it where the
     * attribute did not ask for a bubble at that spot.
     *
     * A thumb reads out its input's own `value`, which the browser has already put on a step
     * and written the way it writes numbers. The track is the only one with a value to work
     * out, and it is worked out the way a press on the track is - same travel, same rounding -
     * so the number previewed is the number a click there would produce.
     *
     * A drag in progress overrules the pointer: `dragging` is the thumb the press pinned this
     * to, and it holds until the release. Without it the bubble answers where the pointer is,
     * which during a drag is beside the thumb half the time.
     */
    showTooltipAt(x) {
      const bubble = this.tooltipElement;
      if (!bubble) return;
      const m = this.metrics(x);
      if (!m) return;
      const modes = tooltipModes(this.getAttribute("tooltip"));
      const over = this.dragging >= 0 && this.dragging < m.inputs.length ? this.dragging : m.under;
      const on = over < 0 ? "track" : "thumb";
      if (!modes[on]) {
        bubble.hidden = true;
        return;
      }
      let at = m.ratios[over];
      let text = over < 0 ? "" : m.inputs[over].value;
      let value = over < 0 ? 0 : Number(m.inputs[over].value);
      if (over < 0) {
        at = alongTrack(x, m.rect.left, m.rect.width, m.thumb, m.rtl);
        value = snapToStep(m.min + at * (m.max - m.min), m.min, m.max, stepOf(m.inputs[0]));
        text = String(value);
      }
      bubble.dataset.tooltip = on;
      bubble.textContent = this.formatValue(value, text);
      bubble.style.setProperty("--slider-elemental-at", at);
      bubble.hidden = false;
    }
    /**
     * What the bubble says for a value, once `format` has had it.
     *
     * `fallback` is the browser's own spelling of the same number and is what shows whenever
     * there is no formatter, so an element nobody has assigned one to reads exactly as it did
     * before this hook existed. A formatter returning nothing falls back too - a bubble that
     * went blank because a function forgot a `return` looks like a broken element rather than
     * a bug in the page.
     */
    formatValue(value, fallback) {
      if (typeof this.format !== "function") return fallback;
      const formatted = this.format(value, this);
      return formatted === void 0 || formatted === null ? fallback : String(formatted);
    }
    /**
     * A press on the track, which stacked inputs would otherwise eat: the one on top covers
     * the whole width, so the stylesheet takes its pointer events away and leaves them on the
     * thumbs. That is what makes both thumbs grabbable, and it is also what leaves the track
     * dead until this runs - the nearer thumb takes the value and the focus.
     */
    onPointerDown(e) {
      if (e.target !== this) return;
      const inputs = this.inputs;
      if (inputs.length < 2) return;
      const rect = this.getBoundingClientRect();
      const thumb = inputs[0].getBoundingClientRect().height;
      if (rect.width <= thumb) return;
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      const value = min + alongTrack(e.clientX, rect.left, rect.width, thumb, this.rtl) * (max - min);
      const input = inputs[nearerThumb(value, bound(inputs[0].value, min), bound(inputs[1].value, max)) === "start" ? 0 : 1];
      input.value = value;
      e.preventDefault();
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
  define("slider-elemental", SliderElemental);

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
      if (this.internals && this.internals.setFormValue) {
        this.internals.setFormValue(formValue(this.checked, this.disabled, this.value));
      }
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
  var FOCUSABLE2 = "a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]";
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
        if (panel.querySelector(FOCUSABLE2)) panel.removeAttribute("tabindex");
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
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
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

  // src/elementals/tilt/index.js
  var DEFAULT_MAX = 10;
  function clamp01(value) {
    if (!(value > 0)) return 0;
    return value > 1 ? 1 : value;
  }
  function round3(value) {
    return Math.round((value + Number.EPSILON) * 1e3) / 1e3;
  }
  function tiltFrom(rect, pointerX, pointerY, options = {}) {
    const { axis, reverse } = options;
    const max = Number.isFinite(options.max) && options.max >= 0 ? options.max : DEFAULT_MAX;
    if (!(rect.width > 0) || !(rect.height > 0)) return { x: 0, y: 0, glareX: 50, glareY: 50 };
    const across = clamp01((pointerX - rect.left) / rect.width);
    const down = clamp01((pointerY - rect.top) / rect.height);
    const sign = reverse ? -1 : 1;
    return {
      x: axis === "y" ? 0 : round3(sign * (0.5 - down) * 2 * max),
      y: axis === "x" ? 0 : round3(sign * (across - 0.5) * 2 * max),
      glareX: round3(across * 100),
      glareY: round3(down * 100)
    };
  }
  function layerDepth(value) {
    if (typeof value !== "string" || value.trim() === "") return null;
    const depth = Number(value);
    return Number.isFinite(depth) ? depth : null;
  }
  var TiltElemental = class extends ElementBase {
    constructor() {
      super(...arguments);
      /** The frame callback's handle, `0` when none is queued. */
      __publicField(this, "frame", 0);
      /** The last position the pointer reported, `null` when it is not over the card. */
      __publicField(this, "pointer", null);
      /**
       * The card's box as it is with nothing leaning it, held for the length of one hover and
       * `null` at rest.
       *
       * **Every decision is made against this and not against the box the card is currently
       * drawn in**, which is the whole of why this element does not flicker at its own border.
       * The card leans *away* from the pointer, so the edge the pointer is nearest is always the
       * edge that swings back - and a receding edge projects inwards. Hit-test against the
       * leaning card and a pointer a pixel inside that edge falls outside it: `pointerleave`
       * fires, the card straightens, the edge lands back under the pointer, and it leans again.
       *
       * A lift towards the reader looks like it would cover the gap and does not: what the
       * rotation gives away grows with the square of the card's size, where a lift only scales
       * it, so any fixed lift is a card size away from flickering again. Measured on a
       * `640x400` card at ten degrees, `2.5rem` of lift was still nine pixels short.
       *
       * It can only be read at the one moment the card is flat, which is the first pointer event
       * of a hover - so it is read there and kept. Stale after a scroll, which is what the
       * scroll listener is for.
       */
      __publicField(this, "box", null);
    }
    /** Degrees at the edge. The trust boundary for `max`: past here it is a number at or above
     * zero, and `0` is a value an author means rather than one to fall back from. */
    get max() {
      const raw = this.getAttribute("max");
      if (raw === null || raw.trim() === "") return DEFAULT_MAX;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : DEFAULT_MAX;
    }
    set max(value) {
      this.setAttribute("max", value);
    }
    /** `'x'`, `'y'`, or `null` for both. Anything else is both, rather than a card that has
     * silently stopped moving because of a typo. */
    get axis() {
      const raw = (this.getAttribute("axis") || "").trim().toLowerCase();
      return raw === "x" || raw === "y" ? raw : null;
    }
    set axis(value) {
      if (value === null || value === void 0 || value === "") {
        this.removeAttribute("axis");
        return;
      }
      this.setAttribute("axis", value);
    }
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onDocumentMove = this.onDocumentMove.bind(this);
      this.onMotionChange = this.onMotionChange.bind(this);
      this.rest = this.rest.bind(this);
      this.update();
      this.motion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
      if (this.motion) this.motion.addEventListener("change", this.onMotionChange);
      this.onMotionChange();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      if (this.motion) this.motion.removeEventListener("change", this.onMotionChange);
      this.motion = null;
      this.stop();
      this.style.removeProperty("--tilt-elemental-glare-x");
      this.style.removeProperty("--tilt-elemental-glare-y");
      this.initialized = false;
    }
    /**
     * Copy every `data-tilt-depth` in the card onto a custom property the stylesheet can
     * multiply.
     *
     * CSS cannot read an attribute as a number - `attr()` with a type is not in the browsers
     * this book targets - so the number has to be carried across, and this is the one place it
     * happens.
     *
     * ponytail: read at upgrade and on demand, with no observer behind it. A card whose layers
     * arrive from a render after that calls `.update()`; a `MutationObserver` over the whole
     * subtree is the upgrade if that turns out to be the common case rather than the rare one.
     */
    update() {
      this.querySelectorAll("[data-tilt-depth]").forEach((layer) => {
        const depth = layerDepth(layer.getAttribute("data-tilt-depth"));
        if (depth === null) layer.style.removeProperty("--tilt-elemental-depth");
        else layer.style.setProperty("--tilt-elemental-depth", depth);
      });
    }
    onMotionChange() {
      if (this.motion && this.motion.matches) this.stop();
      else this.start();
    }
    /** Listen. Nothing is drawn until the pointer arrives, so this is safe to call twice. */
    start() {
      if (this.listening) return;
      this.listening = true;
      this.addEventListener("pointermove", this.onPointerMove);
    }
    /** Stop listening and lie flat. The card animates back rather than snapping, because the
     * transition is on the transform and the transform is what changed. */
    stop() {
      if (this.listening) {
        this.listening = false;
        this.removeEventListener("pointermove", this.onPointerMove);
      }
      this.rest();
    }
    onPointerMove(event) {
      if (event.pointerType !== "mouse") return;
      this.track(event.clientX, event.clientY);
    }
    /**
     * The pointer, once the card is leaning: the card's own `pointermove` stops being the
     * authority the moment there is a transform in the way of it.
     *
     * Capture, so nothing on the page can swallow the event that decides the card is done, and
     * the containment test is against the flat box rather than against whether the event
     * reached the element at all.
     */
    onDocumentMove(event) {
      if (event.pointerType !== "mouse" || !this.box) return;
      const { left, top, right, bottom } = this.box;
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
        this.rest();
        return;
      }
      this.track(event.clientX, event.clientY);
    }
    /**
     * Note where the pointer is and ask for a frame.
     *
     * The first call of a hover is the one that matters: the card is still flat, so this is the
     * only moment `getBoundingClientRect` answers with the untransformed box, and it is kept
     * for the rest of the hover. Everything after it - the angles, and whether the pointer has
     * left - is measured against that.
     *
     * One write a frame. `pointermove` outruns the display, and every extra pass is a style
     * invalidation for a frame nobody will see.
     */
    track(x, y) {
      this.pointer = { x, y };
      if (!this.box) {
        this.box = this.getBoundingClientRect();
        document.addEventListener("pointermove", this.onDocumentMove, true);
        document.addEventListener("pointerleave", this.rest);
        window.addEventListener("scroll", this.rest, { passive: true, capture: true });
      }
      if (this.frame) return;
      this.frame = window.requestAnimationFrame(() => this.apply());
    }
    /** Draw the card at the last position the pointer reported. */
    apply() {
      this.frame = 0;
      if (!this.pointer || !this.box) return;
      const angles = tiltFrom(this.box, this.pointer.x, this.pointer.y, {
        max: this.max,
        axis: this.axis,
        reverse: this.hasAttribute("reverse")
      });
      this.style.setProperty("--tilt-elemental-x", `${angles.x}`);
      this.style.setProperty("--tilt-elemental-y", `${angles.y}`);
      this.style.setProperty("--tilt-elemental-glare-x", `${angles.glareX}`);
      this.style.setProperty("--tilt-elemental-glare-y", `${angles.glareY}`);
      if (!this.hasAttribute("data-tilt-active")) this.setAttribute("data-tilt-active", "");
    }
    /**
     * Flat, and nothing queued.
     *
     * The two angles are removed rather than set to zero, so the fallbacks in the stylesheet
     * are the only place the resting angle is written down. Removing one still animates: what
     * transitions is `transform`, which is recomputed from whatever the `var()` resolves to.
     *
     * **The glare's position is deliberately left where it was.** Removing it too would send
     * the highlight sliding back to the middle of the card as it fades - a light travelling to
     * a place the pointer never was, and the one movement in this element that nobody asked
     * for. Fading out where it stood is what a highlight does. The next hover writes over it
     * before anything is visible again.
     *
     * The attribute comes off in the same task, which is what makes the way back slower than
     * the way out - the longer duration is the rule that applies once it is gone.
     */
    rest() {
      if (this.box) {
        document.removeEventListener("pointermove", this.onDocumentMove, true);
        document.removeEventListener("pointerleave", this.rest);
        window.removeEventListener("scroll", this.rest, { capture: true });
        this.box = null;
      }
      if (this.frame) window.cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.pointer = null;
      this.removeAttribute("data-tilt-active");
      this.style.removeProperty("--tilt-elemental-x");
      this.style.removeProperty("--tilt-elemental-y");
    }
  };
  define("tilt-elemental", TiltElemental);

  // src/elementals/toolbar/index.js
  function toolbarKey(key, vertical) {
    if (key === "Home" || key === "End") return key;
    if (key === (vertical ? "ArrowDown" : "ArrowRight")) return key;
    if (key === (vertical ? "ArrowUp" : "ArrowLeft")) return key;
    return null;
  }
  var CONTROLS = "button, a[href]";
  var ToolbarElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["vertical"];
    }
    /** Whether the bar runs down the page. Reflected, so `[vertical]` is a styling hook. */
    get vertical() {
      return this.hasAttribute("vertical");
    }
    set vertical(value) {
      this.toggleAttribute("vertical", !!value);
    }
    /**
     * The controls the arrows walk, in document order.
     *
     * A `disabled` button is left out because the platform will not focus one, and a cursor
     * that lands where focus cannot follow is a bar that stops moving. Keeping such a control
     * reachable is `aria-disabled` on it instead - still focusable, still announced, and this
     * list still has it.
     */
    get controls() {
      return Array.from(this.querySelectorAll(CONTROLS)).filter((control) => !control.disabled);
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.controls.length) return;
      this.initialized = true;
      this.setAttribute("role", "toolbar");
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("focusin", this.onFocusIn);
      this.observer = new MutationObserver(() => this.wire());
      this.observer.observe(this, { childList: true, subtree: true, attributeFilter: ["disabled"] });
      this.wire();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("focusin", this.onFocusIn);
      this.removeAttribute("role");
      this.removeAttribute("aria-orientation");
      for (const control of this.controls) control.removeAttribute("tabindex");
    }
    /**
     * Put the axis on the bar and the single tab stop inside it.
     *
     * The stop follows focus where there is any, so a bar entered by clicking its last button
     * is a bar the arrows carry on from there rather than one that jumps back to the start.
     */
    wire() {
      if (this.vertical) this.setAttribute("aria-orientation", "vertical");
      else this.removeAttribute("aria-orientation");
      const controls = this.controls;
      if (!controls.length) return;
      const focused = controls.find((control) => control === document.activeElement);
      const held = controls.find((control) => control.getAttribute("tabindex") === "0");
      const stop = focused || held || controls[0];
      for (const control of controls) control.tabIndex = control === stop ? 0 : -1;
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      this.wire();
    }
    onFocusIn() {
      this.wire();
    }
    onKeyDown(e) {
      const key = toolbarKey(e.key, this.vertical);
      if (!key) return;
      const controls = this.controls;
      const at = controls.indexOf(e.target);
      if (at === -1) return;
      const to = stepIndex(at, key, controls.length);
      if (to === null) return;
      e.preventDefault();
      controls[to].focus();
    }
  };
  define("toolbar-elemental", ToolbarElemental);

  // src/elementals/tooltip/index.js
  function titleRole(trigger) {
    const named = trigger.text && trigger.text.trim() || trigger.ariaLabel || trigger.ariaLabelledby;
    return named ? "description" : "name";
  }
  function nextTooltipState(state, event) {
    const next = { ...state };
    switch (event) {
      case "pointerenter":
        next.hovering = true;
        break;
      case "pointerleave":
        next.hovering = false;
        break;
      case "focus":
        next.focused = true;
        break;
      case "blur":
        next.focused = false;
        break;
      case "escape":
        next.dismissed = true;
        break;
      default:
        return state;
    }
    if (!next.hovering && !next.focused) next.dismissed = false;
    next.open = (next.hovering || next.focused) && !next.dismissed;
    return next;
  }
  function nameText(node) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1 || node.getAttribute("aria-hidden") === "true") return "";
    return [...node.childNodes].map(nameText).join("");
  }
  function arrowOffset(trigger, bubble, horizontal, rtl) {
    if (horizontal) return (trigger.top + trigger.bottom) / 2 - bubble.top;
    const middle = (trigger.left + trigger.right) / 2;
    return rtl ? bubble.left + bubble.width - middle : middle - bubble.left;
  }
  function alignOnAxis(start, end, size, limit, toStart, centred) {
    const at = centred ? (start + end) / 2 - size / 2 : toStart ? start : end - size;
    return Math.min(Math.max(at, 0), Math.max(limit - size, 0));
  }
  function withoutToken(list, token) {
    const kept = (list || "").split(/\s+/).filter((one) => one && one !== token);
    return kept.length ? kept.join(" ") : null;
  }
  var FOCUSABLE3 = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var CLOSE_DELAY = 120;
  var FALLBACK_GAP = 6;
  var sequence = 0;
  var TooltipElemental = class extends ElementBase {
    /** The control being described: what the element wraps, or what `for` names. */
    get trigger() {
      const own = this.querySelector(`:scope > ${FOCUSABLE3}`);
      if (own) return own;
      const id = this.getAttribute("for");
      return id ? document.getElementById(id) : null;
    }
    /** The words. A direct child that is not the trigger, or - when `for` named the trigger
     * from somewhere else on the page - this element itself. */
    get bubble() {
      const own = this.querySelector(`:scope > ${FOCUSABLE3}`);
      if (!own) return this;
      return [...this.children].find((child) => child !== own) || null;
    }
    connectedCallback() {
      if (this.initialized) return;
      const trigger = this.trigger;
      if (!trigger) return;
      let bubble = this.bubble;
      this.wroteBubble = false;
      if (!bubble || bubble === this) {
        if (bubble === this && this.textContent.trim()) {
        } else if (trigger.title) {
          bubble = document.createElement("span");
          bubble.textContent = trigger.title;
          this.appendChild(bubble);
          this.wroteBubble = true;
        } else {
          return;
        }
      }
      const fromTitle = trigger.title && bubble.textContent.trim() === trigger.title.trim();
      this.removedTitle = fromTitle ? trigger.getAttribute("title") : null;
      if (fromTitle) trigger.removeAttribute("title");
      this.initialized = true;
      this.triggerElement = trigger;
      this.bubbleElement = bubble;
      this.state = { hovering: false, focused: false, dismissed: false, open: false };
      bubble.setAttribute("role", "tooltip");
      if (!bubble.id) bubble.id = `tooltip-elemental-${++sequence}`;
      const names = fromTitle && titleRole({
        text: nameText(trigger),
        ariaLabel: trigger.getAttribute("aria-label"),
        ariaLabelledby: trigger.getAttribute("aria-labelledby")
      }) === "name";
      this.wroteName = names;
      if (names) {
        trigger.setAttribute("aria-label", bubble.textContent.trim());
      } else {
        const described = trigger.getAttribute("aria-describedby");
        trigger.setAttribute("aria-describedby", [described, bubble.id].filter(Boolean).join(" "));
      }
      bubble.hidden = true;
      this.onPointer = this.onPointer.bind(this);
      this.onFocus = this.onFocus.bind(this);
      this.onBlur = this.onBlur.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.reposition = this.reposition.bind(this);
      for (const el2 of [trigger, bubble]) {
        el2.addEventListener("pointerenter", this.onPointer);
        el2.addEventListener("pointerleave", this.onPointer);
      }
      trigger.addEventListener("focus", this.onFocus);
      trigger.addEventListener("blur", this.onBlur);
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      const trigger = this.triggerElement;
      const bubble = this.bubbleElement;
      for (const el2 of [trigger, bubble]) {
        el2.removeEventListener("pointerenter", this.onPointer);
        el2.removeEventListener("pointerleave", this.onPointer);
      }
      trigger.removeEventListener("focus", this.onFocus);
      trigger.removeEventListener("blur", this.onBlur);
      this.stopWatching();
      clearTimeout(this.closeTimer);
      if (this.wroteName) trigger.removeAttribute("aria-label");
      else {
        const described = withoutToken(trigger.getAttribute("aria-describedby"), bubble.id);
        if (described) trigger.setAttribute("aria-describedby", described);
        else trigger.removeAttribute("aria-describedby");
      }
      if (this.removedTitle !== null) trigger.setAttribute("title", this.removedTitle);
      bubble.hidden = false;
      bubble.removeAttribute("role");
      if (this.wroteBubble) bubble.remove();
      this.initialized = false;
    }
    onPointer(e) {
      if (e.pointerType === "touch") return;
      if (e.type === "pointerenter") this.apply("pointerenter");
      else this.close(CLOSE_DELAY);
    }
    onFocus() {
      this.apply("focus");
    }
    onBlur() {
      this.apply("blur");
    }
    onKeydown(e) {
      if (e.key !== "Escape") return;
      this.apply("escape");
    }
    /** Runs one event through the state machine and draws whatever came out of it. */
    apply(event) {
      clearTimeout(this.closeTimer);
      const was = this.state.open;
      this.state = nextTooltipState(this.state, event);
      if (this.state.open === was) return;
      if (this.state.open) this.show();
      else this.hide();
    }
    /** Leaving with a pointer waits, so the strip between the trigger and the bubble can be
     * crossed - the bubble has to be reachable to satisfy "hoverable". */
    close(delay) {
      clearTimeout(this.closeTimer);
      this.closeTimer = setTimeout(() => this.apply("pointerleave"), delay);
    }
    show() {
      this.bubbleElement.hidden = false;
      this.place();
      document.addEventListener("keydown", this.onKeydown);
      window.addEventListener("scroll", this.reposition, { capture: true, passive: true });
      window.addEventListener("resize", this.reposition);
    }
    hide() {
      this.bubbleElement.hidden = true;
      this.stopWatching();
    }
    stopWatching() {
      document.removeEventListener("keydown", this.onKeydown);
      window.removeEventListener("scroll", this.reposition, { capture: true });
      window.removeEventListener("resize", this.reposition);
    }
    reposition() {
      if (this.state.open) this.place();
    }
    /**
     * Puts the bubble beside the trigger, in viewport coordinates.
     *
     * `position: fixed` rather than an offset parent, because the two are not always in the
     * same one - and because a tooltip inside anything scrolling would otherwise be clipped
     * by it. The side and the alignment are written out as attributes as well, since a caret
     * has to point back the way the bubble came from and nothing in CSS can read a number
     * this file computed.
     *
     * The axis is the author's, the side is the viewport's: `horizontal` says beside rather
     * than over or under, and which of the two sides that turns out to be is measured. Which
     * is the whole reason there is no `placement="e"` here - a fixed side is a tooltip off
     * the edge of the screen on the one page where it did not fit.
     */
    place() {
      const trigger = this.triggerElement.getBoundingClientRect();
      const bubble = this.bubbleElement.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const rtl = window.getComputedStyle(this.triggerElement).direction === "rtl";
      const gap = parseFloat(window.getComputedStyle(this.bubbleElement).getPropertyValue("--tooltip-elemental-gap")) || FALLBACK_GAP;
      const horizontal = this.hasAttribute("horizontal");
      const panel = {
        width: bubble.width + (horizontal ? gap : 0),
        height: bubble.height + (horizontal ? 0 : gap)
      };
      const { side, align } = horizontal ? placeSubmenu(trigger, panel, viewport, rtl) : placeFlyout(trigger, panel, viewport, rtl, true);
      const after = side === "inline-end" !== rtl;
      const toStart = align === "start" !== rtl;
      const centred = align === "center";
      const top = horizontal ? alignOnAxis(trigger.top, trigger.bottom, bubble.height, viewport.height, align === "start", centred) : side === "block-end" ? trigger.bottom + gap : trigger.top - bubble.height - gap;
      const left = horizontal ? after ? trigger.right + gap : trigger.left - bubble.width - gap : alignOnAxis(trigger.left, trigger.right, bubble.width, viewport.width, toStart, centred);
      this.bubbleElement.dataset.side = side;
      this.bubbleElement.dataset.align = align;
      this.bubbleElement.style.top = `${Math.round(top)}px`;
      this.bubbleElement.style.left = `${Math.round(left)}px`;
      this.bubbleElement.style.setProperty(
        "--tooltip-elemental-arrow-offset",
        `${Math.round(arrowOffset(trigger, { left, top, width: bubble.width, height: bubble.height }, horizontal, rtl))}px`
      );
    }
  };
  define("tooltip-elemental", TooltipElemental);
})();
//# sourceMappingURL=book-of-elementals.js.map
