import { ElementBase, define, nextIndex, placeFlyout } from '../../core.js';

/**
 * What a key means to a listbox popup, given whether it is showing.
 *
 * The [APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) keyboard
 * map for a textbox with a listbox popup, as a table rather than a branch tree, so it can
 * be read and tested without a DOM.
 *
 * `Home` and `End` are the pattern's one genuinely two-sided key, and it calls them
 * optional: either they jump the list, or - "if the combobox is editable" - they return the
 * caret to the first character of what was typed. This field is always editable, so both
 * answers are right at different moments, and `cursor` is which moment it is.
 *
 * Before an arrow key has put a cursor on a row the reader is still writing a query, and a
 * `Home` that jumped the list rather than reaching the start of `install` would be the
 * wrong answer on nearly every press. Once there is a cursor they are reading results
 * instead of writing, and the ends of the list are the only thing those keys can mean.
 *
 * `close` and `leave` both shut the popup and differ in what the key still has to do after.
 * Escape is finished once the popup is gone, so its own default - emptying a search field -
 * is the page's to keep. Tab was on its way out of the field, and swallowing it would cost
 * a second press to do what the first one already said.
 *
 * `tabCompletes` is the one exception, and it is opt-in because the rows here are links: a
 * Tab that took the one under the cursor would navigate away on a keystroke that means
 * "move along". Where the rows are text about to be typed - a mention, an emoji - it is what
 * every editor does, so the markup asks for it rather than the element guessing.
 *
 * @param {string} key `KeyboardEvent.key`
 * @param {boolean} altKey Whether Alt was held
 * @param {boolean} open Whether the popup is showing
 * @param {boolean} [cursor=false] Whether a row is already under the cursor
 * @param {boolean} [tabCompletes=false] Whether Tab may take the row under the cursor
 * @returns {"open"|"open-first"|"open-last"|"move"|"first"|"last"|"activate"|"close"|"leave"|null}
 *   `null` for a key this popup has no opinion about, which is every key that types a
 *   character.
 * @example
 * suggestAction('ArrowDown', false, false) // => 'open-first'
 * suggestAction('ArrowDown', true, false) // => 'open', Alt opens without choosing
 * suggestAction('ArrowDown', false, true) // => 'move'
 * suggestAction('Home', false, true, false) // => null, the caret is still the point
 * suggestAction('Home', false, true, true) // => 'first'
 * suggestAction('Tab', false, true) // => 'leave', closes and carries on out of the field
 * suggestAction('Tab', false, true, true, true) // => 'activate', takes the row instead
 */
export function suggestAction(key, altKey, open, cursor, tabCompletes) {
  if (!open) {
    if (key === 'ArrowDown') return altKey ? 'open' : 'open-first';
    if (key === 'ArrowUp') return 'open-last';
    return null;
  }
  if (key === 'ArrowUp' && altKey) return 'close';
  if (key === 'ArrowDown' || key === 'ArrowUp') return 'move';
  if (key === 'Home' && cursor) return 'first';
  if (key === 'End' && cursor) return 'last';
  if (key === 'Enter') return 'activate';
  if (key === 'Escape') return 'close';
  if (key === 'Tab') return cursor && tabCompletes ? 'activate' : 'leave';
  return null;
}

/**
 * The state a listbox and its control carry, for a given open state and cursor.
 *
 * `activedescendant: null` means the attribute comes off rather than being written empty:
 * an `aria-activedescendant` pointing at nothing is a control claiming a cursor it does
 * not have, and screen readers announce the stale option.
 *
 * @param {boolean} open
 * @param {string|null} activeId `id` of the option the cursor is on, or null for none
 * @returns {{expanded: string, hidden: boolean, activedescendant: string|null}}
 */
export function suggestState(open, activeId) {
  return {
    expanded: open ? 'true' : 'false',
    hidden: !open,
    activedescendant: open && activeId ? activeId : null
  };
}

/** Monotonic counter, so a listbox and its options have `id`s to be pointed at. */
let suggestCount = 0;

