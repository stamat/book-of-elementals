// The one sum this element does: where a key takes the reader, given the nodes they can see.
//
// It is worth pinning to numbers because <kbd>→</kbd> and <kbd>←</kbd> each answer two different
// questions depending on the node they are pressed on, and the pair is what makes a tree feel
// like a tree: hold Right and you walk down and in, hold Left and you walk up and out. Get one
// branch of that wrong and the tree still works well enough to demo and is wrong to live in.
//
// The visible-nodes list is the trick that makes it arithmetic rather than a walk — a collapsed
// branch is simply not in it — and the tests below are written as flat lists for that reason,
// which is also how the element hands them over.
//
// Deliberately not covered: the roles the element writes, the `aria-owns` that ties a branch to
// its node, the `hidden` toggling, the roving tabindex and the type-ahead. Jest runs under Node
// here with no jsdom, so an element test would assert against a stub base class — `script/a11y`
// drives the docs demo instead, and the type-ahead is `typeAheadIndex` in book-of-spells, tested
// there.

import { treeMove } from './index.js';

/** A tree drawn as the flat list of what a reader can see, which is what the element passes in.
 *
 *   Fruit          level 0, open
 *     Apple        level 1, leaf
 *     Citrus       level 1, closed  ← its children are not in the list, because it is closed
 *   Vegetables     level 0, leaf
 */
const nodes = [
  { level: 0, expanded: true },
  { level: 1, expanded: null },
  { level: 1, expanded: false },
  { level: 0, expanded: null }
];

test('down and up walk what the reader can see, ignoring how deep it is', () => {
  expect(treeMove(nodes, 0, 'ArrowDown')).toEqual({ move: 1 });
  expect(treeMove(nodes, 2, 'ArrowDown')).toEqual({ move: 3 });
  expect(treeMove(nodes, 3, 'ArrowUp')).toEqual({ move: 2 });
});

test('the ends do not wrap, so running off one is how you get back to the page', () => {
  expect(treeMove(nodes, 0, 'ArrowUp')).toBe(null);
  expect(treeMove(nodes, 3, 'ArrowDown')).toBe(null);
});

test('right opens a closed branch and leaves the focus on it', () => {
  // Two presses to get inside, and that is the pattern rather than an inefficiency: the first
  // press is what makes the children exist to the reader at all.
  expect(treeMove(nodes, 2, 'ArrowRight')).toEqual({ expand: 2 });
});

test('right on a branch that is already open steps into it', () => {
  expect(treeMove(nodes, 0, 'ArrowRight')).toEqual({ move: 1 });
});

test('right on a leaf does nothing rather than moving to the next node', () => {
  // Down is the key for the next node. A Right that fell through to it would take a reader who
  // is walking into branches somewhere they did not ask to go.
  expect(treeMove(nodes, 1, 'ArrowRight')).toBe(null);
  expect(treeMove(nodes, 3, 'ArrowRight')).toBe(null);
});

test('right on an open branch with nothing in it stays put', () => {
  // A branch that says it is open and has no children — a page that rendered an empty group.
  // Without the level check the step lands on the *sibling* below, which is a Right that walked
  // sideways.
  const empty = [{ level: 0, expanded: true }, { level: 0, expanded: null }];
  expect(treeMove(empty, 0, 'ArrowRight')).toBe(null);
});

test('left closes an open branch', () => {
  expect(treeMove(nodes, 0, 'ArrowLeft')).toEqual({ collapse: 0 });
});

test('left on anything else climbs to the branch it is inside', () => {
  expect(treeMove(nodes, 1, 'ArrowLeft')).toEqual({ move: 0 });
  expect(treeMove(nodes, 2, 'ArrowLeft')).toEqual({ move: 0 });
});

test('left climbs past siblings to the parent, not to the node above', () => {
  // The nearest node at a *shallower* level, which on a long branch is many rows up. A step of
  // one would be Up wearing Left's clothes.
  const deep = [
    { level: 0, expanded: true },
    { level: 1, expanded: null },
    { level: 1, expanded: null },
    { level: 1, expanded: null }
  ];
  expect(treeMove(deep, 3, 'ArrowLeft')).toEqual({ move: 0 });
});

test('left at the top level does nothing, because there is nothing to climb to', () => {
  expect(treeMove(nodes, 3, 'ArrowLeft')).toBe(null);
});

test('home and end are the ends of what is visible, not of the whole tree', () => {
  expect(treeMove(nodes, 2, 'Home')).toEqual({ move: 0 });
  expect(treeMove(nodes, 0, 'End')).toEqual({ move: 3 });
});

test('a key the pattern does not name is not the tree\'s to handle', () => {
  expect(treeMove(nodes, 0, 'Tab')).toBe(null);
  expect(treeMove(nodes, 0, 'PageDown')).toBe(null);
  expect(treeMove(nodes, 0, 'Escape')).toBe(null);
});

test('an empty tree, and a focus index pointing at nothing, answer nothing', () => {
  // The frame after a page emptied the tree, and the one before it filled it.
  expect(treeMove([], 0, 'ArrowDown')).toBe(null);
  expect(treeMove(nodes, 99, 'ArrowDown')).toBe(null);
  expect(treeMove(nodes, -1, 'Home')).toBe(null);
});
