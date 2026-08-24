---
layout: poops-docs-theme/docs
title: Segmented
description: One choice out of a few, drawn as a track with a knob that slides — native radio buttons wearing a segmented control.
order: 10
---

# `<segmented-elemental>`

A row of radio buttons drawn as one track with a knob that slides between them — the
N-state answer to [`<switch-elemental>`](switch.html). The segments stay
`<input type="radio">`, so the whole of the
[APG Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) is the
browser's. Light DOM, no shadow root, nothing moved or wrapped.

<p class="demo-row">
  <segmented-elemental aria-label="Range">
    <label><input type="radio" name="range-demo" value="day"> Day</label>
    <label><input type="radio" name="range-demo" value="week" checked> Week</label>
    <label><input type="radio" name="range-demo" value="month"> Month</label>
  </segmented-elemental>
</p>

```html
<segmented-elemental aria-label="Range">
  <label><input type="radio" name="range" value="day" /> Day</label>
  <label><input type="radio" name="range" value="week" checked /> Week</label>
  <label><input type="radio" name="range" value="month" /> Month</label>
</segmented-elemental>
```

## Usage

Write the radio group you would have written anyway — one `<label>` per segment, each
wrapping its own `<input type="radio">`, all of them sharing a `name` — and wrap it.
Labels must be direct children and the input must be inside its label; without either
there is nothing to coordinate, and nothing is enforced beyond that. Edit the sample and
the preview above it follows as you type:

<!-- demo segmented style="--code-preview-height:77px" -->

```html
<segmented-elemental aria-label="View">
  <label><input type="radio" name="view" value="grid" checked /> Grid</label>
  <label><input type="radio" name="view" value="list" /> List</label>
  <label><input type="radio" name="view" value="map" /> Map</label>
</segmented-elemental>
```

```javascript
import 'book-of-elementals/segmented';
```

```scss
@use "book-of-elementals/segmented/style.scss"; // structure
@use "book-of-elementals/segmented/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/segmented.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/segmented.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/segmented-theme.min.css"
/>
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

## What the element does, and what the browser does

Almost all of it is the browser's, because the segments are real radio buttons:

| Behaviour                                            | Whose        |
| ---------------------------------------------------- | ------------ |
| Arrows move the selection, wrapping at both ends      | the browser  |
| <kbd>Tab</kbd> enters and leaves the group once       | the browser  |
| Focus lands on the checked segment                    | the browser  |
| `name` / `value` submit, `required`, reset, restore   | the browser  |
| Announced as a radio, and as one of a group           | the browser  |
| A `<fieldset disabled>` takes the whole group with it | the browser  |
| Where the knob is, and whether there is one           | this element |

So there are no roles written here, no `aria-checked`, and no event of its own — a radio
fires `change`, and `change` bubbles.

## API

There are no attributes. The element reads the radios and writes the selection onto
itself:

| What                            | Value                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| `--segmented-elemental-index`   | Index of the checked segment. The knob's position           |
| `--segmented-elemental-count`   | How many segments there are. The knob's width               |
| `data-index`                    | The same index, as an attribute. What the knob hangs off    |
| `role="group"`                  | Only if you gave it `aria-label` / `aria-labelledby`, [see below](#naming-the-group) |

### Properties

| Property          | Type                       | Description                                                     |
| ----------------- | -------------------------- | --------------------------------------------------------------- |
| `inputs`          | `HTMLInputElement[]`       | Read-only. The segments' radios, in document order.             |
| `selectedIndex`   | number                     | Read-only. Index of the checked one, or `-1` for no selection.  |
| `apply()`         | —                          | Re-read the selection and the count. Call it after adding or removing a segment. |

### Events

None of its own. The radios are native, so use `change` — it fires on the input and
bubbles, which means one listener on the group, or on the form, hears every segment:

```javascript
const range = document.querySelector('segmented-elemental');

range.addEventListener('change', (e) => e.target.value); // 'day' | 'week' | 'month'
```

Setting `.checked` from script fires nothing — that is the platform's rule for every form
control — so move the knob with it:

```javascript
range.inputs[2].checked = true;
range.apply();
```

### Styling hooks

```css
segmented-elemental[data-index="0"] {
} /* the host, once it knows the selection */
segmented-elemental > label:has(> input:checked) {
} /* what the theme keys off */
segmented-elemental > label:has(> input:disabled) {
} /* own, or a fieldset's */
segmented-elemental:not(:defined) {
} /* before upgrade */
```

## Naming

### Naming the group

A group of radios sharing a `name` is already a group to a screen reader, but the group
itself still needs a name. Two ways, in order of preference:

```html
<!-- 1. Native: fieldset and legend, which also gives you `disabled` for free -->
<fieldset>
  <legend>Range</legend>
  <segmented-elemental> … </segmented-elemental>
