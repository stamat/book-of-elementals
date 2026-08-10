import { ElementBase, define } from '../../core.js';

/** How long the field has to stop changing before a query goes out. */
const DELAY_MS = 200;

/** How many characters have to be there before one goes out at all. */
const MIN_LENGTH = 1;

/**
 * What the field's current contents mean: send a query, do nothing, or take the results
 * down.
 *
 * Three answers rather than two, because "nothing to send" splits. A query identical to
 * the one already answered is `idle` - the results on screen are its answer, and sending
 * it again would replace them with themselves. A query under the minimum is `clear` - the
 * reader has deleted what those results were for, and a panel left standing is an answer
 * to a question no longer being asked.
 *
 * The ends are trimmed before anything is measured or compared: trailing whitespace is not
 * a new query, and a space is not a character worth searching for.
 *
 * @param {string} value What is in the field.
 * @param {number} min How many characters a query needs. `0` sends the empty one.
 * @param {string|null} last The query already answered, or `null` for none.
 * @returns {"query"|"idle"|"clear"}
 * @example
 * searchAction('re', 2, null) // => 'query'
 * searchAction('r', 2, null) // => 'clear'
 * searchAction('re ', 2, 're') // => 'idle'
 */
export function searchAction(value, min, last) {
  const query = String(value == null ? '' : value).trim();
  if (query.length < min) return 'clear';
  if (query === last) return 'idle';
  return 'query';
}

/**
 * What a settled search says in the live region.
 *
 * [WCAG 2.2 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
 * is the whole reason this string exists: results appearing in a panel is a change a
 * sighted reader sees and a screen reader user is told nothing about, and a search that
 * found nothing is the one they most need to hear.
 *
 * A search still in flight says nothing. The loader is for the eye - a polite region
 * announcing "Searching…" on every keystroke is a reader listening to their own typing,
 * and the answer is a second or so behind it anyway.
 *
 * The default is English and handles the one plural English has, because "1 results" is
 * the bug this exists not to ship. Any other language sets the labels, and `{n}` is
 * substituted wherever it appears - a language whose plural needs more than one form
 * wants a label set per query from JS, which is why this takes the strings rather than
 * owning them.
 *
 * @param {"idle"|"pending"|"results"|"empty"|"error"} state
 * @param {number} count How many answers landed.
 * @param {{results?: string|null, empty?: string|null, error?: string|null}} labels
 * @returns {string} The announcement, or `''` for the states that make none.
 * @example
 * searchStatus('results', 5, {}) // => '5 results'
 * searchStatus('results', 1, {}) // => '1 result'
 * searchStatus('results', 3, { results: '{n} rezultata' }) // => '3 rezultata'
 */
export function searchStatus(state, count, labels) {
  const strings = labels || {};
  if (state === 'results') {
    if (strings.results) return strings.results.replace(/\{n\}/g, count);
    return count === 1 ? '1 result' : count + ' results';
  }
  if (state === 'empty') return strings.empty || 'No results';
  if (state === 'error') return strings.error || 'Search failed';
  return '';
}

/**
 * Read a whole number off an attribute, or fall back.
 *
 * An absent attribute and an empty one are both "not set" - `Number('')` is `0`, and a
 * `min=""` silently meaning "search on every empty field" is the kind of quiet wrong this
 * book does not ship.
 */
