import { ElementBase, define, stepIndex } from '../../core.js';

// The arrows step and stop rather than wrap - the APG's disclosure navigation words every
// key "and it is not the last", because a bar has ends and running off one is how you get
// back to the rest of the page. That is `stepIndex` from core, not `nextIndex`.
//
// Re-exported rather than redeclared: it was this module's surface first, and a second
// declaration under the same name cost the package the export - `src/index.js` star-exports
// this module and core both, and ES modules drop an ambiguous name from the entry rather
// than resolve it. The same binding from both sides is not ambiguous.
export { stepIndex };

/**
 * Which of the two widgets the bar is right now.
 *
 * Two inputs, because there are two ways to run out of room and only one of them is a
 * width. `media` not matching is the author saying "this is a phone"; too few items still
 * fitting is the bar saying "there is nothing left on me" - at which point the overflow
 * button is not an overflow any more, it is the whole navigation, and a drawer is the
 * honest name for that.
 *
 * `minimum` is where "too few" is. One is the default and the old behaviour: a bar stops
 * being one when nothing at all is left on it. Two says a single link beside an overflow
 * button is not a navigation bar either.
 *
 * @param {boolean} matches - Whether the `media` query matches, or there is no query.
 * @param {number} overflowed - How many items did not fit.
 * @param {number} total - How many items there are.
 * @param {number} [minimum=1] - How many have to fit for this to still be a bar.
 * @returns {"bar"|"stack"}
 */
export function navbarMode(matches, overflowed, total, minimum = 1) {
  if (!matches) return 'stack';
  const floor = Number.isFinite(minimum) && minimum >= 1 ? minimum : 1;
  return total > 0 && total - overflowed < floor ? 'stack' : 'bar';
}

/**
 * The state a copy of a control has to carry to be measured as its original.
 *
 * `wire()` writes `aria-expanded` on every trigger, and a theme is free to draw on that -
 * the shipped one puts a caret after it. The copy is built before any of that and with its
 * panels taken out, so nothing marks its triggers as triggers: each one measures a caret
 * narrower than the button it stands for. The row is then told more fits than does, and the
 * items past the edge are not folded into the overflow - they are clipped by the rail,
 * which is how the overflow button itself ends up half under the search field.
 *
 * @param {boolean} hasPanel - Whether the original opens a panel.
 * @returns {{ 'aria-expanded': string }|null} Attributes for the copy, or null for none.
 */
export function probeState(hasPanel) {
  return hasPanel ? { 'aria-expanded': 'false' } : null;
}

/**
 * Whether the first list found inside a navbar is the navbar's own row.
 *
 * The row is "the first `<ul>` or `<menu>` in the element", which holds right up until the bar
 * carries something that writes a list of its own - a `<suggest-elemental>` results panel, a
 * nested navbar. Adopting one of those is not a cosmetic mistake: the row's parent becomes the
 * rail, so the other element's box is handed `display: grid`, `overflow: clip` and a copy of
 * itself to measure, and its list is laid out as a bar.
 *
 * A custom element between the two is the line, because that is what "somebody else owns this"
 * looks like in markup. A page that wraps its row in one gets no navbar rather than a hijacked
 * panel - the links are still there, still a list, which is the degradation the element
 * promises anyway.
 *
 * @param {string[]} ancestors - Tag names between the list and the navbar, neither end included.
 * @returns {boolean} Whether the navbar may take it.
 */
export function ownsRow(ancestors) {
  return !ancestors.some(tag => tag.includes('-'));
}

/**
 * What a pointer arriving somewhere means for the panels that are open.
 *
 * `branch` is the row's own item the pointer is inside, however deep - not the control under
 * it. A link inside an open panel opens nothing, so reading the control alone says "close
 * everything", which closes the panel the pointer just walked into.
 *
 * Nothing of the row's under the pointer is not an instruction either: between a trigger and
 * the panel hanging under it lies the bar's own padding, and closing there would shut every
 * panel the moment anyone reached for one. Leaving the bar is what closes them, and
 * `onPointerLeave` owns that.
 *
 * @param {*} branch - The row item the pointer is in, or null.
 * @param {*} trigger - The control under the pointer, if it opens a panel.
 * @returns {{ except: *, open: * }|null} What to keep open and what to open, or null for "leave it".
 */
