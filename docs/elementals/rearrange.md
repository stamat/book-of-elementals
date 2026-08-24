---
layout: poops-docs-theme/docs
title: Rearrange
description: A list or a table body the reader can rearrange — the buttons first, the drag second, and the announcement every drag library forgets.
order: 26
navGroup: No APG pattern
---

# `<rearrange-elemental>`

Wrap an `<ol>`, a `<ul>` or a `<table>` and its items can be rearranged by hand. You write the
markup; it writes the buttons.

There is no APG pattern for rearranging. The closest thing the APG has is its
[rearrangeable listbox example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/),
and what is taken from it is the part that is not the listbox: buttons that move an item,
`aria-keyshortcuts` naming the fast way to press them, focus staying on the button that moved,
and a live region confirming where the thing landed. The listbox roles are deliberately left
behind — a list of things you are rearranging is a list, not a set of options you are choosing
between, and `role="listbox"` would tell the reader they are picking one.

<!-- demo rearrange style="--code-preview-height:234px" -->

```html
<rearrange-elemental drag>
  <ol>
    <li><span class="rearrange-elemental-handle" data-rearrange-handle aria-hidden="true"></span>Boil the kettle</li>
    <li><span class="rearrange-elemental-handle" data-rearrange-handle aria-hidden="true"></span>Warm the pot</li>
    <li><span class="rearrange-elemental-handle" data-rearrange-handle aria-hidden="true"></span>Measure the leaves</li>
    <li><span class="rearrange-elemental-handle" data-rearrange-handle aria-hidden="true"></span>Pour, and wait</li>
  </ol>
</rearrange-elemental>
```

```css demo
/* the arrows, the grip and the lift are the theme's; every line here is the page's */
ol { margin: 0; padding: 0; list-style: none; }
li { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.6rem; border: 1px solid color-mix(in srgb, CanvasText 15%, transparent); border-radius: 0.4rem; }
li + li { margin-block-start: 0.35rem; }
/* the grip is the item's first child, so the flex row puts it at the front on its own; the
   controls are the last, and this is what pushes them to the far end */
[data-rearrange-controls] { margin-inline-start: auto; }
```

_Press the arrows, or hold <kbd>Alt</kbd> and use <kbd>↑</kbd> <kbd>↓</kbd> from anywhere in the
row. Drag by the grip with a mouse or a finger, and <kbd>Esc</kbd> mid-drag puts the item back.
The button at the top of the list keeps its name and its focus — it just does nothing._

## The buttons are the element; dragging is the option

