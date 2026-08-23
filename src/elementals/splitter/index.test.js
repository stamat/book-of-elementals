// The two sums this element does: which way a key moves the primary pane, and where a pointer
// puts the separator.
//
// The key map is the part worth pinning to numbers rather than to a screen, because the answer
// moves twice. It moves with the axis — an Up arrow on a splitter between a left and a right
// pane belongs to the page, not to the widget — and on the horizontal axis it moves again with
// the writing direction, where the primary pane is the one on the right and ArrowLeft is the
// key that makes it bigger. Both are exactly the sort of thing that reads correct and ships
// backwards.
//
// The pointer sum's whole subtlety is that the track is the box minus the handle. Reading it
// off the full box is off by a handle width at one end and impossible to reach at the other,
// and the stylesheet sizes its first grid track out of the same subtraction — so these numbers
// are what says the two agree.
//
// Deliberately not covered: the listeners, the pointer capture, the collapse-and-restore
// bookkeeping and the ARIA the element writes. Jest runs under Node here with no jsdom, so an
// element test would assert against a stub base class — `script/a11y` drives the docs demo
// instead, which is where a name that went missing or a value out of its range shows up.

import { splitterKey, positionFrom, DEFAULT_POSITION } from './index.js';

/** A 200x100 box at the origin. Wider than it is tall, so a bug that swaps the two axes cannot
 * hide behind a square. */
const box = { left: 0, top: 0, width: 200, height: 100 };

test('the default position is down the middle', () => {
  expect(DEFAULT_POSITION).toBe(50);
});

test('the arrows on the splitter axis shrink and grow the primary pane', () => {
  expect(splitterKey('ArrowLeft', false, false)).toBe('shrink');
  expect(splitterKey('ArrowRight', false, false)).toBe('grow');
  expect(splitterKey('ArrowUp', true, false)).toBe('shrink');
  expect(splitterKey('ArrowDown', true, false)).toBe('grow');
});

test('the arrows on the other axis stay the page\'s, so the document still scrolls', () => {
  // Not an unused key: Up and Down on a side-by-side splitter are how a reader inside one
  // scrolls the page, and a widget that swallowed them would take that away without replacing
  // it with anything.
  expect(splitterKey('ArrowUp', false, false)).toBe(null);
  expect(splitterKey('ArrowDown', false, false)).toBe(null);
  expect(splitterKey('ArrowLeft', true, false)).toBe(null);
  expect(splitterKey('ArrowRight', true, false)).toBe(null);
});

test('in a right-to-left page the left arrow is the one that grows the primary pane', () => {
  // The primary pane is the first child, and the first column in an RTL page is the one on the
  // right — so the arrow that moves the separator away from it is ArrowLeft.
  expect(splitterKey('ArrowLeft', false, true)).toBe('grow');
  expect(splitterKey('ArrowRight', false, true)).toBe('shrink');
});

test('the writing direction does not reach the stacked axis', () => {
  // Down is down in every direction. An RTL page that swapped these would be a splitter whose
  // panes moved the opposite way from the arrow pressed.
  expect(splitterKey('ArrowUp', true, true)).toBe('shrink');
  expect(splitterKey('ArrowDown', true, true)).toBe('grow');
});

test('Home and End are the ends of the range, and Enter is the collapse', () => {
  expect(splitterKey('Home', false, false)).toBe('min');
  expect(splitterKey('End', false, false)).toBe('max');
  expect(splitterKey('Enter', false, false)).toBe('collapse');
});

test('a key the pattern does not name is not this element\'s to handle', () => {
  expect(splitterKey('Tab', false, false)).toBe(null);
  expect(splitterKey(' ', false, false)).toBe(null);
  expect(splitterKey('Escape', false, false)).toBe(null);
  expect(splitterKey('PageDown', false, false)).toBe(null);
});

test('a pointer halfway across a box with no handle in it is halfway along the track', () => {
  expect(positionFrom(box, 100, 50)).toBe(50);
});

test('the track is the box minus the handle, and the pointer holds the handle\'s middle', () => {
  // 200 wide with a 20-wide handle leaves 180 of track. The pointer at 110 is holding the
  // handle's middle, so the handle's leading edge is at 100 — 100 of 180, not 110 of 200,
  // which would have been 55.
  expect(positionFrom(box, 110, 50, { size: 20 })).toBeCloseTo(55.556, 3);
});

test('the far end of the track is one handle short of the far edge of the box', () => {
  // The whole reason for the subtraction: at 100 the primary pane is as wide as the space
  // there is, and the handle sits in the rest. Measured against the full box instead, 100
  // would be a pane one handle wider than the box that holds it.
  expect(positionFrom(box, 190, 50, { size: 20 })).toBe(100);
  expect(positionFrom(box, 10, 50, { size: 20 })).toBe(0);
});

test('the box is measured from where it is, not from the corner of the screen', () => {
  const scrolled = { left: 500, top: 300, width: 200, height: 100 };
  expect(positionFrom(scrolled, 600, 350)).toBe(50);
});

test('stacked panes read the pointer down the page rather than across it', () => {
  expect(positionFrom(box, 0, 25)).toBe(0);
  expect(positionFrom(box, 0, 25, { vertical: true })).toBe(25);
});

test('a right-to-left page measures the primary pane from the right edge', () => {
  // Same pointer, opposite answer: the first column is the one on the right, so a pointer a
  // quarter of the way in from the left is three quarters of the way along the track.
  expect(positionFrom(box, 50, 50)).toBe(25);
  expect(positionFrom(box, 50, 50, { rtl: true })).toBe(75);
});

test('the writing direction does not reach the stacked axis here either', () => {
  expect(positionFrom(box, 0, 25, { vertical: true, rtl: true })).toBe(25);
});

test('a pointer outside the box cannot push the separator past either end', () => {
  // The pointer is outside on the frame the drag is released, and pointer capture reports
  // positions well beyond the box for the whole of a fast drag.
  expect(positionFrom(box, -5000, 50)).toBe(0);
  expect(positionFrom(box, 5000, 50)).toBe(100);
});

test('a box with no area is the start of the track rather than a position of Infinity', () => {
  // A pane inside a closed `<details>`, a hidden tab panel, or the frame before layout.
  // Dividing by that zero puts an Infinity into a `grid-template`, which drops the whole
  // declaration rather than the one value that was wrong.
  expect(positionFrom({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toBe(0);
  expect(positionFrom(box, 10, 10, { size: 500 })).toBe(0);
});

test('a handle size that is not a length is no handle, rather than a track of NaN', () => {
  // `--splitter-elemental-size` is the page's to set, so the width is measured rather than
  // assumed — and a measurement taken while the element is display:none is not a number.
  expect(positionFrom(box, 100, 50, { size: NaN })).toBe(50);
  expect(positionFrom(box, 100, 50, { size: -20 })).toBe(50);
});
