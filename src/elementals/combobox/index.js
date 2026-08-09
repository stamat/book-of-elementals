import { matchesSearch } from 'book-of-spells/src/helpers.mjs';
import { ElementBase, define, nextIndex } from '../../core.js';

/**
 * Whether the popup opens upwards: only when it does not fit below and there is more
 * room above.
 *
 * Below wins ties and wins when neither side fits, because the list scrolls - "nowhere
 * it fits" is a choice between two cramped corners rather than a failure, and the corner
 * the reader expects is the one under the field.
 *
 * @param {DOMRect|object} field - Rect of the field, in viewport coordinates.
 * @param {number} panelHeight
 * @param {number} viewportHeight
 */
export function flipsUp(field, panelHeight, viewportHeight) {
  const below = viewportHeight - field.bottom;
  if (panelHeight <= below) return false;
  return field.top > below;
}

/**
 * Which chip takes focus after the one at `index` is removed, or `-1` for the input.
 *
 * `count` is how many there were before the removal, so every index below the last one
 * hands focus to whatever slid into its place, and removing the last one has nothing to
 * slide - focus goes back to the input rather than to the document body, which is where
 * a keyboard reader loses the control entirely.
 */
export function focusAfterRemoval(count, index) {
  return index < count - 1 ? index : -1;
}

/** Monotonic counter, so the listbox and its options have `id`s to be pointed at. */
let comboboxCount = 0;

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/**
 * `<combobox-elemental>` custom element.
 *
 * A `<select>` given a text field to search it with, per the
 * [APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) - the
 * searchable, tag-holding select every application ends up needing and the platform
 * still has no answer for.
 *
 * The gap is narrow and worth naming, because most of what these libraries do is now
 * native. `appearance: base-select` styles the button, the picker and every `<option>`
 * with ordinary CSS, which is the half people used to reach for select2 to get. What it
 * does not do is **filter**: there is no typing your way down a list of four hundred
 * cities, in any browser, with or without the new styling. That is what this element is,
 * and it is why it is not simply a stylesheet.
 *
 * The `<select>` stays, and stays the control. It holds the value, submits under its own
 * `name`, resets, restores, honours `required` and `disabled`, and goes down with a
 * `<fieldset disabled>` - none of which is written here, because a second element
 * mirroring the state is a second element that can disagree with it. The field, the
 * listbox and the chips are a view of it; every pick sets `option.selected` and lets the
 * `<select>` fire the `change` that was going to be listened for anyway.
 *
 * `multiple` on the `<select>` is what makes it multi-select. The chips, the
 * remove buttons and `Backspace` on an empty field come with it - and the caret goes,
 * since a caret is the mark of a control holding one value out of a list and a field full
 * of tags has already said what this one holds. It is the one part of
 * this element with no APG example behind it - the pattern's six are all single-select.
 * What is written here follows the pattern where it speaks (`aria-multiselectable`,
 * `aria-selected` on every option rather than only the chosen one, a listbox that stays
 * open across picks) and is plain buttons where it does not.
 *
 * Light DOM, no shadow root. This one *does* build markup - a field, a listbox and a
 * chip per selection - which the elements wrapping native widgets do not have to. That
 * markup is the public API and is documented as such.
 *
 * Degrades honestly: with no script the `<select>` is a `<select>`, which is the whole
 * control minus the searching. Nothing is hidden until there is something to hide it
 * behind.
 *
 * ponytail: the option list is built once, at upgrade, and filtered by hiding. Replace
 * the `<option>`s at runtime and call `apply()`; wire a `MutationObserver` if that stops
 * being rare.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * @tag combobox-elemental
 * @attr {boolean} [open=false] - Whether the popup is showing. Reflected, so `[open]` is a styling hook.
 * @attr {string} placeholder - The field's placeholder. Single select falls back to the label of the option whose value is empty.
 * @attr {string} [empty-text=No matches] - What the popup says when the query matches nothing.
 * @attr {string} [remove-text=Remove] - The verb in a chip's remove button, in front of the option's label.
 *
 * @cssprop {<length>} [--combobox-elemental-radius=0.375rem] - Corners of the field and the popup.
 * @cssprop {<length>} [--combobox-elemental-inset=0.5rem] - The one padding unit: inside the field, before the caret, and down the side of every option - and nowhere else, so the field's text and the popup's line up.
 * @cssprop {<color>} [--combobox-elemental-surface=Canvas] - What the field and the popup are painted on. The page's own background, so re-point it on a card.
 * @cssprop {<color>} [--combobox-elemental-border=color-mix(in srgb, currentcolor 30%, transparent)] - The rim around the field and the popup.
 * @cssprop {<color>} [--combobox-elemental-active=color-mix(in srgb, currentcolor 12%, transparent)] - The option the cursor is on - where Enter would land, and what the pointer moves.
 * @cssprop {<color>} [--combobox-elemental-selected=color-mix(in srgb, currentcolor 5%, transparent)] - The options already chosen, which is a different question from where the cursor is.
 * @cssprop {<color>} [--combobox-elemental-chip=color-mix(in srgb, currentcolor 12%, transparent)] - Chip fill.
 * @cssprop {<color>} [--combobox-elemental-invalid=color-mix(in srgb, currentcolor 35%, #e5484d)] - The field's rim and the message under it once the browser has refused to submit.
 * @cssprop {<length>} [--combobox-elemental-max-height=15rem] - How tall the popup gets before it scrolls.
 *
 * @slot - One `<select>`, with the `<option>`s and `<optgroup>`s you would have written anyway.
 */
