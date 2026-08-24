// Aliased, because `drag` is this element's own attribute and the getter for it is below.
import { drag as startDrag } from 'book-of-spells/src/dom.mjs';
import { ElementBase, define } from '../../core.js';

/** What the buttons are named, and what the live region says. `{label}`, `{position}` and
 * `{total}` are filled in; anything else in the string is left exactly as written. */
export const DEFAULT_UP_TEXT = 'Move {label} up';
export const DEFAULT_DOWN_TEXT = 'Move {label} down';
export const DEFAULT_MOVED_TEXT = '{label} moved to position {position} of {total}';
/** A board's two extra buttons, and what a crossing says. `{container}` is the column the item
 * lands in - never a direction, which is a word that means nothing to a reader who cannot see
 * the board. */
export const DEFAULT_TO_TEXT = 'Move {label} to {container}';
export const DEFAULT_MOVED_TO_TEXT = '{label} moved to {container}, position {position} of {total}';

/**
 * The fast keyboard path for each button, as `aria-keyshortcuts` says it.
 *
 * **Crossing asks for Shift, and that is not a preference.** `Alt+ArrowLeft` and
 * `Alt+ArrowRight` are Back and Forward in Chrome, Firefox and Edge, so a board advertising
 * them would be advertising a shortcut that leaves the page. Whether `preventDefault()` takes
 * them back is not the question - a shortcut a reader has to trust cannot be one the browser
 * spends elsewhere.
 */
export const SHORTCUTS = { up: 'Alt+ArrowUp', down: 'Alt+ArrowDown' };

/** Which move a vertical arrow is, once Alt is already held. */
const KEYS = { ArrowUp: 'up', ArrowDown: 'down' };

/**
 * Which column a sideways arrow means, which is not the one it points at.
 *
 * `prev` and `next` are the columns' order in the markup, and right to left that order runs the
 * other way across the screen - so the arrow the reader presses is the direction they see, and
 * this is where the two are reconciled. Same shape as `splitterKey`, for the same reason.
 *
 * @param {string} key
 * @param {boolean} rtl Whether the layout runs right to left.
 * @returns {'prev'|'next'|null}
 * @example
 * crossDirection('ArrowLeft', false) // => 'prev'
 * crossDirection('ArrowLeft', true) // => 'next'
 */
export function crossDirection(key, rtl) {
  if (key === 'ArrowLeft') return rtl ? 'next' : 'prev';
  if (key === 'ArrowRight') return rtl ? 'prev' : 'next';
  return null;
}

/**
 * What `aria-keyshortcuts` says on one button.
 *
 * The name of the key the reader would press, which right to left is the other arrow - a
 * shortcut advertised on a button and answered by nothing is worse than no shortcut at all.
 *
 * @param {'up'|'down'|'prev'|'next'} direction
 * @param {boolean} rtl
 * @returns {string}
 */
export function shortcutFor(direction, rtl) {
  if (direction !== 'prev' && direction !== 'next') return SHORTCUTS[direction];
  const left = crossDirection('ArrowLeft', rtl) === direction;
  return left ? 'Alt+Shift+ArrowLeft' : 'Alt+Shift+ArrowRight';
}

/**
 * Longest label the buttons and the announcement will carry.
 *
 * A list item is whatever the author put in it - a paragraph, a card, a whole form - and its
 * text goes into two button names and a live region on every move. Uncapped, one long item
 * turns the reader's rotor into a wall and every announcement into a recital. `data-label` is
 * the way to say it shorter and better.
 */
export const LABEL_MAX = 80;

/**
 * How long an announcement waits before it lands.
 *
 * Not a nicety: Alt+Arrow held down repeats, and a drag crosses several neighbours in a
 * second, so without this the region queues a sentence per crossing and the reader hears the
 * journey instead of the destination. 100ms is
 * [Primer's tested value](https://primer.style/accessibility/patterns/drag-and-drop/) for the
 * same problem, and one deliberate press never notices it.
 */
export const ANNOUNCE_MS = 100;

/** Which cell says what a row is: the row header a table already uses to identify it, and the
 * first cell in a table that has none. */
function namingCell(row) {
  return row.querySelector(':scope > th[scope="row"]') || row.querySelector(':scope > th, :scope > td') || row;
}

/** The text of an item, minus the parts that exist to rearrange it. */
function ownText(item) {
  // A row is named by one cell rather than by all of them: every cell run together is the whole
  // record read out before the word "up", once per button and again on every move.
  const source = item.tagName === 'TR' ? namingCell(item) : item;
  let text = '';
  for (const node of source.childNodes || []) {
    // Element nodes only can carry a marker, and it is the marker rather than the class that
    // is checked - a page restyling the controls may rename the class, and the label reading
    // back the words "Move Bananas up" would be this element eating its own tail. A handle is
    // skipped for the same reason from the other side: a grip is a glyph, and a glyph is not
    // part of what the item is called.
    const skip = node.nodeType === 1 && node.hasAttribute &&
      (node.hasAttribute('data-rearrange-controls') || node.hasAttribute('data-rearrange-handle'));
    if (skip) continue;
    text += node.textContent || '';
  }
  return text;
}

/**
 * What one item is called: `data-label` when the author said, otherwise its own text.
 *
 * This name lands in two buttons and every announcement, which is why the fallback is the
 * item's text rather than its position. "Move up" repeated down a list is a rotor full of
 * identical buttons and a reader with no way to tell which is which
 * ([WCAG 2.2 2.4.6](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html));
 * the item's own words are the only thing on the page that tells them apart.
 *
 * Cut at a word boundary when it is over the cap, and only when that boundary is not so early
 * that the label becomes a syllable - a 90-character item whose first space is at 3 would
 * otherwise be announced as "The…".
 *
 * @param {Element|null|undefined} item
 * @param {number} [max=LABEL_MAX]
 * @returns {string}
 * @example
 * itemLabel(li) // => 'Bananas' for <li>Bananas</li>
 */
