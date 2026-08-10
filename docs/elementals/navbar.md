---
layout: poops-docs-theme/docs
title: Navbar
description: A navigation bar that measures itself — links that stop fitting move into an overflow panel, and when none of them fit the whole bar becomes a drawer.
order: 8
---

# `<navbar-elemental>`

A site's navigation: a row of links, some of them opening a panel of more links, and the
two things a row of links always ends up needing — somewhere for the ones that do not fit
to go, and a way to be a drawer instead on a narrow screen.

It is the
[APG Disclosure Navigation Menu](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
with one addition the APG has no opinion about, because it is not an accessibility
question: **the breakpoint is measured rather than declared.** Light DOM, no shadow root,
nothing you wrote is moved or wrapped.

<navbar-elemental class="demo-navbar" media="(min-width: 40rem)" hover>
  <div class="demo-navbar-rail">
    <ul>
      <li><a href="#navbar-elemental">Overview</a></li>
      <li>
        <button>Products</button>
        <ul>
          <li><a href="#navbar-elemental">Kestrel Cloud</a></li>
          <li><a href="#navbar-elemental">Kestrel Edge</a></li>
          <li><a href="#navbar-elemental">Status page</a></li>
        </ul>
      </li>
      <li><a href="#navbar-elemental">Pricing</a></li>
      <li>
        <button>Resources</button>
        <ul>
          <li><a href="#navbar-elemental">Docs</a></li>
          <li><a href="#navbar-elemental">Guides</a></li>
          <li><a href="#navbar-elemental">Changelog</a></li>
        </ul>
      </li>
      <li><a href="#navbar-elemental">Support</a></li>
      <li data-navbar-more>
        <button>More</button>
        <ul></ul>
      </li>
    </ul>
  </div>
  <button data-navbar-toggle aria-label="Navigation"></button>
</navbar-elemental>

Drag the window narrower. The links go behind **More** one at a time as the room runs out,
and when the last one goes the bar stops pretending to be a bar and becomes a drawer.
Nothing in that sequence is a number anybody typed.

## Usage

Edit the sample and the preview above it follows as you type. Narrow it with the width
buttons to watch the links move behind **More** one at a time, and then the whole row
become a drawer — the element is measuring, not guessing, so it answers a real viewport:

<!-- demo navbar viewport-widths="375 768 1024" style="--code-preview-height:22rem" -->

```html
<navbar-elemental class="bar" media="(min-width: 40rem)" hover>
  <div class="rail">
    <ul>
      <li><a href="/overview">Overview</a></li>
      <li>
        <button>Products</button>
        <ul>
          <li><a href="/cloud">Kestrel Cloud</a></li>
          <li><a href="/edge">Kestrel Edge</a></li>
        </ul>
      </li>
      <li><a href="/pricing">Pricing</a></li>

      <!-- where the ones that do not fit go. The element fills it. -->
      <li data-navbar-more>
        <button>More</button>
        <ul></ul>
      </li>
    </ul>
  </div>

  <button data-navbar-toggle aria-label="Navigation"></button>
</navbar-elemental>

<main>
  <p>A page under the header, so an open panel has something to hang over.</p>
</main>
```

```css demo
body { margin: 0; padding: 0; font: 1rem/1.5 system-ui, sans-serif; }

/* the preview is as tall as the sample, so the page under the header is what gives an open
   panel — and the drawer — somewhere to hang */
main { padding: 1rem; min-block-size: 11rem; }

/* The element lays out the row, its panels and its drawer. The bar around them is the page's
   — and on this one it is two rules. Without them the element is a block and its children
   stack: the row on one line and the drawer's button under it. */
.bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.9rem; }
.rail { flex: 1 1 0; }
```

```javascript
import "book-of-elementals/navbar";
```

```scss
@use "book-of-elementals/navbar/style.scss";
@use "book-of-elementals/navbar/theme.scss"; // optional look
```

The shape is most of the API. A list of links; an item that opens a panel is a `<button>`
with that panel in the same `<li>`, nested as deep as you like. Two hooks name the parts
structure cannot: the overflow item and the drawer's button.

**The list needs a box of its own** — the `.rail` above. That box is where the element
puts the copy of the row it measures, and it is the only piece of markup this element asks
for that a plain navigation would not already have. It could not be created for you: the
element would have to wrap your list in it, and then every selector you had written
against the list's parent would be pointing at the wrong element.

**The row is the first list in the element that nothing else owns.** A `<ul>` inside
another custom element — a [`<suggest-elemental>`](suggest.html) results panel, a nested
`<navbar-elemental>` — belongs to that element and is left alone. So a header carrying a
search field and no links of its own upgrades to nothing at all: no rail, no drawer, and
the panel laid out as its own element wrote it.

## API

### Attributes

| Attribute | Type    | Default | Description                                                                     |
| --------- | ------- | ------- | ------------------------------------------------------------------------------- |
| `media`   | string  | none    | The media query the bar exists in. Outside it, the drawer. Unset means a bar at every width — until the links stop fitting. |
| `min-bar-items` | number | `1` | How many links have to fit for this to still be a bar. [`2`](#how-few-links-is-not-a-bar) says one link beside an overflow button is a drawer instead. |
| `open`    | boolean | `false` | Whether the drawer is showing. Reflected, so `[open]` is a styling hook.          |
| `hover`   | boolean | `false` | A mouse also opens a panel by [pointing at it](#opening-on-hover). Never on touch, never stacked. |

### Hooks in the markup

| Attribute            | On                                | Means                                            |
| -------------------- | --------------------------------- | ------------------------------------------------ |
| `data-navbar-more`   | the last `<li>` of the row        | The overflow item. Its `<button>` is yours to label; its `<ul>` is filled by the element. |
| `data-navbar-toggle` | a `<button>` anywhere in the element | Opens the drawer while stacked. Hidden while it is a bar. |
| `data-navbar-stack`  | any `<li>` of the row             | The drawer's alone. Hidden on the bar, and never measured against it. |

All three are optional. Without an overflow item the links simply stop fitting; without a
toggle the bar never becomes a drawer; without a stack item the drawer holds exactly what
the bar does.

`data-navbar-stack` is for what a header keeps outside its navigation until there is no
outside left — a sign-in link, a language picker, the calls to action in
[the example](../examples/site-navigation.html). Marked, an item is out of the measurement
in both directions: it is not one of the links competing for room, and no copy of it
reaches the box the row is measured in, so it cannot take width from a bar it is not on.

### Properties

| Property  | Type      | Description                                              |
| --------- | --------- | -------------------------------------------------------- |
| `open`    | boolean   | Gets and sets the `open` attribute.                       |
| `hover`   | boolean   | Gets and sets the attribute. Reads `false` while stacked, whatever the markup says. |
| `stacked` | boolean   | Read-only. Whether it is currently the drawer.            |
| `row`     | Element   | Read-only. The list of links.                             |
| `rail`    | Element   | Read-only. The box it is measured in.                     |
| `items`   | Element[] | Read-only. The row's items, minus the overflow one.       |
| `toggle`  | Element   | Read-only. The drawer's button.                           |

### Events

`navbar-toggle` fires whenever any panel opens or closes — the drawer included — and
bubbles.

```javascript
document.querySelector("navbar-elemental").addEventListener("navbar-toggle", (e) => {
  console.log(e.detail.panel, e.detail.open);
});
```

| Detail  | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| `panel` | Element | The list that opened or closed.  |
| `open`  | boolean | Which way it went.               |

### What it writes

On the element:

| Attribute          | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| `data-mode`        | `bar` / `stack`                                              |
| `data-overflowing` | Present while some — not all — of the links are behind the overflow button |

On the markup:

| Element                    | Attribute            | Value                                  |
| -------------------------- | -------------------- | -------------------------------------- |
| every trigger, and the toggle | `type`            | `button`, if none was set              |
| every trigger, and the toggle | `aria-controls`   | The id of the list it opens            |
| every trigger, and the toggle | `aria-expanded`   | `true` / `false`                       |
| an item that did not fit   | `data-overflow`      | Present                                |
| the row's own box          | `data-navbar-rail`   | Present                                |
| the copy being measured    | `data-navbar-probe`  | Present                                |
| a `<span>` put inside the toggle | `data-navbar-bars` | Present, `aria-hidden` — the middle bar of the hamburger |

No `role`, anywhere. That is the pattern, not an omission — see
[below](#why-not-a-menubar). A closed panel carries `hidden`, and lists without an `id`
are given one.

The `<span>` is the one piece of markup the element adds to what you wrote, and it is there
because a hamburger that crosses into an X is three lines while a button has two
pseudo-elements. It is first in the button, so a toggle with a label reads icon-then-label;
it is `aria-hidden`, because the button's own name already says what the button does; and
nothing is drawn on it without [the optional theme](#the-look).

### Keyboard

The APG's table, including the rows it marks optional:

| Key                                 | Does                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> | Moves through the bar, and into and through an open panel  |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggles a trigger, or follows a link                        |
| <kbd>Escape</kbd>                   | Closes the panel focus is in, focus back on its trigger      |
| <kbd>Down</kbd> / <kbd>Right</kbd>  | Next item — or, on a trigger already open, the first item of its panel |
| <kbd>Up</kbd> / <kbd>Left</kbd>     | Previous item                                               |
| <kbd>Home</kbd> / <kbd>End</kbd>    | First / last item                                           |

The arrows do not wrap at the ends, because the pattern's own wording for every one of
them is "and it is not the last": off the end of the bar is where the rest of the page is,
and <kbd>Tab</kbd> is how you get there. Tabbing past the last link of an open panel
leaves it — and closes it on the way out, which is the APG's behaviour and
[1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html)'s
as well.

Stacked, the arrows walk everything on screen from the top of the drawer down, rather than
stopping at the edge of a list the reader is looking straight through.

Inside a panel the vertical keys stop scrolling the page, and they keep doing so at the ends
of it — <kbd>Down</kbd> on the last item of an open panel does nothing rather than scrolling
the page out from under a reader who is still in that panel. On the bar itself they are left
alone once there is nowhere to go, because a bar runs the other way and the page is what is
below it.

## Measuring instead of guessing

The usual way to fold a navigation away is a breakpoint: below 40rem, hamburger. Which is
a guess about the one thing the author cannot know — how many links this site has, how
long their labels are in the reader's font, whether that font has even arrived yet. Get it
wrong one way and links overlap the search field at 900px; get it wrong the other and a
bar with three short links hides them all on a tablet with room to spare.

So the row is measured. An `IntersectionObserver` reports which items are not entirely
inside it, those items leave the row, and copies of them appear under the overflow button.

The interesting part is what gets observed, and it is not the row:

> Hiding an item shrinks the row's contents, which makes the next item fit, which hides
> that one instead. An observer watching the box it is also changing is an infinite loop
> that eats a navigation one frame at a time.

So the element clones the row once, drops the clone in the rail beside it, and watches
**the clone**. The clone is never touched again. The row is free to change, because nothing
is measuring it — which is what lets the overflow button sit immediately after the last
link that fits, rather than being shoved off the end of the bar by a row full of hidden
boxes that still take up space.

Two details of the clone, both about width. Its panels are removed: an absolutely
positioned box adds nothing to a row's width, and a copy of one would be a second box
answering to the same anchor name. And its overflow item is moved to the front, where the
box reserves exactly the room the real one will take at the other end — the row has to be
measured against the space left *once the overflow button is on it*, or the last link and
the button fight over the same pixels.

There is no `resize` listener, because there is nothing for one to do: an intersection is
recomputed when it changes, whoever changed it. Which includes the case a cached set of
measurements gets wrong forever — a webfont arriving late changes every label's width, the
clone's geometry changes with it, and the observer says so.

### Why it cannot oscillate

Three things move on their own here, and each one only ever pushes in one direction:

- **The overflow button.** It appears only when something does not fit *while it is
  absent*, and its arrival takes room away — so whatever did not fit still does not. It
  goes away only when everything fits *while it is present*, and its departure gives room
  back — so everything still fits.
- **The drawer.** Switching to it hides the row but not the clone, so the measurement
  survives being collapsed. A bar with nothing left to measure could never come back out.
- **`media`.** A query cannot oscillate, because nothing the element does changes the
  width of the window.

Which is also the one trap worth knowing about when you style this thing: **do not key
anything that changes the bar's own width off `data-mode`.** Moving a call to action out of
the bar when it goes to `stack`, say, hands the row a hundred and fifty pixels, which lets
the links fit, which puts the button back, which takes the room away again. That is what
`media` is for — see [the example](../examples/site-navigation.html), which does exactly
this and explains why.

## Two modes

`data-mode` is which widget the bar is right now, and the element writes it so a
stylesheet reads the mode back off the element rather than repeating the query in `media`
and drifting from it.

| | `bar` | `stack` |
| --- | --- | --- |
| The row | one line, overflow behind the button | a drawer under the whole element |
| Panels | float over the page, one at a time | in the flow, as many as you opened |
| Sibling panels | close each other | stay open |
| Arrows | walk the current list | walk everything on screen |
| `hover` | opens a panel | ignored |
| Click outside | closes | leaves it open |
| Closed panels | `hidden` | `hidden="until-found"` |

That last row is the one that looks like an inconsistency and is not. A stacked panel is
hidden with `until-found`, so find-in-page reaches a link inside a closed drawer, opens it
and scrolls to it. A panel on the bar is hidden with a plain `hidden`, because
`until-found` hides a box's *contents* and keeps the *box* — and a box with a border, a
background and a shadow on it and nothing inside is a small empty smudge parked under the
button. The drawer can have both because the element takes the frame off a hidden drawer,
whatever the theme put there, so there is nothing left to leave behind.

Crossing between the modes closes whatever was open, because what was open belonged to the
other widget.

## Staying on screen

A panel near an edge would open past it. This element leaves that to CSS anchor
positioning, in its own stylesheet, with no script involved:

```css
navbar-elemental[data-mode="bar"] [data-navbar-rail] > ul > li {
  anchor-scope: --navbar-elemental-branch;
}

navbar-elemental[data-mode="bar"] [data-navbar-rail] > ul > li > button {
  anchor-name: --navbar-elemental-branch;
}

navbar-elemental[data-mode="bar"] [data-navbar-rail] > ul > li > ul {
  position-anchor: --navbar-elemental-branch;
  position-area: block-end span-inline-end;
  position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
}
```

[`<menu-elemental>`](menu.html#staying-on-screen) measures this in JavaScript instead, and
the difference is instructive: its submenu carets have to point at the side the panel
actually took, and no CSS selector can ask which fallback won. A caret on a bar points
down whatever happens, so there is nothing to keep in step, so CSS can have it.

Two things about it, both learned the hard way:

- **Nothing above a panel may be `position: relative`.** A positioned ancestor becomes the
  panel's containing block, and the fallbacks are judged against _that_ box — one the size
  of a bar, which every panel overflows and none can escape, so none of the flips ever
  fire. Which also rules out `container-type` on the bar: it brings layout containment, and
  layout containment is a containing block.
- **`anchor-scope` is not optional.** Without it every panel resolves the same anchor name
  and they all stack on the first button.

Where anchor positioning is missing the panels stay at their static position, which is
under their own button anyway.

## Opening on hover

`hover` adds the pointer to the ways a panel opens — and pointing at one panel is also the
instruction to close the others, since they overlap and only one of them can be read at a
time:

```html
<navbar-elemental hover media="(min-width: 40rem)">…</navbar-elemental>
```

It is an addition and never a replacement: click, <kbd>Enter</kbd> and the arrow keys work
exactly as before, because a navigation that only opens under a steady hand is one some
readers cannot open at all. Four things it deliberately does not do:

- **Nothing on touch.** A touch "hover" is the tap that was about to choose something, so
  the pointer type is checked and only a mouse counts.
- **Nothing stacked.** In the drawer the panels are in the flow, and a pointer crossing the
  stack on its way somewhere would open every one it passed.
- **It does not move focus.** The reader's caret stays where they put it, so the arrow keys
  carry on from there rather than from wherever the mouse happened to be.
- **It never closes a panel the keyboard is inside.** Closing one out from under the caret
  leaves focus on a hidden element, which is focus nowhere.

Leaving the bar closes the panels after a beat — the gap between a label and its panel is
somewhere a pointer passes through, not somewhere it means to be.

## Why not a menubar

Because these are **links to pages**. `role="menuitem"` replaces link semantics: a screen
reader announces "menu item" rather than "link", and the promises that come with a link go
with it. That is the right trade for a command and the wrong one for a page somebody might
want to open in a new tab.

The APG's own
[Navigation Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/)
example opens by talking you out of itself:

> The `menubar` pattern requires complex functionality that is unnecessary for typical site
> navigation that is styled to look like a menubar with expandable sections or fly outs. […]
> the Disclosure Pattern […] is better suited for most web sites because few sites need the
> additional keyboard functionality required to support the ARIA `menubar` and `menu` roles.

[`<menu-elemental>`](menu.html) is the one for **commands** — account menus, editor
toolbars, "more actions" buttons — and it does write those roles, because there they are
the honest description.

## Without JavaScript

The links are authored plainly visible, with every nested list under its own item and
every one of them reachable. The drawer's button is hidden until the element upgrades, and
the overflow item is hidden until there is something behind it, so a failed script leaves
a page whose navigation is a list of links — which is what it was underneath all along.

There is no copy of the row in the markup to go stale, either: the copies are made on
upgrade and removed again if the element leaves the document.

## The look

The element's own stylesheet places the lists, decides which of them are on screen, and
builds the rail. That is all — no borders, no colours, no padding, and nothing at all about
the bar around the row: where the logo goes and how wide the search field is are the page's
business, which is what `data-mode` is for.

```scss
@use "book-of-elementals/navbar/style.scss";
```

The optional theme adds a look: panels, hover states, a caret that points down on the bar
and turns like a disclosure's in the drawer, and a hamburger on the toggle that crosses into
an X while the drawer is open. It is built out of `currentcolor` and `Canvas`, so it follows
a page's palette and its theme switch without configuration.

The drawer it draws hangs off the bar rather than floating under it — no top edge, no top
corners, and a slide-and-fade on the way in and out. It scrolls itself once it is taller
than what is left of the screen (`max-block-size: calc(100dvh - 100%)`, the percentage being
the bar's own height), so a long navigation on a phone ends in a scrollbar rather than
somewhere below the fold. That ceiling is right while the header is at the top of the
viewport, which is where a header that opens a drawer is; halfway down a scrolled page the
drawer is shorter than it needed to be.

Two things a page around it may want back. A toggle holding nothing but the icon is a square
sized off the icon; one with a label beside it stays a pill. And if your bar draws its own
bottom border, the drawer covers it — the drawer is positioned against the element's padding
box, which is inside that border, so hand the pixel back:

```css
navbar-elemental[data-mode="stack"] .rail > ul:not([data-navbar-probe]) {
  margin-block-start: 1px;
}
```

```scss
@use "book-of-elementals/navbar/theme.scss";
```

| Property                            | Default               |
| ----------------------------------- | --------------------- |
| `--navbar-elemental-radius`         | `0.375rem`            |
| `--navbar-elemental-inset`          | `0.35rem`             |
| `--navbar-elemental-gap`            | `0.15rem`             |
| `--navbar-elemental-caret-size`     | `0.75em`              |
| `--navbar-elemental-hamburger-size` | `1.25em`              |
| `--navbar-elemental-bar-thickness`  | `2px`                 |
| `--navbar-elemental-bar-gap`        | `0.35em`              |
| `--navbar-elemental-surface`        | `Canvas`              |
| `--navbar-elemental-hover`          | `currentcolor` at 10% |
| `--navbar-elemental-border`         | `currentcolor` at 20% |
| `--navbar-elemental-shadow`         | `0 4px 20px` at 15%   |

`--navbar-elemental-surface` is the one worth re-pointing: a page whose background is not
quite `Canvas` wants its panels to match the page rather than the browser. Turn it in the
**Options** tab and copy the rule out of the bottom of the panel:

<!-- demo navbar tab="options" viewport-widths="375 768 1024" -->

```html
<navbar-elemental class="bar">
  <div class="rail">
    <ul>
      <li><a href="/overview">Overview</a></li>
      <li>
        <button>Products</button>
        <ul>
          <li><a href="/cloud">Kestrel Cloud</a></li>
          <li><a href="/edge">Kestrel Edge</a></li>
        </ul>
      </li>
      <li><a href="/pricing">Pricing</a></li>
    </ul>
  </div>

  <button data-navbar-toggle aria-label="Navigation"></button>
</navbar-elemental>

<main>
  <p>Turn the knobs above and the header answers.</p>
</main>
```

```css demo
body { margin: 0; padding: 0; font: 1rem/1.5 system-ui, sans-serif; }

/* the page under the header, which is what an open panel hangs over */
main { padding: 1rem; min-block-size: 11rem; }

/* the bar is the page's two rules, as everywhere else on this page */
.bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.9rem; }
.rail { flex: 1 1 0; }
```

## What is deliberately not here

- **No priority list.** The links fold away in DOM order, last one first. Which link a site
  would rather keep is a thing only that site knows.
- **No count on the overflow button.** "More (2)" is easy from the same attribute and is a
  number that changes while you drag a window edge, which is not information.
- **No `aria-current`.** That is the page's to set — `"page"` on the link for the page you
  are on, `"true"` on the item whose panel holds it — and nothing here knows which page you
  are on.
- **No search, no logo, no buttons.** A navbar full of slots for things it does not
  understand is a framework. Those go beside the row, in the bar, where they are yours;
  [the example](../examples/site-navigation.html) is a header built that way.

<script src="../dist/elementals/navbar.js"></script>
