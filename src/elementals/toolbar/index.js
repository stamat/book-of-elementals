import { ElementBase, define, stepIndex } from '../../core.js';

/**
 * Which of `stepIndex`'s keys an arrow means on this bar's axis, if any.
 *
 * A toolbar answers to one axis and leaves the other where it was pressed - Left/Right on
 * a bar across the page, Up/Down on one down it - which is the whole of what
 * `aria-orientation` promises. The other axis is not merely unused: a Down arrow on a
 * horizontal bar is the page scrolling, and swallowing it would pin the page under a reader
 * who is only passing through.
 *
 * @param {string} key `KeyboardEvent.key`
 * @param {boolean} vertical Whether the bar runs down the page
 * @returns {string|null} A key `stepIndex` understands, or null for one that is not this
 *   bar's - which is every key that presses a button or leaves the bar.
 * @example
 * toolbarKey('ArrowRight', false) // => 'ArrowRight'
 * toolbarKey('ArrowDown', false) // => null, the page still scrolls
 * toolbarKey('Home', true) // => 'Home', both axes have ends
 */
export function toolbarKey(key, vertical) {
  if (key === 'Home' || key === 'End') return key;
  if (key === (vertical ? 'ArrowDown' : 'ArrowRight')) return key;
  if (key === (vertical ? 'ArrowUp' : 'ArrowLeft')) return key;
  return null;
}

/**
 * What the arrows walk.
 *
 * Buttons and links only, which is what the pattern's "commonly used function buttons"
 * are. A `<select>` or a text field in a bar wants the arrow keys for itself, and MDN's
 * own advice is to keep such a control out of a toolbar or put it last - so rather than
 * guess which press was meant for whom, the arrows do not reach it and it stays a tab stop
 * of its own.
 */
const CONTROLS = 'button, a[href]';

/**
 * Whether a keypress can land on this control.
 *
 * A control a stylesheet has taken off the screen is still in the DOM and still not
 * `disabled`, and `focus()` on it does nothing at all - so an arrow that steps onto one is an
 * arrow that moves nothing, and a bar that stops moving there.
 *
 * Opacity is deliberately no part of it. A control row faded out over a video is still a row a
 * keyboard reaches, and focus arriving in it is what fades it back in.
 *
 * `hidden` is read as an attribute rather than left to `checkVisibility`, because
 * `hidden="until-found"` hides by skipping the region's contents rather than by `display:
 * none`, and because it is the one hidden state readable where there is no layout to consult.
 *
 * Where `checkVisibility` is missing - Safari before 17.4, and any environment without layout -
 * the rest of the answer is yes, which is what every version before this one answered. The two
 * ways to be wrong here are not the same size: a control wrongly called reachable is the dead
 * end this function exists to remove, and a control wrongly called unreachable is a working
 * button the arrows now refuse to visit. The fallback takes the first.
 *
 * @param {HTMLElement} control
 * @returns {boolean}
 */
function reachable(control) {
  if (control.closest('[hidden]')) return false;
  return control.checkVisibility ? control.checkVisibility({ visibilityProperty: true }) : true;
}

/**
 * `<toolbar-elemental>` custom element.
 *
 * A row of buttons the arrow keys walk and Tab passes in one step, per the
 * [APG Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).
 *
 * A bar of six buttons is six tab stops between the reader and whatever is after it. The
 * pattern's answer is a roving `tabindex`: one stop for the bar, arrows between the
 * controls inside it. That is all this element is - the role, the axis, and the one
 * `tabindex="0"` that moves.
 *
 * The arrows visit what a reader can actually land on. A `disabled` control is stepped over,
 * and so is one a stylesheet or a folded-away region has taken off the screen: neither can take
 * focus, and a cursor that stops where focus cannot follow is a bar that stops moving.
 *
 * The ends do not wrap. Running off one is not how you get anywhere here: Tab is, and a bar
 * that looped would be a bar a reader can walk forever without noticing they had.
 *
 * **Name it.** A toolbar takes its name from `aria-label`, or `aria-labelledby` if something
 * on the page already says it - and where there is more than one bar, naming them is not
 * optional. The element cannot invent one, and does not pretend to: an unnamed toolbar is
 * announced as a toolbar and nothing else.
 *
 * Light DOM, no shadow root. Degrades to what it is: with no script, the buttons are
 * buttons, each its own tab stop. That is the state the pattern improves on, not a broken
 * one - nothing is lost when the script never arrives.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * @tag toolbar-elemental
 * @attr {boolean} [vertical=false] - The bar runs down the page rather than across it. Swaps the arrow keys with it, and says so with `aria-orientation`.
 *
 * @cssprop {<length>} [--toolbar-elemental-gap=0.25rem] - Between the controls.
 * @cssprop {<length>} [--toolbar-elemental-inset=0.25rem] - Padding inside the bar.
 * @cssprop {<length>} [--toolbar-elemental-radius=0.375rem] - Corners of the bar and of a control inside it.
 * @cssprop {<color>} [--toolbar-elemental-border=color-mix(in srgb, currentcolor 20%, transparent)] - The bar's outline.
 * @cssprop {<color>} [--toolbar-elemental-hover=color-mix(in srgb, currentcolor 10%, transparent)] - A control under the pointer.
 * @cssprop {<color>} [--toolbar-elemental-pressed=color-mix(in srgb, currentcolor 18%, transparent)] - A control whose `aria-pressed` is true.
 *
 * @slot - The controls: `<button>`s and links, in the order the arrows should walk them.
 */
