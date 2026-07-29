/**
 * Shared plumbing for every element in the book. Deliberately three small
 * functions and no base class - a base class would have to guess at a lifecycle
 * before there are enough elements to know what the lifecycle is.
 */

// Fall back to a plain base when HTMLElement is absent (e.g. Node under test),
// so element modules stay importable outside the browser.
export const ElementBase = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

/**
 * Read options off an element's attributes, accepting bare, `data-*` and
 * kebab-case forms. `data-*` wins when both are present.
 *
 * @param {HTMLElement} el
 * @param {Object<string, 'boolean'|'number'|'string'>} schema - camelCase option key to type.
 * @returns {Object} Only the options actually present on the element.
 */
export function readOptions(el, schema) {
  const options = {};
  for (const key in schema) {
    const kebab = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    const raw = el.dataset[key] != null ? el.dataset[key] : el.getAttribute(kebab);
    if (raw == null) continue;

    if (schema[key] === 'boolean') {
      // A bare attribute reads as '', which means "on".
      options[key] = raw !== 'false' && raw !== '0';
    } else if (schema[key] === 'number') {
      const num = parseFloat(raw);
      if (!Number.isNaN(num)) options[key] = num;
    } else {
      options[key] = raw;
    }
  }
  return options;
}

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
