import { exclusiveOpen } from './index.js';

test('a group authored with one panel open keeps it', () => {
  expect(exclusiveOpen([false, true, false])).toEqual([false, true, false]);
});

test('the first authored open wins, and the rest close', () => {
  // The whole point of doing this before the shared `name` goes on: leave two open panels
  // to the browser and which one survives is the browser's business, not the author's.
  expect(exclusiveOpen([true, true, true])).toEqual([true, false, false]);
  expect(exclusiveOpen([false, true, true])).toEqual([false, true, false]);
});

test('a group authored shut stays shut', () => {
  // Exclusive says at most one, not at least one - nothing here opens a panel.
  expect(exclusiveOpen([false, false])).toEqual([false, false]);
});

test('a group with no panels is not a special case', () => {
  expect(exclusiveOpen([])).toEqual([]);
});
