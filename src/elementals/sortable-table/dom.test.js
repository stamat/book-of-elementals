/**
 * The half of this element that is DOM: the buttons it writes into the header row, the note it
 * appends to the caption, the `aria-sort` bookkeeping, and the rows actually moving.
 *
 * `index.test.js` pins `sortKey` and `sortOrder`, which are the sums. This file is what those
 * sums are wired to — a correct ordering applied to the wrong rows, or applied without saying so
 * on the header, is a table that sorts for the sighted reader and lies to everyone else.
 *
 * Deliberately not covered: the arrow, the stripe and the rule, which are CSS and belong to the
 * docs page; and `Intl.Collator`'s own orderings, which are ICU's business — what is checked here
 * is that the collator is asked at all, through one case a plain `<` gets wrong.
 *
 * @jest-environment jsdom
 */

import './index.js';
import { DEFAULT_NOTE } from './index.js';

const MARKUP = `
  <sortable-table-elemental>
    <table>
      <caption>Peaks</caption>
      <thead>
        <tr><th>Name</th><th>Height</th><th data-sort="none">Notes</th></tr>
      </thead>
      <tbody>
        <tr><th scope="row">Midžor</th><td>2169</td><td>on the border</td></tr>
        <tr><th scope="row">Đeravica</th><td>2656</td><td>the highest</td></tr>
        <tr><th scope="row">Rtanj</th><td>1560</td><td>a pyramid</td></tr>
      </tbody>
    </table>
  </sortable-table-elemental>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('sortable-table-elemental');
}

/** The first column of every body row, top to bottom - what a sort is judged by. */
function column (table, index = 0) {
  return Array.from(table.querySelector('tbody').rows).map((row) => row.children[index].textContent.trim());
}

function headers (table) {
  return Array.from(table.querySelectorAll('thead th'));
}

test('the element upgrades over the table the author wrote and puts a button in every sortable header', () => {
  // Every assertion below stands on this one: an element that never upgraded writes nothing.
  const table = mount();
  expect(table.constructor.name).toBe('SortableTableElemental');
  const buttons = headers(table).map((th) => th.querySelector(':scope > button'));
  expect(buttons.map((button) => button && button.textContent)).toEqual(['Name', 'Height', null]);
});

test('the button is a plain button, so a form around the table is not submitted by a sort', () => {
  const table = mount();
  expect(headers(table)[0].querySelector('button').type).toBe('button');
});

test('data-sort="none" is a column that does not sort, and it keeps its text', () => {
  const table = mount();
  const notes = headers(table)[2];
  expect(notes.querySelector('button')).toBe(null);
  expect(notes.textContent).toBe('Notes');
});

test('the button takes the header\'s own nodes, so an icon or a span in there survives', () => {
  // Reading `textContent` and writing it back would flatten the markup the page styled, which is
  // how a sortable table quietly loses its column icons.
  const table = mount(MARKUP.replace('<th>Name</th>', '<th><svg class="icon"></svg><span>Name</span></th>'));
  const button = headers(table)[0].querySelector('button');
  expect(button.querySelector('svg.icon')).toBeTruthy();
  expect(button.querySelector('span').textContent).toBe('Name');
});

test('the note goes in the caption, once, rather than into every button\'s name', () => {
  const table = mount();
  const caption = table.querySelector('caption');
  expect(caption.querySelector('.sortable-table-elemental-note').textContent).toBe(DEFAULT_NOTE);
  expect(headers(table)[0].querySelector('button').textContent).toBe('Name');
});

test('a space separates the note from whatever the page wrote in the caption', () => {
  // The caption is the table's accessible name. `Peaks` and the note with nothing between them
  // is announced as one word: `PeaksColumn`.
  const table = mount();
  expect(table.querySelector('caption').textContent).toBe(`Peaks ${DEFAULT_NOTE}`);
});

test('an empty caption gains no space, so a caption that was invisible does not gain a line', () => {
  const table = mount(MARKUP.replace('<caption>Peaks</caption>', '<caption></caption>'));
  expect(table.querySelector('caption').textContent).toBe(DEFAULT_NOTE);
});

test('a table with no caption is given one, first, because a caption anywhere else is not one', () => {
  const table = mount(MARKUP.replace('<caption>Peaks</caption>', ''));
  const caption = table.querySelector('caption');
  expect(caption).toBeTruthy();
  expect(caption).toBe(table.querySelector('table').firstElementChild);
});

test('note-text says the sentence in the page\'s own language, and changing it changes the caption', () => {
  const table = mount(MARKUP.replace('<sortable-table-elemental>', '<sortable-table-elemental note-text="Zaglavlja sa dugmetom sortiraju tabelu.">'));
  const note = table.querySelector('.sortable-table-elemental-note');
  expect(note.textContent).toBe('Zaglavlja sa dugmetom sortiraju tabelu.');
  table.noteText = 'Sortirajte klikom.';
  expect(note.textContent).toBe('Sortirajte klikom.');
});

test('a press sorts the rows by that column and says so on its header', () => {
  const table = mount();
  headers(table)[0].querySelector('button').click();
  expect(column(table)).toEqual(['Đeravica', 'Midžor', 'Rtanj']);
  expect(headers(table)[0].getAttribute('aria-sort')).toBe('ascending');
});

test('the same column pressed again turns the order round', () => {
  const table = mount();
  const name = headers(table)[0].querySelector('button');
  name.click();
  name.click();
  expect(column(table)).toEqual(['Rtanj', 'Midžor', 'Đeravica']);
  expect(headers(table)[0].getAttribute('aria-sort')).toBe('descending');
});

test('only one column is ever the sorted one', () => {
  // Two headers claiming `aria-sort` is a table that says it is in two orders at once.
  const table = mount();
  headers(table)[0].querySelector('button').click();
  headers(table)[1].querySelector('button').click();
  expect(headers(table).map((th) => th.getAttribute('aria-sort'))).toEqual([null, 'ascending', null]);
});

test('a fresh press on a new column starts ascending rather than inheriting the last direction', () => {
  const table = mount();
  const name = headers(table)[0].querySelector('button');
  name.click();
  name.click();
  headers(table)[1].querySelector('button').click();
  expect(column(table, 1)).toEqual(['1560', '2169', '2656']);
});

test('a column of numbers sorts as numbers, which is the collator being asked rather than a `<`', () => {
  // `'1560' < '900'` as text, and a table of heights that puts 1560 below 900 is the bug every
  // home-made sorter ships.
  const table = mount(MARKUP.replace('<td>1560</td>', '<td>900</td>'));
  headers(table)[1].querySelector('button').click();
  expect(column(table, 1)).toEqual(['900', '2169', '2656']);
});

test('data-sort-value is what a cell sorts by, so a date written for a human orders as a machine would', () => {
  const table = mount(`
    <sortable-table-elemental>
      <table>
        <thead><tr><th>Climbed</th></tr></thead>
        <tbody>
          <tr><td data-sort-value="1902-08-14">14 Aug 1902</td></tr>
          <tr><td data-sort-value="1877-05-30">30 May 1877</td></tr>
          <tr><td data-sort-value="1890-07-02">2 Jul 1890</td></tr>
        </tbody>
      </table>
    </sortable-table-elemental>`);
  headers(table)[0].querySelector('button').click();
  expect(column(table)).toEqual(['30 May 1877', '2 Jul 1890', '14 Aug 1902']);
});

test('rows equal on the new column keep the order the last sort left them in', () => {
  // The stability that matters is across *repeated* sorts: sort by name, then by size, and the
  // rows inside one size are expected to still be in name order.
  const table = mount(`
    <sortable-table-elemental>
      <table>
        <thead><tr><th>Name</th><th>Size</th></tr></thead>
        <tbody>
          <tr><td>Rtanj</td><td>2</td></tr>
          <tr><td>Midžor</td><td>1</td></tr>
          <tr><td>Đeravica</td><td>2</td></tr>
          <tr><td>Kopaonik</td><td>2</td></tr>
        </tbody>
      </table>
    </sortable-table-elemental>`);
  headers(table)[0].querySelector('button').click();
  headers(table)[1].querySelector('button').click();
  expect(column(table)).toEqual(['Midžor', 'Đeravica', 'Kopaonik', 'Rtanj']);
});

test('a sort says which column, by what, and which way', () => {
  const table = mount();
  const sorts = [];
  document.addEventListener('sortable-table-sort', (e) => sorts.push(e.detail));
  const height = headers(table)[1].querySelector('button');
  height.click();
  height.click();
  expect(sorts).toEqual([
    { column: 1, key: 'Height', direction: 'ascending' },
    { column: 1, key: 'Height', direction: 'descending' }
  ]);
});

test('a table that arrived already sorted is believed rather than re-sorted', () => {
  // It was ordered by the server, possibly by a key that is not in the DOM at all. Re-sorting on
  // upgrade would silently reorder correct data.
  const table = mount(MARKUP.replace('<th>Name</th>', '<th aria-sort="ascending">Name</th>'));
  expect(column(table)).toEqual(['Midžor', 'Đeravica', 'Rtanj']);
  expect(headers(table)[0].getAttribute('aria-sort')).toBe('ascending');
});

test('a header the markup called ascending turns round on the next press rather than re-sorting the same way', () => {
  const table = mount(MARKUP.replace('<th>Name</th>', '<th aria-sort="ascending">Name</th>'));
  headers(table)[0].querySelector('button').click();
  expect(headers(table)[0].getAttribute('aria-sort')).toBe('descending');
});

test('the buttons go in the last header row, so a grouped header sorts by its real columns', () => {
  const table = mount(`
    <sortable-table-elemental>
      <table>
        <thead>
          <tr><th colspan="2">Peak</th></tr>
          <tr><th>Name</th><th>Height</th></tr>
        </thead>
        <tbody><tr><td>Rtanj</td><td>1560</td></tr></tbody>
      </table>
    </sortable-table-elemental>`);
  const rows = table.querySelectorAll('thead tr');
  expect(rows[0].querySelector('button')).toBe(null);
  expect(Array.from(rows[1].querySelectorAll('button')).map((b) => b.textContent)).toEqual(['Name', 'Height']);
});

test('only the first tbody is sorted, because a second one is grouping and not more rows', () => {
  const table = mount(`
    <sortable-table-elemental>
      <table>
        <thead><tr><th>Name</th></tr></thead>
        <tbody><tr><td>Rtanj</td></tr><tr><td>Midžor</td></tr></tbody>
        <tbody><tr><td>Zlatibor</td></tr><tr><td>Avala</td></tr></tbody>
      </table>
    </sortable-table-elemental>`);
  headers(table)[0].querySelector('button').click();
  const bodies = table.querySelectorAll('tbody');
  expect(Array.from(bodies[0].rows).map((r) => r.textContent)).toEqual(['Midžor', 'Rtanj']);
  expect(Array.from(bodies[1].rows).map((r) => r.textContent)).toEqual(['Zlatibor', 'Avala']);
});

test('a row too short for the column sorts as empty rather than taking the page down', () => {
  const table = mount(`
    <sortable-table-elemental>
      <table>
        <thead><tr><th>Name</th><th>Height</th></tr></thead>
        <tbody><tr><td>Rtanj</td><td>1560</td></tr><tr><td>Midžor</td></tr></tbody>
      </table>
    </sortable-table-elemental>`);
  headers(table)[1].querySelector('button').click();
  expect(column(table)).toEqual(['Midžor', 'Rtanj']);
});

test('an element with no table in it yet is left alone, and builds when it is next connected', () => {
  const table = mount('<sortable-table-elemental></sortable-table-elemental>');
  expect(table.querySelector('button')).toBe(null);
  table.innerHTML = '<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Rtanj</td></tr></tbody></table>';
  table.remove();
  document.body.append(table);
  expect(table.querySelector('thead button')).toBeTruthy();
});

test('the buttons come out when the element goes, and the header content goes back where it was', () => {
  // A `<th>` left holding a button nothing is listening to is a control that looks like it sorts
  // and does not.
  const table = mount(MARKUP.replace('<th>Name</th>', '<th><span>Name</span></th>'));
  const name = headers(table)[0];
  table.remove();
  expect(name.querySelector('button')).toBe(null);
  expect(name.querySelector('span').textContent).toBe('Name');
});

test('the caption goes back to what the page wrote, an element-made caption included', () => {
  const withCaption = mount();
  const caption = withCaption.querySelector('caption');
  withCaption.remove();
  expect(caption.textContent).toBe('Peaks');

  const without = mount(MARKUP.replace('<caption>Peaks</caption>', ''));
  const made = without.querySelector('caption');
  without.remove();
  expect(made.isConnected).toBe(false);
});

test('a move in the DOM does not leave a note or a space behind each time', () => {
  // A move is a disconnect and a connect. Anything teardown left is appended again on the way
  // back in - one more space per move, forever.
  const table = mount();
  for (let i = 0; i < 3; i++) {
    table.remove();
    document.body.append(table);
  }
  expect(table.querySelector('caption').textContent).toBe(`Peaks ${DEFAULT_NOTE}`);
  expect(table.querySelectorAll('.sortable-table-elemental-note')).toHaveLength(1);
});

test('aria-sort survives teardown, because the rows are still in the order it describes', () => {
  const table = mount();
  headers(table)[0].querySelector('button').click();
  const name = headers(table)[0];
  table.remove();
  expect(name.getAttribute('aria-sort')).toBe('ascending');
});
