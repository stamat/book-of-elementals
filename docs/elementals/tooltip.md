---
layout: poops-docs-theme/docs
title: Tooltip
description: A description that shows on hover and on focus — and is still on the page when the script is not.
order: 16
---

# `<tooltip-elemental>`

A sentence about a control, wired to it as a description, shown when the pointer or the
keyboard arrives. Light DOM, nothing moved, nothing wrapped.

<!-- demo tooltip style="--code-preview-height:170px" -->

```html
<p>
  <tooltip-elemental>
    <button type="button" aria-label="Save">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2v7m0 0L5.5 6.5M8 9l2.5-2.5M3 11v2.5h10V11" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Saves to your drafts, without publishing</span>
  </tooltip-elemental>

  <tooltip-elemental>
    <button type="button" aria-label="Copy link">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11.5l-1 1a2.5 2.5 0 01-3.5-3.5l1-1" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Anyone with the link can read this draft</span>
  </tooltip-elemental>

  <tooltip-elemental>
    <button type="button" aria-label="Delete">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.8 9.5h6.4L12 4" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Deleted drafts are kept for 30 days</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; display: inline-flex; padding: 0.4em; }
```

Icon buttons for most of what follows, because that is where a tooltip earns its place: each
one has a real `aria-label` for its name, and the bubble says the thing the icon could not.

## Read this before you use one

