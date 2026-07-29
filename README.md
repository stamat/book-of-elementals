# 📓 Book of Elementals [![npm version](https://img.shields.io/npm/v/book-of-elementals)](https://www.npmjs.com/package/book-of-elementals) [![license mit](https://img.shields.io/badge/license-MIT-green)](https://github.com/stamat/book-of-elementals/blob/main/LICENSE)

Accessible custom elements. Light DOM, no build step required.

Sibling to [book-of-spells](https://github.com/stamat/book-of-spells) — that one
holds the JavaScript helpers, this one holds the elements.

## Principles

- **Native first** — an element exists only where the platform leaves a real gap
- **Light DOM, always** — no shadow roots, your CSS reaches every part
- **Accessible or it does not ship** — [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/) patterns, keyboard and reduced-motion included
- **One dependency, and it is the sibling** — the helpers live in
  [book-of-spells](https://github.com/stamat/book-of-spells) and are bundled into `dist/`,
  so a script tag still costs you exactly one file

## Elements

| Element                  | Pattern                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `<accordion-elemental>`  | [APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), over native `<details>`      |
| `<disclosure-elemental>` | [APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), where `<details>` cannot go |
| `<switch-elemental>`     | [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), for a setting that takes effect at once |

## Docs

[stamat.github.io/book-of-elementals](https://stamat.github.io/book-of-elementals/)

## Installation

```bash
npm install book-of-elementals
```

Import one element and only that element is registered:

```javascript
import "book-of-elementals/accordion";
import "book-of-elementals/disclosure";
import "book-of-elementals/switch";
```

```scss
@use "book-of-elementals/accordion/style.scss";
@use "book-of-elementals/disclosure/style.scss";
@use "book-of-elementals/switch/style.scss";
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
- a height animation on open and close, in every browser

| Attribute   | Type    | Default | Description                                                |
| ----------- | ------- | ------- | ---------------------------------------------------------- |
| `exclusive` | boolean | `false` | Only one panel open at a time.                             |
| `name`      | string  | auto    | The shared `name` used by `exclusive`. Generated if unset. |

Put a heading inside the `<summary>` when the panels are page sections, so
screen reader users can navigate to them by heading:

```html
<summary><h3>Question</h3></summary>
```

Styling is yours — there is no shadow DOM. On upgrade the element wraps each
panel body in `<div class="accordion-elemental-content-wrapper">` with a
`<div class="accordion-elemental-content">` inside it — the wrapper is the box
whose height transitions, so padding goes on the content — and holds the close
open until the transition ends — `<details>` sets
its contents to `display: none` the moment it closes, which would otherwise cut
the animation off at frame one. Retime it in CSS; the element reads the duration
back out of the stylesheet:

```css
accordion-elemental {
  --accordion-elemental-duration: 250ms;
  --accordion-elemental-easing: ease;
}
```

`prefers-reduced-motion: reduce` switches it off, and without JavaScript there is
no wrapper and no animation — native instant toggling, which is still correct.

## `<disclosure-elemental>`

A real `<button>` wired to a region it shows and hides. `<details>` is a
disclosure already and wins wherever it fits — it fits when the region can live
_inside_ the trigger's element. This one is for when it cannot: a
`<figcaption>`, which HTML requires to be a child of its `<figure>`; a table row;
a grid item its parent lays out directly; a panel on the other side of the page
from the button that opens it.

```html
<figure>
  <img src="chart.png" alt="A tapering band showing an army shrinking…" />
  <disclosure-elemental for="chart-desc">
    <button>Describe this image</button>
  </disclosure-elemental>
  <figcaption id="chart-desc">…</figcaption>
</figure>
```

Nothing is wrapped and nothing is moved — the region stays exactly where the
markup put it, which is the whole point. The element writes `aria-expanded` and
`aria-controls` onto the button and `hidden` onto the region, and that is all the
ARIA there is.

| Attribute | Type    | Default | Description                                                          |
| --------- | ------- | ------- | -------------------------------------------------------------------- |
| `open`    | boolean | `false` | Whether the region is showing. Reflected — it tracks the live state. |
| `for`     | string  | —       | `id` of the region. Defaults to the button's next element sibling.   |

A closed region is hidden with `hidden="until-found"`, so find-in-page still
searches it and a link to a fragment inside it still lands there — either one
reveals the region and the element opens to match. State changes fire a bubbling
`disclosure-toggle`.

The region slides open and closed, timed off
`--disclosure-elemental-duration` and `--disclosure-elemental-easing` in the
stylesheet. It is the animated box, so put its inset on a box inside it: block
padding is a floor the height cannot get under.

The element is `display: contents`, so dropping it around existing markup changes
no layout. With scripting off the region is simply visible and the button is not
offered, which for a long description is the right way round.

## `<switch-elemental>`

An on/off setting that takes effect the moment you flip it — a theme toggle, a
mute, autoplay — on a real `<button>`, which is where `Space`, `Enter`, the focus
ring and the disabled state come from.

```html
<span id="dark-label">Dark mode</span>
<switch-elemental>
  <button aria-labelledby="dark-label"></button>
</switch-elemental>
```

The element writes `role="switch"` and `aria-checked` onto the button, and that is
all the ARIA there is. The name is the thing being switched — never the state,
which `aria-checked` already announces.

| Attribute | Type    | Default | Description                                                     |
| --------- | ------- | ------- | ---------------------------------------------------------------- |
| `checked` | boolean | `false` | Whether the switch is on. Reflected — it tracks the live state. |

State changes fire a bubbling `switch-toggle` carrying `{ checked }`.

If the setting lives in a **form**, stop here: `<input type="checkbox" role="switch">`
submits, resets, restores on back-navigation and derives `aria-checked` from
`checked` on its own, with no JavaScript at all. This element is for the other
case, and deliberately does not grow a form-associated mode — which is also why
the button is hidden until the element upgrades, since a switch that silently does
not switch is worse than no switch.

The optional theme draws a pill whose knob slides and whose track fills, mixed out
of `currentcolor` so it sits in the palette it is switching. Geometry is derived
from `--switch-elemental-width` and `--switch-elemental-height`, so resizing it is
one property. An icon per state is optional, in `.switch-elemental-on` and
`.switch-elemental-off` spans inside the button.

## Changelog

Every release is written up in [CHANGELOG.md](CHANGELOG.md), newest first. Changes to the DOM an
element produces, or to CSS you may already be targeting, are called out there explicitly.

## Development

```bash
npm install
npm run dev    # docs site on :4040 with livereload
npm test       # unit tests (jest), colocated as src/**/*.test.js
npm run lint   # eslint + stylelint
npm run build  # dist/ (package) and _site/ (docs) — both gitignored
```

Land your change under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) as you go.

`src/` is the package, `docs/` is the site's markdown and its skin. Building writes
`dist/` (rebuilt on `prepack`, so it never has to be committed) and `_site/`, which
`.github/workflows/pages.yml` deploys to GitHub Pages. `dist/` is copied into `_site/`
because a Pages artifact is a single directory — nothing above the site root exists once
deployed, so the live demos need their bundle inside it.


---

Made with ❤️ by @stamat.
