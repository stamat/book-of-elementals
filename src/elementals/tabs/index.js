import { ElementBase, define, nextIndex } from '../../core.js';

/**
 * Which of `nextIndex`'s keys an arrow means on this tablist's axis.
 *
 * A tablist answers to one axis and ignores the other - Left/Right on a horizontal one,
 * Up/Down on a vertical one - which is the whole of what `aria-orientation` promises. So
 * rather than a second key map, the axis is translated into the vertical vocabulary
 * `nextIndex` already speaks, and the wrapping and the ends stay in one place for every
 * pattern in the book.
 *
 * @param {string} key - KeyboardEvent.key value.
 * @param {boolean} vertical - Whether the tablist runs down the page.
 * @returns {string|null} A key `nextIndex` understands, or null for one off this axis.
 */
export function tabKey(key, vertical) {
  if (key === 'Home' || key === 'End') return key;
  if (key === (vertical ? 'ArrowDown' : 'ArrowRight')) return 'ArrowDown';
  if (key === (vertical ? 'ArrowUp' : 'ArrowLeft')) return 'ArrowUp';
  return null;
}

/**
 * Which tab the `selected` attribute is naming, given how many there are.
 *
 * Every value is answered with a tab, because a tab set with nothing selected is not a
 * state this pattern has: one tab is always current. A missing attribute, a typo and a
 * negative index are the first tab - there is no earlier one to mean. An index past the
 * end, which is what a tab removed from under a `selected` leaves behind, is clamped to
 * the last tab rather than sent back to the start: the reader was at the far end of the
 * set, and that is the nearest tab still there.
 *
 * @param {string|null} value - The attribute, as authored.
 * @param {number} length - How many tabs there are.
 * @returns {number}
 */
export function selectedIndex(value, length) {
  const at = Math.trunc(Number(value));
  if (!(at > 0)) return 0;
  return Math.min(at, Math.max(length - 1, 0));
}

/**
 * Where the sliding bar goes: how far along the strip the selected tab starts, and how much
 * of the strip it takes.
 *
 * Two rects in, two numbers out, because that is the whole of the geometry - the caller
 * finds the rects, and this stays something a test can pin without a layout. Logical rather
 * than physical: `start` is measured from the edge the strip *starts* at, which is the right
 * one in RTL, so the bar can be placed with `inset-inline-start` and the stylesheet needs no
 * second copy of the sum. The block axis runs top to bottom either way, so a vertical
 * tablist has one answer and not two.
 *
 * Rect to rect, with no border taken off: the theme puts a border on the strip's block-end
 * when it is horizontal and on its inline-end when it is vertical, and neither is on the
 * edge being measured from. A page that borders the other edges moves the bar by that much.
 *
 * @param {DOMRect} strip - The tablist's rect.
 * @param {DOMRect} tab - The selected tab's rect.
 * @param {boolean} vertical - Whether the tablist runs down the page.
 * @param {boolean} rtl - Whether it is running right to left.
 * @returns {{start: number, size: number}} Both in pixels, unrounded.
 */
export function barBox(strip, tab, vertical, rtl) {
  if (vertical) return { start: tab.top - strip.top, size: tab.height };
  return { start: rtl ? strip.right - tab.right : tab.left - strip.left, size: tab.width };
}

/**
 * What counts as something the keyboard can already reach inside a panel.
 *
 * ponytail: a heuristic, and deliberately not a focusability engine - disabled controls
 * and hidden subtrees are not filtered out. The cost of being wrong is one tab stop too
 * few on a panel whose only content is a disabled control, which is a panel with nothing
 * to read either.
 */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';

/**
 * The `id` a `#fragment` names - out of an `href` or out of `location.hash`, both of which
 * arrive with the `#` still on.
 *
 * Decoded, because `id="café"` is reached by `href="#caf%C3%A9"` and the two have to meet
 * somewhere. Taken as written when that fails: a stray `%` in a fragment is a typo, and a
 * typo in one link is not a reason for a whole tab set to stop working.
 */
