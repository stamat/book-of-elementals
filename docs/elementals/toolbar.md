---
layout: poops-docs-theme/docs
title: Toolbar
description: A row of buttons the arrow keys walk and Tab passes in one step — the APG Toolbar pattern, across the page or down it.
order: 16
---

# `<toolbar-elemental>`

A bar of six buttons is six tab stops between the reader and whatever comes after it. The
[APG Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) is the answer: one
tab stop for the bar, arrow keys between the controls inside it. That is all this element
is — the role, the axis, and the single `tabindex="0"` that moves.

<!-- demo toolbar style="--code-preview-height:79px" -->

```html
<toolbar-elemental aria-label="Formatting">
  <button type="button" aria-pressed="true">Bold</button>
  <button type="button" aria-pressed="false">Italic</button>
  <button type="button" aria-pressed="false">Code</button>
  <button type="button">Link</button>
  <button type="button" disabled>Undo</button>
</toolbar-elemental>
```

_<kbd>Tab</kbd> in, then walk it with <kbd>←</kbd> and <kbd>→</kbd>. <kbd>Tab</kbd> again and
you are past the whole bar, not one button further along it. **Undo** is skipped — the
platform will not focus a `disabled` control, so the cursor does not stop where focus cannot
follow._

## The markup

The buttons you would have written anyway, wrapped, and named:

```html
<toolbar-elemental aria-label="Formatting">
  <button type="button">Bold</button>
  <button type="button">Italic</button>
</toolbar-elemental>
```

**Name it.** A toolbar takes its name from `aria-label`, or `aria-labelledby` where
something on the page already says it. The element cannot invent one and does not pretend
to — an unnamed toolbar is announced as "toolbar" and nothing more, and where a page has
two of them, naming is not optional.

