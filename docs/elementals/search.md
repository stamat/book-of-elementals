---
layout: poops-docs-theme/docs
title: Search
description: The query half of a search field — the debounce, the abort, the loading state and the announcement nobody writes.
order: 16
---

# `<search-elemental>`

[`<suggest-elemental>`](suggest.html) is the results panel and says outright that it has no
opinion about where the results came from. This is the other side of that seam: the query.
It does not fetch either — it decides *when* to ask, hands the page an `AbortSignal`, and
turns whatever comes back into a state your CSS can draw and a sentence a screen reader
hears.

There is no APG pattern here, because there is no widget. The widget is the combobox next
door. What is left is the part every search field writes again from scratch and gets subtly
wrong:

| The bug | What it looks like | What the element does |
| --- | --- | --- |
| A request per keystroke | eight requests to spell `carousel` | one, `delay` after typing stops |
| The slow answer wins | results for `car` land after results for `carousel`, and stay | a sequence number drops the stale one, and `signal` asks the page to abort it |
| Nothing said out loud | the panel fills, a screen reader user hears nothing | `role="status"`: "5 results", "No results", "Search failed" |
| A spinner that never stops | the request failed and the state was set in the `then` | states are set from both sides of the promise, `AbortError` included |

<!-- demo search suggest -->

```html
<search-elemental min="2">
  <search>
    <form action="../index.html" target="_blank">
      <label for="q">Search the book</label>
      <input type="search" id="q" name="q" autocomplete="off" placeholder="type two letters">
    </form>
  </search>

  <suggest-elemental for="q">
    <ul></ul>
  </suggest-elemental>
</search-elemental>
```

```css demo
/* no `position: relative` here: the element is the panel's containing block already, which
   is the one thing it claims about its own box. The bottom margin is what keeps the open
   panel inside this preview, and is not part of the pattern */
search-elemental { max-width: 22rem; margin-block-end: 12rem; }
search-elemental label { display: block; margin-block-end: 0.35rem; font-size: 0.875rem; }

/* the look of the control is the page's — the element styles no field, on the reasoning
   that a field is what a design system already owns */
search-elemental input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  font: inherit;
  color: CanvasText;
  background: Canvas;
  border: 1px solid color-mix(in srgb, CanvasText 30%, transparent);
  border-radius: 0.375rem;
}
search-elemental input:focus-visible { outline: 2px solid CanvasText; outline-offset: 1px; }
search-elemental suggest-elemental { margin-block-start: 0.25rem; }
small { display: block; opacity: 0.65; }
```

```js demo
// The list this page already has, which is the common case: no request, no waiting, and so
// no loading state to draw. `wait()` is never called, and the element settles the moment
// this listener returns.
const PAGES = [
  { title: "Accordion", hint: "a set of headings that open one at a time", url: "accordion.html" },
  { title: "Carousel", hint: "a scroll-snapping list of slides", url: "carousel.html" },
  { title: "Combobox", hint: "a select you can type your way down", url: "combobox.html" },
  { title: "Disclosure", hint: "a button and the thing it shows", url: "disclosure.html" },
  { title: "Menu", hint: "a menu button, nested", url: "menu.html" },
  { title: "Modal", hint: "a dialog on native dialog", url: "modal.html" },
  { title: "Suggest", hint: "the results panel this one fills", url: "suggest.html" },
  { title: "Tabs", hint: "one panel at a time, on in-page links", url: "tabs.html" }
];

const list = document.querySelector("suggest-elemental ul");

// Escaped where it is interpolated, once, because a title with a quote in it would
// otherwise close the attribute it sits in.
const escapeText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

document.querySelector("search-elemental").addEventListener("search-query", (event) => {
  const query = event.detail.query.toLowerCase();
  const hits = PAGES.filter((page) => (page.title + " " + page.hint).toLowerCase().includes(query));
  list.innerHTML = hits.map((page) =>
    `<li><a href="${escapeText(page.url)}" target="_blank">${escapeText(page.title)}<small>${escapeText(page.hint)}</small></a></li>`
  ).join("");
});
```

