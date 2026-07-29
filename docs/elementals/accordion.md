---
layout: poops-docs-theme/docs
title: Accordion
description: A thin coordinator over native details/summary — exclusive panels, arrow-key navigation and deep links.
order: 1
---

# `<accordion-elemental>`

A set of disclosure panels, for FAQs and anything else that folds. It wraps
native `<details>`/`<summary>` rather than reimplementing the
[APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) on
top of `<div>`s — the browser already ships the disclosure semantics, so the
element only adds what the browser leaves out.

<accordion-elemental exclusive class="grouped caret">
  <details open>
    <summary>Why build on <code>&lt;details&gt;</code>?</summary>
    <p>Because it is already an accordion. It announces expanded state to screen
    readers, activates on Enter and Space, opens itself for find-in-page, and
    with a shared <code>name</code> it makes panels mutually exclusive without a
    line of JavaScript. Reimplementing that with <code>aria-expanded</code> and
    <code>role="region"</code> means writing — and getting right — behaviour you
    were handed for free.</p>
  </details>
  <details>
    <summary>So what does the element actually do?</summary>
    <p>Four things: assigns the shared <code>name</code> for exclusive mode,
    adds arrow-key navigation between headers, opens the panel a URL fragment
    points at, and re-emits panel toggles as one bubbling event on the group.</p>
  </details>
  <details>
    <summary>Does it need JavaScript to work?</summary>
    <p>No. With scripting off you still have a working, accessible set of
    disclosure widgets — you lose the arrow-key shortcuts and deep linking, not
    the content.</p>
  </details>
</accordion-elemental>
<br>

