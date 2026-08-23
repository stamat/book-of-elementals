import { ElementBase, define } from '../../core.js';

/** Down the middle, when nothing says otherwise. */
export const DEFAULT_POSITION = 50;

/** What one arrow key is worth, as a percentage of the track. Not an attribute: a splitter
 * whose arrow key moved by a configurable amount would be a second number to keep in step
 * with `min` and `max`, and nothing in the pattern asks for one. */
export const STEP = 1;

/** Ids for `aria-controls`, which needs the primary pane to have one. */
let paneCount = 0;

function clamp(value, low, high) {
  // Written as `!(value > low)` rather than `value < low`, so `NaN` - a `position` attribute
  // somebody typed a unit into - lands on the floor instead of travelling on as `NaN`.
  if (!(value > low)) return low;
  return value > high ? high : value;
}

/** Three decimals is past what a pixel can show, and the number ends up in a `style`
 * attribute for anyone reading the DOM. */
function round3(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

/**
 * What a key does to the primary pane, or `null` where the key is not this element's.
 *
 * The names are the pane's rather than the screen's - `shrink` and `grow` instead of left and
 * up - because which physical arrow shrinks the pane is exactly the part that moves. It
 * changes with the axis, and on the horizontal axis it changes again with the writing
 * direction: in a right-to-left page the primary pane is the one on the right, so
 * <kbd>ArrowLeft</kbd> is the key that makes it bigger.
 *
 * Only the axis the splitter is on answers. <kbd>ArrowUp</kbd> on a splitter between a left
 * and a right pane is not a key with nothing to do - it is the page's key, for scrolling, and
 * swallowing it is how a widget takes the document's keyboard away from a reader who is
 * inside it.
 *
 * @param {string} key KeyboardEvent.key value.
 * @param {boolean} vertical Whether the panes are stacked down the page.
 * @param {boolean} rtl Whether the layout runs right to left.
 * @returns {'shrink'|'grow'|'min'|'max'|'collapse'|null}
 * @example
 * splitterKey('ArrowLeft', false, false) // => 'shrink'
 * splitterKey('ArrowLeft', false, true) // => 'grow'
 * splitterKey('ArrowLeft', true, false) // => null, the panes are stacked
 */
export function splitterKey(key, vertical, rtl) {
  if (key === 'Enter') return 'collapse';
  if (key === 'Home') return 'min';
  if (key === 'End') return 'max';
  if (vertical) {
    if (key === 'ArrowUp') return 'shrink';
    if (key === 'ArrowDown') return 'grow';
    return null;
  }
  if (key === 'ArrowLeft') return rtl ? 'grow' : 'shrink';
  if (key === 'ArrowRight') return rtl ? 'shrink' : 'grow';
  return null;
}

/**
 * Where a pointer puts the separator, as a percentage of the track.
 *
 * **The track is the box minus the handle, not the box.** The handle occupies a column of its
 * own, so the primary pane can only ever be as wide as what is left over - and a percentage
 * measured against the full box would mean `100` is a pane one handle wider than the space
 * there is, which overflows by that much at one end and cannot be reached at the other. The
 * stylesheet sizes the first track out of the same subtraction, so the two agree by
 * construction rather than by a constant written twice.
 *
 * Half a handle comes off the pointer's own position for the same reason: the reader grabbed
 * the middle of the handle, and the track starts at its leading edge.
 *
 * @param {DOMRect|{left: number, top: number, width: number, height: number}} rect The element's box.
 * @param {number} x Viewport coordinates, as `PointerEvent.clientX` gives them.
 * @param {number} y
 * @param {{vertical?: boolean, rtl?: boolean, size?: number}} [options] `size` is the handle's
 *   extent along the axis, in pixels.
 * @returns {number} `0` to `100`.
 * @example
 * positionFrom({ left: 0, top: 0, width: 200, height: 100 }, 50, 50) // => 25
 */
export function positionFrom(rect, x, y, options = {}) {
  const { vertical, rtl } = options;
  const size = Number.isFinite(options.size) && options.size > 0 ? options.size : 0;
  const track = (vertical ? rect.height : rect.width) - size;
  // No track is a pane inside a closed `<details>`, a hidden tab panel, or the frame before
  // layout. Dividing by that zero is an `Infinity` that ends up in a `grid-template`.
  if (!(track > 0)) return 0;

  const along = (vertical ? y - rect.top : x - rect.left) - size / 2;
  const ratio = clamp(along / track, 0, 1);
  // The primary pane is the first child, and in a right-to-left page the first column is the
  // one on the right - so the pointer's distance from the left edge is the distance from the
  // far end of the track.
  return (!vertical && rtl ? 1 - ratio : ratio) * 100;
}

/**
 * `<splitter-elemental>` custom element.
 *
 * Two panes and a handle between them that resizes both: the
 * [APG Window Splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/),
 * over the two boxes you were going to write anyway.
 *
 * **The pattern has no reference example.** The APG page carries the roles, the states and the
 * keys, and where the example would be it says work on one is tracked by
 * [issue 130](https://github.com/w3c/aria-practices/issues/130). So the keyboard here is read
 * off the pattern's own prose rather than copied from a demo: arrows move the separator,
 * <kbd>Home</kbd> and <kbd>End</kbd> take the primary pane to the smallest and largest size it
 * is allowed, and <kbd>Enter</kbd> collapses it and puts it back.
 *
 * The first element child is the primary pane - the one `aria-valuenow` is about, the one
 * `aria-controls` names, and the one <kbd>Enter</kbd> collapses. The second is the other pane.
 * The handle is written between them, and it is the only node this element adds.
 *
 * **`vertical` is the panes' word, not the separator's, and the two are opposites.** Stacked
 * panes are split by a separator lying across the page, so `vertical` writes
 * `aria-orientation="horizontal"` - which is also the role's own default, and therefore the
 * value that is left off. The APG spends the word the other way round and calls the splitter
 * between a left and a right pane a vertical one; ARIA is describing the separator, this
 * element's attribute is describing the layout, and both are right about different things.
 *
 * `min` and `max` are the floor and the ceiling for everything - the pointer, the keys, and
 * <kbd>Enter</kbd> too. They are `aria-valuemin` and `aria-valuemax` verbatim, which is what
 * the pattern says those two properties are: the positions where the primary pane is at its
 * smallest and its largest. So a `min` above zero is an author saying the pane may not
 * disappear, and <kbd>Enter</kbd> takes it down to that floor rather than through it. The
 * pattern's collapse is what the default `min="0"` gives you.
 *
 * Percentages and nothing else. A `min-width` in pixels on a pane is a size this element
 * cannot see, and grid honours it while `aria-valuenow` goes on reporting the position that
 * was asked for - two numbers disagreeing about the same pane. The bound belongs on `min`.
 *
 * Light DOM, no shadow root. With no script it is two boxes in normal flow, in the order you
 * wrote them, and no handle - there is nothing to resize when there is nothing listening.
 *
 * ponytail: no persistence, no `localStorage`, no session key. `position` is reflected, so
 * saving it is `splitter.addEventListener('splitter-change', e => store(e.detail.position))`
 * and restoring it is an attribute in the markup - an element that owned a storage key would
 * be an element with an opinion about which one.
 *
 * ponytail: two panes, not n. Three panes is two splitters, and a splitter that shared its
 * neighbour's space would need a layout model of the whole row rather than of itself.
 *
 * @tag splitter-elemental
 * @attr {number} [position=50] - Where the separator sits, as a percentage of the track. Reflected, and written back as the handle is dragged.
 * @attr {number} [min=0] - How far the primary pane may shrink, as a percentage. The floor for the pointer, the arrows and <kbd>Enter</kbd> alike, and `aria-valuemin`.
 * @attr {number} [max=100] - How far it may grow. `aria-valuemax`.
 * @attr {boolean} [vertical=false] - The panes are stacked down the page rather than side by side. Swaps the arrow keys with them.
 * @attr {string} [label-text=Resize] - The handle's accessible name. The pattern asks for the separator to be named after the primary pane, so a page with a sidebar behind it says `label-text="Sidebar"`.
 *
 * `--splitter-elemental-position` is deliberately not tagged below. The element writes it into
 * its own `style` attribute, where an inline declaration beats any stylesheet - a knob for it
 * would be a control that cannot move anything. It is an output, and `position` is the input.
 *
 * @cssprop {<length>} [--splitter-elemental-size=24px] - The handle's thickness, and therefore the size of the target a pointer has to hit. `24px` is [WCAG 2.2 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)'s minimum rather than a taste; the theme draws a thinner line inside it.
 * @cssprop {<color>} [--splitter-elemental-color=currentcolor at 20%] - Theme. The line drawn down the middle of the handle.
 * @cssprop {<color>} [--splitter-elemental-active-color=currentcolor at 45%] - Theme. Its colour while the pointer is on the handle or the handle has focus.
 * @cssprop {<length>} [--splitter-elemental-line-size=1px] - Theme. How thick that line is. Not the target: the handle stays `--splitter-elemental-size` whatever this says.
 *
 * @slot - Two boxes. The first is the primary pane, the second is the other one; a third lands on a second grid row, under the primary pane and the width of it.
 *
 * @fires splitter-change - The separator has been moved and the gesture is over - a key press, or a pointer released. `detail.position` is where it landed. Deliberately not fired per frame of a drag: a pane that has to keep up with one is a pane with a `ResizeObserver` on it, which is the platform's own answer and does not go stale.
 */
export class SplitterElemental extends ElementBase {
  static get observedAttributes() {
    return ['position', 'min', 'max', 'vertical', 'label-text'];
  }

  /** The handle, `null` until there are two panes to put one between. */
  handle = null;

  /** Where the primary pane was before <kbd>Enter</kbd> collapsed it, so the second press has
   * somewhere to go. The middle until something else has been seen, rather than `min` - a
   * restore that put the pane back where it already was would read as a key that did nothing. */
  restorePosition = DEFAULT_POSITION;

  /** The pointer id of the drag in progress, `null` when there is none. Held so a second
   * finger arriving mid-drag is ignored rather than fighting the first. */
  pointerId = null;

  /** The writing direction as it was when the drag started. Read once per gesture: `direction`
   * is inherited, and re-reading it per frame is a style resolution inside a pointer handler. */
  dragRtl = false;

  /** Whether the drag in progress has moved the separator at all. A press that let go where it
   * landed changed nothing, and an event saying it did is one a listener would save to storage. */
  dragMoved = false;

  /** The panes: every element child that is not the handle. The handle is written between
   * them, so it has to come out of the count that decides where it goes. */
  get panes() {
    return Array.from(this.children).filter((child) => child !== this.handle);
  }

  /** Where the separator sits, clamped into `min`-`max`. The attribute is the state, so a
   * drag, a key and a page setting `position="30"` all arrive the same way. */
  get position() {
    const raw = this.getAttribute('position');
    const value = raw === null || raw.trim() === '' ? DEFAULT_POSITION : Number(raw);
    return clamp(value, this.min, this.max);
  }

  set position(value) {
    this.setAttribute('position', value);
  }

  /** How far the primary pane may shrink. */
  get min() {
    return clamp(Number(this.getAttribute('min')), 0, 100);
  }

  set min(value) {
    this.setAttribute('min', value);
  }

  /** How far it may grow. Floored at `min`, so a pair given the wrong way round is a splitter
   * that will not move rather than one whose clamp inverts. */
  get max() {
    const raw = this.getAttribute('max');
    const value = raw === null || raw.trim() === '' ? 100 : Number(raw);
    return clamp(value, this.min, 100);
  }

  set max(value) {
    this.setAttribute('max', value);
  }

  /** Whether the panes are stacked down the page. Reflected, so `[vertical]` is a styling
   * hook and the stylesheet needs nothing written for it. */
  get vertical() {
    return this.hasAttribute('vertical');
  }

  set vertical(value) {
    this.toggleAttribute('vertical', !!value);
  }

  /** The handle's accessible name. */
  get labelText() {
    return this.getAttribute('label-text') || 'Resize';
  }

  set labelText(value) {
    this.setAttribute('label-text', value);
  }

  connectedCallback() {
    if (this.initialized) return;

    // One pane is not half a splitter - there is nothing to take the space the other gives
    // up - so an element that has not got two of them is left exactly as it was written.
    //
    // **Not having them yet is the ordinary case, not the broken one.** A custom element is
    // upgraded the moment its opening tag is parsed, so a bundle included in `<head>` without
    // `defer` reaches every `<splitter-elemental>` on the page before a single child of it
    // exists - and bailing there for good is a script tag in the wrong place turning the
    // whole page's splitters into plain boxes, with nothing to say why. The parser is the
    // only thing that hands over children late; markup built any other way is complete before
    // it is ever connected, which is why one listener covers it and a `MutationObserver`
    // watching for a second child forever would not be earning its keep.
    if (this.panes.length < 2) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (this.isConnected) this.connectedCallback();
        }, { once: true });
      }
      return;
    }

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
    this.removeAttribute('data-splitter-panes');
    if (this.handle) {
      this.handle.removeEventListener('keydown', this.onKeyDown);
      this.handle.removeEventListener('pointerdown', this.onPointerDown);
      this.handle.remove();
      this.handle = null;
    }
    // The layout goes with the attribute above. The position is written here, and a custom
    // property left on a `<splitter-elemental>` nothing is driving is a number with no handle
    // to change it.
    this.style.removeProperty('--splitter-elemental-position');
  }

  attributeChangedCallback(name, previous, value) {
    if (!this.initialized || previous === value) return;
    if (name === 'label-text') this.handle.setAttribute('aria-label', this.labelText);
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
    if (!primary.id) primary.id = 'splitter-elemental-pane-' + (++paneCount);

    this.handle = document.createElement('div');
    this.handle.setAttribute('data-splitter-handle', '');
    this.handle.setAttribute('role', 'separator');
    this.handle.setAttribute('tabindex', '0');
    this.handle.setAttribute('aria-controls', primary.id);
    this.handle.setAttribute('aria-label', this.labelText);

    this.handle.addEventListener('keydown', this.onKeyDown);
    this.handle.addEventListener('pointerdown', this.onPointerDown);

    primary.after(this.handle);
    // The stylesheet's gate, and the reason it is not `:defined`: that one is true of every
    // `<splitter-elemental>` on the page from the moment the class is registered, including
    // one that was written with a single child and has no handle in it - and a grid of three
    // tracks over one box is that box squeezed into half the width for no reason it can see.
    // This says the panes are there, which is the thing the layout actually depends on.
    this.setAttribute('data-splitter-panes', '');
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
    this.style.setProperty('--splitter-elemental-position', `${round3(position)}`);

    if (this.vertical) this.handle.removeAttribute('aria-orientation');
    else this.handle.setAttribute('aria-orientation', 'vertical');
    this.handle.setAttribute('aria-valuemin', `${this.min}`);
    this.handle.setAttribute('aria-valuemax', `${this.max}`);
    this.handle.setAttribute('aria-valuenow', `${Math.round(position)}`);
    this.handle.setAttribute('aria-valuetext', `${Math.round(position)}%`);
  }

  /** Move the separator, and say so once the gesture that moved it is over. */
  moveTo(position, commit) {
    const next = clamp(position, this.min, this.max);
    if (next === this.position) return;
    this.position = round3(next);
    if (commit) this.dispatchEvent(new CustomEvent('splitter-change', {
      bubbles: true,
      detail: { position: this.position }
    }));
  }

  onKeyDown(event) {
    const intent = splitterKey(event.key, this.vertical, this.rtl());
    if (intent === null) return;
    event.preventDefault();

    if (intent === 'collapse') {
      // Collapsed is "as small as it is allowed to be", which is `min` and is `0` unless the
      // page said otherwise. Remembering the position before collapsing rather than on every
      // move is what makes a second Enter the undo of the first and not of the last drag.
      const collapsed = this.position <= this.min;
      if (!collapsed) this.restorePosition = this.position;
      this.moveTo(collapsed ? this.restorePosition : this.min, true);
      return;
    }

    const step = intent === 'shrink' ? -STEP : intent === 'grow' ? STEP : 0;
    if (intent === 'min') this.moveTo(this.min, true);
    else if (intent === 'max') this.moveTo(this.max, true);
    else this.moveTo(this.position + step, true);
  }

  /** Whether the layout runs right to left. Read per gesture rather than held: `direction` is
   * inherited, so an ancestor flipping it is a change no attribute on this element reports. */
  rtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  onPointerDown(event) {
    if (this.pointerId !== null) return;
    this.pointerId = event.pointerId;
    this.dragRtl = this.rtl();
    this.dragMoved = false;
    // Capture, so a pointer that outruns the handle - which it will, the handle being as wide
    // as it is - keeps reporting to the element that is following it rather than to whatever
    // it happens to be over.
    if (this.handle.setPointerCapture) this.handle.setPointerCapture(event.pointerId);
    this.handle.addEventListener('pointermove', this.onPointerMove);
    this.handle.addEventListener('pointerup', this.onPointerUp);
    this.handle.addEventListener('pointercancel', this.onPointerUp);
    // Not the page being scrolled, and not a selection being dragged across the two panes
    // either. It also takes the focus that a press on a control normally brings with it, so
    // the focus is put back by hand - a handle you have just dragged and cannot then nudge
    // with the arrow keys is the whole keyboard half of this pattern, lost to one line.
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
    // The last move has already been applied, so this announces where the handle ended up
    // rather than moving it again.
    this.dispatchEvent(new CustomEvent('splitter-change', {
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
      this.handle.removeEventListener('pointermove', this.onPointerMove);
      this.handle.removeEventListener('pointerup', this.onPointerUp);
      this.handle.removeEventListener('pointercancel', this.onPointerUp);
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
}

define('splitter-elemental', SplitterElemental);
