---
layout: poops-docs-theme/docs
title: Progress
description: A native <progress> whose fill CSS can draw — and a second value beside it, for the part that is loaded but not played yet.
order: 17
navGroup: No APG pattern
---

# `<progress-elemental>`

A native `<progress>` that says where its fill ends, so CSS can draw the bar instead of
`::-webkit-progress-value` and `::-moz-progress-bar` — and a second value beside it, for
the part that is loaded but not yet played. Light DOM, no shadow root, nothing moved or
wrapped.

<div class="demo-block" style="max-inline-size: 22rem">
  <progress-elemental buffer="82">
    <progress value="45" max="100">45%</progress>
  </progress-elemental>
</div>

```html
<progress-elemental buffer="82">
  <progress value="45" max="100">45%</progress>
</progress-elemental>
```

## Usage

Write the `<progress>` you would have written anyway and wrap it. The `<progress>` must be
a direct child; without one there is nothing to measure, and nothing is enforced beyond
that. Edit the sample and the preview above it follows as you type — take the `value` off
and watch it go indeterminate:

<!-- demo progress -->

```html
<label for="upload">Uploading</label>
<progress-elemental buffer="70">
  <progress id="upload" value="35" max="100">35%</progress>
</progress-elemental>
```

```javascript
import "book-of-elementals/progress";
```

```scss
@use "book-of-elementals/progress/style.scss"; // structure
@use "book-of-elementals/progress/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/progress.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/progress.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/progress-theme.min.css"
/>
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

## What the element does, and what the browser does

Nearly all of it is the browser's, because the child is a real `<progress>`:

| Behaviour                                      | Whose        |
| ---------------------------------------------- | ------------ |
| `role="progressbar"`, announced as one         | the browser  |
| `max`, and counting from zero                  | the browser  |
| Indeterminate when there is no `value`         | the browser  |
| Named by a `<label>`, or by `aria-label`       | the browser  |
| Where the fill ends, as something CSS can read | this element |
| A second value on the same scale               | this element |

So no roles are written here, no `aria-valuenow`, and there is no event of its own. There
is nothing to announce that the `<progress>` is not already announcing.

## API

### Attributes

| Attribute | Type   | Default | Description                                                                              |
| --------- | ------ | ------- | ---------------------------------------------------------------------------------------- |
| `buffer`  | number | —       | A second value on the same `max`, drawn behind the fill. Absent is no buffer bar at all. |

### What it writes on itself

| What                          | Value                                                                   |
| ----------------------------- | ----------------------------------------------------------------------- |
| `--progress-elemental-value`  | How far along, as a percentage. Removed while indeterminate             |
| `--progress-elemental-buffer` | The `buffer` over the same `max`, as a percentage. Removed without one  |
| `data-indeterminate`          | Present while the `<progress>` has no `value`. What the sweep hangs off |

Both percentages are already clamped to `0%`–`100%`, so a `value` past `max` is a full bar
rather than one that has run off the end.

### Properties

| Property   | Type                  | Description                                                           |
| ---------- | --------------------- | --------------------------------------------------------------------- |
| `progress` | `HTMLProgressElement` | Read-only. The direct-child `<progress>`.                             |
| `value`    | number \| null        | Get/set. Writes the child's `value`. `null` takes it off — see below. |
| `max`      | number \| null        | Get/set. The child's `max`, which is `1` when it has none.            |
| `buffer`   | number \| null        | Get/set. Writes the attribute. `null` removes it.                     |
| `apply()`  | —                     | Re-read the `<progress>`. Call it after swapping the child out.       |

### Events

None of its own, and none from `<progress>` either — the element has never fired one. Move
the bar and you already know it moved.

### Styling hooks

| Selector                                 | What it is                                                         |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `progress-elemental`                     | The bar. Track, fill and buffer are on it                          |
| `progress-elemental[data-indeterminate]` | While there is no value                                            |
| `progress-elemental:not(:defined)`       | Before the script has run, or without it                           |
| `progress-elemental > progress`          | The native bar, which is now the semantics rather than the drawing |

## Moving the bar

Set the value on the element, or on the `<progress>` — both land in the same place:

```javascript
const bar = document.querySelector("progress-elemental");

