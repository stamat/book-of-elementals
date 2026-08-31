/* book-of-elementals v3.3.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/helpers.mjs
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

  // node_modules/book-of-spells/src/dom.mjs
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
  function startEdge(slide, scroller, rtl) {
    return rtl ? scroller.right - slide.right : slide.left - scroller.left;
  }
  function scrollDelta(start, inset, rtl) {
    return rtl ? inset - start : start - inset;
  }
  function pressOrigin(index, destination) {
    return destination === null ? index : destination;
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
  function disable(button, disabled) {
    if (!button) return;
    const value = String(disabled);
    if (button.getAttribute("aria-disabled") !== value) button.setAttribute("aria-disabled", value);
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
      this.onClick = this.onClick.bind(this);
      this.onLayout = this.onLayout.bind(this);
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
      this.rtl = false;
      this.painted = false;
      this.settling = null;
      this.settleTimer = null;
      this.destination = null;
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
      this.clearTimer();
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
      for (const slide of this.slides) {
        slide.removeAttribute("role");
        slide.removeAttribute("aria-roledescription");
        slide.removeAttribute("data-carousel-slide");
        slide.removeAttribute("data-carousel-current");
        if (slide.getAttribute("aria-label") === this.named.get(slide)) slide.removeAttribute("aria-label");
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
      slides.forEach((slide, at) => {
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", slideRole);
        slide.setAttribute("data-carousel-slide", "");
        const label = slide.getAttribute("aria-label");
        const authored = slide.hasAttribute("aria-labelledby") || label !== null && label !== this.named.get(slide);
        if (authored) return;
        const name = slideName(at, slides.length, position);
        slide.setAttribute("aria-label", name);
        this.named.set(slide, name);
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
        this.measure(scroller);
        this.observer = new ResizeObserver(this.onLayout);
        this.observer.observe(scroller);
        for (const slide of slides) this.observer.observe(slide);
        scroller.addEventListener("scroll", this.onScroll, { passive: true });
        this.scrolls = scroller;
      }
      this.apply(Math.min(this.index, Math.max(slides.length - 1, 0)));
      if (this.rotating && !this.timer && (this.pinned || !rotationHeld(this.hovering, this.focused))) this.tick();
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
      this.slides.forEach((slide, at) => {
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
     * Called for a scroll and for a resize alike, which is not belt and braces: a scroll moves
     * the row without changing its shape, a resize changes its shape without moving it, and the
     * index is stale after either. A stale index is not a cosmetic problem: the next press is
     * measured from it, so previous appears to work once and then do nothing at all, and next
     * jumps several slides at a time.
     */
    readIndex() {
      const scroller = this.scroller;
      if (!scroller || !scroller.clientWidth) return;
      const box = scroller.getBoundingClientRect();
      const starts = this.slides.map((slide) => startEdge(slide.getBoundingClientRect(), box, this.rtl));
      this.apply(currentSlide(starts, this.inset, this.index));
    }
    /** Which way the row reads, and how far in from its box the snap edge sits. */
    measure(scroller) {
      const styles = getComputedStyle(scroller);
      this.rtl = styles.direction === "rtl";
      this.inset = startInset(styles, this.rtl);
    }
    /**
     * The observer's whole job: notice that the layout changed and re-read it.
     *
     * A resize, a container query flipping how many slides fit, a webfont landing - none of
     * them fire a scroll event, and a row measured before any of them is a row whose current
     * slide and whose dim arrows both belong to a layout that is gone. The `scroll-padding` is
     * re-read here rather than on every scroll, because a media query is the only thing that
     * changes it and this is where layout changes arrive.
     *
     * What it still does not catch: a slide that moves without resizing and without a scroll -
     * `--carousel-elemental-gap` changing at a breakpoint is the one. Nothing observes
     * position, and a rule that watches for it would be watching every carousel on every page
     * for the few that change their gap mid-life.
     */
    onLayout() {
      const scroller = this.scroller;
      if (!scroller) return;
      this.measure(scroller);
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
      this.destination = null;
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
      this.slides.forEach((slide, index) => {
        if (index === at) slide.setAttribute("data-carousel-current", "");
        else slide.removeAttribute("data-carousel-current");
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
      disable(this.prevButton, at.start);
      disable(this.nextButton, at.end);
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
      const slide = this.slides[at];
      if (!slide) return;
      if (this.fade) {
        this.apply(at);
        return;
      }
      const scroller = this.scroller;
      this.measure(scroller);
      const delta = scrollDelta(startEdge(slide.getBoundingClientRect(), scroller.getBoundingClientRect(), this.rtl), this.inset, this.rtl);
      const wanted = scroller.scrollLeft + delta;
      const reach = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
      this.settling = Math.sign(wanted) * Math.min(Math.abs(wanted), reach);
      this.destination = at;
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
      this.to(stepSlide(pressOrigin(this.index, this.destination), 1, this.slides.length));
    }
    previous() {
      if (this.hasAttribute("data-carousel-at-start")) return;
      this.to(stepSlide(pressOrigin(this.index, this.destination), -1, this.slides.length));
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
      else this.to(stepSlide(pressOrigin(this.index, this.destination), 1, this.slides.length));
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
        return;
      }
      if (name === "autoplay") {
        if (!this.autoplay) this.pause();
        this.wire();
        if (this.autoplay && this.slides.length > 1 && !reducedMotion()) this.play();
        return;
      }
      if (this.rotating && this.timer) this.tick();
    }
  };
  define2("carousel-elemental", CarouselElemental);
})();
//# sourceMappingURL=carousel.js.map