_A live `<accordion-elemental exclusive class="grouped caret">` — one card, a
caret on the trailing edge, one panel open at a time. Both classes come from the
optional theme in [The look](#the-look). Focus a header and press the arrow
keys._

## Usage

Write the panels as ordinary `<details>` elements and wrap them:

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
@use "book-of-elementals/accordion/style.scss";
```

Or drop in the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css"
/>
```

Either way the element registers itself on include and upgrades on connect.
Nothing is put on `window`, there is nothing to instantiate, and there is no
initialisation call to forget. That stylesheet carries structure and motion; the
look is a separate, optional one — see [The look](#the-look).

> [!NOTE]
> Put a heading inside the `<summary>` — `<summary><h3>Question</h3></summary>` —
> when the panels are page sections. Screen reader users navigate by heading, and
> that is the one thing bare `<summary>` does not give them. It stays a valid,
> fully native disclosure either way.

## Exclusive panels

Add `exclusive` and only one panel stays open at a time. The element assigns a
shared `name` to every panel, which is what makes native `<details>` mutually
exclusive, and that name is what keeps the group exclusive for anything the
element does not see — a panel opened from script, say. On a click the element
closes the open sibling itself instead, so it slides shut rather than vanishing.

```html
<accordion-elemental exclusive>
  <details open>
    <summary>Open by default</summary>
    <p>…</p>
  </details>
  <details>
    <summary>Closes the other one</summary>
    <p>…</p>
  </details>
</accordion-elemental>
```

If several panels are authored `open` in an exclusive group, the first one wins
and the rest are closed on upgrade.

Leave `exclusive` off and the panels are independent — open as many as you like,
and each one keeps whatever state the reader left it in:

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

Set your own `name` on the group to share exclusivity across two separate
groups, or to keep it stable across renders:

```html
<accordion-elemental exclusive name="faq"></accordion-elemental>
```

Assigning the `name` is the one part of exclusivity that needs the script, so
with scripting off the panels open independently. Write the shared `name` on the
panels yourself and the browser enforces it with no script at all — the element
picks that name up rather than minting its own:

```html
<accordion-elemental exclusive>
  <details name="faq" open>…</details>
  <details name="faq">…</details>
</accordion-elemental>
```

## Keyboard

Enter, Space and Tab are native `<details>` behaviour. The rest is the APG
accordion's recommended header navigation, which the element adds:

| Key                                 | Action                                 |
| ----------------------------------- | -------------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggle the focused panel               |
| <kbd>Tab</kbd>                      | Move through headers and panel content |
| <kbd>Down</kbd>                     | Focus the next header, wrapping        |
| <kbd>Up</kbd>                       | Focus the previous header, wrapping    |
| <kbd>Home</kbd> / <kbd>End</kbd>    | Focus the first / last header          |

## Deep links

A link to `#some-id` inside a panel opens that panel, including any panels
around it when they are nested. It runs on load and on `hashchange`, so
sharing a link to a single FAQ answer lands the reader on it, opened.

```html
<accordion-elemental>
  <details>
    <summary id="shipping">How long does shipping take?</summary>
    <p>…</p>
  </details>
</accordion-elemental>
```

## Events

`toggle` fires on the individual `<details>` and does not bubble, which makes it
awkward to listen for a whole group. The element re-emits it as a bubbling
`accordion-toggle` on the group:

```javascript
document
  .querySelector("accordion-elemental")
  .addEventListener("accordion-toggle", (e) => {
    console.log(e.detail.panel, e.detail.open);
  });
```

| Property       | Value                            |
| -------------- | -------------------------------- |
| `detail.panel` | The `<details>` that toggled     |
| `detail.open`  | Its new open state, as a boolean |

## Attributes

| Attribute   | Type    | Default | Description                                                |
| ----------- | ------- | ------- | ---------------------------------------------------------- |
| `exclusive` | boolean | `false` | Only one panel open at a time.                             |
| `name`      | string  | auto    | The shared `name` used by `exclusive`. Generated if unset. |

Attributes are read bare, as `data-*`, or in kebab-case.

## Animation

Panels slide open and closed. Retime it with two custom properties — the element
reads the duration back out of the computed styles to time itself, so the
stylesheet stays the single source of truth:

```css
accordion-elemental {
  --accordion-elemental-duration: 250ms;
  --accordion-elemental-easing: ease;
}
```

`prefers-reduced-motion: reduce` switches it off, in CSS and in the element.

Two things make this awkward, and the element handles both:

- **`<details>` gives you no box to animate.** The panel body is a bare run of
  siblings after the `<summary>`, and a height transition needs one box to measure
  and clip. On upgrade the element wraps that run in two:

  ```html
  <div class="accordion-elemental-content-wrapper">
    <div class="accordion-elemental-content">…</div>
  </div>
  ```

  Style around them, or through them — descendant selectors are unaffected,
  direct-child ones are not. Two boxes rather than one because **the animated box
  cannot be padded**: block padding is a floor the height cannot get under, since
  `box-sizing: border-box` renders `height: 0` as the padding, so the panel would
  slide shut down to it and then cut. The outer box is the library's and stays
  inert. Pad the inner one, and drop the outermost margins inside it so the page's
  rhythm does not stack on top of that padding:

  ```css
  accordion-elemental
    > details
    > .accordion-elemental-content-wrapper
    > .accordion-elemental-content {
    padding: 0.75rem 1rem;
  }
  ```

- **Closing hides the content instantly.** `<details>` sets its contents to
  `display: none` the moment `open` goes away, which cuts a close animation off at
  frame one. So the element takes over the click, slides the body up while the
  panel is still open, and only then closes it. `accordion-toggle` fires when the
  panel actually closes, at the end of the slide.
- **A closing panel still reads as open.** For the length of the slide the panel
  has `open` on it while heading the other way, so `[open]` on its own would hold
  any open/closed styling until the animation had finished. The element marks that
  window with `class="accordion-elemental-closing"` on the panel; pair it as
  `details[open]:not(.accordion-elemental-closing)` and the styling turns on the
  first frame of the close instead of the last.

```css
/* not "is open" but "is staying open" */
accordion-elemental
  > details[open]:not(.accordion-elemental-closing)
  > summary::after {
  rotate: 180deg;
}
```

With JavaScript off there is no wrapper, the transition rule matches nothing, and
the panels toggle natively and instantly. Which is correct, just unanimated.

| Hook                                   | On                | Meaning                                                        |
| -------------------------------------- | ----------------- | -------------------------------------------------------------- |
| `.accordion-elemental-content-wrapper` | the outer box     | The box the height animation measures and clips. Do not pad it |
| `.accordion-elemental-content`         | the box inside it | The panel body. Yours to style — the inset goes here           |
| `.accordion-elemental-closing`         | a `<details>`     | Open, but sliding shut                                         |

## The look

The element's own stylesheet styles structure and motion only — a light-DOM
element cannot scope a look away from a page that did not ask for one. The look
is a second, optional stylesheet:

```scss
@use "book-of-elementals/accordion/style.scss"; // structure and motion
@use "book-of-elementals/accordion/theme.scss"; // the look, entirely optional
```

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion-theme.min.css"
/>
```

It draws in `currentcolor` — borders and the hover fill are mixed out of the
text color, the caret is masked rather than painted — so the panels land in the
page's palette and follow a theme switch with nothing configured. Two custom
properties for the two things a page usually has its own value for:

| Property                             | Default                                             |
| ------------------------------------ | --------------------------------------------------- |
| `--accordion-elemental-border-color` | `color-mix(in srgb, currentcolor 15%, transparent)` |
| `--accordion-elemental-radius`       | `0.5rem`                                            |

```css
accordion-elemental {
  --accordion-elemental-border-color: var(--border);
  --accordion-elemental-radius: var(--radius);
}
```

That is the whole of the docs site's accordion CSS — the demos on this page wear
the shipped theme rather than a skin of their own, so what you see here is what
the import gives you.

Everything past that is ordinary CSS on ordinary selectors. Skip the theme and
write your own; the element looks for none of it.

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

`class="grouped"` — one card instead of a stack. The rounding moves to the outer
corners of the run rather than a clipping wrapper: `overflow: hidden` on a
rounded wrapper is the usual way to do it, and it cuts the focus ring off the
summary inside, which is the one thing on the element a keyboard user needs to
see.

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

`class="caret"` — an
[Octicon chevron](https://primer.style/foundations/icons/chevron-down-16/) on the
trailing edge instead of the native marker, turned over when the panel opens.
Composes with `grouped`, and the demo at the top of this page is wearing both.

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
    <p><code>rotate: 180deg</code> reads the same in RTL. A quarter turn on a
    chevron pointing down points it into the margin.</p>
  </details>
</accordion-elemental>
<br>

The caret turns with the slide rather than after it, in both directions. The
rotation is timed off the same `--accordion-elemental-duration` and
`--accordion-elemental-easing`, so retiming the animation retimes the caret, and
it is keyed on `details[open]:not(.accordion-elemental-closing)` so the close
starts turning it back on the same frame the panel starts sliding shut — the
panel keeps `open` until the slide ends, and `[open]` alone would wait for it.

## A complete FAQ

The pieces on this page, assembled into the thing they are usually for. Nothing
here is configuration — it is ordinary markup, and the only line of CSS involved
is the theme import.

<accordion-elemental class="grouped caret">
  <details>
    <summary id="faq-shipping"><h3>How long does shipping take?</h3></summary>
    <p>Two to five working days inside the EU, five to ten elsewhere. You get a
    tracking link the moment the parcel is scanned.</p>
    <p><a href="#faq-shipping">Link to this answer</a> — the fragment opens the
    panel, on load and on <code>hashchange</code>.</p>
  </details>
  <details>
    <summary id="faq-returns"><h3>Can I return an order?</h3></summary>
    <p>Within 30 days, unopened, for a full refund. A link in a closed panel is
    out of the tab order and out of the accessibility tree because
    <code>&lt;details&gt;</code> hides its own contents — which is why this
    pattern needs no <code>aria-hidden</code> anywhere.</p>
  </details>
  <details>
    <summary id="faq-keyboard"><h3>Do I need a mouse for this?</h3></summary>
    <p>No. <kbd>Tab</kbd> reaches the questions and the content of an open
    answer, <kbd>Enter</kbd> and <kbd>Space</kbd> toggle, and the arrow keys
    move between questions.</p>
  </details>
  <details>
    <summary id="faq-js"><h3>What if JavaScript fails to load?</h3></summary>
    <p>You are left with four working, accessible disclosure widgets. The arrow
    keys, the deep links and the slide are gone; the questions and the answers
    are not.</p>
  </details>
</accordion-elemental>
<br>

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

Four decisions in that markup, and the reasons they went the way they did:

- **A heading in each `<summary>`.** An FAQ is a run of page sections, and
  heading navigation is how a screen reader user skims one. `<h3>` because the
  section it sits under is an `<h2>` — the level follows the page's outline, not
  the component. The theme keeps the heading's type inherited so it styles as
  nothing, which is what a heading inside an already-styled header row should do.
- **An `id` on each `<summary>`, not on the panel.** It gives every answer its
  own URL, and the element opens the panel a fragment points at. Support links
  and search results can then land a reader on one answer rather than on a wall
  of closed questions.
- **No `exclusive`.** A reader comparing the shipping answer with the returns
  answer wants both open; an exclusive group shuts the one they were reading. Use
  exclusive when the panels are alternatives, not when they are reference
  material.
- **`grouped` rather than a clipping wrapper.** The one card look is drawn with
  overlapping borders, so the focus ring on a summary is never cut off — the one
  thing on the element a keyboard user has to be able to see.

Everything else is the browser's: expanded state announced, Enter and Space
handled, find-in-page opening a closed panel to show a match. There is not one
`aria-` attribute in the markup, and that is the point.

<script src="{{ relativePathPrefix }}dist/elementals/accordion.js"></script>
