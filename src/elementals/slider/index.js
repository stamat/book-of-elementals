import { ElementBase, define } from '../../core.js';

/**
 * `<slider-elemental>` custom element.
 *
 * One `<input type="range">` inside it is a slider; two is a range, with a low thumb and a
 * high one that cannot pass each other. The thumb count is the markup rather than an
 * attribute, because it already is - counting the children is not a decision anyone has to
 * make twice.
 *
 * The thumbs stay `<input type="range">`, which is where the whole
 * [APG Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) already lives:
 * arrows, <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd>, the
 * pointer and touch behaviour, `step`, submission under each input's own `name`, `reset`,
 * restore, and a `<fieldset disabled>` that takes the lot. None of it is rewritten here,
 * which is why this element has no `role="slider"`, no `aria-valuenow` and no event of its
 * own - a range input fires `input` and `change`, and both bubble.
 *
 * What is left for script is what the platform will not say. Firefox draws the filled part
 * of a track with `::-moz-range-progress` and no other engine has an equivalent, so the
 * element writes `--slider-elemental-start` and `--slider-elemental-end` onto itself and
 * the fill is one box between them. They are ratios rather than percentages, and that is
 * the point: a thumb travels from half its own width to half a width short of the far end,
 * so `calc(var(--slider-elemental-end) * (100% - var(--slider-elemental-thumb-size)))` is
 * the thumb's real centre and a bare percentage is off by half a thumb at both ends - the
 * misalignment every two-input slider on the web has.
 *
 * Two thumbs add the three things a second `<input type="range">` cannot do for itself:
 * they are stacked so they share one track, the low one is stopped at the high one's value
 * (see `gap`), and a click on the track moves the nearer of them - which the stacking would
 * otherwise cost, since the input on top would swallow every press meant for the one below.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped.
 *
 * Degrades honestly. No script means no ratios and no clamping: one thumb is exactly the
 * native slider it already was, and two are two working sliders that can pass each other.
 * The optional theme draws nothing under `:not(:defined)`, so what shows is the browser's
 * own control rather than a themed track with no thumb on it.
 *
 * ponytail: a click on the track jumps the nearer thumb and focuses it, but does not
 * continue into a drag - the native input never learns the press happened. Pointer capture
 * on the input would finish it; nobody has missed it enough yet.
 *
 * ponytail: two thumbs, not N. A third `<input type="range">` still works as a plain
 * slider, and is not clamped or drawn - the fill is between the first two. The clamp is a
 * pair function; N thumbs want a sorted list and their own element.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
 */

/**
 * Where a value sits between the ends, as `0` to `1`.
 *
 * A range whose ends are the same, or the wrong way round, is no scale to place anything
 * on - and the start of the track is the honest answer there, because it is where a native
 * range input parks its own thumb when it is given the same markup.
 */
export function ratio(value, min, max) {
  if (!(max > min) || !Number.isFinite(value)) return 0;
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
}

/**
 * The two values with the thumbs kept apart, and which one gave way.
 *
 * The thumb being moved is the one that gives way, so dragging the low thumb into the high
 * one stops it rather than pushing the high one along - a drag that shoves the other end of
 * the range ahead of it is a drag that changes a value nobody touched.
 *
 * Except at the ends, where it cannot: `gap` may be wider than the room left between the
 * moved thumb and the bound behind it, and then the other one is what has to move. That is
 * the case a range pinned to its minimum is in every time the low thumb is dragged down.
 */
export function clampPair(start, end, gap, moved, min, max) {
  if (end - start >= gap) return [start, end];
  if (moved === 'start') {
    const pushed = end - gap;
    if (pushed >= min) return [pushed, end];
    return [min, Math.min(min + gap, max)];
  }
  const pushed = start + gap;
  if (pushed <= max) return [start, pushed];
  return [Math.max(max - gap, min), max];
}

/**
 * Which thumb goes on top when the two are at the same value, or `null` while they are not.
 *
 * Stacked, one thumb is under the other and out of reach of the pointer, so the one on top
 * has to be the one that can still move. At the maximum that is the low thumb, because the
 * high one has nowhere left to go and every drag from there is downwards; anywhere else it
 * is the high thumb, so a drag away from the pile widens the range rather than refusing to.
 * Either is still reachable with <kbd>Tab</kbd>, which is why this decides the pointer only.
 */
