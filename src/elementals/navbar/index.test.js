import * as book from '../../index.js';
import { hoverIntent, navbarMode, ownsRow, probeState, stepIndex, NavbarElemental } from './index.js';

test('the main entry still exports stepIndex, one binding from both modules', () => {
  // This module once declared its own copy of core's stepper, and `src/index.js`
  // star-exports both modules: to ES modules two declarations under one name are not an
  // error, the name is silently dropped from the entry - so the import worked from every
  // subpath and failed from the package itself.
  expect(book.stepIndex).toBe(stepIndex);
});

test('arrows step one way or the other, whichever axis they are on', () => {
  expect(stepIndex(0, 'ArrowRight', 4)).toBe(1);
  expect(stepIndex(0, 'ArrowDown', 4)).toBe(1);
  expect(stepIndex(2, 'ArrowLeft', 4)).toBe(1);
  expect(stepIndex(2, 'ArrowUp', 4)).toBe(1);
});

test('the ends do not wrap, because the pattern says "and it is not the last"', () => {
  // Off the end is where the rest of the page is: Tab's job, not an arrow's.
  expect(stepIndex(3, 'ArrowRight', 4)).toBeNull();
  expect(stepIndex(0, 'ArrowLeft', 4)).toBeNull();
});

test('Home and End go to the ends', () => {
  expect(stepIndex(2, 'Home', 4)).toBe(0);
  expect(stepIndex(2, 'End', 4)).toBe(3);
});

test('nothing focused steps onto the first item', () => {
  expect(stepIndex(-1, 'ArrowRight', 4)).toBe(0);
});

test('unhandled keys and empty sets move nowhere', () => {
  expect(stepIndex(0, 'Enter', 4)).toBeNull();
  expect(stepIndex(0, 'a', 4)).toBeNull();
  expect(stepIndex(0, 'ArrowRight', 0)).toBeNull();
});

test('a bar with room for its links is a bar', () => {
  expect(navbarMode(true, 0, 4)).toBe('bar');
});

test('a bar with some of them behind the overflow button is still a bar', () => {
  expect(navbarMode(true, 3, 4)).toBe('bar');
});

test('a bar with none of them left on it is a drawer', () => {
  // At which point the overflow button is not an overflow, it is the whole navigation.
  expect(navbarMode(true, 4, 4)).toBe('stack');
});

test('the media query outranks the measurement, in the one direction it can', () => {
  expect(navbarMode(false, 0, 4)).toBe('stack');
});

test('an empty bar is not a drawer', () => {
  // Nothing overflowed out of nothing: a navbar with no items at all has no reason to grow a
  // hamburger.
  expect(navbarMode(true, 0, 0)).toBe('bar');
});

test('a bar asked to keep two links is a drawer once only one of them fits', () => {
  // One link and an overflow button is a worse drawer than the drawer.
  expect(navbarMode(true, 3, 4, 2)).toBe('stack');
  expect(navbarMode(true, 2, 4, 2)).toBe('bar');
});

test('a threshold taller than the bar has links makes it a drawer at every width', () => {
  expect(navbarMode(true, 0, 2, 3)).toBe('stack');
});

test('a nonsense threshold is one, which is what the element has always done', () => {
  expect(navbarMode(true, 3, 4, 0)).toBe('bar');
  expect(navbarMode(true, 4, 4, Number.NaN)).toBe('stack');
});

test('the row may sit as deep in the page markup as the page likes', () => {
  expect(ownsRow([])).toBe(true);
  expect(ownsRow(['nav', 'div', 'header'])).toBe(true);
});

test('a list another custom element wrote is that element\'s, not the bar\'s', () => {
  // The bug this exists for: a header with no links of its own still has a search field in it,
  // and the first list in the element is then the results panel. Taken as the row, its own box
  // becomes the rail - grid, clipped, with a copy of the panel measured beside it - and the
  // results are laid out as a bar that never wraps.
  expect(ownsRow(['suggest-elemental', 'search-elemental', 'div'])).toBe(false);
  expect(ownsRow(['ul', 'li', 'navbar-elemental'])).toBe(false);
});

test('a copy of a trigger is measured as a trigger, caret and all', () => {
  // The bug this exists for: the copy is built with its panels removed, so without this its
  // buttons are not triggers, the theme draws no caret on them, and every one measures a
  // caret narrower than the button it stands for.
  expect(probeState(true)).toEqual({ 'aria-expanded': 'false' });
});

test('a copy of a plain link carries nothing, because nothing is drawn on one', () => {
  expect(probeState(false)).toBeNull();
});

test('pointing at a trigger opens it, and closes every branch but its own', () => {
  expect(hoverIntent('products', 'products')).toEqual({ except: 'products', open: 'products' });
});

test('the pointer moving into an open panel is not an instruction to close it', () => {
  // The whole of the hover bug: a link inside a panel opens nothing, and closing "everything
  // with no panel under the cursor" is closing the panel the cursor is in.
  expect(hoverIntent('more', null)).toEqual({ except: 'more', open: null });
});

test('the bar around the items closes nothing, because the gap is a place to pass through', () => {
  // Between a button and the panel under it lies the bar's own padding. Closing there is
  // closing every panel the moment anyone reaches for one.
  expect(hoverIntent(null, null)).toBeNull();
});

test('`bar-when` is the only name for the query - the old `media` spelling is gone', () => {
  expect(NavbarElemental.observedAttributes).toEqual(['bar-when', 'min-bar-items', 'open']);
});
