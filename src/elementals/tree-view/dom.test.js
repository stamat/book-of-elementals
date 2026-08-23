/**
 * The half of this element that is DOM: the roles it writes over a nested `<ul>`, the `aria-owns`
 * tying a branch to the node that opens it, the single tab stop, and what a key or a click does
 * to both.
 *
 * `index.test.js` pins `treeMove`, which is the arithmetic. This file is the other half of the
 * same pattern — that the arithmetic is handed the right list, and that its answer lands on the
 * DOM — because a tree with a perfect key map over the wrong roles is not a tree to a screen
 * reader, and neither test alone can see that.
 *
 * Deliberately not covered: anything needing layout or a real focus ring. jsdom has no layout, so
 * scroll-into-view, the chevron and the rail belong to `script/a11y` over the built demos. The
 * type-ahead's matching is `typeAheadIndex` in book-of-spells, tested there; what is here is only
 * whether a key that matches nothing is left to the page.
 *
 * @jest-environment jsdom
 */

import './index.js';

/** The docs sample's shape, small enough to read: one leaf, one closed branch with a branch of
 * its own inside it, one branch the markup asks to start open. */
const MARKUP = `
  <tree-view-elemental aria-label="Docs">
    <ul>
      <li><a href="#home">Home</a></li>
      <li>
        <span>Guides</span>
        <ul>
          <li><a href="#overview">Overview</a></li>
          <li>
            <span>Advanced</span>
            <ul><li><a href="#hooks">Hooks</a></li></ul>
          </li>
        </ul>
      </li>
      <li data-tree-open>
        <span>Reference</span>
        <ul><li><a href="#api">API</a></li></ul>
      </li>
    </ul>
  </tree-view-elemental>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('tree-view-elemental');
}

/** The node whose text reads as given, whatever element the markup made it. */
function node (tree, text) {
  return tree.querySelectorAll('[role="treeitem"]').length
    ? Array.from(tree.querySelectorAll('[role="treeitem"]')).find((each) => each.textContent.trim().startsWith(text))
    : undefined;
}

function press (target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

test('the element upgrades over the markup the author wrote, and writes the tree role onto itself', () => {
  // Every assertion below stands on this one: an element that never upgraded writes nothing, and
  // a test expecting nothing would pass against it.
  const tree = mount();
  expect(tree.constructor.name).toBe('TreeViewElemental');
  expect(tree.getAttribute('role')).toBe('tree');
});

test('the list and its items are role="none", so no listitem sits between the tree and its nodes', () => {
  const tree = mount();
  expect(tree.querySelector(':scope > ul').getAttribute('role')).toBe('none');
  for (const item of tree.querySelectorAll('li')) expect(item.getAttribute('role')).toBe('none');
});

test('the node of an item is its first child that is not the branch, link or not', () => {
  const tree = mount();
  expect(node(tree, 'Home').tagName).toBe('A');
  expect(node(tree, 'Guides').tagName).toBe('SPAN');
});

test('a branch is a group, and the node above it owns it by id', () => {
  // Without `aria-owns` the branch is the node's *sibling* to a screen reader, because a `<ul>`
  // cannot sit inside an `<a>` - which is the whole reason the attribute is written at all.
  const tree = mount();
  const guides = node(tree, 'Guides');
  const branch = guides.parentElement.querySelector(':scope > ul');
  expect(branch.getAttribute('role')).toBe('group');
  expect(branch.id).toBeTruthy();
  expect(guides.getAttribute('aria-owns')).toBe(branch.id);
});

test('an id the page put on a branch is used rather than replaced', () => {
  const tree = mount(`
    <tree-view-elemental aria-label="Docs">
      <ul><li><span>Guides</span><ul id="the-page-said-this"><li><a href="#a">A</a></li></ul></li></ul>
    </tree-view-elemental>`);
  expect(node(tree, 'Guides').getAttribute('aria-owns')).toBe('the-page-said-this');
});

test('a leaf gets no aria-expanded, because it has nothing to expand', () => {
  const tree = mount();
  expect(node(tree, 'Home').hasAttribute('aria-expanded')).toBe(false);
  expect(node(tree, 'Guides').hasAttribute('aria-expanded')).toBe(true);
});

test('a branch starts closed and hidden, so nothing behind it is reachable by Tab or find-in-page', () => {
  const tree = mount();
  const guides = node(tree, 'Guides');
  expect(guides.getAttribute('aria-expanded')).toBe('false');
  expect(guides.parentElement.querySelector(':scope > ul').hasAttribute('hidden')).toBe(true);
});

test('data-tree-open is the markup asking for a branch to start open', () => {
  const tree = mount();
  const reference = node(tree, 'Reference');
  expect(reference.getAttribute('aria-expanded')).toBe('true');
  expect(reference.parentElement.querySelector(':scope > ul').hasAttribute('hidden')).toBe(false);
});

test('the branches above the page the reader is on open themselves, however deep it sits', () => {
  const tree = mount(MARKUP.replace('href="#hooks"', 'href="#hooks" aria-current="page"'));
  expect(node(tree, 'Guides').getAttribute('aria-expanded')).toBe('true');
  expect(node(tree, 'Advanced').getAttribute('aria-expanded')).toBe('true');
});

test('aria-current="false" is a router saying *not* this one, and opens nothing', () => {
  // Every link a router renders carries the attribute; a bare `[aria-current]` would match the
  // first of them and open the whole tree on a page that is in none of it.
  const tree = mount(MARKUP.replace('href="#hooks"', 'href="#hooks" aria-current="false"'));
  expect(node(tree, 'Guides').getAttribute('aria-expanded')).toBe('false');
});

test('the whole tree is one tab stop, and it starts on the page the reader is on', () => {
  const tree = mount(MARKUP.replace('href="#api"', 'href="#api" aria-current="page"'));
  const stops = Array.from(tree.querySelectorAll('[role="treeitem"]')).filter((each) => each.getAttribute('tabindex') === '0');
  expect(stops).toEqual([node(tree, 'API')]);
});

test('with no page marked, the tab stop is the first node', () => {
  const tree = mount();
  expect(node(tree, 'Home').getAttribute('tabindex')).toBe('0');
});

test('an arrow moves focus and takes the single tab stop with it', () => {
  // The pair is the point: focus without the tabindex leaves Tab returning to the top of the
  // tree, and the tabindex without focus leaves the reader where they were.
  const tree = mount();
  const home = node(tree, 'Home');
  home.focus();
  press(home, 'ArrowDown');
  expect(document.activeElement).toBe(node(tree, 'Guides'));
  expect(node(tree, 'Guides').getAttribute('tabindex')).toBe('0');
  expect(home.getAttribute('tabindex')).toBe('-1');
});

test('down walks what is visible, stepping over a closed branch rather than into it', () => {
  const tree = mount();
  const guides = node(tree, 'Guides');
  guides.focus();
  press(guides, 'ArrowDown');
  expect(document.activeElement).toBe(node(tree, 'Reference'));
});

test('right opens a closed branch, and a second right steps inside it', () => {
  const tree = mount();
  const guides = node(tree, 'Guides');
  guides.focus();
  press(guides, 'ArrowRight');
  expect(guides.getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement).toBe(guides);
  press(guides, 'ArrowRight');
  expect(document.activeElement).toBe(node(tree, 'Overview'));
});

test('left closes the open branch the reader is standing on', () => {
  const tree = mount();
  const reference = node(tree, 'Reference');
  reference.focus();
  press(reference, 'ArrowLeft');
  expect(reference.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(reference);
});

test('left on a node inside a branch climbs out to the branch, not up one row', () => {
  // Up is the key for one row. On a long branch the parent is many rows above, and a Left that
  // stepped by one would be Up wearing Left's clothes.
  const tree = mount();
  const api = node(tree, 'API');
  api.focus();
  press(api, 'ArrowLeft');
  expect(document.activeElement).toBe(node(tree, 'Reference'));
});

test('a key the tree answers is taken from the page, and one it does not is left alone', () => {
  // A tree that swallowed everything printable would take Firefox\'s quick-find and the page\'s
  // access keys from a reader who was only passing through.
  const tree = mount();
  const home = node(tree, 'Home');
  home.focus();
  const arrow = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
  home.dispatchEvent(arrow);
  expect(arrow.defaultPrevented).toBe(true);

  const typed = new KeyboardEvent('keydown', { key: 'z', bubbles: true, cancelable: true });
  home.dispatchEvent(typed);
  expect(typed.defaultPrevented).toBe(false);
});

test('typing a name jumps to the node that starts with it', () => {
  const tree = mount();
  const home = node(tree, 'Home');
  home.focus();
  press(home, 'r');
  expect(document.activeElement).toBe(node(tree, 'Reference'));
});

test('an arrow pressed with a modifier is the browser\'s shortcut, not the tree\'s', () => {
  const tree = mount();
  const home = node(tree, 'Home');
  home.focus();
  home.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true, altKey: true }));
  expect(document.activeElement).toBe(home);
});

test('a click toggles a branch whose node is not a link', () => {
  const tree = mount();
  const guides = node(tree, 'Guides');
  guides.click();
  expect(guides.getAttribute('aria-expanded')).toBe('true');
  guides.click();
  expect(guides.getAttribute('aria-expanded')).toBe('false');
});

test('a click on a branch that is a link navigates instead, because that is what a link does', () => {
  const tree = mount(`
    <tree-view-elemental aria-label="Docs">
      <ul><li><a href="#guides">Guides</a><ul><li><a href="#a">A</a></li></ul></li></ul>
    </tree-view-elemental>`);
  const guides = node(tree, 'Guides');
  expect(guides.getAttribute('aria-expanded')).toBe('false');
  guides.click();
  expect(guides.getAttribute('aria-expanded')).toBe('false');
});

test('Enter and Space toggle a node that is not a link, and Space does not scroll the page doing it', () => {
  const tree = mount();
  const guides = node(tree, 'Guides');
  guides.focus();
  const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
  guides.dispatchEvent(space);
  expect(guides.getAttribute('aria-expanded')).toBe('true');
  expect(space.defaultPrevented).toBe(true);
  press(guides, 'Enter');
  expect(guides.getAttribute('aria-expanded')).toBe('false');
});

test('Enter on a node that is a link is left to the browser to follow', () => {
  const tree = mount();
  const home = node(tree, 'Home');
  home.focus();
  const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  home.dispatchEvent(enter);
  expect(enter.defaultPrevented).toBe(false);
});

test('a branch that is a link keeps both its keys: Enter follows it, Space scrolls the page', () => {
  // The branch that has to be a link is the one whose heading is also a page. Toggling it on
  // Enter would leave the reader on a tree that will not navigate, and swallowing Space would
  // take the page scroll from a reader passing through - the arrows are how a tree opens.
  const tree = mount(`
    <tree-view-elemental aria-label="Docs">
      <ul><li><a href="#guides">Guides</a><ul><li><a href="#a">A</a></li></ul></li></ul>
    </tree-view-elemental>`);
  const guides = node(tree, 'Guides');
  guides.focus();
  for (const key of ['Enter', ' ']) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    guides.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(guides.getAttribute('aria-expanded')).toBe('false');
  }
});

test('the tab stop follows focus arriving from outside, so Tab comes back where the reader left', () => {
  const tree = mount();
  const reference = node(tree, 'Reference');
  reference.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  expect(reference.getAttribute('tabindex')).toBe('0');
  expect(node(tree, 'Home').getAttribute('tabindex')).toBe('-1');
});

test('a branch opened by the reader says so, and the branches the markup opened say nothing', () => {
  // A page listening for every branch its own markup asked for is being told about state it
  // wrote itself, which is a listener that has to learn to ignore its own setup.
  const opened = [];
  document.addEventListener('tree-view-toggle', (e) => opened.push(e.detail));
  const tree = mount();
  expect(opened).toEqual([]);
  const guides = node(tree, 'Guides');
  guides.click();
  expect(opened).toEqual([{ open: true, node: guides }]);
});

test('an element with no list in it yet is left alone, and builds when it is next connected', () => {
  // The frame before a router rendered the list. Marking it done with nothing in it is a tree
  // that stays a plain list for good.
  const tree = mount('<tree-view-elemental aria-label="Docs"></tree-view-elemental>');
  expect(tree.hasAttribute('role')).toBe(false);
  tree.innerHTML = '<ul><li><a href="#a">A</a></li></ul>';
  tree.remove();
  document.body.append(tree);
  expect(tree.getAttribute('role')).toBe('tree');
});

test('everything the element wrote comes off when it goes, and nothing the page wrote does', () => {
  // A `role="tree"` with no keyboard behind it is a contract the page cannot keep, and a branch
  // left `hidden` is content that no key can reach any more.
  const tree = mount(`
    <tree-view-elemental aria-label="Docs">
      <ul><li><span>Guides</span><ul id="the-page-said-this"><li><a href="#a">A</a></li></ul></li></ul>
    </tree-view-elemental>`);
  const guides = tree.querySelector('span');
  const branch = tree.querySelector('#the-page-said-this');
  tree.remove();
  expect(tree.hasAttribute('role')).toBe(false);
  expect(guides.hasAttribute('role')).toBe(false);
  expect(guides.hasAttribute('tabindex')).toBe(false);
  expect(guides.hasAttribute('aria-expanded')).toBe(false);
  expect(guides.hasAttribute('aria-owns')).toBe(false);
  expect(branch.hasAttribute('hidden')).toBe(false);
  expect(branch.id).toBe('the-page-said-this');
});

test('an id the element minted is taken back, so a second build does not inherit a stale one', () => {
  const tree = mount();
  const branch = node(tree, 'Guides').parentElement.querySelector(':scope > ul');
  expect(branch.id).toMatch(/^tree-view-elemental-group-/);
  tree.remove();
  expect(branch.hasAttribute('id')).toBe(false);
});
