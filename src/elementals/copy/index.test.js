// The one decision this element makes: what text ends up on the clipboard. Everything
// else is wiring - a click, a promise, an attribute for CSS to read and a live region for
// a screen reader to announce.
//
// The trimming is most of what is pinned here, because it is the part that is not obvious
// and the part a code block on a docs page depends on: a trailing newline pasted into a
// terminal runs the command the reader was still reading.
//
// Deliberately not covered here: the clipboard write, the feedback timer and the announcement -
// those are `dom.test.js`, which runs the element itself under jsdom against a stubbed
// clipboard. What a real screen reader does with the live region, and how the button looks
// before and after, are checked in a browser against the docs page.

import { sourceText } from './index.js';

test('a `value` is copied exactly as it was written', () => {
  expect(sourceText(null, 'npm i book-of-elementals')).toBe('npm i book-of-elementals');
  expect(sourceText(null, '  spaced  ')).toBe('  spaced  ');
});

test('a `value` wins over anything `for` points at', () => {
  expect(sourceText({ tagName: 'PRE', textContent: 'the block' }, 'the attribute')).toBe('the attribute');
});

test('an empty `value` is an answer, and the answer is that there is nothing to copy', () => {
  expect(sourceText({ tagName: 'PRE', textContent: 'the block' }, '')).toBe('');
});

test('a field is copied by what is in it, not by what is written between its tags', () => {
  expect(sourceText({ tagName: 'INPUT', value: 'typed in', textContent: '' }, null)).toBe('typed in');
  expect(sourceText({ tagName: 'TEXTAREA', value: 'edited', textContent: 'loaded with' }, null)).toBe('edited');
});

test('an empty field copies nothing rather than the word undefined', () => {
  expect(sourceText({ tagName: 'INPUT' }, null)).toBe('');
});

test('anything else is copied by the text it shows', () => {
  expect(sourceText({ tagName: 'PRE', innerText: 'shown', textContent: 'shown and hidden' }, null)).toBe('shown');
  expect(sourceText({ tagName: 'CODE', textContent: 'not rendered' }, null)).toBe('not rendered');
});

test('the newlines a code block is written between are not part of the code', () => {
  expect(sourceText({ tagName: 'PRE', textContent: '\nnpm i thing\n' }, null)).toBe('npm i thing');
});

test('indentation on the first line is code, and survives', () => {
  // A snippet lifted out of a Python or YAML file starts indented, and dedenting it on the
  // way to the clipboard hands back something that does not paste back where it came from.
  expect(sourceText({ tagName: 'PRE', textContent: '\n    indented: true\n' }, null)).toBe('    indented: true');
});

test('nothing to copy from is nothing to copy, not a crash', () => {
  expect(sourceText(null, null)).toBe('');
  expect(sourceText({ tagName: 'DIV' }, null)).toBe('');
});
