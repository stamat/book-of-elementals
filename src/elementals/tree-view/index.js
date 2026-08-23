import { ElementBase, define, typeAheadIndex } from '../../core.js';

/** Ids for the `aria-owns` that ties a branch to the node above it. */
let groupCount = 0;

/** The prefix on an id this element generated, which is how teardown knows an id of the page's
 * own from one of ours - and why teardown does not simply strip every `id` it finds. */
const GROUP_ID = 'tree-view-elemental-group-';

/**
 * The node saying which page the reader is on.
 *
 * `aria-current="false"` is a valid value and it means *not* current - which routers emit on every
 * link that is not the active one, so a bare `[aria-current]` would find the first link in the
 * sidebar and open every branch in the tree.
 */
const CURRENT = '[aria-current]:not([aria-current="false"])';

/**
 * Where a key takes a tree, given the nodes a reader can currently see.
 *
 * The list is the *visible* nodes in document order - a collapsed branch is not in it - which is
 * what lets every one of these be an index step rather than a walk. `level` is how deep a node
 * sits, `expanded` is `true`, `false`, or `null` for a node with no branch under it.
 *
 * **<kbd>→</kbd> and <kbd>←</kbd> each do two different things, and which one is the whole
 * pattern.** Right opens a closed branch and, on one that is already open, steps into it; left
 * closes an open branch and, on anything else, climbs out of it. So a reader who holds Right
 * walks down and in, and a reader who holds Left walks up and out, without ever needing to know
 * which of the two a given node is going to do.
 *
 * Stepping into an open branch is the node after it, because an open branch's children are
 * visible and therefore next - unless the branch is empty, which is a node that says it is open
 * and has nothing under it, and the level check is what keeps that from stepping onto a sibling.
 *
 * @param {{level: number, expanded: boolean|null}[]} nodes Visible nodes, in document order.
 * @param {number} current Index of the focused node.
 * @param {string} key KeyboardEvent.key value.
 * @returns {{move: number}|{expand: number}|{collapse: number}|null} `null` where the key is not
 *   the tree's, which is what leaves it to the page.
 * @example
 * const nodes = [{ level: 0, expanded: false }, { level: 0, expanded: null }]
 * treeMove(nodes, 0, 'ArrowRight') // => { expand: 0 }
 * treeMove(nodes, 0, 'ArrowDown') // => { move: 1 }
 */
