/**
 * What this element writes, which is the whole of what it does: the count and the index the knob
 * is drawn from, and the `role` it adds only where the author gave it a name nothing would read.
 *
 * `index.test.js` pins `checkedIndex`. This file is the part that matters to the page - the
 * attribute the knob's existence hangs off, and the three ways a selection moves. Two of them
 * announce nothing, and a knob parked under a segment nobody is on is the single failure worse
 * than no knob.
 *
 * Deliberately not covered: the knob itself and the track, which are CSS and belong to the docs
 * page; and the radio group's keyboard, selection and submission, which are the platform's -
 * there is nothing here that could get them wrong.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <form>
    <segmented-elemental aria-label="View">
      <label><input type="radio" name="view" value="grid" checked> Grid</label>
      <label><input type="radio" name="view" value="list"> List</label>
      <label><input type="radio" name="view" value="map"> Map</label>
    </segmented-elemental>
  </form>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('segmented-elemental');
}

const read = (group, name) => group.style.getPropertyValue(`--segmented-elemental-${name}`);
const inputs = (group) => Array.from(group.querySelectorAll('input[type="radio"]'));

/** The element reads the radios back on the next task after a reset. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

test('the element upgrades over the radios the author wrote and says which one is checked', () => {
  const group = mount();
  expect(group.constructor.name).toBe('SegmentedElemental');
  expect(read(group, 'index')).toBe('0');
  expect(group.getAttribute('data-index')).toBe('0');
});

test('the count is written too, because CSS cannot count an unknown number of segments', () => {
  const group = mount();
  expect(read(group, 'count')).toBe('3');
});

test('nothing is moved, wrapped or given a role - the segments stay native radios', () => {
  // The radio group pattern is already the platform's here: arrows, wrap, one tab stop,
  // submission, reset. Rewriting it could only be a worse copy.
  const group = mount();
  expect(inputs(group).every((input) => input.type === 'radio')).toBe(true);
  expect(group.querySelector('[aria-checked]')).toBe(null);
  expect(group.querySelector('[role]')).toBe(null);
});

test('a named element is given a group role, since aria-label on no role is silently nothing', () => {
  const group = mount();
  expect(group.getAttribute('role')).toBe('group');
});

test('an unnamed element is given no role, because the shared name is what makes it a group', () => {
  const group = mount(MARKUP.replace(' aria-label="View"', ''));
  expect(group.hasAttribute('role')).toBe(false);
});

test('a role the author wrote is left alone', () => {
  const group = mount(MARKUP.replace('aria-label="View"', 'aria-label="View" role="radiogroup"'));
  expect(group.getAttribute('role')).toBe('radiogroup');
});

test('a group with nothing checked draws no knob rather than parking one on the first segment', () => {
  // An unset custom property inside `calc()` leaves the knob at zero, which is a knob claiming a
  // choice nobody made. `data-index` is what its existence hangs off.
  const group = mount(MARKUP.replace(' checked', ''));
  expect(group.hasAttribute('data-index')).toBe(false);
  expect(read(group, 'index')).toBe('');
  expect(read(group, 'count')).toBe('3');
});

test('choosing a segment moves the index, because change bubbles to the element', () => {
  const group = mount();
  const [, list] = inputs(group);
  list.click();
  expect(group.getAttribute('data-index')).toBe('1');
  expect(read(group, 'index')).toBe('1');
});

test('a radio group inside a segment is not mistaken for part of this one', () => {
  const group = mount(`
    <segmented-elemental aria-label="View">
      <label><input type="radio" name="view" value="grid"> Grid</label>
      <label><input type="radio" name="view" value="list" checked> List
        <span><label><input type="radio" name="sort" value="asc" checked> Asc</label></span>
      </label>
    </segmented-elemental>`);
  expect(read(group, 'count')).toBe('2');
  expect(group.getAttribute('data-index')).toBe('1');
});

test('a reset puts the knob back where the markup had it, without a change to announce it', async () => {
  const group = mount();
  inputs(group)[2].click();
  expect(group.getAttribute('data-index')).toBe('2');

  document.querySelector('form').reset();
  await nextTask();
  expect(group.getAttribute('data-index')).toBe('0');
});

test('a reset back to nothing checked takes the knob away again', async () => {
  const group = mount(MARKUP.replace(' checked', ''));
  inputs(group)[1].click();
  expect(group.getAttribute('data-index')).toBe('1');

  document.querySelector('form').reset();
  await nextTask();
  expect(group.hasAttribute('data-index')).toBe(false);
  expect(read(group, 'index')).toBe('');
});

test('a back-navigation restores the radios with no event at all, and pageshow is what catches it', () => {
  const group = mount();
  inputs(group)[2].checked = true;
  window.dispatchEvent(new Event('pageshow'));
  expect(group.getAttribute('data-index')).toBe('2');
});

test('a segment added later is caught by apply(), which is the call that reads the count', () => {
  const group = mount();
  group.insertAdjacentHTML('beforeend', '<label><input type="radio" name="view" value="table"> Table</label>');
  group.apply();
  expect(read(group, 'count')).toBe('4');
});

test('an element with no segments in it yet is left alone, and wires up when it is next connected', () => {
  const group = mount('<segmented-elemental aria-label="View"></segmented-elemental>');
  expect(group.hasAttribute('data-index')).toBe(false);
  expect(read(group, 'count')).toBe('');
  group.innerHTML = '<label><input type="radio" name="v" checked> One</label>';
  group.remove();
  document.body.append(group);
  expect(group.getAttribute('data-index')).toBe('0');
});

test('an element that has gone stops listening to the form and to the page', async () => {
  const group = mount();
  group.remove();
  inputs(group)[2].checked = true;
  window.dispatchEvent(new Event('pageshow'));
  inputs(group)[2].dispatchEvent(new Event('change', { bubbles: true }));
  expect(group.getAttribute('data-index')).toBe('0');
});
