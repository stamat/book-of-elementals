/**
 * The wiring this element exists for: the debounce, the one `AbortController` per query, the
 * sequence number that drops the slow answer to the query before last, the `data-state` a
 * spinner hangs off, and the live region a panel filling itself does not meet 4.1.3 without.
 *
 * `index.test.js` pins `searchAction`, `searchStatus` and `searchOpen`, which are the decisions.
 * This file is the machinery around them — and every bug it is guarding against is a timing one,
 * so it is the half the pure tests structurally cannot reach.
 *
 * Deliberately not covered: fetching, which the element deliberately does not do — the page
 * hands back a promise and these tests hand back promises they control. What a screen reader
 * does with the live region is a screen reader's business; what is checked here is that the text
 * lands in a region that exists, and lands again for a repeated answer.
 *
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';

import './index.js';

const MARKUP = `
  <search-elemental>
    <form action="/search">
      <input type="search" name="q">
      <a href="/advanced">Advanced search</a>
    </form>
    <suggest-elemental for="q"><ul></ul></suggest-elemental>
  </search-elemental>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('search-elemental');
}

const field = (search) => search.querySelector('input');
const panel = (search) => search.querySelector('suggest-elemental');
const status = (search) => search.querySelector('.search-elemental-status');

/** Type into the field the way a reader does: the value, then the event the field fires. */
function type (search, value) {
  field(search).value = value;
  field(search).dispatchEvent(new Event('input', { bubbles: true }));
}

/** Fill the panel with `count` results, as the page's own listener would. */
function fill (search, count) {
  panel(search).querySelector('ul').innerHTML =
    Array.from({ length: count }, (_, i) => `<li><a href="/p/${i}">Package ${i}</a></li>`).join('');
}

