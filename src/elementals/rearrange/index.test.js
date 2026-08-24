// The three sums this element does: what one item is called, how a template is filled in, and
// which position a drag is over.
//
// The label is the part worth pinning. It goes into two button names and every announcement,
// so its edges are the ones a reader hits: `data-label=""` is an author saying this item has no
// name worth announcing and is exactly the value a `||` would throw away, and the controls the
// element writes into the item must never come back out as part of the item's own words — that
// one is the element eating its own tail, and it happens on the second `refresh()`, not the
// first.
//
// `dropIndex` is passed boxes rather than measuring any, which is what lets it be tested at all:
// jsdom has no layout, so a sum that read `getBoundingClientRect` would only ever run in a
// browser. Those boxes are the items the drag is *not*, and the last test here is why: with the
// dragged item's own box among them the answer rearranges the list the question was asked about,
// and a pointer holding still between two rows of different heights trades them back and forth
// on every event.
//
// Deliberately not covered here: the buttons, the live region, the ends of travel and the moves
// themselves, which are `dom.test.js`; and the pointer drag, which needs layout, pointer capture
// and a real `touch-action` — that is `script/a11y` and a browser.

import { itemLabel, format, dropIndex, LABEL_MAX } from './index.js';

/** The smallest thing `itemLabel` reads: an attribute and some child nodes. */
function item(text, { label, controls, handle } = {}) {
  const childNodes = [{ nodeType: 3, textContent: text }];
  if (handle !== undefined) {
    childNodes.unshift({
      nodeType: 1,
      textContent: handle,
      hasAttribute: (name) => name === 'data-rearrange-handle'
    });
  }
  if (controls !== undefined) {
    childNodes.push({
      nodeType: 1,
      textContent: controls,
      hasAttribute: (name) => name === 'data-rearrange-controls'
    });
  }
  return {
    getAttribute: (name) => (name === 'data-label' && label !== undefined ? label : null),
    childNodes
  };
}

test('an item is called by its own words, because that is the only thing telling it from the one below', () => {
  expect(itemLabel(item('Bananas'))).toBe('Bananas');
});

test('the words are collapsed and trimmed, because the markup was indented and the reader cannot hear that', () => {
  expect(itemLabel(item('\n      Kiwi\n      fruit\n    '))).toBe('Kiwi fruit');
});

test('data-label is what the item is called, whatever it reads as', () => {
  expect(itemLabel(item('🍌 Bananas, a box of twelve', { label: 'Bananas' }))).toBe('Bananas');
});

test('an empty data-label means no name rather than falling back to the text', () => {
  // `||` would take the text here, and an author who said this item has nothing worth
  // announcing would be announced anyway.
  expect(itemLabel(item('Bananas', { label: '' }))).toBe('');
});

test('the buttons the element wrote are not part of what the item is called', () => {
  // The tail-eating case: without this the second refresh names the button
  // "Move Move Bananas up Move Bananas down up", and every one after it is worse.
  expect(itemLabel(item('Bananas', { controls: 'Move Bananas upMove Bananas down' }))).toBe('Bananas');
});

test('a drag handle is a glyph and not part of what the item is called', () => {
  // The author's own grip, which they wrote and this element only wires up. Left in, every
  // announcement in the list opens with a character nobody can pronounce.
  expect(itemLabel(item('Bananas', { handle: '\u2261' }))).toBe('Bananas');
});

test('a long item is cut at a word boundary, so the reader hears words and not a syllable', () => {
  const words = Array(20).fill('word').join(' ');
  expect(words.length).toBeGreaterThan(LABEL_MAX);
  expect(itemLabel(item(words))).toBe(`${Array(16).fill('word').join(' ')}…`);
});

test('a long item whose first space comes too early is cut hard rather than down to nothing', () => {
  // `The…` is not a label. Past the halfway mark a word boundary is worth having; before it,
  // the characters are.
  const text = `The ${'x'.repeat(120)}`;
  expect(itemLabel(item(text))).toBe(`${text.slice(0, LABEL_MAX)}…`);
});

test('a template is filled in from the values it names', () => {
  expect(format('Move {label} up', { label: 'Bananas' })).toBe('Move Bananas up');
  expect(format('{label} moved to position {position} of {total}', { label: 'Kiwi', position: 2, total: 3 }))
    .toBe('Kiwi moved to position 2 of 3');
});

test('a placeholder nothing answers to is left exactly as written, so the typo is findable', () => {
  // Blanking it would leave half a sentence and nothing on the page to explain why.
  expect(format('{label} moved to {potition}', { label: 'Kiwi' })).toBe('Kiwi moved to {potition}');
});

test('a placeholder cannot reach past the values into the prototype', () => {
  expect(format('{constructor} and {toString}', { label: 'Kiwi' })).toBe('{constructor} and {toString}');
});

test('a drag is over the item whose middle it has passed, in either direction', () => {
  const boxes = [{ top: 0, height: 20 }, { top: 20, height: 20 }, { top: 40, height: 20 }];
  expect(dropIndex(5, boxes)).toBe(0);
  expect(dropIndex(9, boxes)).toBe(0);
  expect(dropIndex(11, boxes)).toBe(1);
  expect(dropIndex(31, boxes)).toBe(2);
});

test('the middle is the middle whatever the items are worth in height', () => {
  // Two rows of different heights is the case an edge-based test would pass and a reader would
  // feel: the tall one must be taken over halfway down itself, not a fixed row in.
  const boxes = [{ top: 0, height: 100 }, { top: 100, height: 20 }];
  expect(dropIndex(49, boxes)).toBe(0);
  expect(dropIndex(51, boxes)).toBe(1);
});

test('past the last middle the drag is at the end, and a list of one is position zero', () => {
  // Two others passed is the third position, because the dragged item is counted back in.
  expect(dropIndex(999, [{ top: 0, height: 20 }, { top: 20, height: 20 }])).toBe(2);
  // No others at all: the only item there is the one in hand, and it is already home.
  expect(dropIndex(10, [])).toBe(0);
});

test('a pointer holding still between two rows does not trade them back and forth', () => {
  // The flicker, and the reason the dragged item's box is not in the map. A 20px item crossing
  // the middle of a 100px row swaps them; the swap slides that row up under the pointer, the
  // same pointer position reads as put it back, and the two trade places on every event for as
  // long as the finger sits still. Measured without it in the way, both orders answer with the
  // order they are already in, and the band between the two midpoints is somewhere to rest.
  const above = [{ top: 20, height: 100 }]; // the tall row, with the dragged item above it
  const below = [{ top: 0, height: 100 }];  // the same row, with the dragged item below it
  expect(dropIndex(60, above)).toBe(0);
  expect(dropIndex(60, below)).toBe(1);
});