/**
 * `<suggest-elemental>` custom element.
 *
 * A list of links a text field can drive with the arrow keys, per the
 * [APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a
 * listbox popup - the results panel every search field, filter and "jump to" box ends up
 * needing, and the half of it that has nothing to do with where the results came from.
 *
 * It owns the keyboard and the ARIA and nothing else: no fetching, no filtering, no
 * opinion about what put the links there. Give it an `<ul>` of `<a>` and point it at an
 * input, and typing, arrowing and Enter behave the way the pattern says.
 *
 * **Not `<combobox-elemental>`.** That one is a view of a `<select>`: it holds a value, it
 * submits under a name, its options carry `aria-selected`. These options are links - they
 * are destinations, not values, and there is nothing to select. The two share the cursor
 * mechanics and nothing else.
 *
 * Focus never enters the list. The cursor is `aria-activedescendant` on the control, which
 * is what lets someone keep typing while walking the results - a roving `tabindex` would
 * take the caret out of the field on the first arrow key.
 *
 * Light DOM, no shadow root. Degrades to what it is: with no script, a list of links,
 * visible and reachable. Nothing is authored `hidden`, so nothing is lost when the script
 * is not there.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * @tag suggest-elemental
 * @attr {string} for - `id` of the text field that drives it. Without it the element does nothing.
 * @attr {boolean} [open=false] - Whether the popup is showing. Reflected, so `[open]` is a styling hook, and settable so whatever fills the list can show it.
 * @attr {boolean} [tab-completes=false] - Tab takes the row under the cursor instead of leaving. For a completer whose rows are text about to be typed; wrong for a list of links, which is why it is opt-in.
 *
 * @cssprop {<length>} [--suggest-elemental-radius=0.375rem] - Corners of the popup.
 * @cssprop {<length>} [--suggest-elemental-inset=0.5rem] - The one padding unit: down the side of every option, and three quarters of it above and below the text.
 * @cssprop {<length>} [--suggest-elemental-max-height=20rem] - How tall the popup gets before it scrolls.
 * @cssprop {<color>} [--suggest-elemental-surface=Canvas] - What the popup is painted on.
 * @cssprop {<color>} [--suggest-elemental-active=color-mix(in srgb, currentcolor 12%, transparent)] - The option the cursor is on - where Enter would land, and what the pointer moves.
 *
 * @fires suggest-toggle - `detail.open` is the new state.
 *
 * @slot - The `<ul>` of `<a>` the popup shows. Replace its contents whenever you like; the element re-marks them.
 */
export class SuggestElemental extends ElementBase {
  static get observedAttributes() {
    return ['open'];
  }

  /** The text field driving this popup - what `for` names. */
  get control() {
    const id = this.dataset.for != null ? this.dataset.for : this.getAttribute('for');
    return id ? document.getElementById(id) : null;
  }

  /** The options, in document order. Links only: an `<a>` with no `href` is not a
   * destination, and a listbox option that goes nowhere is a dead row on the list. */
  get options() {
    return Array.from(this.querySelectorAll('a[href]'));
  }

