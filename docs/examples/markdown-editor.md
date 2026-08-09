---
layout: poops-docs-theme/docs
title: Markdown editor
description: A comment box with a formatting bar and an @-mention panel — toolbar-elemental over a textarea, suggest-elemental at the caret, and the one line that keeps Ctrl+Z working.
order: 7
---

# Markdown editor

A comment box: a formatting bar above a `<textarea>`, and a panel that completes `@names`
and `:emoji:` under the caret. Two elementals and no editor framework, no contenteditable,
no markdown parser.

The glue is about a hundred lines, and two thirds of it is the completion panel — the token
regex, the caret measuring, the ranking — which is
[covered on the suggest page](../elementals/suggest.html#completing-a-token) and repeated
here so the sample runs on its own. The toolbar's share is the twenty lines under
`wrap` and `prefix`.

<!-- demo toolbar suggest tooltip -->

```html
<div class="editor">
  <toolbar-elemental aria-label="Formatting" aria-controls="body">
    <div role="group" aria-label="Text">
      <tooltip-elemental>
        <button type="button" title="Bold" data-wrap="**">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 2h4.5a3.501 3.501 0 0 1 2.852 5.53A3.499 3.499 0 0 1 9.5 14H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm1 7v3h4.5a1.5 1.5 0 0 0 0-3Zm3.5-2a1.5 1.5 0 0 0 0-3H5v3Z"/></svg>
        </button>
        <span>Bold</span>
      </tooltip-elemental>
      <tooltip-elemental>
        <button type="button" title="Italic" data-wrap="_">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6 2.75A.75.75 0 0 1 6.75 2h6.5a.75.75 0 0 1 0 1.5h-2.505l-3.858 9H9.25a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.505l3.858-9H6.75A.75.75 0 0 1 6 2.75Z"/></svg>
        </button>
        <span>Italic</span>
      </tooltip-elemental>
      <tooltip-elemental>
        <button type="button" title="Code" data-wrap="`">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z"/></svg>
        </button>
        <span>Code</span>
      </tooltip-elemental>
    </div>

    <div role="group" aria-label="Blocks">
      <tooltip-elemental>
        <button type="button" title="Heading" data-prefix="## ">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.75 2a.75.75 0 0 1 .75.75V7h7V2.75a.75.75 0 0 1 1.5 0v10.5a.75.75 0 0 1-1.5 0V8.5h-7v4.75a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 3.75 2Z"/></svg>
        </button>
        <span>Heading</span>
      </tooltip-elemental>
      <tooltip-elemental>
        <button type="button" title="Quote" data-prefix="> ">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M1.75 2.5h10.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Zm4 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5ZM2.5 7.75v6a.75.75 0 0 1-1.5 0v-6a.75.75 0 0 1 1.5 0Z"/></svg>
        </button>
        <span>Quote</span>
      </tooltip-elemental>
      <tooltip-elemental>
        <button type="button" title="Bulleted list" data-prefix="- ">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M5.75 2.5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5ZM2 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM2 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>
        </button>
        <span>Bulleted list</span>
      </tooltip-elemental>
    </div>
  </toolbar-elemental>

  <div class="composer">
    <label class="visually-hidden" for="body">Comment</label>
    <textarea id="body" rows="6" autocomplete="off">Ship it @</textarea>
    <div class="at-caret">
      <suggest-elemental for="body" tab-completes><ul></ul></suggest-elemental>
    </div>
  </div>
</div>
```

```css demo
.editor { display: grid; gap: 0.5rem; max-width: 34rem; }

/* an icon button is square, and the icon is drawn in the text colour it inherits */
.editor toolbar-elemental button { padding: 0.4rem; }
.editor toolbar-elemental svg { display: block; fill: currentcolor; }
.composer { position: relative; padding-block-end: 9rem; }
.composer textarea { display: block; width: 100%; box-sizing: border-box; font: inherit; padding: 0.5rem; }

/* the panel hangs off a box of no size that the page moves to the caret */
.at-caret { position: absolute; inset-block-start: 0; inset-inline-start: 0; width: 0; height: 0; }
.at-caret suggest-elemental { min-width: 12rem; }
.at-caret small { opacity: 0.65; margin-inline-start: 0.4rem; }

.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

```js demo
const field = document.getElementById("body");
const bar = document.querySelector("toolbar-elemental");
const panel = document.querySelector("suggest-elemental");
const anchor = document.querySelector(".at-caret");

// `insertText` rather than assigning to `value`, and this is the whole reason the buttons
// are worth having: setting `value` wipes the field's undo stack, so the first Ctrl+Z after
// a click undoes everything the reader typed. execCommand is deprecated and is still the
// only way to write into a textarea as if it had been typed.
function type(text) {
  field.focus();
  document.execCommand("insertText", false, text);
}

// Bold, Italic, Code: wrap what is selected, or open a pair and sit between the marks.
function wrap(mark) {
  const { selectionStart: start, selectionEnd: end, value } = field;
  const selected = value.slice(start, end);
  field.setSelectionRange(start, end);
  type(mark + selected + mark);
  const caret = start + mark.length + selected.length;
  field.setSelectionRange(caret, caret);
}

// Quote, List: mark every line the selection touches, whole lines, whether or not the
// selection reached their ends.
function prefix(mark) {
  const { selectionStart: start, selectionEnd: end, value } = field;
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const breakAfter = value.indexOf("\n", end);
  const to = breakAfter === -1 ? value.length : breakAfter;
  field.setSelectionRange(from, to);
  type(value.slice(from, to).split("\n").map((line) => mark + line).join("\n"));
}

bar.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.wrap) wrap(button.dataset.wrap);
  else if (button.dataset.prefix) prefix(button.dataset.prefix);
});

const ROWS = {
  "@": [
    { value: "@nikola", hint: "Nikola Stamatović" },
    { value: "@nina", hint: "Nina Nikolić" },
    { value: "@ana", hint: "Ana Anić" }
  ],
  ":": [
    { value: "🎉", hint: ":tada:" },
    { value: "🔥", hint: ":fire:" },
    { value: "🚀", hint: ":rocket:" }
  ]
};

const escapeText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const TOKEN = /(?:^|\s)([@:])([\p{L}\p{N}_+-]*)$/u;

function token() {
  const hit = TOKEN.exec(field.value.slice(0, field.selectionStart));
  if (!hit) return null;
  return { trigger: hit[1], query: hit[2].toLowerCase(), at: field.selectionStart - hit[1].length - hit[2].length };
}

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
  const hits = ROWS[now.trigger].filter((row) => (row.value + " " + row.hint).toLowerCase().includes(now.query));
  panel.innerHTML = "<ul>" + hits.map((row) =>
    `<li><a href="#" data-value="${escapeText(row.value)}">${escapeText(row.value)}<small>${escapeText(row.hint)}</small></a></li>`
  ).join("") + "</ul>";

  const point = caretPoint();
  anchor.style.transform = `translate(${point.x}px, ${point.y}px)`;
  panel.open = hits.length > 0;
  if (panel.open) queueMicrotask(() => panel.moveTo(0));
}

field.addEventListener("input", refresh);
field.addEventListener("click", refresh);

panel.addEventListener("click", (event) => {
  const row = event.target.closest("a[data-value]");
  if (!row) return;
  event.preventDefault();
  const now = token();
  if (!now) return;
  field.setSelectionRange(now.at, field.selectionStart);
  type(row.dataset.value + " ");
});
```

Select a word and press **Bold**. Type `@ni` or `:fi` in the field. Then press
<kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Z</kbd> — every one of those undoes, in order, because
none of this ever assigned to `value`.

## The bar is one tab stop

Six buttons above a field is six presses of <kbd>Tab</kbd> between the reader and the field
they came to write in. [`<toolbar-elemental>`](../elementals/toolbar.html) makes it one:
<kbd>Tab</kbd> enters the bar, <kbd>←</kbd> and <kbd>→</kbd> walk it, <kbd>Tab</kbd> again
lands in the `<textarea>`.

The bar is named, and it says what it acts on:

```html
<toolbar-elemental aria-label="Formatting" aria-controls="body">
```

`aria-controls` is the page's, not the element's — a toolbar sitting above a field it does
not name is a group of buttons whose target a screen reader user has to infer from where it
happens to be on screen. It is
[valid on every role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-controls),
`toolbar` among them.

**The buttons are not toggles.** No `aria-pressed` anywhere, because knowing whether the
selection is already bold means parsing markdown, and an `aria-pressed="false"` that is
sometimes a lie is worse than no state at all. These are actions: they insert marks.

## Groups divide, they do not stop

The two `role="group"`s split text marks from block marks. That is a real division — a
screen reader announces the group and its label on entering it — and it is **not** a stop the
keyboard has to get into and out of. The arrows run straight through: six controls, one
sequence, <kbd>←</kbd> from the first heading button lands on the code button in the group
before it.

The theme draws the rule between them off `[role="group"] + [role="group"]`, so the line
appears between groups and never hangs off either end of the bar.

## The tooltip is the name, said once

Every button here is icon-only, and its tooltip carries the name and nothing else — "Bold",
not a sentence about what bold does. That is the one case where a tooltip may *be* a name,
and the markup that gets it right is the `title` shape:

```html
<tooltip-elemental>
  <button type="button" title="Bold" data-wrap="**">
    <svg aria-hidden="true">…</svg>
  </button>
  <span>Bold</span>
</tooltip-elemental>
```

No `aria-label` anywhere. [`<tooltip-elemental>`](../elementals/tooltip.html) finds a trigger
whose only name was its `title` — the [Octicon](https://primer.style/octicons/) inside is
`aria-hidden="true"`, so there is no text to find — takes the `title` off, and sets
`aria-label` from the bubble instead. It skips `aria-describedby` in that case deliberately:
described *and* named by the same string is a screen reader saying "Bold, button, Bold".

Write `aria-label="Bold"` on those buttons yourself and you get exactly that double
announcement, because the trigger then has a name already and the bubble becomes a
description of it. Which one the words end up as is decided by the attribute you wrote, and
for an icon-only button `title` is the one.

The caveat stands either way: there is no hover on a touch screen, so the bubble is words a
phone reader never sees. That is survivable here only because those same words are the
accessible name, which every reader gets.

## Ctrl+Z is the whole reason for `insertText`

The obvious way to write into a `<textarea>` from a button is `field.value = …`. It works,
and it silently empties the field's undo stack — so the first `Ctrl+Z` after a click throws
away everything the reader typed before it, and nothing warns them.

`document.execCommand("insertText", …)` writes the same text as if it had been typed:
the undo stack survives, `input` fires, and the caret lands where typing would leave it. It
is [deprecated](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand) and
it is still the only way to do this — the `EditContext` API is for canvas-style editors, not
for form controls. That is the trade, taken knowingly: a deprecated call that works today
against a supported call that loses a reader's work.

## The panel is the page's

[`<suggest-elemental>`](../elementals/suggest.html) owns the popup, the arrows and
`aria-activedescendant`. Everything about *what* completes is here: which character triggers
it, what the query is, how rows are ranked, and what an accepted row does to the text. The
element never sees the `@`.

The mechanics of that — the caret-following panel, the automatic selection of the first row,
and why the rows are `<a href="#">` — are covered on
[the suggest page](../elementals/suggest.html#completing-a-token). This example only shows
them standing next to a toolbar.

## What is not here

No preview pane, no syntax highlighting, no markdown parser — all three want a dependency,
and the point of the example is the two elements and the seam between them. No image upload
and no drag-and-drop either: they are the same click handler with a `fetch` in it, and
nothing about them is a keyboard or ARIA problem.
