// The decisions `<carousel-elemental>` makes on its own: how far a press of prev or next
// moves, which of the slides on screen counts as the current one, the name a slide gets
// when the markup gave it none, and what the `interval` attribute is allowed to mean.
//
// Deliberately not covered here: anything that needs a scroll container or an
// IntersectionObserver. This project's tests run in Node with no DOM, and a scroller
// faked in jsdom has no layout, so it would answer every question with zero and prove
// nothing. The roles, the focus order and the rotation control are checked by
// `script/a11y` over the built demos, in a real browser.
//
// Nor how far a finger has to travel to have meant it, nor that a gesture more down the page
// than across it is the page scrolling: those left with the hand-rolled gesture, and are
// `swipe()` in book-of-spells now, tested there. What stays here is the half that is the
// carousel's own - which way `left` points when the reader reads right to left.

import { currentSlide, rotationInterval, scrollEdges, slideName, startInset, stepSlide, swipeStep } from './index.js';

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

test('a swipe to the left asks for the next slide, and to the right the previous one', () => {
  expect(swipeStep('left', false)).toBe(1);
  expect(swipeStep('right', false)).toBe(-1);
});

test('and the other way round in a right-to-left carousel', () => {
  // The direction is the reader's, not the axis's: in Arabic or Hebrew the next slide is the
  // one to the right, which is where the scrolled mode already puts it - and a `fade` that
  // went the other way would disagree with the arrow sitting under it.
  expect(swipeStep('right', true)).toBe(1);
  expect(swipeStep('left', true)).toBe(-1);
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

test('a row with no scroll-padding scrolls the slide flush to its edge', () => {
  expect(startInset({ scrollPaddingLeft: 'auto', scrollPaddingRight: 'auto' }, false)).toBe(0);
  expect(startInset({ scrollPaddingLeft: '0px', scrollPaddingRight: '0px' }, false)).toBe(0);
});

test('and one with scroll-padding stops short of it by exactly that much', () => {
  // The bleed layout the card-row example is built on: the row runs to the edge of the page
  // and the cards line up with the text through `scroll-padding-inline-start`. Scrolling a
  // slide flush to the row's own edge there overshoots the snap point by the padding, and the
  // browser snaps on to the *next* slide - one press, two slides, and it reads as the element
  // losing count.
  expect(startInset({ scrollPaddingLeft: '206px', scrollPaddingRight: '0px' }, false)).toBe(206);
});

test('right to left, the start edge is the other one', () => {
  expect(startInset({ scrollPaddingLeft: '0px', scrollPaddingRight: '206px' }, true)).toBe(206);
});

test('a scroll-padding in something other than pixels is no padding at all', () => {
  // `getComputedStyle` resolves lengths to pixels, so anything else here is `auto` or a
  // keyword - and guessing at one would move the row by a number nobody wrote.
  expect(startInset({ scrollPaddingLeft: 'auto', scrollPaddingRight: 'auto' }, true)).toBe(0);
  expect(startInset({}, false)).toBe(0);
});

test('the carousel is on the first slide that has not gone past the start edge', () => {
  // Slide 0 is off to the left, slide 1 is sitting on the edge: the reader is on slide 1.
  expect(currentSlide([-292, 0, 292, 584], 0, 0)).toBe(1);
  expect(currentSlide([0, 292, 584], 0, 0)).toBe(0);
});

test('and the edge moves with the row\'s scroll-padding', () => {
  // The shelf layout: the row bleeds past its text and puts the inset back as padding, so
  // slide 0 sits in that padding still two thirds on screen. Measured against the scroller's
  // own box it would still read as current, the index would never advance, and the next
  // button would stop doing anything after one press.
  expect(currentSlide([-86, 206, 498], 206, 0)).toBe(1);
  expect(currentSlide([206, 498, 790], 206, 0)).toBe(0);
});

test('a fraction of a pixel short of the edge is still on it', () => {
  expect(currentSlide([205.6, 497.6], 206, 0)).toBe(0);
});

test('a row scrolled past every start edge is on its last slide', () => {
  // Where a row whose final slides are narrower than the viewport ends up.
  expect(currentSlide([-800, -500, -200], 0, 0)).toBe(2);
});

test('with nothing to measure the carousel stays where it was', () => {
  // A scroller in a collapsed or display:none ancestor, and a carousel that moved because a
  // details element folded over it is a change nobody asked for.
  expect(currentSlide([], 0, 4)).toBe(4);
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
