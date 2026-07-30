import { typeAheadIndex } from './index.js';

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