bar.value = 60; // through the element
bar.progress.value = 60; // straight at the child
bar.progress.setAttribute("value", 60); // or as an attribute
```

All three work because `<progress>`'s `value` and `max` are
[reflecting IDL attributes](https://developer.mozilla.org/en-US/docs/Web/API/HTMLProgressElement):
setting the property writes the attribute. The element watches the child for exactly those
two attributes, so there is one way in and no way to move the bar without the drawing
following. `<progress>` fires no event of its own, which is why watching it is the only way
there is.

A `MutationObserver` delivers on a microtask, so the custom properties catch up just after
the write rather than during it. Nothing rendered is ever behind — the browser paints after
the microtask, not between statements — but a test that sets a value and reads
`element.style` on the next line will see the old one. `await Promise.resolve()` first, or
call `apply()`, which is synchronous.

## Indeterminate

A `<progress>` with no `value` is indeterminate — a task under way whose length nobody
knows. That is the platform's rule, not this element's, and the way back is
[to remove the attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress):

```javascript
bar.value = null; // indeterminate: the attribute comes off
bar.value = 0; // determinate, and empty. Not the same thing
```

The element writes `data-indeterminate` and removes `--progress-elemental-value` rather
than setting it to `0%`, because those two are different claims: a bar at zero says nothing
has happened yet, and a bar with no value says nobody knows. With the theme on, the second
one sweeps.

<div class="demo-block" style="max-inline-size: 22rem">
  <progress-elemental>
    <progress aria-label="Working"></progress>
  </progress-elemental>
</div>

```html
<progress-elemental>
  <progress aria-label="Working"></progress>
</progress-elemental>
```

Under `prefers-reduced-motion: reduce` the sweep is replaced rather than dropped: the whole
track fills at the buffer's weight, which still reads as _working_ where an empty bar would
read as _nothing has started_.

## The buffer

`<progress>` has one value and `<meter>`'s low/high do not mean this, so a bar that is
loaded to here and played to there has always been two elements stacked by hand. `buffer`
is that second value, on the same `max`:

```html
<progress-elemental buffer="82">
  <progress value="45" max="100">45%</progress>
</progress-elemental>
```

It is decoration and it degrades as decoration: it writes no ARIA, so a screen reader hears
the `<progress>`'s own value and nothing about buffering, and without the script or the
theme it is not drawn at all. Announce it yourself if it matters — usually it does not.

The buffer is one span from the start, not the
[`TimeRanges`](https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges) list a `<video>`
actually keeps. Hand it `media.buffered.end(0)`, which is what a scrubber draws anyway:

```javascript
video.addEventListener("progress", () => {
  if (!video.duration || !video.buffered.length) return;
  bar.max = video.duration;
  bar.buffer = video.buffered.end(0);
});
```

## A scrubber

The two elements together are the whole of one — a bar underneath with the buffer on it,
and a [`<slider-elemental>`](slider.html) over the top for the seeking:

<!-- demo progress slider -->

```html
<div class="scrubber">
  <progress-elemental buffer="82">
    <progress value="45" max="100">45%</progress>
  </progress-elemental>
  <slider-elemental>
    <input type="range" aria-label="Seek" min="0" max="100" value="45" />
  </slider-elemental>
</div>
```

```css demo
/* One thumb size and one bar thickness for both, under the names the slider already owns.
   They are set on each of them rather than on .scrubber, because both themes declare their
   own on the element itself and a declaration on the element beats anything inherited from
   above it. */
.scrubber slider-elemental,
.scrubber progress-elemental {
  --slider-elemental-thumb-size: 1rem;
  --slider-elemental-track-size: 0.5rem;
  --progress-elemental-height: var(--slider-elemental-track-size);
}
.scrubber {
  display: grid;
}
/* One cell, so the slider sits over the bar — and later in the markup, which is what puts
   it on top without a z-index between them. */
.scrubber > * {
  grid-area: 1 / 1;
  align-self: center;
}
/* The slider's own rail is half a thumb short at each end, because that is where the
   thumb's centre starts and stops. A progress bar has no thumb to stop for, so it is
   inset to match — otherwise it overhangs the seeking at both ends. */
.scrubber progress-elemental {
  margin-inline: calc(var(--slider-elemental-thumb-size) / 2);
}
/* Who draws what. The played part is the slider's fill, because that is the one that
   arrives with the thumb — the bar's own fill eases over --progress-elemental-duration and
   would trail behind a drag. So the bar keeps the two things the slider cannot draw, its
   rail and its buffer, and gives up the fill; the slider gives up its rail so the bar's
   shows through, and keeps the fill and the thumb. */
.scrubber slider-elemental {
  --slider-elemental-track: transparent;
}
.scrubber progress-elemental {
  --progress-elemental-fill: transparent;
}
```

```js demo
// The bar draws nothing of the position any more, so this is not about the drawing: the
// <progress> is what a screen reader reads for "45%", and left behind it would announce a
// position the control it sits under has moved away from.
// Neither element moves the other on its own, and neither should. In a player the media is
// what sits between them — a seek sets `video.currentTime`, and it is `timeupdate` coming
// back that moves the bar. There is no video on this page, so this stands in for it.
const bar = document.querySelector(".scrubber progress-elemental");
const seek = document.querySelector(".scrubber input[type=range]");

