---
layout: poops-docs-theme/docs
title: Disclosure
description: A real button wired to a region it shows and hides — for the places a details element cannot go.
order: 5
---

# `<disclosure-elemental>`

A `<button>` wired to a region it shows and hides, per the
[APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/). Light DOM,
no shadow root, nothing wrapped and nothing moved — the region stays where your markup put
it, which is the whole point.

Native `<details>` is a disclosure already, and where it fits it wins —
[`<accordion-elemental>`](accordion.html) is built on it for that reason. It fits when the
region can live _inside_ the trigger's element. This is for [when it cannot](#why-not-just).

<figure class="demo-figure">
  <img src="https://picsum.photos/id/168/900/600" alt="Large glacial boulders on cropped grass, three of them raised on smaller stones behind, with flat farmland and a bright broken sky beyond." width="900" height="600" loading="lazy">
  <disclosure-elemental>
    <button>Figures for this photograph</button>
    <div id="photo-data">
      <table>
        <caption>The picture, by the numbers</caption>
        <thead>
          <tr><th scope="col">Figure</th><th scope="col">Value</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Photographer</th><td>Joeri Römer</td></tr>
          <tr><th scope="row">Source size</th><td>1920 × 1280</td></tr>
          <tr><th scope="row">Aspect ratio</th><td>3 : 2</td></tr>
          <tr><th scope="row">Pixels</th><td>2,457,600</td></tr>
          <tr><th scope="row">Served here at</th><td>900 × 600</td></tr>
          <tr><th scope="row">Lorem Picsum id</th><td>168</td></tr>
        </tbody>
      </table>
    </div>
  </disclosure-elemental>
</figure>
<small>Photograph from <a href="https://unsplash.com/photos/Xne1N4yZuOY">Unsplash</a>, served here through <a href="https://picsum.photos">Lorem Picsum</a>.</small>
<br>

_The numbers behind a figure, in the table beside it, for the reader the `alt` cannot carry
them to. Try find-in-page for "2,457,600" with the table closed._

## Usage

Write a `<button>` and the region it controls, and wrap them — edit the sample and the
preview above it follows as you type:

<!-- demo disclosure style="--code-preview-height:57px" -->

```html
<disclosure-elemental>
  <button>Figures for this photograph</button>
  <div id="photo-data">Two columns of numbers.</div>
</disclosure-elemental>
```

```javascript
import 'book-of-elementals/disclosure';
```

```scss
@use "book-of-elementals/disclosure/style.scss"; // structure and motion
@use "book-of-elementals/disclosure/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/disclosure.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/disclosure.min.css" />
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/disclosure-theme.min.css" />
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

> [!NOTE]
> The trigger must be a real `<button>` and a direct child. A `<div role="button">` would
> mean reimplementing Enter, Space and the disabled state the platform hands you, and a
> button nested deeper would be ambiguous with the buttons inside the region. Neither is
> enforced — in both cases there is simply no trigger, and the region stays visible.

## API

### Attributes

| Attribute | Type    | Default | Description                                                        |
| --------- | ------- | ------- | ------------------------------------------------------------------- |
| `open`    | boolean | `false` | Whether the region is showing. Reflected — it tracks the live state. |
| `for`     | string  | —       | `id` of the region. Defaults to the button's next element sibling.   |
| `open-when`   | string  | —       | A media query that owns `open`: held open while it matches, closed when it stops. |

`for` is also read as `data-for`. `open` is not — it is state, not configuration, so it has
one spelling.

### Properties

| Property | Type                  | Description                                     |
| -------- | --------------------- | ----------------------------------------------- |
| `open`   | boolean               | Get/set the state. Writes the attribute.        |
| `button` | `HTMLButtonElement`   | Read-only. The direct-child button.             |
| `region` | `Element`             | Read-only. What `for` names, else the button's next sibling. |

```html
<disclosure-elemental open>…</disclosure-elemental>
```

```javascript
const disclosure = document.querySelector('disclosure-elemental');
disclosure.open = true; // slides, and fires disclosure-toggle
```

Everything that changes it — a click, a script, find-in-page — goes through the attribute,
so there is one place to read the state and one place to watch it.

### Events

`disclosure-toggle` fires on the element on every state change, and bubbles. It fires with
the state change, not with the slide:

```javascript
document.querySelector('disclosure-elemental')
  .addEventListener('disclosure-toggle', (e) => {
    console.log(e.detail.region, e.detail.open);
  });
