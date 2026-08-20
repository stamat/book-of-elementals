# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Releasing is `script/publish`: it runs
`script/changelog`, which renames that heading to the version and date, starts a fresh
`[Unreleased]`, and hands the entry to the GitHub release as its body. Write entries for
the person upgrading, not for the person who wrote the code — and because these are custom
elements, call out anything that changes the **DOM the element produces** or the **CSS an author
may already be targeting**, since neither shows up in a function signature.

## [Unreleased]

### Changed

- **The tooltip theme no longer fades by default.** `--tooltip-elemental-duration` is `0s`
  instead of `120ms`: a tooltip answers a pointer that has already stopped moving, and a bubble
  easing in behind it reads as lag rather than as polish. The transition is still declared, so
  a page that wants the fade back sets `tooltip-elemental { --tooltip-elemental-duration: 120ms }`
  and gets exactly what it had. CSS: the bubble now appears and disappears on the frame it is
  shown, `@starting-style` and `allow-discrete` unchanged underneath.

- **The tooltip theme no longer outranks the page importing it.** Its rules were gated on
  `tooltip-elemental:defined[role="tooltip"]` / `:defined > [role="tooltip"]`, a class heavier
  than any selector an author would reach for — so `tooltip-elemental [role="tooltip"] { … }`,
  the hook the docs list, silently lost and a part of the look could only be turned off by
  repeating the gate verbatim. The `:defined` guard now sits inside `:where()`, which costs
  nothing on specificity: it still keeps the look off a bubble the script has not upgraded,
  and a rule of yours at the documented weight is level with the theme's and wins by coming
  later. CSS: nothing paints differently on a page that overrode nothing; a page that beat the
  old weight still beats the new one. The other themes in the book gate the same way and are
  unchanged for now.

- **`<tilt-elemental>`'s shadow is barely there until the card leans.** A card nobody is
  touching lies flat on the page and casts almost nothing; the theme's shadow now rests at a
  quarter of its opacity and fades up to full with the lean, on the same durations the card
  moves on. CSS: the shadow's `::before` gains `opacity: 0.25` at rest and `opacity: 1` under
  `[data-tilt-active]`, with `opacity` added to its transition.
  `--tilt-elemental-shadow-color` is untouched and both states follow it — a page that wants
  the old constant weight sets `tilt-elemental:defined::before { opacity: 1 }`.

- **`<tilt-elemental>`'s glare default now weighs itself by colour scheme.**
  `--tilt-elemental-glare-color` defaults to
  `light-dark(rgb(255 255 255 / 100%), rgb(255 255 255 / 10%))` instead of a flat 35%: the
  surface decides how much of a white light shows, and the old 35% was a spotlight on a dark
  card while invisible on a light one — measured on this project's own demo card, so was 80%,
  and full white is the ceiling a white glare has. `light-dark()` follows the page's
  `color-scheme`, so a themed site's toggle carries the glare with it; a page that never
  declares one resolves to the light value. A page that wants one weight in both schemes sets
  `tilt-elemental { --tilt-elemental-glare-color: … }` as before.

### Fixed

- **A tooltip is centred on its trigger on both axes, and slides rather than jumps when the
  viewport is in the way.** The alignment came from book-of-spells' `placeFlyout` and
  `placeSubmenu`, which answer in the `start` / `end` a submenu hangs from the item that
  opened it with: beside a control the bubble sat with its top edge on the trigger's, caret
  pointing out of its first line at whatever was above the middle — and near the edge of the
  screen it snapped to the trigger's own edge, a position that fits the viewport on its own,
  so the clamp that would have slid it never fired. Both helpers are now asked only which
  side the bubble goes on. The middle is this element's own answer on either axis, and the
  clamp moves the bubble no further in than the edge forces, so a trigger in the corner keeps
  the most centred bubble there is room for. DOM: `data-align` is measured from where the
  bubble landed rather than taken from what was asked for — `center` unless the viewport slid
  it, and then the end of the bubble the caret came out near.

- **`<tilt-elemental>`'s shadow no longer blinks in Safari when the pointer settles.** The
  theme's shadow is a blurred layer that only ever translates, and Safari composited it only
  while its transition was running — dropping the layer the moment the pointer stopped at the
  card's edge, and rasterising the blur again in software at a visibly different brightness.
  Chromium keeps the layer once promoted, which is why only Safari showed it. CSS: the
  shadow's `::before` now carries `will-change: translate`, pinning it composited for the
  card's lifetime; the price is one card-sized texture held per card.

- **A dialog whose first thing is a picture or a film no longer scrolls sideways.** The theme
  keeps content out from under the corner cross by padding the element right after it, so a
  heading cannot run beneath it — and that padding landed on media as well. A `<video>` or
  `<iframe>` sized `width: 100%` on a page with no border-box reset is then 100% *plus*
  2.5rem, and the dialog's own `overflow: auto` turns the difference into a horizontal
  scrollbar: measured on this project's own docs page at `scrollWidth` 696 against a 656px
  box, in Chromium 151. CSS: `img`, `picture`, `video`, `iframe`, `embed`, `object`, `canvas`
  and `svg` directly after the cross are now excluded from that rule and get no
  `padding-inline-end`, so the picture fills the dialog and the cross sits over it, which is
  where every lightbox puts one. Repaint it there — it inherits the dialog's text colour, and
  no colour is safe over a picture nobody chose. Anything else after the cross keeps the
  gutter exactly as before.

- **A YouTube embed in a `<modal-elemental>` no longer plays on after the modal is closed.**
  Closing reloaded every `<iframe>` in the dialog by setting its `src` to the value it
  already had — and a `loading="lazy"` frame in a closed dialog is `display: none`, so that
  navigation is deferred until the frame is on screen again and the player keeps running,
  unseen and audible, until the next open. The docs page recommends `loading="lazy"` on an
  embed, so its own YouTube demo had the bug: measured on it, the framed document was still
  loaded and playing after the close in Chromium 151 and Firefox 153. The frame is now
  parked at `about:blank` instead, which discards the document there and then, with its
  `src` and `loading` put back on the next open. DOM: a frame inside a closed modal reads
  `src="about:blank" loading="eager"` for as long as the modal is closed — `loading` is
  forced because Firefox defers a lazy navigation to `about:blank` as well — and both
  attributes are restored to what the author wrote when it opens. Request counts are
  unchanged: one per open, none on close.

## [0.11.1] - 2026-08-17

### Fixed

- **Five elementals no longer flash their expanded markup on first paint.** The
  progressive-enhancement markup — submenus plainly visible, panels stacked, the tooltip
  sentence in flow — painted as authored until the bundle ran, then collapsed: a blink on
  every first load, and the docs previews showed it on every refresh. The structure
  stylesheets now split the pre-upgrade rendering on `@media (scripting)`. Scripting off
  keeps the old fallback: everything visible, buttons that would do nothing not offered.
  Scripting on paints the closed state the upgrade is about to wire — `<menu-elemental>`
  pixel-identical (button shown, lists hidden), `<disclosure-elemental>` for the
  sibling-region shape (`for` points at an id no stylesheet can know, so that shape keeps
  the old collapse), `<tabs-elemental>` the first panel only (a `#fragment` deep link
  still flashes it until the element reads the hash), `<tooltip-elemental>` the bubble
  unpainted, and `<navbar-elemental>` a best guess — panels closed, the row on one line —
  because the mode is unknowable until the script reads `media`, so a page about to stack
  shows a row for the length of the fetch and the overflow still folds one frame after
  upgrade. The trade: a bundle that never arrives *while scripting is on* — blocked, 404 —
  now leaves the closed state with nothing to open it; the fallback covers scripting
  turned off, not every way a script can fail to run, and each docs page says so.
  CSS-only. No DOM output changed, and every new rule sits under `:not(:defined)`, so
  nothing an author styles after upgrade moves.
- **Late-arriving controls no longer shift the page when they land.** The switch, copy
  and password buttons and the checkbox-group's select-all were `display: none` until
  `:defined` — correct as an offer (a control that does nothing yet must not be offered)
  and wrong as layout: the row each sits in closed up and reopened on upgrade, a layout
  shift on every load, including the theme switch on the docs topbar. Split on
  `@media (scripting)` like the rest of this entry: scripting off keeps `display: none` —
  the old degradation exactly — while scripting on holds the control's box with
  `visibility: hidden`, which reserves the layout while the control stays out of reach:
  no click, no tab stop, no announcement, until the element wires it. The navbar's drawer toggle
  keeps the old behaviour deliberately: whether it belongs on screen at all is the `media`
  attribute's call, which no stylesheet can read, and reserving space for a toggle the bar
  mode is about to remove would shift the other way.
- **The code under an inline demo no longer jumps up when the copy button arrives.** The
  docs' flush rule — no gap between a hand-built sample and its fence — named only
  `.code-wrap`, the shape the theme's copy-button script wraps the fence into at script
  time; until then the fence is a bare `pre` with its full prose margin, so the code
  snapped up by the difference on every load of a page with an inline demo. The rule now
  names both shapes, and the fence is flush from first paint. Docs stylesheet only.
- **The tab strip no longer reflows the page on upgrade.** Pre-upgrade the strip was a
  bulleted, indented UA list that snapped into a flex row when `[data-tabs-list]` arrived,
  moving everything under it — around 50px of layout shift on the tabs page alone. The
  structure stylesheet now gives the waiting list the same reset the attribute brings, and
  the theme paints it as the strip — tabs padded, rule under them, vertical variant
  included — both behind the same `@media (scripting: enabled)` gate, so a no-script page
  still reads as a plain list of links. The docs also pin `--code-preview-height` /
  `--code-preview-options-height` on every preview whose measured height differed from the
  reservation (62 demos), so the previews land without shifting the page — measured and
  written by the new `script/pin-heights`, to re-run after editing any sample; the residue —
  0.002–0.007 CLS from toolbar rows the preview inserts — is `code-preview-element`'s
  reservation to fix, not this repo's.

## [0.11.0] - 2026-08-17

### Fixed

- **The docs option panels no longer under-report the theme knobs.** The panels read
  `custom-elements.json`, which reads the JSDoc — and four elementals had knobs the JSDoc
  never mentioned. `<modal-elemental>` now tags all nine of its custom properties instead of
  three; `<password-elemental>` tags its real three (`icon-size`, `padding`, `radius`) and
  drops `--password-elemental-gap`, which no stylesheet ever read — the element is
  `display: contents` and has no gap to set; `<accordion-elemental>` and
  `<disclosure-elemental>` tag the `duration`/`easing` pair their Animation sections were
  already documenting. The password page also gains the "The look" section the other themed
  elementals already had. No element behaviour, DOM or CSS changed.
