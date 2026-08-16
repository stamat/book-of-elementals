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
 * `tooltip` is the one thing here that is a look rather than a behaviour, and the one thing
 * that writes markup: a value bubble that follows the pointer, over the thumb it is on or
 * over the track between them. One bubble and not one per thumb, because a pointer is in one
 * place at a time - two would be two boxes stacked on the same spot the moment the pointer
 * reached a thumb. It is `aria-hidden`, since the input under it announces its own value and
 * the same number twice is one announcement too many; it is pointer-only for the same reason
 * `<tooltip-elemental>` is, and nothing that only it can say may go in it.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped. The bubble is the only thing
 * inserted, only where `tooltip` asked for it, and it goes again when the attribute or the
 * element does.
 *
 * Degrades honestly. No script means no ratios, no clamping and no bubble: one thumb is
 * exactly the native slider it already was, and two are two working sliders that can pass
 * each other. The optional theme draws nothing under `:not(:defined)`, so what shows is the
 * browser's own control rather than a themed track with no thumb on it.
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
 *
 * The thumb gives way to the notch *past* where the gap lands, never the nearest one. A
 * `gap` no whole number of steps wide - `step="10"` with `gap="25"` - would otherwise be
 * handed a value the input rounds back towards the other thumb, leaving the two 20 apart
 * with a gap of 25 asked for and nothing anywhere saying so. Erring outwards spends at most
 * one notch and cannot be silently wrong.
 */
