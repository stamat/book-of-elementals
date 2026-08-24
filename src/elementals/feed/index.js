import { ElementBase, define } from '../../core.js';

/** Monotonic counter, so a heading has an `id` for its article to point at. */
let feedCount = 0;

/**
 * What Control and End has to land on: the first thing after the feed a reader can stand on.
 *
 * The same list the carousel walks, and for the same reason - this is "focusable" as the
 * platform means it, not as a tab-order calculation would. Each candidate is tried in
 * document order and the first one focus actually lands on wins, which is what settles the
 * ones this selector cannot: a control inside something `hidden`, or one CSS took off the
 * page. Neither has a property to read here; both refuse focus when asked.
 */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';

/** What an article is. A `role="article"` on something else counts: the pattern asks for the
 * role, and a page whose feed items are `<li>`s has already said so. */
const ARTICLE = 'article, [role="article"]';

/** Direct children only: a feed owns articles, and an article nested inside one is its own. */
const ARTICLES = ':scope > article, :scope > [role="article"]';

/**
 * Whose key a press is.
 *
 * Page Up and Page Down are the feed's while the reader is inside it, which is what the
 * pattern trades for the scroll they would otherwise do - the articles are the pages now.
 * Control with an end key is the other half and the more important one: an endless feed a
 * keyboard cannot get past is the bug the pattern exists to answer.
 *
 * The bare `Home` and `End` are not taken. They are the page's, and inside a text field
 * they are the field's - a comment box in a feed is the ordinary case, and a reader typing
 * in one would be thrown out of it mid-word. `Control` with `PageUp` or `PageDown` is not
 * taken either: that is the browser changing tabs.
 *
 * @param {string} key `KeyboardEvent.key`
 * @param {boolean} ctrlKey Whether Control was down with it
 * @returns {"next"|"previous"|"after"|"before"|null} What the press means to the feed, or
 *   null for a key that is not the feed's - which is every key that reads the article the
 *   reader is on.
 * @example
 * feedKey('PageDown', false) // => 'next'
 * feedKey('End', true) // => 'after', out of the feed entirely
 * feedKey('End', false) // => null, the page still has it
 */
export function feedKey(key, ctrlKey) {
  if (ctrlKey) {
    if (key === 'End') return 'after';
    if (key === 'Home') return 'before';
    return null;
  }
  if (key === 'PageDown') return 'next';
  if (key === 'PageUp') return 'previous';
  return null;
}

/**
 * What each article claims the set's size is.
 *
 * `-1` is the pattern's own word for "undetermined", and a feed still loading is exactly
 * that - so a feed nobody told a total says -1 rather than counting what happens to be in
 * the DOM. Announcing "article 10 of 10" to a reader one scroll away from the eleventh is
 * the failure this avoids, and it is a worse one than admitting the size is not known.
 *
 * A total the DOM has already overtaken is a stale number from the page, and it loses to
 * what is actually there for the same reason.
 *
 * @param {string|null} raw The `total` attribute, if the page set one
 * @param {number} loaded How many articles are in the DOM now
 * @returns {number} What to write into `aria-setsize`
 * @example
 * feedSetSize('40', 10) // => 40
 * feedSetSize(null, 10) // => -1
 * feedSetSize('10', 12) // => 12
 */
export function feedSetSize(raw, loaded) {
  if (raw == null || raw.trim() === '') return -1;
  const total = Number(raw);
  if (!Number.isFinite(total) || total <= 0) return -1;
  return total < loaded ? loaded : total;
}

