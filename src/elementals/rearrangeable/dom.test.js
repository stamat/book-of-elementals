/**
 * The half of this element that is DOM: the buttons it writes into every item, the ends of
 * travel it marks on them, the items actually moving, and the live region that says where one
 * landed.
 *
 * `index.test.js` pins the label, the templates and `dropIndex`, which are the sums. This file
 * is what those sums are wired to — a move that happens without being announced is a list that
 * rearranges for the sighted reader and lies to everyone else, and a button that goes `disabled`
 * at the end of its travel takes the focus of the reader who pressed it down to `<body>`.
 *
 * Deliberately not covered: the pointer drag. It needs layout for the midpoints, pointer
 * capture, and a `touch-action` the browser actually honours, none of which jsdom has — so what
 * is checked here is that `drag` writes and removes the handle, and the dragging itself belongs
 * to `script/a11y` and a browser. The arrows, the grip and the lift are CSS and belong to the
 * docs page.
 *
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';

import './index.js';
import { ANNOUNCE_MS } from './index.js';

const MARKUP = `
  <rearrangeable-elemental>
    <ol>
      <li>Bananas</li>
      <li>Kiwi</li>
      <li>Mango</li>
    </ol>
  </rearrangeable-elemental>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('rearrangeable-elemental');
}

/** The list as the reader would hear it, top to bottom. `data-label` where the markup set one,
 * and never the words of the buttons the element wrote. */
function order (element) {
  return element.items.map((item) => item.getAttribute('data-label') ?? item.firstChild.textContent.trim());
}

/** The rows of a table, by the cell that names them. */


function buttons (item) {
  return Array.from(item.querySelectorAll('[data-move]'));
}

function names (element) {
  return element.items.flatMap((item) => buttons(item).map((button) => button.textContent));
}

function announced (element) {
  jest.advanceTimersByTime(ANNOUNCE_MS);
  return element.status.textContent;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('the element upgrades over the list the author wrote and gives every item two buttons', () => {
  // Every assertion below stands on this one: an element that never upgraded writes nothing.
  const element = mount();
  expect(element.constructor.name).toBe('RearrangeableElemental');
  expect(element.items.map((item) => buttons(item).length)).toEqual([2, 2, 2]);
});

test('the buttons are plain buttons, so a form around the list is not submitted by a tidy-up', () => {
  const element = mount();
  expect(buttons(element.items[0]).map((button) => button.type)).toEqual(['button', 'button']);
});

test('a button is named by the item it moves, so a rotor full of them is not three identical names', () => {
  const element = mount();
  expect(names(element)).toEqual([
    'Move Bananas up', 'Move Bananas down',
    'Move Kiwi up', 'Move Kiwi down',
    'Move Mango up', 'Move Mango down'
  ]);
});

test('the name is the button own text, so speech input can say what the screen shows', () => {
  // The accessible name and the visible label are one string. An `aria-label` over an icon
  // would be a name nobody can read out and nobody can say.
  const element = mount();
  const button = buttons(element.items[0])[0];
  expect(button.hasAttribute('aria-label')).toBe(false);
  expect(button.textContent).toBe('Move Bananas up');
});

test('the fast keyboard path is announced on the buttons rather than left to be discovered', () => {
  const element = mount();
  expect(buttons(element.items[0]).map((button) => button.getAttribute('aria-keyshortcuts')))
    .toEqual(['Alt+ArrowUp', 'Alt+ArrowDown']);
});

test('a list is a list: nothing is re-roled into a set of options to choose between', () => {
  const element = mount();
  expect(element.container.hasAttribute('role')).toBe(false);
  expect(element.items.some((item) => item.hasAttribute('role'))).toBe(false);
});

test('the button at the end of its travel says so with aria-disabled and stays focusable', () => {
  // `disabled` would drop the focus of the reader who just pressed it to `<body>` — at the one
  // moment they most need to be told where they are.
  const element = mount();
  const [first, middle, last] = element.items;
  expect(buttons(first).map((button) => button.getAttribute('aria-disabled'))).toEqual(['true', null]);
  expect(buttons(middle).map((button) => button.getAttribute('aria-disabled'))).toEqual([null, null]);
  expect(buttons(last).map((button) => button.getAttribute('aria-disabled'))).toEqual([null, 'true']);
  expect(buttons(first).some((button) => button.disabled)).toBe(false);
});

test('pressing down moves the item down, and the ends of travel move with it', () => {
  const element = mount();
  buttons(element.items[0])[1].click();
  expect(order(element)).toEqual(['Kiwi', 'Bananas', 'Mango']);
  expect(buttons(element.items[0]).map((button) => button.getAttribute('aria-disabled'))).toEqual(['true', null]);
});

test('pressing up moves the item up', () => {
  const element = mount();
  buttons(element.items[2])[0].click();
  expect(order(element)).toEqual(['Bananas', 'Mango', 'Kiwi']);
});

test('focus stays on the button that moved, so the next press is the same press', () => {
  const element = mount();
  const button = buttons(element.items[0])[1];
  button.focus();
  button.click();
  expect(document.activeElement).toBe(button);
  expect(order(element)).toEqual(['Kiwi', 'Bananas', 'Mango']);
  // And the same key again keeps going, which is the whole reason focus was kept.
  document.activeElement.click();
  expect(order(element)).toEqual(['Kiwi', 'Mango', 'Bananas']);
});

test('a press at the end of the travel moves nothing and says nothing', () => {
  const element = mount();
  buttons(element.items[0])[0].click();
  expect(order(element)).toEqual(['Bananas', 'Kiwi', 'Mango']);
  expect(announced(element)).toBe('');
});

test('the move is announced in a polite live region, with where the item landed', () => {
  const element = mount();
  expect(element.status.getAttribute('role')).toBe('status');
  buttons(element.items[0])[1].click();
  expect(announced(element)).toBe('Bananas moved to position 2 of 3');
});

test('the same move twice running is still announced the second time', () => {
  // A live region announces a change, so text written twice over is silence — which would make
  // an item moved down and back up again report once and then go quiet.
  const element = mount();
  buttons(element.items[0])[1].click();
  expect(announced(element)).toBe('Bananas moved to position 2 of 3');
  buttons(element.items[1])[0].click();
  expect(announced(element)).toBe('Bananas moved to position 1 of 3');
  buttons(element.items[0])[1].click();
  expect(element.status.textContent).toBe('');
  expect(announced(element)).toBe('Bananas moved to position 2 of 3');
});

test('the page hears one event per landing, saying where the item was and where it is', () => {
  const element = mount();
  const heard = [];
  element.addEventListener('rearrangeable-move', (event) => heard.push(event.detail));
  buttons(element.items[0])[1].click();
  expect(heard).toHaveLength(1);
  expect(heard[0].from).toBe(0);
  expect(heard[0].to).toBe(1);
  expect(heard[0].item).toBe(element.items[1]);
});

test('Alt and an arrow move the item from anywhere inside it', () => {
  const element = mount();
  const button = buttons(element.items[2])[0];
  button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true, bubbles: true, cancelable: true }));
  expect(order(element)).toEqual(['Bananas', 'Mango', 'Kiwi']);
});

