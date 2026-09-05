/* book-of-elementals v3.4.1 | https://stamat.github.io/book-of-elementals/ | MIT License */
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

  // src/elementals/feed/index.js
  var feedCount = 0;
  var FOCUSABLE = "a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]";
  var ARTICLE = 'article, [role="article"]';
  var ARTICLES = ':scope > article, :scope > [role="article"]';
  function feedKey(key, ctrlKey) {
    if (ctrlKey) {
      if (key === "End") return "after";
      if (key === "Home") return "before";
      return null;
    }
    if (key === "PageDown") return "next";
    if (key === "PageUp") return "previous";
    return null;
  }
  function feedSetSize(raw, loaded) {
    if (raw == null || raw.trim() === "") return -1;
    const total = Number(raw);
    if (!Number.isFinite(total) || total <= 0) return -1;
    return total < loaded ? loaded : total;
  }
  var FeedElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["auto-load", "total"];
    }
    /** The articles, in reading order. */
    get articles() {
      return Array.from(this.querySelectorAll(ARTICLES));
    }
    /** How many times the feed may still ask on its own. */
    get autoLoad() {
      const raw = this.getAttribute("auto-load");
      if (raw == null || raw.trim() === "") return 0;
      const value = Number(raw);
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    }
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.budget = this.autoLoad;
      this.pending = false;
      this.setAttribute("role", "feed");
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onIntersect = this.onIntersect.bind(this);
      this.addEventListener("keydown", this.onKeyDown);
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
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeAttribute("role");
      this.removeAttribute("aria-busy");
      for (const item of this.articles) {
        item.removeAttribute("tabindex");
        item.removeAttribute("aria-posinset");
        item.removeAttribute("aria-setsize");
      }
    }
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "auto-load") this.budget = this.autoLoad;
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
      const size = String(feedSetSize(this.getAttribute("total"), items.length));
      items.forEach((item, at) => {
        item.tabIndex = 0;
        item.setAttribute("aria-posinset", String(at + 1));
        item.setAttribute("aria-setsize", size);
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
      if (item.hasAttribute("aria-label") || item.hasAttribute("aria-labelledby")) return;
      const heading = item.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
      if (!heading) return;
      if (!heading.id) heading.id = "feed-elemental-" + ++feedCount;
      item.setAttribute("aria-labelledby", heading.id);
    }
    /**
     * Watch the last article, while there is budget left to answer with.
     *
     * The observer is torn down the moment the budget runs out rather than left running with
     * nothing to do, which is also what makes "it has stopped asking" observable from the
     * outside instead of a counter nobody can see.
     */
    watch(last) {
      if (!last || this.budget <= 0 || typeof IntersectionObserver === "undefined") {
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
      if (this.pending) return;
      this.pending = true;
      this.setAttribute("aria-busy", "true");
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      this.controller = controller;
      let waited = null;
      this.dispatchEvent(new CustomEvent("feed-load", {
        bubbles: true,
        detail: {
          count: this.articles.length,
          signal: controller ? controller.signal : null,
          wait: (promise) => {
            waited = promise;
          }
        }
      }));
      if (!waited) {
        this.settle();
        return;
      }
      Promise.resolve(waited).then(
        () => this.settle(),
        () => {
          this.budget = 0;
          this.settle();
        }
      );
    }
    /** The load is over, however it went: index whatever arrived and stop claiming to be busy. */
    settle() {
      this.pending = false;
      this.controller = null;
      this.removeAttribute("aria-busy");
      if (this.initialized) this.wire();
    }
    onKeyDown(e) {
      const action = feedKey(e.key, e.ctrlKey);
      if (!action) return;
      if (action === "after" || action === "before") {
        if (this.escape(action === "after")) e.preventDefault();
        return;
      }
      const items = this.articles;
      const item = e.target.closest ? e.target.closest(ARTICLE) : null;
      const at = items.indexOf(item);
      if (at === -1) return;
      const to = action === "next" ? at + 1 : at - 1;
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
      const outside = Array.from(document.querySelectorAll(FOCUSABLE)).filter((element) => !this.contains(element) && this.compareDocumentPosition(element) & position);
      if (!after) outside.reverse();
      for (const element of outside) {
        element.focus();
        if (document.activeElement === element) return true;
      }
      return false;
    }
  };
  define2("feed-elemental", FeedElemental);
})();
//# sourceMappingURL=feed.js.map
