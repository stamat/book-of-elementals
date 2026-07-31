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

- `<tabs-elemental>` — the [APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/),
  horizontal or vertical.

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

  Written on the markup the page would have had anyway: a list of in-page links and the
  sections they point at. Which panel belongs to which tab is the tab's own `#fragment`,
  or its `aria-controls`, or failing both the child in the same position — the fragment
  being the one worth writing, since it is a working link before the element upgrades and
  after it fails to.

  **DOM it produces:** `role="tablist"` and `data-tabs-list` on the list, `role="none"` on
  its `<li>`s, `role="tab"` with `aria-selected`, `aria-controls` and a roving `tabindex`
  on each tab, and `role="tabpanel"` with `aria-labelledby` and `data-tabs-panel` on each
  panel. Ids are generated either side of those pairings where the markup had none.
  `aria-orientation="vertical"` is written only when `vertical` is set, since horizontal is
  the attribute's own default. Nothing is wrapped and nothing is moved. `selected` on the
  host is the single source of truth and is reflected, so `[selected]` is a styling hook;
  changes fire a bubbling `tabs-select` carrying `{ tab, panel, index }`.

  **Keyboard:** the strip is one tab stop, not one per tab — the selected tab is the only
  one `Tab` lands on and the arrows do the rest. Arrows answer on the strip's own axis and
  leave the other one to the page, `Home` and `End` go to the ends, and the selection
  follows the focus unless `manual` is set, which is for panels whose content is not
  already in the page.

  **CSS:** the element is `display: grid` with every panel in the same cell. That is the
  one layout it insists on, because panels laid out one after another mean a page that
  jumps by the height of the last one on every change of tab. `vertical` turns it into two
  columns. Panels that are not showing are hidden with `hidden="until-found"`, so
  find-in-page still searches them and finding one selects its tab — that keeps the panel's
  box, which the element's stylesheet strips back to nothing, since three retained boxes
  sharing a cell with the one being read would paint across it and take its clicks. The
  optional theme marks the selected tab with a border on the strip's own rule rather than
  with a bar that slides, which needs no measuring and can never disagree with where the
  tab is.

- **A [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)** —
  `dist/custom-elements.json`, generated from the JSDoc on each element by
  `@custom-elements-manifest/analyzer` and pointed at by the `customElements` key in
  `package.json`. That key is what VS Code and JetBrains read for attribute autocomplete, what
  Storybook builds an args table from, and what a live options panel can generate controls from.

  It ships twice, because the two readers want opposite things. The cumulative file is one
  request for every element in the book, which is what an editor or a converter wants. Per
  element there is also `dist/elementals/<name>-manifest.json`, exported as
  `book-of-elementals/switch/manifest` — a page that loads one element's bundle and one
  element's stylesheet has no use for the other four elements' documentation. Both come out of
  a single analyzer pass, so they cannot end up describing the same element differently.

  The tags are a transcription of the tables already in `docs/elementals/*.md`, with one
  deliberate omission: `--switch-elemental-inset`, `--switch-elemental-knob-size` and
  `--switch-elemental-travel` are `calc()`-derived from the geometry properties and are not
  tagged. The manifest is the curation — anything in it is something a reader is being invited
  to change, and setting a derived property by hand is how a knob overshoots its own track.

- `<switch-elemental>` — the [APG Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/):
  an on/off setting that takes effect the moment it is flipped, on a real `<button>`.

  ```html
  <span id="dark-label">Dark mode</span>
  <switch-elemental>
    <button aria-labelledby="dark-label"></button>
  </switch-elemental>
  ```

  A switch and a checkbox are the same boolean wearing different promises: a checkbox is a
  value you are about to submit and has a third indeterminate state; a switch is a setting
  that lands immediately and has two. So this is a `<button>`, which is where `Space`,
  `Enter`, focus and the disabled state come from.

  **DOM it produces:** `role="switch"` and `aria-checked` on the button, plus `type="button"`
  if the markup did not set a type. Nothing is wrapped and nothing is moved. `checked` on the
  host is the single source of truth and is reflected, so `[checked]` is a styling hook and
  `aria-checked` is written from it rather than being the thing you set. State changes fire a
  bubbling `switch-toggle` carrying `{ checked }`.

  **Forms:** give it a `name` and it submits with its form exactly as a checkbox does — the
  `value` (default `on`) while checked, and nothing at all while unchecked — and resets and
  restores on back-navigation too. That is `ElementInternals` rather than a hidden `<input>`
  mirroring the state: a second node holding the same boolean is a second node that can
  disagree with the first, and it would leave reset and restore to be hand-written. Needs
  `attachInternals`, which Safari only got in 16.4; without it the switch simply does not
  submit and nothing else changes. Being in a form is not what picks the control — a switch in a
  form is still this element. Two specific things send you to
  `<input type="checkbox" role="switch">` instead: it needs no JavaScript at all, so it
  survives scripting being off, and being a real form control it can be labelled by a
  `<label>`, which a `<button>` cannot.

  The element is `display: contents`, so dropping it around an existing button changes no
  layout — a switch is usually a flex or grid item beside its label. With scripting off the
  button is hidden (`switch-elemental:not(:defined) > button { display: none }`), because a
  switch that silently does not switch is worse than no switch; a setting that must survive
  that belongs in a form as the native checkbox above.

  **CSS:** the optional theme draws a pill whose knob slides and whose track fills — off, the
  track is empty and the knob is the only ink; on, they swap, so the two states differ by fill
  as well as by position. Everything is mixed out of `currentcolor` bar the knob's checked
  fill, which defaults to the `Canvas` system color — the one value that has to know its
  surroundings, so re-point it on a card, or on a page that themes in custom properties
  without also declaring `color-scheme`. Knob size and travel are derived from
  `--switch-elemental-width` and `--switch-elemental-height`, so any size is two properties
  and `.switch-elemental-small` ships as the one preset;
  `--switch-elemental-border-width`, `--switch-elemental-border-color`,
  `--switch-elemental-gap`, `--switch-elemental-track`, `--switch-elemental-track-checked`,
  `--switch-elemental-knob`, `--switch-elemental-knob-checked`,
  `--switch-elemental-duration` and `--switch-elemental-easing` cover the rest. An icon per
  state is optional, in `.switch-elemental-on` and `.switch-elemental-off` spans inside the
  button. Motion is off under `prefers-reduced-motion`, and track and knob repaint in system
  colors under `forced-colors`. Note that the theme sets its properties on
  `switch-elemental` itself, so an override has to reach the element — one set on an ancestor
  is inherited and loses. The docs page carries hairline, accent, wash and outline variants
  built from nothing but these properties.

  ```scss
  @use "book-of-elementals/switch/style.scss";
  @use "book-of-elementals/switch/theme.scss";
  ```

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

  The region slides open and closed, on `--disclosure-elemental-duration` and
  `--disclosure-elemental-easing` read back out of the computed styles, so the stylesheet
  times the animation — including to nothing, which `prefers-reduced-motion: reduce` and a
  `0s` duration both do. `hidden` therefore lands at the _end_ of a close rather than the
  start, since it stops the region rendering and would cut the slide off at frame one;
  `aria-expanded`, `open` and `disclosure-toggle` all still change immediately, so a
  selector keyed off any of them turns on the first frame. **The region is the animated
  box, so it must not be padded or bordered** — block padding is a floor `height: 0`
  cannot get under. Put the inset on a box inside the region. Margin is fine, and is
  transitioned so that zeroing it while closed is not a jump.

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

  Its colors are mixed out of `currentcolor`, so panels sit in whatever palette the page
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
