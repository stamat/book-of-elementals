# 📓 Book of Elementals [![npm version](https://img.shields.io/npm/v/book-of-elementals)](https://www.npmjs.com/package/book-of-elementals) [![license mit](https://img.shields.io/badge/license-MIT-green)](https://github.com/stamat/book-of-elementals/blob/main/LICENSE)

Accessible custom elements. Light DOM, no build step required.

Sibling to [book-of-spells](https://github.com/stamat/book-of-spells) — that one
holds the JavaScript helpers, this one holds the elements.

## Principles

- **Native first** — an element exists only where the platform leaves a real gap
- **Light DOM, always** — no shadow roots, your CSS reaches every part
- **Accessible or it does not ship** — [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/) patterns, keyboard and reduced-motion included
- **One dependency, and it is the sibling** — the helpers live in
  [book-of-spells](https://github.com/stamat/book-of-spells) and are bundled into `dist/`,
  so a script tag still costs you exactly one file

## Elements

| Element                  | Pattern                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `<accordion-elemental>`  | [APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), over native `<details>`      |
| `<checkbox-group-elemental>` | [APG Checkbox (Mixed-State)](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), a select-all that shows the dash when it is some of them |
| `<combobox-elemental>`   | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), a `<select>` you can type your way down, one value or many |
| `<disclosure-elemental>` | [APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), where `<details>` cannot go |
| `<menu-elemental>`       | [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), nested, and not a menu below a breakpoint |
| `<navbar-elemental>`     | [APG Disclosure Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), folding itself away when the links stop fitting |
| `<segmented-elemental>`  | [APG Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) on native radios, drawn as a track with a knob that slides |
| `<switch-elemental>`     | [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), for a setting that takes effect at once |
| `<tabs-elemental>`       | [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), horizontal or vertical, on a list of in-page links |

## Docs

[stamat.github.io/book-of-elementals](https://stamat.github.io/book-of-elementals/)

## Installation

```bash
npm install book-of-elementals
```

Import one element and only that element is registered:

```javascript
import "book-of-elementals/accordion";
import "book-of-elementals/disclosure";
import "book-of-elementals/switch";
```

```scss
@use "book-of-elementals/accordion/style.scss";
@use "book-of-elementals/disclosure/style.scss";
@use "book-of-elementals/switch/style.scss";
```

Or the whole book:

```javascript
import "book-of-elementals";
```

```scss
@use "book-of-elementals/styles/index.scss";
```

Or the CDN, no build step. Every element ships its own bundle:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion.min.css"
/>
```

No global, no boot call — including a bundle registers its element and it
upgrades itself wherever it appears, including markup added later. Swap in
`book-of-elementals.min.js` for the whole book.

Those stylesheets carry structure and motion only. Each element's look is a
separate, optional one, off unless you ask for it:

```scss
@use "book-of-elementals/accordion/theme.scss";
```

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/accordion-theme.min.css"
/>
```

Swap in `book-of-elementals/theme.scss`, or `book-of-elementals-theme.min.css`,
for every element's look at once.

## `<accordion-elemental>`

Wraps native `<details>`/`<summary>` instead of reimplementing disclosure on
`<div>`s, so the semantics, Enter/Space activation, screen-reader announcement
and find-in-page expansion are the browser's.

```html
<accordion-elemental exclusive>
  <details open>
    <summary>First question</summary>
    <p>First answer.</p>
  </details>
  <details>
    <summary>Second question</summary>
    <p>Second answer.</p>
  </details>
</accordion-elemental>
```

What the element adds on top of native:

- `exclusive` — assigns a shared `name` so only one panel stays open
- <kbd>Up</kbd>/<kbd>Down</kbd>/<kbd>Home</kbd>/<kbd>End</kbd> navigation between headers ([APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/))
- deep links — a URL fragment pointing inside a panel opens it
- an `accordion-toggle` event on the group, since `toggle` does not bubble
- a height animation on open and close, in every browser

| Attribute   | Type    | Default | Description                                                |
| ----------- | ------- | ------- | ---------------------------------------------------------- |
| `exclusive` | boolean | `false` | Only one panel open at a time.                             |
| `name`      | string  | auto    | The shared `name` used by `exclusive`. Generated if unset. |

Put a heading inside the `<summary>` when the panels are page sections, so
screen reader users can navigate to them by heading:

```html
<summary><h3>Question</h3></summary>
```

Styling is yours — there is no shadow DOM. On upgrade the element wraps each
panel body in `<div class="accordion-elemental-content-wrapper">` with a
`<div class="accordion-elemental-content">` inside it — the wrapper is the box
whose height transitions, so padding goes on the content — and holds the close
open until the transition ends — `<details>` sets
its contents to `display: none` the moment it closes, which would otherwise cut
the animation off at frame one. Retime it in CSS; the element reads the duration
back out of the stylesheet:

```css
accordion-elemental {
  --accordion-elemental-duration: 250ms;
  --accordion-elemental-easing: ease;
}
```

`prefers-reduced-motion: reduce` switches it off, and without JavaScript there is
no wrapper and no animation — native instant toggling, which is still correct.

## `<checkbox-group-elemental>`

The "select all" over the checkboxes it stands for: ticked when all of them are, empty
when none are, and showing the dash when it is some of them.

```html
<checkbox-group-elemental>
  <label><input type="checkbox" /> All notifications</label>
  <ul>
    <li><label><input type="checkbox" name="n" value="mentions" checked /> Mentions</label></li>
    <li><label><input type="checkbox" name="n" value="replies" /> Replies</label></li>
  </ul>
</checkbox-group-elemental>
```

No attributes. The first checkbox in the element is the parent, everything after it is a
child, and the element writes two properties on the parent plus `data-state` on itself —
no `role`, no `aria-checked`, because a native checkbox with `indeterminate` set is
already announced as mixed.

**The dash is the whole reason it exists.** `HTMLInputElement.indeterminate` has
[no HTML attribute behind it](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox#indeterminate_state)
— it can only be set from script, so no server or template can render that state, and every
project writes the same twenty lines. It is also purely visual: submission is decided by
`checked` alone, which is why the parent should have no `name`.

Pressing it cycles the [APG's way](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/):
mixed → all on → all off → **back to the combination they were last mixed in**, so two
ticks out of twenty survive a press instead of being destroyed by it. That last step is
skipped when there is nothing worth going back to. A disabled checkbox is outside the set
the parent speaks for — never moved and never counted, because counting one that is unticked
would put "all" out of reach and freeze the cycle. Every child that does move fires `input`
and `change`, so nothing listening downstream is left holding stale state.

One level, not a tree: a nested group is a separate group. Without the script the parent is
hidden rather than offered dead, and the children are ordinary working checkboxes — the
stylesheet does that for a direct child, and `hidden` in the markup does it at any depth,
which is what a select-all in a table header needs. The
[bulk actions example](https://stamat.github.io/book-of-elementals/examples/bulk-actions.html)
is that arrangement end to end: the header checkbox, a toolbar that wakes up, and a count
kept honest by the per-row `change`.

The boxes are drawn rather than left to `accent-color`, which recolours the browser's box
and can say nothing about the weight of a dash — and since a page cannot have one drawn
checkbox and a browserful of default ones, that drawing is a stylesheet of its own that any
checkbox can wear. **Opt in with a class, on a container or on a `<label>`:**

```html
<form class="checkbox-elemental">…</form>
<label class="checkbox-elemental"><input type="checkbox" /> Remember me</label>
```

```scss
@use "book-of-elementals/checkbox.scss"; // or dist/book-of-elementals-checkbox.min.css
```

Eight `--checkbox-elemental-*` properties, set on whatever carries the class exactly as the
switch's go on the element. It arrives with `checkbox-group/theme.scss` already. Never a
bare `input[type="checkbox"]` selector: importing a theme for an accordion must not
silently redraw every checkbox on the page. This is the only look in the package that is
not an element's, and the line is stated in
[CONTRIBUTING.md](CONTRIBUTING.md) — a control gets one only when an element cannot be
drawn without it.

## `<combobox-elemental>`

A `<select>` with a text field to search it with — one value, or many with a chip
each. Wrap the `<select>` you would have written anyway; nothing else is read:

```html
<label for="city">City</label>
<combobox-elemental>
  <select id="city" name="city">
    <option value="">Choose a city</option>
    <option value="bg">Beograd</option>
    <option value="ns">Novi Sad</option>
  </select>
</combobox-elemental>
```

| Attribute     | Type    | Default      | Description                                                        |
| ------------- | ------- | ------------ | ------------------------------------------------------------------ |
| `open`        | boolean | `false`      | Whether the popup is showing. Reflected — it tracks the live state. |
| `placeholder` | string  | —            | The field's placeholder. Single select falls back to the label of the option whose value is empty. |
| `empty-text`  | string  | `No matches` | What the popup says when the query matches nothing.                |
| `remove-text` | string  | `Remove`     | The verb in a chip's remove button, before the option's label.     |

Everything else is the `<select>`'s — `multiple`, `required`, `disabled`, `name`, and
the options — because the `<select>` is still the control. It holds the value, submits,
resets, restores and goes down with a `<fieldset disabled>`, so this element has no
event of its own: every pick sets `option.selected` and lets the `<select>` fire the
`input` and `change` that were going to be listened for anyway.

**Filtering is the whole of the gap.** A dropdown that is merely styled is now native —
[`appearance: base-select`](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select)
takes the button, the picker and every `<option>` in plain CSS with no script at all. What
no browser does is let you type your way down four hundred cities. If you are not
filtering, you do not need this element.

The field is a `role="combobox"` input and the popup a `role="listbox"`, with the cursor
kept in `aria-activedescendant` so focus never leaves the field and typing keeps narrowing
the list. The query matches anywhere in a label, and both sides fold first — `cacak` finds
Čačak, `dordevic` finds Đorđević, and `бео` still finds Београд, because the folding is
`removeAccents` and not `slugify`, which would have left that label an empty string.
`multiple` adds the chips and drops the caret, `Backspace` on an empty field removes the
last chip, and that half is the one with no APG example behind it: the pattern's six are
all single-select.

The `<select>` is hidden by being made transparent and un-clickable rather than by
`display: none`, which is not a detail — a `display: none` control that is `required`
blocks its own form, because the browser refuses to submit and then cannot focus what it
cannot draw. Rendered, it validates; the element cancels the browser's bubble, which would
be aimed at something invisible, and keeps the message — `validationMessage`, the
platform's own words in the reader's own language — in a `role="alert"` under the field,
with focus moved onto the field itself. Without the script the `<select>` is a plain,
working `<select>`; nothing is hidden until the field that replaces it exists.

## `<disclosure-elemental>`

A real `<button>` wired to a region it shows and hides. `<details>` is a
disclosure already and wins wherever it fits — it fits when the region can live
_inside_ the trigger's element. This one is for when it cannot: a
`<figcaption>`, which HTML requires to be a child of its `<figure>`; a table row;
a grid item its parent lays out directly; a panel on the other side of the page
from the button that opens it.

```html
<figure>
  <img src="chart.png" alt="A tapering band showing an army shrinking…" />
  <disclosure-elemental for="chart-desc">
    <button>Describe this image</button>
  </disclosure-elemental>
  <figcaption id="chart-desc">…</figcaption>
</figure>
```

Nothing is wrapped and nothing is moved — the region stays exactly where the
markup put it, which is the whole point. The element writes `aria-expanded` and
`aria-controls` onto the button and `hidden` onto the region, and that is all the
ARIA there is.

| Attribute | Type    | Default | Description                                                          |
| --------- | ------- | ------- | -------------------------------------------------------------------- |
| `open`    | boolean | `false` | Whether the region is showing. Reflected — it tracks the live state. |
| `for`     | string  | —       | `id` of the region. Defaults to the button's next element sibling.   |
| `media`   | string  | —       | A media query that owns `open`: held open while it matches, closed when it stops. |

`media` is for the disclosures that stop being disclosures at a width — a rail that is a
drawer on a phone, a long description that is prose beside the figure when there is room.
The state stays in the one place that already holds it, instead of a media query showing
the panel while `aria-expanded` still says `false`. With it set, the element writes
`data-mode="pinned"` or `data-mode="free"` on itself **and** on the region, so your
stylesheet keys off which side of the query you are on rather than repeating the number —
and, since the attribute only lands at upgrade, layout that would strand a scriptless page
cannot apply before the element is alive. The
[sidebar drawer example](https://stamat.github.io/book-of-elementals/examples/sidebar-drawer.html)
is the whole arrangement on one page.

A closed region is hidden with `hidden="until-found"`, so find-in-page still
searches it and a link to a fragment inside it still lands there — either one
reveals the region and the element opens to match. State changes fire a bubbling
`disclosure-toggle`.

The region slides open and closed, timed off
`--disclosure-elemental-duration` and `--disclosure-elemental-easing` in the
stylesheet. It is the animated box, so put its inset on a box inside it: block
padding is a floor the height cannot get under.

The element is `display: contents`, so dropping it around existing markup changes
no layout. With scripting off the region is simply visible and the button is not
offered, which for a long description is the right way round.

## `<menu-elemental>`

A `<button>` and the nested lists it opens — plus one thing the APG has no
opinion about, because it is a layout question: below a breakpoint the whole
thing stops being a menu.

```html
<menu-elemental media="(min-width: 60rem)">
  <button>Account</button>
  <ul>
    <li><a href="/profile/">Profile</a></li>
    <li>
      <button>Preferences</button>
      <ul>
        <li><a href="/preferences/theme/">Theme</a></li>
      </ul>
    </li>
  </ul>
</menu-elemental>
```

| Attribute | Type    | Default | Description                                                                       |
| --------- | ------- | ------- | --------------------------------------------------------------------------------- |
| `media`   | string  | —       | The query the flyout exists in. Outside it, nested disclosures. Unset means always a menu. |
| `open`    | boolean | `false` | Whether the root list is showing. Reflected.                                       |

Inside `media` it is the [APG Menu
Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/): `role="menu"`,
items out of the tab order, arrows and <kbd>Home</kbd>/<kbd>End</kbd> to move,
<kbd>Right</kbd>/<kbd>Left</kbd> in and out of a branch, type-ahead,
<kbd>Escape</kbd> back to the trigger, one branch open at a time.

Outside it, the roles come off. `role="menu"` is a promise that the arrows work
and <kbd>Tab</kbd> does not, and on a phone the same markup is a stack of nested
disclosures in a drawer — links you tab through, branches that stay where you
left them. Two widgets, one set of markup, the viewport picks. The element writes
`data-mode` so your CSS reads the breakpoint back off it instead of repeating the
query.

<kbd>Tab</kbd> is never trapped: nothing behind the menu is `inert`, and a
keyboard visitor who cannot tab out of a dropdown is stuck on your page.

For site navigation rather than commands, this is the wrong element and
`<navbar-elemental>` is the right one — `role="menuitem"` costs the link
semantics, and a page somebody might open in a new tab wants to stay a link. The
[docs page](https://stamat.github.io/book-of-elementals/elementals/menu.html)
lays out the trade.

## `<navbar-elemental>`

A site's navigation: a row of links, some of them opening a panel of more links,
plus the two things such a row always ends up needing — somewhere for the ones
that do not fit to go, and a way to be a drawer instead on a narrow screen.

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

      <!-- where the ones that do not fit go. The element fills it. -->
      <li data-navbar-more>
        <button>More</button>
        <ul></ul>
      </li>
    </ul>
  </div>

  <button data-navbar-toggle aria-label="Navigation"></button>
</navbar-elemental>
```

| Attribute | Type    | Default | Description                                                                  |
| --------- | ------- | ------- | ----------------------------------------------------------------------------- |
| `media`   | string  | —       | The query the bar exists in. Outside it, the drawer. Unset means a bar at every width. |
| `open`    | boolean | `false` | Whether the drawer is showing. Reflected.                                     |
| `hover`   | boolean | `false` | A mouse opens a panel by pointing at it too. Never on touch, never stacked.   |

Three optional hooks name the parts structure cannot: `data-navbar-more` on the
last `<li>` is the overflow item, `data-navbar-toggle` on a button opens the
drawer, and `data-navbar-stack` marks an item as the drawer's alone — a sign-in
link, a language picker — so it never sits on the bar and is never measured
against it.

**The breakpoint that folds the links away is measured, not declared.** How many
links a site has, how long their labels are in the reader's font, whether that
font has even arrived — none of it is knowable when the query is written, which
is why a hand-picked width hides three short links on a tablet with room to
spare. An `IntersectionObserver` watches a copy of the row instead: items that do
not fit leave it one at a time and reappear under the overflow button. The copy
and not the row, because an observer watching the box it is also changing is an
infinite loop that eats a navigation one frame at a time. `media` is the separate
question of when the whole bar becomes a drawer, and it is a query because
nothing the element does can change the width of the window.

`data-mode` is `bar` or `stack`, so your CSS reads the mode back off the element.
The two are different widgets: on the bar the panels float over the page one at a
time and a click outside closes them; in the drawer they are in the flow, stay
where you left them, and are hidden with `hidden="until-found"` so find-in-page
reaches a link inside a closed one.

No `role` anywhere, which is the pattern rather than an omission — the APG's own
[navigation menubar example](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/)
opens by talking you out of itself, and links announced as menu items are links
no longer. Panels stay on screen through CSS anchor positioning, with no script
involved. Without JavaScript the whole thing is a nested list of visible links,
which is what it was underneath all along.

## `<segmented-elemental>`

One choice out of a few, drawn as a track with a knob that slides under it — the
N-state answer to the switch, on the radio group you would have written anyway:

```html
<segmented-elemental aria-label="Range">
  <label><input type="radio" name="range" value="day" /> Day</label>
  <label><input type="radio" name="range" value="week" checked /> Week</label>
  <label><input type="radio" name="range" value="month" /> Month</label>
</segmented-elemental>
```

The segments stay `<input type="radio">`, which is where the whole
[APG Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) already
lives — arrows that move the selection and wrap, `Tab` in and out of the group
once, submission under the shared `name`, `required`, reset, restore, and a
`<fieldset disabled>` that takes the lot. None of it is rewritten here, which is
why the element has no roles, no `aria-checked` and no event of its own: a radio
fires `change`, and `change` bubbles.

What is left for script is the one thing CSS cannot say for an unknown number of
segments — which one is checked. The element writes
`--segmented-elemental-index`, `--segmented-elemental-count` and `data-index` onto
itself, and the theme's knob is a single pseudo-element one track wide that
translates by the index. Without the script there is no knob at all rather than a
knob parked on the first segment, and the selected label still takes its colour,
because that comes from `label:has(> input:checked)` and needs nobody's help. The
only ARIA it writes is `role="group"`, and only when you have given the element an
`aria-label` that would otherwise be read by nothing.

## `<switch-elemental>`

An on/off setting that takes effect the moment you flip it — a theme toggle, a
mute, autoplay — on a real `<button>`, which is where `Space`, `Enter`, the focus
ring and the disabled state come from.

```html
<span id="dark-label">Dark mode</span>
<switch-elemental>
  <button aria-labelledby="dark-label"></button>
</switch-elemental>
```

The element writes `role="switch"` and `aria-checked` onto the button, and that is
all the ARIA there is. The name is the thing being switched — never the state,
which `aria-checked` already announces.

| Attribute | Type    | Default | Description                                                     |
| --------- | ------- | ------- | ---------------------------------------------------------------- |
| `checked` | boolean | `false` | Whether the switch is on. Reflected — it tracks the live state. |

State changes fire a bubbling `switch-toggle` carrying `{ checked }`.

| Attribute | Type   | Default | Description                                     |
| --------- | ------ | ------- | ----------------------------------------------- |
| `name`    | string | —       | Submits under this name. No name, no form data. |
| `value`   | string | `on`    | What it submits while on.                       |

Give it a `name` and it submits with its form exactly as a checkbox does — the
value when on, nothing at all when off — and resets and restores with it too. That
is `ElementInternals`, not a hidden `<input>` mirroring the state, so the platform
owns all three and there is no second node to disagree with the first.

Being in a form is not what picks the control — a switch in a form is still this
element. Two specific things send you to `<input type="checkbox" role="switch">`
instead: it needs no JavaScript at all, so it survives scripting being off, and being
a real form control it can be labelled by a `<label>`. The button here is hidden until
the element upgrades, because a switch that silently does not switch is worse than no
switch — which is the same reason the first of those two matters.

The optional theme draws a pill whose knob slides and whose track fills, mixed out
of `currentcolor` so it sits in the palette it is switching. Geometry derives from
`--switch-elemental-width` and `--switch-elemental-height`, so any size is two
properties — `.switch-elemental-small` ships as the one preset. An icon per state
is optional, in `.switch-elemental-on` and `.switch-elemental-off` spans inside the
button. The docs page shows the hairline, accent, wash and outline variants, each
one nothing but a few of the theme's custom properties.

## `<tabs-elemental>`

One panel at a time out of a set of them, on the markup the page would have had anyway:
a list of in-page links, and the sections they point at.

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

| Attribute  | Type    | Default | Description                                                              |
| ---------- | ------- | ------- | ------------------------------------------------------------------------ |
| `selected` | number  | `0`     | Index of the selected tab. Reflected — it tracks the live state.         |
| `vertical` | boolean | `false` | The strip runs down the page. The arrow keys go with it.                 |
| `manual`   | boolean | `false` | Arrows move focus without selecting; <kbd>Enter</kbd> or <kbd>Space</kbd> selects. |

The element writes `role="tablist"`, `role="tab"` and `role="tabpanel"`, keeps
`aria-selected` and the roving tabindex in step, and answers to the arrow keys on the axis
`aria-orientation` promises and not the other one. State changes fire a bubbling
`tabs-select`.

Which panel belongs to which tab is the tab's own `#fragment`, or its `aria-controls`, or
failing both the child in the same position. The fragment is the one worth writing: it is a
working link before the element upgrades and after it fails to, which is the whole
degradation — every panel on screen and every link jumping to one. Following such a link
with no script leaves a fragment in the URL that this element then reads back as the
selected tab, and find-in-page reaches the panels that are not showing, because they are
hidden with `hidden="until-found"`.

The element is a `grid` with every panel in the same cell, which is the one layout it
insists on: panels laid out one after another mean a page that jumps by the height of the
last one every time you change tabs. `vertical` puts the strip beside them instead of above.

## Live samples in the docs

Every sample marked `<!-- demo <element> -->` in `docs/` becomes a live, editable preview on
the built page: the element rendered in an iframe above the code that produced it, the code
editable, and a second tab of controls generated from that element's manifest.

```md
<!-- demo switch tab="options" -->

​```html
<switch-elemental checked><button aria-label="Dark mode"></button></switch-elemental>
​```
```

A bare word is an element to load — its stylesheet, its optional theme and its bundle —
and anything with an `=` is passed through to
[`<code-preview>`](https://github.com/stamat/code-preview-element), which is how a demo asks
for `tab="options"` or a set of `viewport-widths`. One element takes its own manifest; a
sample using two takes the cumulative one.

The wrapping happens in `script/demos.js`, after the markup stage, which is the point of the
marker: the sample stays an ordinary fence in the markdown, so it is still one block of real
HTML to read and copy, still highlighted at build time, and still in `llms.txt` and the
search index. Opting in per fence is deliberate — these pages are full of HTML fences that
are not demos.

## Custom Elements Manifest

Every element's API is also machine-readable, as a
[Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) generated
from the JSDoc on each class — attributes with their types and defaults, CSS custom properties
with their syntax, events and slots.

```
dist/custom-elements.json               every element in the book
dist/elementals/switch-manifest.json    one element, same contents
```

Two shapes because the two readers want opposite things. An editor or a converter wants one
file for the whole package, and that is the one `package.json`'s `customElements` key points
at — which is what VS Code and JetBrains read to autocomplete attributes, what Storybook
builds its args table from, and what converters turn into `html-custom-data` and `web-types`.
A page that loads one element's bundle and one element's stylesheet wants the matching
manifest and not the other five elements' documentation:

```js
import manifest from 'book-of-elementals/switch/manifest' with { type: 'json' }
```

Both come out of a single analyzer pass, so they cannot describe the same element
differently. Regenerated by `script/build` — `poops.json` runs
[`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
and then `script/manifests.js` as an `exec.scripts` hook, so there is no second build
command to remember.

The tags are curated by omission: `--switch-elemental-inset`, `--switch-elemental-knob-size`
and `--switch-elemental-travel` are `calc()`-derived from the geometry properties and are
deliberately absent. The manifest is the curation — everything in it is something you are
being invited to change.

## Changelog

Every release is written up in [CHANGELOG.md](CHANGELOG.md), newest first. Changes to the DOM an
element produces, or to CSS you may already be targeting, are called out there explicitly.

## Development

```bash
npm install
script/server  # docs site on :4040 with livereload
script/test    # unit tests (jest), colocated as src/**/*.test.js
script/lint    # eslint + stylelint
script/build   # dist/ (package) and _site/ (docs) — both gitignored
```

Land your change under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) as you go.

`src/` is the package, `docs/` is the site's markdown and its skin. Building writes
`dist/` (rebuilt on `prepack`, so it never has to be committed) and `_site/`, which
`.github/workflows/pages.yml` deploys to GitHub Pages. `dist/` is copied into `_site/`
because a Pages artifact is a single directory — nothing above the site root exists once
deployed, so the live demos need their bundle inside it.


---

Made with ❤️ by @stamat.
