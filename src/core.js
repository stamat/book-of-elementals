/**
 * Shared plumbing for every element in the book, re-exported from book-of-spells rather
 * than kept as a second copy. `src/elements.mjs` there is where these ended up once the
 * two libraries wanted the same ones: registering a custom element, the key map every APG
 * list agrees on, and the placement maths a flyout and a tooltip ask the same question of.
 *
 * This module stays as the seam. Every elemental imports `../../core.js`, so what the book
 * takes from the spellbook is one file to read and one line to change.
 *
 * Reading options off attributes is not here either: that is `readOptions` in
 * book-of-spells, since it is a DOM concern rather than a custom-elements one.
 */
export {
  ElementBase,
  define,
  nextIndex,
  stepIndex,
  typeAheadIndex,
  fits,
  placeFlyout,
  placeSubmenu
} from 'book-of-spells/src/elements.mjs';