export function stackedThumb(start, end, max) {
  if (start !== end) return null;
  return end >= max ? 'start' : 'end';
}

/**
 * Which thumb a press on the track belongs to: the nearer one, and on a tie the one the
 * press is asking to move.
 *
 * The tie is not a corner case, it is the whole of the piled-up state - with both thumbs on
 * one value, every point on the track is exactly as far from one as from the other, so
 * distance alone would answer the same thumb every time and half the track would be dead:
 * the clamp puts a low thumb dragged past the high one straight back where it came from.
 */
export function nearerThumb(value, start, end) {
  const toStart = Math.abs(value - start);
  const toEnd = Math.abs(value - end);
  if (toStart === toEnd) return value > end ? 'end' : 'start';
  return toStart < toEnd ? 'start' : 'end';
}

/** A number off an attribute, or the native default the browser would have used. */
function bound(value, fallback) {
  const number = parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * One or two native range inputs sharing a track, with the fill position CSS cannot work
 * out on its own. The prose above is the whole story; these tags are the same API in the
 * form a machine can read - `custom-elements.json` is generated from them, and the docs
 * tables, editor autocomplete and the live options panel all come out of that one file.
 *
 * Curated by omission: `--slider-elemental-start`, `--slider-elemental-end` and
 * `data-stacked` are written by the element and are not tagged. They are the state, not
 * knobs to turn, and setting one by hand parks the fill somewhere the thumbs are not.
 *
 * @tag slider-elemental
 * @attr {number} [gap=0] - Least distance between the two thumbs, in the scale's own units. Ignored with one thumb.
 *
 * @cssprop {<length>} [--slider-elemental-thumb-size=1rem] - Thumb width and height. This is also the height of the control, and what the fill is inset by so its ends meet the thumb centres.
 * @cssprop {<length>} [--slider-elemental-track-size=0.375rem] - Track thickness.
 * @cssprop {<length-percentage>} [--slider-elemental-radius=999px] - Track corners. A big number is a pill at any height.
 * @cssprop {<length-percentage>} [--slider-elemental-thumb-radius=50%] - Thumb shape. `50%` is a circle, `0` a square.
 * @cssprop {<color>} [--slider-elemental-track=color-mix(in srgb, currentcolor 20%, transparent)] - The part of the track outside the selection.
 * @cssprop {<color>} [--slider-elemental-fill=currentcolor] - The part inside it.
 * @cssprop {<color>} [--slider-elemental-thumb=currentcolor] - Thumb fill.
 * @cssprop {<length>} [--slider-elemental-focus-width=3px] - Ring around a focused thumb.
 * @cssprop {<color>} [--slider-elemental-focus-color=color-mix(in srgb, currentcolor 35%, transparent)] - Ring colour.
 *
 * @slot - One `<input type="range">` for a slider, two for a range, and optionally an `<output>` per input to read the value back.
 */
export class SliderElemental extends ElementBase {
  static get observedAttributes() {
    return ['gap'];
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
    return Array.from(this.querySelectorAll('output')).filter((output) => output.closest('slider-elemental') === this);
  }

  /** Least distance between the two thumbs, in the scale's own units. */
  get gap() {
    return bound(this.getAttribute('gap'), 0);
  }

  set gap(value) {
    this.setAttribute('gap', value);
  }

  connectedCallback() {
    if (this.initialized) return;
    // Nothing to coordinate until the light-DOM children are parsed. The bundle is loaded
    // deferred or at the end of the body, so by upgrade time they are there.
    const inputs = this.inputs;
    if (!inputs.length) return;
    this.initialized = true;

    this.apply = this.apply.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onReset = this.onReset.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);

    // Capture, so the clamp has already happened by the time the event reaches a listener
    // the page put on the input itself. In the bubble phase it would not have, and half the
    // page would be reading a value this element is about to take back.
    this.addEventListener('input', this.onInput, true);

    // Three ways the values move, and only the first announces itself. A form reset puts
    // the inputs back without firing anything at them, and fires at the form above this
    // element - so the listener goes there. A back-navigation restores them with no event
    // at all, and `pageshow` is the one that arrives afterwards.
    this.form = this.closest('form');
    if (this.form) this.form.addEventListener('reset', this.onReset);
    if (typeof window !== 'undefined') window.addEventListener('pageshow', this.apply);

    if (inputs.length > 1) {
      this.addEventListener('pointerdown', this.onPointerDown);

      // Two thumbs are one control, and a group is what says so - but only where something
      // would read the name. `aria-label` on an element with no role is silently nothing,
      // and silently nothing is the failure this project does not ship. Each input still
      // needs its own name; this element does not invent one, because a name it guessed
      // would be in the wrong language on most of the pages that use it.
      if (!this.hasAttribute('role') && (this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby'))) {
        this.setAttribute('role', 'group');
        this.wroteRole = true;
      }
    }

    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('input', this.onInput, true);
    this.removeEventListener('pointerdown', this.onPointerDown);
    if (this.form) this.form.removeEventListener('reset', this.onReset);
    if (typeof window !== 'undefined') window.removeEventListener('pageshow', this.apply);
    this.form = null;

    // The state goes with it. Left behind, the ratios are a fill frozen where the thumbs
    // used to be while the inputs carry on being dragged - a drawing that disagrees with
    // the controls it is drawing. The role goes only where this element wrote it.
    this.style.removeProperty('--slider-elemental-start');
    this.style.removeProperty('--slider-elemental-end');
    this.removeAttribute('data-stacked');
    if (this.wroteRole) this.removeAttribute('role');
    this.wroteRole = false;
    this.initialized = false;
  }

  /** A new `gap` is a new distance the thumbs may already be inside of. */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    this.clamp('end');
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
    // Not one of the thumbs means a range input somewhere below this element that is not
    // its own - the event bubbles through here either way.
    if (index < 0) return;
    if (index < 2) this.clamp(index === 0 ? 'start' : 'end');
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
    // One scale, read off the first input: the thumbs share a track, so a second `min` or
    // `max` disagreeing with the first would be two rulers drawn on top of each other.
    const min = bound(inputs[0].min, 0);
    const max = bound(inputs[0].max, 100);
    const first = bound(inputs[0].value, min);
    const second = inputs.length > 1 ? bound(inputs[1].value, max) : null;

    // One thumb fills from the start of the track, which is the same fill with its low end
    // pinned - so the CSS is one rule for both rather than one per thumb count.
    this.style.setProperty('--slider-elemental-start', second === null ? 0 : ratio(first, min, max));
    this.style.setProperty('--slider-elemental-end', ratio(second === null ? first : second, min, max));

    const stacked = second === null ? null : stackedThumb(first, second, max);
    if (stacked) {
      this.setAttribute('data-stacked', stacked);
    } else {
      this.removeAttribute('data-stacked');
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
    // Anything that is not this element is a thumb, an `<output>`, or something the page
    // put inside - all of which own their own press.
    if (e.target !== this) return;
    const inputs = this.inputs;
    if (inputs.length < 2) return;

    const rect = this.getBoundingClientRect();
    // A thumb travels from half its own width to half a width short of the far end, and the
    // stylesheet sizes each input's height to the thumb - so the input's own box measures
    // the thumb without this having to parse a custom property out of a computed style.
    const thumb = inputs[0].getBoundingClientRect().height;
    const travel = rect.width - thumb;
    if (travel <= 0) return;

    const min = bound(inputs[0].min, 0);
    const max = bound(inputs[0].max, 100);
    let along = (e.clientX - rect.left - thumb / 2) / travel;
    // A range input flips with the writing direction and so does the track under it.
    // Computed style rather than `:dir()`, which throws on the browsers that do not know it
    // instead of quietly not matching.
    if (typeof getComputedStyle === 'function' && getComputedStyle(this).direction === 'rtl') along = 1 - along;
    const value = min + Math.min(Math.max(along, 0), 1) * (max - min);

    const input = inputs[nearerThumb(value, bound(inputs[0].value, min), bound(inputs[1].value, max)) === 'start' ? 0 : 1];
    input.value = value;
    // Cancelling the press is what makes the focus stick. The compatibility `mousedown`
    // this would otherwise fire has a default action of its own - move focus to the
    // nearest focusable ancestor - and the element the press landed on is this one, which
    // is not focusable, so the thumb focused a line below would be blurred again
    // immediately. Panning is decided by `touch-action` rather than here, so a touch
    // scroll started on the track is unaffected.
    e.preventDefault();
    input.focus();
    // The input's own value setter fires nothing, and a page listening for a drag has no
    // way to tell this press from one. `input` then `change` is the pair a browser sends
    // for a click on a track, in that order.
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

define('slider-elemental', SliderElemental);
