import { disclosureState, slideFrom } from './index.js';

test('an open disclosure is expanded and not hidden', () => {
  expect(disclosureState(true)).toEqual({ expanded: 'true', hidden: null });
});

test('a closed disclosure hides with until-found, so find-in-page still reaches it', () => {
  expect(disclosureState(false)).toEqual({ expanded: 'false', hidden: 'until-found' });
});

test('opening a hidden region slides from zero, since a hidden box has no height', () => {
  expect(slideFrom(true, true, 0)).toBe(0);
});

test('opening a region caught mid-close resumes from where it is', () => {
  expect(slideFrom(true, false, 120)).toBe(120);
});

test('closing slides from the height the region is at', () => {
  expect(slideFrom(false, false, 300)).toBe(300);
  expect(slideFrom(false, true, 40)).toBe(40);
});
