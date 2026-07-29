# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Releasing means renaming that heading to the
version and date, running `npm version`, and starting a fresh `[Unreleased]`. Write entries for
the person upgrading, not for the person who wrote the code — and because these are custom
elements, call out anything that changes the **DOM the element produces** or the **CSS an author
may already be targeting**, since neither shows up in a function signature.

## [Unreleased]

### Added

- `<disclosure-elemental>` — the
  [APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): a real
  `<button>` wired to a region it shows and hides. `<details>` is a disclosure already and
  wins wherever it fits, which is wherever the region can live _inside_ the trigger's
  element; this one is for where it cannot — a `<figcaption>`, which HTML requires to be a
  child of its `<figure>`, a table row, a grid item its parent lays out directly, a panel on
  the other side of the page.

  ```html
  <figure>
    <img src="chart.png" alt="A tapering band showing an army shrinking…" />
    <disclosure-elemental for="chart-desc">
      <button>Describe this image</button>
    </disclosure-elemental>
    <figcaption id="chart-desc">…</figcaption>
  </figure>
  ```

  Nothing is wrapped and nothing is moved: the element writes `aria-expanded` and
  `aria-controls` onto the button, `hidden` onto the region, and `type="button"` onto a
  button that has no type — a `<button>` in a form submits it otherwise. `open` is
  reflected, so the state reads the same from markup, from script and from CSS, and every
  change fires a bubbling `disclosure-toggle` carrying `{ region, open }`. `for` is read
  bare or as `data-for`; without it the region is the button's next element sibling.

  A closed region is hidden with `hidden="until-found"` rather than a bare `hidden`, so
  find-in-page still searches it and a link to a fragment inside it still lands there. Both
  reveal the region and fire `beforematch`, which the element answers by opening — the same
  behaviour `<details>` has natively, on markup `<details>` could not have held. Browsers
  without `until-found` read the attribute as plain hidden.

  The element is `display: contents`, so dropping it around existing markup changes no
  layout — which is the whole point for the grids and tables it exists to serve. With
  scripting off the region is simply visible and the button is not offered
  (`disclosure-elemental:not(:defined) > button { display: none }`), which for a long
  description is the right way round.

  Its optional theme ships alongside, on the same two custom properties the accordion has —
  `--disclosure-elemental-border-color` and `--disclosure-elemental-radius` — and is
  included in the whole-book `theme.scss`:

  ```scss
  @use "book-of-elementals/disclosure/style.scss";
  @use "book-of-elementals/disclosure/theme.scss";
  ```

### Changed

- The optional accordion theme now styles a heading inside a `<summary>` as inherited type —
  `display: inline`, no margins, the summary's own font size, weight and line height. Putting a
  heading in the summary is what gives screen reader users a heading to navigate an FAQ by, and
  until now the page's `h2`/`h3` styles restyled the header row and pushed the caret onto its own
  line. If you were overriding that yourself, in the theme or on top of it, the override is now
  redundant rather than wrong. The element's own stylesheet is unchanged, and so is the DOM.

## [0.2.0] - 2026-07-29

### Added

- `<accordion-elemental>` animates its panels open and closed, in every browser. Two custom
  properties retime it, and the element reads the duration back out of the computed styles, so
  the stylesheet stays the single source of truth:

  ```css
  accordion-elemental {
    --accordion-elemental-duration: 250ms;
    --accordion-elemental-easing: ease;
  }
  ```

  `prefers-reduced-motion: reduce` switches it off, in the CSS and in the element. With
  scripting off there is no animation at all — the panels toggle natively and instantly, which
  is still correct.

- A panel being closed carries `class="accordion-elemental-closing"` for the length of the
  slide. Because the element keeps `open` on a panel while it animates shut, `[open]` alone
  cannot tell a stylesheet which way a panel is heading — a marker that should start turning
  back on the first frame of the close needs `details[open]:not(.accordion-elemental-closing)`.
  This class is the only part of the closing state deliberately made stylable; the rest stays
  off the attribute surface.

