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
<script src="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css" />
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
  event. A `media` attribute hands `open` to a media query — held open while it
  matches, closed when it stops — and writes `data-mode="pinned"`/`"free"` on the
  element and the region, so a stylesheet keys off the query without repeating it.
- `<switch-elemental>` — APG switch: a real `<button>` given `role="switch"` and
  `aria-checked`, for a setting that takes effect the moment it is flipped (a
  theme toggle, a mute). Reflected `checked` and a bubbling `switch-toggle`
  event. Form-associated through `ElementInternals`, so `name`/`value` submit,
  reset and restore exactly as a checkbox's do — no hidden `<input>`, and a switch
  in a form is still this element. Two things send you to
  `<input type="checkbox" role="switch">` instead: it needs no JavaScript at all, so
  it survives scripting being off, and it can be labelled by a `<label>`.
- `<menu-elemental>` — APG menu button: a `<button>` and the nested lists it
  opens, with `role="menu"`/`role="menuitem"`, arrow keys, type-ahead, `Escape`
  back to the trigger and one branch open at a time. A `media` attribute is the
  width the flyout exists in; outside it the roles come off and the same markup is
  a stack of nested disclosures, which is what `data-mode` says. For commands —
  account menus, toolbars, "more actions" — not for site navigation.
- `<navbar-elemental>` — APG disclosure navigation: a site's row of links and the
  panels some of them open, writing no roles at all, because a link announced as a
  menu item is a link no longer. Links that stop fitting move behind an overflow
  button, measured with an `IntersectionObserver` on a copy of the row rather than
  guessed at with a breakpoint; a `media` attribute is when the whole bar becomes a
  drawer. `data-mode="bar"`/`"stack"`, reflected `open`, a bubbling `navbar-toggle`,
  and three markup hooks: `data-navbar-more`, `data-navbar-toggle`,
  `data-navbar-stack`.
- `<tabs-elemental>` — APG tabs, written on the markup a page would have had
  anyway: a list of in-page links and the sections they point at. `role="tablist"`,
  `role="tab"` and `role="tabpanel"` with a roving tabindex, arrow keys on the axis
  `aria-orientation` promises, `vertical` and `manual` attributes, reflected
  `selected`, and a bubbling `tabs-select`. Panels not showing are hidden with
  `hidden="until-found"`, so find-in-page reaches them and finding one selects its
  tab.

Sibling project: [book-of-spells](https://github.com/stamat/book-of-spells),
which holds the plain JavaScript helpers. This book holds the elements.
