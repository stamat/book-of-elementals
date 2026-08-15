/* book-of-elementals v0.7.3 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/slider/index.js
  function ratio(value, min, max) {
    if (!(max > min) || !Number.isFinite(value)) return 0;
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
  }
  function clampPair(start, end, gap, moved, min, max) {
    if (end - start >= gap) return [start, end];
    if (moved === "start") {
      const pushed2 = end - gap;
      if (pushed2 >= min) return [pushed2, end];
      return [min, Math.min(min + gap, max)];
    }
    const pushed = start + gap;
    if (pushed <= max) return [start, pushed];
    return [Math.max(max - gap, min), max];
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
  function bound(value, fallback) {
    const number = parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  }
  var SliderElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["gap"];
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
     */
    get outputs() {
      return Array.from(this.querySelectorAll("output")).filter((output) => output.closest("slider-elemental") === this);
    }
    /** Least distance between the two thumbs, in the scale's own units. */
    get gap() {
      return bound(this.getAttribute("gap"), 0);
    }
    set gap(value) {
      this.setAttribute("gap", value);
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
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("input", this.onInput, true);
      this.removeEventListener("pointerdown", this.onPointerDown);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.removeEventListener("pageshow", this.apply);
      this.form = null;
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
      const clamped = clampPair(start, end, this.gap, moved, min, max);
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
      const travel = rect.width - thumb;
      if (travel <= 0) return;
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      let along = (e.clientX - rect.left - thumb / 2) / travel;
      if (typeof getComputedStyle === "function" && getComputedStyle(this).direction === "rtl") along = 1 - along;
      const value = min + Math.min(Math.max(along, 0), 1) * (max - min);
      const input = inputs[nearerThumb(value, bound(inputs[0].value, min), bound(inputs[1].value, max)) === "start" ? 0 : 1];
      input.value = value;
      e.preventDefault();
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
  define("slider-elemental", SliderElemental);
})();
//# sourceMappingURL=slider.js.map
