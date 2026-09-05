/* book-of-elementals v3.4.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }
  function typeAheadIndex(labels, current, buffer) {
    if (!buffer) return null;
    const query = buffer.toLowerCase();
    const repeated = query.length > 1 && query.split("").every((c) => c === query[0]);
    const prefix = repeated ? query[0] : query;
    const from = prefix.length === 1 ? current + 1 : current;
    for (let i = 0; i < labels.length; i++) {
      const at = (from + i + labels.length) % labels.length;
      if (labels[at].trim().toLowerCase().startsWith(prefix)) return at;
    }
    return null;
  }

  // src/core.js
  function define2(tag, ctor) {
    if (typeof document === "undefined" || document.readyState !== "loading") {
      define(tag, ctor);
      return;
    }
    document.addEventListener("DOMContentLoaded", () => define(tag, ctor), { once: true });
  }

  // src/elementals/tree-view/index.js
  var groupCount = 0;
  var GROUP_ID = "tree-view-elemental-group-";
  var CURRENT = '[aria-current]:not([aria-current="false"])';
  function treeMove(nodes, current, key) {
    const node = nodes[current];
    if (!node) return null;
    switch (key) {
      case "ArrowDown":
        return current + 1 < nodes.length ? { move: current + 1 } : null;
      case "ArrowUp":
        return current > 0 ? { move: current - 1 } : null;
      case "Home":
        return nodes.length ? { move: 0 } : null;
      case "End":
        return nodes.length ? { move: nodes.length - 1 } : null;
      case "ArrowRight": {
        if (node.expanded === false) return { expand: current };
        if (node.expanded !== true) return null;
        const child = current + 1;
        return child < nodes.length && nodes[child].level > node.level ? { move: child } : null;
      }
      case "ArrowLeft": {
        if (node.expanded === true) return { collapse: current };
        for (let at = current - 1; at >= 0; at--) {
          if (nodes[at].level < node.level) return { move: at };
        }
        return null;
      }
      default:
        return null;
    }
  }
  var TreeViewElemental = class extends ElementBase {
    constructor() {
      super(...arguments);
      /** What has been typed inside the type-ahead window, and the timer that ends it. */
      __publicField(this, "buffer", "");
      __publicField(this, "bufferTimer", 0);
    }
    /** The list that becomes the tree: a direct child, so a stray `<ul>` deeper in the markup is
     * not mistaken for the root of one.
     *
     * A `<tree-view-elemental>` nested inside a node of this one is not supported - `build` and
     * `allNodes` sweep the whole subtree, so the outer tree would claim the inner one's items. A
     * tree of trees is a tree, written as one list. */
    get list() {
      return this.querySelector(":scope > ul, :scope > ol");
    }
    /** Every node in the tree, open or not, in document order. */
    get allNodes() {
      return Array.from(this.querySelectorAll('[role="treeitem"]'));
    }
    /**
     * The nodes a reader can currently see.
     *
     * Read off `hidden` rather than off a state this element keeps, so the two cannot disagree:
     * whatever is hidden is closed, including a branch the page hid itself.
     */
    get nodes() {
      return this.allNodes.filter((node) => !node.closest('[role="group"][hidden]'));
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.list) return;
      this.initialized = true;
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("click", this.onClick);
      this.addEventListener("focusin", this.onFocusIn);
      this.build();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("focusin", this.onFocusIn);
      if (this.bufferTimer) window.clearTimeout(this.bufferTimer);
      this.bufferTimer = 0;
      this.removeAttribute("role");
      for (const list of this.querySelectorAll("ul, ol")) {
        list.removeAttribute("role");
        list.removeAttribute("hidden");
        if (list.id.startsWith(GROUP_ID)) list.removeAttribute("id");
      }
      for (const item of this.querySelectorAll("li")) item.removeAttribute("role");
      for (const node of this.allNodes) {
        node.removeAttribute("role");
        node.removeAttribute("tabindex");
        node.removeAttribute("aria-expanded");
        node.removeAttribute("aria-owns");
      }
    }
    /**
     * Write the roles, and open the branches that should start open.
     *
     * The node of an `<li>` is its first element child that is not the branch: an `<a>`, a
     * `<span>`, whatever the page wrote. Taking the first rather than looking for a link is what
     * lets a branch heading be a plain `<span>` - and what keeps an icon the page put beside the
     * label from being mistaken for the node.
     */
    build() {
      this.setAttribute("role", "tree");
      this.list.setAttribute("role", "none");
      for (const item of this.querySelectorAll("li")) {
        item.setAttribute("role", "none");
        const branch = item.querySelector(":scope > ul, :scope > ol");
        const node = Array.from(item.children).find((child) => child !== branch);
        if (!node) continue;
        node.setAttribute("role", "treeitem");
        node.setAttribute("tabindex", "-1");
        if (!branch) continue;
        branch.setAttribute("role", "group");
        if (!branch.id) branch.id = GROUP_ID + ++groupCount;
        node.setAttribute("aria-owns", branch.id);
        const open = item.hasAttribute("data-tree-open") || !!item.querySelector(CURRENT);
        this.setOpen(node, open, false);
      }
      const current = this.allNodes.find((node) => node.matches(CURRENT));
      const first = current || this.nodes[0];
      if (first) first.setAttribute("tabindex", "0");
    }
    /** Open or close one branch. `announce` is false while building, where a page listening for
     * every branch the markup asked for is a page told about state it wrote itself. */
    setOpen(node, open, announce = true) {
      const branch = node.parentElement && node.parentElement.querySelector(":scope > ul, :scope > ol");
      if (!branch || !node.hasAttribute("aria-owns")) return;
      node.setAttribute("aria-expanded", open ? "true" : "false");
      branch.toggleAttribute("hidden", !open);
      if (announce) {
        this.dispatchEvent(new CustomEvent("tree-view-toggle", { bubbles: true, detail: { open, node } }));
      }
    }
    /** Move the single tab stop, and the focus with it. */
    focusNode(node) {
      for (const other of this.allNodes) other.setAttribute("tabindex", other === node ? "0" : "-1");
      node.focus();
    }
    /** The tab stop follows focus, so a tree left by <kbd>Tab</kbd> and come back to lands where
     * the reader was rather than at the top. */
    onFocusIn(event) {
      const node = event.target.closest('[role="treeitem"]');
      if (!node || node.getAttribute("tabindex") === "0") return;
      for (const other of this.allNodes) other.setAttribute("tabindex", other === node ? "0" : "-1");
    }
    onClick(event) {
      const node = event.target.closest('[role="treeitem"]');
      if (!node || !node.hasAttribute("aria-expanded")) return;
      if (node.hasAttribute("href")) return;
      this.setOpen(node, node.getAttribute("aria-expanded") === "false");
    }
    onKeyDown(event) {
      const node = event.target.closest('[role="treeitem"]');
      if (!node || event.altKey || event.ctrlKey || event.metaKey) return;
      const nodes = this.nodes;
      const current = nodes.indexOf(node);
      if (event.key === "Enter" || event.key === " ") {
        if (node.hasAttribute("href")) return;
        if (!node.hasAttribute("aria-expanded")) return;
        event.preventDefault();
        this.setOpen(node, node.getAttribute("aria-expanded") === "false");
        return;
      }
      const step = treeMove(nodes.map((each) => this.describe(each)), current, event.key);
      if (step) {
        event.preventDefault();
        if (step.move !== void 0) this.focusNode(nodes[step.move]);
        else if (step.expand !== void 0) this.setOpen(nodes[step.expand], true);
        else this.setOpen(nodes[step.collapse], false);
        return;
      }
      if (event.key.length !== 1 || event.key === " ") return;
      this.buffer += event.key;
      if (this.bufferTimer) window.clearTimeout(this.bufferTimer);
      this.bufferTimer = window.setTimeout(() => {
        this.buffer = "";
      }, 500);
      const labels = nodes.map((each) => (each.textContent || "").trim());
      const to = typeAheadIndex(labels, current, this.buffer);
      if (to === null) return;
      event.preventDefault();
      this.focusNode(nodes[to]);
    }
    /** One node, as `treeMove` reads it: how deep it sits, and whether it is a branch and open.
     * The depth is counted off the DOM rather than written into `aria-level`, so the nesting stays
     * the one place it is said. */
    describe(node) {
      const expanded = node.getAttribute("aria-expanded");
      let level = 0;
      for (let at = node.parentElement; at && at !== this; at = at.parentElement) {
        if (at.getAttribute("role") === "group") level++;
      }
      return { level, expanded: expanded === null ? null : expanded === "true" };
    }
  };
  define2("tree-view-elemental", TreeViewElemental);
})();
//# sourceMappingURL=tree-view.js.map
