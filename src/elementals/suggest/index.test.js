// The two decisions this element makes that are not the browser's: what a key means to a
// popup that is or is not showing, and what state that leaves the popup and its field in.
// Where an arrow key lands is `nextIndex` and where the popup opens is `placeFlyout`, both
// covered in book-of-spells.
//
// Deliberately not covered: the wiring. Jest runs under Node here with no jsdom, so an
// element test would assert against a stub base class rather than a DOM - the roles, the
// cursor and the focus behaviour are checked in a browser against the docs page, and
// against the APG combobox pattern this element claims to implement.

import { suggestAction, suggestState } from './index.js';

test('a closed popup opens downwards onto its first option and upwards onto its last', () => {
  expect(suggestAction('ArrowDown', false, false)).toBe('open-first');
  expect(suggestAction('ArrowUp', false, false)).toBe('open-last');
});

test('Alt with the down arrow opens without choosing anything', () => {
  // The pattern's one way to see the list without committing to a row: the reader gets the
  // options on screen and their query still says what they typed.
  expect(suggestAction('ArrowDown', true, false)).toBe('open');
  expect(suggestAction('ArrowUp', true, true)).toBe('close');
});

test('an open popup walks on the arrows, follows Enter, and closes on Escape or Tab', () => {
  expect(suggestAction('ArrowDown', false, true)).toBe('move');
  expect(suggestAction('ArrowUp', false, true)).toBe('move');
  expect(suggestAction('Enter', false, true)).toBe('activate');
  expect(suggestAction('Escape', false, true)).toBe('close');
  expect(suggestAction('Tab', false, true)).toBe('close');
});

// A popup that is not showing has no opinion about any of these: Enter submits the form,
// Escape clears the field, Tab leaves. Swallowing one is a field that cannot be used.
test('a closed popup leaves Enter, Escape and Tab to the page', () => {
  expect(suggestAction('Enter', false, false)).toBe(null);
  expect(suggestAction('Escape', false, false)).toBe(null);
  expect(suggestAction('Tab', false, false)).toBe(null);
});

// The pattern calls Home/End optional and documents two behaviours: jump the list, or -
// "if the combobox is editable" - put the caret back on the first character. This field is
// always editable, so which one is right depends on whether the reader is still writing.
test('the caret keys stay with the field until a row is under the cursor', () => {
  for (const open of [true, false]) {
    expect(suggestAction('Home', false, open, false)).toBe(null);
    expect(suggestAction('End', false, open, false)).toBe(null);
  }
});

test('once an arrow has put a cursor on a row, the caret keys reach the ends of the list', () => {
  expect(suggestAction('Home', false, true, true)).toBe('first');
  expect(suggestAction('End', false, true, true)).toBe('last');
});

// A cursor cannot outlive the popup that held it, so this pair is unreachable rather than
// merely unused — asserted so that it fails loudly if it ever stops being true.
test('a closed popup never claims them, cursor or not', () => {
  expect(suggestAction('Home', false, false, true)).toBe(null);
  expect(suggestAction('End', false, false, true)).toBe(null);
});

test('every key that types a character is left where it was typed', () => {
  for (const key of ['a', 'Z', '/', ' ', 'Backspace']) {
    expect(suggestAction(key, false, true)).toBe(null);
    expect(suggestAction(key, false, false)).toBe(null);
  }
});

test('a closed popup is hidden, and says so on its field', () => {
  expect(suggestState(false, 'opt-1')).toEqual({
    expanded: 'false',
    hidden: true,
    activedescendant: null
  });
});

// An `aria-activedescendant` pointing at nothing is a field claiming a cursor it does not
// have, and the stale option is what gets announced.
test('the cursor is only claimed while the popup is showing and has one', () => {
  expect(suggestState(true, 'opt-1').activedescendant).toBe('opt-1');
  expect(suggestState(true, null).activedescendant).toBe(null);
  expect(suggestState(false, 'opt-1').activedescendant).toBe(null);
});
