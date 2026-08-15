// The one thing this element decides: how far along the bar is, as a percentage of `max`.
// Everything else a progress bar needs - `role="progressbar"`, the indeterminate state, the
// name a `<label>` gives it - is the browser's, because the child is a native `<progress>`.
// There is nothing there to test that would not be testing the platform.
//
// Deliberately not covered: what the element writes onto itself
// (`--progress-elemental-value`, `--progress-elemental-buffer`, `data-indeterminate`), the
// `MutationObserver` that catches a `<progress>` being moved, and the CSS that reads any of
// it. Jest runs under Node here with no jsdom, so an element test would be asserting
// against a stub base class; the bar is checked in a browser against the docs page.

import { percent } from './index.js';

test('the fill is the value over the max, as a percentage', () => {
  expect(percent(30, 100)).toBe(30);
  expect(percent(1, 4)).toBe(25);
  expect(percent(0.5, 1)).toBe(50);
});

test('a whole percentage comes out whole, and not as binary floating point', () => {
  // This number is written into an inline style on the element, where anyone reading the
  // DOM sees it - and `(55 / 100) * 100` is `55.00000000000001`.
  expect(percent(55, 100)).toBe(55);
  expect(percent(1, 3) * 3).toBeCloseTo(100);
});

test('both ends are as far as it goes, whatever the value says', () => {
  expect(percent(-20, 100)).toBe(0);
  expect(percent(140, 100)).toBe(100);
});

test('an empty bar and a full one are exactly that', () => {
  expect(percent(0, 100)).toBe(0);
  expect(percent(100, 100)).toBe(100);
});

test('a max that is no scale draws nothing, rather than a bar claiming it is finished', () => {
  // A bar drawn full because the denominator was nonsense is the silent lie this project
  // does not ship - empty is the honest drawing of "there is nothing to measure against".
  expect(percent(30, 0)).toBe(0);
  expect(percent(30, -5)).toBe(0);
  expect(percent(30, NaN)).toBe(0);
});

test('a value that is not a number is no value at all', () => {
  expect(percent(NaN, 100)).toBe(0);
  expect(percent(Infinity, 100)).toBe(0);
});