test('an arrow without Alt is the reader scrolling, and moves nothing', () => {
  const element = mount();
  buttons(element.items[0])[1]
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  expect(order(element)).toEqual(['Bananas', 'Kiwi', 'Mango']);
});

test('data-label is what the buttons and the announcement call the item', () => {
  const element = mount(`
    <rearrangeable-elemental>
      <ol>
        <li data-label="Bananas">🍌 Bananas, a box of twelve</li>
        <li data-label="Kiwi">🥝 Kiwi, six</li>
      </ol>
    </rearrangeable-elemental>`);
  expect(names(element)[0]).toBe('Move Bananas up');
  buttons(element.items[0])[1].click();
  expect(announced(element)).toBe('Bananas moved to position 2 of 2');
});

test('the templates are the translation surface, and changing one renames the buttons', () => {
  const element = mount();
  element.upText = 'Pomeri {label} gore';
  expect(names(element)[0]).toBe('Pomeri Bananas gore');
});

test('refreshing twice does not fold the buttons words back into the item name', () => {
  // The tail-eating case, from the DOM side: the button text is in the item, and a label read
  // off `textContent` would swallow it and then swallow that.
  const element = mount();
  element.update();
  element.update();
  expect(names(element)[0]).toBe('Move Bananas up');
});

test('drag adds a handle to every item, and taking it away takes the handles with it', () => {
  const element = mount();
  expect(element.querySelectorAll('[data-rearrange-handle]')).toHaveLength(0);
  element.drag = true;
  expect(element.querySelectorAll('[data-rearrange-handle]')).toHaveLength(3);
  // Nothing to focus and nothing to announce: the keyboard way in is the two buttons beside it.
  const handle = element.querySelector('[data-rearrange-handle]');
  expect(handle.getAttribute('aria-hidden')).toBe('true');
  expect(handle.hasAttribute('tabindex')).toBe(false);
  element.drag = false;
  expect(element.querySelectorAll('[data-rearrange-handle]')).toHaveLength(0);
});