</fieldset>

<!-- 2. On the element, where a fieldset would be too much furniture -->
<segmented-elemental aria-label="Range"> … </segmented-elemental>
```

`aria-label` on an element with no role is silently nothing, so the element adds
`role="group"` when it finds one of the two ARIA attributes and no `role` of your own.
That is the only ARIA it writes.

### Naming a segment

The label's text is the segment's name, so a text segment needs nothing. An icon-only
segment has no text to be named by, and needs one of these — an `aria-label` on the
**input**, since that is the control:

<!-- demo segmented style="--code-preview-height:69px" -->

```html
<segmented-elemental aria-label="Align">
  <label>
    <input type="radio" name="align" value="start" aria-label="Left" checked />
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1 2h14M1 6h9M1 10h14M1 14h9"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>
  </label>
  <label>
    <input type="radio" name="align" value="center" aria-label="Center" />
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1 2h14M4 6h8M1 10h14M4 14h8"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>
  </label>
  <label>
    <input type="radio" name="align" value="end" aria-label="Right" />
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1 2h14M6 6h9M1 10h14M6 14h9"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>
  </label>
</segmented-elemental>
```

`aria-hidden` on the SVG, because it is the name drawn rather than a second name. Draw
icons in `currentColor` and they take the segment's colour, selected or not.

## In a form

Nothing to wire. The segments are the form controls, so the group submits under its
shared `name`, resets to whatever the markup checked, restores on a back-navigation,
honours `required` on any one of the radios, and goes down with a `<fieldset disabled>`:

```html
<form>
  <fieldset>
    <legend>Billing period</legend>
    <segmented-elemental>
      <label><input type="radio" name="period" value="monthly" checked /> Monthly</label>
      <label><input type="radio" name="period" value="yearly" /> Yearly</label>
    </segmented-elemental>
  </fieldset>
  <button>Save</button>
</form>
```

```javascript
new FormData(form).get('period'); // 'monthly' | 'yearly'
form.querySelector('input[name="period"]:checked').value; // the same, live
```

A group with nothing checked submits nothing at all, and draws no knob — see below.

## Degrading

The element is a knob and a count; everything under it works without it.

| Missing                       | What you get                                                     |
| ----------------------------- | ----------------------------------------------------------------- |
| The script never loads        | A radio group with no knob. The selected segment still takes its colour, because that is `label:has(> input:checked)` in CSS |
| The theme is not imported     | An unstyled but correctly laid out row, with a focus ring — the ring is in `style.scss`, not the theme |
| Nothing is `checked`          | No knob, rather than a knob on the first segment claiming a choice nobody made |

That last one is why the knob hangs off `data-index` rather than off the custom property:
CSS cannot ask whether a custom property was set, and an unset one inside `calc()` leaves
the knob at zero.

The one thing to watch is contrast: a selected label coloured to read against a filled
knob — white on purple, say — sits on the bare track in the row above, where there is no
knob to read against. Pick a `--segmented-elemental-color-selected` that is legible on
the track too, or carry the colour on the track instead of the knob.

## The look

`style.scss` is structure only; `theme.scss` is the look and is optional — a light-DOM
element cannot scope a look away from a page that did not ask for one. It is a track with
a sliding knob, mixed out of `currentcolor`, so it sits in whatever palette the page has:

| Property                              | Default                    | Description                             |
| ------------------------------------- | -------------------------- | --------------------------------------- |
| `--segmented-elemental-gap`           | `3px`                      | Between the knob and the inside of the track |
| `--segmented-elemental-radius`        | `999px`                    | Track corners. A big number is a pill at any height |
| `--segmented-elemental-border-width`  | `1px`                      | Track border                            |
| `--segmented-elemental-border-color`  | `transparent`              | Track border                            |
| `--segmented-elemental-track`         | `currentcolor` at 10%      | Track fill, behind every segment        |
| `--segmented-elemental-knob`          | `Canvas`                   | Knob fill                               |
| `--segmented-elemental-knob-radius`   | the track's                | Knob corners                            |
| `--segmented-elemental-color`         | `currentcolor`             | Label colour, unselected                |
| `--segmented-elemental-color-selected`| `currentcolor`             | Label colour, selected                  |
| `--segmented-elemental-padding-block` | `0.375rem`                 | Segment padding — this sets the height  |
| `--segmented-elemental-padding-inline`| `0.875rem`                 | Segment padding                         |
| `--segmented-elemental-duration`      | `250ms`                    | Knob slide and colour cross-fade        |
| `--segmented-elemental-easing`        | `ease-in-out`              | Knob slide and colour cross-fade        |

That is the table above, live. Turn the knobs in the **Options** tab until it looks the
way you want, then copy the rule out of the bottom of the panel:

<!-- demo segmented tab="options" style="--code-preview-options-height:468px" -->

```html
<segmented-elemental aria-label="Turn me in the Options tab">
  <label><input type="radio" name="knobs" value="1" checked /> One</label>
  <label><input type="radio" name="knobs" value="2" /> Two</label>
  <label><input type="radio" name="knobs" value="3" /> Three</label>
