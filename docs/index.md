---
layout: poops-docs-theme/docs
title: Book of Elementals
description: Accessible custom elements. Light DOM, no build step required.
order: 0
---

# 📓 Book of Elementals

A growing book of custom elements that are accessible by default and use
**light DOM** — so every part stays yours to style.

Sibling to [book-of-spells](https://github.com/stamat/book-of-spells), which
holds the plain JavaScript helpers. This one holds the elements.

## Installation

```bash
npm install book-of-elementals
```

Import one element and you get one element — nothing else is registered:

```javascript
import "book-of-elementals/accordion";
```

```scss
@use "book-of-elementals/accordion/style.scss";
```

Or import the whole book:

```javascript
import "book-of-elementals";
```

```scss
@use "book-of-elementals/styles/index.scss";
```

Or use the CDN, no build step at all. Every element ships its own bundle:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css"
/>
```

There is no global and no boot call. Including a bundle registers its element,
and the element upgrades itself wherever it appears in the page — including
markup added later. Swap in `book-of-elementals.min.js` for the whole book.

Those stylesheets carry structure and motion only. Each element's look is a
separate, optional one, off unless you ask for it:

```scss
@use "book-of-elementals/accordion/theme.scss";
```

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion-theme.min.css"
/>
```

Swap in `book-of-elementals/theme.scss`, or `book-of-elementals-theme.min.css`,
for every element's look at once.

## Principles

**Native first.** An element only exists where the platform leaves a real gap.
Where HTML already has the semantics — `<details>` for disclosure, `<dialog>`
for modals — the element coordinates the native thing rather than
reimplementing it. That is why the accordion is a few dozen lines instead of a
few hundred, and why its keyboard and screen-reader behaviour is the browser's
rather than a hand-rolled approximation of it.

**Light DOM, always.** No shadow roots. Your CSS reaches every part, your
existing design tokens apply, and server-rendered markup works untouched.

**Accessible or it does not ship.** Patterns follow the
[W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/)
where one applies. Keyboard operation, focus management and reduced-motion
handling are not options.

**One dependency, and it is the sibling.** The plain JavaScript helpers live in
[book-of-spells](https://github.com/stamat/book-of-spells) and are bundled into
`dist/`, so a script tag still costs you exactly one file. Nothing else, ever.

## The book so far

Thirteen elements, one page each — twelve on an APG pattern, one where there is
none to have. [**The elementals**](elementals/index.html) is the index: what
each one implements, and which gap in the platform it fills.

Assembled into whole interface pieces, they are in
[examples](examples/site-navigation.html) — a site header, a sidebar drawer, a
bulk-actions toolbar.

One thing here is not an element. [**The drawn checkbox**](checkbox.html) is a
stylesheet `<checkbox-group-elemental>` could not be drawn without — the mixed
state's dash is the one part `accent-color` cannot touch — and it is opt-in with
a class, so every other checkbox on the page can wear the same look.
