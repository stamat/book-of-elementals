/**
 * The wiring: the roles, the position each article claims in a set that keeps growing, the
 * name taken off its own heading, the keys that walk it and the two that leave it, and the
 * one load in flight `aria-busy` is on for.
 *
 * `index.test.js` pins `feedKey` and `feedSetSize`, which are the decisions. This file is
 * what happens around them, and the half a pure test structurally cannot reach: focus, and
 * a set whose size changes underneath the reader.
 *
 * jsdom has no `IntersectionObserver`, so the sentinel is driven here by a stub that says
 * "the last article came into view" on demand — which is the only thing the element listens
 * for. What that stub cannot answer is whether the real one fires at all: that is layout,
 * and it belongs to `script/a11y` over the built demo. What is checked here is the part the
 * bound is for — that a spent budget stops asking.
 *
 * Deliberately not covered: scrolling a focused article into view, which is `focus()`'s own
 * doing in a browser and nothing at all in jsdom; and what a screen reader does with
 * `role="feed"` in browse mode, which is a screen reader's business.
 *
 * @jest-environment jsdom
 */

import './index.js';

/** Says the last article came into view. The element observes one target at a time. */
class FakeIntersectionObserver {
  static instances = [];

  constructor (callback) {
    this.callback = callback;
    this.targets = new Set();
    FakeIntersectionObserver.instances.push(this);
  }

  observe (target) { this.targets.add(target); }
  unobserve (target) { this.targets.delete(target); }
  disconnect () { this.targets.clear(); }

  arrive () {
    this.callback(Array.from(this.targets).map((target) => ({ target, isIntersecting: true })));
  }
}

globalThis.IntersectionObserver = FakeIntersectionObserver;


const MARKUP = `
  <a href="#before">Skip to reviews</a>
  <feed-elemental aria-label="Reviews">
    <article><h3>Gino's</h3><p>Thin crust, long queue.</p></article>
    <article><h3>La Bella</h3><p><a href="#menu">The menu</a> is short.</p></article>
    <article><h3>Kod Mije</h3><p>Ćevapi, and nothing else.</p></article>
  </feed-elemental>
  <button type="button" id="more">Load more</button>`;

function mount (markup = MARKUP) {
  FakeIntersectionObserver.instances = [];
  document.body.innerHTML = markup;
  return document.querySelector('feed-elemental');
}

function articles (feed) {
  return Array.from(feed.querySelectorAll(':scope > article'));
}

function press (target, key, options = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  target.dispatchEvent(event);
  return event;
}

function article (name, body = 'Nothing to report.') {
  return `<article><h3>${name}</h3><p>${body}</p></article>`;
}

/** A MutationObserver callback is a microtask; nothing it does has happened yet on the line after. */
const settled = () => Promise.resolve();

test('the element upgrades over the articles the author wrote and calls itself a feed', () => {
  const feed = mount();
  expect(feed.constructor.name).toBe('FeedElemental');
  expect(feed.getAttribute('role')).toBe('feed');
});

test('every article is focusable and says where it sits in the set', () => {
  const feed = mount();
  expect(articles(feed).map((item) => item.getAttribute('tabindex'))).toEqual(['0', '0', '0']);
  expect(articles(feed).map((item) => item.getAttribute('aria-posinset'))).toEqual(['1', '2', '3']);
});

// A feed nobody told a total is a feed still loading, and the pattern's word for that is -1.
test('the set size is undetermined until the page says otherwise', () => {
  const feed = mount();
  expect(articles(feed).map((item) => item.getAttribute('aria-setsize'))).toEqual(['-1', '-1', '-1']);

  feed.setAttribute('total', '40');
  expect(articles(feed).map((item) => item.getAttribute('aria-setsize'))).toEqual(['40', '40', '40']);
});