export function hoverIntent(branch, trigger) {
  if (!branch) return null;
  return { except: branch, open: trigger || null };
}

// An item is overflowing when it is not *entirely* inside the row. Not `< 1`: a fully
// visible box reports 0.99999… often enough that the exact comparison hides a link at
// certain widths and zoom levels for no reason a reader could ever guess at.
const OVERFLOW_TOLERANCE = 0.99;

// The keys that scroll a page, and so have to be swallowed by a list that is using them even
// when the list has nowhere left to move focus to.
const VERTICAL = ['ArrowUp', 'ArrowDown', 'Home', 'End'];

// How long a hover-opened panel waits after the pointer leaves. Long enough to cross the
// gap between a label and its panel, short enough not to feel stuck.
const HOVER_CLOSE_DELAY = 250;

/** Monotonic counter for generating an `id` for a list authored without one. */
let navbarCount = 0;

/**
 * `<navbar-elemental>` custom element.
 *
 * A site's navigation bar: a row of links, some of them opening a panel of more links, and
 * two things a row of links always ends up needing - somewhere for the ones that do not fit
 * to go, and a way to be a drawer instead on a narrow screen.
 *
 * It is the APG's
 * [Disclosure Navigation Menu](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
 * and not a menubar. `role="menuitem"` replaces link semantics, and the APG's own menubar
 * example opens by recommending this pattern instead for exactly that reason. So there are
 * no roles here at all: the items are links in a list, `Tab` reaches every one of them, and
 * the buttons are buttons with `aria-expanded`. The optional arrow keys from that example
 * are implemented, because they cost twenty lines and a bar of eight items wants them.
 *
 * What it adds to the pattern is the thing CSS cannot do: noticing that the links have run
 * out of room. A breakpoint cannot know how many links a site has, how long their labels
 * are, or what the reader's font does to them - so the row is measured instead, and the
 * items that do not fit move into the overflow panel one at a time. When none of them fit
 * the whole bar becomes a drawer.
 *
 * The measuring is an `IntersectionObserver` on a copy of the row rather than on the row
 * itself, which is the one idea in here worth stealing. Hiding an overflowing item shrinks
 * the row, which makes the next item fit, which hides that one instead - an observer
 * watching the box it is also changing is an infinite loop. So the copy is what is watched
 * and the row is what changes, and nothing ever invalidates its own measurement. It also
 * means late-arriving webfonts are free: they change the copy's geometry, the observer says
 * so, and the row settles again. A cached set of widths would simply be wrong from then on.
 *
 * Light DOM, no shadow root. Three things are generated - the copy being measured, the copies
 * of the items inside the overflow panel, and the bars inside the drawer's button - and
 * nothing the page wrote is moved or wrapped.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
 *
 * @tag navbar-elemental
 * @attr {string} media - The media query the bar exists in. Outside it, the drawer. Unset means a bar at every width, until the links stop fitting.
 * @attr {number} [min-bar-items=1] - How many links have to fit for this to still be a bar. `2` says one link beside an overflow button is a drawer.
 * @attr {boolean} [open=false] - Whether the drawer is showing. Reflected, so `[open]` is a styling hook.
 * @attr {boolean} [hover=false] - A mouse also opens a panel by pointing at it. Never on touch, never stacked.
 *
 * @cssprop {<length>} [--navbar-elemental-radius=0.375rem] - Corner radius of a floating panel.
 * @cssprop {<length>} [--navbar-elemental-inset=0.35rem] - Padding inside a panel, and around each item.
 * @cssprop {<length>} [--navbar-elemental-gap=0.15rem] - Between the items of the row.
 * @cssprop {<length>} [--navbar-elemental-caret-size=0.75em] - The caret on a trigger that opens a panel.
 * @cssprop {<length>} [--navbar-elemental-hamburger-size=1.25em] - Width of the generated hamburger icon.
 * @cssprop {<length>} [--navbar-elemental-bar-thickness=2px] - How thick each of its three bars is.
 * @cssprop {<length>} [--navbar-elemental-bar-gap=0.35em] - How far the outer two sit from the middle one.
 * @cssprop {<color>} [--navbar-elemental-surface=Canvas] - What a floating panel is painted on. The page's own background, so re-point it on a card.
 * @cssprop {<color>} [--navbar-elemental-hover=color-mix(in srgb, currentcolor 10%, transparent)] - Item background under the pointer, and while focused.
 * @cssprop {<color>} [--navbar-elemental-border=color-mix(in srgb, currentcolor 20%, transparent)] - The rim around a floating panel.
 * @cssprop {<shadow>} [--navbar-elemental-shadow=0 4px 20px rgb(0 0 0 / 15%)] - What lifts a floating panel off the page.
 *
 * @fires navbar-toggle - `detail.panel` is the list that opened or closed, `detail.open` which way it went.
 *
 * @slot - The `<ul>` of links, optionally a `[data-navbar-more]` overflow item and a `[data-navbar-toggle]` button.
 */
