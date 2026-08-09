// The two decisions this element makes that are not the browser's: what a key means to a
// popup that is or is not showing, and what state that leaves the popup and its field in.
// Where an arrow key lands is `nextIndex` and where the popup opens is `placeFlyout`, both
// covered in book-of-spells.
//
// Deliberately not covered: the wiring. Jest runs under Node here with no jsdom, so an
// element test would assert against a stub base class rather than a DOM - the roles, the
// cursor and the focus behaviour are checked in a browser against the docs page, and
// against the APG combobox pattern this element claims to implement.

import { listboxAction, listboxState } from './index.js';

test('a closed popup opens downwards onto its first option and upwards onto its last', () => {
  expect(listboxAction('ArrowDown', false, false)).toBe('open-first');
  expect(listboxAction('ArrowUp', false, false)).toBe('open-last');
});

test('Alt with the down arrow opens without choosing anything', () => {
  // The pattern's one way to see the list without committing to a row: the reader gets the
  // options on screen and their query still says what they typed.
  expect(listboxAction('ArrowDown', true, false)).toBe('open');
  expect(listboxAction('ArrowUp', true, true)).toBe('close');
});

test('an open popup walks on the arrows, follows Enter, and closes on Escape or Tab', () => {
  expect(listboxAction('ArrowDown', false, true)).toBe('move');
  expect(listboxAction('ArrowUp', false, true)).toBe('move');
  expect(listboxAction('Enter', false, true)).toBe('activate');
  expect(listboxAction('Escape', false, true)).toBe('close');
  expect(listboxAction('Tab', false, true)).toBe('close');
});

// A popup that is not showing has no opinion about any of these: Enter submits the form,
// Escape clears the field, Tab leaves. Swallowing one is a field that cannot be used.
test('a closed popup leaves Enter, Escape and Tab to the page', () => {
  expect(listboxAction('Enter', false, false)).toBe(null);
  expect(listboxAction('Escape', false, false)).toBe(null);
  expect(listboxAction('Tab', false, false)).toBe(null);
});

// Home and End move the caret through what has been typed. A popup that took them would
// strand a reader trying to get back to the start of their own query.
test('the caret keys stay with the text field, open or closed', () => {
  for (const open of [true, false]) {
    expect(listboxAction('Home', false, open)).toBe(null);
    expect(listboxAction('End', false, open)).toBe(null);
  }
});

test('every key that types a character is left where it was typed', () => {
  for (const key of ['a', 'Z', '/', ' ', 'Backspace']) {
    expect(listboxAction(key, false, true)).toBe(null);
    expect(listboxAction(key, false, false)).toBe(null);
  }
});

test('a closed popup is hidden, and says so on its field', () => {
  expect(listboxState(false, 'opt-1')).toEqual({
    expanded: 'false',
    hidden: true,
    activedescendant: null
  });
});

// An `aria-activedescendant` pointing at nothing is a field claiming a cursor it does not
// have, and the stale option is what gets announced.
test('the cursor is only claimed while the popup is showing and has one', () => {
  expect(listboxState(true, 'opt-1').activedescendant).toBe('opt-1');
  expect(listboxState(true, null).activedescendant).toBe(null);
  expect(listboxState(false, 'opt-1').activedescendant).toBe(null);
});
