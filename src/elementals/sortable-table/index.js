import { ElementBase, define } from '../../core.js';

/** What the caption says about the buttons, when the page does not say it itself. */
export const DEFAULT_NOTE = 'Column headers with a button sort the table by that column.';

/**
 * The key a cell sorts by: what the author put in `data-sort-value`, or the text in the cell.
 *
 * The attribute is the escape hatch and it is the only one, because it is the only one that
 * can be right. A date reads `3 Aug 2026` and sorts by `2026-08-03`; a price reads `$1,200`
 * and sorts by `1200` - the collator below is numeric-aware, but `$1,200` against `$900`
 * compares `$1` against `$9` and puts the larger first, which is the bug every home-made
 * table sorter ships.
 *
 * `??` rather than `||`, so `data-sort-value=""` is an author saying this cell sorts as empty
 * rather than a value falsy enough to fall through to the text beside it.
 *
 * @param {Element|null|undefined} cell
 * @returns {string}
 * @example
 * sortKey(cell) // => '2026-08-03' for <td data-sort-value="2026-08-03">3 Aug 2026</td>
 */
export function sortKey(cell) {
  if (!cell) return '';
  const explicit = cell.getAttribute ? cell.getAttribute('data-sort-value') : null;
  return explicit ?? (cell.textContent || '').trim();
}

/**
 * The order a list of keys sorts into, as indices into the list.
 *
 * Indices rather than the sorted keys, because what is being reordered is rows and the keys
 * are only what they are being ordered by.
 *
 * **Stable, by carrying the original index into the tiebreak.** `Array.prototype.sort` is
 * required to be stable since ES2019 and every target here is, but the stability that matters
 * is across *repeated* sorts: sort by name, then by size, and the rows within one size are
 * expected to still be in name order. That only holds if equal keys never move, which the
 * tiebreak is what guarantees rather than what the engine happens to do.
 *
 * @param {string[]} keys
 * @param {boolean} descending
 * @param {{compare: function}} [collator] Anything with a `compare(a, b)`; `Intl.Collator` in
 *   the browser, and injectable so the ordering can be tested without one.
 * @returns {number[]}
 * @example
 * sortOrder(['b', 'a', 'c'], false) // => [1, 0, 2]
 */
