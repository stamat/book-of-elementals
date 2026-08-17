---
layout: poops-docs-theme/docs
title: Menu
description: A button and the nested lists it opens — the APG Menu Button pattern, and a flyout that stops being a menu below a breakpoint.
order: 6
---

# `<menu-elemental>`

A `<button>` and the nested lists it opens, per the
[APG Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) — plus
one thing the APG has no opinion about, because it is a layout question: below a
breakpoint the whole thing stops being a menu. Light DOM, no shadow root, nothing
moved or wrapped.

<div class="demo-row">
  <menu-elemental id="menu-demo" media="(min-width: 40rem)">
    <button>Account</button>
    <ul>
      <li><a href="#menu-elemental">Profile</a></li>
      <li>
        <button>Preferences</button>
        <ul>
          <li><a href="#menu-elemental">Theme</a></li>
          <li><a href="#menu-elemental">Language</a></li>
          <li><a href="#menu-elemental">Notifications</a></li>
        </ul>
      </li>
      <li><a href="#menu-elemental">Sign out</a></li>
    </ul>
  </menu-elemental>
</div>

Open it with the mouse, then try it with the keyboard: <kbd>Down</kbd> to open,
arrows to move, <kbd>Right</kbd> into a submenu, <kbd>Left</kbd> back out,
<kbd>Escape</kbd> to close, or type the first letters of an item. Then narrow the
window past 40rem and try it again — it is a different widget down there, on the same
markup.

## Usage

Edit the sample and the preview above it follows as you type. The width buttons are the
point here — `media` is what decides whether this is a flyout or a stack of disclosures,
and 375px is the width where it stops being a menu:

<!-- demo menu viewport-widths="375 768" style="--code-preview-height:246px" -->

```html
<menu-elemental media="(min-width: 40rem)">
  <button>Account</button>
  <ul>
    <li><a href="/profile/">Profile</a></li>
    <li>
      <button>Preferences</button>
      <ul>
        <li><a href="/preferences/theme/">Theme</a></li>
        <li><a href="/preferences/language/">Language</a></li>
      </ul>
    </li>
    <li><a href="/sign-out/">Sign out</a></li>
  </ul>
</menu-elemental>

<main></main>
```

```css demo
body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; }

/* the preview is as tall as the sample, and a menu opens over the page rather than pushing
   it - so the page under the button is what an open panel has to hang over */
main { min-block-size: 11rem; }

/* a rim, so the trigger reads as something you press. The theme leaves it flat on purpose:
   a menu button is a word in a menubar - File, Edit - as often as it is a button */
menu-elemental > button {
  border: 1px solid color-mix(in srgb, currentcolor 25%, transparent);
}
```

```javascript
import "book-of-elementals/menu";
```

```scss
@use "book-of-elementals/menu/style.scss";
@use "book-of-elementals/menu/theme.scss"; // optional look
```

The shape is the whole API. A `<button>` and a list beside it; an item that opens a
submenu is a `<button>` with that submenu in the same `<li>`. Nest as deep as you
like — every level is wired the same way.

## API

### Attributes