export function itemLabel(item, max = LABEL_MAX) {
  if (!item) return '';
  const explicit = item.getAttribute ? item.getAttribute('data-label') : null;
  // `??` rather than `||`, so `data-label=""` is an author saying this item has no name worth
  // announcing rather than a value falsy enough to fall through to the text beside it.
  return shorten((explicit ?? ownText(item)).replace(/\s+/g, ' ').trim(), max);
}

/** Collapsed, trimmed and cut to the cap - at a word boundary when that boundary is not so early
 * that the name becomes a syllable, and a 90-character item whose first space is at 3 is
 * announced as "The…". */
function shorten(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * What one column is called: the heading it points at, or the name it carries.
 *
 * **A board's buttons are named by their destination, so this name is load-bearing.** "Move
 * right" is what every board on the web says and what no reader off the screen can use; the
 * column's own words are the only thing that says where the item is going. Which is also why an
 * unnamed column takes the cross buttons off the whole board rather than writing "Move Bananas
 * to " down one side of it.
 *
 * `aria-labelledby` before `aria-label`, and an `aria-labelledby` that resolves to nothing falls
 * through to `aria-label` - the order the accessible name is computed in, so the name in the
 * button is the name the reader hears on the list itself.
 *
 * @param {Element|null|undefined} container
 * @param {number} [max=LABEL_MAX]
 * @returns {string} Empty when the column has no name, which is the caller's problem to raise.
 * @example
 * containerLabel(list) // => 'Done' for <ul aria-labelledby="done"> under <h3 id="done">Done</h3>
 */
export function containerLabel(container, max = LABEL_MAX) {
  if (!container) return '';
  const ids = container.getAttribute('aria-labelledby');
  const document = container.ownerDocument;
  let text = '';
  if (ids && document) {
    text = ids.trim().split(/\s+/).map((id) => {
      const element = document.getElementById(id);
      return element ? element.textContent : '';
    }).join(' ');
  }
  if (!text.trim()) text = container.getAttribute('aria-label') || '';
  return shorten(text.replace(/\s+/g, ' ').trim(), max);
}

/**
 * Fill `{name}` placeholders from an object, leaving unknown ones alone.
 *
 * Unknown left alone rather than blanked, because these templates are the element's whole
 * translation surface and a typo that silently deletes half the sentence is a string nobody
 * can debug from the page. `{potition}` coming back as `{potition}` says where to look.
 *
 * `hasOwnProperty` through `call`, so a template asking for `{constructor}` gets its own text
 * back rather than the source of a function.
 *
 * @param {string} template
 * @param {object} values
 * @returns {string}
 * @example
 * format('Move {label} up', { label: 'Bananas' }) // => 'Move Bananas up'
 */
export function format(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole);
}

/**
 * Which position a drag is over, from the pointer and the boxes of the items it is not.
 *
 * By midpoint rather than by edge: an item is taken over as soon as the pointer is past the
 * half of it, which is what makes a drag between two items of different heights feel the same
 * in both directions. The answer is how many of the others the pointer has already passed the
 * middle of, which is the position the dragged item belongs at among them.
 *
 * **The dragged item's own box is left out, and that is what stops the flicker.** With it in,
 * the question is asked about a list the answer then rearranges: a short item crossing the
 * middle of a tall one swaps them, the swap slides the tall row up under the pointer, and the
 * same pointer position now reads as put it back - so the two trade places on every pointer
 * event for as long as the finger sits still, anywhere in the band between the two midpoints.
 * Counting only the others makes every position in that band a resting place, which is
 * hysteresis sized by the dragged item's own height rather than by a constant somebody has to
 * tune.
 *
 * Boxes are passed in rather than measured here - jsdom has no layout, and a sum that reads
 * the DOM cannot be tested anywhere but a browser.
 *
 * @param {number} y Pointer position, in client coordinates.
 * @param {Array<{top: number, height: number}>} boxes One per item *except* the dragged one, in current order.
 * @returns {number} A position in the whole list, the dragged item counted back in.
 * @example
 * dropIndex(30, [{ top: 0, height: 20 }, { top: 40, height: 20 }]) // => 1
 */
export function dropIndex(y, boxes) {
  let index = 0;
  while (index < boxes.length && y >= boxes[index].top + boxes[index].height / 2) index++;
  return index;
}

/**
 * Which column a pointer is over, from its position and the columns' boxes.
 *
 * **Sticky when it is over none of them**, which is what the gutter between two columns, the
 * heading above one and the whole page around the board all are. The alternative is a drag that
 * loses its column the moment the pointer clips a margin, and an item that jumps home from a gap
 * two pixels wide.
 *
 * Boxes are passed in rather than measured here, for `dropIndex`'s reason: jsdom has no layout,
 * so a sum that read `getBoundingClientRect` could only ever be tested in a browser.
 *
 * @param {number} x Pointer position, in client coordinates.
 * @param {number} y
 * @param {Array<{left: number, right: number, top: number, bottom: number}>} boxes One per column, in order.
 * @param {number} current The column the drag is in now, and the answer when the point is in none.
 * @returns {number}
 * @example
 * dropContainer(50, 10, [{ left: 0, right: 100, top: 0, bottom: 200 }], 0) // => 0
 */
export function dropContainer(x, y, boxes, current) {
  for (let index = 0; index < boxes.length; index++) {
    const box = boxes[index];
    if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return index;
  }
  return current;
}

