---
layout: poops-docs-theme/docs
title: Tabs
description: One panel at a time out of a set of them — the APG Tabs pattern, horizontal or vertical, written on a list of in-page links.
order: 14
---

# `<tabs-elemental>`

A list of tabs and the panels they show, per the
[APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), in both orientations.
Light DOM, no shadow root, nothing you wrote is moved or wrapped.

<tabs-elemental class="demo-tabs">
  <ul>
    <li><a href="#tabs-demo-install">Install</a></li>
    <li><a href="#tabs-demo-usage">Usage</a></li>
    <li><a href="#tabs-demo-support">Support</a></li>
  </ul>
  <div id="tabs-demo-install">
    <p>Arrow keys move along the strip and the panel follows. <kbd>Home</kbd> and <kbd>End</kbd> go to the ends, <kbd>Tab</kbd> leaves the strip for the panel.</p>
  </div>
  <div id="tabs-demo-usage">
    <p>The tabs are ordinary in-page links. Turn scripting off and this is a list of three links and three visible sections — every word of it still readable, which is why the panels are not authored <code>hidden</code>.</p>
  </div>
  <div id="tabs-demo-support">
    <p>Search this page for a word that is only in another panel — the browser finds it and this tab set switches to the panel holding it.</p>
  </div>
</tabs-elemental>

<!-- demo tabs style="--code-preview-height:115px" -->

```html
<tabs-elemental>
  <ul>
    <li><a href="#install">Install</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#support">Support</a></li>
  </ul>
  <div id="install">One npm install.</div>
  <div id="usage">Import it and write the markup.</div>
  <div id="support">Every browser with custom elements.</div>
</tabs-elemental>
```

That markup is the page you would have had anyway: a list of links, and the sections they
point at. With scripting off the links jump and every panel is on screen — nothing hides
without something to show it again. With scripting on, the stylesheet paints only the
first panel while the element is not yet defined — and the theme paints the waiting list
as the strip it is about to become — so the stack of sections does not flash and fold
into a tab set on the first frame, and nothing under it reflows; a `#fragment` deep link still shows the first
panel for that beat, until the element reads the hash. The gate's line is worth knowing:
a bundle that never arrives *while scripting is on* — blocked, 404 — leaves one panel
showing and links pointing at panels that stay hidden. The fallback covers scripting
turned off, not every way a script can fail to run.

## Usage

```javascript
import 'book-of-elementals/tabs';
```

```scss
@use "book-of-elementals/tabs/style.scss"; // structure
@use "book-of-elementals/tabs/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/tabs.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/tabs.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/tabs-theme.min.css"
/>
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

### The markup it expects

- **The tablist** is the first `<ul>` or `<menu>` in the element. Each tab is an `<a>` or a
  `<button>` inside its own `<li>`.
- **The panels** are the element's other children, one per tab and in the same order.

Which panel belongs to which tab is read in three steps, first one that answers:

| On the tab                | Pairs with                                     |
| ------------------------- | ---------------------------------------------- |
| `href="#usage"`           | `#usage`, wherever it is in the document       |
| `aria-controls="usage"`   | the same, for a tab that is a `<button>`       |
| neither                   | the child in the same position                 |

The fragment is the one worth writing. It is a working link before the element exists, and
it states the pairing once instead of in an `id` and an `aria-controls` that can drift
apart. A `<button>` needs `aria-controls` to say the same thing — or nothing at all, and
then position is the pairing:

```html
<tabs-elemental>
  <ul>
    <li><button>First</button></li>
    <li><button>Second</button></li>
  </ul>
  <section>…</section>
  <section>…</section>
</tabs-elemental>
```

Position counts every child that is not the tablist, so it holds only while the panels are
the element's only other children — slip a heading in between and it takes the first tab's
place, shifting every pairing after it. If the element has to hold anything else, name the
pairing with a fragment or `aria-controls` and position stops mattering.

## API

### Attributes

