// The four decisions this element makes that are not the browser's: which way the popup
// opens, where focus lands after a chip is removed, whether what has been typed is a value
// the list does not already hold, and - through `nextIndex`, which `core.test.js` already
// covers - where an arrow key goes. Whether a typed query matches an option is
// `matchesSearch`, covered in book-of-spells where it now lives. Everything else this
// element does is wiring: reading the `<select>`, writing the roles, moving
// `aria-activedescendant`.
//
// Deliberately not covered here: the wiring itself, and the CSS. The roles, the keyboard and
// the popup are checked in a browser against the docs page, and against the APG combobox
// pattern this element claims to implement - the half of the popup that decides *where* it
// goes needs a layout, which is why `flipsUp` takes the rects rather than going and finding
// them, and which jsdom would answer with zeroes.

import { flipsUp, focusAfterRemoval, offersCustom, removeName } from './index.js';

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

test('a chip remove button is named for the verb and the option it would remove', () => {
  expect(removeName('Remove', 'React')).toBe('Remove React');
  expect(removeName('Ukloni', 'React')).toBe('Ukloni React');
});

// Verb then noun is English's order. German puts the verb last - `React entfernen` - and a
// `remove-text` the element then concatenates in front of the label can only ever produce
// `entfernen React`. `{label}` is what lets the page write the order its language uses.
test('a verb holding {label} says where the option goes, for the languages that put it first', () => {
  expect(removeName('{label} entfernen', 'React')).toBe('React entfernen');
  expect(removeName('{label} を削除', 'React')).toBe('React を削除');
});

// The label is the `<option>`'s own text and lands in `aria-label`, which is a plain string
// - but a page that writes `{label}` into its option text should get it back, not have it
// read as a second placeholder to fill.
test('a placeholder inside the option text is text, not another placeholder', () => {
  expect(removeName('Remove {label}', '{label}')).toBe('Remove {label}');
});

// `String.replace` reads `$&`, `$'` and `` $` `` in the *replacement* as references back into
// the match, so an option named `C$&C` substituted the plain way comes out as `C{label}C`.
// The option's text is whatever the page's data had in it, which makes this the hostile
// input this element actually sees.
test('a dollar sign in an option name is a dollar sign, not a reference back into the match', () => {
  expect(removeName('{label} entfernen', 'C$&C')).toBe('C$&C entfernen');
  expect(removeName('{label} entfernen', "a$'b")).toBe("a$'b entfernen");
  expect(removeName('{label} entfernen', 'net$$')).toBe('net$$ entfernen');
});

// `custom-values`: whether the popup offers what has been typed as a value of its own. The
// question is only ever "is this already in the list", and the interesting half is what
// counts as already - because every answer here is a near-duplicate the reader did not mean
// to create, sitting one row above the real one forever.

test('what was typed is offered when the list does not already hold it', () => {
  expect(offersCustom('Svelte', ['React', 'Vue'])).toBe(true);
});

test('an empty field is not a value, however much whitespace it holds', () => {
  expect(offersCustom('', ['React'])).toBe(false);
  expect(offersCustom('   ', ['React'])).toBe(false);
});

test('what is already in the list is not a new value', () => {
  expect(offersCustom('React', ['React', 'Vue'])).toBe(false);
});

test('case is not what makes a value new', () => {
  // Otherwise `react` is offered beside `React`, and a list slowly fills with the same
  // word in every capitalisation anyone happened to type it in.
  expect(offersCustom('react', ['React'])).toBe(false);
  expect(offersCustom('REACT', ['React'])).toBe(false);
});

test('the space around what was typed is not part of it', () => {
  expect(offersCustom('  React  ', ['React'])).toBe(false);
  expect(offersCustom('  Svelte  ', ['React'])).toBe(true);
});

test('an empty list offers everything, which is the tag input with no suggestions', () => {
  expect(offersCustom('anything', [])).toBe(true);
});