/**
 * `<rearrange-elemental>` custom element.
 *
 * An `<ol>`, a `<ul>` or a `<table>` whose items the reader can rearrange by hand. You write the
 * markup; it writes the buttons. **Several named lists in one element is a board**, and every
 * item grows a button for the column on each side of it.
 *
 * There is no APG pattern for rearranging. The closest thing the APG has is its
 * [rearrangeable listbox example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/),
 * and what is borrowed from it is the part that is not the listbox: buttons that move an
 * option, `aria-keyshortcuts` naming the fast way to press them, focus staying on the button
 * that moved so the next press is the same press, and a live region confirming where the
 * thing landed. The listbox roles are deliberately not borrowed - a list of things you are
 * rearranging is a list, not a set of options you are choosing between, and `role="listbox"`
 * would tell the reader they are picking one.
 *
 * **The buttons are the element and dragging is the option, which is the whole design.** Every
 * pointer-drag library gets this backwards and then bolts a keyboard mode on the side;
 * [WCAG 2.2 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
 * (AA) names this exact case and asks for the opposite - *"a sortable list of elements may,
 * after tapping or clicking on a list element, provide adjacent controls for moving the
 * element up or down"*. Written this way round the criterion is met by construction: the
 * button path cannot be switched off, because `drag` only ever adds a second way to do what
 * the buttons already do.
 *
 * **Not the HTML drag and drop API.** It has no touch support at all, which is why every
 * library that uses it ships a fallback mode, and its ARIA half - `aria-grabbed`,
 * `aria-dropeffect` - was deprecated in ARIA 1.1 with nothing put in its place. Pointer
 * events, a captured pointer and a handle that says `touch-action: none` are what is left, and
 * they are the same three lines on a mouse, a pen and a finger.
 *
 * Light DOM, no shadow root. With no script it is your list, in the order it arrived, and no
 * buttons - which is a list, and a working page. Nothing is persisted: where the order is
 * kept is the page's business, and `rearrange-move` is where it hears about it.
 *
 * ponytail: no keyboard grab mode - no Space to pick up, arrows to move, Escape to drop. It is
 * a second way to do what the buttons do, it needs `role="application"` on the grabbed element
 * to take the arrow keys off the screen reader's own navigation, and a mode is a state both
 * the author and the reader have to hold. Alt+Arrow is the fast keyboard path without one.
 *
 * **A board crosses by button, and only by button.** Every drag library gets this backwards:
 * pointer first, keyboard bolted on, and the sideways move is the half that never arrives.
 * Written this way round, the destination is a named button on every card -
 * [Atlassian's own guidance](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines)
 * lands on the same answer from the other end, an action menu of movement outcomes, having
 * shipped the arrow-key version first. The buttons are named by the column they land in and
 * never by a direction: "move right" is a sentence that means nothing to a reader who cannot see
 * the board, which is why a column with no name takes the crossing off rather than writing one.
 *
 * A pointer crosses columns too, and it is the buttons that make that safe to add rather than
 * the other way round:
 * [WCAG 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) is satisfied
 * before the first drag event, so the gesture is an extra rather than the path.
 *
 * ponytail: no auto-scroll. A board wider than its viewport has to be scrolled by hand mid-drag,
 * which is the pointer's problem alone - both keyboard paths reach a column that is off screen
 * without one. A column with `overflow` other than `visible` clips a card dragged out of it, and
 * that is the page's own CSS to answer for. No nesting either: a column inside a column is a
 * second board's worth of questions.
 *
 * Not to be put on a table that is also a `<sortable-table-elemental>`: that one derives the
 * order from a key in the cells and this one is a hand order nothing derives, so a table wearing
 * both has two answers to what order its rows are in.
 *
 * @tag rearrange-elemental
 * @attr {boolean} drag - Also let a pointer drag the items, by a grip the element adds to each one. The buttons stay either way; this only adds to them.
 * @attr {string} [up-text=Move {label} up] - The first button's name. `{label}` is the item's.
 * @attr {string} [down-text=Move {label} down] - The second button's name.
 * @attr {string} [moved-text={label} moved to position {position} of {total}] - What the live region says after a move inside one list. `{label}`, `{position}` and `{total}`.
 * @attr {string} [to-text=Move {label} to {container}] - A board's cross-column buttons. `{label}` is the item's and `{container}` the column it would land in.
 * @attr {string} [moved-to-text={label} moved to {container}, position {position} of {total}] - What the live region says after a crossing. `{label}`, `{container}`, `{position}` and `{total}`.
 *
 * @slot - One `<ol>`, `<ul>`, `<menu>` or `<table>` - a table's first `<tbody>` holds the items and its `<tr>`s are them. Several of them, each named with `aria-labelledby` or `aria-label`, is a board whose columns are in the order they are written. Each item gets the buttons; one marked `data-label` is announced by that instead of by its text, and one containing `data-rearrange-handle` is dragged by that instead of by a grip the element writes. A row's controls go in the cell marked `data-rearrange-cell`, or in its last cell.
 *
 * @cssprop {<length>} [--rearrange-elemental-control-size=1.75em] - Theme. Both axes of one button.
 * @cssprop {<length>} [--rearrange-elemental-gap=0.15em] - Theme. Between the grip and the buttons, and between the buttons.
 * @cssprop {<length>} [--rearrange-elemental-radius=0.3rem] - Theme. Button corners.
 * @cssprop {<color>} [--rearrange-elemental-color=currentcolor] - Theme. The arrows.
 * @cssprop {<color>} [--rearrange-elemental-hover=currentcolor at 8%] - Theme. Fill under the pointer.
 * @cssprop {<opacity>} [--rearrange-elemental-disabled-opacity=0.3] - Theme. The button at the end of its travel - the first item's up, the last item's down.
 * @cssprop {<opacity>} [--rearrange-elemental-idle-opacity=1] - Theme. The controls when nothing points at the item or is focused inside it. `0` fades them in on hover and focus - and never on a touch screen, which has neither.
 * @cssprop {<color>} [--rearrange-elemental-grip=currentcolor at 45%] - Theme. The dots on the drag handle.
 * @cssprop {<shadow>} [--rearrange-elemental-lift=0 0.5rem 1rem currentcolor at 15%] - Theme. Under the item while it is being dragged.
 * @cssprop {<color>} [--rearrange-elemental-surface=Canvas] - Theme. What the dragged item is painted on, because it is passing over the ones it sat between. Re-point it on a card.
 *
 * @fires rearrange-move - An item has landed somewhere new. `detail.item` is the `<li>`, `detail.from` where it was and `detail.to` where it is, both zero-based and both counted in their own list; `detail.fromContainer` and `detail.toContainer` are the lists themselves, and `detail.sameContainer` is `false` when the item crossed a column. One per drag, not one per item crossed.
 */