| Attribute | Type    | Default | Description                                                                     |
| --------- | ------- | ------- | ------------------------------------------------------------------------------- |
| `media`   | string  | none    | The media query the flyout exists in. Outside it, nested disclosures. Unset means a menu at every width. |
| `open`    | boolean | `false` | Whether the root list is showing. Reflected, so `[open]` is a styling hook.      |
| `hover`   | boolean | `false` | A mouse also opens it by [pointing at it](#opening-on-hover). Never on touch, never inline. |

### Properties

| Property  | Type      | Description                                              |
| --------- | --------- | -------------------------------------------------------- |
| `open`    | boolean   | Gets and sets the `open` attribute.                       |
| `inline`  | boolean   | Read-only. Whether it is currently the stack, not the flyout. |
| `hover`   | boolean   | Gets and sets the attribute. Reads `false` while inline, whatever the markup says. |
| `button`  | Element   | Read-only. The root `<button>`.                           |
| `menu`    | Element   | Read-only. The root list.                                 |

### Events

`menu-toggle` fires on the element whenever any list opens or closes — the root one
and every submenu — and bubbles.

```javascript
document.querySelector("menu-elemental").addEventListener("menu-toggle", (e) => {
  console.log(e.detail.menu, e.detail.open);
});
```

| Detail | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| `menu` | Element | The list that opened or closed. |
| `open` | boolean | Which way it went.              |

### What it writes

On the button, and on every submenu trigger:

| Attribute       | Value                          |
| --------------- | ------------------------------ |
| `type`          | `button`, if none was set      |
| `aria-controls` | The id of the list it opens    |
| `aria-expanded` | `true` / `false`               |
| `aria-haspopup` | `menu` — flyout mode only      |

On the lists and their items, flyout mode only:

| Element            | Attribute  | Value      |
| ------------------ | ---------- | ---------- |
| every list         | `role`     | `menu`     |
| every `<li>`       | `role`     | `none`     |
| every item         | `role`     | `menuitem` |
| every item         | `tabindex` | `-1`       |

A closed list carries `hidden`. Lists without an `id` are given one.

### Keyboard

On the button:

| Key                              | Does                                  |
| -------------------------------- | ------------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Opens, focus on the first item     |
| <kbd>Down</kbd>                  | Opens, focus on the first item        |
| <kbd>Up</kbd>                    | Opens, focus on the last item         |

In an open menu:

| Key                                   | Does                                            |
| ------------------------------------- | ----------------------------------------------- |
| <kbd>Down</kbd> / <kbd>Up</kbd>       | Moves between items, wrapping at both ends      |
| <kbd>Home</kbd> / <kbd>End</kbd>      | First / last item                               |
| <kbd>Right</kbd>                      | Opens the item's submenu, focus on its first item |
| <kbd>Left</kbd>                       | Closes the submenu, focus back on the item that opened it |
| <kbd>Escape</kbd>                     | Closes the list focus is in, focus back on its trigger |
| <kbd>Enter</kbd> / <kbd>Space</kbd>   | Activates the item                              |
| Any letter                            | Jumps to the next item starting with it; keep typing to narrow |
| <kbd>Tab</kbd>                        | Leaves, and closes on the way out               |

<kbd>Tab</kbd> is not trapped, here or anywhere in this book. A menu is laid over the
page rather than replacing it, nothing behind it is `inert`, and a keyboard visitor
who cannot tab out of a dropdown is stuck on your page, not in your menu.

Inline, the letter keys, <kbd>Left</kbd> and <kbd>Right</kbd> go back to the browser —
see below.

### Styling hooks

| Selector                              | Matches                          |
| ------------------------------------- | -------------------------------- |
| `menu-elemental[open]`                | While the root list is showing    |
| `menu-elemental[data-mode="flyout"]`  | While it is a menu                |
| `menu-elemental[data-mode="inline"]`  | While it is a stack of disclosures |
| `[aria-expanded="true"]`              | An open trigger, at any level     |
| `[hidden]`                            | A closed list                     |

The element writes `data-mode` itself, so a stylesheet reads the breakpoint back off
the element rather than repeating the query in `media` and drifting from it. It writes
[`data-side` and `data-align`](#staying-on-screen) on the lists for the same reason.

## Two modes

A flyout is a desktop object. It floats over the page, one branch of it is open at a
time, and the arrow keys move between items because the items are not in the tab
order. None of that survives being 380px wide. There, the same markup wants to be a
stack of nested disclosures in a drawer: links you tab through, submenus that stay
open where you left them, no floating anything.

`media` is which is which. Inside the query, the flyout. Outside it, the stack.

```html
<menu-elemental media="(min-width: 60rem)">…</menu-elemental>
```

What changes is not only the CSS. `role="menu"` is a promise that the arrows work and
<kbd>Tab</kbd> does not, so inline the roles come off entirely — the items go back to
being links in a list, tabbable, announced as links, and the triggers stay
`aria-expanded` buttons, which is to say disclosures. Making the menu promise while
the items are a plain tabbable list would be a lie told to exactly the readers who
cannot see the layout that makes it obvious.

The rest of the differences follow from that:

| | Flyout | Inline |
| --- | --- | --- |
| Roles | `menu` / `menuitem` | none |
| Tab order | The button only | Every item |
| Sibling branches | Close each other | Stay open |
| Arrows | Walk the current list | Walk everything on screen |
| Letters | Type-ahead | The browser's |
| <kbd>Left</kbd> / <kbd>Right</kbd> | Open / close a branch | The browser's |
| Opening | Moves focus to the first item | Leaves focus alone |
| Click outside | Closes | Leaves it open |

Crossing the breakpoint closes whatever was open, because the thing that was open
belonged to the other widget.

## Staying on screen

A flyout near an edge would open past it, so the element measures before it paints and
writes where the list went. The stylesheet does the positioning from there — the same
trade as `data-mode`:

| Attribute    | On a list | Values                                              |
| ------------ | --------- | ---------------------------------------------------- |
| `data-side`  | the root  | `block-end` (under the button) / `block-start` (over it) |
| `data-side`  | a submenu | `inline-end` (beside it) / `inline-start` (the other side) |
| `data-align` | either    | `start` / `end` — which way it runs from there       |

One decision per axis, which is how a button in the bottom right corner ends up with a
menu that opens upward and a submenu that opens up **and** to the left. The preferred
placement wins when neither fits, so a panel with nowhere good to go still lands where the
reader expects it.

```css
/* your own panel, on the two attributes the element writes */
menu-elemental > ul[data-side="block-start"] {
  box-shadow: 0 -4px 20px rgb(0 0 0 / 15%);
}
```

Here is the corner case, live. The button is against the right edge, so the panel runs back
from it and the submenu opens on the side there is room for — open **Preferences** and watch
which way it goes:

<!-- demo menu style="--code-preview-height:247px" -->

```html
<div class="bar">
  <menu-elemental>
    <button>Account</button>
    <ul>
      <li><a href="/profile/">Profile</a></li>
      <li>
        <button>Preferences</button>
        <ul>
          <li><a href="/preferences/theme/">Theme</a></li>
          <li><a href="/preferences/language/">Language</a></li>
        </ul>
      </li>
      <li><a href="/sign-out/">Sign out</a></li>
    </ul>
  </menu-elemental>
</div>

<main></main>
```

```css demo
body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; }
main { min-block-size: 11rem; }

/* the whole of the setup: the button is where a header keeps its account menu, and there is
   no room to its right for either panel to run into */
.bar { display: flex; justify-content: flex-end; }

menu-elemental > button {
  border: 1px solid color-mix(in srgb, currentcolor 25%, transparent);
}
```

Nothing in the markup says "open leftward". The element measured the button against the
viewport, wrote `data-align="end"` on the root list and `data-side="inline-start"` on the
submenu, and the stylesheet did the rest — which is also why the submenu's caret points the
way it opened.


The theme reads them too: a submenu that had to open on the inline start says so with a
caret pointing that way, which is the reason this is measured in the element rather than
left to CSS `position-try-fallbacks` — nothing in CSS can select the fallback that won.

Placement is decided when a list opens and again on `resize`. Not on scroll: a page
scrolling under an open menu is the page moving out from under someone in the middle of
using it, and re-placing every frame of that costs more than it fixes. It is skipped
entirely inline, where the lists are in the flow and there is nothing to collide with.

## Opening on hover

`hover` adds the pointer to the ways it opens — the root list from the button, a branch
from its own item, and a branch closed again by pointing at any other item of the same
list:

<div class="demo-row">
  <menu-elemental class="hamburger" hover media="(min-width: 40rem)">
    <button>Menu</button>
    <ul>
      <li><a href="#opening-on-hover">Dashboard</a></li>
      <li>
        <button>Reports</button>
        <ul>
          <li><a href="#opening-on-hover">Weekly</a></li>
          <li><a href="#opening-on-hover">Monthly</a></li>
        </ul>
      </li>
      <li><a href="#opening-on-hover">Settings</a></li>
    </ul>
  </menu-elemental>
</div>

```html
<menu-elemental hover media="(min-width: 40rem)">…</menu-elemental>
```

It is an addition and never a replacement: click, <kbd>Enter</kbd> and the arrow keys
open it exactly as before, because a menu that only opens under a steady hand is a menu
some readers cannot open at all. Three things it deliberately does not do:

- **Nothing on touch.** A touch "hover" is the tap that was about to choose something,
  so the pointer type is checked and only a mouse counts.
- **Nothing inline.** Below the breakpoint the branches are stacked in the page, and a
  pointer crossing the stack on its way somewhere would open every one it passed.
  `hover` reads `false` there whatever the markup says.
- **It does not move focus.** Opening by click puts focus on the first item; opening by
  hover leaves the reader's focus where they put it, so the arrow keys carry on from
  there rather than from wherever the mouse happened to be.

Leaving the element closes it after a beat — the gap between a button and its panel is
somewhere a pointer passes through, not somewhere it means to be — and not at all if the
keyboard is still inside it.

## Menu, or navigation?

This element is for **commands** — things that act on the page or the app. Account
menus, editor toolbars, "more actions" buttons, sort and filter pickers.

For a site's own navigation — a row of links to pages, with panels of more links under
some of them — [`<navbar-elemental>`](navbar.html) is the element, and it writes no
roles at all.

The reason is `role="menuitem"`. It replaces the link semantics — a screen reader
announces "menu item", not "link", and the promises that come with a link go with it.
Which is the right trade for a command and the wrong one for a page you might want to
open in a new tab. The APG says so itself: its
[disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
example is the pattern for site navigation, and the navbar is that pattern.

For a single panel of links rather than a bar of them, there is a smaller answer still —
[`<disclosure-elemental>`](disclosure.html), or nothing but the native
[popover attribute](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), which
covers dismissal, focus return and the tab order with no script at all:

```html
<button popovertarget="site-nav">Menu</button>
<ul id="site-nav" popover>
  <li><a href="/docs/">Docs</a></li>
</ul>
```

If your nav is genuinely menu-shaped — an application's own menu bar, with commands in
it — this element is the right one and the roles are the honest description.

## Without JavaScript

The submenus are hidden by the element, not by the markup, and the stylesheet splits the
time before the element is defined on `@media (scripting)`. Scripting off: the button is
hidden and what is left is a nested list of links with every one of them reachable, and
no button that does nothing. Scripting on: the lists are hidden and the button shows, so
the page paints the closed menu from the first frame and upgrading changes nothing on
screen — no flash of the expanded tree while the bundle loads.

The line that gate draws is worth knowing: a bundle that never arrives *while scripting
is on* — blocked, 404 — leaves a button that opens nothing. The fallback covers scripting
turned off, not every way a script can fail to run.

Which is also why you should not author `hidden` on the lists yourself.

## The look

The element's own stylesheet places the lists and hides the closed ones. That is all
it does — no borders, no colors, no padding.

```scss
@use "book-of-elementals/menu/style.scss";
```

The optional theme adds a look: a panel, hover states, a caret on anything that opens
a submenu — pointing sideways in the flyout, turning down in the stack. It is built
out of `currentcolor` and `Canvas`, so it follows a page's palette and its theme
switch without configuration.

```scss
@use "book-of-elementals/menu/theme.scss";
```

| Property                       | Default                        |
| ------------------------------ | ------------------------------ |
| `--menu-elemental-radius`      | `0.375rem`                     |
| `--menu-elemental-inset`       | `0.35rem`                      |
| `--menu-elemental-caret-size`  | `0.75em`                       |
| `--menu-elemental-hamburger-size` | `1.25em`                    |
| `--menu-elemental-surface`     | `Canvas`                       |
| `--menu-elemental-hover`       | `currentcolor` at 10%          |
| `--menu-elemental-border`      | `currentcolor` at 20%          |

Turn them in the **Options** tab and copy the rule out of the bottom of the panel — the same
table, with the values live. `--menu-elemental-surface` is the one to try first: `Canvas` is
the page's own background, and it is what to re-point when the menu opens over a card:

<!-- demo menu tab="options" style="--code-preview-options-height:459px" -->

```html
<menu-elemental>
  <button>Account</button>
  <ul>
    <li><a href="/profile/">Profile</a></li>
    <li><a href="/settings/">Settings</a></li>
    <li><a href="/sign-out/">Sign out</a></li>
  </ul>
</menu-elemental>

<main></main>
```

```css demo
body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; }

/* the preview is as tall as the sample, and a menu opens over the page rather than pushing
   it - so the page under the button is what an open panel has to hang over */
main { min-block-size: 11rem; }

/* a rim, so the trigger reads as something you press. The theme leaves it flat on purpose:
   a menu button is a word in a menubar - File, Edit - as often as it is a button */
menu-elemental > button {
  border: 1px solid color-mix(in srgb, currentcolor 25%, transparent);
}
```


### The hamburger

`class="hamburger"` puts an
[Octicon three-bars](https://primer.style/foundations/icons/three-bars-16/) before the
button's label, masked rather than painted so it takes the button's own colour and
follows a theme switch:

<div class="demo-row">
  <menu-elemental class="hamburger" media="(min-width: 40rem)">
    <button>Menu</button>
    <ul>
      <li><a href="#the-hamburger">Dashboard</a></li>
      <li><a href="#the-hamburger">Settings</a></li>
    </ul>
  </menu-elemental>
  <menu-elemental class="hamburger" media="(min-width: 40rem)">
    <button aria-label="Menu"></button>
    <ul>
      <li><a href="#the-hamburger">Dashboard</a></li>
      <li><a href="#the-hamburger">Settings</a></li>
    </ul>
  </menu-elemental>
</div>

```html
<menu-elemental class="hamburger">
  <button>Menu</button>
  …
</menu-elemental>

<!-- icon only: the name has to come from somewhere, so aria-label -->
<menu-elemental class="hamburger">
  <button aria-label="Menu"></button>
  …
</menu-elemental>
```

Opt-in, because a menu button is not always a hamburger — "Account" and "File" are
words, and three bars stand for a whole navigation. Your own icon is the same one rule,
and has to be a mask for the same reason:

```css
menu-elemental.hamburger > button::before {
  mask-image: url("my-icon.svg"); /* not background-image */
}
```

`--menu-elemental-surface` is the one worth re-pointing: a page whose background is
not quite `Canvas` wants the panel to match the page rather than the browser.

```scss
menu-elemental {
  --menu-elemental-surface: var(--my-page-background);
}
```

## Layout

The element is `display: inline-block` and `position: relative`, because the flyout is
positioned against it. Inline, it drops to `display: block` and `position: static`, so
it stretches in a drawer like the block it is.

<script src="../dist/elementals/menu.js"></script>
