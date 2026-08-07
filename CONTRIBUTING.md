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

- **Add a test.** Tests live next to the source as `src/**/*.test.js`. A bug fix
  gets a test that fails without the fix, and a new element gets coverage of the
  roles and the keyboard behaviour, not just that it upgrades.
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
