import { navbarMode, stepIndex } from './index.js';

test('arrows step one way or the other, whichever axis they are on', () => {
  expect(stepIndex(0, 'ArrowRight', 4)).toBe(1);
  expect(stepIndex(0, 'ArrowDown', 4)).toBe(1);
  expect(stepIndex(2, 'ArrowLeft', 4)).toBe(1);
  expect(stepIndex(2, 'ArrowUp', 4)).toBe(1);
});

test('the ends do not wrap, because the pattern says "and it is not the last"', () => {
  // Off the end is where the rest of the page is: Tab's job, not an arrow's.
  expect(stepIndex(3, 'ArrowRight', 4)).toBeNull();
  expect(stepIndex(0, 'ArrowLeft', 4)).toBeNull();
});

test('Home and End go to the ends', () => {
  expect(stepIndex(2, 'Home', 4)).toBe(0);
  expect(stepIndex(2, 'End', 4)).toBe(3);
});

test('nothing focused steps onto the first item', () => {
  expect(stepIndex(-1, 'ArrowRight', 4)).toBe(0);
});

test('unhandled keys and empty sets move nowhere', () => {
  expect(stepIndex(0, 'Enter', 4)).toBeNull();
  expect(stepIndex(0, 'a', 4)).toBeNull();
  expect(stepIndex(0, 'ArrowRight', 0)).toBeNull();
});

test('a bar with room for its links is a bar', () => {
  expect(navbarMode(true, 0, 4)).toBe('bar');
});

test('a bar with some of them behind the overflow button is still a bar', () => {
  expect(navbarMode(true, 3, 4)).toBe('bar');
});

test('a bar with none of them left on it is a drawer', () => {
  // At which point the overflow button is not an overflow, it is the whole navigation.
  expect(navbarMode(true, 4, 4)).toBe('stack');
});

test('the media query outranks the measurement, in the one direction it can', () => {
  expect(navbarMode(false, 0, 4)).toBe('stack');
});

test('an empty bar is not a drawer', () => {
  // Nothing overflowed out of nothing: a navbar with no items at all has no reason to grow a
  // hamburger.
  expect(navbarMode(true, 0, 0)).toBe('bar');
});
