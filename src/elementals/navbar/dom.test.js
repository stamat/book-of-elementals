/**
 * What the element writes over a page that already holds what it wrote last time: a page put
 * back from a copy of itself, as htmx's Back does. The probe, the copies in the overflow panel
 * and the `id`s that `wire()` hands out are all in the copy, and a second upgrade over them is
 * a second probe, a second set of copies and two lists answering to one `id`.
 *
 * `index.test.js` pins the decisions as plain functions.
 *
 * Deliberately not covered: which items overflow. That is an `IntersectionObserver` over a
 * laid-out probe, and jsdom has neither - so every copy here stays hidden, and the docs page in
 * a browser is where an item goes behind **More**.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <navbar-elemental>
    <div>
      <ul>
        <li><a href="/a">Products</a></li>
        <li>
          <button>Resources</button>
          <ul>
            <li><a href="/docs">Docs</a></li>
          </ul>
        </li>
        <li data-navbar-more>
          <button>More</button>
          <ul></ul>
        </li>
      </ul>
    </div>
    <button data-navbar-toggle aria-label="Navigation"></button>
  </navbar-elemental>`;

test('a page put back from a copy of itself has one probe, one copy per item, and no id twice', () => {
  document.body.innerHTML = MARKUP;
  // What htmx's history keeps for Back: the live page as markup, everything the upgrade wrote in it.
  const snapshot = document.body.innerHTML;
  document.body.innerHTML = snapshot;

  const navbar = document.querySelector('navbar-elemental');
  expect(navbar.rail.querySelectorAll(':scope > [data-navbar-probe]')).toHaveLength(1);
  expect(navbar.morePanel.children).toHaveLength(navbar.items.length);

  const ids = Array.from(document.querySelectorAll('[id]'), (node) => node.id);
  expect(ids).toEqual([...new Set(ids)]);
});
