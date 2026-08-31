/**
 * The one place a `*-when` attribute is turned into something that can be watched:
 * `open-when` on a disclosure, `vertical-when` on a splitter, `flyout-when` on a menu.
 * All three ask the same question - *is this condition true, and tell me when that
 * changes* - and all three want the same two rulers to be able to answer it.
 *
 * A plain media query is `matchMedia`'s and comes back as the browser's own
 * `MediaQueryList`. A condition behind `container:` measures the nearest ancestor
 * container instead, for an element inside a component whose width is not the page's,
 * and comes back wearing the same three members so nothing downstream has to know which
 * ruler measured.
 *
 * Both halves are torn down through {@link unwatchQuery}, which is the only place that
 * knows the container half has anything of its own to take down.
 */

/** One probe rule per watching element: two elements on a page carry their own conditions,
 * so the rule's subject has to name which element it is about. */
let probeCount = 0;

const CONTAINER = 'container:';

/** CSS's own words, which a condition can open with and a container name cannot be. */
const KEYWORDS = ['not', 'and', 'or'];

/** The container queries no observer can hear a change of: a custom property moving, or a
 * sticky box changing state. Both are things CSS itself reacts to and script is never told
 * about. */
const UNHEARD = /(^|[\s(])(style|scroll-state)\s*\(/;

/**
 * Watch what an attribute names, viewport or container.
 *
 * @param {Element} element - The element the condition is about, and the subject of the probe rule.
 * @param {string|null} query - The attribute's value, e.g. `(min-width: 30rem)` or `container:card (min-width: 20rem)`.
 * @returns {MediaQueryList|{matches: boolean, addEventListener: Function, removeEventListener: Function, stop: Function}|null}
 *   Null when there is nothing to watch, or nothing to watch it with - see {@link watchContainer}.
 */
export function watchQuery(element, query) {
  const condition = query ? query.trim() : '';
  if (!condition) return null;
  if (!condition.startsWith(CONTAINER)) {
    return window.matchMedia ? window.matchMedia(condition) : null;
  }
  return watchContainer(element, condition.slice(CONTAINER.length).trim());
}

/**
 * Stop watching, and hand back `null` for the caller to keep.
 *
 * @param {object|null} query - What {@link watchQuery} returned.
 * @param {Function} listener - The `change` listener that was put on it.
 * @returns {null}
 */
export function unwatchQuery(query, listener) {
  if (!query) return null;
  query.removeEventListener('change', listener);
  // Only the container half put anything up. A `MediaQueryList` is the browser's to keep.
  if (query.stop) query.stop();
  return null;
}

/**
 * Answer a container query, in the shape of a `MediaQueryList`.
 *
 * `matchMedia` can only measure the viewport, and no API evaluates a container query from
 * script - so the condition is handed to the browser as a real `@container` rule setting a
 * custom property on the element, and `matches` reads the answer back out of the computed
 * styles, live. The rule resolves against the nearest ancestor container on its own; the
 * walk in {@link nearestContainer} only finds the box whose resizes can change the answer,
 * so a `ResizeObserver` on it can play the part of the `change` event.
 *
 * Null - the attribute ignored, the element left as the markup wrote it - when there is no
 * `ResizeObserver` to hear a crossing, and when the condition is one no observer could hear
 * anyway: `style()` and `scroll-state()` flip without a resize and without an event, so the
 * honest answer is not to take the attribute rather than to read it once and go stale. The
 * condition is the author's own attribute on the author's own page: nothing crosses a trust
 * boundary on its way into the rule.
 *
 * @param {Element} element
 * @param {string} condition - What followed `container:`.
 * @returns {{matches: boolean, addEventListener: Function, removeEventListener: Function, stop: Function}|null}
 */
function watchContainer(element, condition) {
  if (!window.ResizeObserver) return null;
  // Refused whole, mixed conditions included: a `style()` beside a size query would be
  // re-read on resizes and on nothing else, which is an element that is right often enough
  // to be trusted and wrong the rest of the time.
  if (UNHEARD.test(condition)) return null;

  const id = String(++probeCount);
  element.dataset.elementalProbe = id;
  const subject = '[data-elemental-probe="' + id + '"]';
  const style = document.createElement('style');
  // The denial first, and outside the query: `--elemental-probe` is a custom property and
  // therefore inherits, so a probing element inside another one would read its ancestor's
  // answer as its own. A `@container` block adds no specificity to what is inside it, which
  // leaves the two rules tied and source order deciding.
  style.textContent = subject + '{--elemental-probe:no}' +
    '@container ' + condition + '{' + subject + '{--elemental-probe:yes}}';
  document.head.append(style);

  const container = nearestContainer(element, condition);
  // ponytail: one listener, not a set. Each element takes exactly one out, and a set would
  // be the `MediaQueryList` shape carrying something nothing in the book puts in it.
  let listener = null;
  const observer = new window.ResizeObserver(() => {
    if (listener) listener(query);
  });

  const query = {
    get matches() {
      return window.getComputedStyle(element).getPropertyValue('--elemental-probe').trim() === 'yes';
    },
    addEventListener(type, fn) {
      listener = fn;
      // Nothing above is a container, so the rule can never match and no resize can change
      // that. The reading stays honestly false rather than the element pretending to watch.
      if (container) observer.observe(container);
    },
    removeEventListener() {
      listener = null;
      observer.disconnect();
    },
    stop() {
      listener = null;
      observer.disconnect();
      style.remove();
      delete element.dataset.elementalProbe;
    }
  };

  return query;
}

/**
 * The container name a condition opens with, or `''` for one that names none.
 *
 * A name is a single identifier ahead of the query, so anything opening with a parenthesis
 * has none - and `not`, which is the one keyword a condition can open with, is not a name
 * however much it looks like one. Reading it as one was an element that watched a container
 * that does not exist: the first reading right, every crossing after it missed.
 *
 * @param {string} condition
 * @returns {string}
 */
function containerName(condition) {
  const match = /^([^\s(]+)\s/.exec(condition);
  if (!match) return '';
  return KEYWORDS.indexOf(match[1]) === -1 ? match[1] : '';
}

/**
 * The box whose resizes can change the answer: the nearest ancestor that is a container,
 * and one carrying the name where the condition gives one - the same narrowing the rule
 * itself does.
 *
 * @param {Element} element
 * @param {string} condition
 * @returns {Element|null}
 */
function nearestContainer(element, condition) {
  const name = containerName(condition);
  let node = element.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    const type = style.containerType;
    if (type && type !== 'normal' && (!name || (style.containerName || '').split(' ').indexOf(name) !== -1)) return node;
    node = node.parentElement;
  }
  return null;
}