/**
 * `<feed-elemental>` custom element.
 *
 * A stream of articles that keeps growing, per the
 * [APG Feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/).
 *
 * A feed is the one pattern that is a contract rather than a widget: the page promises that
 * each article says where it sits in the set, that the keyboard can walk them and get past
 * them, and that a reader is not read a half-written DOM - and in return a screen reader can
 * keep its browse-mode cursor going through content that arrives as it reads. `role="feed"`
 * alone is not that contract. It is the announcement of one, and
 * [the standing criticism of it](https://www.deque.com/blog/infinite-scrolling-rolefeed-accessibility-issues/)
 * is that pages ship the announcement and none of the rest - so the keyboard is left with
 * content it cannot reach and a footer it can never get to.
 *
 * So this element is the rest, and it refuses the part that earns the criticism:
 *
 * - **It does not fetch.** The page does, the way it does for
 *   [`<search-elemental>`](../search/): `feed-load` hands over a `wait()` and a `signal`,
 *   and whatever the page appends is what the feed indexes. Owning a wire format is owning
 *   an escaping boundary and someone else's API.
 * - **It does not scroll forever.** `auto-load` is a budget, not a switch: how many times
 *   the feed may ask on its own before it stops for good and leaves the reader whatever
 *   button the page put after it. With no `auto-load` there is no sentinel at all, and the
 *   button is the only way on - which is what every critique of infinite scroll asks for.
 *
 * `Control` + `End` is the escape hatch, and it lands on the first focusable thing after the
 * feed. Put the "Load more" button there and the pattern's way out and the way on are the
 * same key.
 *
 * Light DOM, no shadow root. Degrades to what it is: with no script the articles are
 * articles, in order, each readable - a feed that never grows rather than a broken one.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * @tag feed-elemental
 * @attr {number} [auto-load] - How many times the feed may ask for more on its own as the last article comes into view. Absent, or `0`, and it never does: the page's own button is the only way on.
 * @attr {number} [total] - How many articles there are in all, for `aria-setsize`. Absent and each article says `-1`, which is the pattern's word for a set whose size is not known yet.
 *
 * @fires feed-load - The last article came into view, or `load()` was called. `detail.count` is how many articles are loaded now, `detail.signal` an `AbortSignal` that fires if the feed leaves the document, and `detail.wait(promise)` hands the element the work so `aria-busy` covers it.
 *
 * @cssprop {<length>} [--feed-elemental-scroll-margin=1rem] - How far a focused article is kept off the edge of the viewport when the browser scrolls it into view.
 * @cssprop {<length>} [--feed-elemental-gap=1rem] - Between one article and the next.
 * @cssprop {<length>} [--feed-elemental-inset=1rem] - Padding inside an article.
 * @cssprop {<length>} [--feed-elemental-radius=0.375rem] - Corners of an article.
 * @cssprop {<color>} [--feed-elemental-border=color-mix(in srgb, currentcolor 20%, transparent)] - An article's outline.
 *
 * @slot - The articles: `<article>` elements, in reading order. Nothing else - a feed owns articles, and a button between two of them is not one.
 */
export class FeedElemental extends ElementBase {
  static get observedAttributes() {
    return ['auto-load', 'total'];
  }

  /** The articles, in reading order. */
  get articles() {
    return Array.from(this.querySelectorAll(ARTICLES));
  }

