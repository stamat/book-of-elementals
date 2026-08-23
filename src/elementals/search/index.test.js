// The three decisions this element makes that are not the browser's: whether what is in the
// field is worth sending anywhere, what a settled search says out loud, and whether the
// panel has anything worth showing. Debouncing, aborting and the sequence number that drops
// a stale answer are the wiring around them.
//
// Deliberately not covered here: that wiring - the debounce, the abort, the sequence number,
// the states and the live region are `dom.test.js`, which runs the element itself under jsdom
// with the clock in hand. A real network is still the docs page's, where the npm sample is the
// one that can be made to fail, go empty and go slow on demand.

import { searchAction, searchOpen, searchStatus } from './index.js';

test('a field with nothing in it yet is cleared, not searched for', () => {
  expect(searchAction('', 1, null)).toBe('clear');
  expect(searchAction('   ', 1, null)).toBe('clear');
});

// Below the minimum is the same answer as empty: a two-character minimum exists because
// one character matches everything, and a panel showing everything is a panel showing
// nothing. Clearing rather than idling, because the results on screen are the answer to a
// query the reader has just deleted.
test('a query under the minimum clears the panel rather than searching again', () => {
  expect(searchAction('a', 2, null)).toBe('clear');
  expect(searchAction('ab', 2, null)).toBe('query');
});

// The query is what was typed with the ends taken off, so trailing whitespace is not a new
// query - and the minimum counts the characters that would be sent, not the spaces.
test('the ends are trimmed off before anything is counted or sent', () => {
  expect(searchAction('  ab  ', 2, null)).toBe('query');
  expect(searchAction(' a ', 2, null)).toBe('clear');
});

// Typing a space and taking it back leaves the same query it started with, and a second
// request for it is a request whose answer is already on screen.
test('a query identical to the one already answered is not sent twice', () => {
  expect(searchAction('react', 1, 'react')).toBe('idle');
  expect(searchAction('react ', 1, 'react')).toBe('idle');
  expect(searchAction('reactive', 1, 'react')).toBe('query');
});

// What a field cleared back to nothing sends, where the page has an answer for the empty
// query - a "recent" or "popular" list. Off by default: an empty field is usually a reader
// who has stopped asking.
test('a minimum of zero is how an empty field asks for results anyway', () => {
  expect(searchAction('', 0, null)).toBe('query');
  expect(searchAction('', 0, '')).toBe('idle');
});

test('a finished search announces how many answers it found', () => {
  expect(searchStatus('results', 5, {})).toBe('5 results');
});

// "1 results" is the bug this exists to not ship. It is the one plural the default handles,
// because English is the only language the default is written in.
test('one answer is announced as one, not as one of many', () => {
  expect(searchStatus('results', 1, {})).toBe('1 result');
});

test('an empty answer and a failed request each say which one happened', () => {
  expect(searchStatus('empty', 0, {})).toBe('No results');
  expect(searchStatus('error', 0, {})).toBe('Search failed');
});

// The page's string wins whole, in whatever language it is written, and `{n}` is the only
// thing substituted into it - anywhere in it, and as often as it appears.
test('a text the page gave is used as written, with {n} standing in for the count', () => {
  const texts = { results: '{n} rezultata', empty: 'Nema rezultata', error: 'Pretraga nije uspela' };
  expect(searchStatus('results', 3, texts)).toBe('3 rezultata');
  expect(searchStatus('empty', 0, texts)).toBe('Nema rezultata');
  expect(searchStatus('error', 0, texts)).toBe('Pretraga nije uspela');
  expect(searchStatus('results', 2, { results: '{n} of {n}' })).toBe('2 of 2');
});

// A polite region that said "Searching…" on every keystroke would be a reader listening to
// their own typing. The loader is for the eye; the announcement waits for the answer.
test('a search still in flight announces nothing at all', () => {
  expect(searchStatus('pending', 0, {})).toBe('');
  expect(searchStatus('idle', 0, {})).toBe('');
});

test('answers open the panel and nothing to show closes it', () => {
  expect(searchOpen('results', true)).toBe(true);
  expect(searchOpen('idle', true)).toBe(false);
});

// The empty search is the one with two right answers, and which one it is belongs to the
// page: a panel emptied out has nothing to show, and a panel holding "No packages match
// wombat" has the answer written in it. Closing that one throws the answer away, which is
// what a reader sees as a search field that does nothing.
test('an empty search shows the panel only if the page wrote something in it', () => {
  expect(searchOpen('empty', true)).toBe(true);
  expect(searchOpen('empty', false)).toBe(false);
});

// What is in the panel when a request fails is the *previous* query's results, still there
// because nothing replaced them. Leaving those up under a failure is worse than showing
// nothing, so this is the one state the panel's contents do not get a vote in.
test('a failed search never leaves the query before last on screen', () => {
  expect(searchOpen('error', true)).toBe(false);
  expect(searchOpen('error', false)).toBe(false);
});
