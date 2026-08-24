# Contributing to Book of Elementals

Issues and pull requests are welcome.

These are custom elements that upgrade markup you would have written anyway, in
the light DOM, with no build step required of the person using them. That shapes
what belongs here: an element takes ordinary HTML, adds the roles, states and
keyboard behaviour the [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/)
asks for, and leaves the page working if the script never loads. An element that
needs its own markup vocabulary to be useful is a different project.

## What this is not

Not a design system. Each element ships an optional look for **itself**, and nothing here
styles the page around it — that is the difference between a book of elements and a
framework you have to fight.

There is one stylesheet that is not an element's, `styles/checkbox.scss`, and the line it
sits on is the rule: **a control gets a look here only when an element in the book cannot be
drawn without one.** `<checkbox-group-elemental>`'s mixed state is a dash that
`accent-color` cannot draw, so the checkbox had to be drawn by hand; having drawn it,
scoping it to that one element would leave a mismatched box beside every group. A text
input, a `<select>`, a button — nothing has forced one, so there is none, and a PR adding
one is a PR for a different project. It is also opt-in through a class, never a bare
`input[type="checkbox"]` selector: importing a theme for an accordion must not silently
redraw a page that did not ask.

## Patterns that are not coming

There are 30 [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) and this book
implements 17 of them, across 18 elements — `<combobox-elemental>` and `<suggest-elemental>`
share Combobox, `<disclosure-elemental>` and `<navbar-elemental>` share Disclosure, and
`<slider-elemental>` answers both Slider and Slider (Multi-Thumb) depending on how many
thumbs the markup has. The other 13 were each run through the question at the top of this
file — does it upgrade markup you would have written anyway, and does the platform leave a
gap worth filling — and each one came back no. That is written down here so the answer is
checked before the code exists rather than argued about after, and so a PR proposing one
knows what it is arguing against.

None of these is closed forever. What each row asks for is a reason the line under it is
wrong, not a working implementation.

