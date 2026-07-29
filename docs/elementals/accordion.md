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

<accordion-elemental exclusive class="grouped">
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

_A live `<accordion-elemental exclusive class="grouped">`. Focus a header and press the arrow keys._

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
initialisation call to forget.

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
  and clip. On upgrade the element wraps that run in
  `<div class="accordion-elemental-content">`. Style around it, or through it —
  descendant selectors are unaffected, direct-child ones are not.
- **Closing hides the content instantly.** `<details>` sets its contents to
  `display: none` the moment `open` goes away, which cuts a close animation off at
  frame one. So the element takes over the click, slides the body up while the
  panel is still open, and only then closes it. `accordion-toggle` fires when the
  panel actually closes, at the end of the slide.

With JavaScript off there is no wrapper, the transition rule matches nothing, and
the panels toggle natively and instantly. Which is correct, just unanimated.

## Styling

No shadow DOM, so style the elements directly. The library styles structure and
motion only; the look is yours:

```css
accordion-elemental > details + details {
  border-top: 1px solid #e3e6ea;
}

accordion-elemental > details > summary {
  padding: 0.75rem 1rem;
  cursor: pointer;
}
```

To make a stack of panels read as one card, round the outer corners of the run
rather than clipping the group. `overflow: hidden` on a rounded wrapper is the
usual way to do it and it cuts the focus ring off the summary inside, which is
the one thing on the element a keyboard user needs to see:

```css
accordion-elemental.grouped > details {
  border-radius: 0;
}

accordion-elemental.grouped > details:first-of-type {
  border-start-start-radius: 0.5rem;
  border-start-end-radius: 0.5rem;
}

accordion-elemental.grouped > details:last-of-type {
  border-end-start-radius: 0.5rem;
  border-end-end-radius: 0.5rem;
}
```

The class is the docs skin's, not the library's — nothing in the element looks
for it. The demo at the top of this page is wearing it.

### A caret instead of the marker

The native disclosure marker sits on the leading edge and looks like whatever the
browser feels like. Swap it for an
[Octicon chevron](https://primer.style/foundations/icons/chevron-down-16/) on the
trailing edge, turned over when the panel opens:

<accordion-elemental class="grouped caret">
  <details open>
    <summary>Where does the caret come from?</summary>
    <p>A <code>::after</code> on the summary, masked with an inline SVG. No
    markup change — the panels are the same <code>&lt;details&gt;</code> as
    everywhere else on this page.</p>
  </details>
  <details>
    <summary>Why a mask and not a background image?</summary>
    <p>A mask paints with <code>currentcolor</code>, so the caret takes the
    header's colour and follows a theme switch. A background image bakes its
    colour into the SVG and needs a second copy for the dark theme.</p>
  </details>
  <details>
    <summary>What times the turn?</summary>
    <p>The element's own <code>--accordion-elemental-duration</code> and
    <code>--accordion-elemental-easing</code>, so the caret turns with the slide
    instead of alongside it.</p>
  </details>
</accordion-elemental>
<br>

```css
/* The marker goes: list-style covers every browser but Safari, which wants it
   said in its own words. */
accordion-elemental.caret > details > summary {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  list-style: none;
}

accordion-elemental.caret > details > summary::-webkit-details-marker {
  display: none;
}

accordion-elemental.caret > details > summary::after {
  content: "";
  flex: none; /* a long header must not squeeze the caret */
  width: 1rem;
  height: 1rem;
  margin-inline-start: auto; /* trailing edge, and still trailing in RTL */
  background: currentcolor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L8 8.94l3.72-3.72a.749.749 0 0 1 1.06 0Z'/%3E%3C/svg%3E")
    center / contain no-repeat;
  transition: rotate var(--accordion-elemental-duration) var(--accordion-elemental-easing);
}

accordion-elemental.caret > details[open] > summary::after {
  rotate: 180deg;
}

@media (prefers-reduced-motion: reduce) {
  accordion-elemental.caret > details > summary::after {
    transition: none;
  }
}
```

Three things are worth keeping if you draw your own:

- **Half a turn, not a quarter.** `rotate: 180deg` reads the same in RTL. A
  quarter turn on a chevron pointing down points it into the margin.
- **The caret animates because the panel stays `open`.** The element holds `open`
  on the panel for the whole close, so `[open] > summary::after` turns with the
  slide rather than snapping at the end of it. Timing it off the same two custom
  properties keeps the two in step when you retime the animation.
- **Reduced motion is yours to handle.** The element switches its own slide off;
  a caret it never drew is not its to switch off for you.

<script src="{{ relativePathPrefix }}dist/elementals/accordion.js"></script>
