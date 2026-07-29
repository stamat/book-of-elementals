---
layout: poops-docs-theme/docs
title: Disclosure
description: A real button wired to a region it shows and hides — for the places a details element cannot go.
order: 2
---

# `<disclosure-elemental>`

A button that shows and hides a region, per the
[APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

Native `<details>`/`<summary>` is already a disclosure, and where it fits it wins —
[`<accordion-elemental>`](accordion.html) is built on it for exactly that reason.
It fits when the region can live _inside_ the trigger's element. This element is
for when it cannot.

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

_A long description for an image whose `alt` can only carry the gist — the
[APG's image-description example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-image-description/).
Try find-in-page for "Smolensk" with the table closed._

## Usage

Write a `<button>` and the region it controls, and wrap them:

```html
<disclosure-elemental>
  <button>Data table for the chart</button>
  <div id="minard-data">…</div>
</disclosure-elemental>
```

```javascript
import "book-of-elementals/disclosure";
```

```scss
@use "book-of-elementals/disclosure/style.scss";
```

Or drop in the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/disclosure.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/disclosure.min.css"
/>
```

The element registers itself on include and upgrades on connect. Nothing is put
on `window`, there is nothing to instantiate, and there is no initialisation call
to forget. That stylesheet carries structure; the look is a separate, optional
one — see [The look](#the-look).

It writes `aria-expanded` and `aria-controls` onto the button and `hidden` onto
the region, and that is the whole of the ARIA. Nothing is wrapped, nothing is
moved: the region stays exactly where your markup put it.

> [!NOTE]
> The trigger must be a real `<button>` and a direct child of the element. A
> `<div role="button" tabindex="0">` would mean reimplementing Enter, Space and
> the disabled state that the platform hands you; a button nested deeper would be
> ambiguous with the buttons inside the region. Neither is a rule the element has
> to enforce, because in both cases there is simply no trigger and the region
> stays visible.

## Why not just `<details>`?

Because a `<details>` owns its content. The region has to be a descendant of the
element that toggles it, and there are places that is not allowed or not
survivable:

- **A `<figcaption>`.** HTML requires it to be the first or last child of its
  `<figure>`. Put it inside a `<details>` and it is no longer the figure's
  caption — it is a `<figcaption>` in the wrong place, and the association the
  markup existed for is gone.
- **A table row, cell or `<dd>`.** The content model does not admit a `<details>`
  in between, and neither does the layout.
- **A grid or flex item.** Its parent lays it out directly. Wrap it and the
  parent now lays out the wrapper, which is a different grid.
- **A region nowhere near its button.** A navigation drawer, a filter panel, a
  "show more" that opens a region below a whole card grid.

For anything else — a FAQ, a "read more" right on top of its text — use
`<details>`, or [`<accordion-elemental>`](accordion.html) for a set of them. This
element is deliberately not the general answer.

## A region elsewhere

Point `for` at the region's `id` and the element wraps nothing but the button.
The region then lives wherever the markup needs it:

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

The `<figcaption>` is still a child of the `<figure>`, so it is still the
figure's caption. That is the case the element exists for, and it is not
reachable with `<details>` at all.

The region is resolved once, at upgrade, so it has to be in the document by then
— which it is, with the bundle loaded deferred or at the end of the body, as the
rest of the book assumes. Without `for`, the region is the button's next element
sibling.

## Find-in-page

A closed region is hidden with `hidden="until-found"`, not with a bare `hidden`.
That is the platform's own answer to the oldest problem with hiding content:
find-in-page still searches it, a link to a fragment inside it still lands there,
and either one reveals the region and fires `beforematch`, which the element
listens for and answers by opening.

So a search for a word buried in a closed panel finds it, opens the panel and
scrolls to it, with nothing scripted for it — the same behaviour `<details>` has
natively, on markup `<details>` could not have held.

```html
<!-- while closed -->
<button aria-expanded="false" aria-controls="minard-data">…</button>
<div id="minard-data" class="disclosure-elemental-region" hidden="until-found">…</div>
```

In a browser without `until-found` the attribute reads as a plain `hidden` and
the region is simply hidden — the same content, just not found.

> [!NOTE]
> `hidden="until-found"` skips the region's _contents_, not its box, so a padded
> or bordered region would leave an empty strip behind while closed. The
> element's stylesheet zeroes the region's own margin, padding and border while
> it is hidden, which is what the `disclosure-elemental-region` class is for.

## Keyboard

All of it is the button's, which is the point of using one:

| Key                                 | Action                             |
| ----------------------------------- | ---------------------------------- |
| <kbd>Tab</kbd>                      | Move to the button                 |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggle the region                  |

A closed region is out of the tab order and out of the accessibility tree
because `hidden` takes it out of both. There is no `aria-hidden` anywhere, and
no focus to manage.

## State

`open` is the single source of truth and it is reflected, so it works from
markup, from script and from CSS:

```html
<disclosure-elemental open>…</disclosure-elemental>
```

```javascript
const disclosure = document.querySelector("disclosure-elemental");
disclosure.open = true;
disclosure.open; // false once the reader closes it again
```

```css
disclosure-elemental[open] .something {
  /* … */
}
```

Everything that changes it — a click, a script, find-in-page — goes through the
attribute, so there is one place the state can be read and one place it can be
watched.

## Events

`disclosure-toggle` fires on the element whenever the state changes, and bubbles:

```javascript
document
  .querySelector("disclosure-elemental")
  .addEventListener("disclosure-toggle", (e) => {
    console.log(e.detail.region, e.detail.open);
  });
```

| Property        | Value                             |
| --------------- | --------------------------------- |
| `detail.region` | The element being shown or hidden |
| `detail.open`   | Its new state, as a boolean       |

## Attributes

| Attribute | Type    | Default | Description                                                          |
| --------- | ------- | ------- | -------------------------------------------------------------------- |
| `open`    | boolean | `false` | Whether the region is showing. Reflected — it tracks the live state. |
| `for`     | string  | —       | `id` of the region. Defaults to the button's next element sibling.   |

`for` is also read as `data-for`. `open` is not — it is a reflected attribute
rather than configuration, so it has one spelling and the live state is always
readable from it.

## What it writes

| Attribute        | On         | Value                                                |
| ---------------- | ---------- | ---------------------------------------------------- |
| `aria-expanded`  | the button | `true` / `false`                                     |
| `aria-controls`  | the button | The region's `id`, generated if the markup has none  |
| `type`           | the button | `button`, only if the markup did not set a type      |
| `hidden`         | the region | `until-found` while closed, absent while open        |
| `class`          | the region | `disclosure-elemental-region` added, nothing removed |

`type="button"` because a `<button>` in a form submits it unless told otherwise,
and a disclosure that posts the page away on its first click is not a disclosure.

## Without JavaScript

The region is not authored `hidden` — it is ordinary, visible markup, and the
element hides it on upgrade. With scripting off it therefore stays visible, which
for a long description is the right way round: the content is there, and the
button that would have hidden it is not offered.

```css
/* in the element's own stylesheet */
disclosure-elemental:not(:defined) > button {
  display: none;
}
```

The cost is the other way round: on a slow load the region can show for a moment
before the element upgrades and closes it. Author the region `hidden` yourself if
you would rather have that moment than the fallback — the element takes over from
whatever state it finds, and you are trading a scripting-off reader's access to
the content for it.

## The look

The element's own stylesheet styles structure only — a light-DOM element cannot
scope a look away from a page that did not ask for one. The look is a second,
optional stylesheet:

```scss
@use "book-of-elementals/disclosure/style.scss"; // structure
@use "book-of-elementals/disclosure/theme.scss"; // the look, entirely optional
```

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/disclosure.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/disclosure-theme.min.css"
/>
```

It unstyles the browser's button back down to the page's own type and colour,
draws the box in `currentcolor`, and adds an
[Octicon chevron](https://primer.style/foundations/icons/chevron-down-16/) masked
rather than painted, so it follows a theme switch. Two custom properties, the
same two the accordion has:

| Property                              | Default                                             |
| ------------------------------------- | --------------------------------------------------- |
| `--disclosure-elemental-border-color` | `color-mix(in srgb, currentcolor 15%, transparent)` |
| `--disclosure-elemental-radius`       | `0.5rem`                                            |

The chevron is keyed off `[aria-expanded="true"]` rather than a class of the
element's own, because the ARIA _is_ the state — there is no second thing to keep
in step with it, and your own CSS can key off it just as well.

### A show/hide label

There is no attribute for it, because it is one CSS rule and two spans:

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

`display: none` on the wrong label takes it out of the accessible name too, so
the button is announced as "Show the tasting notes" or "Hide the tasting notes"
and never as both. No JavaScript, and no label state for anything to get out of
step with.

## The element's box

`<disclosure-elemental>` is `display: contents`. It exists for the cases native
cannot reach — a figcaption, a table row, a grid item — and every one of those is
a case where an extra box in the tree is exactly the problem. Dropping the element
around existing markup therefore changes no layout at all.

Give it a box in your own CSS if you want something to style:

```css
disclosure-elemental {
  display: block;
}
```

<script src="{{ relativePathPrefix }}dist/elementals/disclosure.js"></script>
