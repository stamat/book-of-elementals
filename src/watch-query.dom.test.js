/**
 * The seam every `*-when` attribute in the book goes through: a plain media query handed
 * to `matchMedia`, a `container:` one answered by a probe rule and the computed styles.
 *
 * Deliberately not covered: a real container evaluation - jsdom parses no `@container`
 * rule and computes nothing from one, so `getComputedStyle` is stubbed to say what the
 * browser would have said, and the rule itself is read as text. Whether the rule is
 * *correct* CSS is `script/a11y`'s, in a browser that can run it.
 *
 * @jest-environment jsdom
 */

import { watchQuery, unwatchQuery } from './watch-query.js';

const realGetComputedStyle = window.getComputedStyle;

let answer;
let observed;
let fire;

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '<div id="box"><span id="target"></span></div>';
  answer = 'yes';
  observed = [];
  fire = null;
  window.ResizeObserver = class {
    constructor(callback) { fire = callback; }
    observe(node) { observed.push(node); }
    disconnect() { observed.length = 0; }
  };
  window.getComputedStyle = (node) => ({
    containerType: node.id === 'box' ? 'inline-size' : 'normal',
    containerName: node.dataset.name || '',
    getPropertyValue: () => answer
  });
});

afterEach(() => {
  delete window.ResizeObserver;
  window.getComputedStyle = realGetComputedStyle;
});

const target = () => document.getElementById('target');
const resize = () => fire([]);

test('a query with no container: in front of it is a question about the viewport, and matchMedia answers those', () => {
  const mql = { matches: true, addEventListener() {}, removeEventListener() {} };
  window.matchMedia = (query) => (query === '(min-width: 30rem)' ? mql : null);
  expect(watchQuery(target(), '(min-width: 30rem)')).toBe(mql);
  expect(document.head.querySelector('style')).toBe(null);
  delete window.matchMedia;
});

test('an empty attribute is nothing to watch, and nothing is put up for it', () => {
  expect(watchQuery(target(), '')).toBe(null);
  expect(watchQuery(target(), null)).toBe(null);
  expect(document.head.querySelector('style')).toBe(null);
});

test('a container: query becomes a real rule in the document, naming the condition it was written with', () => {
  watchQuery(target(), 'container:(min-width: 30rem)');
  expect(document.head.querySelector('style').textContent).toContain('@container (min-width: 30rem)');
  expect(target().dataset.elementalProbe).toBeTruthy();
});

test('the answer is read back out of the computed styles, so the browser is the one evaluating the query', () => {
  const query = watchQuery(target(), 'container:(min-width: 30rem)');
  expect(query.matches).toBe(true);
  answer = 'no';
  expect(query.matches).toBe(false);
});

test('the rule denies before it grants, so a probe inside another probe cannot inherit its answer', () => {
  watchQuery(target(), 'container:(min-width: 30rem)');
  const rule = document.head.querySelector('style').textContent;
  const subject = '[data-elemental-probe="' + target().dataset.elementalProbe + '"]';
  expect(rule.indexOf(subject + '{--elemental-probe:no}')).toBe(0);
  expect(rule.indexOf('@container')).toBeGreaterThan(0);
});

test('two elements watching at once get a subject each, so one condition cannot answer for the other', () => {
  const other = document.createElement('span');
  document.body.append(other);
  watchQuery(target(), 'container:(min-width: 30rem)');
  watchQuery(other, 'container:(min-width: 50rem)');
  expect(other.dataset.elementalProbe).not.toBe(target().dataset.elementalProbe);
  expect(document.head.querySelectorAll('style').length).toBe(2);
});

