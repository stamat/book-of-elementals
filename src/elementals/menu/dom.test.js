/**
 * `flyout-when` over real markup: the roles the two modes put on the lists, and that a
 * `container:` condition is measured against the container rather than the viewport.
 *
 * `index.test.js` pins the pure decisions - stepping, type-ahead, hover intent.
 *
 * Deliberately not covered: a real `matchMedia` crossing - jsdom has none, so the list is
 * stubbed and the listener called as the browser would call it; a real container evaluation
 * - jsdom computes no `@container` rule, so `getComputedStyle` is stubbed to say what the
 * probe would have read. Placement, focus and everything layout-shaped is `script/a11y`'s.
 *
 * @jest-environment jsdom
 */

import './index.js';

const realGetComputedStyle = window.getComputedStyle;
let listener;
let matches;

beforeEach(() => {
  listener = null;
  matches = true;
  window.matchMedia = () => ({
    get matches() { return matches; },
    addEventListener: (type, fn) => { listener = fn; },
    // Only its own: the old element in the document disconnects after the new one has
    // connected, and a blanket null would take the new element's listener with it.
    removeEventListener: (type, fn) => { if (fn === listener) listener = null; }
  });
});

afterEach(() => {
  delete window.matchMedia;
  delete window.ResizeObserver;
  window.getComputedStyle = realGetComputedStyle;
});

function mount(attributes) {
  document.body.innerHTML = `
    <div id="box">
      <menu-elemental ${attributes}>
        <button>Menu</button>
        <ul><li><a href="#one">One</a></li></ul>
      </menu-elemental>
    </div>`;
  return document.querySelector('menu-elemental');
}

test('a matching query is the flyout, and losing it hands the same markup back as nested disclosures', () => {
  const el = mount('flyout-when="(min-width: 40rem)"');
  expect(el.inline).toBe(false);
  expect(el.menu.getAttribute('role')).toBe('menu');

  matches = false;
  listener({ matches: false });
  expect(el.inline).toBe(true);
  expect(el.menu.getAttribute('role')).toBe(null);
});

describe('a container: query, measured against the container rather than the viewport', () => {
  let answer;

  beforeEach(() => {
    answer = 'yes';
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    window.getComputedStyle = (node) => ({
      containerType: node.id === 'box' ? 'inline-size' : 'normal',
      containerName: '',
      getPropertyValue: () => answer
    });
  });

  test('a wide enough container is the flyout, and matchMedia was never asked', () => {
    let asked = false;
    window.matchMedia = () => { asked = true; return null; };
    const el = mount('flyout-when="container:(min-width: 30rem)"');
    expect(el.inline).toBe(false);
    expect(el.menu.getAttribute('role')).toBe('menu');
    expect(asked).toBe(false);
    expect(document.head.querySelector('style').textContent).toContain('@container (min-width: 30rem)');
  });

  test('a container too narrow for the condition is the stack of disclosures, and the rule leaves with the element', () => {
    answer = 'no';
    const el = mount('flyout-when="container:(min-width: 30rem)"');
    expect(el.inline).toBe(true);
    expect(el.menu.getAttribute('role')).toBe(null);
    el.remove();
    expect(document.head.querySelector('style')).toBe(null);
    expect(el.dataset.elementalProbe).toBe(undefined);
  });
});
