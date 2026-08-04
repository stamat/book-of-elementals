import { ElementBase, define } from '../../core.js';

/**
 * What the parent checkbox has to say about its children: all of them, none of them, or
 * some of them.
 *
 * An empty group is `none` rather than a third answer. There is nothing to be mixed
 * about, and the element does not upgrade without children anyway.
 */
export function classify(states) {
  if (states.every((on) => on)) return states.length ? 'all' : 'none';
  return states.some((on) => on) ? 'some' : 'none';
}

/**
 * Where one press of the parent takes the children:
 * mixed → all on → all off → back to the mixed combination they were last in.
 *
 * That last step is the [APG's
 * cycle](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/) and
 * the reason to have a tri-state parent at all: two ticks out of twenty are not destroyed
 * by one press, they are one more press away from coming back.
 *
 * The memory is skipped when there is nothing in it worth stopping at - absent, all on,
 * all off, or taken when the group was a different size, which happens when options have
 * been added or removed since. Restoring a stale combination would put ticks against
 * whatever now sits at those positions, and a cycle whose third step is
 * indistinguishable from its second is a step the reader presses through for nothing. So
 * the cycle is three steps while there is something to go back to and two while there is
 * not.
 *
 * @param {boolean[]} states - What the children are now.
 * @param {boolean[]|null} memory - The combination they were in when the group was last mixed.
 * @returns {boolean[]} What the children should be.
 */
export function cycle(states, memory) {
  const now = classify(states);
  if (now === 'some') return states.map(() => true);
  if (now === 'all') return states.map(() => false);
  const restorable = memory && memory.length === states.length && classify(memory) === 'some';
  return restorable ? memory.slice() : states.map(() => true);
}

/**
 * `<checkbox-group-elemental>` custom element.
 *
 * A "select all" checkbox over the checkboxes it stands for, per the
 * [APG Checkbox (Mixed-State) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/):
 * ticked when all of them are, empty when none are, and showing the dash when it is some
 * of them.
 *
 * The dash is the whole reason this exists. It is `HTMLInputElement.indeterminate`, a
 * property with **no HTML attribute behind it** - no server, template or static page can
 * render a checkbox in that state, so the one line of markup that would have said it has
 * to be script, in every project, every time. It is also purely visual: what a checkbox
 * submits is decided by `checked` alone, indeterminate or not, which is why the parent is
 * a control the form should not be given a `name` for.
 *
 * Every checkbox here is a real `<input type="checkbox">` and stays one, so the label
 * association, the focus ring, `Space`, `disabled`, submission under each child's own
 * `name`, reset and restore are the browser's. A native checkbox with `indeterminate` set
 * is already announced as mixed, so there is no `role="checkbox"` and no `aria-checked`
 * written anywhere - which is where this parts company with the APG's own example, and
 * deliberately: that one builds the parent as a `<div role="checkbox">` to demonstrate the
 * role, and pays for it with everything in this paragraph.
 *
 * What the element writes is two properties on the parent and `data-state` on itself.
 * Nothing is moved, wrapped, or given an attribute it did not have.
 *
 * **One level, not a tree.** The pattern is a parent over a flat set of checkboxes, and
 * that is all this is: a group nested inside another is a separate group, keeps its own
 * checkboxes, and neither reads nor is read by the one around it. A tree of them is a
 * different control - the cycle alone stops being answerable, since restoring a branch's
 * last mixed combination and its parent's are two different restores of the same boxes.
 * Write the checkboxes flat, one group per parent.
 *
 * ponytail: no `aria-controls` on the parent listing the children. The APG's example has
 * it; support for it is thin, and it would mean generating an `id` for every checkbox in
 * the author's markup. Add it if a screen reader turns out to want it.
 *
 * Degrades by not being offered: with no script the parent would be a checkbox that ticks
 * itself and commands nothing. The stylesheet hides it until the element upgrades where it
 * is a direct child, and `hidden` in the markup does the same at any depth - a select-all
 * in a table header, which is where most of them are, has no selector that can reach it,
 * because CSS cannot say "the first checkbox anywhere below me". Either way what is left is
 * the plain list of checkboxes it was standing in front of, all of them working.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * @tag checkbox-group-elemental
 *
 * @cssprop {<length>} [--checkbox-elemental-size=1.15em] - Box size, both axes. Shared with any `.checkbox-elemental` on the page.
 * @cssprop {<length>} [--checkbox-elemental-radius=0.25em] - Box corners.
 * @cssprop {<length>} [--checkbox-elemental-border-width=1.5px] - Box border.
 * @cssprop {<color>} [--checkbox-elemental-border-color=color-mix(in srgb, currentcolor 45%, transparent)] - Box border, unticked.
 * @cssprop {<color>} [--checkbox-elemental-fill=currentcolor] - Box fill once it is ticked or mixed.
 * @cssprop {<color>} [--checkbox-elemental-mark=Canvas] - The tick and the dash. The page's own background, so re-point it on a card.
 * @cssprop {<length>} [--checkbox-elemental-gap=0.6em] - Between a box and its label text.
 * @cssprop {<length>} [--checkbox-group-elemental-indent=1.75em] - How far the children sit in from the parent. This one is the group's alone.
 *
 * @slot - The parent `<input type="checkbox">` in its `<label>`, and the children's checkboxes under it.
 */
export class CheckboxGroupElemental extends ElementBase {
  /**
   * The "select all". The first checkbox in the element, in document order, which is where
   * it has to be for the reader too - a heading for a list comes before the list.
   */
  get parent() {
    return this.boxes()[0] || null;
  }

