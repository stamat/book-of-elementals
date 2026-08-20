---
layout: poops-docs-theme/docs
title: Tilt
description: A card that leans under the pointer — layers that rise out of it, a glare that follows, and the reduced-motion switch every other tilt library ignores.
order: 22
navGroup: No APG pattern
---

# `<tilt-elemental>`

The 3D tilt every product page has: a card that leans away from the pointer, with a highlight
travelling across it and whichever parts you name standing out of the surface. You write the
card; it wraps it. Light DOM, no shadow root, nothing you wrote is moved or wrapped.

There is no APG pattern here, because there is no widget — nothing is operated, and the
content is the same content lying flat. What there is instead is an obligation, and it is one
nothing else in this corner of the ecosystem meets.
[WCAG 2.2 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
says motion animation triggered by interaction has to be able to be turned off, *unless the
animation is essential*. A decorative tilt is never essential — it conveys nothing — so there
is no exemption to claim, and `prefers-reduced-motion` is the technique the criterion itself
names.

| The library | What it costs you | What this does |
| --- | --- | --- |
| [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | twenty-odd documented options, none of them motion; a search of its issues for "reduced motion" returns nothing | reads the setting, follows it live, and never attaches a listener |
| [tilt.js](https://gijsroge.github.io/tilt.js/) | jQuery, and the same silence on reduced motion | one file, one dependency, and that one is the sibling spellbook |
| [Atropos](https://atroposjs.com/docs) | four nested `<div>`s — `.atropos`, `.atropos-scale`, `.atropos-rotate`, `.atropos-inner` — before anything tilts | your markup, unchanged, inside one wrapper |
| all of them | a `lerp` inside `requestAnimationFrame`, running as long as the pointer is over the card | a CSS transition, eased by the compositor, which stops on its own |

<!-- demo tilt style="--code-preview-height:230px" -->

```html
<tilt-elemental glare max="12">
  <article class="card">
    <p class="kicker" data-tilt-depth="15">Elemental</p>
    <h3 data-tilt-depth="40">Tilt</h3>
    <p data-tilt-depth="10">A card that leans away from the pointer, and lies back down when it leaves.</p>
  </article>
</tilt-elemental>
```

```css demo
/* the lean, the glare and the layers are the element's; the card is yours. Nothing here is
   needed to make it tilt — it is what makes three paragraphs look like a card */
tilt-elemental { max-width: 22rem; }
tilt-elemental .card {
  padding: 2rem;
  background: linear-gradient(135deg, color-mix(in srgb, CanvasText 12%, Canvas), Canvas);
  border: 1px solid color-mix(in srgb, CanvasText 20%, transparent);

  /* the theme's radius, taken rather than repeated — and `border-radius` rather than
     `overflow: hidden`, which would flatten every layer above */
  border-radius: inherit;
}
tilt-elemental .kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
}
tilt-elemental h3 { margin: 0 0 0.5rem; }
tilt-elemental p:last-child { margin: 0; }
```

_Move across it and the edge you are pointing at goes away from you, the highlight follows the
cursor, and the heading stands further out of the card than the paragraph under it. Run the
cursor along the very edge: it holds its lean instead of flickering. Leave, and the card settles
flat over a longer beat than it took to lean while the highlight fades out where it stood. Turn
on "reduce motion" in your system settings and reload: nothing moves at all._

## The markup

One wrapper round the card you were writing anyway:

```html
<tilt-elemental>
  <article class="card">
    <img src="/photo.jpg" alt="">
    <h3>A heading</h3>
  </article>
</tilt-elemental>
```

- **Whatever is inside is the card.** The element writes no roles, no ARIA and no names —
  everything a screen reader hears is what you wrote, in the order you wrote it.
- **The wrapper is `display: block`** and nothing else, so it is transparent to your layout.
  Give it a width, put it in a grid, do what you would have done to the card itself.
- **The card's own background belongs on your element**, not on the wrapper. The wrapper is
  the thing that leans; the card is the thing that is drawn.

## Layers

Mark any descendant `data-tilt-depth` and it rises out of the surface while the card is
leaning, then settles back with it:

```html
<tilt-elemental>
  <article class="card">
    <img src="/photo.jpg" alt="">
    <h3 data-tilt-depth="40">Standing out of it</h3>
    <p data-tilt-depth="15">Not as far</p>
  </article>
</tilt-elemental>
```

The number is a count of `--tilt-elemental-depth-step`, which is `1px` — so `40` is 40 pixels
towards the reader. Negative sinks it in. Any depth on any descendant, at any nesting, and
they compose the way transforms do.

**They rise only while the card is leaning.** A layer floating permanently above a resting card
reads as a heading slightly too large for its box, which is a bug report about the font.

**A layer works at any depth of nesting**, and that is not free. A layer only rises if every
box between it and the card is in the same 3D space, and `transform-style` defaults to `flat` —
so the one plain `<article>` most people wrap their content in flattens every depth inside it
straight back onto the surface. Nothing warns: the transform still computes, still reads
`translateZ(40px)` in the inspector, and is simply drawn with no depth. The stylesheet puts
`preserve-3d` on every box that contains a layer, so the wrapper you wrote is not something you
have to know about.

**`overflow` is the trap that is left, and it is not this element's to fix.** Per
[the spec](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style), these force
`transform-style` back to `flat` — on the element **or on any wrapper between it and a layer**:

| Property | Value that flattens |
| --- | --- |
| `overflow` | anything but `visible` or `clip` |
| `filter`, `mask-image` | anything but `none` |
| `opacity` | below `1` |
| `clip-path`, `mix-blend-mode` | anything but `none` / `normal` |
| `isolation` | `isolate` |
| `contain` | `paint`, and anything implying paint containment |

The usual reflex for a rounded card is `overflow: hidden`, and that is exactly the one that
costs you the layers. Round the card with `border-radius` alone — which is what the optional
theme does — and note that `overflow: clip` is not on the list, so it is the one that clips
without flattening.

A layer added after the element upgraded is not seen: the depth is copied out of the attribute
into a custom property once, because CSS cannot read an attribute as a number. Render new
layers and call `.update()`.

## The glare

`glare` draws a highlight that follows the pointer across the card. It is in the element's own
stylesheet rather than in the optional theme, which is the one place the line between those two
files bends: the attribute is a promise, and a promise kept only for whoever also imported the
look is a promise broken for everyone else.

```html
<tilt-elemental glare>…</tilt-elemental>
```

It is one colour, alpha included — `--tilt-elemental-glare-color` — rather than a colour and
an opacity, because a glare is the two together and nobody sets one without the other. The
default is two weights of the same white, `light-dark(rgb(255 255 255 / 100%), rgb(255 255 255 / 10%))`,
because the surface decides how much of a white light shows: 10% over a dark card is a sheen,
and over a light card nothing short of full white reads at all — 80% was still invisible on
this page's own demo. Full white is also the ceiling: **a white glare cannot show on a pure
white surface**, so on a light card the highlight lives in whatever shading the card has, and
a card that wants more of it wants a tinted glare. `light-dark()` follows the page's
`color-scheme`, so a themed site's toggle carries the glare with it; a page that never
declares one resolves to the light value. `--tilt-elemental-glare-size` is how far it spreads
before it is gone: small is a hotspot, large is a wash.

**The glare sits on the card's own surface**, so a layer with a depth rises *through* it and is
lit from below rather than over the top. That is the right way round for a title standing out
of a photograph, and it is worth knowing before wondering where the highlight went.

**It fades out where it stood.** When the pointer leaves, the card straightens but the
highlight's position is left exactly where the pointer last was — only its opacity goes. Put
the position back to the middle along with everything else and the light travels to a place the
pointer never was, on its way out, which is the one movement in this element nobody asked for.

## Why it does not flicker at its own edge

Every tilt card has a stutter along its border, and it is worth saying where it comes from
because the fix is the reason this element does not need Atropos's wrapper divs.

The card leans *away* from the pointer, so the edge the pointer is nearest is always the edge
that swings back — and a receding edge projects inwards. Hit-test against the leaning card and
a pointer a pixel inside that edge falls outside it: the leave fires, the card straightens, the
edge lands back under the pointer, and it leans again. Sixty times a second, taking the shadow
with it.

**The box that decides is the box the card has when it is flat**, read at the first pointer
event of a hover — the one moment it can be read — and kept for the length of that hover. The
angles are measured against it, and so is the question of whether the pointer has left, which
is answered from coordinates rather than from whether the event reached the element.

| The other fixes | What they cost |
| --- | --- |
| Atropos: three wrapper divs so the hit-tested box never moves | markup you did not write, and cannot restructure |
| vanilla-tilt: a `mouse-event-element` option pointing at some other element | you have to know the problem exists, and find an element |
| lifting the card towards the reader so it never shrinks | does not work: what the rotation gives away grows with the *square* of the card's size, where a lift only scales it. Measured, `2.5rem` of lift on a 640×400 card at 10° was still nine pixels short |

Two consequences worth knowing. While the pointer is over a card, the element listens on the
document — that is what sees the pointer leave from the outside rather than waiting to be told.
And **a scroll straightens the card**: the cached box has moved and cannot be re-measured while
the card is leaning, so the honest answer is to lie flat and take a fresh measurement on the
next pointer event.

## Which way it leans

Away from the pointer — the feel of pressing a corner, rather than of the card following a
magnet. `reverse` is the other one:

| | Pointer at the top | Pointer at the right |
| --- | --- | --- |
| default | the top edge goes away | the right edge goes away |
| `reverse` | the top edge comes towards you | the right edge comes towards you |

**The glare does not flip with it.** Reverse changes which way the card leans; the light stays
where the reader is pointing.

`axis` keeps one rotation and drops the other:

| `axis` | What is left |
| --- | --- |
| absent | both |
| `x` | the card nodding, as the pointer moves up and down |
| `y` | the card turning, as the pointer moves across |

vanilla-tilt spells the same word the other way round — its `axis: "x"` *disables* the x
rotation. Ours names what survives.

## Motion, and who gets it

**`prefers-reduced-motion` is read and then followed.** With the setting on, no pointer handler
is attached at all: no transform, no glare, no layers rising. It is followed live rather than
read once at upgrade — unlike `<marquee-elemental>`, which reads it a single time because it
writes a Start button and a reader who pressed it must not be overruled later. There is no
control here, so there is nothing to overrule.

There is no `@media (prefers-reduced-motion: reduce)` rule in the stylesheet doing the same job
either. There is nothing for it to suppress, and a second place the same fact is written is two
things to keep in step.

**The pointer is a mouse or it is nothing.** A finger dragging across a card is a page trying to
scroll, and a card that tilts under it is a card fighting the gesture it intercepted.
vanilla-tilt and Atropos both offer touch and gyroscope modes; this has neither, and the
gyroscope one is a decision rather than an omission —
[`DeviceOrientationEvent.requestPermission()`](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static)
needs transient activation and a permission prompt on iOS, and a card that asks for sensor
access in order to wobble is a worse trade than a card that does not wobble on a phone.

**There is no keyboard equivalent, and that is deliberate.** Motion a reader cannot avoid
triggering is the thing 2.3.3 is about; a tilt that fired on focus would put it in front of
exactly the people who did not reach for it.

## Without script

A `<div>` that does nothing. Every rule but `display: block` is behind `:defined`, so with no
JavaScript there is no perspective, no transform and no glare — the card is your card, at your
size, in reading order. `display` is the one that cannot wait: an unupgraded inline wrapper
round a block card is a layout nobody wrote.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `max` | number | `10` | Degrees at the edge of the box. Anything that is not a number at or above zero is the default. |
| `axis` | `x`, `y` | both | Keep one rotation, drop the other. An unrecognised value is both, rather than a card that silently stopped moving because of a typo. |
| `reverse` | boolean | off | Lean towards the pointer instead of away. |
| `glare` | boolean | off | Draw the highlight. |

**`max="0"` is a card that does not tilt**, and the glare still follows the pointer. It is the
one number here that cannot fall back on being falsy, because zero is a value an author means.

`10` is a chosen number, not a derived one. GitHub's own card — the one this element was
extracted from — leans 2 degrees, which is so slight that most people never notice it is there;
ten is where the lean reads as deliberate without the card looking like it has fallen over.

## Styling

The structure stylesheet leans the card, raises the layers and draws the glare. The theme adds
the corners and a shadow that moves with the lean — barely there while the card lies flat,
full weight while it leans.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--tilt-elemental-perspective` | `1000px` | How near the reader is. Smaller is a wider lens and a stronger lean for the same angle |
| `--tilt-elemental-duration` | `120ms` | How long the card takes to catch up with the pointer — the trailing feel every tilt library calls speed |
| `--tilt-elemental-return-duration` | `400ms` | How long it takes to settle flat once the pointer has gone |
| `--tilt-elemental-easing` | `ease-out` | How both of those move |
| `--tilt-elemental-depth-step` | `1px` | What one unit of `data-tilt-depth` is worth |
| `--tilt-elemental-glare-color` | white light, white at 10% dark | The highlight, alpha included |
| `--tilt-elemental-glare-size` | `60%` | How far it spreads before it is gone |
| `--tilt-elemental-radius` | `0.75rem` | Theme. The card's corners, which the glare follows |
| `--tilt-elemental-shadow-size` | `1.5rem` | Theme. How soft the shadow is |
| `--tilt-elemental-shadow-color` | `currentcolor` at 30% | Theme. Its colour, and the fill of the layer it is drawn on |

Four more are written by the element and are there to read, not to set:
`--tilt-elemental-x` and `--tilt-elemental-y` are the two angles, `--tilt-elemental-glare-x`
and `--tilt-elemental-glare-y` are where the pointer is across the box. **All four are
unitless**, and the stylesheet puts the unit back on — which is what lets the theme spend the
same `--tilt-elemental-y` as a pixel translation for the shadow while the transform spends it
as a degree. One pair of numbers, two units, no dividing a `deg` back out of anything.

**Both pseudo-elements are spoken for**, and that is the element's whole budget: `::after` is
the glare, `::before` is the theme's shadow.

**The shadow is the card's shape, filled and blurred** — which is what a shadow is, and is not
what `box-shadow` gives you here. Two things go wrong with one:

| With `box-shadow` on the layer | What you see |
| --- | --- |
| it never paints inside its own box | the layer slides out from behind the leaning card and what emerges is the hole in the middle of the ring — at twenty degrees, a thin outline and nothing else |
| it holds full colour to the box edge and fades only outward | fill the hole and the two emerging sides have a hard rim, which reads as a sticker rather than a shadow |

Blurring the fill fades it across the edge in both directions, so there is no rim. The fill is
not optional either way: blurring an empty box blurs nothing.

At rest the layer sits at a quarter of its opacity and fades up to full as the card starts to
lean: a flat card casts almost nothing, and the shadow arriving with the lean is part of what
sells the lift. `--tilt-elemental-shadow-color` is still the one colour knob — both states
follow it.

`--tilt-elemental-shadow-size` is spent as *half* of itself, because `box-shadow`'s blur radius
is defined as twice the standard deviation of the gaussian it approximates and `filter: blur()`
takes that deviation directly — so the same number means the same softness it always did. The
colour default went from 20% to 30% for the same reason: a blurred shape is only half-opaque at
its own edge, so the same weight on the page needs more of it spent on the soft part.

The cost, plainly: this is a coloured slab rather than a hole, so **a card with a see-through
background has its shadow visible through it** — point `--tilt-elemental-shadow-color` at
`transparent` on one of those.

`filter` is on the flattening list above, and that is exactly why it is on the shadow layer
rather than on the card: it flattens the element it sits on, and that element has no children
to flatten. Measured — the card still leans, every `data-tilt-depth` still rises, and the paint
count is unchanged.

The shadow being a pseudo at all is the difference between a shadow that follows the lean and
one that stutters while doing it. `box-shadow` is a paint property: give its offset a custom
property that changes every frame and the browser repaints a soft blur sixty times a second, on
the main thread, while the card beside it glides because a transform is the compositor's job.
The two run at different rates and you can see it. Drawn once on a layer that is then only
translated, the numbers are identical and the paint work is not:

| Over one 240-frame hover | Paint events | Raster tasks |
| --- | --- | --- |
| offset inside `box-shadow` | 478 | 302 |
| translated pseudo-element (what ships) | 9 | 0 |
| …with `glare` on as well | 136 | 63 |

That last row is honest rather than incidental: the glare's gradient centre is a custom
property, so the gradient itself repaints as the pointer moves. The same fix — a fixed gradient
on an oversized layer that only translates — needs `overflow: clip` on the card to hide the
overhang, which would clip the shadow's own blur away with it. The two cannot both be
composited without a third box, and a third box is the wrapper this element exists not to
write. The glare is the cheaper of the two to leave.

One attribute goes on the element as state, and it is yours to style against:

| Attribute | Means |
| --- | --- |
| `data-tilt-active` | the pointer is over the card and the four numbers above are written |

That is also the whole of the hover-scale feature this element does not have:

```css
tilt-elemental[data-tilt-active] { scale: 1.03; }
```

Every custom property above is declared on the bare `tilt-elemental` selector rather than on
`tilt-elemental:defined`, so your own `tilt-elemental { --tilt-elemental-perspective: 600px }`
wins. A default hidden behind `:defined` is one class more specific than the rule you would
write to replace it, which is a default that quietly cannot be replaced.

## What it will not do

No gyroscope, no touch, no keyboard trigger, no glare mask or blend mode, no scale of its own,
and no opinion about what is on the card — a photograph is your image at your size, and a theme
that put a surface colour and a padding under it would be a design system's answer written into
a book of elements.

```scss
@use "book-of-elementals/tilt/style.scss";
@use "book-of-elementals/tilt/theme.scss"; // optional
```

```javascript
import "book-of-elementals/tilt";
```