```

| Property        | Value                             |
| --------------- | --------------------------------- |
| `detail.region` | The element being shown or hidden |
| `detail.open`   | Its new state, as a boolean       |

### What it writes

| Attribute       | On         | Value                                                                             |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `aria-expanded` | the button | `true` / `false`                                                                  |
| `aria-controls` | the button | The region's `id`, generated if the markup has none                               |
| `type`          | the button | `button`, only if the markup did not set a type                                   |
| `hidden`        | the region | `until-found` while closed, absent while open — set at the end of the close slide |
| `data-state`    | the region | `open` / `closed`, flipped with the click rather than with the slide              |
| `class`         | the region | `disclosure-elemental-region` added, nothing removed                              |
| `data-mode`     | both       | `pinned` / `free`, only while `open-when` is set — see [A breakpoint that owns it](#a-breakpoint-that-owns-it) |

`type="button"` because a `<button>` in a form submits it unless told otherwise, and a
disclosure that posts the page away on its first click is not a disclosure.

### Keyboard

All of it is the button's, which is the point of using one:

| Key                                 | Action             |
| ----------------------------------- | ------------------ |
| <kbd>Tab</kbd>                      | Move to the button |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggle the region  |

A closed region is out of the tab order and out of the accessibility tree, because
`hidden` takes it out of both. No `aria-hidden` anywhere, and no focus to manage.

### Styling hooks

```css
disclosure-elemental[open] { }                       /* the host, reflected state */
disclosure-elemental > button[aria-expanded="true"] { } /* what the theme keys off */
.disclosure-elemental-region { }                     /* the region, wherever it lives */
.disclosure-elemental-region[data-state="closed"] { } /* the region, from the click onwards */
[data-mode="free"] { }                               /* the element and the region, with `open-when` set */
disclosure-elemental:not(:defined) { }               /* before upgrade */
```

`[aria-expanded="false"]` already means "closing or closed" — the ARIA and `open` both flip
at the click, so there is no closing class to pair with, the way the accordion needs one.
`data-state` on the region is that same moment carried to the other end of the document,
for the regions `for` puts out of the button's reach: `hidden` is the region's state as
well, but it cannot land until the close slide is over, so anything transitioned has to
key off `data-state` or it starts a whole slide late. Everything else can use either.

## Why not just `<details>`?

Because a `<details>` owns its content: the region has to be a descendant of the element
that toggles it. Four places that is not allowed or not survivable:

- **A `<figcaption>`.** HTML requires it to be the first or last child of its `<figure>`.
  Inside a `<details>` it is no longer the figure's caption.
- **A table row, cell or `<dd>`.** The content model does not admit a `<details>` in
  between, and neither does the layout.
- **A grid or flex item.** Its parent lays it out directly; wrap it and the parent is
  laying out the wrapper instead.
- **A region nowhere near its button.** A navigation drawer, a filter panel, a "show more"
  that opens below a whole card grid.

For anything else — a FAQ, a "read more" on top of its own text — use `<details>`, or
[`<accordion-elemental>`](accordion.html) for a set of them. This element is deliberately
not the general answer.

## A region elsewhere

Point `for` at the region's `id` and the element wraps nothing but the button. The region
then lives wherever the markup needs it:

<figure class="demo-figure">
  <img src="https://picsum.photos/id/129/640/400" alt="Two people on a bench with a dog at their feet, looking out over a bay towards a suspension bridge in the haze." width="640" height="400" loading="lazy">
  <disclosure-elemental for="bench-caption">
    <button>Describe this image</button>
  </disclosure-elemental>
  <figcaption id="bench-caption">
    <p>The bench is a slatted wooden one on a dark metal frame, standing on a
    concrete apron at the water's edge and seen from behind. Two people sit
    towards its right-hand end with their backs to the camera — one with long
    fair hair, one in a checked shirt — and a dog lies on the ground behind
    them, in the gap under the seat. Beyond the water the far shore is a low
    line of hills, and one tower of a suspension bridge stands out of the haze
    to the left of them, pale enough that the span reads as a single thin
    stroke. The whole frame is washed warm, the way photographs taken into a
    low sun over water usually are.</p>
  </figcaption>
</figure>
<small>Photograph by Charlie Foster, from <a href="https://unsplash.com/license">Unsplash</a>, served here through <a href="https://picsum.photos">Lorem Picsum</a>.</small>
<br>

```html
<figure>
  <img src="…" alt="Two people on a bench with a dog at their feet, looking out…" />
  <disclosure-elemental for="bench-caption">
    <button>Describe this image</button>
  </disclosure-elemental>
  <figcaption id="bench-caption">…</figcaption>