_Type `ta`, then delete a letter. The panel opens itself when there is something in it and
closes when there is not — that is the element, not the sample. Press <kbd>Enter</kbd> with
no row under the cursor and the form submits, because nothing here swallowed it._

The form and the rows open in a new tab, which is this preview's need and not the element's:
a preview is a frame with no url of its own, so a submit inside it would pull the whole docs
site into a box a few hundred pixels tall. On your page they are an ordinary form and
ordinary links.

## The markup

Three things, and you have written all of them before:

```html
<search-elemental>
  <search>
    <form action="/search/">
      <label for="q">Search</label>
      <input type="search" id="q" name="q" autocomplete="off">
    </form>
  </search>

  <suggest-elemental for="q"><ul></ul></suggest-elemental>
</search-elemental>
```

- **The `<form>` is the degradation.** With no script, or before it arrives, <kbd>Enter</kbd>
  submits to `action` and the reader gets a search page. That is also what <kbd>Enter</kbd>
  does *with* the script when no row is under the cursor, so the fast path never stops
  working.
- **`<search>` is the landmark**, [Baseline since October
  2023](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search) and
  worth exactly one line: it is `role="search"` without the attribute. It is optional here
  and the element neither writes nor requires it.
- **The panel is `<suggest-elemental>`**, which owns the listbox, the cursor, the arrow keys
  and <kbd>Escape</kbd>. Everything on [its page](suggest.html) applies unchanged.

The element takes **the first `<input>` inside it** and listens to that. No `for`: it is
already wrapping the field, and an attribute naming what is one query away is an attribute
to keep in step for nothing.

## What it does with what you type

Each keystroke is one of three answers, and the trimmed value is what all three are measured
against — trailing whitespace is not a new query:

| What is in the field | What happens |
| --- | --- |
| fewer than `min` characters | in-flight query aborted, panel closed, state back to `idle` |
| the same query already answered | nothing at all — the answer is on screen |
| anything else | `delay` later, `search-query` fires |

The abort and the sequence number are two answers to one bug, and both are needed. `signal`
lets the page cancel a request that no longer matters; the sequence number means it does not
matter whether it did — an answer that settles after a newer query has gone out is dropped
where it lands, so a `fetch` that ignores the signal, a cache, or a promise that is not a
request at all cannot put stale results on screen.

## A search API, and the loading state

Hand the element the promise and it has something to wait for. That is the whole of the
loading state: `wait()` called, `data-state="pending"`, `aria-busy` on the panel, and the
theme's spinner until the promise settles either way.

<!-- demo search suggest -->

```html
<search-elemental min="2" delay="300" error-label="npm is not answering">
  <search>
    <form action="https://www.npmjs.com/search" target="_blank">
      <label for="pkg">Search npm</label>
      <input type="search" id="pkg" name="q" autocomplete="off" placeholder="try: elemental">
    </form>
  </search>

  <suggest-elemental for="pkg">
    <ul></ul>
  </suggest-elemental>
</search-elemental>
```

```css demo
/* room for the whole panel: eight rows with a description each fill the 20rem the panel
   scrolls at, which is taller than the previous sample needs — a margin and not padding,
   because this box is the panel's containing block and padding would push it down too */
search-elemental { max-width: 26rem; margin-block-end: 22rem; }
search-elemental label { display: block; margin-block-end: 0.35rem; font-size: 0.875rem; }
search-elemental input {
  width: 100%;
  box-sizing: border-box;
  /* room at the end for the spinner, which is drawn over the field and not inside it */
  padding: 0.5rem 2.25rem 0.5rem 0.75rem;
  font: inherit;
  color: CanvasText;
  background: Canvas;
  border: 1px solid color-mix(in srgb, CanvasText 30%, transparent);
  border-radius: 0.375rem;
}
search-elemental input:focus-visible { outline: 2px solid CanvasText; outline-offset: 1px; }
search-elemental suggest-elemental { margin-block-start: 0.25rem; }
small { display: block; opacity: 0.65; }
```

