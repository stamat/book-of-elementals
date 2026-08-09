// The one decision this element makes that is not the browser's: which keys belong to the
// bar and which are left where they were pressed. Where a key lands once it is the bar's is
// `stepIndex`, covered in book-of-spells - including that the ends do not wrap, which is
// what leaves Tab as the only way out.
//
// Deliberately not covered: the wiring. Jest runs under Node here with no jsdom, so an
// element test would assert against a stub base class rather than a DOM - the roving
// tabindex, the role and the focus moves are checked in a browser against the docs page,
// and against the APG toolbar pattern this element claims to implement.

import { toolbarKey } from './index.js';

test('a bar across the page answers the horizontal arrows and leaves the vertical ones alone', () => {
  expect(toolbarKey('ArrowRight', false)).toBe('ArrowRight');
  expect(toolbarKey('ArrowLeft', false)).toBe('ArrowLeft');
  expect(toolbarKey('ArrowDown', false)).toBe(null);
  expect(toolbarKey('ArrowUp', false)).toBe(null);
});

// The other axis is not merely unused: a Down arrow on a horizontal bar is the page
// scrolling, and a toolbar that swallowed it would pin the page while the reader is in it.
test('a bar down the page answers the vertical arrows and leaves the horizontal ones alone', () => {
  expect(toolbarKey('ArrowDown', true)).toBe('ArrowDown');
  expect(toolbarKey('ArrowUp', true)).toBe('ArrowUp');
  expect(toolbarKey('ArrowRight', true)).toBe(null);
  expect(toolbarKey('ArrowLeft', true)).toBe(null);
});

test('the ends of the bar are reachable from either orientation', () => {
  for (const vertical of [true, false]) {
    expect(toolbarKey('Home', vertical)).toBe('Home');
    expect(toolbarKey('End', vertical)).toBe('End');
  }
});

// Tab is the only way out of a bar whose ends do not wrap, and Enter and Space are how a
// button gets pressed. Taking any of the three would leave the reader inside a toolbar they
// can walk and cannot use.
test('Tab, Enter and Space stay with the control the reader is on', () => {
  for (const vertical of [true, false]) {
    for (const key of ['Tab', 'Enter', ' ', 'Escape', 'a', 'PageDown']) {
      expect(toolbarKey(key, vertical)).toBe(null);
    }
  }
});