describe('what the condition names, and what it asks', () => {
  test('a name in front of the condition narrows the walk the way it narrows the rule', () => {
    document.getElementById('box').dataset.name = 'card';
    const query = watchQuery(target(), 'container:card (min-width: 30rem)');
    query.addEventListener('change', () => {});
    expect(observed).toEqual([document.getElementById('box')]);
  });

  test('`not` is CSS keyword, not a container name - the condition it negates is still watched', () => {
    const query = watchQuery(target(), 'container:not (min-width: 30rem)');
    query.addEventListener('change', () => {});
    expect(observed).toEqual([document.getElementById('box')]);
  });

  test('a name and a `not` together keep the name and drop the keyword', () => {
    document.getElementById('box').dataset.name = 'card';
    const query = watchQuery(target(), 'container:card not (min-width: 30rem)');
    query.addEventListener('change', () => {});
    expect(observed).toEqual([document.getElementById('box')]);
    expect(document.head.querySelector('style').textContent)
      .toContain('@container card not (min-width: 30rem)');
  });

  test('a condition that opens with a parenthesis has no name to find, however many parts it has', () => {
    const query = watchQuery(target(), 'container:(min-width: 30rem) and (min-height: 20rem)');
    query.addEventListener('change', () => {});
    expect(observed).toEqual([document.getElementById('box')]);
  });

  test('a name nothing above carries is a rule that can never match, and no resize can change that', () => {
    const query = watchQuery(target(), 'container:sidebar (min-width: 30rem)');
    query.addEventListener('change', () => {});
    expect(observed).toEqual([]);
  });
});

describe('conditions nothing can hear a change of', () => {
  test('a style query is refused rather than read once and left stale: no event says a custom property moved', () => {
    expect(watchQuery(target(), 'container:style(--x: 1)')).toBe(null);
    expect(document.head.querySelector('style')).toBe(null);
    expect(target().dataset.elementalProbe).toBe(undefined);
  });

  test('a scroll-state query is refused for the same reason', () => {
    expect(watchQuery(target(), 'container:scroll-state(stuck: top)')).toBe(null);
    expect(document.head.querySelector('style')).toBe(null);
  });

  test('one heard half does not rescue the other: a size query mixed with a style query is refused whole', () => {
    expect(watchQuery(target(), 'container:(min-width: 30rem) and style(--x: 1)')).toBe(null);
    expect(watchQuery(target(), 'container:card style(--x: 1)')).toBe(null);
    expect(document.head.querySelector('style')).toBe(null);
  });

  test('a media query is the browser`s to watch, style() and all - only the container half is refused', () => {
    const mql = { matches: true, addEventListener() {}, removeEventListener() {} };
    window.matchMedia = () => mql;
    expect(watchQuery(target(), '(min-width: 30rem)')).toBe(mql);
    delete window.matchMedia;
  });
});

test('the container watched for resizes is the one the rule will resolve against, name and all', () => {
  const query = watchQuery(target(), 'container:card (min-width: 30rem)');
  query.addEventListener('change', () => {});
  expect(observed).toEqual([]);

  document.getElementById('box').dataset.name = 'card';
  const named = watchQuery(target(), 'container:card (min-width: 30rem)');
  named.addEventListener('change', () => {});
  expect(observed).toEqual([document.getElementById('box')]);
});

test('a resize of that container is the change event, since a container query has none of its own', () => {
  let heard = null;
  const query = watchQuery(target(), 'container:(min-width: 30rem)');
  query.addEventListener('change', (event) => { heard = event; });
  resize();
  // The listener is handed the query itself: a caller reading `event.matches` for its first
  // reading and for every crossing after it is one path rather than two that can drift.
  expect(heard).toBe(query);
  expect(heard.matches).toBe(true);
});

test('without a ResizeObserver nothing can hear a crossing, so the query is refused rather than answered once and left stale', () => {
  delete window.ResizeObserver;
  expect(watchQuery(target(), 'container:(min-width: 30rem)')).toBe(null);
  expect(document.head.querySelector('style')).toBe(null);
  expect(target().dataset.elementalProbe).toBe(undefined);
});

test('unwatching takes the rule down and the mark off, so an element nothing is driving is the markup as it was written', () => {
  const query = watchQuery(target(), 'container:(min-width: 30rem)');
  const listener = () => {};
  query.addEventListener('change', listener);
  expect(unwatchQuery(query, listener)).toBe(null);
  expect(document.head.querySelector('style')).toBe(null);
  expect(target().dataset.elementalProbe).toBe(undefined);
  expect(observed).toEqual([]);
});

test('unwatching a viewport query drops the listener and leaves the browser its list', () => {
  let removed = null;
  const mql = { matches: false, addEventListener() {}, removeEventListener: (type, fn) => { removed = fn; } };
  window.matchMedia = () => mql;
  const listener = () => {};
  expect(unwatchQuery(watchQuery(target(), '(min-width: 30rem)'), listener)).toBe(null);
  expect(removed).toBe(listener);
  delete window.matchMedia;
});