export class RearrangeElemental extends ElementBase {
  static get observedAttributes() {
    return ['drag', 'up-text', 'down-text', 'moved-text', 'to-text', 'moved-to-text'];
  }

  /** Whether a pointer can drag as well as press. The buttons do not depend on it. */
  get drag() {
    return this.hasAttribute('drag');
  }

  set drag(on) {
    if (on) this.setAttribute('drag', '');
    else this.removeAttribute('drag');
  }

  get upText() {
    return this.getAttribute('up-text') || DEFAULT_UP_TEXT;
  }

  set upText(value) {
    this.setAttribute('up-text', value);
  }

  get downText() {
    return this.getAttribute('down-text') || DEFAULT_DOWN_TEXT;
  }

  set downText(value) {
    this.setAttribute('down-text', value);
  }

  get movedText() {
    return this.getAttribute('moved-text') || DEFAULT_MOVED_TEXT;
  }

  set movedText(value) {
    this.setAttribute('moved-text', value);
  }

  get toText() {
    return this.getAttribute('to-text') || DEFAULT_TO_TEXT;
  }

  set toText(value) {
    this.setAttribute('to-text', value);
  }

  get movedToText() {
    return this.getAttribute('moved-to-text') || DEFAULT_MOVED_TO_TEXT;
  }

  set movedToText(value) {
    this.setAttribute('moved-to-text', value);
  }

  /**
   * What holds the items: the lists, or the first `<tbody>` of each table.
   *
   * Direct children either way, so a list inside one of the items is not mistaken for one of
   * these. The first `<tbody>` of a table only - a table with several is using them to group,
   * and moving a row between groups would be rearranging the grouping away.
   *
   * **More than one is a board**, and there is nothing to switch on: two lists side by side is
   * what a board is, and an attribute saying so again would be a second place for the answer to
   * live.
   */
  get containers() {
    const found = Array.from(this.querySelectorAll(':scope > ol, :scope > ul, :scope > menu, :scope > table > tbody'));
    return found.filter((container) => container.tagName !== 'TBODY' || container === container.parentElement.tBodies[0]);
  }

  /** The first container. What a one-list element has always had, and where a drag starts. */
  get container() {
    return this.containers[0] || null;
  }

  /** The items of one container: its own children, never a nested list's. */
  itemsIn(container) {
    return container ? Array.from(container.querySelectorAll(':scope > li, :scope > tr')) : [];
  }

  /** Every item this element rearranges, in the order the page has them. One container's worth
   * unless it is a board. */
  get items() {
    return this.containers.flatMap((container) => this.itemsIn(container));
  }

  /** Which container an item is in, or `null` for one this element does not hold. */
  containerOf(item) {
    const parent = item && item.parentElement;
    return this.containers.indexOf(parent) < 0 ? null : parent;
  }

  /**
   * The columns a cross move can reach, each with the name its buttons will carry.
   *
   * Empty for a single list, and **empty for a board with an unnamed column** - the whole board,
   * not just that one. Half a row of named destinations and half of "Move Bananas to " is worse
   * than no crossing at all, because it reads as working; without it the page is still every
   * column tidying itself, which is a working page.
   *
   * The error is thrown a task later rather than logged, the way this book raises anything an
   * author has to fix: the browser's own uncaught-error report carries the stack, the file and
   * the line, where a `console.warn` would be a string that says less. Once per element, because
   * `refresh` runs on every move and a board is not something the reader can fix mid-drag.
   */
  get columns() {
    const containers = this.containers;
    if (containers.length < 2) return [];
    const labels = containers.map((container) => containerLabel(container));
    if (labels.some((label) => !label)) {
      if (!this.reportedUnnamed) {
        this.reportedUnnamed = true;
        setTimeout(() => {
          throw new Error('<rearrange-elemental>: a board needs a name on every list - aria-labelledby pointing at its heading, or aria-label. One without a name leaves nothing to write in the buttons that move an item to it, so none are written.');
        });
      }
      return [];
    }
    return containers.map((container, index) => ({ container, label: labels[index] }));
  }

  /**
   * Where an item's controls go: the item itself, and for a table row one of its cells.
   *
   * A `<span>` between two `<td>`s is not something table layout has anywhere to put - the
   * parser fosters it out of the table entirely, and a node appended through the DOM instead
   * lands in an anonymous cell of its own that widens the row by a column nothing declared. The
   * last cell is the default because it needs no `<th>` adding to the header; `data-rearrange-cell`
   * is how a table that keeps a column for this says which one.
   */
  controlsHost(item) {
    if (item.tagName !== 'TR') return item;
    const marked = item.querySelector(':scope > [data-rearrange-cell]');
    if (marked) return marked;
    const cells = item.querySelectorAll(':scope > td, :scope > th');
    return cells[cells.length - 1] || item;
  }

  /** The live region. Added at upgrade, because a live region only announces text that lands
   * in one already in the document. */
  get status() {
    return this.querySelector(':scope > .rearrange-elemental-status');
  }

