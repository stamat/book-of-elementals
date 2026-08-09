---
layout: poops-docs-theme/docs
title: Suggest
description: A list of links a text field drives with the arrow keys — the results panel, minus any opinion about where the results came from.
order: 10
---

# `<suggest-elemental>`

A list of links a text field can drive with the arrow keys, per the
[APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox
popup. It is the results panel a search field, a filter and a "jump to" box all end up
needing — and only the half of it that has nothing to do with where the results came from.

It owns the keyboard and the ARIA. It does not fetch, does not filter, and has no opinion
about what put the links there. Give it a `<ul>` of `<a>`, point it at an input, and the
arrows, Enter and Escape behave the way the pattern says.

<!-- demo suggest -->

```html
<div class="field">
  <label for="jump">Jump to</label>
  <input type="search" id="jump" autocomplete="off" placeholder="press ↓">
  <suggest-elemental for="jump">
    <ul>
      <li><a href="accordion.html">Accordion</a></li>
      <li><a href="combobox.html">Combobox</a></li>
      <li><a href="disclosure.html">Disclosure</a></li>
      <li><a href="menu.html">Menu</a></li>
      <li><a href="modal.html">Modal</a></li>
    </ul>
  </suggest-elemental>
</div>

<style>
  .field { position: relative; max-width: 20rem; }
  .field input { width: 100%; }
</style>
```

_Press ↓ in the field. The caret never leaves it — the cursor moving down the list is
`aria-activedescendant`, not focus, which is what lets you keep typing while you look._

The panel is positioned against whatever the page has made the containing block, which is
why the sample gives the wrapper `position: relative`. The element writes `data-side` and
`data-align` for which corner had room; it does not write coordinates, because a light-DOM
popup lives in your layout and an element setting `top` on it is an element fighting a
decision you already made.

## The markup

Two things, joined by `for`:

```html
<input type="search" id="q">
<suggest-elemental for="q">
  <ul>
    <li><a href="/docs/install/">Install</a></li>
  </ul>
</suggest-elemental>
```

Only `<a href>` becomes an option. A link without an `href` is not a destination, and a row
that goes nowhere is a dead line on the list.

The `<ul>` and every `<li>` get `role="presentation"` — a `listbox` may only own `option`s,
and a list inside one would otherwise announce its own item counts on top of the listbox's.
The boxes stay, so your CSS still has its list to lay out; only the semantics come off.

**Replace the contents whenever you like.** The element watches for it and re-marks the new
rows, so nothing has to call a refresh — and forgetting one would be a list of options a
screen reader cannot see. The cursor resets when the list changes, because a cursor pointing
into the list that was on screen a moment ago points at a row that has moved or gone.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `for` | string | — | `id` of the text field that drives it. Without it the element does nothing. |
| `open` | boolean | `false` | Whether the panel is showing. Reflected, so `[open]` is a styling hook, and settable so whatever fills the list can show it: `suggest.open = true`. |

`suggest-toggle` fires on every change, with `detail.open`.

## Keyboard

| Key | Panel closed | Panel open |
| --- | --- | --- |
| `↓` | opens, cursor on the first option | moves down, wrapping |
| `↑` | opens, cursor on the last option | moves up, wrapping |
| `Alt` + `↓` | opens, no cursor — see the list without committing to a row | — |
| `Alt` + `↑` | — | closes |
| `Enter` | left to the page, so the form still submits | follows the option under the cursor |
| `Escape` | left to the page, so it can clear the field | closes |
| `Tab` | leaves | closes, then leaves |
| `Home` `End` | move the caret through what you typed | the caret, until a row is under the cursor — then the ends of the list |

Everything else is left where it was typed.

`Home` and `End` are the pair worth explaining. The pattern calls them optional and gives
two answers: jump the list, or — "if the combobox is editable" — put the caret back on the
first character. This field is always editable, so both are right at different moments. Up
to the first arrow key the reader is still writing a query, and a `Home` that jumped the
list rather than reaching the start of `install` would be wrong on nearly every press. Once
an arrow has put a cursor on a row they are reading results, and the ends of the list are
the only thing those keys can mean. Escape, or typing again, hands them back.

The pointer takes the cursor with it. Two cursors that disagree is the bug — the pointer
sitting on one row while `aria-activedescendant` names another, and `Enter` going somewhere
the reader is not looking.

## Without script

A list of links, in flow, visible and reachable. Nothing is authored `hidden`, so nothing is
lost when the script never arrives — which is also why the panel is not styled as a floating
box until the element is defined.

## Why not `<combobox-elemental>`

[That one](combobox.html) is a view of a `<select>`. It holds a value, submits under a name,
resets with the form, and its options carry `aria-selected`.

|  | `<combobox-elemental>` | `<suggest-elemental>` |
| --- | --- | --- |
| An option is | a `<select>` option — a value | a link — a destination |
| Carries | `aria-selected`, `aria-multiselectable` | neither |
| After a pick | stays open when multiple | navigates away |
| Needs | a `<select>` | an `<a>` and an input |

They share the cursor mechanics and nothing else. Reach for the combobox when the answer
goes into a form; reach for this when the answer is somewhere to go.

## What it will not do

No fetching, no filtering, no ranking, no match highlighting, and no result count announced
— the last one because "5 results" is the language of whatever built the list, not of the
list. Pair it with something that owns the query.

## Styling

The structure stylesheet positions and scrolls the panel and nothing else. The theme is
optional and draws only what the element owns — the panel and its rows. **Nothing here
styles your `<input>`**: that control is yours, and styling it is what a design system does.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--suggest-elemental-radius` | `0.375rem` | Corners of the panel |
| `--suggest-elemental-inset` | `0.5rem` | The one padding unit, down the side of every row |
| `--suggest-elemental-max-height` | `20rem` | How tall the panel gets before it scrolls |
| `--suggest-elemental-surface` | `Canvas` | What the panel is painted on |
| `--suggest-elemental-active` | `color-mix(in srgb, currentcolor 12%, transparent)` | The row under the cursor |

```scss
@use "book-of-elementals/suggest/style.scss";
@use "book-of-elementals/suggest/theme.scss"; // optional
```

```javascript
import "book-of-elementals/suggest";
```
