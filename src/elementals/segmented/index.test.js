// The one thing this element decides: which segment the knob belongs under, and whether
// there is a knob at all. Everything else a segmented control needs - arrows that move
// and select with a wrap, Tab in and out of the group once, submission, `required`,
// reset, restore - is the browser's, because the segments are native radio inputs. There
// is nothing there to test that would not be testing the platform.
//
// Deliberately not covered: what the element writes onto itself
// (`--segmented-elemental-index`, `--segmented-elemental-count`, `data-index`) and the
// CSS that reads it. Jest runs under Node here with no jsdom, so an element test would be
// asserting against a stub base class; the knob is checked in a browser against the
// docs page.

import { checkedIndex } from './index.js';

test('the knob belongs under the checked segment', () => {
  expect(checkedIndex([{ checked: false }, { checked: true }, { checked: false }])).toBe(1);
  expect(checkedIndex([{ checked: true }, { checked: false }])).toBe(0);
});

test('nothing checked is no knob at all, not a knob on the first segment', () => {
  // A group whose markup checks nothing has no selection, and drawing a knob under the
  // first segment would claim a choice nobody made.
  expect(checkedIndex([{ checked: false }, { checked: false }])).toBe(-1);
});

test('two checked is the first of them, as a browser reading that markup does', () => {
  expect(checkedIndex([{ checked: false }, { checked: true }, { checked: true }])).toBe(1);
});

test('an empty group has no index', () => {
  expect(checkedIndex([])).toBe(-1);
});
