// The three things this element decides without a listener or an attribute to hand it the
// answer: which key an arrow means on the axis the tablist is running, which tab a
// `selected` attribute is naming, and - when a page has asked for the sliding bar - where
// along the strip that bar goes and how much of it it covers.
//
// Deliberately not covered: the roles, the roving tabindex, the panels going up and down,
// the deep link and `beforematch`. Jest runs under Node here with no jsdom, so an element
// test would assert against a stub base class; those are checked by `script/a11y` over the
// docs page instead. The measuring half of the bar - the `ResizeObserver`, and reading a
// rect out of a real layout - is the same story, which is why `barBox` takes the two rects
// rather than going and finding them.

import { barBox, selectedIndex, tabKey } from './index.js';

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

test('the bar is as wide as the selected tab, and starts where that tab starts', () => {
  const strip = { top: 40, left: 100, right: 500, width: 400, height: 36 };
  const tab = { top: 40, left: 180, right: 260, width: 80, height: 36 };
  expect(barBox(strip, tab, false, false)).toEqual({ start: 80, size: 80 });
});

test('a tab flush with the start of the strip has nothing to be offset by', () => {
  const strip = { top: 0, left: 100, right: 500, width: 400, height: 36 };
  const tab = { top: 0, left: 100, right: 190, width: 90, height: 36 };
  expect(barBox(strip, tab, false, false)).toEqual({ start: 0, size: 90 });
});

test('in RTL the strip starts on the right, so the offset is measured back from there', () => {
  // The bar is placed with `inset-inline-start`, which is the right edge here - measuring
  // from the left would put it as far from the tab as the tab is from the middle.
  const strip = { top: 0, left: 100, right: 500, width: 400, height: 36 };
  const tab = { top: 0, left: 340, right: 420, width: 80, height: 36 };
  expect(barBox(strip, tab, false, true)).toEqual({ start: 80, size: 80 });
});

test('a vertical strip measures down it instead, and RTL does not turn that around', () => {
  // The block axis runs top to bottom in both directions, so a vertical tablist has one
  // answer and not two.
  const strip = { top: 40, left: 0, right: 120, width: 120, height: 300 };
  const tab = { top: 112, left: 0, right: 120, width: 120, height: 36 };
  expect(barBox(strip, tab, true, false)).toEqual({ start: 72, size: 36 });
  expect(barBox(strip, tab, true, true)).toEqual({ start: 72, size: 36 });
});

test('subpixel layout is kept as it was measured', () => {
  // Rounding here is the bar landing a pixel short of the tab it is drawn under, on every
  // tab set whose labels do not fall on whole pixels - which is most of them.
  const strip = { top: 0, left: 8.5, right: 400, width: 391.5, height: 36 };
  const tab = { top: 0, left: 100.25, right: 180.75, width: 80.5, height: 36 };
  expect(barBox(strip, tab, false, false)).toEqual({ start: 91.75, size: 80.5 });
});
