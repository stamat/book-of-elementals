import { disclosureState, slideFrom, mediaOpen, mediaMode } from './index.js';

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

test('a disclosure without media is left alone, rather than being told to close', () => {
  expect(mediaOpen(null)).toBe(null);
});

test('a matching media query holds the region open', () => {
  expect(mediaOpen({ matches: true })).toBe(true);
});

test('a media query that stops matching hands the region back to the button, closed', () => {
  expect(mediaOpen({ matches: false })).toBe(false);
});

test('no media query writes no mode, so nothing styles off one that is not there', () => {
  expect(mediaMode(null)).toBe(null);
});

test('a matching query is the pinned mode', () => {
  expect(mediaMode(true)).toBe('pinned');
});

test('a query that does not match is the free mode, where the button is in charge', () => {
  expect(mediaMode(false)).toBe('free');
});
