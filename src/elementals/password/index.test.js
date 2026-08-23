// What the field is showing, and what changes it. That is the whole of what this element
// decides - the rest is a button, an `aria-pressed` and a live region, which are wiring.
//
// The rule worth a test is the one that is not about the button at all: **submitting always
// masks**. A revealed field posts its value from an `<input type="text">`, and browsers
// remember what was typed into a text field - so a reader who revealed their password and
// pressed the button would have it offered back to them in an autofill list later, on a page
// that has nothing to do with passwords. Masking first costs nothing and is the difference.
//
// Deliberately not covered here: the DOM half - finding the control, the `aria-pressed` and the
// announcement are `dom.test.js`, which runs the element itself under jsdom. Hiding the button
// until the script is there is CSS, checked in a browser against the docs page.
//
// One platform fact was measured rather than assumed, because a whole feature hangs on it:
// flipping `input.type` between `password` and `text` keeps focus *and* the selection range
// in Chromium and WebKit. So there is no caret to save and put back - a reveal that dropped
// the reader at the end of what they had typed would be a reveal nobody uses twice. Firefox
// was not checked; no binary installed.

import { revealAfter } from './index.js';

test('the button is the only thing that reveals, and it goes both ways', () => {
  expect(revealAfter('toggle', false)).toBe(true);
  expect(revealAfter('toggle', true)).toBe(false);
});

test('submitting masks the field, whichever way the button was left', () => {
  // The security rule, and the reason it is not `revealAfter('submit', shown) === shown`:
  // a text input's value goes into the browser's own memory of what was typed into it.
  expect(revealAfter('submit', true)).toBe(false);
  expect(revealAfter('submit', false)).toBe(false);
});

test('resetting the form puts the mask back with the value', () => {
  // Reset returns the field to what the page loaded with, and what it loaded with was
  // masked. Leaving it revealed would show a value the reader never asked to see again.
  expect(revealAfter('reset', true)).toBe(false);
  expect(revealAfter('reset', false)).toBe(false);
});

test('anything else leaves the field exactly as the reader left it', () => {
  expect(revealAfter('input', true)).toBe(true);
  expect(revealAfter('blur', true)).toBe(true);
  expect(revealAfter('focus', false)).toBe(false);
});
