/* book-of-elementals v2.0.1 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
  define2("tilt-elemental", TiltElemental);
})();
//# sourceMappingURL=tilt.js.map
