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