- An optional theme stylesheet, shipped separately and off unless you ask for it — the element's
  own stylesheet still carries structure and motion only:

  ```scss
  @use "book-of-elementals/accordion/theme.scss";
  ```

  ```html
  <link
    rel="stylesheet"
    href="https://unpkg.com/book-of-elementals/dist/elementals/accordion-theme.min.css"
  />
  ```

  Its colours are mixed out of `currentcolor`, so panels sit in whatever palette the page
  already has, theme switch included, with nothing to configure. Two custom properties cover the
  rest: `--accordion-elemental-border-color` and `--accordion-elemental-radius`. Two opt-in
  classes on the group ride along — `grouped` collapses the stack into one card with shared
  borders, `caret` swaps the native disclosure marker for an Octicon chevron drawn as a mask, so
  it takes the summary's `color` and turns on the element's own duration and easing.

- An `exclusive` group now adopts a `name` already present on its panels instead of minting its
  own. Writing the shared `name` in the markup yourself is how exclusivity survives with
  scripting off, since assigning it is the one part the element needs JavaScript for:

  ```html
  <accordion-elemental exclusive>
    <details name="faq" open>…</details>
    <details name="faq">…</details>
  </accordion-elemental>
  ```

- Every element's optional look in one stylesheet — the theme counterpart to the whole-book
  bundle that already exists for structure and motion:

  ```scss
  @use "book-of-elementals/theme.scss";
  ```

  ```html
  <link
    rel="stylesheet"
    href="https://unpkg.com/book-of-elementals/dist/book-of-elementals-theme.min.css"
  />
  ```

  Nothing changes for the per-element imports, and no CSS is new: this is the same rules the
  per-element themes carry, aggregated. With one element in the book it is byte-for-byte the
  accordion's theme, so take whichever matches how you take the rest of the package — the
  aggregate grows as elements land, the per-element one stays the way to pay for only what you
  use.

### Changed

- **DOM:** on upgrade the element now wraps each panel body in
  `<div class="accordion-elemental-content">`. A height transition needs one box to measure and
  clip, and `<details>` hands you a bare run of siblings after the `<summary>`. Descendant
  selectors are unaffected; **direct-child selectors are** — `details > summary + *` and
  `details > :last-child` now match the wrapper rather than the content. Style inside the
  wrapper instead.

- **CSS:** the library owns the wrapper's box and keeps it inert — `margin`, `padding` and
  `border` are zeroed, with `display: flow-root` so child margins cannot collapse out of it.
  Padding there would be a floor the height cannot get under, since `box-sizing: border-box`
  renders `height: 0` as the padding, and the panel would animate shut down to that and then
  cut.

- **Behaviour:** closing a panel is now the element's, not the browser's. `<details>` sets its
  contents to `display: none` the moment `open` goes away, which cuts a close animation off at
  frame one — so the element takes over the click, slides the body up while the panel is still
  open, and only then closes it. `accordion-toggle` therefore fires for a close at the _end_ of
  the slide, when the panel actually closes. Opening still fires it immediately.

- The open/close animation no longer uses `::details-content` and `interpolate-size`. That pair
  only animates in Chromium, so Safari and Firefox got instant toggles and a different DOM from
  the same markup. One scripted path behaves the same everywhere.

- `readOptions` moved to [book-of-spells](https://github.com/stamat/book-of-spells) as a `dom`
  helper — reading typed config off attributes is a DOM concern, not a custom-elements one. It
  is no longer exported from `book-of-elementals/core`, which is now `ElementBase` and `define`.
  Number parsing is slightly stricter as a result: `'25nope'` is dropped rather than read as
  `25`.

- **Dependency:** the package now depends on `book-of-spells` ^1.4.0, for `slide` and
  `readOptions`. It is bundled into `dist/`, so a script tag still costs exactly one file. The
  "no runtime dependencies" claim is gone from the README and docs accordingly.

## [0.1.0] - 2026-07-29

Initial release. `<accordion-elemental>` over native `<details>`/`<summary>`: `exclusive`
panels via a shared `name`, arrow/Home/End header navigation per the
[APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), URL-fragment deep
links, and a bubbling `accordion-toggle` event on the group.

[Unreleased]: https://github.com/stamat/book-of-elementals/commits/main
[0.2.0]: https://www.npmjs.com/package/book-of-elementals/v/0.2.0
[0.1.0]: https://www.npmjs.com/package/book-of-elementals/v/0.1.0