</figure>
```

The `<figcaption>` is still a child of the `<figure>`, so it is still the figure's caption
— the case the element exists for, and one `<details>` cannot reach at all.

The region is resolved once, at upgrade, so it has to be in the document by then. With the
bundle deferred or at the end of the body, it is.

## A breakpoint that owns it

Some disclosures stop being disclosures at a width. A navigation rail is a drawer on a
phone and simply _there_ on a desktop; a long description is a toggle in a narrow column
and prose beside the figure when there is room. That is one widget whose state belongs to
the viewport rather than to the reader, and `open-when` is how you say so:

```html
<disclosure-elemental for="sidebar" open-when="(min-width: 60rem)">
  <button aria-label="Documentation navigation">…</button>
</disclosure-elemental>
```

While the query matches the region is open; when it stops matching the region closes and
the button has it back. The element watches the query for as long as it is connected, so a
rotation, a window drag or a browser-zoom step all land the same way, and the attribute can
be rewritten at runtime — it starts watching the new query and drops the old one.

Without it this is nine lines of `matchMedia` in every page that wants it, and the version
most pages write instead is CSS:

```css
/* the common bug, not a suggestion */
@media (width >= 60rem) {
  .sidebar { display: block; }
  .nav-toggle { display: none; }
}
```

That shows the panel without telling anyone. `aria-expanded` still says `false` and the
region still says `hidden`, so a screen reader is told the thing it is reading does not
exist — and hiding the button with `display: none` does not make its lie quieter, it just
removes the only control that could have corrected it. Scott O'Hara's
[responsive accessibility](https://www.scottohara.me/blog/2022/11/07/responsive-accessibility.html)
walks through the CSS-only version of this and calls it "a little hacky", needing script
anyway. `open-when` is that script, once, in the element that already owns the state.

> [!NOTE]
> The query owns the state at each _change_, not every moment in between. Within one side
> of a breakpoint the button still toggles normally, which is what you want for a drawer
> that opens and shuts all day — and crossing the breakpoint resets it, so a drawer left
> open never survives into a layout that has no drawer. If the button would be meaningless
> on the matching side, hide it there in your CSS: the element writes state, not layout.

Crossing lands instantly rather than sliding. A breakpoint change is the page being
rearranged around the reader, and animating the region through a window drag would be
animating something nobody asked for. If the reader's focus is inside a region the
crossing closes — zooming in is the usual way to be mid-read when it happens — it moves
to the button rather than falling to `<body>`, so the way back open is under their hands.

### Measured against a container

A plain query measures the viewport, which is the wrong ruler for a disclosure living
inside a component: a 400px card in a desktop page is as cramped as a phone, and a media
query cannot see that. `container:` in front hands the same condition to the nearest
ancestor [container](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
instead — a container name goes before the parenthesis, exactly where `@container` puts it:

```html
<div style="container-type: inline-size">
  <disclosure-elemental for="extras" open-when="container:(min-width: 30rem)">
    <button aria-label="More tools">…</button>
  </disclosure-elemental>