// An article announced as "article 2 of 40" and nothing else is a row of numbers to a screen
// reader in browse mode. The heading is already the name; this only ties it on.
test('an article takes its name from its own heading, which is given an id if it has none', () => {
  const feed = mount();
  const [first] = articles(feed);
  const heading = first.querySelector('h3');
  expect(heading.id).toBeTruthy();
  expect(first.getAttribute('aria-labelledby')).toBe(heading.id);
});

test('an article that already has a name keeps the one the author gave it', () => {
  const feed = mount(`
    <feed-elemental aria-label="Reviews">
      <article aria-label="A review of Gino's"><h3>Gino's</h3></article>
      <article aria-labelledby="mine"><h3 id="mine">La Bella</h3></article>
    </feed-elemental>`);
  const [labelled, pointed] = articles(feed);
  expect(labelled.getAttribute('aria-labelledby')).toBe(null);
  expect(pointed.getAttribute('aria-labelledby')).toBe('mine');
});

test('an article with no heading is left unnamed rather than named something invented', () => {
  const feed = mount(`
    <feed-elemental aria-label="Reviews">
      <article><p>Just a paragraph.</p></article>
    </feed-elemental>`);
  const [only] = articles(feed);
  expect(only.getAttribute('aria-labelledby')).toBe(null);
  expect(only.getAttribute('aria-posinset')).toBe('1');
});

