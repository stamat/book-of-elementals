import { slide } from 'book-of-spells/src/animations.mjs';
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
 * `state` says the same thing as `hidden` and exists because it can be written at a
 * different moment: closing cannot set `hidden` until the slide is over, since that is
 * what stops the region's contents being rendered, so anything keyed off `hidden`
 * animates a whole slide late. `state` flips with the click, which is when a property
 * transitioning alongside the height has to start.
 *
 * @param {boolean} open
 * @returns {{expanded: string, hidden: string|null, state: string}} `hidden: null` meaning shown.
 */
export function disclosureState(open) {
  return {
    expanded: open ? 'true' : 'false',
    hidden: open ? null : 'until-found',
    state: open ? 'open' : 'closed'
  };
}

/**
 * The height, in pixels, a slide of the region starts from.
 *
 * Zero only when opening a region that is currently hidden, because that is the one case
 * with no height to read: `hidden="until-found"` sizes the box as if it were empty.
 * Everything else is a region already on screen - one being closed, or one caught
 * mid-slide and sent back the other way - and its rendered height is the honest start.
 * Which is also why the measurement has to happen *before* unhiding: after, the region
 * is at full height and a slide that starts where it ends is not a slide.
 *
 * @param {boolean} open The state being moved to.
 * @param {boolean} hidden Whether the region is hidden right now.
 * @param {number} height Its rendered height right now.
 * @returns {number}
 */
export function slideFrom(open, hidden, height) {
  return open && hidden ? 0 : height;
}

/**
 * The open state a media query dictates, or `null` when it dictates nothing.
 *
 * The null is the load-bearing case rather than a tidy default: every disclosure on a
 * page runs this, and one without an `open-when` attribute has no opinion about its own
 * state at all. Returning `false` for "no query" would read as "closed", and every
 * plain disclosure in the document would slam shut on a breakpoint it never asked
 * about.
 *
 * @param {MediaQueryList|null} query - The watched query, or null for an element without one.
 * @returns {boolean|null} Whether the region should be open, or null to leave it be.
 */
export function mediaOpen(query) {
  return query ? query.matches : null;
}

/**
 * The name for which side of a media query the element is on, for CSS to hold on to.
 *
 * Which exists so a stylesheet does not have to repeat the breakpoint. A drawer's layout
 * is a media query in every page that writes one by hand, and that query has to agree
 * with the one in the attribute for the panel and its state to describe the same thing -
 * two declarations of one number, in two languages, that nothing checks. Reflected, the
 * element is the only thing that knows the breakpoint and the CSS keys off the answer,
 * which is also what lets that CSS be shipped to a project whose breakpoint is different.
 *
 * `pinned` is the query holding the region open; `free` is the button having it back.
 * Null for an element with no query, so nothing is written and nothing can match.
 *
 * @param {boolean|null} open - What {@link mediaOpen} said.
 * @returns {"pinned"|"free"|null}
 */
