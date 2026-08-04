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

| Element                                                | Pattern                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`<accordion-elemental>`](elementals/accordion.html)   | [APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), over native `<details>`    |
| [`<checkbox-group-elemental>`](elementals/checkbox-group.html) | [APG Checkbox (Mixed-State)](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), a select-all that shows the dash when it is some of them |
| [`<combobox-elemental>`](elementals/combobox.html)     | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), a `<select>` you can type your way down, one value or many |
| [`<copy-elemental>`](elementals/copy.html)             | No APG pattern — a `<button>`, the clipboard write behind it, and the [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html) every copy button forgets |
| [`<disclosure-elemental>`](elementals/disclosure.html) | [APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), where `<details>` cannot go |
| [`<menu-elemental>`](elementals/menu.html)             | [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), nested, and not a menu below a breakpoint |
| [`<modal-elemental>`](elementals/modal.html)           | [APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) on native `<dialog>` — nested, animated out, and dismissed the way the platform says |
| [`<navbar-elemental>`](elementals/navbar.html)         | [APG Disclosure Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), that folds itself away when the links stop fitting |
| [`<segmented-elemental>`](elementals/segmented.html)   | [APG Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) on native radios, drawn as a track with a knob that slides |
| [`<switch-elemental>`](elementals/switch.html)         | [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), for a setting that takes effect at once |
| [`<tabs-elemental>`](elementals/tabs.html)             | [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), horizontal or vertical, written on a list of in-page links |
| [`<tooltip-elemental>`](elementals/tooltip.html)       | [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) as far as it has consensus — a description on hover and focus, and a sentence on the page without script |

More pages are being written. Elements published separately today —
[compare-images-slider](https://github.com/stamat/compare-images-slider),
[youtube-background](https://github.com/stamat/youtube-background) — keep their
own packages; this book does not break anyone's install to absorb them.