function fragment(hash) {
  const raw = hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Monotonic counter for generating `id`s for markup authored without them. */
let tabsCount = 0;

/**
 * `<tabs-elemental>` custom element.
 *
 * A list of tabs and the panels they show, per the
 * [APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), in both
 * orientations.
 *
 * The markup it is written on is the markup the page would have had anyway: a list of
 * in-page links, and the sections they point at. With no script that is exactly what it
 * still is - every panel on screen, every link jumping to one - which is why the panels
 * are not authored `hidden`. The element is what turns the list into a tablist, and it is
 * the only thing that ever hides a panel.
 *
 * The selected tab is marked with a border, which needs no script and cannot disagree with
 * where the tab is. `sliding` is the other answer, for a page that wants the mark to travel:
 * the element measures the selected tab against the strip and writes the two numbers a bar
 * can be drawn from, re-measuring whenever the strip or any tab in it changes size. That is
 * a `ResizeObserver` and two rects per change, which is why it is asked for rather than
 * given - and why the strip is watched *with* every tab in it, since a label that grows
 * inside a strip that stays the size it was moves every tab after it without the container
 * ever resizing.
 *
 * Light DOM, no shadow root. Nothing is moved and nothing is wrapped - the panels stay
 * where the markup put them, which is what lets a page lay them out with the element's
 * own grid or with one of its own.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * @tag tabs-elemental
 * @attr {number} [selected=0] - Index of the selected tab. Reflected, so `[selected]` is a styling hook.
 * @attr {boolean} [vertical=false] - The tablist runs down the page rather than across it. Swaps the arrow keys with it.
 * @attr {boolean} [manual=false] - Arrows move focus without selecting; Enter or Space selects. Automatic otherwise.
 * @attr {boolean} [sliding=false] - Mark the selection with a bar that travels to the tab rather than a border on it. Costs a `ResizeObserver`.
 *
 * @cssprop {<length>} [--tabs-elemental-gap=0.25rem] - Between the tabs.
 * @cssprop {<length>} [--tabs-elemental-inset=0.5rem 0.75rem] - Padding inside a tab.
 * @cssprop {<length>} [--tabs-elemental-panel-inset=1rem] - Between the tablist and the panel.
 * @cssprop {<length>} [--tabs-elemental-radius=0.375rem] - Corner radius of a tab.
 * @cssprop {<length>} [--tabs-elemental-indicator-size=2px] - Thickness of the rule under the strip, and of the mark on the selected tab.
 * @cssprop {<color>} [--tabs-elemental-indicator=currentcolor] - What marks the selected tab.
 * @cssprop {<color>} [--tabs-elemental-border=color-mix(in srgb, currentcolor 20%, transparent)] - The rule the tabs sit on.
 * @cssprop {<color>} [--tabs-elemental-hover=color-mix(in srgb, currentcolor 10%, transparent)] - Tab background under the pointer.
 * @cssprop {<color>} [--tabs-elemental-muted=color-mix(in srgb, currentcolor 65%, transparent)] - Text of a tab that is not selected.
 * @cssprop {<time>} [--tabs-elemental-duration=250ms] - How long the `sliding` bar takes to travel. Nothing else in the theme moves.
 * @cssprop {ease | ease-in | ease-out | ease-in-out | linear} [--tabs-elemental-easing=ease-in-out] - How the `sliding` bar travels.
 *
 * @fires tabs-select - `detail.tab` is the tab now selected, `detail.panel` what it shows, `detail.index` where it is.
 *
 * @slot - The `<ul>` of tabs, and the panels - one per tab, in the same order.
 */
export class TabsElemental extends ElementBase {
  static get observedAttributes() {
    return ['selected', 'vertical', 'sliding'];
  }

  /** The tablist: the first list in the element. A nested `<tabs-elemental>` keeps its own. */
  get tablist() {
    const list = this.querySelector('ul, menu');
    return list && list.closest('tabs-elemental') === this ? list : null;
  }

  /** The tabs, in order. What the `<li>`s hold, so a link inside a panel is not one. */
  get tabs() {
    const list = this.tablist;
    return list ? Array.from(list.querySelectorAll(':scope > li > a, :scope > li > button')) : [];
  }

  /** The panels, in tab order. A tab with nothing to show keeps its place as `null`. */
  get panels() {
    return this.tabs.map((tab) => this.panelOf(tab));
  }

  /**
   * The panel a tab shows: what its `aria-controls` or its own `#fragment` names, and
   * failing both, the child sitting in the same position.
   *
   * The fragment is the one worth writing markup for. A tab authored as a link to its own
   * panel is a working in-page link before this element exists and after it fails to
   * upgrade, and it means the relationship is stated once rather than in an `id` and an
   * `aria-controls` that can drift apart.
   */
  panelOf(tab) {
    const href = tab.getAttribute('href') || '';
    const id = tab.getAttribute('aria-controls')
      || (href.startsWith('#') ? fragment(href) : '');
    const named = id && document.getElementById(id);
    if (named) return named;
    // Everything in the element that is not the tablist, in order: the pool a tab with no
    // target of its own takes from.
    const list = this.tablist;
    const rest = Array.from(this.children).filter((child) => child !== list);
    return rest[this.tabs.indexOf(tab)] || null;
  }

  /** Index of the selected tab. Reflected, so `[selected]` is a styling hook too. */
  get selected() {
    return selectedIndex(this.getAttribute('selected'), this.tabs.length);
  }

  set selected(value) {
    this.setAttribute('selected', value);
  }

  /** Whether the tablist runs down the page. The arrow keys go with it. */
  get vertical() {
    return this.hasAttribute('vertical');
  }

  set vertical(value) {
    this.toggleAttribute('vertical', !!value);
  }

  /**
   * Whether moving focus along the tablist also selects.
   *
   * Automatic is the default because it is what the APG recommends wherever showing a
   * panel is instant, which it is when the panel is already in the page. `manual` is for
   * the case that is not: a panel whose content arrives over the network, where arrowing
   * past four tabs would start four requests nobody asked for.
   */
  get manual() {
    return this.hasAttribute('manual');
  }

  set manual(value) {
    this.toggleAttribute('manual', !!value);
  }

  /**
   * Whether the selection is marked with a bar that travels to the tab rather than with a
   * border on it. Opt-in because it is the one thing here that has to measure a layout.
   */
  get sliding() {
    return this.hasAttribute('sliding');
  }

  set sliding(value) {
    this.toggleAttribute('sliding', !!value);
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded deferred or
    // at the end of the body, so by upgrade time they are there.
    if (this.initialized) return;
    if (!this.tablist || !this.tabs.length) return;

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBeforeMatch = this.onBeforeMatch.bind(this);
    this.onHashChange = this.onHashChange.bind(this);

    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('hashchange', this.onHashChange);

    // Before the element counts as initialized, so the deep link is the state the first
    // `apply` puts on the markup rather than a change announced to a page that has not
    // seen the tab set yet. A reader who followed one of these links before the bundle
    // arrived is owed the panel, not an event.
    this.selectFromHash();
    this.initialized = true;
    this.wire();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('hashchange', this.onHashChange);
    this.unobserve();

    const list = this.tablist;
    if (list) {
      list.removeAttribute('role');
      list.removeAttribute('aria-orientation');
      list.removeAttribute('data-tabs-list');
      for (const item of list.querySelectorAll(':scope > li')) item.removeAttribute('role');
    }

    // Everything written comes off, and every panel comes back. The roles go because a
    // `role="tab"` nobody is driving is a keyboard contract with no keyboard behind it,
    // and the `hidden` goes because a panel hidden by an element that is no longer here
    // has nothing left to show it again.
    for (const tab of this.tabs) {
      tab.removeAttribute('role');
      tab.removeAttribute('aria-selected');
      tab.removeAttribute('aria-controls');
      tab.removeAttribute('tabindex');
    }
    // The panels this element actually wired, remembered rather than looked up again: a
    // panel paired by `id` is found through the document, and by now this element may not
    // be in one.
    for (const panel of this.wired || []) this.release(panel);
    this.wired = [];

    this.initialized = false;
  }

  /** Take everything this element wrote back off a panel, and hand it to the page as it
   * was found. */
  release(panel) {
    panel.removeEventListener('beforematch', this.onBeforeMatch);
    panel.removeAttribute('hidden');
    panel.removeAttribute('role');
    panel.removeAttribute('aria-labelledby');
    panel.removeAttribute('data-tabs-panel');
    panel.removeAttribute('tabindex');
  }

  /**
   * Read the markup and put the pattern on it - the roles, the pairings, the ids either
   * side of them - then push the current state through `apply`.
   *
   * Public and idempotent, because the tabs are the page's to change: add one, remove one,
   * swap the labels, and this is the one call that says so. Nothing observes the markup on
   * the element's behalf, which would be a `MutationObserver` running on every page that
   * never touches its tabs to save this one line on the pages that do.
   */
  wire() {
    const list = this.tablist;
    if (!list) return;
    const previous = this.wired || [];
    this.wired = [];

    list.setAttribute('role', 'tablist');
    list.setAttribute('data-tabs-list', '');
    // Only when it is true: horizontal is `aria-orientation`'s own default, and writing it
    // out is a second copy of the same fact to keep in step.
    if (this.vertical) list.setAttribute('aria-orientation', 'vertical');
    else list.removeAttribute('aria-orientation');

    // Inside a tablist the list semantics are noise - a screen reader counting list items
    // in a tab strip is counting the wrong thing, and it is already told how many tabs
    // there are.
    for (const item of list.querySelectorAll(':scope > li')) item.setAttribute('role', 'none');

    for (const tab of this.tabs) {
      if (!tab.id) tab.id = 'tabs-elemental-tab-' + (++tabsCount);
      tab.setAttribute('role', 'tab');
      // A button in a form submits it unless told otherwise, and a tab set that posts the
      // page away when you change tabs is not a tab set.
      if (tab.tagName === 'BUTTON' && !tab.hasAttribute('type')) tab.type = 'button';

      const panel = this.panelOf(tab);
      if (!panel) continue;
      if (!panel.id) panel.id = 'tabs-elemental-panel-' + (++tabsCount);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.setAttribute('data-tabs-panel', '');
      tab.setAttribute('aria-controls', panel.id);
      this.wired.push(panel);

      // Find-in-page reveals a hidden panel on its own; this is how the tablist hears
      // about it and stops disagreeing with it. Added unguarded on every pass, because
      // the same listener registered twice for the same event is the platform's own
      // no-op - there is nothing here to keep a record of.
      panel.addEventListener('beforematch', this.onBeforeMatch);
    }

    // A panel whose tab has gone is nobody's now, and must not be left hidden by an
    // element that no longer has anything to show it with.
    for (const panel of previous) {
      if (!this.wired.includes(panel)) this.release(panel);
    }

    // After the panels and before `apply`, so a tab added since the last pass is watched
    // before anything measures against it.
    this.observe();
    this.apply();
  }

  /**
   * Watch everything whose size can move the bar: the strip, and every tab in it.
   *
   * The strip on its own is the observer every measured indicator ships with and the bug
   * that comes with it - a label that grows leaves the container exactly the size it was,
   * so nothing fires and the bar stays under where the tab used to be. Watching the tabs
   * catches the webfont landing and the label translated too, which are the same event seen
   * from the other end.
   *
   * Idempotent, and safe to call when nothing has asked for a bar: it is how `sliding` going
   * on and off is served, and how `wire()` picks up a tab the page has added.
   */
  observe() {
    this.unobserve();
    // A browser with no `ResizeObserver` keeps the border mark rather than getting a bar
    // that measures itself once and then lies for the rest of the page's life.
    if (!this.sliding || typeof ResizeObserver !== 'function') return;
    this.observer = new ResizeObserver(() => this.measure());
    const list = this.tablist;
    if (list) this.observer.observe(list);
    for (const tab of this.tabs) this.observer.observe(tab);
    this.measure();
  }

  /** Stop watching, and take the measurement back off - state nobody is keeping up to date
   * is worse than none. */
  unobserve() {
    if (this.observer) this.observer.disconnect();
    this.observer = null;
    this.removeAttribute('data-tabs-sliding');
    this.style.removeProperty('--tabs-elemental-tab-start');
    this.style.removeProperty('--tabs-elemental-tab-size');
  }

  /**
   * Measure the selected tab against the strip and write the two numbers onto this element.
   *
   * `data-tabs-sliding` is written with them and never before them: CSS cannot ask whether a
   * custom property was set, so the attribute is what tells a stylesheet the numbers are
   * there. `[sliding]` alone is what the page asked for, and a theme that took the border
   * mark off on the strength of the asking would leave a tab set with nothing marking the
   * selection every time the script did not arrive.
   */
  measure() {
    // The observer is the licence to measure: a browser without one, or a page that has not
    // asked for a bar, gets no number rather than one taken once and never corrected - which
    // would be a bar parked under a tab that has since moved, and worse than the border it
    // replaced.
    if (!this.observer) return;
    const list = this.tablist;
    // `selectedIndex` off a list read once, rather than `this.selected`, which reads the tabs
    // again to find out how many there are - two passes over the strip on every frame of a
    // resize, for a number this line already has.
    const tabs = this.tabs;
    const tab = tabs[selectedIndex(this.getAttribute('selected'), tabs.length)];
    if (!list || !tab) return;
    const rtl = getComputedStyle(list).direction === 'rtl';
    const box = barBox(list.getBoundingClientRect(), tab.getBoundingClientRect(), this.vertical, rtl);
    this.style.setProperty('--tabs-elemental-tab-start', box.start + 'px');
    this.style.setProperty('--tabs-elemental-tab-size', box.size + 'px');
    this.setAttribute('data-tabs-sliding', '');
  }

  /**
   * Push the selection onto the tabs and their panels.
   *
   * The roving tabindex is the half of this that is easy to miss: a tab strip is one stop
   * on the way through the page, not one stop per tab, so the selected tab is the only one
   * `Tab` can land on and the arrows do the rest.
   */
  apply() {
    const at = this.selected;
    this.tabs.forEach((tab, index) => {
      const on = index === at;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;

      const panel = this.panelOf(tab);
      if (!panel) return;

      if (!on) {
        // `until-found` rather than a bare `hidden`, so find-in-page still searches the
        // panels nobody is looking at and this element hears about it when one is found.
        // It keeps the panel's box, which the stylesheet takes back off - see `index.scss` -
        // and which is also why the tab stop below has to come off with the panel: a
        // focusable box with its contents skipped is a tab stop on an empty strip.
        panel.setAttribute('hidden', 'until-found');
        panel.removeAttribute('tabindex');
        return;
      }

      panel.removeAttribute('hidden');
      // A panel with nothing focusable in it is a panel a keyboard cannot reach, and so
      // cannot scroll either. Giving it a tab stop is the APG's answer, and it is only for
      // that case: a panel full of links has enough tab stops already.
      if (panel.querySelector(FOCUSABLE)) panel.removeAttribute('tabindex');
      else panel.tabIndex = 0;
    });

    // The selection is the one move no observer sees: nothing resized, the bar simply
    // belongs somewhere else now.
    this.measure();
  }

  /**
   * `selected` is the single source of truth, so a click, an arrow key, a script and a
   * deep link all land here and nowhere else.
   */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    if (name === 'vertical') {
      this.wire();
      return;
    }
    // Not `apply`, and no `tabs-select`: the selection has not changed, only how it is drawn.
    if (name === 'sliding') {
      this.observe();
      return;
    }
    this.apply();
    const tab = this.tabs[this.selected];
    this.dispatchEvent(new CustomEvent('tabs-select', {
      bubbles: true,
      detail: { tab: tab || null, panel: tab ? this.panelOf(tab) : null, index: this.selected }
    }));
  }

  /** The tab this event happened on, or null for anything else - a link inside a panel,
   * or a nested tab set's. */
  tabFor(e) {
    const control = e.target.closest && e.target.closest('a, button');
    if (!control) return null;
    return control.closest('ul, menu') === this.tablist ? control : null;
  }

  onClick(e) {
    const tab = this.tabFor(e);
    if (!tab) return;
    // A modified click is asking for a new tab or window, and it works there: the fragment
    // a link-shaped tab carries is its panel's, and `selectFromHash` lands the page that
    // opens on that panel showing.
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    // A tab authored as a link points at its own panel, which is already on the page:
    // following it would scroll to something the reader is looking at and write a
    // fragment they did not ask for into the URL.
    e.preventDefault();
    this.selected = this.tabs.indexOf(tab);
  }

  onKeyDown(e) {
    const tab = this.tabFor(e);
    if (!tab) return;

    if (e.key === ' ' && tab.tagName === 'A') {
      // `role="tab"` promises Space activates. On a link it does not - it scrolls - so on
      // the one element where the role is a promise the platform does not keep, keep it.
      e.preventDefault();
      tab.click();
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

    const tabs = this.tabs;
    const to = nextIndex(tabs.indexOf(tab), tabKey(e.key, this.vertical), tabs.length);
    if (to === null) return;
    e.preventDefault();

    tabs[to].focus();
    // Automatic activation: the selection follows the focus, which is what the APG asks
    // for wherever showing a panel costs nothing. `manual` is the other half of that
    // sentence, and there Enter and Space - the button's own click - are what selects.
    if (!this.manual) this.selected = to;
  }

  onHashChange() {
    this.selectFromHash();
  }

  onBeforeMatch(e) {
    const at = this.panels.indexOf(e.currentTarget);
    if (at >= 0) this.selected = at;
  }

  /**
   * Select the tab whose panel holds the element the URL fragment points at, so a link
   * into a panel lands on it showing. Which is also the no-script story arriving: the tabs
   * are in-page links, and following one before this element upgrades leaves exactly this
   * fragment in the URL.
   */
  selectFromHash() {
    const id = fragment(window.location.hash);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const at = this.panels.findIndex((panel) => panel && (panel === target || panel.contains(target)));
    if (at >= 0) this.selected = at;
  }
}

define('tabs-elemental', TabsElemental);
