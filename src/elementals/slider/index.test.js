// The seven things this element decides: where a thumb sits on the track, what stops two of
// them crossing, which one is on top when they are piled together, which one a press on the
// track belongs to, where a pointer sits along the travel, which thumb it is over, and what
// value it would land on once the step has had it. Everything else a slider needs - the
// arrow keys, `Home`, `End`, `PageUp`/`PageDown`, `step`, touch, submission, `reset`,
// restore - is the browser's, because the thumbs are native range inputs. There is nothing
// there to test that would not be testing the platform.
//
// Deliberately not covered: what the element writes onto itself
// (`--slider-elemental-start`, `--slider-elemental-end`, `data-stacked`), the value bubble
// it appends for `tooltip` and the `--slider-elemental-at` on it, the pointer routing the
// stylesheet does, and the CSS that reads any of it. Jest runs under Node here with no
// jsdom, so an element test would be asserting against a stub base class; the track and the
// bubble are checked in a browser against the docs page.

import { alongTrack, clampPair, draggedThumb, nearerThumb, ratio, snapToStep, stackedThumb, thumbUnder, tooltipModes } from './index.js';

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

test('a point on the control is measured against the thumb travel, not the full width', () => {
  // A 116px control with a 16px thumb: the thumb's centre starts 8px in and stops 8px short,
  // so 100px of travel. The middle of that travel is 58px from the left edge, and both ends
  // of it are a thumb's centre rather than an edge of the box.
  expect(alongTrack(58, 0, 116, 16, false)).toBe(0.5);
  expect(alongTrack(8, 0, 116, 16, false)).toBe(0);
  expect(alongTrack(108, 0, 116, 16, false)).toBe(1);
});

test('a point past either end of the travel is that end, because the thumb cannot go further', () => {
  expect(alongTrack(0, 0, 116, 16, false)).toBe(0);
  expect(alongTrack(200, 0, 116, 16, false)).toBe(1);
});

test('the scrolled-away part of the page is not counted, and neither is the page margin', () => {
  // The rect is in viewport coordinates, so the control's own left edge is the origin.
  expect(alongTrack(158, 100, 116, 16, false)).toBe(0.5);
});

test('right to left, the minimum is the right-hand end and a point is measured from there', () => {
  expect(alongTrack(108, 0, 116, 16, true)).toBe(0);
  expect(alongTrack(8, 0, 116, 16, true)).toBe(1);
  expect(alongTrack(58, 0, 116, 16, true)).toBe(0.5);
});

test('a control with no room to travel puts every point at the start of the track', () => {
  // Same answer `ratio` gives a scale with no length, and for the same reason: there is one
  // place a thumb can be, and it is where a native range input parks its own.
  expect(alongTrack(50, 0, 16, 16, false)).toBe(0);
  expect(alongTrack(50, 0, 0, 16, false)).toBe(0);
});

test('a value lands on the nearest step, counted from the minimum and not from zero', () => {
  // `min="1" step="10"` is 1, 11, 21 - the platform counts steps from `min`, and a readout
  // saying 10 for a click the input would make 11 is a readout that lies about it.
  expect(snapToStep(14, 1, 101, 10)).toBe(11);
  expect(snapToStep(17, 1, 101, 10)).toBe(21);
  expect(snapToStep(37.4, 0, 100, 1)).toBe(37);
});

test('a fractional step reads out as it was written, not as binary floating point holds it', () => {
  // Three tenths of the way up a `step="0.1"` scale is `0.30000000000000004` before this,
  // and that is the number the reader would have seen in the bubble.
  expect(snapToStep(0.3, 0, 1, 0.1)).toBe(0.3);
  expect(snapToStep(0.28, 0, 1, 0.05)).toBe(0.3);
  expect(snapToStep(2.34, 0.5, 10, 0.25)).toBe(2.25);
});

test('no step is the value untouched, which is what `step="any"` asks for', () => {
  expect(snapToStep(37.4189, 0, 100, 0)).toBe(37.4189);
});

