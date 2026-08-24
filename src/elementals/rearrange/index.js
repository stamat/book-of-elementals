// Aliased, because `drag` is this element's own attribute and the getter for it is below.
import { drag as startDrag } from 'book-of-spells/src/dom.mjs';
import { ElementBase, define } from '../../core.js';

/** What the buttons are named, and what the live region says. `{label}`, `{position}` and
 * `{total}` are filled in; anything else in the string is left exactly as written. */
export const DEFAULT_UP_TEXT = 'Move {label} up';
export const DEFAULT_DOWN_TEXT = 'Move {label} down';
export const DEFAULT_MOVED_TEXT = '{label} moved to position {position} of {total}';

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
  const text = (explicit ?? ownText(item)).replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
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
 * `<rearrange-elemental>` custom element.
 *
 * An `<ol>`, a `<ul>` or a `<table>` whose items the reader can rearrange by hand. You write the
 * markup; it writes the buttons.
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
 * ponytail: one axis, one container. No dragging between two of them, no columns, no nesting - a
 * second container is a second element's worth of drop-target semantics, and a kanban board is
 * not a smallest functional whole. Not to be put on a table that is also a
 * `<sortable-table-elemental>`: that one derives the order from a key in the cells and this one
 * is a hand order nothing derives, so a table wearing both has two answers to what order its
 * rows are in.
 *
 * @tag rearrange-elemental
 * @attr {boolean} drag - Also let a pointer drag the items, by a grip the element adds to each one. The buttons stay either way; this only adds to them.
 * @attr {string} [up-text=Move {label} up] - The first button's name. `{label}` is the item's.
 * @attr {string} [down-text=Move {label} down] - The second button's name.
 * @attr {string} [moved-text={label} moved to position {position} of {total}] - What the live region says after a move. `{label}`, `{position}` and `{total}`.
 *
 * @slot - One `<ol>`, `<ul>`, `<menu>` or `<table>` - a table's first `<tbody>` holds the items and its `<tr>`s are them. Each item gets the buttons; one marked `data-label` is announced by that instead of by its text, and one containing `data-rearrange-handle` is dragged by that instead of by a grip the element writes. A row's controls go in the cell marked `data-rearrange-cell`, or in its last cell.
 *
 * @cssprop {<length>} [--rearrange-elemental-control-size=1.75em] - Theme. Both axes of one button.
 * @cssprop {<length>} [--rearrange-elemental-gap=0.15em] - Theme. Between the grip and the buttons, and between the buttons.
 * @cssprop {<length>} [--rearrange-elemental-radius=0.3rem] - Theme. Button corners.
 * @cssprop {<color>} [--rearrange-elemental-color=currentcolor] - Theme. The arrows.
 * @cssprop {<color>} [--rearrange-elemental-hover=currentcolor at 8%] - Theme. Fill under the pointer.
 * @cssprop {<opacity>} [--rearrange-elemental-disabled-opacity=0.3] - Theme. The button at the end of its travel - the first item's up, the last item's down.
 * @cssprop {<color>} [--rearrange-elemental-grip=currentcolor at 45%] - Theme. The dots on the drag handle.
 * @cssprop {<shadow>} [--rearrange-elemental-lift=0 0.5rem 1rem currentcolor at 15%] - Theme. Under the item while it is being dragged.
 *
 * @fires rearrange-move - An item has landed somewhere new. `detail.item` is the `<li>`, `detail.from` where it was and `detail.to` where it is, both zero-based. One per drag, not one per item crossed.
 */
