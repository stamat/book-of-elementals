// The decisions `<carousel-elemental>` makes on its own: how far a press of prev or next
// moves, which of the slides on screen counts as the current one, the name a slide gets
// when the markup gave it none, and what the `interval` attribute is allowed to mean.
//
// Deliberately not covered here: anything that needs a scroll container or an
// IntersectionObserver. This project's tests run in Node with no DOM, and a scroller
// faked in jsdom has no layout, so it would answer every question with zero and prove
// nothing. The roles, the focus order and the rotation control are checked by
// `script/a11y` over the built demos, in a real browser.

import { currentSlide, rotationInterval, slideName, stepSlide } from './index.js';

test('next moves on by one, and stops asking for a slide past the end', () => {
  expect(stepSlide(0, 1, 4, false)).toBe(1);
  expect(stepSlide(3, 1, 4, false)).toBe(3);
});

test('previous moves back by one, and not past the first', () => {
  expect(stepSlide(2, -1, 4, false)).toBe(1);
  expect(stepSlide(0, -1, 4, false)).toBe(0);
});

test('at the end of the scroll, next is the first slide again', () => {
  // The scroller's answer rather than the index's: with three slides on screen at once the
  // last two can never be the first visible one, so `current + 1` would be a press that
  // scrolls nowhere and a carousel that looks broken at the end.
  expect(stepSlide(7, 1, 10, true)).toBe(0);
});

test('at the start of the scroll, previous is the last slide', () => {
  expect(stepSlide(0, -1, 10, true)).toBe(9);
});

test('a carousel with no slides has no slide to move to', () => {
  expect(stepSlide(0, 1, 0, false)).toBe(0);
  expect(stepSlide(0, -1, 0, true)).toBe(0);
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
