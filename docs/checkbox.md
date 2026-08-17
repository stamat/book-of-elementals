---
layout: poops-docs-theme/docs
title: Drawn checkbox
description: The one look in this package that is not an element's — point a class at a container or a label and every checkbox in it matches the select-all.
order: 2
---

# The drawn checkbox

A checkbox drawn in CSS over a real `<input type="checkbox">`, in
`styles/checkbox.scss`. It is the only look here that does not belong to an element, and it
is opt-in — a class you point at a container or at a `<label>`.

<div class="demo-block">
  <label class="checkbox-elemental"><input type="checkbox" checked> Remember me</label>
</div>

## Why it exists

[`<checkbox-group-elemental>`](elementals/checkbox-group.html) could not be drawn without
it. The mixed state is a dash, and the dash is the one part of a checkbox `accent-color`
says nothing about: that property recolours the browser's own box and cannot touch its size,
its corners, or the weight of a line through the middle of it. So the box had to be drawn.

And once one is, the page has a single drawn checkbox and a browserful of default ones —
a mismatch the element caused. Scoping the drawing to the one element that forced it would
leave that mismatch beside every group, so it is a stylesheet of its own instead, and any
checkbox can wear it.

## Opt in with a class

The class marks a **container**, and a `<label>` counts as one:

```html
<form class="checkbox-elemental">…</form>
<!-- every checkbox inside it -->
<label class="checkbox-elemental"><input type="checkbox" /> Remember me</label>
<!-- just this one -->
```

```scss
@use "book-of-elementals/checkbox.scss";
```

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/book-of-elementals-checkbox.min.css"
/>
```

It comes in with `checkbox-group/theme.scss` already, so a page using the group only needs
the class where it wants the rest to match.

It is opt-in and always will be. A stylesheet that restyled `input[type="checkbox"]`
outright would mean importing this book's theme for an accordion and silently getting every
checkbox on the page redrawn, which is the toll this package exists not to charge.

## The control stays the control

This is `appearance: none` on a real `<input type="checkbox">` — it replaces what the
browser draws, not what it does.

| Still the browser's                                                                                          | This stylesheet's                                       |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Focus ring, <kbd>Space</kbd>, the label association, `disabled`, `required`, submission, reset and restore | Size, corners, border, fill, and the tick and the dash |

Which is the whole reason not to build a checkbox out of a `<div>`.

One consequence worth knowing: a form control does not inherit the page's font, and the
browser gives an `<input>` a 13.3px Arial of its own — so the box takes `font: inherit`
before anything else. Without it every `em` below would be a fraction of a font nobody
chose, and `--checkbox-elemental-size: 1.5em` would come out 20px where you asked for 24.

## The properties

Set them on whatever carries the class.

| Property                              | Default               | Description                      |
| --------------------------------------- | --------------------- | --------------------------------- |
| `--checkbox-elemental-size`           | `1.15em`              | Box size, both axes              |
| `--checkbox-elemental-radius`         | `0.25em`              | Box corners                      |
| `--checkbox-elemental-border-width`   | `1.5px`               | Box border                       |
| `--checkbox-elemental-border-color`   | `currentcolor` at 45% | Box border, unticked             |
| `--checkbox-elemental-fill`           | `currentcolor`        | Box fill once ticked or mixed    |
| `--checkbox-elemental-mark`           | `Canvas`              | The tick and the dash            |
| `--checkbox-elemental-gap`            | `0.6em`               | Between a box and its label text |

```css
form.checkbox-elemental {
  --checkbox-elemental-size: 1.4em;
  --checkbox-elemental-radius: 50%;
  --checkbox-elemental-fill: #0a7;
  --checkbox-elemental-mark: white;
}
```

The defaults are declared on nothing — they are the `var()` fallbacks — which is the one
place this file departs from how the elements' themes are written. Those set their defaults
on the element, and a property set on an element always beats one inherited from an
ancestor, so a `<checkbox-group-elemental>` inside a tuned `<form>` would have kept the
shipped size while every checkbox beside it took the form's. With nothing declared, a value
on any ancestor reaches every box under it: **one form is one look.**

That is the table above, live, group and lone label together. Turn the knobs in the
**Options** tab until it looks the way you want, then copy the rule out of the bottom of
the panel:

<!-- demo checkbox-group tab="options" style="--code-preview-options-height:306px" -->

```html
<form class="checkbox-elemental">
  <label><input type="checkbox" checked /> Remember me</label>
  <checkbox-group-elemental>
    <label><input type="checkbox" /> All notifications</label>
    <ul>
      <li><label><input type="checkbox" checked /> Mentions</label></li>
      <li><label><input type="checkbox" /> Replies</label></li>
    </ul>
  </checkbox-group-elemental>
</form>
```

> [!NOTE]
> `--checkbox-elemental-mark` defaults to `Canvas`, the page's own background, because that
> is what a tick cut out of a filled box is. Re-point it on a card, and on a page that themes
> in custom properties **without declaring `color-scheme`** — there `Canvas` stays white in
> dark mode and the tick disappears into the fill.

## Forced colors

Author backgrounds are dropped in that mode, so a filled box would be told from an empty one
by nothing at all. The fill becomes `Highlight` and the mark `HighlightText`, the one pair
the mode guarantees contrasts and what it paints a set control with anyway. Those two are
declared rather than left as fallbacks, because there the point is to overrule what the page
asked for. The mark is a shape rather than a colour change, so a ticked box and a mixed one
are still told apart with no colour at all.

## Where the line is

> [!NOTE]
> This is the only look in the package that is not an element's, and that is a refusal
> rather than a gap: **a control gets a look here only when an element in the book cannot be
> drawn without one.** The checkbox qualifies because the dash cannot be drawn any other
> way. A text input, a `<select>` or a button does not, and will not. The line is stated in
> [CONTRIBUTING.md](https://github.com/stamat/book-of-elementals/blob/main/CONTRIBUTING.md).

The dash itself, and the three states behind it, are
[`<checkbox-group-elemental>`](elementals/checkbox-group.html).
