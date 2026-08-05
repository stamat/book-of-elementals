Book of Elementals is an npm package (`book-of-elementals`) of custom elements
that are accessible by default and render in
**light DOM** — there are no shadow roots, so every part is stylable with
ordinary CSS and server-rendered markup works untouched.

Each element wraps a native HTML element wherever the platform already has the
semantics (the accordion coordinates `<details>`/`<summary>` rather than
rebuilding disclosure on `<div>`s), so keyboard and screen-reader behaviour is
the browser's. Patterns follow the
[W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/).

Importing a bundle registers its element and nothing else. There is no global,
no constructor to call and no init step — elements upgrade themselves wherever
they appear, including markup inserted later.

```javascript
import "book-of-elementals/accordion"; // one element
import "book-of-elementals";           // the whole book
```

```scss
@use "book-of-elementals/accordion/style.scss";
@use "book-of-elementals/styles/index.scss";
```

```html
<!-- no build step; per-element bundles on the CDN -->
<script src="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css" />
```

Elements published so far:

- `<accordion-elemental>` — APG accordion over native `<details>`; `exclusive`
  and `name` attributes, arrow-key header navigation, fragment deep links, and a
  bubbling `accordion-toggle` event.
- `<checkbox-group-elemental>` — APG mixed-state checkbox: a "select all" over a flat set
  of native checkboxes, ticked when all are, empty when none are, and showing the dash when
  it is some. The dash is `HTMLInputElement.indeterminate`, which has no HTML attribute and
  can only be set from script — that is the entire gap it fills. No attributes, no roles
  and no `aria-checked`, because a native checkbox with `indeterminate` set is already
  announced as mixed; it writes that property, `checked`, and `data-state="all|some|none"`
  on itself. Pressing the parent cycles mixed → all on → all off → back to the combination
  the children were last mixed in, skipping that third step when there is nothing partial to
  restore. Disabled checkboxes are never moved and still count; every child that moves fires
  `input` and `change`. One level, not a tree — a nested group is a separate group. With no
  script the parent is hidden rather than offered dead. Its boxes are drawn by
  `styles/checkbox.scss` (`book-of-elementals/checkbox.scss`,
  `dist/book-of-elementals-checkbox.css`), the one look in the package that is not an
  element's: opt in with `class="checkbox-elemental"` on a container or a `<label>` to give
  any other checkbox the same look, and set the eight `--checkbox-elemental-*` properties on
  whatever carries the class. Never a bare `input[type="checkbox"]` selector.
- `<combobox-elemental>` — APG combobox over a native `<select>`: a `role="combobox"`
  text field that filters the options, a `role="listbox"` popup, and the cursor kept in
  `aria-activedescendant` so focus never leaves the field. `multiple` on the `<select>`
  adds a chip per selection with a remove button, and `Backspace` on an empty field. The
  `<select>` stays the control — value, `name`, submission, `required`, reset, restore and
  `<fieldset disabled>` are all the browser's, and the element has no event of its own
  because the `<select>` fires `input` and `change`. Attributes: reflected `open`,
  `placeholder`, `empty-text`, `remove-text`. Search matches anywhere in a label and folds
  diacritics both ways, so `cacak` finds Čačak. Filtering is the only gap it fills:
  `appearance: base-select` now styles a dropdown natively, and no browser lets you type
  your way down a long list.
- `<copy-elemental>` — a real `<button>` that writes text to the clipboard and announces
  it. No APG pattern, because there is no widget: the gap is the half after the click, where
  every copy button swaps an icon and tells a screen reader nothing, leaving WCAG 2.2 SC
  4.1.3 Status Messages unmet. It appends one `<span role="status">`, clipped out of sight,
  and writes `data-state="copied"`/`"error"` for two seconds. Attributes: `for` (also read
  as `data-for`), `value` (literal, wins over `for`), `copied-text`, `error-text`; a
  bubbling `copy-done` with `detail.ok` and `detail.text`. A field is copied by its current
  `.value`; anything else by the text it shows, with leading newlines and trailing
  whitespace stripped so a code block does not paste a command that runs itself. No
  clipboard API, or nothing named to copy, and the button is not offered at all —
  `data-unavailable` says which.
- `<disclosure-elemental>` — APG disclosure: a real `<button>` wired to a region
  with `aria-expanded`/`aria-controls`, for the places `<details>` cannot go (a
  `<figcaption>`, a table row, a grid item, a region across the page). Reflected
  `open`, a `for` attribute for a detached region, `hidden="until-found"` so
  find-in-page still reaches a closed region, and a bubbling `disclosure-toggle`
  event. A `media` attribute hands `open` to a media query — held open while it
  matches, closed when it stops — and writes `data-mode="pinned"`/`"free"` on the
  element and the region, so a stylesheet keys off the query without repeating it.
