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

  // src/elementals/sortable-table/index.js
  var DEFAULT_NOTE = "Column headers with a button sort the table by that column.";
  function sortKey(cell) {
    if (!cell) return "";
    const explicit = cell.getAttribute ? cell.getAttribute("data-sort-value") : null;
    return explicit ?? (cell.textContent || "").trim();
  }
  function sortOrder(keys, descending, collator) {
    const compare = collator ? (a, b) => collator.compare(a, b) : (a, b) => a < b ? -1 : a > b ? 1 : 0;
    return keys.map((key, index) => ({ key, index })).sort((a, b) => {
      const by = compare(a.key, b.key);
      if (by !== 0) return descending ? -by : by;
      return a.index - b.index;
    }).map((entry) => entry.index);
  }
  var SortableTableElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["note-text"];
    }
    /** The sentence appended to the caption. */
    get noteText() {
      return this.getAttribute("note-text") || DEFAULT_NOTE;
    }
    set noteText(value) {
      this.setAttribute("note-text", value);
    }
    /** The table. Direct child, so a table inside a cell of this one is not mistaken for it. */
    get table() {
      return this.querySelector(":scope > table");
    }
    /**
     * The header cells that carry the buttons: the last row of the `<thead>`.
     *
     * The last rather than the first, because a table with a grouped header has a top row of
     * spanning labels over a bottom row of real columns, and only the bottom row has one column
     * each. A single-row header is its own last row, so the common case pays nothing for it.
     */
    get headers() {
      const table = this.table;
      const row = table && table.querySelector(":scope > thead > tr:last-of-type");
      return row ? Array.from(row.children) : [];
    }
    /** The rows that get reordered. The first `<tbody>` only - a table with several is using them
     * to group, and moving a row between groups would be sorting away the grouping. */
    get body() {
      const table = this.table;
      return table ? table.querySelector(":scope > tbody") : null;
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.body || this.headers.length === 0) return;
      this.initialized = true;
      this.onClick = this.onClick.bind(this);
      this.build();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      for (const header of this.headers) {
        const button = header.querySelector(":scope > button");
        if (button) {
          button.removeEventListener("click", this.onClick);
          button.replaceWith(...button.childNodes);
        }
      }
      for (const node of [this.note, this.noteSpace, this.ownCaption]) if (node) node.remove();
      this.note = this.noteSpace = this.ownCaption = null;
    }
    attributeChangedCallback(name, previous, value) {
      if (!this.initialized || previous === value) return;
      if (name === "note-text" && this.note) this.note.textContent = this.noteText;
    }
    /**
     * Put a button in every sortable header, and the note in the caption.
     *
     * The button takes the header's existing nodes rather than its text, so an icon, a `<span>`
     * or an abbreviation in there survives and keeps whatever the page styled it with.
     */
    build() {
      for (const header of this.headers) {
        if (header.getAttribute("data-sort") === "none") continue;
        const button = document.createElement("button");
        button.type = "button";
        button.append(...header.childNodes);
        button.addEventListener("click", this.onClick);
        header.append(button);
      }
      const table = this.table;
      let caption = table.querySelector(":scope > caption");
      this.ownCaption = null;
      if (!caption) {
        caption = document.createElement("caption");
        table.prepend(caption);
        this.ownCaption = caption;
      }
      this.note = document.createElement("span");
      this.note.className = "sortable-table-elemental-note";
      this.note.textContent = this.noteText;
      this.noteSpace = null;
      if (caption.childNodes.length) {
        this.noteSpace = document.createTextNode(" ");
        caption.append(this.noteSpace);
      }
      caption.append(this.note);
    }
    onClick(event) {
      const header = event.currentTarget.parentElement;
      const index = this.headers.indexOf(header);
      if (index < 0) return;
      const descending = header.getAttribute("aria-sort") === "ascending";
      this.sort(index, descending);
      this.dispatchEvent(new CustomEvent("sortable-table-sort", {
        bubbles: true,
        detail: {
          column: index,
          key: (this.headers[index].textContent || "").trim(),
          direction: descending ? "descending" : "ascending"
        }
      }));
    }
    /**
     * Reorder the rows by one column, and say so on the header.
     *
     * The rows are moved with a `DocumentFragment` rather than appended one at a time: every
     * `append` on a live `<tbody>` is a mutation the page can be observing and a layout the
     * browser may decide to run, and a hundred-row table sorts a hundred times over. Built off
     * screen it is one insertion.
     *
     * Nothing is measured or cached between sorts. The keys are read from the DOM every time,
     * because the DOM is where the page may have just changed them - a cached key set is a table
     * that sorts by what a cell used to say.
     *
     * @param {number} index Which header, by position in the header row.
     * @param {boolean} descending
     */
    sort(index, descending) {
      const body = this.body;
      const rows = Array.from(body.rows);
      const order = sortOrder(rows.map((row) => sortKey(row.children[index])), descending, this.collator());
      const fragment = document.createDocumentFragment();
      for (const at of order) fragment.append(rows[at]);
      body.append(fragment);
      for (const header of this.headers) header.removeAttribute("aria-sort");
      this.headers[index].setAttribute("aria-sort", descending ? "descending" : "ascending");
    }
    /**
     * The comparator. Numeric-aware, so `item 10` sorts after `item 2` and a column of plain
     * numbers sorts as numbers without being told that is what it is.
     *
     * Built per sort rather than held, and pointed at the document's own `lang`: a page that
     * swaps its language has swapped how its own words collate, and one built once at upgrade
     * would be sorting the new language by the old one's rules. `undefined` where there is no
     * `lang`, which is `Intl`'s own way of saying "the runtime's".
     */
    collator() {
      const lang = document.documentElement.getAttribute("lang");
      return new Intl.Collator(lang || void 0, { numeric: true, sensitivity: "base" });
    }
  };
  define2("sortable-table-elemental", SortableTableElemental);
})();
//# sourceMappingURL=sortable-table.js.map