function readNumber(raw, fallback) {
  if (raw == null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/**
 * `<search-elemental>` custom element.
 *
 * The query half of a search field: the debounce, the abort, the loading state and the
 * announcement. [`<suggest-elemental>`](../suggest/) owns the panel those results land in
 * and says outright that it has no opinion about where they came from - this is the other
 * side of that seam, and it has no opinion about the results either.
 *
 * There is no APG pattern here, because there is no widget. The panel is a
 * [combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and belongs to the other
 * element; what is left is the part every search field re-implements and gets subtly
 * wrong: a debounce, one `AbortController` per query, the sequence number that drops the
 * slow answer arriving after the fast one, and
 * [WCAG 2.2 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html),
 * which a panel silently filling itself does not meet.
 *
 * **It does not fetch.** The page does, and hands back the promise:
 *
 * ```js
 * search.addEventListener('search-query', (e) => {
 *   e.detail.wait(
 *     fetch(url + encodeURIComponent(e.detail.query), { signal: e.detail.signal })
 *       .then((response) => response.json())
 *       .then((rows) => list.replaceChildren(...rows.map(toRow)))
 *   );
 * });
 * ```
 *
 * `wait()` is what buys the loading state: without it the element settles the moment the
 * listener returns, which is right for a page filtering an index it already has, and there
 * is nothing to draw a spinner for. That is the degradation and it is honest in both
 * directions - a page that never calls it is never left with a spinner nothing will stop.
 *
 * Light DOM, no shadow root. One node is added, the live region, because a live region has
 * to be in the document before the text lands in it. With no script the `<form>` inside
 * submits to its `action` and the reader gets a search page - which is why the markup is a
 * form and not a bare input.
 *
 * ponytail: no `src`, no result-shape mapping, no cache, no keyboard shortcut to focus the
 * field. Owning a wire format is owning an escaping boundary and someone else's API; `⌘K`
 * is a page-level binding and belongs to the page that knows what else is bound.
 *
 * @tag search-elemental
 * @attr {number} [delay=200] - Milliseconds the field has to stop changing before a query goes out.
 * @attr {number} [min=1] - Characters needed before one goes out at all. `0` sends the empty query too, which is what a field cleared back to nothing sends.
 * @attr {string} [results-label] - What the live region announces on a hit. `{n}` is the count. Default: `5 results`, `1 result`.
 * @attr {string} [empty-label=No results] - What it announces when nothing matched.
 * @attr {string} [error-label=Search failed] - What it announces when the request failed.
 *
 * @cssprop {<length>} [--search-elemental-spinner-size=1rem] - Both axes of the spinner the theme draws while a query is out.
 * @cssprop {<length>} [--search-elemental-spinner-inset-inline=0.75rem] - How far the spinner sits from the inline end of the element.
 * @cssprop {<length>} [--search-elemental-spinner-inset-block=0.75rem] - How far it sits from the block end, which is the bottom of the field.
 * @cssprop {<color>} [--search-elemental-spinner-color=currentcolor at 45%] - The moving part of it; the track is the same colour at a third of that.
 * @cssprop {<time>} [--search-elemental-spinner-duration=0.7s] - One turn. `prefers-reduced-motion` replaces the turning with a fade.
 *
 * @fires search-query - `detail.query` is what to search for, `detail.signal` an `AbortSignal` that fires when a newer query replaces this one, and `detail.wait(promise)` hands the element the work so it can show a loading state.
 *
 * @slot - The `<form>` holding the field, and the `<suggest-elemental>` its results go into.
 */
export class SearchElemental extends ElementBase {
  /** The field being typed in: the first `<input>` inside. */
  get field() {
    return this.querySelector('input');
  }

  /** Where results land. Counting the links in it is how the element knows what to
   * announce, so this is a DOM query and not a call into the other element - a page that
   * loaded this bundle and not that one still gets its states and its announcement. */
  get panel() {
    return this.querySelector('suggest-elemental');
  }

  /** The live region. Added at upgrade, because a live region only announces text that
   * lands in one already in the document. */
  get status() {
    return this.querySelector(':scope > .search-elemental-status');
  }

  /** Milliseconds the field has to stop changing before a query goes out. */
  get delay() {
    return readNumber(this.getAttribute('delay'), DELAY_MS);
  }

  /** Characters needed before one goes out at all. */
  get min() {
    return readNumber(this.getAttribute('min'), MIN_LENGTH);
  }

  /** What the live region says, in the page's own words where it gave any. */
  get labels() {
    return {
      results: this.getAttribute('results-label'),
      empty: this.getAttribute('empty-label'),
      error: this.getAttribute('error-label')
    };
  }

  connectedCallback() {
    if (this.initialized) return;
    // No field is markup that has not been parsed yet, or a wrapper around something else
    // entirely. Either way there is nothing to listen to, and no state to claim.
    const field = this.field;
    if (!field) return;

    this.initialized = true;
    this.sequence = 0;
    this.last = null;

    if (!this.status) {
      const status = document.createElement('span');
      status.className = 'search-elemental-status';
      // `status` rather than `alert`: the reader asked for these results and is not being
      // interrupted with them, so it waits for a gap in what is already being read.
      status.setAttribute('role', 'status');
      this.appendChild(status);
    }

    this.onInput = this.onInput.bind(this);
    field.addEventListener('input', this.onInput);
    this.dataset.state = 'idle';
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;

    const field = this.field;
    if (field) field.removeEventListener('input', this.onInput);
    this.cancel();
    clearTimeout(this.announceTimer);

    // A panel left holding `aria-busy` is a panel claiming it is still loading something
    // that nothing is going to finish.
    const panel = this.panel;
    if (panel) panel.removeAttribute('aria-busy');
  }

  /** Stop whatever is in flight: the query that has not gone out yet, and the one that
   * has. Both, because a keystroke lands in one of those two windows and never says
   * which. */
  cancel() {
    clearTimeout(this.timer);
    if (this.controller) this.controller.abort();
    this.controller = null;
  }

  /**
   * Write the state onto the element, and onto the panel where it is the panel's to
   * report.
   *
   * `data-state` is the whole of the loading API: `[data-state="pending"]` is what a
   * spinner hangs off, and there is no second way to ask. `aria-busy` goes on the panel
   * rather than here because the panel is the region whose contents are being fetched.
   *
   * @param {"idle"|"pending"|"results"|"empty"|"error"} name
   */
  mark(name) {
    this.dataset.state = name;
    const panel = this.panel;
    if (!panel) return;
    if (name === 'pending') panel.setAttribute('aria-busy', 'true');
    else panel.removeAttribute('aria-busy');
  }

  /**
   * Say something in the live region.
   *
   * A live region announces a *change*, so the same message set twice in a row is silent -
   * which would make the second search for the same number of hits say nothing. Cleared
   * first and set back in a later task, so the two writes cannot coalesce into no change
   * at all.
   */
  announce(message) {
    const status = this.status;
    if (!status) return;
    status.textContent = '';
    clearTimeout(this.announceTimer);
    if (!message) return;
    this.announceTimer = setTimeout(() => { status.textContent = message; }, 0);
  }

  /**
   * How many answers landed. Links only, which is the rule the panel itself counts an
   * option by.
   *
   * The panel where there is one, and otherwise the element's own links with the form's
   * left out - a search whose results are a list in the page rather than a popup still has
   * a count to announce, and the "advanced search" link beside the field is not one of
   * them. Results rendered outside the element are outside what it can count, and it says
   * so rather than guessing.
   */
  get count() {
    const panel = this.panel;
    if (panel) return panel.querySelectorAll('a[href]').length;
    return Array.from(this.querySelectorAll('a[href]')).filter((link) => !link.closest('form')).length;
  }

  /**
   * A search has finished: show it, open the panel if there is anything in it, say what
   * happened.
   *
   * @param {"idle"|"results"|"empty"|"error"} state
   * @param {number} count
   */
  settle(state, count) {
    this.mark(state);
    const panel = this.panel;
    // The attribute rather than the property, so this works whether or not the panel's own
    // bundle has loaded - `open` is what that element reads either way.
    if (panel) panel.toggleAttribute('open', state === 'results');
    this.announce(searchStatus(state, count, this.labels));
  }

  /** Settle from whatever ended up in the panel. */
  settleFromPanel() {
    const count = this.count;
    this.settle(count > 0 ? 'results' : 'empty', count);
  }

  /**
   * Ask the page for results, and take whatever it does with that.
   *
   * The sequence number is the bug this element exists to fix: two requests in flight
   * settle in whatever order the network feels like, and the slow answer to the query
   * before last is the one that ends up on screen. `signal` asks the page to abort the
   * old one and the number makes sure it does not matter whether it did.
   *
   * @param {string} query
   */
  run(query) {
    this.cancel();
    this.last = query;

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    this.controller = controller;
    const mine = ++this.sequence;

    let waited = null;
    this.dispatchEvent(new CustomEvent('search-query', {
      bubbles: true,
      detail: {
        query,
        signal: controller ? controller.signal : null,
        wait: (promise) => { waited = promise; }
      }
    }));

    // Nothing was handed back, so the page filled the panel while the listener ran - an
    // index it already had, a filter over the DOM. There is no pending state to show and
    // nothing to wait for.
    if (!waited) {
      this.settleFromPanel();
      return;
    }

    this.mark('pending');
    Promise.resolve(waited).then(
      () => {
        if (mine === this.sequence) this.settleFromPanel();
      },
      (error) => {
        // A newer query owns the state now, and this rejection is almost always the abort
        // that newer query asked for.
        if (mine !== this.sequence) return;
        // Still the current query and aborted anyway: the page called it off for a reason
        // of its own. Not an error, and not a spinner left turning either.
        if (error && error.name === 'AbortError') {
          this.settle('idle', 0);
          return;
        }
        this.settle('error', 0);
      }
    );
  }

  onInput() {
    const field = this.field;
    if (!field) return;
    const action = searchAction(field.value, this.min, this.last);

    if (action === 'idle') return;

    if (action === 'clear') {
      this.cancel();
      this.last = null;
      this.settle('idle', 0);
      return;
    }

    clearTimeout(this.timer);
    // Read again when it fires rather than closed over now: the field is what it is at the
    // end of the wait, and a query sent for what it held at the start is one keystroke
    // behind on every search.
    this.timer = setTimeout(() => this.run(field.value.trim()), this.delay);
  }
}

define('search-elemental', SearchElemental);
