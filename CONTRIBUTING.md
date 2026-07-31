# Contributing to Book of Elementals

Issues and pull requests are welcome.

These are custom elements that upgrade markup you would have written anyway, in
the light DOM, with no build step required of the person using them. That shapes
what belongs here: an element takes ordinary HTML, adds the roles, states and
keyboard behaviour the [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/)
asks for, and leaves the page working if the script never loads. An element that
needs its own markup vocabulary to be useful is a different project.

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

Commit messages are freeform, write something that says what changed.

## How a release works

`script/publish [version]` bumps `package.json`, runs `script/changelog` to cut
`[Unreleased]` into a released entry, builds, tags and pushes. Pushing the tag
triggers [publish.yml](.github/workflows/publish.yml), which publishes to npm via
trusted publishing — OIDC, no tokens stored anywhere. The changelog entry becomes
the body of the GitHub release verbatim.