</div>
```

No API evaluates a container query from script, so the element does not try: the condition
becomes a real `@container` rule in a `<style>` the element keeps in `<head>` — setting a
custom property on itself, read back out of the computed styles — and a `ResizeObserver`
on the container plays the part of the `change` event. The rule leaves with the element.
Everything else is the plain-query behaviour: same crossings, same `data-mode`, same focus
handoff. With no `ResizeObserver` to hear a crossing the query is ignored and the button
alone is in charge; with no container ancestor to observe, the condition can never match
and the disclosure stays free.

**What it takes is a size query**, whole: a name, `not`, `and`, `or`, and both axes where the
container is `container-type: size` — `container:card not (min-width: 30rem)` and
`container:(min-width: 40rem) and (min-height: 10rem)` are both watched the way a plain one is.

**What it refuses is `style()` and `scroll-state()`**, and a condition mixing one of those
with a size query is refused whole. Nothing tells script that a custom property moved or that
a box came unstuck — there is no event and no observer for either — so the element would read
such a condition once and be wrong from the first flip onward. Refused means the attribute is
ignored and the button alone is in charge, which is the same thing that happens with no
`ResizeObserver`. Your stylesheet can still act on a style query; what the element adds is
*state*, and state needs to be told when it changes.

The same `container:` is `vertical-when` on [`<splitter-elemental>`](splitter.html) and
`flyout-when` on [`<menu-elemental>`](menu.html) — one probe, three attributes, and this is
the page that explains it.

### The mode is on both ends

Setting `open-when` also puts `data-mode` on the element **and on the region** — `pinned` while
the query matches, `free` while it does not, and nothing at all on an element with no
`open-when`:

```html
<disclosure-elemental for="sidebar" open-when="(min-width: 60rem)" data-mode="free">…</disclosure-elemental>

