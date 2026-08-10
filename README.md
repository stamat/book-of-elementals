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
| `<carousel-elemental>`   | [APG Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) on a scroll-snapping list — the scroller is the state, so nothing is measured on resize |
| `<checkbox-group-elemental>` | [APG Checkbox (Mixed-State)](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), a select-all that shows the dash when it is some of them |
| `<combobox-elemental>`   | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), a `<select>` you can type your way down, one value or many |
| `<disclosure-elemental>` | [APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), where `<details>` cannot go |
| `<menu-elemental>`       | [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), nested, and not a menu below a breakpoint |
| `<modal-elemental>`      | [APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) on native `<dialog>` — nested, animated out, and dismissed the way the platform says |
| `<navbar-elemental>`     | [APG Disclosure Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), folding itself away when the links stop fitting |
| `<segmented-elemental>`  | [APG Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) on native radios, drawn as a track with a knob that slides |
| `<suggest-elemental>`    | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox popup — a list of links a text field drives with the arrow keys |
| `<switch-elemental>`     | [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), for a setting that takes effect at once |
| `<tabs-elemental>`       | [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), horizontal or vertical, on a list of in-page links |
| `<toolbar-elemental>`    | [APG Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) — a row of buttons the arrows walk and Tab passes in one step |
| `<tooltip-elemental>`    | [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) as far as it has consensus — a description on hover and focus, still on the page without script |
| `<copy-elemental>`       | No APG pattern — a `<button>`, the clipboard write behind it, and the [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html) every copy button forgets |
| `<search-elemental>`     | No APG pattern — the query half of a search field: the debounce, the abort, the loading state and the [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) a panel filling itself does not make |

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

## `<carousel-elemental>`

A row of slides you scroll through, on the list you would have written anyway:

```html
<carousel-elemental aria-label="Places">
  <ul>
    <li><figure><img src="canyon.jpg" alt="A river running through a rocky canyon" /></figure></li>
    <li><figure><img src="ridge.jpg" alt="Mist over a forested ridge at dawn" /></figure></li>
    <li><figure><img src="lake.jpg" alt="A lake below a range of bare mountains" /></figure></li>
  </ul>
</carousel-elemental>
```

The scroll container is the state. There is no transform engine, no cloned slides
and no index attribute to keep in step with where the row actually is: the slides
sit in a scroll-snapping scroller, moving is one assignment to `scrollLeft`, and
which slide is current is whatever an `IntersectionObserver` says is on screen.
That is what makes it responsive for nothing — resize the window, change
`--carousel-elemental-slide-size` at a breakpoint, put the whole thing in a
container query, and there is no listener to fire and no measurement to redo.
There is no key handler either: a focused scroll container already answers to the
arrows, `Home`, `End` and the page keys.

The element writes the roles of the
[APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) and
appends the controls — previous, a picker with one button per slide, next — which
is the enhancement working rather than a preference: a previous button authored in
the markup is a button that does nothing until the script lands. Without the script
the same list is a scroll-snapping row you can swipe, drag the scrollbar of and
reach with the keyboard, every slide in the page and in reading order.

The arrows stop at the ends and say so before you press them: the one with nowhere
to go takes `aria-disabled` and is dimmed, and `data-carousel-at-start` /
`data-carousel-at-end` on the element let a page style its own. That state is the
scroller's answer to "is there anywhere left to scroll" rather than arithmetic on
the index — the only version that holds when three slides of five are on screen and
the row is at its end while the current slide is the third.

`autoplay` adds rotation and the control that stops it, first in the tab order
inside the carousel, with a name that says what pressing it will do. Hover and
focus pause it; rotation you started by hand ignores both until that button stops
it; `prefers-reduced-motion: reduce` means it does not start on its own, and the
control is still there for a reader who wants it. The rotation is the one thing
that wraps at the end.

`fade` swaps the row for a stack that cross-fades — the same controls, picker,
rotation and events, and the only mode where the scroller is not the state. It pays
for itself honestly: the slides not showing are `visibility: hidden`, so they leave
the accessibility tree and find-in-page, which is exactly the case the APG writes
its live region for, and `fade` gets one. Scrolling there is none, and no
`aria-hidden` on anything, because every slide is in the tree the whole time. A
stack is not a scroll container either, so `fade` is the one place this element
reads a gesture of its own: a touch swipe across it moves one slide, where the
scrolling row gets that from the browser for nothing.

No infinite loop, no mouse drag, no vertical axis, and no `slides-per-page`, which
is one custom property.

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

