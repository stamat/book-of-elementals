// When the element is allowed to speak. That is the only decision it makes: *what* it says
// is the browser's own `validationMessage`, and *where* it goes is one paragraph - neither
// is a choice this file could get wrong.
//
// The rules being pinned are the ones a form gets wrong by default. Complaining at the
// first character of an email address, and lighting up every empty field of a form the
// reader has only tabbed through, are both things the native bubble never does and every
// hand-written validator does.
//
// Deliberately not covered here: the DOM half - adopting the author's paragraph, the
// `aria-describedby` wiring, cancelling the native bubble, and the focus below. Those are
// checked in a browser against the docs page and by `script/a11y`. The focus half cannot be
// checked under jsdom either way: matching `:invalid` from inside an `invalid` listener makes
// jsdom re-dispatch `invalid`, so the one guard that keeps focus on the *first* failing field
// recurses until the stack goes - measured on jsdom 26 and 29.
//
// One platform fact underneath all of this was measured rather than assumed, and it is the
// reason the element focuses at all: cancelling `invalid` to drop the bubble drops the
// browser's own focus with it. In Chromium a refused submit then leaves focus on the button
// and in WebKit on `<body>` - a form that says nothing and goes nowhere. So the element
// takes focus itself, guarded to the first invalid control in the form. Firefox was not
// checked; no binary installed.

import { fieldAction } from './index.js';

test('a rejected submit always says why, even for a field the reader never touched', () => {
  // The point at which they have asked. Every other rule here is about not answering a
  // question nobody put.
  expect(fieldAction('invalid', false, false, false)).toBe('show');
  expect(fieldAction('invalid', false, true, true)).toBe('show');
});

test('typing never starts a complaint', () => {
  expect(fieldAction('input', false, false, true)).toBe('ignore');
  expect(fieldAction('change', false, false, true)).toBe('ignore');
});

test('typing keeps a complaint already on screen current, and takes it down the moment it is answered', () => {
  expect(fieldAction('input', false, true, true)).toBe('show');
  expect(fieldAction('input', true, true, true)).toBe('clear');
  expect(fieldAction('change', true, true, true)).toBe('clear');
});

test('tabbing through a field without filling it in says nothing', () => {
  expect(fieldAction('blur', false, false, false)).toBe('ignore');
});

test('leaving a field with something wrong in it is the moment worth saying so', () => {
  expect(fieldAction('blur', false, false, true)).toBe('show');
});

test('leaving a field that has since been fixed takes the complaint down', () => {
  expect(fieldAction('blur', true, true, true)).toBe('clear');
});

test('leaving a field that was never complained about leaves the page alone', () => {
  // Nothing on screen and nothing wrong is not a state change, and re-writing the
  // paragraph and the `aria-invalid` on every blur is churn a screen reader can hear.
  expect(fieldAction('blur', true, false, true)).toBe('ignore');
});

test('a form reset takes the complaint down with the values it was about', () => {
  expect(fieldAction('reset', false, true, true)).toBe('clear');
  expect(fieldAction('reset', true, false, false)).toBe('clear');
});

test('an event the field has no opinion about is not an opinion', () => {
  expect(fieldAction('focus', false, true, true)).toBe('ignore');
  expect(fieldAction('keydown', false, true, true)).toBe('ignore');
});