seek.addEventListener("input", () => {
  bar.value = seek.value;
});
```

**Each element draws only what the other cannot**, which is the whole of the arrangement:

| Layer | Draws | Because |
| --- | --- | --- |
| `<slider-elemental>`, on top | the played part and the thumb | its fill has no transition, so it arrives *with* the thumb |
| `<progress-elemental>`, behind | the rail and the buffer | a slider has no second value, and no rail is wanted over the bar |

The fill has to be the slider's. A progress bar eases over `--progress-elemental-duration`,
which is right for a value arriving on its own and wrong under a thumb the reader is
holding — the bar would trail the drag by a quarter of a second, every drag. So the bar
gives up `--progress-elemental-fill` and the slider gives up `--slider-elemental-track`,
and neither draws the same pixel twice.

One `--slider-elemental-thumb-size` and one thickness drive both, which is what makes the
two layers one control: the slider is sized by the thumb and the bar is inset by half of
it, so the rail and the buffer behind cover exactly the stretch the fill in front travels.
Left to itself the bar would run the full width while the thumb travelled a half-thumb
short of each end — a gap at the start and another at the finish, visible only at the
extremes, which is where a scrubber spends its first and last second.

The `<progress>` is what a screen reader reads for position, the range input is what takes
the seeking, and neither is pretending to be the other. That is why the last fence exists
even now that the bar draws no position at all: **the two are not wired together by these
elements, and a page composing them has to say what connects them** — the media in a
player, three lines here. Leave it out and the announced position and the visible one part
company on the first drag.

## Degrading

Without the script there are no custom properties, so the theme draws nothing at all — that
is what the `:defined` it hangs off is for. What shows is the browser's own bar, with the
real value on it:

| State                     | What you get                                                   |
| ------------------------- | -------------------------------------------------------------- |
| No script, no theme       | The native `<progress>`, exactly as it was                     |
| No script, theme imported | The native `<progress>` again — the theme waits for `:defined` |
| Script, no theme          | The custom properties, and the native bar to draw with them    |
| Both                      | The bar above                                                  |

The one thing this deliberately does not do is draw a themed bar at zero over a
`<progress>` that knows the real answer. A bar frozen empty while a file uploads is worse
than an unstyled one.

## The look

`theme.scss` is optional and separate. It draws the track, the buffer and the fill on the
element itself, and flattens the native bar underneath so nothing is drawn twice — the
`<progress>` stays rendered, stays `role="progressbar"`, and paints nothing.

| Custom property                               | Default                                             | What it does                       |
| --------------------------------------------- | --------------------------------------------------- | ---------------------------------- |
| `--progress-elemental-height`                 | `0.5rem`                                            | Bar thickness                      |
| `--progress-elemental-radius`                 | `999px`                                             | Corners. A big number is a pill    |
| `--progress-elemental-track`                  | `color-mix(in srgb, currentcolor 15%, transparent)` | Behind everything                  |
| `--progress-elemental-fill`                   | `currentcolor`                                      | The value                          |
| `--progress-elemental-buffer-fill`            | `color-mix(in srgb, currentcolor 35%, transparent)` | The buffer, behind the value       |
| `--progress-elemental-duration`               | `250ms`                                             | How long the fill takes to move    |
| `--progress-elemental-easing`                 | `ease-out`                                          | How it moves                       |
| `--progress-elemental-indeterminate-duration` | `1.4s`                                              | One sweep, while there is no value |

The colours are mixed out of `currentcolor`, so the bar takes the page's palette with
nothing to configure. Give it a colour of its own where it means something:

```css
progress-elemental.upload {
  --progress-elemental-fill: seagreen;
  --progress-elemental-height: 0.75rem;
}
```

In forced-colors mode the fill is repainted in `Highlight`, the buffer in `GrayText` and
the track gets a `CanvasText` rim, because author backgrounds are dropped there and a bar
with none is not a bar.

## Naming it

The `<progress>` is the labelled thing, not the wrapper — a `<label>` on the element around
it names nothing:

```html
<label for="upload">Uploading</label>
<progress-elemental>
  <progress id="upload" value="35" max="100">35%</progress>
</progress-elemental>
```

The text between the tags is a fallback for browsers without `<progress>`, and
[not a name](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress).

## Progress, or a meter?

Different questions, and the wrong one is a bar that lies:

| You have                                                 | Use                                 | Why                                                           |
| -------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| A task getting done — upload, install, step 3 of 7       | `<progress-elemental>`              | It counts from zero towards finished, and finished means over |
| A measurement in a range — disk used, score, temperature | `<meter>`                           | It has a `min`, a `low` and a `high`, and it is never _done_  |
| A value the reader sets                                  | [`<slider-elemental>`](slider.html) | Progress is read, a slider is written                         |

There is no meter elemental, because `<meter>` needs nothing this one needed: it takes a
`min`, its own thresholds, and it is not something a page updates sixty times a second.

<script src="{{ relativePathPrefix }}dist/elementals/progress.js"></script>
<script src="{{ relativePathPrefix }}dist/elementals/slider.js"></script>