  /** How many times the feed may still ask on its own. */
  get autoLoad() {
    const raw = this.getAttribute('auto-load');
    if (raw == null || raw.trim() === '') return 0;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.budget = this.autoLoad;
    this.pending = false;

    this.setAttribute('role', 'feed');

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onIntersect = this.onIntersect.bind(this);
    this.addEventListener('keydown', this.onKeyDown);

    // Articles arriving after upgrade is not the exotic case here, it is the whole point of
    // the element - so nothing has to call a refresh, and forgetting one cannot leave the
    // newest articles outside the set the feed reports.
    this.observer = new MutationObserver(() => this.wire());
    this.observer.observe(this, { childList: true });

    this.wire();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;

    if (this.observer) this.observer.disconnect();
    this.observer = null;
    if (this.sentinel) this.sentinel.disconnect();
    this.sentinel = null;
    this.watched = null;
    if (this.controller) this.controller.abort();
    this.controller = null;
    this.pending = false;

    this.removeEventListener('keydown', this.onKeyDown);

    // Everything written comes off. A `role="feed"` with nothing driving it is the half-fix
    // this element exists not to be, and a `tabindex="0"` left on an article is a tab stop
    // the author never wrote. The names stay: `aria-labelledby` pointing at the article's
    // own heading is true whether or not this element is here.
    this.removeAttribute('role');
    this.removeAttribute('aria-busy');
    for (const item of this.articles) {
      item.removeAttribute('tabindex');
      item.removeAttribute('aria-posinset');
      item.removeAttribute('aria-setsize');
    }
  }

  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    // A budget set again is a budget given again - the page saying "keep going" after the
    // feed stopped, which is the only reason to touch the attribute twice.
    if (name === 'auto-load') this.budget = this.autoLoad;
    this.wire();
  }

  /**
   * Say where every article sits, name it, and point the sentinel at the last one.
   *
   * Runs on every change to the feed's children, so it is written to be idempotent: the same
   * DOM in gives the same attributes out, and an article that already has them keeps them.
   */
  wire() {
    const items = this.articles;
    const size = String(feedSetSize(this.getAttribute('total'), items.length));

    items.forEach((item, at) => {
      item.tabIndex = 0;
      item.setAttribute('aria-posinset', String(at + 1));
      item.setAttribute('aria-setsize', size);
      this.name(item);
    });

    this.watch(items[items.length - 1]);
  }

  /**
   * Tie an article to its own heading.
   *
   * An article announced as "article 2 of 40" and nothing else is a row of numbers to read
   * past. The heading is already the name the page wrote; this only points at it, and where
   * there is no heading the article is left unnamed rather than named something invented -
   * a name taken off the first sentence of the body would be a summary this element is in
   * no position to write.
   *
   * `aria-describedby` is the pattern's other recommendation and is not written here: which
   * node is the article's primary content is the page's to say, and guessing it wrong reads
   * the wrong paragraph to every reader.
   */
  name(item) {
    if (item.hasAttribute('aria-label') || item.hasAttribute('aria-labelledby')) return;
    const heading = item.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (!heading) return;
    if (!heading.id) heading.id = 'feed-elemental-' + (++feedCount);
    item.setAttribute('aria-labelledby', heading.id);
  }

  /**
   * Watch the last article, while there is budget left to answer with.
   *
   * The observer is torn down the moment the budget runs out rather than left running with
   * nothing to do, which is also what makes "it has stopped asking" observable from the
   * outside instead of a counter nobody can see.
   */
  watch(last) {
    if (!last || this.budget <= 0 || typeof IntersectionObserver === 'undefined') {
      if (this.sentinel) this.sentinel.disconnect();
      this.sentinel = null;
      this.watched = null;
      return;
    }

    if (!this.sentinel) this.sentinel = new IntersectionObserver(this.onIntersect);
    if (this.watched === last) return;
    if (this.watched) this.sentinel.unobserve(this.watched);
    this.sentinel.observe(last);
    this.watched = last;
  }

  onIntersect(entries) {
    // Both gates before the budget is touched: an arrival that cannot be answered - because
    // the last ask is still out, or because there is nothing left to spend - must not spend
    // anything. The reader scrolling away and back is one intersection each way, and paying
    // for the ones that go nowhere is how a budget of three buys one page.
    if (this.pending || this.budget <= 0) return;
    if (!entries.some((entry) => entry.isIntersecting)) return;
    this.budget--;
    this.load();
  }

  /**
   * Ask the page for more.
   *
   * Public, because the button after the feed and the sentinel are asking the same question
   * and there is no reason for the page to answer it in two places. The budget is the
   * sentinel's alone: a press is a reader asking, and a reader asking is never the thing
   * that needed bounding.
   */
  load() {
    // One page of results at a time. A second ask while one is in flight is the same page
    // twice, appended twice.
    if (this.pending) return;
    this.pending = true;
    this.setAttribute('aria-busy', 'true');

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    this.controller = controller;

    let waited = null;
    this.dispatchEvent(new CustomEvent('feed-load', {
      bubbles: true,
      detail: {
        count: this.articles.length,
        signal: controller ? controller.signal : null,
        wait: (promise) => { waited = promise; }
      }
    }));

    // Nothing was handed back, so the page appended while the listener ran - a next page it
    // already had. There is nothing to wait for and no busy state to leave behind.
    if (!waited) {
      this.settle();
      return;
    }

    Promise.resolve(waited).then(
      () => this.settle(),
      () => {
        // A feed that keeps asking a failing endpoint every time the reader scrolls is a
        // retry loop nobody asked for. The sentinel gives up; the button after the feed
        // still works, which is the reader back in control rather than out of options.
        this.budget = 0;
        this.settle();
      }
    );
  }

  /** The load is over, however it went: index whatever arrived and stop claiming to be busy. */
  settle() {
    this.pending = false;
    this.controller = null;
    this.removeAttribute('aria-busy');
    if (this.initialized) this.wire();
  }

  onKeyDown(e) {
    const action = feedKey(e.key, e.ctrlKey);
    if (!action) return;

    if (action === 'after' || action === 'before') {
      if (this.escape(action === 'after')) e.preventDefault();
      return;
    }

    const items = this.articles;
    const item = e.target.closest ? e.target.closest(ARTICLE) : null;
    const at = items.indexOf(item);
    // A key pressed inside the feed but not inside one of its articles belongs to whatever
    // that is - the paging keys are only the feed's while the reader is reading it.
    if (at === -1) return;

    const to = action === 'next' ? at + 1 : at - 1;
    // The ends do not wrap. Running off one is not how you leave a feed - Control and End
    // is - and one that looped would be one a reader can walk forever without noticing.
    if (to < 0 || to >= items.length) return;

    e.preventDefault();
    items[to].focus();
  }

  /**
   * Put focus outside the feed, on the nearest thing that will take it.
   *
   * Tried in document order until focus actually lands, because "focusable" is the
   * platform's answer and not this selector's: a control inside a `hidden` subtree or one
   * CSS moved off the page matches every selector going and refuses focus when asked. Where
   * nothing takes it the key is handed back to the browser, which still has its own meaning
   * for it, rather than swallowed into nothing happening.
   *
   * @param {boolean} after Whether to look after the feed rather than before it
   * @returns {boolean} Whether focus moved
   */
  escape(after) {
    const position = after ? this.DOCUMENT_POSITION_FOLLOWING : this.DOCUMENT_POSITION_PRECEDING;
    const outside = Array.from(document.querySelectorAll(FOCUSABLE))
      .filter((element) => !this.contains(element) && (this.compareDocumentPosition(element) & position));
    if (!after) outside.reverse();

    for (const element of outside) {
      element.focus();
      if (document.activeElement === element) return true;
    }
    return false;
  }
}

define('feed-elemental', FeedElemental);
