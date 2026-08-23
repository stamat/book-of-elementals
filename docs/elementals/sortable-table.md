---
layout: poops-docs-theme/docs
title: Sortable table
description: A table whose column headers sort it — the button, the aria-sort and the caption note, over the table you already wrote.
order: 25
navGroup: No APG pattern
---

# `<sortable-table-elemental>`

Wrap a `<table>` and its column headers sort it. You write the table; it writes the buttons.

There is no APG pattern here, because **`<table>` already is one** — the roles, the row and column
relationships and the header associations are the element's own and nothing here replaces any of
them. What is missing is the one thing the markup has no way to say, and the
[APG's sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)
says exactly what it is: the header text wrapped in a `<button>`, `aria-sort` on the column that
is sorted, and a note in the `<caption>` explaining the buttons — once, rather than repeated into
every button's name.

<!-- demo sortable-table style="--code-preview-height:255px" -->

```html
<sortable-table-elemental>
  <table>
    <caption>Peaks</caption>
    <thead>
      <tr>
        <th>Name</th>
        <th>Height</th>
        <th>First climbed</th>
        <th data-sort="none">Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr><th scope="row">Midžor</th><td>2169</td><td data-sort-value="1890-07-02">2 Jul 1890</td><td>on the border</td></tr>
      <tr><th scope="row">Đeravica</th><td>2656</td><td data-sort-value="1902-08-14">14 Aug 1902</td><td>the highest</td></tr>
      <tr><th scope="row">Rtanj</th><td>1560</td><td data-sort-value="1877-05-30">30 May 1877</td><td>a pyramid</td></tr>
      <tr><th scope="row">Kopaonik</th><td>2017</td><td data-sort-value="1884-06-11">11 Jun 1884</td><td>skiing</td></tr>
    </tbody>
  </table>
</sortable-table-elemental>
```

```css demo
/* every line of this is the page's — the element styles no table */
table { border-collapse: collapse; inline-size: 100%; }
caption { margin-block-end: 0.5rem; font-weight: 600; text-align: start; }
th, td { padding: 0.4rem 0.6rem; text-align: start; border-block-end: 1px solid color-mix(in srgb, CanvasText 20%, transparent); }
thead th { border-block-end-width: 2px; }
tbody th { font-weight: 400; }
```

_Press **Height** and the rows sort as numbers, not as text. Press **First climbed** and they sort
by the ISO dates in `data-sort-value`, not by the words you can see. Press the same header twice
and it turns round. **Notes** is marked `data-sort="none"` and has no button. Sort by name, then
by height: inside one height the names are still in order._

## The markup

A table. That is the whole of it:

```html
<sortable-table-elemental>
  <table>
    <thead><tr><th>Name</th><th>Height</th></tr></thead>
    <tbody>…</tbody>
  </table>
</sortable-table-elemental>
```

- **Every `<th>` in the header row gets a button**, unless it is marked `data-sort="none"` — for
  a column of free text, or of buttons, where sorting means nothing.
- **`data-sort-value` on a cell** is what that cell sorts by. A date reads `3 Aug 2026` and sorts
  by `2026-08-03`; a price reads `$1,200` and sorts by `1200`.
- **The header row is the last row of the `<thead>`**, so a grouped header — a row of spanning
  labels over a row of real columns — puts the buttons on the columns rather than on the groups.
- **The rows are the first `<tbody>`'s.** A table with several is using them to group, and moving
  a row between groups would be sorting the grouping away.

## What it writes

```html
<th aria-sort="ascending"><button type="button">Name</button></th>
```

and, appended to the caption, off screen:

```html
<caption>Peaks <span class="sortable-table-elemental-note">Column headers with a button sort the table by that column.</span></caption>
```

The caption is the table's accessible name, so that sentence is read on the end of it — measured
in Chromium, the name comes out as `Peaks Column headers with a button sort the table by that
column.` It is there rather than in each button's name because that is the APG example's own
reasoning: a reader walking the header row should hear the column, not the same sentence about
buttons once per column. Set `note-text` to say it in your language, or differently.

If the table has no `<caption>`, one is created holding only that note. It is clipped, so the
caption box measures zero — no visible change, and the table gains an accessible name it did not
have.

**There is no live region, and that is a decision rather than an omission.** The example this
follows has none, and the reason it needs none is that the rows reordering *is* the result of
pressing the button, not a message about it —
[WCAG 2.2 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) is written for
changes that happen when no control was operated. `aria-sort` is where the state lives, on the
column header, which is where a reader goes to find it.

There is no keyboard handling either, and for the same kind of reason: the only interactive things
here are `<button>`s, and every key they answer is the browser's.

## How it compares

One comparator, and no `type` attribute anywhere.
[`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/API/Intl/Collator) with
`numeric: true` puts `item 2` before `item 10` and `9` before `100` without being told which
column is which, sorts an ISO date correctly as text, and collates letters by the document's own
`lang` rather than by code point — so `Đeravica` lands under D in a Serbian page and where that
page's language says otherwise elsewhere. It is built per sort and pointed at
`document.documentElement.lang`, so a page that swaps its language swaps its collation with it.

What one comparator cannot do is a value that is not what it reads as:

| The cell reads | Sorted by its text | With `data-sort-value` |
| --- | --- | --- |
| `$1,200` vs `$900` | `$1` against `$9` — the larger first, ascending | `1200` and `900` |
| `3 Aug 2026` | the word `3` | `2026-08-03` |
| `n/a` in a numeric column | among the numbers, by the letter n | `""`, gathered at one end |

`data-sort-value=""` is an author saying this cell sorts as empty, and it is honoured — the one
place where an empty attribute has to mean something rather than nothing.

**Sorting is stable, and that is the property nobody notices until it is missing.** Rows with
equal keys never move, so sorting by name and then by height leaves the names in order inside each
height. `Array.prototype.sort` has been required to be stable since ES2019, but that only covers
one sort in one direction — the descending case reverses the comparator, and reversing it whole
would reverse equal rows too. The original position is carried into the tiebreak instead.

## A table that arrived sorted

**The markup's `aria-sort` is believed rather than re-sorted.** Write it on the header the server
sorted by, and the element adopts the state and leaves the rows exactly as they came:

```html
<th aria-sort="descending">Height</th>
```

A table that arrives ordered was ordered by the server, possibly by a key that is not in the DOM
at all — an id, a rank, a relevance score. An element that re-sorted it on upgrade would silently
reorder correct data into the order the *visible* text happens to give. `data-sort-value` is how
you make the two agree when you want them to.

## Events

| Event | When | `detail` |
| --- | --- | --- |
| `sortable-table-sort` | a header button was pressed and the rows moved | `column` — the header's index in its row, `key` — its text, `direction` — `ascending` or `descending` |

Not fired for the `aria-sort` adopted at upgrade, which is state the page wrote itself.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `note-text` | string | `Column headers with a button sort the table by that column.` | The sentence appended to the caption |

On the cells, not on the element:

| Attribute | On | What it does |
| --- | --- | --- |
| `data-sort="none"` | a header `<th>` | No button. The column keeps its text and does not sort |
| `data-sort-value` | any body cell | What that cell sorts by, instead of its text |
| `aria-sort` | a header `<th>` | The table already arrived sorted this way. Adopted, not re-sorted |

## Without script

Your table, in the order it arrived, and no buttons — which is a table, and a working page. The
element is `display: contents`, so dropping it around a table you already had changes no layout at
all, upgraded or not; give it `display: block` in your own CSS if you want something to hang an
`overflow-x` on.

## Styling

The element styles no table. What its own stylesheet does is make the upgrade invisible: a
`<button>` inside a `<th>` arrives with the UA's font, colour, background, border and centre
alignment, and every one of them is put back to what the cell already had. That is not a look —
it is the header not starting to look like a form control because it became one — which is why it
is in the structure file and not the theme.

The button is `inline-size: 100%`, so the target is the column rather than the four words in it.
It stops at the cell's padding, because reaching into that would mean moving your padding onto
this button.

Both stylesheets reach only the buttons this element wrote — its own table, the last row of the
`<thead>`, and not a header marked `data-sort="none"`. A button of your own in a
`<th scope="row">` keeps its look and gets no arrow.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--sortable-table-elemental-indicator-color` | `currentcolor` | Theme. The arrow on the sorted column |
| `--sortable-table-elemental-hint-opacity` | `0.35` | Theme. How visible the arrow is on a column that is not the sorted one — the affordance, shown on every sortable header |

The arrow is drawn with borders rather than written as `▲`, for the reason
[`<tree-view-elemental>`](tree-view.html)'s twisty is: text in a pseudo-element is read out by some
screen readers, and `aria-sort` already says which way this column is sorted, in the reader's own
language. It is laid out inline rather than with flex so that this stylesheet has no opinion about
where your header text sits — CSS cannot read `text-align`, and every version of this that tried
to guess it got one alignment or the other wrong.

**The faint arrow is on every sortable column, not only the one under the pointer.** A control
nobody can see is a control nobody presses, and hover is not a state a reader has before they have
already guessed the feature is there — which leaves a keyboard reader finding it by tabbing in and
a touch reader not at all. It points up, which is the direction the first press sorts; full weight
is what says *this* column is the sorted one.

## What it will not do

No multi-column sort — a second sort key is a comparator the markup has nowhere to put. No
sort-on-load, no persistence, no paging, no filtering, no column resizing, no row selection; those
are a data grid, and a data grid is [the APG's Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
and a different project.

No spanning cells in the body. `rowspan` sorting would tear apart; `colspan` is quieter and worse
— the column a header sorts by is that header's position in its row, so one spanning cell shifts
every cell after it along and the column sorts by its neighbour's text, in an order that looks
like an order. The element checks for neither, and a table with either should not have this
element around it.

```scss
@use "book-of-elementals/sortable-table/style.scss";
@use "book-of-elementals/sortable-table/theme.scss"; // optional
```

```javascript
import "book-of-elementals/sortable-table";
```