export class ComboboxElemental extends ElementBase {
  static get observedAttributes() {
    return ['open', 'placeholder', 'empty-text', 'remove-text'];
  }

  /** The control. Direct child, so a `<select>` inside a popover of your own is not
   * mistaken for it. */
  get select() {
    return this.querySelector(':scope > select');
  }

  /** Whether the popup is showing. Reflected, so `[open]` is a styling hook too. */
  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', !!value);
  }

  /** Whether this holds more than one value, which is the `<select>`'s own `multiple`. */
  get multiple() {
    const select = this.select;
    return !!select && select.multiple;
  }

  /** Disabled by its own attribute or by a `<fieldset disabled>` above it, which
   * `:disabled` answers for in one selector. */
  get disabled() {
    const select = this.select;
    return !!select && select.matches(':disabled');
  }

  /**
   * What the empty field says. A single select usually has the answer in its own markup
   * already - the `<option value="">Choose a fruit</option>` at the top is a placeholder
   * that has been written down as an option since forms had options.
   */
  get placeholder() {
    if (this.hasAttribute('placeholder')) return this.getAttribute('placeholder');
    const select = this.select;
    if (!select || select.multiple) return '';
    const blank = Array.from(select.options).find((option) => option.value === '');
    return blank ? blank.text : '';
  }

  set placeholder(value) {
    this.setAttribute('placeholder', value);
  }

  get emptyText() {
    return this.getAttribute('empty-text') || 'No matches';
  }

  get removeText() {
    return this.getAttribute('remove-text') || 'Remove';
  }

  /** The `<select>`'s value, so a single select reads as one string and a multiple one
   * as the first of its selections - exactly as the native property does. */
  get value() {
    const select = this.select;
    return select ? select.value : '';
  }

  set value(value) {
    const select = this.select;
    if (!select) return;
    select.value = value;
    this.sync();
  }

  /** Every selected value, in document order. The one a multiple select has no property
   * for. */
  get values() {
    const select = this.select;
    return select ? Array.from(select.selectedOptions).map((option) => option.value) : [];
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded deferred
    // or at the end of the body, so by upgrade time the `<select>` and its options are
    // there.
    if (this.initialized) return;
    const select = this.select;
    if (!select) return;
    this.initialized = true;

    this.query = '';
    this.onInput = this.onInput.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onSelectChange = this.onSelectChange.bind(this);
    this.onPointerOver = this.onPointerOver.bind(this);
    this.onInvalid = this.onInvalid.bind(this);
    this.onReset = this.onReset.bind(this);
    this.place = this.place.bind(this);
    this.sync = this.sync.bind(this);

    this.build();

    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('pointerdown', this.onPointerDown);
    this.addEventListener('pointerover', this.onPointerOver);
    this.addEventListener('click', this.onClick);
    this.addEventListener('focusout', this.onFocusOut);
    this.input.addEventListener('input', this.onInput);
    // The browser has found the control invalid. Its own bubble would be aimed at an
    // element nobody can see, so this element takes the message instead.
    select.addEventListener('invalid', this.onInvalid);
    // Anything that moves the value without going through this element - a script
    // setting `.value`, a browser extension, another script's `change` - is heard here
    // and redrawn, so the chips and the field cannot fall behind the control they
    // describe.
    select.addEventListener('change', this.onSelectChange);
    document.addEventListener('click', this.onDocumentClick);
    window.addEventListener('resize', this.place);
    // A reset puts the options back without firing anything at them, and a
    // back-navigation restores them with no event at all - `pageshow` is the one that
    // arrives afterwards. A field showing last week's answer is the failure worse than
    // a field showing nothing.
    this.form = select.form;
    if (this.form) this.form.addEventListener('reset', this.onReset);
    window.addEventListener('pageshow', this.sync);

    this.apply();
    // The state the markup arrived in, now that there is somewhere to put it.
    this.applyOpen();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('pointerdown', this.onPointerDown);
    this.removeEventListener('pointerover', this.onPointerOver);
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('focusout', this.onFocusOut);
    this.input.removeEventListener('input', this.onInput);
    document.removeEventListener('click', this.onDocumentClick);
    window.removeEventListener('resize', this.place);
    window.removeEventListener('pageshow', this.sync);
    if (this.form) this.form.removeEventListener('reset', this.onReset);
    const select = this.select;
    if (select) {
      select.removeEventListener('change', this.onSelectChange);
      select.removeEventListener('invalid', this.onInvalid);
    }
    this.form = null;
    this.teardown();
    this.initialized = false;
  }

  // ---- structure ----

  /**
   * Build the view: a field holding the chips, the text input and the popup indicator,
   * and the listbox under it.
   *
   * Inserted **before** the `<select>` rather than after, because a `<label>` wrapping
   * this element names the first labelable thing inside it, and the `<select>` staying
   * first would leave the visible field anonymous while the hidden control wore the name.
   */
  build() {
    const select = this.select;
    const id = 'combobox-elemental-' + (++comboboxCount);

    this.field = el('div', 'combobox-elemental-field');
    this.chips = el('span', 'combobox-elemental-chips');
    this.input = el('input', 'combobox-elemental-input');
    this.list = el('ul', 'combobox-elemental-list');
    this.error = el('p', 'combobox-elemental-error');
    // No caret on a multiple: a caret is the mark of a control holding one value out of a
    // list, and the chips already say this one holds several. There is nothing it would
    // add that the field full of tags does not say more plainly.
    this.indicator = select.multiple ? null : el('button', 'combobox-elemental-indicator');

    this.input.id = id;
    this.input.type = 'text';
    this.input.autocomplete = 'off';
    this.input.spellcheck = false;
    this.input.setAttribute('role', 'combobox');
    this.input.setAttribute('aria-expanded', 'false');
    this.input.setAttribute('aria-controls', id + '-list');
    // The popup is a filtered list rather than a completion written into the field, so
    // the field never holds text the reader did not type.
    this.input.setAttribute('aria-autocomplete', 'list');

    // The indicator duplicates clicking the field, so there is nothing here a reader
    // using the combobox does not already have - `aria-expanded` on the field says
    // whether the popup is open, and Alt+Down opens it. A second announced control
    // saying the same thing is furniture in the way.
    if (this.indicator) {
      this.indicator.type = 'button';
      this.indicator.tabIndex = -1;
      this.indicator.setAttribute('aria-hidden', 'true');
    }

    this.list.id = id + '-list';
    this.list.setAttribute('role', 'listbox');
    this.list.hidden = true;
    if (select.multiple) this.list.setAttribute('aria-multiselectable', 'true');

    // Announced when it appears, and pointed at from the field for anyone arriving back
    // at it afterwards. Empty and hidden until the browser has something to say.
    this.error.id = id + '-error';
    this.error.setAttribute('role', 'alert');
    this.error.hidden = true;

    this.field.append(this.chips, this.input);
    if (this.indicator) this.field.append(this.indicator);
    this.insertBefore(this.field, select);
    this.insertBefore(this.list, select);
    this.insertBefore(this.error, select);

    // The name is the author's, wherever they put it. `select.labels` covers both ways
    // of writing one, and the explicit form has to be re-pointed or a click on the label
    // focuses a control nobody can see. Remembered, because the element puts it back.
    this.labels = Array.from(select.labels || []).filter((label) => label.htmlFor);
    for (const label of this.labels) label.htmlFor = this.input.id;
    for (const name of ['aria-label', 'aria-labelledby', 'aria-describedby']) {
      if (select.hasAttribute(name)) this.input.setAttribute(name, select.getAttribute(name));
    }
    // Kept, because the validation message is appended to it rather than in place of it -
    // the author's description of the field does not stop being true while it is invalid.
    this.describedBy = select.getAttribute('aria-describedby') || '';

    // Out of the tab order and out of the accessibility tree, but still rendered - the
    // stylesheet lays a transparent, un-clickable copy over the field rather than
    // setting `display: none`. A `display: none` control that is `required` blocks its
    // own form: the browser refuses to submit, tries to focus what it cannot, and
    // reports nothing to the reader. Rendered, the validation bubble points at the field.
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    select.classList.add('combobox-elemental-native');
  }

  /** Put the markup back the way it arrived: the view goes, the `<select>` returns to
   * being an ordinary, focusable, announced control. An element that is no longer here
   * leaves nothing behind that only it knew how to drive. */
  teardown() {
    const select = this.select;
    if (select) {
      select.removeAttribute('tabindex');
      select.removeAttribute('aria-hidden');
      select.classList.remove('combobox-elemental-native');
      for (const label of this.labels || []) label.htmlFor = select.id;
    }
    if (this.field) this.field.remove();
    if (this.list) this.list.remove();
    if (this.error) this.error.remove();
    this.pairs = [];
  }

  /**
   * Read the `<select>` again: rebuild the options and redraw everything from them.
   * Public because that is the one thing no event announces - replace the `<option>`s
   * from script and this is the call that catches up.
   */
  apply() {
    const select = this.select;
    if (!select) return;

    this.list.textContent = '';
    this.pairs = [];

    for (const node of select.children) {
      if (node.tagName === 'OPTGROUP') {
        // A presentational `<li>` so the `<ul role="group">` inside it is owned by the
        // listbox directly - an `<ul>` may only hold `<li>`, and a group announced under
        // a list item is a group nested one level deeper than it is.
        const holder = el('li', 'combobox-elemental-group');
        holder.setAttribute('role', 'presentation');
        const label = el('span', 'combobox-elemental-group-label');
        // The group carries the name in `aria-label`; the visible copy would otherwise
        // be read a second time, as a stray line of text between the options.
        label.setAttribute('aria-hidden', 'true');
        label.textContent = node.label;
        const group = el('ul');
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', node.label);
        holder.append(label, group);
        for (const option of node.children) this.addOption(option, group);
        this.list.append(holder);
        continue;
      }
      if (node.tagName === 'OPTION') this.addOption(node, this.list);
    }

    // Announced as an option that cannot be chosen, rather than left as an empty popup.
    // A listbox that opens with nothing in it says nothing at all to a screen reader,
    // and silence is the one answer that is never true.
    this.empty = el('li', 'combobox-elemental-empty');
    this.empty.setAttribute('role', 'option');
    this.empty.setAttribute('aria-disabled', 'true');
    this.empty.hidden = true;
    this.list.append(this.empty);

    this.filter();
    this.sync();
  }

  addOption(option, parent) {
    if (option.tagName !== 'OPTION') return;
    const item = el('li', 'combobox-elemental-option');
    item.id = this.list.id + '-' + this.pairs.length;
    item.setAttribute('role', 'option');
    item.textContent = option.text;
    if (option.disabled) item.setAttribute('aria-disabled', 'true');
    parent.append(item);
    this.pairs.push({ option: option, item: item });
  }

  // ---- state ----

  /**
   * Push the `<select>` onto the view: the chips, the selected states, the field's text
   * and whether any of it can be touched.
   *
   * The field's text is the selection and nothing else, so a query typed and abandoned -
   * by tabbing away, by Escape, by picking something - never survives as a label for a
   * value it does not name.
   */
  sync() {
    const select = this.select;
    if (!select || !this.initialized) return;
    const multiple = select.multiple;
    const disabled = this.disabled;

    for (const pair of this.pairs) {
      pair.item.setAttribute('aria-selected', pair.option.selected ? 'true' : 'false');
    }

    this.chips.textContent = '';
    if (multiple) {
      for (const option of select.selectedOptions) {
        const chip = el('span', 'combobox-elemental-chip');
        const label = el('span', 'combobox-elemental-chip-label');
        label.textContent = option.text;
        const remove = el('button', 'combobox-elemental-chip-remove');
        remove.type = 'button';
        remove.disabled = disabled;
        remove.setAttribute('aria-label', this.removeText + ' ' + option.text);
        chip.append(label, remove);
        this.chips.append(chip);
      }
    } else {
      // The blank option is the placeholder written as markup, so selecting it is the
      // field going back to empty rather than the field holding the word "Choose".
      const option = select.selectedOptions[0];
      this.input.value = option && option.value !== '' ? option.text : '';
    }

    this.input.placeholder = this.placeholder;
    this.input.disabled = disabled;
    if (this.indicator) this.indicator.disabled = disabled;
    if (select.required) this.input.setAttribute('aria-required', 'true');
    else this.input.removeAttribute('aria-required');
    if (disabled && this.open) this.open = false;
    // A message about a value that has since been given is a message about nothing.
    if (!this.error.hidden && select.checkValidity()) this.clearError();
  }

  /**
   * The browser has refused to submit. Its own bubble is dropped and the message kept,
   * because the bubble would be pointing at the `<select>` - which is transparent,
   * `aria-hidden`, and about to take focus away from the field the reader has to fill in.
   *
   * The text is the browser's own `validationMessage`, so it arrives already translated
   * into the reader's language and says what the platform would have said.
   */
  onInvalid(e) {
    e.preventDefault();
    this.error.textContent = this.select.validationMessage;
    this.error.hidden = false;
    this.input.setAttribute('aria-invalid', 'true');
    this.input.setAttribute('aria-describedby', [this.describedBy, this.error.id].filter(Boolean).join(' '));
    // The browser focuses the first invalid control in the form and no other. Every
    // invalid one gets this event, so without the check the last of them would win and
    // the reader would land past the field that stopped the submit.
    const form = this.select.form;
    const first = form && form.querySelector(':is(input, select, textarea, fieldset):invalid');
    if (!first || first === this.select) this.input.focus();
  }

  clearError() {
    this.error.hidden = true;
    this.error.textContent = '';
    this.input.removeAttribute('aria-invalid');
    if (this.describedBy) this.input.setAttribute('aria-describedby', this.describedBy);
    else this.input.removeAttribute('aria-describedby');
  }

  /** Hide the options the query does not answer, and the groups that are left holding
   * none of them. */
  filter() {
    let shown = 0;
    for (const pair of this.pairs) {
      const hit = matchesSearch(pair.option.text, this.query);
      pair.item.hidden = !hit;
      if (hit) shown++;
    }
    for (const group of this.list.querySelectorAll('.combobox-elemental-group')) {
      group.hidden = !group.querySelector('[role="option"]:not([hidden])');
    }
    this.empty.textContent = this.emptyText;
    this.empty.hidden = shown > 0;
  }

  /** The options an arrow key can reach: on screen, and not disabled. */
  navigable() {
    return this.pairs.filter((pair) => !pair.item.hidden && !pair.option.disabled);
  }

  /** Where the popup's own cursor is - `aria-activedescendant`, read back as an index
   * into the list the arrows walk. */
  activeIndex() {
    const id = this.input.getAttribute('aria-activedescendant');
    return id ? this.navigable().findIndex((pair) => pair.item.id === id) : -1;
  }

  /**
   * Move the popup's cursor. Focus itself never moves - it stays in the field, which is
   * what `aria-activedescendant` is for and what lets typing carry on narrowing the list
   * while an option is "focused".
   */
  setActive(index) {
    for (const pair of this.pairs) pair.item.removeAttribute('data-active');
    const pair = this.navigable()[index];
    if (!pair) {
      this.input.removeAttribute('aria-activedescendant');
      return;
    }
    pair.item.setAttribute('data-active', '');
    this.input.setAttribute('aria-activedescendant', pair.item.id);
    // `nearest`, so a list that is already showing the option does not scroll at all.
    pair.item.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Point the popup at whichever side of the field it fits on, and write that on it for
   * the stylesheet to act on - the measuring is the element's, the positioning is CSS's.
   */
  place() {
    if (!this.open) return;
    const up = flipsUp(this.field.getBoundingClientRect(), this.list.offsetHeight, window.innerHeight);
    this.list.setAttribute('data-side', up ? 'block-start' : 'block-end');
    // Flipping only chooses which end of the field the popup hangs off; on a field near
    // the bottom of a tall page both ends are still off screen, and a popup nobody can
    // see is a popup that does not exist. `nearest` is what makes this cost nothing in
    // the ordinary case - a popup already in view is not scrolled at all.
    this.list.scrollIntoView({ block: 'nearest' });
  }

  /**
   * `open` is the single source of truth for the popup, so a click, a key and a script
   * setting the attribute all land here.
   */
  attributeChangedCallback(name, previous, current) {
    // Attributes present in the markup are handed over before `connectedCallback` runs,
    // when there is no field to write them onto yet. That first state is not lost -
    // `connectedCallback` reads all four back once the view exists.
    if (!this.initialized || previous === current) return;
    if (name === 'open') this.applyOpen();
    else {
      this.filter();
      this.sync();
    }
  }

  /** Show or hide the popup, and put the cursor somewhere sensible inside it. */
  applyOpen() {
    const open = this.open;
    this.input.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.list.hidden = !open;
    if (!open) {
      this.setActive(-1);
      this.list.removeAttribute('data-side');
      return;
    }
    // Measured after unhiding: a hidden box has no height, and a popup with no height
    // fits anywhere.
    this.place();
    // Opening lands on what is already chosen, so Enter straight after Down is not a
    // different answer than the one the field is showing.
    const selected = this.navigable().findIndex((pair) => pair.option.selected);
    this.setActive(selected < 0 ? 0 : selected);
  }

  // ---- editing ----

  /** Choose, or in a multiple select un-choose, one option. */
  pick(pair) {
    if (!pair || pair.option.disabled || this.disabled) return;
    if (this.multiple) {
      pair.option.selected = !pair.option.selected;
      // The query has done its job the moment it found something; leaving it in the
      // field would filter the list the reader is still picking from.
      this.query = '';
      this.input.value = '';
      this.filter();
      this.sync();
      this.emit();
      // Deliberately still open: the second of three tags is not a reason to make the
      // reader open the list again.
      this.place();
      this.setActive(this.navigable().indexOf(pair));
    } else {
      pair.option.selected = true;
      this.query = '';
      this.open = false;
      this.filter();
      this.sync();
      this.emit();
    }
    this.input.focus();
  }

  /** Drop the `index`th selection, and put focus somewhere that still exists. */
  removeAt(index) {
    if (this.disabled) return;
    const selected = Array.from(this.select.selectedOptions);
    const option = selected[index];
    if (!option || option.disabled) return;
    option.selected = false;
    this.sync();
    this.emit();
    // After the redraw, because the button this focuses did not exist before it.
    const to = focusAfterRemoval(selected.length, index);
    const buttons = this.chips.querySelectorAll('.combobox-elemental-chip-remove');
    if (to >= 0 && buttons[to]) buttons[to].focus();
    else this.input.focus();
  }

  /**
   * Tell the page, in the events it is already listening for. The `<select>` is the
   * control, so `input` and `change` fire on it and in that order, exactly as they do
   * when a reader uses a native one - which is why this element has no event of its own.
   */
  emit() {
    this.emitting = true;
    this.select.dispatchEvent(new Event('input', { bubbles: true }));
    this.select.dispatchEvent(new Event('change', { bubbles: true }));
    this.emitting = false;
  }

  // ---- input ----

  onSelectChange() {
    if (!this.emitting) this.sync();
  }

  /** A form is only put back to its defaults after the `reset` event has been
   * dispatched, so the options are read on the next task rather than in the handler. */
  onReset() {
    setTimeout(() => {
      this.query = '';
      this.open = false;
      this.filter();
      this.sync();
    });
  }

  onInput() {
    this.query = this.input.value;
    this.filter();
    if (!this.open) this.open = true;
    else this.place();
    // The narrowed list is a new list, so the cursor goes to the top of it rather than
    // staying on an option that may no longer be showing.
    this.setActive(0);
  }

  /**
   * A pointer press inside the popup would blur the field before the click landed, and a
   * combobox whose field loses focus is one whose popup has just closed. The press is
   * cancelled instead; the click that follows still arrives.
   */
  onPointerDown(e) {
    if (this.list.contains(e.target)) e.preventDefault();
  }

  /**
   * Pointing at an option moves the popup's cursor onto it, so the mouse and the arrow
   * keys drive the same one thing. Without this the pointer lights up one option while
   * `aria-activedescendant` sits on another, and two options look chosen at once - with
   * Enter belonging to the one the reader is not pointing at.
   */
  onPointerOver(e) {
    const item = e.target.closest && e.target.closest('[role="option"]');
    if (!item || !this.list.contains(item)) return;
    const index = this.navigable().findIndex((pair) => pair.item === item);
    if (index >= 0) this.setActive(index);
  }

  onClick(e) {
    if (this.disabled) return;

    const remove = e.target.closest('.combobox-elemental-chip-remove');
    if (remove) {
      const buttons = Array.from(this.chips.querySelectorAll('.combobox-elemental-chip-remove'));
      this.removeAt(buttons.indexOf(remove));
      return;
    }

    const item = e.target.closest('[role="option"]');
    if (item) {
      this.pick(this.pairs.find((pair) => pair.item === item));
      return;
    }

    if (!this.field.contains(e.target)) return;
    // The indicator is the one place a second click closes the popup again. Clicking the
    // field itself only ever opens it: a reader reaching for the text they are editing
    // is not asking for the list to go away.
    this.open = this.indicator && this.indicator.contains(e.target) ? !this.open : true;
    this.input.focus();
  }

  onKeyDown(e) {
    // The field's keyboard only. A chip's remove button is a button and keeps a button's
    // - Enter and Space activate it, and neither is the combobox's to intercept.
    if (this.disabled || e.target !== this.input) return;
    const key = e.key;

    if (key === 'Escape') {
      if (!this.open) return;
      e.preventDefault();
      this.query = '';
      this.open = false;
      this.filter();
      this.sync();
      return;
    }

    // Tab is never trapped, and leaving closes. `sync` is what takes an abandoned query
    // back out of the field.
    if (key === 'Tab') {
      if (this.open) this.open = false;
      this.query = '';
      this.filter();
      this.sync();
      return;
    }

    if (key === 'Enter') {
      // Closed, Enter is the form's - a combobox that swallows it is a form that cannot
      // be submitted from its last field.
      if (!this.open) return;
      e.preventDefault();
      this.pick(this.navigable()[this.activeIndex()]);
      return;
    }

    // The one gesture the chips have that no pattern describes: with nothing to delete
    // in the field, Backspace deletes backwards through what has been chosen.
    if (key === 'Backspace' && this.multiple && !this.input.value) {
      const count = this.select.selectedOptions.length;
      if (!count) return;
      e.preventDefault();
      this.removeAt(count - 1);
      return;
    }

    if (e.altKey && (key === 'ArrowDown' || key === 'ArrowUp')) {
      e.preventDefault();
      this.open = key === 'ArrowDown';
      return;
    }

    const items = this.navigable();
    const to = nextIndex(this.activeIndex(), key, items.length);
    if (to === null) return;
    e.preventDefault();
    // Down on a closed combobox opens it, which is the pattern's own answer and also
    // where `-1` for "no cursor yet" lands: the first option, or the last for Up.
    if (!this.open) {
      this.open = true;
      return;
    }
    this.setActive(to);
  }

  onFocusOut(e) {
    if (e.relatedTarget && this.contains(e.relatedTarget)) return;
    this.query = '';
    this.open = false;
    this.filter();
    this.sync();
  }

  onDocumentClick(e) {
    if (this.contains(e.target) || !this.open) return;
    this.query = '';
    this.open = false;
    this.filter();
    this.sync();
  }
}

define('combobox-elemental', ComboboxElemental);
