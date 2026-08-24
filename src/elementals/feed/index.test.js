// The two decisions this element makes that are not the browser's: whose key a press is,
// and what to claim about a set whose size nobody has said. Where focus lands once a key is
// the feed's is arithmetic over the articles in the DOM, and belongs to `dom.test.js` with
// the rest of the wiring.
//
// Deliberately not covered here: the roles, the indices, the keyboard moves and the
// sentinel, which are all DOM and all in `dom.test.js`.

import { feedKey, feedSetSize } from './index.js';

test('Page Down and Page Up walk the feed while the reader is inside it', () => {
  expect(feedKey('PageDown', false)).toBe('next');
  expect(feedKey('PageUp', false)).toBe('previous');
});

// The pair the pattern exists to provide: an endless feed a keyboard cannot leave is the
// bug, and Control plus End is the way out of it.
test('Control and the ends are the way out of the feed', () => {
  expect(feedKey('End', true)).toBe('after');
  expect(feedKey('Home', true)).toBe('before');
});

// Home and End on their own are the page's, and inside a text field they are the field's -
// taking them would move the reader out of the feed mid-word.
test('the bare ends stay with the page, and paging with Control stays with the browser', () => {
  expect(feedKey('End', false)).toBe(null);
  expect(feedKey('Home', false)).toBe(null);
  expect(feedKey('PageDown', true)).toBe(null);
  expect(feedKey('PageUp', true)).toBe(null);
});

test('nothing else is taken from the reader', () => {
  for (const ctrl of [true, false]) {
    for (const key of ['Tab', 'Enter', ' ', 'Escape', 'ArrowDown', 'ArrowUp', 'a']) {
      expect(feedKey(key, ctrl)).toBe(null);
    }
  }
});

test('a feed told how many articles it has in all says so', () => {
  expect(feedSetSize('40', 10)).toBe(40);
});

// -1 is what the pattern means by "undetermined", and a feed still loading is exactly that.
// Answering with the loaded count instead would announce "article 10 of 10" to a reader
// standing one scroll away from the eleventh.
test('a feed that has not been told says -1, which is the pattern for undetermined', () => {
  expect(feedSetSize(null, 10)).toBe(-1);
  expect(feedSetSize('', 10)).toBe(-1);
  expect(feedSetSize('lots', 10)).toBe(-1);
  expect(feedSetSize('-4', 10)).toBe(-1);
});

// A total that has already been overtaken by the DOM is a stale number from the page, and
// "article 12 of 10" is worse than admitting the size is not known.
test('a total the page has already outgrown is not believed', () => {
  expect(feedSetSize('10', 12)).toBe(12);
  expect(feedSetSize('0', 3)).toBe(-1);
});
