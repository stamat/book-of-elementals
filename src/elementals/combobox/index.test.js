// The four decisions this element makes that are not the browser's: whether a typed
// query matches an option, which way the popup opens, where focus lands after a chip is
// removed, and - through `nextIndex`, which `core.test.js` already covers - where an
// arrow key goes. Everything else it does is wiring: reading the `<select>`, writing the
// roles, moving `aria-activedescendant`.
//
// Deliberately not covered: the wiring itself, and the CSS. Jest runs under Node here
// with no jsdom, so an element test would be asserting against a stub base class rather
// than against a DOM - the roles, the keyboard and the popup are checked in a browser
// against the docs page, and against the APG combobox pattern it claims to implement.

import { fold, matchesQuery, flipsUp, focusAfterRemoval } from './index.js';

test('a query matches anywhere in the label, not only at its start', () => {
  // "contains" rather than "starts with", because the reader searching a list of cities
  // for "york" wants New York and knows it is not the first word.
  expect(matchesQuery('New York', 'york')).toBe(true);
  expect(matchesQuery('New York', 'new')).toBe(true);
  expect(matchesQuery('New York', 'boston')).toBe(false);
});

test('case is not part of the search', () => {
  expect(matchesQuery('Lemon', 'LEM')).toBe(true);
  expect(matchesQuery('LEMON', 'lem')).toBe(true);
});

test('an empty query matches everything, so an unfiltered list is every option', () => {
  expect(matchesQuery('Lemon', '')).toBe(true);
  expect(matchesQuery('Lemon', '   ')).toBe(true);
});

test('a keyboard without diacritics still finds the words that have them', () => {
  // Typing `sipka` on an English layout has to find `Šipka`, or the search is unusable
  // to exactly the readers whose language needs it.
  expect(matchesQuery('Šipka', 'sipka')).toBe(true);
  expect(matchesQuery('Čačak', 'cacak')).toBe(true);
  expect(matchesQuery('Ćuprija', 'cuprija')).toBe(true);
  expect(matchesQuery('Kraków', 'krakow')).toBe(true);
  expect(matchesQuery('Zürich', 'zurich')).toBe(true);
});

test('the stroked letters fold too, which decomposition alone does not do', () => {
  // `đ`, `ø` and `ł` are single code points with no combining mark to strip, so NFD
  // leaves them exactly as they were and a search for "dordje" finds nothing.
  expect(fold('Đorđe')).toBe('dorde');
  expect(fold('Łódź')).toBe('lodz');
  expect(matchesQuery('Đorđević', 'dordevic')).toBe(true);
  expect(matchesQuery('Nørrebro', 'norrebro')).toBe(true);
});

test('a script with no Latin in it survives folding whole', () => {
  // The reason this is not `slugify`, which is the neighbouring function in the same
  // helpers file and would be the obvious thing to reach for: it is for URLs, so it drops
  // everything outside `[\w0-9-]` and leaves a Cyrillic or CJK label as an empty string -
  // a search box that cannot find Београд on a Serbian site.
  expect(fold('Београд')).toBe('београд');
  expect(matchesQuery('Београд', 'бео')).toBe(true);
  expect(matchesQuery('北京', '北')).toBe(true);
});

test('a ligature is the letters it stands for', () => {
  expect(matchesQuery('Straße', 'strasse')).toBe(true);
  expect(matchesQuery('Œuvre', 'oeuvre')).toBe(true);
});

test('a diacritic typed in the query is not a reason to miss the word', () => {
  // Both sides fold, so the reader who does have the layout is not punished for using it.
  expect(matchesQuery('Cacak', 'čačak')).toBe(true);
});

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