  connectedCallback() {
    if (this.initialized) return;
    // Before the flag: a list rendered into this element later is upgraded when it is next
    // connected, rather than being marked done with nothing to rearrange.
    if (!this.container) return;

    this.initialized = true;
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDragKey = this.onDragKey.bind(this);
    this.onDragScroll = this.onDragScroll.bind(this);

    // One listener each on the element rather than a pair per button: the buttons come and go
    // with the items, and a list that grew by ten rows would otherwise be ten pairs to attach
    // and ten to remember to take off again.
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('pointerdown', this.onPointerDown);
    this.update();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;
    this.endDrag(false);
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('pointerdown', this.onPointerDown);
    clearTimeout(this.announceTimer);

    // Everything this element wrote comes back out. A move in the DOM is a disconnect and a
    // connect, so controls left behind here would be a second set appended on the way back in.
    // The author's own handle is not ours to remove and is left where it was.
    for (const controls of this.querySelectorAll('[data-rearrange-controls]')) {
      if (controls.closest('rearrange-elemental') === this) controls.remove();
    }
    const status = this.status;
    if (status) status.remove();
  }

  attributeChangedCallback(name, previous, value) {
    if (!this.initialized || previous === value) return;
    // A drag in flight when dragging is switched off is put back where it started: the reader
    // is holding an item the element has just stopped being able to move.
    if (name === 'drag' && !this.drag) this.endDrag(true);
    this.refresh();
  }

  /**
   * Give every item its controls, and bring the names and the ends of travel up to date.
   *
   * ponytail: called at upgrade and on demand, with no observer behind it. Items that arrive
   * from a render after that call `.update()`; a `MutationObserver` over the list is the
   * upgrade if that turns out to be the common case rather than the rare one.
   */
  update() {
    if (!this.initialized) return;
    if (!this.status) {
      const status = document.createElement('p');
      status.className = 'rearrange-elemental-status';
      // `status` rather than `alert`: the reader pressed the button and is not being
      // interrupted with the result, so it waits for a gap in what is already being read.
      status.setAttribute('role', 'status');
      this.append(status);
    }
    for (const item of this.items) this.controlsFor(item);
    this.refresh();
  }

  /** The controls for one item, made if they are not there yet. */
  controlsFor(item) {
    const host = this.controlsHost(item);
    let controls = host.querySelector(':scope > [data-rearrange-controls]');
    if (controls) return controls;

    controls = document.createElement('span');
    controls.className = 'rearrange-elemental-controls';
    controls.setAttribute('data-rearrange-controls', '');
    controls.append(this.moveButton('up'), this.moveButton('down'));
    host.append(controls);
    return controls;
  }

  /**
   * One move button.
   *
   * **The name is the visible text, not an `aria-label` over an icon.** A button labelled
   * "Up" on the screen and "Move Bananas up" to the accessibility tree is
   * [WCAG 2.2 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)
   * failed, and a reader speaking to their computer cannot say a name that is not written
   * anywhere. The theme clips the span and draws an arrow over it, which leaves the name where
   * it was; with no theme loaded the button reads what it does, which is a working control
   * rather than an empty box.
   */
  moveButton(direction) {
    const button = document.createElement('button');
    // A button in a form submits it unless told otherwise, and a list that posts the page away
    // when you tidy it is not a list you tidy twice.
    button.type = 'button';
    button.className = 'rearrange-elemental-move';
    button.setAttribute('data-move', direction);
    if (SHORTCUTS[direction]) button.setAttribute('aria-keyshortcuts', SHORTCUTS[direction]);
    const label = document.createElement('span');
    label.className = 'rearrange-elemental-label';
    button.append(label);
    return button;
  }

  /** The item's drag handle - the author's if they wrote one, ours if `drag` is set. Nested
   * lists have their own element, so a handle belonging to one is not taken for this one's. */
  handleFor(item) {
    const found = item.querySelector('[data-rearrange-handle]');
    return found && found.closest('rearrange-elemental') === this ? found : null;
  }

  /** Names on the buttons, ends of travel marked, handles present or gone. Cheap enough to run
   * on every move: the labels are read from the DOM each time, because the DOM is where the
   * page may have just changed them. */
  refresh() {
    const columns = this.columns;
    // Read once for the whole pass rather than per button: it is a style resolution, and the
    // answer cannot differ between two items of the same element.
    const rtl = columns.length > 0 && getComputedStyle(this).direction === 'rtl';
    this.containers.forEach((container, column) => {
      const items = this.itemsIn(container);
      const total = items.length;
      items.forEach((item, index) => this.refreshItem(item, {
        index,
        total,
        rtl,
        // Undefined at either end of the board, which is how the cross buttons there come off:
        // there is no destination to name, and a button whose name cannot be written is not one.
        prev: columns[column - 1],
        next: columns[column + 1]
      }));
    });
  }

  /** One item's controls brought up to date: the names, the ends of travel, the way across, and
   * the handle. */
  refreshItem(item, { index, total, rtl, prev, next }) {
    const controls = this.controlsHost(item).querySelector(':scope > [data-rearrange-controls]');
    if (!controls) return;
    const label = itemLabel(item);

    for (const button of controls.querySelectorAll(':scope > [data-move="up"], :scope > [data-move="down"]')) {
      const up = button.getAttribute('data-move') === 'up';
      button.querySelector('.rearrange-elemental-label').textContent =
        format(up ? this.upText : this.downText, { label });
      // **`aria-disabled`, never `disabled`.** A button that becomes disabled under the
      // focus that is on it drops that focus to `<body>`, so a reader walking an item to the
      // top of the list arrives there and is nowhere - which is the one moment they most
      // need to be told where they are. Left focusable, left named, and the press does
      // nothing.
      if (up ? index === 0 : index === total - 1) button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
    }

    this.crossFor(controls, label, prev, 'prev', rtl);
    this.crossFor(controls, label, next, 'next', rtl);

    let handle = this.handleFor(item);
    if (!this.drag) {
      // Only ours goes. An author's handle is markup they wrote, and an element that deleted
      // it would be taking away a thing the page may have styled and laid out around.
      if (handle && handle.hasAttribute('data-rearrange-own')) handle.remove();
      return;
    }
    if (!handle) {
      handle = document.createElement('span');
      handle.className = 'rearrange-elemental-handle';
      handle.setAttribute('data-rearrange-handle', '');
      handle.setAttribute('data-rearrange-own', '');
      // Nothing to announce and nothing to focus: it is the pointer's way in, and the
      // keyboard's way in is the two buttons beside it. A focusable control that does
      // nothing when you press it is worse than no control at all.
      handle.setAttribute('aria-hidden', 'true');
      controls.prepend(handle);
    }
  }

