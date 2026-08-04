import { ElementBase, define } from '../../core.js';

/**
 * `<segmented-elemental>` custom element.
 *
 * A row of native radio buttons wearing one track and one sliding knob - the control
 * every design system calls a segmented control, and an N-state answer to the two-state
 * `<switch-elemental>`.
 *
 * The segments are `<input type="radio">` and stay `<input type="radio">`, which is where
 * the whole of the
 * [APG Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) already
 * lives: arrows move the selection and wrap, Tab enters and leaves the group once,
 * focus lands on the checked one, and the group submits, resets, restores, honours
 * `required` and goes down with a `<fieldset disabled>`. None of that is written here,
 * because rewriting it could only be a worse copy - and it is why this element has no
 * roles, no `aria-checked`, and no event of its own. A radio fires `change` and `change`
 * bubbles, so one listener on the form already hears every group in it.
 *
 * What is left for script is one thing CSS cannot say for an unknown number of segments:
 * which one is checked. The element writes `--segmented-elemental-index` and
 * `--segmented-elemental-count` on itself, and `data-index` beside them, and the knob is
 * one absolutely positioned pseudo-element that translates by the first and is one
 * track of the second wide.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped.
 *
 * Degrades honestly. No script means no `data-index`, which means no knob at all rather
 * than a knob parked on the first segment claiming a choice nobody made - the checked
 * segment still takes the selected colour, because that comes from
 * `label:has(> input:checked)` and needs nobody's help. The same is true before the
 * element upgrades, and of a group whose markup checks nothing.
 *
 * ponytail: `--segmented-elemental-count` is read when the element upgrades and whenever
 * the selection changes, not on a `MutationObserver`. Add or remove a segment at runtime
 * and call `apply()`; wire the observer if that stops being rare.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */
/**
 * Which segment the knob belongs under: the index of the checked radio, or `-1` for
 * none.
 *
 * `-1` is a state and not a failure - a group whose markup checks nothing has no
 * selection, and no knob is the honest drawing of that. The first checked one wins where
 * two are, which is what a browser does when markup checks two radios of one name.
 */
export function checkedIndex(inputs) {
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].checked) return i;
  }
  return -1;
}

/**
 * A row of native radio buttons drawn as one track with a knob that slides between them.
 * The prose above is the whole story; these tags are the same API in the form a machine
 * can read - `custom-elements.json` is generated from them, and the docs tables, editor
 * autocomplete and the live options panel all come out of that one file.
 *
 * Curated by omission: `--segmented-elemental-index` and `--segmented-elemental-count`
 * are written by the element and are not tagged. They are the state, not a knob to turn,
 * and setting one by hand moves the knob off the segment the reader actually chose.
 *
 * @tag segmented-elemental
 *
 * @cssprop {<length>} [--segmented-elemental-gap=3px] - Between the knob and the inside of the track.
 * @cssprop {<length-percentage>} [--segmented-elemental-radius=999px] - Track corners. A big number is a pill at any height.
 * @cssprop {<length>} [--segmented-elemental-border-width=1px] - Track border width.
 * @cssprop {<color>} [--segmented-elemental-border-color=transparent] - Track border.
 * @cssprop {<color>} [--segmented-elemental-track=color-mix(in srgb, currentcolor 10%, transparent)] - Track fill, behind every segment.
 * @cssprop {<color>} [--segmented-elemental-knob=Canvas] - Knob fill. The page's own background, so re-point it on a card.
 * @cssprop {<length-percentage>} [--segmented-elemental-knob-radius=var(--segmented-elemental-radius)] - Knob corners.
 * @cssprop {<color>} [--segmented-elemental-color=currentcolor] - Label colour on the segments the knob is not under.
 * @cssprop {<color>} [--segmented-elemental-color-selected=currentcolor] - Label colour on the one it is. Set this with `--segmented-elemental-knob` - the label sits on top of the knob.
 * @cssprop {<length>} [--segmented-elemental-padding-block=0.375rem] - Segment padding, block axis. This is what sets the height.
 * @cssprop {<length>} [--segmented-elemental-padding-inline=0.875rem] - Segment padding, inline axis.
 * @cssprop {<time>} [--segmented-elemental-duration=250ms] - Knob slide and colour cross-fade.
 * @cssprop {ease | ease-in | ease-out | ease-in-out | linear} [--segmented-elemental-easing=ease-in-out] - Knob slide and colour cross-fade.
 *
 * @slot - One `<label>` per segment, each wrapping an `<input type="radio">` and the text or icon that names it.
 */
export class SegmentedElemental extends ElementBase {
  /** The segments, in document order. Direct children, so a radio group inside one
   * segment's popover is not mistaken for part of this one. */
  get inputs() {
    return Array.from(this.querySelectorAll(':scope > label > input[type="radio"]'));
  }

  /** Index of the checked segment, or `-1` when the group has no selection. */
  get selectedIndex() {
    return checkedIndex(this.inputs);
  }

  connectedCallback() {
    if (this.initialized) return;
    // Nothing to coordinate until the light-DOM children are parsed. The bundle is
    // loaded deferred or at the end of the body, so by upgrade time they are there.
    if (!this.inputs.length) return;
    this.initialized = true;

    this.apply = this.apply.bind(this);
    this.onReset = this.onReset.bind(this);
    this.addEventListener('change', this.apply);

    // Three ways the selection moves, and only the first announces itself. A form reset
    // puts the radios back without firing `change` at any of them, and fires at the form
    // above this element - so the listener goes there. A back-navigation restores them
    // with no event at all, and `pageshow` is the one that arrives afterwards. A knob
    // left under a segment nobody is on is the single failure worse than no knob.
    this.form = this.closest('form');
    if (this.form) this.form.addEventListener('reset', this.onReset);
    if (typeof window !== 'undefined') window.addEventListener('pageshow', this.apply);

    // A group is a group to a screen reader because its radios share a `name`, so no role
    // is written here - except where the author has named this element and nothing would
    // read that name. `aria-label` on an element with no role is silently nothing, and
    // silently nothing is the failure this project does not ship.
    if (!this.hasAttribute('role') && (this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby'))) {
      this.setAttribute('role', 'group');
    }

    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('change', this.apply);
    if (this.form) this.form.removeEventListener('reset', this.onReset);
    if (typeof window !== 'undefined') window.removeEventListener('pageshow', this.apply);
    this.form = null;
    this.initialized = false;
  }

  /** A form is only put back to its defaults once the `reset` event has been dispatched,
   * so the selection is read on the next task rather than in the handler. */
  onReset() {
    setTimeout(this.apply);
  }

  /**
   * Push the selection onto the element, where the CSS reads it. Public because the count
   * is read here: add or remove a segment and this is the one call that catches up.
   *
   * `data-index` as well as the custom property, because CSS cannot ask whether a custom
   * property was set - an unset one inside `calc()` leaves the knob at zero, which is a
   * knob claiming the first segment. The attribute is what the knob's existence hangs
   * off, so no script and no selection both come out as no knob.
   */
  apply() {
    const inputs = this.inputs;
    const index = checkedIndex(inputs);
    this.style.setProperty('--segmented-elemental-count', inputs.length);
    if (index < 0) {
      this.removeAttribute('data-index');
      this.style.removeProperty('--segmented-elemental-index');
      return;
    }
    this.style.setProperty('--segmented-elemental-index', index);
    this.setAttribute('data-index', index);
  }
}

define('segmented-elemental', SegmentedElemental);
