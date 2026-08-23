/* book-of-elementals v2.0.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/core.js
  function define2(tag, ctor) {
    if (typeof document === "undefined" || document.readyState !== "loading") {
      define(tag, ctor);
      return;
    }
    document.addEventListener("DOMContentLoaded", () => define(tag, ctor), { once: true });
  }

  // src/elementals/search/index.js
  var DELAY_MS = 200;
  var MIN_LENGTH = 1;
  function searchAction(value, min, last) {
    const query = String(value == null ? "" : value).trim();
    if (query.length < min) return "clear";
    if (query === last) return "idle";
    return "query";
  }
  function searchStatus(state, count, texts) {
    const strings = texts || {};
    if (state === "results") {
      if (strings.results) return strings.results.replace(/\{n\}/g, count);
      return count === 1 ? "1 result" : count + " results";
    }
    if (state === "empty") return strings.empty || "No results";
    if (state === "error") return strings.error || "Search failed";
    return "";
  }
  function searchOpen(state, filled) {
    if (state === "results") return true;
    if (state === "empty") return !!filled;
    return false;
  }
  function readNumber(raw, fallback) {
    if (raw == null || raw.trim() === "") return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
  var SearchElemental = class extends ElementBase {
    /** The field being typed in: the first `<input>` inside. */
    get field() {
      return this.querySelector("input");
    }
    /** Where results land. Counting the links in it is how the element knows what to
     * announce, so this is a DOM query and not a call into the other element - a page that
     * loaded this bundle and not that one still gets its states and its announcement. */
    get panel() {
      return this.querySelector("suggest-elemental");
    }
    /** The live region. Added at upgrade, because a live region only announces text that
     * lands in one already in the document. */
    get status() {
      return this.querySelector(":scope > .search-elemental-status");
    }
    /** Milliseconds the field has to stop changing before a query goes out. */
    get delay() {
      return readNumber(this.getAttribute("delay"), DELAY_MS);
    }
    /** Characters needed before one goes out at all. */
    get min() {
      return readNumber(this.getAttribute("min"), MIN_LENGTH);
    }
    /** What the live region says, in the page's own words where it gave any. */
    get texts() {
      return {
        results: this.getAttribute("results-text"),
        empty: this.getAttribute("empty-text"),
        error: this.getAttribute("error-text")
      };
    }
    connectedCallback() {
      if (this.initialized) return;
      const field = this.field;
      if (!field) return;
      this.initialized = true;
      this.sequence = 0;
      this.last = null;
      if (!this.status) {
        const status = document.createElement("span");
        status.className = "search-elemental-status";
        status.setAttribute("role", "status");
        this.appendChild(status);
      }
      this.onInput = this.onInput.bind(this);
      field.addEventListener("input", this.onInput);
      this.dataset.state = "idle";
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      const field = this.field;
      if (field) field.removeEventListener("input", this.onInput);
      this.cancel();
      clearTimeout(this.announceTimer);
      const panel = this.panel;
      if (panel) panel.removeAttribute("aria-busy");
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
      if (name === "pending") panel.setAttribute("aria-busy", "true");
      else panel.removeAttribute("aria-busy");
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
      status.textContent = "";
      clearTimeout(this.announceTimer);
      if (!message) return;
      this.announceTimer = setTimeout(() => {
        status.textContent = message;
      }, 0);
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
      if (panel) return panel.querySelectorAll("a[href]").length;
      return Array.from(this.querySelectorAll("a[href]")).filter((link) => !link.closest("form")).length;
    }
    /**
     * Whether the panel has anything in it at all, which is a different question from how
     * many answers are in it.
     *
     * Text rather than a selector, because an empty state is whatever the page wrote - a
     * `<li>`, a paragraph, a line about what to try instead - and a list of shapes to match
     * would be this element having an opinion about markup it does not own. An empty `<ul>`
     * has no text; anything a reader could read does.
     */
    get filled() {
      const panel = this.panel;
      return !!panel && panel.textContent.trim() !== "";
    }
    /**
     * A search has finished: show it, open or close the panel, say what happened.
     *
     * @param {"idle"|"results"|"empty"|"error"} state
     * @param {number} count
     */
    settle(state, count) {
      this.mark(state);
      const panel = this.panel;
      if (panel) panel.toggleAttribute("open", searchOpen(state, this.filled));
      this.announce(searchStatus(state, count, this.texts));
    }
    /** Settle from whatever ended up in the panel. */
    settleFromPanel() {
      const count = this.count;
      this.settle(count > 0 ? "results" : "empty", count);
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
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      this.controller = controller;
      const mine = ++this.sequence;
      let waited = null;
      this.dispatchEvent(new CustomEvent("search-query", {
        bubbles: true,
        detail: {
          query,
          signal: controller ? controller.signal : null,
          wait: (promise) => {
            waited = promise;
          }
        }
      }));
      if (!waited) {
        this.settleFromPanel();
        return;
      }
      this.mark("pending");
      Promise.resolve(waited).then(
        () => {
          if (mine === this.sequence) this.settleFromPanel();
        },
        (error) => {
          if (mine !== this.sequence) return;
          if (error && error.name === "AbortError") {
            this.settle("idle", 0);
            return;
          }
          this.settle("error", 0);
        }
      );
    }
    onInput() {
      const field = this.field;
      if (!field) return;
      const action = searchAction(field.value, this.min, this.last);
      if (action === "idle") return;
      if (action === "clear") {
        this.cancel();
        this.last = null;
        this.settle("idle", 0);
        return;
      }
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.run(field.value.trim()), this.delay);
    }
  };
  define2("search-elemental", SearchElemental);
})();
//# sourceMappingURL=search.js.map
