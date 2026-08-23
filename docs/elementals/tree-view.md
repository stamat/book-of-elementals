---
layout: poops-docs-theme/docs
title: Tree view
description: A nested list of links walked with the arrow keys — the APG Tree View pattern, over the sidebar markup you already wrote.
order: 17
---

# `<tree-view-elemental>`

A docs sidebar, a file list, a category picker: a nested `<ul>` of links that <kbd>Tab</kbd>
enters once and the arrow keys walk. You write the list; it writes the roles.

This is the last pattern in the APG with **no native equivalent at all**. A `<details>` nests and
a `<nav>` holds links, but neither gives you one tab stop for a hundred nodes, and that is the
whole of what a tree is for: <kbd>Tab</kbd> past a sidebar in one press instead of forty.

| Instead of | What it costs you | What this does |
| --- | --- | --- |
| [react-accessible-treeview](https://github.com/dgreene1/react-accessible-treeview) | React, and a repo whose own README opens with *"SEEKING NEW MAINTAINERS"* | one file, one dependency, and that one is the sibling spellbook |
| [bs-treeview](https://www.cssscript.com/interactive-accessible-bs-treeview/) | Bootstrap's styling and Font Awesome's icons, before anything nests | your markup, your CSS, and an optional look you can skip |
| a nested [`<disclosure-elemental>`](disclosure.html) | a tab stop per branch, which is the thing a tree exists to avoid | one tab stop, and the arrows for the rest |
| `<details>` inside `<details>` | the same, plus a summary that is a button in every branch | a node that is a link stays a link |

<!-- demo tree-view style="--code-preview-height:267px" -->

```html
<tree-view-elemental aria-label="Documentation">
  <ul>
    <li><a href="#home">Home</a></li>
    <li>
      <span>Guides</span>
      <ul>
        <li><a href="#overview">Overview</a></li>
        <li><a href="#install">Install</a></li>
        <li>
          <span>Advanced</span>
          <ul>
            <li><a href="#hooks">Hooks</a></li>
            <li><a href="#plugins">Plugins</a></li>
          </ul>
        </li>
      </ul>
    </li>
    <li data-tree-open>
      <span>Reference</span>
      <ul>
        <li><a href="#api" aria-current="page">API</a></li>
        <li><a href="#cli">CLI</a></li>
      </ul>
    </li>
    <li><a href="#about">About</a></li>
  </ul>
</tree-view-elemental>
```

```css demo
/* the roles, the rows, the rail and the chevron are the element's; the box is yours */
tree-view-elemental {
  max-inline-size: 18rem;
  padding: 0.75rem;
  border: 1px solid color-mix(in srgb, CanvasText 20%, transparent);
  border-radius: 0.5rem;
}
```

_<kbd>Tab</kbd> lands on **API**, because that is the page this sample says the reader is on —
and one more <kbd>Tab</kbd> leaves the whole tree. Inside, <kbd>↓</kbd> and <kbd>↑</kbd> walk what
you can see, <kbd>→</kbd> opens a branch and then steps into it, <kbd>←</kbd> closes one and then
climbs out of it. Type `gu` and it jumps to Guides. Click a branch heading to toggle it; click a
link and it is a link._

## The markup

The nested list a sidebar is already written as:

```html
<tree-view-elemental aria-label="Documentation">
  <ul>
    <li><a href="/">Home</a></li>
    <li>
      <span>Guides</span>
      <ul>
        <li><a href="/guides/install">Install</a></li>
      </ul>
    </li>
  </ul>
</tree-view-elemental>
```

- **A `<li>` holds one node and, where it has children, a nested `<ul>` after it.** The node is
  the `<li>`'s first element child that is not that list — an `<a href>`, a `<span>`, whatever the
  page wrote.
- **The tree needs a name.** `aria-label` on the element, or `aria-labelledby` pointing at the
  heading above it. The pattern requires it and there is nothing sensible to fall back to.
- **`data-tree-open` on an `<li>`** starts that branch open.
- **`aria-current` on a node** says which page the reader is on. The element opens every branch
  above it and starts the tab stop there — so a server-rendered sidebar hands the keyboard the
  reader's own page rather than the top of the list. `aria-current="false"` is read as what it
  means — *not* current — so a router writing it on every inactive link is safe.

## What it writes

```html
<tree-view-elemental role="tree" aria-label="Documentation">
  <ul role="none">
    <li role="none"><a href="/" role="treeitem" tabindex="0">Home</a></li>
    <li role="none">
      <span role="treeitem" tabindex="-1" aria-expanded="false"
            aria-owns="tree-view-elemental-group-1">Guides</span>
      <ul role="group" id="tree-view-elemental-group-1" hidden>…</ul>
    </li>
  </ul>
</tree-view-elemental>
```

Straight off the APG's own
[navigation tree example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-navigation/):
`role="treeitem"` on the link rather than on the `<li>`, and the `<li>` marked `role="none"` so a
`listitem` does not sit between the tree and its items.

**`aria-owns` is the load-bearing part.** A branch is a *sibling* of the node that opens it,
because a `<ul>` inside an `<a>` is not markup HTML allows — so without it the branch reads as the
node's sibling instead of its children, and every level in the tree is off by one. Measured in
Chromium's accessibility tree, with it the shape is what you would draw:

```
tree("Documentation")
  treeitem("Alpha")
  treeitem("Beta")
    group
      treeitem("Beta one")
```

**A closed branch is `hidden`, not styled away.** That takes it out of the tab order, the
accessibility tree and find-in-page in one attribute — the honest reading of "closed", and not
what a `display: none` in a stylesheet gives you, where a reader can still tab into things they
cannot see.

There is no `aria-level`, `aria-setsize` or `aria-posinset`. The pattern asks for them only when
the nodes are not all in the DOM, and here they always are: the nesting says the same thing, and
three attributes per node rewritten on every toggle are three chances to say it differently.

## The keyboard

| Key | What it does |
| --- | --- |
| <kbd>↓</kbd> <kbd>↑</kbd> | The next and previous node you can see, however deep it is |
| <kbd>→</kbd> | Opens a closed branch; on an open one, steps into it |
| <kbd>←</kbd> | Closes an open branch; on anything else, climbs to the branch it is in |
| <kbd>Home</kbd> <kbd>End</kbd> | The first and last node you can see |
| <kbd>Enter</kbd> | Follows a node that is a link; toggles one that is not |
| <kbd>Space</kbd> | Toggles a branch heading. On a link it is left alone, because there it is the page scrolling |
| a letter | Jumps to the next node starting with it; keep typing and it narrows. One that lands on no node is left to the page, so <kbd>/</kbd> still reaches Firefox's quick-find |

**<kbd>→</kbd> and <kbd>←</kbd> each do two things, and the pair is what makes it a tree.** Hold
Right and you walk down and in; hold Left and you walk up and out — without ever having to know
which of the two a given node is about to do. <kbd>←</kbd> climbs to the *parent*, which on a long
branch is many rows up, not the row above.

**One tab stop for the whole tree**, and it follows focus: leave the tree and come back and you
land where you were, not at the top.

## Which nodes open on a click

This is the markup's decision, not the element's:

| The node | Click | <kbd>Enter</kbd> | <kbd>→</kbd> |
| --- | --- | --- | --- |
| `<a href>` | follows the link | follows the link | opens the branch |
| `<span>` | toggles the branch | toggles the branch | opens the branch |

A link navigates when it is clicked because that is what a link is; a tree that swallowed the
click would be a set of links a mouse cannot follow. **The cost is real and worth stating: a
branch whose heading is a link cannot be opened with a mouse at all**, only with the keyboard, or
by going to that page and letting `aria-current` open it.

So the recipe for a branch that is *also* a page is a `<span>` heading with the page as the first
leaf under it:

```html
<li>
  <span>Guides</span>
  <ul>
    <li><a href="/guides/">Guides overview</a></li>
    <li><a href="/guides/install">Install</a></li>
  </ul>
</li>
```

## Nothing here is selected

This is a navigation tree — the nodes are destinations, the way
[`<suggest-elemental>`](suggest.html)'s options are, not values. So there is no `aria-selected`,
no selection to keep in step with focus, and no multi-select: `aria-current` is the page you are
on, it is yours to write, and the element only reads it.

The pattern's multi-select trees, its <kbd>Space</kbd>-toggles-selection model and its
<kbd>Shift</kbd> ranges are all therefore absent. A tree of checkboxes is a different element and
probably a different project.

## Events

| Event | When | `detail` |
| --- | --- | --- |
| `tree-view-toggle` | a branch opens or closes | `open`, and `node` — the element that owns the branch |

Not fired for the branches the markup asked to be open: a page listening for every branch it wrote
itself is a page told about its own state at upgrade.

## Without script

A nested list of links, in reading order, with every branch showing — a site map, and a working
page. Nothing is authored `hidden`, so nothing is lost, and the only rule that applies before
upgrade is `display: block`.

The bullets come off in the element's own stylesheet rather than in the optional theme, and that
is not a style decision: the element re-roles the lists, and a `::marker` still drawn beside every
node is the `listitem` those roles just took away, showing through. Measured in Chromium, an
unstyled tree carried a `StaticText("• ")` next to each node — a bullet announced inside a widget
with no list in it. The padding is left alone, because without the theme it is the only thing
indenting a branch.

## Styling

The structure stylesheet takes the markers off and puts the pointer on a branch heading that
toggles. The theme is a docs sidebar — a padded row per node that fills on hover, a tint and a
weight on the page the reader is on, a hairline rail down an open branch, and a chevron on the
nodes that have one. Every colour is mixed out of `currentcolor`, so it lands in the palette the
page already has, theme switch included, with nothing to configure.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--tree-view-elemental-indent` | `1.4rem` | Theme. How far a branch sits in from the node above it, rail included |
| `--tree-view-elemental-gap` | `0.05rem` | Theme. Between one node and the next |
| `--tree-view-elemental-radius` | `0.375rem` | Theme. The corner on a node's row |
| `--tree-view-elemental-marker-color` | `currentcolor` at 60% | Theme. The chevron |
| `--tree-view-elemental-node-color` | `currentcolor` at 70% | Theme. A node at rest |
| `--tree-view-elemental-hover` | `currentcolor` at 8% | Theme. The fill under the node the pointer is on |
| `--tree-view-elemental-rail` | `currentcolor` at 20% | Theme. The hairline down an open branch |
| `--tree-view-elemental-current-color` | `currentcolor` | Theme. `aria-current`: its text, and the tint behind it |

**Set `--tree-view-elemental-current-color` to your accent and the rest follows.** It is the one
colour the tree cannot guess — left alone it is a grey that cannot clash with anything, which is
also a current page that says so quietly.

The chevron is a masked icon rather than a `▸` in `content`. A character there is text, and text
in a pseudo-element is read out by some screen readers — so a state already carried, in the
reader's own language, by `aria-expanded` would be announced a second time as an arrow nobody
asked about. A mask has nothing to read, is painted in a colour mixed down from the row's own, and is the
same chevron
[`<menu-elemental>`](menu.html) draws, so a page using both has one caret rather than two drawings
of the same idea. It is also on every node, leaf or branch, empty where there is nothing to open:
the gutter is what keeps a leaf's label level with its siblings' instead of shifting left by a
chevron.

The rail is the branch's own `border-inline-start`, which is why the step in is split — the margin
puts the line under the parent's chevron and half a rem of padding is the air between it and the
labels. The step is on the branch rather than on each node, so a label that wraps keeps both lines
against the same edge instead of the second sliding under the chevron.

**The closed chevron points the same way under `dir="rtl"`,** because <kbd>→</kbd> opens a branch
in both directions. The APG mirrors the arrows only for a tree laid out *horizontally*, and
[`<tabs-elemental>`](tabs.html) and [`<toolbar-elemental>`](toolbar.html) read them the same way —
so a chevron turned round by `:dir()` alone would point one way while the key worked the other.
The rail and the indentation are logical properties and do flip, because those are layout rather
than a claim about a key.

In forced-colors mode the tint behind the current page goes, along with every other author
background; the weight stays, and the chevron is repainted in `CanvasText`. Every state you might
want to style against is an attribute already there — `[aria-expanded="true"]`, `[aria-current]`,
`[role="group"][hidden]`.

## What it will not do

No lazy loading, and therefore none of the three `aria-` attributes that exist for it. No
checkboxes, no multi-select, no drag, no rename, no inline editing — that is a file manager. No
<kbd>*</kbd>-expands-all: the pattern lists it as optional, and a key that opens forty branches at
once is a key that loses the reader's place. No search box; a tree is a shape, and filtering it is
[`<suggest-elemental>`](suggest.html)'s job next door.

```scss
@use "book-of-elementals/tree-view/style.scss";
@use "book-of-elementals/tree-view/theme.scss"; // optional
```

```javascript
import 'book-of-elementals/tree-view';
```
