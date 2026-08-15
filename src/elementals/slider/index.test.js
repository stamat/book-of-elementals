// The four things this element decides: where a thumb sits on the track, what stops two of
// them crossing, which one is on top when they are piled together, and which one a press on
// the track belongs to. Everything else a slider needs - the arrow keys, `Home`, `End`,
// `PageUp`/`PageDown`, `step`, touch, submission, `reset`, restore - is the browser's,
// because the thumbs are native range inputs. There is nothing there to test that would not
// be testing the platform.
//
// Deliberately not covered: what the element writes onto itself
// (`--slider-elemental-start`, `--slider-elemental-end`, `data-stacked`), the pointer
// routing the stylesheet does, and the CSS that reads any of it. Jest runs under Node here
// with no jsdom, so an element test would be asserting against a stub base class; the track
// is checked in a browser against the docs page.

import { clampPair, nearerThumb, ratio, stackedThumb } from './index.js';

test('a value is where it sits between the ends, as zero to one', () => {
  expect(ratio(50, 0, 100)).toBe(0.5);
  expect(ratio(0, 0, 100)).toBe(0);
  expect(ratio(100, 0, 100)).toBe(1);
  expect(ratio(20, 10, 30)).toBe(0.5);
});

test('a value past either end is that end, not a thumb off the track', () => {
  expect(ratio(-40, 0, 100)).toBe(0);
  expect(ratio(140, 0, 100)).toBe(1);
});

test('a scale with no length parks the thumb where a native range parks its own', () => {
  // Given `min` and `max` the same, or the wrong way round, a browser puts the thumb at the
  // start of the track - so that is what is drawn, rather than a fill of nonsense width.
  expect(ratio(50, 100, 100)).toBe(0);
  expect(ratio(50, 100, 0)).toBe(0);
  expect(ratio(NaN, 0, 100)).toBe(0);
});

test('thumbs that are already apart are left exactly where they are', () => {
  expect(clampPair(20, 80, 0, 'start', 0, 100)).toEqual([20, 80]);
  expect(clampPair(20, 80, 10, 'end', 0, 100)).toEqual([20, 80]);
});

test('the thumb being moved is the one that gives way, never the other end', () => {
  // Dragging the low thumb into the high one stops it. A drag that shoved the high thumb
  // along would change a value nobody touched.
  expect(clampPair(90, 80, 0, 'start', 0, 100)).toEqual([80, 80]);
  expect(clampPair(20, 10, 0, 'end', 0, 100)).toEqual([20, 20]);
});

test('a gap is kept between them, and the moved thumb pays for it', () => {
  expect(clampPair(78, 80, 10, 'start', 0, 100)).toEqual([70, 80]);
  expect(clampPair(20, 22, 10, 'end', 0, 100)).toEqual([20, 30]);
});

test('at the ends the other thumb has to move, because the moved one cannot', () => {
  // The low thumb dragged to the floor has no room behind it for the gap, so the high thumb
  // is what gets pushed up - the alternative is a range that refuses to reach its own
  // minimum.
  expect(clampPair(0, 5, 10, 'start', 0, 100)).toEqual([0, 10]);
  expect(clampPair(95, 100, 10, 'end', 0, 100)).toEqual([90, 100]);
});

test('a gap wider than the scale opens the pair as far as the scale goes', () => {
  expect(clampPair(40, 45, 500, 'start', 0, 100)).toEqual([0, 100]);
  expect(clampPair(40, 45, 500, 'end', 0, 100)).toEqual([0, 100]);
});

test('thumbs apart are not stacked, so neither is lifted', () => {
  expect(stackedThumb(20, 80, 100)).toBeNull();
});

test('piled up, the thumb with somewhere to go is the one on top', () => {
  // At the maximum the high thumb has nowhere left to go, so the low one is lifted and
  // every drag from there is downwards. Anywhere else the high one is lifted, so a drag
  // away from the pile widens the range instead of refusing to.
  expect(stackedThumb(100, 100, 100)).toBe('start');
  expect(stackedThumb(40, 40, 100)).toBe('end');
  expect(stackedThumb(0, 0, 100)).toBe('end');
});

test('a press on the track belongs to the nearer thumb', () => {
  expect(nearerThumb(10, 20, 80)).toBe('start');
  expect(nearerThumb(90, 20, 80)).toBe('end');
  expect(nearerThumb(30, 20, 80)).toBe('start');
});

test('with the thumbs piled up, the press moves the one it is pointing at', () => {
  // Every point on the track is equally far from two thumbs sitting on the same value, so
  // distance alone would answer the same thumb every time and half the track would be dead
  // - the clamp puts a low thumb dragged past the high one straight back.
  expect(nearerThumb(80, 50, 50)).toBe('end');
  expect(nearerThumb(20, 50, 50)).toBe('start');
});
