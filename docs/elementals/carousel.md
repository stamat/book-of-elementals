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

<!-- demo carousel style="--code-preview-height:213px" -->

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
}
/* a hue per slide, mixed into the page's own background rather than set flat: 20% of a
   colour over Canvas is a tint in light mode and the same tint in dark, and the text on it
   is still CanvasText — a flat pastel would be one theme's slide and the other's contrast bug */
carousel-elemental li:nth-child(3n + 1) {
  background: color-mix(in srgb, #e5484d 20%, Canvas);
}
carousel-elemental li:nth-child(3n + 2) {
  background: color-mix(in srgb, #0090ff 20%, Canvas);
}
carousel-elemental li:nth-child(3n + 3) {
  background: color-mix(in srgb, #30a46c 20%, Canvas);
}
h3 {
  margin: 0 0 0.5rem;
}
p {
  margin: 0;
}
```

That markup is the page you would have had anyway: a list. The element adds the
roles and appends the controls — and before it upgrades, or if it never does, it is still that
list: every slide on the page, in reading order, nothing hidden and nothing to press. The row,
the snap and the controls all arrive with the script, because the stylesheet keys on what the
upgrade writes — so a page without it has a list, not a carousel missing its buttons.

## Prior art

Two came before it, both now archived, and this element is what replaced them:

|                                                      | What it was                                                                                    | Why it is not this                                                                                                                                                                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [slidescroll](https://github.com/stamat/slidescroll) | a scroll-snapping row moved by `scrollIntoView`, one dependency, never published               | 216 lines with no `role`, no `aria-*` and no key handler — it scrolls beautifully with a mouse and is invisible to everyone else                                                                                                                                      |
| [slideswap](https://github.com/stamat/slideswap)     | a fade slideshow on npm: adaptive height, infinite loop, swipe, your own prev and next buttons | `aria-hidden` and `tabindex` on the slides, and nothing else; keyboard navigation and bullet navigation were still on its TODO list when it was archived. Its markup is its own vocabulary — `.slideswap-slide` inside `.slideswap-slides`, wired up by a constructor |

The idea both were right about carried over: the browser owns the position and nothing here
writes it back from an index — [the scroller is the state](#at-the-ends), and a resize is a
reason to read it again, never to move it. What did not is the shape. These took a selector
and an options object; this upgrades the list you already wrote,
and the APG roles, the picker and the keyboard are the part that was missing rather than a
setting. [`fade`](#fade) is slideswap's stack with all of that on it, minus
[the infinite loop](#the-infinite-loop-that-is-not-here), which was measured and refused.

## Usage

```javascript
import 'book-of-elementals/carousel';
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
| `interval`    | number  | `5000`                    | Milliseconds between slides. Under `1000` is treated as `1000`. |
| `prev-text`   | string  | `Previous slide`          | The previous button's accessible name.                          |
| `next-text`   | string  | `Next slide`              | The next button's accessible name.                              |
| `play-text`   | string  | `Start slide rotation`    | The rotation control's name while stopped.                      |
| `pause-text`  | string  | `Stop slide rotation`     | The rotation control's name while rotating.                     |
| `slide-text`  | string  | `Slide`                   | The word in front of the number on a picker button — `Slide 3`. Holding `{n}` it says where the number goes instead, for a language that does not put it last — `{n}. dia`. |
| `picker-text` | string  | `Choose slide to display` | The picker group's accessible name.                             |
| `position-text` | string | `{n} of {total}`        | The name a slide gets where the markup gave it none. `{n}` is its number, `{total}` how many there are — the whole sentence, because `of` between two numbers is English's shape as much as its word: `{total} 中の {n}`. |
| `roledescription-text` | string | `carousel`       | The word a screen reader says for the element instead of "group". |
| `slide-roledescription-text` | string | `slide`    | The same for each slide. Whitespace is refused in both, since a role announcement overridden with nothing is worse than one in the wrong language. |

There is no attribute for which slide is showing, and that is the design rather than an
omission: the scroll position is the state. An index attribute would be a second copy of it,
and a reader's thumb can change one of the two without telling the other. `fade` is the one
mode where there is nothing to scroll, and there the element holds the index itself.

### In another language

Every word this element says out loud is an attribute — the nine `*-text` ones above, and no
string left in the code for a page to be stuck with. None of them is visible; all of them are
what a screen reader reads, which is exactly why it is easy to ship a page that is Serbian to
the eye and English to the ear.

<!-- demo carousel style="--code-preview-height:181px" -->

```html
<carousel-elemental
  aria-label="Planine"
  roledescription-text="karusel"
  slide-roledescription-text="slajd"
  position-text="{n} od {total}"
  prev-text="Prethodni slajd"
  next-text="Sledeći slajd"
  slide-text="Slajd"
  picker-text="Izaberite slajd">
  <ul>
    <li><h3>Kopaonik</h3></li>
    <li><h3>Đerdap</h3></li>
    <li><h3>Tara</h3></li>
  </ul>
</carousel-elemental>
```

```css demo
carousel-elemental li {
  display: grid;
  align-content: center;
  padding: 1.5rem;
  min-block-size: 7rem;
  background: color-mix(in srgb, CanvasText 8%, Canvas);
}
h3 {
  margin: 0;
}
```

`roledescription-text` and `slide-roledescription-text` are the two that override
`aria-roledescription`, which is
[author-localized by definition](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription):
it replaces the name assistive technology has for a role, in whatever language that
technology had it in, so the value "should be translated when a page is localized". Set
either to nothing but whitespace and it is refused rather than written — MDN asks that the
value contain "more than just whitespace characters", and a role announcement overridden
with nothing at all is worse than one in the wrong language.

`autoplay` adds two more, `play-text` and `pause-text`. `aria-label` on the element is
yours as it always was: the element cannot invent a name and does not try.

### Properties

| Property     | Type        | Description                                                             |
| ------------ | ----------- | ----------------------------------------------------------------------- |
| `index`      | number      | Which slide is on screen. Assigning it does not scroll — that is `to()` |
| `slides`     | `Element[]` | Read-only, in order.                                                    |
| `scroller`   | `Element`   | Read-only. The list.                                                    |
| `autoplay`   | boolean     | Get/set. Writes the attribute.                                          |
| `interval`   | number      | Get/set. Milliseconds.                                                  |
| `fade`       | boolean     | Get/set. Writes the attribute.                                          |
| `to(index)`  | —           | Show a slide: scroll it to the start of the row, or cross-fade to it    |
| `next()`     | —           | One on. Does nothing at the end, where the button is dim                |
| `previous()` | —           | One back. Does nothing at the start.                                    |
| `advance()`  | —           | One on, wrapping at the end. What the rotation calls                    |
| `play()`     | —           | Start rotating.                                                         |
| `pause()`    | —           | Stop.                                                                   |
| `wire()`     | —           | Re-read the markup, [see below](#slides-that-change).                   |

Those methods are the whole way in from outside. There is no `command`/`commandfor`
vocabulary here the way there is on [`<modal-elemental>`](modal.html) —
[why](#what-it-does-not-do).

### Events

`carousel-change` fires whenever the slide on screen changes — a button, the rotation, a
swipe, a fragment link into a slide, a window resize that changes how many fit — and bubbles:

```javascript
const carousel = document.querySelector('carousel-elemental');

carousel.addEventListener('carousel-change', (e) => {
  e.detail.index; // 2
  e.detail.slide; // the <li>
});
```

A smooth scroll from the last slide back to the first passes over the ones in between, and
each of those is a slide that was on screen — so it is reported. If you are driving
something expensive off this, debounce it; the element does not, because a carousel that
lies about where it is would be the worse default.

### What it writes

| Element        | Attributes                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the element    | `aria-roledescription="carousel"` — `roledescription-text` —, `role="region"` (named) or `role="group"` (not), `data-carousel-at-start` / `data-carousel-at-end` while there is nowhere left to go that way, and `data-carousel-rotating` with an inline `--carousel-elemental-tick` while the timer is actually running |
| the list       | `role="group"`, `data-carousel-slides`, an `id` if it had none, `tabindex="0"` if nothing inside is focusable, and `aria-live` in `fade` only                                                                                                                                                 |
| each `<li>`    | `role="group"`, `aria-roledescription="slide"` — `slide-roledescription-text` —, `aria-label="3 of 10"` — `position-text` — if it had no name, `data-carousel-slide`, and `data-carousel-current` on the one showing                                                                          |
| the controls   | a `<div data-carousel-controls>` appended, holding the previous button, the picker and the next button                                                                                                                                                                                        |
| previous, next | an Octicon chevron, and `aria-disabled` at the end it cannot pass                                                                                                                                                                                                                             |
| the picker     | `role="group"`, `aria-label`, `data-carousel-markers`, one `<button data-carousel-marker>` per slide with `aria-disabled="true"` on the current one                                                                                                                                                                    |
| the rotation   | a `<button data-carousel-rotate>` prepended, only with `autoplay`, holding an Octicon play triangle or stop square                                                                                                                                                                            |

The controls are the element's to write rather than yours, and that is the progressive
enhancement working rather than a preference: a previous button authored in the markup is a
button that does nothing until the script lands.

`aria-disabled` everywhere rather than `disabled` — on the current picker button and on an
arrow at the end of the row — because a `disabled` button taken out from under the focus that
just pressed it drops the reader back to the top of the page.

The icons are `chevron-left-16`, `chevron-right-16`, `play-24` and `square-fill-24` from
[Octicons](https://primer.style/foundations/icons/) (MIT, © GitHub Inc.), inlined as four
path strings rather than pulled in as a package: that is the whole of what the dependency would
be for, and a build step to shake an icon set down to four shapes is the build step this project
promises you will not need. They are drawn and not typed for a reason you can see — a text
chevron sits wherever the font's designer centred it inside the em box, which in a round
button is visibly high, and `⏸`, which the rotation control used to be, is missing from
enough system fonts to come out as an empty box on the machine you did not test on.

Two of them are cropped rather than resized, which the viewBox does and no edited path has to:
`play-24` ships as a triangle inside a ring and only its triangle is here, since the button is
already a circle with a countdown ring around it, and the crop that brings the triangle up to
the chevrons' height sits half a unit left of the shape's centre — a triangle carries its area
behind its point, so one centred on its bounding box reads as leaning left.

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

| Key                                 | Action                                    |
| ----------------------------------- | ----------------------------------------- |
| <kbd>Tab</kbd>                      | Through the controls, and into the slides |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Press the control under the focus         |
| <kbd>←</kbd> <kbd>→</kbd>           | Scroll the row, when the focus is on it   |

The arrows are the browser's, not the element's. A focused scroll container already answers
to them, and to <kbd>Home</kbd>, <kbd>End</kbd> and the page keys, in every browser this
book supports — so there is no key handler here at all, and nothing taken from a reader who
was done with the carousel.

No control moves the focus. That is the APG's rule and the reason it matters is repetition:
press next four times and the focus is still on next — and the row is four slides on, because
each press counts from the slide the last one asked for rather than from wherever the scroll
has got to.

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

Both at once is also the selector for taking the controls off a shelf that fits. The picker
under it is four buttons pointing at four slides already on screen, and it says as little as
the dim arrows do:

```css
carousel-elemental[data-carousel-at-start][data-carousel-at-end] > [data-carousel-controls] {
  display: none;
}
```

Not the default, and the reason is the resize you are hiding for: the bar goes and comes back
as the window crosses the width where the row stops fitting, and everything under the carousel
moves with it. `visibility: hidden` holds the space and pays a blank strip instead. Which of
the two a page wants is the page's, which is why the element ships neither.

The rotation control is not in the bar — it is a child of the element, over the corner of the
row — so `autoplay` on a shelf that fits needs `> [data-carousel-rotate]` hidden too, or the
attribute taken off.

The rotation is the one thing that wraps: at the last slide it goes back to the first, because
a carousel that rotates to the end and stops is a carousel that quietly died. The buttons do
not, because they are dim there, and a control that looks spent must not still act.

A `dir="rtl"` row runs the other way, and everything here runs with it: next is the slide to
the left, the start is the right edge, the snap inset is the one on that side, and in `fade`
the swipe reads the same way round as the arrows.

## The wheel Safari keeps

Side-wheel a row in Safari, then scroll the page with the pointer still over it, and the page
does not move. Safari holds a wheel gesture on the last scroller it moved, and a row is a
scroller. None of that is this element's doing — a bare `overflow-x: auto` div anywhere does
the same, and WebKit fixed [one variant of it in
2020](https://bugs.webkit.org/show_bug.cgi?id=215641) while this one survived it. But the
scroller is the element's, so the element hands the scroll back: a wheel with more down in it
than across, over a row that has no vertical range of its own, is taken off Safari and given
to the nearest box that could have scrolled.

Only Safari runs it. The gate is `window.GestureEvent`, which no other engine has and none of
them needs — every one already passes on a scroll the row cannot use. The listener is not
passive either, because handing a wheel on means taking it off the browser first, and that is
exactly why it is gated rather than run everywhere: over that one box, Safari's own wheel
easing is replaced by this. A row that has grown a vertical scroll of its own keeps its wheel,
and so does a sideways one.

## Rotation

`autoplay` writes the rotation control and starts the timer:

<carousel-elemental class="demo-carousel" aria-label="Rotating places" autoplay interval="4000">
  <ul>
    <li><figure><img src="https://picsum.photos/id/93/640/360" alt="An open bog of white cotton grass with young pines scattered across it, under a pale dawn sky" width="640" height="360" loading="lazy"><figcaption>Cotton grass, before the light is properly up</figcaption></figure></li>
    <li><figure><img src="https://picsum.photos/id/79/640/360" alt="Steep dark hillsides in black and white, a pale track winding along the valley floor and higher peaks behind" width="640" height="360" loading="lazy"><figcaption>The valley floor, and the one way out of it</figcaption></figure></li>
    <li><figure><img src="https://picsum.photos/id/110/640/360" alt="A low sun going down behind a line of trees at the edge of flat grassland, the sky orange above them" width="640" height="360" loading="lazy"><figcaption>The last of the sun, out over the flat</figcaption></figure></li>
  </ul>
</carousel-elemental>

<small>Photographs by Caroline Sada, Dorothy Lin, Kenneth Thewissen, from <a href="https://unsplash.com/license">Unsplash</a>, served here through <a href="https://picsum.photos">Lorem Picsum</a>.</small>

```html
<carousel-elemental aria-label="Rotating places" autoplay interval="4000"
  >…</carousel-elemental
>
```

Everything the pattern asks of a moving carousel is in there:

| Rule                                          | How it behaves                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| A control that stops and restarts it          | Prepended to the element, so it is the **first** tab stop inside                 |
| Its name says what pressing it will do        | `Stop slide rotation` / `Start slide rotation`, and no `aria-pressed`            |
| Hovering the carousel pauses it               | Resumes when the pointer leaves                                                  |
| Moving focus into it pauses it                | Resumes when focus leaves — moving between two controls is focus that never left |
| Rotation the reader started by hand is theirs | Hover and focus are then ignored until the same button stops it                  |
| Scrolling it off the screen pauses it         | Resumes 200px of scrolling before it is back in frame — and this one is not ignored, however the rotation started |
| `prefers-reduced-motion: reduce`              | `autoplay` is not obeyed at upgrade. The control is still there to start it      |

The last row is the one worth reading twice. The preference switches off motion nobody
asked for; it does not take away a control from a reader who wants it.

The row above it is the one exception to the row above *that*, and the ordering is
deliberate. Hover and focus are a person at the carousel, so a reader who pressed Start gets
to overrule them — that is the APG's rule and it is honouring a choice. Off the screen there
is no choice to honour and nobody at the carousel at all: the clock would spend the life of
the page advancing slides for no one, and hand back a carousel parked mid-set on a slide
nothing the reader did chose. It is the timer that stops, so `data-carousel-rotating` comes
off with it and the button still reads `Stop` — the same as under a pointer. Where there is
no `IntersectionObserver` there is no hold, and the rotation runs the way it did before.

The rotation control is drawn over the top corner of the row rather than down in the bar with
the other controls. It has to be first in the tab order, and a control drawn a long way from
where it is read is a tab order that lies — so it is drawn where it sits.

That corner is also the one place in the element where a control is not on the page's own
background but on a photograph, so this button is the one that does not follow
`currentcolor`: an opaque `--carousel-elemental-chip` behind a `CanvasText` icon, which is
the page's own contrast wherever the picture goes light or dark. `currentcolor` there is
whatever the slide's own text inherited, and a white icon on a white sky is a control nobody
can find.

Around it is the countdown: a ring that sweeps once per `interval`, so the next slide is not
a surprise and the reader can see how long they have. It is drawn as the button's border —
a conic gradient clipped to the border box over a fill clipped to the padding box — so it
costs no extra element and nothing over the icon. The chip is under that gradient and again
in a collar outside it, which is not decoration: the sweep is `CanvasText` and the track it
runs on is 20% of the same colour, so over a night photograph a ring drawn straight onto the
slide would be a black arc on black with nothing behind it. The theme animates it off
`data-carousel-rotating`, which the element writes **with the timer and not with the
button**: the two part company every time a pointer crosses the row, where the rotation is
held but the control still says `Stop`. A ring sweeping there would be counting down to
nothing. Under `prefers-reduced-motion: reduce` there is no sweep at all, only the track.

> [!NOTE]
> `interval` under 1000 is treated as 1000. Below that it is a strobe, and it is also
> shorter than the smooth scroll it would be interrupting, so the carousel would never
> finish arriving anywhere.

## How many slides fit

One custom property, and no attribute:

<carousel-elemental class="demo-carousel demo-carousel-three" aria-label="Three at a time">
  <ul>
    <li><figure><img src="https://picsum.photos/id/118/640/360" alt="Dry thistle heads in the foreground over a wide valley of pale hills" width="640" height="360" loading="lazy"></figure></li>
    <li><figure><img src="https://picsum.photos/id/120/640/360" alt="The Milky Way over a leaning wooden fence at night" width="640" height="360" loading="lazy"></figure></li>
    <li><figure><img src="https://picsum.photos/id/76/640/360" alt="A green bicycle leaning on the weathered planks of a shed, beside a peeling blue door" width="640" height="360" loading="lazy"></figure></li>
    <li><figure><img src="https://picsum.photos/id/90/640/360" alt="Green glass jars upturned on the posts of a bamboo fence" width="640" height="360" loading="lazy"></figure></li>
    <li><figure><img src="https://picsum.photos/id/82/640/360" alt="Purple and white blossom on a bare branch" width="640" height="360" loading="lazy"></figure></li>
  </ul>
</carousel-elemental>

<small>Photographs by Rick Waalders, Guillaume, Alexander Shustov, Rula Sibai, from <a href="https://unsplash.com/license">Unsplash</a>, served here through <a href="https://picsum.photos">Lorem Picsum</a>.</small>

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
its own end: on the last screenful next goes dim, and the press that got you there was a
short one — as far as the row had left rather than a whole slide. That is the scroller's
answer rather than arithmetic on the index — with three slides on screen the last two can
never be the first visible one, so counting to the last slide would leave the final presses
doing nothing.

## Fade

`fade` swaps the row for a stack: every slide in one place, the current one faded up over the
rest. Same controls, same picker, same rotation, same events — the only thing that changes is
how a slide arrives.

<!-- demo carousel style="--code-preview-height:241px" -->

```html
<carousel-elemental aria-label="Fading places" fade autoplay interval="4000">
  <ul>
    <li>
      <h3>Kopaonik</h3>
      <p>Mist over the ridge.</p>
    </li>
    <li>
      <h3>Đerdap</h3>
      <p>
        The river, and rock on both sides of it. The gorge runs for a hundred
        kilometres, and the road along it is cut into the rock the whole way —
        which is a longer slide than the one before it, on purpose: watch the
        box travel.
      </p>
    </li>
    <li>
      <h3>Tara</h3>
      <p>A lake, and nothing growing above it.</p>
    </li>
  </ul>
</carousel-elemental>
```

```css demo
/* preview-only, and not part of the pattern: this sample runs in an iframe the docs size to
   the document inside it, and that measurement deliberately will not chase a height changing
   every frame — it moves in 2px hops behind a one-pixel dead band, which leaves the document
   taller than the frame on alternate frames and flickers the iframe's own scrollbar through
   the whole fade. Reserving the tallest state holds the document still and the box travels
   inside it. A floor, so a narrow enough column wraps past it and the flicker is back */
body {
  min-block-size: 13rem;
}

/* no centring and no minimum height, unlike the scrolling demos above: both slides are on
   screen at once during the cross-fade, so content centred in boxes of two different heights
   is the same words in two places, and the eye reads the swap as a wobble. Anchored to the
   top, the heading of the slide arriving is where the heading of the slide leaving was */
carousel-elemental li {
  padding: 1.5rem;
}
carousel-elemental li:nth-child(3n + 1) {
  background: color-mix(in srgb, #e5484d 20%, Canvas);
}
carousel-elemental li:nth-child(3n + 2) {
  background: color-mix(in srgb, #0090ff 20%, Canvas);
}
carousel-elemental li:nth-child(3n + 3) {
  background: color-mix(in srgb, #30a46c 20%, Canvas);
}
h3 {
  margin: 0 0 0.5rem;
}
p {
  margin: 0;
}
```

This is the one mode where the scroller is not the state. Stacked slides have nothing to
scroll, so the element holds the index itself and the stylesheet draws from
`data-carousel-current`. Two things follow from that, and both are the reason it is an
attribute rather than the default:

| Scrolling                                    | `fade`                                                          |
| -------------------------------------------- | --------------------------------------------------------------- |
| Every slide in the accessibility tree        | Only the current one — the rest are `visibility: hidden`        |
| No live region needed                        | `aria-live`, `polite` when pressed and `off` while rotating     |
| Find-in-page searches every slide            | Finds only the slide showing                                    |
| Swipe, scrollbar, arrow keys on the scroller | Swipe, the buttons and the picker — no scrollbar, no arrow keys |
| Without script: a plain list                 | Without script: the same plain list — the stack arrives with the script, like the row |

`visibility` and not `opacity` alone, because a slide at `opacity: 0` is still focusable and
still read — a tab stop in a slide nobody can see is worse than no fade at all. The delay on
the way out is what leaves the fade something to fade: going out `visibility` waits for the
transition, coming in it does not wait at all.

The height is the showing slide's, not the tallest one's. Only the current slide is left in
flow — the rest are taken out of it — so a stack of slides of different lengths is not a
column of white space under every short one. The box travels between the two heights over the
same `--carousel-elemental-fade` the cross-fade takes, which is what keeps that from being a
page that jumps every time a slide changes: the element pins the height it had, hands it the
height it is going to, and gives the box back to the layout the moment the travel lands. So a
window resized after the fade, a font that arrived late, a picture that finally loaded are all
answered by the layout rather than by a measurement taken before them.

`prefers-reduced-motion: reduce` cuts both to nothing whatever the property says — and there
the height is not pinned at all, since a pin is taken back off when its transition ends and a
transition that never runs never ends.

**Anchor the content to the top of the slide.** Both slides are on screen for the length of
the cross-fade, so content centred inside boxes of two different heights is the same heading
drawn in two places at once, and the swap reads as a wobble rather than as a fade. Centring is
right where every slide is the same height — the scrolling demos above do it — and wrong the
moment the box travels.

### The swipe

A stack is not a scroll container, so the swipe the scrolling row gets from the browser has to
be read for it — `swipe()` from [book-of-spells](https://github.com/stamat/book-of-spells) does
the reading, and this is the only place in this element where a gesture is read at all. Forty
pixels across, and further across than down, moves one slide. It is not adjustable and
there is no attribute for it: a swipe is a hand, not a layout, and a tap wobbles by the same
few pixels whether the slide is a phone wide or a thumbnail.

What it deliberately does not do is the part worth reading:

| Not this                             | Because                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| The mouse                            | [Still refused](#what-it-does-not-do). Touch and pen only, and the check is on `pointerType`                              |
| Follow the finger                    | There is nothing to translate — the fade runs at its full duration once the gesture commits                               |
| Wrap at the ends                     | The arrow is dim there, and a gesture that still moved would disagree with the element's own controls                     |
| Catch a scroll down the page         | `touch-action: pan-y pinch-zoom`, and a gesture more vertical than horizontal is not a swipe. Zooming stays the browser's |
| Follow the link the finger landed on | A touch ending on a link fires a `click`, and a committed swipe swallows exactly one of them                              |

## Slides that change

Nothing watches the markup. Add a slide, remove one, reorder them, and `wire()` is the one
call that says so:

```javascript
carousel.querySelector('ul').insertAdjacentHTML('beforeend', '<li>…</li>');
carousel.wire();
```

It re-reads everything, renumbers the labels it wrote — leaving the ones you wrote alone —
rebuilds the picker and re-observes the row. Safe to call as often as you like. That is a
line on the pages that build their slides, instead of a `MutationObserver` running on every
page that never touches them.

**It works from empty, and back to empty.** An element whose list has fewer than two slides
puts no pattern on it — one slide is a figure, and a picker with a single button in it would
be worse than the markup it upgraded — but it still binds its listeners and waits, so a
gallery that ships an empty `<ul>` and fills it on demand is a `wire()` away from a working
carousel. Emptying one takes the roles, the names, the controls and the rotation's clock back
off and leaves the list, rather than leaving controls that drive nothing; filling it again
brings them all back, the clock included unless the reader had stopped it. The
[lightbox example](../examples/lightbox.html#a-gallery-at-scale) is that shape end to end.

The one thing it cannot do is invent the list. The scroller is markup this element upgrades,
never something it writes: with no `<ul>`, `<ol>` or `<menu>` inside, there is nothing to
wire and `wire()` returns. Append one and call it again — the listeners were bound at upgrade
and are waiting for it.

## The look

`style.scss` is structure only — the scroller, the snap, and how wide one slide is. Take
those away and there is nothing to scroll and nothing to observe, which is why they are not
in the theme. `theme.scss` is the look and is optional; it draws all four controls as one set
of round buttons, mixed out of `currentcolor` so they sit in whatever palette the page has:

| Property                            | Default               | Description                                                                                               |
| ----------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `--carousel-elemental-slide-size`   | `100%`                | How wide one slide is — this is how many fit                                                              |
| `--carousel-elemental-gap`          | `1rem`                | Between the slides                                                                                        |
| `--carousel-elemental-controls-gap` | `0.5rem`              | Between the controls under the row                                                                        |
| `--carousel-elemental-marker-size`  | `1.75rem`             | Diameter of a control                                                                                     |
| `--carousel-elemental-control`      | `currentcolor`        | Text and border of the controls                                                                           |
| `--carousel-elemental-border`       | 20% of `currentcolor` | Border of a control                                                                                       |
| `--carousel-elemental-hover`        | 10% of `currentcolor` | Control background under the pointer                                                                      |
| `--carousel-elemental-current`      | `CanvasText`          | Fill of the picker button for the slide on screen — not `currentcolor`, which its inverted text would turn `Canvas` |
| `--carousel-elemental-chip`         | `Canvas`              | Fill behind the rotation control, which sits over a slide rather than over the page                       |
| `--carousel-elemental-rotate-hover-color` | `CanvasText`    | The rotation control's foreground under the pointer — its icon, and the countdown ring with it            |
| `--carousel-elemental-ring`         | `3px`                 | How thick the rotation control's countdown ring is                                                        |
| `--carousel-elemental-radius`       | `999px`               | Corner radius of the controls                                                                             |
| `--carousel-elemental-fade`         | `400ms`               | How long the cross-fade takes in `fade`, and how long the box takes to travel between two slides' heights |

Turn them in the **Options** tab and copy the rule out of the bottom of the panel — the same
table, with the values live:

<!-- demo carousel tab="options" style="--code-preview-options-height:935px" -->

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
}
carousel-elemental li:nth-child(3n + 1) {
  background: color-mix(in srgb, #e5484d 20%, Canvas);
}
carousel-elemental li:nth-child(3n + 2) {
  background: color-mix(in srgb, #0090ff 20%, Canvas);
}
carousel-elemental li:nth-child(3n + 3) {
  background: color-mix(in srgb, #30a46c 20%, Canvas);
}
```

The picker buttons keep their numbers rather than becoming bare dots. The number is the
visible half of the button's name — `Slide 3` contains `3`, which is what
[WCAG 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) asks of a name
over a label — and a dot is a target with nothing in it to read. Draw dots if the design
wants them, and hide the number knowing what it costs.

The scrollbar comes off the row. After the upgrade the buttons and the picker are the way
through, and a scrollbar under them is a second one nobody uses; the wheel, the trackpad and
the arrow keys are unaffected. Before the upgrade there is no row to have one — every
structure rule is written against `[data-carousel-slides]`, which the element writes — so a
page whose script never lands has the plain list and nothing taken from it.

Under `forced-colors` the current picker button is repainted in `Highlight`, since a fill is
the only thing telling it apart. Motion is two things and both answer to
`prefers-reduced-motion`: the scroll itself, switched off in `style.scss` by one media query
because every way the row moves goes through the same `scrollLeft`, and the countdown ring in
the theme, which is not drawn moving at all under that preference.

### Your own arrows

The element writes the controls and writes them again on every [`wire()`](#slides-that-change),
so a button you append to the bar yourself is gone the next time the slides change. Two ways
round that, and they cost different things:

| What you want                 | How                                                                                            | What it costs                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A different icon or shape     | Style `[data-carousel-prev]` and `[data-carousel-next]`, and hide the `<svg>` the element drew | Nothing — the button, its name and its `aria-disabled` stay the element's             |
| Buttons of your own elsewhere | Hide the bar, write your own, call `previous()` and `next()`                                    | The dim state is yours, and a screen reader is told nothing unless you write it       |

The first is the one to reach for. The icons are ordinary children, so a rule takes them off
and the button keeps everything that makes it a control:

```css
carousel-elemental :is([data-carousel-prev], [data-carousel-next]) > svg {
  display: none;
}
carousel-elemental [data-carousel-prev]::before {
  content: '\2190';
}
carousel-elemental [data-carousel-next]::before {
  content: '\2192';
}
```

The glyph is decoration and not a name: the element wrote `aria-label` on the button, which
wins over anything in it, so a screen reader still says `Next slide` — or whatever `next-text`
says instead. Rename with the attribute, never with the content.

Buttons of your own are two lines, since `previous()` and `next()` are public and already stop
at the ends:

```html
<carousel-elemental id="gallery" aria-label="Gallery">
  <ul>
    <li>One</li>
    <li>Two</li>
  </ul>
</carousel-elemental>

<button type="button" data-prev>Back</button>
<button type="button" data-next>On</button>
```

```javascript
const gallery = document.querySelector('#gallery');

document.querySelector('[data-prev]').addEventListener('click', () => gallery.previous());
document.querySelector('[data-next]').addEventListener('click', () => gallery.next());
```

What you have taken on is the half the arrows do without being pressed. `next()` at the end
does nothing and says nothing, so a button that still looks live gets pressed twice and then
distrusted — the bug [the ends](#at-the-ends) exist to avoid. CSS covers the look, off the same
attributes, as long as your buttons come after the element:

```css
carousel-elemental[data-carousel-at-end] ~ [data-next] {
  opacity: 0.35;
}
```

The screen reader is the part CSS cannot reach. `aria-disabled` on your button is yours to
write, and there is no event for the ends — `carousel-change` fires when the *slide* changes,
and a resize that leaves the row at its end without moving it is exactly the case it stays
quiet for. Watching `data-carousel-at-start` and `data-carousel-at-end` with a
[`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) is the
whole of it, and it is also the argument for restyling the buttons that are already there.

### Styling hooks

```css
carousel-elemental[autoplay] {
} /* the host, while rotation is on offer */
carousel-elemental[data-carousel-at-end] {
} /* nowhere left to scroll that way */
carousel-elemental[data-carousel-rotating] {
} /* the timer is running right now */
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

| Not here                   | Why, and what to do instead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Infinite loop              | [Measured below](#the-infinite-loop-that-is-not-here). The rotation wraps; the arrows stop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Drag with the mouse        | A desktop pointer has the buttons, the picker and the keyboard, and reading a drag off it costs the page its text selection, its image dragging and its link clicks. Touch swipes either mode — natively when it scrolls, [written here](#the-swipe) when it fades                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Vertical                   | The same code with the block properties, and nothing has asked for one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Adaptive height, scrolling | CSS, and a row is the tallest slide either way — `align-items: start` on the scroller for ragged ones. [`fade` is the mode that has one](#fade), since a stack shows a single slide and the box can follow it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `slides-per-page`          | `--carousel-elemental-slide-size`, which a breakpoint can change and an attribute cannot                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `command` triggers         | The modal takes `command`/`commandfor` because those are the platform's own — a `<dialog>` opens from them with this script absent, and the element only steps in to animate it. A carousel command would be a name invented here, so the button would sit dead until the module lands, which is the thing [the controls exist to avoid](#what-it-writes). An outside control is a line of script: `carousel.to(2)`. The platform is coming for this one too — [declarative scroll commands](https://github.com/danielsakhapov/declarative-scroll-commands-for-html-explainer) would give a scroll container `command="page-inline-end"` with snapping honoured, and that is a better answer than a name from this book |

### The infinite loop that is not here

Not refused on principle — tried, in Chromium, and both ways of doing it cost something this
element will not spend:

| How you would do it                                                                                  | What it costs                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clone the slides either side of the real ones                                                        | Every slide exists two or three times over for a screen reader, and the clones need `aria-hidden`, which is the bug that hides focusable links                                                                                                                                                                                                                                                   |
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
