/**
 * The two pieces of the element that only exist in the wiring: a breakpoint closing the
 * region over the reader hands their focus to the button rather than dropping it on
 * <body>, and a `container:` query is answered through the probe rule and the computed
 * styles rather than through `matchMedia`.
 *
 * `index.test.js` pins the pure decisions — state, slide heights, what a query dictates.
 *
 * Deliberately not covered: a real `matchMedia` crossing — jsdom has no `matchMedia`, so
 * the query is stubbed and `onMediaChange` called as the listener would be; a real
 * container evaluation — jsdom computes no `@container` rule, so `getComputedStyle` is
 * stubbed to say which side the probe would name; the slide and everything layout-shaped
 * is `script/a11y`'s.
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

describe('a container: query, answered by the probe instead of matchMedia', () => {
  const realGetComputedStyle = window.getComputedStyle;
  let probeAnswer;

  beforeEach(() => {
    probeAnswer = 'yes';
    window.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    window.getComputedStyle = (node) => ({
      containerType: node === document.body ? 'inline-size' : 'normal',
      containerName: '',
      getPropertyValue: () => probeAnswer
    });
  });

  afterEach(() => {
    delete window.ResizeObserver;
    window.getComputedStyle = realGetComputedStyle;
  });

  function mountContainer() {
    document.body.innerHTML = `
      <disclosure-elemental open-when="container:(min-width: 30rem)">
        <button>Toggle</button>
        <div><p>Folded</p></div>
      </disclosure-elemental>`;
    return document.querySelector('disclosure-elemental');
  }

  test('the probe saying pinned holds the region open, exactly as a matching media query would', () => {
    const el = mountContainer();
    expect(el.open).toBe(true);
    expect(el.dataset.mode).toBe('pinned');
    expect(document.head.querySelector('style').textContent).toContain('@container (min-width: 30rem)');
  });

  test('the probe saying nothing frees the region to its button, and the rule leaves with the element', () => {
    probeAnswer = '';
    const el = mountContainer();
    expect(el.open).toBe(false);
    expect(el.dataset.mode).toBe('free');
    el.remove();
    expect(document.head.querySelector('style')).toBe(null);
    expect(el.dataset.elementalProbe).toBe(undefined);
  });

  test('without a ResizeObserver to hear a crossing the query is ignored and the button alone is in charge', () => {
    delete window.ResizeObserver;
    const el = mountContainer();
    expect(el.query).toBe(null);
    expect(el.dataset.mode).toBe(undefined);
    expect(el.open).toBe(false);
  });
});
