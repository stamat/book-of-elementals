---
layout: poops-docs-theme/docs
title: Suggest
description: A list of links a text field drives with the arrow keys — the results panel, minus any opinion about where the results came from.
order: 10
---

# `<suggest-elemental>`

A list of links a text field can drive with the arrow keys, per the
[APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox
popup. It is the results panel a search field, a filter and a "jump to" box all end up
needing — and only the half of it that has nothing to do with where the results came from.

It owns the keyboard and the ARIA. It does not fetch, does not filter, and has no opinion
about what put the links there. Give it a `<ul>` of `<a>`, point it at an input, and the
arrows, Enter and Escape behave the way the pattern says.

<!-- demo suggest -->

```html
<div class="field">
  <label for="jump">Jump to</label>
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/>
  </svg>
  <input type="search" id="jump" autocomplete="off" placeholder="type, or press ↓">
  <suggest-elemental for="jump">
    <ul>
      <li><a href="accordion.html" target="_blank">Accordion</a></li>
      <li><a href="combobox.html" target="_blank">Combobox</a></li>
      <li><a href="disclosure.html" target="_blank">Disclosure</a></li>
      <li><a href="menu.html" target="_blank">Menu</a></li>
      <li><a href="modal.html" target="_blank">Modal</a></li>
    </ul>
  </suggest-elemental>
</div>
```

```css demo
/* the panel is absolutely positioned, so it adds no height to anything — the bottom margin
   is what keeps it inside this preview, and is not part of the pattern. A margin and not
   padding: the panel's containing block is this box, so padding here would push the panel
   down with it */
.field { position: relative; display: grid; max-width: 22rem; margin-block-end: 12rem; }

/* the icon and the field share one grid cell rather than being positioned over it, so the
   glyph is centred on whatever height the control turns out to have */
.field svg, .field input { grid-row: 2; grid-column: 1; }
.field svg {
  place-self: center start;
  /* the two share a cell, and the field is painted after — so the glyph needs lifting out
     from under its background, and taking out of the way of the click that focuses it */
  z-index: 1;
  margin-inline-start: 0.75rem;
  fill: color-mix(in srgb, CanvasText 55%, transparent);
  pointer-events: none;
}

/* the look of the control is the page's: the theme draws the panel and nothing else, on the
   reasoning that a field is what a design system already owns */
.field input {
  padding: 0.5rem 0.75rem;
  padding-inline-start: 2.25rem;
  font: inherit;
  color: CanvasText;
  background: Canvas;
  border: 1px solid color-mix(in srgb, CanvasText 30%, transparent);
  border-radius: 0.375rem;
}
.field input:focus-visible { outline: 2px solid CanvasText; outline-offset: 1px; }
.field label { margin-block-end: 0.35rem; font-size: 0.875rem; }

/* clear of the field rather than welded to it — the panel is a separate surface */
.field suggest-elemental { margin-block-start: 0.25rem; }
```

```js demo
// the element never sees the query: it is handed a list, and this is the page deciding what
// goes in it. `replaceChildren` moves the original rows, so there is no markup to build and
// nothing to escape
const field = document.getElementById("jump");
const panel = document.querySelector("suggest-elemental");
const rows = [...panel.querySelectorAll("li")];

field.addEventListener("input", () => {
  const query = field.value.trim().toLowerCase();
  const hits = rows.filter((row) => row.textContent.toLowerCase().includes(query));
  panel.querySelector("ul").replaceChildren(...hits);
  panel.open = query !== "" && hits.length > 0;
});
```

_Type, or press ↓. The caret never leaves the field — the cursor moving down the list is
`aria-activedescendant`, not focus, which is what lets you keep typing while you look. The
filtering is the sample's own JS; the element never sees the query._

The rows open in a new tab, which is this preview's need and not the element's — a row is a
link and a link in a frame with no history of its own has nowhere to come back from. On your
page they are ordinary links.

The panel is positioned against whatever the page has made the containing block, which is
why the sample gives the wrapper `position: relative`. The element writes `data-side` and
`data-align` for which corner had room; it does not write coordinates, because a light-DOM
popup lives in your layout and an element setting `top` on it is an element fighting a
decision you already made.

## The markup

Two things, joined by `for`:

```html
<input type="search" id="q">
<suggest-elemental for="q">
  <ul>
    <li><a href="/docs/install/">Install</a></li>
  </ul>
</suggest-elemental>
```

Only `<a href>` becomes an option. A link without an `href` is not a destination, and a row
that goes nowhere is a dead line on the list.

The `<ul>` and every `<li>` get `role="presentation"` — a `listbox` may only own `option`s,
and a list inside one would otherwise announce its own item counts on top of the listbox's.
The boxes stay, so your CSS still has its list to lay out; only the semantics come off.

**Replace the contents whenever you like.** The element watches for it and re-marks the new
rows, so nothing has to call a refresh — and forgetting one would be a list of options a
screen reader cannot see. The cursor resets when the list changes, because a cursor pointing
into the list that was on screen a moment ago points at a row that has moved or gone.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `for` | string | — | `id` of the text field that drives it. Without it the element does nothing. |
| `open` | boolean | `false` | Whether the panel is showing. Reflected, so `[open]` is a styling hook, and settable so whatever fills the list can show it: `suggest.open = true`. |
| `tab-completes` | boolean | `false` | <kbd>Tab</kbd> takes the row under the cursor instead of leaving the field. For a completer whose rows are text about to be typed. |

`suggest-toggle` fires on every change, with `detail.open`.

## Keyboard

| Key | Panel closed | Panel open |
| --- | --- | --- |
| <kbd>↓</kbd> | opens, cursor on the first option | moves down, wrapping |
| <kbd>↑</kbd> | opens, cursor on the last option | moves up, wrapping |
| <kbd>Alt</kbd> + <kbd>↓</kbd> | opens, no cursor — see the list without committing to a row | — |
| <kbd>Alt</kbd> + <kbd>↑</kbd> | — | closes |
| <kbd>Enter</kbd> | left to the page, so the form still submits | follows the option under the cursor |
| <kbd>Escape</kbd> | left to the page, so it can clear the field | closes |
| <kbd>Tab</kbd> | leaves | closes, then leaves — or takes the row under the cursor, with `tab-completes` |
| <kbd>Home</kbd> <kbd>End</kbd> | move the caret through what you typed | the caret, until a row is under the cursor — then the ends of the list |

Everything else is left where it was typed.

<kbd>Home</kbd> and <kbd>End</kbd> are the pair worth explaining. The pattern calls them
optional and gives two answers: jump the list, or — "if the combobox is editable" — put the
caret back on the first character. This field is always editable, so both are right at
different moments. Up to the first arrow key the reader is still writing a query, and a
<kbd>Home</kbd> that jumped the list rather than reaching the start of `install` would be
wrong on nearly every press. Once an arrow has put a cursor on a row they are reading
results, and the ends of the list are the only thing those keys can mean. <kbd>Escape</kbd>,
or typing again, hands them back.

The pointer takes the cursor with it. Two cursors that disagree is the bug — the pointer
sitting on one row while `aria-activedescendant` names another, and <kbd>Enter</kbd> going
somewhere the reader is not looking.

**`tab-completes` is off by default and should stay off for a list of links.** These rows are
destinations, so a <kbd>Tab</kbd> that took the one under the cursor would navigate off the
page on the keystroke that means "move along". Where the rows are text about to be typed — a
mention, an emoji — it is what every editor does, so the markup asks for it rather than the
element guessing. It is not in the
[pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), whose <kbd>Tab</kbd> row says
only that the combobox is in the page's tab sequence; the thing the pattern *does* give you
is automatic selection, which is `moveTo(0)` and costs no attribute.

With nothing under the cursor <kbd>Tab</kbd> leaves regardless, however the attribute is
set — a panel with no answer must never cost a second press to get out of.

## Completing a token

The panel does not need a field whose whole value is the query. In a comment box the query
is one token under the caret — `@sta` for a person, `:fi` for an emoji — and the page owns
the parsing, the matching and what an accepted row does to the text. The element still owns
the popup, the arrows, `aria-activedescendant` and the ARIA on the field.

<!-- demo suggest -->

```html
<div class="composer">
  <label for="note">Comment</label>
  <textarea id="note" rows="4" autocomplete="off">Ship it @</textarea>
  <div class="at-caret">
    <suggest-elemental for="note" tab-completes><ul></ul></suggest-elemental>
  </div>
</div>
```

```css demo
/* the panel is absolutely positioned, so it adds no height to anything — the bottom padding
   is what keeps it inside this preview, and is not part of the pattern */
.composer { position: relative; padding-block-end: 9rem; }
/* `resize: vertical` and not `both`: a field dragged wider than its column takes the panel
   anchored to it off the edge with it */
.composer textarea {
  display: block; width: 100%; box-sizing: border-box; resize: vertical;
  padding: 0.5rem; font: inherit; color: inherit;
  background: none;
  border: 1px solid color-mix(in srgb, currentcolor 20%, transparent);
  border-radius: 0.375rem;
}

/* the panel hangs off a box of no size that the page moves to the caret, so the element's
   own `inset-block-start: 100%` resolves against the caret's line and not the field's
   bottom edge */
.at-caret { position: absolute; inset-block-start: 0; inset-inline-start: 0; width: 0; height: 0; }
/* `width: max-content` because the anchor above is a box of no size: an absolutely
   positioned panel shrinks to fit its containing block, and a containing block of zero
   width wraps every row. The max-height is capped under the element's own 20rem so the
   emoji list scrolls inside the space this sample reserves below the field */
.at-caret suggest-elemental {
  min-width: 12rem; width: max-content; max-width: 20rem;
  --suggest-elemental-max-height: 10rem;
}
.at-caret small { opacity: 0.65; margin-inline-start: 0.4rem; }
```

```js demo
// Shortcode to glyph, because that is the shape this data has everywhere else — the rows the
// panel wants are built off it below.
const EMOJI = {
  tada: "🎉", fire: "🔥", rocket: "🚀", sparkles: "✨", bug: "🐛", eyes: "👀",
  joy: "😂", smile: "😄", wink: "😉", thinking: "🤔", sob: "😭", rage: "😡",
  sunglasses: "😎", heart: "❤️", thumbsup: "👍", thumbsdown: "👎", clap: "👏",
  pray: "🙏", muscle: "💪", wave: "👋", ok_hand: "👌", brain: "🧠", skull: "💀",
  ghost: "👻", robot: "🤖", poop: "💩", star: "⭐", zap: "⚡", boom: "💥",
  rainbow: "🌈", coffee: "☕", beer: "🍺", pizza: "🍕", cake: "🎂", gift: "🎁",
  bell: "🔔", lock: "🔒", key: "🔑", hammer: "🔨", wrench: "🔧", gear: "⚙️",
  package: "📦", books: "📚", memo: "📝", chart: "📈", calendar: "📅", mag: "🔍",
  warning: "⚠️", construction: "🚧", white_check_mark: "✅", x: "❌",
  question: "❓", snake: "🐍", whale: "🐳", cat: "🐱", dog: "🐶", unicorn: "🦄",
  penguin: "🐧"
};

const ROWS = {
  "@": [
    { value: "@stamat", hint: "Nikola Stamatović" },
    { value: "@koyev", hint: "Marko Jević" },
    { value: "@msavin", hint: "Max Savin" },
    { value: "@jesussandreas", hint: "Jesus Sandrea" }
  ],
  ":": Object.entries(EMOJI).map(([name, glyph]) => ({ value: glyph, hint: `:${name}:` }))
};

const field = document.getElementById("note");
const panel = document.querySelector("suggest-elemental");
const anchor = document.querySelector(".at-caret");

const escapeText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// a trigger character at a word start, and the word after it — at a word start so an
// e-mail address and a `10:30` do not open the panel
const TOKEN = /(?:^|\s)([@:])([\p{L}\p{N}_+-]*)$/u;

function token() {
  const hit = TOKEN.exec(field.value.slice(0, field.selectionStart));
  if (!hit) return null;
  return { trigger: hit[1], query: hit[2].toLowerCase(), at: field.selectionStart - hit[1].length - hit[2].length };
}

// where the caret is, in pixels, by mirroring the field into a div and measuring a span
// planted at the caret — nothing on the platform reports it, because neither Range nor
// getSelection reaches inside a form control
function caretPoint() {
  const style = getComputedStyle(field);
  const mirror = document.createElement("div");
  for (const prop of ["font", "padding", "border", "width", "boxSizing", "letterSpacing"]) mirror.style[prop] = style[prop];
  mirror.style.cssText += ";position:absolute;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word";
  mirror.textContent = field.value.slice(0, field.selectionStart);
  const caret = mirror.appendChild(document.createElement("span"));
  caret.textContent = ".";
  document.body.append(mirror);
  const point = {
    x: field.offsetLeft + caret.offsetLeft,
    y: field.offsetTop + caret.offsetTop + parseFloat(style.lineHeight) - field.scrollTop
  };
  mirror.remove();
  return point;
}

function refresh() {
  const now = token();
  if (!now) {
    panel.open = false;
    return;
  }

  // prefix before anywhere: typing `:fi` wants `:fire:` at the top, not every emoji with an
  // `f` somewhere in it
  const hits = ROWS[now.trigger]
    .map((row) => ({ row, rank: (row.value + " " + row.hint).toLowerCase().indexOf(now.query) }))
    .filter((scored) => scored.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map((scored) => scored.row);

  panel.innerHTML = "<ul>" + hits.map((row) =>
    `<li><a href="#" data-value="${escapeText(row.value)}">${escapeText(row.value)}<small>${escapeText(row.hint)}</small></a></li>`
  ).join("") + "</ul>";

  const point = caretPoint();
  anchor.style.transform = `translate(${point.x}px, ${point.y}px)`;
  panel.open = hits.length > 0;

  // the pattern's "automatic selection": the first row is the cursor from the start, so
  // Enter takes it with no arrow key first. Deferred because replacing the rows is a
  // mutation, and the element clears the cursor when that lands.
  if (panel.open) queueMicrotask(() => panel.moveTo(0));
}

function accept(value) {
  const now = token();
  if (!now) return;
  const before = field.value.slice(0, now.at) + value + " ";
  field.value = before + field.value.slice(field.selectionStart);
  field.setSelectionRange(before.length, before.length);
  field.focus();
}

field.addEventListener("input", refresh);
field.addEventListener("click", refresh);

// the arrows are the panel's while it is open — re-rendering on them would clear the cursor
// the arrow just moved, and Enter would fall through to the field as a newline
field.addEventListener("keyup", (event) => {
  if (!panel.open && (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End")) refresh();
});

// the rows are `<a href="#">` because that is the only thing the element counts as an
// option, and a token is not a destination, so nothing here is allowed to navigate
panel.addEventListener("click", (event) => {
  const row = event.target.closest("a[data-value]");
  if (!row) return;
  event.preventDefault();
  accept(row.dataset.value);
});
```

_Type `@ni`, or `:fi`. The panel follows the caret onto the next line, the first row is
already under the cursor, and <kbd>Enter</kbd> — or <kbd>Tab</kbd>, because of
`tab-completes` — takes it without an arrow key first._

Three parts of that are worth naming, because each is a place the element stops and the page
starts:

- **The panel follows the caret, not the field.** The element positions against whatever the
  page made the containing block, so the page makes one of no size and moves it. Measuring
  the caret is the page's, and it costs a mirrored `<div>` — no browser API reports a caret
  offset inside a `<textarea>`.
- **The first row is the cursor before an arrow key.** That is the pattern's
  [list autocomplete with automatic selection](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
  and it is `moveTo(0)`. It has to wait a microtask: the element watches for the rows
  changing and clears the cursor when they do, which is right when the list changed under a
  reader and wrong the moment you wanted to put one back.
- **Rows are still `<a href>`.** That is the whole option contract, so a token completer
  writes `href="#"` and cancels every activation. It works, and it is the seam — these rows
  are not destinations, and the element's own rule is that a link going nowhere is a dead
  row. Treat this as the supported hack it is, not as the element growing a second kind of
  option.

## Without script

A list of links, in flow, visible and reachable. Nothing is authored `hidden`, so nothing is
lost when the script never arrives — which is also why the panel is not styled as a floating
box until the element is defined.

## Why not `<combobox-elemental>`

[That one](combobox.html) is a view of a `<select>`. It holds a value, submits under a name,
resets with the form, and its options carry `aria-selected`.

|  | `<combobox-elemental>` | `<suggest-elemental>` |
| --- | --- | --- |
| An option is | a `<select>` option — a value | a link — a destination |
| Carries | `aria-selected`, `aria-multiselectable` | neither |
| After a pick | stays open when multiple | navigates away |
| Needs | a `<select>` | an `<a>` and an input |

They share the cursor mechanics and nothing else. Reach for the combobox when the answer
goes into a form; reach for this when the answer is somewhere to go.

## What it will not do

No fetching, no filtering, no ranking, no match highlighting, and no result count announced
— the last one because "5 results" is the language of whatever built the list, not of the
list. Pair it with something that owns the query.

## Styling

The structure stylesheet positions and scrolls the panel and nothing else. The theme is
optional and draws only what the element owns — the panel and its rows. **Nothing here
styles your `<input>`**: that control is yours, and styling it is what a design system does.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--suggest-elemental-radius` | `0.375rem` | Corners of the panel |
| `--suggest-elemental-inset` | `0.5rem` | The one padding unit: down the side of every row, three quarters of it above and below the text |
| `--suggest-elemental-max-height` | `20rem` | How tall the panel gets before it scrolls |
| `--suggest-elemental-surface` | `Canvas` | What the panel is painted on |
| `--suggest-elemental-active` | `color-mix(in srgb, currentcolor 12%, transparent)` | The row under the cursor |

```scss
@use "book-of-elementals/suggest/style.scss";
@use "book-of-elementals/suggest/theme.scss"; // optional
```

```javascript
import "book-of-elementals/suggest";
```