test('an authors own handle is used as it is, and is still theirs when dragging is switched off', () => {
  const element = mount(`
    <rearrangeable-elemental drag>
      <ol>
        <li data-label="Bananas"><span class="grip" data-rearrange-handle aria-hidden="true">≡</span>Bananas</li>
        <li data-label="Kiwi"><span class="grip" data-rearrange-handle aria-hidden="true">≡</span>Kiwi</li>
      </ol>
    </rearrangeable-elemental>`);
  expect(element.querySelectorAll('[data-rearrange-handle]')).toHaveLength(2);
  expect(element.querySelectorAll('.grip')).toHaveLength(2);
  element.drag = false;
  expect(element.querySelectorAll('.grip')).toHaveLength(2);
});

test('items that arrive after the upgrade get their buttons from update()', () => {
  const element = mount();
  const item = document.createElement('li');
  item.textContent = 'Fig';
  element.container.append(item);
  expect(buttons(item)).toHaveLength(0);
  element.update();
  expect(buttons(item)).toHaveLength(2);
  expect(names(element).slice(-2)).toEqual(['Move Fig up', 'Move Fig down']);
  // And the item that used to be last is no longer at the end of its travel.
  expect(buttons(element.items[2])[1].hasAttribute('aria-disabled')).toBe(false);
});

test('taking the element out of the document takes everything it wrote out with it', () => {
  // A move in the DOM is a disconnect and a connect, so anything left behind is a second set of
  // buttons on the way back in.
  const element = mount();
  element.drag = true;
  element.remove();
  expect(element.querySelectorAll('[data-rearrange-controls]')).toHaveLength(0);
  expect(element.querySelectorAll('[data-move]')).toHaveLength(0);
  expect(element.querySelector('.rearrangeable-elemental-status')).toBe(null);
  document.body.append(element);
  expect(element.items.map((item) => buttons(item).length)).toEqual([2, 2, 2]);
});

const TABLE = `
  <rearrangeable-elemental>
    <table>
      <thead><tr><th>Name</th><th>Height</th><th>Order</th></tr></thead>
      <tbody>
        <tr><th scope="row">Midžor</th><td>2169</td><td></td></tr>
        <tr><th scope="row">Đeravica</th><td>2656</td><td></td></tr>
        <tr><th scope="row">Rtanj</th><td>1560</td><td></td></tr>
      </tbody>
    </table>
  </rearrangeable-elemental>`;

test('a table body is a list of rows, and the rows rearrange the same way the items do', () => {
  const element = mount(TABLE);
  expect(element.items.map((row) => row.tagName)).toEqual(['TR', 'TR', 'TR']);
  buttons(element.items[0])[1].click();
  expect(element.items.map((row) => row.cells[0].textContent)).toEqual(['Đeravica', 'Midžor', 'Rtanj']);
});

test('a rows controls go inside a cell, because a span between two cells is not a thing a table can place', () => {
  const element = mount(TABLE);
  const controls = element.items[0].querySelector('[data-rearrange-controls]');
  expect(controls.parentElement.tagName).toBe('TD');
  // The last cell, so the header needs no column adding to it that nothing declared.
  expect(controls.parentElement).toBe(element.items[0].cells[2]);
  expect(element.items[0].cells).toHaveLength(3);
});

test('data-rearrange-cell is how a table says which column the controls belong in', () => {
  const element = mount(`
    <rearrangeable-elemental>
      <table>
        <tbody>
          <tr><td data-rearrange-cell></td><th scope="row">Midžor</th><td>2169</td></tr>
          <tr><td data-rearrange-cell></td><th scope="row">Rtanj</th><td>1560</td></tr>
        </tbody>
      </table>
    </rearrangeable-elemental>`);
  expect(element.items[0].querySelector('[data-rearrange-controls]').parentElement)
    .toBe(element.items[0].cells[0]);
});

test('a row is named by its row header rather than by every cell run together', () => {
  // All three cells concatenated is the whole record read out before the word "up", once per
  // button and again on every move.
  const element = mount(TABLE);
  expect(names(element)[0]).toBe('Move Midžor up');
  buttons(element.items[0])[1].click();
  expect(announced(element)).toBe('Midžor moved to position 2 of 3');
});

test('a table with no row header is named by its first cell', () => {
  const element = mount(`
    <rearrangeable-elemental>
      <table>
        <tbody>
          <tr><td>Midžor</td><td>2169</td></tr>
          <tr><td>Rtanj</td><td>1560</td></tr>
        </tbody>
      </table>
    </rearrangeable-elemental>`);
  expect(names(element)[0]).toBe('Move Midžor up');
});

test('an element with no list writes nothing and waits, rather than marking itself done', () => {
  const element = mount('<rearrangeable-elemental></rearrangeable-elemental>');
  expect(element.initialized).toBeFalsy();
  const list = document.createElement('ol');
  list.innerHTML = '<li>Bananas</li>';
  element.append(list);
  element.remove();
  document.body.append(element);
  expect(buttons(element.items[0])).toHaveLength(2);
});
