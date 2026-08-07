/* book-of-elementals v0.5.1 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
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
  function swipeStep(dx, dy, rtl) {
    if (Math.abs(dx) < SWIPE || Math.abs(dy) >= Math.abs(dx)) return 0;
    return (rtl ? dx > 0 : dx < 0) ? 1 : -1;
  }
  function scrollEdges(offset, visible, total) {
    const at = Math.abs(offset);
    return { start: at <= 1, end: at + visible >= total - 1 };
  }
  function startInset(styles, rtl) {
    const inset = parseFloat(rtl ? styles.scrollPaddingRight : styles.scrollPaddingLeft);
    return Number.isFinite(inset) ? inset : 0;
  }
  function slideName(index, count) {
    return index + 1 + " of " + count;
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
  var CHEVRON = {
    prev: "M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z",
    next: "M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"
  };
  function chevron(d) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
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
      if (!this.scroller || this.slides.length < 2) return;
      this.onClick = this.onClick.bind(this);
      this.onIntersect = this.onIntersect.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onSwipeStart = this.onSwipeStart.bind(this);
      this.onSwipeEnd = this.onSwipeEnd.bind(this);
      this.onSwipeCancel = this.onSwipeCancel.bind(this);
      this.onSwipeClick = this.onSwipeClick.bind(this);
      this.suspend = this.suspend.bind(this);
      this.resume = this.resume.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.index = 0;
      this.inset = 0;
      this.painted = false;
      this.settling = null;
      this.settleTimer = null;
      this.swipe = null;
      this.swiped = false;
      this.named = /* @__PURE__ */ new WeakMap();
      this.addEventListener("click", this.onClick);
      this.addEventListener("mouseenter", this.suspend);
      this.addEventListener("mouseleave", this.resume);
      this.addEventListener("focusin", this.suspend);
      this.addEventListener("focusout", this.onFocusOut);
      this.initialized = true;
      this.wire();
      if (this.autoplay && !reducedMotion()) this.play();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.clearTimer();
      this.rotating = false;
      this.pinned = false;
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("mouseenter", this.suspend);
      this.removeEventListener("mouseleave", this.resume);
      this.removeEventListener("focusin", this.suspend);
      this.removeEventListener("focusout", this.onFocusOut);
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      if (this.scrolls) this.scrolls.removeEventListener("scroll", this.onScroll);
      this.scrolls = null;
      this.unswipe();
      this.arrived();
      this.removeControls();
      this.painted = false;
      this.removeAttribute("data-carousel-at-start");
      this.removeAttribute("data-carousel-at-end");
      this.removeAttribute("aria-roledescription");
      const scroller = this.scroller;
      if (scroller) {
        scroller.removeAttribute("data-carousel-slides");
        scroller.removeAttribute("role");
        scroller.removeAttribute("tabindex");
      }
      if (scroller) scroller.removeAttribute("aria-live");
      for (const slide of this.slides) {
        slide.removeAttribute("role");
        slide.removeAttribute("aria-roledescription");
        slide.removeAttribute("data-carousel-slide");
        slide.removeAttribute("data-carousel-current");
        if (slide.getAttribute("aria-label") === this.named.get(slide)) slide.removeAttribute("aria-label");
      }
      this.initialized = false;
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
      this.setAttribute("aria-roledescription", "carousel");
      if (!this.hasAttribute("role")) {
        const named = this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby");
        this.setAttribute("role", named ? "region" : "group");
      }
      if (!scroller.id) scroller.id = "carousel-elemental-slides-" + ++carouselCount;
      scroller.setAttribute("data-carousel-slides", "");
      scroller.setAttribute("role", "group");
      if (this.fade || scroller.querySelector(FOCUSABLE)) scroller.removeAttribute("tabindex");
      else scroller.tabIndex = 0;
      slides.forEach((slide, at) => {
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("data-carousel-slide", "");
        const label = slide.getAttribute("aria-label");
        const authored = slide.hasAttribute("aria-labelledby") || label !== null && label !== this.named.get(slide);
        if (authored) return;
        const name = slideName(at, slides.length);
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
      this.arrived();
      if (this.fade) {
        scroller.addEventListener("pointerdown", this.onSwipeStart);
        scroller.addEventListener("pointerup", this.onSwipeEnd);
        scroller.addEventListener("pointercancel", this.onSwipeCancel);
        scroller.addEventListener("click", this.onSwipeClick, true);
        this.swipes = scroller;
      } else {
        this.observer = new IntersectionObserver(this.onIntersect, {
          root: scroller,
          threshold: [0, 0.25, 0.5, 0.75, 1]
        });
        for (const slide of slides) this.observer.observe(slide);
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
      this.prevButton.append(chevron(CHEVRON.prev));
      this.picker = document.createElement("div");
      this.picker.setAttribute("data-carousel-markers", "");
      this.picker.setAttribute("role", "group");
      this.picker.setAttribute("aria-label", this.getAttribute("picker-text") || "Choose slide to display");
      const word = this.getAttribute("slide-text") || "Slide";
      this.slides.forEach((slide, at) => {
        const marker = this.control("data-carousel-marker", word + " " + (at + 1), id);
        marker.textContent = String(at + 1);
        this.picker.append(marker);
      });
      this.nextButton = this.control("data-carousel-next", this.getAttribute("next-text") || "Next slide", id);
      this.nextButton.append(chevron(CHEVRON.next));
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
      this.rotateButton.textContent = this.rotating ? "\u23F8" : "\u25B6";
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
      const starts = this.slides.map((slide) => slide.getBoundingClientRect().left - edge);
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
      this.painted = true;
      this.markers.forEach((marker, index) => {
        if (index === at) marker.setAttribute("aria-disabled", "true");
        else marker.removeAttribute("aria-disabled");
      });
      this.slides.forEach((slide, index) => {
        if (index === at) slide.setAttribute("data-carousel-current", "");
        else slide.removeAttribute("data-carousel-current");
      });
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
      const styles = getComputedStyle(scroller);
      this.inset = startInset(styles, styles.direction === "rtl");
      const delta = slide.getBoundingClientRect().left - scroller.getBoundingClientRect().left - this.inset;
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
    tick() {
      this.clearTimer();
      this.timer = setInterval(() => this.advance(), this.interval);
    }
    clearTimer() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
    /**
     * A finger lands on a stacked slide. Remember where, and which finger.
     *
     * The mouse is not one of them, and that is the refusal rather than an oversight: a desktop
     * pointer has the buttons, the picker and the keyboard, and reading a drag from it costs
     * the page its text selection, its image dragging and its link clicks - see the docs page.
     * A second finger while one is already down is a pinch, and the first one's numbers are now
     * noise, so the gesture is abandoned rather than answered wrongly.
     */
    onSwipeStart(e) {
      this.swiped = false;
      if (this.swipe || e.pointerType === "mouse") {
        this.swipe = null;
        return;
      }
      this.swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
    /** And comes up: the two points are the whole gesture, which is why there is no `pointermove`
     * listener here to run on every frame of every scroll down the page. */
    onSwipeEnd(e) {
      const from = this.swipe;
      this.swipe = null;
      const scroller = this.scroller;
      if (!from || !scroller || e.pointerId !== from.id) return;
      const step = swipeStep(
        e.clientX - from.x,
        e.clientY - from.y,
        getComputedStyle(scroller).direction === "rtl"
      );
      if (!step) return;
      this.swiped = true;
      if (step > 0) this.next();
      else this.previous();
    }
    /** The browser took the gesture - a scroll started under it, or the finger left the screen's
     * edge. Whatever it became, it is not this element's to finish. */
    onSwipeCancel() {
      this.swipe = null;
    }
    /**
     * Swallow the click a committed swipe leaves behind.
     *
     * A touch that ends on a link fires one, and forty pixels of travel is past the slop most
     * browsers stop synthesising it at - but *most* is not all, and the one that still fires
     * navigates away from a page the reader was only swiping through. `detail` is what keeps
     * this off the keyboard: Enter on a link reports zero pointer clicks, and the flag it would
     * otherwise find is the stale one from a swipe minutes ago.
     */
    onSwipeClick(e) {
      if (!this.swiped) return;
      this.swiped = false;
      if (!e.detail) return;
      e.preventDefault();
      e.stopPropagation();
    }
    /** Every swipe listener comes back off, and the half-finished gesture with it. */
    unswipe() {
      if (this.swipes) {
        this.swipes.removeEventListener("pointerdown", this.onSwipeStart);
        this.swipes.removeEventListener("pointerup", this.onSwipeEnd);
        this.swipes.removeEventListener("pointercancel", this.onSwipeCancel);
        this.swipes.removeEventListener("click", this.onSwipeClick, true);
      }
      this.swipes = null;
      this.swipe = null;
      this.swiped = false;
    }
    /** Rotation held while the pointer or the focus is in the carousel - still rotating as far
     * as the button's name is concerned, because it will be again on the way out. */
    suspend() {
      if (this.rotating && !this.pinned) this.clearTimer();
    }
    resume() {
      if (this.rotating && !this.pinned && !this.timer) this.tick();
    }
    /** Focus moving between two controls is focus that never left. */
    onFocusOut(e) {
      if (!this.contains(e.relatedTarget)) this.resume();
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
})();
//# sourceMappingURL=carousel.js.map