| Pattern | Why not |
| --- | --- |
| [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) | `<button>`. The pattern documents making a non-button behave as one, which is the thing this book exists not to do |
| [Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/) | `<a href>`, and the same argument |
| [Landmarks](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/) | `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`. Markup, with no state and no keyboard — there is nothing for an element to do |
| [Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) | `<nav aria-label="Breadcrumb">` round an `<ol>`. The same: nothing to upgrade |
| [Meter](https://www.w3.org/WAI/ARIA/apg/patterns/meter/) | `<meter>` needs nothing `<progress>` needed. Said already, and at more length, on [the progress page](https://stamat.github.io/book-of-elementals/elementals/progress.html) |
| [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) | `<select>` is the native one, and `<combobox-elemental>` and `<suggest-elemental>` already build a listbox each. A third copy of the same popup is not a new element |
| [Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) | `<menu-elemental>` already writes `role="menu"` and `role="menuitem"`. Only the menubar half is missing, and that is application chrome — a site's navigation is `<navbar-elemental>` |
| [Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) | `role="alert"` on a `<div>` is the whole pattern. A page-level announcer would be an imperative `announce()` call, which is the opposite of a tag you put around markup |
| [Alert and Message Dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) | Not a second element beside `<modal-elemental>` — at most an `alert` attribute on it, swapping the role and pointing `aria-describedby` at the message. Nobody has needed it yet; when someone does, that is the shape |
| [Spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/) | It would be rebuilding what the best-researched design system in the field removed. [GOV.UK dropped `input type="number"`](https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/) — undictatable in Dragon, an unlabelled spin button in NVDA object navigation, letters silently discarded, the value changed by a stray scroll wheel — and landed on `type="text" inputmode="numeric"`, which needs no script. The validation half they name is `<field-elemental>`. A quantity stepper is the one live question inside this row |
| [Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) | `<table>` already is one. The roles the pattern describes are for markup that is not a table, and re-declaring them on one that is would be replacing semantics the browser already has. What the pattern's own [sortable example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/) adds on top is `<sortable-table-elemental>`, which is why that element's page says it implements no pattern |
| [Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | The smallest useful version is an application, not a smallest functional whole. Sorting a real `<table>` is `<sortable-table-elemental>`; the rest — paging, filtering, column resizing, row selection — is a data grid |
| [Treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) | Grid plus Tree View, and Grid is already out |

## Getting set up

```bash
git clone https://github.com/stamat/book-of-elementals.git
cd book-of-elementals
npm install
```

```bash
script/server    # builds and serves the docs with live reload, http://localhost:4040
script/build     # compiles dist/ and the docs site into _site/
script/test      # jest
script/lint      # eslint + stylelint
script/a11y      # axe over the built demos, in Chromium — run script/build first
```

An elemental is a directory under `src/elementals/<name>/`: `index.js`,
`index.scss`, `theme.scss`, and its docs page under `docs/elementals/`. The
build runs `cem analyze` over `index.js` — the JSDoc on the class is what fills
`custom-elements.json`, which is what the docs option panels and editors read, so
an attribute or custom property without a tag might as well not exist.

## Reporting a bug

Include the element, the markup you gave it, the DOM you got, and what you
expected — for a keyboard or screen reader bug, the key or the announcement, and
which browser and assistive technology. A minimal page beats a description.

## Pull requests

- **Add a test.** Tests live next to the source, in two files: `index.test.js` for
  the decisions an element makes as plain functions, and `dom.test.js` — opening
  with an `@jest-environment jsdom` docblock — for the element itself, upgraded over
  markup. A bug fix gets a test that fails without the fix, and a new element gets
  coverage of the roles and the keyboard behaviour, not just that it upgrades.
  Anything needing a layout, a `ResizeObserver`, an `IntersectionObserver`, `inert`,
  `matchMedia` or `<dialog>` is not jsdom's to answer and belongs to `script/a11y`
  over the built demos — say so in the file's header rather than leaving the gap
  unexplained.
- **Accessibility is the point.** Anything that changes roles, states, focus
  order or keyboard handling has to be checked against the APG pattern it claims
  to implement.
- **Run `script/a11y`.** It builds nothing itself — `script/build` first — then
  drives every live demo in Chromium and runs axe over it: as authored, then
  again with everything that says it is closed opened, every tab selected and
  every switch flipped. Twice over, light and dark — the themes mix their
  colours out of `currentcolor` and the system palette, so `color-scheme` is
  what a contrast bug hides behind. It audits the previews rather than the pages
  around them, so a violation it prints is this project's and not the docs
  theme's. It also fails on an `aria-controls`, `aria-labelledby`,
  `aria-describedby` or `aria-activedescendant` naming an id that is on no
  element — axe files that as undecided rather than failing, because a
  collapsed menu button may legitimately point at a popup that does not exist
  yet, so a typo in one otherwise fails no run anywhere.

  A rule it cannot decide is listed as needing review, by rule and by reason,
  rather than failing the run. Most of those are contrast axe cannot compute —
  a colour over a pseudo element or under something overlapping it — and they
  stay that way. Note what contrast means here at all: it measures the optional
  theme, which is one look meant to be replaced, so it is evidence the default
  is sound and not a promise about a page that restyled it. Hover-only states
  and anything a click cannot reach are not covered either, which is what a
  browser and a screen reader are still for.
- **Say what the DOM does.** The elements write into the light DOM, so the markup
  they produce and the CSS an author may already target are the public API —
  changes to either belong in the changelog entry, in those words.
- **Run `script/lint`.** `eslint` and `stylelint` are the authority, and CI runs
  them on Node 22 and 24.
- **Keep the bundles supportable.** `script/build` then `npm run lint:browsers`
  and `npm run lint:es` check the compiled CSS and JS against
  [.browserslistrc](.browserslistrc) and the esbuild target. CI runs both after
  the build; a feature that degrades to nothing can be added to the ignore list
  in [stylelint.browsers.config.js](stylelint.browsers.config.js), with a
  comment saying why.
- **Add a changelog entry** under `## [Unreleased]` in
  [CHANGELOG.md](CHANGELOG.md) — that file explains the format.
- **Agent-written code is welcome — you still own it.** It meets the same bar
  as handwritten code: tests, lint, CI green, checked against the APG pattern.
  You understand every line well enough to answer review questions; "the agent
  wrote it" is not an answer. Point your agent at [AGENTS.md](AGENTS.md)
  before it starts.

Commit messages are freeform, write something that says what changed.

## How a release works

`script/publish [version]` bumps `package.json`, runs `script/changelog` to cut
`[Unreleased]` into a released entry, builds, tags and pushes. Pushing the tag
triggers [publish.yml](.github/workflows/publish.yml), which publishes to npm via
trusted publishing — OIDC, no tokens stored anywhere. The changelog entry becomes
the body of the GitHub release verbatim.
