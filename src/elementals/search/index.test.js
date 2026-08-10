// The two decisions this element makes that are not the browser's: whether what is in the
// field is worth sending anywhere, and what a settled search says out loud. Debouncing,
// aborting and the sequence number that drops a stale answer are the wiring around them.
//
// Deliberately not covered: that wiring. Jest runs under Node here with no jsdom, so an
// element test would assert against a stub base class rather than a DOM - the states, the
// live region and the panel it opens are checked in a browser against the docs page, and
// the stale-answer drop is what the docs page's slow-response sample is for.

import { searchAction, searchStatus } from './index.js';

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
test('a label the page gave is used as written, with {n} standing in for the count', () => {
  const labels = { results: '{n} rezultata', empty: 'Nema rezultata', error: 'Pretraga nije uspela' };
  expect(searchStatus('results', 3, labels)).toBe('3 rezultata');
  expect(searchStatus('empty', 0, labels)).toBe('Nema rezultata');
  expect(searchStatus('error', 0, labels)).toBe('Pretraga nije uspela');
  expect(searchStatus('results', 2, { results: '{n} of {n}' })).toBe('2 of 2');
});

// A polite region that said "Searching…" on every keystroke would be a reader listening to
// their own typing. The loader is for the eye; the announcement waits for the answer.
test('a search still in flight announces nothing at all', () => {
  expect(searchStatus('pending', 0, {})).toBe('');
  expect(searchStatus('idle', 0, {})).toBe('');
});
