Book of Elementals is an npm package (`book-of-elementals`) of custom elements
that are accessible by default and render in
**light DOM** — there are no shadow roots, so every part is stylable with
ordinary CSS and server-rendered markup works untouched.

Each element wraps a native HTML element wherever the platform already has the
semantics (the accordion coordinates `<details>`/`<summary>` rather than
rebuilding disclosure on `<div>`s), so keyboard and screen-reader behaviour is
the browser's. Patterns follow the
[W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/).

Importing a bundle registers its element and nothing else. There is no global,
no constructor to call and no init step — elements upgrade themselves wherever
they appear, including markup inserted later.

```javascript
import "book-of-elementals/accordion"; // one element
import "book-of-elementals";           // the whole book
```

```scss
@use "book-of-elementals/accordion/style.scss";
@use "book-of-elementals/styles/index.scss";
```

```html
<!-- no build step; per-element bundles on the CDN -->
<script src="https://unpkg.com/book-of-elementals/dist/accordion.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/accordion.min.css" />
```

Elements published so far:

- `<accordion-elemental>` — APG accordion over native `<details>`; `exclusive`
  and `name` attributes, arrow-key header navigation, fragment deep links, and a
  bubbling `accordion-toggle` event.
- `<disclosure-elemental>` — APG disclosure: a real `<button>` wired to a region
  with `aria-expanded`/`aria-controls`, for the places `<details>` cannot go (a
  `<figcaption>`, a table row, a grid item, a region across the page). Reflected
  `open`, a `for` attribute for a detached region, `hidden="until-found"` so
  find-in-page still reaches a closed region, and a bubbling `disclosure-toggle`
  event.
- `<switch-elemental>` — APG switch: a real `<button>` given `role="switch"` and
  `aria-checked`, for a setting that takes effect the moment it is flipped (a
  theme toggle, a mute). Reflected `checked` and a bubbling `switch-toggle`
  event. Form-associated through `ElementInternals`, so `name`/`value` submit,
  reset and restore exactly as a checkbox's do — no hidden `<input>`. For a plain
  form control `<input type="checkbox" role="switch">` is still better: no
  JavaScript at all, so it survives scripting being off.

Sibling project: [book-of-spells](https://github.com/stamat/book-of-spells),
which holds the plain JavaScript helpers. This book holds the elements.
