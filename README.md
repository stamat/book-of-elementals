# 📓 Book of Elementals [![npm version](https://img.shields.io/npm/v/book-of-elementals)](https://www.npmjs.com/package/book-of-elementals) [![license mit](https://img.shields.io/badge/license-MIT-green)](https://github.com/stamat/book-of-elementals/blob/main/LICENSE)

Accessible, dependency-free custom elements. Light DOM, no build step required.

Sibling to [book-of-spells](https://github.com/stamat/book-of-spells) — that one
holds the JavaScript helpers, this one holds the elements.

## Principles

- **Native first** — an element exists only where the platform leaves a real gap
- **Light DOM, always** — no shadow roots, your CSS reaches every part
- **Accessible or it does not ship** — [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/) patterns, keyboard and reduced-motion included
- **No runtime dependencies**

## Elements

| Element             | Pattern                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `<accordion-elemental>` | [APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), over native `<details>`   |

## Docs

[stamat.github.io/book-of-elementals](https://stamat.github.io/book-of-elementals/)

## Installation

```bash
npm install book-of-elementals
```

Import one element and only that element is registered:

```javascript
import "book-of-elementals/accordion";
```

```scss
@use "book-of-elementals/accordion/style.scss";
```

Or the whole book:

```javascript
import "book-of-elementals";
```

```scss
@use "book-of-elementals/styles/index.scss";
```

Or the CDN, no build step. Every element ships its own bundle:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css"
/>
```

No global, no boot call — including a bundle registers its element and it
upgrades itself wherever it appears, including markup added later. Swap in
`book-of-elementals.min.js` for the whole book.

## `<accordion-elemental>`

Wraps native `<details>`/`<summary>` instead of reimplementing disclosure on
`<div>`s, so the semantics, Enter/Space activation, screen-reader announcement
and find-in-page expansion are the browser's.

```html
<accordion-elemental exclusive>
  <details open>
    <summary>First question</summary>
    <p>First answer.</p>
  </details>
  <details>
    <summary>Second question</summary>
    <p>Second answer.</p>
  </details>
</accordion-elemental>
```

What the element adds on top of native:

- `exclusive` — assigns a shared `name` so only one panel stays open
- <kbd>Up</kbd>/<kbd>Down</kbd>/<kbd>Home</kbd>/<kbd>End</kbd> navigation between headers ([APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/))
- deep links — a URL fragment pointing inside a panel opens it
- an `accordion-toggle` event on the group, since `toggle` does not bubble

| Attribute   | Type    | Default | Description                                                |
| ----------- | ------- | ------- | ---------------------------------------------------------- |
| `exclusive` | boolean | `false` | Only one panel open at a time.                             |
| `name`      | string  | auto    | The shared `name` used by `exclusive`. Generated if unset. |

Put a heading inside the `<summary>` when the panels are page sections, so
screen reader users can navigate to them by heading:

```html
<summary><h3>Question</h3></summary>
```

Styling is yours — there is no shadow DOM. The open/close animation is pure CSS
on `::details-content` and degrades to native instant toggling where that is
unsupported:

```css
accordion-elemental {
  --accordion-elemental-duration: 250ms;
  --accordion-elemental-easing: ease;
}
```

## Development

```bash
npm install
npm run dev    # docs site on :4040 with livereload
npm test       # unit tests (jest), colocated as src/**/*.test.js
npm run lint   # eslint + stylelint
npm run build  # dist/ (package) and _site/ (docs) — both gitignored
```

`src/` is the package, `docs/` is the site's markdown and its skin. Building writes
`dist/` (rebuilt on `prepack`, so it never has to be committed) and `_site/`, which
`.github/workflows/pages.yml` deploys to GitHub Pages. `dist/` is copied into `_site/`
because a Pages artifact is a single directory — nothing above the site root exists once
deployed, so the live demos need their bundle inside it.


---

Made with ❤️ by @stamat.