**A tooltip is all but unreachable by touch, and no library fixes that.** There is no hover
on a touch screen and a tap is activation rather than hover, so this element ignores touch
pointers outright instead of half-handling them — a tooltip that opens on tap is a
[toggletip](https://inclusive-components.design/tooltips-toggletips/) wearing the wrong name.

What is left is focus, and whether a tap moves it is the engine's call, not this element's.
Measured with a touch pointer on the demo above: **Chromium focuses a `<button>` on tap, so
the bubble opens and a tap elsewhere closes it; WebKit does not focus buttons on tap, so
nothing appears.** A text input focuses on tap everywhere, a button does not, so what the
trigger is decides it as much as the browser does. Focus is not filtered by how it arrived,
because that would take the words away from the readers who currently get them — but they are
words no phone reader can be counted on to see.

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
| touch | nobody has an answer | touch pointers ignored; a tap that focuses the trigger still shows it — [see above](#read-this-before-you-use-one) |

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

<!-- demo tooltip style="--code-preview-height:170px" -->

```html
<p>
  <button type="button" id="publish" aria-label="Publish">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 10V2.5m0 0L5.5 5M8 2.5L10.5 5M3 11v2.5h10V11" stroke="currentColor" stroke-width="1.5" />
    </svg>
  </button>
  <button type="button" id="revert" aria-label="Revert">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 3L2 6l3 3M2 6h7a4 4 0 010 8H6" stroke="currentColor" stroke-width="1.5" />
    </svg>
  </button>
</p>

<tooltip-elemental for="publish">Makes this visible to everyone</tooltip-elemental>
<tooltip-elemental for="revert">Throws away every change since the last publish</tooltip-elemental>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; display: inline-flex; padding: 0.4em; }
```

With no script those two sentences read as a list under the buttons — which is the whole
degradation, and the reason the words are written rather than stored in an attribute.

## Upgrading a `title`

A `title` is the tooltip the platform gives you, and it is a poor one: no keyboard, no
styling, no way to hover it, and a delay you cannot change. So a trigger with a `title` and
nothing else to say gets it read, moved into a bubble, and the attribute removed — the native
one would otherwise show underneath.

<!-- demo tooltip style="--code-preview-height:170px" -->

```html
<p>
  <tooltip-elemental>
    <button type="button" aria-label="Save" title="Saves to your drafts">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2v7m0 0L5.5 6.5M8 9l2.5-2.5M3 11v2.5h10V11" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
  </tooltip-elemental>

  <tooltip-elemental>
    <button type="button" title="Delete this draft">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.8 9.5h6.4L12 4" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; display: inline-flex; padding: 0.4em; }
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

<!-- demo tooltip style="--code-preview-height:243px" -->

```html
<p>
  <tooltip-elemental>
    <button type="button" aria-label="Comments">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Under the button, unless there is no room under</span>
  </tooltip-elemental>
</p>

<p>
  <tooltip-elemental horizontal>
    <button type="button" aria-label="Notifications">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 11V7a4 4 0 018 0v4l1.5 1.5h-11zM6.5 13a1.5 1.5 0 003 0" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Beside it, on the inline end unless the edge is there</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 2rem 1rem 6rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; display: inline-flex; padding: 0.4em; }
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

**Centred on the trigger, at every width** — the bubble sits on its middle, and the caret
comes out of the middle of both. `horizontal` asks the same of the other axis: a bubble
beside the control is centred on its height, not hung from its top edge.

Then the viewport gets the last word. A control near an edge cannot be centred on without
the bubble hanging off, so the bubble is pulled back inside — and stops
`--tooltip-elemental-viewport-margin` short of the edge rather than pressed against the
glass. The default is `6px`, the same distance the gap keeps it off its trigger; `0` lets it
kiss the edge again. The caret follows the bubble, because it is measured against wherever
the bubble actually landed rather than against where it was aimed — which is what lets it
keep pointing at the button after the bubble has moved out from under it.

The margin is honoured on the caretless side too: a bubble that would fit below the trigger
only by touching the bottom of the viewport flips above it instead, and lands exactly a
margin off the edge it fled. Only the caret's own side never moves — the bubble is anchored
a gap off its trigger there, and breathing room is not worth pointing at nothing.

<!-- demo tooltip style="--code-preview-height:202px" -->

```html
<div class="row">
  <tooltip-elemental>
    <button type="button" title="Hard against the left edge">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 2v12M13.5 8h-8m0 0L8.5 5M5.5 8l3 3" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
  </tooltip-elemental>

  <tooltip-elemental>
    <button type="button">Centred, with room on both sides</button>
    <span>Nothing in the way</span>
  </tooltip-elemental>

  <tooltip-elemental>
    <button type="button" title="Hard against the right edge">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M13.5 2v12M2.5 8h8m0 0L7.5 5M10.5 8l-3 3" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
  </tooltip-elemental>
</div>
```

```css demo
body { margin: 0; padding: 4rem 0 6rem; font: 1rem/1.5 system-ui, sans-serif; }
.row { display: flex; justify-content: space-between; align-items: start; }
button { font: inherit; padding: 0.4em 0.8em; }
button:has(svg) { display: inline-flex; padding: 0.4em; }
```

_Hover the two icon buttons at the ends. Their bubbles are wider than they are and would
run off the frame if they were centred, so each stops a margin short of the edge — and the
caret slides along to stay over the button. The middle one has room and is centred on its
trigger._

Which side of the trigger the bubble goes on is
[`placeFlyout`](https://github.com/stamat/book-of-spells) in book-of-spells, or
`placeSubmenu` under `horizontal` — and that is all either of them is asked. They answer an
alignment too, in the `start` / `end` a submenu hangs from the item that opened it with,
which is right for a menu and wrong for a bubble with a caret: an edge that fits the
viewport on its own never reaches the clamp, so a trigger near the edge jumped straight to
edge-aligned with nothing in between. Centring on the trigger and clamping is this element's
own answer, on both axes, and the slide is what the jump became.

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

### Without one

The caret is the theme's, not the element's: two pseudo-elements on the bubble, and nothing
else depends on them. A plain box is `content: none` on both — and usually a smaller gap with
it, since the default `6px` is exactly the caret's own reach (`--tooltip-elemental-caret` plus
the rim it is drawn with), so a bubble that no longer points stands further off than it needs
to.

<!-- demo tooltip style="--code-preview-height:170px" -->

```html
<p>
  <tooltip-elemental>
    <button type="button" aria-label="Star">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2l1.8 3.9 4.2.5-3.1 2.9.8 4.2L8 11.4 4.3 13.5l.8-4.2L2 6.4l4.2-.5z" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Starred drafts sort to the top</span>
  </tooltip-elemental>

  <tooltip-elemental horizontal>
    <button type="button" aria-label="History">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 4.5V8l2.5 1.5M2 8a6 6 0 106-6 6 6 0 00-4.5 2M3.5 1.5V4h2.5" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Every version since the draft was created</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; display: inline-flex; padding: 0.4em; }

tooltip-elemental {
  --tooltip-elemental-gap: 4px;
}

tooltip-elemental [role="tooltip"]::before,
tooltip-elemental [role="tooltip"]::after {
  content: none;
}
```

Both demos above wrap their trigger, and a wrapped bubble is a child. A bubble the `for`
attribute points at *is* the element, so that shape is `tooltip-elemental[role="tooltip"]` —
one rule each, or one rule listing both if a page uses both shapes.

That plain a selector wins because the theme keeps its own `:defined` guard inside `:where()`,
which costs nothing on specificity: the two rules are level, and yours is later. The guard is
there so the look is not painted on a bubble the script has not upgraded yet — it was never
meant to outrank the page importing it.

Turning the size down instead is the trap. `--tooltip-elemental-caret: 0` leaves a visible grey
nub: the rim triangle's width is `calc(var(--tooltip-elemental-caret) + var(--tooltip-elemental-border-width))`,
and a unitless zero makes that `calc()` invalid, so the border falls back to `medium` — 3px in
Chromium, where this was measured. `0px` computes, and leaves a 1px triangle too small to see
at 5× zoom. Neither says what it means; `content: none` does.

## The fade

The optional theme can fade the bubble in and out over `--tooltip-elemental-duration`, and
does not: it is `0s` until you say otherwise, because a tooltip answers a pointer that has
already stopped and a bubble easing in behind it reads as lag. The transition is wired up
regardless, so turning the property up is the whole of what a page has to do. This demo sets
half a second:

<!-- demo tooltip style="--code-preview-height:170px" -->

```html
<p>
  <tooltip-elemental>
    <button type="button" aria-label="Schedule">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 4.5V8l2.5 1.5M8 14A6 6 0 108 2a6 6 0 000 12z" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
    <span>Half a second, so the fade is easy to watch</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; display: inline-flex; padding: 0.4em; }

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
inside this project's browser targets. There a page that turned the duration up gets a tooltip
that appears and disappears without fading, and that is the whole of the degradation.
`prefers-reduced-motion: reduce` keeps it off everywhere else, however high it is turned.

## Keyboard and pointer

| Input | What happens |
| --- | --- |
| pointer over the trigger **or the bubble** | shows. Both, because SC 1.4.13 asks that a long sentence can be read with the pointer on it |
| pointer leaves both | hides, after a beat — long enough to cross the gap between them |
| trigger focused | shows |
| trigger blurred | hides |
| <kbd>Escape</kbd> | hides, and **stays** hidden until the reader has actually left. A dismissal undone by the next twitch of the mouse is no dismissal |
| trigger activated — click, <kbd>Enter</kbd>, <kbd>Space</kbd> | hides. A used control's tooltip has said its piece — and the focus the click leaves on the button would otherwise hold it open over the neighbour's bubble. Not <kbd>Escape</kbd>'s held dismissal: hovering away and back, or <kbd>Tab</kbd> out and in, shows it again |
| touch | no hover, so nothing of its own — a tap shows it only where it focuses the trigger, by the row above and [not on every engine](#read-this-before-you-use-one). A tap's click is exempt from the activation row, since it is the same gesture that opened the bubble. Tapping away is then the dismissal, since <kbd>Escape</kbd> is not one a finger has |

Hover and focus each hold it open on their own, so a reader who tabs to a button and then
moves the mouse away still has the words.

## Degrading

| Missing | What you get |
| --- | --- |
| scripting is off | the sentence, visible next to the control. Nothing is hidden until something can show it again |
| the script never arrives with scripting on — blocked, 404 | no sentence: the stylesheet holds the bubble unpainted for an upgrade that never comes. The gate covers scripting turned off, not every way a script can fail to run |
| the script loads late | nothing — the bubble waits unpainted from the first frame, so there is no beat to see. Bubble authored *before* its trigger is the exception, and keeps the beat |
| the stylesheet is not imported | a working description, and a bubble that opens in the flow rather than over the page |
| a `title` and no script | the native tooltip, exactly as before |

## Usage

```javascript
import 'book-of-elementals/tooltip';
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
| the bubble | `data-side` (`block-end`/`block-start`, or `inline-end`/`inline-start` with `horizontal`) and `data-align` (`center`, or the end of the bubble the caret came out near when the viewport slid it off the middle), and `top` / `left` in viewport pixels |
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
} /* the viewport slid it, and the caret came out near that end */
```

Those are the theme's own selectors, minus the `:where(:defined)` it guards them with — which
costs nothing on specificity, so a rule of yours at this weight is level with the theme's and
wins by coming later. The `for` shape is the same attribute on the element itself:
`tooltip-elemental[role="tooltip"]`.

`position: fixed`, not absolute: the trigger and the bubble are not always in the same offset
parent, and anything scrolling between them would clip a bubble that was. The element writes
`top` and `left` on every show, scroll and resize, using the same placement maths the menu
uses — one decision per axis, RTL included.

### Custom properties

| Property                             | Default      | Description                          |
| ------------------------------------ | ------------ | ------------------------------------ |
| `--tooltip-elemental-gap`            | `6px`        | Between the trigger and the bubble   |
| `--tooltip-elemental-caret`          | `5px`        | Half the caret — it is drawn as a border |
| `--tooltip-elemental-duration`       | `0s`         | The fade, in and out. Off until you turn it up |
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

<!-- demo tooltip tab="options" style="--code-preview-options-height:522px" -->

```html
<p>
  <tooltip-elemental>
    <button type="button" aria-label="Settings">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M2 4.5h4M11 4.5h3M2 11.5h3M10 11.5h4" />
        <circle cx="8.5" cy="4.5" r="2" />
        <circle cx="7.5" cy="11.5" r="2" />
      </svg>
    </button>
    <span>Turn the properties in the Options tab and watch this bubble change</span>
  </tooltip-elemental>
</p>
```

```css demo
body { margin: 0; padding: 3rem 1rem; font: 1rem/1.5 system-ui, sans-serif; }
button { font: inherit; display: inline-flex; padding: 0.4em; }
```

## Tooltip, or something else?

| Wanted                                          | Element                                     |
| ----------------------------------------------- | ------------------------------------------- |
| a hint on hover and focus, for pointer readers  | this                                        |
| content a press reveals, on every device        | [`<disclosure-elemental>`](disclosure.html) |
| a button that copies and says it did            | [`<copy-elemental>`](copy.html)             |

<script src="{{ relativePathPrefix }}dist/elementals/tooltip.js"></script>
