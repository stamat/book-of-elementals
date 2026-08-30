# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Releasing is `script/publish`: it runs
`script/changelog`, which renames that heading to the version and date, starts a fresh
`[Unreleased]`, and hands the entry to the GitHub release as its body.

Keep it bare: one sentence per bullet saying what changed, one saying why, and two is the
ceiling. Write for the person upgrading, not the person who wrote the code — and because
these are custom elements, name anything that changes the **DOM the element produces** or the
**CSS an author may already be targeting**, since neither shows up in a function signature.
The reasoning behind a design, how it was verified, and what was rejected on the way belong
to the docs page and the commit, not here.

## [Unreleased]

## [3.1.1] - 2026-08-30

### Added

- **An infinite scroll feed example**, at
  [examples/infinite-scroll-feed.html](https://stamat.github.io/book-of-elementals/examples/infinite-scroll-feed.html)
  — `<feed-elemental>` over a mocked endpoint, restoring its articles, scroll offset and
  focus on the way back. It also lists the three ways to build an endless feed on top of
  `auto-load`, since the element deliberately has no `auto-load="infinite"`.

  **Refilling `auto-load` needs a number the element has not seen** — an attribute write that
  does not change the value is dropped, so re-setting `auto-load="2"` refills nothing and
  counting up does. Docs only; nothing about the package changes.

### Fixed

- **`<toolbar-elemental>` steps over a control that is not on screen**, instead of moving the
  cursor onto one and stopping there. A button hidden by your own stylesheet, or one folded away
  with the region it sits in, is still in the DOM and still not `disabled` — so the arrows walked
  onto it, `focus()` quietly did nothing, and every control past it was unreachable.

- **The tab stop leaves a control that goes hidden**, so a bar whose only stop was folded away is
  one <kbd>Tab</kbd> can still enter. `hidden` is watched alongside `disabled` for it, and a bar
  hidden whole keeps the stop it had, since that bar is waiting rather than gone.

## [3.1.0] - 2026-08-25

### Added

- **`<feed-elemental>`, a stream of articles that keeps growing.** Wrap a run of `<article>`s
  and each is given its place in the set, named off its own first heading, and made focusable;
  <kbd>Page Up</kbd> and <kbd>Page Down</kbd> walk them and <kbd>Ctrl</kbd> + <kbd>End</kbd>
  gets past the whole feed, per the [APG Feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/).

  **It does not fetch:** `feed-load` hands over `detail.count`, an `AbortSignal` and a
  `wait(promise)`, and whatever the page appends is what the feed indexes. `feed.load()` is the
  same ask from script; `auto-load` is a budget rather than a switch, and without it there is no
  `IntersectionObserver` at all.

  **DOM:** `role="feed"` and `aria-busy` on the element; `tabindex="0"`, `aria-posinset`,
  `aria-setsize` and — where the article has no name — `aria-labelledby` on each direct-child
  `<article>` or `[role="article"]`, pointed at its first heading, which is given an `id` if it
  has none. `aria-setsize` is `-1` until the page states a `total`. **CSS:** a block box and
  `--feed-elemental-scroll-margin` in the structure sheet, borders, padding and
  `--feed-elemental-gap` in the theme.

  **Feed had been listed as a pattern that was not coming, and half that reason was wrong.**
  The objection described infinite scroll rather than the pattern, whose own keyboard contract
  is the reach it was accused of denying; what survives is the criticism of endless loading,
  which is why `auto-load` is a budget.

### Fixed

- **`<carousel-elemental>`: the next button went dim while the row could still scroll.** A
  shelf whose last slide was clipped by less than a quarter of its width reported itself at the
  end — both arrows dimmed, `data-carousel-at-end` written, and `next()` inert. The
  `IntersectionObserver` behind it is now a `ResizeObserver` on the scroller and every slide,
  which has no threshold to miss. No DOM or CSS change.

- **`<carousel-elemental>`: a right-to-left row was stuck on its first slide.** The current
  slide and the distance to the next were measured off left edges, which in a row starting on
  the right are the wrong ones. No DOM or CSS change.

- **`<carousel-elemental>`: two quick presses of next moved one slide.** A press landing before
  the smooth scroll finished counted from where the row still was; it now counts from the slide
  the last press asked for.

- **`<carousel-elemental>`: `wire()` threw on a carousel that upgraded without a list** —
  `TypeError: Cannot read properties of undefined (reading 'set')`. It binds at upgrade and
  waits for the list now, as it already did for the slides.

- **`<carousel-elemental>`: emptying the slides through `wire()` left the rotation's clock
  running.** **DOM:** `data-carousel-rotating` and `--carousel-elemental-tick` now come off an
  emptied carousel, and the clock restarts when slides come back — unless the reader had stopped
  it, or is holding it with the pointer or focus.

- **`<carousel-elemental>`: `autoplay` switched on after upgrade wrote controls over fewer than
  two slides**, pointed at `aria-controls=""`. The attribute change goes through `wire()` now,
  which refuses under two slides as the upgrade always has.

- **`<carousel-elemental>` theme: a page's own `button[aria-controls]` inside a slide was drawn
  as a carousel control.** **CSS:** the shared control rule is now
  `carousel-elemental > [data-carousel-controls] button, carousel-elemental > button[data-carousel-rotate]`
  at the same (0,1,2) specificity, so an override that beat the old rule beats this one; the
  hover tint moved to its own (0,2,2) rule so a dim arrow's `background: none` wins over it.

- **Docs: the carousel said a page without its script keeps a scroll-snapping row.** It keeps a
  plain list — every structure rule keys on `[data-carousel-slides]`, which the upgrade writes.
  The "no resize listener" line and the `--carousel-elemental-current` default are corrected with
  it.

## [3.0.0] - 2026-08-24

### Added

- **`<rearrange-elemental>`, a list, a table body or a board of named columns the reader
  rearranges by hand.** Wrap an `<ol>`, `<ul>` or `<table>` and every item gets a pair of move
  buttons; <kbd>Alt</kbd> and an arrow key is the fast path, and `drag` adds a grip and pointer
  dragging with <kbd>Esc</kbd> putting a drag back where it started.

  **Several named lists in one element is a board**, with no attribute for it. Each item then
  also gets a button for the column on either side, named by where it lands; a list with no
  `aria-labelledby` or `aria-label` throws, naming the attribute, and the whole board goes
  without crossing buttons. Crossing by keyboard is <kbd>Alt</kbd> + <kbd>Shift</kbd> + a
  sideways arrow, and both keys and arrows flip in a right-to-left layout.

  **DOM:** one `<span class="rearrange-elemental-controls" data-rearrange-controls>` per item —
  in the `<li>` itself, and for a `<tr>` in the cell marked `data-rearrange-cell` or its last
  cell — holding two `<button class="rearrange-elemental-move" data-move="up|down">` named by
  visible text in a `<span class="rearrange-elemental-label">`, plus `data-move="prev|next"` on
  a board and a `<span class="rearrange-elemental-handle" data-rearrange-handle
  aria-hidden="true">` under `drag`. One `<p class="rearrange-elemental-status" role="status">`
  closes the element. Ends of travel are `aria-disabled`, never `disabled`. Nothing is written
  onto your list or your items, and no role is added to either.

  **CSS:** `rearrange/index.scss` places the controls, `theme.scss` draws them behind
  `--rearrange-elemental-control-size|gap|radius|color|hover|disabled-opacity|idle-opacity|grip|lift|surface`.
  `--rearrange-elemental-idle-opacity: 0` fades them in on hover and focus; the default is `1`.
  The structure sheet has no opinion about where in the item the controls sit.

  Attributes: `drag`, `up-text`, `down-text`, `moved-text`, `to-text`, `moved-to-text`, plus
  `data-label`, `data-rearrange-handle` and `data-rearrange-cell` on the items. One bubbling
  `rearrange-move` per landing with `item`, `from`, `to`, `fromContainer`, `toContainer` and
  `sameContainer` — branch on the last, since `from` and `to` count inside their own column.
  Nothing is persisted; items arriving later need `.update()`. Not for a table that is also a
  `<sortable-table-elemental>`.

  **The dependency floor moves to `book-of-spells@^2.6.0`**, for starting `drag()` from a
  `pointerdown` the element already heard rather than binding an instance per handle. The handle
  dispatches the helper's own `dragstart`, `drag`, `dragend` and `dragcancel`; none bubbles, and
  `rearrange-move` is still the event to read.

### Removed

- **The `media` attribute is gone from `<disclosure-elemental>`, `<menu-elemental>` and
  `<navbar-elemental>`.** 2.0.0 renamed it to `open-when`, `flyout-when` and `bar-when` and kept
  both spellings working; this is the major that drops the old one.

  **DOM:** `media` is no longer observed or read. A page still writing it gets an element with no
  query at all — a disclosure the button alone opens, a menu that is a flyout at every width, a
  bar that never becomes a drawer. Rename the attribute in your markup; `data-mode`, the events
  and the CSS hooks are unchanged.

### Changed

- **`<splitter-elemental>` drags with `drag()` from book-of-spells** instead of its own pointer
  bookkeeping. The handle now dispatches `dragstart`, `drag`, `dragend` and `dragcancel`, which
  are the helper's and do not bubble; `splitter-change` is still the event to read, the handle's
  attributes are the same ten, and a cancelled gesture reports like a release as it always has.

- **`<splitter-elemental>`: the theme's seam is three dots rather than a hairline.**
  **CSS:** `splitter/theme.scss` only — `--splitter-elemental-line-size` is gone and
  `--splitter-elemental-dot-size` (`3px`) replaces it, `--splitter-elemental-color` and
  `--splitter-elemental-active-color` keep their names and now colour the dots, and the DOM and
  the 24px target are unchanged. `--splitter-elemental-dot-size: 0` is a handle with no mark and
  the target intact.

## [2.0.1] - 2026-08-23

### Fixed

- **`<accordion-elemental>`: an open panel no longer jumps on load.** The theme's inset sits on a
  box the script writes, so until the upgrade an open panel had no inset — a layout shift on
  every page shipping a panel open.

  **CSS:** `accordion/theme.scss` writes the same inset as margins on the panel body's own blocks
  while the wrapper is missing, and those rules stop matching the moment it exists. A panel body
  of bare text with no block around it is still uninset before upgrade.

## [2.0.0] - 2026-08-23

### Added

- **`<tabs-elemental sliding>` — the selection marked by a bar that travels to the tab.** The
  default is still a border on the selected tab, which needs no script; `sliding` is for a page
  that wants the mark to move.

  **DOM and CSS:** nothing changes unless the attribute is set. Under it the element writes
  `data-tabs-sliding`, `--tabs-elemental-tab-start` and `--tabs-elemental-tab-size` onto itself,
  the theme draws one `::after` on the strip from them and takes the border mark off the selected
  tab, and `--tabs-elemental-duration` (`250ms`) and `--tabs-elemental-easing` (`ease-in-out`)
  time the travel. `prefers-reduced-motion: reduce` switches it off and `forced-colors` puts the
  border mark back. It re-measures on a `ResizeObserver` watching the strip and every tab in it.

- **`<slider-elemental>` runs down the page when the CSS says so — no attribute for it.**
  `writing-mode: vertical-rl` with `direction: rtl` is
  [the platform's own way](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_writing_modes/Vertical_controls)
  of standing a range input on end, and the pointer arithmetic now reads the writing mode instead
  of assuming `clientX` and a width. Give a vertical control a `height` — a track down the page
  has no length of its own.

  **DOM:** the value bubble carries `data-vertical` and `data-reversed`. **CSS:** the bubble hangs
  off the right of a vertical control rather than above it, is laid out `horizontal-tb` so the
  number is not turned on its side, and its centring keys off `data-reversed` rather than
  `:dir(rtl)` — `:dir()` answers the `dir` attribute, not the `direction` property.

- **`open-when`, `bar-when` and `flyout-when` — the `media` attribute renamed after what it
  switches.** `open-when` holds `open`, `bar-when` chooses the bar over the drawer, `flyout-when`
  chooses the flyout over nested disclosures, and `<splitter-elemental>`'s new `vertical-when`
  joins them; the value is unchanged, a whole media query.

  `media` still works everywhere it did, the new spelling wins where a page writes both, and it
  is marked for removal at the next major.

- **`<splitter-elemental>` — two panes and a draggable seam between them,** per the
  [APG Window Splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/): arrows
  a per cent at a time, <kbd>Home</kbd> and <kbd>End</kbd> to the smallest and largest size the
  primary pane is allowed, <kbd>Enter</kbd> to collapse it and put it back. `position`, `min`,
  `max`, `vertical`, `vertical-when` and `label-text`; `min` and `max` are `aria-valuemin` and
  `aria-valuemax` verbatim and bound the pointer and the keys alike.

  **DOM:** one `<div data-splitter-handle role="separator" tabindex="0">` between the first two
  element children, `data-splitter-panes` on itself, an `id` on the first child if it had none,
  and `--splitter-elemental-position` in its own `style`. **CSS:** three grid tracks gated on
  `[data-splitter-panes]`, so an element with a single child is left in normal flow; the handle
  sits at `position: relative; z-index: 1` so a pane cannot paint over its focus ring, and is
  `24px` thick for
  [WCAG 2.2 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

- **`<tree-view-elemental>` — a nested list of links the arrow keys walk,** per the
  [APG Tree View pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) in the shape of its
  navigation-tree example: `role="treeitem"` on the link rather than the `<li>`, one tab stop for
  the whole tree starting at `aria-current`, <kbd>→</kbd> and <kbd>←</kbd> in and out of a branch,
  <kbd>Home</kbd>, <kbd>End</kbd> and type-ahead. `data-tree-open` on an `<li>` starts a branch
  open.

  **DOM:** `role="tree"` on the element, `role="none"` on the outer list and every `<li>`,
  `role="group"` with a generated `id` on each branch, and `aria-owns` tying node to branch —
  load-bearing, since a branch is a *sibling* of its node. A closed branch carries `hidden`. No
  `aria-level`, `aria-setsize` or `aria-posinset`. Teardown puts back only what upgrade wrote, so
  an `id` the page put on a branch list survives. `aria-current="false"` is read as what it means,
  so a router writing it on every inactive link neither opens every branch nor tints the sidebar.

  **CSS:** the list markers come off in the element's own stylesheet rather than the theme, since
  a `::marker` beside a node is the `listitem` semantics the roles removed showing through. The
  theme is a docs sidebar, on eight `--tree-view-elemental-` properties: `indent`, `gap`,
  `radius`, `marker-color`, `node-color`, `hover`, `rail`, `current-color` — every colour mixed
  out of `currentcolor`, so setting `current-color` carries the rest.

- **`<sortable-table-elemental>` — a table whose column headers sort it.** One `Intl.Collator`
  with `numeric: true` and the document's `lang` does the comparing, so there is no column-type
  vocabulary: `data-sort-value` on a cell is the escape hatch and `data-sort="none"` on a header
  leaves that column without a button. Sorting is stable, and an `aria-sort` already in the markup
  is adopted rather than re-sorted.

  **DOM:** a `<button type="button">` wrapping each sortable header's existing nodes, `aria-sort`
  on the sorted `<th>`, and a clipped `<span class="sortable-table-elemental-note">` appended to
  the `<caption>` — created if there was none. **CSS:** the element is `display: contents`, and
  its stylesheet puts the header button's font, colour, background, border, alignment and the six
  the UA also resets — `text-transform`, `letter-spacing`, `word-spacing`, `line-height`,
  `text-indent`, `text-shadow` — back to the cell's, so the upgrade is invisible. Both stylesheets
  are scoped to the buttons it wrote, so a button of your own in a `<th scope="row">` keeps its
  look. The theme adds a 2px rule under the header row (`--sortable-table-elemental-rule`) and an
  `nth-child` stripe (`--sortable-table-elemental-stripe`) and nothing else.

  **No spanning cells in the body**, and the element does not check: a `colspan` shifts every cell
  after it so the column sorts by its neighbour's text, and a `rowspan` tears apart.

### Changed

- **`<slider-elemental>`'s value bubble follows the value during a drag, rather than the
  pointer.** A press already pins the bubble to the thumb it grabbed, so the pointer carried
  nothing it read — and yet every move measured the control twice over. One drag of sixty steps
  went from 280 forced style-and-layout passes to 81.

  **What a page can notice:** a `format` callback is called once per value change instead of once
  per pointer move. No DOM or CSS change.

### Fixed

- **`<password-elemental>` kept masking a form it had already left.** Teardown looked the field's
  form up again, but `disconnectedCallback` runs after the node has left the tree, so a removed
  field left a detached element flipping `type` on every submit. The form is held from upgrade
  now.

- **`<switch-elemental>.checkValidity()` and `.reportValidity()` threw where the form half of
  `ElementInternals` is missing.** Both are guarded per method now, as `setFormValue` and
  `setValidity` already were; `validationMessage` and `willValidate` return `''` and `false`
  there rather than `undefined`.

- **`<slider-elemental>`'s two thumbs are under
  [WCAG 2.2's target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  and the docs now say so and spell the fix.** Stacked, neither thumb has clear space around it,
  so each is judged on its own 16px against the 24px minimum;
  `--slider-elemental-thumb-size: 1.5rem` on a two-thumb control clears it. Nothing changed in the
  theme, deliberately — the fix is a size, and one control silently a third thicker than the next
  is a layout question answered on the page's behalf.

- **Every element now upgrades when its bundle is included before its markup.** A custom element
  is upgraded as its opening tag is parsed, before any of its children exist, and every element
  here reads its children on upgrade — so a bundle in `<head>` without `defer` left twenty-one of
  twenty-three doing nothing at all, silently, against a README that had promised the opposite
  since the first release.

  `define` in `src/core.js` now holds registration until `DOMContentLoaded` while the document is
  parsing. A `defer`red or module script is unaffected; a script at the end of `<body>` upgrades
  one task later; a bundle in `<head>` goes from broken to working. **A page reading
  `customElements.get()` synchronously after including a bundle in `<head>` now gets `undefined`**
  — `customElements.whenDefined()` is the one that still answers. Not covered: an element appended
  and then given children afterwards.

- **`<slider-elemental>` threw away a `format` the page had already set.** With registration held
  until `DOMContentLoaded`, a classic script assigning `slider.format` runs before upgrade, and
  the `null` default landed on top of it — silently, since nothing throws and the formatter is
  simply never called. The default is now written only where the page has not answered.

- **The media player example's scrubber never painted its fill.** Its glue wrote `seek.value` and
  `seek.max` directly, and neither fires an event; both call `apply()` now. The example also
  gained a `<video>` beside the `<audio>` and `tooltip` bubbles on both sliders.

- **`<tooltip-elemental>`'s options panel reserved 31px too little.** The pin was measured before
  `--tooltip-elemental-viewport-margin` was added — a docs-only layout shift, and
  `script/pin-heights` now says a JSDoc tag going stale counts as a sample edit.

## [1.0.0] - 2026-08-21

### Added

- **`--tooltip-elemental-viewport-margin` keeps a tooltip off the very edge of the screen.** The
  clamp stops this much short on either end and the side decision honours it, so a bubble that
  would only fit below by touching the bottom edge flips above instead. Default `6px`, so
  tooltips near an edge shift by up to that much; `0px` restores the old behaviour.

### Changed

- **Activating a tooltip's trigger hides the bubble.** A click focuses the button in most engines
  and focus holds the bubble open, so a clicked control kept its tooltip up over the neighbour's.
  Click, <kbd>Enter</kbd> and <kbd>Space</kbd> now hide it and forget both holds, so hovering away
  and back shows it again; a tap's click is exempt.

- **The tooltip theme no longer fades by default.** `--tooltip-elemental-duration` is `0s` instead
  of `120ms`; the transition is still declared, so setting it back to `120ms` gives exactly what
  you had.

- **The tooltip theme no longer outranks the page importing it.** Its `:defined` guard now sits
  inside `:where()`, so `tooltip-elemental [role="tooltip"] { … }` — the hook the docs list — is
  level with the theme and wins by coming later. Nothing paints differently on a page that
  overrode nothing. The other themes gate the same way and are unchanged for now.

- **`<tilt-elemental>`'s shadow is barely there until the card leans.** **CSS:** the shadow's
  `::before` gains `opacity: 0.25` at rest and `1` under `[data-tilt-active]`, with `opacity`
  added to its transition; `tilt-elemental:defined::before { opacity: 1 }` restores the old
  constant weight.

- **`<tilt-elemental>`'s glare default now weighs itself by colour scheme.**
  `--tilt-elemental-glare-color` defaults to
  `light-dark(rgb(255 255 255 / 100%), rgb(255 255 255 / 10%))` instead of a flat 35%, which was a
  spotlight on a dark card and invisible on a light one.

### Fixed

- **`--tooltip-elemental-gap: 0` no longer means "use the default".** The value was read with
  `|| 6`, which cannot tell an explicit zero from an unset property.

- **A tooltip is centred on its trigger on both axes, and slides rather than jumps when the
  viewport is in the way.** The alignment came from book-of-spells' `placeFlyout`/`placeSubmenu`,
  which answer in the `start`/`end` a submenu hangs from — so beside a control the bubble sat with
  its top edge on the trigger's, and near a screen edge it snapped rather than sliding. Both
  helpers are now asked only which side the bubble goes on.

  **DOM:** `data-align` is measured from where the bubble landed rather than what was asked for.

- **`<tilt-elemental>`'s shadow no longer blinks in Safari when the pointer settles.** Safari
  composited the blurred layer only while its transition ran, then rasterised it again at a
  visibly different brightness. **CSS:** the shadow's `::before` carries `will-change: translate`,
  at the price of one card-sized texture held per card.

- **A dialog whose first thing is a picture or a film no longer scrolls sideways.** The theme pads
  the element after the corner cross so a heading cannot run beneath it, and that padding landed
  on media too. **CSS:** `img`, `picture`, `video`, `iframe`, `embed`, `object`, `canvas` and
  `svg` directly after the cross get no `padding-inline-end`, so the picture fills the dialog and
  the cross sits over it — repaint it there, since it inherits the dialog's text colour.

- **A YouTube embed in a `<modal-elemental>` no longer plays on after the modal is closed.**
  Closing reloaded each `<iframe>` by rewriting its `src`, which a `loading="lazy"` frame in a
  `display: none` dialog defers until it is on screen again. **DOM:** a frame inside a closed
  modal now reads `src="about:blank" loading="eager"`, both restored to what the author wrote on
  the next open. Request counts are unchanged.

## [0.11.1] - 2026-08-17

### Fixed

- **Five elementals no longer flash their expanded markup on first paint.** The
  progressive-enhancement markup painted as authored until the bundle ran, then collapsed. The
  structure stylesheets now split that rendering on `@media (scripting)`: scripting off keeps the
  old fallback, scripting on paints the closed state the upgrade is about to wire.

  **The trade:** a bundle that never arrives *while scripting is on* — blocked, 404 — now leaves
  the closed state with nothing to open it. CSS only, no DOM output changed, and every new rule
  sits under `:not(:defined)`.

- **Late-arriving controls no longer shift the page when they land.** The switch, copy and
  password buttons and the checkbox-group's select-all were `display: none` until `:defined`,
  which closed and reopened the row they sit in. Scripting off keeps `display: none`; scripting on
  holds the box with `visibility: hidden` — no click, no tab stop, no announcement. The navbar's
  drawer toggle keeps the old behaviour, since whether it belongs on screen at all is the media
  query's call.

- **The code under an inline demo no longer jumps up when the copy button arrives**, and **the tab
  strip no longer reflows the page on upgrade** — around 50px of shift on the tabs page alone. The
  docs stylesheet names both the pre- and post-script shapes now, and the waiting tab list gets the
  same reset and paint the upgraded one does, behind `@media (scripting: enabled)`. The docs also
  pin `--code-preview-height` on 62 previews, measured by the new `script/pin-heights`.

## [0.11.0] - 2026-08-17

### Added

- **`<switch-elemental>` takes a `checked-if` selector, for a setting the document already
  knows.** A theme toggle could not be right on the first frame: the theme is stamped on `<html>`
  before first paint, so static markup cannot carry `checked` and anything setting it afterwards
  is two painted frames late.

  ```html
  <switch-elemental checked-if="[data-theme=dark]">
    <button aria-labelledby="dark-label"></button>
  </switch-elemental>
  ```

  The selector is asked once, at upgrade, and only of `<html>`. It is a starting state and not a
  binding — nothing re-consults it. A selector the browser cannot parse leaves the markup's own
  `checked` standing and reports the error on the console.

- **`<tilt-elemental>`** — the 3D tilt card, with the reduced-motion switch the rest of the shelf
  does not have. With `prefers-reduced-motion` on it attaches no pointer listener at all — no
  transform, no glare, no layers. Mouse only, and no keyboard trigger. `max`, `axis`, `reverse`
  and `glare` are the whole attribute surface, and any descendant marked `data-tilt-depth="40"`
  rises out of the card while it leans.

  Every angle is measured against the card's flat box, read once at the start of a hover, so a
  pointer near the receding edge cannot make it stutter — no wrapper divs needed to buy that.

  **DOM:** one wrapper, nothing inside it moved. `data-tilt-active` while the pointer is over the
  card, and four unitless custom properties in its own `style` — `--tilt-elemental-x`,
  `--tilt-elemental-y`, `--tilt-elemental-glare-x`, `--tilt-elemental-glare-y`. The angles are
  removed when the pointer leaves; the glare's position is left where it stood.

  **CSS:** everything but `display: block` is behind `:defined`. Both pseudo-elements are spoken
  for — `::after` is the glare, in the structure stylesheet since `glare` is an attribute;
  `::before` is the theme's shadow, a translated blurred layer rather than a `box-shadow`, which
  took 478 paints over a 240-frame hover down to 9. `--tilt-elemental-shadow-size` is spent as
  half of itself so the number means what it did. The layer is a coloured slab, so a card with a
  see-through background shows the shadow through it — point `--tilt-elemental-shadow-color` at
  `transparent` there.

  **A trap:** `overflow` other than `visible`/`clip`, `filter`, `opacity` below 1, `clip-path`,
  `mask-image`, `mix-blend-mode`, `isolation: isolate` or paint containment — on the element or on
  any wrapper between it and a layer — forces `transform-style` back to `flat` and silently stops
  every layer rising.

### Changed

- **`<slider-elemental>`'s `tooltip` bubble now shows on touch, for the length of a press.** It
  was pointer-only in the narrow sense, so the one reader whose fingertip covers the thumb never
  saw the number. `pointerdown` draws it, the drag carries it, the release takes it away. Nothing
  changes for a mouse, and there is still nothing shown on focus.

  **DOM:** unchanged — the same `<output aria-hidden="true" data-tooltip>`.

### Fixed

- **The docs option panels no longer under-report the theme knobs.** Four elementals had custom
  properties the JSDoc never mentioned, which is what `custom-elements.json` and the panels read.
  `--password-elemental-gap` is dropped, since no stylesheet ever read it. No element behaviour,
  DOM or CSS changed.

- **Docs corrections from a full read-through.** The home page said eighteen elements where there
  are twenty-two, the elementals index was missing `<tilt-elemental>`, the "swap in
  `book-of-elementals.min.js`" instruction pointed a directory too deep, two anchors pointed at
  headings that do not exist, and the combobox API table was missing `custom-values` and
  `add-text`.

- **`<tooltip-elemental>` said it was unreachable by touch, and that was only true of one
  engine.** Behaviour is unchanged — touch pointers are still ignored — but focus is not filtered
  by how it arrived: Chromium focuses a `<button>` on tap and the bubble opens, WebKit does not,
  and a text input focuses on tap in both. The guidance is the same either way: nothing essential
  goes in a tooltip.

## [0.10.0] - 2026-08-17

### Added

- **`<slider-elemental>` takes a `format` function for its value bubble.** `72` on a media
  scrubber is `01:12` and `40` on a price is `€40`, neither of which the raw number says.
  `slider.format = (value, element) => …` is a property rather than an attribute because the
  answer is a function.

  Nothing changes for a slider that does not set it, and the fallback is the browser's own
  spelling of the value rather than `String(value)` — a `step="0.10"` input answers `3.10`. A
  formatter returning `undefined` or `null` falls back to that, so a missing `return` looks like
  one. No DOM or CSS change, and the bubble stays `aria-hidden`.

- **`<field-elemental>`** — the browser's own validation message, on the page instead of in a
  bubble that floats away. Nothing here validates anything: `required`, `type`, `pattern` and
  `setCustomValidity()` stay the whole constraint layer and the wording stays the browser's,
  already translated. There is no message vocabulary, because the platform has one call for that
  already.

  **`aria-describedby`, not `aria-errormessage`**, and no live region on the message —
  [Roselli's testing](https://adrianroselli.com/2023/04/exposing-field-errors.html) found the
  first consistently exposed and the second generally not, and a live region on top of a
  description double-speaks in NVDA and JAWS. **It takes focus:** cancelling `invalid` drops the
  browser's focus with the bubble, so the element focuses the first invalid control itself.

  **DOM:** a `<p class="field-elemental-error">` appended to the element, `hidden` and empty while
  the field is fine; `aria-invalid="true"` and an appended `aria-describedby` on the control while
  it is not, both removed again. The control gets an `id` if it had none and the message takes
  that `id` plus `-error`. Render the `<p>` yourself with a server-side message and the element
  adopts it. `field-validity` carries `detail.valid` and `detail.message`.

  **Validity is read at the end of the event, not during it**, so a `setCustomValidity()` in the
  page's own `input` listener has already run — which is what makes a confirm-password field work
  with no `match` attribute to learn. Not covered: radio and checkbox groups, error summaries, and
  any styling of the control.

- **`<password-elemental>`** — a reveal button for a password field. The gap is the state: a
  button swapping an eye for a crossed-out eye tells a sighted reader which way round it is and
  everyone else nothing. **`aria-pressed` with a fixed name**, plus `role="status"` saying "Your
  password is visible" or "Your password is hidden" on every press.

  **The field masks itself before the value leaves**, on `submit` and on `reset` — a revealed
  field posts from an `<input type="text">`, and browsers remember what was typed into those. A
  submit the browser refuses on a constraint never fires the event, so the field is left as the
  reader left it.

  **DOM:** `type` on the field flipped between `password` and `text`, `aria-pressed` and
  `aria-controls` on the button, an `id` on the field if it had none, and one appended
  `<span class="password-elemental-status" role="status">`. `shown` is reflected; `label`,
  `shown-text` and `hidden-text` are the strings; `password-reveal` carries `detail.shown`.
  Without script the stylesheet keeps the button out of reach.

  No strength meter, no generator, no confirmation field —
  [NIST SP 800-63B Rev 4](https://pages.nist.gov/800-63-4/sp800-63b.html) prohibits the
  composition rules a character-class meter scores, and `setCustomValidity()` plus
  `<field-elemental>` does the confirmation in four lines.

- **`<combobox-elemental>` gained `custom-values`** — a value the `<select>` does not hold can be
  typed in, which with `multiple` on an empty `<select>` is a tag input. It is an attribute rather
  than a second element because the chips, the remove buttons, `Backspace` on an empty field and
  the filtering all existed already.

  **An add row in the listbox, not a hint under the field**, so it is announced with the list,
  counted in it and reached with the same arrow key. It sits last, nothing is offered for an empty
  query or an exact match or one differing only in case or space, and taking the row appends a
  real `<option>` that submits, chips and filters like the ones you wrote — outliving a form
  `reset`, which puts back the selection and not the markup.

  **DOM:** the popup gains `<li class="combobox-elemental-add" role="option">`, hidden unless
  `custom-values` is set and the query is a new value. `add-text` is what it says, `{label}`
  standing in for what was typed. Off by default.

### Changed

- **`<combobox-elemental>` no longer puts `role="alert"` on its validation message.** It was
  announcing twice: the message is already pointed at with `aria-describedby`, and the element
  focuses the field it just refused, so the description is read at the same moment.

  **DOM:** `<p class="combobox-elemental-error">` is written without a `role`; the class, the `id`
  and the `hidden` toggling are unchanged. A combobox that is not the first invalid control now
  waits until the reader reaches it.

## [0.9.0] - 2026-08-16

### Added

- **`<marquee-elemental>`** — a strip that scrolls forever, out of the list you already wrote,
  with the button
  [SC 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
  asks for. Every CSS recipe pauses on `:hover`, which no keyboard has; this writes the button,
  names it for what pressing it will do, and stops on the pointer and on focus as well.

  **The copies are counted against the container rather than hard-coded at two** —
  `⌈(container + gap) ÷ (track + gap)⌉`, capped at 20, none while stopped, recounted on a
  `ResizeObserver` and not rebuilt when the width came out the same, since rebuilding restarts the
  lap. `prefers-reduced-motion` starts it stopped with no copies made.

  `speed` is pixels a second, `reverse` turns it round, `no-controls` takes the button away, and
  `play-text`/`pause-text` are the names. `.play()`, `.pause()` and `playing` are the same switch
  from script; `marquee-toggle` carries `detail.playing`.

  **DOM:** the copies are appended as `[data-marquee-clone]`, each `inert` and `aria-hidden="true"`
  with every `id` inside it stripped; a `<button class="marquee-elemental-control">` last unless
  `no-controls`; `role="list"` written back onto a `<ul>`/`<ol>` track, since `list-style: none`
  takes list semantics away from VoiceOver in Safari. `data-marquee-running` and
  `data-marquee-paused` carry the state.

  **CSS:** everything in `style.scss` is behind `:defined`, so with no script the list wraps as it
  always did. New: `--marquee-elemental-gap`, plus `--marquee-elemental-distance` and
  `--marquee-elemental-duration`, which the element writes; `theme.scss` adds the edge fades and
  the button. The lap is set with `animation-*` longhands and never the shorthand, which would
  take `animation-play-state` back to `running` and undo every pause.

- **`<slider-elemental tooltip>`** — a value bubble that follows the pointer: `thumb`,
  `track`, `thumb track`, or a bare `tooltip` for the thumb. The track number is put on the `step`
  the way the input would, so `min="0" max="100" step="40"` reads 80 at the far end rather than a
  100 the input cannot hold.

  One bubble and not one per thumb, pinned to the thumb being dragged until the release. It is a
  hover, so a touch or keyboard reader never sees it — nothing goes in it that is not already on
  screen or announced.

  **DOM:** one `<output aria-hidden="true" data-tooltip="thumb|track">` appended last, removed
  when the attribute is or the element leaves the page, and excluded from the `outputs` list.
  **CSS:** `--slider-elemental-at` on that bubble, a `0` to `1` ratio; `style.scss` places it and
  `theme.scss` paints it through `--slider-elemental-tooltip-gap`, `-padding-block`,
  `-padding-inline`, `-radius`, `-surface` and `-color`. New selector:
  `slider-elemental > output[data-tooltip]`.

- **`--carousel-elemental-rotate-hover-color`** — the rotation control's foreground under the
  pointer, defaulting to `CanvasText`, which is what it was fixed at before. It takes the countdown
  ring with it. `theme.scss` only.

### Changed

- **`<slider-elemental>`'s thumb follows its fill.** `--slider-elemental-thumb` now defaults to
  `var(--slider-elemental-fill)` rather than `currentcolor`; both still end at `currentcolor`, so a
  page that set neither sees no change and one that set the fill alone now has a matching thumb.

  **The case to check when upgrading:** `--slider-elemental-fill: transparent` now takes the thumb
  with it, so set `--slider-elemental-thumb: currentcolor` on the same rule. A `var()` fallback
  cannot cover it — a fallback fires on an unset property, and `transparent` is a value.

### Fixed

- **`<slider-elemental>` quietly under-delivered `gap` when `step` did not divide it.**
  `step="10"` with `gap="25"` left the pair 20 apart, since the input put the thumb back on the
  nearest notch, which is the one *towards* the other thumb half the time. The thumb now gives way
  to the notch past where the gap lands, which costs at most one notch and cannot be silently
  wrong.

- **`<slider-elemental>`'s thumb never took the page's colour, in any browser.** A thumb
  pseudo-element does not see the page's `color`, so `currentcolor` resolved to the browser's own
  — white in Chromium, mid grey in WebKit. The theme now sets `color: var(--slider-elemental-thumb)`
  on the input and the thumb rules paint from there; `--slider-elemental-focus-color` was resolving
  against the same wrong colour and is fixed by the same line.

  **If you wrote your own thumb rule:** `currentcolor` in it is the value that misbehaves. Set
  `color` on the input and paint the thumb with `currentcolor`, or use a literal.

- **The scrubber example drew its played part with the wrong element.** It was the
  `<progress-elemental>`'s fill, which eases over `--progress-elemental-duration` and trailed a
  quarter second behind every drag; the slider draws the fill now and the bar keeps the rail and
  the buffer. Copy the new CSS if you built a scrubber from the old one.

## [0.8.0] - 2026-08-15

### Added

- **`<slider-elemental>`** — one `<input type="range">` inside it is a slider, two is a range
  whose thumbs cannot pass each other; the count is the markup rather than an attribute. The
  thumbs stay native inputs, so the keys, `step`, touch, submission, `reset` and restore are the
  browser's and there is no `role="slider"`, no `aria-valuenow` and no event of its own. What it
  adds is the fill position no engine but Firefox gives you, and for two thumbs the three things a
  second range input cannot do: sharing a track, stopping short of each other, and a press on the
  track reaching the nearer thumb.

  **DOM:** `role="group"` on the element, and only with two thumbs and an `aria-label` or
  `aria-labelledby` already there; `data-stacked` while both thumbs sit on one value. Nothing is
  moved, wrapped or inserted. **CSS:** `--slider-elemental-start` and `--slider-elemental-end` as
  ratios rather than percentages — a thumb travels from half its own width to half a width short
  of the end, so a bare percentage is off by half a thumb.

  `aria-valuemin` and `aria-valuemax` are deliberately not written on the inputs:
  [HTML-ARIA says authors should not](https://www.w3.org/TR/html-aria/).

- **`<progress-elemental>`** — a native `<progress>` that says where its fill ends, so CSS can
  draw the bar without `::-webkit-progress-value` and `::-moz-progress-bar`, plus the second value
  `<progress>` has never had: `buffer`. The `<progress>` keeps `role="progressbar"`, `max`, the
  indeterminate state and its `<label>`, so the element writes no ARIA at all.

  **DOM:** `data-indeterminate` on the element while the `<progress>` has no `value`, and nothing
  else. **CSS:** `--progress-elemental-value` and `--progress-elemental-buffer`, both percentages,
  both clamped; the value property is *removed* rather than set to `0%` while indeterminate,
  because a bar at zero claims nothing has started and a bar with no value claims nobody knows.

  Every way of moving the bar works — `element.value`, `progress.value` and `setAttribute` —
  because one `MutationObserver` on the child catches all three. It fires no event.

## [0.7.3] - 2026-08-12

### Fixed

- **Cmd/Ctrl-click on a tab opens it in a new tab again.** `<tabs-elemental>` swallowed every
  click on a link-shaped tab, modifier keys included; a modified click now keeps the browser's
  default, as the arrow keys already did.

- **`<tooltip-elemental>` puts the trigger back on disconnect.** In the `for` shape the trigger
  outlives the element and was left describing a bubble that no longer exists, with the `title`
  the upgrade took gone for good. **DOM:** teardown takes only the bubble's `id` out of
  `aria-describedby`, removes the name only where this element wrote it, restores the `title`, and
  removes a bubble generated out of one — an authored bubble stays.

- **A stripped `<carousel-elemental>` gives back the `role` its upgrade wrote.** Emptied or
  disconnected, it kept its own `role="group"`/`region` around a plain list. A role the page
  authored is still kept.

- **A rotating `<carousel-elemental>` no longer resumes while a reader is still in it.** Hover and
  focus each hold the rotation, but either one ending resumed it; resume now waits for both.

- **`<navbar-elemental>` takes its `beforematch` listeners with it on disconnect.** A navbar
  removed and put back added a second set.

- **`import { stepIndex } from 'book-of-elementals'` works again.** `<navbar-elemental>` declared
  its own copy of a name core already re-exports, and to ES modules two declarations under one
  star-exported name silently drop it from the entry. Every subpath import worked; the package's
  own never did.

- Docs search listbox click fix from v0.7.2 now propagates through poops-docs-theme v4.0.2.

## [0.7.2] - 2026-08-10

### Fixed

- **Tapping an option on iOS Safari now picks it.** `<combobox-elemental>` and
  `<suggest-elemental>` — and `<search-elemental>` with them — cancelled `pointerdown` inside the
  popup to keep the caret in the field, which on iOS suppresses the whole synthesised run the
  tap's `click` is the last of. The press is cancelled on `mousedown` instead, which arrives
  before the focus change and before `click`.

- Update poops-docs-theme to 4.0.1, which carries the search results rendering fix from v0.7.1.

## [0.7.1] - 2026-08-10

### Fixed

- **`<navbar-elemental>` no longer takes over a list another custom element wrote.** The row was
  "the first `<ul>` or `<menu>` in the element", so a header with a search field and no links of
  its own adopted the `<suggest-elemental>` results panel as its bar. A list with another custom
  element between it and the navbar now belongs to that element.

  **DOM/CSS:** a navbar whose only list is inside another custom element writes nothing at all —
  no `data-mode`, no `data-navbar-rail`, no `[data-navbar-probe]` copy. A page that wrapped its
  row in a custom element of its own is no longer upgraded: move the wrapper inside the row's box,
  or make it a plain element.

## [0.7.0] - 2026-08-10

### Added

- **`<search-elemental>`** — the query half of a search field: the debounce, the abort, the
  loading state and the announcement. `<suggest-elemental>` has no opinion about where results
  came from, which left every page to rebuild the half that goes wrong quietly — a request per
  keystroke, a slow answer landing after a fast one, a spinner stopped in one branch of two, and
  nothing announced, which is
  [WCAG 2.2 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) unmet.

  **It does not fetch.** `search-query` carries `detail.query`, `detail.signal` and
  `detail.wait(promise)`; the page fetches, fills the panel and hands the promise back. Calling
  `wait()` is what buys the loading state, so a page filtering a list it already has is never left
  with a spinner nothing will stop.

  Attributes: `delay` (200ms), `min` (1 character, `0` to send the empty query), and
  `results-text` with `{n}`, `empty-text` and `error-text` for the live region. **The empty search
  is the page's call:** a search that matched nothing closes the panel if the panel is empty and
  leaves it open if there is anything in it, and the element never writes a "no results" row
  itself.

  **DOM:** `data-state` on itself running `idle` → `pending` → `results`/`empty`/`error`;
  `aria-busy` on the `<suggest-elemental>` inside while a query is out; `open` on that panel; and
  one appended `<span role="status" class="search-elemental-status">`, clipped out of sight.
  **CSS:** `display: block` and `position: relative` on itself, which is the containing block the
  panel needs; the theme adds a spinner on `[data-state="pending"]` at
  `--search-elemental-spinner-inset-inline`/`-block`. With scripting off it is a labelled field in
  a `<form>` that submits to its `action`.

- **`<toolbar-elemental>`** — a row of buttons the arrow keys walk and `Tab` passes in one step,
  per the [APG Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/). Wrap the
  buttons and name the bar with `aria-label`; `vertical` swaps the arrow keys and writes
  `aria-orientation="vertical"`. The ends do not wrap, because `Tab` is how you leave.

  Related controls go in a `role="group"` with its own label and the arrows run straight through
  it; controls are found wherever they sit, so a group or a `<tooltip-elemental>` round a button is
  a layer the walk sees through. Only `<button>` and `<a href>` are walked — a `<select>` or a text
  field wants the arrows for itself — and a `disabled` control is skipped, since focus cannot land
  there; `aria-disabled` is how you keep one reachable and inert.

  **DOM:** `role="toolbar"` on itself, `aria-orientation="vertical"` only when `vertical` is set,
  and `tabindex` on every button and link inside.

- **`<suggest-elemental>`** — a list of links a text field drives with the arrow keys, per the
  [APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox popup.
  Give it a `<ul>` of `<a>` and point it at an input with `for`; only `<a href>` becomes an option,
  and replacing the list's contents re-marks them, so there is no refresh to forget.

  It fetches nothing, filters nothing, ranks nothing and announces no count. `open` is reflected
  and settable, so the thing that owns the query is the thing that shows the panel.
  `tab-completes` opts Tab into taking the row under the cursor — off by default, because these
  rows are links and a Tab that took one would navigate off the page.

  **DOM:** `role="listbox"` and an `id` on itself, `role="option"` and an `id` per link,
  `role="presentation"` on the list boxes, `data-active` on the row under the cursor, and
  `data-side`/`data-align` for which corner had room — no coordinates, so the panel stays inside
  your layout. On the field: `role="combobox"`, `aria-controls`, `aria-autocomplete="list"`,
  `aria-expanded` and `aria-activedescendant`. With scripting off it is a list of links, in flow.

  Not `<combobox-elemental>`, which is a view of a `<select>`: those options carry
  `aria-selected` and hold a value, these are destinations.

- **`<carousel-elemental>` takes `position-text`, `roledescription-text` and
  `slide-roledescription-text`** — the last three strings it said in English with no way out.
  `position-text="{n} od {total}"` is `3 od 10`; the other two are `aria-roledescription`, which is
  [author-localized by definition](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription).

  The whole sentence rather than the word between the numbers, because `of` between two numbers is
  English's shape as much as its word — Japanese counts the other way round. Whitespace is refused
  rather than written, and an empty value falls back to the English. That closes the set: every
  word this element says out loud is now an attribute, nine of them, and every default is
  unchanged.

### Changed

- **`slide-text` and `remove-text` take a `{…}` placeholder, so the word order is the page's and
  not English's.** Both used to append the number or the label after a space, which no translation
  can reach — Hungarian numbers a slide `3. dia`, German removes one with the verb last.
  `slide-text="{n}. dia"` and `remove-text="{label} entfernen"` say where the half goes; a value
  with no placeholder still appends exactly as before. No DOM or CSS change.

- **`<carousel-elemental>`'s rotation control is drawn, opaque, and counts down.** It was `▶` and
  `⏸` typed as text on a button whose `Canvas` fill lost a specificity fight — the pause glyph is
  missing from enough system fonts to come out as a box, a typed glyph sits wherever its designer
  centred it, and a white icon over a white sky is a control nobody can find.

  **DOM and CSS:** the control holds an inlined [Octicon](https://primer.style/foundations/icons/)
  `<svg>` where it held a character; the element writes `data-carousel-rotating` on itself while
  the timer runs, plus an inline `--carousel-elemental-tick` carrying the interval, which is what
  the ring is animated over. The ring is the button's border — a conic gradient clipped to the
  border box over a fill clipped to the padding box — with `--carousel-elemental-chip` as that
  fill and `--carousel-elemental-ring` its thickness; the theme's shared hover no longer reaches
  this button. Under `prefers-reduced-motion: reduce` the ring does not sweep.

- **A `fade` carousel is as tall as the slide showing, and travels between the two heights.** It
  used to be as tall as the tallest slide, so a stack of uneven slides carried white space under
  every short one for the life of the page.

  **DOM and CSS:** the slides are no longer a grid — the current one is the only one in flow and
  the rest are `position: absolute` in a now-`relative` scroller. During a swap the element writes
  an inline `height` on the scroller and removes it when the transition lands. A page that wants
  the old behaviour gives its slides a `min-block-size`. `--carousel-elemental-fade` times both,
  neither runs under `prefers-reduced-motion: reduce`, and `swapHeight` is exported.

- **`<combobox-elemental>` groups its options with weight and an indent instead of a hairline**,
  and an `<optgroup>` label now sticks to the top of the popup while its options are on screen.
  **CSS:** theme only — `.combobox-elemental-group-label` drops `font-size` and `color` and is
  `font-weight: 700`, the `border-block-start` rule is gone, and
  `.combobox-elemental-group .combobox-elemental-option` carries a `padding-inline-start` of
  `2.5 × --combobox-elemental-inset`. A page that wants the line back sets the border itself.

- **`<tooltip-elemental>` centres its bubble on the trigger at every width, and never outside the
  viewport.** It used to centre only on a control wider than the bubble, which puts an icon button's
  one-word bubble off to one side; the edge fallback was also handed back unchecked, so a tooltip at
  the very edge of the screen could be positioned at a negative coordinate.

  **The dependency floor moves to `book-of-spells@^2.1.0`** for `placeFlyout`'s fifth argument. On
  2.0.0 that argument does not exist and the call degrades to edge alignment, so the floor is the
  version, not the caret.

- **One hover tint across the book.** Every optional theme now mixes `currentcolor` at 10%, which
  is what `menu`, `tabs` and `carousel` already used; `--navbar-elemental-hover` was 4% and
  `--copy-elemental-hover` was 8%. Both are custom properties, so a page that liked the old value
  re-declares one line.

- **`<combobox-elemental>` filters through `matchesSearch` from book-of-spells**, which moves the
  floor to **`book-of-spells@^2.0.0`**. Typing finds more than it did in one direction only — `Þ`,
  `ẞ`, `Ŋ`, `ı`, `Ŧ` and `Ǥ` fold now — and nothing that matched before stops matching.

  **`fold` and `matchesQuery` are no longer importable from `book-of-elementals/combobox`**, and
  `fold` no longer exists anywhere: the stroked letters it worked around are handled inside
  `removeAccents` itself. Anything reaching for either wants `matchesSearch` from book-of-spells.

- **`<carousel-elemental>` reads its `fade` swipe with `swipe()` from book-of-spells.** Forty
  pixels across and further across than down still moves one slide, the mouse is still refused, and
  the DOM, roles and CSS hooks are untouched. Newly observable: in `fade`, the scroller dispatches
  `swipestart`, `swipeend` and `swipe`, and the exported `swipeStep` takes a direction —
  `swipeStep('left', rtl)` — rather than a pair of pixel deltas.

- **A page with a `<modal-elemental>` reserves the scrollbar gutter, so opening one no longer
  shifts the page behind it.** **CSS:** `style.scss` adds
  `html:has(modal-elemental) { scrollbar-gutter: stable }`, from first paint rather than with the
  open dialog, since a gutter arriving with the modal is the same jump the other way. A page short
  enough not to scroll now shows an empty gutter; `html { scrollbar-gutter: auto }` takes it back
  along with the shift. Safari before 18.2 behaves as it did.

### Fixed

- **The `<script>`-tag bundle was missing three of the elements it claims to hold.**
  `<carousel-elemental>`, `<suggest-elemental>` and `<toolbar-elemental>` were in the ES-module
  entry and the stylesheets and silently absent from `dist/book-of-elementals.js`. Anyone loading
  the per-element bundles was unaffected.

- **The first `<suggest-elemental>` sample no longer loads the docs site into its own preview.**
  Its rows were relative urls in a `srcdoc` frame with no url of its own; they carry
  `target="_blank"` now. The sample also filters as you type — typing did nothing before, which is
  correct for an element that does not filter and impossible to tell from broken.

- **The in-page samples no longer space an element's own rows like prose.** The docs theme gives
  every `<li>` `0.25rem` of margin, which inside a popup is dead space the pointer falls into. The
  rule keys off `li[role]`, so rows an element marked lose the margin and rows an author wrote keep
  it. Docs only.

- **`<tooltip-elemental>` no longer paints the bubble before it upgrades, in the `title` shape.**
  A trigger with a `title` had its words on screen twice between parse and upgrade. The rule keys
  off `:has(> [title])`, so the other shape — where the sentence is the whole fallback — is
  deliberately left visible.

- **The sidebar drawer example no longer slides itself shut on load, and Escape no longer closes
  its rail.** The transform transition was live from the first frame, so a late script animated the
  gap between the drawn rail and the closed drawer; and the page's light dismiss had no breakpoint
  test, so Escape above the breakpoint closed a rail nothing could reopen. Both were the page's to
  get wrong rather than the element's, and `<disclosure-elemental>` is unchanged — but the example
  is what gets copied.

## [0.6.0] - 2026-08-07

### Added

- **`<carousel-elemental>`** — a row of slides you scroll through, per the
  [APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): previous, next, a
  picker with one button per slide, and with `autoplay` a timer and the control that stops it.

  **The scroll container is the state** — no transform engine, no cloned slides, no index to keep
  in step: the slides sit in a scroll-snapping list and which one is current is geometry. That is
  what makes it responsive for nothing, and why there is no key handler either, a focused scroll
  container already answering the arrows and page keys.

  **The arrows stop at the ends and say so before you press them**, from the scroller's own answer
  to "is there anywhere left to scroll" rather than arithmetic on the index — which is the only
  version that holds with more than one slide on screen. The element carries the same fact as
  `data-carousel-at-start`/`data-carousel-at-end`. The rotation is the one thing that wraps.

  **`fade` is the other mode**, and the only one where the scroller is not the state: the slides
  stack and cross-fade, the element holds the index, and the stylesheet draws from
  `data-carousel-current`. Hidden slides are `visibility: hidden`, so they leave the accessibility
  tree — which is the case the APG writes its live region for, and `fade` gets one. `fade` also
  reads a touch swipe, since a stack is not a scroll container: forty pixels across and further
  across than down, touch and pen only, no wrap at the ends.

  **DOM:** on a `<ul>`/`<ol>`/`<menu>` of `<li>` slides — `aria-roledescription="carousel"` and
  `role="region"`/`"group"` on itself, `role="group"` on the list and each slide with
  `aria-roledescription="slide"` and an `N of M` label, `data-carousel-current` on the slide
  showing, an appended `<div data-carousel-controls>` holding previous, picker and next, and a
  prepended `<button data-carousel-rotate>` under `autoplay`. The list gets `tabindex="0"` only
  when nothing inside the slides is focusable, and fewer than two slides leaves the markup alone.
  **CSS:** new `carousel.css` and `carousel-theme.css` bundles and `book-of-elementals/carousel`
  export paths. Slides are `box-sizing: border-box`, and the scrollbar is hidden through a
  selector the element only writes once upgraded.

  Refusals: no mouse drag, no vertical axis, no `slides-per-page` — that is one custom property —
  and no infinite loop, which was measured rather than assumed: cloning puts every slide in the
  accessibility tree two or three times, and the clone-free version leaves the reading order
  `4 5 1 2 3` and drops focus out of any slide it moves.

  Two worked versions ship as examples: [card-row](examples/card-row.html), a shelf that bleeds
  past its text column, and [lightbox](examples/lightbox.html), a gallery opening
  `<modal-elemental>` with this element inside it in `fade`. It supersedes
  [slidescroll](https://github.com/stamat/slidescroll) and
  [slideswap](https://github.com/stamat/slideswap), which will be archived.

- **A versioning section in the README.** What a major is spent on is the markup an element writes
  and the hooks a stylesheet reaches for; the themes are explicitly not covered, since they are one
  look meant to be replaced — the custom properties they read are covered and the values are not.

- **`script/a11y` fails on a reference that points at nothing** — `aria-controls`,
  `aria-labelledby`, `aria-describedby` or `aria-activedescendant` naming an id no element has. axe
  answers "unable to determine" for these, so a typo failed no run on any element. Nothing in the
  book was dangling; the check went in green.

### Changed

- **The a11y sweep says what it could not decide, and why.** "Needing review" was a bare count per
  rule; the 88 contrast checks are four different situations, three of them permanent, and they are
  now grouped by reason. The header comment also stops implying the sweep settles contrast once a
  page restyles.

## [0.5.1] - 2026-08-05

### Fixed

- **`<accordion-elemental class="grouped">` drew every seam twice as dark as the card's outer
  edge.** The theme's border is mixed out of `currentcolor` and so translucent, and the run pulled
  neighbouring panels onto each other by a pixel to share one.

  **CSS:** in `accordion/theme.scss` under `.grouped` only — `> details + details` no longer
  carries `margin-top: -1px`, and every panel after the first drops its own `border-top` instead. A
  page overriding that rule to restore the overlap will now stack a border on a border.

### Changed

- **The elementals have an index page.** `elementals/index.html` is what the sidebar's "Elementals"
  section points at, and the home page loses its copy of the table, since the same list in two
  places is two lists to keep in step. Docs only.

## [0.5.0] - 2026-08-05

### Added

- **`<modal-elemental>`** — a native `<dialog>` opened with `showModal()`, per the
  [APG Modal Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). The top
  layer, the `inert` page behind, the focus that goes in and comes back, <kbd>Escape</kbd> and
  nesting all come from the platform, so there is no parent tracking and no focus trap here.

  What it adds is what the platform leaves: an **exit animation**, which otherwise needs the
  `overlay` property Firefox and Safari lack — bounded by what the animation says about itself and
  by two seconds whatever it says, since a stalled transition must not leave a modal nobody can
  close; a **backdrop click**, which otherwise needs `closedby` Safari lacks; the page behind not
  scrolling; one sheet of dim rather than one per modal; `aria-labelledby` pointed at the first
  heading; and the cross in the corner.

  Triggers are HTML's own `command="show-modal"` and `commandfor`, handled by the element rather
  than the browser, which is what makes the close animated and polyfills them for free.
  `<a href="#id">` opens one too, and a `showModal()` called on the `<dialog>` itself is picked up,
  animated, counted in the backdrop stack and given the scroll lock. `closedby` takes HTML's three
  values, and `close-others` replaces the stack instead of adding to it. Closing pauses `<video>`
  and `<audio>` inside and reloads every `<iframe>`.

  **DOM:** inside the `<dialog>` as its first child, a
  `<button type="button" class="modal-elemental-close" command="request-close">` named by
  `close-text`, written unless `closedby="none"` — first child so reading order, tab order and
  where it is drawn agree, which also makes it where focus lands. On the `<dialog>`: a generated
  `id`, `aria-labelledby` if it had no name, `data-state="open"`/`"closing"`, and `data-depth`. A
  `closedby` written on the `<dialog>` is **moved up** to the `<modal-elemental>`, since a browser
  supporting it natively would light-dismiss instantly with a `cancel` event that
  [cannot be prevented](https://html.spec.whatwg.org/multipage/interactive-elements.html#light-dismiss-open-dialogs).
  A bubbling `modal-toggle` carries `open`, `dialog` and `depth`.

  **CSS:** `style.scss` styles `modal-elemental > dialog`, its `::backdrop` and
  `.modal-elemental-close`, and sets `overflow: hidden` on the root while a modal is open — the one
  rule in this book that touches the page around an element, because `inert` never stopped a wheel.
  The dim is in `style.scss` rather than the theme, since the APG only lets a dialog call itself
  modal when the page behind is obscured as well as inert.

  **Degrading:** with no script, `<a href="#id">` still reaches the dialog, shown in the flow of the
  page rather than `display: none`. It replaces [modally](https://github.com/stamat/modally), now
  deprecated.

- **`<copy-elemental>`** — a real `<button>` that writes text to the clipboard and announces it.
  Every copy button swaps an icon or floats a "Copied!" tooltip and neither reaches a screen
  reader, which leaves
  [WCAG 2.2 SC 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html) unmet.

  `for` names the element to copy — a field by its `.value`, anything else by the text it shows,
  with leading newlines and trailing whitespace stripped so a code block does not paste a command
  that runs itself. `value` is literal text, never trimmed, and wins over `for`. Naming nothing, or
  a `for` pointing at nothing, is reported rather than quietly writing an empty string over the
  reader's clipboard.

  **DOM:** one `<span role="status" class="copy-elemental-status">` appended at upgrade — a live
  region only announces text arriving in one already in the document. On the element,
  `data-state="copied"`/`"error"` for two seconds after a press and `data-unavailable` where there
  is no clipboard API; on the button, `type="button"` if it had none. A bubbling `copy-done`
  carries `detail.ok` and `detail.text`. **CSS:** `style.scss` keeps the button out of reach until
  the element has upgraded and found `navigator.clipboard`, which does not exist over plain
  `http`.

- **`<checkbox-group-elemental>`** — the "select all" over the checkboxes it stands for, per the
  [APG Checkbox (Mixed-State) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/). The
  dash is `HTMLInputElement.indeterminate`, which has no HTML attribute behind it and can only be
  set from script — that is the whole of the gap. It is purely visual, so give the parent no
  `name`.

  Pressing it cycles mixed → all on → all off → **back to the combination the children were last
  mixed in**, so a partial selection survives a press. A disabled checkbox is outside the set: never
  moved and never counted. Every child that moves fires `input` and then `change`. One level, not a
  tree.

  **DOM:** nothing is moved, wrapped or given an attribute it did not have. On the parent checkbox
  it sets the `checked` and `indeterminate` properties; on itself, `data-state="all"`/`"some"`/
  `"none"`. No `role` and no `aria-checked` anywhere, since a native checkbox with `indeterminate`
  set is already announced as mixed — which is where this parts company with the APG's own example,
  deliberately, that one paying for a `<div role="checkbox">` with the label association, the focus
  ring, `Space`, `disabled` and submission.

  **CSS:** `checkbox-group-elemental[data-state]`, `input:indeterminate`, and eight
  `--checkbox-group-elemental-*` properties in the optional theme, which draws the checkbox itself
  because `accent-color` recolours the browser's box and can say nothing about its size, corners or
  weight. **Degrading:** the stylesheet hides the parent until `:defined`, which reaches a direct
  child and no further; writing `hidden` on the parent does the same job at any depth, and the
  element removes it on upgrade.

- **`styles/checkbox.scss` — the drawn checkbox, for any checkbox.** **Opt in with a class** on a
  container, never a bare `input[type="checkbox"]` selector: importing this book's theme for an
  accordion must not silently redraw every checkbox on the page.

  ```html
  <label class="checkbox-elemental"><input type="checkbox" /> Remember me</label>
  ```

  New exports `book-of-elementals/checkbox.scss` and `/checkbox.css`, plus
  `dist/book-of-elementals-checkbox.css` for the CDN; `checkbox-group/theme.scss` brings it in
  already. Its eight `--checkbox-elemental-*` properties are declared on nothing and live in the
  `var()` fallbacks, deliberately — a property set on an element beats one inherited, so declaring
  them would leave a group inside a tuned form wearing the shipped size.

- **`<combobox-elemental>`** — a native `<select>` given a text field to search it with, per the
  [APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). The `<select>` stays
  the control — it holds the value and submits under its own `name`, and `required`, `disabled`,
  reset, restore and `<fieldset disabled>` are the browser's — so the element has no event of its
  own. `multiple` adds a chip per selection, a remove button on each and `Backspace` on an empty
  field. Attributes: reflected `open`, `placeholder`, `empty-text`, `remove-text`.

  The search matches anywhere in a label and folds on both sides, so `cacak` finds Čačak,
  `strasse` finds Straße, and `бео` still finds Београд, which `slugify` would have reduced to an
  empty string.

  **Validation:** the browser's `invalid` bubble is cancelled and its message kept, since the
  bubble would point at a control the reader cannot see. The text goes into a `role="alert"` under
  the field, the field takes `aria-invalid` and an `aria-describedby`, and focus lands there for
  the first invalid control in the form only.

  **DOM:** this one builds markup. Inserted before the `<select>` — so a `<label>` around the
  element names the field — a `<div class="combobox-elemental-field">` holding the chips, an
  `<input role="combobox">` and, on a single select, an `aria-hidden` indicator button; a
  `<ul role="listbox" class="combobox-elemental-list">` of `<li role="option">` with `<optgroup>`s
  becoming a nested `<ul role="group">`; and a `<p class="combobox-elemental-error" role="alert">`.
  On the `<select>`: `class="combobox-elemental-native"`, `tabindex="-1"` and `aria-hidden="true"`.
  An explicit `<label for>` is re-pointed at the field, and all of it is undone on disconnect.

  **CSS:** `combobox-elemental[open]`, the `combobox-elemental-*` classes, `[data-active]` for the
  cursor and `[aria-selected]` for what is chosen — drawn differently on purpose — `[aria-invalid]`,
  `[data-side]`, and nine `--combobox-elemental-*` properties in the theme. The `<select>` is
  hidden by being transparent and un-clickable rather than by `display: none`, deliberately: a
  `display: none` control that is `required` blocks its own form. Restyle that rule and keep it
  rendered.

- **`<segmented-elemental>`** — one choice out of a few, drawn as a track with a knob that slides
  under the checked segment. The segments are native `<input type="radio">` inside `<label>`s, so
  the arrow keys, `Tab` in and out once, submission, `required`, reset and restore are the
  browser's; the element writes no roles and has no event of its own.

  **DOM:** nothing moved or wrapped. On itself, `--segmented-elemental-index`,
  `--segmented-elemental-count`, a matching `data-index`, and `role="group"` — that last only where
  the element carries an `aria-label` or `aria-labelledby` and no role of its own.

  **CSS:** `segmented-elemental[data-index]`,
  `segmented-elemental > label:has(> input:checked)`, and thirteen `--segmented-elemental-*`
  properties in the theme. The knob hangs off `data-index`, so no script and no selection both come
  out as no knob rather than a knob on the first segment. The focus ring is in `style.scss`, since
  the radio it belongs to is a hidden pixel.

- **`<tooltip-elemental>`** — a description shown on hover and on focus, wired to the control it
  belongs to, and still a plain sentence on the page when the script never arrives. The
  [APG's pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) says of itself that it "does
  not yet have task force consensus", so this ships the half every source agrees on:
  `aria-describedby` to the words, <kbd>Escape</kbd> to dismiss, no timeout, and a bubble the
  pointer can rest on, per
  [WCAG 2.2 SC 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html);
  never the control's name, and nothing at all on touch.

  Two shapes and nothing to select between them: wrap a control and its words, or write the words
  alone with `for`. A `title` is read when there is nothing else to say and the attribute is
  removed, becoming the control's description when it had a name and its name when it did not.
  `horizontal` puts the bubble beside the control, and is the only placement knob — the axis is the
  author's, the side is the viewport's.

  **DOM:** on the bubble, `role="tooltip"`, an `id` if it had none, `hidden` between showings,
  `data-side`, `data-align`, `top`/`left` in viewport pixels, and
  `--tooltip-elemental-arrow-offset` — the middle of the trigger measured from the bubble's own
  start edge. On the trigger, `aria-describedby` appended to any it had, or `aria-label` in the
  `title`-was-the-name case. The bubble is hidden rather than emptied, because `aria-describedby`
  reads hidden content.

  **CSS:** `tooltip-elemental [role="tooltip"]` with its `data-side` and `data-align`, and ten
  `--tooltip-elemental-*` properties declared on `tooltip-elemental` itself at one type selector's
  specificity. It is `position: fixed` against the viewport, so it is not clipped by anything
  scrolling between it and its trigger. The fade needs `@starting-style` and
  `transition-behavior: allow-discrete`, so Safari 17.0–17.4 shows it without fading.

### Changed

- **The shared maths moved to [book-of-spells](https://github.com/stamat/book-of-spells) 1.5.0**,
  which is now the minimum. `ElementBase`, `define`, `nextIndex`, `typeAheadIndex` and the
  `placeFlyout`/`placeSubmenu` pair were wanted by both libraries; `src/core.js` re-exports them, so
  every import path in this package is unchanged.

### Fixed

- **`<combobox-elemental>` no longer makes iOS zoom the page in on focus.** iOS Safari zooms in on
  any text field computing under 16px and leaves the page zoomed afterwards. **CSS:** the input's
  `font-size` is `max(16px, 1em)` — `16px` and not `1rem`, because the threshold is absolute.
  Nothing changes on a page already at 16px or larger; override `.combobox-elemental-input` if you
  would rather have the page's size and the zoom.

- **`<disclosure-elemental>` no longer overshoots on opening.** The slide measures the region under
  an `overflow: hidden` it sets itself, which makes it a block formatting context, so a first or
  last child's margin counted inside the measurement and collapsed back out at rest.

  **CSS:** `.disclosure-elemental-region` is now `display: flow-root`, so margins on the region's
  own children no longer collapse through it into the page — put the gap on the region if you were
  relying on that. The rule skips table display types and carries a single class's specificity.

- **`<disclosure-elemental>`'s gap no longer closes after the panel has gone.** The region's margin
  was zeroed on `[hidden]`, which cannot land until the close slide is over, so the gap took a
  second quarter-second of its own.

  **DOM:** the region carries `data-state="open"`/`"closed"`, flipped with the click rather than
  the slide, and it reaches regions `for` puts out of the button's reach. **CSS:** `margin: 0`
  moved from `[hidden]` to `[data-state="closed"]`; `padding`, `border` and `box-shadow` stay on
  `[hidden]`.

## [0.4.0] - 2026-08-04

### Added

- **`<navbar-elemental>` takes `min-bar-items`.** A bar keeps being a bar until nothing at all
  fits, and the stop before that is one link beside a **More** button — a drawer wearing a bar's
  clothes. `min-bar-items="2"` says two links have to fit or this is a drawer; the default is `1`,
  which is what the element has always done.

### Changed

- **The hamburger turns into an X while the drawer is open**, in two beats — the bars converge as
  the middle one fades, then the icon spins as the remaining two cross — unwound in the other order
  on close.

  **DOM:** the element writes `<span data-navbar-bars aria-hidden="true">` as the first child of
  `[data-navbar-toggle]` and removes it on disconnect; a toggle you styled yourself is unaffected
  unless it styles `:first-child`. **CSS:** `--navbar-elemental-bar-thickness` (`2px`) and
  `--navbar-elemental-bar-gap` (`0.35em`) are new, `--navbar-elemental-hamburger-size` is now the
  icon's width rather than a square, and the animation is off under `prefers-reduced-motion`. A
  toggle holding nothing but the icon is a square now, since the icon is two pixels tall and the
  hover backdrop was the shape of a hyphen.

- **One hover backdrop, everywhere.** `--navbar-elemental-hover` is 4% rather than
  `currentcolor` at 10%, which was a shade heavier than the icon buttons a header usually has
  beside the navigation. A page that had matched the old value by hand is the case to look at.

- **The drawer hangs off the bar instead of floating under it.** Theme only: no top border and no
  top corners, and `max-block-size: calc(100dvh - 100%)` with `overflow-y: auto`.

  **CSS:** the drawer is clipped along its own top edge (`clip-path: inset(0 -100vmax -100vmax)`),
  which is also the open and close animation — the bottom inset walks from `100%` to `0`, so the
  drawer is uncovered from under the bar rather than travelling over it. If you were painting
  something out of the drawer's own box on purpose, that is the case that changes. A bar drawing
  its own bottom border needs one pixel back:

  ```css
  navbar-elemental[data-mode="stack"] .rail > ul:not([data-navbar-probe]) {
    margin-block-start: 1px;
  }
  ```

### Fixed

- **On a page with no global `box-sizing` reset, `<navbar-elemental>` and `<menu-elemental>` items
  overhung the box they sit in.** Both themes size an item with `width: 100%` and then pad it, so
  under `content-box` each navbar label ran a rem into the next and every menu item hung out of the
  panel. **CSS:** `li > a` and `li > button` now say `box-sizing: border-box` themselves.

- **The overflow button could end up half under whatever sat beside the bar.** The measured copy of
  the row is built with its panels removed and `aria-expanded` written later, so nothing in it said
  "this button opens something" and every trigger measured a caret narrower than the button it
  stood for — about fifty pixels missing across three triggers. The copy's triggers now carry
  `aria-expanded="false"` from the moment they are made.

  **Worth knowing if you theme this yourself:** anything you draw on a trigger has to be drawn on
  the copy too, or it is width the measurement cannot see.

- **`<navbar-elemental>` with `hover` closed the panel you were pointing into**, which made every
  hover panel unreachable by pointer. The rule read the control under the cursor, and a link inside
  a panel opens nothing; it now reads the row item the pointer is inside, however deep.

- **`<navbar-elemental>` no longer gives the page a horizontal scrollbar.** The measured copy is
  deliberately wider than its box — that overhang *is* the measurement — but nothing clipped it, so
  it counted toward the document's scrollable width and a header whose links did not fit handed the
  whole page a sideways scroll.

  **CSS:** the rail is now `overflow: clip` with an `overflow-clip-margin` of half a rem — `clip`
  rather than `hidden` because `hidden` makes a scroll container, which cuts the focus ring off
  every link in the row, and the margin has to be on both axes since Chrome honours it only then. A
  page painting something out of the rail's own box on purpose is the case that changes; the clip
  cannot go on the copy instead, since clipping an observer's root stops Chrome re-measuring when
  the bar grows.

## [0.3.0] - 2026-08-03

### Added

- **`media` on `<disclosure-elemental>`.** A media query that owns `open`: the region is held open
  while it matches and closed when it stops, so a navigation rail that becomes a drawer is one
  attribute rather than a `matchMedia` listener per page.

  ```html
  <disclosure-elemental for="sidebar" media="(min-width: 60rem)"></disclosure-elemental>
  ```

  Crossing lands instantly rather than sliding, since a breakpoint change is the layout being
  rearranged. Within one side of a breakpoint the button still toggles normally. It replaces the
  usual trick of showing the panel in a media query and hiding the button, which leaves
  `aria-expanded="false"` on a panel that is visible.

  **DOM:** with `media` set, `data-mode="pinned"`/`"free"` on **itself and on the region**, removed
  from both on disconnect or when `media` is dropped. Nothing is written without it. `open`,
  `aria-expanded` and `hidden` behave exactly as before. `data-mode` is there so a stylesheet does
  not restate the breakpoint in a language that cannot check it — and because it only arrives at
  upgrade, it doubles as the progressive-enhancement guard.

- **`<tabs-elemental>`** — the [APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/),
  horizontal or vertical, written on the markup the page would have had anyway: a list of in-page
  links and the sections they point at.

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

  Which panel belongs to which tab is the tab's own `#fragment`, or its `aria-controls`, or failing
  both the child in the same position — the fragment being the one worth writing, since it is a
  working link before the element upgrades and after it fails to.

  **Keyboard:** the strip is one tab stop, the arrows do the rest on the strip's own axis, `Home`
  and `End` go to the ends, and the selection follows the focus unless `manual` is set.

  **DOM:** `role="tablist"` and `data-tabs-list` on the list, `role="none"` on its `<li>`s,
  `role="tab"` with `aria-selected`, `aria-controls` and a roving `tabindex` on each tab, and
  `role="tabpanel"` with `aria-labelledby` and `data-tabs-panel` on each panel; ids generated where
  the markup had none. Nothing is wrapped or moved. `selected` on the host is the single source of
  truth and is reflected; changes fire a bubbling `tabs-select` carrying `{ tab, panel, index }`.

  **CSS:** the element is `display: grid` with every panel in the same cell — the one layout it
  insists on, since panels laid out one after another mean a page that jumps by the height of the
  last one on every change. Panels that are not showing use `hidden="until-found"`, so find-in-page
  searches them and finding one selects its tab. The theme marks the selected tab with a border on
  the strip's own rule rather than a bar that slides.

- **`<navbar-elemental>`** — the
  [APG Disclosure Navigation pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/):
  a site's row of links, the panels some of them open, and the two ways such a row gets out of its
  own way.

  **The breakpoint at which links fold away is measured rather than declared** — an
  `IntersectionObserver` reports which items are not entirely inside the row, and those reappear
  under the overflow button one at a time. What is observed is a *copy* of the row, because an
  observer watching the box it is also changing is an infinite loop. `media` is the separate
  question of when the whole bar becomes a drawer, and stays a query because nothing the element
  does can change the width of the window.

  **Markup it asks for:** a box around the list — the rail — which is where the measured copy goes;
  it could not be created for you without breaking every selector written against the list's
  parent. Three optional hooks: `data-navbar-more` on the last `<li>` is the overflow item,
  `data-navbar-toggle` on a button opens the drawer, and `data-navbar-stack` marks an item as the
  drawer's alone.

  **DOM:** `data-mode="bar"`/`"stack"` on the element, `data-overflowing` while some but not all
  links are behind the overflow button, `data-navbar-rail` on the rail and `data-navbar-probe` on
  the copy, `data-overflow` on an item that did not fit, and `type`, `aria-controls` and
  `aria-expanded` on every trigger and on the toggle. A closed panel carries `hidden` on the bar and
  `hidden="until-found"` in the drawer. `open` is the drawer's state, reflected; every panel fires a
  bubbling `navbar-toggle` carrying `{ panel, open }`. **No `role`, anywhere** — these are links to
  pages, and `role="menuitem"` replaces link semantics; `<menu-elemental>` remains the one for
  commands.

  **Keyboard:** the APG's table including the rows it marks optional. The arrows do not wrap,
  because off the end of the bar is where the rest of the page is. `hover` adds the pointer to the
  ways a panel opens, never as a replacement, never on touch, never in the drawer.

  **CSS:** the element's own stylesheet places the lists and builds the rail — no colours, no
  borders, nothing about the bar around the row, which is what `data-mode` is for. Panels stay on
  screen through CSS anchor positioning rather than script, so nothing above a panel may be
  `position: relative` or a container. **One trap:** do not key anything that changes the bar's own
  width off `data-mode`, or taking a button off the bar gives the links room, which puts the button
  back, which takes it away again.

- **`<switch-elemental>`** — the [APG Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/):
  an on/off setting that takes effect the moment it is flipped, on a real `<button>` — which is
  where `Space`, `Enter`, focus and the disabled state come from.

  **DOM:** `role="switch"` and `aria-checked` on the button, plus `type="button"` if the markup did
  not set one. Nothing is wrapped or moved. `checked` on the host is the single source of truth and
  is reflected, so `[checked]` is a styling hook; changes fire a bubbling `switch-toggle` carrying
  `{ checked }`.

  **Forms:** give it a `name` and it submits as a checkbox does — the `value` (default `on`) while
  checked, nothing while unchecked — and resets and restores too. That is `ElementInternals` rather
  than a hidden `<input>`, which would be a second node holding the same boolean. Safari only got
  `attachInternals` in 16.4; without it the switch does not submit and nothing else changes. Two
  things send you to `<input type="checkbox" role="switch">` instead: needing no JavaScript at all,
  and being labellable by a `<label>`, which a `<button>` is not.

  **CSS:** the element is `display: contents`, so dropping it around an existing button changes no
  layout, and with scripting off the button is hidden — a switch that silently does not switch is
  worse than no switch. The theme draws a pill whose knob slides and whose track fills, everything
  mixed out of `currentcolor` bar the knob's checked fill, which defaults to `Canvas`. Knob size
  and travel are derived from `--switch-elemental-width` and `--switch-elemental-height`, and the
  theme sets its properties on `switch-elemental` itself, so an override has to reach the element.

- **`<disclosure-elemental>`** — the
  [APG Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): a real `<button>`
  wired to a region it shows and hides. `<details>` wins wherever the region can live *inside* the
  trigger's element; this is for where it cannot — a `<figcaption>`, a table row, a grid item, a
  panel on the other side of the page.

  **DOM:** nothing wrapped, nothing moved — `aria-expanded` and `aria-controls` on the button,
  `hidden` on the region, and `type="button"` on a button that had no type. `open` is reflected and
  every change fires a bubbling `disclosure-toggle` carrying `{ region, open }`. `for` is read bare
  or as `data-for`; without it the region is the button's next element sibling. A closed region uses
  `hidden="until-found"`, so find-in-page reaches it and `beforematch` opens it.

  **CSS:** the region slides on `--disclosure-elemental-duration` and
  `--disclosure-elemental-easing`, read back out of the computed styles, so the stylesheet times the
  animation — including to nothing. `hidden` therefore lands at the *end* of a close, while
  `aria-expanded`, `open` and the event all change immediately. **The region is the animated box, so
  it must not be padded or bordered** — block padding is a floor `height: 0` cannot get under. Put
  the inset on a box inside the region.

  The element is `display: contents`, and with scripting off the region is visible and the button is
  not offered.

- **A [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)** at
  `dist/custom-elements.json`, generated from each element's JSDoc and pointed at by the
  `customElements` key in `package.json` — which is what editors read for attribute autocomplete.
  It ships twice: the cumulative file, and `dist/elementals/<name>-manifest.json` exported as
  `book-of-elementals/switch/manifest`, both out of a single analyzer pass so they cannot disagree.

  One deliberate omission: `--switch-elemental-inset`, `--switch-elemental-knob-size` and
  `--switch-elemental-travel` are `calc()`-derived and are not tagged. The manifest is the curation
  — anything in it is something a reader is invited to change.

- **Live samples in the docs**, and a **demo can be more than one fence.** Twelve code samples are
  editable previews rather than static fences, with an **Options** tab generated from that element's
  `custom-elements.json`. A sample opts in with `<!-- demo switch -->`, and `script/demos.js` wraps
  the marked html fence plus any fence under it whose info string says `demo`. The sample stays an
  ordinary fence in `docs/`, so it is still real HTML to read and copy. Docs only.

- **Site navigation and sidebar drawer examples**, building a whole header around
  `<navbar-elemental>` and the docs sidebar around `<disclosure-elemental>` and its `media`
  attribute. Both cover what is the page's rather than the element's — a call to action that lives
  in the markup twice, sliding on `transform` instead of the region's height, capping the panel at
  the viewport. Docs only.

### Changed

- **The optional accordion theme styles a heading inside a `<summary>` as inherited type.** Putting
  a heading there is what gives screen reader users something to navigate an FAQ by, and until now
  the page's `h2`/`h3` styles restyled the header row and pushed the caret onto its own line. An
  override of your own is now redundant rather than wrong.

### Fixed

- **A closed region no longer paints a shadow into the page.** The stylesheet already zeroed the
  region's margin, padding and border while `hidden`; `box-shadow` is zeroed with them, which
  matters for a region closed by being moved rather than unpainted — an off-canvas drawer still
  paints, and a shadow reaches out of its box by its blur radius.

  **CSS:** `.disclosure-elemental-region[hidden]` now sets `box-shadow: none`. A page relying on a
  shadow applying while closed should scope it as `:not([hidden])`.

## [0.2.0] - 2026-07-29

### Added

- **`<accordion-elemental>` animates its panels open and closed, in every browser.**
  `--accordion-elemental-duration` and `--accordion-elemental-easing` retime it, read back out of
  the computed styles so the stylesheet stays the single source of truth.
  `prefers-reduced-motion: reduce` switches it off, and with scripting off the panels toggle
  natively and instantly.

- **A panel being closed carries `class="accordion-elemental-closing"` for the length of the
  slide.** The element keeps `open` while a panel animates shut, so `[open]` alone cannot tell a
  stylesheet which way it is heading: use `details[open]:not(.accordion-elemental-closing)`.

- **An optional theme stylesheet, shipped separately** as
  `book-of-elementals/accordion/theme.scss` — colours mixed out of `currentcolor`, plus
  `--accordion-elemental-border-color` and `--accordion-elemental-radius`. Two opt-in classes ride
  along: `grouped` collapses the stack into one card with shared borders, `caret` swaps the native
  marker for an Octicon chevron drawn as a mask. **Every element's optional look is also aggregated**
  into `book-of-elementals/theme.scss`, the counterpart to the whole-book structure bundle; no CSS
  is new.

- **An `exclusive` group now adopts a `name` already present on its panels** instead of minting its
  own, which is how exclusivity survives with scripting off.

### Changed

- **DOM:** on upgrade the element wraps each panel body in
  `<div class="accordion-elemental-content">`, because a height transition needs one box to measure
  and clip. Descendant selectors are unaffected; **direct-child selectors are** —
  `details > summary + *` and `details > :last-child` now match the wrapper. Style inside it
  instead.

- **CSS:** the library owns the wrapper's box and keeps it inert — `margin`, `padding` and `border`
  zeroed, with `display: flow-root` so child margins cannot collapse out of it. Padding there would
  be a floor the height cannot get under.

- **Behaviour:** closing a panel is the element's, not the browser's — `<details>` sets its contents
  to `display: none` the moment `open` goes away, which cuts a close animation off at frame one. So
  `accordion-toggle` fires for a close at the *end* of the slide; opening still fires it
  immediately. The old `::details-content` and `interpolate-size` pair is gone, since it only
  animates in Chromium.

- **`readOptions` moved to [book-of-spells](https://github.com/stamat/book-of-spells)** and is no
  longer exported from `book-of-elementals/core`, which is now `ElementBase` and `define`. Number
  parsing is slightly stricter as a result: `'25nope'` is dropped rather than read as `25`.

- **The package now depends on `book-of-spells` ^1.4.0**, for `slide` and `readOptions`. It is
  bundled into `dist/`, so a script tag still costs exactly one file, and the "no runtime
  dependencies" claim is gone from the README and docs.

## [0.1.0] - 2026-07-29

Initial release. `<accordion-elemental>` over native `<details>`/`<summary>`: `exclusive` panels via
a shared `name`, arrow/Home/End header navigation per the
[APG Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), URL-fragment deep
links, and a bubbling `accordion-toggle` event on the group.

[Unreleased]: https://github.com/stamat/book-of-elementals/commits/main
[0.2.0]: https://www.npmjs.com/package/book-of-elementals/v/0.2.0
[0.1.0]: https://www.npmjs.com/package/book-of-elementals/v/0.1.0
