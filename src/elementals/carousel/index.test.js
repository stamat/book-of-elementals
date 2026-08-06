// The decisions `<carousel-elemental>` makes on its own: how far a press of prev or next
// moves, which of the slides on screen counts as the current one, the name a slide gets
// when the markup gave it none, and what the `interval` attribute is allowed to mean.
//
// Deliberately not covered here: anything that needs a scroll container or an
// IntersectionObserver. This project's tests run in Node with no DOM, and a scroller
// faked in jsdom has no layout, so it would answer every question with zero and prove
// nothing. The roles, the focus order and the rotation control are checked by
// `script/a11y` over the built demos, in a real browser.

import { currentSlide, rotationInterval, scrollEdges, slideName, stepSlide } from './index.js';

test('next moves on by one, and stops at the end rather than wrapping', () => {
  // The buttons dim at the ends, and a control that looks spent and then jumps you back to
  // the first slide is a control that lied. The rotation is the only thing that wraps.
  expect(stepSlide(0, 1, 4)).toBe(1);
  expect(stepSlide(3, 1, 4)).toBe(3);
});

test('previous moves back by one, and not past the first', () => {
  expect(stepSlide(2, -1, 4)).toBe(1);
  expect(stepSlide(0, -1, 4)).toBe(0);
});

test('a carousel with no slides has no slide to move to', () => {
  expect(stepSlide(0, 1, 0)).toBe(0);
  expect(stepSlide(0, -1, 0)).toBe(0);
});

test('a row scrolled to nought is at its start', () => {
  expect(scrollEdges(0, 300, 900)).toEqual({ start: true, end: false });
});

test('and at its end when there is nothing left to scroll', () => {
  // Not `index === count - 1`, which is the version that breaks: with three slides on screen
  // of five, the row is at its end while the current slide is the third, and counting to the
  // last slide would leave two presses doing nothing.
  expect(scrollEdges(600, 300, 900)).toEqual({ start: false, end: true });
});

test('a row short enough to fit is at both ends at once', () => {
  // Which is the honest reading, and what dims both buttons: there is nowhere to go either
  // way, and two live buttons over a row that cannot move get pressed twice and distrusted.
  expect(scrollEdges(0, 900, 900)).toEqual({ start: true, end: true });
});

test('a right-to-left row scrolls negative and is at the same two ends', () => {
  expect(scrollEdges(-0, 300, 900)).toEqual({ start: true, end: false });
  expect(scrollEdges(-600, 300, 900)).toEqual({ start: false, end: true });
});

test('a fraction of a pixel either way is still an end', () => {
  // A percentage width or a zoomed page lands a hair short of the number the arithmetic
  // wants, and a next button left live over a row that cannot move is the bug that leaves.
  expect(scrollEdges(0.4, 300, 900).start).toBe(true);
  expect(scrollEdges(599.6, 300, 900).end).toBe(true);
});

test('the earliest slide on screen is the one the carousel is on', () => {
  // More than one slide fits, and the reader reads from the start of the row.
  expect(currentSlide([2, 3, 4], 0)).toBe(2);
  expect(currentSlide(new Set([5, 1, 3]), 0)).toBe(1);
});

test('with nothing on screen the carousel stays where it was', () => {
  // A scroller in a collapsed or display:none ancestor reports every slide as gone, and
  // moving the carousel to slide zero because a details element closed over it is a state
  // change nobody asked for.
  expect(currentSlide([], 4)).toBe(4);
});

test('a slide with no name of its own is named by its place in the set', () => {
  expect(slideName(0, 10)).toBe('1 of 10');
  expect(slideName(9, 10)).toBe('10 of 10');
});

test('the interval is however many milliseconds the attribute says', () => {
  expect(rotationInterval('8000')).toBe(8000);
});

test('and the default whenever the attribute is not a number of them', () => {
  // A typo in one attribute is not a reason for a carousel to stand still.
  expect(rotationInterval(null)).toBe(5000);
  expect(rotationInterval('')).toBe(5000);
  expect(rotationInterval('soon')).toBe(5000);
  expect(rotationInterval('-2000')).toBe(5000);
  expect(rotationInterval('0')).toBe(5000);
});

test('a rotation faster than a second is slowed to one', () => {
  // Below that it is a strobe, and it is also shorter than the smooth scroll it would be
  // interrupting - the carousel would never finish arriving anywhere.
  expect(rotationInterval('50')).toBe(1000);
});