test('a step cannot take a value past the last notch its own scale actually has', () => {
  // `max` is not always a whole number of steps above `min`, and where it is not, the top of
  // the scale is out of reach: `min="0" max="100" step="40"` stops at 80, so rounding 100 up
  // to 120 and then clamping it back to 100 would read out a value the input cannot hold.
  expect(snapToStep(100, 0, 100, 40)).toBe(80);
  expect(snapToStep(-40, 5, 100, 30)).toBe(5);
});

test('the pointer is on a thumb while it is within the thumb, and on the track elsewhere', () => {
  // One thumb at the middle of a 116px control: its centre is 58px in and it is 16px across,
  // so 50 to 66 is on it and either side of that is track.
  expect(thumbUnder(58, 0, 116, 16, [0.5], false)).toBe(0);
  expect(thumbUnder(50, 0, 116, 16, [0.5], false)).toBe(0);
  expect(thumbUnder(66, 0, 116, 16, [0.5], false)).toBe(0);
  expect(thumbUnder(49, 0, 116, 16, [0.5], false)).toBe(-1);
  expect(thumbUnder(100, 0, 116, 16, [0.5], false)).toBe(-1);
});

test('the thumb the pointer is on is named by index, so a range says which end it is', () => {
  expect(thumbUnder(28, 0, 116, 16, [0.2, 0.8], false)).toBe(0);
  expect(thumbUnder(88, 0, 116, 16, [0.2, 0.8], false)).toBe(1);
  expect(thumbUnder(58, 0, 116, 16, [0.2, 0.8], false)).toBe(-1);
});

test('right to left, a thumb is on the other side of the control from its own value', () => {
  // The low thumb of a `0.2` / `0.8` range sits 20% from the *right*, which is 88px along a
  // 116px box - exactly where the high thumb was when the same range ran the other way.
  expect(thumbUnder(88, 0, 116, 16, [0.2, 0.8], true)).toBe(0);
  expect(thumbUnder(28, 0, 116, 16, [0.2, 0.8], true)).toBe(1);
});

test('with two thumbs on one value the pointer is on a thumb, and they read out the same', () => {
  expect(thumbUnder(58, 0, 116, 16, [0.5, 0.5], false)).toBe(0);
});

test('a bare `tooltip` is the thumb, which is the half a slider is asked for', () => {
  expect(tooltipModes('')).toEqual({ thumb: true, track: false });
  expect(tooltipModes('   ')).toEqual({ thumb: true, track: false });
});

test('the attribute is a token list, so a slider can have one bubble, the other, or both', () => {
  expect(tooltipModes('thumb')).toEqual({ thumb: true, track: false });
  expect(tooltipModes('track')).toEqual({ thumb: false, track: true });
  expect(tooltipModes('thumb track')).toEqual({ thumb: true, track: true });
  expect(tooltipModes('track thumb')).toEqual({ thumb: true, track: true });
});

test('a press on a thumb holds the bubble on that thumb, whatever the pointer does next', () => {
  // The reason there is a lock at all: a thumb snaps to notches while the pointer moves
  // smoothly, so half a step out the pointer is off the thumb it is dragging - and past
  // either end it is off the control. Recomputed each move, the bubble would flip to a
  // track reading under the reader's own hand.
  expect(draggedThumb(0, 1)).toBe(0);
  expect(draggedThumb(1, 2)).toBe(1);
});

test('a press on the track of a one-thumb slider is a drag of it, because the input takes it', () => {
  // Nothing here handles that press: with one input the native range jumps its own thumb to
  // it and carries straight on into a drag, so the bubble belongs to that thumb from the
  // press onwards.
  expect(draggedThumb(-1, 1)).toBe(0);
});

test('a press on the track of a range is no drag, because the press never reaches an input', () => {
  // Two stacked inputs have their pointer events on the thumbs, so a press on the track is
  // this element's - it moves the nearer thumb and stops there. Nothing is being dragged, so
  // nothing is locked and the bubble goes on answering where the pointer is.
  expect(draggedThumb(-1, 2)).toBe(-1);
});

test('no attribute is no bubble at all, and neither is a token this element does not know', () => {
  // Absent has to be distinguishable from present-and-empty, because the empty one is how an
  // author writes a boolean attribute and it is the one that means "yes, the thumb".
  expect(tooltipModes(null)).toEqual({ thumb: false, track: false });
  expect(tooltipModes('handle')).toEqual({ thumb: false, track: false });
});