```js demo
// The npm registry's own search endpoint, which sends `access-control-allow-origin: *` and
// wants no key: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
const API = "https://registry.npmjs.org/-/v1/search?size=8&text=";

const panel = document.querySelector("suggest-elemental");
const list = panel.querySelector("ul");

const escapeText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

document.querySelector("search-elemental").addEventListener("search-query", (event) => {
  // `signal` goes into the fetch, so the request for the query before last is cancelled
  // rather than left running. The element drops its answer either way.
  event.detail.wait(
    fetch(API + encodeURIComponent(event.detail.query), { signal: event.detail.signal })
      .then((response) => {
        // A 500 resolves. Left unchecked it fills the panel with nothing and reports
        // "No results", which is a lie about a server that is down.
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then((data) => {
        // A package name is already a url path — `@scope/name` keeps its slash, which
        // `encodeURIComponent` would turn into `%2F` and a broken link. Escaped, not
        // encoded: what it has to survive here is the attribute it sits in.
        list.innerHTML = data.objects.map((hit) =>
          `<li><a href="https://www.npmjs.com/package/${escapeText(hit.package.name)}" target="_blank">` +
          `${escapeText(hit.package.name)}<small>${escapeText(hit.package.description || "")}</small></a></li>`
        ).join("");
      })
  );
});
```

_Type slowly and the spinner comes and goes between queries; type fast and only the last one
is answered. Turn the network off in dev tools and the field says so — the panel closes, and
`error-label` is what the live region reads out._

Three things in that listener are the seam, and each is a place the element stops:

- **The `signal` is yours to pass on.** The element makes one `AbortController` per query and
  aborts it when the next goes out. Handing it to `fetch` is what turns that into a cancelled
  request instead of a wasted one.
- **A failed response is a failure.** `fetch` resolves on a 500, so a listener that does not
  check `response.ok` hands back a fulfilled promise, and the element reports the empty panel
  honestly as "No results" — the truthful answer to the wrong question. One `throw` makes it
  `error`.
- **Escaping happens where the text is interpolated.** These rows are built as HTML, so a
  package description with a `"` in it closes the attribute it sits in unless `escapeText`
  runs first — and the same helper, not `encodeURIComponent`, for the `href`, because a
  package name is already a url path and encoding it turns `@scope/name` into a `%2F` and a
  dead link. `encodeURIComponent` is for the query going *into* a url, which is the line
  above it.

## States

`data-state` is the whole of the loading API, and there is no second way to ask:

| `data-state` | When | Panel |
| --- | --- | --- |
| `idle` | nothing searched for yet, or the field went under `min` | closed |
| `pending` | a query is out and the page called `wait()` | left as it was, `aria-busy="true"` |
| `results` | answers landed | opened |
| `empty` | the search finished with nothing in the panel | closed |
| `error` | the promise rejected | closed |

`pending` exists only when `wait()` was called. A page filtering a list it already has never
goes through it, which is right: a spinner that appears and vanishes inside one frame is a
flicker, not feedback. That is also the failure mode being avoided — a page that never calls
`wait()` is never left with a spinner nothing will stop.

The count comes from counting `<a href>` in the panel, which is the same rule
`<suggest-elemental>` counts an option by. With no panel inside it the element counts its own
links instead, leaving the form's out; results rendered somewhere else entirely are outside
what it can see, and it says nothing rather than guessing.

## The announcement

Results appearing in a panel is a change a sighted reader watches happen and a screen reader
user is told nothing about, which is [WCAG 2.2 4.1.3 Status
Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) unmet. The
element appends one `<span role="status" class="search-elemental-status">`, clipped out of
sight, and puts the result in it.

