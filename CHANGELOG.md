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

### Added

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
  -100vmax)`). A drop shadow spreads in every direction, and this one was landing *on the
  bar* — a smear along the header that appeared the moment the drawer opened. The same
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
  Under the default `content-box` that is the row's own width *plus* a rem, so in the navbar
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
  <disclosure-elemental for="sidebar" media="(min-width: 60rem)">
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
  .sidebar { /* the rail */ }
  .sidebar[data-mode="free"] { position: fixed; /* the drawer */ }
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
  #sidebar { transition: transform 0.2s ease; }
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
  introduces a *group* — the fences under it — and because a setting like
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

        <li data-navbar-more><button>More</button><ul></ul></li>
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