/** Let the promises the element chained settle, then let the announce timer fire. */
async function settled () {
  for (let i = 0; i < 4; i++) await Promise.resolve();
  jest.advanceTimersByTime(0);
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('the element upgrades over the form the author wrote and adds a live region to it', () => {
  const search = mount();
  expect(search.constructor.name).toBe('SearchElemental');
  expect(status(search).getAttribute('role')).toBe('status');
  expect(search.dataset.state).toBe('idle');
});

test('a query waits for the typing to stop, and then goes out once', () => {
  const search = mount();
  const asked = [];
  search.addEventListener('search-query', (e) => asked.push(e.detail.query));

  type(search, 'e');
  type(search, 'el');
  type(search, 'ele');
  jest.advanceTimersByTime(199);
  expect(asked).toEqual([]);
  jest.advanceTimersByTime(1);
  expect(asked).toEqual(['ele']);
});

test('the query is what the field holds when the wait ends, not what it held at the start', () => {
  // Closed over at the start, every search is one keystroke behind.
  const search = mount();
  const asked = [];
  search.addEventListener('search-query', (e) => asked.push(e.detail.query));
  type(search, 'el');
  field(search).value = 'elemental';
  jest.advanceTimersByTime(200);
  expect(asked).toEqual(['elemental']);
});

test('the delay is the page\'s to set, and an empty attribute is not a delay of zero', () => {
  const quick = mount(MARKUP.replace('<search-elemental>', '<search-elemental delay="50">'));
  const asked = [];
  quick.addEventListener('search-query', (e) => asked.push(e.detail.query));
  type(quick, 'ele');
  jest.advanceTimersByTime(50);
  expect(asked).toEqual(['ele']);

  const blank = mount(MARKUP.replace('<search-elemental>', '<search-elemental delay="">'));
  const later = [];
  blank.addEventListener('search-query', (e) => later.push(e.detail.query));
  type(blank, 'ele');
  jest.advanceTimersByTime(199);
  expect(later).toEqual([]);
  jest.advanceTimersByTime(1);
  expect(later).toEqual(['ele']);
});

test('too few characters sends nothing and takes the results down', () => {
  // A panel left standing is an answer to a question no longer being asked.
  const search = mount(MARKUP.replace('<search-elemental>', '<search-elemental min="2">'));
  const asked = [];
  search.addEventListener('search-query', (e) => {
    asked.push(e.detail.query);
    fill(search, 3);
  });
  type(search, 'el');
  jest.advanceTimersByTime(200);
  expect(panel(search).hasAttribute('open')).toBe(true);

  type(search, 'e');
  expect(search.dataset.state).toBe('idle');
  expect(panel(search).hasAttribute('open')).toBe(false);
  jest.advanceTimersByTime(200);
  expect(asked).toEqual(['el']);
});

test('a query the reader has only added whitespace to is the one already answered', () => {
  const search = mount();
  const asked = [];
  search.addEventListener('search-query', (e) => asked.push(e.detail.query));
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  type(search, 'ele  ');
  jest.advanceTimersByTime(200);
  expect(asked).toEqual(['ele']);
});

test('a page that fills the panel while the listener runs gets no loading state at all', async () => {
  // An index the page already had, a filter over the DOM. There is nothing to draw a spinner for
  // and nothing to wait for.
  const search = mount();
  const seen = [];
  search.addEventListener('search-query', () => {
    seen.push(search.dataset.state);
    fill(search, 5);
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  expect(search.dataset.state).toBe('results');
  expect(seen).toEqual(['idle']);
});

test('a page that hands back a promise gets the loading state, on the element and on the panel', async () => {
  const search = mount();
  let resolve;
  search.addEventListener('search-query', (e) => e.detail.wait(new Promise((r) => { resolve = r; })));
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  expect(search.dataset.state).toBe('pending');
  expect(panel(search).getAttribute('aria-busy')).toBe('true');

  fill(search, 2);
  resolve();
  await settled();
  expect(search.dataset.state).toBe('results');
  expect(panel(search).hasAttribute('aria-busy')).toBe(false);
});

test('results open the panel and are counted out loud', async () => {
  const search = mount();
  search.addEventListener('search-query', (e) => {
    fill(search, 5);
    e.detail.wait(Promise.resolve());
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  await settled();
  expect(panel(search).hasAttribute('open')).toBe(true);
  expect(status(search).textContent).toBe('5 results');
});

test('one result is one result, which is the bug this exists not to ship', async () => {
  const search = mount();
  search.addEventListener('search-query', (e) => {
    fill(search, 1);
    e.detail.wait(Promise.resolve());
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  await settled();
  expect(status(search).textContent).toBe('1 result');
});

test('the same count twice still announces, because the region is cleared in between', async () => {
  const search = mount();
  search.addEventListener('search-query', (e) => {
    fill(search, 3);
    e.detail.wait(Promise.resolve());
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  await settled();
  expect(status(search).textContent).toBe('3 results');

  type(search, 'elem');
  jest.advanceTimersByTime(200);
  for (let i = 0; i < 4; i++) await Promise.resolve();
  expect(status(search).textContent).toBe('');
  jest.advanceTimersByTime(0);
  expect(status(search).textContent).toBe('3 results');
});

test('an emptied panel is closed, and a page that wrote its own empty state keeps it open', async () => {
  const search = mount();
  search.addEventListener('search-query', (e) => e.detail.wait(Promise.resolve()));
  type(search, 'wombat');
  jest.advanceTimersByTime(200);
  await settled();
  expect(search.dataset.state).toBe('empty');
  expect(panel(search).hasAttribute('open')).toBe(false);
  expect(status(search).textContent).toBe('No results');

  panel(search).querySelector('ul').innerHTML = '<li>No packages match wombat</li>';
  type(search, 'wombats');
  jest.advanceTimersByTime(200);
  await settled();
  expect(panel(search).hasAttribute('open')).toBe(true);
});

test('a failed search says so and never leaves the query before last on screen', async () => {
  const search = mount();
  let reject;
  search.addEventListener('search-query', (e) => {
    fill(search, 4);
    e.detail.wait(new Promise((_, r) => { reject = r; }));
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  reject(new Error('offline'));
  await settled();
  expect(search.dataset.state).toBe('error');
  expect(panel(search).hasAttribute('open')).toBe(false);
  expect(status(search).textContent).toBe('Search failed');
});

test('a page calling its own search off is not a failure, and leaves no spinner turning', async () => {
  const search = mount();
  let reject;
  search.addEventListener('search-query', (e) => e.detail.wait(new Promise((_, r) => { reject = r; })));
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  const abort = new Error('aborted');
  abort.name = 'AbortError';
  reject(abort);
  await settled();
  expect(search.dataset.state).toBe('idle');
  expect(status(search).textContent).toBe('');
});

test('a newer query gets its own signal, and the old one is aborted', () => {
  const search = mount();
  const signals = [];
  search.addEventListener('search-query', (e) => {
    signals.push(e.detail.signal);
    e.detail.wait(new Promise(() => {}));
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  type(search, 'elem');
  jest.advanceTimersByTime(200);
  expect(signals).toHaveLength(2);
  expect(signals[0].aborted).toBe(true);
  expect(signals[1].aborted).toBe(false);
});

test('the slow answer to the query before last does not land on top of the newer one', async () => {
  // Two requests in flight settle in whatever order the network feels like. The sequence number
  // is what makes it not matter whether the page honoured the abort.
  const search = mount();
  const waits = [];
  search.addEventListener('search-query', (e) => {
    let resolve;
    e.detail.wait(new Promise((r) => { resolve = r; }));
    waits.push(resolve);
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  type(search, 'elem');
  jest.advanceTimersByTime(200);

  fill(search, 2);
  waits[1]();
  await settled();
  expect(status(search).textContent).toBe('2 results');

  fill(search, 9);
  waits[0]();
  await settled();
  expect(status(search).textContent).toBe('2 results');
  expect(search.dataset.state).toBe('results');
});

test('clearing the field calls off the query already in flight', async () => {
  // The reader has deleted what those results were for. A request still running for it is a
  // panel about to refill itself behind them.
  const search = mount(MARKUP.replace('<search-elemental>', '<search-elemental min="2">'));
  const signals = [];
  search.addEventListener('search-query', (e) => {
    signals.push(e.detail.signal);
    e.detail.wait(new Promise(() => {}));
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  expect(signals[0].aborted).toBe(false);

  type(search, 'e');
  expect(signals[0].aborted).toBe(true);
});

test('the failure of the query before last does not take down the newer one\'s results', async () => {
  // The abort a newer query asked for arrives as a rejection some time after the newer results
  // are already on screen. Settling on it would clear the answer the reader is reading.
  const search = mount();
  const settlers = [];
  search.addEventListener('search-query', (e) => {
    let resolve, reject;
    e.detail.wait(new Promise((res, rej) => { resolve = res; reject = rej; }));
    settlers.push({ resolve, reject });
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  type(search, 'elem');
  jest.advanceTimersByTime(200);

  fill(search, 2);
  settlers[1].resolve();
  await settled();
  expect(search.dataset.state).toBe('results');

  settlers[0].reject(new Error('offline'));
  await settled();
  expect(search.dataset.state).toBe('results');
  expect(status(search).textContent).toBe('2 results');
});

test('what the region says is the page\'s to write, and `{n}` is where the count goes', async () => {
  const search = mount(MARKUP.replace('<search-elemental>', '<search-elemental results-text="{n} rezultata" empty-text="Nema rezultata" error-text="Pretraga nije uspela">'));
  search.addEventListener('search-query', (e) => e.detail.wait(Promise.resolve()));
  type(search, 'wombat');
  jest.advanceTimersByTime(200);
  await settled();
  expect(status(search).textContent).toBe('Nema rezultata');

  fill(search, 3);
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  await settled();
  expect(status(search).textContent).toBe('3 rezultata');
});

test('the count is the links in the panel, and a link beside the field is not one of them', async () => {
  // The "advanced search" link lives in the form, which is exactly why the form's links are left
  // out of the count.
  const search = mount(MARKUP.replace('<suggest-elemental for="q"><ul></ul></suggest-elemental>', '<ul id="results"></ul>'));
  search.addEventListener('search-query', (e) => {
    document.getElementById('results').innerHTML = '<li><a href="/a">A</a></li><li><a href="/b">B</a></li>';
    e.detail.wait(Promise.resolve());
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  await settled();
  expect(status(search).textContent).toBe('2 results');
});

test('an element with no field in it is left alone', () => {
  const search = mount('<search-elemental><div></div></search-elemental>');
  expect(search.dataset.state).toBeUndefined();
  expect(search.querySelector('.search-elemental-status')).toBe(null);
});

test('an element that has gone stops searching, and takes its in-flight query with it', () => {
  const search = mount();
  const asked = [];
  const signals = [];
  search.addEventListener('search-query', (e) => {
    asked.push(e.detail.query);
    signals.push(e.detail.signal);
    e.detail.wait(new Promise(() => {}));
  });
  type(search, 'ele');
  jest.advanceTimersByTime(200);
  expect(panel(search).getAttribute('aria-busy')).toBe('true');

  search.remove();
  expect(signals[0].aborted).toBe(true);
  // A panel left holding `aria-busy` is claiming it is still loading something nothing will
  // finish.
  expect(panel(search).hasAttribute('aria-busy')).toBe(false);

  type(search, 'elem');
  jest.advanceTimersByTime(200);
  expect(asked).toEqual(['ele']);
});