export class ToolbarElemental extends ElementBase {
  static get observedAttributes() {
    return ['vertical'];
  }

  /** Whether the bar runs down the page. Reflected, so `[vertical]` is a styling hook. */
  get vertical() {
    return this.hasAttribute('vertical');
  }

  set vertical(value) {
    this.toggleAttribute('vertical', !!value);
  }

  /**
   * The controls the arrows walk, in document order.
   *
   * A `disabled` button is left out because the platform will not focus one, and a cursor
   * that lands where focus cannot follow is a bar that stops moving. Keeping such a control
   * reachable is `aria-disabled` on it instead - still focusable, still announced, and this
   * list still has it.
   */
  get controls() {
    return Array.from(this.querySelectorAll(CONTROLS)).filter((control) => !control.disabled);
  }

  /**
   * The controls the arrows walk: `controls`, less whatever is not on screen.
   *
   * Two lists rather than one narrower list, because they answer to different things.
   * `tabindex` is written to and taken off every control the bar owns - a hidden one at
   * teardown as much as a visible one, or it keeps a `tabindex="-1"` that outlives the element
   * and is a button nobody can reach again.
   */
  get walkable() {
    return this.controls.filter(reachable);
  }

  connectedCallback() {
    if (this.initialized) return;
    if (!this.controls.length) return;

    this.initialized = true;
    this.setAttribute('role', 'toolbar');

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onFocusIn = this.onFocusIn.bind(this);
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('focusin', this.onFocusIn);

    // A bar whose buttons enable and disable as the document changes - undo, redo - is the
    // ordinary case, not an exotic one, and the control holding `tabindex="0"` going
    // `disabled` is a bar with no tab stop left in it. An observer costs one per bar and
    // takes a `refresh()` off the API of every caller, which is the call nobody remembers
    // until the keyboard has already stopped working.
    this.observer = new MutationObserver(() => this.wire());
    this.observer.observe(this, { childList: true, subtree: true, attributeFilter: ['disabled', 'hidden'] });

    this.wire();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;

    if (this.observer) this.observer.disconnect();
    this.observer = null;

    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('focusin', this.onFocusIn);

    // Everything written comes off. A `role="toolbar"` nobody is driving is a keyboard
    // contract with no keyboard behind it, and a `tabindex="-1"` left on a button is a
    // button the reader can no longer reach at all.
    this.removeAttribute('role');
    this.removeAttribute('aria-orientation');
    for (const control of this.controls) control.removeAttribute('tabindex');
  }

  /**
   * Put the axis on the bar and the single tab stop inside it.
   *
   * The stop follows focus where there is any, so a bar entered by clicking its last button
   * is a bar the arrows carry on from there rather than one that jumps back to the start.
   */
  wire() {
    // Only when it is true: horizontal is `aria-orientation`'s own default, and writing it
    // out is a second copy of the same fact to keep in step.
    if (this.vertical) this.setAttribute('aria-orientation', 'vertical');
    else this.removeAttribute('aria-orientation');

    const controls = this.controls;
    if (!controls.length) return;

    const focused = controls.find((control) => control === document.activeElement);
    const held = controls.find((control) => control.getAttribute('tabindex') === '0');
    const candidate = focused || held;
    // The visibility test is spent on the one control that would keep the stop rather than on
    // every control in the bar: it flushes style, and this runs on every mutation inside a bar
    // whose contents are the page's to change - a clock rewriting its own text four times a
    // second is an ordinary member of one.
    const stop = candidate && reachable(candidate) ? candidate : this.walkable[0];
    // Nothing on screen to put it on. The old stop stays where it is, because a bar hidden
    // whole - one waiting on its media, or on a breakpoint - is coming back, and `hidden` in the
    // observer above is what brings this round again when it does.
    if (!stop) return;
    for (const control of controls) control.tabIndex = control === stop ? 0 : -1;
  }

  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    this.wire();
  }

  onFocusIn() {
    this.wire();
  }

  onKeyDown(e) {
    const key = toolbarKey(e.key, this.vertical);
    if (!key) return;

    const controls = this.walkable;
    const at = controls.indexOf(e.target);
    // A key pressed on something in the bar that is not one of its controls belongs to
    // whatever that is - the arrows are only the bar's while the reader is on it.
    if (at === -1) return;

    const to = stepIndex(at, key, controls.length);
    if (to === null) return;
    e.preventDefault();
    controls[to].focus();
  }
}

define('toolbar-elemental', ToolbarElemental);