export class NavbarElemental extends ElementBase {
  static get observedAttributes() {
    return ['media', 'min-bar-items', 'open'];
  }

  /**
   * The row: the first list in the element that no other custom element between them owns. A
   * nested `<navbar-elemental>` keeps its own, and so does anything else on the bar that
   * writes a list - see `ownsRow`.
   */
  get row() {
    const list = this.querySelector('ul, menu');
    if (!list) return null;
    const ancestors = [];
    for (let node = list.parentElement; node && node !== this; node = node.parentElement) {
      ancestors.push(node.localName);
    }
    return ownsRow(ancestors) ? list : null;
  }

  /**
   * The box the row is measured inside, which is whatever the page put the row in. The copy
   * goes in here beside it, so the two are the same width without either of them having to
   * be told what that width is.
   */
  get rail() {
    const row = this.row;
    return row ? row.parentElement : null;
  }

  /** The item holding the overflow button, if the page authored one. */
  get moreItem() {
    const row = this.row;
    return row ? row.querySelector(':scope > [data-navbar-more]') : null;
  }

  /** The list inside it, which the element fills with copies. */
  get morePanel() {
    const item = this.moreItem;
    return item ? item.querySelector('ul, menu') : null;
  }

  /** The button that opens the drawer in stack mode. */
  get toggle() {
    return this.querySelector('[data-navbar-toggle]');
  }

  /**
   * The items being measured: the row's own, minus the two kinds that are not links competing
   * for room - the overflow button, and anything the page has marked as the drawer's alone.
   */
  get items() {
    const row = this.row;
    if (!row) return [];
    return Array.from(row.querySelectorAll(':scope > li:not([data-navbar-more]):not([data-navbar-stack])'));
  }

  /** Every list in this navbar, the row included. */
  get lists() {
    const row = this.row;
    if (!row) return [];
    return [row].concat(Array.from(row.querySelectorAll('ul, menu')));
  }

  /**
   * How many links have to fit for this to still be a bar. One - a bar that keeps going until
   * nothing at all is left on it - unless the page says otherwise.
   */
  get minBarItems() {
    return Number.parseInt(this.getAttribute('min-bar-items'), 10);
  }

  /** Whether the bar is currently the drawer rather than the row. */
  get stacked() {
    return this.dataset.mode === 'stack';
  }

