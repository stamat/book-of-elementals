---
layout: poops-docs-theme/docs
title: Tooltip
description: A description that shows on hover and on focus — and is still on the page when the script is not.
order: 11
---

# `<tooltip-elemental>`

A sentence about a control, wired to it as a description, shown when the pointer or the
keyboard arrives. Light DOM, nothing moved, nothing wrapped.

<!-- demo tooltip -->

```html
<p>
  <tooltip-elemental>
    <button type="button">Save</button>
    <span>Saves to your drafts, without publishing</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; padding: 0.4em 0.8em; }
```

## Read this before you use one

**A tooltip is unreachable by touch, and no library fixes that.** There is no hover on a
touch screen, and a tap is activation rather than focus — so on a phone, the words in a
tooltip are words nobody gets. This element ignores touch pointers outright instead of
half-handling them, because a tooltip that opens on tap is a
[toggletip](https://inclusive-components.design/tooltips-toggletips/) wearing the wrong name.

So: **nothing essential goes in one.** GitHub's own design system puts it plainly —
[tooltips "should be the last resort for conveying information as they are hidden by default
and often with zero or little visual indicator of its existence"](https://primer.style/components/tooltip).

| You want | Reach for |
| --- | --- |
| a name for an icon-only button | `aria-label`, or visible text. Not this |
| information every reader needs | visible text |
| content that appears on a press | [`<disclosure-elemental>`](disclosure.html) |
| a hint that is nice to have, for pointer and keyboard readers | this |

## What the APG says, and what it does not

The [tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) says of itself that
it **"is work in progress; it does not yet have task force consensus"**, and ships no example.
So this element implements the half every source agrees on and refuses the half they do not.

| Part | Where it stands | Here |
| --- | --- | --- |
| `aria-describedby` from the trigger to the words | universal | yes, and it is the whole accessibility of the thing |
| <kbd>Escape</kbd> dismisses | universal, and [WCAG 2.2 SC 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) requires it | yes |
| hoverable, dismissible, persistent | SC 1.4.13 | yes — no timeout, and the bubble itself can be hovered |
| `role="tooltip"` | [does nothing in any screen reader](https://sarahmhigley.com/writing/tooltips-in-wcag-21/) | set, because the pattern says so. It costs nothing and buys nothing |
| the tooltip as the control's **name** | contested — Primer ships it, Higley calls it a smell | **no.** `aria-label` names a control |
| touch | nobody has an answer | ignored, and documented above |

## Two shapes

**Wrapping** is the one to reach for:

```html
<tooltip-elemental>
  <button type="button">Save</button>
  <span>Saves to your drafts, without publishing</span>
</tooltip-elemental>
```

**`for`** is for a bubble written somewhere else — a table of controls, a template that emits
its help text in one block:

```html
<button type="button" id="save">Save</button>

<tooltip-elemental for="save">Saves to your drafts, without publishing</tooltip-elemental>
```

Nothing selects between them. The element contains something focusable or it does not, and
that is the whole rule: with a focusable child it is a wrapper and the other child is the
bubble; without one it *is* the bubble, and `for` names the control it belongs to.

<!-- demo tooltip -->

```html
<p>
  <button type="button" id="publish">Publish</button>
  <button type="button" id="revert">Revert</button>
</p>

<tooltip-elemental for="publish">Makes this visible to everyone</tooltip-elemental>
<tooltip-elemental for="revert">Throws away every change since the last publish</tooltip-elemental>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; padding: 0.4em 0.8em; }
```

With no script those two sentences read as a list under the buttons — which is the whole
degradation, and the reason the words are written rather than stored in an attribute.

## Upgrading a `title`

A `title` is the tooltip the platform gives you, and it is a poor one: no keyboard, no
styling, no way to hover it, and a delay you cannot change. So a trigger with a `title` and
nothing else to say gets it read, moved into a bubble, and the attribute removed — the native
one would otherwise show underneath.

<!-- demo tooltip -->

```html
<p>
  <tooltip-elemental>
    <button type="button" title="Saves to your drafts">Save</button>
  </tooltip-elemental>

  <tooltip-elemental>
    <button type="button" title="Delete this draft">
      <span aria-hidden="true">🗑</span>
    </button>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; padding: 0.4em 0.8em; }
```

Where those words land depends on what the control already had, because a `title` is doing
one of two jobs:

| The trigger | What its `title` becomes | Why |
| --- | --- | --- |
| has text, `aria-label` or `aria-labelledby` | its **description** | the name was already there; these words are the extra |
| has none of those | its **name**, as `aria-label` | that `title` was the only name it had. Moving it to a description would leave the button nameless — a worse page than the one with a native tooltip |

"Has text" means text a name computation would count. An `aria-hidden` glyph — which is what
an icon-only button is made of — names nothing, and is not mistaken for a name here either.

The second row is the icon-only button, and it is why this is automatic rather than an
option. The bubble still shows, and the reader hears the words once, as the name.

> [!NOTE]
> An icon-only button is better off with a real `aria-label` and a tooltip that says something
> **else**. "Delete" as both the name and the hint is a tooltip that earns nothing.

## Which side it opens on

**The axis is yours, the side is the viewport's.** By default the bubble goes under the
control and flips above it when there is no room under; `horizontal` puts it beside instead,
and which of the two sides that turns out to be is measured, not declared.

<!-- demo tooltip -->

```html
<p>
  <tooltip-elemental>
    <button type="button">Under, unless there is no room under</button>
    <span>Which there is, here</span>
  </tooltip-elemental>
</p>

<p>
  <tooltip-elemental horizontal>
    <button type="button">Beside</button>
    <span>On the inline end, unless the edge is there</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 2rem 1rem 6rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; padding: 0.4em 0.8em; }
```

There is no `placement="e"` and no `direction="n"`, which every other library offers. A fixed
side is a tooltip off the edge of the screen on the one page where it did not fit — and since
the element has to measure anyway to know whether it fits, a preference that loses to the
measurement most of the time is a knob that mostly does nothing. Pick the axis; let it place.

The side it settled on is written back as `data-side`, so a caret can point the way it came:

| `data-side` | Where the bubble went |
| --- | --- |
| `block-end` / `block-start` | under / over the control |
| `inline-end` / `inline-start` | after / before it, which RTL turns around |

### How it lines up with the control

Two rules, because a wide control and a narrow one want opposite things:

| The control is | What happens | Why |
| --- | --- | --- |
| **wider** than the bubble | the bubble is centred on it, caret out of the middle | a short tooltip pinned to the corner of a long toolbar button looks like it belongs to something else |
| **narrower** than the bubble | their edges line up, on whichever side the placement chose | a small button centred under a long sentence leaves most of that sentence beside the thing it describes |

Centring gives way to the viewport, never the other way round — a bubble is moved back
inside the edge and the caret follows, because the caret is measured against wherever the
bubble actually landed.

### Where the caret points

Aligning a bubble to a control's edge is not the same as pointing at it: a button wider than
its tooltip is aligned at one end and centred nowhere near it. So the element measures the
middle of the trigger and hands it to the stylesheet as one length,
`--tooltip-elemental-arrow-offset`, from the bubble's own start edge — the right-hand one in
RTL, so a rule can spend it on `inset-inline-start` without knowing the direction.

Clamping it is the theme's half of the bargain, since the corner radius and the caret's size
are numbers only the look knows:

```css
--tooltip-elemental-caret-at: clamp(
  var(--tooltip-elemental-radius),
  calc(var(--tooltip-elemental-arrow-offset, 50%) - var(--tooltip-elemental-caret)),
  calc(100% - var(--tooltip-elemental-radius) - 2 * var(--tooltip-elemental-caret))
);
```

Drawing your own caret? Read that property and clamp it to whatever your shape needs. Its
`50%` fallback is what a bubble nothing has placed yet gets, so a caret is centred rather than
stuck at zero.

## The fade

The optional theme fades the bubble in and out over `--tooltip-elemental-duration`, which is
`120ms` until you say otherwise. Turn it up to see it:

<!-- demo tooltip -->

```html
<p>
  <tooltip-elemental>
    <button type="button">Slowly</button>
    <span>Half a second, so the fade is easy to watch</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; padding: 0.4em 0.8em; }

tooltip-elemental {
  --tooltip-elemental-duration: 500ms;
}
```

The element hides the bubble with `hidden`, and `display` does not tween — so the theme names
it in the transition with `allow-discrete`, which flips it at the start of the way in and the
end of the way out, and gives `@starting-style` the transparent frame to begin from:

```css
[role="tooltip"] {
  opacity: 0;
  transition:
    opacity var(--tooltip-elemental-duration) ease,
    display var(--tooltip-elemental-duration) allow-discrete;
}

[role="tooltip"]:not([hidden]) {
  opacity: 1;

  @starting-style {
    opacity: 0;
  }
}
```

Both of those are [Baseline 2024](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style),
which lands after Safari 17.0–17.4 and the iOS versions of the same numbers — all of which are
inside this project's browser targets. There the tooltip appears and disappears without
fading, and that is the whole of the degradation. `prefers-reduced-motion: reduce` turns it
off everywhere else.

## Keyboard and pointer

| Input | What happens |
| --- | --- |
| pointer over the trigger **or the bubble** | shows. Both, because SC 1.4.13 asks that a long sentence can be read with the pointer on it |
| pointer leaves both | hides, after a beat — long enough to cross the gap between them |
| trigger focused | shows |
| trigger blurred | hides |
| <kbd>Escape</kbd> | hides, and **stays** hidden until the reader has actually left. A dismissal undone by the next twitch of the mouse is no dismissal |
| touch | nothing |

Hover and focus each hold it open on their own, so a reader who tabs to a button and then
moves the mouse away still has the words.

## Degrading

| Missing | What you get |
| --- | --- |
| the script never loads | the sentence, visible next to the control. Nothing is hidden until something can show it again |
| the script loads late | one beat with the sentence visible, then it folds away |
| the stylesheet is not imported | a working description, and a bubble that opens in the flow rather than over the page |
| a `title` and no script | the native tooltip, exactly as before |

## Usage

```javascript
import "book-of-elementals/tooltip";
```

```scss
@use "book-of-elementals/tooltip/style.scss"; // structure
@use "book-of-elementals/tooltip/theme.scss"; // the look, optional
```

Or the single-element bundle:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/tooltip.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/tooltip.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/tooltip-theme.min.css"
/>
```

## API

### Attributes

| Attribute    | Type    | Default | Description                                                          |
| ------------ | ------- | ------- | -------------------------------------------------------------------- |
| `for`        | string  | —       | `id` of the control this describes. Only read when the element does not wrap one |
| `horizontal` | boolean | `false` | Beside the control rather than over or under it. Which of the two sides is still measured |

### Properties

| Property  | Type      | Description                                              |
| --------- | --------- | -------------------------------------------------------- |
| `trigger` | `Element` | Read-only. The control being described                    |
| `bubble`  | `Element` | Read-only. The words — a child, or the element itself      |

### What it writes

| On | What |
| --- | --- |
| the bubble | `role="tooltip"`, an `id` if it had none, `hidden` while it is not showing |
| the bubble | `data-side` (`block-end`/`block-start`, or `inline-end`/`inline-start` with `horizontal`) and `data-align` (`start` / `end`), and `top` / `left` in viewport pixels |
| the bubble | `--tooltip-elemental-arrow-offset`, the middle of the trigger measured from the bubble's start edge |
| the trigger | `aria-describedby`, appended to any it already had — or `aria-label`, when its `title` was the only name it had |
| the trigger | its `title` removed, when those words became the bubble |

The bubble stays `hidden` between showings rather than being emptied, because
[`aria-describedby` reads hidden content](https://www.w3.org/TR/accname-1.2/) — the
description is on the control the whole time, which is the point. A tooltip has no state to
announce, only something to draw.

### Styling hooks

```css
tooltip-elemental [role="tooltip"] {
} /* the bubble */
tooltip-elemental [role="tooltip"][data-side="block-start"] {
} /* it had to flip above the trigger */
tooltip-elemental [role="tooltip"][data-side="inline-end"] {
} /* `horizontal`, and it went after the trigger */
tooltip-elemental [role="tooltip"][data-align="end"] {
} /* it had to run back the other way */
```

`position: fixed`, not absolute: the trigger and the bubble are not always in the same offset
parent, and anything scrolling between them would clip a bubble that was. The element writes
`top` and `left` on every show, scroll and resize, using the same placement maths the menu
uses — one decision per axis, RTL included.

### Custom properties

| Property                             | Default      | Description                          |
| ------------------------------------ | ------------ | ------------------------------------ |
| `--tooltip-elemental-gap`            | `6px`        | Between the trigger and the bubble   |
| `--tooltip-elemental-caret`          | `5px`        | Half the caret — it is drawn as a border |
| `--tooltip-elemental-duration`       | `120ms`      | The fade, in and out                 |
| `--tooltip-elemental-max-width`      | `250px`      | Where the words wrap                 |
| `--tooltip-elemental-padding-block`  | `0.5em`      | Above and below the words            |
| `--tooltip-elemental-padding-inline` | `0.75em`     | Either side of them                  |
| `--tooltip-elemental-radius`         | `6px`        | The bubble's corners                 |
| `--tooltip-elemental-border-width`   | `1px`        | The rim, which the caret takes too   |
| `--tooltip-elemental-border-color`   | `Canvas` 28% into the surface | That rim's colour    |
| `--tooltip-elemental-surface`        | `CanvasText` | What the bubble is painted in        |
| `--tooltip-elemental-color`          | `Canvas`     | The words on it                      |

Every one of those is declared on `tooltip-elemental` itself rather than on the bubble, so a
page changes one by writing `tooltip-elemental { --tooltip-elemental-radius: 3px }` and being
later in the cascade. On the bubble they would sit behind `:defined` and an attribute, and
quietly outrank the author trying to change them.

The proportions are GitHub's — a 6px radius, `0.5em 0.75em` of padding, small body text and a
250px cap — which are the ones most readers have already met. The rim and the caret are ours:
[Primer's tooltip](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Tooltip/Tooltip.module.css)
has neither.

The colours are the page's own two extremes, swapped, because a tooltip is the one box that
has to be legible over whatever it happens to be covering — and unlike a pair of hard-coded
hexes they follow a theme switch with nothing to configure. Under `forced-colors` the surface
and the rim are re-pointed at system keywords, which is the whole fix: everything else here is
spent through those two properties.

<!-- demo tooltip tab="options" -->

```html
<p>
  <tooltip-elemental>
    <button type="button">Turn me in the Options tab</button>
    <span>Saves to your drafts, without publishing</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; padding: 0.4em 0.8em; }
```

## Tooltip, or something else?

| Wanted                                          | Element                                     |
| ----------------------------------------------- | ------------------------------------------- |
| a hint on hover and focus, for pointer readers  | this                                        |
| content a press reveals, on every device        | [`<disclosure-elemental>`](disclosure.html) |
| a button that copies and says it did            | [`<copy-elemental>`](copy.html)             |

<script src="{{ relativePathPrefix }}dist/elementals/tooltip.js"></script>