| Attribute  | Type    | Default | Description                                                                    |
| ---------- | ------- | ------- | ------------------------------------------------------------------------------ |
| `selected` | number  | `0`     | Index of the selected tab. Reflected — markup, script and CSS read the same thing. |
| `vertical` | boolean | `false` | The strip runs down the page. The arrow keys go with it.                       |
| `manual`   | boolean | `false` | Arrows move focus without selecting; <kbd>Enter</kbd> or <kbd>Space</kbd> selects. |
| `sliding`  | boolean | `false` | Mark the selection with a bar that travels to the tab rather than a border on it. [What it costs](#a-bar-that-slides). |

Anything `selected` cannot be read as an index in range — a typo, an index left behind by
a tab that has since been removed — is the first tab. A tab set with nothing selected is
not a state this pattern has.

### Properties

| Property           | Type              | Description                                                     |
| ------------------ | ----------------- | --------------------------------------------------------------- |
| `selected`         | number            | Get/set the index. Writes the attribute.                        |
| `vertical`         | boolean           | Get/set.                                                        |
| `manual`           | boolean           | Get/set.                                                        |
| `sliding`          | boolean           | Get/set. Turning it off takes the measuring with it.            |
| `tabs`             | `Element[]`       | Read-only, in order.                                            |
| `panels`           | `Element[]`       | Read-only, in tab order. A tab with nothing to show is `null`.  |
| `tablist`          | `Element`         | Read-only.                                                      |
| `panelOf(tab)`     | `Element \| null` | What one tab shows.                                             |
| `wire()`           | —                 | Re-read the markup, [see below](#tabs-that-change).             |

### Events

`tabs-select` fires on every change — click, arrow key, script, deep link or find-in-page —
and bubbles:

```javascript
const tabs = document.querySelector('tabs-elemental');

tabs.addEventListener('tabs-select', (e) => {
  e.detail.index; // 2
  e.detail.tab; // the <a> or <button>
  e.detail.panel; // what it shows
});

tabs.selected = 2; // also fires it
```

### What it writes

| Element      | Attributes                                                              |
| ------------ | ----------------------------------------------------------------------- |
| the list     | `role="tablist"`, `aria-orientation="vertical"` when vertical, `data-tabs-list` |
| each `<li>`  | `role="none"`                                                           |
| each tab     | `role="tab"`, `aria-selected`, `aria-controls`, `tabindex`, an `id` if it had none |
| each panel   | `role="tabpanel"`, `aria-labelledby`, `hidden` when not selected, `data-tabs-panel`, an `id` if it had none |
| the element  | only under `sliding`: `data-tabs-sliding`, and `--tabs-elemental-tab-start` / `--tabs-elemental-tab-size` |

`role="none"` on the `<li>`s because inside a tablist the list semantics are noise — a
screen reader counting list items in a tab strip is counting the wrong thing, and the
tablist already says how many tabs there are.

The panel gets `tabindex="0"` only while it is showing, and only when there is nothing
focusable inside it. That is the APG's answer to a panel a keyboard can neither reach nor
scroll, and it is only for that case: a panel full of links has enough tab stops already,
and a hidden panel is a box with nothing in it to stop on.

### Keyboard

| Key                                                     | Action                                    |
| ------------------------------------------------------- | ----------------------------------------- |
| <kbd>Tab</kbd>                                          | Into the strip, then out of it to the panel |
| <kbd>←</kbd> <kbd>→</kbd>, or <kbd>↑</kbd> <kbd>↓</kbd> when `vertical` | Previous / next tab, wrapping at the ends |
| <kbd>Home</kbd> / <kbd>End</kbd>                        | First / last tab                          |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                     | Select the focused tab — the point of `manual` |

The strip is **one** stop on the way through the page, not one per tab: the selected tab is
the only one <kbd>Tab</kbd> can land on and the arrows do the rest. That is the roving tabindex, and
it is what makes a set of twelve tabs something a keyboard visitor can get past.

Keys off the strip's own axis are left alone. <kbd>↓</kbd> on a horizontal strip is the
page scrolling, and taking that key would be taking it from a reader who is done with the
tabs.

## Vertical

One attribute. It writes `aria-orientation="vertical"`, swaps the arrow keys onto the other
axis, and puts the strip beside the panels instead of above them:

<tabs-elemental class="demo-tabs" vertical>
  <ul>
    <li><a href="#tabs-vertical-general">General</a></li>
    <li><a href="#tabs-vertical-profile">Profile</a></li>
    <li><a href="#tabs-vertical-billing">Billing</a></li>
  </ul>
  <div id="tabs-vertical-general">
    <p>A settings screen is where a vertical strip earns its keep: the labels are words rather than icons, there are more of them than fit across a column of text, and they read as a list of places rather than as a row of steps.</p>
  </div>
  <div id="tabs-vertical-profile">
    <p><kbd>↑</kbd> and <kbd>↓</kbd> move here — <kbd>←</kbd> and <kbd>→</kbd> do nothing, because a vertical tablist does not answer to them.</p>
  </div>
  <div id="tabs-vertical-billing">
    <p>The layout is a two-column grid on the element itself. The strip's width is its labels', and the panels take the rest.</p>
  </div>
</tabs-elemental>

```html
<tabs-elemental vertical>
  …
</tabs-elemental>
```

There is no `vertical-when` the way [`<splitter-elemental>`](splitter.html) has one — the
orientation is a keyboard contract as much as a layout, and a tab list that changed which
arrow key walks it as the window resized is a contract moving under the reader's hands. One
line does it where you want it anyway, and the element re-wires itself when the property
changes:

```javascript
const wide = matchMedia('(min-width: 60rem)');
const sync = () => (tabs.vertical = wide.matches);
wide.addEventListener('change', sync);
sync();
```

## Automatic or manual

By default the selection follows the focus: arrow onto a tab and its panel is showing. That
is what the APG asks for wherever showing a panel costs nothing, which it does when the
panel is already in the page.

`manual` is for the case where it does not. Arrows then move focus only, and
<kbd>Enter</kbd> or <kbd>Space</kbd> selects:

<tabs-elemental class="demo-tabs" manual>
  <ul>
    <li><a href="#tabs-manual-one">Last month</a></li>
    <li><a href="#tabs-manual-two">Last quarter</a></li>
    <li><a href="#tabs-manual-three">Last year</a></li>
  </ul>
  <div id="tabs-manual-one">
    <p>Arrow along this strip with the keyboard: focus moves, the panel does not, until you press <kbd>Enter</kbd>.</p>
  </div>
  <div id="tabs-manual-two">
    <p>Which is the whole reason to want it — arrowing past four tabs whose panels each fetch a report would start four requests nobody asked for.</p>
  </div>
  <div id="tabs-manual-three">
    <p>If the panels are already on the page, leave it off. Automatic is fewer keystrokes for the same result.</p>
  </div>
</tabs-elemental>

```html
<tabs-elemental manual>…</tabs-elemental>
```

## Tabs that change

Nothing watches the markup. Add a tab, remove one, rename them, and `wire()` is the one
call that says so:

```javascript
tabs.querySelector('ul').insertAdjacentHTML(
  'beforeend',
  '<li><a href="#reports">Reports</a></li>',
);
tabs.insertAdjacentHTML('beforeend', '<div id="reports">…</div>');
tabs.wire();
```

It re-reads everything and is safe to call as often as you like. A panel whose tab has gone
is handed back to the page as it was found — nothing left `hidden` by an element that no
longer has anything to show it with. Under [`sliding`](#a-bar-that-slides) it is also what
puts a tab that has just appeared under the observer.

That is a line on the pages that build their tabs, instead of a `MutationObserver` running
on every page that never touches them.

## Deep links and find-in-page

A URL fragment pointing at a panel — or at anything inside one — selects that tab, on load
and on every `hashchange`. Which is also the no-script story arriving: the tabs are in-page
links, and following one before the bundle lands leaves exactly that fragment in the URL.

The panels nobody is looking at are hidden with `hidden="until-found"`, so find-in-page
still searches them. Finding a word in one reveals it, and the element takes that as the
instruction to select its tab — search this page for a word that only appears in a panel
that is not showing.

> [!NOTE]
> `until-found` hides with `content-visibility`, which skips a box's contents and keeps the
> box. The element's stylesheet strips that retained box back — no padding, no border, no
> background, no pointer events — because all the panels share one grid cell and three
> retained boxes over the one being read would paint across it and take its clicks. If you
> style panels yourself, style `[data-tabs-panel]` and let that rule undo it when hidden.
>
> The box is retained in the accessibility tree too, so a screen reader meets the panels
> that are not showing as empty ones. That is the price of the text inside them staying
> searchable, and it is the same trade [`<disclosure-elemental>`](disclosure.html) makes.
> One rule buys out of both halves of it, at the cost of find-in-page:
>
> ```css
> tabs-elemental > [data-tabs-panel][hidden] {
>   display: none;
> }
> ```

## The look

`style.scss` is structure only; `theme.scss` is the look and is optional — a light-DOM
element cannot scope a look away from a page that did not ask for one. It is a strip with a
rule under it and the selected tab marked on that rule, mixed out of `currentcolor` so it
sits in whatever palette the page has:

| Property                           | Default                | Description                                     |
| ---------------------------------- | ---------------------- | ----------------------------------------------- |
| `--tabs-elemental-gap`             | `0.25rem`              | Between the tabs                                |
| `--tabs-elemental-inset`           | `0.5rem 0.75rem`       | Padding inside a tab                            |
| `--tabs-elemental-panel-inset`     | `1rem`                 | Between the strip and the panel                 |
| `--tabs-elemental-radius`          | `0.375rem`             | Corner radius of a tab                          |
| `--tabs-elemental-indicator-size`  | `2px`                  | Thickness of the rule, and of the selected mark |
| `--tabs-elemental-indicator`       | `currentcolor`         | What marks the selected tab                     |
| `--tabs-elemental-border`          | 20% of `currentcolor`  | The rule the tabs sit on                        |
| `--tabs-elemental-hover`           | 10% of `currentcolor`  | Tab background under the pointer                |
| `--tabs-elemental-muted`           | 65% of `currentcolor`  | Text of a tab that is not selected              |
| `--tabs-elemental-duration`        | `250ms`                | Travel of the `sliding` bar. Nothing else moves |
| `--tabs-elemental-easing`          | `ease-in-out`          | Travel of the `sliding` bar                     |

Turn them in the **Options** tab and copy the rule out of the bottom of the panel — the same
table, with the values live:

<!-- demo tabs tab="options" style="--code-preview-options-height:611px" -->

```html
<tabs-elemental>
  <ul>
    <li><a href="#one">Gap</a></li>
    <li><a href="#two">Inset</a></li>
    <li><a href="#three">Indicator</a></li>
  </ul>
  <div id="one">Between the tabs.</div>
  <div id="two">Padding inside one.</div>
  <div id="three">What marks the selected one.</div>
</tabs-elemental>
```

The selected tab is marked with a border, and a border needs no script and can never
disagree with where the tab actually is. That is the default because it is free.
[`sliding`](#a-bar-that-slides) buys the other one, and the price is on the label.

The mark is the strip's own rule filled in: the tab is pulled down over it by exactly the
rule's thickness, so the two are one line rather than two stacked ones. Which is why the
strip wraps instead of scrolling — a scroll container clips at its padding box, and that is
where the mark is drawn.

Under `forced-colors` the mark is repainted in `Highlight`, since it is the only thing
telling the selected tab apart. Nothing in the theme moves except the `sliding` bar, and
`prefers-reduced-motion: reduce` stops that one.

### A bar that slides

`sliding` marks the selection with a bar that travels to the tab instead of a border sitting
on it. It is an attribute rather than a stylesheet because it cannot be drawn from CSS alone:
tabs are as wide as their labels, so something has to measure the selected one.

<!-- demo tabs style="--code-preview-height:115px" -->

```html
<tabs-elemental sliding>
  <ul>
    <li><a href="#slide-day">Day</a></li>
    <li><a href="#slide-week">The last seven days</a></li>
    <li><a href="#slide-month">Month</a></li>
  </ul>
  <div id="slide-day">Yesterday and today.</div>
  <div id="slide-week">Seven of them.</div>
  <div id="slide-month">Since the first.</div>
</tabs-elemental>
```

The element measures the selected tab against the strip and writes two numbers onto itself —
`--tabs-elemental-tab-start`, how far along the strip the tab begins, and
`--tabs-elemental-tab-size`, how much of it the tab takes. Both are logical: `start` is
measured from the edge the strip *starts* at, which is the right one in RTL, and a `vertical`
strip is measured down it instead. The theme draws one `::after` on the strip from them, in
the same border band the border mark was in — so the two marks are the same line, and
swapping one for the other moves nothing else on the page. `--tabs-elemental-duration` and
`--tabs-elemental-easing` are the travel, and `prefers-reduced-motion: reduce` switches it off.

Which is all it takes for [`vertical`](#vertical) to be the same feature turned a quarter
turn — the bar travels down the strip's own rule, and the arrow keys that move it are
<kbd>↑</kbd> and <kbd>↓</kbd>:

<!-- demo tabs style="--code-preview-height:161px" -->

```html
<tabs-elemental sliding vertical>
  <ul>
    <li><a href="#slide-general">General</a></li>
    <li><a href="#slide-profile">Profile and photo</a></li>
    <li><a href="#slide-billing">Billing</a></li>
  </ul>
  <div id="slide-general">Language, time zone, and what the week starts on.</div>
  <div id="slide-profile">The name and the face other people see.</div>
  <div id="slide-billing">The card on file, and what it was last charged.</div>
</tabs-elemental>
```

**It re-measures whenever the strip or any tab in it changes size** — a webfont landing, a
label translated, a tab added, the strip wrapping. Watching the strip alone is the bug every
measured indicator in the field ships with: a label that grows leaves the container exactly
the size it was, so nothing fires and the bar stays under where the tab used to be. It is
[open against Base UI](https://github.com/mui/base-ui/issues/4156) as this is written, and
MUI has had the same family of it for years — [measured before the webfont
lands](https://github.com/mui/material-ui/issues/7187), [the container resized rather than
the window](https://github.com/mui/material-ui/issues/9337), [a scrollbar appearing
later](https://github.com/mui/material-ui/issues/13263), [the number of tabs
changing](https://github.com/mui/material-ui/issues/8379). Watching every tab is what answers
all four at once, which is what `<marquee-elemental>` does with its track for the same reason.

What it costs, honestly:

| | Border, the default | `sliding` |
| --- | --- | --- |
| Script | none | a `ResizeObserver` on the strip and every tab, and two rects per change |
| When the bundle never arrives | the mark is still there | no mark travels; the border stays |
| Forced colors | `Highlight` on the border | the bar is dropped, the border comes back |
| A label that changes length | nothing to do | re-measured, without `wire()` — the tab resized, so the observer fired |

The second row is the one to read twice. The theme keys the bar on `data-tabs-sliding`, which
the element writes only once it has measured — never on `[sliding]`, which is only the page
asking. No script, or a browser with no `ResizeObserver`, leaves the attribute standing with
no numbers behind it, and the selected tab keeps its border. A page that took the border off
on the strength of the attribute alone would be a tab set with nothing marking the selection.

> [!NOTE]
> The two numbers are measured rect to rect, with no border taken off. The theme puts a border
> on the strip's block-end when it is horizontal and on its inline-end when it is vertical, and
> neither is on the edge being measured from — but a page that borders the strip's *other*
> edges moves the bar by that much.

### Styling hooks

```css
tabs-elemental[selected="1"] {
} /* the host, reflected state */
tabs-elemental[data-tabs-sliding] > [data-tabs-list]::after {
} /* the sliding bar, once it has been measured */
tabs-elemental > [data-tabs-list] {
} /* the strip */
tabs-elemental > [data-tabs-list] > li > [aria-selected="true"] {
} /* the current tab */
tabs-elemental > [data-tabs-panel] {
} /* every panel */
tabs-elemental > [data-tabs-panel][hidden] {
} /* the ones not showing */
tabs-elemental:not(:defined) {
} /* before upgrade */
```

> [!NOTE]
> These go **on the `<tabs-elemental>`** — a class on it, `.settings tabs-elemental`, or the
> element itself. The theme sets its defaults on the element, and a property set on an
> element always beats one inherited from an ancestor, so
> `.settings { --tabs-elemental-indicator: … }` silently does nothing.

## Layout

The element is a `grid`, and every panel is in the same cell. That is the one layout it
insists on, because the pattern does not work without it: panels laid out one after another
mean a page that jumps by the height of the last panel every time you change tabs, and
nothing in the markup says what that height was going to be.

```
horizontal          vertical
┌──────────────┐    ┌───────┬──────────┐
│ strip        │    │ strip │ panels   │
├──────────────┤    │       │          │
│ panels       │    │       │          │
└──────────────┘    └───────┴──────────┘
```

Both are two lines of `grid-template-*` and two `grid-area`s, so a page that wants the strip
somewhere else can say so in its own stylesheet. A panel that lives outside the element —
paired by `aria-controls` or by a fragment — is shown and hidden exactly the same way and
laid out by whatever it is inside; the grid is only about the children.

## Tabs, accordion, or neither

Tabs hide most of what is on the page behind labels that have to be read as a set. That is
worth it when the panels are **alternatives** — a settings screen, one report per period,
the same object seen four ways — and a bad trade otherwise:

| Wanted                                  | Reach for                                                            |
| --------------------------------------- | -------------------------------------------------------------------- |
| Alternatives, one at a time             | `<tabs-elemental>`                                                   |
| Sections a reader may want open at once | [`<accordion-elemental>`](accordion.html), over native `<details>`   |
| One thing shown and hidden              | [`<disclosure-elemental>`](disclosure.html)                          |
| Steps in an order                       | Neither — a sequence with a **Next** button is not a tab set         |
| Content that should print, or be found  | Neither. Put it on the page                                          |

The last row is the one people regret. Tabs are the cheapest way to make a long page look
short and the most reliable way to make sure nobody reads two of the panels — find-in-page
still works here, but printing gets you one panel and a search engine gets you the markup
without the reader.

<script src="{{ relativePathPrefix }}dist/elementals/tabs.js"></script>
