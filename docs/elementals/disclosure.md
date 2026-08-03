---
layout: poops-docs-theme/docs
title: Disclosure
description: A real button wired to a region it shows and hides — for the places a details element cannot go.
order: 2
---

# `<disclosure-elemental>`

A `<button>` wired to a region it shows and hides, per the
[APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/). Light DOM,
no shadow root, nothing wrapped and nothing moved — the region stays where your markup put
it, which is the whole point.

Native `<details>` is a disclosure already, and where it fits it wins —
[`<accordion-elemental>`](accordion.html) is built on it for that reason. It fits when the
region can live _inside_ the trigger's element. This is for [when it cannot](#why-not-just-details).

<figure class="demo-figure">
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120'%3E%3Cpolygon points='12,26 300,54 300,64 12,86' fill='%23c86b4a'/%3E%3Cpolygon points='12,90 300,68 300,72 12,96' fill='%23777'/%3E%3Cpolyline points='12,112 84,110 156,106 228,102 300,100' fill='none' stroke='%23999' stroke-width='2'/%3E%3C/svg%3E" alt="A tapering band showing an army shrinking from 442,000 to 100,000 men on the advance and to 10,000 on the retreat, over a line of falling temperatures.">
  <disclosure-elemental>
    <button>Data table for the chart</button>
    <div id="minard-data">
      <table>
        <caption>Napoleon's 1812 Russian campaign, after Minard</caption>
        <thead>
          <tr><th scope="col">Location</th><th scope="col">Date</th><th scope="col">Men</th><th scope="col">Direction</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Kowno</th><td>24 June</td><td>442,000</td><td>Advance</td></tr>
          <tr><th scope="row">Smolensk</th><td>16 August</td><td>145,000</td><td>Advance</td></tr>
          <tr><th scope="row">Moscow</th><td>14 September</td><td>100,000</td><td>Advance</td></tr>
          <tr><th scope="row">Smolensk</th><td>14 November</td><td>37,000</td><td>Retreat</td></tr>
          <tr><th scope="row">Kowno</th><td>7 December</td><td>10,000</td><td>Retreat</td></tr>
        </tbody>
      </table>
    </div>
  </disclosure-elemental>
</figure>
<br>

_A long description for an image whose `alt` can only carry the gist. Try find-in-page for
"Smolensk" with the table closed._

## Usage

Write a `<button>` and the region it controls, and wrap them — edit the sample and the
preview above it follows as you type:

<!-- demo disclosure -->

```html
<disclosure-elemental>
  <button>Data table for the chart</button>
  <div id="minard-data">Six columns of numbers.</div>
</disclosure-elemental>
```

```javascript
import "book-of-elementals/disclosure";
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
| `media`   | string  | —       | A media query that owns `open`: held open while it matches, closed when it stops. |

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
const disclosure = document.querySelector("disclosure-elemental");
disclosure.open = true; // slides, and fires disclosure-toggle
```

Everything that changes it — a click, a script, find-in-page — goes through the attribute,
so there is one place to read the state and one place to watch it.

### Events

`disclosure-toggle` fires on the element on every state change, and bubbles. It fires with
the state change, not with the slide:

```javascript
document.querySelector("disclosure-elemental")
  .addEventListener("disclosure-toggle", (e) => {
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
| `class`         | the region | `disclosure-elemental-region` added, nothing removed                              |
| `data-mode`     | both       | `pinned` / `free`, only while `media` is set — see [A breakpoint that owns it](#a-breakpoint-that-owns-it) |

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
disclosure-elemental:not(:defined) { }               /* before upgrade */
```

`[aria-expanded="false"]` already means "closing or closed" — the ARIA and `open` both flip
at the click, so there is no closing class to pair with, the way the accordion needs one.

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
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120'%3E%3Ccircle cx='60' cy='60' r='34' fill='%236aa84f'/%3E%3Crect x='120' y='26' width='68' height='68' fill='%23c86b4a'/%3E%3Cpolygon points='250,26 288,94 212,94' fill='%23777'/%3E%3C/svg%3E" alt="Three shapes in a row: a green circle, an orange square and a grey triangle.">
  <disclosure-elemental for="shapes-caption">
    <button>Describe this image</button>
  </disclosure-elemental>
  <figcaption id="shapes-caption">
    <p>The circle is drawn first, at a third of the frame's width, in the green
    of the sequential palette's low end. The square that follows is the same
    visual weight in the palette's warm mid-tone, and the triangle closing the
    row is neutral grey. Spacing between the three is even, so the row reads as
    one series rather than as a pair with an outlier.</p>
  </figcaption>
</figure>
<br>

```html
<figure>
  <img src="…" alt="Three shapes in a row: …" />
  <disclosure-elemental for="shapes-caption">
    <button>Describe this image</button>
  </disclosure-elemental>
  <figcaption id="shapes-caption">…</figcaption>
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
the viewport rather than to the reader, and `media` is how you say so:

```html
<disclosure-elemental for="sidebar" media="(min-width: 60rem)">
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
anyway. `media` is that script, once, in the element that already owns the state.

> [!NOTE]
> The query owns the state at each _change_, not every moment in between. Within one side
> of a breakpoint the button still toggles normally, which is what you want for a drawer
> that opens and shuts all day — and crossing the breakpoint resets it, so a drawer left
> open never survives into a layout that has no drawer. If the button would be meaningless
> on the matching side, hide it there in your CSS: the element writes state, not layout.

Crossing lands instantly rather than sliding. A breakpoint change is the page being
rearranged around the reader, and animating the region through a window drag would be
animating something nobody asked for.

### The mode is on both ends

Setting `media` also puts `data-mode` on the element **and on the region** — `pinned` while
the query matches, `free` while it does not, and nothing at all on an element with no
`media`:

```html
<disclosure-elemental for="sidebar" media="(min-width: 60rem)" data-mode="free">…</disclosure-elemental>

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

## Find-in-page

A closed region is hidden with `hidden="until-found"`, not a bare `hidden`. Find-in-page
still searches it, a link to a fragment inside it still lands there, and either one reveals
the region and fires `beforematch`, which the element answers by opening. Same behaviour
`<details>` has natively, on markup `<details>` could not have held.

```html
<!-- while closed -->
<button aria-expanded="false" aria-controls="minard-data">…</button>
<div id="minard-data" class="disclosure-elemental-region" hidden="until-found">…</div>
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
<figcaption id="shapes-caption">
  <div class="caption-body">…</div>
</figcaption>
```

Margin is fine — it is outside the height, and it transitions too, so zeroing it while
closed reads as the gap closing rather than as a jump.

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

<!-- demo disclosure tab="options" -->

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
on upgrade. With scripting off it stays visible, which for a long description is the right
way round: the content is there, and the button that would have hidden it is not offered.

```css
/* in the element's own stylesheet */
disclosure-elemental:not(:defined) > button {
  display: none;
}
```

The cost runs the other way: on a slow load the region can show for a moment before the
element upgrades and closes it. Author the region `hidden` yourself if you would rather
have that moment than the fallback — the element takes over from whatever state it finds,
and you are trading a scripting-off reader's access to the content for it.

## Layout

`<disclosure-elemental>` is `display: contents`. It exists for the cases native cannot
reach — a figcaption, a table row, a grid item — and every one of those is a case where an
extra box in the tree is exactly the problem. Dropping it around existing markup changes no
layout at all. Give it `display: block` in your own CSS if you want something to style.

<script src="{{ relativePathPrefix }}dist/elementals/disclosure.js"></script>
