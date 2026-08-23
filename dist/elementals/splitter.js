/* book-of-elementals v1.0.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
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

  // src/elementals/splitter/index.js
  var DEFAULT_POSITION = 50;
  var STEP = 1;
  var paneCount = 0;
  function clamp(value, low, high) {
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
    const ratio = clamp(along / track, 0, 1);
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
      /** The pointer id of the drag in progress, `null` when there is none. Held so a second
       * finger arriving mid-drag is ignored rather than fighting the first. */
      __publicField(this, "pointerId", null);
      /** The writing direction as it was when the drag started. Read once per gesture: `direction`
       * is inherited, and re-reading it per frame is a style resolution inside a pointer handler. */
      __publicField(this, "dragRtl", false);
      /** Whether the drag in progress has moved the separator at all. A press that let go where it
       * landed changed nothing, and an event saying it did is one a listener would save to storage. */
      __publicField(this, "dragMoved", false);
    }
    static get observedAttributes() {
      return ["position", "min", "max", "vertical", "label-text"];
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
      return clamp(value, this.min, this.max);
    }
    set position(value) {
      this.setAttribute("position", value);
    }
    /** How far the primary pane may shrink. */
    get min() {
      return clamp(Number(this.getAttribute("min")), 0, 100);
    }
    set min(value) {
      this.setAttribute("min", value);
    }
    /** How far it may grow. Floored at `min`, so a pair given the wrong way round is a splitter
     * that will not move rather than one whose clamp inverts. */
    get max() {
      const raw = this.getAttribute("max");
      const value = raw === null || raw.trim() === "" ? 100 : Number(raw);
      return clamp(value, this.min, 100);
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
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
      this.build();
      this.render();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      this.endDrag();
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
      else this.render();
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
      const next = clamp(position, this.min, this.max);
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
    onPointerDown(event) {
      if (this.pointerId !== null) return;
      this.pointerId = event.pointerId;
      this.dragRtl = this.rtl();
      this.dragMoved = false;
      if (this.handle.setPointerCapture) this.handle.setPointerCapture(event.pointerId);
      this.handle.addEventListener("pointermove", this.onPointerMove);
      this.handle.addEventListener("pointerup", this.onPointerUp);
      this.handle.addEventListener("pointercancel", this.onPointerUp);
      event.preventDefault();
      this.handle.focus();
    }
    onPointerMove(event) {
      if (event.pointerId !== this.pointerId) return;
      this.dragMoved = true;
      this.moveTo(this.positionFromEvent(event), false);
    }
    onPointerUp(event) {
      if (event.pointerId !== this.pointerId) return;
      const moved = this.dragMoved;
      this.endDrag();
      if (!moved) return;
      this.dispatchEvent(new CustomEvent("splitter-change", {
        bubbles: true,
        detail: { position: this.position }
      }));
    }
    /** Let go of the pointer and stop listening for it. Safe to call twice, which is what a
     * `pointercancel` arriving after a `pointerup` needs it to be. */
    endDrag() {
      if (this.pointerId === null) return;
      if (this.handle) {
        if (this.handle.releasePointerCapture && this.handle.hasPointerCapture(this.pointerId)) {
          this.handle.releasePointerCapture(this.pointerId);
        }
        this.handle.removeEventListener("pointermove", this.onPointerMove);
        this.handle.removeEventListener("pointerup", this.onPointerUp);
        this.handle.removeEventListener("pointercancel", this.onPointerUp);
      }
      this.pointerId = null;
    }
    /** Where the pointer puts the separator. The handle's own extent comes out of the sum, and
     * it is measured rather than assumed: `--splitter-elemental-size` is the page's to set. */
    positionFromEvent(event) {
      const box = this.handle.getBoundingClientRect();
      return positionFrom(this.getBoundingClientRect(), event.clientX, event.clientY, {
        vertical: this.vertical,
        rtl: this.dragRtl,
        size: this.vertical ? box.height : box.width
      });
    }
  };
  define2("splitter-elemental", SplitterElemental);
})();
//# sourceMappingURL=splitter.js.map