  /**
   * The button that takes an item to the column beside it, made, named or taken away.
   *
   * Placed against the up button rather than prepended, so the row reads the way the board looks
   * - grip, back, up, down, on - however many passes it takes to get there and whether or not
   * there is a handle in front of it yet.
   */
  crossFor(controls, label, column, direction, rtl) {
    let button = controls.querySelector(`:scope > [data-move="${direction}"]`);
    if (!column) {
      if (button) button.remove();
      return;
    }
    if (!button) {
      button = this.moveButton(direction);
      if (direction === 'prev') controls.insertBefore(button, controls.querySelector(':scope > [data-move="up"]'));
      else controls.append(button);
    }
    // Named here rather than at creation, because both the column beside this one and the way
    // the page runs can change under an element that is already upgraded.
    button.setAttribute('aria-keyshortcuts', shortcutFor(direction, rtl));
    button.querySelector('.rearrange-elemental-label').textContent =
      format(this.toText, { label, container: column.label });
  }

  /**
   * Move an item to a position, and say so.
   *
   * @param {Element} item
   * @param {number} to Zero-based, in the list as it is now. Out of range is a no-op, which is
   *   what the first item's up and the last item's down are.
   * @returns {boolean} Whether anything moved.
   */
  move(item, to) {
    const container = this.containerOf(item);
    const from = this.place(item, to);
    if (from < 0) return false;
    this.report(item, from, this.itemsIn(container).indexOf(item), container, container);
    return true;
  }

  /**
   * Take an item to another column, at the place it already held.
   *
   * **The position is kept and clamped, not reset to the end.** A press does one thing: the
   * reader who moves a card sideways asked for a column, not for a column and a trip to the
   * bottom of it - and a column shorter than the place they held is the only reason to land
   * anywhere else, which is its end.
   *
   * The focus is the other half. The button pressed at the far end of the board is a button that
   * no longer has a column to point at, so it goes - and focus with it, down to `<body>`, at the
   * one moment the reader is mid-sequence. The mirror button always exists (a board has at least
   * two columns, so leaving one always arrives somewhere with a way back) and it is the press
   * that undoes this one, which makes it the honest place to land.
   *
   * @param {Element} item
   * @param {Element} container One of this element's, and not the one the item is in.
   * @returns {boolean} Whether anything moved.
   */
  moveTo(item, container) {
    const from = this.containerOf(item);
    if (!from || !container || from === container) return false;
    const index = this.itemsIn(from).indexOf(item);
    if (index < 0) return false;

    const landing = this.itemsIn(container);
    const to = Math.min(index, landing.length);
    const focused = item.contains(document.activeElement) ? document.activeElement : null;
    const pressed = focused ? focused.getAttribute('data-move') : null;

    this.insert(container, item, landing[to] || null);
    this.refresh();

    if (focused && !focused.isConnected) {
      const back = this.controlsHost(item)
        .querySelector(`:scope > [data-rearrange-controls] > [data-move="${pressed === 'next' ? 'prev' : 'next'}"]`);
      if (back) back.focus();
    } else if (focused && document.activeElement !== focused) {
      focused.focus();
    }

    this.report(item, index, to, from, container);
    return true;
  }

  /**
   * The DOM half of a move, with nothing announced and nothing dispatched.
   *
   * Apart from `move`, because a drag crosses several positions on the way to one landing: the
   * page wants one event describing where the item ended up, not one per item passed over, and
   * a server told about each of them is a drag that costs six requests.
   *
   * @returns {number} Where the item was, or `-1` if it did not move.
   */
  place(item, to) {
    const container = this.containerOf(item);
    const items = this.itemsIn(container);
    const from = items.indexOf(item);
    if (from < 0 || to < 0 || to >= items.length || to === from) return -1;

    const before = to > from ? items[to].nextSibling : items[to];
    const focused = item.contains(document.activeElement) ? document.activeElement : null;
    this.insert(container, item, before);
    // The press that moved the item was on a button inside it, and the reader is still
    // pressing: focus goes back so the next press is the same press.
    if (focused && document.activeElement !== focused) focused.focus();

    this.refresh();
    return from;
  }

  /**
   * Put a node somewhere, by the best means the browser has.
   *
   * `moveBefore` moves the node instead of removing and re-inserting it, which is what keeps
   * focus, `:active`, a running animation and any iframe or media inside the item alive across
   * the move. Not Baseline yet - Chrome 133, and an Interop 2026 focus area - so the fallback is
   * the old pair, plus the one piece of that state this element can put back.
   *
   * One place for both moves: a crossing is the same node question as a re-order, and a second
   * copy of this is a second place for the fallback to be forgotten.
   */
  insert(container, item, before) {
    if (container.moveBefore) {
      try {
        container.moveBefore(item, before || null);
        return;
      } catch {
        // Falls through: `moveBefore` throws where the old pair still works.
      }
    }
    container.insertBefore(item, before || null);
  }