export function clampPair(start, end, gap, moved, min, max, step) {
  if (end - start >= gap) return [start, end];
  if (moved === 'start') {
    const pushed = end - gap;
    if (pushed >= min) return [snapToStep(pushed, min, max, step, -1), end];
    return [min, snapToStep(Math.min(min + gap, max), min, max, step, 1)];
  }
  const pushed = start + gap;
  if (pushed <= max) return [start, snapToStep(pushed, min, max, step, 1)];
  return [snapToStep(Math.max(max - gap, min), min, max, step, -1), max];
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

/**
 * Where a point on the control sits along the thumb's travel, as `0` to `1`.
 *
 * On the scale's own axis, not the screen's: `0` is `min` in both writing directions, which
 * is the same axis `--slider-elemental-start` and `--slider-elemental-end` are measured on
 * and the same one `inset-inline-start` spends them on.
 *
 * The travel is the box less one thumb, because a thumb's centre starts half a width in and
 * stops half a width short - the same arithmetic the fill is placed with, and the reason a
 * bare percentage of the width is off by half a thumb at both ends. A control with no room
 * to travel answers `0`, for the reason `ratio` does: there is one place a thumb can be.
 */
export function alongTrack(x, left, width, thumb, rtl) {
  const travel = width - thumb;
  if (!(travel > 0)) return 0;
  const along = (x - left - thumb / 2) / travel;
  return Math.min(Math.max(rtl ? 1 - along : along, 0), 1);
}

/** Digits after the point in a number as it is written, and `0` for one in exponential form
 * - `toFixed` wants a count of digits and `1e-7` does not carry one. */
function decimals(value) {
  const text = String(value);
  return text.includes('e') ? 0 : (text.split('.')[1] || '').length;
}

/**
 * A value put on the nearest notch, the way a range input puts its own there.
 *
 * The notches are counted from `min` rather than from zero, which is the platform's rule:
 * `min="1" step="10"` is 1, 11, 21, and a bubble reading out 10 for a press the input would
 * make 11 is a bubble that lies about what it is previewing. Ties round up, which is what
 * [MDN says a user agent does](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range)
 * and what `Math.round` does.
 *
 * The top of the scale is the last notch at or below `max`, not `max` - `max` is not always
 * a whole number of steps above `min`, and where it is not the end of the scale is a value
 * the input cannot hold. `min="0" max="100" step="40"` stops at 80.
 *
 * Rounded to the decimals the step is written with, because binary floating point cannot
 * hold a tenth: three notches up a `step="0.1"` scale is `0.30000000000000004` otherwise,
 * and that is what the reader would see.
 *
 * `direction` picks which notch when the value falls between two: `-1` the one below, `1`
 * the one above, and nothing at all the nearest. Rounding to the nearest is right for a
 * bubble previewing a press, and wrong for the gap between two thumbs - there, landing on
 * the near notch is landing closer to the other thumb than the gap allows, so the caller
 * that has a direction to give gives it.
 */
export function snapToStep(value, min, max, step, direction) {
  if (!(step > 0)) return Math.min(Math.max(value, min), max);
  const places = Math.max(decimals(step), decimals(min));
  const trim = (number) => (places ? Number(number.toFixed(places)) : number);
  const steps = (value - min) / step;
  const nearest = Math.round(steps);
  // A value already on a notch can divide out to 2.9999999999999996, and flooring that
  // walks a whole notch the wrong way - so an exact hit is taken as exact before either
  // direction gets a say.
  const count = Math.abs(steps - nearest) < 1e-9 ? nearest
    : direction < 0 ? Math.floor(steps)
      : direction > 0 ? Math.ceil(steps)
        : nearest;
  const snapped = min + count * step;
  if (snapped < min) return min;
  if (snapped > max) return trim(min + Math.floor((max - min) / step) * step);
  return trim(snapped);
}

/** The notch spacing an input is actually on: unset means `1`, and `any` means no notches. */
export function stepOf(input) {
  return input.step === 'any' ? 0 : bound(input.step, 1);
}

/**
 * Which thumb the pointer is over, by index, or `-1` for the track beside or between them.
 *
 * A pointer within half a thumb of a thumb's centre is on it, because that is the thumb's
 * own box - one `--slider-elemental-thumb-size` across, centred on where it sits. The first
 * match wins, and with two thumbs piled on one value that is the low one: they carry the
 * same value, so there is nothing to choose between what either would read out.
 *
 * `ratios` are on the scale's axis and this is screen pixels, which is the whole of the
 * `rtl` flip - the low thumb of a range runs to the right-hand end when the page does.
 */
export function thumbUnder(x, left, width, thumb, ratios, rtl) {
  const travel = Math.max(width - thumb, 0);
  for (let i = 0; i < ratios.length; i++) {
    const at = rtl ? 1 - ratios[i] : ratios[i];
    if (Math.abs(x - (left + thumb / 2 + at * travel)) <= thumb / 2) return i;
  }
  return -1;
}

/**
 * Which thumb a press holds the value bubble on until it is let go, or `-1` for a press that
 * drags no thumb at all.
 *
 * Where the pointer is answers this everywhere except during a drag, and during a drag it is
 * wrong twice over: a thumb snaps to notches while the pointer moves smoothly, so half a step
 * out the pointer is beside the thumb it is dragging, and past either end it is off the
 * control entirely. Both would flip the bubble to a track reading under the reader's own
 * hand. So the press decides, once.
 *
 * A press on the track is a drag only with one thumb, and that is the stylesheet's doing
 * rather than a rule invented here: one input covers the whole control, so the native range
 * takes the press and carries on into a drag. Two are stacked with their pointer events on
 * the thumbs, so the press is this element's, moves the nearer thumb and stops - nothing is
 * being dragged, and nothing should be pinned.
 */
export function draggedThumb(under, count) {
  if (under >= 0) return under;
  return count === 1 ? 0 : -1;
}

/**
 * Which value bubbles the `tooltip` attribute asked for.
 *
 * A bare `tooltip` is the thumb, because that is the half a slider is asked for and the half
 * every library that ships the feature ships. A token list rather than one value, so a page
 * can have the other half on its own or both at once without a third keyword to remember.
 *
 * An unknown token is no bubble rather than an error: the attribute is a list, and refusing
 * to draw anything is what tells the author the word did not land - louder than a thumb
 * bubble they did not ask for and quieter than a page that throws.
 */
export function tooltipModes(value) {
  if (value === null || value === undefined) return { thumb: false, track: false };
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return { thumb: true, track: false };
  return { thumb: tokens.includes('thumb'), track: tokens.includes('track') };
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
 * Curated by omission: `--slider-elemental-start`, `--slider-elemental-end`,
 * `--slider-elemental-at` and `data-stacked` are written by the element and are not tagged.
 * They are the state, not knobs to turn, and setting one by hand parks the fill or the
 * bubble somewhere the thumbs are not.
 *
 * @tag slider-elemental
 * @attr {number} [gap=0] - Least distance between the two thumbs, in the scale's own units. Ignored with one thumb.
 * @attr {string} tooltip - A value bubble that follows the pointer. `thumb` over the thumb it is on, `track` for the value under it elsewhere, `thumb track` for both; a bare `tooltip` is `thumb`. Pointer only, and `aria-hidden` — the input announces its own value.
 *
 * @cssprop {<length>} [--slider-elemental-thumb-size=1rem] - Thumb width and height. This is also the height of the control, and what the fill is inset by so its ends meet the thumb centres.
 * @cssprop {<length>} [--slider-elemental-track-size=0.375rem] - Track thickness.
 * @cssprop {<length-percentage>} [--slider-elemental-radius=999px] - Track corners. A big number is a pill at any height.
 * @cssprop {<length-percentage>} [--slider-elemental-thumb-radius=50%] - Thumb shape. `50%` is a circle, `0` a square.
 * @cssprop {<color>} [--slider-elemental-track=color-mix(in srgb, currentcolor 20%, transparent)] - The part of the track outside the selection.
 * @cssprop {<color>} [--slider-elemental-fill=currentcolor] - The part inside it.
 * @cssprop {<color>} [--slider-elemental-thumb=var(--slider-elemental-fill)] - Thumb fill. Follows the selection unless you set it.
 * @cssprop {<length>} [--slider-elemental-focus-width=3px] - Ring around a focused thumb.
 * @cssprop {<color>} [--slider-elemental-focus-color=color-mix(in srgb, currentcolor 35%, transparent)] - Ring colour.
 * @cssprop {<length>} [--slider-elemental-tooltip-gap=0.375rem] - Between the thumb and the `tooltip` bubble above it.
 * @cssprop {<length>} [--slider-elemental-tooltip-padding-block=0.25em] - Above and below the number in the bubble.
 * @cssprop {<length>} [--slider-elemental-tooltip-padding-inline=0.5em] - Either side of it.
 * @cssprop {<length-percentage>} [--slider-elemental-tooltip-radius=6px] - The bubble's corners.
 * @cssprop {<color>} [--slider-elemental-tooltip-surface=CanvasText] - What the bubble is painted in.
 * @cssprop {<color>} [--slider-elemental-tooltip-color=Canvas] - The number on it.
 *
 * @slot - One `<input type="range">` for a slider, two for a range, and optionally an `<output>` per input to read the value back.
 */
export class SliderElemental extends ElementBase {
  static get observedAttributes() {
    return ['gap', 'tooltip'];
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
    return Array.from(this.querySelectorAll('output:not([data-tooltip])')).filter((output) => output.closest('slider-elemental') === this);
  }

  /** Least distance between the two thumbs, in the scale's own units. */
  get gap() {
    return bound(this.getAttribute('gap'), 0);
  }

  set gap(value) {
    this.setAttribute('gap', value);
  }

  /** Whether the control runs right to left. Computed style rather than `:dir()`, which
   * throws on the browsers that do not know it instead of quietly not matching. */
  get rtl() {
    return typeof getComputedStyle === 'function' && getComputedStyle(this).direction === 'rtl';
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
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onTooltipDown = this.onTooltipDown.bind(this);
    this.onTooltipUp = this.onTooltipUp.bind(this);

    // Where the pointer last was, or `null` for a pointer that is not on the control. It is
    // kept because the bubble has to be redrawn by things that are not pointer moves - a
    // value arriving from script, a `reset`, a restore - and the pointer may not have moved
    // since, so there would be no event carrying the coordinate to redraw it at.
    this.tooltipX = null;
    this.tooltipElement = null;
    // The thumb a press pinned the bubble to, or `-1` for no drag in progress.
    this.dragging = -1;

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
    this.syncTooltip();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('input', this.onInput, true);
    this.removeEventListener('pointerdown', this.onPointerDown);
    if (this.form) this.form.removeEventListener('reset', this.onReset);
    if (typeof window !== 'undefined') window.removeEventListener('pageshow', this.apply);
    this.form = null;
    this.removeTooltip();

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
    if (name === 'tooltip') {
      this.syncTooltip();
      return;
    }
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

    // The bubble is a readout too, and this is every way a value moves. Redrawn from the
    // remembered coordinate rather than skipped: a thumb arrowed under a resting pointer
    // moves out from under it, so which thumb is being pointed at is a question with a new
    // answer even though no pointer event has fired.
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
    const modes = tooltipModes(this.getAttribute('tooltip'));
    const wanted = modes.thumb || modes.track;
    if (wanted && !this.tooltipElement) {
      const bubble = document.createElement('output');
      bubble.setAttribute('aria-hidden', 'true');
      bubble.dataset.tooltip = 'thumb';
      bubble.hidden = true;
      this.appendChild(bubble);
      this.tooltipElement = bubble;
      this.addEventListener('pointermove', this.onPointerMove);
      this.addEventListener('pointerleave', this.onPointerLeave);
      // On this element rather than the document: a range input takes pointer capture for
      // the length of a drag, so every move and the release itself are retargeted to the
      // input and reach here by bubbling, wherever on the screen they happen.
      this.addEventListener('pointerdown', this.onTooltipDown);
      this.addEventListener('pointerup', this.onTooltipUp);
      this.addEventListener('pointercancel', this.onTooltipUp);
    }
    if (!wanted) this.removeTooltip();
    // The attribute may have changed under a pointer that has not moved since - dropping
    // `track` while the bubble is showing a track value has to take that bubble away now,
    // not at the next pointer move that may never come.
    if (this.tooltipElement && this.tooltipX !== null) this.showTooltipAt(this.tooltipX);
  }

  /** The bubble and the listeners that draw it, gone together. The element wrote the bubble,
   * so the element is what takes it back off the page. */
  removeTooltip() {
    if (!this.tooltipElement) return;
    this.removeEventListener('pointermove', this.onPointerMove);
    this.removeEventListener('pointerleave', this.onPointerLeave);
    this.removeEventListener('pointerdown', this.onTooltipDown);
    this.removeEventListener('pointerup', this.onTooltipUp);
    this.removeEventListener('pointercancel', this.onTooltipUp);
    this.tooltipElement.remove();
    this.tooltipElement = null;
    this.tooltipX = null;
    this.dragging = -1;
  }

  onPointerMove(e) {
    // A tap is not a hover. Half-handling touch is how a bubble ends up stuck on a phone,
    // and there is nothing in this one a touch reader does not already have on screen.
    if (e.pointerType === 'touch') return;
    this.tooltipX = e.clientX;
    this.showTooltipAt(e.clientX);
  }

  /** A press pins the bubble to whatever it is about to drag, for as long as it is held. */
  onTooltipDown(e) {
    if (e.pointerType === 'touch') return;
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
    if (e.pointerType === 'touch') return;
    this.dragging = -1;
    const rect = this.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (inside) this.showTooltipAt(e.clientX);
    else this.onPointerLeave();
  }

  onPointerLeave() {
    // A drag that has wandered off the control is still a drag, and the thumb it is holding
    // is still worth reading. The release is what ends it.
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
    // The stylesheet sizes each input's height to the thumb, so the input's own box measures
    // the thumb without this having to parse a custom property out of a computed style.
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

    const modes = tooltipModes(this.getAttribute('tooltip'));
    const over = this.dragging >= 0 && this.dragging < m.inputs.length ? this.dragging : m.under;
    const on = over < 0 ? 'track' : 'thumb';
    if (!modes[on]) {
      bubble.hidden = true;
      return;
    }

    let at = m.ratios[over];
    let text = over < 0 ? '' : m.inputs[over].value;
    if (over < 0) {
      at = alongTrack(x, m.rect.left, m.rect.width, m.thumb, m.rtl);
      // `step="any"` is the one value meaning no step at all, and `parseFloat` would read it
      // as the missing attribute's default of 1.
      text = String(snapToStep(m.min + at * (m.max - m.min), m.min, m.max, stepOf(m.inputs[0])));
    }

    bubble.dataset.tooltip = on;
    bubble.textContent = text;
    bubble.style.setProperty('--slider-elemental-at', at);
    bubble.hidden = false;
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
    // The stylesheet sizes each input's height to the thumb, so the input's own box measures
    // the thumb without this having to parse a custom property out of a computed style.
    const thumb = inputs[0].getBoundingClientRect().height;
    // A control with no room to travel has one position and `alongTrack` answers it, but a
    // press there is a press on nothing - so it moves no thumb and fires no events.
    if (rect.width <= thumb) return;

    const min = bound(inputs[0].min, 0);
    const max = bound(inputs[0].max, 100);
    const value = min + alongTrack(e.clientX, rect.left, rect.width, thumb, this.rtl) * (max - min);

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
