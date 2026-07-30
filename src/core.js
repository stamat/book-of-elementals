/**
 * Shared plumbing for every element in the book. Deliberately two small pieces and
 * no base class - a base class would have to guess at a lifecycle before there are
 * enough elements to know what the lifecycle is.
 *
 * Reading options off attributes is not here: that is `readOptions` in book-of-spells,
 * since it is a DOM concern rather than a custom-elements one.
 */

// Fall back to a plain base when HTMLElement is absent (e.g. Node under test),
// so element modules stay importable outside the browser.
export const ElementBase = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

/**
 * Register a custom element - in the browser only, and only once, so the module
 * is safe to import twice or to import under Node.
 * @param {string} tag
 * @param {Function} ctor
 */
export function define(tag, ctor) {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return;
  customElements.define(tag, ctor);
}

/**
 * Where an arrow, Home or End key moves focus in a wrapping list of widgets.
 *
 * Here rather than in one element because it is the same list in every APG pattern
 * that has one: the accordion's headers and the menu's items disagree about almost
 * everything else and not at all about this.
 *
 * @param {number} current - Index of the currently focused item, `-1` for none.
 * @param {string} key - KeyboardEvent.key value.
 * @param {number} length - Number of items in the list.
 * @returns {number|null} Target index, or null if the key is unhandled.
 */
export function nextIndex(current, key, length) {
  if (length === 0) return null;
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % length;
    case 'ArrowUp':
      // `<= 0` rather than a modulo, so both ways of being at the top land on the last
      // item: the first item wrapping round, and nothing focused at all - which is the
      // documented `-1`, and where Up on a closed menu button opens onto.
      return current <= 0 ? length - 1 : current - 1;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}
