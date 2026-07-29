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

<accordion-elemental exclusive>
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

_A live `<accordion-elemental exclusive>`. Focus a header and press the arrow keys._

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
exclusive — the closing is the browser's, not a script's, so it animates and
behaves identically to a user-driven close.

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

## Styling

No shadow DOM, so style the elements directly. The open/close animation is
pure CSS on `::details-content`:

```css
accordion-elemental {
  --accordion-elemental-duration: 250ms;
  --accordion-elemental-easing: ease;
}
```

Browsers without `::details-content` ignore the rule and fall back to native
instant toggling — working, just unanimated. `prefers-reduced-motion: reduce`
switches the transition off.

The library styles structure and motion only; the look is yours:

```css
accordion-elemental > details + details {
  border-top: 1px solid #e3e6ea;
}

accordion-elemental > details > summary {
  padding: 0.75rem 1rem;
  cursor: pointer;
}
```

<script src="{{ relativePathPrefix }}dist/elementals/accordion.js"></script>