It arrives with `checkbox-group/theme.scss` already, and never as a bare
`input[type="checkbox"]` selector: importing a theme for an accordion must not silently
redraw every checkbox on the page. The seven `--checkbox-elemental-*` properties and the
`forced-colors` behaviour are on
[the drawn checkbox](https://stamat.github.io/book-of-elementals/checkbox.html) — the only
look in the package that is not an element's, and the line is stated in
[CONTRIBUTING.md](CONTRIBUTING.md): a control gets one only when an element cannot be drawn
without it.

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
| `remove-text` | string  | `Remove`     | The verb in a chip's remove button, before the option's label — or holding `{label}`, wherever the language puts it: `{label} entfernen`. |

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

## `<copy-elemental>`

A real `<button>` that puts text on the clipboard and says so, in both of the ways
a reader might be listening:

```html
<code id="install">npm i book-of-elementals</code>

<copy-elemental for="install">
  <button type="button">Copy</button>
</copy-elemental>
```

| Attribute     | Type   | Default       | Description                                                     |
| ------------- | ------ | ------------- | ----------------------------------------------------------------- |
| `for`         | string | —             | `id` of the element to copy. Also read as `data-for`.            |
| `value`       | string | —             | Literal text, exactly as written. Wins over `for`.               |
| `copied-text` | string | `Copied`      | What the live region announces on success.                       |
| `error-text`  | string | `Copy failed` | What it announces when there was nothing to copy, or it refused. |

**There is no APG pattern here, because there is no widget.** It is a button, and a
button is already accessible; what is missing is the half after the click. Every copy
button on the web swaps an icon or floats a "Copied!" tooltip, and neither of those is
anything at all to a reader using a screen reader — they press it and are told exactly
what they were told before pressing it. That is
[WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html)
unmet, and closing it is why this element exists rather than a snippet copied off a blog.
[`@github/clipboard-copy`](https://github.com/github/clipboard-copy-element) is the
smaller install if you are drawing the feedback yourself.

So one press does three things: the clipboard write, `data-state="copied"` or `"error"`
on the element for two seconds, and the matching words in a `<span role="status">` the
element appends to itself at upgrade — clipped out of sight, never `display: none`, which
would take it back out of the accessibility tree and undo the point. A bubbling
`copy-done` carries `detail.ok` and `detail.text`.

A field is copied by its current `.value`, anything else by the text it shows, with
leading newlines and trailing whitespace stripped — a code block's trailing newline pasted
into a terminal runs the command the reader was still reading. A `value` is never trimmed.

**A copy button that cannot copy is a button that lies**, so it is not offered at all until
the element upgrades and finds a clipboard: no script, a page served over plain `http`
where `navigator.clipboard` does not exist, or markup that named nothing to copy, and there
is no button — `data-unavailable` says which. Keep the text selectable on the page; the
button is a shortcut past selecting it, not the only way to it.

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

## `<modal-elemental>`

A `<dialog>` opened as a modal — and opened by the browser, which is the whole
argument for the element. `showModal()` already puts it in the top layer, makes
the rest of the page `inert`, moves focus in, brings it back on close and closes
on <kbd>Escape</kbd>. **Nesting comes with that**: a second modal is a second
entry in the top layer, and the browser computes inertness from the topmost one,
so nothing here tracks parents or arbitrates `z-index`.

```html
<button type="button" command="show-modal" commandfor="confirm">Sign out</button>

<modal-elemental closedby="any">
  <dialog id="confirm">
    <h2>Sign out everywhere?</h2>
    <form method="dialog">
      <button type="submit" value="cancel">Cancel</button>
      <button type="submit" value="ok">Sign out</button>
    </form>
  </dialog>
</modal-elemental>
```

| Attribute       | Type    | Default        | Description                                                              |
| --------------- | ------- | -------------- | -------------------------------------------------------------------------- |
| `closedby`      | enum    | `closerequest` | `any`, `closerequest` or `none` — HTML's own three values. Moved up from the `<dialog>` if written there |
| `close-others`  | boolean | —              | Opening this one closes every modal already open, instead of stacking      |
| `close-text`    | string  | `Close`        | The close button's accessible name                                         |

What the platform leaves behind is the whole of the element: an **exit
animation**, which otherwise needs the [`overlay`](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay)
property that [Firefox and Safari do not have](https://caniuse.com/mdn-css_properties_overlay);
a **click on the backdrop**, which needs `closedby` support
[Safari does not have either](https://caniuse.com/mdn-html_elements_dialog_closedby);
the page behind **not scrolling**; the pile of backdrops a stack of modals would
paint on top of each other, of which only the bottom one dims; and an
`aria-labelledby` pointed at the first heading, since a `<dialog>` takes no name
from its contents.

Every modal gets a cross in the corner, written by the element as its dialog's
first child — the APG asks for a visible close button, and HTML gives you
`<form method="dialog">` and leaves the rest. It is positioned in the
corner of the dialog, which a modal `<dialog>` is already the containing block
for. `closedby="none"` gets no cross: that value is a dialog to be answered
rather than dismissed.

Triggers are HTML's own invoker commands — `command="show-modal"` and
`commandfor` — handled by the element rather than left to the browser, which is
what animates the close and what makes them work where invoker commands have not
landed yet. A `<a href="#id">` opens one too, which is what deep links, the back
button and a page with no script all ride on.

Closing stops what the modal was playing: `<video>` and `<audio>` are paused, and
an `<iframe>` is reloaded, since a cross-origin player takes no instructions from
here. That is all the lightbox and the YouTube embed on the
[docs page](https://stamat.github.io/book-of-elementals/elementals/modal.html)
are — markup in a dialog, with nothing switched on.

It replaces [modally](https://github.com/stamat/modally), which is deprecated:
nesting, `closeOthers` and hash-driven opening are all here, and the width and
alignment options are custom properties, which is what they always were.

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

## `<search-elemental>`

The query half of a search field, and the other side of `<suggest-elemental>`'s seam: it
decides when to ask, hands you an `AbortSignal`, and turns what comes back into a state your
CSS can draw and a sentence a screen reader hears. It does not fetch.

```html
<search-elemental min="2">
  <search>
    <form action="/search/">
      <label for="q">Search</label>
      <input type="search" id="q" name="q" autocomplete="off" />
    </form>
  </search>
  <suggest-elemental for="q"><ul></ul></suggest-elemental>
</search-elemental>
```

```js
search.addEventListener('search-query', (e) => {
  e.detail.wait(
    fetch(url + encodeURIComponent(e.detail.query), { signal: e.detail.signal })
      .then((r) => r.json())
      .then((rows) => list.replaceChildren(...rows.map(toRow)))
  );
});
```

| Attribute       | Type   | Default        | Description                                                     |
| --------------- | ------ | -------------- | ---------------------------------------------------------------- |
| `delay`         | number | `200`          | Milliseconds the field has to stop changing before a query goes out. |
| `min`           | number | `1`            | Characters needed before one goes out at all. `0` sends the empty query too. |
| `results-text`  | string | `5 results`    | Announced on a hit. `{n}` is the count.                          |
| `empty-text`    | string | `No results`   | Announced when nothing matched.                                  |
| `error-text`    | string | `Search failed`| Announced when the request failed.                               |

One request per pause instead of one per keystroke, one `AbortController` per query, and a
sequence number that drops the slow answer arriving after the fast one — the bug that leaves
results for `car` on screen under a field reading `carousel`. `data-state` runs
`idle` → `pending` → `results` / `empty` / `error`, `aria-busy` goes on the panel, and the
count is announced through a `role="status"` region the element appends, which is
[WCAG 2.2 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) met rather
than skipped.

`wait()` is what buys the loading state; a page filtering a list it already has never calls
it and never gets a spinner nothing will stop. With no script the `<form>` submits and the
reader gets a search page.

## `<suggest-elemental>`

A list of links a text field drives with the arrow keys — the results panel a search box, a
filter and a "jump to" field all end up needing, and only the half of it that has nothing to
do with where the results came from.

```html
<input type="search" id="q" autocomplete="off" />
<suggest-elemental for="q">
  <ul>
    <li><a href="/docs/install/">Install</a></li>
    <li><a href="/docs/config/">Configuration</a></li>
  </ul>
</suggest-elemental>
```

| Attribute | Type    | Default | Description                                                                     |
| --------- | ------- | ------- | ------------------------------------------------------------------------------- |
| `for`     | string  | —       | `id` of the text field that drives it. Without it the element does nothing.     |
| `open`    | boolean | `false` | Whether the panel is showing. Reflected, and settable so whatever fills the list can show it. |

Only `<a href>` becomes an option — a row that goes nowhere is a dead line on the list. The
`<ul>` and its `<li>`s are marked `role="presentation"`, since a `listbox` may only own
`option`s; the boxes stay for your CSS, only the semantics come off. Replace the contents
whenever you like and the element re-marks them, so there is no refresh to forget.

Focus never enters the list. The cursor is `aria-activedescendant` on the field, which is
what lets someone keep typing while they walk the results — a roving `tabindex` would take
the caret out of the field on the first arrow key. `Enter` follows the row under the cursor,
`Escape` closes, and both are left to the page while the panel is closed, so the form still
submits and the field can still be cleared. `Home` and `End` are always the field's.

Not [`<combobox-elemental>`](#combobox-elemental), which is a view of a `<select>`: that one
holds a value and its options carry `aria-selected`. These options are links — destinations,
not values, with nothing to select. Reach for the combobox when the answer goes into a form,
for this when the answer is somewhere to go.

It does not fetch, filter, rank or highlight. With scripting off it is a list of links, in
flow and visible — nothing is authored `hidden`, so nothing is lost.

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

## `<toolbar-elemental>`

A row of buttons that costs the reader one tab stop instead of one per button:

```html
<toolbar-elemental aria-label="Formatting">
  <button type="button">Bold</button>
  <button type="button">Italic</button>
  <button type="button">Code</button>
</toolbar-elemental>
```

| Attribute  | Type    | Default | Description                                                              |
| ---------- | ------- | ------- | ------------------------------------------------------------------------ |
| `vertical` | boolean | `false` | The bar runs down the page. The arrow keys and `aria-orientation` go with it. |

The element writes `role="toolbar"` and keeps a roving `tabindex` in step: `Tab` enters the
bar and the next `Tab` is past all of it, with the arrows moving between the controls in
between. It answers to the axis `aria-orientation` promises and not the other one, because a
`↓` on a horizontal bar is the page scrolling. The ends do not wrap — `Tab` is how you leave,
and a bar that looped is one you can walk forever without noticing.

Name it. The element cannot invent an `aria-label` and does not pretend to. Only `<button>`
and `<a href>` are walked, since a `<select>` or a text field wants the arrows for itself;
`disabled` controls are skipped because the platform will not focus one, and `aria-disabled`
is how you keep a control reachable and inert. Without script every button is a button, each
its own tab stop.

## `<tooltip-elemental>`

A description shown on hover and on focus, and a sentence on the page when the script never
arrives:

```html
<tooltip-elemental>
  <button type="button">Save</button>
  <span>Saves to your drafts, without publishing</span>
</tooltip-elemental>

<button type="button" id="save">Save</button>
<tooltip-elemental for="save">Saves to your drafts, without publishing</tooltip-elemental>
```

| Attribute    | Type    | Default | Description                                                                       |
| ------------ | ------- | ------- | --------------------------------------------------------------------------------- |
| `for`        | string  | —       | `id` of the control this describes. Only read when the element does not wrap one. |
| `horizontal` | boolean | `false` | Beside the control rather than over or under it. Which side is still measured.     |

Nothing selects between the two shapes: the element contains something focusable or it does
not. A `title` on the trigger is used when there is nothing else to say, and the attribute is
removed so the native tooltip does not show underneath — as a **description** when the control
had a name already, and as its **name** when the `title` was the only one it had, which is the
icon-only button and the reason that is automatic rather than an option.

**The [APG's pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) says of itself that it
"is work in progress; it does not yet have task force consensus"**, so this implements the half
every source agrees on — `aria-describedby` to the words, <kbd>Escape</kbd> to dismiss, no
timeout, and a bubble that can itself be hovered, which is
[WCAG 2.2 SC 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) —
and refuses the contested half: never the control's name, and **nothing on touch**. There is no
hover on a touch screen and a tap is activation rather than focus, so touch pointers are ignored
outright instead of half-handled. Nothing essential belongs in a tooltip.

The bubble gets `role="tooltip"`, an `id` if it had none, and `hidden` between showings —
`aria-describedby` reaches hidden content, so the description is on the control the whole time.
It is placed with `position: fixed` against the viewport, since the trigger and the bubble are
not always in the same offset parent, with `data-side` and `data-align` written back for a caret
to read.

**The axis is the author's and the side is the viewport's:** `horizontal` puts the bubble beside
the control instead of under it, and which of the two sides that is gets measured. There is no
`placement="e"`, because a fixed side is a tooltip off the edge of the screen on the one page
where it did not fit. Along the other axis a control wider than its bubble is centred on, and a
narrower one has its edges lined up — a short tooltip pinned to the corner of a long button
looks like it belongs to something else, while a small button centred under a long sentence
leaves most of that sentence beside the thing it describes.

The middle of the trigger is handed to the stylesheet as `--tooltip-elemental-arrow-offset` so
a caret can point at it rather than at the corner the bubble aligned to; the theme clamps it,
since the corner radius is its number. That theme is GitHub's proportions with a rim and a
caret of our own, fading in and out over `--tooltip-elemental-duration` — a fade that needs
`@starting-style` and `transition-behavior`, both Baseline 2024, so on Safari 17.0–17.4 it
appears and disappears instead. Its knobs are declared on `tooltip-elemental` itself, at one
type selector's worth of specificity, so a page can win by writing the same selector later.

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
