---
layout: poops-docs-theme/docs
title: Combobox
description: A native <select> given a text field to search it with — one value or many, with a chip per selection.
order: 4
---

# `<combobox-elemental>`

A `<select>` with a text field to search it with, per the
[APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — the
searchable, tag-holding select every application ends up needing. The `<select>` stays
the control: it holds the value, submits under its own `name`, and resets and restores
with the form. Light DOM, no shadow root.

[`<suggest-elemental>`](suggest.html) is the same pattern pointed the other way, and the
test is one question: **does the answer go into a form, or does it take you somewhere?** A
city on a signup form is this element. A docs search box is that one — there is no chosen
result to submit, and the reader has left the page the moment they pick.

<p class="demo-row">
  <label for="city-demo">City</label>
  <combobox-elemental style="max-width: 20rem">
    <select id="city-demo" name="city-demo">
      <option value="">Choose a city</option>
      <option value="bg">Beograd</option>
      <option value="ns">Novi Sad</option>
      <option value="ni">Niš</option>
      <option value="su">Subotica</option>
      <option value="ck">Čačak</option>
    </select>
  </combobox-elemental>
</p>

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

## Do you need it?

Most of what these libraries were reached for is now native, and the honest table is short:

| Wanted                                    | Reach for                                                      |
| ----------------------------------------- | -------------------------------------------------------------- |
| A styled dropdown, no searching            | [`appearance: base-select`](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select) — the button, the picker and every `<option>` in plain CSS, no script at all |
| A handful of options, all visible at once  | [`<segmented-elemental>`](segmented.html), or a plain radio list |
| **Typing your way down a long list**       | **this** |
| Several values, each removable             | this, with `multiple` on the `<select>`                        |

Filtering is the gap, and it is the only one: no browser lets you type your way down four
hundred cities, with or without the new styling. If you are not filtering, you do not need
this element.

## Usage

Write the `<select>` you would have written anyway — `<option>`s, `<optgroup>`s, `name`,
`required`, `disabled`, whatever it already had — and wrap it. Nothing else is read, and
nothing else has to be. Edit the sample and the preview above it follows as you type:

<!-- demo combobox class="demo-tall" -->

```html
<label for="fruit">Fruit</label>
<combobox-elemental>
  <select id="fruit" name="fruit">
    <option value="">Choose a fruit</option>
    <option value="apple">Apple</option>
    <optgroup label="Citrus">
      <option value="lemon">Lemon</option>
      <option value="lime">Lime</option>
      <option value="orange">Orange</option>
    </optgroup>
    <option value="pear">Pear</option>
    <option value="quince" disabled>Quince</option>
  </select>
</combobox-elemental>
```

```javascript
import 'book-of-elementals/combobox';
```

```scss
@use "book-of-elementals/combobox/style.scss"; // structure
@use "book-of-elementals/combobox/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/combobox.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/combobox.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/combobox-theme.min.css"
/>
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

## What the element does, and what the browser does

The `<select>` is still the form control, so most of the list is not this element's:

| Behaviour                                                  | Whose        |
| ---------------------------------------------------------- | ------------ |
| `name` / `value` submit, `required`, reset, restore         | the browser  |
| A `<fieldset disabled>` takes the control with it           | the browser  |
| `input` and `change`, fired on the `<select>`               | the browser's events, dispatched by this element |
| The field, the popup, and which options are showing         | this element |
| `role="combobox"`, `aria-expanded`, `aria-activedescendant` | this element |
| A chip per selection, and removing one                      | this element |

## Keyboard

| Key                                                | What it does                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| Any printable character                             | Filters the list, and opens it                                     |
| <kbd>Down</kbd> / <kbd>Up</kbd>                     | Opens the popup onto what is already chosen; from there, moves the cursor and wraps at both ends |
| <kbd>Home</kbd> / <kbd>End</kbd>                    | First and last option showing                                      |
| <kbd>Alt</kbd> + <kbd>Down</kbd> / <kbd>Up</kbd>    | Opens the popup / closes it, leaving the value alone               |
| <kbd>Enter</kbd>                                    | Takes the option under the cursor. With the popup closed it belongs to the form |
| <kbd>Escape</kbd>                                   | Closes the popup and puts the field back to the selection          |
| <kbd>Backspace</kbd>                                | With `multiple` and an empty field, removes the last chip          |
| <kbd>Tab</kbd>                                      | Leaves, closing on the way out. Never trapped                      |

Focus stays in the text field the whole time — the popup's cursor is
`aria-activedescendant`, which is what lets you keep typing while an option is "focused".
A search that finds nothing leaves one line in the popup, announced as an option that
cannot be chosen, rather than an empty popup that says nothing at all.

## Several values

`multiple` on the `<select>` is the whole of it. Each selection gets a chip with a remove
button, the popup stays open across picks, and every option carries `aria-selected` rather
than only the chosen one:

<!-- demo combobox class="demo-tall" -->

```html
<label for="langs">Languages</label>
<combobox-elemental placeholder="Search languages…">
  <select id="langs" name="langs" multiple>
    <option value="sr" selected>Serbian</option>
    <option value="en" selected>English</option>
    <option value="de">German</option>
    <option value="fr">French</option>
    <option value="es">Spanish</option>
  </select>
</combobox-elemental>
```

This is the part with no APG example behind it — the pattern's six are all single-select.
What the pattern does say is followed (`aria-multiselectable`, `aria-selected` on every
option, a popup that survives a pick); the chips are plain `<button>`s, in the tab order,
each named `Remove` plus the option's own label.

There is no caret on a `multiple`. A caret is the mark of a control holding one value out
of a list, and a field full of tags has already said what this one holds — so the element
does not write the indicator at all rather than style it away.

### When the tags outgrow one row

The chips are flex items of the field rather than a box inside it, so they wrap into rows
with the input and the field grows downwards to hold them. The popup rides along, hanging
off the field's own bottom edge however many rows that edge has moved down by.

Nothing caps that growth: forty tags is a field forty tags tall, and everything under it on
the page moves down. If your form cannot take that shape, cap it yourself — the field is
one of the classes you are meant to target:

```css
combobox-elemental .combobox-elemental-field {
  max-block-size: 6rem;
  overflow-y: auto;
}
```

There is no custom property for it, because it is one declaration and the number depends
entirely on the form. Note what you are buying: with a cap, the chip a reader just added can
land below the fold of a box they now have to scroll.

A chip is not truncated either. Its label wraps where it can, but a single long word has
nothing to break on and no maximum width to stop at, so it runs past the field's edge. Trim
the option text, or spend an ellipsis on it:

```css
combobox-elemental .combobox-elemental-chip-label {
  max-inline-size: 12ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

That costs the sighted reader the end of the label and nobody else — the remove button's
name is `Remove` plus the option's full text either way — so it is worth a `title` on the
chip if the labels are long enough to collide after twelve characters.

## Searching

The query matches **anywhere** in an option's label, not only at its start, and both sides
are folded before they are compared — so a keyboard with no diacritics on it still finds
the words that have them:

| Typed      | Finds       |
| ----------- | ------------ |
| `york`     | New York    |
| `cacak`    | Čačak       |
| `dordevic` | Đorđević    |
| `krakow`   | Kraków      |
| `strasse`  | Straße      |
| `бео`      | Београд     |

The folding is `removeAccents` from
[book-of-spells](https://github.com/stamat/book-of-spells): one table pass for the letters
whose mark is written through the glyph — `đ`, `ø`, `ł`, and the ligatures that are two
letters wearing one glyph (`œ`, `æ`, `ß`) — then NFKD with the combining marks dropped,
which is what the rest decompose into.

Not `slugify`, which sits next to it in the same file and looks like the same job: it is
for URLs, so it drops everything outside `[\w0-9-]`. `Београд` comes out empty and `北京`
comes out empty, where the search fold finds both. A search box that cannot find a Cyrillic
city on a Serbian site is not a smaller bug than one that cannot fold an accent.

## Values that are not in the list

`custom-values` lets the reader type a value the `<select>` does not hold. The popup grows an
**add row** for anything not already there; taking it appends a real `<option>` to the
`<select>` and chooses it.

<!-- demo combobox class="demo-tall" -->

```html
<label for="tags">Tags</label>
<combobox-elemental custom-values>
  <select id="tags" name="tags" multiple>
    <option>accessibility</option>
    <option>web-components</option>
  </select>
</combobox-elemental>
```

Type something the list does not hold and the last row offers it. `multiple` with an empty
`<select>` is a tag input, and that is the whole of what makes one — there is no second
element for it, because the chips, the remove buttons, the `Backspace`, the filtering and the
`{label}` naming all already existed here.

**An add row, not a hint.** "Press Enter to add it" written under the field is a sentence a
screen reader meets only if it happens to be read, and never at the moment it applies. A row
in the listbox is announced with the rest of the list, counted in it, and reached with the
same arrow key as everything else. `add-text` is what it says, with `{label}` standing in for
what was typed — the same convention as `remove-text`:

```html
<combobox-elemental custom-values add-text='Create "{label}"'>
```

**It sits last, and that is deliberate.** The closest real match keeps the cursor, so
<kbd>Enter</kbd> still takes what the reader was searching for and adding a new value is one
<kbd>Down</kbd> away. Typing `Rea` into a list holding `React` offers `React`, `Preact`, then
the add row — with `React` under the cursor.

| What is typed | What the popup offers |
| --- | --- |
| Nothing, or only spaces | no add row |
| `React`, and `React` is in the list | no add row — it is already an answer |
| `react`, and `React` is in the list | no add row. Case is not what makes a value new, or a list fills with the same word in every capitalisation anyone typed it in |
| `Svelte`, which is not | the add row, and "No matches" is suppressed — the add row already says the list does not hold it |

Once taken, the value is an `<option>` like the ones you wrote: it filters, it gets a chip, its
remove button is named the same way, and picking it again toggles it. It submits because the
`<select>` submits — nothing is held anywhere else.

Two things worth knowing. A created `<option>` stays in the list after a form `reset`, which
puts back the *selection* and not the markup — the reader's own value is still there to pick
again. And what they typed becomes both the label and the value; if those differ for you,
listen for `change` and rewrite `option.value` yourself.

Off by default, and it has to be: a `<select>` is a closed set of answers, and an element that
quietly widened one would be answering a question the markup did not ask.

Other libraries call this
[`allow-custom-value`](https://vaadin.com/docs/latest/components/combo-box) (Vaadin) or
"creatable" (react-select).

## API

| Attribute     | Type    | Default      | Description                                                            |
| -------------- | ------- | ------------ | ----------------------------------------------------------------------- |
| `open`        | boolean | `false`      | Whether the popup is showing. Reflected — it tracks the live state.     |
| `placeholder` | string  | —            | The field's placeholder. A single select falls back to the label of the option whose value is empty. |
| `empty-text`  | string  | `No matches` | What the popup says when the query matches nothing.                     |
| `remove-text` | string  | `Remove`     | The verb in a chip's remove button, in front of the option's label. Holding `{label}` it says where the label goes instead, for a language that puts the verb last — `{label} entfernen`. |
| `custom-values` | boolean | `false`    | Let a value the `<select>` does not hold be typed in — [values that are not in the list](#values-that-are-not-in-the-list). |
| `add-text`    | string  | `Add {label}` | What the add row says, `{label}` standing in for what was typed. Same convention as `remove-text`. |

Everything else is the `<select>`'s: `multiple`, `required`, `disabled`, `name`, and the
options themselves.

### Properties

| Property      | Type                | Description                                                        |
| -------------- | ------------------- | -------------------------------------------------------------------- |
| `select`      | `HTMLSelectElement` | Read-only. The control this is a view of.                           |
| `value`       | string              | The `<select>`'s value — the first selection for a `multiple` one.   |
| `values`      | `string[]`          | Read-only. Every selected value, in document order.                 |
| `multiple`    | boolean             | Read-only. Whether the `<select>` is `multiple`.                    |
| `open`        | boolean             | Whether the popup is showing.                                       |
| `apply()`     | —                   | Re-read the `<select>` and rebuild the popup. Call it after replacing the options. |

### Events

None of its own. The `<select>` is the control, so it fires `input` and then `change`,
exactly as a native one does when a reader uses it — one listener on the form hears every
field in it:

```javascript
document.querySelector('#city').addEventListener('change', (e) => e.target.value);
```

Setting the value from script fires nothing — that is the platform's rule for every form
control — so redraw with it:

```javascript
const combobox = document.querySelector('combobox-elemental');

combobox.value = 'ns'; // the setter redraws

combobox.select.value = 'ns'; // straight at the control, so say so
combobox.apply();

combobox.select.innerHTML = '<option>…</option>'; // new options, same call
combobox.apply();
```

### The DOM it builds

This element writes markup, which the ones wrapping a native widget do not have to. It is
inserted **before** the `<select>`, so a `<label>` wrapping the whole element names the
field and not the hidden control:

```html
<combobox-elemental open>
  <div class="combobox-elemental-field">
    <span class="combobox-elemental-chips">
      <span class="combobox-elemental-chip">
        <span class="combobox-elemental-chip-label">Serbian</span>
        <button class="combobox-elemental-chip-remove" aria-label="Remove Serbian"></button>
      </span>
    </span>
    <input class="combobox-elemental-input" role="combobox" aria-expanded="true" … />
    <!-- single select only: a multiple has chips instead of a caret -->
    <button class="combobox-elemental-indicator" tabindex="-1" aria-hidden="true"></button>
  </div>
  <ul class="combobox-elemental-list" role="listbox" data-side="block-end">
    <li class="combobox-elemental-option" role="option" aria-selected="true" data-active>…</li>
    <li class="combobox-elemental-group" role="presentation">
      <span class="combobox-elemental-group-label" aria-hidden="true">Citrus</span>
      <ul role="group" aria-label="Citrus">
        <li class="combobox-elemental-option" role="option" aria-selected="false">…</li>
      </ul>
    </li>
    <li class="combobox-elemental-empty" role="option" aria-disabled="true" hidden>No matches</li>
    <!-- custom-values only -->
    <li class="combobox-elemental-add" role="option" aria-selected="false" hidden>Add Svelte</li>
  </ul>
  <p class="combobox-elemental-error" hidden></p>
  <select class="combobox-elemental-native" aria-hidden="true" tabindex="-1">…</select>
</combobox-elemental>
```

Everything the element touches goes back the way it arrived when it is removed from the
page — the classes, the `tabindex`, and a `<label for>` it re-pointed at the field.

### Styling hooks

```css
combobox-elemental[open] {
} /* the popup is showing */
combobox-elemental .combobox-elemental-option[data-active] {
} /* where the cursor is — where Enter would land */
combobox-elemental .combobox-elemental-option[aria-selected="true"] {
} /* chosen, which is a different question */
combobox-elemental .combobox-elemental-input[aria-invalid="true"] {
} /* the browser refused to submit */
combobox-elemental .combobox-elemental-list[data-side="block-start"] {
} /* it opened upwards */
combobox-elemental:has(> select:disabled) {
} /* own, or a fieldset's */
combobox-elemental:not(:defined) {
} /* before upgrade */
```

## In a form

Nothing to wire — the `<select>` is the control:

```html
<form>
  <label for="country">Country</label>
  <combobox-elemental>
    <select id="country" name="country" required>
      <option value="">Choose a country</option>
      <option value="rs">Serbia</option>
      <option value="hr">Croatia</option>
    </select>
  </combobox-elemental>
  <button>Save</button>
</form>
```

```javascript
new FormData(form).get('country'); // 'rs' | 'hr'
```

A `multiple` submits the way a `<select multiple>` submits, which is the part people
usually expect to be different: **one entry per selection, all under the same name** — so
`get()` returns the first and `getAll()` returns them all. Nothing selected sends the field
no entry at all, exactly as an unchecked checkbox does, so a server reading it has to treat
"missing" as "none":

```html
<form>
  <label for="langs">Languages</label>
  <combobox-elemental>
    <select id="langs" name="langs" multiple>
      <option value="sr" selected>Serbian</option>
      <option value="en">English</option>
    </select>
  </combobox-elemental>
</form>
```

```javascript
new FormData(form).getAll('langs'); // ['sr', 'en']
new FormData(form).get('langs'); // 'sr' — the first, which is rarely what you meant
```

In PHP that name wants to be `langs[]`; in Rails, `langs[]` too. Both are the framework's
convention for a repeated field and neither is this element's business — the markup is the
same `<select multiple>` you would have written.

`required` works, and works for a reason worth knowing about: the `<select>` is hidden by
being made transparent and un-clickable, **not** by `display: none`. A `display: none`
control that is `required` blocks its own form — the browser refuses to submit, tries to
focus a control it cannot draw, and reports nothing to anybody. Rendered, it keeps its box
and its place in validation.

What the element does with that is take the message and leave the bubble:

| Step | What happens |
| ----- | ------------- |
| The browser finds the value missing | `invalid` fires on the `<select>` |
| Its bubble is cancelled             | it would be aimed at a transparent, `aria-hidden` control |
| The message is kept                 | `select.validationMessage`, so it is the browser's own words, already translated — into `<p class="combobox-elemental-error">` under the field |
| The field says so                   | `aria-invalid="true"`, and `aria-describedby` pointing at that message on top of any description you gave it |
| Focus goes to the field             | and only for the first invalid control in the form, which is the one the browser would have focused |

Choosing a value clears all of it. Nothing here is invented — the text is the platform's,
and the element only moves it somewhere the reader can see.

There is no `role="alert"` on that message, which is the counter-intuitive part.
`aria-describedby` is read when focus arrives at the field, and the message appears at the
moment the field is taking focus — so an alert on top of it is the same sentence twice in
NVDA and JAWS, and stops VoiceOver reading the description at all
([Roselli's testing](https://adrianroselli.com/2023/04/exposing-field-errors.html)). A
combobox further down the form does not take focus, so its message waits until the reader
reaches it, which is what a plain form does and better than three alerts firing at once from
three invalid fields. [`<field-elemental>`](field.html) does the same thing for an ordinary
input.

## Degrading

| Missing                   | What you get                                                                    |
| -------------------------- | --------------------------------------------------------------------------------- |
| The script never loads    | The `<select>`, plainly visible and fully working — every value reachable, just not searchable |
| The theme is not imported | An unstyled but correctly laid out field and popup, with a focus ring — the ring is in `style.scss`, not the theme |
| JavaScript is on, CSS is off | The field, the popup and the `<select>` all visible at once, which is ugly and still usable |

The element hides nothing until there is something to hide it behind: the `<select>` is
only covered once the field that replaces it exists.

> [!NOTE]
> On a phone, a plain `<select>` opens the platform's own picker — a big, familiar,
> thumb-sized thing this element cannot beat. If the list is short enough not to need
> searching, that is the better control, and leaving the element off below a breakpoint is
> a reasonable thing to do.

## The look

`style.scss` is structure only; `theme.scss` is the look and is optional — a light-DOM
element cannot scope a look away from a page that did not ask for one. Colours are mixed
out of `currentcolor` and `Canvas`, so it sits in the palette the page already has:

| Property                             | Default                     | Description                                    |
| ------------------------------------- | --------------------------- | ----------------------------------------------- |
| `--combobox-elemental-radius`        | `0.375rem`                  | Corners of the field and the popup             |
| `--combobox-elemental-inset`         | `0.5rem`                    | The one padding unit — see below               |
| `--combobox-elemental-surface`       | `Canvas`                    | What the field and the popup are painted on    |
| `--combobox-elemental-border`        | `currentcolor` at 30%       | The rim around both                            |
| `--combobox-elemental-active`        | `currentcolor` at 12%       | The option the cursor is on                    |
| `--combobox-elemental-selected`      | `currentcolor` at 5%        | The options already chosen                     |
| `--combobox-elemental-chip`          | `currentcolor` at 12%       | Chip fill                                      |
| `--combobox-elemental-invalid`       | `#e5484d` mixed with the text colour | The rim and the message once the browser has refused |
| `--combobox-elemental-max-height`    | `15rem`                     | How tall the popup gets before it scrolls      |

`--combobox-elemental-inset` is spent three times — inside the field, between the text and
the caret, and down the side of every option — and nowhere else, which is why the popup
itself has no padding of its own: its rows run edge to edge, so the first one sits against
the seam it is joined at and every letter in it lands under the field's. Two numbers that
have to agree cannot be two numbers.

**The popup is the field carried on downwards.** While it is open, the corners the two meet
at square off and their borders are pulled onto each other, so the pair reads as one panel
with a divider rather than as two boxes that happen to touch — and the same the other way up
when it opens above. The focus ring turns inwards for as long as it is open (`outline-offset`
goes from `2px` to `-2px`), because a ring drawn outside the field's box is a ring drawn
across that seam and over the popup below it. It is the same 2px of `currentcolor` either
way; only the side of the border it sits on changes.

**The cursor and the selection are two different facts**, so they are drawn differently: the
option the cursor is on takes the stronger tint, the ones already chosen take the fainter
one plus a tick and a heavier weight. Pointing at an option *moves* the cursor onto it
rather than lighting up a second row, so the mouse and the arrow keys drive the same one
thing.

That is the table above, live. Turn the knobs in the **Options** tab until it looks the
way you want, then copy the rule out of the bottom of the panel:

<!-- demo combobox tab="options" class="demo-tall" style="--code-preview-options-height:554px" -->

```html
<combobox-elemental>
  <select aria-label="Turn me in the Options tab">
    <option value="">Pick one</option>
    <option value="1">One</option>
    <option value="2">Two</option>
    <option value="3">Three</option>
  </select>
</combobox-elemental>
```

The chosen option is marked with a tick as well as a background, because a background
alone is gone under `forced-colors` and invisible to anyone who cannot tell the two greys
apart. In that mode the active option is repainted `Highlight`/`HighlightText`, the one
pair it guarantees contrasts.

> [!NOTE]
> The properties go **on the `<combobox-elemental>`** — a class on it,
> `.card combobox-elemental`, or the element itself. The theme sets its defaults on the
> element, and a property set on an element always beats one inherited from an ancestor,
> so `.form { --combobox-elemental-surface: … }` silently does nothing.

**The typed text is never under 16px.** The input takes the page's font, and iOS Safari
zooms the page in on any text field that computes smaller than that — then leaves it zoomed
once the field is done with. So the input's `font-size` is `max(16px, 1em)`: your size
wherever it already clears the bar, 16px where it does not. There is no pointer query in
front of it, so a page set smaller than 16px renders the typed text a little bigger than
the chips and options beside it on a desktop too — one rule that reads the same everywhere,
against a pinch on every open. Take it back if you would rather have the page's size:

```css
combobox-elemental .combobox-elemental-input {
  font-size: 1em;
}
```

The other cure, `maximum-scale=1` in your viewport tag, buys it by capping the zoom of the
whole page wherever the browser honours it — one field fixed at the cost of
[WCAG 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) for every reader
on it.

## Where the popup goes

Under the field, unless it does not fit there and fits better above — measured when it
opens, again when the window resizes, and on a `multiple` after every pick, because a tag
that wraps onto a new row moves the edge the popup is hanging off. The answer is written
onto the popup as `data-side="block-end"` or `"block-start"` for the stylesheet to act on.
Below wins ties,
because the popup scrolls: "nowhere it fits" is a choice between two cramped corners
rather than a failure, and the corner the reader expects is the one under the field.

Flipping only chooses which end of the field the popup hangs off, and on a short window
both ends can still be off screen — so the page is scrolled the smallest amount that brings
the popup into view (`scrollIntoView({ block: "nearest" })`, which does nothing at all when
it is already visible). If you put one inside a scrolling box of your own, that box is what
scrolls, and it needs the room: a popup inside `overflow: hidden` is a popup clipped by it.

## Combobox, select, or something else?

| Wanted                                                    | Element                                   |
| ---------------------------------------------------------- | ------------------------------------------ |
| One of many, and the list is long enough to search         | this                                      |
| Several of many, each one removable                        | this, with `multiple`                     |
| One of a few, all worth showing at once                    | [`<segmented-elemental>`](segmented.html) |
| On or off                                                  | [`<switch-elemental>`](switch.html)       |
| One of a few, and you only want it styled                  | `<select>` with `appearance: base-select` |
| A list of commands rather than a value                     | [`<menu-elemental>`](menu.html)           |

A combobox is a form control that holds a value. If the thing being picked runs an action
instead, it is a menu, and `aria-selected` on a command is a promise nothing keeps.

<script src="{{ relativePathPrefix }}dist/elementals/combobox.js"></script>