  /** Tell the reader and tell the page. Both halves in one place, so a drag can never announce
   * something a press would not. */
  report(item, from, to, fromContainer, toContainer) {
    // A crossing and a re-order are different sentences, not one sentence with a column bolted
    // on: "moved to position 2 of 3" is the whole truth for a list, and a board that said it
    // would have moved an item to a column without naming it.
    const across = fromContainer !== toContainer;
    this.announce(format(across ? this.movedToText : this.movedText, {
      label: itemLabel(item),
      container: containerLabel(toContainer),
      position: to + 1,
      total: this.itemsIn(toContainer).length
    }));
    // Derived rather than left to the page: comparing two nodes is the one line of this every
    // listener would otherwise write, and `from` and `to` mean nothing on their own once a board
    // can move an item to position 1 of a different column.
    this.dispatchEvent(new CustomEvent('rearrange-move', {
      bubbles: true,
      detail: { item, from, to, fromContainer, toContainer, sameContainer: !across }
    }));
  }

  /**
   * Say something in the live region.
   *
   * Cleared first and set back in a later task, because a live region announces a *change* and
   * the same sentence written twice running is no change at all - which is what an item moved
   * up and then down again would be.
   */
  announce(message) {
    const status = this.status;
    if (!status) return;
    status.textContent = '';
    clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => { status.textContent = message; }, ANNOUNCE_MS);
  }

  onClick(event) {
    const button = event.target.closest && event.target.closest('[data-move]');
    if (!button || button.closest('rearrange-elemental') !== this) return;
    if (button.getAttribute('aria-disabled') === 'true') return;
    this.press(button.closest('li, tr'), button.getAttribute('data-move'));
  }

  /** One press, whichever control it arrived from. The buttons and the shortcuts are the same
   * four moves, and a second copy of this is where the two would drift apart. */
  press(item, direction) {
    const container = this.containerOf(item);
    if (!container) return;
    if (direction === 'up' || direction === 'down') {
      const index = this.itemsIn(container).indexOf(item);
      if (index < 0) return;
      this.move(item, index + (direction === 'up' ? -1 : 1));
      return;
    }
    // Through `columns` rather than straight to the neighbour, so the shortcut is off wherever
    // the buttons are: a board with an unnamed column has no crossing, by either route.
    const columns = this.columns;
    const index = columns.findIndex((column) => column.container === container);
    const landing = columns[index + (direction === 'prev' ? -1 : 1)];
    if (index < 0 || !landing) return;
    this.moveTo(item, landing.container);
  }

  /**
   * Alt+Arrow, from anywhere in the item.
   *
   * The fast path the APG's rearrangeable listbox names, and the reason focus stays on the
   * button after a move: an item three places from where it belongs is three presses of one
   * key, not three round trips through the tab order. Announced on the buttons with
   * `aria-keyshortcuts`, which is how a reader finds out it exists.
   */
  onKeyDown(event) {
    if (!event.altKey) return;
    // Sideways asks for Shift as well, because Alt and a sideways arrow is the browser's Back
    // and Forward - see `SHORTCUTS`.
    const direction = KEYS[event.key] ||
      (event.shiftKey ? crossDirection(event.key, getComputedStyle(this).direction === 'rtl') : null);
    if (!direction) return;
    const item = event.target.closest && event.target.closest('li, tr');
    if (!item || item.closest('rearrange-elemental') !== this || !this.containerOf(item)) return;
    event.preventDefault();
    this.press(item, direction);
  }

  /**
   * Take hold of an item.
   *
   * The gesture is `drag()` from book-of-spells, started from the `pointerdown` already in hand -
   * the shape that lets one delegated listener serve a list whose rows come and go, rather than
   * an instance per handle re-made every time the list grows one. What it owns is the pointer:
   * the capture, the `pointercancel` path, and the move listeners on the *document* rather than
   * on the handle, which is what keeps a drag alive across the `insertBefore` fallback in
   * `place` - a captured element loses its capture the moment it is disconnected, and
   * `insertBefore` disconnects before it re-inserts.
   *
   * What stays here is this element's rather than a gesture helper's: the box map, the
   * re-basing, Escape, and where the item lands.
   */
  onPointerDown(event) {
    if (!this.drag || this.dragging || event.button !== 0) return;
    const handle = event.target.closest && event.target.closest('[data-rearrange-handle]');
    if (!handle || handle.closest('rearrange-elemental') !== this) return;
    const item = handle.closest('li, tr');
    const container = this.containerOf(item);
    const from = this.itemsIn(container).indexOf(item);
    if (from < 0) return;

    // Stops the compatibility mouse events, and with them the text selection a press on a grip
    // starts. Not what stops a touch scrolling: that is decided before this event exists, and it
    // is `touch-action: none` on the handle in index.scss.
    event.preventDefault();
    // `container` is where the drag *started*, which is what Escape puts the item back into and
    // what the event reports as `fromContainer`; `column` is where it is now.
    this.dragging = {
      item,
      handle,
      container,
      column: this.containers.indexOf(container),
      from,
      index: from,
      translate: 0,
      translateX: 0,
      base: event.clientY,
      baseX: event.clientX
    };
    this.dataset.dragging = '';
    item.dataset.dragging = '';
    this.measure();

    // Neither event bubbles, so both are heard on the handle itself, and both come off again in
    // `endDrag` - the one place this element already lets go of everything.
    handle.addEventListener('dragend', this.onDragEnd);
    handle.addEventListener('dragcancel', this.onDragEnd);
    // On the document and in the capture phase: the pointer has the focus, not the keyboard, so
    // there is no element on the way to this one that Escape would otherwise reach first.
    document.addEventListener('keydown', this.onDragKey, true);
    // Client coordinates move under a scroll, so a box map measured before one is a map of where
    // the items were. Capturing, because the thing that scrolled may be a pane inside the page
    // rather than the page. The alternative is measuring per pointer event, which is the cost
    // this whole cache exists to avoid.
    document.addEventListener('scroll', this.onDragScroll, true);

    // Last, because it dispatches `dragstart` before it returns: everything above is the state
    // that a listener on that event would find, and a gesture handed a half-built drag is one
    // that reports a move against a box map nobody measured.
    this.dragging.gesture = startDrag(event, { target: handle, callback: (d) => this.follow(d.clientX, d.clientY) });
  }

  /**
   * Where every item is, once, for the drag in progress.
   *
   * **Measured on the way in and again after each change of places, never per pointer event.** A
   * pointer reports faster than the screen refreshes, and `getBoundingClientRect` inside a
   * handler that has just written a transform forces layout every time it is asked - so the
   * naive loop is a forced layout per item per event. Between two crossings nothing here moves,
   * which is what makes the cache correct rather than merely cheaper.
   */
  measure() {
    const drag = this.dragging;
    if (!drag) return;
    drag.boxes = this.boxesIn(this.containers[drag.column]);
    // The columns themselves, so the crossing is a hit test rather than a second pass over every
    // item on the board. Re-measured with the items, because a scroll moves both.
    drag.columnBoxes = this.containers.map((container) => {
      const rect = container.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
  }

  /** Where the items of one column are, minus the one in hand. The dragged item is not in the map:
   * `dropIndex` counts the items it is not, and why is written there. Which is also why nothing
   * here undoes its transform. */
  boxesIn(container) {
    const item = this.dragging ? this.dragging.item : null;
    return this.itemsIn(container).filter((element) => element !== item).map((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });
  }

  onDragScroll() {
    this.measure();
  }

  /**
   * Follow the pointer, and change places on the way.
   *
   * The item is translated to stay under the finger *and* moved in the DOM as it passes its
   * neighbours - so what the reader is dragging is the real item in its real position, and
   * letting go is not a separate animation that has to land somewhere.
   *
   * The re-basing is the part that is easy to miss: moving the item in the DOM changes where
   * layout puts it, so the same translate would jump it by a row. The two rects either side of
   * the move differ by exactly that layout shift, and adding it to the origin cancels it out.
   */
  follow(clientX, clientY) {
    const drag = this.dragging;
    if (!drag) return;

    const column = dropContainer(clientX, clientY, drag.columnBoxes, drag.column);
    if (column !== drag.column) {
      // Measured against the column being entered rather than the one being left, so the item
      // lands where the pointer is among the items already there - an empty column has no boxes
      // and no midpoints, which is `dropIndex`'s zero and the only place a first card can go.
      const container = this.containers[column];
      const to = dropIndex(clientY, this.boxesIn(container));
      this.rebase(drag, () => {
        this.insert(container, drag.item, this.itemsIn(container)[to] || null);
        // The buttons are named by the column they would go to next, and this item is in a new
        // one - at the end of a board that is a button appearing or going away.
        this.refresh();
      });
      drag.column = column;
      drag.index = to;
      this.measure();
    } else {
      const to = dropIndex(clientY, drag.boxes);
      if (to !== drag.index) {
        this.rebase(drag, () => this.place(drag.item, to));
        drag.index = to;
        this.measure();
      }
    }

    drag.translate = clientY - drag.base;
    drag.translateX = clientX - drag.baseX;
    drag.item.style.transform = `translate(${drag.translateX}px, ${drag.translate}px)`;
  }

  /**
   * Move the item in the DOM without the pointer feeling it.
   *
   * Moving the item changes where layout puts it, so the same translate would jump it by a row -
   * or, across columns, by a column. The two rects either side of the move differ by exactly that
   * layout shift, and adding it to the origin cancels it out. Both axes, because a crossing moves
   * it sideways as well.
   */
  rebase(drag, move) {
    const was = drag.item.getBoundingClientRect();
    move();
    const now = drag.item.getBoundingClientRect();
    drag.base += now.top - was.top;
    drag.baseX += now.left - was.left;
  }

  /**
   * The end of the gesture, either way it ended.
   *
   * A `dragcancel` is the platform taking the gesture away - a scroll it decided was one, a call
   * arriving - and not the reader letting go. Putting the item back is the only honest reading
   * of a gesture that never finished.
   *
   * Both names are the native drag and drop API's too, and the native ones bubble - an `<img>`
   * inside an author's own handle is draggable without being asked. book-of-spells sends an
   * object as `detail`; a native `dragend` carries the number `UIEvent` gives it, which is what
   * tells the two apart before this ends a drag nobody started.
   */
  onDragEnd(event) {
    if (!event.detail || typeof event.detail !== 'object') return;
    this.endDrag(event.type === 'dragcancel');
  }

  onDragKey(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.endDrag(true);
  }

  /**
   * Let go of whatever is being dragged.
   *
   * @param {boolean} cancel Put the item back where the drag started, and say nothing.
   */
  endDrag(cancel) {
    const drag = this.dragging;
    if (!drag) return;
    this.dragging = null;

    document.removeEventListener('keydown', this.onDragKey, true);
    document.removeEventListener('scroll', this.onDragScroll, true);
    drag.handle.removeEventListener('dragend', this.onDragEnd);
    drag.handle.removeEventListener('dragcancel', this.onDragEnd);
    // Releases the capture and takes the document listeners off, and dispatches nothing doing
    // it - which is what stops an Escape coming back through `onDragEnd` as a second ending.
    if (drag.gesture) drag.gesture.destroy();

    drag.item.style.transform = '';
    delete drag.item.dataset.dragging;
    delete this.dataset.dragging;

    if (cancel) {
      // Back into the column it was picked up from, at the place it held there - not `place`,
      // which counts inside whatever column the drag has wandered into by now.
      const others = this.itemsIn(drag.container).filter((element) => element !== drag.item);
      this.insert(drag.container, drag.item, others[drag.from] || null);
      this.refresh();
      return;
    }
    const container = this.containerOf(drag.item);
    const to = this.itemsIn(container).indexOf(drag.item);
    if (to !== drag.from || container !== drag.container) {
      this.report(drag.item, drag.from, to, drag.container, container);
    }
  }
}

define('rearrange-elemental', RearrangeElemental);
