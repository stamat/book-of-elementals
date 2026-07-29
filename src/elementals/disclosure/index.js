import { ElementBase, define } from '../../core.js';

/**
 * The state a disclosure's button and region carry, for a given open state.
 *
 * `until-found` rather than a bare `hidden` because it is the platform's own answer
 * to the oldest problem with hiding content: find-in-page and a link to a fragment
 * inside the region still reveal it, and the reveal comes back as `beforematch`.
 * Browsers without it read any value at all as plain hidden, which is the same
 * content, just not found.
 *
 * @param {boolean} open
 * @returns {{expanded: string, hidden: string|null}} `hidden: null` meaning shown.
 */
export function disclosureState(open) {
  return {
    expanded: open ? 'true' : 'false',
    hidden: open ? null : 'until-found'
  };
}

/** Marks the controlled region, which may live anywhere in the document. */
const REGION_CLASS = 'disclosure-elemental-region';

// Monotonic counter for generating an `id` for a region authored without one.
let regionCount = 0;

/**
 * `<disclosure-elemental>` custom element.
 *
 * A real `<button>` wired to a region it shows and hides, per the
 * [APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).
 *
 * Native `<details>`/`<summary>` is a disclosure already, and where it fits it wins -
 * `<accordion-elemental>` is built on it for exactly that reason. It fits when the
 * region can live *inside* the trigger's element. This element is for when it cannot:
 * a `<figcaption>`, which HTML requires to be a child of its `<figure>`; a table row;
 * a grid or flex item whose parent lays it out directly; a panel on the other side of
 * the page from the button that opens it. Wrapping any of those in a `<details>`
 * moves them out of the parent that gives them meaning.
 *
 * What it does, and nothing more: keeps `aria-expanded` on the button and `hidden` on
 * the region in step, points one at the other with `aria-controls`, and re-opens on
 * `beforematch` so find-in-page still finds what is inside.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped - the region stays
 * exactly where the markup put it, which is the whole point.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */
export class DisclosureElemental extends ElementBase {
  static get observedAttributes() {
    return ['open'];
  }

  /** The `<button>` that toggles the region. Direct child, so a button inside the
   * region - or inside a nested disclosure - is not mistaken for the trigger. */
  get button() {
    return this.querySelector(':scope > button');
  }

  /** The region the button shows and hides: what `for` names, else the button's
   * next sibling. */
  get region() {
    const id = this.dataset.for != null ? this.dataset.for : this.getAttribute('for');
    if (id) return document.getElementById(id);
    const button = this.button;
    return button ? button.nextElementSibling : null;
  }

  /** Whether the region is showing. Reflected, so `[open]` is a styling hook too. */
  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', !!value);
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed, and - for a detached
    // region - until the region itself has. The bundle is loaded deferred or at the
    // end of the body, so by upgrade time both are there.
    if (this.initialized) return;
    const button = this.button;
    const region = this.region;
    if (!button || !region) return;
    this.initialized = true;

    // A button in a form submits it unless told otherwise, and a disclosure that
    // posts the page away on its first click is not a disclosure.
    if (!button.hasAttribute('type')) button.type = 'button';

    if (!region.id) region.id = 'disclosure-elemental-' + (++regionCount);
    region.classList.add(REGION_CLASS);
    button.setAttribute('aria-controls', region.id);

    this.onClick = this.onClick.bind(this);
    this.onBeforeMatch = this.onBeforeMatch.bind(this);
    this.addEventListener('click', this.onClick);
    // Find-in-page and fragment navigation reveal an `until-found` region on their
    // own; this is how the button hears about it and stops disagreeing with it.
    region.addEventListener('beforematch', this.onBeforeMatch);

    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('click', this.onClick);

    const region = this.region;
    if (region) {
      region.removeEventListener('beforematch', this.onBeforeMatch);
      // A region left behind by its button has nothing to open it again. One inside
      // the element leaves with it; one outside would be hidden for good.
      if (!this.contains(region)) region.removeAttribute('hidden');
    }

    this.initialized = false;
  }

  /** Push the current state onto the button and the region. */
  apply() {
    const button = this.button;
    const region = this.region;
    if (!button || !region) return;

    const state = disclosureState(this.open);
    button.setAttribute('aria-expanded', state.expanded);
    if (state.hidden === null) region.removeAttribute('hidden');
    else region.setAttribute('hidden', state.hidden);
  }

  /**
   * `open` is the single source of truth, so everything that changes it - a click,
   * a script, find-in-page - lands here and nowhere else.
   */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    this.apply();
    this.dispatchEvent(new CustomEvent('disclosure-toggle', {
      bubbles: true,
      detail: { region: this.region, open: this.open }
    }));
  }

  onClick(e) {
    const button = e.target.closest && e.target.closest('button');
    // Not the trigger means a button inside the region, or a nested disclosure's.
    if (!button || button !== this.button) return;
    this.open = !this.open;
  }

  onBeforeMatch() {
    this.open = true;
  }
}

define('disclosure-elemental', DisclosureElemental);