**A search still in flight announces nothing.** The spinner is for the eye; a polite region
saying "Searching…" on every keystroke is a reader listening to themselves type, and the
answer is a fraction of a second behind it anyway.

The defaults are English and handle the one plural English has — `1 result`, `5 results`,
because "1 results" is the bug this exists not to ship. Any other language sets the labels,
and `{n}` is substituted wherever it appears:

```html
<search-elemental
  results-label="Rezultata: {n}"
  empty-label="Nema rezultata"
  error-label="Pretraga nije uspela">
```

A language whose plural needs more than the two forms English has wants the attribute set
per query, from the same code that knows the count — `search.setAttribute('results-label',
plural(n))` before the promise resolves. The element takes the string; it does not own it.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `delay` | number | `200` | Milliseconds the field has to stop changing before a query goes out. |
| `min` | number | `1` | Characters needed before one goes out at all. `0` sends the empty query too — what a field cleared back to nothing sends, for a page with a "recent" or "popular" list to answer it with. |
| `results-label` | string | `5 results` | What the live region announces on a hit. `{n}` is the count, anywhere in the string. |
| `empty-label` | string | `No results` | What it announces when nothing matched. |
| `error-label` | string | `Search failed` | What it announces when the request failed. |

`search-query` fires with `detail.query`, `detail.signal` and `detail.wait(promise)`. It
bubbles, so one listener above a page of fields can serve all of them.

## Keyboard

None of its own. <kbd>↓</kbd>, <kbd>↑</kbd>, <kbd>Enter</kbd>, <kbd>Escape</kbd>,
<kbd>Home</kbd> and <kbd>End</kbd> belong to [`<suggest-elemental>`](suggest.html#keyboard),
and this element does not touch them — including the <kbd>Enter</kbd> that submits the form
when no row is under the cursor.

## Without script

A labelled search field in a form that submits. Nothing is authored `hidden` and nothing is
`disabled`, so the page a reader lands on with no JavaScript is the page they would have got
by pressing the button — which is why `action` is not optional in practice, however little
the element cares about it.

## What it will not do

No fetching, no `src`, no result-shape mapping, no ranking, no highlighting, no cache, and no
keyboard shortcut to focus the field.

The first four are one refusal: owning a wire format means owning an escaping boundary and an
opinion about someone else's API, and the listener above is shorter than the configuration
that would replace it. `⌘K` is the interesting omission — it is a *page-level* binding, and
only the page knows what else is bound and which of several fields should win. Two lines in
your own code, in the place that knows.

## Styling

The structure stylesheet claims one thing about the box: `position: relative`, so the panel
inside has a containing block and your page does not have to make one. The theme draws the
spinner and nothing else — no field, no panel, both of which belong to someone else.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--search-elemental-spinner-size` | `1rem` | Both axes of the spinner |
| `--search-elemental-spinner-inset-inline` | `0.75rem` | How far it sits from the inline end of the element |
| `--search-elemental-spinner-inset-block` | `0.75rem` | How far it sits from the block end |
| `--search-elemental-spinner-color` | `currentcolor` at 45% | The moving quarter; the ring behind it is a third of that |
| `--search-elemental-spinner-duration` | `0.7s` | One turn |

The spinner is pinned to the **end** of the element's box, which is the bottom of the field:
the panel is out of flow and adds no height, so the control is the last thing in it. Measured
from the end rather than the start, a label above the field costs nothing — a submit button
*below* it is the layout that needs the insets moved. `prefers-reduced-motion: reduce`
replaces the turning with a fade, because the setting asks for no motion and a static ring
with one dark quarter reads as an icon rather than as waiting.

```scss
@use "book-of-elementals/search/style.scss";
@use "book-of-elementals/search/theme.scss"; // optional
@use "book-of-elementals/suggest/style.scss"; // the panel
@use "book-of-elementals/suggest/theme.scss";
```

```javascript
import "book-of-elementals/search";
import "book-of-elementals/suggest";
```
