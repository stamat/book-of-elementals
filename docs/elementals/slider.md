---
layout: poops-docs-theme/docs
title: Slider
description: One native range input is a slider, two are a range — the fill CSS cannot place on its own, and the clamping a second thumb needs.
order: 10
---

# `<slider-elemental>`

One `<input type="range">` inside it is a slider; two is a range, with a low thumb and a
high one that cannot pass each other. The thumbs stay native inputs, so the whole
[APG Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) is the browser's.
Light DOM, no shadow root, nothing moved or wrapped — the one thing it ever inserts is the
[value bubble](#the-value-bubble), and only where you asked for one.

<div class="demo-block" style="max-inline-size: 22rem">
  <span id="price-demo-label">Price</span>
  <slider-elemental aria-labelledby="price-demo-label" gap="50">
    <input type="range" aria-label="Lowest price" min="0" max="1000" step="10" value="200">
    <input type="range" aria-label="Highest price" min="0" max="1000" step="10" value="750">
  </slider-elemental>
</div>

```html
<span id="price-label">Price</span>
<slider-elemental aria-labelledby="price-label" gap="50">
  <input type="range" aria-label="Lowest price" min="0" max="1000" step="10" value="200" />
  <input type="range" aria-label="Highest price" min="0" max="1000" step="10" value="750" />
</slider-elemental>
```

## Usage

Write the range input you would have written anyway and wrap it. Write two and it becomes
a range — the thumb count is the markup, not an attribute. Inputs must be direct children;
nothing else is enforced. Edit the sample and the preview above it follows as you type —
add a second `<input type="range">` and watch it grow a thumb:

<!-- demo slider style="--code-preview-height:103px" -->

```html
<label for="volume">Volume</label>
<slider-elemental>
  <input type="range" id="volume" name="volume" min="0" max="100" value="40" />
  <output>40</output>
</slider-elemental>
```

```javascript
import "book-of-elementals/slider";
```

```scss
@use "book-of-elementals/slider/style.scss"; // structure
@use "book-of-elementals/slider/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/slider.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/slider.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/slider-theme.min.css"
/>
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

## What the element does, and what the browser does

Nearly all of it is the browser's, because the thumbs are real range inputs:

| Behaviour                                                            | Whose        |
| -------------------------------------------------------------------- | ------------ |
| Arrows, <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd> | the browser |
| Dragging a thumb, and touch                                           | the browser  |
| `step`, `min`, `max`, and snapping to them                            | the browser  |
| Announced as a slider, with its value                                 | the browser  |
| `name` submits, and `reset`, restore and `<fieldset disabled>`        | the browser  |
| Where the thumbs are, as something CSS can read                       | this element |
| Two thumbs sharing one track, and not passing each other              | this element |
| A press on the track, which stacking would otherwise eat              | this element |
| Keeping an `<output>` in step                                         | this element |
| The pointer value bubble, where `tooltip` asked for one               | this element |

So there is no `role="slider"` written here, no `aria-valuenow`, and no event of its own —
a range input fires `input` and `change`, and both bubble.

## API

### Attributes

| Attribute | Type   | Default | Description                                                              |
| --------- | ------ | ------- | ------------------------------------------------------------------------ |
| `gap`     | number | `0`     | Least distance between the two thumbs, in the scale's own units. Ignored with one thumb. |
| `tooltip` | token list | absent | A value bubble that follows the pointer. `thumb` over the thumb it is on, `track` for the value under it elsewhere, `thumb track` for both; a bare `tooltip` is `thumb`. [See below](#the-value-bubble) |

### What it writes on itself

| What                        | Value                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| `--slider-elemental-start`  | Where the low thumb is, `0` to `1`. Always `0` with one thumb                  |
| `--slider-elemental-end`    | Where the high — or only — thumb is, `0` to `1`                                |
| `data-stacked`              | `start` or `end` while the two are on the same value: which one is on top      |
| `role="group"`              | Two thumbs, and only if you gave it a name, [see below](#naming-it)            |

They are ratios rather than percentages, and that is the point —
[see below](#why-ratios-and-not-percentages).

With `tooltip` set there is one more thing, and it is the only markup this element ever
writes: an `<output aria-hidden="true" data-tooltip="thumb|track">` appended as the last
child, carrying `--slider-elemental-at` — where the bubble is, on that same `0` to `1`
scale. It goes again when the attribute does, or when the element leaves the page.

### Properties

| Property    | Type                   | Description                                                                   |
| ----------- | ---------------------- | ----------------------------------------------------------------------------- |
| `inputs`    | `HTMLInputElement[]`   | Read-only. The thumbs' inputs, in document order.                             |
| `outputs`   | `HTMLOutputElement[]`  | Read-only. The readouts, in document order, from anywhere inside — yours, never the `tooltip` bubble. |
| `gap`       | number                 | Get/set. Writes the attribute.                                                |
| `format`    | `?function`            | Get/set. What the `tooltip` bubble says — `(value, element)`, returning what lands in it. [See below](#saying-something-other-than-the-number) |
| `clamp(moved)` | —                   | Re-apply the gap after moving a value from script. `'start'` or `'end'` says which one gives way. |
| `apply()`   | —                      | Re-read the inputs. Call it after moving a value, `min` or `max` from script, or swapping an input out. |

### Events

None of its own. The inputs are native, so use `input` while dragging and `change` when it
settles — both fire on the input and bubble, which means one listener on the element, or on
the form, hears every thumb:

```javascript
const price = document.querySelector("slider-elemental");

price.addEventListener("input", (e) => e.target.value); // during the drag
price.addEventListener("change", (e) => e.target.value); // when it settles
```

The values are already clamped by the time either reaches you. The element listens in the
capture phase for exactly that reason: in the bubble phase your handler would run first and
read a value about to be taken back.

Moving a value from script fires nothing — that is the platform's rule for every form
control, not this element's. Call `apply()` after:

```javascript
price.inputs[1].value = 600;
price.apply();
```

The same call covers a scale that moved rather than a value: the fill is a ratio against
`min` and `max`, so a new `max` leaves every one of them stale even though no thumb was
touched. A media scrubber does both — `max` once the duration is known, then the value on
every tick — and the [media player example](../examples/media-player.html#a-value-written-from-script-has-to-say-so)
is that pair written out.

### Styling hooks

| Selector                                     | What it is                                     |
| -------------------------------------------- | ---------------------------------------------- |
| `slider-elemental`                            | The control. Track and fill are drawn on it    |
| `slider-elemental[data-stacked]`              | While both thumbs are on one value             |
| `slider-elemental:not(:defined)`              | Before the script has run, or without it       |
| `slider-elemental > input[type="range"]`      | A thumb's input                                |
| `slider-elemental:has(> input[type="range"] ~ input[type="range"])` | Two thumbs rather than one |
| `slider-elemental > output[data-tooltip]`     | The value bubble, showing or `hidden`          |
| `slider-elemental > output[data-tooltip="thumb"]` / `="track"` | Which of the two it is showing |

## One thumb, or two

Nothing configures this — the element counts its inputs:

```html
<!-- a slider -->
<slider-elemental>
  <input type="range" name="volume" min="0" max="100" value="40" />
</slider-elemental>

<!-- a range -->
<slider-elemental aria-label="Price">
  <input type="range" aria-label="Lowest" min="0" max="1000" step="10" value="200" />
  <input type="range" aria-label="Highest" min="0" max="1000" step="10" value="750" />
</slider-elemental>
```

Two thumbs share one scale, so both inputs need the same `min`, `max` and `step` — the
element reads them off the first, because two rulers drawn on top of each other is not a
control anyone can use. A third input still works as a plain range input; it is not clamped
and not drawn, because the fill is between the first two.

## Step, and how fast the keyboard moves

There is no `step` on this element, because there is one on the input already — it is the
native attribute, it is the browser that reads it, and a second name for it here would be a
second thing to keep in step:

```html
<slider-elemental aria-label="Price" gap="50">
  <input type="range" aria-label="Lowest" min="0" max="1000" step="10" value="200" />
  <input type="range" aria-label="Highest" min="0" max="1000" step="10" value="750" />
</slider-elemental>
```

It is worth setting, because the default is `1` and the keyboard is what pays for it — a
`0`–`1000` scale left at the default is a thousand presses of <kbd>→</kbd> to cross. The
browser gives you two gears and neither is this element's:

| Key                                         | Moves by                            | On `0`–`1000`      |
| ------------------------------------------- | ----------------------------------- | ------------------ |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | one `step`                  | `1`, or `10` above |
| <kbd>PageUp</kbd> <kbd>PageDown</kbd>       | a tenth of the range, whatever `step` says | `100`       |
| <kbd>Home</kbd> <kbd>End</kbd>              | to `min` or `max`                   | `0` / `1000`       |

Measured in Chromium and WebKit, which agree. The coarse gear is already there, so a step
is about the fine one: pick the smallest change that means anything on your scale — `10` on
a price in pounds, `1` on a percentage, `0.1` on a rating.

A `gap` that is not a whole number of steps still holds, because the thumb gives way to the
notch *past* where the gap lands rather than the nearest one. `step="10"` with `gap="25"`
opens to 30 rather than closing to 20: erring outwards costs at most one notch, and closing
in would be a gap you asked for and quietly did not get.

## The gap

`gap` is the least distance the two thumbs may be apart, in the scale's own units — `50` on
a `0`–`1000` price range is fifty pounds:

```html
<slider-elemental aria-label="Price" gap="50">
  <input type="range" aria-label="Lowest" min="0" max="1000" step="10" value="200" />
  <input type="range" aria-label="Highest" min="0" max="1000" step="10" value="750" />
</slider-elemental>
```

The thumb **being moved** is the one that gives way, so dragging the low thumb into the high
one stops it rather than shoving the high one along — a drag that changes a value nobody
touched is a drag that has misread the gesture. The exception is the ends, where it cannot:
drag the low thumb to the floor with a gap set and the high thumb is what moves, because
the alternative is a range that refuses to reach its own minimum.

With both thumbs on one value, one is exactly on top of the other and out of the pointer's
reach. `data-stacked` names the one that is lifted — the one with somewhere to go, which is
the low thumb at the maximum and the high thumb everywhere else. <kbd>Tab</kbd> reaches
either one regardless, which is why this decides the pointer only.

## The value readout

An `<output>` child is kept in step, matched to the input at the same index:

<!-- demo slider style="--code-preview-height:103px" -->

```html
<label for="quality">Quality</label>
<slider-elemental>
  <input type="range" id="quality" name="quality" min="1" max="10" value="7" />
  <output>7</output>
</slider-elemental>
```

No `<output>`, no readout — it costs nothing to leave out. The track is centred on the
thumbs rather than on the element, so a readout under the control, a caption, or a pair of
end labels makes the element taller without moving the track off the thumb it belongs to.

The element sets the `<output>`'s **text**, so put any decoration outside it rather than
inside, where it would be overwritten:

```html
<slider-elemental>
  <input type="range" min="0" max="1000" step="10" value="200" aria-label="Lowest" />
  <input type="range" min="0" max="1000" step="10" value="750" aria-label="Highest" />
  <p>£<output>200</output> to £<output>750</output></p>
</slider-elemental>
```

An `<output>` is a live region, so a screen reader announces it changing — which is one
announcement too many next to a slider that is already announcing its own value on every
arrow key. Add `aria-hidden="true"` where the readout is only there for the eye.

## The value bubble

**Read this first: it is a pointer, so a keyboard reader never sees it.** The bubble does not
follow focus and there is nothing in it a screen reader is not already told, so it is a hover
for a mouse and a press for a finger and nothing at all for <kbd>Tab</kbd>. That is why
nothing goes in here that is not somewhere else too. If the value has to be visible, that is
the `<output>` above, and the two compose.

`tooltip` turns it on. Drag the thumb, then run the pointer along the empty part of the
track — the number is what a press there would set:

<!-- demo slider style="--code-preview-height:153px" -->

```html
<label for="bitrate">Bitrate</label>
<slider-elemental tooltip="thumb track">
  <input type="range" id="bitrate" name="bitrate" min="0" max="320" step="16" value="192" />
</slider-elemental>
```

```css demo
/* Room for the bubble, which hangs above the control and outside its box */
body {
  padding-block-start: 4rem;
}
body > label {
  margin-block-end: 2rem;
}
```

**The bubble hangs outside the element's box**, a `--slider-elemental-tooltip-gap` above the
thumb, so it is drawn over whatever the page put above the control — the label in that
sample would be under it without the margin. Leave the room, or move the bubble with the
gap; it is not clipped and it does not push anything aside.

| Token | Where the bubble appears | What it says |
| --- | --- | --- |
| `thumb` | while the pointer is on a thumb, dragging included | that input's own `value` |
| `track` | while it is anywhere else on the control | the value a press there would set |
| `thumb track` | both | whichever of the two the pointer is over |
| bare `tooltip` | same as `thumb` | — |

**One bubble, not one per thumb.** A pointer is in one place at a time, so a second one
could only ever be a box stacked on the same spot the moment the pointer reached a thumb.
Which one is showing is on the bubble itself as `data-tooltip="thumb"` or `="track"`, so a
theme can tell them apart without the element writing two.

**A press pins it for the length of the drag.** Where the pointer is decides which bubble
you get — except while a thumb is being dragged, when it is the wrong question twice over: a
thumb snaps to notches while the pointer moves smoothly, so half a step out the pointer is
already beside the thumb it is holding, and dragged past either end it is off the control
altogether. So the press decides once and the release lets go. Without that, a drag across a
`step="16"` scale flips between the two readings on nearly every pointer move, showing a
number that disagrees with the thumb under it.

It follows the thumb off the control too — drag below the slider or past its end and the
bubble stays, reading the value the thumb is pinned at. It goes when you let go.

**On touch the press is the whole of it.** A finger is not a hover — it is on the glass only
while it presses — so the bubble is drawn on the press, carried by the drag, and taken away
by the release, wherever on the control the finger lifted. There is no resting pointer to
answer to afterwards, and a bubble left parked where a finger last was is the failure this
avoids. A fingertip covering the thumb is the one place the number is genuinely hard to read,
which is the case for drawing it there rather than against.

The track number is put on the `step` the way the input would put it — counted from `min`,
ties rounded up, and never past the last notch the scale actually has. `min="0" max="100"
step="40"` stops at 80, so that is what the bubble says at the far end rather than 100, which
the input cannot hold. Set `step="any"` and it is not rounded at all.

### Saying something other than the number

Some values are not readable as numbers. `72` on a media scrubber is `01:12`, `40` on a
price is `€40`, and neither is something an attribute could spell — which is why `format` is
a property holding a function rather than a token in the markup:

Run the pointer along this one — the track reads minutes and seconds, not `132`:

<!-- demo slider style="--code-preview-height:153px" -->

```html
<label for="seek">Seek</label>
<slider-elemental tooltip="thumb track" id="scrubber">
  <input type="range" id="seek" name="seek" min="0" max="600" step="1" value="132" />
</slider-elemental>
```

```js demo
const pad = (n) => String(n).padStart(2, '0');
document.getElementById('scrubber').format = (seconds) =>
  `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
```

```css demo
/* Room for the bubble, which hangs above the control and outside its box */
body {
  padding-block-start: 4rem;
}
body > label {
  margin-block-end: 2rem;
}
```

It is called as `(value, element)` on every draw, with the value as a **number**, and what
it returns is what lands in the bubble. Leave it unset and the bubble reads exactly as it
always did: the browser's own spelling of the value, which matters for a `step="0.10"` scale
where `3.10` is the input's answer and `3.1` is not. A formatter that returns nothing falls
back to that same spelling rather than emptying the bubble, because a function missing a
`return` should look like a function missing a `return` and not like a broken element.

**It does not change what is announced.** The bubble is `aria-hidden`; the input underneath
announces its own value, and a screen reader still hears the number. If the formatted
version is the one that matters to every reader, it belongs in an
[`<output>`](#the-value-readout) as well — where it is text on the page rather than a gesture.

### What it is not

| | |
| --- | --- |
| Not announced | `aria-hidden="true"`. The input under it announces its own value on every arrow key, and the same number twice is one announcement too many — [which is what Base UI does with its marks](https://v6.mui.com/base-ui/react-slider/) |
| Not left behind on touch | a finger has no resting state, so the press draws it and the release takes it away — there is no tap-to-pin |
| Not shown on focus | a keyboard reader hears the value already; a bubble that appeared on <kbd>Tab</kbd> would be a second copy of it, drawn |
| Not formatted by default | the raw value, like the `<output>`, until you set [`format`](#saying-something-other-than-the-number) |
| Not always on | there is no "pinned" mode. [noUiSlider's `tooltips: true`](https://refreshless.com/nouislider/slider-options/) and [MUI's `valueLabelDisplay="on"`](https://mui.com/material-ui/react-slider/) both have one; here that is an `<output>` positioned with `--slider-elemental-end`, and no attribute |

## Naming it

Each input is a slider in its own right and needs its own name. The element does not invent
one, because a name it guessed would be in the wrong language on most of the pages that use
it:

```html
<!-- one thumb: a <label> is enough, and it is the input that is labelled -->
<label for="volume">Volume</label>
<slider-elemental>
  <input type="range" id="volume" name="volume" min="0" max="100" value="40" />
</slider-elemental>

<!-- two: one name for the pair, one for each end -->
<span id="price-label">Price</span>
<slider-elemental aria-labelledby="price-label">
  <input type="range" aria-label="Lowest price" min="0" max="1000" step="10" value="200" />
  <input type="range" aria-label="Highest price" min="0" max="1000" step="10" value="750" />
</slider-elemental>
```

`role="group"` is written only where the element carries an `aria-label` or
`aria-labelledby`, and only with two thumbs. An `aria-label` on an element with no role is
read by nothing at all, and adding a role to an unnamed group is a wrapper announced for no
reason — so both halves have to be there or neither is.

## In a form

Nothing to do. Each input submits under its own `name`, exactly as it would unwrapped:

```html
<form>
  <slider-elemental aria-label="Price" gap="50">
    <input type="range" name="min" aria-label="Lowest" min="0" max="1000" step="10" value="200" />
    <input type="range" name="max" aria-label="Highest" min="0" max="1000" step="10" value="750" />
  </slider-elemental>
</form>
```

`reset` puts both back and the fill follows; a back-navigation restores them and the fill
follows there too, on `pageshow`. A `<fieldset disabled>` takes the pair with it, because
it takes the inputs with it.

## Why ratios and not percentages

A range input's thumb does not travel the full width of the control. Its centre starts half
a thumb in and stops half a thumb short, so a fill placed at `45%` of the width sits next to
a thumb that is not at 45% of the width — the misalignment nearly every two-input slider on
the web has at its ends. Handing CSS a ratio instead of a percentage is what lets the
stylesheet do the arithmetic that fixes it:

```css
slider-elemental::after {
  inset-inline-start: calc(
    var(--slider-elemental-start) * (100% - var(--slider-elemental-thumb-size)) +
      var(--slider-elemental-thumb-size) / 2
  );
  inline-size: calc(
    (var(--slider-elemental-end) - var(--slider-elemental-start)) *
      (100% - var(--slider-elemental-thumb-size))
  );
}
```

That is the theme's own fill rule, and `--slider-elemental-at` on the
[value bubble](#the-value-bubble) is spent the same way. Draw something else along the track
— a tick, a label pinned over a thumb — with the same two lines and it lands on the thumb
rather than near it.

## What is not written, and why

The [multi-thumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/) asks
that a dependent thumb's `aria-valuemin` / `aria-valuemax` be updated as the other one
moves. They are not written here, for two reasons:

- The pattern is written for `div[role="slider"]`. These are stacked native inputs sharing
  a track, and pulling the low input's `max` down to the high one's value would rescale it
  — every pixel on that input would then mean a different value from the same pixel on the
  other, and the two thumbs would stop agreeing about where anything is.
- [HTML-ARIA says authors should not put `aria-valuemin` or `aria-valuemax` on
  `input type=range`](https://www.w3.org/TR/html-aria/) at all. The browser computes both
  from `min`, `max` and `value`, and an author's copy can only disagree with it.

What a screen reader hears instead is the clamp: press <kbd>→</kbd> on the low thumb once
it has reached the high one and the value does not change, which is what the thumb does
visually too.

## Limits

Named rather than worked around:

| Limit                                              | Why, and what to do                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| A press on the track jumps the nearer thumb but does not carry on into a drag | Two stacked inputs need their pointer events on the thumbs, so the track press is the element's rather than the input's — and the input never learns it happened. Grab the thumb to drag |
| Two thumbs, not N                                  | The clamp is a pair. Three inputs still work as plain range inputs, unclamped and undrawn |
| Horizontal only                                    | `writing-mode: vertical-lr` on the input is the platform's answer for one thumb; the stacking here has not been built for it |
| `tooltip` is pointer-only, and there is no pinned mode | A keyboard reader never sees it, and a touch reader only while pressing, so nothing goes in it that is not elsewhere too. Pin a value with an `<output>` placed on `--slider-elemental-end` |
| The bubble is centred on the thumb and is not clamped to anything | At either end the thumb's centre is half a thumb from the edge, so a bubble wider than that hangs past the control — and past whatever box the control is in. Nothing here measures the bubble, so nothing can pull it back. Leave room at the ends, or keep `tooltip` off the slider that sits against an edge |
| The gap is measured from the slider, not from what it is inside | `--slider-elemental-tooltip-gap` is the distance above this element's box. A slider inside a padded, bordered bar wants the bar's padding and border added to it, or the bubble lands on the bar's own top edge |
| The buffer-style second bar is not here            | That is [`<progress-elemental>`](progress.html), and the two compose — see [the scrubber](progress.html#a-scrubber) |

## Degrading

Without the script there are no ratios, so the theme draws nothing at all — that is what
the `:defined` it hangs off is for. With `style.scss` loaded either way:

| State                     | One thumb                                | Two thumbs                                                       |
| ------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| No script, no theme       | The native slider, untouched             | Stacked and both grabbable, on no track, and free to pass each other |
| No script, theme imported | The native slider again                  | The same — the theme waits for `:defined`                         |
| Script, no theme          | Native, plus the ratios and the readout  | The same, now clamped, with the ratios written                    |
| Both                      | The control above                        | The control above                                                 |

The one thing that never happens is the theme drawing a track with the fill parked at zero
while the browser has put the thumb somewhere else.

`tooltip` degrades to nothing in the honest sense: no script, no bubble, and no gap in the
page where one was going to be — the element writes it, so it is simply never there. With
the script but no theme it is placed over the thumb by `style.scss` and painted by nothing,
which is a bare number rather than a bubble, because a number landing in the middle of the
layout would be worse than an unstyled one.

The two things that are not optional are in `style.scss` rather than the theme: with two
thumbs, the stacking and the pointer routing that makes both of them grabbable. A thumb
that cannot be reached is broken rather than unstyled, and the theme is the part that may
be skipped.

## The look

`theme.scss` is optional and separate. It draws the track and the fill on the element and
takes the native track away, including Firefox's `::-moz-range-progress`, which is the one
engine that fills the track on its own and would otherwise draw a second fill from the
start.

The rail is half a thumb short at each end, because that is where the thumb's centre starts
and stops. A rail run the full width has a stretch at each end the thumb can never reach —
a gap before zero and another past the maximum — and at those two values the fill and the
rail disagree about where the track begins. The thumb overhangs the rail by half its own
width at both extremes, which is what the inset buys.

That is also the one way to get this wrong: resize the thumb through
`--slider-elemental-thumb-size` and everything follows, but resize it by writing
`::-webkit-slider-thumb { inline-size: … }` yourself and the rail is still inset for the
old size, so the gaps come back at whatever the difference is.

**A thumb pseudo-element does not see the page's `color`.** The browser gives the control
one of its own, so `currentcolor` written inside a `::-webkit-slider-thumb` or
`::-moz-range-thumb` rule resolves to that rather than to the text around it — white in
Chromium whatever the page says, mid grey in WebKit, and the author's colour in neither.
The theme names the colour on the **input** instead, and the thumb rules paint in
`currentcolor` from there:

```css
slider-elemental > input[type="range"] {
  color: var(--slider-elemental-thumb);
}
slider-elemental > input[type="range"]::-webkit-slider-thumb {
  background: currentcolor;
}
```

Worth knowing if you write your own thumb rule: paint it in `currentcolor` and set `color`
on the input, or hand it a literal colour. A bare `currentcolor` on the thumb is the one
that silently draws something else.

| Custom property                    | Default                                              | What it does                                        |
| ---------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `--slider-elemental-thumb-size`    | `1rem`                                               | Thumb width and height. Also the control's height, what the fill is inset by, and the strip the track is centred on |
| `--slider-elemental-track-size`    | `0.375rem`                                           | Track thickness                                     |
| `--slider-elemental-radius`        | `999px`                                              | Track corners. A big number is a pill               |
| `--slider-elemental-thumb-radius`  | `50%`                                                | Thumb shape. `50%` is a circle, `0` a square        |
| `--slider-elemental-track`         | `color-mix(in srgb, currentcolor 20%, transparent)`  | Outside the selection                               |
| `--slider-elemental-fill`          | `currentcolor`                                       | Inside it                                           |
| `--slider-elemental-thumb`         | `var(--slider-elemental-fill)`                       | Thumb fill. Follows the selection unless you set it |
| `--slider-elemental-focus-width`   | `3px`                                                | Ring around a focused thumb                         |
| `--slider-elemental-focus-color`   | `color-mix(in srgb, currentcolor 35%, transparent)`  | Ring colour                                         |
| `--slider-elemental-tooltip-gap`   | `0.375rem`                                           | Between the thumb and the bubble above it           |
| `--slider-elemental-tooltip-padding-block` | `0.25em`                                     | Above and below the number in it                    |
| `--slider-elemental-tooltip-padding-inline` | `0.5em`                                     | Either side of it                                   |
| `--slider-elemental-tooltip-radius` | `6px`                                               | The bubble's corners                                |
| `--slider-elemental-tooltip-surface` | `CanvasText`                                       | What the bubble is painted in                       |
| `--slider-elemental-tooltip-color` | `Canvas`                                             | The number on it                                    |

The colours are mixed out of `currentcolor`, so the control takes the page's palette with
nothing to configure:

```css
slider-elemental.brand {
  --slider-elemental-fill: rebeccapurple;
  --slider-elemental-thumb-size: 1.25rem;
}
```

The thumb comes with it — it defaults to `var(--slider-elemental-fill)`, because the thumb
is the end of the selection and the two are one thing to look at. Set
`--slider-elemental-thumb` where it has to differ; forced-colors mode does exactly that, so
a `Highlight` thumb is not lost on a `Highlight` track.

**Hiding the fill hides the thumb with it.** `--slider-elemental-fill: transparent` is a
real thing to write — a slider drawn over something else that is already showing the
selection — and there the thumb has to be named back on the same rule, or the control loses
the one part you still have to grab:

```css
.slider-over-something {
  --slider-elemental-fill: transparent;
  --slider-elemental-thumb: currentcolor;
}
```

A `var()` fallback cannot catch this, because a fallback fires on a property that is
*unset* and `transparent` is a value like any other.

The focus ring is a spread `box-shadow` on the thumb rather than an `outline` on the input,
because an outline on the input is a rectangle around the whole track and the thing that
took focus is one thumb on it. In forced-colors mode, where shadows are dropped, it goes
back to being an outline and the fill is repainted in `Highlight`.

The value bubble is the one part that does not mix out of `currentcolor` — it takes
`CanvasText` on `Canvas`, the page's own two extremes swapped, because it hangs above the
control over content this element knows nothing about and has to be legible on all of it.
That also means it follows a light/dark switch with nothing to configure. In forced-colors
mode it turns the right way up and grows a `CanvasText` rim, since a box painted in the
mode's text colour is a solid block where the mode expects a page.

## Slider, or something else?

| You have                                     | Use                                     | Why                                                          |
| -------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| A value the reader sets along a range         | `<slider-elemental>`                    | One thumb                                                    |
| A span the reader sets — price, dates, sizes  | `<slider-elemental>`, two inputs        | Two thumbs that cannot cross                                 |
| A value the reader watches                    | [`<progress-elemental>`](progress.html) | Progress is read, a slider is written                        |
| A few discrete choices                        | [`<segmented-elemental>`](segmented.html) | Radios name their options; a slider makes you count notches |
| An exact number                               | `<input type="number">`                 | A slider is for _about here_, and a spinner is for `1247`     |

<script src="{{ relativePathPrefix }}dist/elementals/slider.js"></script>
