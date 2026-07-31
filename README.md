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
| `<menu-elemental>`       | [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), nested, and not a menu below a breakpoint |
| `<switch-elemental>`     | [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), for a setting that takes effect at once |
| `<tabs-elemental>`       | [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), horizontal or vertical, on a list of in-page links |

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

## `<menu-elemental>`

A `<button>` and the nested lists it opens — plus one thing the APG has no
opinion about, because it is a layout question: below a breakpoint the whole
thing stops being a menu.

```html
<menu-elemental media="(min-width: 60rem)">
  <button>Account</button>
  <ul>
    <li><a href="/profile/">Profile</a></li>
    <li>
      <button>Preferences</button>
      <ul>
        <li><a href="/preferences/theme/">Theme</a></li>
      </ul>
    </li>
  </ul>
</menu-elemental>
```

| Attribute | Type    | Default | Description                                                                       |
| --------- | ------- | ------- | --------------------------------------------------------------------------------- |
| `media`   | string  | —       | The query the flyout exists in. Outside it, nested disclosures. Unset means always a menu. |
| `open`    | boolean | `false` | Whether the root list is showing. Reflected.                                       |

Inside `media` it is the [APG Menu
Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/): `role="menu"`,
items out of the tab order, arrows and <kbd>Home</kbd>/<kbd>End</kbd> to move,
<kbd>Right</kbd>/<kbd>Left</kbd> in and out of a branch, type-ahead,
<kbd>Escape</kbd> back to the trigger, one branch open at a time.

Outside it, the roles come off. `role="menu"` is a promise that the arrows work
and <kbd>Tab</kbd> does not, and on a phone the same markup is a stack of nested
disclosures in a drawer — links you tab through, branches that stay where you
left them. Two widgets, one set of markup, the viewport picks. The element writes
`data-mode` so your CSS reads the breakpoint back off it instead of repeating the
query.

<kbd>Tab</kbd> is never trapped: nothing behind the menu is `inert`, and a
keyboard visitor who cannot tab out of a dropdown is stuck on your page.

For site navigation rather than commands, use `<disclosure-elemental>` with the
native `popover` attribute instead — `role="menuitem"` costs the link semantics,
and popover covers dismissal and focus return with no script. The
[docs page](https://stamat.github.io/book-of-elementals/elementals/menu.html)
lays out the trade.

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

| Attribute | Type   | Default | Description                                     |
| --------- | ------ | ------- | ----------------------------------------------- |
| `name`    | string | —       | Submits under this name. No name, no form data. |
| `value`   | string | `on`    | What it submits while on.                       |

Give it a `name` and it submits with its form exactly as a checkbox does — the
value when on, nothing at all when off — and resets and restores with it too. That
is `ElementInternals`, not a hidden `<input>` mirroring the state, so the platform
owns all three and there is no second node to disagree with the first.

Being in a form is not what picks the control — a switch in a form is still this
element. Two specific things send you to `<input type="checkbox" role="switch">`
instead: it needs no JavaScript at all, so it survives scripting being off, and being
a real form control it can be labelled by a `<label>`. The button here is hidden until
the element upgrades, because a switch that silently does not switch is worse than no
switch — which is the same reason the first of those two matters.

The optional theme draws a pill whose knob slides and whose track fills, mixed out
of `currentcolor` so it sits in the palette it is switching. Geometry derives from
`--switch-elemental-width` and `--switch-elemental-height`, so any size is two
properties — `.switch-elemental-small` ships as the one preset. An icon per state
is optional, in `.switch-elemental-on` and `.switch-elemental-off` spans inside the
button. The docs page shows the hairline, accent, wash and outline variants, each
one nothing but a few of the theme's custom properties.

## `<tabs-elemental>`

One panel at a time out of a set of them, on the markup the page would have had anyway:
a list of in-page links, and the sections they point at.

```html
<tabs-elemental>
  <ul>
    <li><a href="#install">Install</a></li>
    <li><a href="#usage">Usage</a></li>
  </ul>
  <div id="install">…</div>
  <div id="usage">…</div>
</tabs-elemental>
```

| Attribute  | Type    | Default | Description                                                              |
| ---------- | ------- | ------- | ------------------------------------------------------------------------ |
| `selected` | number  | `0`     | Index of the selected tab. Reflected — it tracks the live state.         |
| `vertical` | boolean | `false` | The strip runs down the page. The arrow keys go with it.                 |
| `manual`   | boolean | `false` | Arrows move focus without selecting; <kbd>Enter</kbd> or <kbd>Space</kbd> selects. |

The element writes `role="tablist"`, `role="tab"` and `role="tabpanel"`, keeps
`aria-selected` and the roving tabindex in step, and answers to the arrow keys on the axis
`aria-orientation` promises and not the other one. State changes fire a bubbling
`tabs-select`.

Which panel belongs to which tab is the tab's own `#fragment`, or its `aria-controls`, or
failing both the child in the same position. The fragment is the one worth writing: it is a
working link before the element upgrades and after it fails to, which is the whole
degradation — every panel on screen and every link jumping to one. Following such a link
with no script leaves a fragment in the URL that this element then reads back as the
selected tab, and find-in-page reaches the panels that are not showing, because they are
hidden with `hidden="until-found"`.

The element is a `grid` with every panel in the same cell, which is the one layout it
insists on: panels laid out one after another mean a page that jumps by the height of the
last one every time you change tabs. `vertical` puts the strip beside them instead of above.

## Custom Elements Manifest

Every element's API is also machine-readable, as a
[Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) generated
from the JSDoc on each class — attributes with their types and defaults, CSS custom properties
with their syntax, events and slots.

```
dist/custom-elements.json               every element in the book
dist/elementals/switch-manifest.json    one element, same contents
```

Two shapes because the two readers want opposite things. An editor or a converter wants one
file for the whole package, and that is the one `package.json`'s `customElements` key points
at — which is what VS Code and JetBrains read to autocomplete attributes, what Storybook
builds its args table from, and what converters turn into `html-custom-data` and `web-types`.
A page that loads one element's bundle and one element's stylesheet wants the matching
manifest and not the other four elements' documentation:

```js
import manifest from 'book-of-elementals/switch/manifest' with { type: 'json' }
```

Both come out of a single analyzer pass, so they cannot describe the same element
differently. Regenerated by `npm run build` — `poops.json` runs
[`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
and then `script/manifests.js` as an `exec.scripts` hook, so there is no second build
command to remember.

The tags are curated by omission: `--switch-elemental-inset`, `--switch-elemental-knob-size`
and `--switch-elemental-travel` are `calc()`-derived from the geometry properties and are
deliberately absent. The manifest is the curation — everything in it is something you are
being invited to change.

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