<aside class="sidebar" id="sidebar" data-mode="free" hidden="until-found">…</aside>
```

Which is there so your stylesheet does not have to say the breakpoint a second time:

```css
/* no media query in here, and no `60rem` to keep in step with the attribute */
.sidebar { /* the rail */ }
.sidebar[data-mode="free"] { position: fixed; /* the drawer */ }
```

Written by hand, a responsive panel is a number in the HTML and the same number in the CSS,
in two languages, with nothing checking that they still agree — move one and the panel and
its state describe different layouts. Here only the element knows the breakpoint. Which is
also what makes such a stylesheet worth shipping: it carries no breakpoint, so it lands in a
project whose breakpoint is different and works.

On the region as well as the element because `for` lets the two live at opposite ends of the
document, and reaching back up to the button through `:root:has(…)` in every rule is a
stylesheet nobody wants to read.

> [!NOTE]
> `data-mode` arrives at upgrade, so `[data-mode]` cannot match before the element is
> defined — which makes it the progressive-enhancement guard as well. Layout that would
> strand the page if the script never loaded (an off-canvas panel, say) goes behind
> `[data-mode="free"]` and cannot apply until something is there to bring it back.

[The sidebar drawer](../examples/sidebar-drawer.html) is all of this on one page — the rail
this site's own navigation is at the wide end, the drawer it is on a phone, and a stylesheet
that never says the breakpoint.

## Find-in-page

A closed region is hidden with `hidden="until-found"`, not a bare `hidden`. Find-in-page
still searches it, a link to a fragment inside it still lands there, and either one reveals
the region and fires `beforematch`, which the element answers by opening. Same behaviour
`<details>` has natively, on markup `<details>` could not have held.

```html
<!-- while closed -->
<button aria-expanded="false" aria-controls="photo-data">…</button>
<div id="photo-data" class="disclosure-elemental-region" hidden="until-found">…</div>
```

Browsers without `until-found` read it as a plain `hidden` — the same content, just not
found.

> [!NOTE]
> `hidden="until-found"` skips the region's _contents_, not its box, so a padded or
> bordered region would leave an empty strip behind while closed. The element's stylesheet
> zeroes the region's own margin, padding, border and `box-shadow` while hidden, which is
> what the `disclosure-elemental-region` class is for.

`box-shadow` is in that list for a case the others do not have. A closed region is normally
not painted at all, so its shadow is moot — but a region closed by being _moved_ rather than
by being unpainted is a different thing. A drawer sits off-canvas under a `translate`, and a
shadow reaches out of its box by its blur radius, so a panel you cannot see paints a smear
down the edge of the viewport it just left. The same is true for the length of a close on a
panel that defers `content-visibility` with `allow-discrete` so the slide can finish.

Those zeroing rules are ordinary declarations at one class and one attribute, though, so a
selector of equal weight later in the cascade beats them — `.drawer[data-mode="free"]` ties
with `.disclosure-elemental-region[hidden]` and wins on order. If a shadow has to hold in
every case, scope it to the open state rather than relying on the zeroing:

```css
.drawer:not([hidden]) { box-shadow: 0 0 2rem rgb(0 0 0 / 25%); }
```

`[hidden]` is on the region the whole time it is closed, so a shadow declared only for
`:not([hidden])` cannot be painted by a panel that is not there.

## Animation

The region slides. Retime it with two custom properties — the element reads the duration
back out of the computed styles, so the stylesheet stays the single source of truth:

```css
.disclosure-elemental-region {
  --disclosure-elemental-duration: 250ms;
  --disclosure-elemental-easing: ease;
}
```

They default on `:root`, and **the region** is the place to override them — not
`disclosure-elemental`, which a region pointed at by `for` is not inside.

`prefers-reduced-motion: reduce` switches it off, in CSS and in the element. So does a
duration of `0s`, worth reaching for when the region is a table row or anything else a
height transition cannot move.

**The region is the animated box, so do not pad or border it.** Block padding is a floor
the height cannot get under — `box-sizing: border-box` renders `height: 0` as the padding —
so the region would slide shut down to it and then cut. The accordion animates a wrapper of
its own and hands you a box inside it; this element wraps nothing, on purpose, so the inset
goes on a box inside the region:

```html
<figcaption id="bench-caption">
  <div class="caption-body">…</div>
</figcaption>
```

Margin is fine — it is outside the height, and it transitions too, so the gap closes with
the height rather than dropping out from under it. It is zeroed on
`[data-state="closed"]` rather than on `[hidden]`, because `hidden` only lands once the
close slide is over and a margin waiting for it would still be at full size while the
panel went, then take a quarter second of its own afterwards.

Margin _inside_ the region stays inside it: the region is `display: flow-root`, because the
slide measures it under an `overflow: hidden` that makes it a block formatting context, and
a first or last child whose margin collapsed back out at rest would leave the region shorter
than it was measured to be — it would open past its resting height and snap back. The rule
skips `tr`, `td`, `th`, `thead`, `tbody`, `tfoot` and `caption`, where `display` is the
table's structure, and it is one class's worth of specificity, so a `display` of your own
still wins.

## The look

`style.scss` is structure and motion; `theme.scss` is the look and is optional — a
light-DOM element cannot scope a look away from a page that did not ask for one.

It takes the browser's button down to the page's own type and color and leaves it reading
as text: no border, no inset, a medium-weight label, an underline on hover, and a leading
[Octicon chevron](https://primer.style/foundations/icons/chevron-down-16/) masked rather
than painted so it follows a theme switch. It is still a `<button>` — the control toggles
content in the same page — so the role, the Enter/Space handling and the focus ring are
untouched. One property:

| Property                            | Default |
| ----------------------------------- | ------- |
| `--disclosure-elemental-caret-size` | `1em`   |

Turn it in the **Options** tab and copy the rule out of the bottom of the panel — the same
table, with the values live:

<!-- demo disclosure tab="options" style="--code-preview-options-height:364px" -->

```html
<disclosure-elemental>
  <button>What the panel writes</button>
  <p>Whatever you set here goes into a stylesheet, never into the sample.</p>
