---
layout: poops-docs-theme/docs
title: Splitter
description: Two panes and a draggable seam between them — the APG Window Splitter pattern, keyboard included, for a pattern that has never had a reference example.
order: 11
---

# `<splitter-elemental>`

A sidebar you can widen, an editor next to its preview, a list above the thing it opens: two
panes, and a handle between them that gives one what it takes from the other. You write the two
boxes; it writes the handle.

**This is the one APG pattern with no example to copy.** The
[Window Splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) carries the
role, the states and the keys, and where the example would be it says work on one is tracked by
[issue 130](https://github.com/w3c/aria-practices/issues/130). Which is roughly the state of the
shelf too — every splitter here resizes panes with a pointer, and the keyboard is where they
part company.

| Instead of | What it costs you | What this does |
| --- | --- | --- |
| [Split.js](https://github.com/nathancahill/split) | framework-neutral and zero-dependency, like this — but `dist/split.js` at 1.6.5 contains no `role`, no `aria-`, no `tabindex` and no key handler at all. A pointer or nothing | the pattern's roles and states, and arrows, <kbd>Home</kbd>, <kbd>End</kbd> and <kbd>Enter</kbd> on top of them |
| [`<sp-split-view>`](https://opensource.adobe.com/spectrum-web-components/components/split-view/) | the closest thing to this — a custom element with `role="separator"` and arrow keys — and `@spectrum-web-components/base` plus `shared` under it, in a design system's theming | one file, one dependency, and that one is the sibling spellbook |
| [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels), [Allotment](https://github.com/johnwalley/allotment), [Splitpanes](https://antoniandre.github.io/splitpanes/) | a framework each — React, React, Vue | two elements in your HTML, whatever wrote them |
| CSS `resize` | the native one, and it is a different feature: per [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/resize) it resizes *the element it is on*, needs `overflow` other than `visible` or `clip`, and has no documented keyboard at all | two panes that divide one width, and a separator a reader can reach with <kbd>Tab</kbd> |

<!-- demo splitter style="--code-preview-height:235px" -->

```html
<splitter-elemental position="35" min="15" max="70" label-text="Sidebar">
  <nav class="pane">
    <p><strong>Sidebar</strong></p>
    <p>Drag the seam, or focus it and press the arrow keys.</p>
  </nav>
  <article class="pane">
    <p><strong>Content</strong></p>
    <p>The first child is the primary pane — the one the position is about, and the one
      <kbd>Enter</kbd> collapses.</p>
  </article>
</splitter-elemental>
```

```css demo
/* the tracks and the seam are the element's; the panes are yours */
splitter-elemental { block-size: 200px; border: 1px solid color-mix(in srgb, CanvasText 20%, transparent); }
splitter-elemental .pane { padding: 1rem; overflow: auto; }
splitter-elemental p { margin: 0 0 0.5rem; }
splitter-elemental p:last-child { margin: 0; font-size: 0.875rem; opacity: 0.8; }
```

_Drag the seam and the panes divide the width between them. <kbd>Tab</kbd> to it and the arrow
keys move it a per cent at a time; <kbd>Home</kbd> and <kbd>End</kbd> take it to the `15` and
`70` this sample allows. <kbd>Enter</kbd> collapses the sidebar to `15` and a second
<kbd>Enter</kbd> puts it back where it was — with the default `min="0"` that collapse goes all
the way to nothing._

## The markup

Two boxes. The element writes one node between them and changes nothing else:

```html
<splitter-elemental>
  <div>…</div>
  <div>…</div>
</splitter-elemental>
```

- **The first element child is the primary pane.** It is what `position` measures, what
  `aria-controls` points at, and what <kbd>Enter</kbd> collapses. It is given an `id` if it has
  none, because the pattern needs one to point at.
- **The handle goes between them**, as `<div data-splitter-handle role="separator" tabindex="0">`.
  A `<div>` and not a `<button>`: `role="separator"` would replace the button role and leave a
  control announcing itself as one thing while behaving as another, and the only thing the
  button element brings that is wanted here is one attribute.
- **Two children, not three.** The layout is three grid tracks and a third child wraps onto a
  second row, under the primary pane and the width of it. That is a refusal rather than an
  omission — see [What it will not do](#what-it-will-not-do).

## The keyboard

Straight off the pattern, which is the only place it exists:

| Key | What it does |
| --- | --- |
| <kbd>←</kbd> <kbd>→</kbd> | Move the separator, on a side-by-side splitter |
| <kbd>↑</kbd> <kbd>↓</kbd> | Move it, on a stacked one |
| <kbd>Home</kbd> | The primary pane at its smallest allowed size — `min` |
| <kbd>End</kbd> | At its largest — `max` |
| <kbd>Enter</kbd> | Collapse the primary pane; press it again to put it back |

One per cent per arrow press, and that is not an attribute: a configurable step would be a third
number to keep in step with `min` and `max`, and nothing in the pattern asks for one.

**The arrows on the other axis are left alone.** <kbd>↑</kbd> on a side-by-side splitter is not
a key with nothing to do — it is how a reader scrolls the page they are standing in, and a
widget that swallowed it would take that away without replacing it.

**<kbd>Enter</kbd> remembers where it was, not where it last was.** The position is saved on the
press that collapses, so the second press is the undo of the first and not of some drag in
between.

**A handle you have just dragged can be nudged with the arrows.** The pointer press is
`preventDefault`ed — otherwise a drag selects a line of text out of the pane behind it — and
that takes the focus a press on a control normally brings with it, so the element puts it back
by hand. Without that one line the whole keyboard half of the pattern is unreachable for anyone
who arrived by mouse.

## Which way round `vertical` is

**`vertical` describes the panes, `aria-orientation` describes the separator, and the two are
opposites.** Panes stacked down the page are split by a separator lying across it:

| Markup | The panes | The separator | `aria-orientation` |
| --- | --- | --- | --- |
| `<splitter-elemental>` | side by side | runs down the page | `vertical` |
| `<splitter-elemental vertical>` | stacked | runs across the page | `horizontal`, which is the role's own default and is therefore left off |

The APG spends the word the other way round and calls the splitter between a left and a right
pane a *vertical splitter*. Both are right about different things — ARIA is naming the line, the
attribute is naming the layout, and the rest of this book already spells `vertical` as "runs
down the page" on [`<tabs-elemental>`](tabs.html) and [`<toolbar-elemental>`](toolbar.html).

**A stacked splitter needs a height.** The row tracks are percentages, and a percentage row
track in a grid whose own height is `auto` resolves as `auto` — two panes at their content
height, and a splitter that appears to ignore `position` entirely. Give it a `block-size`, a
`min-block-size`, or a parent that gives it one. The side-by-side case needs nothing, which is
why no height is declared for you.

```css
splitter-elemental[vertical] { block-size: 24rem; }
```

That selector is also what a splitter stacking itself lands on — see
[Stacking on a narrow screen](#stacking-on-a-narrow-screen).

## Stacking on a narrow screen

Two panes side by side on a phone are two panes of about 170px each. Stacked, they are two of
about half the viewport's height, which is the layout you want — and the separator is worth
keeping rather than hiding, because a screen where space is scarce is the one where being able
to give it to one pane matters most.

`vertical-when` is that switch, and it is the same `vertical` at the other end of it:

```html
<splitter-elemental vertical-when="(width < 40rem)">
  <nav>…</nav>
  <main>…</main>
</splitter-elemental>
```

While the query matches, the element writes `vertical` on itself, and takes it off again when it
stops — so everything already keyed to that attribute follows with it: the grid turns its columns
into rows, the cursor becomes `row-resize`, the theme's line turns with the seam, the arrows
become <kbd>Up</kbd> and <kbd>Down</kbd>, and `aria-orientation` flips. `position` is a
percentage, so 30% of the width becomes 30% of the height and the split you had is the split you
keep.

**It takes a whole media query, not a width**, so `(orientation: portrait)` and `(pointer: coarse)`
are as available as a breakpoint — and it is the same shape as `open-when` on
[`<disclosure-elemental>`](disclosure.html), `bar-when` on [`<navbar-elemental>`](navbar.html) and
`flyout-when` on [`<menu-elemental>`](menu.html). A query the browser cannot parse is a query that
never matches, so a typo leaves the splitter exactly as you wrote it rather than stacking it at
every width.

**The height rule above still applies, and bites harder here** — at this breakpoint you are not
otherwise writing any CSS, so it is easy to arrive at a stacked splitter that appears to ignore
`position` and have nothing to blame. The `[vertical]` rule in that section is the fix, and it
needs nothing added to it: the element writes the same attribute, so one selector covers a
splitter you stacked by hand and one that stacked itself.

The breakpoint is a length in `px`, `rem`, `em` or `ch`, and nothing else is accepted — not a
bare `40`, which would be this element guessing you meant pixels, and not anything carrying a
bracket or a comma, which is a value that could close the media query it is put inside and open
a wider one. A value that is not a length is ignored, and the splitter stays as you wrote it.

**A `vertical` you wrote yourself wins.** Both attributes on one element is a splitter you have
said is stacked at every width, so the query has nothing to add and does not take your attribute
off when it stops matching.

[Before and after](../examples/before-and-after.html) is this attribute working on a picture: the
same reveal side by side on a wide screen and stacked on a narrow one.

## How far the panes may go

`min` and `max` are percentages, and they are `aria-valuemin` and `aria-valuemax` verbatim —
which is what the pattern says those two properties are: the positions where the primary pane is
at its smallest and its largest.

They bound everything: the pointer, the arrows, <kbd>Home</kbd>, <kbd>End</kbd> and
<kbd>Enter</kbd> too. **So `min` above zero is you saying the pane may not disappear**, and
<kbd>Enter</kbd> takes it down to that floor rather than through it; the pattern's own collapse
is what the default `min="0"` gives you. Given the pair the wrong way round — a `max` below the
`min` — the splitter holds still rather than inverting its clamp.

**Percentages and nothing else, and that is a limit worth stating.** A `min-width: 12rem` on a
pane is a size this element cannot see: grid honours it, the pane stops there, and
`aria-valuenow` goes on reporting the position that was asked for. Two numbers describing the
same pane, one of them wrong, and the wrong one is the one a screen reader reads. Put the bound
on `min`.

## Reading the position

`position` is reflected, and it is written back as the handle is dragged — so the attribute is
always what the DOM is showing.

`splitter-change` fires when the gesture that moved it is over: a key press, or a pointer
released after actually moving. `detail.position` is where it landed.

```javascript
splitter.addEventListener('splitter-change', (event) => {
  localStorage.setItem('sidebar', event.detail.position);
});
```

**It is deliberately not fired per frame of a drag.** A pane that has to keep up with the
dragging — a chart to re-lay-out, an editor to re-measure — wants a
[`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) on the pane
itself, which is the platform's own answer to that question and does not go stale when something
other than the splitter changes the width.

That is also the whole of why there is no persistence here: saving is the three lines above and
restoring is `position` in the markup. An element that owned a storage key would be an element
with an opinion about which one.

## Without script

Two boxes in normal flow, in the order you wrote them, and no handle — there is nothing to
resize when there is nothing listening to the drag.

Everything but `display: block` waits for `data-splitter-panes`, which the element writes on
itself once it has put a handle between two panes. Not `:defined`: that is true of every
`<splitter-elemental>` on the page from the moment the script registers the class, including one
written with a single child — and three grid tracks over one box is that box squeezed into half
the width for no reason it can see. `display` is the one that cannot wait: an unupgraded inline
wrapper round two block panes is a layout nobody wrote.

**A bundle in `<head>` without `defer` still works.** A custom element is upgraded the moment its
opening tag is parsed, so a script that ran before the markup reaches every
`<splitter-elemental>` on the page before a single child of it exists. The element waits for
`DOMContentLoaded` and builds then. Markup that arrives any other way — `innerHTML`, a
framework, a fragment — is complete before it is ever connected, so nothing waits for it.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `position` | number | `50` | Where the separator sits, as a percentage of the track. Reflected, and written back as the handle is dragged |
| `min` | number | `0` | How far the primary pane may shrink. `aria-valuemin`, and the floor for <kbd>Enter</kbd> as well as for the drag |
| `max` | number | `100` | How far it may grow. `aria-valuemax` |
| `vertical` | boolean | off | The panes are stacked down the page rather than side by side |
| `vertical-when` | string | — | A media query that owns `vertical`: the panes stack while it matches |
| `label-text` | string | `Resize` | The handle's accessible name |

**`label-text` is worth setting.** The pattern asks for the separator to be named after the
primary pane, so a page with a sidebar behind it says `label-text="Sidebar"` — "Resize" is a
default that keeps the handle from being nameless, not a good name for your page.

A `position` outside `min`–`max` is clamped for everything that is drawn and announced, and the
attribute is left holding what you asked for until the next drag writes over it. Anything that is
not a number at all is the floor rather than `NaN` travelling on into a `grid-template`.

## Styling

The structure stylesheet sizes three grid tracks — the primary pane, the handle, the other pane
— and puts the resize cursor on the handle. The theme draws a line down the middle of it.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--splitter-elemental-size` | `24px` | The handle's thickness, and therefore the size of the target a pointer has to hit |
| `--splitter-elemental-color` | `currentcolor` at 20% | Theme. The line down the middle of the handle |
| `--splitter-elemental-active-color` | `currentcolor` at 45% | Theme. Its colour under the pointer, or while the handle has focus |
| `--splitter-elemental-line-size` | `1px` | Theme. How thick that line is |

**`24px` is [WCAG 2.2 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
not a taste** — and it is why the line and the target are two different sizes. Every splitter on
the shelf is a hairline you have to hit; here the hairline is a pseudo-element inside a target
you cannot miss, so `--splitter-elemental-line-size: 1px` and a 24-pixel handle are both true at
once. It is a length in pixels rather than the `rem` the rest of the book reaches for because the
criterion is written in CSS pixels: `1.5rem` on a page that set a 12-pixel root is 18 of them.

One custom property is written by the element and is there to read, not to set:

| Written by the element | Means |
| --- | --- |
| `--splitter-elemental-position` | Where the separator is, unitless. The stylesheet is what turns it into a proportion |
| `data-splitter-panes` | On the element: it has two panes and a handle between them |
| `data-splitter-handle` | On the handle: your hook for restyling it |

**The track is the box minus the handle**, and both halves of this element do that subtraction:
the first grid track is `calc((100% - var(--splitter-elemental-size)) * position / 100)`, and the
pointer's position is read against the same figure. Measured against the full box instead,
`position="100"` would be a primary pane one handle-width wider than the box holding it —
overflowing at one end, and unreachable at the other.

**Give your panes their own `overflow`.** The tracks are sized by the position and nothing else,
so a pane whose content is wider than its track spills out of it; `overflow: auto` on the pane is
the answer, and it is yours rather than this element's because a pane that clips is a decision
about your content.

The focus ring is left to the browser. It is drawn round the whole handle, which is a bigger and
clearer target than the line inside it, and a ring drawn here would be one more thing to keep in
step with your page's own focus styles.

## Not the compare slider

[`<compare-images-slider>`](https://github.com/stamat/compare-images-slider) wears the same
`role="separator"` on the same kind of handle and does the opposite thing with it: a splitter
*resizes* two panes that share a width, and the compare slider *reveals* — both its layers stay
full size and one is clipped over the other. If the two things are the same thing in two states,
that one is what you want.

You can fake it out of this element anyway, with four rules of your own CSS and a picture in each
pane. [Before and after](../examples/before-and-after.html) is that example, and it is where the
two are compared properly.

## What it will not do

Two panes, not *n*: three panes is two splitters, and a splitter that shared its neighbour's
space would need a layout model of the whole row rather than of itself. No persistence, no
storage key, no session id. No pixel or `ch` bounds — `min` and `max` are percentages, for the
reason above. No double-click to reset, no snap points, no drag anywhere but the handle, and no
animation: a separator that eased into place is a separator lagging behind the pointer that
moved it.

```scss
@use "book-of-elementals/splitter/style.scss";
@use "book-of-elementals/splitter/theme.scss"; // optional
```

```javascript
import "book-of-elementals/splitter";
```
