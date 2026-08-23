// The two decisions this element makes: what the parent checkbox says about a set of
// children, and where one press of it takes them. Everything else is wiring - reading the
// checkboxes, writing two properties onto the parent, firing the events a real click
// would have fired.
//
// The cycle is the APG's rather than the obvious one, so most of what is pinned here is
// the part that makes it worth having: a partial selection survives a round trip through
// the parent instead of being destroyed by the first press.
//
// Deliberately not covered here: the wiring - the two properties written onto the parent, the
// events a press synthesizes, and the reset and back-navigation paths are `dom.test.js`, which
// runs the element itself under jsdom. The look is checked in a browser against the docs page.

import { classify, cycle } from './index.js';

test('the parent says what the children say, in three states', () => {
  expect(classify([true, true])).toBe('all');
  expect(classify([false, false])).toBe('none');
  expect(classify([true, false])).toBe('some');
});

test('a group with nothing in it is not a group in a third state', () => {
  // No children is not "mixed" - there is nothing to be mixed about, and an element with
  // no children does not upgrade in the first place.
  expect(classify([])).toBe('none');
});

test('pressing a mixed parent turns everything on', () => {
  expect(cycle([true, false, true], null)).toEqual([true, true, true]);
});

test('pressing it again turns everything off', () => {
  expect(cycle([true, true, true], null)).toEqual([false, false, false]);
});

test('and pressing it once more gives the reader their own selection back', () => {
  // The whole reason for the APG's cycle: two ticks out of twenty are not destroyed by one
  // press of the parent, they are one more press away from coming back.
  expect(cycle([false, false, false], [true, false, true])).toEqual([true, false, true]);
});

test('with nothing partial to go back to, the cycle is two steps and not three', () => {
  // A remembered combination that is all on, all off, or absent is not a state worth
  // stopping at - it is the step the reader has just come from wearing a different name.
  expect(cycle([false, false], null)).toEqual([true, true]);
  expect(cycle([false, false], [true, true])).toEqual([true, true]);
  expect(cycle([false, false], [false, false])).toEqual([true, true]);
});

test('a remembered combination of the wrong length is no memory at all', () => {
  // Options added or removed since it was taken. Restoring it would put ticks against
  // whatever now happens to sit at those positions, which is worse than not restoring.
  expect(cycle([false, false, false], [true, false])).toEqual([true, true, true]);
});