</segmented-elemental>
```

Two properties are not in the panel, and deliberately: `--segmented-elemental-index` and
`--segmented-elemental-count` are the state the element writes, not knobs to turn — set
one by hand and the knob leaves the segment the reader actually chose.

### Colouring the selection

The label sits **on top of** the knob, so the two colours are chosen together. Which one
carries the colour is the whole of the choice:

<!-- demo segmented style="--code-preview-height:77px" -->

```html
<segmented-elemental aria-label="Coloured knob" class="knob">
  <label><input type="radio" name="a" value="1" checked /> One</label>
  <label><input type="radio" name="a" value="2" /> Two</label>
</segmented-elemental>

<segmented-elemental aria-label="Coloured track" class="track">
  <label><input type="radio" name="b" value="1" checked /> One</label>
  <label><input type="radio" name="b" value="2" /> Two</label>
</segmented-elemental>

<style>
  /* the knob carries it: a filled knob, and a label that contrasts with the fill */
  .knob {
    --segmented-elemental-knob: #7c5cff;
    --segmented-elemental-color-selected: white;
  }

  /* the track carries it: a pale knob, and the label is the thing that changes colour */
  .track {
    --segmented-elemental-track: color-mix(in srgb, #7c5cff 18%, transparent);
    --segmented-elemental-knob: Canvas;
    --segmented-elemental-color-selected: #7c5cff;
  }
</style>
```

Square it off with the two radii, which want to stay concentric — the knob's inner
corner plus the gap is the track's:

```css
segmented-elemental {
  --segmented-elemental-radius: 0.5rem;
  --segmented-elemental-knob-radius: 0.25rem;
}
```

`prefers-reduced-motion: reduce` switches the slide off. Under `forced-colors` the knob
is repainted `Highlight` and the label on it `HighlightText`, because that is the one
pair the mode guarantees contrasts. A disabled segment is the same segment at
`opacity: 0.5` with a `not-allowed` cursor:

<!-- demo segmented style="--code-preview-height:77px" -->

```html
<segmented-elemental aria-label="Quality">
  <label><input type="radio" name="q" value="low" checked /> Low</label>
  <label><input type="radio" name="q" value="high" /> High</label>
  <label><input type="radio" name="q" value="lossless" disabled /> Lossless</label>
</segmented-elemental>
```

> [!NOTE]
> The properties go **on the `<segmented-elemental>`** — a class on it,
> `.card segmented-elemental`, or the element itself. The theme sets its defaults on the
> element, and a property set on an element always beats one inherited from an ancestor,
> so `.toolbar { --segmented-elemental-knob: … }` silently does nothing.

> [!NOTE]
> `--segmented-elemental-knob` defaults to `Canvas`, the page's own background, because
> that is what a knob lifted out of a filled track is. Re-point it on a card
> (`--segmented-elemental-knob: var(--card-background)`), and on a page that themes in
> custom properties **without declaring `color-scheme`** — there `Canvas` stays white in
> dark mode and the knob becomes a white slab.

## Layout

`<segmented-elemental>` is an `inline-grid` of equal columns: every segment is one track
wide whatever its text, so the row does not reflow as the selection moves, and the knob is
exactly one track. Give it `display: grid` and a width of your own to stretch it across a
toolbar. Equal tracks are the trade: a segment whose label is much longer than the rest
sets the width for all of them.

## Segmented control, tabs, or a switch?

| Wanted                                                    | Element                      |
| --------------------------------------------------------- | ---------------------------- |
| One choice out of two or a few, and it applies at once    | this                         |
| One choice out of two, on or off                          | [`<switch-elemental>`](switch.html) |
| One choice that swaps a panel of content below it         | [`<tabs-elemental>`](tabs.html) |
| More options than fit on one row, or a list of them       | `<select>`, or a plain radio list |

Tabs and this one look alike and promise different things: tabs own a panel and are
navigation within a page, a segmented control is a form control that happens to be
horizontal. If the thing it changes is a region of content with its own heading, it is
tabs.

<script src="{{ relativePathPrefix }}dist/elementals/segmented.js"></script>
