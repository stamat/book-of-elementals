---
layout: poops-docs-theme/docs
title: Accordion
description: A thin coordinator over native details/summary — exclusive panels, arrow-key navigation and deep links.
order: 1
---

# `<accordion-elemental>`

A set of disclosure panels. It wraps native `<details>`/`<summary>` rather than
reimplementing the [APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
on `<div>`s, so the browser keeps the semantics and the element adds only what the browser
leaves out: exclusivity, arrow keys, deep links, a bubbling event and a slide.

<accordion-elemental exclusive class="grouped caret">
  <details open>
    <summary>Why build on <code>&lt;details&gt;</code>?</summary>
    <p>Because it is already an accordion. It announces expanded state to screen
    readers, activates on Enter and Space, opens itself for find-in-page, and
    with a shared <code>name</code> it makes panels mutually exclusive without a
    line of JavaScript.</p>
  </details>
  <details>
    <summary>So what does the element actually do?</summary>
    <p>Five things: assigns the shared <code>name</code> for exclusive mode,
    adds arrow-key navigation between headers, opens the panel a URL fragment
    points at, re-emits panel toggles as one bubbling event on the group, and
    slides the panels open and shut.</p>
  </details>
  <details>
    <summary>Does it need JavaScript to work?</summary>
    <p>No. With scripting off you still have a working, accessible set of
    disclosure widgets — you lose the arrow keys, the deep links and the slide,
    not the content.</p>
  </details>
</accordion-elemental>
<br>

_Live, with `exclusive` and both theme classes. Focus a header and press the arrow keys._

## Usage

Write ordinary `<details>` panels and wrap them — edit the sample and the preview above it
follows as you type:

<!-- demo accordion -->

```html
<accordion-elemental>
  <details>
    <summary>First question</summary>
    <p>First answer.</p>
  </details>
  <details>
    <summary>Second question</summary>
    <p>Second answer.</p>
  </details>
</accordion-elemental>
```

```javascript
import "book-of-elementals/accordion";
```

```scss
@use "book-of-elementals/accordion/style.scss"; // structure and motion
@use "book-of-elementals/accordion/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css" />
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/accordion-theme.min.css" />
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

> [!NOTE]
> Put a heading inside the `<summary>` — `<summary><h3>Question</h3></summary>` — when the
> panels are page sections. Screen reader users navigate by heading, and that is the one
> thing bare `<summary>` does not give them. It stays a valid native disclosure either way.

## API

### Attributes

| Attribute   | Type    | Default | Description                                                |
| ----------- | ------- | ------- | ---------------------------------------------------------- |
| `exclusive` | boolean | `false` | Only one panel open at a time.                             |
| `name`      | string  | auto    | The shared `name` `exclusive` assigns. Generated if unset. |

Read bare, as `data-*`, or in kebab-case.

### Properties and methods

| Member              | Type              | Description                                          |
| ------------------- | ----------------- | ---------------------------------------------------- |
| `panels`            | `HTMLDetailsElement[]` | Read-only. Direct-child `<details>`, in order.  |
| `headers`           | `HTMLElement[]`   | Read-only. Their `<summary>` elements.               |
| `openPanel(panel)`  | —                 | Opens it with the slide, closing a sibling if `exclusive`. |
| `closePanel(panel)` | —                 | Slides it shut, then closes it.                      |

Setting `panel.open` directly works too — it just skips the animation.

### Events

`toggle` fires on a `<details>` and does not bubble, which makes a whole group awkward to
listen to. The element re-emits it on the group, bubbling:

```javascript
document.querySelector("accordion-elemental")
  .addEventListener("accordion-toggle", (e) => {
    console.log(e.detail.panel, e.detail.open);
  });
```

| Property       | Value                            |
| -------------- | -------------------------------- |
| `detail.panel` | The `<details>` that toggled     |
| `detail.open`  | Its new open state, as a boolean |

It fires when the panel actually closes — at the end of the slide, not at the click.

### Keyboard

Enter, Space and Tab are native. The rest is the APG's recommended header navigation,
which the element adds:

| Key                                 | Action                                 |
| ----------------------------------- | -------------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggle the focused panel               |
| <kbd>Tab</kbd>                      | Move through headers and panel content |
| <kbd>Down</kbd> / <kbd>Up</kbd>     | Focus the next / previous header, wrapping |
| <kbd>Home</kbd> / <kbd>End</kbd>    | Focus the first / last header          |

### Styling hooks

| Hook                                   | On                | Meaning                                                         |
| -------------------------------------- | ----------------- | --------------------------------------------------------------- |
| `.accordion-elemental-content-wrapper` | the outer box     | The box the height animation measures and clips. Do not pad it. |
| `.accordion-elemental-content`         | the box inside it | The panel body. Yours to style — the inset goes here.           |
| `.accordion-elemental-closing`         | a `<details>`     | Open, but sliding shut.                                          |

```css
/* not "is open" but "is staying open" */
accordion-elemental > details[open]:not(.accordion-elemental-closing) > summary::after {
  rotate: 180deg;
}
```

## Exclusive panels

`exclusive` gives every panel the same `name`, which is what makes native `<details>`
mutually exclusive — including for anything the element does not see, like a panel opened
from script. On a click the element closes the open sibling itself instead, so it slides
shut rather than vanishing.

```html
<accordion-elemental exclusive>
  <details open>…</details>
  <details>…</details>
</accordion-elemental>
```

If several panels are authored `open`, the first wins and the rest close on upgrade.

Without `exclusive` the panels are independent — open as many as you like:

<accordion-elemental class="grouped caret">
  <details open>
    <summary>Open me</summary>
    <p>Nothing else closes. Without <code>exclusive</code> the element assigns no
    shared <code>name</code>, so each panel is an ordinary
    <code>&lt;details&gt;</code> answering only to its own summary.</p>
  </details>
  <details>
    <summary>And me</summary>
    <p>Two open at once. Useful when the panels are reference material a reader
    wants side by side rather than a set of alternatives.</p>
  </details>
</accordion-elemental>
<br>

Assigning the `name` is the one part of exclusivity that needs the script. Write the
shared `name` on the panels yourself and the browser enforces it with none — the element
picks that name up rather than minting its own. A `name` on the group does the same across
two separate groups, or keeps it stable across renders:

```html
<accordion-elemental exclusive name="faq">…</accordion-elemental>

<accordion-elemental exclusive>
  <details name="faq" open>…</details>
  <details name="faq">…</details>
</accordion-elemental>
```

## Deep links

A link to `#some-id` inside a panel opens that panel, and any panels around it when they
are nested. Runs on load and on `hashchange`, instantly rather than animated — a deep link
should arrive at the content, not at a panel still on its way open.

```html
<details>
  <summary id="shipping">How long does shipping take?</summary>
  <p>…</p>
</details>
```

An `id` on the `<summary>` rather than the panel gives every answer its own URL, so a
support link lands the reader on one answer instead of a wall of closed questions.

## Animation

Panels slide. Retime with two custom properties — the element reads the duration back out
of the computed styles, so the stylesheet stays the single source of truth:

```css
accordion-elemental {
  --accordion-elemental-duration: 250ms;
  --accordion-elemental-easing: ease;
}
```

`prefers-reduced-motion: reduce` switches it off, in CSS and in the element. With
JavaScript off there is no wrapper, the transition rule matches nothing, and the panels
toggle natively and instantly.

Two things make this awkward, and both are why the markup gains boxes:

- **`<details>` gives you no box to animate.** The body is a bare run of siblings after the
  `<summary>`. On upgrade the element wraps it in two — the outer one is measured and
  clipped, the inner one is yours, because **the animated box cannot be padded**:
  `box-sizing: border-box` renders `height: 0` as the padding, so a padded box slides shut
  down to it and then cuts.

  ```html
  <div class="accordion-elemental-content-wrapper">
    <div class="accordion-elemental-content">…</div>
  </div>
  ```

  ```css
  accordion-elemental > details > .accordion-elemental-content-wrapper > .accordion-elemental-content {
    padding: 0.75rem 1rem;
  }
  ```

- **Closing hides the content instantly.** `<details>` sets its contents to `display: none`
  the moment `open` goes away, cutting a close off at frame one. So the element takes over
  the click, slides the body up while the panel is still open, and closes it after. For the
  length of that slide the panel is still `[open]`, which is what
  `.accordion-elemental-closing` is for.

## The look

`style.scss` is structure and motion; `theme.scss` is the look and is optional — a
light-DOM element cannot scope a look away from a page that did not ask for one.

It draws in `currentcolor` — borders and the hover fill mixed out of the text color, the
caret masked rather than painted — so the panels land in the page's palette and follow a
theme switch with nothing configured. Two properties, for the two things a page usually
has its own value for:

| Property                             | Default                                             |
| ------------------------------------ | --------------------------------------------------- |
| `--accordion-elemental-border-color` | `color-mix(in srgb, currentcolor 15%, transparent)` |
| `--accordion-elemental-radius`       | `0.5rem`                                            |

Turn them in the **Options** tab and copy the rule out of the bottom of the panel — the same
table, with the values live:

<!-- demo accordion tab="options" -->

```html
<accordion-elemental class="grouped">
  <details open>
    <summary>Both properties are on this one</summary>
    <p>The rule the panel writes is the rule you would have written.</p>
  </details>
  <details>
    <summary>And the border between us</summary>
    <p>Set on the element, never on <code>:root</code>.</p>
  </details>
</accordion-elemental>
```

```css
accordion-elemental {
  --accordion-elemental-border-color: var(--border);
  --accordion-elemental-radius: var(--radius);
}
```

That is the whole of this site's accordion CSS — the demos wear the shipped theme, so what
you see is what the import gives you.

### Plain

No class: each panel its own bordered box, native disclosure marker.

<accordion-elemental>
  <details open>
    <summary>Panels stand apart</summary>
    <p>A stack of separate boxes. Nothing shared between neighbours, so a panel
    can be moved, removed or rendered on its own without the run around it
    needing to know.</p>
  </details>
  <details>
    <summary>The marker is the browser's</summary>
    <p>Leading edge, and whatever shape the browser draws. Free, familiar, and
    not yours to design.</p>
  </details>
</accordion-elemental>
<br>

### Grouped

`class="grouped"` — one card instead of a stack. Neighbours overlap by a pixel so the seam
is one line, and the rounding goes on the outer corners of the run rather than on a
clipping wrapper: `overflow: hidden` would cut the focus ring off the summary inside,
which is the one thing on the element a keyboard user has to see.

<accordion-elemental class="grouped">
  <details open>
    <summary>Panels share their borders</summary>
    <p>Neighbours overlap by a pixel so the seam between two panels is one line
    rather than two.</p>
  </details>
  <details>
    <summary>The focused panel lifts</summary>
    <p>Overlapping borders mean the next panel paints over the focused one's
    outline, so the focused panel is raised instead of anything being clipped.
    Tab through this group and the ring stays whole.</p>
  </details>
</accordion-elemental>
<br>

### Caret

`class="caret"` — an [Octicon chevron](https://primer.style/foundations/icons/chevron-down-16/)
on the trailing edge instead of the native marker, turned over on open. Composes with
`grouped`; the demo at the top wears both.

<accordion-elemental class="caret">
  <details open>
    <summary>Where does the caret come from?</summary>
    <p>A <code>::after</code> on the summary, masked with an inline SVG. No
    markup change — the panels are the same <code>&lt;details&gt;</code> as
    everywhere else on this page.</p>
  </details>
  <details>
    <summary>Why a mask and not a background image?</summary>
    <p>A mask paints with <code>currentcolor</code>, so the caret takes the
    header's color and follows a theme switch. A background image bakes its
    color into the SVG and needs a second copy for the dark theme.</p>
  </details>
  <details>
    <summary>Why half a turn and not a quarter?</summary>
    <p>This caret is parked at the far trailing edge with the header all the way
    at the other end, so there is nothing beside it to point at: it points down
    at the panel it opens and turns over. <code>rotate: 180deg</code> also reads
    the same either way round in RTL. A caret that <em>leads</em> its label is
    next to the thing it can point at, which is the quarter turn
    <a href="disclosure.html"><code>&lt;disclosure-elemental&gt;</code></a>
    takes.</p>
  </details>
</accordion-elemental>
<br>

Your own icon has to be a mask too, for the same reason:

```css
accordion-elemental.caret > details > summary::after {
  mask-image: url("my-caret.svg"); /* not background-image — see above */
}
```

The caret turns with the slide rather than after it, timed off the same two properties and
keyed on `details[open]:not(.accordion-elemental-closing)` so a close starts turning it
back on the first frame.

## Building an FAQ

The pieces above, and the four decisions worth copying:

```html
<accordion-elemental class="grouped caret">
  <details>
    <summary id="faq-shipping"><h3>How long does shipping take?</h3></summary>
    <p>Two to five working days inside the EU…</p>
  </details>
  <details>
    <summary id="faq-returns"><h3>Can I return an order?</h3></summary>
    <p>Within 30 days, unopened, for a full refund.</p>
  </details>
</accordion-elemental>
```

- **A heading in each `<summary>`** — an FAQ is a run of page sections, and heading
  navigation is how a screen reader user skims one. `<h3>` follows the page's outline, not
  the component.
- **An `id` on each `<summary>`, not on the panel** — every answer gets its own URL, and
  the element opens what a fragment points at.
- **No `exclusive`** — a reader comparing two answers wants both. Exclusive is for
  alternatives, not for reference material.
- **`grouped` rather than a clipping wrapper** — the focus ring survives.

Everything else is the browser's: expanded state announced, Enter and Space handled,
find-in-page opening a closed panel to show a match. There is not one `aria-` attribute in
that markup, and that is the point.

<script src="{{ relativePathPrefix }}dist/elementals/accordion.js"></script>