Every pointer-drag library gets this the other way round and bolts a keyboard mode on the side.
[WCAG 2.2 SC 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
(AA) names this exact case and asks for the opposite — *"a sortable list of elements may, after
tapping or clicking on a list element, provide adjacent controls for moving the element up or
down in the list by simply tapping or clicking"*.

Written this way round, the criterion is met by construction: the button path cannot be switched
off, because `drag` only ever adds a second way to do what the buttons already do. Leave `drag`
off and you have a list that rearranges with no dragging in it at all — which is also the version
that works on a switch, a head pointer and a screen reader's touch gestures.

## The markup

A list. That is the whole of it:

```html
<rearrange-elemental>
  <ul>
    <li>Bananas</li>
    <li>Kiwi</li>
  </ul>
</rearrange-elemental>
```

- **One container, as a direct child:** an `<ol>`, a `<ul>`, a `<menu>`, or a `<table>` — whose
  first `<tbody>` is the container and whose `<tr>`s are the items. The items are the container's
  own children, so a nested list inside an item is not part of this one. The first `<tbody>` only:
  a table with several is using them to group, and moving a row between groups would be
  rearranging the grouping away.
- **`data-label` on an item** is what the buttons and the announcement call it. Without one the
  item's own text is used, collapsed and cut at 80 characters on a word boundary — which is fine
  for `Bananas` and not for a paragraph. A **row** is named by its `<th scope="row">`, or by its
  first cell when it has none: every cell run together is the whole record read out before the
  word "up", once per button and again on every move.
- **`data-rearrange-cell` on a cell** says which column the controls belong in. Without one they go
  in the row's last cell, which is the choice that needs no extra `<th>` in the header.
- **`data-rearrange-handle` inside an item** is your own grip, used instead of the one the element
  would write. It is your markup: give it `aria-hidden="true"` if it is a glyph, and the element
  leaves it alone when `drag` goes away. It is also the only way to a grip somewhere the controls
  are not — the front of the item, rather than beside the buttons at the end of it. The samples on
  this page borrow `class="rearrange-elemental-handle"` so the theme paints their grip; a page
  with a look of its own writes one.

## What it writes

Into every item, after whatever was already there:

```html
<span class="rearrange-elemental-controls" data-rearrange-controls>
  <span class="rearrange-elemental-handle" data-rearrange-handle data-rearrange-own aria-hidden="true"></span>
  <button type="button" class="rearrange-elemental-move" data-move="up" aria-keyshortcuts="Alt+ArrowUp" aria-disabled="true">
    <span class="rearrange-elemental-label">Move Bananas up</span>
  </button>
  <button type="button" class="rearrange-elemental-move" data-move="down" aria-keyshortcuts="Alt+ArrowDown">
    <span class="rearrange-elemental-label">Move Bananas down</span>
  </button>
</span>
```

and once, at the end of the element:

```html
<p class="rearrange-elemental-status" role="status"></p>
```

The handle is only there when `drag` is set. Nothing else is added, nothing is wrapped, and no
role is written onto your list or your items.

**The button's name is its own visible text.** An icon with an `aria-label` over it would be a
name written nowhere on the screen, which fails
[WCAG 2.2 SC 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)
and leaves a reader speaking to their computer with nothing to say. The theme clips the span and
draws an arrow over it, which moves nothing out of the accessibility tree; with no theme loaded
the buttons read what they do.

**The name carries the item, not just the direction.** `Move up` repeated down a list is a rotor
full of identical buttons and no way to tell which is which. Set `up-text`, `down-text` and
`moved-text` to say it in your language — `{label}`, and `{position}` and `{total}` in the last of
them, are filled in, and anything else in the string is left as written, so a typo comes back
visible instead of blanking half the sentence.

## `aria-disabled`, never `disabled`

The first item's up button and the last item's down button do nothing, and say so with
`aria-disabled="true"`. They stay focusable and stay named.

A `disabled` button drops the focus that is on it to `<body>` — so a reader pressing *up*
repeatedly to walk an item to the top of the list arrives at the top and is nowhere, at the one
moment they most needed to be told where they are. The press is a no-op instead, and the live
region says nothing, because nothing happened.

## Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Into the buttons, and on. They are ordinary `<button>`s, so <kbd>Enter</kbd> and <kbd>Space</kbd> are the browser's |
| <kbd>Alt</kbd> + <kbd>↑</kbd> / <kbd>↓</kbd> | Move the item, from anywhere inside it |
| <kbd>Esc</kbd> | Cancels a pointer drag in flight, putting the item back where it started |

**Focus stays on the button that moved**, which is what makes the second press the same press:
an item three places from where it belongs is three presses of one key, not three round trips
through the tab order. That is the rearrangeable listbox example's own reasoning, and
`aria-keyshortcuts` on the buttons is how a reader finds the shortcut exists.

There is no grab mode — no <kbd>Space</kbd> to pick up, arrows to move, <kbd>Space</kbd> to drop.
It would be a second way to do what the buttons do, it needs `role="application"` on the grabbed
element to take the arrow keys off the screen reader's own navigation, and a mode is a state both
you and the reader have to hold. <kbd>Alt</kbd> and an arrow is the fast path without one.

## Dragging

`drag` adds a grip to every item and lets a pointer move them. It is pointer events and a
captured pointer, not the
[HTML drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API):
that one has no touch support at all — which is why every library built on it ships a fallback
mode — and its ARIA half, `aria-grabbed` and `aria-dropeffect`, was deprecated in ARIA 1.1 with
nothing put in its place.

- **`touch-action: none` is on the handle alone.** On the item it would take the page's scrolling
  away everywhere a finger lands on a list, which is most of a phone screen.
- **The item is taken over as soon as the pointer passes the middle of its neighbour**, which is
  what makes a drag feel the same in both directions between rows of different heights. The
  neighbour is measured with the dragged item lifted out of the way, so undoing a swap costs the
  dragged item's own height in travel instead of the two rows trading places under a still finger.
- **The item moves in the DOM as it goes**, rather than a ghost being animated into place at the
  end — so what you are dragging is the real item in its real position.
- **One event per landing**, not one per row crossed. A page persisting the order to a server
  should not spend six requests on one drag.
- **The handle is `aria-hidden` and not focusable.** The keyboard's way in is the two buttons
  beside it, and a focusable control that does nothing when you press it is worse than none.

Where the browser has it, the move is
[`moveBefore()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore) rather than
`insertBefore()` — it moves the node instead of removing and re-inserting it, so focus, `:active`,
a running animation and any iframe or media inside the item survive the move. It is not Baseline
yet (Chrome 133, and an Interop 2026 focus area), so `insertBefore()` is the fallback, and the
focus this element knows about is put back by hand.

## What the reader hears

One `role="status"` region, polite, clipped out of sight, saying where the item landed:

> Bananas moved to position 2 of 4

Polite rather than assertive: the reader pressed the button, so the answer waits for a gap in
what is already being read instead of cutting into it. The announcement is held back by 100ms —
[Primer's tested value](https://primer.style/accessibility/patterns/drag-and-drop/) for the same
problem — because <kbd>Alt</kbd> and an arrow repeats when held and a drag crosses several rows a
second, and without it the reader hears the journey instead of the destination.

The position is in the announcement and not in the button's name. Focus stays on the button after
a move, and a name that changed under it would be read a second time by some screen readers —
once as the button, once as the news.

## Events

| Event | When | `detail` |
| --- | --- | --- |
| `rearrange-move` | an item landed somewhere new | `item` — the `<li>`, `from` and `to` — zero-based positions |

Bubbles. Not fired for a press at the end of the travel, or for a drag that ended where it
started, or for one cancelled with <kbd>Esc</kbd>.

`move` rather than `rearrange`, because what happened is that **one item moved** — the list is
the thing that is rearrangeable, and the event is about the item.

Nothing is persisted — where the order is kept is your business, and this is where you hear about
it:

```javascript
element.addEventListener('rearrange-move', (event) => {
  const order = [...event.currentTarget.items].map((item) => item.dataset.id);
  fetch('/order', { method: 'POST', body: JSON.stringify(order) });
});
```

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `drag` | boolean | absent | Also let a pointer drag the items, by a grip the element adds. The buttons stay either way |
| `up-text` | string | `Move {label} up` | The first button's name |
| `down-text` | string | `Move {label} down` | The second button's name |
| `moved-text` | string | `{label} moved to position {position} of {total}` | What the live region says |

On the items, not on the element:

| Attribute | On | What it does |
| --- | --- | --- |
| `data-label` | an `<li>` or `<tr>` | What that item is called in the buttons and the announcement |
| `data-rearrange-handle` | anything inside an item | Your own grip, used instead of the element's |
| `data-rearrange-cell` | a `<td>` or `<th>` in a row | Which cell the controls go in. The last cell without one |

## Table rows

A `<table>` works the same way, with two differences the markup forces:

<!-- demo rearrange style="--code-preview-height:229px" -->

```html
<rearrange-elemental drag>
  <table>
    <caption>Peaks, in the order you would climb them</caption>
    <thead>
      <tr><th>Peak</th><th>Height</th><th><span class="sr">Order</span></th></tr>
    </thead>
    <tbody>
      <tr><th scope="row"><span class="rearrange-elemental-handle" data-rearrange-handle aria-hidden="true"></span>Midžor</th><td>2169</td><td data-rearrange-cell></td></tr>
      <tr><th scope="row"><span class="rearrange-elemental-handle" data-rearrange-handle aria-hidden="true"></span>Đeravica</th><td>2656</td><td data-rearrange-cell></td></tr>
      <tr><th scope="row"><span class="rearrange-elemental-handle" data-rearrange-handle aria-hidden="true"></span>Rtanj</th><td>1560</td><td data-rearrange-cell></td></tr>
    </tbody>
  </table>
</rearrange-elemental>
```

```css demo
/* the arrows, the grip and the lift are the theme's; every line here is the page's */
table { border-collapse: separate; border-spacing: 0; inline-size: 100%; }
caption { margin-block-end: 0.5rem; font-weight: 600; text-align: start; }
th, td { padding: 0.4rem 0.6rem; text-align: start; border-block-end: 1px solid color-mix(in srgb, CanvasText 20%, transparent); }
tbody th { font-weight: 400; }
/* the grip sits in the row's name cell, on the text's own line */
.rearrange-elemental-handle { margin-inline-end: 0.35em; vertical-align: middle; }
/* the column the controls live in, kept as narrow as they are */
td[data-rearrange-cell] { inline-size: 1%; white-space: nowrap; }
/* the header cell over it has a name for screen readers and nothing to show */
.sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
```

- **The controls go inside a cell**, not between two of them. A `<span>` as a child of `<tr>` is
  fostered out of the table by the parser, and one appended through the DOM instead lands in an
  anonymous cell that widens the row by a column nothing declared. Without `data-rearrange-cell` the
  last cell is used, so a table that has a spare column needs no markup change at all.
- **A row is named by one cell**, as above.
- **A grip at the front of a row is markup you write.** A row's layout is its cells, so there is
  no reordering the one the element would write out of the cell the buttons are in —
  `data-rearrange-handle` on a `<span>` in the cell you want it in, and the element writes none of
  its own.

**This is not [`<sortable-table-elemental>`](sortable-table.html) and the two do not belong on the
same table.** That one sorts by a key in the cells and the order is derived; this one is a hand
order that nothing derives. A table wearing both has two answers to "what order are these rows
in", and the last thing pressed wins — which is a table whose order silently depends on what the
reader did last.

## Items that arrive later

The controls are written at upgrade. A list that grows afterwards — a row appended by a render,
a page of results fetched in — gets its buttons from `.update()`:

```javascript
element.querySelector('ol').append(row);
element.update();
```

There is no `MutationObserver` behind it. One is the upgrade if this turns out to be the common
case rather than the rare one.

## Without script

Your list or your table, in the order it arrived, and no buttons — which is a list, and a working
page. The element is `display: contents`, so wrapping markup you already had changes no layout at
all, upgraded or not.

## Styling

The element's own stylesheet has no look in it. It places the controls, makes the handle
draggable, stops a drag selecting the text it passes over, and clips the live region — and it
deliberately says nothing about where in the item the controls sit. A `display: flex` on your
`<li>` would be this element laying out markup you wrote and may already have laid out, so the
controls are an inline box that sits on the text baseline, and pushing them to the far end is one
rule of yours:

```css
li { display: flex; align-items: center; }
[data-rearrange-controls] { margin-inline-start: auto; }
```

That rule works with no `!important` and no longer selector because the theme's own margin on the
controls is written inside `:where()` and weighs nothing. It is a default, not a decision.

The grip is placed the same way, by being somewhere else in the markup: `data-rearrange-handle`
on a `<span>` at the front of the item leaves the element writing only the two buttons, which stay
in the box the rule above pushes to the end.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--rearrange-elemental-control-size` | `1.75em` | Theme. Both axes of one button, and of the grip |
| `--rearrange-elemental-gap` | `0.15em` | Theme. Between the grip and the buttons, and between the buttons |
| `--rearrange-elemental-radius` | `0.3rem` | Theme. Button corners |
| `--rearrange-elemental-color` | `currentcolor` | Theme. The arrows |
| `--rearrange-elemental-hover` | `currentcolor` at 8% | Theme. Fill under the pointer |
| `--rearrange-elemental-disabled-opacity` | `0.3` | Theme. The button at the end of its travel |
| `--rearrange-elemental-grip` | `currentcolor` at 45% | Theme. The dots on the handle |
| `--rearrange-elemental-lift` | `0 0.1rem 0.3rem currentcolor` at 10% | Theme. Under the item while it is dragged |
| `--rearrange-elemental-surface` | `Canvas` | Theme. What the dragged item is painted on — re-point it on a card |

The arrows are drawn with borders rather than written as `▲`, for the reason
[`<sortable-table-elemental>`](sortable-table.html)'s arrow is: text in a pseudo-element is read
out by some screen readers, and the button's name already says which way it goes.

`1.75em` is 28px at a 16px root — past the 24px
[WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) asks
for at AA, short of the 44px 2.5.5 asks for at AAA. Re-point the property on a page where these
are the primary controls.

## What it will not do

- **Two containers.** Dragging between them is a second element's worth of drop-target semantics,
  and a kanban board is not a smallest functional whole.
- **Columns, grids or nesting.** One axis, one container — rows move, columns do not.
- **Persistence.** The event is the whole of the integration.
- **A grab mode.** Covered above: it is a second way to do what the buttons do, and it costs
  `role="application"`.