`<button>`, `<a href>` and `<select>` are walked. The select spends arrows on itself, so the
bar splits the axes the way the [APG toolbar's own spin
button](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/) does: the bar's
axis and <kbd>Home</kbd>/<kbd>End</kbd> walk, the cross axis stays the select's — on a bar
across the page, <kbd>↓</kbd> still opens and steps its list. The split has a cost worth
knowing: an engine that spends the bar's axis on a closed select — the arrows on Windows,
<kbd>Home</kbd>/<kbd>End</kbd> to first and last option — loses those to the walk, and a
select on a vertical bar loses <kbd>↓</kbd>/<kbd>↑</kbd>; <kbd>Space</kbd> and
<kbd>Enter</kbd> open the list everywhere. A text field has no axis to spare — every arrow
is the caret's — so it stays out of the walk and a tab stop of its own, which is
[MDN's advice](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/toolbar_role)
for a control like that: keep it out of a toolbar, or put it last.

Both the pattern and MDN say a toolbar is for grouping **three or more** controls. Nothing
here enforces it — two buttons are two tab stops, and a bar that saved one of them would be
ceremony rather than a saving.

## Groups

Related controls go in a `role="group"` with its own label. The arrows run straight through
it — six controls in two groups are one sequence, not two the keyboard has to enter and
leave — and a screen reader announces the group on the way past.

<!-- demo toolbar style="--code-preview-height:79px" -->

```html
<toolbar-elemental aria-label="Formatting">
  <div role="group" aria-label="Text">
    <button type="button">Bold</button>
    <button type="button">Italic</button>
    <button type="button">Code</button>
  </div>
  <div role="group" aria-label="Blocks">
    <button type="button">Quote</button>
    <button type="button">List</button>
  </div>
  <div role="group" aria-label="History">
    <button type="button">Undo</button>
    <button type="button" disabled>Redo</button>
  </div>
</toolbar-elemental>
```

_Walk it with <kbd>→</kbd> from **Bold**. The group boundaries are not stops — the cursor
crosses from **Code** to **Quote** on one press, and <kbd>End</kbd> reaches **Undo**, because
**Redo** is disabled and the platform will not focus it._

The element needs nothing told to it: the controls are found wherever they sit, so a group —
or a [`<tooltip-elemental>`](tooltip.html) wrapped round a button — is a layer the walk sees
through. The theme draws a rule between one group and the next, and never off either end.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `vertical` | boolean | `false` | The bar runs down the page. Swaps the arrow keys with it, stacks the controls, and writes `aria-orientation="vertical"`. |

`aria-orientation` is written only when it is true, because horizontal is the role's own
default and a second copy of a fact is a second thing to keep in step.

## Keyboard

| Key | Horizontal | Vertical |
| --- | --- | --- |
| <kbd>→</kbd> <kbd>←</kbd> | previous / next control | left to the page |
| <kbd>↓</kbd> <kbd>↑</kbd> | left to the page | previous / next control |
| <kbd>Home</kbd> <kbd>End</kbd> | first / last control | first / last control |
| <kbd>Tab</kbd> | past the whole bar | past the whole bar |
| <kbd>Enter</kbd> <kbd>Space</kbd> | presses the control | presses the control |

**The ends do not wrap.** Running off one is not how you get anywhere here — <kbd>Tab</kbd>
is — and a bar that looped would be a bar a reader can walk forever without noticing they had.

The off-axis arrows are not merely unused. A <kbd>↓</kbd> on a horizontal bar is the page scrolling,
and a toolbar that swallowed it would pin the page under a reader who is passing through.

The tab stop follows focus. Click the last button and the arrows carry on from there rather
than jumping back to the start.

## Disabled controls

A `disabled` button keeps its place and is skipped by the arrows, because the platform will
not focus one and a cursor that lands where focus cannot follow is a bar that stops moving.

To keep a control reachable and merely inert — announced, explainable, not pressable — use
`aria-disabled="true"` instead. It stays focusable, so the arrows still reach it, and the
theme dims it the same way.

Buttons that enable and disable as the document changes are the ordinary case, not an exotic
one, so the element watches for it. Nothing has to call a refresh, and forgetting one would
be a bar whose only tab stop had just gone `disabled`.

## Hidden controls

A control that is not on screen is stepped over for the same reason a `disabled` one is:
`focus()` on it does nothing, so an arrow that lands there is an arrow that moves nothing. That
covers a button your own stylesheet hides — the one for a feature this browser turned out not to
have — and a whole region folded away on a narrow screen, which is how a crowded bar sheds its
rarely-used half.

The tab stop goes with it. A stop left on a control the reader cannot see is a bar
<kbd>Tab</kbd> enters and lands nowhere in, so it moves to the first control still on screen. A
bar hidden whole keeps the stop it had, because that bar is waiting on something rather than
gone.

Fading is not hiding. A control row that drops to `opacity: 0` over a video is still a row the
keyboard reaches, and focus arriving in it is usually what brings it back — so opacity is no
part of the question.

Before Safari 17.4 there is no `checkVisibility` to ask, and only the `hidden` attribute is seen.
A control hidden by a CSS rule there behaves as it did before: the arrows still stop on it.

## Without script

Buttons, each its own tab stop. That is the state the pattern improves on rather than a
broken one — nothing is authored `tabindex="-1"`, so nothing is lost when the script never
arrives.

## What it will not do

No overflow menu, no wrapping, no `aria-pressed` bookkeeping, and no opinion about what the
buttons do. A toggle button's state is yours to set; the theme reads it off `aria-pressed`
rather than off a class, so there is one place it lives.

## Styling

The structure stylesheet lays the bar out on its axis and nothing else — that part is not
decoration, because an `aria-orientation` that disagrees with which way the buttons are
drawn is a keyboard that disagrees with the screen. The theme is optional and draws the bar
and the controls in it.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--toolbar-elemental-gap` | `0.25rem` | Between the controls |
| `--toolbar-elemental-inset` | `0.25rem` | Padding inside the bar |
| `--toolbar-elemental-radius` | `0.375rem` | Corners of the bar, and of a control in it |
| `--toolbar-elemental-border` | `color-mix(in srgb, currentcolor 20%, transparent)` | The bar's outline |
| `--toolbar-elemental-hover` | `color-mix(in srgb, currentcolor 10%, transparent)` | A control under the pointer |
| `--toolbar-elemental-pressed` | `color-mix(in srgb, currentcolor 18%, transparent)` | A control whose `aria-pressed` is true |

```scss
@use "book-of-elementals/toolbar/style.scss";
@use "book-of-elementals/toolbar/theme.scss"; // optional
```

```javascript
import 'book-of-elementals/toolbar';
```
