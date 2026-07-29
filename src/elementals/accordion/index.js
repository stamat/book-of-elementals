import { ElementBase, readOptions, define } from '../../core.js';

/**
 * Compute the header to move focus to for a roving-arrow key press.
 * @param {number} current - Index of the currently focused header.
 * @param {string} key - KeyboardEvent.key value.
 * @param {number} length - Number of headers in the group.
 * @returns {number|null} Target index, or null if the key is unhandled.
 */
export function nextIndex(current, key, length) {
  if (length === 0) return null;
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % length;
    case 'ArrowUp':
      return (current - 1 + length) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}

const OPTIONS = { exclusive: 'boolean' };

// Monotonic counter for generating unique `name` values for exclusive groups.
let groupCount = 0;

/**
 * `<accordion-elemental>` custom element.
 *
 * A thin coordinator over native `<details>`/`<summary>` rather than a
 * reimplementation of the APG Accordion pattern. Native already provides the
 * disclosure semantics, Enter/Space activation, screen-reader announcement and
 * find-in-page expansion. This element only adds what native leaves out:
 *
 * - `exclusive`: assigns a shared `name` so only one panel stays open
 * - arrow/Home/End navigation between headers (APG accordion, optional but recommended)
 * - opening the panel that contains the current URL fragment
 * - an `accordion-toggle` event on the group, since `toggle` does not bubble
 *
 * Light DOM, no shadow root, so every part stays stylable by the page author.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */
export class AccordionElemental extends ElementBase {
  /** Direct-child panels only, so a nested accordion is not swallowed. */
  get panels() {
    return Array.from(this.querySelectorAll(':scope > details'));
  }

  /** The `<summary>` of each panel, in document order. */
  get headers() {
    return this.panels
      .map((panel) => panel.querySelector(':scope > summary'))
      .filter(Boolean);
  }

  connectedCallback() {
    // Wait until the light-DOM panels have been parsed. The bundle is loaded
    // deferred or at the end of the body, so by upgrade time they are there.
    if (this.initialized || !this.panels.length) return;
    this.initialized = true;

    this.options = Object.assign({ exclusive: false }, readOptions(this, OPTIONS));

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onHashChange = this.onHashChange.bind(this);

    if (this.options.exclusive) this.applyExclusive();

    this.addEventListener('keydown', this.onKeyDown);
    // `toggle` does not bubble, but non-bubbling events still run the capture
    // phase through ancestors - so capture is how the group hears its panels.
    this.addEventListener('toggle', this.onToggle, true);
    window.addEventListener('hashchange', this.onHashChange);

    this.openFromHash();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('toggle', this.onToggle, true);
    window.removeEventListener('hashchange', this.onHashChange);
    this.initialized = false;
  }

  /**
   * Give every panel the same `name`, which is what makes native `<details>`
   * mutually exclusive.
   */
  applyExclusive() {
    const panels = this.panels;

    // Close extras *before* naming them: assigning a shared name to several
    // already-open panels leaves it to the browser which one survives. Doing it
    // here means the first authored `open` wins, deterministically.
    let seenOpen = false;
    for (const panel of panels) {
      if (!panel.open) continue;
      if (seenOpen) panel.open = false;
      seenOpen = true;
    }

    // Remember the generated name so moving the group in the DOM re-uses it
    // instead of minting a new one on every reconnect.
    if (!this.groupName) {
      this.groupName = this.getAttribute('name') || 'accordion-elemental-' + (++groupCount);
    }
    for (const panel of panels) panel.name = this.groupName;
  }

  onKeyDown(e) {
    const summary = e.target.closest && e.target.closest('summary');
    if (!summary) return;
    const headers = this.headers;
    const current = headers.indexOf(summary);
    // -1 means the summary belongs to a nested accordion; let it handle itself.
    if (current === -1) return;

    const next = nextIndex(current, e.key, headers.length);
    if (next === null) return;
    e.preventDefault();
    headers[next].focus();
  }

  onToggle(e) {
    const panel = e.target;
    if (!this.panels.includes(panel)) return;
    this.dispatchEvent(new CustomEvent('accordion-toggle', {
      bubbles: true,
      detail: { panel: panel, open: panel.open }
    }));
  }

  onHashChange() {
    this.openFromHash();
  }

  /**
   * Open the panel containing the element the URL fragment points at, so a link
   * to a single question lands on it opened.
   *
   * ponytail: Chrome already auto-expands `<details>` on fragment navigation;
   * this covers the browsers that do not. Drop it once that is everywhere.
   */
  openFromHash() {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target || !this.contains(target)) return;

    // Walk up so a nested panel opens its ancestors too.
    let panel = target.closest('details');
    while (panel && this.contains(panel)) {
      panel.open = true;
      panel = panel.parentElement && panel.parentElement.closest('details');
    }
  }
}

define('accordion-elemental', AccordionElemental);