- **Docs corrections from a full read-through.** The home page said eighteen elements when
  there are twenty-two, and the elementals index was missing `<tilt-elemental>` from its
  table; the "swap in `book-of-elementals.min.js`" instruction on the home page and README
  pointed one directory too deep — the whole-book bundles live in `dist/`, not
  `dist/elementals/`; two anchors pointed at headings that do not exist (disclosure's
  `#why-not-just-details`, navbar's `#how-few-links-is-not-a-bar`); the menu page called
  itself the one element in the book that is a box, which the carousel, navbar and accordion
  also are; the combobox API table was missing `custom-values` and `add-text`; the carousel
  page now names `data-carousel-markers` on the picker, which the card-row example was
  already styling against.
- **`<tooltip-elemental>` said it was unreachable by touch, and that was only true of one
  engine.** Behaviour is unchanged — touch pointers are still ignored outright — but focus is
  not filtered by how it arrived, and a tap that focuses the trigger opens the bubble.
  Measured with a touch pointer: Chromium focuses a `<button>` on tap and the bubble opens,
  WebKit does not focus buttons on tap and nothing appears, and a text input focuses on tap in
  both. So a phone reader may reach the words or may not, and the docs now say which. The
  guidance is the same either way: nothing essential goes in a tooltip.

### Added

- **`<switch-elemental>` takes a `checked-if` selector, for a setting the document already
  knows.** A theme toggle could not be right on the first frame. The theme is stamped on
  `<html>` before first paint, so static markup cannot carry `checked`, and anything that
  set it afterwards was too late: registering the element is what takes its button out of
  the `display: none` it wears while undefined, so from that moment the switch is on screen,
  and a starting state arriving at `DOMContentLoaded` is two painted frames behind it.
  Measured on this site's own topbar: the knob painted _off_ over an already-dark page for
  around 90ms, then slid across on its own.

  ```html
  <switch-elemental checked-if="[data-theme=dark]">
    <button aria-labelledby="dark-label"></button>
  </switch-elemental>
  ```

  The selector is asked once, at upgrade — before the button can be painted — and only of
  `<html>`, the one element certain to be parsed whenever a switch upgrades. It is a
  starting state and not a binding: nothing re-consults it, and keeping two controls for one
  setting in step is still a `MutationObserver`, as the page shows. A selector the browser
  cannot parse leaves the markup's own `checked` standing and raises the error where the
  console reports it, because by upgrade there is a visible button and throwing out of
  `connectedCallback` would leave it there with no `role`.

  Prior art all pushes this back to the author:
  [`<dark-mode-toggle>`](https://github.com/googlechromelabs/dark-mode-toggle) needs a
  separate inline loader script and has [an open issue](https://github.com/GoogleChromeLabs/dark-mode-toggle/issues/77)
  for the flash; [`<show-when>`](https://www.cssscript.com/conditional-content-visibility-show-when/),
  which has the richest condition vocabulary of any of them, still says to write `hidden`
  into the markup by hand; [Shoelace](https://shoelace.style/getting-started/themes) declines
  the job outright. None of them can do what this does, because none of them hides its own
  control until it is defined — which is what makes upgrade early enough to be the answer.

- **`<tilt-elemental>`** — the 3D tilt card, with the reduced-motion switch the rest of the
  shelf does not have. No APG pattern, because nothing is operated; what there is instead is
  [2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html),
  which a decorative tilt can never claim the "essential" exemption from. vanilla-tilt, tilt.js
  and Atropos all animate straight through `prefers-reduced-motion`; this reads it, follows it
  live, and with it on attaches no pointer listener at all — no transform, no glare, no layers.
  Mouse only, and no keyboard trigger: motion a reader cannot avoid is the thing the criterion
  is about.

  `max`, `axis`, `reverse` and `glare` are the whole attribute surface. Any descendant marked
  `data-tilt-depth="40"` rises out of the card while it leans, at any depth of nesting.

  **No stutter at the border, and no wrapper divs to buy it with.** The card leans away from
  the pointer, so the edge the pointer is nearest is the edge that recedes — hit-test the
  leaning card and a pointer a pixel inside it falls outside, straightening the card, which
  puts the edge back under the pointer. Every angle is measured against the box the card has
  when it is flat, read once at the start of a hover, and so is the question of whether the
  pointer has left. Atropos pays for the same guarantee with three nested `<div>`s;
  vanilla-tilt hands you an option for binding the listeners somewhere else.

  **DOM:** one wrapper, and nothing inside it is moved. The element writes
  `data-tilt-active` while the pointer is over the card, and four unitless custom properties
  into its own `style` — `--tilt-elemental-x`, `--tilt-elemental-y`,
  `--tilt-elemental-glare-x`, `--tilt-elemental-glare-y`. Unitless so the theme can spend the
  same number as a pixel offset that the transform spends as a degree. The two angles are
  removed when the pointer leaves; the glare's position is left where it stood, so the
  highlight fades out in place instead of sliding to the middle of the card on its way. While
  the pointer is over a card the element also listens on `document`, and a scroll straightens
  it — the cached flat box has moved and cannot be re-measured while the card is leaning.

  **CSS:** everything but `display: block` is behind `:defined`, so an unupgraded page is the
  card you wrote. Both pseudo-elements are spoken for — `::after` is the glare, drawn by the
  structure stylesheet rather than the optional theme because `glare` is an attribute and a
  promise kept only for whoever also imported the look is a promise broken for everyone else;
  `::before` is the theme's shadow. The shadow is a translated layer rather than an offset
  inside `box-shadow`, which is what stops it stuttering: a `box-shadow` fed by a custom
  property repaints a soft blur every frame on the main thread while the card glides on the
  compositor, and the two run at visibly different rates. Measured over a 240-frame hover, 478
  paints became 9. What is drawn on that layer is the card's shape, filled and blurred, rather
  than a `box-shadow`: a shadow never paints inside its own box, so a hollow one slides out
  from behind a leaning card as the hole in the middle of its ring, and a filled one with a
  `box-shadow` on it has a hard rim on the two sides that emerge. `--tilt-elemental-shadow-size`
  is spent as half of itself, since `box-shadow` takes twice the gaussian deviation that
  `filter: blur()` takes, so the number means what it always did. The trade is that the layer
  is a coloured slab rather than a hole, so a card with a see-through background shows the
  shadow through it; point `--tilt-elemental-shadow-color` at `transparent` there. Note that `overflow` other than `visible` or `clip`, `filter`, `opacity`
  below 1, `clip-path`, `mask-image`, `mix-blend-mode`, `isolation: isolate` or paint
  containment — on the element **or on any wrapper between it and a layer** — force
  `transform-style` back to `flat` and silently stop every layer rising. The theme rounds its
  corners with `border-radius` alone for that reason.

### Changed

- **`<slider-elemental>`'s `tooltip` bubble now shows on touch, for the length of a press.**
  It was pointer-only in the narrow sense — touch pointers were dropped in every handler — so
  the one reader whose fingertip is covering the thumb was the one reader who never saw the
  number. A finger is not a hover, so the press is the whole gesture: `pointerdown` draws the
  bubble, the drag carries it, and the release takes it away wherever on the control the
  finger lifted, rather than leaving it parked where a finger last was. A tap shows it for as
  long as the tap lasts. Nothing changes for a mouse, and there is still no tap-to-pin and
  nothing shown on focus — a keyboard reader hears the value already, and the bubble stays
  `aria-hidden` for both.

  **DOM:** unchanged. The same `<output aria-hidden="true" data-tooltip>`, appended only where
  `tooltip` asked for one; a touch gesture now toggles its `hidden` and moves
  `--slider-elemental-at` the way a mouse always did.

## [0.10.0] - 2026-08-17

### Added

- **`<slider-elemental>` takes a `format` function for its value bubble.** The bubble could
  only ever say the number, which rules it out for every scale where the number is not the
  reading: `72` on a media scrubber is `01:12`, `40` on a price is `€40`. `slider.format =
  (value, element) => …` returns what lands in the bubble, called on every draw with the
  value as a number.

  A property rather than an attribute because the answer is a function, and no attribute
  spells one. **Nothing changes for a slider that does not set it** — the bubble still shows
  the browser's own spelling of the value, which is not the same as `String(value)`: a
  `step="0.10"` input answers `3.10` where rounding the number back would give `3.1`. A
  formatter returning `undefined` or `null` falls back to that spelling rather than emptying
  the bubble, so a function missing a `return` looks like one.

  No DOM or CSS change, and nothing new is announced: the bubble stays `aria-hidden` and the
  range underneath still announces the raw value to assistive technology.

- **`<field-elemental>`** — the browser's own validation message, on the page instead of in a
  bubble that floats away. No APG pattern, because there is no widget: the control inside is
  already accessible and the constraints are already enforced. What the platform leaves
  undone is everything after the refusal — the bubble cannot be styled, vanishes when the
  field takes focus, is shown for the first invalid control and no other, and is not reliably
  announced. So every form either lives with it or hand-writes a replacement, and the
  replacement is where the accessibility goes: a red paragraph no `aria` attribute ties to
  the field is a message a screen reader user never meets.

  **Nothing here validates anything.** `required`, `type`, `pattern` and `setCustomValidity()`
  stay the whole constraint layer, and the wording stays the browser's, already translated.
  There is no message vocabulary — no `data-required-message`, no `invalid-message` — because
  the platform has one call for that already and a set of attributes shadowing it would be a
  second place for the same string to live.

  **`aria-describedby`, not `aria-errormessage`.** The attribute written for exactly this is
  still not the one that works: [Roselli's
  testing](https://adrianroselli.com/2023/04/exposing-field-errors.html) found the message
  behind it "generally not exposed when navigating through fields", against `aria-describedby`
  being "consistently exposed". No live region on the message either — `describedby` is
  already announced when focus leaves the field, so `aria-live` on top of it is the same
  sentence twice in NVDA and JAWS and stops VoiceOver reading the description at all.

  **It takes focus, and that is not a preference.** Cancelling `invalid` is what drops the
  bubble, and it drops the browser's focus with it — measured in Chromium and WebKit, a
  refused submit then leaves focus on the button or on `<body>`. So the element focuses the
  first invalid control in the form itself. Firefox was not checked.

  **DOM it writes:** a `<p class="field-elemental-error">` appended to the element, `hidden`
  and empty while the field is fine; `aria-invalid="true"` and an appended `aria-describedby`
  on the control while it is not, both removed again when it is. The control gets an `id` if
  it had none, and the message takes that `id` plus `-error`. Render the `<p>` yourself with a
  server-side message in it and the element adopts it rather than adding a second — that is
  how a server error survives with no script, and a form reset puts it back. `field-validity`
  carries `detail.valid` and `detail.message`.

  **The validity is read at the end of the event, not during it.** `setCustomValidity()` is
  called from an `input` listener the page adds after the element upgraded, so it runs after
  the element's — reading any sooner reports the answer from before the page's own rule ran,
  and the message clears a keystroke late. That is what makes a confirm-password field work
  with no `match` attribute to learn.

  Not covered: radio and checkbox groups (one message belongs to one answer — a group is a
  `<fieldset>`), error summaries at the top of a form, and any styling of the control. The
  theme styles the message and nothing else; `[aria-invalid="true"]` is there for your CSS.

- **`<password-elemental>`** — a reveal button for a password field. No APG pattern, because
  there is no widget: a `<button>` beside an `<input>`, both already accessible. What is
  missing is the state. A button that swaps an eye for a crossed-out eye has told a sighted
  reader which way round it is and told everyone else nothing, and the field changing from
  dots to letters — the one change on the page with a shoulder-surfer behind it — is
  announced nowhere.

  **`aria-pressed` with a fixed name**, which is the one point the prior art splits on.
  [GOV.UK](https://design-system.service.gov.uk/components/password-input/) swaps the name and
  has no pressed state; [Make Things
  Accessible](https://www.makethingsaccessible.com/guides/make-an-accessible-password-reveal-input/)
  keeps the name fixed and uses `aria-pressed`; [hexagoncircle](https://github.com/hexagoncircle/password-input-components)
  does both, which is what the second explicitly warns against — with `aria-pressed` carrying
  the state, a name that also changes says it twice and disagrees with itself half the time.
  Of the two that are self-consistent this takes the toggle: the state is exposed rather than
  inferred from a verb, and nothing changes under a reader's focus. Both sources agree on the
  half that settles it, and it is here — `role="status"` saying "Your password is visible" or
  "Your password is hidden" on every press.

  **The field masks itself before the value leaves.** A revealed field posts from an
  `<input type="text">`, and browsers remember what was typed into text fields, so the value
  can be offered back in an autofill list on an unrelated page later. `submit` fires only when
  the form is really being submitted — a browser refusing it on a constraint never dispatches
  it, measured in Chromium — so this lands exactly when it matters and a refused submit leaves
  the field however the reader left it. `reset` masks too.

  **DOM it writes:** `type` on the field flipped between `password` and `text`, `aria-pressed`
  and `aria-controls` on the button, an `id` on the field if it had none, and one appended
  `<span class="password-elemental-status" role="status">`. `shown` is reflected — a styling
  hook, and settable from script. `label`, `shown-text` and `hidden-text` are the strings;
  `password-reveal` carries `detail.shown`. Without the script the stylesheet keeps the button
  out of reach, so the page is left with a password field, which is what the markup was.

  No strength meter: [NIST SP 800-63B Rev 4](https://pages.nist.gov/800-63-4/sp800-63b.html)
  prohibits the composition rules a character-class meter scores, and an honest measure needs
  a guessability library or a breach-list lookup. No generator, and no confirmation field —
  `setCustomValidity()` does that in four lines and `<field-elemental>` reports it. There is
  no caret-restoring code either: flipping `input.type` keeps focus and the selection range in
  Chromium and WebKit, measured rather than guarded against.

- **`<combobox-elemental>` gained `custom-values`** — a value the `<select>` does not hold can
  be typed in. With `multiple` on an empty `<select>`, that is a tag input, and it is one
  attribute rather than a second element because everything it needs already existed here: the
  chips, the remove buttons, `Backspace` on an empty field, the filtering, and the `{label}`
  naming convention.

  **An add row in the listbox, not a hint under the field.** "Press Enter to add it" is a
  sentence a screen reader meets only if it happens to be read, and never at the moment it
  applies. A row is announced with the rest of the list, counted in it, and reached with the
  same arrow key. It sits last, so the closest real match keeps the cursor and Enter still
  takes what the reader was searching for.

  Nothing is offered for an empty query, for an exact match, or for one differing only in case
  or surrounding space — `react` beside `React` is a near-duplicate nobody meant to make.
  Taking the row appends a real `<option>` to the `<select>` and picks it through the same
  path every other choice takes, so it submits, chips, filters and toggles like the ones you
  wrote. A created `<option>` outlives a form `reset`, which puts back the selection and not
  the markup.

  **DOM change:** the popup gains `<li class="combobox-elemental-add" role="option">`, hidden
  unless `custom-values` is set and the query is a new value. `add-text` is what it says,
  `{label}` standing in for what was typed. Off by default — a `<select>` is a closed set of
  answers, and widening one uninvited would answer a question the markup did not ask.

### Changed

- **`<combobox-elemental>` no longer puts `role="alert"` on its validation message.**
  **DOM change:** `<p class="combobox-elemental-error">` is written without a `role`; the
  class, the `id` and the `hidden` toggling are unchanged, so CSS targeting it is unaffected.

  It was announcing twice. The message is already pointed at with `aria-describedby`, and a
  description is read when focus arrives at the field — which is the same moment this
  message appears, because the element focuses the field it just refused. [Roselli's
  testing](https://adrianroselli.com/2023/04/exposing-field-errors.html) is what a live
  region on top of that costs: double-speak in NVDA and JAWS, and VoiceOver stops reading the
  description at all.

  A combobox that is not the first invalid control now waits until the reader reaches it
  instead of announcing from off-screen. That is what a plain form does, and better than
  three alerts firing at once from three invalid fields.

## [0.9.0] - 2026-08-16

### Added

- **`<marquee-elemental>`** — a strip that scrolls forever, out of the list you already
  wrote. No APG pattern, because nothing in it is operated; what there is instead is
  [SC 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html),
  Level A, which every other marquee leaves to the author — the CSS recipes pause on
  `:hover`, which no keyboard has, and the component libraries hand you a `play` prop and a
  hook to build the button out of. This writes the button, names it for what pressing it will
  do, and stops on the pointer and on focus as well.

  **The copies are counted against the container, not hard-coded at two.** A lap ends with
  the original translated its own length out of frame, so the copies behind it have to cover
  the container: one when the track is already that wide, `⌈(container + gap) ÷ (track + gap)⌉`
  when it is not, capped at 20, and none at all while it is stopped. The `+ gap` on the
  container is the gap the strip does not have after its last copy, and counting without it
  leaves a sliver of empty container in the last moments of a lap — a blink at the wrap that
  is really an off-by-one-gap two seconds earlier. Recounted on a `ResizeObserver`,
  and not rebuilt when the width came out the same, because rebuilding restarts the lap.
  `prefers-reduced-motion` starts it stopped with no copies made, and the button still says
  Start.

  `speed` is pixels a second, `reverse` turns it round, `no-controls` takes the button away
  for a page providing the mechanism itself, and `play-text` / `pause-text` are the names.
  `.play()`, `.pause()` and `playing` are the same switch from script; `marquee-toggle`
  carries `detail.playing`.

  **DOM:** the copies are appended after your markup as `[data-marquee-clone]`, each one
  `inert` and `aria-hidden="true"` with every `id` inside it stripped — `aria-hidden` alone
  is what leaves the keyboard walking into copies of the same links, and a duplicated `id` is
  the same bug one layer down. A `<button class="marquee-elemental-control">` is appended
  last unless `no-controls` says otherwise, and a `<ul>` or `<ol>` track gets `role="list"`
  written back onto it, because `list-style: none` is what takes list semantics away from
  VoiceOver in Safari. Two attributes carry the state: `data-marquee-running` while the lap
  exists and `data-marquee-paused` while it is stopped. `data-marquee-running` is what keeps
  the animation from existing before the distance does — WebKit resolves the custom properties
  in a keyframe once, when the animation is created, so an animation created earlier travels
  zero for as long as it lives.
  **CSS to know about if you restyle it:** the pointer and focus hold the strip everywhere
  except over the button, which sits on the strip — counted, it stops the strip as the pointer
  arrives while the button still reads Stop, so the press changes nothing visible. The lap is
  set with `animation-*` longhands and never the `animation` shorthand, which would take
  `animation-play-state` back to `running` and undo every pause. And every custom property is
  declared on the bare `marquee-elemental` selector rather than on `marquee-elemental:defined`,
  so a plain `marquee-elemental { ... }` rule of yours outweighs the default.
  **CSS:** everything in `style.scss` is behind `:defined`, so with no script there is no
  strip — the list wraps as it always did. New properties to target:
  `--marquee-elemental-gap`, and `--marquee-elemental-distance` and
  `--marquee-elemental-duration`, which the element writes. `theme.scss` adds the edge fades
  and the button through `--marquee-elemental-fade`, `-surface`, `-border-color`, `-hover`,
  `-control-size` and `-control-radius`.

- **`<slider-elemental tooltip>`** — a value bubble that follows the pointer: `thumb` for the
  one it is on, `track` for the value a press anywhere else would set, `thumb track` for
  both, and a bare `tooltip` for the thumb. The track number is put on the `step` the way the
  input would put it — counted from `min`, ties up, and never past the last notch the scale
  actually has, so `min="0" max="100" step="40"` reads 80 at the far end rather than a 100 the
  input cannot hold.

  One bubble and not one per thumb: a pointer is in one place at a time, so a second could
  only ever be a box stacked on the same spot. A press pins it to the thumb being dragged
  until the release, because a thumb snaps to notches while the pointer moves smoothly — half
  a step out, the pointer is beside the thumb it is holding, and past either end it is off
  the control. It follows a drag off the slider and lets go on `pointerup`. It is a hover, so
  a touch reader and a keyboard reader never see it — which is why nothing goes in it that is
  not already on screen or already announced, and why it is not an alternative to an
  `<output>`.

  **DOM:** with `tooltip` set, one `<output aria-hidden="true" data-tooltip="thumb|track">`
  appended as the last child, removed again when the attribute is or when the element leaves
  the page. `aria-hidden` because the input under it announces its own value already. It is
  excluded from the `outputs` list, so a page's own readouts keep their thumbs.
  **CSS:** `--slider-elemental-at` on that bubble, a `0` to `1` ratio spent the same way
  `--slider-elemental-start` and `--slider-elemental-end` are. `style.scss` places it — a
  bubble left in the flow would shove the layout about as the pointer moved — and
  `theme.scss` paints it, through `--slider-elemental-tooltip-gap`, `-padding-block`,
  `-padding-inline`, `-radius`, `-surface` and `-color`. New selector to target:
  `slider-elemental > output[data-tooltip]`.

- **`--carousel-elemental-rotate-hover-color`** — the rotation control's foreground under the
  pointer, defaulting to `CanvasText`, which is what it was fixed at before. `theme.scss`
  only. The chip behind that button already lifted on hover and the icon did not, so a theme
  that wanted the icon to answer the pointer had no property to turn. It takes the countdown
  ring with it, swept arc and track both — they are `currentcolor` and 20% of it, so the
  control stays one colour.

### Changed

- **`<slider-elemental>`'s thumb follows its fill.** `--slider-elemental-thumb` now defaults
  to `var(--slider-elemental-fill)` rather than `currentcolor` — the thumb is the end of the
  selection, and recolouring the fill and getting a thumb still in the text colour meant
  finding out there was a second knob. Both still default to `currentcolor` in the end, so
  a page that has not set either sees no change; one that set `--slider-elemental-fill`
  alone now has a matching thumb, and one that wants them apart sets
  `--slider-elemental-thumb` as before. Forced-colors mode keeps its `CanvasText` thumb,
  because a `Highlight` thumb on a `Highlight` fill is a thumb nobody can find.

  **The one case to check when upgrading:** `--slider-elemental-fill: transparent` now takes
  the thumb with it, so a slider drawn over something else that already shows the selection
  needs `--slider-elemental-thumb: currentcolor` on the same rule from here on. A `var()`
  fallback cannot cover it — a fallback fires on an *unset* property, and `transparent` is a
  value like any other.

### Fixed

- **`<slider-elemental>` quietly under-delivered `gap` when `step` did not divide it.** The
  low thumb was pushed to exactly `gap` short of the high one and handed to the input, which
  put it back on its own notch — the nearest one, which is the one *towards* the other thumb
  half the time. `step="10"` with `gap="25"` left the pair 20 apart: a gap asked for, a
  smaller one delivered, and nothing anywhere saying so. The thumb now gives way to the notch
  past where the gap lands rather than the nearest, which costs at most one notch and cannot
  be silently wrong. A `gap` that is a whole number of steps is unaffected, as is `step="any"`.

- **`<slider-elemental>`'s thumb never took the page's colour, in any browser.** A thumb
  pseudo-element does not see the page's `color` — the browser gives the control one of its
  own — so the `currentcolor` the theme painted the thumb with resolved to that instead:
  white in Chromium whatever the page said, mid grey in WebKit. Only Chromium's wrong answer
  happened to look right, which is why this reads as a Safari bug and is not one. The theme
  now names the colour on the input (`color: var(--slider-elemental-thumb)`) and the thumb
  rules paint in `currentcolor` from there, so a thumb in a coloured block finally tints with
  it. `--slider-elemental-focus-color` was resolving against the same wrong colour and is
  fixed by the same line; it now mixes out of the thumb's colour. `style.scss` carries the
  declaration too, so a two-thumb slider with no theme is right as well.

  **If you wrote your own thumb rule:** `currentcolor` in it is the value that misbehaves.
  Set `color` on the input and paint the thumb with `currentcolor`, or use a literal.

- **The scrubber example drew its played part with the wrong element.** It was the
  `<progress-elemental>`'s fill, which eases over `--progress-elemental-duration` and so
  trailed a quarter of a second behind every drag. The layers are swapped: the slider draws
  the fill, which has no transition and arrives with the thumb, and the bar behind keeps the
  rail and the buffer — the two things a slider cannot draw. Copy the new CSS if you built a
  scrubber from the old one. The example also wires the `<progress>` to the seek input now,
  so what a screen reader reads for position no longer parts company with the thumb.

## [0.8.0] - 2026-08-15

### Added

- **`<slider-elemental>`** — one `<input type="range">` inside it is a slider, two is a
  range whose thumbs cannot pass each other. The count is the markup rather than an
  attribute. The thumbs stay native inputs, so the arrow keys, <kbd>Home</kbd>,
  <kbd>End</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd>, `step`, touch, submission under
  each input's own `name`, `reset` and restore are all still the browser's — there is no
  `role="slider"`, no `aria-valuenow` and no event of its own. What it adds is the fill
  position no engine but Firefox will give you (`::-moz-range-progress` has no equivalent
  anywhere else), and, with two thumbs, the three things a second range input cannot do
  for itself: sharing one track, stopping short of each other, and a press on the track
  that reaches the nearer thumb through the stacking.

  **DOM:** `role="group"` on the element, and only with two thumbs and an `aria-label` or
  `aria-labelledby` already on it. `data-stacked` while both thumbs sit on one value,
  naming which of them is lifted. Nothing is moved, wrapped or inserted.
  **CSS:** `--slider-elemental-start` and `--slider-elemental-end`, as ratios from `0` to
  `1` rather than percentages — a thumb travels from half its own width to half a width
  short of the far end, so `calc(var(--slider-elemental-end) * (100% -
  var(--slider-elemental-thumb-size)))` is where the thumb actually is and a bare
  percentage is off by half a thumb at the ends. `style.scss` stacks two thumbs and routes
  their pointer events; `theme.scss` is optional as ever and draws nothing until
  `:defined`, so a page that never loads the script keeps the browser's own control.

  `aria-valuemin` and `aria-valuemax` are deliberately not written on the inputs, and the
  page says why: [HTML-ARIA says authors should not](https://www.w3.org/TR/html-aria/), and
  rescaling one input to clamp it against the other would move every pixel on it.

- **`<progress-elemental>`** — a native `<progress>` that says where its fill ends, so CSS
  can draw the bar without `::-webkit-progress-value` and `::-moz-progress-bar`, plus the
  second value `<progress>` has never had: `buffer`, for the part that is loaded but not
  yet played. The `<progress>` keeps `role="progressbar"`, `max`, the indeterminate state
  and its `<label>`, so the element writes no ARIA at all.

  **DOM:** `data-indeterminate` on the element while the `<progress>` has no `value`.
  Nothing else, and nothing moved or wrapped.
  **CSS:** `--progress-elemental-value` and `--progress-elemental-buffer`, both
  percentages, both clamped. The value property is *removed* rather than set to `0%` while
  indeterminate, because a bar at zero claims nothing has started and a bar with no value
  claims nobody knows. `theme.scss` hangs off `:defined` too, so without the script the
  browser's own bar shows with the real value on it rather than a themed bar frozen empty.

  Every way of moving the bar works — `element.value`, `progress.value` and
  `setAttribute` — because `<progress>`'s `value` and `max` are reflecting IDL attributes
  and one `MutationObserver` on the child catches all three. It fires no event, so watching
  it is the only way there is.

## [0.7.3] - 2026-08-12

### Fixed

- **Cmd/Ctrl-click on a tab opens it in a new tab again.** `<tabs-elemental>` swallowed
  every click on a link-shaped tab, modifier keys included, so the browser's open-in-new-tab
  never fired — and it would have worked: the fragment the link carries is the panel's, and
  the page that opens lands on it selected. A modified click now keeps the browser's
  default, exactly as the arrow keys already did.

- **`<tooltip-elemental>` puts the trigger back on disconnect.** In the `for` shape the
  trigger outlives the element, and it was left describing a bubble that no longer exists,
  named by an `aria-label` nothing maintains, and missing the `title` the upgrade took —
  its native tooltip gone for good. Teardown now takes only the bubble's `id` out of
  `aria-describedby` (the page's own tokens stay), removes the name only where this element
  wrote it, restores the `title`, and unhides the bubble so the words are a plain sentence
  again. **DOM:** a bubble generated out of a `title` is removed on disconnect; an authored
  one stays.

- **A stripped `<carousel-elemental>` gives back the `role` its upgrade wrote.** Emptied of
  its slides or disconnected, the element took every role off the list and the slides but
  kept its own `role="group"`/`region` — a group announced around a plain list nothing is
  driving. A role the page authored itself is kept, as before.

- **A rotating `<carousel-elemental>` no longer resumes while a reader is still in it.**
  Hover and focus each hold the rotation, but either one ending resumed it: the pointer
  crossing and leaving a carousel a keyboard reader was inside restarted the slides under
  them, and focus leaving resumed it under a pointer still parked on a caption. Resume now
  waits for both to be gone, which is what the APG asks.

- **`<navbar-elemental>` takes its `beforematch` listeners with it on disconnect.** They
  stayed on the lists, and a navbar removed and put back added a second set — harmless in
  effect, since the handler is idempotent, but a leak against the promise that everything
  written comes back off.

- **`import { stepIndex } from 'book-of-elementals'` works again.** `<navbar-elemental>`
  declared its own copy of the stepper core already re-exports, and to ES modules two
  declarations under one star-exported name are not an error — the name is silently dropped
  from the entry. Every subpath import worked; the package's own never did. The navbar now
  re-exports core's binding, which resolves the ambiguity instead of hiding it.

- Docs search listbox click fix from v0.7.2 now propagates through poops-docs-theme v4.0.2

## [0.7.2] - 2026-08-10

### Fixed

- **Tapping an option on iOS Safari now picks it.** `<combobox-elemental>` and
  `<suggest-elemental>` — and with it `<search-elemental>`, whose panel is a suggest — cancelled
  `pointerdown` inside the popup to keep the caret in the field while the click landed. That is
  the right trade on a mouse and the wrong one on a touchscreen: cancelling `pointerdown`
  suppresses the compatibility mouse events, and on iOS the tap's `click` is the last of that
  same synthesised run, so the popup kept focus and swallowed every tap. The press is cancelled
  on `mousedown` instead, which arrives before the focus change and before `click`, so the caret
  still stays put and the tap arrives.

- Update poops-docs-theme to 4.0.1 which carries the search results rendering issue fix from the
  previous release v0.7.1

## [0.7.1] - 2026-08-10

### Fixed

- **`<navbar-elemental>` no longer takes over a list another custom element wrote.** The row
  was "the first `<ul>` or `<menu>` in the element", and a header carrying a search field but
  no links of its own has exactly one list in it: the `<suggest-elemental>` results panel.
  Adopted as the row, its element became the rail — `display: grid`, `overflow: clip`, a
  hidden copy of the panel appended beside it to measure — and the results were laid out as a
  bar, `flex-wrap: nowrap`, one row per line, no wrapping. The rule now is ownership: a list
  with another custom element between it and the navbar belongs to that element.

  **DOM/CSS:** a navbar whose only list is inside another custom element now writes nothing at
  all — no `data-mode` on the element, no `data-navbar-rail`, no `[data-navbar-probe]` copy —
  where before it wrote all three onto the wrong box. A page that wrapped its row in a custom
  element of its own is no longer upgraded; move the wrapper inside the row's box, or make it
  a plain element.

## [0.7.0] - 2026-08-10

### Added

- **`<search-elemental>`** — the query half of a search field: the debounce, the abort, the
  loading state and the announcement.

  `<suggest-elemental>` says outright that it has no opinion about where the results came
  from, which leaves the other half to every page that uses it — and it is the half that goes
  wrong quietly. A request per keystroke. The slow answer to `car` landing after the fast one
  to `carousel` and staying on screen under a field that reads `carousel`. A spinner started
  in one branch and stopped in only one of the two it can end in. And nothing said out loud
  at all, which is [WCAG 2.2 4.1.3 Status
  Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) unmet: the
  panel filling itself is a change a sighted reader watches happen and a screen reader user
  is told nothing about.

  There is no APG pattern, because there is no widget — the combobox is next door, and every
  key still belongs to it. This is one debounce, one `AbortController` per query, a sequence
  number that drops any answer a newer query has already replaced, and one `role="status"`
  region.

  **It does not fetch.** `search-query` carries `detail.query`, `detail.signal` and
  `detail.wait(promise)`; the page fetches, fills the panel, and hands the promise back.
  Calling `wait()` is what buys the loading state, so a page filtering a list it already has
  goes straight to its answer and is never left with a spinner nothing will stop. Owning a
  `src` would mean owning a response shape, an escaping boundary and an opinion about
  someone else's API — the listener in the docs is shorter than the configuration that would
  replace it.

  Attributes are `delay` (200ms), `min` (1 character, `0` to send the empty query too), and the
  three strings the live region reads: `results-text` with `{n}` for the count,
  `empty-text`, `error-text`. The English default handles the one plural English has,
  because "1 results" is the bug it exists not to ship.

  **The empty search is the page's call.** A search that matched nothing closes the panel if
  the panel is empty and leaves it open if there is anything in it — so writing your own
  `No packages match “wombat”` row shows it, and writing nothing shows nothing. The element
  never writes that row: the message is your copy in your language, and a row that is not an
  `<a href>` is not an option, so the arrow keys walk past it and `Enter` still submits.
  `error` is the one state the panel's contents get no vote in, because what is in it after a
  failed request is the query before last.

  DOM it writes: `data-state` on itself, running `idle` → `pending` → `results`/`empty`/
  `error`; `aria-busy` on the `<suggest-elemental>` inside it while a query is out; `open` on
  that same panel when there is something to show and off when there is not; and one appended
  `<span role="status" class="search-elemental-status">`, clipped out of sight. CSS it
  claims: `display: block` and `position: relative` on itself, which is the containing block
  the panel needs and the `position: relative` every page pairing the two was writing on a
  wrapper by hand. The theme adds one thing, a spinner on `[data-state="pending"]`, drawn
  over the element box and moved with `--search-elemental-spinner-inset-inline` /
  `-block`; `prefers-reduced-motion` fades it instead of turning it. With scripting off it is
  a labelled field in a `<form>` that submits to its `action` — the search page, which is
  also what `Enter` does with the script when no row is under the cursor.

- **`<toolbar-elemental>`** — a row of buttons the arrow keys walk and `Tab` passes in one
  step, per the [APG Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

  A bar of six buttons is six tab stops between the reader and whatever comes after it. The
  pattern's answer is a roving `tabindex`: one stop for the bar, arrows between the controls
  inside it. That is the whole element — the role, the axis, and the one `tabindex="0"` that
  moves.

  Wrap the buttons and name the bar with `aria-label`; the element cannot invent a name and
  does not pretend to. `vertical` swaps the arrow keys and writes
  `aria-orientation="vertical"`. The ends do not wrap, because `Tab` is how you leave and a
  bar that looped is one a reader can walk forever without noticing.

  Related controls go in a `role="group"` with its own label, and the arrows run straight
  through it — six controls in two groups are one sequence, not two the keyboard has to enter
  and leave. Nothing has to be told about the group: controls are found wherever they sit, so
  a group, or a `<tooltip-elemental>` wrapped round a button, is a layer the walk sees
  through. The theme draws a rule between one group and the next and never off either end.

  Only `<button>` and `<a href>` are walked: a `<select>` or a text field wants the arrows
  for itself, so it is left alone and stays a tab stop of its own. A `disabled` control is
  skipped, since the platform will not focus one and a cursor that lands where focus cannot
  follow is a bar that stops moving — `aria-disabled` is how you keep one reachable and
  inert. Buttons that enable and disable as the document changes are watched for, so there
  is no refresh to forget.

  DOM it writes: `role="toolbar"` on itself, `aria-orientation="vertical"` only when
  `vertical` is set, and `tabindex` on every button and link inside it. With scripting off
  the buttons are buttons, each its own tab stop — the state the pattern improves on, not a
  broken one.

- **`<carousel-elemental>` takes `position-text`**, the name every unnamed slide gets. It was
  `1 of 10`, built in the code with no attribute behind it — the most-read string on the
  element, since a screen reader says it on arriving at every slide, and the only one a page
  could not translate. `position-text="{n} od {total}"` makes it `3 od 10`.

  The whole sentence rather than the word between the numbers, because `of` between two
  numbers is English's _shape_ as much as its word: Japanese counts the other way round,
  `{total} 中の {n}`. Set to nothing it falls back to the English rather than being honoured,
  since the alternative is `aria-label=""` and a slide with no name at all is worse than one
  named in the wrong language.

  The default is unchanged, so a carousel that sets nothing writes exactly what it wrote
  before.

- **`<carousel-elemental>` takes `roledescription-text` and `slide-roledescription-text`**,
  the last two words it said in English with no way out: `aria-roledescription`, which is
  `carousel` on the element and `slide` on each `<li>`. That attribute is
  [author-localized by definition](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription)
  — it replaces the name assistive technology has for a role, in whatever language that
  technology had it in — so shipping it hardcoded meant a Serbian page whose slides announce
  themselves in English and nothing the page could do about it.

  Whitespace is refused rather than written. MDN asks that the value contain "more than just
  whitespace characters", and honouring `" "` would override the role announcement with
  nothing at all: a reader stops hearing "group" and hears nothing in its place, which is
  worse than the English it replaced.

  That closes the set. Every word this element says out loud is now an attribute — nine of
  them, and the carousel page has [a sample with all nine
  set](https://stamat.github.io/book-of-elementals/elementals/carousel.html#in-another-language).
  Defaults are unchanged throughout, so a carousel that sets nothing writes what it always
  did.

- **`<suggest-elemental>`** — a list of links a text field drives with the arrow keys, per
  the [APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a
  listbox popup.

  Every search box, filter and "jump to" field grows the same panel, and every one of them
  rebuilds the same keyboard from scratch: the cursor that is `aria-activedescendant` rather
  than focus, so typing can carry on while you walk the list; `Enter` that belongs to the
  panel while it is open and to the form while it is not; and `Home`/`End`, which the pattern
  calls optional and answers two ways — jump the list, or, "if the combobox is editable", put
  the caret back on the first character. Both are right here at different moments, so they
  stay with the caret until an arrow key has put a cursor on a row and the reader has stopped
  writing.

  Give it a `<ul>` of `<a>` and point it at an input with `for`. Only `<a href>` becomes an
  option; the `<ul>` and its `<li>`s are marked `role="presentation"`, since a `listbox` may
  only own `option`s. Replacing the list's contents re-marks them — the element watches, so
  there is no refresh to forget, and forgetting one would be a list a screen reader cannot
  see.

  It fetches nothing, filters nothing, ranks nothing and announces no count: "5 results" is
  the language of whatever built the list. `open` is reflected and settable, so the thing
  that owns the query is the thing that shows the panel.

  `tab-completes` opts Tab into taking the row under the cursor instead of leaving the
  field — what a mention or emoji completer wants, where the row is text about to be typed.
  It is off by default and stays that way, because these rows are links: on the panel this
  element usually is, a Tab that took one would navigate off the page on a keystroke meaning
  "move along". With no row under the cursor Tab leaves regardless, so a panel with no answer
  never costs a second press.

  Not `<combobox-elemental>`, which is a view of a `<select>` — that one holds a value and
  its options carry `aria-selected`. These options are links: destinations, not values. The
  two share the cursor mechanics and nothing else.

  DOM it writes: `role="listbox"` and an `id` on itself, `role="option"` and an `id` per
  link, `role="presentation"` on the list boxes, `data-active` on the row under the cursor,
  and `data-side`/`data-align` for which corner the panel had room in — it writes no
  coordinates, so the panel stays inside your layout. On the field: `role="combobox"`,
  `aria-controls`, `aria-autocomplete="list"`, `aria-expanded` and `aria-activedescendant`.
  With scripting off it is a list of links, in flow and visible.

### Changed

- **`slide-text` and `remove-text` take a `{…}` placeholder, so the word order is the page's
  and not English's.** Both attributes handed the element a word and let it decide where the
  other half went: `slide-text` got a number appended after a space, `remove-text` got the
  option's label appended after a space. That is English's order and only English's.
  Hungarian numbers a slide `3. dia`, Japanese `3枚目`; German removes one with the verb last,
  `React entfernen`. No value of either attribute could reach any of them — a page could
  translate the word and was then stuck with the sentence built around it.

  A `slide-text` holding `{n}`, or a `remove-text` holding `{label}`, says where that half
  goes and the element only fills it in. `slide-text="{n}. dia"` is `3. dia`;
  `remove-text="{label} entfernen"` is `React entfernen`. Every value written before this
  keeps working unchanged, because an attribute with no placeholder in it still gets the
  number or the label appended exactly as it did.

  It matches `<search-elemental>`, whose `results-text` has taken `{n}` since it landed. No
  DOM or CSS change: the same `aria-label`, on the same buttons, with the words in the order
  the page asked for.

- **`<carousel-elemental>`'s rotation control is drawn, opaque, and counts down.** It was `▶`
  and `⏸` typed as text on a button whose fill lost a specificity fight — three faults in one
  corner. The pause glyph is missing from enough system fonts to come out as an empty box; a
  typed glyph sits wherever its designer centred it inside the em box, which in a round button
  is visibly off; and the `Canvas` fill meant to keep the control off the photograph behind it
  never applied at all, because the rule under it was one selector step short of the one that
  styles all four controls. A white icon over a white sky is a control nobody can find.

  It is now `play-24` — its triangle, without the ring it ships inside, since the button is one
  already — and `square-fill-24` from
  [Octicons](https://primer.style/foundations/icons/), on an opaque fill behind a `CanvasText`
  icon — the page's own contrast, whatever the slide does, and following `color-scheme` under a
  theme switch. Around it a ring sweeps once per `interval`, so the next slide is not a
  surprise and there is something to read the wait against.

  **DOM and CSS:** the rotation control holds an `<svg>` where it held a character. The element
  writes `data-carousel-rotating` on itself while the timer is running — with the timer and not
  with the button, since a pointer resting on the row holds the rotation while the control
  still says `Stop` — along with an inline `--carousel-elemental-tick` carrying the interval,
  which is the length the ring is animated over. The ring itself is the button's border, a
  conic gradient clipped to the border box over a fill clipped to the padding box, so it needs
  no element and no mask — with that same fill under the gradient and in a collar outside it,
  since a `CanvasText` sweep on a 20% track drawn straight onto a night photograph is a black
  arc on black. The new `--carousel-elemental-chip` is that fill and
  `--carousel-elemental-ring` its thickness, and the theme's shared hover no longer reaches
  this button, which draws its own. Under
  `prefers-reduced-motion: reduce` the ring does not sweep, and the control is still there.

- **`<combobox-elemental>` groups its options with weight and an indent instead of a
  hairline.** The optional theme drew a group's name small, dimmed and under a rule, with
  its members flush against every ungrouped row — so the only thing saying where a group
  started was a line, and the only thing saying where it stopped was a gap. The name is now
  bold at the list's own size, and its members sit in from it by `2.5 ×
--combobox-elemental-inset`, which is what the native `<select>` does with an `<optgroup>`.
  A loose option after a group is told apart by coming back out to the edge.

  **CSS:** `.combobox-elemental-group-label` no longer sets `font-size` or `color` and is
  `font-weight: 700`; the rule that drew `border-block-start` on the first visible group is
  gone, and `.combobox-elemental-group .combobox-elemental-option` now carries a
  `padding-inline-start`. A page that wants the line back sets the border itself — the
  classes are unchanged, and none of this touches the markup or the ARIA.

  The line was also the fiddliest thing in the file: it had to be suppressed at the top of
  the popup, and again whenever the filter hid every row above a group, which is a sibling
  selector that has to stay in step with how filtering hides things. Weight and indent need
  neither, and both survive forced-colors, where a hairline is repainted or dropped.

- **A `fade` carousel is as tall as the slide showing, and travels between the two heights.**
  It used to be as tall as the tallest slide, because every slide sat in one grid cell — which
  meant a stack of slides of different lengths carried a column of white space under every
  short one, for the whole life of the page, to avoid a box that jumped when the slide changed.
  Animating the height buys the second thing without paying the first.

  **DOM and CSS:** the slides are no longer a grid. The current slide is the only one left in
  flow; the rest are `position: absolute` at the top of the scroller, which is now
  `position: relative`. During a swap the element writes an inline `height` on the scroller and
  takes it back off the moment the transition lands, so a resize, a late font or a picture that
  finally loaded are answered by the layout and not by a measurement taken before them. A page
  that wants the old behaviour gives its slides a `min-block-size`.

  `--carousel-elemental-fade` is the duration for both, and under
  `prefers-reduced-motion: reduce` neither runs — the height changes at once, and is not pinned
  at all, since a pin comes off when its transition ends and a transition that never runs never
  ends. `swapHeight` is exported, which is that rule on its own.

- **`<optgroup>` reads as a group in `<combobox-elemental>`'s popup.** The name used to be one
  dimmed line among the options, with nothing marking where the set began or ended — a `Pear`
  under a `Citrus` heading was a claim about a pear. It now carries a rule above it, sits
  closer to its own options than to the group before them, and sticks to the top of the popup
  while any of its options are still on screen, so a reader scrolling a long list can always
  see which group they are in.

  Theme only: `.combobox-elemental-group` and `.combobox-elemental-group-label` are the same
  two elements they were, and `style.scss` is untouched. The numbers follow the ones the
  platform and the field already use — WebKit's UA stylesheet draws a customizable `<select>`'s
  `optgroup` label at `0.85em` in 70% of `currentcolor` with a rule above every group but the
  first, and MUI's grouped listbox makes the same heading sticky.

- **`<tooltip-elemental>` centres its bubble on the trigger at every width, and never
  outside the viewport.** It used to centre only on a control _wider_ than the bubble and
  align to an edge otherwise, on the grounds that a small button centred under a long
  sentence leaves most of that sentence beside the thing it describes. An icon button under
  a one-word bubble is what breaks that rule — barely narrower, and plainly wrong sitting off
  to one side of what it names — and the caret carries the pointing at either width.

  The bubble is then held inside the viewport whichever way it was aligned. The edge fallback
  used to be handed back unchecked, so a tooltip on a control at the very edge of the screen
  could be positioned at a negative coordinate and render partly off it.

  The centring decision itself is `placeFlyout`'s fifth argument, which is why the dependency
  floor moves to **`book-of-spells@^2.1.0`**. On 2.0.0 that argument does not exist, the call
  degrades to edge alignment, and the bubble goes back to sitting beside what it names — so
  the floor is the version, not the caret.

- **One hover tint across the book.** Every optional theme that tints a control under the
  pointer now mixes `currentcolor` at **10%**, which is what `menu`, `tabs` and `carousel`
  already used. Two were out of step and neither had a reason written down beside it:
  `--navbar-elemental-hover` was 4% and `--copy-elemental-hover` was 8%.

  A navbar link and a copy button therefore darken more under the pointer than before. Both
  are custom properties, so a page that liked the old value re-declares one line;
  `--copy-elemental-hover` keeps mixing into `--copy-elemental-surface` rather than into
  transparency, because that button is opaque on purpose — it sits over a code block.

- **`<combobox-elemental>` filters through `matchesSearch` from book-of-spells**, which is
  where the function moved now that a second filtering list wants it. The dependency is
  **`book-of-spells@^2.0.0`** — the major is theirs, for a `removeAccents` that folds letters
  it used to leave alone and a `keyboard` module split out of `dom`.

  Typing finds more than it did, in one direction only: `Þ`, `ẞ`, `Ŋ`, `ı`, `Ŧ` and `Ǥ` fold
  now, where before only `đ ð ł ø ħ` did. Nothing that matched before stops matching. The
  element's DOM, its roles and its CSS hooks are untouched.

  Two exports went with the move: `fold` and `matchesQuery` are no longer importable from
  `book-of-elementals/combobox`, and `fold` no longer exists anywhere — the stroked letters it
  was working around are handled inside `removeAccents` itself now, which is where the bug
  always was. Anything reaching for either wants `matchesSearch` from book-of-spells.

- **`<carousel-elemental>` reads its `fade` swipe with `swipe()` from book-of-spells**, which
  carries what this element had hand-rolled: pointer events, the axis the finger travelled
  furthest along, the gesture the browser takes back mid-scroll, the second finger that makes a
  swipe a pinch, and the click a committed swipe leaves on the link under it. Forty pixels
  across and further across than down still moves one slide, the mouse is still refused, and
  the DOM, the roles and the CSS hooks are untouched.

  One thing is newly observable: while the element is in `fade`, the scroller now dispatches
  book-of-spells' `swipestart`, `swipeend` and `swipe` events. And `swipeStep`, exported and
  the only piece of the gesture that stayed here, takes the direction the swipe reported —
  `swipeStep('left', rtl)` — rather than a pair of pixel deltas. Which way `left` points when
  the reader reads right to left is the carousel's question; how far a finger has to travel is
  not.

- **A page with a `<modal-elemental>` on it reserves the scrollbar gutter, so opening a modal
  no longer shifts the page behind it.** Locking the scroll takes the scrollbar away with it,
  and on a platform that draws a classic one the layout behind the backdrop is handed that
  width back as content and jumps sideways. The usual fix measures the scrollbar in script and
  pads the body by it, which is JavaScript for a question CSS now answers.

  **CSS:** `style.scss` adds `html:has(modal-elemental) { scrollbar-gutter: stable }` — from
  the first paint rather than with the open dialog, because a gutter that arrives with the
  modal is the same jump in the other direction on a page too short to have had a scrollbar.
  A page short enough not to scroll now shows an empty gutter where it showed none; `html {
scrollbar-gutter: auto }` in your own stylesheet takes it back, along with the shift. Safari
  before 18.2 does not implement the property and behaves as it did before — its scrollbars
  overlay the content, so there is rarely anything there to shift.

### Fixed

- **The `<script>`-tag bundle was missing three of the elements it claims to hold.**
  `dist/book-of-elementals.js` is documented as the whole book, and `src/iife.js` had never
  been extended past the elements that existed when it was written — `<carousel-elemental>`,
  `<suggest-elemental>` and `<toolbar-elemental>` were in the ES-module entry and in the
  stylesheets, and silently absent from the bundle. A page including it got the markup back
  as plain markup: a list of slides, a list of links, a row of buttons. Anyone loading the
  per-element bundles was unaffected.

- **The first `<suggest-elemental>` sample no longer loads the docs site into its own
  preview.** Its rows were relative urls, and a preview is a `srcdoc` frame with no url of
  its own: `accordion.html` resolved against the page around it, so following a row pulled
  the entire site into a frame a few hundred pixels tall, with no history behind it to come
  back from. The rows now carry `target="_blank"`, and the page says that is the preview's
  need rather than the element's — every other demo in the book uses a `#` fragment, which
  the frame already cancels, but this one is a "jump to" list and rows that go nowhere would
  be teaching the wrong thing.

  The sample also filters as you type, and reserves room below itself for the open panel.
  Typing did nothing before — correct for an element that does not filter, and impossible to
  tell from a broken one on first contact; the query now belongs to a few lines of the page's
  own JS, which is the division the page spends the rest of its length explaining.
  The room is a `margin-block-end` and not padding: the wrapper is the panel's containing
  block, so padding there pushes the panel down with it and back out of the frame.

  The field itself is drawn now — a border, a radius and an
  [Octicon](https://primer.style/octicons/) magnifier — because the sample was the one place
  a reader could see what the theme means by "nothing here styles your `<input>`", and an
  unstyled control next to a drawn panel read as an element that had forgotten half its job.
  The look is the sample's own CSS, out of the same system colours the theme uses, so it
  follows the page's light and dark like everything else. Docs only — nothing about the
  package changes.

- **The in-page samples no longer space an element's own rows like prose.** The docs theme
  gives every `<li>` `0.25rem` of margin, which is right for something being read and wrong
  inside a popup, where a row is a target and the gap between two of them is dead space the
  pointer falls into — the combobox at the top of its page had it, and so did the menus. The
  `<code-preview>` demos never did: those are a bare document in a frame, which is the whole
  reason this only showed on the samples written straight into the page. The rule keys off
  `li[role]`, so the rows an element marked lose the margin and the rows an author wrote —
  the checkbox group's list of real labels — keep it. Docs only.

- **`<tooltip-elemental>` no longer paints the bubble before it upgrades, in the `title`
  shape.** A trigger with a `title` and a matching bubble had its words on screen twice
  between parse and upgrade: once as the sentence in flow, once as the native tooltip the
  attribute still gave. The sentence is now hidden while the element is `:not(:defined)`,
  and **only** where the trigger still carries a `title`.

  Deliberately not hidden everywhere. In the other shape the sentence is the whole fallback,
  and a page whose script never lands would lose it — so the rule keys off `:has(> [title])`,
  which is exactly the case where the platform is already saying the same words.

- **The sidebar drawer example no longer slides itself shut on load.** Closed is the state the
  panel _arrives_ in — the element writes it at upgrade, from the `media` query — but the
  transform transition was live from the first frame, so on a load where the script landed
  after the first paint (a cold cache, a slow phone) the browser animated the gap between the
  rail the stylesheet had drawn and the closed drawer the script asked for: the page's opening
  move was the navigation leaving. The transition rules now key off a `sidebar-ready` class the
  page adds on the first tap, with a reflow between the class and the state so that tap still
  slides. Counting animation frames instead was tried and measured — a closed panel painted for
  two frames still slid in from nothing when the rule arrived.

- **Escape no longer closes the rail in the sidebar drawer example.** The page's light dismiss
  had no breakpoint test, on the reasoning that `media` would put `open` straight back — and it
  does not: the query writes the state when it _changes_, and a query that is still matching
  changes nothing. So Escape above the breakpoint closed a rail nothing could reopen, the
  toggle being `display: none` at that width. `close()` now returns early while the element
  reports `data-mode="pinned"`, which covers the scrim as well as the key.

  Both were the page's to get wrong rather than the element's, and `<disclosure-elemental>` is
  unchanged — but the example is what gets copied.

## [0.6.0] - 2026-08-07

### Added

- **`<carousel-elemental>`.** A row of slides you scroll through, per the
  [APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — previous,
  next, a picker with one button per slide, and, with `autoplay`, rotation on a timer with
  the control that stops it.

  **The scroll container is the state.** No transform engine, no cloned slides, no index
  attribute to keep in step with where the row actually is: the slides sit in a
  scroll-snapping list, moving means setting `scrollLeft`, and which slide is current is
  whatever an `IntersectionObserver` says is on screen. That is what makes it responsive
  for nothing — resize the window, change `--carousel-elemental-slide-size` at a breakpoint,
  or put the whole thing in a container query, and there is no listener to fire and no
  measurement to redo. There is no key handler either: a focused scroll container already
  answers to the arrows, <kbd>Home</kbd>, <kbd>End</kbd> and the page keys.

  **The arrows stop at the ends and say so before you press them.** The one with nowhere to
  go takes `aria-disabled="true"` and is dimmed, and the element carries the same fact as
  `data-carousel-at-start` / `data-carousel-at-end` for a page to style its own. The state is
  the scroller's answer to "is there anywhere left to scroll" rather than arithmetic on the
  index, which is the only version that holds when more than one slide is on screen: with
  three of five showing, the row is at its end while the current slide is the third. A row
  short enough to fit is at both ends, and both arrows go dim. The rotation is the one thing
  that wraps.

  **`fade` is the other mode**, and the only one where the scroller is not the state: the
  slides stack in one grid cell and cross-fade, the element holds the index, and the
  stylesheet draws from `data-carousel-current`. Same controls, same picker, same rotation,
  same events. It costs what it has to — the slides that are not showing are
  `visibility: hidden`, so they leave the accessibility tree, the tab order and find-in-page,
  and that is exactly the case the APG writes its live region for, so `fade` gets one:
  `polite` when a press moves the slides, `off` while it rotates. Scrolling there is no live
  region and no `aria-hidden` on anything, because every slide is in the tree the whole time.

  **`fade` also reads a touch swipe**, which is the one gesture this element handles itself. A
  scrolling row swipes because it _is_ a scroll container; a stack is not one, so on a phone
  `fade` had the buttons and the picker and nothing else. Forty pixels across, and further
  across than down, moves one slide — touch and pen, never the mouse, which keeps its text
  selection, its image dragging and its link clicks. It does not follow the finger (there is
  nothing to translate) and it does not wrap at the ends, where the arrow is dim and a gesture
  that still moved would disagree with the element's own controls. The stack takes
  `touch-action: pan-y pinch-zoom`, so scrolling down the page and zooming in stay the
  browser's, and a committed swipe swallows the one `click` a touch ending on a link fires.

  Rotation follows the pattern in full: the control is prepended to the element so it is the
  first tab stop inside, its accessible name says what pressing it will do and it carries no
  `aria-pressed`, hover and focus pause it, and rotation the reader started by hand ignores
  both until that same button stops it. `prefers-reduced-motion: reduce` means `autoplay` is
  not obeyed at upgrade — the control is still written, so the preference switches off motion
  nobody asked for without taking the choice away.

  **DOM:** on a `<ul>`/`<ol>`/`<menu>` of `<li>` slides, the element writes
  `aria-roledescription="carousel"` and `role="region"`/`"group"` on itself, `role="group"` on
  the list and on each slide with `aria-roledescription="slide"` and an `N of M` label,
  `data-carousel-current` on the slide showing, appends a `<div data-carousel-controls>`
  holding previous, the picker and next, and prepends `<button data-carousel-rotate>` when
  `autoplay` is set. The previous and next buttons hold an inlined Octicon chevron
  (`chevron-left-16` / `chevron-right-16`, MIT, © GitHub Inc.) rather than a text glyph, which
  is centred by construction where a glyph is centred wherever its font's designer put it.

  **The arrows go dim as a move starts, not as it lands.** A smooth scroll takes a few hundred
  milliseconds, so reading `scrollLeft` during it left the last press of next looking live all
  the way through the move that spent it. The element now records the position it asked the
  scroller for, clamped to the scrollable range, and answers for the buttons from that until
  the scroll arrives — with a one-second backstop, because a scroll the reader interrupts with
  a swipe never reaches where it was sent and there is no event for "that scroll was
  abandoned".
  The list gets `tabindex="0"` only when nothing inside the slides is focusable. Fewer than
  two slides and it leaves the markup alone. **CSS:** new `carousel.css` and
  `carousel-theme.css` bundles, and new `book-of-elementals/carousel` export paths; the
  aggregate `index.scss` and `theme.scss` include them. Slides are `box-sizing: border-box`,
  because the element sets their width and a padded slide would otherwise be wider than the
  scroller it has to snap inside. The scrollbar is hidden — through a selector the element
  only writes once it has upgraded, so a page whose script never lands keeps the scrollbar
  and the only way through the row that it has.

  Refusals are on the page rather than in options: no mouse drag, no vertical axis, and no
  `slides-per-page`, which is one custom property. No infinite loop either, and that one was
  measured rather than assumed: cloning the slides puts every slide in the accessibility tree
  two or three times over, and the clone-free version — rotate the DOM at the end and pull
  `scrollLeft` back by one slide — loops perfectly for the eye while leaving the reading order
  as `4 5 1 2 3` and dropping the focus out of any slide it moves, which is a keyboard user
  thrown to the top of the page every lap.

  **A row can bleed past the text it sits under**, which is the shelf every product page has:
  a fixed `--carousel-elemental-slide-size` so the next card is always half in view, negative
  margins out of the column, and the column's inset put back as `padding-inline` plus a
  matching `scroll-padding-inline-start`. Two element fixes came out of building it. `to()`
  now subtracts the row's `scroll-padding` on the start side, because scrolling a slide flush
  to the row's own edge lands past its snap point and a mandatory snap then carries on to the
  next slide — one press, two slides. And the current slide is now read off the layout at the
  snap edge rather than from "the earliest slide more than half in view": in a bleed layout
  the slide you just left sits in that padding still two thirds on screen, so the index never
  advanced and the next button stopped doing anything after one press. The observer's job is
  now purely _when_ to look, which is also what keeps this element free of a resize listener.

  **The current slide is re-read on scroll as well as on layout change.** The observer alone
  was not enough once the answer came from geometry: it fires when a slide crosses one of its
  thresholds, and a press that moves the row by less than that — the last step into a clamped
  end, or any step at all on a row of wide slides — crossed nothing, so the index stayed
  behind. Every following press was then measured from a stale number: previous appeared to
  work once and then did nothing at all, and next jumped several slides. The observer's
  remaining job is to notice that the layout changed, which is what keeps this element free of
  a resize listener.

  Two worked versions are in the examples, both rendered rather than previewed:
  [card-row](examples/card-row.html), the shelf above, and
  [lightbox](examples/lightbox.html) — a gallery whose thumbnails open
  `<modal-elemental>` with this element inside it in `fade`, opening on the picture that was
  clicked and cross-fading through the rest. Neither element needed a line of new code for
  that; the page adds six. It surfaces what `fade` is worth beyond the look: a carousel inside
  a closed `<dialog>` measures zero, so the scrolling row has to be moved after `modal-toggle`
  rather than on the click, while a stack has nothing to measure and takes the index while the
  dialog is still shut — which is also what makes the opening jump instant, since a transition
  on a box nobody is rendering never runs. It bleeds to the edge of the
  window rather than to the edge of the text column, which is the only part of it coupled to
  the docs theme's own measurements — the page says which, and why the cheaper version reads
  as a row that has been cut off rather than one that runs off.

  It supersedes [slidescroll](https://github.com/stamat/slidescroll) and
  [slideswap](https://github.com/stamat/slideswap), which will be archived.

- **A versioning section in the README**, which the file had gone without. Semantic
  versioning is the easy half; the half worth writing down is what the version is _about_,
  because nothing here is called from your code. The markup an element writes and the hooks a
  stylesheet reaches for are what a major is spent on, and the themes are explicitly not:
  they are one look meant to be replaced, so the custom properties they read are covered and
  the values are not. It also says what `0.x` means while it lasts, and that
  `<carousel-elemental>` is the reason for waiting.

- **`script/a11y` fails on a reference that points at nothing** — `aria-controls`,
  `aria-labelledby`, `aria-describedby` or `aria-activedescendant` naming an id no element
  has. axe will not decide this one: a menu button carrying `aria-controls` beside
  `aria-haspopup` may legitimately name a popup that is not in the document yet, so it
  answers "unable to determine" and a typo in any of those attributes failed no run, on any
  element. Checked in each state rather than once per preview, since
  `aria-activedescendant` is written when a listbox opens and gone when it closes. Nothing
  in the book was dangling; the check went in green and stays that way.

### Changed

- **The a11y sweep says what it could not decide, and why.** "Needing review" was printed as
  a bare count per rule, which named a number nobody could act on: the 88 contrast checks it
  reports are four different situations, and three of them are permanent. They are now
  grouped by reason — a background under an overlapping box, a background from a pseudo
  element, content with no text in it — so a reason nobody recognises is the one to go and
  read. The header comment also stops implying the sweep settles contrast on its own, and
  says whose contrast it is once a page restyles: the elements are light DOM so that they
  can be restyled, and the first colour an author changes is the last one those numbers
  describe.

## [0.5.1] - 2026-08-05

### Fixed

- **`<accordion-elemental class="grouped">` drew every seam twice as dark as the card's
  outer edge.** The theme's border is mixed out of `currentcolor` and so is translucent,
  and the run pulled neighbouring panels onto each other by a pixel to share a border —
  two translucent lines in one pixel composite to roughly twice the alpha. Panels now sit
  flush and every one after the first drops its own `border-top` instead, which is one
  line at the colour the property actually asks for. **CSS:** in `accordion/theme.scss`
  only, and only under `.grouped` — `> details + details` no longer carries
  `margin-top: -1px`. A page overriding that rule to restore the overlap will now stack a
  border on top of a border; a page that only sets
  `--accordion-elemental-border-color` needs no change.

### Changed

- **The elementals have an index page.** `elementals/index.html` is what the sidebar's
  "Elementals" section now points at as its overview: every element in the book with the
  pattern it implements, in two tables — the eleven an APG pattern covers, and
  `<copy-elemental>`, which has none to have. The home page keeps the heading and loses the
  table, because the same list in two places is two lists to keep in step. Docs pages are
  ordered alphabetically in the sidebar with the pattern-less one last, and so are the
  examples. Docs only — nothing about the package changes.

## [0.5.0] - 2026-08-05

### Added

- **`<modal-elemental>`.** A native `<dialog>` opened with `showModal()`, per the
  [APG Modal Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — which
  is mostly the browser's work, and deliberately so. The top layer, the `inert` page behind,
  the focus that goes in and comes back, <kbd>Escape</kbd>, and **nesting** all come from
  `showModal()`: a second modal is a second entry in the top layer, and the browser computes
  inertness from the topmost one, so there is no parent tracking and no focus trap here.

  What the platform leaves behind is the element. An **exit animation**, which otherwise
  needs the [`overlay`](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay) property
  that Firefox and Safari do not have — the element holds the dialog open until its
  animation has finished and closes it then, which keeps it in the top layer for the fade.
  Bounded by what that animation says about itself, and by two seconds whatever it says: a
  transition that stalls, or an engine that never keeps its `finished` promise, must not be
  able to leave a modal nobody can close. A
  **click on the backdrop**, which otherwise needs `closedby` support Safari does not have
  either. The page behind **not scrolling**. One sheet of dim rather than one per modal. And
  `aria-labelledby` pointed at the first heading inside, since a `<dialog>` takes no name
  from its contents and an unnamed one is announced as "dialog" and nothing else. And the
  cross in the corner: the APG strongly recommends a visible close button, and HTML stops at
  `<form method="dialog">`.

  Triggers are HTML's own invoker commands, `command="show-modal"` and `commandfor`, handled
  by the element rather than left to the browser: that is what makes the close animated, and
  it is a polyfill for browsers without them for free. `<a href="#id">` opens one too — the
  fragment in the URL opens the modal it names, and the back button closes it. All of them
  are matched by `id` on the document, so a trigger can sit anywhere, including inside
  another modal, and that extends to script: a `showModal()` or `show()` called on the
  `<dialog>` itself — which is what `document.getElementById()` hands you — is picked up by
  the element and animated in, counted in the backdrop stack and given the scroll lock,
  exactly as though a button had done it. `closedby` takes HTML's three values with HTML's
  default, and `close-others` replaces the stack instead of adding to it.

  Closing stops what was playing: `<video>` and `<audio>` inside are paused, and every
  `<iframe>` is reloaded, since a cross-origin player cannot be paused from the page holding
  it. That is the whole of the lightbox and video support — the docs page shows a lightbox, a
  `<video>`, YouTube and Vimeo as markup in a dialog, with nothing switched on.

  **DOM it produces:** inside the `<dialog>`, as its first child, a
  `<button type="button" class="modal-elemental-close" command="request-close">` — the cross,
  named by `close-text` (default `Close`) and written unless `closedby="none"`. First child
  rather than last so the reading order, the tab order and where it is drawn agree, which
  also makes it where focus lands: put `autofocus` on a field to move it. On the `<dialog>`
  itself — a generated `id` if it had none, `aria-labelledby` if it had no name,
  `data-state="open"`/`"closing"` while it is on screen, and `data-depth` numbering it in the
  stack. A `closedby` written on the `<dialog>` is
  **moved up** to the `<modal-elemental>`, because a browser that supports it natively would
  light-dismiss the modal itself, instantly, with a `cancel` event that
  [cannot be prevented](https://html.spec.whatwg.org/multipage/interactive-elements.html#light-dismiss-open-dialogs).
  Nothing is wrapped and nothing is moved. A bubbling `modal-toggle` carries `open`, `dialog`
  and `depth`.

  **CSS it writes:** `style.scss` styles `modal-elemental > dialog`, its `::backdrop` and
  `.modal-elemental-close` — the cross is `position: absolute` in the dialog's corner, which
  the browser's own `position: fixed` on a modal dialog already makes the containing block
  for. `theme.scss` paints it round and quiet, reserves room for it on the element that
  follows it so a heading does not run underneath, and gives the dialog a hairline border and
  a two-layer shadow, because a dark box on a dark backdrop is two shades of the same thing
  without one. `style.scss` also
  sets `overflow: hidden` on the root while a modal is open — the one rule in this book that
  touches the page around an element, because `inert` never stopped a wheel. The dim itself
  is in `style.scss` rather than the theme: the APG only lets a dialog call itself modal when
  the page behind is obscured as well as inert.

  **Degrading:** with no script at all, `<a href="#id">` still reaches the dialog —
  `style.scss` shows it in the flow of the page, not modal, rather than leaving it
  `display: none`. With no script but a browser that has invoker commands,
  `command="show-modal"` opens it natively, without the animation. Under
  `prefers-reduced-motion` there is no transition and the close is immediate.

  It replaces [modally](https://github.com/stamat/modally), which is now deprecated. Nesting,
  `closeOthers` and hash-driven opening are here; the width and alignment options are custom
  properties, which is what they always were.

- **`<copy-elemental>`.** A real `<button>` that writes text to the clipboard and announces
  it. There is no APG pattern behind this one, because there is no widget — it is a button,
  and a button is already accessible. The gap is the half after the click: every copy button
  swaps an icon or floats a "Copied!" tooltip, and neither reaches a screen reader, which
  leaves [WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html)
  unmet. Closing that is the whole of the element.

  `for` names the element to copy — a field by its current `.value`, anything else by the
  text it shows, with leading newlines and trailing whitespace stripped so a code block does
  not paste a command that runs itself. `value` is literal text, never trimmed, and wins over
  `for`. `copied-text` and `error-text` are what gets announced. Naming nothing to copy, or
  a `for` that points at nothing, is reported as the failure it is rather than quietly
  writing an empty string over whatever the reader already had on their clipboard.

  **DOM it produces:** one `<span role="status" class="copy-elemental-status">` appended to
  the element at upgrade — a live region only announces text arriving in one already in the
  document, so it cannot be built at the moment there is something to say. `style.scss`
  clips it out of sight rather than hiding it, since `display: none` would take it back out
  of the accessibility tree. On the element itself: `data-state="copied"` or `"error"` for
  two seconds after a press, and `data-unavailable` when there is no clipboard API or
  nothing named to copy. On the button: `type="button"` if it had no `type`, so a copy
  button in a form does not submit it. A bubbling `copy-done` carries `detail.ok` and
  `detail.text`.

  **Degrading:** `style.scss` keeps the button out of reach until the element has upgraded
  and found `navigator.clipboard` — which does not exist over plain `http`. No script, an
  insecure page, or nothing named, and there is no button rather than a dead one.

- **`<checkbox-group-elemental>`.** The "select all" over the checkboxes it stands for, per
  the [APG Checkbox (Mixed-State) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/):
  ticked when all of them are, empty when none are, showing the dash when it is some. The
  dash is `HTMLInputElement.indeterminate`, which has **no HTML attribute behind it** and can
  only be set from script — that is the whole of the gap. It is also purely visual, since a
  checkbox submits on `checked` alone, so give the parent no `name`.

  Pressing the parent cycles the APG's way: mixed → all on → all off → **back to the
  combination the children were last mixed in**, so a partial selection survives a press
  instead of being destroyed by it. That third step is skipped when there is nothing partial
  to restore — no memory, or one taken when the group was a different size. A disabled
  checkbox is outside the set the parent speaks for: never moved, and never counted, since
  counting an unticked one would put "all" out of reach and leave every press computing
  "some" and changing nothing. Every child that does move fires `input` and then `change`,
  exactly as clicking it would, so nothing listening downstream is left holding stale state.
  One level, not a tree: a group nested inside another is a separate group.

  **Degrading at any depth:** the stylesheet hides the parent until `:defined`, which reaches
  a direct child and no further — CSS cannot say "the first checkbox anywhere below me", and
  a select-all in a table header is three elements deep. Writing `hidden` on the parent does
  the same job anywhere: the element removes the attribute on upgrade and puts it back if it
  ever leaves the page.

  **DOM it produces:** nothing is moved, wrapped or given an attribute it did not have. On
  the parent checkbox it sets the `checked` and `indeterminate` properties; on itself it
  writes `data-state="all"`, `"some"` or `"none"`. No `role` and no `aria-checked` anywhere,
  because a native checkbox with `indeterminate` set is already announced as mixed — which
  is where this parts company with the APG's own example, deliberately: that one builds the
  parent as a `<div role="checkbox">` and pays for it with the label association, the focus
  ring, `Space`, `disabled` and submission.

  **CSS you can target:** `checkbox-group-elemental[data-state]`, the native
  `input:indeterminate` selector, and the eight `--checkbox-group-elemental-*` properties in
  the optional theme — which draws the checkbox itself (`appearance: none` on a real
  `<input type="checkbox">`), because `accent-color` recolours the browser's box and can say
  nothing about its size, its corners, or the weight of the dash. Everything is scoped inside
  the element, so the rest of the page's checkboxes are left as the browser drew them.
  `style.scss` hides the parent and its label until `:defined`, since a select-all that
  selects nothing is worse than none at all.

- **`styles/checkbox.scss` — the drawn checkbox, for any checkbox.** The look
  `<checkbox-group-elemental>` needed, on its own, because a page cannot have one drawn
  checkbox and a browserful of default ones. **Opt in with a class**, which marks a
  container — and a `<label>` is a container:

  ```html
  <form class="checkbox-elemental">…</form>
  <label class="checkbox-elemental"
    ><input type="checkbox" /> Remember me</label
  >
  ```

  ```scss
  @use "book-of-elementals/checkbox.scss";
  ```

  Never a bare `input[type="checkbox"]` selector: importing this book's theme for an
  accordion must not silently redraw every checkbox on the page. New exports
  `book-of-elementals/checkbox.scss` and `/checkbox.css`, plus
  `dist/book-of-elementals-checkbox.css` for the CDN; it comes in with
  `checkbox-group/theme.scss` already, so a page using the group only needs the class where
  it wants the rest to match.

  **CSS you can target:** the eight `--checkbox-elemental-*` properties, set on whatever
  carries the class. Unlike every element theme here they are declared on nothing and live
  in the `var()` fallbacks, deliberately: a property set on an element beats one inherited
  from an ancestor, so declaring them on `checkbox-group-elemental` would leave a group
  inside a tuned form wearing the shipped size while every checkbox beside it took the
  form's. The input also takes `font: inherit`, without which every `em` here is a fraction
  of the UA's 13.3px control font rather than of the text beside it.

  This is the only look in the package that is not an element's, and the line it sits on is
  now stated in CONTRIBUTING.md: a control gets a look here only when an element cannot be
  drawn without one.

- **`<combobox-elemental>`.** A native `<select>` given a text field to search it with, per
  the [APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). The
  `<select>` stays the control — it holds the value and submits under its own `name`, and
  `required`, `disabled`, reset, restore and `<fieldset disabled>` are the browser's — so
  the element has no event of its own: a pick sets `option.selected` and the `<select>`
  fires `input` and then `change`. `multiple` on the `<select>` is what adds a chip per
  selection, a remove button on each, and `Backspace` on an empty field — and no caret,
  since a caret is the mark of a control holding one value and the chips have already said
  otherwise. Attributes: reflected `open`, `placeholder`, `empty-text`, `remove-text`. The
  search matches anywhere in a label and folds on both sides — `removeAccents` from
  book-of-spells plus a pass for the stroked letters it cannot reach — so `cacak` finds
  Čačak, `dordevic` finds Đorđević, `strasse` finds Straße, and `бео` still finds Београд,
  which `slugify` would have reduced to an empty string.

  **Validation:** the browser's `invalid` bubble is cancelled and its message kept, because
  the bubble would be aimed at a control the reader cannot see. The text goes into a
  `role="alert"` under the field — `select.validationMessage`, so it is the platform's own
  words in the reader's own language — the field takes `aria-invalid` and an
  `aria-describedby` pointing at it, and focus lands on the field, for the first invalid
  control in the form only. Choosing a value clears all of it.

  **DOM it produces:** this one builds markup, unlike the elements that wrap a native
  widget. Inserted before the `<select>` — so a `<label>` around the element names the
  field rather than the hidden control — it writes a
  `<div class="combobox-elemental-field">` holding the chips, an
  `<input role="combobox">` and — on a single select only — an `aria-hidden` indicator
  button, plus a `<ul role="listbox" class="combobox-elemental-list">` of
  `<li role="option">`, with `<optgroup>`s becoming a nested `<ul role="group">`, and a
  `<p class="combobox-elemental-error" role="alert">` for the validation message. On the
  `<select>` itself: `class="combobox-elemental-native"`, `tabindex="-1"` and
  `aria-hidden="true"`. An explicit `<label for>` is re-pointed at the field. All of it is
  undone when the element leaves the page.

  **CSS you can target:** `combobox-elemental[open]`, the `combobox-elemental-*` classes
  above, `[data-active]` for where the cursor is, `[aria-selected]` for what is chosen —
  drawn differently on purpose, since they are two facts about one row, and the pointer
  moves the cursor rather than lighting a second row — `[aria-invalid]` on the field,
  `[data-side]` for which way the popup opened, and the nine `--combobox-elemental-*`
  properties in the optional theme. `--combobox-elemental-inset` is spent three times — the
  field, the gap before the caret, the side of every option — and nowhere else, so the
  popup's text lines up under the field's. While it is open the popup is joined to the
  field: the corners they meet at square off, their borders pull onto each other, and the
  focus ring turns inwards (`outline-offset: 2px` to `-2px`) rather than being drawn across
  the seam. The `<select>` is hidden by
  being made transparent and un-clickable rather than by `display: none`, deliberately: a
  `display: none` control that is `required` blocks its own form, because the browser
  refuses to submit and cannot focus what it cannot draw. Restyle that rule and keep it
  rendered. The focus ring is in `style.scss` rather than the theme, since a control whose
  focus cannot be seen is broken rather than unstyled.

- **`<segmented-elemental>`.** One choice out of a few, drawn as a track with a knob that
  slides under the checked segment — the N-state answer to `<switch-elemental>`. The
  segments are native `<input type="radio">` inside `<label>`s, so arrow keys, `Tab` in
  and out of the group once, submission under the shared `name`, `required`, reset,
  restore and `<fieldset disabled>` are all the browser's; the element writes no roles and
  no `aria-checked`, and has no event of its own, because a radio already fires a bubbling
  `change`.

  **DOM it produces:** nothing is moved or wrapped. On itself it writes the custom
  properties `--segmented-elemental-index` and `--segmented-elemental-count`, a matching
  `data-index` attribute, and `role="group"` — that last one only where the element
  carries an `aria-label` or `aria-labelledby` and no `role` of its own, since ARIA on a
  roleless element is read by nothing.

  **CSS you can target:** `segmented-elemental[data-index]`,
  `segmented-elemental > label:has(> input:checked)`, and the thirteen
  `--segmented-elemental-*` properties in the optional theme. The knob hangs off
  `data-index`, so no script and no selection both come out as no knob rather than as a
  knob on the first segment. The focus ring lives in `style.scss` rather than the theme,
  because the radio it belongs to is a hidden pixel and a control whose focus cannot be
  seen is broken rather than unstyled.

- **`<tooltip-elemental>`.** A description shown on hover and on focus, wired to the control
  it belongs to — and still a plain sentence on the page when the script never arrives, which
  is the part every other tooltip gives up. The
  [APG's pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) says of itself that it
  "is work in progress; it does not yet have task force consensus", so this ships the half
  every source agrees on and refuses the half they do not: `aria-describedby` to the words,
  <kbd>Escape</kbd> to dismiss, no timeout, and a bubble the pointer can rest on, which is
  [WCAG 2.2 SC 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html);
  never the control's name, and **nothing at all on touch**, since a tap is activation rather
  than hover. Nothing essential belongs in one, and that is written on the docs page rather
  than left for someone to discover.

  Two shapes, and nothing selects between them: wrap a control and its words, or write the
  words alone with `for` naming a control elsewhere. The element contains something focusable
  or it does not. A `title` is read when there is nothing else to say and the attribute is
  removed so the native tooltip does not double up — becoming the control's **description**
  when it had a name already, and its **name** when that `title` was the only one it had.

  `horizontal` puts the bubble beside the control rather than over or under it, and that is
  the only placement knob there is: the axis is the author's, the side is the viewport's.
  Every other library offers a fixed `n`/`e`/`s`/`w`, which is a tooltip off the edge of the
  screen on the one page where it did not fit — and since the element measures anyway to know
  whether a side fits, a preference that loses to the measurement is a knob that mostly does
  nothing.

  **DOM it produces:** on the bubble, `role="tooltip"`, an `id` if it had none, `hidden`
  between showings, `data-side` (`block-end`/`block-start`, or `inline-end`/`inline-start`
  with `horizontal`) and `data-align` (`start`/`end`), `top`/`left` in viewport pixels, and
  `--tooltip-elemental-arrow-offset` — the middle of the trigger, measured from the bubble's
  own start edge, so a caret points at the control rather than at whichever corner the bubble
  aligned to. Clamping it belongs to the stylesheet, where the corner radius lives. On the trigger, `aria-describedby` appended to any it
  already had, or `aria-label` in the `title`-was-the-name case, and its `title` removed when
  those words became the bubble. The bubble is hidden rather than emptied because
  `aria-describedby` reads hidden content: the description is on the control the whole time,
  and there is no state for a screen reader to be told about.

  Along the other axis it lines up two ways, because a wide control and a narrow one want
  opposite things: a control **wider** than its bubble is centred on, so the caret leaves the
  middle of both, and a **narrower** one has its edges lined up. Centring gives way to the
  viewport and never the other way round.

  **CSS you can target:** `tooltip-elemental [role="tooltip"]` with its `data-side` and
  `data-align`, and ten `--tooltip-elemental-*` properties in the optional theme — declared on
  `tooltip-elemental` itself, at one type selector's worth of specificity, so a page overrides
  one by writing the same selector later rather than having to out-specify the theme. It is
  placed `position: fixed` against the viewport rather than an offset parent, so a bubble is
  not clipped by anything scrolling between it and its trigger.

  The optional look takes GitHub's proportions — a 6px radius, `0.5em 0.75em` of padding,
  small body text, a 250px cap — and adds a rim and a caret, neither of which Primer's tooltip
  has. It fades in and out over `--tooltip-elemental-duration`, which needs `@starting-style`
  and `transition-behavior: allow-discrete` to work at all against a `hidden` bubble; both are
  Baseline 2024, so on Safari 17.0–17.4 and the iOS versions of those numbers it appears and
  disappears without fading. `prefers-reduced-motion: reduce` turns it off everywhere else,
  and under `forced-colors` the surface and rim are re-pointed at system keywords.

### Changed

- **The shared maths moved to [book-of-spells](https://github.com/stamat/book-of-spells) 1.5.0**,
  which is now the minimum. `ElementBase`, `define`, `nextIndex`, `typeAheadIndex` and the
  `placeFlyout`/`placeSubmenu` placement pair had been living here and were wanted by both
  libraries; `src/core.js` re-exports them, so every import path in this package is unchanged.

### Fixed

- **`<combobox-elemental>` no longer makes iOS zoom the page in on focus.** The input takes
  the page's font, and iOS Safari zooms in on any text field that computes under 16px —
  then leaves the page zoomed after the field is done with, so a page set in 14px cost the
  reader a pinch every time they opened the combobox.

  **CSS this changes:** the input's `font-size` is `max(16px, 1em)` — the inherited size
  wherever it already clears the bar, 16px where it does not. `16px` and not `1rem` because
  the threshold is absolute and a page that re-points its root font-size would slide under
  it. Nothing changes on a page whose text is already 16px or larger. On a smaller one the
  typed text is now 16px everywhere, on a desktop as much as on a phone, while the chips and
  the options beside it stay at the page's size: no pointer query, because one rule that
  reads the same on every device is worth more than the second type size it saves. Override
  it on `.combobox-elemental-input` if you would rather have the page's size and the zoom.
  The other cure — `maximum-scale=1` in the viewport tag — is not the element's to reach for
  and is worse where it is honoured: it caps the zoom of the whole page for every reader.

- **`<disclosure-elemental>` no longer overshoots on opening.** A region whose first or
  last child carried a margin — a `<p>` in a `<figcaption>`, a `<table>` in a `<div>` —
  slid open past where it was going to sit and snapped back at the end. The slide measures
  the region under an `overflow: hidden` it sets itself, which makes the region a block
  formatting context, so those margins counted inside the measurement; at rest the overflow
  is gone and they collapse back out through the region's edges, leaving it shorter than it
  was measured to be.

  **CSS this changes:** `.disclosure-elemental-region` is now `display: flow-root`, so the
  measured height is the resting one. Margins on the region's own children no longer
  collapse through it into the page — put the gap on the region if you were relying on
  that. The rule skips `tr`, `td`, `th`, `thead`, `tbody`, `tfoot` and `caption`, where
  `display` is the table's structure, and it carries a single class's specificity, so a
  region you give a `display` of your own still wins.

- **`<disclosure-elemental>`'s gap no longer closes after the panel has gone.** The
  region's margin is transitioned so it shuts with the height, but it was zeroed on
  `[hidden]` — and `hidden` cannot land until the close slide is over, since it is what
  stops the region's contents being rendered. So the panel slid shut over a quarter
  second and the gap it left behind took another quarter second of its own.

  **DOM this adds:** the region now carries `data-state="open"` / `"closed"`, flipped with
  the click rather than with the slide. It says what `hidden` says; it can just be written
  at the moment a transition has to start, and it reaches the regions `for` puts out of the
  button's reach. **CSS this changes:** `margin: 0` moved from
  `.disclosure-elemental-region[hidden]` to `.disclosure-elemental-region[data-state="closed"]`.
  `padding`, `border` and `box-shadow` stay on `[hidden]` — none of them is transitioned,
  and they are about the box the closed region leaves behind.

## [0.4.0] - 2026-08-04

### Added

- **`<navbar-elemental>` takes `min-bar-items`.** A bar keeps being a bar until nothing at
  all fits on it, and the stop before that is a header showing one link beside a **More**
  button — a drawer wearing a bar's clothes. `min-bar-items="2"` says two links have to fit
  or this is a drawer. The default is `1`, which is what the element has always done, so
  nothing changes for markup that does not ask.

### Changed

- **The hamburger turns into an X while the drawer is open.** It used to be one masked
  Octicon that did not move. Two beats: the three bars converge onto one line as the middle
  one loses its colour, and then the icon spins about its own centre while the remaining two
  cross. Closing unwinds it in the other order — spin back, then separate — rather than
  running one sequence backwards through a shape that is neither.

  **DOM:** the element now writes `<span data-navbar-bars aria-hidden="true">` as the first
  child of `[data-navbar-toggle]`, and removes it again when the element leaves the
  document. Three bars need three boxes and a button brings two pseudo-elements, so the
  middle one has to be an element. A toggle you have styled yourself is unaffected unless it
  styles `:first-child`; the span carries no look of its own without the optional theme.

  **CSS:** `--navbar-elemental-bar-thickness` (`2px`) and `--navbar-elemental-bar-gap`
  (`0.35em`) are new, and `--navbar-elemental-hamburger-size` is now the icon's width rather
  than a square. The animation is off under `prefers-reduced-motion`.

  A toggle holding nothing but the icon is also a square now
  (`:has(> [data-navbar-bars]:only-child)`), where before it was the icon's own box plus
  padding — and the icon is two pixels tall, so the hover backdrop was the shape of a hyphen
  and the tap target with it. The side is a row's height, `calc(1lh + 0.7rem)`, so the
  backdrop under the hamburger is the backdrop under a link; browsers without the `lh` unit
  get the same sum in `em`. A toggle with a label beside the icon is unchanged.

- **One hover backdrop, everywhere.** `--navbar-elemental-hover` was `currentcolor` at 10%,
  which is a shade heavier than the icon buttons a header usually has beside the navigation —
  so a page that styled its own furniture ended up with two tints in one bar. It is 4% now.
  A page that had re-pointed the property is unaffected; one that had matched the old value
  by hand is the case to look at.

- **The drawer hangs off the bar instead of floating under it.** In the optional theme only:
  no top border and no top corners, so there is no seam between a bar and the panel it
  opened, and `max-block-size: calc(100dvh - 100%)` with `overflow-y: auto`, so a navigation
  taller than the screen ends in a scrollbar rather than below the fold. The ceiling is right
  while the header is at the top of the viewport, which is where a header that opens a drawer
  is — scrolled halfway down a page, the drawer is shorter than it needed to be.

  **CSS:** the drawer is clipped along its own top edge (`clip-path: inset(0 -100vmax
-100vmax)`). A drop shadow spreads in every direction, and this one was landing _on the
  bar_ — a smear along the header that appeared the moment the drawer opened. The same
  property is the open and close animation: the bottom inset walks from `100%` to `0`, so the
  drawer is uncovered from under the bar rather than travelling over it. If you were painting
  something out of the drawer's own box on purpose, that is the one case that changes.

  A page whose bar draws its own bottom border needs one pixel back — the drawer is
  positioned against the element's padding box, which is inside that border:

  ```css
  navbar-elemental[data-mode="stack"] .rail > ul:not([data-navbar-probe]) {
    margin-block-start: 1px;
  }
  ```

### Fixed

- **On a page with no global `box-sizing` reset, `<navbar-elemental>` and `<menu-elemental>`
  items overhung the box they sit in.** Both optional themes size an item with `width: 100%`
  — which is what makes a `<button>` fill the row a link already fills — and then pad it.
  Under the default `content-box` that is the row's own width _plus_ a rem, so in the navbar
  each label ran a rem into the one after it, and in the menu every item hung out of the
  panel with its hover backdrop: a tinted bar sticking out of a rounded frame. The navbar had
  it worse than it looked, too — the copy being measured overhung as well, so the row was
  measured wider than it renders and links folded away early.

  **CSS:** `li > a` and `li > button` now say `box-sizing: border-box` themselves rather than
  assuming the page has said it. A page that already resets it sees no change.

- **The overflow button could end up half under whatever sat beside the bar.** A row with
  two or three dropdown triggers in it measured short, so the element kept links on a bar
  that had no room for them: the last of them — usually **More** itself — hung past the rail
  and was clipped by it, sliding under the search field. It got worse the more triggers a
  navigation had, and it needed no resize to happen; it was wrong at that width from the
  start.

  The copy of the row that gets measured is built with its panels removed, and
  `aria-expanded` is written later, on the row. So nothing in the copy said "this button
  opens something", the optional theme draws its caret on `li > button[aria-expanded]`, and
  every trigger in the copy measured a caret narrower than the button it stood for — three
  triggers, about fifty pixels of room that was not there. The copy's triggers now carry
  `aria-expanded="false"` from the moment they are made, so what is measured is the width
  that will be rendered.

  Worth knowing if you theme this yourself: **anything you draw on a trigger has to be drawn
  on the copy too**, or it is width the measurement cannot see.

- **`<navbar-elemental>` with `hover` closed the panel you were pointing into.** Moving the
  mouse from a trigger onto its own panel shut it, which made every hover panel unreachable
  by pointer: you could open one and never reach a link in it.

  The rule read the control under the cursor, and a link inside a panel opens nothing — so
  "close everything with no panel under the cursor" closed the panel the cursor had just
  walked into. It now reads the row item the pointer is inside, however deep, and the bar's
  own chrome — the padding between a trigger and the panel hanging under it — is no longer
  an instruction to close anything. Leaving the element still closes them, after the same
  beat it always did.

- **`<navbar-elemental>` no longer gives the page a horizontal scrollbar.** The copy of the
  row the element measures is deliberately wider than the box it sits in — that overhang
  _is_ the measurement — but nothing clipped it, so it counted toward the document's
  scrollable width like any other content. A header whose links did not fit therefore handed
  the whole page a sideways scroll, to reach a row that is invisible and always will be. On a
  phone, where the row rarely fits, this was every page: the prose scrolled off the right
  edge with it.

  **CSS:** the rail — whatever box you put the row in, which the element marks
  `data-navbar-rail` — is now `overflow: clip` with an `overflow-clip-margin` of half a rem.
  `clip` rather than `hidden` because `hidden` makes a scroll container, and a scroll
  container cuts the focus ring off every link in the row: an outline is painted outside an
  item's box, the items are exactly as tall as the rail, and the first of them starts exactly
  at its edge. The clip margin is the ring's room, and it has to be both axes — Chrome
  honours the margin only when both are clipped. Half a rem of a `visibility: hidden` copy
  paints nothing. Nothing else is clipped by it: on a bar the
  panels are absolutely positioned with nothing positioned above them, so the page is their
  containing block and this clip is not in their chain; stacked, the drawer is positioned
  against `<navbar-elemental>`, which is above the rail rather than under it. A page that was
  painting something out of the rail's own box on purpose is the one case that changes.

  The clip cannot go on the copy instead, which is the obvious place for it: the element
  roots its `IntersectionObserver` there, and clipping an observer's root stops Chrome
  re-measuring when the bar grows — the links fold away and never come back.

## [0.3.0] - 2026-08-03

### Fixed

- **A closed region no longer paints a shadow into the page.** The element's stylesheet
  already zeroed the region's margin, padding and border while `hidden`, so a collapsed
  region could not leave a strip behind; `box-shadow` is now zeroed with them.

  It matters for a region that is closed by being moved rather than by being unpainted — a
  drawer parked off-canvas under a `translate` still paints, and a shadow reaches out of its
  box by its blur radius, so an invisible panel smears down the edge of the viewport it just
  left. **CSS:** `.disclosure-elemental-region[hidden]` now sets `box-shadow: none`. A page
  that wants a shadow on an open panel and had been relying on it applying while closed
  should scope it as `:not([hidden])`, which is also the form that survives a selector of
  equal weight winning on cascade order.

### Added

- **`media` on `<disclosure-elemental>`.** A media query that owns `open`: the region is
  held open while it matches and closed when it stops, so a navigation rail that becomes a
  drawer — or a long description that is prose when there is room for it — is one attribute
  rather than a `matchMedia` listener per page.

  ```html
  <disclosure-elemental
    for="sidebar"
    media="(min-width: 60rem)"
  ></disclosure-elemental>
  ```

  Same spelling as `media` on `<navbar-elemental>` and `<menu-elemental>`. The query is
  watched for as long as the element is connected and the attribute can be rewritten at
  runtime. Crossing lands instantly rather than sliding — a breakpoint change is the layout
  being rearranged, not the region being operated. Within one side of a breakpoint the
  button still toggles normally; the query re-asserts itself at the next change, so a drawer
  left open cannot survive into a layout that has no drawer.

  The alternative most pages reach for — showing the panel in a media query and hiding the
  button — leaves `aria-expanded="false"` on a panel that is visible, which is the bug this
  removes. An element with no `media` attribute is untouched.

  **DOM:** with `media` set, the element writes `data-mode="pinned"` while the query matches
  and `data-mode="free"` while it does not, on **itself and on the region**, and removes it
  from both on disconnect or when `media` is dropped. Nothing is written without `media`.
  `open`, `aria-expanded` and `hidden` behave exactly as before.

  `data-mode` is there so a stylesheet does not have to repeat the breakpoint — the query is
  declared once, in the markup, and the CSS keys off the answer rather than restating the
  number in a language that cannot check it:

  ```css
  .sidebar {
    /* the rail */
  }
  .sidebar[data-mode="free"] {
    position: fixed; /* the drawer */
  }
  ```

  Which also makes such a stylesheet shippable, since it carries no breakpoint of its own.
  And because the attribute only arrives at upgrade, `[data-mode]` doubles as the
  progressive-enhancement guard: layout that would strand a page whose script never loaded
  cannot apply before the element is alive.

- **Sidebar drawer example.** A second page under _Examples_: the docs sidebar this site
  runs on — a sticky rail on a wide screen, an off-canvas drawer on a phone — built from
  `<disclosure-elemental>`, its `media` attribute and a handful of lines of script. Covers the parts
  that are the page's rather than the element's: sliding on
  `transform` instead of the region's height, capping the panel at the viewport so a long
  nav scrolls itself instead of overflowing into the article, deferring the
  `content-visibility` flip on the close only — an opening panel that defers it renders but
  stays unreachable — swapping Octicons'
  `sidebar-expand`/`sidebar-collapse` off `aria-expanded` in CSS, and keeping the drawer out
  of the way of a page whose script never loaded. Docs only.

- **A demo can be more than one fence.** `script/demos.js` now wraps a group — the marked
  html fence plus any fence under it that says `demo` in its own info string — in a single
  preview, which `code-preview-element` turns into a tab each:

  ````markdown
  <!-- demo disclosure viewport-widths="375 768 1024" -->

  ```html
  <aside class="sidebar" id="sidebar">…</aside>
  ```

  ```css demo
  #sidebar {
    transition: transform 0.2s ease;
  }
  ```
  ````

  `demo` there is poops' own fence syntax — a bare word in the info string becomes a class
  on the `<code>`, `key=value` becomes a `data-*` — so this needs nothing from the markdown
  that markdown did not already have. Joining is opt-in per fence and never positional,
  because the fence under a demo is usually the install snippet.

  The matcher no longer pins the exact string `class="hljs language-html"` either, which it
  had to stop doing for the same reason: a fence that says anything in its info string is a
  fence with more than that in its class list.

- **Live samples in the docs.** Twelve of the code samples on the element pages are now
  editable previews rather than static fences — the element rendered in an iframe above the
  code that produced it, edits applied as you type, and an **Options** tab whose controls are
  generated from that element's `custom-elements.json`. Every page has one in _Usage_ opening
  on the code, and one in _The look_ opening on the panel, where turning a knob prints the
  rule to copy into your own stylesheet. Docs only — nothing about the package changes.

  A sample opts in with `<!-- demo switch -->` in the markdown, and `script/demos.js` does the
  wrapping after the markup stage. The marker rather than the fence's info string, because it
  introduces a _group_ — the fences under it — and because a setting like
  `viewport-widths="375 768"` has spaces in its value, which an info string cannot carry. The
  sample stays an ordinary fence in `docs/`, so it is still one block of real HTML to read and
  copy, still highlighted at build time, and still in `llms.txt` and the search index.

  The manifests are what make the panel worth having, and the curation shows: the switch
  offers twenty knobs and not the three `calc()`-derived properties, because those were never
  tagged.

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

- `<navbar-elemental>` — the
  [APG Disclosure Navigation pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/):
  a site's row of links, the panels some of them open, and the two ways such a row gets out
  of its own way.

  ```html
  <navbar-elemental media="(min-width: 40rem)" hover>
    <div class="rail">
      <ul>
        <li><a href="/overview">Overview</a></li>
        <li>
          <button>Products</button>
          <ul>
            <li><a href="/cloud">Kestrel Cloud</a></li>
          </ul>
        </li>

        <li data-navbar-more>
          <button>More</button>
          <ul></ul>
        </li>
      </ul>
    </div>

    <button data-navbar-toggle aria-label="Navigation"></button>
  </navbar-elemental>
  ```

  **The breakpoint at which links fold away is measured rather than declared.** How many
  links a site has, how long their labels are in the reader's font and whether that font has
  arrived yet are none of them knowable when a query is written, which is why a hand-picked
  width hides three short links on a tablet with room to spare. An `IntersectionObserver`
  reports which items are not entirely inside the row; those leave it and reappear under the
  overflow button, one at a time. What is observed is a copy of the row rather than the row,
  because an observer watching the box it is also changing is an infinite loop that eats a
  navigation one frame at a time — and because the row is then free to change, the overflow
  button sits immediately after the last link that fits rather than off the end of the bar.
  `media` is the separate question of when the whole bar becomes a drawer, and it stays a
  query because nothing the element does can change the width of the window.

  **Markup it asks for:** a box around the list — the `.rail` above — which is where the
  measured copy goes. It could not be created for you: wrapping your list would leave every
  selector written against the list's parent pointing at the wrong element. Three optional
  hooks name what structure cannot: `data-navbar-more` on the last `<li>` is the overflow
  item, `data-navbar-toggle` on a button opens the drawer, and `data-navbar-stack` marks an
  item as the drawer's alone — out of the measurement in both directions, so it neither
  competes for room on the bar nor reserves any.

  **DOM it produces:** `data-mode="bar"` or `"stack"` on the element, `data-overflowing`
  while some but not all of the links are behind the overflow button, `data-navbar-rail` on
  the rail and `data-navbar-probe` on the copy inside it, `data-overflow` on an item that did
  not fit, and `type`, `aria-controls` and `aria-expanded` on every trigger and on the
  toggle. Lists without an `id` are given one; a closed panel carries `hidden` on the bar and
  `hidden="until-found"` in the drawer, so find-in-page reaches a link inside a closed
  drawer while a closed panel on the bar leaves no empty framed box parked under its button.
  `open` is the drawer's state, reflected. Every panel opening or closing fires a bubbling
  `navbar-toggle` carrying `{ panel, open }`. **No `role`, anywhere** — these are links to
  pages, and `role="menuitem"` replaces link semantics; the APG's own navigation menubar
  example opens by talking you out of itself. `<menu-elemental>` remains the one for
  commands.

  **Keyboard:** the APG's table including the rows it marks optional — `Tab` through the bar
  and into an open panel, `Escape` back to the trigger, arrows between items and into an open
  panel, `Home`/`End` to the ends. The arrows do not wrap, because off the end of the bar is
  where the rest of the page is. Stacked, they walk everything on screen from the top of the
  drawer down. `hover` adds the pointer to the ways a panel opens, never as a replacement,
  never on touch, never in the drawer, and never over a panel the keyboard is inside.

  **CSS:** the element's own stylesheet places the lists, decides which are on screen and
  builds the rail — no colours, no borders, and nothing about the bar around the row, which
  is what `data-mode` is for. Panels stay on screen through CSS anchor positioning rather
  than script, so nothing above a panel may be `position: relative` (or a container, which
  brings the same containing block) or none of the fallbacks can fire. The optional theme
  adds panels, hover states, a caret that points down on the bar and turns like a
  disclosure's in the drawer, and a hamburger on the toggle, out of `currentcolor` and
  `Canvas` plus `--navbar-elemental-surface`, `-hover`, `-border`, `-shadow`, `-radius`,
  `-inset`, `-gap`, `-caret-size` and `-hamburger-size`. One trap worth knowing: do not key
  anything that changes the bar's own width off `data-mode`, or taking a button off the bar
  gives the links room, which puts the button back, which takes it away again.

  ```scss
  @use "book-of-elementals/navbar/style.scss";
  @use "book-of-elementals/navbar/theme.scss";
  ```

- **Site navigation example.** A page under _Examples_ building a whole header around
  `<navbar-elemental>` — a logo, a search field that collapses to its icon, icon links and
  two calls to action beside the row that folds itself away. All of that is the page's own
  CSS, which is the point of the page: the element lays out the row, its panels and its
  drawer, and has no opinion about the rest of a header. Covers the two things worth copying
  — a call to action that lives in the markup twice, on the bar and as a
  `data-navbar-stack` item in the drawer, and why those move on a media query while the
  links do not. Docs only.

- **A [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)** —
  `dist/custom-elements.json`, generated from the JSDoc on each element by
  `@custom-elements-manifest/analyzer` and pointed at by the `customElements` key in
  `package.json`. That key is what VS Code and JetBrains read for attribute autocomplete, what
  Storybook builds an args table from, and what a live options panel can generate controls from.

  It ships twice, because the two readers want opposite things. The cumulative file is one
  request for every element in the book, which is what an editor or a converter wants. Per
  element there is also `dist/elementals/<name>-manifest.json`, exported as
  `book-of-elementals/switch/manifest` — a page that loads one element's bundle and one
  element's stylesheet has no use for the other five elements' documentation. Both come out of
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
