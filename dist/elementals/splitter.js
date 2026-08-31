/* book-of-elementals v3.3.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/book-of-spells/src/helpers.mjs
  function shallowMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      target[key] = source[key];
    }
    return target;
  }
  var objProto = Object.prototype;
  var foldF64 = new Float64Array(1);
  var foldU32 = new Uint32Array(foldF64.buffer);
  function isObject(o) {
    return typeof o === "object" && !Array.isArray(o) && o !== null;
  }
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
  function percentage(num, total) {
    if (Number.isNaN(num) || Number.isNaN(total) || total === 0) return 0;
    return num / total * 100;
  }
  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }
  function sampleVelocity(samples, windowMs = 80) {
    const result = {};
    if (!samples || !samples.length) return result;
    const last = samples[samples.length - 1];
    const keys = Object.keys(last).filter((key) => key !== "t" && typeof last[key] === "number");
    for (const key of keys) result[key] = 0;
    if (samples.length < 2) return result;
    let start = samples[0];
    for (let i = samples.length - 1; i >= 0; i--) {
      start = samples[i];
      if (last.t - samples[i].t >= windowMs) break;
    }
    const dt = last.t - start.t;
    if (dt <= 0) return result;
    for (const key of keys) result[key] = (last[key] - start[key]) / dt;
    return result;
  }

  // node_modules/book-of-spells/src/dom.mjs
  var dragging = /* @__PURE__ */ new WeakSet();
  function drag(target, opts) {
    const fromEvent = !!target && typeof target === "object" && target.type === "pointerdown" && "pointerId" in target;
    const element = fromEvent ? isObject(opts) && opts.target || target.currentTarget || target.target : target;
    if (!element || !(element instanceof Element)) return;
    if (!fromEvent && element.getAttribute("drag-enabled") === "true") return;
    if (fromEvent && dragging.has(element)) return;
    const doc = element.ownerDocument;
    let x = 0;
    let y = 0;
    let clientX = 0;
    let clientY = 0;
    let prevX = 0;
    let prevY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let pointerId = null;
    let pointerType = "";
    let rect = null;
    let inertiaId = null;
    let inertiaTime = 0;
    let samples = [];
    const options = {
      within: null,
      inertia: false,
      bounce: false,
      friction: 0.9,
      bounceFactor: 0.2,
      velocityWindow: 80,
      maxVelocity: 2,
      axis: null,
      callback: null,
      preventDefaultTouch: true
    };
    if (isFunction(opts)) {
      options.callback = opts;
    } else if (isObject(opts)) {
      shallowMerge(options, opts);
    }
    options.friction = Math.abs(options.friction);
    options.bounceFactor = Math.abs(options.bounceFactor);
    const capInPercent = typeof options.maxVelocity === "string" && options.maxVelocity.trim().endsWith("%");
    const cap = Math.abs(parseFloat(options.maxVelocity));
    options.maxVelocity = Number.isNaN(cap) ? 2 : cap;
    let capX = options.maxVelocity;
    let capY = options.maxVelocity;
    const measureVelocity = function() {
      const v = sampleVelocity(samples, options.velocityWindow);
      velocityX = options.axis === "y" ? 0 : clamp(v.x || 0, -capX, capX);
      velocityY = options.axis === "x" ? 0 : clamp(v.y || 0, -capY, capY);
    };
    if (!fromEvent) {
      element.setAttribute("drag-enabled", "true");
      element.setAttribute("dragging", "false");
    }
    const ownTouchAction = element.style.touchAction || "";
    if (!fromEvent && options.preventDefaultTouch) element.style.touchAction = "none";
    const measured = options.within instanceof Element ? options.within : element;
    const calcPageRelativeRect = function() {
      const origRect = measured.getBoundingClientRect();
      const rect2 = {
        top: origRect.top + window.scrollY,
        left: origRect.left + window.scrollX,
        width: origRect.width,
        height: origRect.height
      };
      return rect2;
    };
    const handleStart = function(e) {
      if (dragging.has(element)) return;
      dragging.add(element);
      samples = [];
      pointerId = e.pointerId;
      pointerType = e.pointerType || "";
      setXY(e);
      prevX = x;
      prevY = y;
      rect = calcPageRelativeRect();
      if (capInPercent) {
        capX = rect.width * options.maxVelocity / 100;
        capY = rect.height * options.maxVelocity / 100;
      }
      if (!fromEvent) element.setAttribute("dragging", "true");
      if (element.setPointerCapture) {
        try {
          element.setPointerCapture(e.pointerId);
        } catch {
        }
      }
      doc.addEventListener("pointermove", handleMove);
      doc.addEventListener("pointerup", handleEnd);
      doc.addEventListener("pointercancel", handleCancel);
      if (inertiaId) {
        cancelAnimationFrame(inertiaId);
        inertiaId = null;
      }
      const event = new CustomEvent("dragstart", { detail: getDetail() });
      element.dispatchEvent(event);
    };
    const handleMove = function(e) {
      if (e.pointerId !== pointerId) return;
      if (e.clientX === clientX && e.clientY === clientY && e.pageX === x && e.pageY === y) return;
      setXY(e);
      measureVelocity();
      const detail = getDetail();
      if (options.callback) options.callback(detail);
      const event = new CustomEvent("drag", { detail });
      element.dispatchEvent(event);
    };
    const stop = function() {
      dragging.delete(element);
      if (!fromEvent) element.setAttribute("dragging", "false");
      doc.removeEventListener("pointermove", handleMove);
      doc.removeEventListener("pointerup", handleEnd);
      doc.removeEventListener("pointercancel", handleCancel);
      if (element.hasPointerCapture && element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
      pointerId = null;
    };
    const handleEnd = function(e) {
      if (e.pointerId !== pointerId) return;
      stop();
      const t = performance.now();
      samples.push({ t, x, y });
      measureVelocity();
      inertiaTime = t;
      if (options.inertia) inertiaId = requestAnimationFrame(inertia);
      const event = new CustomEvent("dragend", { detail: getDetail() });
      element.dispatchEvent(event);
    };
    const handleCancel = function(e) {
      if (e.pointerId !== pointerId) return;
      stop();
      velocityX = 0;
      velocityY = 0;
      samples = [];
      const event = new CustomEvent("dragcancel", { detail: getDetail() });
      element.dispatchEvent(event);
    };
    const setXY = function(e) {
      prevX = x;
      prevY = y;
      x = e.pageX;
      y = e.pageY;
      clientX = e.clientX;
      clientY = e.clientY;
      samples.push({ t: performance.now(), x, y });
      if (samples.length > 12) samples.shift();
    };
    const getDetail = function() {
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      const xPercentage = percentage(relativeX, rect.width);
      const yPercentage = percentage(relativeY, rect.height);
      const detail = {
        target: element,
        x,
        y,
        clientX,
        clientY,
        relativeX,
        relativeY,
        xPercentage,
        yPercentage,
        velocityX,
        velocityY,
        prevX,
        prevY,
        pointerType
      };
      if (xPercentage < 0) detail.xPercentage = 0;
      if (xPercentage > 100) detail.xPercentage = 100;
      if (yPercentage < 0) detail.yPercentage = 0;
      if (yPercentage > 100) detail.yPercentage = 100;
      return detail;
    };
    const inertia = function() {
      const t = performance.now();
      const dt = t - inertiaTime;
      inertiaTime = t;
      x += velocityX * dt;
      y += velocityY * dt;
      const decay = Math.pow(options.friction, dt / 16.6667);
      velocityX *= decay;
      velocityY *= decay;
      if (options.bounce) {
        if (x < rect.left) {
          x = rect.left;
          velocityX *= -options.bounceFactor;
        }
        if (x > rect.width + rect.left) {
          x = rect.width + rect.left;
          velocityX *= -options.bounceFactor;
        }
        if (y < rect.top) {
          y = rect.top;
          velocityY *= -options.bounceFactor;
        }
        if (y > rect.height + rect.top) {
          y = rect.height + rect.top;
          velocityY *= -options.bounceFactor;
        }
      }
      if (Math.abs(velocityX) < 0.01) velocityX = 0;
      if (Math.abs(velocityY) < 0.01) velocityY = 0;
      const detail = getDetail();
      if (velocityX !== 0 || velocityY !== 0) {
        inertiaId = requestAnimationFrame(inertia);
        if (options.callback) options.callback(detail);
        const event = new CustomEvent("draginertia", { detail });
        element.dispatchEvent(event);
      } else {
        inertiaId = null;
        if (options.callback) options.callback(detail);
        const event = new CustomEvent("draginertiaend", { detail });
        element.dispatchEvent(event);
      }
    };
    if (fromEvent) handleStart(target);
    else element.addEventListener("pointerdown", handleStart);
    return {
      //TODO: add manual start, move and end methods - for programmatic control
      destroy: function() {
        if (pointerId !== null) stop();
        if (!fromEvent) {
          element.removeEventListener("pointerdown", handleStart);
          element.style.touchAction = ownTouchAction;
          element.removeAttribute("drag-enabled");
          element.removeAttribute("dragging");
        }
        if (inertiaId) {
          cancelAnimationFrame(inertiaId);
          inertiaId = null;
        }
      }
    };
  }

  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/core.js
  function define2(tag, ctor) {
    if (typeof document === "undefined" || document.readyState !== "loading") {
      define(tag, ctor);
      return;
    }
    document.addEventListener("DOMContentLoaded", () => define(tag, ctor), { once: true });
  }

  // src/watch-query.js
  var probeCount = 0;
  var CONTAINER = "container:";
  var KEYWORDS = ["not", "and", "or"];
  var UNHEARD = /(^|[\s(])(style|scroll-state)\s*\(/;
  function watchQuery(element, query) {
    const condition = query ? query.trim() : "";
    if (!condition) return null;
    if (!condition.startsWith(CONTAINER)) {
      return window.matchMedia ? window.matchMedia(condition) : null;
    }
    return watchContainer(element, condition.slice(CONTAINER.length).trim());
  }
  function unwatchQuery(query, listener) {
    if (!query) return null;
    query.removeEventListener("change", listener);
    if (query.stop) query.stop();
    return null;
  }
  function watchContainer(element, condition) {
    if (!window.ResizeObserver) return null;
    if (UNHEARD.test(condition)) return null;
    const id = String(++probeCount);
    element.dataset.elementalProbe = id;
    const subject = '[data-elemental-probe="' + id + '"]';
    const style = document.createElement("style");
    style.textContent = subject + "{--elemental-probe:no}@container " + condition + "{" + subject + "{--elemental-probe:yes}}";
    document.head.append(style);
    const container = nearestContainer(element, condition);
    let listener = null;
    const observer = new window.ResizeObserver(() => {
      if (listener) listener(query);
    });
    const query = {
      get matches() {
        return window.getComputedStyle(element).getPropertyValue("--elemental-probe").trim() === "yes";
      },
      addEventListener(type, fn) {
        listener = fn;
        if (container) observer.observe(container);
      },
      removeEventListener() {
        listener = null;
        observer.disconnect();
      },
      stop() {
        listener = null;
        observer.disconnect();
        style.remove();
        delete element.dataset.elementalProbe;
      }
    };
    return query;
  }
  function containerName(condition) {
    const match = /^([^\s(]+)\s/.exec(condition);
    if (!match) return "";
    return KEYWORDS.indexOf(match[1]) === -1 ? match[1] : "";
  }
  function nearestContainer(element, condition) {
    const name = containerName(condition);
    let node = element.parentElement;
    while (node) {
      const style = window.getComputedStyle(node);
      const type = style.containerType;
      if (type && type !== "normal" && (!name || (style.containerName || "").split(" ").indexOf(name) !== -1)) return node;
      node = node.parentElement;
    }
    return null;
  }

  // src/elementals/splitter/index.js
  var DEFAULT_POSITION = 50;
  var STEP = 1;
  var paneCount = 0;
  function clamp2(value, low, high) {
    if (!(value > low)) return low;
    return value > high ? high : value;
  }
  function round3(value) {
    return Math.round((value + Number.EPSILON) * 1e3) / 1e3;
  }
  function splitterKey(key, vertical, rtl) {
    if (key === "Enter") return "collapse";
    if (key === "Home") return "min";
    if (key === "End") return "max";
    if (vertical) {
      if (key === "ArrowUp") return "shrink";
      if (key === "ArrowDown") return "grow";
      return null;
    }
    if (key === "ArrowLeft") return rtl ? "grow" : "shrink";
    if (key === "ArrowRight") return rtl ? "shrink" : "grow";
    return null;
  }
  function positionFrom(rect, x, y, options = {}) {
    const { vertical, rtl } = options;
    const size = Number.isFinite(options.size) && options.size > 0 ? options.size : 0;
    const track = (vertical ? rect.height : rect.width) - size;
    if (!(track > 0)) return 0;
    const along = (vertical ? y - rect.top : x - rect.left) - size / 2;
    const ratio = clamp2(along / track, 0, 1);
    return (!vertical && rtl ? 1 - ratio : ratio) * 100;
  }
  var SplitterElemental = class extends ElementBase {
    constructor() {
      super(...arguments);
      /** The handle, `null` until there are two panes to put one between. */
      __publicField(this, "handle", null);
      /** Where the primary pane was before <kbd>Enter</kbd> collapsed it, so the second press has
       * somewhere to go. The middle until something else has been seen, rather than `min` - a
       * restore that put the pane back where it already was would read as a key that did nothing. */
      __publicField(this, "restorePosition", DEFAULT_POSITION);
      /** The gesture in progress, `null` when there is none - what book-of-spells' `drag()` hands
       * back, and what ends it. Held so a second finger arriving mid-drag is ignored rather than
       * fighting the first. */
      __publicField(this, "gesture", null);
      /** The `vertical-when` query being watched, `null` when there is none. */
      __publicField(this, "query", null);
      /** Whether the `vertical` attribute on this element is one this element wrote. It is what
       * keeps a page that stacked its own panes stacked: once the breakpoint has flipped the
       * attribute on, the attribute alone can no longer say who meant it. */
      __publicField(this, "autoVertical", false);
      /** The writing direction as it was when the drag started. Read once per gesture: `direction`
       * is inherited, and re-reading it per frame is a style resolution inside a pointer handler. */
      __publicField(this, "dragRtl", false);
      /** Whether the drag in progress has moved the separator at all. A press that let go where it
       * landed changed nothing, and an event saying it did is one a listener would save to storage. */
      __publicField(this, "dragMoved", false);
    }
    static get observedAttributes() {
      return ["position", "min", "max", "vertical", "vertical-when", "label-text"];
    }
    /** The panes: every element child that is not the handle. The handle is written between
     * them, so it has to come out of the count that decides where it goes. */
    get panes() {
      return Array.from(this.children).filter((child) => child !== this.handle);
    }
    /** Where the separator sits, clamped into `min`-`max`. The attribute is the state, so a
     * drag, a key and a page setting `position="30"` all arrive the same way. */
    get position() {
      const raw = this.getAttribute("position");
      const value = raw === null || raw.trim() === "" ? DEFAULT_POSITION : Number(raw);
      return clamp2(value, this.min, this.max);
    }
    set position(value) {
      this.setAttribute("position", value);
    }
    /** How far the primary pane may shrink. */
    get min() {
      return clamp2(Number(this.getAttribute("min")), 0, 100);
    }
    set min(value) {
      this.setAttribute("min", value);
    }
    /** How far it may grow. Floored at `min`, so a pair given the wrong way round is a splitter
     * that will not move rather than one whose clamp inverts. */
    get max() {
      const raw = this.getAttribute("max");
      const value = raw === null || raw.trim() === "" ? 100 : Number(raw);
      return clamp2(value, this.min, 100);
    }
    set max(value) {
      this.setAttribute("max", value);
    }
    /** Whether the panes are stacked down the page. Reflected, so `[vertical]` is a styling
     * hook and the stylesheet needs nothing written for it. */
    get vertical() {
      return this.hasAttribute("vertical");
    }
    set vertical(value) {
      this.toggleAttribute("vertical", !!value);
    }
    /** The media query that stacks the panes, as it was written. `null` where there is none. */
    get verticalWhen() {
      return this.getAttribute("vertical-when");
    }
    set verticalWhen(value) {
      if (value === null) this.removeAttribute("vertical-when");
      else this.setAttribute("vertical-when", value);
    }
    /** The handle's accessible name. */
    get labelText() {
      return this.getAttribute("label-text") || "Resize";
    }
    set labelText(value) {
      this.setAttribute("label-text", value);
    }
    connectedCallback() {
      if (this.initialized) return;
      if (this.panes.length < 2) return;
      this.initialized = true;
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onDragEnd = this.onDragEnd.bind(this);
      this.onMediaChange = this.onMediaChange.bind(this);
      this.build();
      this.render();
      this.watchMedia();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      this.endDrag();
      this.unwatchMedia();
      this.removeAttribute("data-splitter-panes");
      if (this.handle) {
        this.handle.removeEventListener("keydown", this.onKeyDown);
        this.handle.removeEventListener("pointerdown", this.onPointerDown);
        this.handle.remove();
        this.handle = null;
      }
      this.style.removeProperty("--splitter-elemental-position");
    }
    attributeChangedCallback(name, previous, value) {
      if (!this.initialized || previous === value) return;
      if (name === "label-text") this.handle.setAttribute("aria-label", this.labelText);
      else if (name === "vertical-when") this.watchMedia();
      else this.render();
    }
    /**
     * Watch what `vertical-when` names, and stack the panes now if it already matches.
     *
     * The query is watched rather than this element measured: a `ResizeObserver` here would
     * answer a different question - this element's own box, which a stacking splitter changes,
     * and which is not the thing the author wrote a query about. `container:` is not that
     * loop either; it measures an ancestor container, whose size a container query has already
     * made independent of what is inside it.
     *
     * A query the browser cannot parse is one that never matches, which is a splitter left
     * exactly as it was written.
     *
     * Safe to call again; a `vertical-when` that changed is the old query dropped and a new one
     * taken out.
     */
    watchMedia() {
      this.unwatchMedia();
      this.query = watchQuery(this, this.getAttribute("vertical-when"));
      if (!this.query) return;
      this.query.addEventListener("change", this.onMediaChange);
      this.onMediaChange(this.query);
    }
    /** Stop watching, and put back the markup as it was written: a `vertical` this element added
     * is this element's to take away, and one left behind on an element nothing is driving is a
     * layout with no breakpoint under it. */
    unwatchMedia() {
      this.query = unwatchQuery(this.query, this.onMediaChange);
      if (!this.autoVertical) return;
      this.autoVertical = false;
      this.removeAttribute("vertical");
    }
    /**
     * The query has changed, or is being read for the first time.
     *
     * `MediaQueryList` and the change event both carry `matches`, so the initial reading is this
     * same method called with the list itself rather than a second path that can drift from it.
     *
     * @param {MediaQueryList|MediaQueryListEvent} event
     */
    onMediaChange(event) {
      if (this.hasAttribute("vertical") && !this.autoVertical) return;
      this.autoVertical = event.matches;
      this.toggleAttribute("vertical", event.matches);
    }
    /**
     * Write the handle between the panes and wire it up.
     *
     * A `<div>` and not a `<button>`, because `role="separator"` would replace the button role
     * and leave a control announcing itself as one thing while behaving as another - and the
     * only thing the button element brings that is wanted here, the tab stop, is one attribute.
     *
     * The pattern needs the primary pane to be identifiable, so it is given an id if it has
     * none. Everything written here comes off again in `disconnectedCallback`, except that id:
     * something else may be pointing at it by then.
     */
    build() {
      const [primary] = this.panes;
      if (!primary.id) primary.id = "splitter-elemental-pane-" + ++paneCount;
      this.handle = document.createElement("div");
      this.handle.setAttribute("data-splitter-handle", "");
      this.handle.setAttribute("role", "separator");
      this.handle.setAttribute("tabindex", "0");
      this.handle.setAttribute("aria-controls", primary.id);
      this.handle.setAttribute("aria-label", this.labelText);
      this.handle.addEventListener("keydown", this.onKeyDown);
      this.handle.addEventListener("pointerdown", this.onPointerDown);
      primary.after(this.handle);
      this.setAttribute("data-splitter-panes", "");
    }
    /**
     * Put the position where the stylesheet and a screen reader can both read it.
     *
     * The custom property is unitless and the stylesheet spends it, which is what keeps the one
     * subtraction that matters - the track is the box minus the handle - in the one place that
     * can do it in the browser's units rather than in measured pixels.
     *
     * `aria-valuenow` is rounded and `aria-valuetext` says the per cent out loud, because a
     * separator announcing "37.482" is a number with no unit attached to it and a pane size is
     * never anything but a proportion.
     *
     * `aria-orientation` is written only for side-by-side panes: `horizontal` is the separator
     * role's own default, and writing a default is a second place for it to be wrong.
     */
    render() {
      const position = this.position;
      this.style.setProperty("--splitter-elemental-position", `${round3(position)}`);
      if (this.vertical) this.handle.removeAttribute("aria-orientation");
      else this.handle.setAttribute("aria-orientation", "vertical");
      this.handle.setAttribute("aria-valuemin", `${this.min}`);
      this.handle.setAttribute("aria-valuemax", `${this.max}`);
      this.handle.setAttribute("aria-valuenow", `${Math.round(position)}`);
      this.handle.setAttribute("aria-valuetext", `${Math.round(position)}%`);
    }
    /** Move the separator, and say so once the gesture that moved it is over. */
    moveTo(position, commit) {
      const next = clamp2(position, this.min, this.max);
      if (next === this.position) return;
      this.position = round3(next);
      if (commit) this.dispatchEvent(new CustomEvent("splitter-change", {
        bubbles: true,
        detail: { position: this.position }
      }));
    }
    onKeyDown(event) {
      const intent = splitterKey(event.key, this.vertical, this.rtl());
      if (intent === null) return;
      event.preventDefault();
      if (intent === "collapse") {
        const collapsed = this.position <= this.min;
        if (!collapsed) this.restorePosition = this.position;
        this.moveTo(collapsed ? this.restorePosition : this.min, true);
        return;
      }
      const step = intent === "shrink" ? -STEP : intent === "grow" ? STEP : 0;
      if (intent === "min") this.moveTo(this.min, true);
      else if (intent === "max") this.moveTo(this.max, true);
      else this.moveTo(this.position + step, true);
    }
    /** Whether the layout runs right to left. Read per gesture rather than held: `direction` is
     * inherited, so an ancestor flipping it is a change no attribute on this element reports. */
    rtl() {
      return getComputedStyle(this).direction === "rtl";
    }
    /**
     * Take hold of the handle.
     *
     * The gesture is `drag()` from book-of-spells, started from the `pointerdown` this element
     * already listens for rather than handed the handle to own: started that way it writes no
     * attributes and no inline `touch-action` into a handle this element wrote and index.scss
     * already styles, and the `preventDefault` and the focus below stay this element's to do.
     * What it owns is the pointer - the capture, which a handle this narrow needs the moment the
     * pointer outruns it, and the `pointercancel` path.
     */
    onPointerDown(event) {
      if (this.gesture) return;
      this.dragRtl = this.rtl();
      this.dragMoved = false;
      event.preventDefault();
      this.handle.focus();
      this.handle.addEventListener("dragend", this.onDragEnd);
      this.handle.addEventListener("dragcancel", this.onDragEnd);
      this.gesture = drag(event, { target: this.handle, callback: (point) => this.follow(point) });
    }
    follow(point) {
      this.dragMoved = true;
      this.moveTo(this.positionFromPoint(point), false);
    }
    /**
     * The end of the gesture, either way it ended.
     *
     * A `dragcancel` reports the same as a release, which is the opposite of what a list being
     * rearranged does with one: there is nothing to put back. Every move of this drag has already
     * been applied to the panes, so the separator really is where the cancelled gesture left it,
     * and a page that stored the last position it was told would otherwise hold a number the
     * layout disagrees with.
     */
    onDragEnd() {
      const moved = this.dragMoved;
      this.endDrag();
      if (!moved) return;
      this.dispatchEvent(new CustomEvent("splitter-change", {
        bubbles: true,
        detail: { position: this.position }
      }));
    }
    /** Let go of the pointer and stop listening for it. Safe to call twice, which is what a
     * disconnection in the middle of a gesture needs it to be. */
    endDrag() {
      if (!this.gesture) return;
      if (this.handle) {
        this.handle.removeEventListener("dragend", this.onDragEnd);
        this.handle.removeEventListener("dragcancel", this.onDragEnd);
      }
      this.gesture.destroy();
      this.gesture = null;
    }
    /** Where the pointer puts the separator. The handle's own extent comes out of the sum, and
     * it is measured rather than assumed: `--splitter-elemental-size` is the page's to set. */
    positionFromPoint(point) {
      const box = this.handle.getBoundingClientRect();
      return positionFrom(this.getBoundingClientRect(), point.clientX, point.clientY, {
        vertical: this.vertical,
        rtl: this.dragRtl,
        size: this.vertical ? box.height : box.width
      });
    }
  };
  define2("splitter-elemental", SplitterElemental);
})();
//# sourceMappingURL=splitter.js.map
