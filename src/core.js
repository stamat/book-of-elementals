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
import { define as defineNow } from 'book-of-spells/src/elements.mjs';

export {
  ElementBase,
  nextIndex,
  stepIndex,
  typeAheadIndex,
  fits,
  placeFlyout,
  placeSubmenu
} from 'book-of-spells/src/elements.mjs';

/**
 * Register a custom element - and, while the document is still being parsed, wait for the
 * parser to finish before doing it.
 *
 * **This is the one thing in the book that every element depends on and none of them says.**
 * A custom element is upgraded the moment its opening tag is parsed, which is before a single
 * one of its children exists. Every element here reads its children on upgrade - the
 * `<details>` an accordion coordinates, the `<input>` a password field reveals, the two panes
 * a splitter divides - so an element upgraded at its opening tag finds nothing there and does
 * nothing, silently, for good. Which is what a bundle in `<head>` without `defer` did to
 * twenty-one of the twenty-three elements in this book, measured, before this was here.
 *
 * Registering late is what makes that impossible rather than merely unlikely: nothing is
 * upgraded until `DOMContentLoaded`, so every element meets its markup complete, exactly as
 * it does when the script sits at the end of `<body>`. The cost is one task's delay in the
 * end-of-body case, where the parser has finished the markup anyway and `DOMContentLoaded` is
 * the next thing that happens - and none at all for a `defer`ed or module script, which runs
 * at `readyState: "interactive"` and takes the branch below.
 *
 * The case this does *not* cover is a page that appends an element and then its children,
 * both after load. That is not the parser handing over late, it is markup being built in an
 * order nothing can see the end of, and an element that guessed at when to look would be
 * guessing forever - `.update()` or a re-insert is the answer there.
 *
 * ponytail: this belongs upstream in book-of-spells' own `define`, which is where both
 * libraries would get it. It is here because this repo cannot publish that one, and the seam
 * is the file whose whole job is being the place a change like this lands.
 *
 * @param {string} tag
 * @param {Function} ctor
 */
export function define(tag, ctor) {
  if (typeof document === 'undefined' || document.readyState !== 'loading') {
    defineNow(tag, ctor);
    return;
  }
  document.addEventListener('DOMContentLoaded', () => defineNow(tag, ctor), { once: true });
}
