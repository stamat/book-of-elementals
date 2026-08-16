// The two sums this element does, and the only two decisions it makes that are not a
// listener or an attribute: how many copies of the track it takes to cover the container
// without a gap, and how long one lap of the loop should last at the speed asked for.
//
// Both are pure on purpose. The clone count is the part every marquee gets wrong - a
// hard-coded pair of copies looks right on the laptop it was written on and leaves a hole
// on a wide screen - so it is the part worth pinning to numbers rather than to a browser.
//
// Deliberately not covered: the cloning itself, `inert` and `aria-hidden` on the copies,
// the pause control, and the reduced-motion branch. Jest runs under Node here with no
// jsdom, so an element test would assert against a stub base class - and a clone the
// keyboard can still reach is a bug only a real browser can show, so those are checked by
// `script/a11y` over the docs page instead.

import { cloneCount, cycleDuration, MAX_CLONES, DEFAULT_SPEED } from './index.js';

test('a track that already fills the container is still cloned once, because none at all is a visible jump', () => {
  // The strip has to be at least the container plus one repeat long: the animation ends
  // with the original translated fully out of frame, and whatever is behind it is what
  // the reader sees at that moment. With nothing behind it that is empty container.
  expect(cloneCount(1000, 0, 1000)).toBe(1);
  expect(cloneCount(4000, 0, 1000)).toBe(1);
});

test('a container much wider than the track is covered by counting, not by guessing', () => {
  expect(cloneCount(500, 0, 1000)).toBe(2);
  expect(cloneCount(500, 0, 1001)).toBe(3);
  expect(cloneCount(300, 0, 1200)).toBe(4);
});

test('the gap after the last copy is one the strip does not have, and the count pays for it', () => {
  // A strip of n+1 copies has n gaps in it and none on the end, so it is one gap shorter
  // than `(n + 1) x repeat` - and a count that assumed the longer figure leaves a sliver of
  // empty container in the last frames before the lap wraps. Measured in WebKit against a
  // 424px track, a 32px gap and a 900px container: two copies behind the original come to
  // 1336px where 1356px is what covers the frame, and that 20px is the blink.
  expect(cloneCount(424, 32, 900)).toBe(3);
  // The same numbers with the gap closed up need one copy fewer, which is the gap being
  // what the extra copy is for rather than a rounding cushion.
  expect(cloneCount(424, 0, 900)).toBe(3);
  expect(cloneCount(450, 0, 900)).toBe(2);
  expect(cloneCount(450, 1, 900)).toBe(2);
});

test('a track with no width is not cloned at all, because there is nothing to loop', () => {
  expect(cloneCount(0, 0, 1000)).toBe(0);
  expect(cloneCount(-10, 0, 1000)).toBe(0);
  expect(cloneCount(NaN, 0, 1000)).toBe(0);
});

test('a container with no width is not measured, it is waited for', () => {
  // Inside a closed `<details>`, on a `display: none` tab panel, or before layout: the
  // element measures zero and cloning against that number would fill the page with copies
  // the moment it is opened.
  expect(cloneCount(500, 0, 0)).toBe(0);
  expect(cloneCount(500, 0, NaN)).toBe(0);
});

test('a gap that is not a number is no gap, rather than a count of NaN copies', () => {
  expect(cloneCount(500, NaN, 1000)).toBe(2);
});

test('the clone count is capped, and past the cap a gap is the honest answer', () => {
  // One narrow item against a wide screen asks for hundreds of copies. Every copy is a
  // subtree in the document, so the cap is the bound: the loop shows a gap, which is a
  // thing the author can see and fix with more content, rather than a page that quietly
  // grew a thousand nodes.
  expect(cloneCount(1, 0, 100000)).toBe(MAX_CLONES);
});

test('one lap lasts the distance divided by the speed, in seconds', () => {
  expect(cycleDuration(1000, 50)).toBe(20);
  expect(cycleDuration(600, 60)).toBe(10);
});

test('a speed that is not a number falls back rather than freezing the strip mid-screen', () => {
  // `speed="fast"` is the attribute an author writes once. A `NaN` duration is an
  // animation that never runs, with the track parked wherever the clones left it.
  expect(cycleDuration(1000, NaN)).toBe(1000 / DEFAULT_SPEED);
  expect(cycleDuration(1000, 0)).toBe(1000 / DEFAULT_SPEED);
  expect(cycleDuration(1000, -50)).toBe(1000 / DEFAULT_SPEED);
});

test('nothing to travel takes no time, and says so with a zero rather than a division', () => {
  expect(cycleDuration(0, 50)).toBe(0);
  expect(cycleDuration(NaN, 50)).toBe(0);
});
