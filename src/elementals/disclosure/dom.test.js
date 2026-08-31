/**
 * The one piece of the element that touches focus: a breakpoint closing the region over
 * the reader hands their focus to the button rather than dropping it on <body>.
 *
 * `index.test.js` pins the pure decisions — state, slide heights, what a query dictates.
 * This file runs the element over markup because the handoff only exists in the wiring:
 * who holds focus when `onMediaChange` closes the region.
 *
 * Deliberately not covered: a real `matchMedia` crossing — jsdom has no `matchMedia`, so
 * the query is stubbed and `onMediaChange` called as the listener would be; the slide and
 * everything layout-shaped is `script/a11y`'s.
 *
 * @jest-environment jsdom
 */

import './index.js';

function mount(open) {
  document.body.innerHTML = `
    <disclosure-elemental${open ? ' open' : ''}>
      <button>Toggle</button>
      <div><button id="inside">Inside</button></div>
    </disclosure-elemental>`;
  return document.querySelector('disclosure-elemental');
}

test('a breakpoint closing the region over the reader moves their focus to the button', () => {
  const el = mount(true);
  el.query = { matches: false, addEventListener() {}, removeEventListener() {} };
  document.getElementById('inside').focus();
  el.onMediaChange();
  expect(el.open).toBe(false);
  expect(document.activeElement).toBe(el.button);
});

test('a breakpoint crossing leaves focus alone when it was never in the region', () => {
  const el = mount(true);
  el.query = { matches: false, addEventListener() {}, removeEventListener() {} };
  const elsewhere = document.createElement('button');
  document.body.appendChild(elsewhere);
  elsewhere.focus();
  el.onMediaChange();
  expect(el.open).toBe(false);
  expect(document.activeElement).toBe(elsewhere);
});