</disclosure-elemental>
```

Closed, the chevron points at its own label; open, it points down at what it revealed — the
same turn a native `<summary>` marker makes. Pointing _at the label_ is a writing-mode
question rather than a direction, so the quarter turn goes the other way under `:dir(rtl)`.

Your own icon has to be a mask too, for the same reason:

```css
disclosure-elemental > button::before {
  mask-image: url("my-caret.svg"); /* not background-image — see above */
}

/* Or drop it and use your own affordance — the button then has none until you give it one */
disclosure-elemental > button {
  padding-inline-start: 0;

  &::before {
    content: none;
  }
}
```

The theme stops short of a full link look on purpose: no link color, no underline until
hover. GOV.UK's research on their details component found that
["some users avoid clicking the link to show more details, as they think it will take them
away from the page"](https://design-system.service.gov.uk/components/details/), and
[Adrian Roselli's testing](https://adrianroselli.com/2020/05/disclosure-widgets.html) found
a link-styled trigger confusing across every profile. Color is the cue that reads as
navigation, so the caret carries the affordance and the label stays the color of the text
around it.

### A show/hide label

No attribute for it, because it is one CSS rule and two spans:

<disclosure-elemental class="demo-swap">
  <button>
    <span class="show">Show</span><span class="hide">Hide</span> the tasting notes
  </button>
  <div id="tasting-notes">
    <p>Grapefruit pith and wet stone up front, a long saline finish. Drink it
    cold enough that the glass fogs.</p>
  </div>
</disclosure-elemental>
<br>

```css
[aria-expanded="false"] .hide,
[aria-expanded="true"] .show {
  display: none;
}
```

`display: none` on the wrong label takes it out of the accessible name too, so the button
is announced as "Show the tasting notes" or "Hide the tasting notes" and never as both. No
JavaScript, and no label state to get out of step.

## Without JavaScript

The region is not authored `hidden` — it is ordinary, visible markup that the element hides
on upgrade. The stylesheet splits the time before that on `@media (scripting)`:

```css
/* in the element's own stylesheet */
@media (scripting: none) {
  disclosure-elemental:not(:defined) > button {
    display: none;
  }
}

@media (scripting: enabled) {
  disclosure-elemental:not(:defined):not([open]):not([for]):not([data-for]) > button + * {
    display: none;
  }
}
```

Scripting off: the region stays visible, which for a long description is the right way
round — the content is there, and the button that would have hidden it is not offered.
Scripting on: the page paints the closed disclosure from the first frame, so the region
does not show for a moment and fold away while the bundle loads. Only for the sibling
shape — a region `for` names lives under an id the stylesheet cannot know, so that one
still has the moment; author it `hidden` yourself if you would rather trade a
scripting-off reader's access for stillness, since the element takes over from whatever
state it finds.

The line that gate draws is worth knowing: a bundle that never arrives *while scripting
is on* — blocked, 404 — leaves a button that opens nothing in front of a hidden region.
The fallback covers scripting turned off, not every way a script can fail to run.

## Layout

`<disclosure-elemental>` is `display: contents`. It exists for the cases native cannot
reach — a figcaption, a table row, a grid item — and every one of those is a case where an
extra box in the tree is exactly the problem. Dropping it around existing markup changes no
layout at all. Give it `display: block` in your own CSS if you want something to style.

<script src="{{ relativePathPrefix }}dist/elementals/disclosure.js"></script>
