import { slide } from 'book-of-spells/src/animations.mjs';
import { readOptions } from 'book-of-spells/src/dom.mjs';
import { ElementBase, define } from '../../core.js';

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

/** Class of the wrapper the element puts around each panel body. */
const CONTENT_CLASS = 'accordion-elemental-content';

// Per-element state, kept off the attribute surface so it cannot be styled,
// serialised or collided with by the page.
const CLOSING = Symbol('closing');
const DETACHED_NAME = Symbol('detachedName');

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
 * - a height animation on open and close
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
    this.onClick = this.onClick.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onHashChange = this.onHashChange.bind(this);

    this.wrapPanels();
    if (this.options.exclusive) this.applyExclusive();

    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('click', this.onClick);
    // `toggle` does not bubble, but non-bubbling events still run the capture
    // phase through ancestors - so capture is how the group hears its panels.
    this.addEventListener('toggle', this.onToggle, true);
    window.addEventListener('hashchange', this.onHashChange);

    this.openFromHash();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('toggle', this.onToggle, true);
    window.removeEventListener('hashchange', this.onHashChange);
    this.initialized = false;
  }

  /**
   * Wrap each panel body in a div, because a height transition needs one box to
   * measure and clip and `<details>` hands you a bare run of siblings. Idempotent,
   * so moving the group in the DOM does not nest a second wrapper.
   *
   * ponytail: `::details-content` is the wrapper the platform already has, but
   * animating it from 0 to `auto` also needs `interpolate-size`, which is not
   * everywhere yet. Drop the div for the pseudo-element once it is.
   */
  wrapPanels() {
    for (const panel of this.panels) {
      const summary = panel.querySelector(':scope > summary');
      if (!summary) continue;
      if (panel.querySelector(':scope > .' + CONTENT_CLASS)) continue;

      const content = document.createElement('div');
      content.className = CONTENT_CLASS;
      // Everything after the summary is the panel body.
      let node = summary.nextSibling;
      while (node) {
        const next = node.nextSibling;
        content.appendChild(node);
        node = next;
      }
      panel.appendChild(content);
    }
  }

  /** @returns {HTMLElement|null} A panel's body wrapper. */
  contentOf(panel) {
    return panel.querySelector(':scope > .' + CONTENT_CLASS);
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

    // Remember the name so moving the group in the DOM re-uses it instead of
    // minting a new one on every reconnect. A name already on the panels is kept:
    // that is how an author gets exclusivity with scripting off, since without a
    // shared `name` in the markup there is nothing for the browser to enforce.
    if (!this.groupName) {
      this.groupName = this.getAttribute('name')
        || (panels[0] && panels[0].getAttribute('name'))
        || 'accordion-elemental-' + (++groupCount);
    }
    for (const panel of panels) panel.name = this.groupName;
  }

  /**
   * Open a panel and slide its body down. The panel opens first, since the body
   * is `display: none` until it does and an unrendered box has no height.
   */
  openPanel(panel) {
    const content = this.contentOf(panel);
    if (!content) {
      panel.open = true;
      return;
    }

    // Close the siblings here rather than leaving it to the shared `name`, which
    // would shut them instantly the moment this one opens.
    if (this.options.exclusive) {
      for (const other of this.panels) {
        if (other !== panel && other.open && !other[CLOSING]) this.closePanel(other);
      }
    }

    // Measure before opening. Once `open` is set the body is already at full
    // height, and a slide that starts where it ends is not a slide. A panel
    // caught mid-close is rendered already, so its height is the honest start.
    const from = panel.open ? content.offsetHeight : 0;

    panel[CLOSING] = false;
    this.restoreName(panel);
    panel.open = true;
    slide(content, from, true);
  }

  /**
   * Slide a panel's body up, and only then actually close it - `<details>` sets
   * its contents to `display: none` on close, which would cut the animation off
   * at frame one.
   */
  closePanel(panel) {
    const content = this.contentOf(panel);
    if (!content) {
      panel.open = false;
      return;
    }

    panel[CLOSING] = true;
    // Detach the exclusivity name for the length of the animation: with it in
    // place the browser slams this panel shut the moment a sibling opens, and
    // the panel is still `open` for the whole slide.
    if (panel.hasAttribute('name')) {
      panel[DETACHED_NAME] = panel.getAttribute('name');
      panel.removeAttribute('name');
    }

    slide(content, content.offsetHeight, false, () => {
      panel[CLOSING] = false;
      panel.open = false;
      this.restoreName(panel);
    });
  }

  restoreName(panel) {
    if (panel[DETACHED_NAME] == null) return;
    panel.setAttribute('name', panel[DETACHED_NAME]);
    panel[DETACHED_NAME] = null;
  }

  /**
   * Take over the toggle so the close can outlive the click. Enter and Space on a
   * `<summary>` dispatch a click too, so this covers the keyboard as well.
   */
  onClick(e) {
    const summary = e.target.closest && e.target.closest('summary');
    if (!summary) return;
    const panel = summary.parentElement;
    // Not one of ours means a nested accordion's; let it handle itself.
    if (!panel || !this.panels.includes(panel)) return;
    if (!this.contentOf(panel)) return;

    e.preventDefault();
    if (panel.open && !panel[CLOSING]) this.closePanel(panel);
    else this.openPanel(panel);
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
   * to a single question lands on it opened. Instant rather than animated: a deep
   * link should arrive at the content, not at a panel still on its way open.
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
