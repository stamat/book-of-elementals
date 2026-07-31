import { ElementBase, define, nextIndex } from '../../core.js';

/**
 * Where a type-ahead lands in a menu, given what has been typed so far.
 *
 * Two rules that look like edge cases and are not. Holding or repeating one letter
 * cycles the items starting with it - `aaa` is someone pressing `a` three times
 * looking for the next "Archive", not an item named "aaa". And a search that is one
 * character long starts *after* the focused item, so pressing that letter again moves
 * on, while a buffer still being typed starts *at* it, so the match narrows onto the
 * item the reader is already on instead of skipping past it.
 *
 * @param {string[]} labels - The items' text, in menu order.
 * @param {number} current - Index of the focused item, `-1` for none.
 * @param {string} buffer - What has been typed inside the type-ahead window.
 * @returns {number|null} Target index, or null if nothing matches.
 */
export function typeAheadIndex(labels, current, buffer) {
  if (!buffer) return null;
  const query = buffer.toLowerCase();
  const repeated = query.length > 1 && query.split('').every((c) => c === query[0]);
  const prefix = repeated ? query[0] : query;
  const from = prefix.length === 1 ? current + 1 : current;

  for (let i = 0; i < labels.length; i++) {
    const at = (from + i + labels.length) % labels.length;
    if (labels[at].trim().toLowerCase().startsWith(prefix)) return at;
  }
  return null;
}

/** How long a type-ahead keeps collecting keystrokes, in milliseconds. */
/**
 * Whether a panel of `size` starting at `at` is inside a viewport of `limit`.
 *
 * Both ends, because a panel that runs off the top is as unreachable as one that runs
 * off the bottom, and the flipped placement is exactly as capable of doing it.
 */
function fits(at, size, limit) {
  return at >= 0 && at + size <= limit;
}

/**
 * Where the root list goes: under the button, or over it when there is no room under;
 * and running from the button's inline start, or back the other way when that would take
 * it off the edge.
 *
 * The preferred placement wins ties and wins when neither fits, because a panel with
 * nowhere good to go should at least land where the reader expects it.
 *
 * @param {DOMRect|object} trigger Rect of the button, in viewport coordinates.
 * @param {{width: number, height: number}} panel Size of the list.
 * @param {{width: number, height: number}} viewport
 * @param {boolean} rtl Whether the menu runs right to left.
 * @returns {{side: string, align: string}}
 */
export function placeFlyout(trigger, panel, viewport, rtl) {
  const below = fits(trigger.bottom, panel.height, viewport.height);
  const above = fits(trigger.top - panel.height, panel.height, viewport.height);

  // Aligned to the trigger's inline start means its left edge in LTR and its right in
  // RTL, so the sums are written in physical terms and the direction picks the edge.
  const start = rtl ? trigger.right - panel.width : trigger.left;
  const end = rtl ? trigger.left : trigger.right - panel.width;

  return {
    side: below || !above ? 'block-end' : 'block-start',
    align: fits(start, panel.width, viewport.width) || !fits(end, panel.width, viewport.width)
      ? 'start'
      : 'end'
  };
}

/**
 * Where a submenu goes: beside its own item, on the inline end unless the edge is there,
 * and running down from the item unless the bottom is.
 *
 * Which is how a menu near the bottom right corner ends up opening up and to the left,
 * one decision per axis rather than a list of corners.
 *
 * @param {DOMRect|object} item Rect of the item that opens it.
 * @param {{width: number, height: number}} panel
 * @param {{width: number, height: number}} viewport
 * @param {boolean} rtl
 * @returns {{side: string, align: string}}
 */
export function placeSubmenu(item, panel, viewport, rtl) {
  const inlineEnd = rtl ? item.left - panel.width : item.right;
  const inlineStart = rtl ? item.right : item.left - panel.width;

  const down = fits(item.top, panel.height, viewport.height);
  const up = fits(item.bottom - panel.height, panel.height, viewport.height);

  return {
    side: fits(inlineEnd, panel.width, viewport.width) || !fits(inlineStart, panel.width, viewport.width)
      ? 'inline-end'
      : 'inline-start',
    align: down || !up ? 'start' : 'end'
  };
}