export function sortOrder(keys, descending, collator) {
  const compare = collator ? (a, b) => collator.compare(a, b) : (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  return keys
    .map((key, index) => ({ key, index }))
    .sort((a, b) => {
      const by = compare(a.key, b.key);
      if (by !== 0) return descending ? -by : by;
      return a.index - b.index;
    })
    .map((entry) => entry.index);
}

/**
 * `<sortable-table-elemental>` custom element.
 *
 * A `<table>` whose column headers sort it. You write the table; it writes the buttons.
 *
 * There is no APG pattern here, because `<table>` already is one - the roles, the row and
 * column relationships and the header associations are all the element's own, and nothing here
 * replaces any of them. What this adds is the one thing the markup has no way to say, and it is
 * exactly what the APG's
 * [sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)
 * describes: the header text wrapped in a `<button>`, `aria-sort` on the column that is sorted,
 * and a note in the `<caption>` saying what the buttons do - once, rather than repeated into
 * every button's name, which is that example's own reasoning and the reason the buttons here are
 * named by their header text and nothing else.
 *
 * **There is no live region, and that is a decision rather than an omission.** The example this
 * follows has none, and the reason it needs none is that the rows reordering *is* the result of
 * pressing the button, not a message about it -
 * [WCAG 2.2 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) is written
 * for changes that happen without a control being operated. `aria-sort` is where the state
 * lives, on the column header, which is where a reader goes to find it.
 *
 * **The markup's `aria-sort` is believed rather than re-sorted.** A table that arrives already
 * ordered was ordered by the server, possibly by a key that is not in the DOM at all - so an
 * element that re-sorted it on upgrade would silently reorder correct data. It adopts the state
 * and leaves the rows alone; `data-sort-value` is how a page makes the two agree.
 *
 * Light DOM, no shadow root. With no script it is your table, sorted however it arrived, and no
 * buttons - which is a table, and a working page.
 *
 * ponytail: one comparator, no `type` attribute. `Intl.Collator` with `numeric: true` puts
 * `item 2` before `item 10` and `9` before `100` without being told which column is which, and
 * an ISO date sorts correctly as text. What it cannot do - a currency symbol, a thousands
 * separator, a date written for humans - is `data-sort-value`, which one attribute covers and a
 * column-type vocabulary would cover worse.
 *
 * ponytail: no multi-column sort, no sort-on-load, no persistence, no paging. A second sort key
 * is a comparator the markup has nowhere to put, and the rest are a data grid.
 *
 * @tag sortable-table-elemental
 * @attr {string} [note-text=Column headers with a button sort the table by that column.] - The sentence appended to the `<caption>`, off screen, explaining what the header buttons are. Set it to say it in your language, or to say it differently.
 *
 * @slot - One `<table>`, with a `<thead>`. A `<th>` marked `data-sort="none"` keeps its text and gets no button; a `<td>` or `<th>` in the body marked `data-sort-value` sorts by that instead of by its text.
 *
 * @cssprop {<color>} [--sortable-table-elemental-indicator-color=currentcolor] - Theme. The arrow on the sorted column.
 * @cssprop {<opacity>} [--sortable-table-elemental-hint-opacity=0.35] - Theme. How visible the arrow is on a column that is only being hovered or focused - the affordance, shown before the column is the sorted one.
 * @cssprop {<color>} [--sortable-table-elemental-rule=currentcolor at 20%] - Theme. The 2px rule under the header row.
 * @cssprop {<color>} [--sortable-table-elemental-stripe=currentcolor at 4%] - Theme. The tint on every second body row.
 *
 * @fires sortable-table-sort - The table has been re-sorted by a press on a header button. `detail.column` is the header's index in its row, `detail.key` the header's text, and `detail.direction` `ascending` or `descending`.
 */
export class SortableTableElemental extends ElementBase {
  static get observedAttributes() {
    return ['note-text'];
  }

  /** The sentence appended to the caption. */
  get noteText() {
    return this.getAttribute('note-text') || DEFAULT_NOTE;
  }

  set noteText(value) {
    this.setAttribute('note-text', value);
  }

  /** The table. Direct child, so a table inside a cell of this one is not mistaken for it. */
  get table() {
    return this.querySelector(':scope > table');
  }

  /**
   * The header cells that carry the buttons: the last row of the `<thead>`.
   *
   * The last rather than the first, because a table with a grouped header has a top row of
   * spanning labels over a bottom row of real columns, and only the bottom row has one column
   * each. A single-row header is its own last row, so the common case pays nothing for it.
   */
  get headers() {
    const table = this.table;
    const row = table && table.querySelector(':scope > thead > tr:last-of-type');
    return row ? Array.from(row.children) : [];
  }

  /** The rows that get reordered. The first `<tbody>` only - a table with several is using them
   * to group, and moving a row between groups would be sorting away the grouping. */
  get body() {
    const table = this.table;
    return table ? table.querySelector(':scope > tbody') : null;
  }

  connectedCallback() {
    if (this.initialized) return;
    // Before the flag: a table rendered into this element later is upgraded when it is next
    // connected, rather than being marked done with nothing to sort.
    if (!this.body || this.headers.length === 0) return;

    this.initialized = true;
    this.onClick = this.onClick.bind(this);
    this.build();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;

    for (const header of this.headers) {
      const button = header.querySelector(':scope > button');
      // The header's own content goes back where it was. A `<th>` left holding a button that
      // nothing is listening to is a control that looks like it sorts and does not.
      if (button) {
        button.removeEventListener('click', this.onClick);
        button.replaceWith(...button.childNodes);
      }
      // `aria-sort` stays. The rows are still in the order it describes, and removing it would
      // leave a sorted table saying it is not.
    }
    // Everything `build` put in the caption comes back out, the space and an element-created
    // caption included. A move in the DOM is a disconnect and a connect, so anything left behind
    // here is appended again on the way back in - one more space per move, forever.
    for (const node of [this.note, this.noteSpace, this.ownCaption]) if (node) node.remove();
    this.note = this.noteSpace = this.ownCaption = null;
  }

  attributeChangedCallback(name, previous, value) {
    if (!this.initialized || previous === value) return;
    if (name === 'note-text' && this.note) this.note.textContent = this.noteText;
  }

  /**
   * Put a button in every sortable header, and the note in the caption.
   *
   * The button takes the header's existing nodes rather than its text, so an icon, a `<span>`
   * or an abbreviation in there survives and keeps whatever the page styled it with.
   */
  build() {
    for (const header of this.headers) {
      if (header.getAttribute('data-sort') === 'none') continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.append(...header.childNodes);
      button.addEventListener('click', this.onClick);
      header.append(button);
    }

    // Appended to the caption rather than written into each button's name, which is the APG
    // example's reasoning: a reader walking the header row hears the column and not the same
    // sentence about buttons once per column.
    const table = this.table;
    let caption = table.querySelector(':scope > caption');
    // Held only when this element is the one that created it, so teardown knows the difference
    // between a caption it can take away and the page's own.
    this.ownCaption = null;
    if (!caption) {
      caption = document.createElement('caption');
      // First child or it is not a caption - the parser puts one there and the DOM requires it.
      table.prepend(caption);
      this.ownCaption = caption;
    }
    this.note = document.createElement('span');
    this.note.className = 'sortable-table-elemental-note';
    this.note.textContent = this.noteText;
    // A space first, and only when there is already something to be spaced from. The caption is
    // the table's accessible name, so this text is read on the end of whatever the page wrote
    // there - `Peaks` and the note with nothing between them is announced as `PeaksColumn`. Not
    // added to an empty caption: a lone space is a line box, and a caption that was invisible
    // because it was empty would gain a line's height on upgrade.
    this.noteSpace = null;
    if (caption.childNodes.length) {
      this.noteSpace = document.createTextNode(' ');
      caption.append(this.noteSpace);
    }
    caption.append(this.note);
  }

  onClick(event) {
    const header = event.currentTarget.parentElement;
    const index = this.headers.indexOf(header);
    if (index < 0) return;
    // Ascending first, and the same column pressed again turns it round. Two states rather than
    // three: a table has to be in *some* order, so "unsorted" is only reachable by reloading the
    // page, and offering it as a third press is offering to put the rows back in an order the
    // reader has no reason to remember.
    const descending = header.getAttribute('aria-sort') === 'ascending';
    this.sort(index, descending);
    this.dispatchEvent(new CustomEvent('sortable-table-sort', {
      bubbles: true,
      detail: {
        column: index,
        key: (this.headers[index].textContent || '').trim(),
        direction: descending ? 'descending' : 'ascending'
      }
    }));
  }

  /**
   * Reorder the rows by one column, and say so on the header.
   *
   * The rows are moved with a `DocumentFragment` rather than appended one at a time: every
   * `append` on a live `<tbody>` is a mutation the page can be observing and a layout the
   * browser may decide to run, and a hundred-row table sorts a hundred times over. Built off
   * screen it is one insertion.
   *
   * Nothing is measured or cached between sorts. The keys are read from the DOM every time,
   * because the DOM is where the page may have just changed them - a cached key set is a table
   * that sorts by what a cell used to say.
   *
   * @param {number} index Which header, by position in the header row.
   * @param {boolean} descending
   */
  sort(index, descending) {
    const body = this.body;
    const rows = Array.from(body.rows);
    const order = sortOrder(rows.map((row) => sortKey(row.children[index])), descending, this.collator());

    const fragment = document.createDocumentFragment();
    for (const at of order) fragment.append(rows[at]);
    body.append(fragment);

    for (const header of this.headers) header.removeAttribute('aria-sort');
    this.headers[index].setAttribute('aria-sort', descending ? 'descending' : 'ascending');
  }

  /**
   * The comparator. Numeric-aware, so `item 10` sorts after `item 2` and a column of plain
   * numbers sorts as numbers without being told that is what it is.
   *
   * Built per sort rather than held, and pointed at the document's own `lang`: a page that
   * swaps its language has swapped how its own words collate, and one built once at upgrade
   * would be sorting the new language by the old one's rules. `undefined` where there is no
   * `lang`, which is `Intl`'s own way of saying "the runtime's".
   */
  collator() {
    const lang = document.documentElement.getAttribute('lang');
    return new Intl.Collator(lang || undefined, { numeric: true, sensitivity: 'base' });
  }
}

define('sortable-table-elemental', SortableTableElemental);
