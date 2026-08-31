/**
 * `vertical-when` over real markup: what the query flips, what it leaves alone, and that a
 * `container:` condition is measured against the container rather than the viewport.
 *
 * `index.test.js` pins the pure decisions - clamping, the arrow steps, the grid template.
 *
 * Deliberately not covered: a real `matchMedia` crossing - jsdom has none, so the list is
 * stubbed and the listener called as the browser would call it; a real container evaluation
 * - jsdom computes no `@container` rule, so `getComputedStyle` is stubbed to say what the
 * probe would have read. Anything the split actually looks like is `script/a11y`'s.
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
      <splitter-elemental ${attributes}><nav>Nav</nav><main>Main</main></splitter-elemental>
    </div>`;
  return document.querySelector('splitter-elemental');
}

test('a matching query stacks the panes, and the crossing back takes the stacking away again', () => {
  const el = mount('vertical-when="(width < 40rem)"');
  expect(el.hasAttribute('vertical')).toBe(true);

  matches = false;
  listener({ matches: false });
  expect(el.hasAttribute('vertical')).toBe(false);
});

test('a page that stacked its own panes keeps them stacked, whatever the query says', () => {
  const el = mount('vertical vertical-when="(width < 40rem)"');
  matches = false;
  listener({ matches: false });
  expect(el.hasAttribute('vertical')).toBe(true);
});

test('the stacking leaves with the element: a `vertical` this element wrote is this element´s to take off', () => {
  const el = mount('vertical-when="(width < 40rem)"');
  expect(el.hasAttribute('vertical')).toBe(true);
  el.remove();
  expect(el.hasAttribute('vertical')).toBe(false);
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

  test('a narrow container stacks the panes even though matchMedia was never asked', () => {
    let asked = false;
    window.matchMedia = () => { asked = true; return null; };
    const el = mount('vertical-when="container:(width < 40rem)"');
    expect(el.hasAttribute('vertical')).toBe(true);
    expect(asked).toBe(false);
    expect(document.head.querySelector('style').textContent).toContain('@container (width < 40rem)');
  });

  test('a container the condition does not match leaves the panes side by side, and the rule leaves with the element', () => {
    answer = 'no';
    const el = mount('vertical-when="container:(width < 40rem)"');
    expect(el.hasAttribute('vertical')).toBe(false);
    el.remove();
    expect(document.head.querySelector('style')).toBe(null);
    expect(el.dataset.elementalProbe).toBe(undefined);
  });
});