export function mediaMode(open) {
  if (open === null) return null;
  return open ? 'pinned' : 'free';
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
 * the region in step, points one at the other with `aria-controls`, re-opens on
 * `beforematch` so find-in-page still finds what is inside, and slides the region's
 * height on the way in and out.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped - the region stays
 * exactly where the markup put it, which is the whole point.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * @tag disclosure-elemental
 * @attr {boolean} [open=false] - Whether the region is showing. Reflected - it tracks the live state.
 * @attr {string} for - `id` of the region. Also read as `data-for`. Defaults to the button's next element sibling.
 * @attr {string} open-when - A media query that owns `open`: held open while it matches, closed when it stops. Unset means the button is the only thing that opens it.
 *
 * @cssprop {<time>} [--disclosure-elemental-duration=250ms] - How long the region takes to slide. Override it on the region, which is where the element reads it back out of the computed styles - `0s` toggles instantly.
 * @cssprop {<easing-function>} [--disclosure-elemental-easing=ease] - How the slide moves. On the region, like the duration.
 * @cssprop {<length>} [--disclosure-elemental-caret-size=1em] - Caret size, on the caret look.
 *
 * @fires disclosure-toggle - `detail.region` is the element being shown or hidden, `detail.open` its new state.
 *
 * @slot - The `<button>` that toggles, and - unless `for` points elsewhere - the region right after it.
 */
export class DisclosureElemental extends ElementBase {
  static get observedAttributes() {
    return ['open', 'open-when'];
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

    this.onMediaChange = this.onMediaChange.bind(this);
    this.watchMedia();
    // Before `initialized`, deliberately: this is the state the element loads in, not a
    // toggle of it. `attributeChangedCallback` is still standing down, so nothing slides
    // and no `disclosure-toggle` fires for a region that has not been on screen yet -
    // the `apply()` at the end of this method is what puts it there.
    const pinned = mediaOpen(this.query);
    if (pinned !== null) this.open = pinned;

    this.initialized = true;

    // A button in a form submits it unless told otherwise, and a disclosure that
    // posts the page away on its first click is not a disclosure.
    if (!button.hasAttribute('type')) button.type = 'button';

    if (!region.id) region.id = 'disclosure-elemental-' + (++regionCount);
    region.classList.add(REGION_CLASS);
    button.setAttribute('aria-controls', region.id);
    this.reflectMode();

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

    if (this.query) this.query.removeEventListener('change', this.onMediaChange);
    this.query = null;
    delete this.dataset.mode;

    const region = this.region;
    if (region) {
      delete region.dataset.mode;
      delete region.dataset.state;
      region.removeEventListener('beforematch', this.onBeforeMatch);
      // A region left behind by its button has nothing to open it again. One inside
      // the element leaves with it; one outside would be hidden for good.
      if (!this.contains(region)) region.removeAttribute('hidden');
    }

    this.initialized = false;
  }

  /**
   * Push the current state onto the button and the region, sliding the region's height
   * on the way if asked to.
   *
   * `animate` is off by default, because most of what lands here is not a state change
   * to animate: the state a page loads with is where the region starts, and one the
   * browser has already put on screen for find-in-page is already there.
   *
   * @param {boolean} [animate=false]
   */
  apply(animate = false) {
    const button = this.button;
    const region = this.region;
    if (!button || !region) return;

    const { expanded, hidden, state } = disclosureState(this.open);
    button.setAttribute('aria-expanded', expanded);
    region.dataset.state = state;

    if (!animate) {
      if (hidden === null) region.removeAttribute('hidden');
      else region.setAttribute('hidden', hidden);
      return;
    }

    const from = slideFrom(this.open, region.hasAttribute('hidden'), region.offsetHeight);

    if (this.open) {
      // Unhide before sliding: an unrendered box has no height to animate.
      region.removeAttribute('hidden');
      slide(region, from, true);
      return;
    }

    // Hide only once the slide is done. `hidden` stops the region's contents being
    // rendered, which would cut the animation off at frame one.
    slide(region, from, false, () => {
      // A slide can outlive what started it - another toggle, or the element leaving
      // the document. Hiding a region that is open again, or one whose button is gone
      // and so has nothing left to open it, would strand it.
      if (this.initialized && !this.open) region.setAttribute('hidden', hidden);
    });
  }

  /** Start watching whatever `open-when` names now, and stop watching whatever it named
   * before. Both halves matter: the attribute can be rewritten at runtime. */
  watchMedia() {
    if (this.query) this.query.removeEventListener('change', this.onMediaChange);
    const media = this.getAttribute('open-when');
    this.query = media && window.matchMedia ? window.matchMedia(media) : null;
    if (this.query) this.query.addEventListener('change', this.onMediaChange);
  }

  /**
   * The breakpoint moved, so the state follows it.
   *
   * Instant, unlike a click. Crossing a breakpoint is the layout being rearranged around
   * the reader - a rotation, a window drag, a zoom - and animating the region through
   * that is animating something nobody asked to happen. It also keeps a resize from
   * queueing a slide per frame.
   */
  onMediaChange() {
    // Before the state, and outside the early return below: dropping the `open-when`
    // attribute has no new state to write, and still has a stale mode to take off.
    this.reflectMode();

    const pinned = mediaOpen(this.query);
    if (pinned === null) return;
    // A breakpoint that closes the region over the reader's focus — a zoom is the common
    // way to cross one mid-read — would drop that focus on <body>. The button is the
    // trigger the region collapses into, and it is visible by now because `reflectMode`
    // above has already left pinned mode behind, so the reader lands where reopening is.
    // The mirrored crossing needs nothing: pinning hides no content, and a consumer
    // stylesheet that hides the button in pinned mode does so knowing what it holds.
    if (!pinned) {
      const region = this.region;
      const button = this.button;
      if (region && button && region.contains(document.activeElement)) button.focus();
    }
    this.instant = true;
    this.open = pinned;
    this.instant = false;
  }

  /**
   * Put the current mode on the element and on the region, or take it off both.
   *
   * On the region as well as the element because `for` lets the two live at opposite ends
   * of the document, and a panel that has to reach back up to its button through
   * `:root:has(…)` for every rule is a stylesheet nobody wants to read. It is one more
   * attribute on a box the element is already writing `hidden`, `id` and a class to.
   */
  reflectMode() {
    const mode = mediaMode(mediaOpen(this.query));
    const region = this.region;

    if (mode === null) {
      delete this.dataset.mode;
      if (region) delete region.dataset.mode;
      return;
    }

    this.dataset.mode = mode;
    if (region) region.dataset.mode = mode;
  }

  /**
   * `open` is the single source of truth, so everything that changes it - a click,
   * a script, find-in-page - lands here and nowhere else.
   */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;

    if (name === 'open-when') {
      this.watchMedia();
      this.onMediaChange();
      return;
    }

    this.apply(!this.instant);
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
    // The browser is revealing the region and scrolling to the match itself. Sliding it
    // open from zero at the same time would animate the match out from under that
    // scroll, so take the state and skip the animation.
    this.instant = true;
    this.open = true;
    this.instant = false;
  }
}

define('disclosure-elemental', DisclosureElemental);