const TYPE_AHEAD_WINDOW = 500;

// How long a hover-opened menu waits after the pointer leaves. Long enough to cross the
// gap between a button and its panel, short enough not to feel stuck.
const HOVER_CLOSE_DELAY = 250;

/** Monotonic counter for generating an `id` for a list authored without one. */
let menuCount = 0;

/** Set an attribute, or remove it when the value is `null`. */
function set(element, name, value) {
  if (!element) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/**
 * `<menu-elemental>` custom element.
 *
 * A button and the nested lists it opens, per the
 * [APG Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) -
 * with one addition the APG has no opinion on, because it is a layout question:
 * below a breakpoint the whole thing stops being a menu.
 *
 * That is the `media` attribute, and it is the point of the element. A flyout is a
 * desktop object: it floats over the page, only one branch of it is open at a time,
 * arrows move between items because the items are not in the tab order. On a phone
 * the same markup wants to be a stack of nested disclosures inside a drawer - links
 * you tab through, submenus that stay open where you left them, no `role="menu"` at
 * all. Two widgets, one set of markup, and the viewport decides which one is on.
 *
 * Which also means the ARIA changes with the mode, not just the CSS. `role="menu"`
 * is a promise that the arrow keys work and Tab does not, so making it while the
 * items are a plain tabbable list would be a lie told to exactly the readers who
 * cannot see the layout that makes it obvious.
 *
 * ponytail: not built on the Popover API. For a dropdown holding *links* it would be
 * the whole answer - Escape, light dismiss, focus return, tab order, all native, no
 * script - and `<disclosure-elemental>` plus `popover` is the better thing to reach
 * for there. A menu has to own focus anyway for the roving tabindex and the
 * type-ahead, so popover would save the small half of the work and cost the inline
 * mode, which cannot be in the top layer.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * @tag menu-elemental
 * @attr {string} media - The media query the flyout exists in. Outside it, nested disclosures. Unset means a menu at every width.
 * @attr {boolean} [open=false] - Whether the root list is showing. Reflected, so `[open]` is a styling hook.
 * @attr {boolean} [hover=false] - A mouse also opens it by pointing at it. Never on touch, never inline.
 *
 * @cssprop {<length>} [--menu-elemental-radius=0.375rem] - Corner radius of a flyout list.
 * @cssprop {<length>} [--menu-elemental-inset=0.35rem] - Padding inside a list, and around each item.
 * @cssprop {<length>} [--menu-elemental-caret-size=0.75em] - The caret on an item that opens a submenu.
 * @cssprop {<length>} [--menu-elemental-hamburger-size=1.25em] - The generated hamburger icon.
 * @cssprop {<color>} [--menu-elemental-surface=Canvas] - What a flyout list is painted on. The page's own background, so re-point it on a card.
 * @cssprop {<color>} [--menu-elemental-hover=color-mix(in srgb, currentcolor 10%, transparent)] - Item background under the pointer, and while focused.
 * @cssprop {<color>} [--menu-elemental-border=color-mix(in srgb, currentcolor 20%, transparent)] - The rim around a flyout list.
 *
 * @fires menu-toggle - `detail.menu` is the list that opened or closed, `detail.open` which way it went.
 *
 * @slot - The `<button>` that opens it, and the `<ul>` it opens - submenus nested in their own `<li>`.
 */
export class MenuElemental extends ElementBase {
  static get observedAttributes() {
    return ['open', 'media'];
  }

  /**
   * Whether a mouse opens the menu by pointing at it rather than by clicking.
   *
   * Opt-in, and only ever an addition: click, Enter and the arrow keys are what the
   * pattern promises, and a menu nobody can open without a steady hand is not one. Off
   * for touch, where there is no hovering to do and the first tap would open and pick
   * in one gesture, and off inline, where the branches are stacked in the page and a
   * pointer crossing the stack would open every one it passed.
   */
  get hover() {
    return this.hasAttribute('hover') && !this.inline;
  }

  set hover(value) {
    this.toggleAttribute('hover', !!value);
  }

  /** The `<button>` that opens the root list. Direct child, so a submenu's trigger -
   * or a nested menu's button - is not mistaken for it. */
  get button() {
    return this.querySelector(':scope > button');
  }

  /** The root list. */
  get menu() {
    return this.querySelector(':scope > ul, :scope > menu');
  }

  /** Every list in this menu, root first. A nested `<menu-elemental>` keeps its own. */
  get menus() {
    return Array.from(this.querySelectorAll('ul, menu'))
      .filter((list) => list.closest('menu-elemental') === this);
  }

  /** Whether the root list is showing. Reflected, so `[open]` is a styling hook too. */
  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', !!value);
  }

  /**
   * Whether this is currently the stack-of-disclosures rather than the flyout: a
   * `media` that is not matching right now. No `media` at all means a menu that is
   * a menu at every width, which is what a menu button is when nothing says otherwise.
   */
  get inline() {
    return !!this.query && !this.query.matches;
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded
    // deferred or at the end of the body, so by upgrade time they are there.
    if (this.initialized) return;
    if (!this.button || !this.menu) return;
    this.initialized = true;

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onMediaChange = this.onMediaChange.bind(this);
    this.onPointerOver = this.onPointerOver.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.placeOpen = this.placeOpen.bind(this);

    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeyDown);
    // Bound whether or not `hover` is set, since it can be set later; the handlers
    // check it themselves, which is one attribute read against two listeners to add
    // and remove on every change.
    this.addEventListener('pointerover', this.onPointerOver);
    this.addEventListener('pointerleave', this.onPointerLeave);
    // Tab out of an open menu, or a click that lands on something focusable
    // elsewhere: either way the menu is behind the reader now.
    this.addEventListener('focusout', this.onFocusOut);
    document.addEventListener('click', this.onDocumentClick);
    // The corner a panel fits in is a fact about the viewport, so it is re-decided when
    // the viewport changes under it. Scrolling is not listened for: the page scrolling
    // with a menu open is the page moving out from under a reader who is in the middle
    // of using it, and re-placing on every frame of that would cost more than it fixes.
    window.addEventListener('resize', this.placeOpen);

    // Every branch starts closed. The markup authors them plainly visible, so with
    // no script the whole thing is still a nested list of links; this is the first
    // moment there is a button to open them again.
    for (const menu of this.menus) {
      if (menu !== this.menu) menu.setAttribute('hidden', '');
    }

    this.watchMedia();
    this.wire();
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
    window.removeEventListener('resize', this.placeOpen);
    clearTimeout(this.hoverTimer);
    if (this.query) this.query.removeEventListener('change', this.onMediaChange);

    // Lists left hidden by an element that is no longer here have nothing to open
    // them again. The roles go with them: a `role="menu"` nobody is driving is a
    // keyboard contract with no keyboard behind it.
    for (const menu of this.menus) {
      menu.removeAttribute('hidden');
      set(menu, 'role', null);
      for (const item of this.itemsOf(menu)) {
        set(item.parentElement, 'role', null);
        set(item, 'role', null);
        set(item, 'tabindex', null);
      }
    }

    this.initialized = false;
  }

  // ---- structure ----

  /** The items of one list: what its `<li>`s hold, and not what its submenus do. */
  itemsOf(menu) {
    return menu ? Array.from(menu.querySelectorAll(':scope > li > a, :scope > li > button')) : [];
  }

  /** The list an item belongs to. */
  menuOf(item) {
    return item.closest('ul, menu');
  }

  /** The list an item opens, if it opens one. */
  submenuOf(item) {
    return item.parentElement && item.parentElement.querySelector(':scope > ul, :scope > menu');
  }

  /**
   * The item that opens a list. For a submenu that is the item beside it in the same
   * `<li>`; for the root list the element's own button, which is the same query one
   * level up.
   */
  triggerOf(menu) {
    return menu.parentElement && menu.parentElement.querySelector(':scope > a, :scope > button');
  }

  isOpen(menu) {
    return !menu.hasAttribute('hidden');
  }

  /**
   * The items the arrows walk from here.
   *
   * A flyout is walked one list at a time - the submenu is a separate surface and
   * Left/Right are how you cross between them. Inline there are no surfaces: the
   * open submenus are on screen, in the flow, and stopping at the edge of a list the
   * reader is looking straight through would be arbitrary.
   */
  navigable(menu) {
    return this.inline ? this.visibleItems(this.menu) : this.itemsOf(menu);
  }

  /** Every item on screen from `menu` down, in the order they are rendered. */
  visibleItems(menu) {
    const out = [];
    for (const item of this.itemsOf(menu)) {
      out.push(item);
      const submenu = this.submenuOf(item);
      if (submenu && this.isOpen(submenu)) out.push(...this.visibleItems(submenu));
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
    // The two modes are different widgets with different keyboards. Crossing the
    // breakpoint with a branch open would leave half of one behind, wearing the
    // other's roles.
    this.closeAll();
    this.wire();
  }

  /**
   * Put the current mode's roles on the markup: a menu with items that are not in the
   * tab order, or a set of nested disclosures that are nothing but an ordinary list.
   *
   * `aria-controls` and `aria-expanded` are the only two that survive the switch,
   * because they are true of both - a button that shows and hides a thing, and which
   * thing it is.
   */
  wire() {
    const inline = this.inline;
    this.dataset.mode = inline ? 'inline' : 'flyout';

    for (const menu of this.menus) {
      if (!menu.id) menu.id = 'menu-elemental-' + (++menuCount);
      set(menu, 'role', inline ? null : 'menu');

      const trigger = this.triggerOf(menu);
      if (trigger) {
        // A button in a form submits it unless told otherwise, and a menu that posts
        // the page away when you open it is not a menu.
        if (trigger.tagName === 'BUTTON' && !trigger.hasAttribute('type')) trigger.type = 'button';
        trigger.setAttribute('aria-controls', menu.id);
        set(trigger, 'aria-haspopup', inline ? null : 'menu');
        trigger.setAttribute('aria-expanded', this.isOpen(menu) ? 'true' : 'false');
      }

      for (const item of this.itemsOf(menu)) {
        // `role="none"` on the `<li>`: inside a `role="menu"` the list semantics are
        // noise, and a screen reader counting list items in a menu is counting the
        // wrong thing.
        set(item.parentElement, 'role', inline ? null : 'none');
        set(item, 'role', inline ? null : 'menuitem');
        // In a menu the button is the only tab stop and the arrows do the rest.
        // Inline they are ordinary links in an ordinary list, and taking those out of
        // the tab order would be a navigation a keyboard cannot use.
        set(item, 'tabindex', inline ? null : '-1');
      }
    }
  }

  /** Push the root list's state onto it and its button. */
  apply() {
    const menu = this.menu;
    const button = this.button;
    if (!menu || !button) return;
    button.setAttribute('aria-expanded', this.open ? 'true' : 'false');
    menu.toggleAttribute('hidden', !this.open);
    // A submenu left open inside a closed menu would be waiting there for the next
    // time it is opened, on a branch nobody chose this time.
    if (!this.open) this.closeSubmenus(menu);
    else this.place(menu);
  }

  /**
   * Point a list at whichever corner it fits in, and write that on it so the stylesheet
   * can put it there - the same trade as `data-mode`, and for the same reason: the
   * measuring is the element's, the positioning is CSS's.
   *
   * Measured from the preferred placement rather than from wherever the last flip left
   * it, so a panel does not decide where to go from a position it only has because it
   * went there last time.
   *
   * The carets read this back too: a submenu that opened to the left is announced by an
   * arrow that points left, which no `position-try` fallback can say.
   */
  place(menu) {
    const isRoot = menu === this.menu;
    const trigger = isRoot ? this.button : this.triggerOf(menu);
    // Inline there is no floating and nothing to collide with - the lists are in the
    // flow, and a stylesheet keyed on these would be positioning a block.
    if (!trigger || this.inline) {
      menu.removeAttribute('data-side');
      menu.removeAttribute('data-align');
      return;
    }

    menu.removeAttribute('data-side');
    menu.removeAttribute('data-align');

    const panel = { width: menu.offsetWidth, height: menu.offsetHeight };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const rtl = window.getComputedStyle(menu).direction === 'rtl';
    const at = isRoot
      ? placeFlyout(trigger.getBoundingClientRect(), panel, viewport, rtl)
      : placeSubmenu(trigger.getBoundingClientRect(), panel, viewport, rtl);

    menu.setAttribute('data-side', at.side);
    menu.setAttribute('data-align', at.align);
  }

  /** Re-place every open list. The viewport moved under them. */
  placeOpen() {
    for (const menu of this.menus) {
      if (this.isOpen(menu) && (menu !== this.menu || this.open)) this.place(menu);
    }
  }

  // ---- opening and closing ----

  /**
   * Show or hide one submenu.
   *
   * Floating, the branches overlap, so opening one closes its siblings - that is what
   * makes a flyout readable. Inline they are stacked in the flow and closing a branch
   * the reader opened on purpose only loses their place.
   */
  setSubmenu(trigger, open) {
    const submenu = this.submenuOf(trigger);
    if (!submenu || this.isOpen(submenu) === open) return;

    if (open && !this.inline) {
      for (const sibling of this.itemsOf(this.menuOf(trigger))) {
        if (sibling !== trigger) this.setSubmenu(sibling, false);
      }
    }
    if (!open) this.closeSubmenus(submenu);

    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    submenu.toggleAttribute('hidden', !open);
    // After unhiding, because a hidden box has no size to measure and a panel with no
    // size fits everywhere.
    if (open) this.place(submenu);
    this.dispatchEvent(new CustomEvent('menu-toggle', {
      bubbles: true,
      detail: { menu: submenu, open: open }
    }));
  }

  /** Close every open branch below a list, deepest first. */
  closeSubmenus(menu) {
    for (const item of this.itemsOf(menu)) this.setSubmenu(item, false);
  }

  closeAll() {
    if (this.menu) this.closeSubmenus(this.menu);
    this.open = false;
  }

  /**
   * Move focus to one item of a list, counting from the end for a negative index -
   * `-1` is the last item, which is where Up on the closed button lands.
   */
  focusItem(menu, index) {
    const items = this.itemsOf(menu);
    const item = items[index < 0 ? items.length + index : index];
    if (item) item.focus();
    return item;
  }

  /**
   * `open` is the single source of truth for the root list, so a click, a script and
   * a media change all land here.
   */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    if (name === 'media') {
      this.watchMedia();
      this.onMediaChange();
      return;
    }
    this.apply();
    this.dispatchEvent(new CustomEvent('menu-toggle', {
      bubbles: true,
      detail: { menu: this.menu, open: this.open }
    }));
  }

  // ---- input ----

  /** The item this event happened on, or null for anything outside this menu. */
  itemFor(e) {
    const item = e.target.closest && e.target.closest('a, button');
    return item && item.closest('menu-elemental') === this ? item : null;
  }

  onClick(e) {
    const item = this.itemFor(e);
    if (!item) return;

    if (item === this.button) {
      this.open = !this.open;
      // Enter and Space on a button are a click, so this is also where the pattern's
      // "open and focus the first item" happens for the keyboard. Not inline: there
      // the list simply appears in the page and the reader tabs into it.
      if (this.open && !this.inline) this.focusItem(this.menu, 0);
      return;
    }

    const submenu = this.submenuOf(item);
    if (submenu) {
      const open = !this.isOpen(submenu);
      this.setSubmenu(item, open);
      if (open && !this.inline) this.focusItem(submenu, 0);
      return;
    }

    // A leaf. Whatever it does, it does it with the menu out of the way.
    this.closeAll();
  }

  /**
   * Point at it and it opens: the root list from the button, a branch from its own
   * item, and a branch closed again by pointing at any other item of the same list -
   * which is the sibling rule `setSubmenu` already keeps for clicks.
   *
   * `pointerover` rather than `pointerenter` because it bubbles, so one listener covers
   * every item; mouse only, because a touch "hover" is the tap that was about to pick
   * something.
   */
  onPointerOver(e) {
    if (!this.hover || e.pointerType !== 'mouse') return;
    clearTimeout(this.hoverTimer);

    const item = this.itemFor(e);
    if (!item) return;

    if (item === this.button) {
      this.open = true;
      return;
    }
    // Focus does not follow the pointer - the reader's caret stays where they put it,
    // and the arrow keys carry on from there.
    if (this.submenuOf(item)) this.setSubmenu(item, true);
    else this.closeSubmenus(this.menuOf(item));
  }

  /**
   * The pointer has left the whole element, so the menu closes - after a beat, because
   * the gap between a button and its panel, or between a panel and the one beside it,
   * is a place the pointer passes through rather than a place it means to be.
   */
  onPointerLeave(e) {
    if (!this.hover || e.pointerType !== 'mouse') return;
    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      // The reader may have tabbed in while the pointer was elsewhere; closing a menu
      // out from under the keyboard is worse than leaving one open.
      if (!this.contains(document.activeElement)) this.closeAll();
    }, HOVER_CLOSE_DELAY);
  }

  onKeyDown(e) {
    const item = this.itemFor(e);
    if (!item) return;

    if (item === this.button) {
      // Down opens onto the first item, Up onto the last. Enter and Space are the
      // button's own click, handled above.
      const to = e.key === 'ArrowDown' ? 0 : e.key === 'ArrowUp' ? -1 : null;
      if (to === null || this.inline) return;
      e.preventDefault();
      this.open = true;
      this.focusItem(this.menu, to);
      return;
    }

    const menu = this.menuOf(item);
    if (!menu) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeBranch(menu);
      return;
    }

    // Tab leaves, and leaving closes: a menu is not a place to be trapped, and the
    // items are out of the tab order anyway while it floats.
    if (e.key === 'Tab') {
      this.closeAll();
      return;
    }

    if (e.key === ' ' && item.tagName === 'A') {
      // `role="menuitem"` promises Space activates. On a link it does not - it
      // scrolls - so on the one element where the role is a promise the platform
      // does not keep, keep it by hand.
      e.preventDefault();
      item.click();
      return;
    }

    // Right opens a branch, Left closes it and steps back out to the item that owns
    // it. Both are about surfaces sitting beside each other, which is a thing only
    // the flyout has.
    if (!this.inline && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      if (e.key === 'ArrowRight') {
        const submenu = this.submenuOf(item);
        if (submenu) {
          this.setSubmenu(item, true);
          this.focusItem(submenu, 0);
        }
        return;
      }
      if (menu !== this.menu) this.closeBranch(menu);
      return;
    }

    const items = this.navigable(menu);
    const to = nextIndex(items.indexOf(item), e.key, items.length);
    if (to !== null) {
      e.preventDefault();
      items[to].focus();
      return;
    }

    // Type-ahead is a menu's, not a disclosure's: inline these are ordinary links and
    // a list that eats letter keys is a list you cannot find anything else with.
    if (this.inline || e.key.length !== 1 || e.key === ' ' || e.metaKey || e.ctrlKey || e.altKey) return;
    const now = Date.now();
    this.buffer = now - this.bufferedAt < TYPE_AHEAD_WINDOW ? this.buffer + e.key : e.key;
    this.bufferedAt = now;
    const at = typeAheadIndex(items.map((one) => one.textContent), items.indexOf(item), this.buffer);
    if (at === null) return;
    e.preventDefault();
    items[at].focus();
  }

  /**
   * Close the list focus is in and hand focus back to whatever opened it - a submenu
   * goes back to its trigger, the root list back to the button.
   */
  closeBranch(menu) {
    const trigger = this.triggerOf(menu);
    if (menu === this.menu) this.open = false;
    else this.setSubmenu(trigger, false);
    if (trigger) trigger.focus();
  }

  onFocusOut(e) {
    const next = e.relatedTarget;
    if (next && this.contains(next)) return;
    // Inline the menu is part of the page rather than laid over it, so tabbing on
    // through the drawer is not a reason to shut it.
    if (!this.inline) this.closeAll();
  }

  onDocumentClick(e) {
    if (this.contains(e.target) || this.inline) return;
    this.closeAll();
  }
}

define('menu-elemental', MenuElemental);
