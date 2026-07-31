import { placeFlyout, placeSubmenu, typeAheadIndex } from './index.js';

const VIEWPORT = { width: 1000, height: 800 };
const PANEL = { width: 200, height: 300 };
const rect = (left, top, width = 100, height = 30) => ({
  left, top, right: left + width, bottom: top + height
});

test('a button with room below and to the right keeps the preferred placement', () => {
  expect(placeFlyout(rect(20, 20), PANEL, VIEWPORT, false)).toEqual({
    side: 'block-end',
    align: 'start'
  });
});

test('a button near the bottom right opens up and back to the left', () => {
  expect(placeFlyout(rect(900, 760), PANEL, VIEWPORT, false)).toEqual({
    side: 'block-start',
    align: 'end'
  });
});

test('a button hemmed in on both sides keeps the preferred placement anyway', () => {
  const tiny = { width: 400, height: 100 };
  expect(placeFlyout(rect(20, 40), PANEL, tiny, false)).toEqual({
    side: 'block-end',
    align: 'start'
  });
});

test('right to left flips which edge counts as the start', () => {
  // Flush against the left edge: aligning to the inline start in RTL runs the panel off
  // that edge, so it has to run the other way.
  expect(placeFlyout(rect(0, 20), PANEL, VIEWPORT, true).align).toBe('end');
  expect(placeFlyout(rect(900, 20), PANEL, VIEWPORT, true).align).toBe('start');
});

test('a submenu with room beside it opens beside it, downwards', () => {
  expect(placeSubmenu(rect(20, 20), PANEL, VIEWPORT, false)).toEqual({
    side: 'inline-end',
    align: 'start'
  });
});

test('a submenu in the bottom right corner opens up and to the left', () => {
  expect(placeSubmenu(rect(880, 700), PANEL, VIEWPORT, false)).toEqual({
    side: 'inline-start',
    align: 'end'
  });
});

test('a submenu in RTL prefers the left and flips to the right', () => {
  expect(placeSubmenu(rect(500, 20), PANEL, VIEWPORT, true).side).toBe('inline-end');
  expect(placeSubmenu(rect(20, 20), PANEL, VIEWPORT, true).side).toBe('inline-start');
});

const LABELS = ['Profile', 'Preferences', 'Archive', 'Sign out'];

test('a typed letter finds the next item starting with it', () => {
  expect(typeAheadIndex(LABELS, 0, 'a')).toBe(2);
  expect(typeAheadIndex(LABELS, 0, 's')).toBe(3);
});

test('the search starts after the focused item, and wraps', () => {
  // on "Profile", `p` moves on to "Preferences" rather than staying put
  expect(typeAheadIndex(LABELS, 0, 'p')).toBe(1);
  // and from the last item it comes back round to the first
  expect(typeAheadIndex(LABELS, 3, 'p')).toBe(0);
});

test('a repeated letter cycles the items starting with it', () => {
  expect(typeAheadIndex(LABELS, 0, 'pp')).toBe(1);
  expect(typeAheadIndex(LABELS, 1, 'ppp')).toBe(0);
});

test('a buffer being typed narrows onto the item already focused', () => {
  // "Preferences" is focused and `pre` still describes it: stay, do not skip on
  expect(typeAheadIndex(LABELS, 1, 'pre')).toBe(1);
  expect(typeAheadIndex(LABELS, 1, 'pro')).toBe(0);
});

test('matching ignores case and the whitespace markup leaves behind', () => {
  expect(typeAheadIndex(['\n  Archive\n', 'Sign out'], -1, 'ARC')).toBe(0);
});

test('nothing typed, nothing matching, and an empty menu all move nowhere', () => {
  expect(typeAheadIndex(LABELS, 0, '')).toBeNull();
  expect(typeAheadIndex(LABELS, 0, 'z')).toBeNull();
  expect(typeAheadIndex([], 0, 'a')).toBeNull();
});
