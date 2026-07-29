import { nextIndex } from './index.js';

test('nextIndex implements the APG accordion key map', () => {
  expect(nextIndex(0, 'ArrowDown', 3)).toBe(1);
  expect(nextIndex(1, 'ArrowUp', 3)).toBe(0);
  expect(nextIndex(0, 'Home', 3)).toBe(0);
  expect(nextIndex(0, 'End', 3)).toBe(2);
  expect(nextIndex(0, 'Tab', 3)).toBeNull(); // ignores unrelated keys
});

test('nextIndex wraps around both ends', () => {
  expect(nextIndex(2, 'ArrowDown', 3)).toBe(0);
  expect(nextIndex(0, 'ArrowUp', 3)).toBe(2);
});

test('nextIndex is a no-op for an empty group', () => {
  expect(nextIndex(0, 'ArrowDown', 0)).toBeNull();
  expect(nextIndex(0, 'Home', 0)).toBeNull();
});
