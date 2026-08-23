---
layout: poops-docs-theme/docs
title: Marquee
description: A strip that scrolls forever — the copies counted against the container, the copies kept out of the keyboard's way, and the stop button every other marquee leaves you to write.
order: 21
navGroup: No APG pattern
---

# `<marquee-elemental>`

A row of content that loops: a logo wall, a ticker, a run of awards along the bottom of a
landing page. You write the list; it makes the loop seamless and gives the reader a way out
of it. Light DOM, no shadow root, nothing you wrote is moved or wrapped.

There is no APG pattern here, because there is no widget — nothing is operated, and the
content is the same content standing still. What there is instead is an obligation, and it is
a Level A one.
[WCAG 2.2 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
says movement that starts on its own, runs longer than five seconds and sits beside other
content needs a mechanism to stop it. An infinite loop is longer than five seconds.

Every marquee in the ecosystem leaves that mechanism to you, and most of them leave more than
that:

| The bug | What it looks like | What the element does |
| --- | --- | --- |
| No way to stop it | `:hover` pauses, which no keyboard has | writes a real `<button>`, named for what pressing it will do |
| Two copies, hard-coded | right on a laptop, a hole in the loop on a wide screen | counts the track against the container and clones until the strip covers it |
| Copies in the tab order | <kbd>Tab</kbd> lands on a link scrolling past, then on its double | every copy is `inert` as well as `aria-hidden` |
| Copies of your `id`s | `#anchor` and `aria-labelledby` resolve to whichever came first | `id` is stripped from every copy and everything inside it |
| Motion nobody asked for | the strip moves before the reader has said anything | `prefers-reduced-motion` starts it stopped, with the button still there to start it |

`aria-hidden` on a copy is the one worth saying twice, because it is the fix everyone reaches
for and it is half a fix: it takes the copy out of the screen reader and does nothing
whatever about <kbd>Tab</kbd>. `inert` is what does both.

<!-- demo marquee style="--code-preview-height:83px" -->

```html
<marquee-elemental aria-label="Sponsors" speed="60">
  <ul>
    <li>Ferrum &amp; Co.</li>
    <li>Aqua Vitae</li>
    <li>Ignis Works</li>
    <li>Terra Nova</li>
    <li>Aether Labs</li>
  </ul>
</marquee-elemental>
```

```css demo
/* the strip is the element's; what is on it is yours. Nothing here is needed to make it
   loop — it is what makes five words look like five logos */
marquee-elemental { --marquee-elemental-gap: 1.5rem; }
marquee-elemental li {
  display: grid;
  place-items: center;
  min-width: 9rem;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);
  border-radius: 0.5rem;
}
```

_Point at it and it holds. Press the button and it stays held — and the button's name changes
from "Stop the moving content" to "Start", which is what a screen reader reads out. Narrow the
window: the number of copies is recounted, and nothing about the markup changes._

## The markup

One list, and you have written it before:

```html
<marquee-elemental aria-label="Sponsors">
  <ul>
    <li><a href="/ferrum"><img src="/logo/ferrum.svg" alt="Ferrum &amp; Co."></a></li>
  </ul>
</marquee-elemental>
```

- **Whatever is inside is the track**, and the track is what gets copied. Usually one `<ul>`;
  anything else works the same way, and several children are copied as a set.
- **`aria-label` is worth writing.** The element adds no name of its own — a strip of logos
  with no label is a list a screen reader reads out with no idea what it is a list of.
- **Alt text stays yours.** A logo's `alt` is the company's name, not "logo" and not empty:
  it is a link, and a link with no accessible name is
  [2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) unmet.

The stylesheet takes the markers and the indent off a `<ul>`, because a column of bulleted
blocks is not a track. `role="list"` goes back on it in the same breath — `list-style: none`
is what stops VoiceOver in Safari calling it a list at all, and the role is the way to keep
the semantics the CSS just took.

## How many copies

The number is measured, not chosen. A lap ends with the original translated its own length
out of frame, so what the reader sees at that moment is whatever is behind it — the copies
have to cover the container:

| Track against container | Copies | Why |
| --- | --- | --- |
| wider, or the same | 1 | one behind it is enough to fill the frame it leaves |
| narrower | `⌈(container + gap) ÷ (track + gap)⌉` | three logos on a wide monitor need more than one copy behind them |
| track has no width | 0 | nothing to loop |
| container has no width | 0 | a closed `<details>`, a hidden tab panel — measured again when it is real |
| stopped | 0 | nothing is moving, so there is nothing to make seamless |

**One is the floor while it moves, and zero is not an option there.** A track already wider
than the container still gets a copy: without one the lap ends on empty container, and the
loop reads as a jump. That is the one place this ignores what the arithmetic alone would say.

**The gap on the end is the one the strip does not have**, and it is why the container has a
`+ gap` on it. A strip of `n + 1` copies carries `n` gaps and none after the last, so it is
one gap shorter than `(n + 1) × repeat` — and counted without that, it comes up to a whole gap
short of the frame. What that looks like is a sliver of empty container in the last moments
before the lap wraps, which reads as a blink at the wrap and is really an off-by-one-gap two
seconds earlier.

**The count is capped at 20.** A track one narrow item wide against a wide screen asks for
hundreds of copies, and every copy is a subtree in the document. Past the cap the loop shows a
gap — visible, and fixed with more content rather than with more copies.

Nothing is measured again until the box changes size. A resize, a container query, a webfont
landing, a sidebar folding away: all of them are one `ResizeObserver`, and none of them
rebuild the strip if the width came out the same — rebuilding restarts the lap, and a lap that
restarts under a reader who has just pressed pause is a jump asked for by the one gesture that
means hold still.

## Stopping

Three things stop it, and only one of them is a decision:

| What | Holds it while |
| --- | --- |
| the pointer | it is over the strip, but not when it is over the button |
| focus | anything inside has it, but not the button |
| the button | until the same button starts it again |

**The button is not the strip, and that exception is what makes it work at all.** It sits over
the content, so reaching for it means hovering the element, and pressing it means focus is
inside the element. Count those and the strip stops as the pointer arrives — while the button
still reads Stop — so the press changes nothing anybody can see, and the control looks broken.
It is the same sticky hover a tap leaves behind on iOS, which would otherwise hold the strip
until something else was touched. Excluded, the button's label always describes what you will
actually see happen, and hovering the logos to read one still works after any number of
presses.

The button's name says what pressing it will do and it carries no `aria-pressed` — the same
answer the APG gives the carousel's rotation control, rather than both, which would have a
screen reader read the two against each other. `.play()`, `.pause()` and the `playing`
property are the same switch from script, and `marquee-toggle` fires with `detail.playing`
either way.

**`no-controls` takes the button away**, for a page that provides the mechanism itself: one
control over several strips, a site-wide motion switch, a design that puts the button
somewhere else. Said plainly, because the attribute cannot say it — with nothing else on the
page, that is 2.2.2 unmet, and it is yours to meet.

**Reduced motion is read once, at upgrade, and it wins over the markup**: no lap, and no
copies made to run one. The button still says Start, because a reader asking their system for
less movement has not said they never want this strip to move. There is deliberately no
`prefers-reduced-motion` rule in the stylesheet doing the same job — one would also override
that reader the moment they pressed Start, which is taking the choice away in the name of
respecting it.

## Focusable content on a moving strip

Links inside the track are reachable and only once: the copies are `inert`, so <kbd>Tab</kbd>
walks the original and stops. Focus pauses the strip, so what you land on holds still.

What this cannot fix is *where* it holds still. Focus can land on a link that is mid-lap and
partly out of frame, and the element cannot scroll it back without moving the strip under
everyone else — clipping is what keeps a stray scroll from leaving the loop permanently
misaligned, and clipping is also why there is nothing to scroll. If the track is a handful of
wide items it is not a problem in practice; if it is forty links, the honest answer is that a
moving strip is the wrong place for them.

## Without script

A list. The stylesheet does nothing at all until the element upgrades — every rule is behind
`:defined` — so with no JavaScript there is no clipping, no strip and no lap: the logos wrap
the way any list of things does, every one of them in the page and in reading order.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `speed` | number | `50` | Pixels a second. Anything that is not a positive number is the default. |
| `reverse` | boolean | off | Travel the other way. Flipped again under `dir="rtl"`, where the other way is already the default. |
| `no-controls` | boolean | off | Do not write the button. The mechanism becomes yours — see above. |
| `play-text` | string | `Start the moving content` | The button's accessible name while stopped. |
| `pause-text` | string | `Stop the moving content` | Its name while moving. |

`speed` is a rate and not a duration on purpose: a duration would mean a strip of four logos
and a strip of forty travel at wildly different speeds for the same number, and the number
that stays honest as the content changes is the one to expose.

## Styling

The structure stylesheet lays out the strip, clips it, runs the lap, and gives the button the
24px box [2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
puts under it — that last one is here rather than in the theme because a target too small to
hit is a failure and not a look. The theme adds the fade at the two edges and paints the
button.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--marquee-elemental-gap` | `2rem` | Between one copy and the next, and between the items inside a `<ul>` or `<ol>` track |
| `--marquee-elemental-fade` | `2rem` | How far the two edges fade out. `0` is a hard edge |
| `--marquee-elemental-surface` | `Canvas` | What the edges fade into and the button is painted on. Re-point it on a card |
| `--marquee-elemental-border-color` | `currentcolor` at 30% | The rim around the button |
| `--marquee-elemental-hover` | `currentcolor` at 10% over the surface | Its fill under the pointer |
| `--marquee-elemental-hover-color` | `inherit` | Its icon under the pointer. Setting it tints the fill above too, which is 10% of whatever the icon is |
| `--marquee-elemental-control-size` | `2rem` | The button's box |
| `--marquee-elemental-control-radius` | `50%` | Its corners |

Two more are written by the element and are there to read, not to set:
`--marquee-elemental-distance` is how far one lap travels, and
`--marquee-elemental-duration` is how long that takes at `speed`.

Every one of these is declared on the bare `marquee-elemental` selector rather than on
`marquee-elemental:defined`, so your own `marquee-elemental { --marquee-elemental-gap: 1rem }`
wins. A default hidden behind `:defined` is one class more specific than the rule you would
write to replace it, which is a default that quietly cannot be replaced.

Two attributes go on the element as state, and they are yours to style against:

| Attribute | Means |
| --- | --- |
| `data-marquee-running` | the two numbers above are written and the lap exists — set after the copies are in, removed before they are rebuilt |
| `data-marquee-paused` | stopped by the button or by `.pause()` |

`data-marquee-running` is not decoration and not a hook added for the sake of one: WebKit
resolves the custom properties inside a keyframe **once**, when the animation is created, and
never again. An animation that exists before the distance does is one that travels zero for
as long as it lives — which in practice was the author's own track standing still while every
copy appended after it moved, and the strip pulling apart at the seam. The attribute is what
holds the animation back until there is something for it to travel.

The fades are drawn as overlays rather than as a mask on the element, and that is not a
detail: a mask would take the button down with them, since it sits at the end edge — which is
the part being faded to nothing. A stop control you cannot see is the one thing here that has
to stay solid.

## What it will not do

No vertical axis, no pause-on-click, no per-item speed, no drag to scrub, and no opinion at
all about what is on the strip — a logo is your image at your size, and a theme that greyed
them out until hover would be a design system's answer written into a book of elements.

```scss
@use "book-of-elementals/marquee/style.scss";
@use "book-of-elementals/marquee/theme.scss"; // optional
```

```javascript
import "book-of-elementals/marquee";
```