export class RearrangeElemental extends ElementBase {
  static get observedAttributes() {
    return ['drag', 'up-text', 'down-text', 'moved-text'];
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

  /**
   * What holds the items: the list, or a table's first `<tbody>`.
   *
   * A direct child either way, so a list inside one of the items is not mistaken for this one's.
   * The first `<tbody>` only - a table with several is using them to group, and moving a row
   * between groups would be rearranging the grouping away.
   */
  get container() {
    return this.querySelector(':scope > ol, :scope > ul, :scope > menu, :scope > table > tbody');
  }

  /** The items that move: the container's own children, never a nested list's. */
  get items() {
    const container = this.container;
    return container ? Array.from(container.querySelectorAll(':scope > li, :scope > tr')) : [];
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
    button.setAttribute('aria-keyshortcuts', direction === 'up' ? 'Alt+ArrowUp' : 'Alt+ArrowDown');
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
    const items = this.items;
    const total = items.length;
    items.forEach((item, index) => {
      const controls = this.controlsHost(item).querySelector(':scope > [data-rearrange-controls]');
      if (!controls) return;
      const label = itemLabel(item);

      for (const button of controls.querySelectorAll(':scope > [data-move]')) {
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
    });
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
    const from = this.place(item, to);
    if (from < 0) return false;
    this.report(item, from, this.items.indexOf(item));
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
    const items = this.items;
    const from = items.indexOf(item);
    if (from < 0 || to < 0 || to >= items.length || to === from) return -1;

    const before = to > from ? items[to].nextSibling : items[to];
    const focused = item.contains(document.activeElement) ? document.activeElement : null;
    // `moveBefore` moves the node instead of removing and re-inserting it, which is what keeps
    // focus, `:active`, a running animation and any iframe or media inside the item alive
    // across the move. Not Baseline yet - Chrome 133, and an Interop 2026 focus area - so the
    // fallback is the old pair, plus the one piece of that state this element can put back.
    const container = this.container;
    if (container.moveBefore) {
      try {
        container.moveBefore(item, before);
      } catch {
        container.insertBefore(item, before);
      }
    } else {
      container.insertBefore(item, before);
    }
    // The press that moved the item was on a button inside it, and the reader is still
    // pressing: focus goes back so the next press is the same press.
    if (focused && document.activeElement !== focused) focused.focus();

    this.refresh();
    return from;
  }

  /** Tell the reader and tell the page. Both halves in one place, so a drag can never announce
   * something a press would not. */
  report(item, from, to) {
    this.announce(format(this.movedText, {
      label: itemLabel(item),
      position: to + 1,
      total: this.items.length
    }));
    this.dispatchEvent(new CustomEvent('rearrange-move', {
      bubbles: true,
      detail: { item, from, to }
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
    const item = button.closest('li, tr');
    const index = this.items.indexOf(item);
    if (index < 0) return;
    this.move(item, index + (button.getAttribute('data-move') === 'up' ? -1 : 1));
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
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    const item = event.target.closest && event.target.closest('li, tr');
    const index = item && item.closest('rearrange-elemental') === this ? this.items.indexOf(item) : -1;
    if (index < 0) return;
    event.preventDefault();
    this.move(item, index + (event.key === 'ArrowUp' ? -1 : 1));
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
    const from = this.items.indexOf(item);
    if (from < 0) return;

    // Stops the compatibility mouse events, and with them the text selection a press on a grip
    // starts. Not what stops a touch scrolling: that is decided before this event exists, and it
    // is `touch-action: none` on the handle in index.scss.
    event.preventDefault();
    this.dragging = { item, handle, from, index: from, translate: 0, base: event.clientY };
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
    this.dragging.gesture = startDrag(event, { target: handle, callback: (d) => this.follow(d.clientY) });
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
    // The dragged item is not in the map: `dropIndex` counts the items it is not, and why is
    // written there. Which is also why nothing here undoes its transform.
    drag.boxes = this.items.filter((element) => element !== drag.item).map((element) => {
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
  follow(clientY) {
    const drag = this.dragging;
    if (!drag) return;

    const to = dropIndex(clientY, drag.boxes);
    if (to !== drag.index) {
      const was = drag.item.getBoundingClientRect().top;
      this.place(drag.item, to);
      drag.base += drag.item.getBoundingClientRect().top - was;
      drag.index = to;
      drag.translate = clientY - drag.base;
      this.measure();
    }
    drag.translate = clientY - drag.base;
    drag.item.style.transform = `translateY(${drag.translate}px)`;
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
      this.place(drag.item, drag.from);
      return;
    }
    const to = this.items.indexOf(drag.item);
    if (to !== drag.from) this.report(drag.item, drag.from, to);
  }
}

define('rearrange-elemental', RearrangeElemental);
