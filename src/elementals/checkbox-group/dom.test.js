/**
 * The wiring: the two properties written onto the parent checkbox, the `data-state` written onto
 * the element, the events a press synthesizes on the children, and the three ways a selection
 * moves without a click.
 *
 * `index.test.js` pins `classify` and `cycle`, which are the decisions. This file is what they
 * are wired to — the dash is `indeterminate`, a property with no attribute behind it, so a
 * correct `classify` that never reaches the property draws nothing at all.
 *
 * Deliberately not covered: the box, the tick and the dash themselves, which are CSS and belong
 * to the docs page.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <form>
    <checkbox-group-elemental>
      <label><input type="checkbox"> Select all</label>
      <ul>
        <li><label><input type="checkbox" checked> Read</label></li>
        <li><label><input type="checkbox"> Write</label></li>
        <li><label><input type="checkbox"> Delete</label></li>
      </ul>
    </checkbox-group-elemental>
  </form>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('checkbox-group-elemental');
}

const parentOf = (group) => group.querySelectorAll('input[type="checkbox"]')[0];
const childrenOf = (group) => Array.from(group.querySelectorAll('input[type="checkbox"]')).slice(1);
const ticked = (group) => childrenOf(group).map((box) => box.checked);

/** The element reads the checkboxes back on the next task after a reset. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

test('the element upgrades over the checkboxes the author wrote and says what they add up to', () => {
  const group = mount();
  expect(group.constructor.name).toBe('CheckboxGroupElemental');
  expect(group.dataset.state).toBe('some');
});

test('the parent shows the dash when it is some of them, which is the whole reason this exists', () => {
  // `indeterminate` is a property with no HTML attribute behind it: no server, template or
  // static page can render a checkbox in that state.
  const group = mount();
  expect(parentOf(group).indeterminate).toBe(true);
  expect(parentOf(group).checked).toBe(false);
});

test('the parent is ticked when every child is, and empty when none are', () => {
  const all = mount(MARKUP.replace(/<input type="checkbox">/g, '<input type="checkbox" checked>'));
  expect(parentOf(all).checked).toBe(true);
  expect(parentOf(all).indeterminate).toBe(false);
  expect(all.dataset.state).toBe('all');

  const none = mount(MARKUP.replace(' checked', ''));
  expect(parentOf(none).checked).toBe(false);
  expect(parentOf(none).indeterminate).toBe(false);
  expect(none.dataset.state).toBe('none');
});

test('nothing is moved, wrapped or given a role - every box stays a native checkbox', () => {
  // A native checkbox with `indeterminate` set is already announced as mixed. Writing
  // `role="checkbox"` over it would cost the label association, Space, and submission.
  const group = mount();
  expect(group.querySelector('[role]')).toBe(null);
  expect(group.querySelector('[aria-checked]')).toBe(null);
  expect(parentOf(group).parentElement.tagName).toBe('LABEL');
});

test('one press of a mixed parent ticks everything', () => {
  const group = mount();
  parentOf(group).click();
  expect(ticked(group)).toEqual([true, true, true]);
  expect(group.dataset.state).toBe('all');
});

test('a press of a full parent clears everything', () => {
  const group = mount();
  const parent = parentOf(group);
  parent.click();
  parent.click();
  expect(ticked(group)).toEqual([false, false, false]);
  expect(group.dataset.state).toBe('none');
});

test('a third press brings back the combination the reader had, which is why the cycle has three steps', () => {
  // Two ticks out of twenty are not destroyed by one press - they are one more press away.
  const group = mount();
  const parent = parentOf(group);
  parent.click();
  parent.click();
  parent.click();
  expect(ticked(group)).toEqual([true, false, false]);
  expect(group.dataset.state).toBe('some');
});

test('a group that was never mixed cycles in two steps rather than stopping at nothing', () => {
  const group = mount(MARKUP.replace(' checked', ''));
  const parent = parentOf(group);
  parent.click();
  expect(ticked(group)).toEqual([true, true, true]);
  parent.click();
  expect(ticked(group)).toEqual([false, false, false]);
  parent.click();
  expect(ticked(group)).toEqual([true, true, true]);
});

test('the memory is what the reader built by hand, not only what a press left behind', () => {
  // Any way of arriving at mixed is the group being mixed, so the memory is taken when the
  // children are read rather than when the parent is pressed.
  const group = mount(MARKUP.replace(' checked', ''));
  const [, write] = childrenOf(group);
  write.checked = true;
  write.dispatchEvent(new Event('change', { bubbles: true }));
  const parent = parentOf(group);
  parent.click();
  parent.click();
  parent.click();
  expect(ticked(group)).toEqual([false, true, false]);
});

test('a press fires on every child what a real click on it would have fired, in that order', () => {
  // A page listening for `change` on the form is listening for exactly this, and a select-all
  // it cannot hear is one that silently desynchronises everything downstream.
  const group = mount();
  const heard = [];
  for (const box of childrenOf(group)) {
    for (const type of ['input', 'change']) {
      box.addEventListener(type, (e) => heard.push(`${box.nextSibling.textContent.trim()}:${type}:${e.bubbles}`));
    }
  }
  parentOf(group).click();
  // Read was already ticked, so nothing about it changed and nothing is announced for it.
  expect(heard).toEqual(['Write:input:true', 'Write:change:true', 'Delete:input:true', 'Delete:change:true']);
});

test('a child ticked by the reader is heard, and the parent catches up', () => {
  const group = mount();
  const [read] = childrenOf(group);
  read.click();
  expect(group.dataset.state).toBe('none');
  expect(parentOf(group).indeterminate).toBe(false);
});

test('a disabled child is neither counted nor moved, so the parent means "everything selectable"', () => {
  // Count a box the press cannot move and every press computes "some", changes nothing, and the
  // cycle is stuck on the step it was already on.
  const group = mount(MARKUP.replace('<input type="checkbox"> Delete', '<input type="checkbox" disabled> Delete'));
  const parent = parentOf(group);
  parent.click();
  expect(ticked(group)).toEqual([true, true, false]);
  expect(group.dataset.state).toBe('all');
  parent.click();
  expect(ticked(group)).toEqual([false, false, false]);
});

test('a group nested in another keeps its own checkboxes, and neither reads the other', () => {
  const outer = mount(`
    <checkbox-group-elemental id="outer">
      <label><input type="checkbox"> All</label>
      <label><input type="checkbox" checked> One</label>
      <checkbox-group-elemental id="inner">
        <label><input type="checkbox"> Inner all</label>
        <label><input type="checkbox"> Inner one</label>
      </checkbox-group-elemental>
    </checkbox-group-elemental>`);
  const inner = document.getElementById('inner');
  expect(outer.dataset.state).toBe('all');
  expect(inner.dataset.state).toBe('none');
  parentOf(inner).click();
  expect(inner.dataset.state).toBe('all');
  expect(outer.dataset.state).toBe('all');
});

test('a parent the markup kept hidden is shown once there is something driving it', () => {
  // CSS cannot say "the first checkbox anywhere below me", so a select-all in a table header has
  // no rule that can find it. `hidden` in the markup is the answer that works at any depth.
  const group = mount(MARKUP.replace('<label><input type="checkbox"> Select all</label>', '<label><input type="checkbox" hidden> Select all</label>'));
  expect(parentOf(group).hidden).toBe(false);
});

test('a reset puts the parent back in step with the children', async () => {
  // A reset fires at the form and puts the checkboxes back without firing `change` at any of
  // them. A parent left saying something the children stopped saying is worse than no parent.
  const group = mount();
  const parent = parentOf(group);
  parent.click();
  expect(group.dataset.state).toBe('all');

  document.querySelector('form').reset();
  await nextTask();
  expect(ticked(group)).toEqual([true, false, false]);
  expect(group.dataset.state).toBe('some');
  expect(parent.indeterminate).toBe(true);
});

test('the combination the reader built goes with the reset that threw it away', async () => {
  // The memory is the reader's own, so a reset back to a group with no selection has nothing to
  // go back to - and a third press that restored the pre-reset ticks would be undoing the reset.
  const group = mount(MARKUP.replace(' checked', ''));
  const parent = parentOf(group);
  const [, write] = childrenOf(group);
  write.click();
  expect(group.dataset.state).toBe('some');

  document.querySelector('form').reset();
  await nextTask();
  expect(ticked(group)).toEqual([false, false, false]);

  parent.click();
  parent.click();
  parent.click();
  expect(ticked(group)).toEqual([true, true, true]);
});

test('a back-navigation restores the checkboxes with no event at all, and pageshow is what catches it', async () => {
  const group = mount();
  for (const box of childrenOf(group)) box.checked = true;
  window.dispatchEvent(new Event('pageshow'));
  expect(group.dataset.state).toBe('all');
  expect(parentOf(group).checked).toBe(true);
});

test('a checkbox added later is caught by apply(), which is the call no event announces', () => {
  const group = mount();
  group.querySelector('ul').insertAdjacentHTML('beforeend', '<li><label><input type="checkbox"> Share</label></li>');
  group.apply();
  expect(group.dataset.state).toBe('some');
  parentOf(group).click();
  expect(ticked(group)).toEqual([true, true, true, true]);
});

test('a parent with nothing under it is a checkbox, and this element has nothing to do for it', () => {
  const group = mount('<checkbox-group-elemental><label><input type="checkbox"> Only</label></checkbox-group-elemental>');
  expect(group.dataset.state).toBeUndefined();
});

test('the parent goes back to being an ordinary checkbox when the element goes', () => {
  // The dash is a state only this element knows how to leave; one left behind is a checkbox
  // stuck looking mixed with nothing driving it.
  const group = mount();
  const parent = parentOf(group);
  group.remove();
  expect(parent.indeterminate).toBe(false);
  expect(group.dataset.state).toBeUndefined();
});

test('a parent the markup hid is hidden again when the element goes', () => {
  const group = mount(MARKUP.replace('<label><input type="checkbox"> Select all</label>', '<label><input type="checkbox" hidden> Select all</label>'));
  const parent = parentOf(group);
  group.remove();
  expect(parent.hidden).toBe(true);
});

test('an element that has gone stops listening to the form and to the page', async () => {
  const group = mount();
  const parent = parentOf(group);
  group.remove();
  parent.checked = true;
  window.dispatchEvent(new Event('pageshow'));
  expect(group.dataset.state).toBeUndefined();
});
