import { selectedIndex, tabKey } from './index.js';

test('a horizontal tablist answers to Left and Right', () => {
  expect(tabKey('ArrowRight', false)).toBe('ArrowDown');
  expect(tabKey('ArrowLeft', false)).toBe('ArrowUp');
});

test('and ignores the other axis, which is what aria-orientation promises', () => {
  // Down on a horizontal tab strip is the page scrolling, and taking that key would be
  // taking it from a reader who is done with the tabs.
  expect(tabKey('ArrowDown', false)).toBeNull();
  expect(tabKey('ArrowUp', false)).toBeNull();
});

test('a vertical tablist swaps them over', () => {
  expect(tabKey('ArrowDown', true)).toBe('ArrowDown');
  expect(tabKey('ArrowUp', true)).toBe('ArrowUp');
  expect(tabKey('ArrowRight', true)).toBeNull();
  expect(tabKey('ArrowLeft', true)).toBeNull();
});

test('Home and End are on both axes', () => {
  expect(tabKey('Home', false)).toBe('Home');
  expect(tabKey('End', true)).toBe('End');
});

test('anything else is not a key this pattern has', () => {
  expect(tabKey('Enter', false)).toBeNull();
  expect(tabKey('a', true)).toBeNull();
});

test('the attribute names a tab by index', () => {
  expect(selectedIndex('0', 3)).toBe(0);
  expect(selectedIndex('2', 3)).toBe(2);
});

test('an index past the end is the last tab', () => {
  // Which is how a tab set survives one of its tabs being taken out from under a `selected`
  // that was pointing at it.
  expect(selectedIndex('9', 3)).toBe(2);
});

test('anything that is not an index in range is the first tab', () => {
  // A tab set with nothing selected is not a state this pattern has.
  expect(selectedIndex(null, 3)).toBe(0);
  expect(selectedIndex('', 3)).toBe(0);
  expect(selectedIndex('two', 3)).toBe(0);
  expect(selectedIndex('-1', 3)).toBe(0);
  expect(selectedIndex('1.7', 3)).toBe(1);
});

test('no tabs, no index to be out of range', () => {
  expect(selectedIndex('2', 0)).toBe(0);
});