  /** Whether the drawer is showing. Reflected, so `[open]` is a styling hook too. */
  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', !!value);
  }

  /**
   * Whether a mouse opens a panel by pointing at it rather than by clicking.
   *
   * Opt-in, and only ever an addition. Off while stacked, where the panels are in the flow
   * and a pointer crossing the drawer on its way somewhere would open every one it passed.
   */
  get hover() {
    return this.hasAttribute('hover') && !this.stacked;
  }

  set hover(value) {
    this.toggleAttribute('hover', !!value);
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded deferred or
    // at the end of the body, so by upgrade time they are there.
    if (this.initialized) return;
    const row = this.row;
    if (!row || !this.rail) return;
    this.initialized = true;

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);
    this.onPointerOver = this.onPointerOver.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onMediaChange = this.onMediaChange.bind(this);
    this.onIntersect = this.onIntersect.bind(this);
    this.onBeforeMatch = this.onBeforeMatch.bind(this);
    this.watched = new WeakSet();

    // The row's own box is the measuring box, and it gets said out loud rather than guessed at
    // by a stylesheet: the element cannot wrap the row in a box of its own without changing
    // the parent the page's own selectors are written against, so it marks the one that is
    // already there.
    this.rail.setAttribute('data-navbar-rail', '');

    // Copied before anything is wired, so what gets copied is the markup the page wrote
    // rather than an element mid-upgrade: a copy of a wired list brings its `aria-controls`
    // and the `id` that attribute points at, and two lists claiming one `id` is a button
    // that opens the other one's panel.
    this.copies = this.fillMore();
    this.probe = this.buildProbe();
    this.probeItems = Array.from(this.probe.querySelectorAll(':scope > li:not([data-navbar-more])'));

    for (const list of this.lists) {
      if (list !== row) list.setAttribute('hidden', '');
    }

    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('focusout', this.onFocusOut);
    // Bound whether or not `hover` is set, since it can be set later; the handlers check it
    // themselves, which is one attribute read against two listeners to add and remove on
    // every change.
    this.addEventListener('pointerover', this.onPointerOver);
    this.addEventListener('pointerleave', this.onPointerLeave);
    // Only needed because of `hover`: a panel opened by pointing at it can be open while
    // focus is somewhere else entirely, and then no `focusout` is ever coming.
    document.addEventListener('click', this.onDocumentClick);

    this.watchMedia();
    this.fillToggle();
    this.wire();
    this.observe();
    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('focusout', this.onFocusOut);
    this.removeEventListener('pointerover', this.onPointerOver);
    this.removeEventListener('pointerleave', this.onPointerLeave);
    document.removeEventListener('click', this.onDocumentClick);
    clearTimeout(this.hoverTimer);
    if (this.observer) this.observer.disconnect();
    if (this.query) this.query.removeEventListener('change', this.onMediaChange);

    // Everything generated goes, and everything hidden comes back: a list left `hidden` by
    // an element that is no longer here has nothing to open it again, and a copy of a row
    // nobody is measuring is a second copy of the navigation in the page.
    if (this.probe) this.probe.remove();
    const bars = this.toggle && this.toggle.querySelector(':scope > [data-navbar-bars]');
    if (bars) bars.remove();
    for (const copy of this.copies || []) copy.remove();
    for (const list of this.lists) list.removeAttribute('hidden');
    for (const item of this.items) item.removeAttribute('data-overflow');
    if (this.rail) this.rail.removeAttribute('data-navbar-rail');
    delete this.dataset.mode;
    this.removeAttribute('data-overflowing');

    this.initialized = false;
  }

  // ---- generated markup ----

  /**
   * The bars inside the drawer's button.
   *
   * A hamburger that crosses into an X is three lines, and a button has two pseudo-elements -
   * so one of the three has to be an element. It is written here rather than asked of the
   * page: every toggle already out there is an empty `<button>`, and a look that only works
   * for markup written after it shipped is a look nobody sees. `aria-hidden`, because the
   * button's label is its name and this is a picture of what the button does.
   *
   * Nothing is drawn without the optional theme; the attribute is a hook for whoever wants
   * to draw their own.
   */
  fillToggle() {
    const toggle = this.toggle;
    if (!toggle || toggle.querySelector(':scope > [data-navbar-bars]')) return;
    const bars = document.createElement('span');
    bars.setAttribute('data-navbar-bars', '');
    bars.setAttribute('aria-hidden', 'true');
    toggle.prepend(bars);
  }

  /**
   * Put a copy of every item inside the overflow panel, and hand back the copies in the
   * order their originals are in.
   *
   * Copies rather than the items themselves, because moving an item out of the row would
   * move it out of the thing being measured - and because a link that is both on the bar and
   * in the panel is one link the reader can reach two ways, which is the point of an
   * overflow.
   */
  fillMore() {
    const panel = this.morePanel;
    if (!panel) return [];
    return this.items.map((item) => panel.appendChild(item.cloneNode(true)));
  }

  /**
   * Build the copy of the row that gets measured, and put it in the rail beside the row.
   *
   * Two things are done to it, and both are about width. The panels come out: an absolutely
   * positioned box adds nothing to a row's width, and a copy of one would be a second box
   * answering to the same anchor name. And the overflow item moves to the front, where its
   * box reserves exactly the room it is going to take at the other end - the row has to be
   * measured against the space that will be left once the overflow button is on it, or the
   * last link and the button would fight over the same pixels.
   *
   * The stylesheet hides it, but the copy is a second, focusable, announced navigation
   * until it does - so the neutralising is done here too, where it holds whether or not the
   * structure styles ever arrive.
   */
  buildProbe() {
    const probe = this.row.cloneNode(true);
    probe.setAttribute('data-navbar-probe', '');
    probe.inert = true;
    probe.setAttribute('aria-hidden', 'true');
    // Before the panels come out, while there is still something to ask about them.
    for (const button of probe.querySelectorAll('li > button')) {
      const state = probeState(!!button.parentElement.querySelector(':scope > ul, :scope > menu'));
      for (const [name, value] of Object.entries(state || {})) button.setAttribute(name, value);
    }
    for (const panel of probe.querySelectorAll('ul, menu')) panel.remove();
    // Items that only exist in the drawer are not on the bar, so they must not reserve any of
    // the bar's room either.
    for (const one of probe.querySelectorAll('[data-navbar-stack]')) one.remove();
    for (const one of probe.querySelectorAll('[id]')) one.removeAttribute('id');
    probe.removeAttribute('id');
    const more = probe.querySelector('[data-navbar-more]');
    if (more) probe.prepend(more);
    return this.rail.appendChild(probe);
  }

  // ---- structure ----

  /** The items of one list: what its `<li>`s hold, and not what its panels do. */
  itemsOf(list) {
    return list ? Array.from(list.querySelectorAll(':scope > li > a, :scope > li > button')) : [];
  }

  /**
   * The row's own control whose branch this node sits in, however deep inside a panel it is.
   * A pointer over a link three levels down is still pointing at the item on the bar that
   * opened the panels above it.
   */
  branchOf(node) {
    const row = this.row;
    if (!row || !node || !node.closest) return null;
    let item = node.closest('li');
    while (item && item.parentElement !== row) {
      item = item.parentElement ? item.parentElement.closest('li') : null;
    }
    return item ? item.querySelector(':scope > a, :scope > button') : null;
  }

  /** The list a trigger opens, if it opens one. */
  panelOf(trigger) {
    return trigger.parentElement && trigger.parentElement.querySelector(':scope > ul, :scope > menu');
  }

  /** The trigger that opens a list: the button beside it in the same `<li>`. */
  triggerOf(list) {
    return list.parentElement && list.parentElement.querySelector(':scope > button');
  }

  isOpen(list) {
    return !list.hasAttribute('hidden');
  }

  /**
   * The set the arrow keys walk from here.
   *
   * A panel is its own surface, so inside one the arrows stay inside it. On the bar they walk
   * the bar. Stacked, there are no surfaces: the open panels are on screen, in the flow, and
   * stopping at the edge of a list the reader is looking straight through would be arbitrary.
   */
  navigable(from) {
    const panel = from.closest('ul, menu');
    if (this.stacked) return this.visibleItems(this.row);
    if (panel && panel !== this.row) return this.itemsOf(panel);
    return this.itemsOf(this.row).filter((item) => item.offsetParent);
  }

  /** Every item on screen from `list` down, in the order they are rendered. */
  visibleItems(list) {
    const out = [];
    for (const item of this.itemsOf(list)) {
      out.push(item);
      const panel = this.panelOf(item);
      if (panel && this.isOpen(panel)) out.push(...this.visibleItems(panel));
    }
    return out;
  }

  // ---- wiring ----

  watchMedia() {
    if (this.query) this.query.removeEventListener('change', this.onMediaChange);
    const media = this.getAttribute('media');
    this.query = media && window.matchMedia ? window.matchMedia(media) : null;
    if (this.query) this.query.addEventListener('change', this.onMediaChange);
  }

  onMediaChange() {
    this.apply();
  }

  /**
   * Point every trigger at what it opens. `aria-expanded` and `aria-controls` are the whole
   * of the ARIA here - there is no role to write, which is the pattern's point.
   */
  wire() {
    for (const list of this.lists) {
      if (!list.id) list.id = 'navbar-elemental-' + (++navbarCount);
      // Find-in-page reveals a stacked panel on its own; this is how the button hears about
      // it and stops disagreeing with it.
      if (!this.watched.has(list)) {
        list.addEventListener('beforematch', this.onBeforeMatch);
        this.watched.add(list);
      }

      const trigger = list === this.row ? this.toggle : this.triggerOf(list);
      if (!trigger) continue;
      // A button in a form submits it unless told otherwise, and a navigation that posts the
      // page away when you open a dropdown is not a navigation.
      if (!trigger.hasAttribute('type')) trigger.type = 'button';
      trigger.setAttribute('aria-controls', list.id);
      trigger.setAttribute('aria-expanded', this.isOpen(list) ? 'true' : 'false');
    }
  }

  observe() {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(this.onIntersect, {
      root: this.probe,
      threshold: 1
    });
    for (const item of this.probeItems) this.observer.observe(item);
  }

  onIntersect(entries) {
    for (const entry of entries) {
      const at = this.probeItems.indexOf(entry.target);
      if (at < 0) continue;
      const overflowing = entry.intersectionRatio < OVERFLOW_TOLERANCE;
      this.items[at].toggleAttribute('data-overflow', overflowing);
      if (this.copies[at]) this.copies[at].hidden = !overflowing;
    }
    this.apply();
  }

  /**
   * Push the current mode onto the element, and the drawer's state onto the row.
   *
   * Crossing between the two closes whatever was open, because what was open belonged to the
   * other widget: a dropdown left open on a bar that has just become a drawer is a floating
   * panel in a stack.
   */
  apply() {
    const items = this.items;
    const overflowed = items.filter((item) => item.hasAttribute('data-overflow')).length;
    const mode = navbarMode(!this.query || this.query.matches, overflowed, items.length, this.minBarItems);
    const changed = this.dataset.mode !== mode;

    this.dataset.mode = mode;
    // Some of the links behind the overflow button is an overflow; all of them behind it is
    // the drawer's job, and the button goes away with the row it sits in.
    this.toggleAttribute('data-overflowing', mode === 'bar' && overflowed > 0 && overflowed < items.length);

    if (changed) {
      this.closePanels(this.row);
      if (mode === 'bar' && this.open) this.open = false;
    }
    this.applyDrawer();
    if (changed) this.wire();
  }

  /**
   * The drawer is the row itself, hidden behind the toggle while stacked and simply the bar
   * again while not - so there is one list in the page rather than a row and a copy of it in
   * a panel, and one set of links to keep in step with the site.
   */
  applyDrawer() {
    const row = this.row;
    const toggle = this.toggle;
    if (!row) return;
    if (toggle) toggle.setAttribute('aria-expanded', this.open ? 'true' : 'false');

    if (!this.stacked || this.open || !toggle) {
      row.removeAttribute('hidden');
      return;
    }
    // `until-found` and not a plain `hidden`: a closed drawer is still the site's navigation,
    // and find-in-page reaching a link inside it - opening the drawer and scrolling to it -
    // is the platform doing something no script here would have thought to offer.
    row.setAttribute('hidden', 'until-found');
  }

  // ---- opening and closing ----

  /**
   * Show or hide one panel.
   *
   * On the bar the panels overlap, so opening one closes its siblings - that is what makes a
   * bar readable. Stacked they are in the flow, and closing a branch the reader opened on
   * purpose only loses their place.
   */
  setPanel(trigger, open) {
    const panel = this.panelOf(trigger);
    if (!panel || this.isOpen(panel) === open) return;

    if (open && !this.stacked) this.closeSiblings(trigger);
    if (!open) this.closePanels(panel);

    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.removeAttribute('hidden');
    // Plain `hidden` on the bar, where the stylesheet turns it into `display: none`. A
    // `until-found` panel is hidden with `content-visibility`, which skips a box's contents
    // and keeps the box - and a box with a border and a shadow on it and nothing inside is a
    // small empty smudge parked under the button. Stacked, where the panels have no frame,
    // it is `until-found` and find-in-page works.
    else panel.setAttribute('hidden', this.stacked ? 'until-found' : '');

    this.dispatchEvent(new CustomEvent('navbar-toggle', {
      bubbles: true,
      detail: { panel: panel, open: open }
    }));
  }

  /** Close every other panel of the same list. */
  closeSiblings(trigger) {
    const list = trigger.closest('ul, menu');
    for (const other of this.itemsOf(list)) {
      // Never one the keyboard is inside: closing a panel out from under the caret leaves
      // focus on a hidden element, which is focus nowhere.
      if (other !== trigger && !this.holdsFocus(other)) this.setPanel(other, false);
    }
  }

  /** Close every open panel below a list, deepest first. */
  closePanels(list) {
    for (const item of this.itemsOf(list)) this.setPanel(item, false);
  }

  /** Whether the panel this trigger opens has focus in it. */
  holdsFocus(trigger) {
    const panel = this.panelOf(trigger);
    return !!panel && panel.contains(document.activeElement);
  }

  /** Close every panel on the bar, except one, and except any the keyboard is inside. */
  closeBar(except) {
    if (this.stacked) return;
    for (const item of this.itemsOf(this.row)) {
      if (item !== except && !this.holdsFocus(item)) this.setPanel(item, false);
    }
  }

  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    if (name === 'media') {
      this.watchMedia();
      this.apply();
      return;
    }
    if (name === 'min-bar-items') {
      this.apply();
      return;
    }
    this.applyDrawer();
    this.dispatchEvent(new CustomEvent('navbar-toggle', {
      bubbles: true,
      detail: { panel: this.row, open: this.open }
    }));
  }

  // ---- input ----

  /** The control this event happened on, or null for anything outside this navbar. */
  controlFor(e) {
    const control = e.target.closest && e.target.closest('a, button');
    return control && control.closest('navbar-elemental') === this ? control : null;
  }

  onClick(e) {
    const control = this.controlFor(e);
    if (!control) return;

    if (control === this.toggle) {
      this.open = !this.open;
      return;
    }

    const panel = this.panelOf(control);
    if (panel) {
      this.setPanel(control, !this.isOpen(panel));
      return;
    }

    // A link. Whatever it goes to, it goes there with the bar out of the way - but not the
    // drawer, which the reader opened and can close, and which a same-page fragment would
    // otherwise shut behind them mid-scroll.
    this.closeBar(null);
  }

  onKeyDown(e) {
    const control = this.controlFor(e);
    if (!control) return;

    if (e.key === 'Escape') {
      const list = control.closest('ul, menu');
      if (!list) return;
      e.preventDefault();
      this.closeBranch(list);
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

    // Down or Right on a trigger that is already open steps into what it opened. The one
    // move in the APG's table that crosses from one set into another.
    if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && !this.stacked) {
      const panel = this.panelOf(control);
      if (panel && this.isOpen(panel)) {
        const first = this.itemsOf(panel)[0];
        if (first) {
          e.preventDefault();
          first.focus();
          return;
        }
      }
    }

    const set = this.navigable(control);
    const to = stepIndex(set.indexOf(control), e.key, set.length);

    if (to === null) {
      // Nowhere to go, which is not the same as nothing to do. Inside a panel - or a drawer,
      // which is one - the vertical keys belong to the list, and they still belong to it at its
      // ends: Down on the last item of an open panel scrolling the page out from under a reader
      // who is still in that panel is worse than the key doing nothing at all. On the bar itself
      // they are left alone, because a bar runs the other way and the page is what is below it.
      const list = control.closest('ul, menu');
      const inside = this.stacked || (list && list !== this.row);
      if (inside && VERTICAL.includes(e.key)) e.preventDefault();
      return;
    }

    e.preventDefault();
    set[to].focus();
  }

  /**
   * Close the list focus is in and hand focus back to whatever opened it. Off the end of a
   * panel, Escape goes to that panel's own trigger; on the bar itself it closes the drawer.
   */
  closeBranch(list) {
    if (list === this.row) {
      if (!this.open) return;
      this.open = false;
      if (this.toggle) this.toggle.focus();
      return;
    }
    const trigger = this.triggerOf(list);
    if (!trigger) return;
    this.setPanel(trigger, false);
    trigger.focus();
  }

  /**
   * Point at it and it opens - and pointing at one panel is also the instruction to close the
   * others, since they overlap and only one of them can be read at a time.
   *
   * `pointerover` rather than `pointerenter` because it bubbles, so one listener covers every
   * item; mouse only, because a touch "hover" is the tap that was about to choose something.
   */
  onPointerOver(e) {
    if (!this.hover || e.pointerType !== 'mouse') return;
    clearTimeout(this.hoverTimer);

    const control = this.controlFor(e);
    const intent = hoverIntent(this.branchOf(e.target), control && this.panelOf(control) ? control : null);
    if (!intent) return;

    this.closeBar(intent.except);
    // Focus does not follow the pointer: the reader's caret stays where they put it, and the
    // arrow keys carry on from there.
    if (intent.open) this.setPanel(intent.open, true);
  }

  /**
   * The pointer has left the whole bar, so the panels close - after a beat, because the gap
   * between a label and its panel is a place the pointer passes through rather than a place
   * it means to be.
   */
  onPointerLeave(e) {
    if (!this.hover || e.pointerType !== 'mouse') return;
    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => this.closeBar(null), HOVER_CLOSE_DELAY);
  }

  /**
   * Tab out of a panel and it is behind you. The APG asks for this, and `1.4.13 Content on
   * Hover or Focus` asks for it too: `relatedTarget` is null when focus lands outside the
   * document altogether, which counts as leaving.
   */
  onFocusOut(e) {
    if (this.stacked) return;
    const next = e.relatedTarget;
    for (const item of this.itemsOf(this.row)) {
      const panel = this.panelOf(item);
      if (panel && !panel.contains(next) && item !== next) this.setPanel(item, false);
    }
  }

  onDocumentClick(e) {
    if (this.contains(e.target)) return;
    this.closeBar(null);
  }

  onBeforeMatch(e) {
    const list = e.currentTarget;
    if (list === this.row) {
      this.open = true;
      return;
    }
    const trigger = this.triggerOf(list);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }
}

define('navbar-elemental', NavbarElemental);