test('Page Down and Page Up walk from article to article', () => {
  const feed = mount();
  const [first, second] = articles(feed);
  first.focus();

  expect(press(first, 'PageDown').defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(second);

  expect(press(second, 'PageUp').defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(first);
});

// The reader is inside a link in the second article, not on the article itself, which is
// where a feed is read from - the key is still the feed's.
test('paging works from wherever inside an article the reader is standing', () => {
  const feed = mount();
  const [, second, third] = articles(feed);
  const link = second.querySelector('a[href]');
  link.focus();

  press(link, 'PageDown');
  expect(document.activeElement).toBe(third);
});

// Running off the end is not how you leave a feed - Control and End is - and a feed that
// wrapped would be one a reader can walk forever without noticing they had.
test('the ends of the feed do not wrap, and the page keeps the key', () => {
  const feed = mount();
  const [first, , last] = articles(feed);

  last.focus();
  expect(press(last, 'PageDown').defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(last);

  first.focus();
  expect(press(first, 'PageUp').defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(first);
});

// The whole of what the pattern buys a keyboard: content that keeps growing under you, and
// one press that is still guaranteed to get you past it.
test('Control and End lands on the first focusable thing after the feed', () => {
  const feed = mount();
  const [first] = articles(feed);
  first.focus();

  expect(press(first, 'End', { ctrlKey: true }).defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(document.getElementById('more'));
});

test('Control and Home lands on the first focusable thing before it', () => {
  const feed = mount();
  const [, second] = articles(feed);
  second.focus();

  press(second, 'Home', { ctrlKey: true });
  expect(document.activeElement).toBe(document.querySelector('a[href="#before"]'));
});

test('with nothing after the feed the key is left to the browser', () => {
  const feed = mount(`
    <feed-elemental aria-label="Reviews">
      ${article("Gino's")}
    </feed-elemental>`);
  const [only] = articles(feed);
  only.focus();
  expect(press(only, 'End', { ctrlKey: true }).defaultPrevented).toBe(false);
});

// Articles arriving after upgrade is the case the element exists for, so nothing has to call
// a refresh - forgetting one would be a feed whose newest articles are not in the set it
// reports.
test('articles appended after upgrade are counted into the set', async () => {
  const feed = mount();
  feed.insertAdjacentHTML('beforeend', article('Novi'));
  await settled();

  expect(articles(feed).map((item) => item.getAttribute('aria-posinset'))).toEqual(['1', '2', '3', '4']);
  expect(articles(feed)[3].getAttribute('aria-labelledby')).toBeTruthy();
});

test('load() asks the page for more and is busy until the page is done', async () => {
  const feed = mount();
  let resolve;
  const seen = [];
  feed.addEventListener('feed-load', (event) => {
    seen.push(event.detail.count);
    event.detail.wait(new Promise((done) => { resolve = done; }));
  });

  feed.load();
  expect(seen).toEqual([3]);
  expect(feed.getAttribute('aria-busy')).toBe('true');

  // A second ask while one is in flight is the same page of results twice over.
  feed.load();
  expect(seen).toEqual([3]);

  feed.insertAdjacentHTML('beforeend', article('Novi'));
  resolve();
  await settled();
  await settled();
  expect(feed.getAttribute('aria-busy')).toBe(null);
  expect(articles(feed)[3].getAttribute('aria-posinset')).toBe('4');
});

// A page that filled the feed from something it already had has nothing to wait for, and a
// spinner nobody will stop is worse than none.
test('a page that hands back no promise is never left busy', () => {
  const feed = mount();
  feed.addEventListener('feed-load', (event) => {
    event.target.insertAdjacentHTML('beforeend', article('Novi'));
  });

  feed.load();
  expect(feed.getAttribute('aria-busy')).toBe(null);
});

test('a load that fails leaves the feed idle and stops it asking on its own', async () => {
  const feed = mount(`
    <feed-elemental aria-label="Reviews" auto-load="3">
      ${article("Gino's")}
    </feed-elemental>`);
  let asks = 0;
  feed.addEventListener('feed-load', (event) => {
    asks++;
    event.detail.wait(Promise.reject(new Error('offline')));
  });

  const [sentinel] = FakeIntersectionObserver.instances;
  sentinel.arrive();
  await settled();
  await settled();

  expect(feed.getAttribute('aria-busy')).toBe(null);
  sentinel.arrive();
  expect(asks).toBe(1);
});

// The bound is the point: auto-load is how many times the feed may ask on its own before it
// stops for good and leaves the reader the button. Without it, a feed loads for as long as
// someone keeps scrolling.
test('auto-load spends a budget and then stops asking', async () => {
  const feed = mount(`
    <feed-elemental aria-label="Reviews" auto-load="2">
      ${article("Gino's")}
    </feed-elemental>`);
  let asks = 0;
  feed.addEventListener('feed-load', (event) => {
    asks++;
    event.target.insertAdjacentHTML('beforeend', article('Novi ' + asks));
  });

  const [sentinel] = FakeIntersectionObserver.instances;
  for (let i = 0; i < 5; i++) {
    sentinel.arrive();
    await settled();
  }

  expect(asks).toBe(2);
  // The button still works: the budget is the sentinel's, not the reader's.
  feed.load();
  expect(asks).toBe(3);
});

// The reader scrolling away from the last article and back is one intersection each way,
// and the ask that lands while the page is still answering the first cannot be paid for.
test('an arrival while a load is in flight spends nothing', async () => {
  const feed = mount(`
    <feed-elemental aria-label="Reviews" auto-load="2">
      ${article("Gino's")}
    </feed-elemental>`);
  let asks = 0;
  let resolve;
  feed.addEventListener('feed-load', (event) => {
    asks++;
    event.detail.wait(new Promise((done) => { resolve = done; }));
  });

  const [sentinel] = FakeIntersectionObserver.instances;
  sentinel.arrive();
  sentinel.arrive();
  expect(asks).toBe(1);

  resolve();
  await settled();
  await settled();

  sentinel.arrive();
  expect(asks).toBe(2);
});

test('a feed with no auto-load never asks on its own', () => {
  mount();
  expect(FakeIntersectionObserver.instances).toEqual([]);
});

test('everything the element wrote comes off when it goes', () => {
  const feed = mount();
  const items = articles(feed);
  feed.remove();

  expect(feed.getAttribute('role')).toBe(null);
  for (const item of items) {
    expect(item.getAttribute('tabindex')).toBe(null);
    expect(item.getAttribute('aria-posinset')).toBe(null);
    expect(item.getAttribute('aria-setsize')).toBe(null);
  }
});

