import { ElementBase, define } from '../../core.js';

/**
 * `<progress-elemental>` custom element.
 *
 * A native `<progress>` that says where its fill ends, so CSS can draw the bar instead of
 * `::-webkit-progress-value` and `::-moz-progress-bar` - and a second value beside it, for
 * the part that is loaded but not yet played.
 *
 * The `<progress>` stays a `<progress>`, which is where `role="progressbar"`, `max`, the
 * indeterminate state and being labelled by a `<label>` already live. None of that is
 * rewritten here, which is why this element writes no roles and no ARIA at all.
 *
 * What is left for script is the one thing CSS cannot ask for: how far along it is. The
 * element writes `--progress-elemental-value` onto itself as a percentage, and
 * `--progress-elemental-buffer` beside it when the host carries a `buffer` - the two-valued
 * bar a media scrubber needs and `<progress>` has never had. Indeterminate is
 * `data-indeterminate` and no percentage at all, because a bar animating across is not a
 * bar sitting at zero.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped.
 *
 * Degrades honestly. No script means no custom properties, and the optional theme draws
 * nothing at all under `:not(:defined)` - the browser's own bar is left showing the real
 * value rather than a themed bar frozen at zero, which is the one failure worse than an
 * unstyled one.
 *
 * ponytail: the buffer is a single value, not the `TimeRanges` list a `<video>` actually
 * buffers. One filled span from the start is what a scrubber draws anyway; give it
 * `media.buffered.end(0)` over the duration. Multiple spans want their own element.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress
 */
/**
 * How far along the bar is, as a percentage of `max`, clamped to the ends.
 *
 * `<progress>` has no `min` - it counts from zero by definition, which is what separates it
 * from `<meter>`. A `max` that is zero, negative or unparseable is no scale to measure
 * against, and zero is the honest answer there: a bar drawn full because the denominator
 * was nonsense is a bar that lies about being finished.
 */
export function percent(value, max) {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= max) return 100;
  // Scaled before dividing, not after: `(55 / 100) * 100` is `55.00000000000001` in
  // binary floating point, and that number ends up in an inline style on the element for
  // anyone reading the DOM.
  return (value * 100) / max;
}

/**
 * A native `<progress>` whose fill and buffer are readable from CSS. The prose above is the
 * whole story; these tags are the same API in the form a machine can read -
 * `custom-elements.json` is generated from them, and the docs tables, editor autocomplete
 * and the live options panel all come out of that one file.
 *
 * Curated by omission: `--progress-elemental-value` and `--progress-elemental-buffer` are
 * written by the element and are not tagged. They are the state, not a knob to turn, and
 * setting one by hand parks the bar somewhere the `<progress>` underneath it disagrees
 * with.
 *
 * @tag progress-elemental
 * @attr {number} buffer - A second value on the same `max`, drawn behind the fill. Absent is no buffer bar at all.
 *
 * @cssprop {<length>} [--progress-elemental-height=0.5rem] - Bar thickness.
 * @cssprop {<length-percentage>} [--progress-elemental-radius=999px] - Bar corners. A big number is a pill at any height.
 * @cssprop {<color>} [--progress-elemental-track=color-mix(in srgb, currentcolor 15%, transparent)] - The part behind everything.
 * @cssprop {<color>} [--progress-elemental-fill=currentcolor] - The value.
 * @cssprop {<color>} [--progress-elemental-buffer-fill=color-mix(in srgb, currentcolor 35%, transparent)] - The buffer, behind the value.
 * @cssprop {<time>} [--progress-elemental-duration=250ms] - How long the fill takes to move.
 * @cssprop {ease | ease-in | ease-out | ease-in-out | linear} [--progress-elemental-easing=ease-out] - How the fill moves.
 * @cssprop {<time>} [--progress-elemental-indeterminate-duration=1.4s] - One sweep, while there is no value.
 *
 * @slot - One `<progress>`, with the `value` and `max` it would have had on its own.
 */
export class ProgressElemental extends ElementBase {
  static get observedAttributes() {
    return ['buffer'];
  }

  /** The bar. Direct child, so a `<progress>` inside a card this element happens to wrap
   * is not mistaken for the one being measured. */
  get progress() {
    return this.querySelector(':scope > progress');
  }

  /**
   * The value, or `null` while there is none. Setting `null` takes the attribute off and
   * puts the bar back to indeterminate, which is what
   * [MDN says to do](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)
   * and the only way there is.
   */
  get value() {
    const progress = this.progress;
    return progress && progress.hasAttribute('value') ? progress.value : null;
  }

  set value(value) {
    const progress = this.progress;
    if (!progress) return;
    if (value === null || value === undefined) {
      progress.removeAttribute('value');
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
    const value = this.getAttribute('buffer');
    if (value === null || value === '') return null;
    const number = parseFloat(value);
    return Number.isFinite(number) ? number : null;
  }

  set buffer(value) {
    if (value === null || value === undefined || value === '') {
      this.removeAttribute('buffer');
      return;
    }
    this.setAttribute('buffer', value);
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded deferred or
    // at the end of the body, so by upgrade time the `<progress>` is there.
    if (this.initialized) return;
    const progress = this.progress;
    if (!progress) return;
    this.initialized = true;

    this.apply = this.apply.bind(this);

    // The only way to hear about a `<progress>` changing: it fires no event of its own, and
    // both its `value` and its `max` are reflecting IDL attributes - so `progress.value = 40`
    // writes `value="40"` and lands here exactly as `setAttribute` does. One observer
    // therefore covers every way an author can move the bar, including removing `value` to
    // go back to indeterminate.
    this.observer = new MutationObserver(this.apply);
    this.observer.observe(progress, { attributes: true, attributeFilter: ['value', 'max'] });

    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.observer.disconnect();
    this.observer = null;
    // The custom properties go with it. Left behind, they are a fill frozen at whatever the
    // bar last read while the `<progress>` underneath carries on being moved - a drawing
    // that disagrees with the element it is drawing.
    this.style.removeProperty('--progress-elemental-value');
    this.style.removeProperty('--progress-elemental-buffer');
    this.removeAttribute('data-indeterminate');
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

    if (progress.hasAttribute('value')) {
      this.removeAttribute('data-indeterminate');
      this.style.setProperty('--progress-elemental-value', `${percent(progress.value, max)}%`);
    } else {
      this.setAttribute('data-indeterminate', '');
      this.style.removeProperty('--progress-elemental-value');
    }

    const buffer = this.buffer;
    if (buffer === null) {
      this.style.removeProperty('--progress-elemental-buffer');
      return;
    }
    this.style.setProperty('--progress-elemental-buffer', `${percent(buffer, max)}%`);
  }
}

define('progress-elemental', ProgressElemental);
