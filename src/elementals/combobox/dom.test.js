/**
 * The doors the popup opens through, and the caret that is one of them.
 *
 * `index.test.js` pins the decision - `opensOnQuery` - and this file is the part that
 * matters to the page: that a threshold closes the pointer's door without closing the
 * keyboard's or the caret's, and that a `multiple` has a caret to be a door at all. A
 * list that cannot be reached except by typing its own contents is the failure this
 * guards against, and no pure function can see it.
 *
 * The scrolling half is here for the same reason - jsdom scrolls nothing, but it can count
 * who asked to.
 *
 * Deliberately not covered: the leading checkbox, which is `theme.scss` and belongs to the
 * docs page and `script/a11y`; where the popup goes, which needs a layout jsdom has none of
 * - `flipsUp` takes the rects for that reason; and the rest of the wiring - the roles,
 * `aria-activedescendant`, the chips - which is checked in a browser against the APG
 * pattern.
 *
 * @jest-environment jsdom
 */

import './index.js';

// jsdom implements no scrolling at all, and every open walks through `scrollIntoView`
// twice: once to keep the popup on screen, once for the row the cursor lands on. A counter
// rather than an empty stub, since who calls it is one of the things under test. Reached
// through `window`, which is this file's document rather than a global the linter has to be
// told about.
const scrolled = [];

window.Element.prototype.scrollIntoView = function scrollIntoView () {
  scrolled.push(this);
};

function mount (attributes = '') {
  document.body.innerHTML = `
    <label for="langs">Languages</label>
    <combobox-elemental ${attributes}>
      <select id="langs" name="langs" multiple>
        <option value="sr">Serbian</option>
        <option value="en">English</option>
        <option value="de">German</option>
      </select>
    </combobox-elemental>`;
  return document.querySelector('combobox-elemental');
}

const field = (box) => box.querySelector('.combobox-elemental-field');
const caret = (box) => box.querySelector('.combobox-elemental-indicator');
const input = (box) => box.querySelector('.combobox-elemental-input');

const showing = (box) => Array.from(box.querySelectorAll('.combobox-elemental-option'))
  .filter((option) => !option.hidden)
  .map((option) => option.textContent);

function type (box, value) {
  input(box).value = value;
  input(box).dispatchEvent(new Event('input', { bubbles: true }));
}

function point (box, option) {
  option.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
}

function press (box, key, options = {}) {
  input(box).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
}

test('a multiple carries the caret too, because a field full of chips still hides a list behind it', () => {
  const box = mount();
  expect(caret(box)).not.toBe(null);
  // Announced by nothing and reachable by no key: the field's own `aria-expanded` says
  // whether the popup is open, and Alt+Down opens it.
  expect(caret(box).getAttribute('aria-hidden')).toBe('true');
  expect(caret(box).tabIndex).toBe(-1);
});

test('with nothing to wait for, a click in the field opens the popup', () => {
  const box = mount();
  field(box).click();
  expect(box.open).toBe(true);
});

test('a field waiting for two characters opens on neither a click nor the first of them', () => {
  const box = mount('min-chars="2"');
  field(box).click();
  expect(box.open).toBe(false);
  type(box, 'e');
  expect(box.open).toBe(false);
});

test('the character it was waiting for opens it, on a list already narrowed to what was typed', () => {
  const box = mount('min-chars="2"');
  type(box, 'en');
  expect(box.open).toBe(true);
  expect(showing(box)).toEqual(['English']);
});

test('the caret opens a waiting popup, so a reader who would rather browse than type still can', () => {
  const box = mount('min-chars="2"');
  caret(box).click();
  expect(box.open).toBe(true);
});

test("Alt+Down opens a waiting popup, which is the pattern's own keyboard door", () => {
  const box = mount('min-chars="2"');
  press(box, 'ArrowDown', { altKey: true });
  expect(box.open).toBe(true);
});

test('an open popup stays open when the query falls back under the threshold', () => {
  // `min-chars` is about opening. A reader deleting their query back to nothing has not
  // asked for the list to go away - Escape, Tab and a click outside are what say that.
  const box = mount('min-chars="2"');
  type(box, 'en');
  type(box, '');
  expect(box.open).toBe(true);
  expect(showing(box)).toEqual(['Serbian', 'English', 'German']);
});

test('picking closes a waiting popup, because the pick is what emptied the query', () => {
  // The reader deleting a query keeps the list; a pick clearing it does not. Otherwise the
  // field goes straight from two typed characters to the whole list under a field that
  // asked for two characters.
  const box = mount('min-chars="2"');
  type(box, 'en');
  press(box, 'Enter');
  expect(box.select.selectedOptions.length).toBe(1);
  expect(box.open).toBe(false);
});

test('with nothing to wait for, picking leaves the popup open for the next tag', () => {
  const box = mount();
  field(box).click();
  press(box, 'Enter');
  expect(box.select.selectedOptions.length).toBe(1);
  expect(box.open).toBe(true);
});

test('a threshold that is not a number is no threshold at all', () => {
  const box = mount('min-chars="soon"');
  field(box).click();
  expect(box.open).toBe(true);
});

test('the pointer moves the cursor without scrolling anything, so the list cannot run from it', () => {
  // The row at either end of the scroller is half cut off, and scrolling it fully in moves
  // the list under a still pointer - onto another row, which scrolls again.
  const box = mount();
  field(box).click();
  const rows = box.querySelectorAll('.combobox-elemental-option');
  scrolled.length = 0;
  point(box, rows[2]);
  expect(rows[2].getAttribute('data-active')).toBe('');
  expect(scrolled).toEqual([]);
});

test('the keyboard still scrolls its row into view, which is the only way it can be seen', () => {
  const box = mount();
  field(box).click();
  scrolled.length = 0;
  press(box, 'ArrowDown');
  expect(scrolled).toContain(box.querySelectorAll('.combobox-elemental-option')[1]);
});