export function treeMove(nodes, current, key) {
  const node = nodes[current];
  if (!node) return null;

  switch (key) {
    case 'ArrowDown':
      return current + 1 < nodes.length ? { move: current + 1 } : null;
    case 'ArrowUp':
      return current > 0 ? { move: current - 1 } : null;
    case 'Home':
      return nodes.length ? { move: 0 } : null;
    case 'End':
      return nodes.length ? { move: nodes.length - 1 } : null;
    case 'ArrowRight': {
      if (node.expanded === false) return { expand: current };
      if (node.expanded !== true) return null;
      const child = current + 1;
      return child < nodes.length && nodes[child].level > node.level ? { move: child } : null;
    }
    case 'ArrowLeft': {
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

/**
 * `<tree-view-elemental>` custom element.
 *
 * A nested list of links, walked with the arrow keys: the
 * [APG Tree View pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/), over the nested
 * `<ul>` a docs sidebar or a file list is already written as.
 *
 * The shape is the APG's own
 * [navigation tree example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-navigation/):
 * `role="treeitem"` on the link rather than on the `<li>`, the `<li>` marked `role="none"` so a
 * `listitem` does not sit between the tree and its items, and the branch under a node marked
 * `role="group"` and tied to it with `aria-owns`. The owning is not decoration - a branch is a
 * *sibling* of the node that opens it, since a `<ul>` inside an `<a>` is not markup HTML allows,
 * and without `aria-owns` the branch reads as the node's sibling rather than its children.
 *
 * **One tab stop for the whole tree.** <kbd>Tab</kbd> enters it and <kbd>Tab</kbd> leaves it; the
 * arrows do the walking. The stop starts on whatever the page marked `aria-current`, so a docs
 * sidebar hands the keyboard the page the reader is on rather than the top of the list.
 *
 * **A collapsed branch is `hidden`, not styled away.** It leaves the tab order, the accessibility
 * tree and find-in-page together, which is the honest reading of collapsed: a page that hid it
 * with CSS alone would have a tree whose reader can still tab into things they cannot see.
 *
 * **Nothing here is selected.** This is a navigation tree - the nodes are destinations, the way
 * [`<suggest-elemental>`](../suggest/index.js)'s options are - so there is no `aria-selected`,
 * no selection to keep in step with focus, and no multi-select. `aria-current` is the page you
 * are on and it is the page's to write; the element reads it and opens the branches above it.
 *
 * **Which nodes expand on a click is the markup's decision, not this element's.** A node that is
 * a link navigates when it is clicked, because that is what a link does, and opens on
 * <kbd>→</kbd>. A node that is not a link - a `<span>` - toggles on both. So a branch whose
 * heading is also a page is a link, and a branch that is only a heading is a `<span>`; a tree of
 * link branches can be opened with the keyboard but not with a mouse, which is why the recipe for
 * "both" is a `<span>` branch with an *Overview* link as its first child.
 *
 * Light DOM, no shadow root. With no script it is a nested list of links, in reading order, with
 * every branch showing - which is a site map, and a working page.
 *
 * ponytail: no `aria-level`, `aria-setsize` or `aria-posinset`. The pattern asks for them only
 * when the nodes are not all in the DOM, and here they always are - the DOM nesting says the same
 * thing, and three attributes per node that have to be rewritten every time a branch opens are
 * three chances to say it differently from the markup.
 *
 * ponytail: no lazy loading, no checkboxes, no drag, no rename, no `*`-expands-all. The first is
 * what the three attributes above would be for, and the rest are a file manager.
 *
 * @tag tree-view-elemental
 * @attr {string} aria-label - Names the tree, which the pattern requires. `aria-labelledby` does it too; one of them has to be there.
 *
 * @slot - A nested `<ul>`. Each `<li>` holds one node - an `<a href>` or a `<span>` - and, where it has children, a nested `<ul>` after it. Mark an `<li>` `data-tree-open` to have that branch start open, and the node `aria-current="page"` to say where the reader is.
 *
 * @cssprop {<length>} [--tree-view-elemental-indent=1.4rem] - Theme. How far a branch sits in from the node above it, rail included.
 * @cssprop {<length>} [--tree-view-elemental-gap=0.05rem] - Theme. Between one node and the next.
 * @cssprop {<length>} [--tree-view-elemental-radius=0.375rem] - Theme. The corner on a node's row, which the hover fill and the current-page tint are painted into.
 * @cssprop {<color>} [--tree-view-elemental-marker-color=currentcolor 60%] - Theme. The chevron on a node that has a branch under it.
 * @cssprop {<color>} [--tree-view-elemental-node-color=currentcolor 70%] - Theme. A node at rest; hovering it restores the tree's own colour.
 * @cssprop {<color>} [--tree-view-elemental-hover=currentcolor 8%] - Theme. The fill under the node the pointer is on.
 * @cssprop {<color>} [--tree-view-elemental-rail=currentcolor 20%] - Theme. The hairline down the inside of an open branch.
 * @cssprop {<color>} [--tree-view-elemental-current-color=currentcolor] - Theme. The node marked `aria-current` - its text, and the tint behind it. The page's accent goes here.
 *
 * @fires tree-view-toggle - A branch has been opened or closed. `detail.open` is which, and `detail.node` is the element that owns it.
 */
export class TreeViewElemental extends ElementBase {
  /** What has been typed inside the type-ahead window, and the timer that ends it. */
  buffer = '';
  bufferTimer = 0;

  /** The list that becomes the tree. Direct child, so a tree inside a node of this one keeps its
   * own. */
  get list() {
    return this.querySelector(':scope > ul, :scope > ol');
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
    // Before the flag, so a tree rendered into this element later is built when it is next
    // connected rather than being marked done with nothing in it.
    if (!this.list) return;

    this.initialized = true;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onFocusIn = this.onFocusIn.bind(this);

    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('click', this.onClick);
    this.addEventListener('focusin', this.onFocusIn);

    this.build();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.initialized = false;

    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('focusin', this.onFocusIn);
    if (this.bufferTimer) window.clearTimeout(this.bufferTimer);
    this.bufferTimer = 0;

    // Everything written comes off. A `role="tree"` nobody is driving is a keyboard contract
    // with no keyboard behind it, and a branch left `hidden` is content no key can reach any
    // more - which on a page whose script failed to load a second time is content simply gone.
    this.removeAttribute('role');
    for (const list of this.querySelectorAll('ul, ol')) {
      list.removeAttribute('role');
      list.removeAttribute('hidden');
      // Only the ids this element minted. An `id` the page put on a branch is the target of its
      // own anchors, its own CSS and possibly an `aria-labelledby` elsewhere on the page, and
      // taking it away on teardown breaks all three with nothing to show why.
      if (list.id.startsWith(GROUP_ID)) list.removeAttribute('id');
    }
    for (const item of this.querySelectorAll('li')) item.removeAttribute('role');
    for (const node of this.allNodes) {
      node.removeAttribute('role');
      node.removeAttribute('tabindex');
      node.removeAttribute('aria-expanded');
      node.removeAttribute('aria-owns');
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
    this.setAttribute('role', 'tree');
    this.list.setAttribute('role', 'none');

    for (const item of this.querySelectorAll('li')) {
      item.setAttribute('role', 'none');
      const branch = item.querySelector(':scope > ul, :scope > ol');
      const node = Array.from(item.children).find((child) => child !== branch);
      if (!node) continue;

      node.setAttribute('role', 'treeitem');
      node.setAttribute('tabindex', '-1');
      if (!branch) continue;

      branch.setAttribute('role', 'group');
      if (!branch.id) branch.id = GROUP_ID + (++groupCount);
      node.setAttribute('aria-owns', branch.id);
      // Closed unless the page said otherwise, or unless the page the reader is on is somewhere
      // inside - a sidebar that opened on the reader's own page is the only opening state anyone
      // has ever wanted by default.
      const open = item.hasAttribute('data-tree-open') || !!item.querySelector(CURRENT);
      this.setOpen(node, open, false);
    }

    // The tab stop starts where the reader already is. `allNodes` rather than `nodes`, since the
    // current page's node is inside branches this loop has just opened.
    const current = this.allNodes.find((node) => node.matches(CURRENT));
    const first = current || this.nodes[0];
    if (first) first.setAttribute('tabindex', '0');
  }

  /** Open or close one branch. `announce` is false while building, where a page listening for
   * every branch the markup asked for is a page told about state it wrote itself. */
  setOpen(node, open, announce = true) {
    // The branch is found the way `build` found it - the list beside the node - rather than by
    // resolving `aria-owns` through `document`. Same element either way in a page, and the id
    // round-trip is the one that comes back `null` inside a shadow root, where it would leave a
    // branch that quietly never opens. `aria-owns` stays; it is for the accessibility tree.
    const branch = node.parentElement && node.parentElement.querySelector(':scope > ul, :scope > ol');
    if (!branch || !node.hasAttribute('aria-owns')) return;
    node.setAttribute('aria-expanded', open ? 'true' : 'false');
    branch.toggleAttribute('hidden', !open);
    if (announce) {
      this.dispatchEvent(new CustomEvent('tree-view-toggle', { bubbles: true, detail: { open, node } }));
    }
  }

  /** Move the single tab stop, and the focus with it. */
  focusNode(node) {
    for (const other of this.allNodes) other.setAttribute('tabindex', other === node ? '0' : '-1');
    node.focus();
  }

  /** The tab stop follows focus, so a tree left by <kbd>Tab</kbd> and come back to lands where
   * the reader was rather than at the top. */
  onFocusIn(event) {
    const node = event.target.closest('[role="treeitem"]');
    if (!node || node.getAttribute('tabindex') === '0') return;
    for (const other of this.allNodes) other.setAttribute('tabindex', other === node ? '0' : '-1');
  }

  onClick(event) {
    const node = event.target.closest('[role="treeitem"]');
    if (!node || !node.hasAttribute('aria-expanded')) return;
    // A link navigates - that is what a link is for, and a tree that swallowed the click would
    // be a set of links that cannot be followed with a mouse. Anything else toggles.
    if (node.hasAttribute('href')) return;
    this.setOpen(node, node.getAttribute('aria-expanded') === 'false');
  }

  onKeyDown(event) {
    const node = event.target.closest('[role="treeitem"]');
    if (!node || event.altKey || event.ctrlKey || event.metaKey) return;

    const nodes = this.nodes;
    const current = nodes.indexOf(node);

    if (event.key === 'Enter' || event.key === ' ') {
      // A link is left to the browser: `Enter` follows it, and `Space` on a link is the page
      // scrolling, which is not this element's to take. Everything else toggles, and `Space`
      // has to be caught to stop the scroll it would otherwise do.
      if (node.hasAttribute('href')) return;
      if (!node.hasAttribute('aria-expanded')) return;
      event.preventDefault();
      this.setOpen(node, node.getAttribute('aria-expanded') === 'false');
      return;
    }

    const step = treeMove(nodes.map((each) => this.describe(each)), current, event.key);
    if (step) {
      event.preventDefault();
      if (step.move !== undefined) this.focusNode(nodes[step.move]);
      else if (step.expand !== undefined) this.setOpen(nodes[step.expand], true);
      else this.setOpen(nodes[step.collapse], false);
      return;
    }

    // Type-ahead. One printable character, which is what the pattern asks for, and a buffer on
    // top of it so a name typed quickly narrows instead of cycling the same first letter.
    if (event.key.length !== 1 || event.key === ' ') return;
    event.preventDefault();
    this.buffer += event.key;
    if (this.bufferTimer) window.clearTimeout(this.bufferTimer);
    this.bufferTimer = window.setTimeout(() => { this.buffer = ''; }, 500);

    const labels = nodes.map((each) => (each.textContent || '').trim());
    const to = typeAheadIndex(labels, current, this.buffer);
    if (to !== null) this.focusNode(nodes[to]);
  }

  /** One node, as `treeMove` reads it: how deep it sits, and whether it is a branch and open.
   * The depth is counted off the DOM rather than written into `aria-level`, so the nesting stays
   * the one place it is said. */
  describe(node) {
    const expanded = node.getAttribute('aria-expanded');
    let level = 0;
    for (let at = node.parentElement; at && at !== this; at = at.parentElement) {
      if (at.getAttribute('role') === 'group') level++;
    }
    return { level, expanded: expanded === null ? null : expanded === 'true' };
  }
}

define('tree-view-elemental', TreeViewElemental);
