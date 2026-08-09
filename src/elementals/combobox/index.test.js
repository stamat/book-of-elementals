// The three decisions this element makes that are not the browser's: which way the popup
// opens, where focus lands after a chip is removed, and - through `nextIndex`, which
// `core.test.js` already covers - where an arrow key goes. Whether a typed query matches
// an option is `matchesSearch`, covered in book-of-spells where it now lives. Everything
// else this element does is wiring: reading the `<select>`, writing the roles, moving
// `aria-activedescendant`.
//
// Deliberately not covered: the wiring itself, and the CSS. Jest runs under Node here
// with no jsdom, so an element test would be asserting against a stub base class rather
// than against a DOM - the roles, the keyboard and the popup are checked in a browser
// against the docs page, and against the APG combobox pattern it claims to implement.

import { flipsUp, focusAfterRemoval } from './index.js';

test('the popup opens downwards while there is room for it', () => {
  const field = { top: 100, bottom: 130 };
  expect(flipsUp(field, 200, 800)).toBe(false);
});

test('a field near the bottom opens the popup upwards', () => {
  const field = { top: 700, bottom: 730 };
  expect(flipsUp(field, 200, 800)).toBe(true);
});

test('with room on neither side the popup takes the larger one and scrolls', () => {
  // The list is scrollable, so "nowhere it fits" is still a choice between two bad
  // corners - and the bigger corner shows more of it.
  expect(flipsUp({ top: 500, bottom: 530 }, 400, 800)).toBe(true);
  expect(flipsUp({ top: 100, bottom: 130 }, 400, 800)).toBe(false);
});

test('removing a chip leaves focus on the one that took its place', () => {
  expect(focusAfterRemoval(3, 0)).toBe(0);
  expect(focusAfterRemoval(3, 1)).toBe(1);
});

test('removing the last chip hands focus back to the input, which is `-1`', () => {
  // Nothing took its place, and focus left on a button that no longer exists is focus
  // on the document body - which is where a keyboard reader loses the control entirely.
  expect(focusAfterRemoval(3, 2)).toBe(-1);
  expect(focusAfterRemoval(1, 0)).toBe(-1);
});
