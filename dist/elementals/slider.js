/* book-of-elementals v3.2.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
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
  function trackAxis(writingMode, rect, box, x, y) {
    const vertical = /^(vertical|sideways)/.test(String(writingMode || ""));
    if (vertical) return { vertical, coord: y, start: rect.top, size: rect.height, thumb: box.width };
    return { vertical, coord: x, start: rect.left, size: rect.width, thumb: box.height };
  }
  function alongTrack(coord, start, size, thumb, rtl) {
    const travel = size - thumb;
    if (!(travel > 0)) return 0;
    const along = (coord - start - thumb / 2) / travel;
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
  function thumbUnder(coord, start, size, thumb, ratios, rtl) {
    const travel = Math.max(size - thumb, 0);
    for (let i = 0; i < ratios.length; i++) {
      const at = rtl ? 1 - ratios[i] : ratios[i];
      if (Math.abs(coord - (start + thumb / 2 + at * travel)) <= thumb / 2) return i;
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
    /**
     * The two things about this element's own layout that the arithmetic needs: which way the
     * track runs, and which end of it is the start.
     *
     * One read, because everything that measures wants both, and a computed style is the one
     * thing here that can make the browser recalculate one. Computed style rather than
     * `:dir()`, which throws on the browsers that do not know it instead of quietly not
     * matching. Read from this element and not from an input: the track and the fill are drawn
     * on this box in logical properties, so this is the writing mode they resolve against, and
     * an input turned on its side by itself would be a thumb running one way over a track
     * running the other.
     */
    get layout() {
      if (typeof getComputedStyle !== "function") return { rtl: false, writingMode: "" };
      const style = getComputedStyle(this);
      return { rtl: style.direction === "rtl", writingMode: style.writingMode };
    }
    /** Whether the control runs right to left. */
    get rtl() {
      return this.layout.rtl;
    }
    /** The writing mode the control is laid out in, which is what says whether the track runs
     * across the page or down it. */
    get writingMode() {
      return this.layout.writingMode;
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
      this.tooltipY = null;
      this.tooltipElement = null;
      if (!("format" in this)) this.format = null;
      this.dragging = -1;
      this.pressed = false;
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
      if (this.dragging >= 0) this.showDraggedValue();
      else if (this.tooltipX !== null) this.showTooltipAt(this.tooltipX, this.tooltipY);
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
      if (this.tooltipElement && this.tooltipX !== null) this.showTooltipAt(this.tooltipX, this.tooltipY);
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
      this.tooltipY = null;
      this.dragging = -1;
      this.pressed = false;
    }
    onPointerMove(e) {
      if (e.pointerType === "touch" && !this.pressed) return;
      this.tooltipX = e.clientX;
      this.tooltipY = e.clientY;
      if (this.dragging >= 0) return;
      this.showTooltipAt(e.clientX, e.clientY);
    }
    /**
     * Redraw the bubble for the thumb being dragged, from the value alone.
     *
     * Nothing here measures, and that is the point: a pinned bubble sits at `ratio` of the
     * scale and reads out the input's own text, both of which are on the input already. The
     * two attributes saying which way it is nudged are not rewritten either - they were read
     * live when the press drew the bubble, and neither the writing mode nor the direction
     * changes while a thumb is held.
     *
     * Only for a bubble that is already showing: `tooltip="track"` alone hides it on a thumb,
     * and a drag is not the moment to overrule that.
     */
    showDraggedValue() {
      const bubble = this.tooltipElement;
      if (!bubble || bubble.hidden) return;
      const inputs = this.inputs;
      const input = inputs[this.dragging];
      if (!input) return;
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      bubble.textContent = this.formatValue(Number(input.value), input.value);
      bubble.style.setProperty("--slider-elemental-at", ratio(bound(input.value, min), min, max));
    }
    /** A press pins the bubble to whatever it is about to drag, for as long as it is held. */
    onTooltipDown(e) {
      this.pressed = true;
      const m = this.metrics(e.clientX, e.clientY);
      this.dragging = m ? draggedThumb(m.under, m.inputs.length) : -1;
      this.tooltipX = e.clientX;
      this.tooltipY = e.clientY;
      this.showTooltipAt(e.clientX, e.clientY, m);
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
     *
     * A finger is not asked where it is: it is nowhere the moment it lifts, however far inside
     * the control it let go, so the release is the end of the bubble and not a question.
     */
    onTooltipUp(e) {
      this.dragging = -1;
      this.pressed = false;
      if (e.pointerType === "touch") {
        this.onPointerLeave();
        return;
      }
      const rect = this.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (inside) this.showTooltipAt(e.clientX, e.clientY);
      else this.onPointerLeave();
    }
    onPointerLeave() {
      if (this.dragging >= 0) return;
      this.tooltipX = null;
      this.tooltipY = null;
      if (this.tooltipElement) this.tooltipElement.hidden = true;
    }
    /**
     * Everything a bubble is drawn from, measured in one go: the axis the track is on, the
     * scale, where each thumb sits on it, and which one a pointer at `x`, `y` is over. `null`
     * where there is nothing to measure.
     */
    metrics(x, y) {
      const inputs = this.inputs;
      if (!inputs.length) return null;
      const rect = this.getBoundingClientRect();
      const { rtl, writingMode } = this.layout;
      const axis = trackAxis(writingMode, rect, inputs[0].getBoundingClientRect(), x, y);
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      const ratios = inputs.map((input) => ratio(bound(input.value, min), min, max));
      return { inputs, rect, axis, rtl, min, max, ratios, under: thumbUnder(axis.coord, axis.start, axis.size, axis.thumb, ratios, rtl) };
    }
    /**
     * Draw the bubble for a pointer at `x`, `y`, in viewport coordinates, or hide it where the
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
    showTooltipAt(x, y, measured) {
      const bubble = this.tooltipElement;
      if (!bubble) return;
      const m = measured || this.metrics(x, y);
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
        at = alongTrack(m.axis.coord, m.axis.start, m.axis.size, m.axis.thumb, m.rtl);
        value = snapToStep(m.min + at * (m.max - m.min), m.min, m.max, stepOf(m.inputs[0]));
        text = String(value);
      }
      bubble.dataset.tooltip = on;
      bubble.toggleAttribute("data-vertical", m.axis.vertical);
      bubble.toggleAttribute("data-reversed", m.rtl);
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
      const { rtl, writingMode } = this.layout;
      const axis = trackAxis(writingMode, rect, inputs[0].getBoundingClientRect(), e.clientX, e.clientY);
      if (axis.size <= axis.thumb) return;
      const min = bound(inputs[0].min, 0);
      const max = bound(inputs[0].max, 100);
      const value = min + alongTrack(axis.coord, axis.start, axis.size, axis.thumb, rtl) * (max - min);
      const input = inputs[nearerThumb(value, bound(inputs[0].value, min), bound(inputs[1].value, max)) === "start" ? 0 : 1];
      input.value = value;
      e.preventDefault();
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
  define2("slider-elemental", SliderElemental);
})();
//# sourceMappingURL=slider.js.map
