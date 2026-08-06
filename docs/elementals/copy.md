---
layout: poops-docs-theme/docs
title: Copy
description: A copy-to-clipboard button that says it copied — on the screen and out loud.
order: 13
---

# `<copy-elemental>`

A real `<button>` that puts text on the clipboard and says so, in both of the ways a reader
might be listening. Light DOM, no shadow root, nothing moved or wrapped.

<div class="demo-block">
  <p><code id="copy-intro-source">npm i book-of-elementals</code></p>
  <copy-elemental for="copy-intro-source">
    <button type="button">Copy</button>
  </copy-elemental>
</div>

```html
<code id="install">npm i book-of-elementals</code>

<copy-elemental for="install">
  <button type="button">Copy</button>
</copy-elemental>
```

## Why this needs script at all

Two reasons, and the second is the one worth the element.

**The clipboard is JavaScript only.** There is no attribute, no `<input type="copy">`, no CSS.
[`navigator.clipboard.writeText()`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
is the whole platform surface, so every copy button on the web is a click handler somebody
wrote again.

**A swapped icon is not an announcement.** Every copy button ticks, or turns green, or floats
a "Copied!" tooltip — all of which are nothing at all to a reader using a screen reader. They
press the button and are told the same thing they were told before pressing it, which leaves
them with no way to know whether the text is on their clipboard.
[WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html)
is the level-AA requirement that covers exactly this: a change of status the reader did not
move focus to still has to reach them. This element's live region is that sentence, and it is
the reason it exists rather than a copied snippet from a blog post.

| Prior art                                                                                   | What it gives you                                                        | The announcement |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------ |
| [`@github/clipboard-copy`](https://github.com/github/clipboard-copy-element)                | `for` / `value`, and a `clipboard-copy` event to build your feedback from | yours to write   |
| [`<sl-copy-button>`](https://shoelace.style/components/copy-button)                          | icon swap and a tooltip, in a shadow root, on Lit                         | not documented   |
| this                                                                                        | the write, a `data-state` for CSS, and a live region                      | built in         |

Neither of those is a bad element — GitHub's in particular is a hundred honest lines with no
dependencies, and if you are writing your own feedback anyway it is the smaller thing to
install. Reach for this one when you want the feedback to be finished, and in the light DOM
with the page's own CSS on it.

## What gets copied

Two attributes, and `value` wins:

| Markup                                            | On the clipboard                                    |
| --------------------------------------------------- | ----------------------------------------------------- |
| `<copy-elemental for="id">`                       | the text of that element, as it is drawn             |
| `<copy-elemental for="id">` where the id is a field | what is **in** the field, not what is between its tags |
| `<copy-elemental value="…">`                      | the attribute, character for character                |
| both                                              | the attribute                                        |
| neither                                           | nothing — the button is not offered at all           |

The text of an element is trimmed at one end. A code block written in markdown carries a
newline before its first line and another after its last, and neither is code — the trailing
one pasted into a terminal **runs the command the reader was still reading**. Indentation at
the start of a line is code, in Python and YAML especially, so nothing there is touched.

A `value` is never trimmed. It is what the author typed, including the spaces.

## Feedback

<!-- demo copy -->

```html
<p><code id="demo-source">git switch -c the-thing</code></p>

<copy-elemental for="demo-source">
  <button type="button">Copy</button>
</copy-elemental>

<copy-elemental for="not-a-real-id">
  <button type="button">This one fails</button>
</copy-elemental>
```

Press either. The one on the right names an element that is not there, which is the failure
this element refuses to paper over: writing an empty string would wipe whatever the reader
already had on their clipboard **and report it as a success**.

Both the icon and the words come from the same press:

| What happened                     | On the element               | In the live region  |
| ----------------------------------- | ------------------------------ | --------------------- |
| the text is on the clipboard      | `data-state="copied"`        | `copied-text`, default `Copied` |
| nothing to copy, or it was refused | `data-state="error"`         | `error-text`, default `Copy failed` |
| two seconds later                 | neither                      | emptied              |

The live region is a `<span role="status" class="copy-elemental-status">` the element appends
to itself at upgrade — a live region only announces text arriving in one that was **already**
in the document, so it cannot be built at the moment there is something to say. It is clipped
out of sight by `style.scss` and never hidden with `display: none`, which would take it back
out of the accessibility tree and undo the whole point.

It empties after two seconds for the same reason: a region still holding "Copied" is a line
the reader meets again later, with nothing behind it.

## Usage

```javascript
import "book-of-elementals/copy";
```

```scss
@use "book-of-elementals/copy/style.scss"; // structure
@use "book-of-elementals/copy/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/copy.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/copy.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/copy-theme.min.css"
/>
```

The button is **the element's own direct child**, so a button inside the block being copied —
or a second copy button below — is never mistaken for the trigger. Give it whatever label or
icon you like; its accessible name, its focus ring, <kbd>Enter</kbd> and <kbd>Space</kbd> are
the button's, which is the point of using one.

### Copying a field

```html
<label>Your key <input id="api-key" value="sk-…" readonly /></label>

<copy-elemental for="api-key">
  <button type="button">Copy key</button>
</copy-elemental>
```

A field is copied by its **current** value, so a reader who edited it copies what they see.

### Copying something that is not on the page

```html
<copy-elemental value="git remote add origin git@github.com:you/repo.git">
  <button type="button">Copy the remote</button>
</copy-elemental>
```

There is no `from="el[href]"` micro-syntax and no `<a href>` special case. One attribute beats
a selector dialect nobody remembers, and pulling an attribute out of the page is one line:

```javascript
copy.value = link.href;
```

## Degrading

A copy button that cannot copy is a button that lies: the reader presses it, sees no error,
and walks away believing they have the text. So it is not offered at all until the element
has upgraded **and** found something to write with.

| Missing                          | What you get                                                        |
| ---------------------------------- | --------------------------------------------------------------------- |
| the script never loads           | no button. The text is still on the page, still selectable           |
| the page is served over `http`   | no button — `navigator.clipboard` only exists in a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) |
| `for` and `value` both unset     | no button, and `data-unavailable` on the element saying why          |
| the theme is not imported        | your own button, wired and announcing. `style.scss` draws nothing    |

`localhost` is a secure context, so this only bites on a real `http://` deployment.

> [!NOTE]
> Put the text somewhere the reader can select it. The button is a shortcut past selecting it
> by hand, and a page where the *only* way to get a value is a button is a page that breaks
> for everyone in the table above.

## API

### Attributes

| Attribute      | Type     | Default       | Description                                              |
| ---------------- | -------- | ------------- | ---------------------------------------------------------- |
| `for`          | string   | —             | `id` of the element to copy. Also read as `data-for`      |
| `value`        | string   | —             | Literal text, exactly as written. Wins over `for`         |
| `copied-text`  | string   | `Copied`      | What the live region says on success                      |
| `error-text`   | string   | `Copy failed` | What it says when there was nothing to copy, or it failed |

### Properties

| Property   | Type          | Description                                                       |
| ------------ | ------------- | ------------------------------------------------------------------- |
| `button`   | `HTMLButtonElement` | Read-only. The direct child that copies                     |
| `target`   | `Element`     | Read-only. What `for` names, resolved on every press               |
| `text`     | string        | Read-only. What a press would put on the clipboard, right now      |
| `value`    | string        | The `value` attribute. Setting it is how you copy something computed |

### Events

| Event       | Detail                                              |
| ------------- | ----------------------------------------------------- |
| `copy-done` | `ok` — whether it landed. `text` — what went on the clipboard |

```javascript
document.addEventListener("copy-done", (e) => {
  if (e.detail.ok) analytics.track("copied", e.detail.text.length);
});
```

It bubbles, and it fires on the failures too — that is what `ok` is for.

### Styling hooks

```css
copy-elemental[data-state="copied"] {
} /* the two seconds after it landed */
copy-elemental[data-state="error"] {
} /* the two seconds after it did not */
copy-elemental[data-unavailable] {
} /* no clipboard, or nothing named to copy */
copy-elemental:not(:defined) {
} /* before upgrade */
.copy-elemental-status {
} /* the live region. Unclip it if you want the words on screen too */
```

## The look

`style.scss` is structure only; `theme.scss` is the look and is optional. It draws a small
bordered button with an Octicon in front of the label, and swaps that icon for a tick on
`[data-state="copied"]`.

The failed state keeps the copy icon on purpose. A tick that means "that did not work" is the
worst thing this element could draw, so failure is the colour and the words, never the shape.

| Property                             | Default                     | Description                       |
| -------------------------------------- | --------------------------- | ----------------------------------- |
| `--copy-elemental-icon-size`         | `1em`                       | The icon, both axes               |
| `--copy-elemental-gap`               | `0.4em`                     | Between the icon and the label    |
| `--copy-elemental-padding-block`     | `0.4em`                     | Above and below the label         |
| `--copy-elemental-padding-inline`    | `0.6em`                     | Either side of it                 |
| `--copy-elemental-radius`            | `0.35rem`                   | Button corners                    |
| `--copy-elemental-surface`           | `Canvas`                    | What the button is painted on     |
| `--copy-elemental-border-color`      | `currentcolor` at 30%       | The rim around it                 |
| `--copy-elemental-hover`             | `currentcolor` at 8%        | Fill under the pointer            |
| `--copy-elemental-copied-color`      | `currentcolor` towards green | Icon, label and rim once it landed |
| `--copy-elemental-error-color`       | `currentcolor` towards red  | The same three when it did not    |
| `--copy-elemental-duration`          | `150ms`                     | The cross-fade between them       |

That is the table above, live. Turn the knobs in the **Options** tab until it looks the way
you want, then copy the rule out of the bottom of the panel:

<!-- demo copy tab="options" -->

```html
<p><code id="options-source">turn me in the Options tab</code></p>

<copy-elemental for="options-source">
  <button type="button">Copy</button>
</copy-elemental>
```

Under `forced-colors` the icon is repainted in the forced text colour — a masked icon is a
painted background, and that mode overrides author backgrounds, which would otherwise leave
an icon-only button with nothing on it at all.

> [!NOTE]
> Supplying your own icon? Set `content: none` on the button, or the theme's lands beside it:
>
> ```css
> copy-elemental > button::before {
>   content: none;
> }
> ```

### In the corner of a code block

The look every docs site ends up building: an icon-only button pinned in the corner of the
sample, and a small bubble that says it copied. Both are stylesheet, on the state the element
already writes — there is no second element here, and no option to turn on.

<!-- demo copy -->

```html
<div class="snippet">
  <pre id="corner-source"><code>git switch -c the-thing</code></pre>

  <copy-elemental for="corner-source" copied-text="Copied!">
    <button type="button" aria-label="Copy the command"></button>
  </copy-elemental>
</div>
```

```css demo
body { margin: 0; padding: 1rem; font: 1rem/1.5 system-ui, sans-serif; }

.snippet { position: relative; }

/* room at the end for the button, so a long line runs under it rather than into it */
.snippet pre {
  margin: 0;
  padding: 0.75rem 3rem 0.75rem 0.75rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, currentcolor 6%, Canvas);
  overflow-x: auto;
}

/* `display: block` first: the element is `display: contents` out of the box, which is no
   box to position and no box for the bubble to hang off */
.snippet copy-elemental {
  display: block;
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
}

/* the bubble is the live region, un-clipped for as long as it is holding words. Empty, it
   falls back to the 1px clipped span the stylesheet draws - still in the accessibility
   tree, which is where it has to be before any text lands in it */
.snippet .copy-elemental-status:not(:empty) {
  inset-inline-end: calc(100% + 0.4rem);
  inset-block-start: 50%;
  translate: 0 -50%;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip-path: none;
  padding: 0.15rem 0.45rem;
  border-radius: 0.3rem;
  /* the page's own two colours, swapped. `currentcolor` would be this rule's own `color`,
     which is the line below - white on white */
  background: CanvasText;
  color: Canvas;
  font-size: 0.75rem;
  pointer-events: none;
}
```

Four things in there are load-bearing:

**The bubble is the live region, not a copy of it.** No `::after`, no `attr(copied-text)`,
nothing that could come to say something different from what the reader hears — the span the
element already announces through is un-clipped and drawn. One node, so "seen" and "said"
cannot drift, and the failure gets a bubble for free: `Copy failed` in the same place, without
a second rule. Generated content would have cost a duplicate: Chromium exposes `::after` text
as a node of its own, which puts the word in the accessibility tree twice.

**`:not(:empty)`, so the empty region keeps its clipped 1px box.** A live region only
announces text that arrives in one **already** in the accessibility tree. Un-clip it flat and
an empty bubble sits on the page between presses; `display: none` it and the announcement goes
with it. Styling only the state that has words is the version that is both.

**`display: block` before `position`.** The element ships as `display: contents`, so dropping
it around an existing button changes no layout at all — but a box that does not exist cannot
be positioned, and neither can anything hanging off it. Give it a box first.

**The button has no text, so `aria-label` is its whole name.** The theme's icon is a masked
background — decorative by construction, and never a name. Nothing the bubble does touches
that name: the region is a sibling of the button, not a child, so the button stays "Copy the
command" throughout. A `<span>` inside the button would have renamed it to "Copy the command
Copied!" for those two seconds, and
[generated content counts too](https://www.w3.org/TR/accname-1.2/#comp_name_from_content).

Nothing about the placement is the element's business. `data-state` and that region are the
hooks; where the button sits, which side the bubble comes out of, and whether there is a bubble
at all are the page's to decide.

## Copy, or something else?

| Wanted                                        | Element                                    |
| ----------------------------------------------- | -------------------------------------------- |
| a button that copies text and says it did     | this                                        |
| a setting that takes effect at once           | [`<switch-elemental>`](switch.html)         |
| a button that shows and hides something       | [`<disclosure-elemental>`](disclosure.html) |

If all you need is the clipboard write and you are drawing the feedback yourself,
[`@github/clipboard-copy`](https://github.com/github/clipboard-copy-element) is the smaller
install and does that part well.

<script src="{{ relativePathPrefix }}dist/elementals/copy.js"></script>
