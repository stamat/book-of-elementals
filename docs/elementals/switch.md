---
layout: poops-docs-theme/docs
title: Switch
description: An on/off setting that takes effect the moment you flip it — the APG Switch pattern on a real button.
order: 3
---

# `<switch-elemental>`

A button that flips between on and off, per the
[APG Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

<p class="demo-row">
  <span id="switch-demo-label">Dark mode</span>
  <switch-elemental>
    <button aria-labelledby="switch-demo-label">
      <span class="switch-elemental-off" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z" fill="currentColor"/></svg></span>
      <span class="switch-elemental-on" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z" fill="currentColor"/></svg></span>
    </button>
  </switch-elemental>
</p>

## Switch or checkbox?

They are the same boolean wearing different promises, and the difference is when it
takes effect:

- A **checkbox** is a value you are _about to submit_. Nothing happens until you press
  the button at the bottom of the form. It also has a third, indeterminate state.
- A **switch** is a setting that takes effect the moment you flip it. A theme toggle, a
  mute, autoplay, notifications. There is no submit, no cancel, and no third state.

If the setting lives in a form and you do not need the look, the platform already has it
and it needs no JavaScript at all:

```html
<label> <input type="checkbox" role="switch" name="autoplay" /> Autoplay </label>
```

That submits, resets, restores on back-navigation and derives `aria-checked` from
`checked` on its own — and being a real form control, it also gets `<label>`. It is the
better answer whenever it is enough, because it keeps working with scripting off.

This element still [submits with a form](#in-a-form) when you give it a `name`, so you do
not have to choose between the look and the form data. The look styles either one — see
[The look](#the-look).

## Usage

Write a `<button>` and wrap it:

```html
<span id="dark-label">Dark mode</span>
<switch-elemental>
  <button aria-labelledby="dark-label"></button>
</switch-elemental>
```

```javascript
import "book-of-elementals/switch";
```

```scss
@use "book-of-elementals/switch/style.scss";
```

Or drop in the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/switch.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/switch.min.css"
/>
```

The element registers itself on include and upgrades on connect. Nothing is put on
`window`, there is nothing to instantiate, and there is no initialisation call to
forget. That stylesheet carries structure only; the look is a separate, optional one.

It writes `role="switch"` and `aria-checked` onto the button, and that is the whole of
the ARIA. Nothing is wrapped, nothing is moved.

> [!NOTE]
> The trigger must be a real `<button>` and a direct child of the element. A
> `<div role="switch" tabindex="0">` would mean reimplementing Enter, Space and the
> disabled state the platform hands you. It is not a rule the element enforces, because
> without a button there is simply no switch.

## The label

A switch needs an accessible name, and the APG's own examples put it _outside_ the
control. Three ways, in order of preference:

```html
<!-- 1. A visible label beside it, referenced by id -->
<span id="dark-label">Dark mode</span>
<switch-elemental><button aria-labelledby="dark-label"></button></switch-elemental>

<!-- 2. No visible label — the name is the button's own text -->
<switch-elemental><button>Dark mode</button></switch-elemental>

<!-- 3. Icon-only, where the surrounding UI makes it obvious -->
<switch-elemental><button aria-label="Dark mode"></button></switch-elemental>
```

The name is the _thing being switched_ — "Dark mode" — and never the state. "On", "Off"
and "Enabled" are what `aria-checked` already announces, and a label that changes with
the state gives a screen reader user two contradicting halves of the same sentence.

`<label>` is not one of the options: it only binds to form controls, and a `<button>` is
not one. That is the second reason to reach for `<input type="checkbox" role="switch">`
when the setting is in a form — the native label association comes with it.

## Keyboard

All of it is the button's, which is the point of using one:

| Key                                 | Action           |
| ----------------------------------- | ---------------- |
| <kbd>Tab</kbd>                      | Move to it       |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Flip it          |

The APG requires <kbd>Space</kbd> and lists <kbd>Enter</kbd> as optional. A `<button>`
gives you both, along with the focus ring, the disabled state and the click target,
none of which is written here.

## State

`checked` is the single source of truth and it is reflected, so it works from markup,
from script and from CSS:

```html
<switch-elemental checked>…</switch-elemental>
```

```javascript
const toggle = document.querySelector("switch-elemental");
toggle.checked = true;
toggle.checked; // false once the reader flips it back
```

```css
switch-elemental[checked] .something {
  /* … */
}
```

Everything that changes it — a click, a script, a boot script stamping a saved
preference — goes through the attribute, so there is one place the state can be read and
one place it can be watched. `aria-checked` on the button is written _from_ it and is
never the thing you set.

## Events

`switch-toggle` fires on the element whenever the state changes, and bubbles:

```javascript
document
  .querySelector("switch-elemental")
  .addEventListener("switch-toggle", (e) => {
    console.log(e.detail.checked);
  });
```

| Property       | Value                |
| -------------- | -------------------- |
| `detail.checked` | The new state, as a boolean |

## A theme toggle

The switch a switch most often is. The trick is that the page's look must not wait for
the element to upgrade, or the page paints in the wrong theme and then corrects itself:

```html
<!-- in <head>, before any CSS: stamp the saved theme before first paint -->
<script>
  (function () {
    var t = localStorage.getItem("theme");
    if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = t;
  })();
</script>
```

```javascript
const toggle = document.querySelector("switch-elemental");
const root = document.documentElement;

// The document is what already knows the theme, so the switch takes its
// starting state from it rather than the other way round.
toggle.checked = root.dataset.theme === "dark";

toggle.addEventListener("switch-toggle", (e) => {
  root.dataset.theme = e.detail.checked ? "dark" : "light";
  localStorage.setItem("theme", root.dataset.theme);
});
```

Set `checked` before the bundle loads and it is still right: the element reads the
attribute on upgrade, and the flash was never possible because the boot script above
had already stamped `[data-theme]`.

## In a form

Give it a `name` and it submits with its form, exactly as a checkbox does — the value
when it is on, and nothing at all when it is off:

```html
<form>
  <switch-elemental name="autoplay"><button aria-label="Autoplay"></button></switch-elemental>
  <switch-elemental name="tier" value="pro" checked>
    <button aria-label="Pro"></button>
  </switch-elemental>
</form>
```

```javascript
new FormData(form); // tier=pro   — autoplay is off, so it is simply absent
```

That absence is the point: it is what a checkbox does, and what every server-side "was
this ticked" check is already written against. `value` defaults to `on`, as a checkbox's
does.

Form **reset** puts it back to the state its markup arrived in, and **back-navigation**
restores whatever the reader left it at. Neither is wired up here — the element is
form-associated through
[`ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals),
so the platform owns submission, reset and restore, the same three it owns for a real
checkbox.

There is deliberately no hidden `<input>` mirroring the state. A second node holding the
same boolean is a second node that can disagree with the first, and it would still leave
reset and restore to be hand-written.

> [!NOTE]
> `attachInternals` is the one part of this element that is not everywhere — Safari only
> got it in 16.4. Without it the switch is a switch that does not submit, which is what
> it was before it had a name to submit under. Nothing else about it changes.

## Attributes

| Attribute | Type    | Default | Description                                              |
| --------- | ------- | ------- | -------------------------------------------------------- |
| `checked` | boolean | `false` | Whether the switch is on. Reflected — it tracks the live state. |
| `name`    | string  | —       | Submits under this name. No name, no form data.          |
| `value`   | string  | `on`    | What it submits while on.                                |

## What it writes

| Attribute      | On         | Value                                          |
| -------------- | ---------- | ---------------------------------------------- |
| `role`         | the button | `switch`                                       |
| `aria-checked` | the button | `true` / `false`                               |
| `type`         | the button | `button`, only if the markup did not set a type |

`type="button"` because a `<button>` in a form submits it unless told otherwise, and a
setting that posts the page away on its first flip is not a setting.

## Without JavaScript

The button is hidden until the element upgrades:

```css
/* in the element's own stylesheet */
switch-elemental:not(:defined) > button {
  display: none;
}
```

A switch that silently does not switch is worse than no switch at all. If the setting has
to survive scripting being off, use `<input type="checkbox" role="switch">`, which needs
no script in the first place — that is true even of the form case above, since an element
that never upgrades never sets a form value either.

## The look

The element's own stylesheet styles structure only — a light-DOM element cannot scope a
look away from a page that did not ask for one. The look is a second, optional
stylesheet:

```scss
@use "book-of-elementals/switch/style.scss"; // structure
@use "book-of-elementals/switch/theme.scss"; // the look, entirely optional
```

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/switch.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/switch-theme.min.css"
/>
```

A pill with a knob that slides. Off, the track is empty and the knob is the only ink;
on, they swap — the track fills with the text color and the knob drops out of it. Two
states told apart by fill as well as by position, because position alone is the one cue
a reader who has never seen the switch in its other state cannot read. Everything is
mixed out of `currentcolor`, so it sits in whatever palette the page already has,
including the theme it is switching.

| Property                            | Default        | Description                              |
| ----------------------------------- | -------------- | ---------------------------------------- |
| `--switch-elemental-width`          | `3.625rem`     | Track width                              |
| `--switch-elemental-height`         | `2rem`         | Track height; also the pill's radius     |
| `--switch-elemental-border-width`   | `2px`          | Track border                             |
| `--switch-elemental-border-color`   | `currentcolor` | Track border                             |
| `--switch-elemental-gap`            | `2px`          | Between the knob and the inside of the track |
| `--switch-elemental-track`          | `transparent`  | Track fill, off                          |
| `--switch-elemental-track-checked`  | `currentcolor` | Track fill, on                           |
| `--switch-elemental-knob`           | `currentcolor` | Knob fill, off                           |
| `--switch-elemental-knob-checked`   | `Canvas`       | Knob fill, on                            |
| `--switch-elemental-duration`       | `250ms`        | Slide and cross-fade                     |
| `--switch-elemental-easing`         | `ease-in-out`  | Slide and cross-fade                     |

`prefers-reduced-motion: reduce` switches the motion off. Under `forced-colors` the
track and knob are repainted in system colors — they are the whole control, and author
backgrounds do not survive that mode.

### Size

The knob's size and travel are derived from the width, the height, the border and the
gap, so resizing is two properties rather than five that have to agree with each other.
One preset ships, because "the same switch but smaller" is a size rather than a look and
there is nothing to design about it:

<div class="demo-sizes">
  <switch-elemental checked><button aria-label="Default size"></button></switch-elemental>
  <switch-elemental class="switch-elemental-small" checked><button aria-label="Small"></button></switch-elemental>
</div>

```html
<switch-elemental class="switch-elemental-small">…</switch-elemental>
```

```css
/* which is only this, so any other size is the same two lines */
switch-elemental.switch-elemental-small {
  --switch-elemental-width: 2.75rem;
  --switch-elemental-height: 1.5rem;
}
```

Icons are your own SVGs at your own size, so size them down too if you use them at the
small one.

### Other looks

The shipped look is one arrangement of those properties, not the only one. These are the
ones worth knowing, because each answers a different question — and the last two answer
one the default cannot.

<table class="demo-looks">
  <thead>
    <tr><th>Look</th><th>Off</th><th>On</th><th>What it is for</th></tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Default</th>
      <td><switch-elemental><button aria-label="Default, off"></button></switch-elemental></td>
      <td><switch-elemental checked><button aria-label="Default, on"></button></switch-elemental></td>
      <td>Monochrome, highest contrast between the two states.</td>
    </tr>
    <tr>
      <th scope="row">Hairline</th>
      <td><switch-elemental class="look-hairline"><button aria-label="Hairline, off"></button></switch-elemental></td>
      <td><switch-elemental class="look-hairline" checked><button aria-label="Hairline, on"></button></switch-elemental></td>
      <td>The same at <code>1px</code>, for lighter chrome.</td>
    </tr>
    <tr>
      <th scope="row">Accent</th>
      <td><switch-elemental class="look-accent"><button aria-label="Accent, off"></button></switch-elemental></td>
      <td><switch-elemental class="look-accent" checked><button aria-label="Accent, on"></button></switch-elemental></td>
      <td>Colour-codes the on state. One literal colour in an otherwise <code>currentcolor</code> theme.</td>
    </tr>
    <tr>
      <th scope="row">Wash</th>
      <td><switch-elemental class="look-wash"><button aria-label="Wash, off"></button></switch-elemental></td>
      <td><switch-elemental class="look-wash" checked><button aria-label="Wash, on"></button></switch-elemental></td>
      <td>Knob stays ink, track only tints. Never needs to know the background — see below.</td>
    </tr>
    <tr>
      <th scope="row">Outline</th>
      <td><switch-elemental class="look-outline"><button aria-label="Outline, off"></button></switch-elemental></td>
      <td><switch-elemental class="look-outline" checked><button aria-label="Outline, on"></button></switch-elemental></td>
      <td>Quietest. Position is the only cue, which is the one cue some readers cannot use.</td>
    </tr>
  </tbody>
</table>

```css
.hairline {
  --switch-elemental-border-width: 1px;
}

.accent {
  --switch-elemental-border-width: 1px;
  --switch-elemental-border-color: color-mix(in srgb, currentcolor 30%, transparent);
  --switch-elemental-track-checked: var(--brand);
  --switch-elemental-knob-checked: var(--brand-contrast);
}

.wash {
  --switch-elemental-border-color: color-mix(in srgb, currentcolor 35%, transparent);
  --switch-elemental-track-checked: color-mix(in srgb, currentcolor 22%, transparent);
  --switch-elemental-knob-checked: currentcolor;
}

.outline {
  --switch-elemental-track-checked: transparent;
  --switch-elemental-knob-checked: currentcolor;
}
```

> [!NOTE]
> Those classes go **on the `<switch-elemental>`**, not on a wrapper around it. The theme
> sets its defaults on the element itself, and a custom property set on an element always
> beats one inherited from an ancestor, however specific that ancestor's selector is — so
> `.settings-panel { --switch-elemental-track-checked: … }` silently does nothing.
> Anything that reaches the element works: a class on it, `.card switch-elemental`, or
> `switch-elemental` itself.

### About that `Canvas`

`--switch-elemental-knob-checked` defaults to `Canvas`, the page's own background, which
is what a knob dropped out of a filled track should be. It is the one value in the theme
that has to know something about its surroundings, so it is the one to re-point when
they are not what it assumes:

```css
/* on a card rather than on the page */
.card switch-elemental {
  --switch-elemental-knob-checked: var(--card-background);
}
```

Worth knowing about the second case: a page that themes in custom properties **without
also declaring `color-scheme`** keeps a white `Canvas` in dark mode, so the knob thins
out against the track. Either declare it —

```css
:root[data-theme="dark"] {
  color-scheme: dark;
}
```

— or point the property at the background you already have, or use the **wash** look
above, which never fills the track solid and so never has to drop the knob out of
anything.

### Icons

Optional, and the reason the button may have children at all: one icon per state, each
in the half the knob is not in. The knob covers one end, so the icon that shows is
always the one at the other:

```html
<switch-elemental>
  <button aria-label="Dark mode">
    <span class="switch-elemental-off" aria-hidden="true">
      <svg …><!-- sun --></svg>
    </span>
    <span class="switch-elemental-on" aria-hidden="true">
      <svg …><!-- moon --></svg>
    </span>
  </button>
</switch-elemental>
```

`aria-hidden` on both, because they are the state twice over — `aria-checked` has
already said it, and the label says what is being switched. Each icon takes the knob
color of the state it belongs to, so draw them in `currentColor` and they follow.

### On a checkbox instead

The theme keys off `[aria-checked="true"]`, which a native
`<input type="checkbox" role="switch">` sets for itself — but only in the accessibility
tree, not as an attribute CSS can see. One extra selector covers it:

```css
switch-elemental > button,
input[type="checkbox"][role="switch"] {
  /* … the track rules … */
}

input[type="checkbox"][role="switch"]:checked {
  /* … what [aria-checked="true"] does … */
}
```

Not shipped, because it is a second copy of every rule for a control that is already
the platform's. Two selectors in your own stylesheet if you want both looks to match.

## The element's box

`<switch-elemental>` is `display: contents`. A switch is usually a flex or grid item
sitting next to its label, and an extra box in between is a box the parent lays out
instead of the button. Dropping the element around an existing button therefore changes
no layout at all.

Give it a box in your own CSS if you want something to style:

```css
switch-elemental {
  display: block;
}
```

<script src="{{ relativePathPrefix }}dist/elementals/switch.js"></script>