- `<segmented-elemental>` — APG radio group drawn as a segmented control: a track
  with a knob that slides under the checked segment, over native
  `<input type="radio">` in `<label>`s. Arrow keys, `Tab` in and out once,
  submission under the shared `name`, `required`, reset and restore are all the
  browser's, so the element writes no roles, no `aria-checked`, and no event of its
  own — a radio fires `change` and `change` bubbles. It writes
  `--segmented-elemental-index`, `--segmented-elemental-count` and `data-index`,
  which is what the knob is positioned from, plus `role="group"` when the element
  carries an `aria-label` that nothing would otherwise read. No script means no
  knob, not a knob on the wrong segment.
- `<switch-elemental>` — APG switch: a real `<button>` given `role="switch"` and
  `aria-checked`, for a setting that takes effect the moment it is flipped (a
  theme toggle, a mute). Reflected `checked` and a bubbling `switch-toggle`
  event. Form-associated through `ElementInternals`, so `name`/`value` submit,
  reset and restore exactly as a checkbox's do — no hidden `<input>`, and a switch
  in a form is still this element. Two things send you to
  `<input type="checkbox" role="switch">` instead: it needs no JavaScript at all, so
  it survives scripting being off, and it can be labelled by a `<label>`.
- `<menu-elemental>` — APG menu button: a `<button>` and the nested lists it
  opens, with `role="menu"`/`role="menuitem"`, arrow keys, type-ahead, `Escape`
  back to the trigger and one branch open at a time. A `media` attribute is the
  width the flyout exists in; outside it the roles come off and the same markup is
  a stack of nested disclosures, which is what `data-mode` says. For commands —
  account menus, toolbars, "more actions" — not for site navigation.
- `<modal-elemental>` — APG modal dialog, wrapping a native `<dialog>` and opening
  it with `showModal()`, so the top layer, the `inert` page behind, the focus that
  goes in and comes back, `Escape` and **nesting** are the browser's rather than a
  focus trap's. What it adds: an animated close, since deferring the top-layer
  removal needs the `overlay` property Firefox and Safari lack; a click on the
  backdrop under `closedby="any"`, which Safari has no support for; scroll lock on
  the page behind; `data-depth`, so a stack of modals paints one sheet of dim
  rather than one each; `aria-labelledby` pointed at the first heading; and a close
  button written as the dialog's first child, `command="request-close"`, named by
  `close-text`, absolute in the dialog's corner - and not written under
  `closedby="none"`, which is a dialog to be answered rather than dismissed. Opened
  by `command="show-modal"`/`commandfor`, by a link to its `id`, or by `show()`;
  the fragment in the URL opens it, and the back button closes it. `close-others`
  replaces the stack instead of adding to it. Closing pauses `<video>`/`<audio>`
  inside and reloads any `<iframe>`, which is what a lightbox and a YouTube embed
  need and all either of them is.
- `<navbar-elemental>` — APG disclosure navigation: a site's row of links and the
  panels some of them open, writing no roles at all, because a link announced as a
  menu item is a link no longer. Links that stop fitting move behind an overflow
  button, measured with an `IntersectionObserver` on a copy of the row rather than
  guessed at with a breakpoint; a `media` attribute is when the whole bar becomes a
  drawer. `data-mode="bar"`/`"stack"`, reflected `open`, a bubbling `navbar-toggle`,
  and three markup hooks: `data-navbar-more`, `data-navbar-toggle`,
  `data-navbar-stack`.
- `<tabs-elemental>` — APG tabs, written on the markup a page would have had
  anyway: a list of in-page links and the sections they point at. `role="tablist"`,
  `role="tab"` and `role="tabpanel"` with a roving tabindex, arrow keys on the axis
  `aria-orientation` promises, `vertical` and `manual` attributes, reflected
  `selected`, and a bubbling `tabs-select`. Panels not showing are hidden with
  `hidden="until-found"`, so find-in-page reaches them and finding one selects its
  tab.
- `<tooltip-elemental>` — a description shown on hover and on focus, wired with
  `aria-describedby` and left on the page as plain text when the script never
  arrives. Wraps a control and its words, or names one with `for` from elsewhere;
  the element works out which by whether it contains something focusable. A `title`
  is upgraded when there is nothing else to say — as a description, or as the
  control's `aria-label` when that `title` was its only name. Escape dismisses and
  the dismissal holds until the reader leaves; the bubble itself is hoverable, per
  WCAG 2.2 SC 1.4.13; there is no timeout. **Touch pointers are ignored**, because
  a tap is not a hover — nothing essential belongs in a tooltip.

Sibling project: [book-of-spells](https://github.com/stamat/book-of-spells),
which holds the plain JavaScript helpers. This book holds the elements.
