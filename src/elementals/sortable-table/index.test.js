// The two sums this element does: what a cell sorts by, and what order a column of keys puts
// its rows in.
//
// The ordering is the part worth pinning to numbers. Stability across *repeated* sorts is the
// property nobody notices until it is missing — sort by name, then by size, and the rows inside
// one size are expected to still be in name order — and it is the one thing an engine's own
// sort does not give you for free once a direction is involved.
//
// `sortKey`'s edge is `data-sort-value=""`, which is an author saying "this cell sorts as
// empty" and is exactly the value a `||` would throw away.
//
// Deliberately not covered: the buttons written into the headers, the caption note, the
// `aria-sort` bookkeeping and the row moves. Jest runs under Node here with no jsdom, so an
// element test would assert against a stub base class — `script/a11y` drives the docs demo
// instead. The collator is injected rather than reached for, so these run the same everywhere:
// `Intl.Collator`'s actual orderings are ICU's business and not this element's to re-test.

import { sortKey, sortOrder, DEFAULT_NOTE } from './index.js';

/** The smallest thing `sortKey` reads: an attribute and some text. */
function cell(text, sortValue) {
  return {
    textContent: text,
    getAttribute: (name) => (name === 'data-sort-value' && sortValue !== undefined ? sortValue : null)
  };
}

test('a cell sorts by its own text when it says nothing else', () => {
  expect(sortKey(cell('Kopaonik'))).toBe('Kopaonik');
});

test('the text is trimmed, because the markup was indented and the reader cannot see that', () => {
  expect(sortKey(cell('\n      Tara\n    '))).toBe('Tara');
});

test('data-sort-value is what the cell sorts by, whatever it reads as', () => {
  // The whole point of the attribute: a date written for a human, ordered as a machine would.
  expect(sortKey(cell('3 Aug 2026', '2026-08-03'))).toBe('2026-08-03');
  expect(sortKey(cell('$1,200', '1200'))).toBe('1200');
});

test('an empty data-sort-value sorts as empty rather than falling back to the text', () => {
  // `||` would take the text here, and a column of "not applicable" cells the author marked
  // empty would sort by the words instead of gathering at one end.
  expect(sortKey(cell('n/a', ''))).toBe('');
});

test('a column with no cell in a row sorts that row as empty rather than throwing', () => {
  // A short row is malformed markup, and a table sorter that threw on one would take the whole
  // page's scripting down with it.
  expect(sortKey(undefined)).toBe('');
  expect(sortKey(null)).toBe('');
});

test('ascending is the order the keys read in, as indices into the rows', () => {
  expect(sortOrder(['b', 'a', 'c'], false)).toEqual([1, 0, 2]);
});

test('descending is that turned round', () => {
  expect(sortOrder(['b', 'a', 'c'], true)).toEqual([2, 0, 1]);
});

test('rows with equal keys keep the order they were already in, in both directions', () => {
  // The tiebreak, and the reason it is written rather than left to the engine: a descending
  // sort that reversed the comparator wholesale would reverse equal rows too, so sorting by
  // size would scramble the name order the reader had just sorted into.
  expect(sortOrder(['a', 'b', 'a', 'b'], false)).toEqual([0, 2, 1, 3]);
  expect(sortOrder(['a', 'b', 'a', 'b'], true)).toEqual([1, 3, 0, 2]);
});

test('sorting by one column and then another leaves the first sort inside the second', () => {
  // The property the tiebreak exists for, played out: names sorted, then sizes sorted, and
  // within one size the names are still in order.
  const names = ['Ana', 'Boris', 'Ana', 'Boris'];
  const sizes = ['2', '1', '1', '2'];
  const byName = sortOrder(names, false);
  const bySize = sortOrder(byName.map((at) => sizes[at]), false);
  expect(bySize.map((at) => byName[at]).map((at) => `${names[at]} ${sizes[at]}`))
    .toEqual(['Ana 1', 'Boris 1', 'Ana 2', 'Boris 2']);
});

test('an empty table sorts into an empty order rather than into an error', () => {
  expect(sortOrder([], false)).toEqual([]);
  expect(sortOrder(['only'], true)).toEqual([0]);
});

test('the collator decides the ordering, and it is the one thing that is handed in', () => {
  // Numeric-aware collation is what puts `item 2` before `item 10`, and it is `Intl`'s to get
  // right rather than this element's — so what is tested here is that the comparator handed in
  // is the one used, and not that ICU sorts Serbian correctly.
  const backwards = { compare: (a, b) => (a < b ? 1 : a > b ? -1 : 0) };
  expect(sortOrder(['a', 'b', 'c'], false, backwards)).toEqual([2, 1, 0]);
});

test('the caption says what the buttons are, in words a page can replace', () => {
  expect(DEFAULT_NOTE).toMatch(/sort/i);
});
