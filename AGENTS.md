# Book of Elementals — agent notes

Custom elements library: accessible, light DOM, no build step for consumers.
Read [CONTRIBUTING.md](CONTRIBUTING.md) first — it defines what belongs in this
project and what a PR needs.

Stack: vanilla ES modules — no framework, no TypeScript. SCSS, Jest, built
with poops. Browser support is pinned by `.browserslistrc` and enforced in
lint (`es-check`, `stylelint-no-unsupported-browser-features`) — syntax or CSS
newer than the targets fails CI.

## Design philosophy

The question behind every elemental: **what is the smallest functional element
that deserves to exist?** These are building blocks — each takes one chunk of
ARIA, state and keyboard complexity off the author's mind, and does nothing
more. Judge every addition by cognitive load: an element (or option) that makes
the author think more than the plain markup did has failed, however capable.

## Commands

```bash
script/server    # build + serve docs with live reload, http://localhost:4040
script/build     # compiles dist/ and the docs site into _site/
script/test      # jest
script/lint      # eslint + stylelint (the authority; CI runs it)
```

## Layout

- An elemental lives in `src/elementals/<name>/`: `index.js`, `index.scss`,
  `theme.scss`, plus a docs page under `docs/elementals/`.
- Tests sit next to source as `src/**/*.test.js`.
- New elemental → also add its export map entries in `package.json`.

## Documentation

Markdown in `docs/`, built by [poops](https://github.com/stamat/poops) with
[poops-docs-theme](https://github.com/stamat/poops-docs-theme) into `_site/`,
deployed by [pages.yml](.github/workflows/pages.yml). One page per elemental
under `docs/elementals/`, plus `docs/examples/`.

Two parts of a page are not prose:

- **The option panels come from `dist/custom-elements.json`**, which
  `cem analyze` builds from the JSDoc on the class. An attribute or custom
  property without a tag is invisible in the docs, whatever the page says.
- **A sample marked `<!-- demo switch -->` becomes a live preview**, wrapped by
  `script/demos.js` after the markup stage. The fence stays the only source, so
  the code shown and the thing rendered cannot drift.

Rules:

- **Document in the same change as the code.** A new attribute is not shipped
  until its JSDoc tag and its page section both exist.
- **Edit the page that already covers it.** No new pages, summary files or
  migration notes nobody asked for.
- **Write for the author using the element**: the markup they write, one
  example that runs, and the part that would otherwise surprise them.

## Principles

- **Accessibility is the point.** WCAG and the matching
  [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) are the standard,
  not a stretch goal: roles, states, focus order and keyboard handling follow
  the pattern the element claims to implement, and no change trades that away
  for convenience or looks.
- **Test-driven.** The test is the spec; write it first. A failing test means
  the code is wrong — never weaken, skip, or delete a test to make it pass. If
  the test itself is wrong, say so and let review decide.
- **YAGNI.** Build only what the task needs — no speculative options,
  abstractions, or "for later" scaffolding.
- **Native / stdlib first.** In order: what's already in this repo → the web
  platform (native elements, CSS, built-in DOM APIs) → the JS standard library
  → new code. A new dependency is a last resort and needs a reason.
- **Root cause over symptom.** Fix where all callers route through, not the one
  path the bug report names.
- **Delete dead code.** No commented-out blocks, no "for later" exports — git
  remembers.

## Boundaries

- **Always:** run `script/lint` and `script/test` before calling work done;
  pair every fix or feature with a test; note DOM/CSS output changes in the
  changelog entry.
- **Ask first:** changing the markup an element writes or the CSS hooks
  authors target (that's the public API); adding a dependency; starting a new
  elemental.
- **Never:** edit `dist/` or `_site/` (generated); weaken, skip, or delete a
  test to make it pass; bump the version or publish.

## Before adding a feature

Run this checklist before writing any code; stop at the first "no".

Source order for web-platform facts: [MDN](https://developer.mozilla.org/)
first (behaviour and browser compat), [APG](https://www.w3.org/WAI/ARIA/apg/)
and WCAG for accessibility, the WHATWG/CSSWG spec where MDN is thin. Blog
posts are leads, not sources.

1. **Does native HTML/CSS already do it?** `<details>`, `<dialog>`, popover,
   CSS `:has()`/scroll-snap — if the platform covers it, there is no feature.
2. **Is there an [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) for
   it?** No pattern usually means it's not this project's kind of element.
3. **Search for prior art.** How do similar
   libraries do it? What markup, attributes, and keyboard behaviour do they
   expose? Cite what you found — a URL per fact, no guesses. How can we improve on it?
   If the answer is "we can't", would we benefit in having it in this library?
4. **Does it fit the project?** It must upgrade markup the author would write
   anyway, in the light DOM, and leave the page working without the script
   (see CONTRIBUTING.md). An element needing its own markup vocabulary is a
   different project.
5. **Still yes?** Build the smallest version that satisfies the APG pattern.

## Non-obvious rules

- **JSDoc is load-bearing.** `script/build` runs `cem analyze` over `index.js`;
  the JSDoc on the class fills `dist/custom-elements.json`, which the docs
  option panels and live editors read. An attribute or custom property without
  a JSDoc tag is invisible to the docs.
- **Light DOM = public API.** The markup an element writes and the CSS authors
  target are the contract. Changing either is a breaking-ish change and belongs
  in the changelog entry, described as DOM/CSS changes.
- **Progressive enhancement.** Elements upgrade markup the author would have
  written anyway and the page must keep working if the script never loads.
- **A demo loads the elemental's theme too.** A bare word in a `<!-- demo -->`
  marker pulls in `<name>.css` *and* `<name>-theme.css`, so a sample that styles
  the parts the theme already styles inherits its look — `disclosure-theme` puts
  a caret `::before` on the trigger, which lands on top of an icon-only button
  unless the sample says `content: none`. Look at a preview before shipping it:
  `script/build`, serve `_site`, and open the page.