  /** Whether the popup is showing. Reflected, so `[open]` is a styling hook too. */
  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', !!value);
  }

  /** Whether Tab takes the row under the cursor rather than leaving the field. */
  get tabCompletes() {
    return this.hasAttribute('tab-completes');
  }

  set tabCompletes(value) {
    this.toggleAttribute('tab-completes', !!value);
  }

  connectedCallback() {
    if (this.initialized) return;
    const control = this.control;
    if (!control) return;

    this.initialized = true;
    if (!this.id) this.id = 'suggest-elemental-' + (++suggestCount);

    this.setAttribute('role', 'listbox');
    control.setAttribute('role', 'combobox');
    control.setAttribute('aria-controls', this.id);
    // `list` rather than `both`: nothing here writes into the field, so promising inline
    // completion would be promising a caret movement that never comes.
    control.setAttribute('aria-autocomplete', 'list');
    // A combobox with no popup open is still a combobox, and one that never says so reads
    // as a plain text field until the first arrow key.
    control.setAttribute('aria-expanded', 'false');

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onClick = this.onClick.bind(this);

    control.addEventListener('keydown', this.onKeyDown);
    control.addEventListener('focusout', this.onFocusOut);
    this.addEventListener('pointermove', this.onPointerMove);
    this.addEventListener('mousedown', this.onMouseDown);
    this.addEventListener('click', this.onClick);

    // Whatever fills this list is not required to tell the element it did. An observer
    // costs one per popup and takes a `refresh()` off the API of every caller - and the
    // caller forgetting it is a list of options a screen reader cannot see.
    this.observer = new MutationObserver(() => this.mark());
    this.observer.observe(this, { childList: true, subtree: true });

    this.mark();
    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;

    if (this.observer) this.observer.disconnect();
    this.observer = null;

    this.removeEventListener('pointermove', this.onPointerMove);
    this.removeEventListener('mousedown', this.onMouseDown);
    this.removeEventListener('click', this.onClick);

    const control = this.control;
    if (!control) return;
    control.removeEventListener('keydown', this.onKeyDown);
    control.removeEventListener('focusout', this.onFocusOut);
    // A field left behind by its popup is a plain text field again, and one still
    // claiming `aria-expanded` is announcing a popup nothing can open.
    control.removeAttribute('role');
    control.removeAttribute('aria-controls');
    control.removeAttribute('aria-autocomplete');
    control.removeAttribute('aria-expanded');
    control.removeAttribute('aria-activedescendant');
  }

  /**
   * Give the current children the roles and `id`s the pattern needs.
   *
   * A `listbox` may only own `option`s, and the markup between them here is a `<ul>` and
   * an `<li>` per row - both of which carry list semantics of their own. `presentation`
   * takes those off without taking the boxes away, so the options are owned by the listbox
   * directly and the CSS still has its list to lay out.
   */
  mark() {
    const rows = this.querySelectorAll('ul, ol, li');
    for (const row of rows) row.setAttribute('role', 'presentation');

    const options = this.options;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      option.setAttribute('role', 'option');
      if (!option.id) option.id = this.id + '-option-' + i;
    }
    // The list that was on screen a moment ago is not the list now, so a cursor pointing
    // into the old one points at a row that has moved or gone.
    this.active = null;
    this.applyCursor();
  }

  /** Push `open` onto the popup and its control. */
  apply() {
    const control = this.control;
    if (!control) return;
    const { expanded, hidden } = suggestState(this.open, null);
    control.setAttribute('aria-expanded', expanded);
    this.hidden = hidden;
    if (this.open) this.place();
    this.applyCursor();
  }

  /** Write the cursor - `aria-activedescendant` on the control, a marker on the option. */
  applyCursor() {
    const control = this.control;
    if (!control) return;

    for (const option of this.options) {
      if (option === this.active) option.setAttribute('data-active', '');
      else option.removeAttribute('data-active');
    }

    const { activedescendant } = suggestState(this.open, this.active ? this.active.id : null);
    if (activedescendant) control.setAttribute('aria-activedescendant', activedescendant);
    else control.removeAttribute('aria-activedescendant');
  }

  /**
   * Move the cursor to an index, and scroll it into view.
   *
   * `nearest` rather than `center`: the cursor usually moves one row at a time, and a
   * popup that re-centres on every arrow key slides the whole list under the reader when
   * only one line needed to come into view.
   *
   * @param {number|null} index
   */
  moveTo(index) {
    const options = this.options;
    this.active = index === null ? null : options[index];
    if (this.active) this.active.scrollIntoView({ block: 'nearest' });
    this.applyCursor();
  }

  /**
   * Put the popup where there is room for it, as two attributes for the CSS to key off.
   *
   * The element does not write coordinates: a light-DOM popup lives in the page's own
   * stacking and layout, and an element setting `top` and `left` on it is an element
   * fighting whatever the page already decided. `data-side` and `data-align` say which
   * corner won, and the stylesheet spends them.
   */
  place() {
    const control = this.control;
    if (!control) return;
    const placement = placeFlyout(
      control.getBoundingClientRect(),
      { width: this.offsetWidth, height: this.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      getComputedStyle(this).direction === 'rtl'
    );
    this.dataset.side = placement.side;
    this.dataset.align = placement.align;
  }

  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    this.apply();
    this.dispatchEvent(new CustomEvent('suggest-toggle', {
      bubbles: true,
      detail: { open: this.open }
    }));
  }

  onKeyDown(e) {
    const action = suggestAction(e.key, e.altKey, this.open, !!this.active, this.tabCompletes);
    if (!action) return;

    const options = this.options;

    if (action === 'close' || action === 'leave') {
      // Escape on a closed popup belongs to whatever owns the field - clearing it is the
      // usual answer - so it is not swallowed here.
      if (!this.open) return;
      // Tab keeps its default: it was already leaving, and a Tab that only shut the popup
      // would need pressing twice to do the one thing it says.
      if (action === 'close') e.preventDefault();
      this.open = false;
      return;
    }

    if (action === 'activate') {
      // Enter with no cursor is the form's: a search field whose popup eats Enter is a
      // field that cannot be submitted.
      if (!this.active) return;
      e.preventDefault();
      this.active.click();
      this.open = false;
      return;
    }

    if (!options.length) return;
    e.preventDefault();

    if (action === 'first' || action === 'last') {
      this.moveTo(action === 'first' ? 0 : options.length - 1);
      return;
    }

    if (action === 'move') {
      this.moveTo(nextIndex(options.indexOf(this.active), e.key, options.length));
      return;
    }

    this.open = true;
    if (action === 'open-first') this.moveTo(0);
    else if (action === 'open-last') this.moveTo(options.length - 1);
  }

  onFocusOut(e) {
    // Focus moving inside the popup is not focus leaving - though `onMouseDown` means it
    // rarely happens - and a popup that closed on it would close under the click it was
    // being given.
    if (e.relatedTarget && this.contains(e.relatedTarget)) return;
    this.open = false;
  }

  onPointerMove(e) {
    const option = e.target.closest ? e.target.closest('[role="option"]') : null;
    // Two cursors that disagree is the bug: the pointer sits on one row while
    // `aria-activedescendant` names another, and Enter goes somewhere the reader is not
    // looking. The pointer takes the cursor with it.
    if (!option || option === this.active) return;
    this.active = option;
    this.applyCursor();
  }

  onMouseDown(e) {
    // Keeps the caret in the field. Without this the press moves focus out of the control,
    // `focusout` closes the popup, and the click lands on nothing.
    //
    // `mousedown` and not `pointerdown`, which reads as the modern spelling and breaks
    // touch: cancelling `pointerdown` suppresses the compatibility mouse events, and on
    // iOS the tap's `click` is the last of that same synthesised run - so the press keeps
    // the caret and takes the tap with it. The compatibility `mousedown` arrives before
    // the focus change and before `click`, so cancelling that one costs nothing.
    e.preventDefault();
  }

  onClick(e) {
    const option = e.target.closest ? e.target.closest('[role="option"]') : null;
    if (!option) return;
    // The link navigates on its own - and a modified click still opens a tab, which is why
    // Enter goes through `click()` rather than through `location`.
    this.open = false;
  }
}

define('suggest-elemental', SuggestElemental);