  /**
   * The checkboxes the parent stands for: every one below it, minus a nested group's own.
   *
   * Not `children`, which is `Element`'s own and means every child node that is an
   * element. Shadowing it would leave this element lying to any code that walks the DOM
   * generically - including the browser's own devtools.
   */
  get checkboxes() {
    return this.boxes().slice(1);
  }

  /** Every checkbox this element owns. A nested group keeps its own, parent included. */
  boxes() {
    return Array.from(this.querySelectorAll('input[type="checkbox"]'))
      .filter((box) => box.closest('checkbox-group-elemental') === this);
  }

  /**
   * The checkboxes the parent can actually move, which is the set it speaks for.
   *
   * A disabled one is not in it, and that decides both halves at once. It cannot be
   * counted, because a group holding one disabled and unticked box could never reach "all"
   * - every press would compute "some", set everything it is allowed to, change nothing,
   * and the cycle would be stuck on the step it was already on. And it cannot be moved,
   * because a checkbox the reader could not have clicked is not one the parent gets to
   * click for them. So the parent's tick means "everything selectable is selected", which
   * is the only reading under which pressing it does what it says.
   */
  movable() {
    return this.checkboxes.filter((box) => !box.disabled);
  }

  /** `all`, `some` or `none` - the same word the element writes onto itself. */
  get state() {
    return classify(this.movable().map((box) => box.checked));
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded deferred or
    // at the end of the body, so by upgrade time the checkboxes are there. Two of them at
    // the very least: a parent with nothing under it is a checkbox, and this element has
    // nothing to do for it.
    if (this.initialized) return;
    if (this.checkboxes.length === 0) return;
    this.initialized = true;

    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onReset = this.onReset.bind(this);
    this.apply = this.apply.bind(this);

    // A parent authored `hidden` is one the page has kept back until there is something
    // driving it, and this is that moment. The stylesheet does the same job for the markup
    // in the docs, but only there: `:not(:defined) > label` can reach a direct child and
    // CSS has no way to say "the first checkbox anywhere below me", so a select-all in a
    // table header - which is where most of them are - has no rule that can find it.
    // Writing `hidden` on it is the answer that works at any depth, and it is put back if
    // this element ever leaves.
    this.parentWasHidden = this.parent.hasAttribute('hidden');
    if (this.parentWasHidden) this.parent.hidden = false;

    this.addEventListener('click', this.onClick);
    this.addEventListener('change', this.onChange);
    // A reset puts the checkboxes back without firing `change` at any of them, and fires
    // at the form above this element; a back-navigation restores them with no event at
    // all, and `pageshow` is the one that arrives afterwards. A parent left saying
    // something the children stopped saying is the one failure worse than no parent.
    this.form = this.parent && this.parent.form;
    if (this.form) this.form.addEventListener('reset', this.onReset);
    if (typeof window !== 'undefined') window.addEventListener('pageshow', this.apply);

    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('change', this.onChange);
    if (this.form) this.form.removeEventListener('reset', this.onReset);
    if (typeof window !== 'undefined') window.removeEventListener('pageshow', this.apply);
    // The parent goes back to being an ordinary checkbox: the dash is a state only this
    // element knows how to leave, and one left behind is a checkbox stuck looking mixed
    // with nothing driving it.
    const parent = this.parent;
    if (parent) {
      parent.indeterminate = false;
      if (this.parentWasHidden) parent.hidden = true;
    }
    delete this.dataset.state;
    this.form = null;
    this.initialized = false;
  }

  /**
   * Read the children and put what they say onto the parent. Public because that is the
   * one thing no event announces: add or remove a checkbox and this is the call that
   * catches up.
   *
   * The memory is taken here rather than at the click, so a combination the reader built
   * by hand - ticking two of twenty themselves - is the one that comes back. Any way of
   * arriving at mixed is the group being mixed.
   */
  apply() {
    const parent = this.parent;
    if (!parent) return;
    const state = this.state;
    if (state === 'some') this.memory = this.movable().map((box) => box.checked);
    parent.checked = state === 'all';
    parent.indeterminate = state === 'some';
    this.dataset.state = state;
  }

  /**
   * A press of the parent. `click` and not `keydown`, because `Space` on a checkbox *is* a
   * click - there is no keyboard here that the platform has not already written.
   *
   * The children are the source of truth, so the cycle is read off them and not off the
   * parent, whose `checked` the browser has already flipped and whose `indeterminate` it
   * has already cleared by the time this runs. `apply` puts both back.
   */
  onClick(e) {
    const parent = this.parent;
    if (!parent || e.target !== parent || parent.disabled) return;
    // The movable ones, so the cycle is computed over exactly the set it can write to -
    // count a box the press cannot move and the press stops being able to finish.
    const children = this.movable();
    const next = cycle(children.map((box) => box.checked), this.memory);

    this.applying = true;
    for (let i = 0; i < children.length; i++) {
      const box = children[i];
      if (box.checked === next[i]) continue;
      box.checked = next[i];
      // What a real click on that checkbox would have fired, in the order it fires it. A
      // page listening for `change` on the form is listening for exactly this, and a
      // select-all it cannot hear is a select-all that silently desynchronises everything
      // downstream of it.
      box.dispatchEvent(new Event('input', { bubbles: true }));
      box.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.applying = false;

    this.apply();
  }

  /** A child was ticked, so the parent has something new to say. */
  onChange(e) {
    if (this.applying || e.target === this.parent) return;
    this.apply();
  }

  /** A form is only put back to its defaults once the `reset` event has been dispatched,
   * so the checkboxes are read on the next task rather than in the handler. */
  onReset() {
    setTimeout(() => {
      // The combination the page loaded in is the memory again - the reader's own is gone
      // with the reset that threw it away.
      this.memory = null;
      this.apply();
    });
  }
}

define('checkbox-group-elemental', CheckboxGroupElemental);
