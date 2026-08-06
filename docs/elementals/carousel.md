---
layout: poops-docs-theme/docs
title: Carousel
description: A row of slides you scroll through — the APG Carousel pattern, built on a scroll-snapping list, with previous, next, a picker and optional rotation.
order: 2
---

# `<carousel-elemental>`

A row of slides you scroll through, per the
[APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — previous and
next, a picker with one button per slide, and, when you ask for it, rotation on a timer with
the control that stops it. Light DOM, no shadow root, nothing you wrote is moved or wrapped.

<!-- demo carousel -->

```html
<carousel-elemental aria-label="Places">
  <ul>
    <li>
      <h3>Kopaonik</h3>
      <p>Mist over the ridge, before the sun is over it.</p>
    </li>
    <li>
      <h3>Đerdap</h3>
      <p>The river, and rock on both sides of it.</p>
    </li>
    <li>
      <h3>Tara</h3>
      <p>A lake, and nothing growing above it.</p>
    </li>
  </ul>
</carousel-elemental>
```

```css demo
carousel-elemental li {
  display: grid;
  align-content: center;
  padding: 1.5rem;
  min-block-size: 9rem;
  background: color-mix(in srgb, currentcolor 8%, transparent);
}
h3 {
  margin: 0 0 0.5rem;
}
p {
  margin: 0;
}
```

That markup is the page you would have had anyway: a list. The element adds the
roles and appends the controls — so before it upgrades, and if it never does, the same list
is a scroll-snapping row you can swipe, drag the scrollbar of, or reach with the keyboard,
with every slide in the page and in reading order.

## Usage

```javascript
import "book-of-elementals/carousel";
```

```scss
@use "book-of-elementals/carousel/style.scss"; // structure
@use "book-of-elementals/carousel/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/carousel.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/carousel.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/carousel-theme.min.css"
/>
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

### The markup it expects

- **The scroller** is the first `<ul>`, `<ol>` or `<menu>` in the element.
- **The slides** are its `<li>`s. Anything can be inside one.

Two slides is the minimum. One is a figure, not a carousel, and an element that wrote a
picker with a single button in it would be worse than the markup it upgraded — so with fewer
than two the element leaves the page exactly as it found it.

Name the carousel. `aria-label` (or `aria-labelledby`) on the element is what makes it a
`region` — a landmark a screen reader can jump to — and without a name it is a `group`
instead, because a landmark with no name is one more unnamed stop in the landmark list.

## API

### Attributes

| Attribute     | Type    | Default                   | Description                                                     |
| ------------- | ------- | ------------------------- | --------------------------------------------------------------- |
| `fade`        | boolean | `false`                   | Cross-fade one slide in place instead of scrolling a row.       |
| `autoplay`    | boolean | `false`                   | Rotate on a timer, and write the control that stops it.         |
| `interval`    | number  | `5000`                    | Milliseconds between slides. Under `1000` is treated as `1000`.  |
| `prev-text`   | string  | `Previous slide`          | The previous button's accessible name.                          |
| `next-text`   | string  | `Next slide`              | The next button's accessible name.                              |
| `play-text`   | string  | `Start slide rotation`    | The rotation control's name while stopped.                      |
| `pause-text`  | string  | `Stop slide rotation`     | The rotation control's name while rotating.                     |
| `slide-text`  | string  | `Slide`                   | The word in front of the number on a picker button — `Slide 3`. |
| `picker-text` | string  | `Choose slide to display` | The picker group's accessible name.                             |

There is no attribute for which slide is showing, and that is the design rather than an
omission: the scroll position is the state. An index attribute would be a second copy of it,
and a reader's thumb can change one of the two without telling the other. `fade` is the one
mode where there is nothing to scroll, and there the element holds the index itself.

### Properties

| Property     | Type        | Description                                        |
| ------------ | ----------- | -------------------------------------------------- |
| `index`      | number      | Which slide is on screen. Assigning it does not scroll — that is `to()` |
| `slides`     | `Element[]` | Read-only, in order.                               |
| `scroller`   | `Element`   | Read-only. The list.                               |
| `autoplay`   | boolean     | Get/set. Writes the attribute.                     |
| `interval`   | number      | Get/set. Milliseconds.                             |
| `fade`       | boolean     | Get/set. Writes the attribute.                     |
| `to(index)`  | —           | Show a slide: scroll it to the start of the row, or cross-fade to it |
| `next()`     | —           | One on. Does nothing at the end, where the button is dim |
| `previous()` | —           | One back. Does nothing at the start.               |
| `advance()`  | —           | One on, wrapping at the end. What the rotation calls |
| `play()`     | —           | Start rotating.                                    |
| `pause()`    | —           | Stop.                                              |
| `wire()`     | —           | Re-read the markup, [see below](#slides-that-change). |

### Events

`carousel-change` fires whenever the slide on screen changes — a button, the rotation, a
swipe, a fragment link into a slide, a window resize that changes how many fit — and bubbles:

```javascript
const carousel = document.querySelector("carousel-elemental");

carousel.addEventListener("carousel-change", (e) => {
  e.detail.index; // 2
  e.detail.slide; // the <li>
});
```

A smooth scroll from the last slide back to the first passes over the ones in between, and
each of those is a slide that was on screen — so it is reported. If you are driving
something expensive off this, debounce it; the element does not, because a carousel that
lies about where it is would be the worse default.

### What it writes

| Element       | Attributes                                                                                |
| ------------- | ----------------------------------------------------------------------------------------- |
| the element   | `aria-roledescription="carousel"`, `role="region"` (named) or `role="group"` (not), and `data-carousel-at-start` / `data-carousel-at-end` while there is nowhere left to go that way |
| the list      | `role="group"`, `data-carousel-slides`, an `id` if it had none, `tabindex="0"` if nothing inside is focusable, and `aria-live` in `fade` only |
| each `<li>`   | `role="group"`, `aria-roledescription="slide"`, `aria-label="3 of 10"` if it had no name, `data-carousel-slide`, and `data-carousel-current` on the one showing |
| the controls  | a `<div data-carousel-controls>` appended, holding the previous button, the picker and the next button |
| previous, next | an Octicon chevron, and `aria-disabled` at the end it cannot pass                          |
| the picker    | `role="group"`, `aria-label`, one `<button data-carousel-marker>` per slide with `aria-disabled="true"` on the current one |
| the rotation  | a `<button data-carousel-rotate>` prepended, only with `autoplay`                          |

The controls are the element's to write rather than yours, and that is the progressive
enhancement working rather than a preference: a previous button authored in the markup is a
button that does nothing until the script lands.

`aria-disabled` everywhere rather than `disabled` — on the current picker button and on an
arrow at the end of the row — because a `disabled` button taken out from under the focus that
just pressed it drops the reader back to the top of the page.

The chevrons are `chevron-left-16` and `chevron-right-16` from
[Octicons](https://primer.style/foundations/icons/) (MIT, © GitHub Inc.), inlined as two path
strings rather than pulled in as a package: that is the whole of what the dependency would be
for, and a build step to shake an icon set down to two shapes is the build step this project
promises you will not need. They are drawn and not typed for a reason you can see — a text
chevron sits wherever the font's designer centred it inside the em box, which in a round
button is visibly high.

The list stops being a list. Its children are slides — `role="group"`, which is what the
pattern asks of them — and a list whose children are not list items is a broken list to a
screen reader, not a carousel. `role="none"` would not do it either: the scroller can be
focusable, and a presentational role on a focusable element is thrown away. Nothing is lost
by it, because each slide is already named `3 of 10`.

The slides keep `role="group"` on the `<li>`, and that is a deliberate collision.
[ARIA in HTML](https://www.w3.org/TR/html-aria/) allows a short list of roles on an `<li>`
inside a list, and `group` is not among them — axe's `aria-allowed-role` rule says so, and it
is right. The [APG carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) asks for
`role="group"` on a slide, and that role is what lets a slide carry the name `3 of 10` and the
`aria-roledescription` that makes a screen reader say "slide" instead of "list item". The
pattern wins: the alternative is slides that are `<div>`s in a `<div>`, which is markup nobody
would have written without this element, and the whole promise here is that they would have.
`aria-allowed-role` is a best-practice rule rather than a WCAG one, so `script/a11y` — which
runs the WCAG tags — does not report it. If you run axe yourself with everything switched on,
this is the one you will see, and it is on purpose.

The list gets `tabindex="0"` only when there is nothing focusable inside the slides. A
scrollable region a keyboard cannot reach is content a keyboard cannot read
([WCAG 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)); a row of slides
full of links already has stops enough.

### Keyboard

| Key                                 | Action                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| <kbd>Tab</kbd>                      | Through the controls, and into the slides                   |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Press the control under the focus                           |
| <kbd>←</kbd> <kbd>→</kbd>           | Scroll the row, when the focus is on it                     |

The arrows are the browser's, not the element's. A focused scroll container already answers
to them, and to <kbd>Home</kbd>, <kbd>End</kbd> and the page keys, in every browser this
book supports — so there is no key handler here at all, and nothing taken from a reader who
was done with the carousel.

No control moves the focus. That is the APG's rule and the reason it matters is repetition:
press next four times and the focus is still on next.

### The live region there is not

The APG's example flips `aria-live` between `off` and `polite`, because there one slide
exists at a time and a reader who cannot see the swap would otherwise never hear about it.

Scrolling, every slide is in the DOM, in the accessibility tree and in reading order the
whole time. There is nothing to announce and nothing hidden to miss — and no `aria-hidden` on
the slides off screen either, which is the bug that leaves a focusable link inside a hidden
subtree.

[`fade`](#fade) is the mode where one slide really is all there is, and there the live region
comes back exactly as the pattern describes it: `polite` when a press moves the slides, `off`
while it rotates — because a carousel announcing itself every five seconds interrupts
whatever else is being read, forever.

## At the ends

The arrows stop at the ends rather than wrapping, and say so before you press them: the one
with nowhere to go takes `aria-disabled="true"` and the theme dims it. The element carries the
same fact as `data-carousel-at-start` and `data-carousel-at-end`, so a page can style its own
arrows, hide them, or fade the edge of the row:

```css
carousel-elemental[data-carousel-at-end] [data-carousel-next] {
  visibility: hidden;
}
```

The state is the **scroller's** answer to "is there anywhere left to scroll", not arithmetic
on the index, and that distinction is the whole reason it works with more than one slide on
screen: with three of five showing, the row is at its end while the current slide is the
third. An index counting to the last slide would leave the last two presses doing nothing,
which is the bug in most carousels that show more than one slide at a time.

A row short enough that everything fits is at **both** ends, and both arrows go dim. Nothing
to scroll is a list, and two live buttons over a list that cannot move get pressed twice and
then distrusted.

The rotation is the one thing that wraps: at the last slide it goes back to the first, because
a carousel that rotates to the end and stops is a carousel that quietly died. The buttons do
not, because they are dim there, and a control that looks spent must not still act.

## Rotation

`autoplay` writes the rotation control and starts the timer:

<carousel-elemental class="demo-carousel" aria-label="Rotating places" autoplay interval="4000">
  <ul>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23244'/%3E%3Ccircle cx='128' cy='24' r='12' fill='%23fc7'/%3E%3Cpolygon points='0,90 55,28 110,90' fill='%23576'/%3E%3Cpolygon points='70,90 118,42 160,90' fill='%23354'/%3E%3C/svg%3E" alt="Two hills under a low sun" width="160" height="90"><figcaption>Mist, before the sun is over the ridge</figcaption></figure></li>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23473'/%3E%3Cpolygon points='0,90 70,22 160,90' fill='%23352'/%3E%3Cpath d='M58 90 L76 38 L88 38 L98 90 Z' fill='%234a90a4'/%3E%3C/svg%3E" alt="A river running down between two slopes" width="160" height="90"><figcaption>The river, and rock on both sides of it</figcaption></figure></li>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23678'/%3E%3Cpolygon points='0,58 42,18 84,58' fill='%23889'/%3E%3Cpolygon points='62,58 104,26 150,58' fill='%2399a'/%3E%3Crect y='58' width='160' height='32' fill='%23356'/%3E%3C/svg%3E" alt="Bare peaks above a still lake" width="160" height="90"><figcaption>A lake, and nothing growing above it</figcaption></figure></li>
  </ul>
</carousel-elemental>

```html
<carousel-elemental aria-label="Rotating places" autoplay interval="4000">…</carousel-elemental>
```

Everything the pattern asks of a moving carousel is in there:

| Rule                                                          | How it behaves                                                             |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A control that stops and restarts it                          | Prepended to the element, so it is the **first** tab stop inside            |
| Its name says what pressing it will do                        | `Stop slide rotation` / `Start slide rotation`, and no `aria-pressed`       |
| Hovering the carousel pauses it                               | Resumes when the pointer leaves                                             |
| Moving focus into it pauses it                                | Resumes when focus leaves — moving between two controls is focus that never left |
| Rotation the reader started by hand is theirs                 | Hover and focus are then ignored until the same button stops it             |
| `prefers-reduced-motion: reduce`                              | `autoplay` is not obeyed at upgrade. The control is still there to start it |

That last row is the one worth reading twice. The preference switches off motion nobody
asked for; it does not take away a control from a reader who wants it.

The rotation control is drawn over the top corner of the row rather than down in the bar with
the other controls. It has to be first in the tab order, and a control drawn a long way from
where it is read is a tab order that lies — so it is drawn where it sits.

> [!NOTE]
> `interval` under 1000 is treated as 1000. Below that it is a strobe, and it is also
> shorter than the smooth scroll it would be interrupting, so the carousel would never
> finish arriving anywhere.

## How many slides fit

One custom property, and no attribute:

<carousel-elemental class="demo-carousel demo-carousel-three" aria-label="Three at a time">
  <ul>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23283'/%3E%3Cpolygon points='0,90 48,30 96,90' fill='%23162'/%3E%3Cpath d='M70 30 L86 30 L92 90 L64 90 Z' fill='%23bde'/%3E%3C/svg%3E" alt="A waterfall between two green slopes" width="160" height="90"></figure></li>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23354'/%3E%3Cpath d='M60 90 L76 34 L92 34 L108 90 Z' fill='%23776'/%3E%3Cpolygon points='16,90 30,26 44,90' fill='%23132'/%3E%3Cpolygon points='120,90 134,22 148,90' fill='%23132'/%3E%3C/svg%3E" alt="A road running away between two pines" width="160" height="90"></figure></li>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%2389c'/%3E%3Crect y='56' width='160' height='34' fill='%23a94'/%3E%3Ccircle cx='34' cy='26' r='10' fill='%23fe9'/%3E%3C/svg%3E" alt="A field of low scrub under a wide sky" width="160" height="90"></figure></li>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23446'/%3E%3Crect x='14' y='24' width='34' height='66' fill='%23223'/%3E%3Crect x='58' y='12' width='40' height='78' fill='%23334'/%3E%3Crect x='108' y='32' width='38' height='58' fill='%23223'/%3E%3C/svg%3E" alt="A street between tall buildings" width="160" height="90"></figure></li>
    <li><figure><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23eda'/%3E%3Cpath d='M0 44 L160 30 L160 90 L0 90 Z' fill='%23368'/%3E%3Cpolygon points='6,50 26,38 44,52' fill='%23334'/%3E%3C/svg%3E" alt="Dark rock at the edge of pale sand and water" width="160" height="90"></figure></li>
  </ul>
</carousel-elemental>

```css
carousel-elemental {
  --carousel-elemental-slide-size: 33.333%;
}
```

It is the slide's flex basis, so anything CSS can say goes in it — a `calc()`, a media query,
a container query, `min()` of a percentage and a width. Slides are `box-sizing: border-box`,
which the element sets because it sets the width: under `content-box` a slide with padding on
it comes out wider than the scroller it has to snap inside, and the reader lands on a slide
with its far edge cut off with nothing in the markup to say why. It reaches the slides only —
this is not a reset, and nothing inside one is touched. There is no `slides-per-page`
attribute because there is nothing for one to do that this does not, and CSS can change its
mind at a breakpoint while an attribute cannot.

Previous and next then move by one slide, not by one screenful, and the row still stops at
its own end: at the last screenful, next is the first slide again. That is the scroller's
answer rather than arithmetic on the index — with three slides on screen the last two can
never be the first visible one, so counting would leave the last press doing nothing.

## Fade

`fade` swaps the row for a stack: every slide in one place, the current one faded up over the
rest. Same controls, same picker, same rotation, same events — the only thing that changes is
how a slide arrives.

<!-- demo carousel -->

```html
<carousel-elemental aria-label="Fading places" fade autoplay interval="4000">
  <ul>
    <li><h3>Kopaonik</h3><p>Mist over the ridge.</p></li>
    <li><h3>Đerdap</h3><p>The river, and rock on both sides of it.</p></li>
    <li><h3>Tara</h3><p>A lake, and nothing growing above it.</p></li>
  </ul>
</carousel-elemental>
```

```css demo
carousel-elemental li {
  display: grid;
  align-content: center;
  padding: 1.5rem;
  min-block-size: 8rem;
  background: color-mix(in srgb, currentcolor 8%, transparent);
}
h3 { margin: 0 0 0.5rem; }
p { margin: 0; }
```

This is the one mode where the scroller is not the state. Stacked slides have nothing to
scroll, so the element holds the index itself and the stylesheet draws from
`data-carousel-current`. Two things follow from that, and both are the reason it is an
attribute rather than the default:

| Scrolling                                     | `fade`                                                            |
| --------------------------------------------- | ------------------------------------------------------------------ |
| Every slide in the accessibility tree         | Only the current one — the rest are `visibility: hidden`           |
| No live region needed                         | `aria-live`, `polite` when pressed and `off` while rotating         |
| Find-in-page searches every slide             | Finds only the slide showing                                        |
| Swipe, scrollbar, arrow keys on the scroller  | Buttons and the picker, nothing else                                |
| Without script: a scrolling row               | Without script: every slide stacked on top of the last              |

`visibility` and not `opacity` alone, because a slide at `opacity: 0` is still focusable and
still read — a tab stop in a slide nobody can see is worse than no fade at all. The delay on
the way out is what leaves the fade something to fade: going out `visibility` waits for the
transition, coming in it does not wait at all.

The height is the tallest slide's, since everything is in one grid cell — which is the
adaptive height a fading slideshow needs, without a box that resizes under the reader between
two slides of different lengths. `--carousel-elemental-fade` sets the duration, and
`prefers-reduced-motion: reduce` cuts it to nothing whatever it says.

## Slides that change

Nothing watches the markup. Add a slide, remove one, reorder them, and `wire()` is the one
call that says so:

```javascript
carousel
  .querySelector("ul")
  .insertAdjacentHTML("beforeend", "<li>…</li>");
carousel.wire();
```

It re-reads everything, renumbers the labels it wrote — leaving the ones you wrote alone —
rebuilds the picker and re-observes the row. Safe to call as often as you like. That is a
line on the pages that build their slides, instead of a `MutationObserver` running on every
page that never touches them.

## The look

`style.scss` is structure only — the scroller, the snap, and how wide one slide is. Take
those away and there is nothing to scroll and nothing to observe, which is why they are not
in the theme. `theme.scss` is the look and is optional; it draws all four controls as one set
of round buttons, mixed out of `currentcolor` so they sit in whatever palette the page has:

| Property                              | Default               | Description                                        |
| ------------------------------------- | --------------------- | -------------------------------------------------- |
| `--carousel-elemental-slide-size`     | `100%`                | How wide one slide is — this is how many fit        |
| `--carousel-elemental-gap`            | `1rem`                | Between the slides                                  |
| `--carousel-elemental-controls-gap`   | `0.5rem`              | Between the controls under the row                  |
| `--carousel-elemental-marker-size`    | `1.75rem`             | Diameter of a control                               |
| `--carousel-elemental-control`        | `currentcolor`        | Text and border of the controls                     |
| `--carousel-elemental-border`         | 20% of `currentcolor` | Border of a control                                 |
| `--carousel-elemental-hover`          | 10% of `currentcolor` | Control background under the pointer                |
| `--carousel-elemental-current`        | `currentcolor`        | Fill of the picker button for the slide on screen   |
| `--carousel-elemental-radius`         | `999px`               | Corner radius of the controls                       |
| `--carousel-elemental-fade`           | `400ms`               | How long the cross-fade takes in `fade`             |

Turn them in the **Options** tab and copy the rule out of the bottom of the panel — the same
table, with the values live:

<!-- demo carousel tab="options" -->

```html
<carousel-elemental aria-label="Options">
  <ul>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
  </ul>
</carousel-elemental>
```

```css demo
carousel-elemental li {
  display: grid;
  place-items: center;
  min-block-size: 8rem;
  background: color-mix(in srgb, currentcolor 10%, transparent);
}
```

The picker buttons keep their numbers rather than becoming bare dots. The number is the
visible half of the button's name — `Slide 3` contains `3`, which is what
[WCAG 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) asks of a name
over a label — and a dot is a target with nothing in it to read. Draw dots if the design
wants them, and hide the number knowing what it costs.

The scrollbar comes off the row — and only once the element has upgraded. The rule is written
against `[data-carousel-slides]`, which the element writes as it upgrades, so a page whose
script never lands keeps the native scrollbar and the only way through the row that it has.
After the upgrade the buttons and the picker are that way, and a scrollbar under them is a
second one nobody uses. The wheel, the trackpad and the arrow keys are unaffected either way.

Under `forced-colors` the current picker button is repainted in `Highlight`, since a fill is
the only thing telling it apart. The one piece of motion in the element is the scroll itself,
and it is switched off by `prefers-reduced-motion` in `style.scss` — one media query, because
every way the row moves goes through the same `scrollLeft`.

### Styling hooks

```css
carousel-elemental[autoplay] {
} /* the host, while rotation is on offer */
carousel-elemental[data-carousel-at-end] {
} /* nowhere left to scroll that way */
carousel-elemental > [data-carousel-slides] {
} /* the scroller */
carousel-elemental > [data-carousel-slides] > [data-carousel-slide] {
} /* every slide */
carousel-elemental [data-carousel-current] {
} /* the one showing */
carousel-elemental [data-carousel-next][aria-disabled="true"] {
} /* an arrow with nowhere to go */
carousel-elemental > [data-carousel-controls] {
} /* the bar under the row */
carousel-elemental [data-carousel-marker][aria-disabled="true"] {
} /* the current picker button */
carousel-elemental > [data-carousel-rotate] {
} /* the rotation control */
carousel-elemental:not(:defined) {
} /* before upgrade */
```

> [!NOTE]
> These go **on the `<carousel-elemental>`** — a class on it, `.gallery carousel-elemental`,
> or the element itself. The theme sets its defaults on the element, and a property set on an
> element always beats one inherited from an ancestor, so
> `.gallery { --carousel-elemental-gap: … }` silently does nothing.

## What it does not do

A carousel is where features breed, so the refusals are part of the element:

| Not here            | Why, and what to do instead                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Infinite loop       | [Measured below](#the-infinite-loop-that-is-not-here). The rotation wraps; the arrows stop    |
| Drag with the mouse | The scroller already drags on touch, and a desktop pointer has the buttons and the wheel    |
| Vertical            | The same code with the block properties, and nothing has asked for one                      |
| Adaptive height     | CSS. It is already the tallest slide either way — `align-items: start` on the scroller for ragged ones |
| `slides-per-page`   | `--carousel-elemental-slide-size`, which a breakpoint can change and an attribute cannot     |

### The infinite loop that is not here

Not refused on principle — tried, in Chromium, and both ways of doing it cost something this
element will not spend:

| How you would do it                                            | What it costs                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Clone the slides either side of the real ones                  | Every slide exists two or three times over for a screen reader, and the clones need `aria-hidden`, which is the bug that hides focusable links |
| Rotate the DOM at the end — move the first slide to the back and pull `scrollLeft` back by its width | Loops perfectly, and `scrollWidth` never grows. But after three wraps the DOM order is `4 5 1 2 3`, so the reading order no longer matches the carousel, the `N of M` labels are wrong until they are rewritten, and **a slide holding the focus loses it the moment it moves** — `document.activeElement` is back to `<body>`, which is a keyboard user thrown to the top of the page every lap |

The second one is the tempting one, because it looks seamless. It is seamless for the eye and
broken for everyone else, so what is here instead is a rotation that wraps and arrows that
stop.

## Why not the CSS carousel

CSS Overflow 5 has the whole of this in the platform:
[`::scroll-button()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::scroll-button)
generates the previous and next buttons, `scroll-marker-group` and `::scroll-marker` generate
the picker, and the browser gives them `button` and `tablist`/`tab` semantics with no script
at all.

It ships in Chrome and Edge 135 and nowhere else — [Baseline: limited
availability](https://webstatus.dev/features/scroll-markers), no Firefox, no Safari — and
this book supports the last three Safari majors and Firefox ESR
([.browserslistrc](https://github.com/stamat/book-of-elementals/blob/main/.browserslistrc),
enforced in lint). So it is not the implementation yet. It is a straight upgrade path when it lands: the scroller, the snap and
the sizing here are the same rules those pseudo-elements attach to, and the day it is
Baseline the controls can come out from behind an `@supports` and the script can stop
writing them.

With one behaviour to square first. A native scroll button moves by **one page** —
"approximately the dimension of the scroll container, similar to pressing PgUp and PgDn keys",
and with snap set up it lands on the snap target one page away. Previous and next here move by
**one slide**, which is the same thing on a row showing one at a time and a different thing on
a shelf showing four. Neither is wrong — they answer different questions — but swapping these
buttons for the pseudo-elements would change how far a press goes.

<script src="{{ relativePathPrefix }}dist/elementals/carousel.js"></script>
