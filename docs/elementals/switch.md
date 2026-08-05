---
layout: poops-docs-theme/docs
title: Switch
description: An on/off setting that takes effect the moment you flip it — the APG Switch pattern on a real button.
order: 9
---

# `<switch-elemental>`

A `<button>` that flips between on and off, per the
[APG Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/). Light DOM, no
shadow root, form-associated, nothing moved or wrapped.

<p class="demo-row">
  <span id="switch-theme-label">Dark mode</span>
  <switch-elemental id="switch-theme-demo">
    <button aria-labelledby="switch-theme-label">
      <span class="switch-elemental-off" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z" fill="currentColor"/></svg></span>
      <span class="switch-elemental-on" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z" fill="currentColor"/></svg></span>
    </button>
  </switch-elemental>
  <span class="demo-state" aria-hidden="true"><span class="on">On</span><span class="off">Off</span></span>
</p>

```html
<span id="switch-theme-label">Dark mode</span>
<switch-elemental id="switch-theme-demo">
  <button aria-labelledby="switch-theme-label">
    <span class="switch-elemental-off" aria-hidden="true"
      ><svg><!-- ... --></svg></span
    >
    <span class="switch-elemental-on" aria-hidden="true"
      ><svg><!-- ... --></svg></span
    >
  </button>
</switch-elemental>
<span class="demo-state" aria-hidden="true"
  ><span class="on">On</span><span class="off">Off</span></span
>
```

```javascript
const toggle = document.getElementById("switch-theme-demo");
const root = document.documentElement;
if (!toggle) return;
// The label does not move - only [checked] does, and the state text keys off it.
const sync = () => {
  toggle.checked = root.dataset.theme === "dark";
};
toggle.addEventListener("switch-toggle", (e) => {
  root.dataset.theme = e.detail.checked ? "dark" : "light";
  try {
    localStorage.setItem("theme", root.dataset.theme);
  } catch (err) {}
  sync();
});
new MutationObserver(sync).observe(root, { attributeFilter: ["data-theme"] });
sync();
```

## Usage

Write a `<button>` and wrap it. The button must be a real `<button>` and a direct child —
without one there is no switch, and nothing is enforced beyond that. Edit the sample and
the preview above it follows as you type; take the `<button>` out and watch it stop being
a switch:

<!-- demo switch -->

```html
<span id="dark-label">Dark mode</span>
<switch-elemental checked>
  <button aria-labelledby="dark-label"></button>
</switch-elemental>
```

```javascript
import "book-of-elementals/switch";
```

```scss
@use "book-of-elementals/switch/style.scss"; // structure
@use "book-of-elementals/switch/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/switch.min.js"></script>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/switch.min.css"
/>
<link
  rel="stylesheet"
  href="https://unpkg.com/book-of-elementals/dist/elementals/switch-theme.min.css"
/>
```

It registers itself on include and upgrades on connect. Nothing on `window`, nothing to
instantiate, no init call to forget.

## API

### Attributes

| Attribute          | Type    | Default | Description                                                                     |
| ------------------ | ------- | ------- | ------------------------------------------------------------------------------- |
| `checked`          | boolean | `false` | Whether it is on. Reflected — markup, script and CSS read the same thing.       |
| `name`             | string  | —       | Submits under this name. No name, no form data.                                 |
| `value`            | string  | `on`    | What it submits while on.                                                       |
| `disabled`         | boolean | `false` | Disables the button and submits nothing. A `<fieldset disabled>` does the same. |
| `required`         | boolean | `false` | The form will not submit while it is off.                                       |
| `required-message` | string  | —       | What this one says while it is required and off.                                |

### Properties

| Property                                                        | Type                | Description                                                           |
| --------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `checked`                                                       | boolean             | Get/set the state. Writes the attribute.                              |
| `value`                                                         | string              | Get/set the submitted value.                                          |
| `disabled`                                                      | boolean             | Get/set. Reads `true` for a fieldset-disabled switch too.             |
| `required`                                                      | boolean             | Get/set.                                                              |
| `requiredMessage`                                               | string              | The message in force: attribute, then the static, then the browser's. |
| `button`                                                        | `HTMLButtonElement` | Read-only. The direct-child button.                                   |
| `defaultChecked`                                                | boolean             | What a form reset goes back to. Read at upgrade.                      |
| `validity`, `validationMessage`, `willValidate`                 | —                   | Read-only, the platform's.                                            |
| `checkValidity()`, `reportValidity()`, `setCustomValidity(msg)` | —                   | The platform's, [see below](#validation).                             |

### Events

`switch-toggle` fires on the element on every state change — click, script, or attribute —
and bubbles:

```javascript
const toggle = document.querySelector("switch-elemental");

toggle.addEventListener("switch-toggle", (e) => e.detail.checked);

toggle.checked = true; // also fires it
```

| Property         | Value                       |
| ---------------- | --------------------------- |
| `detail.checked` | The new state, as a boolean |

There is no `change` event: the control is a `<button>`, so the platform never fires one.

### What it writes on the button

| Attribute      | Value                                           |
| -------------- | ----------------------------------------------- |
| `role`         | `switch`                                        |
| `aria-checked` | `true` / `false`, written from `checked`        |
| `type`         | `button`, only if the markup did not set a type |

`type="button"` because a `<button>` in a form submits it unless told otherwise, and a
setting that posts the page away on its first flip is not a setting.

### Keyboard

All of it is the button's, which is the point of using one:

| Key                                 | Action     |
| ----------------------------------- | ---------- |
| <kbd>Tab</kbd>                      | Move to it |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Flip it    |

### Styling hooks

```css
switch-elemental[checked] {
} /* the host, reflected state */
switch-elemental > button[aria-checked="true"] {
} /* what the theme keys off */
switch-elemental > button:disabled {
} /* own, host's, or a fieldset's */
switch-elemental:not(:defined) {
} /* before upgrade */
```

## The label

The name comes from outside the control, as it does in the APG's own examples. Three
ways, in order of preference:

```html
<!-- 1. Visible label beside it, referenced by id -->
<span id="dark-label">Dark mode</span>
<switch-elemental
  ><button aria-labelledby="dark-label"></button
></switch-elemental>

<!-- 2. No visible label — the name is the button's own text -->
<switch-elemental><button>Dark mode</button></switch-elemental>

<!-- 3. Icon-only, where the surrounding UI makes it obvious -->
<switch-elemental><button aria-label="Dark mode"></button></switch-elemental>
```

Name the _thing_ being switched, and keep that name still. `aria-checked` already
announces on/off, so a label reading "On" says it twice, and a label that swaps as you
flip it renames the control under the reader while focus is still on it — the name is
also what voice control aims at.

`<label>` is not an option — it binds to form controls and a `<button>` is not one.
`aria-labelledby` is the equivalent.

### State text

If the state should be readable as a word and not only as a position, put it _beside_ the
switch as its own `aria-hidden` text, never in the name. The reflected `checked` attribute
does the swap, so there is no script and nothing to keep in step:

```html
<span id="dark-label">Dark mode</span>
<switch-elemental
  ><button aria-labelledby="dark-label"></button
></switch-elemental>
<span class="switch-state" aria-hidden="true">
  <span class="on">On</span><span class="off">Off</span>
</span>
```

```css
switch-elemental[checked] + .switch-state .off,
switch-elemental:not([checked]) + .switch-state .on {
  display: none;
}
```

`aria-hidden` because a screen reader has already heard it from `aria-checked` — this is
for the readers who see the switch and want the word. It is your own two spans, as the
demo at the top of this page is; nothing here ships it.

## In a form

Give it a `name` and it is a form control: it submits, resets, restores and disables like
a checkbox, because it is form-associated through
[`ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
rather than through a hidden `<input>` that could disagree with it.

Flip these — the line underneath is the form's live `FormData`. **Terms** is `required`,
so **Save** refuses until it is on; **Beta features** sits in a `<fieldset>` that Pro tier
enables:

<form class="demo-form">
  <div class="demo-form-row">
    <span id="form-autoplay">Autoplay</span>
    <switch-elemental name="autoplay"><button aria-labelledby="form-autoplay"></button></switch-elemental>
  </div>
  <div class="demo-form-row">
    <span id="form-replies">Email me replies</span>
    <switch-elemental name="replies" checked><button aria-labelledby="form-replies"></button></switch-elemental>
  </div>
  <div class="demo-form-row">
    <span id="form-tier">Pro tier</span>
    <switch-elemental name="tier" value="pro" id="form-tier-switch"><button aria-labelledby="form-tier"></button></switch-elemental>
  </div>
  <fieldset class="demo-form-fieldset" id="form-beta-fieldset" disabled>
    <div class="demo-form-row">
      <span id="form-beta">Beta features <em>(Pro only)</em></span>
      <switch-elemental name="beta" checked><button aria-labelledby="form-beta"></button></switch-elemental>
    </div>
  </fieldset>
  <div class="demo-form-row">
    <span id="form-terms">Accept the terms <em>(required)</em></span>
    <switch-elemental name="terms" required><button aria-labelledby="form-terms"></button></switch-elemental>
  </div>
  <p class="demo-form-out" aria-live="polite">…</p>
  <p class="demo-form-buttons"><button>Save</button> <button type="reset">Reset</button></p>
</form>

```html
<form>
  <switch-elemental name="autoplay"
    ><button aria-labelledby="…"></button
  ></switch-elemental>
  <switch-elemental name="replies" checked
    ><button aria-labelledby="…"></button
  ></switch-elemental>
  <switch-elemental name="tier" value="pro"
    ><button aria-labelledby="…"></button
  ></switch-elemental>

  <fieldset id="beta" disabled>
    <switch-elemental name="beta" checked
      ><button aria-labelledby="…"></button
    ></switch-elemental>
  </fieldset>

  <switch-elemental name="terms" required
    ><button aria-labelledby="…"></button
  ></switch-elemental>
  <button>Save</button>
</form>
```

```javascript
// One switch gating another is a line: the fieldset owns the disabling, and every
// control under it goes with it.
tier.addEventListener("switch-toggle", (e) => {
  beta.disabled = !e.detail.checked;
});
```

| Wanted                      | Markup / code                                                 |
| --------------------------- | ------------------------------------------------------------- |
| Submits as `autoplay=on`    | `name="autoplay"` and on                                      |
| Submits nothing             | off, `disabled`, inside a disabled `<fieldset>`, or no `name` |
| A value other than `on`     | `value="pro"`                                                 |
| On when the page loads      | `checked` in the markup — also what **reset** returns to      |
| Must be on to submit        | `required`                                                    |
| Associate with a form by id | `form="settings"`, as any control does                        |

### Reading it

```javascript
const form = document.querySelector("form");

new FormData(form).get("autoplay"); // "on", or null when off
form.querySelector('[name="autoplay"]').checked; // the live boolean

// There is no `change` event — the control is a button — but `switch-toggle`
// bubbles, so one listener on the form hears every switch in it.
form.addEventListener("switch-toggle", (e) => {
  console.log(e.target.name, e.detail.checked);
});
```

On the server it is the checkbox story unchanged: an off switch is **absent** from the
body rather than empty, which is what every "was this ticked" check is already written
against.

### Reset, restore, disable

- **Reset** puts it back to the state its markup arrived in — nothing to wire up.
- **Back-navigation** restores what the reader left it at, same.
- **`disabled`** disables the button, and the switch drops out of the form data. A
  `<fieldset disabled>` reaches it too, and `switch-elemental[disabled]` is a styling
  hook.

### Validation

`required` means the form will not submit while the switch is off, and the browser's own
bubble points at the button. The rest of the constraint API is the platform's, read off
the internals:

```javascript
toggle.required = true;
toggle.checkValidity(); // false while it is off
toggle.validity.valueMissing; // true
toggle.reportValidity(); // checks and shows the bubble

// Your own constraint, for what the browser cannot know. "" clears it.
toggle.setCustomValidity(
  data.get("beta") && !data.get("tier") ? "Beta needs Pro." : "",
);
```

A `disabled` switch is barred from validation, as every other control is — a required
switch inside a disabled fieldset does not block the form.

#### The message

A form-associated custom element gets no message from the platform: `setValidity` refuses
an empty one, and there is no default to ask for. So the default here is **borrowed** —
the browser's own message for a required checkbox, read once off a throwaway `<input>`,
which arrives already translated into the reader's language. It says _box_ rather than
_switch_, and a reader given the right language with the wrong noun is better served than
one given English.

Three levels, most specific first:

```html
<!-- 1. this one switch -->
<switch-elemental required required-message="Accept the terms to continue."
  >…</switch-elemental
>
```

```javascript
// 2. every switch on the page, one line at boot
import { SwitchElemental } from "book-of-elementals/switch";
SwitchElemental.requiredMessage = "Veuillez activer ceci.";

// 3. nothing set — the browser's translated checkbox message
```

`setCustomValidity()` is not one of them: it makes the switch invalid _until you clear
it_, which is a different thing from wording the required message.

> [!NOTE]
> Ask whether a required switch is the right control at all. "Accept the terms" is a
> value you are submitting, not a setting that takes effect as you flip it, and that is a
> checkbox. `required` is here for the forms that mix the two, not as an invitation.

> [!NOTE]
> `attachInternals` is the one part that is not everywhere — Safari only got it in 16.4.
> Without it the switch is a switch that does not submit; it still toggles, still fires
> `switch-toggle`, and its `checked` is still readable. If the setting must survive
> scripting being off entirely, that is `<input type="checkbox" role="switch">`.

## Theme toggle

The switch a switch most often is, and the code behind the demo at the top. The trick is
that the page must not wait for the element to upgrade, or it paints in the wrong theme
and then corrects itself:

```html
<!-- in <head>, before any CSS: stamp the saved theme before first paint -->
<script>
  (function () {
    var t = localStorage.getItem("theme");
    if (!t)
      t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = t;
  })();
</script>
```

```javascript
const toggle = document.querySelector("switch-elemental");
const root = document.documentElement;

// The document already knows the theme, so the switch takes its starting state
// from it rather than the other way round.
toggle.checked = root.dataset.theme === "dark";

toggle.addEventListener("switch-toggle", (e) => {
  root.dataset.theme = e.detail.checked ? "dark" : "light";
  localStorage.setItem("theme", root.dataset.theme);
});
```

The "On" beside it is [state text](#state-text) and needs no line here — it keys off the
`checked` attribute this has just written.

## The look

`style.scss` is structure only; `theme.scss` is the look and is optional — a light-DOM
element cannot scope a look away from a page that did not ask for one. It is a pill with a
knob that slides, painted out of `currentcolor`, so it sits in whatever palette the page
has — including the theme it is switching:

| Property                                  | Default        | Description                                  |
| ----------------------------------------- | -------------- | -------------------------------------------- |
| `--switch-elemental-width`                | `3.625rem`     | Track width                                  |
| `--switch-elemental-height`               | `2rem`         | Track height                                 |
| `--switch-elemental-radius`               | the height     | Track corners. The height is a pill          |
| `--switch-elemental-border-width`         | `2px`          | Track border                                 |
| `--switch-elemental-border-color`         | `currentcolor` | Track border, off                            |
| `--switch-elemental-border-color-checked` | the above      | Track border, on                             |
| `--switch-elemental-gap`                  | `2px`          | Between the knob and the inside of the track |
| `--switch-elemental-track`                | `transparent`  | Track fill, off                              |
| `--switch-elemental-track-checked`        | `currentcolor` | Track fill, on                               |
| `--switch-elemental-knob`                 | `currentcolor` | Knob fill, off                               |
| `--switch-elemental-knob-checked`         | `Canvas`       | Knob fill, on                                |
| `--switch-elemental-knob-size`            | derived        | Knob width/height. Travel follows it         |
| `--switch-elemental-knob-radius`          | `50%`          | Knob shape                                   |
| `--switch-elemental-duration`             | `250ms`        | Slide and cross-fade                         |
| `--switch-elemental-easing`               | `ease-in-out`  | Slide and cross-fade                         |

That is the table above, live. Turn the knobs in the **Options** tab until the switch looks
the way you want it, then copy the rule out of the bottom of the panel — that rule is the
whole of what you would write, and its selector is the element rather than `:root` for the
reason the note below gives:

<!-- demo switch tab="options" -->

```html
<span id="knobs-label">Turn me in the Options tab</span>
<switch-elemental checked>
  <button aria-labelledby="knobs-label"></button>
</switch-elemental>
```

Three of the fourteen are not in the panel, and deliberately: `--switch-elemental-inset`,
`--switch-elemental-knob-size` and `--switch-elemental-travel` are `calc()`-derived from the
four geometry properties, and setting one by hand is how a knob ends up overshooting its own
track. Size it with `--switch-elemental-width` and `--switch-elemental-height` and the rest
follows.

`prefers-reduced-motion: reduce` switches the motion off. Under `forced-colors` the track
and knob are repainted in system colors. A disabled switch is the same switch at
`opacity: 0.5` with a `not-allowed` cursor — restyle it through
`switch-elemental > button:disabled`:

<div class="demo-sizes">
  <switch-elemental disabled><button aria-label="Disabled, off"></button></switch-elemental>
  <switch-elemental disabled checked><button aria-label="Disabled, on"></button></switch-elemental>
</div>

```html
<switch-elemental disabled><button aria-label="…"></button></switch-elemental>
```

> [!NOTE]
> These go **on the `<switch-elemental>`** — a class on it, `.card switch-elemental`, or
> the element itself. The theme sets its defaults on the element, and a property set on an
> element always beats one inherited from an ancestor, so
> `.settings-panel { --switch-elemental-track-checked: … }` silently does nothing.

### Size

Two presets ship, and they combine. Both are only the properties printed beside them, so
any other size is the same two lines:

<div class="demo-sizes">
  <switch-elemental checked><button aria-label="Default size"></button></switch-elemental>
  <switch-elemental class="switch-elemental-small" checked><button aria-label="Small"></button></switch-elemental>
  <switch-elemental class="switch-elemental-thin" checked><button aria-label="Thin"></button></switch-elemental>
  <switch-elemental class="switch-elemental-small switch-elemental-thin" checked><button aria-label="Small and thin"></button></switch-elemental>
</div>

```html
<switch-elemental class="switch-elemental-small">…</switch-elemental>
<switch-elemental class="switch-elemental-thin">…</switch-elemental>
```

```css
.switch-elemental-small {
  --switch-elemental-width: 2.75rem;
  --switch-elemental-height: 1.5rem;
}

.switch-elemental-thin {
  --switch-elemental-border-width: 1px;
}
```

Icons are your own SVGs at your own size, so size them down too at the small one.

### The knob

The knob is a pseudo-element on the button, sized and moved from the properties above —
set its size and the travel follows, because both are read from the same property and it
can never overshoot its track. Four of them do everything worth doing to it:

<table class="demo-knobs">
  <thead>
    <tr><th>Knob</th><th>Off</th><th>On</th><th>What changed</th></tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Default</th>
      <td><switch-elemental><button aria-label="Default knob, off"></button></switch-elemental></td>
      <td><switch-elemental checked><button aria-label="Default knob, on"></button></switch-elemental></td>
      <td>Circle, inset by the gap.</td>
    </tr>
    <tr>
      <th scope="row">Square</th>
      <td><switch-elemental class="knob-square"><button aria-label="Square knob, off"></button></switch-elemental></td>
      <td><switch-elemental class="knob-square" checked><button aria-label="Square knob, on"></button></switch-elemental></td>
      <td><code>--switch-elemental-knob-radius</code>, and the track squared with it.</td>
    </tr>
    <tr>
      <th scope="row">Rail</th>
      <td><switch-elemental class="knob-rail"><button aria-label="Rail knob, off"></button></switch-elemental></td>
      <td><switch-elemental class="knob-rail" checked><button aria-label="Rail knob, on"></button></switch-elemental></td>
      <td>A knob bigger than the track it rides on, reaching both ends — the gap goes negative to clear the border, and the knob keeps its colour so the overhang survives.</td>
    </tr>
    <tr>
      <th scope="row">Flush</th>
      <td><switch-elemental class="knob-flush"><button aria-label="Flush knob, off"></button></switch-elemental></td>
      <td><switch-elemental class="knob-flush" checked><button aria-label="Flush knob, on"></button></switch-elemental></td>
      <td><code>--switch-elemental-gap: 0px</code> — knob fills the track.</td>
    </tr>
    <tr>
      <th scope="row">Colour</th>
      <td><switch-elemental class="knob-color"><button aria-label="Coloured knob, off"></button></switch-elemental></td>
      <td><switch-elemental class="knob-color" checked><button aria-label="Coloured knob, on"></button></switch-elemental></td>
      <td>A colour of your own: track and rim on the on state, knob untouched.</td>
    </tr>
    <tr>
      <th scope="row">Ink</th>
      <td><switch-elemental class="knob-ink"><button aria-label="Ink knob, off"></button></switch-elemental></td>
      <td><switch-elemental class="knob-ink" checked><button aria-label="Ink knob, on"></button></switch-elemental></td>
      <td>The knob keeps its colour in both states, so the track can only tint. Never has to know what is behind it.</td>
    </tr>
  </tbody>
</table>

```css
/* the track squares with the knob: 0.25rem + the gap + the border keeps the corners
   concentric */
.knob-square {
  --switch-elemental-knob-radius: 0.25rem;
  --switch-elemental-radius: 0.5rem;
}

.knob-rail {
  --switch-elemental-height: 1.1rem;
  --switch-elemental-border-width: 2px;
  --switch-elemental-gap: -2px;
  --switch-elemental-knob-size: 1.25rem;
  --switch-elemental-knob-checked: var(--switch-elemental-knob);
  --switch-elemental-track-checked: color-mix(
    in srgb,
    currentcolor 30%,
    transparent
  );
}
.knob-flush {
  --switch-elemental-gap: 0px;
} /* 0px, not 0 — see below */

/* the one that leaves currentcolor: the on state, track and rim */
.knob-color {
  --switch-elemental-track-checked: #7c5cff;
  --switch-elemental-border-color-checked: #7c5cff;
}

/* the knob keeps its colour, so the track tints instead of filling */
.knob-ink {
  --switch-elemental-knob-checked: var(--switch-elemental-knob);
  --switch-elemental-track-checked: color-mix(
    in srgb,
    currentcolor 22%,
    transparent
  );
}
```

> [!WARNING]
> Give the lengths a unit — `0px`, never `0`. They are added together inside `calc()`,
> where a unitless zero is invalid, and the knob computes to nothing at all.

> [!NOTE]
> `--switch-elemental-knob-checked` defaults to `Canvas`, the page's own background,
> because that is what a knob dropped out of a filled track is. It is the one value that
> knows about its surroundings, so re-point it on a card
> (`--switch-elemental-knob-checked: var(--card-background)`), or on a page that themes
> in custom properties **without declaring `color-scheme`** — there `Canvas` stays white
> in dark mode and the knob thins out. Declaring `color-scheme: dark` fixes it, and the
> **ink** knob above sidesteps the question: a knob that keeps its own colour never asks
> what is behind it. It is also what an oversized knob needs — one bigger than its track
> paints over the page rather than over the track, and a `Canvas` knob disappears into it.

### Icons

Optional, and the reason the button may have children at all: one icon per state, each in
the half the knob is not in. The knob covers one end, so the icon that shows is always the
one at the other:

```html
<switch-elemental>
  <button aria-label="Dark mode">
    <span class="switch-elemental-off" aria-hidden="true"
      ><svg …><!-- sun --></svg></span
    >
    <span class="switch-elemental-on" aria-hidden="true"
      ><svg …><!-- moon --></svg></span
    >
  </button>
</switch-elemental>
```

`aria-hidden` on both — they are the state twice over. Each icon takes the knob color of
the state it belongs to, so draw them in `currentColor` and they follow.

## Switch or checkbox?

The same boolean wearing different promises: a **checkbox** is a value you are about to
submit (and has a third, indeterminate state), a **switch** is a setting that takes effect
the moment you flip it. Being in a `<form>` does not settle it — give this element a
`name` and it submits like a checkbox. Two things do send you to
`<input type="checkbox" role="switch">` instead:

- **Scripting off.** The button is hidden until the element upgrades
  (`switch-elemental:not(:defined) > button { display: none }`), and an element that never
  upgrades never sets a form value either. A switch that silently does not switch is worse
  than none.
- **`<label>`.** A real form control gets one; a `<button>` does not.

The theme dresses this element's `<button>` only, but the box is identical on a native
checkbox — only the state selector differs, `:checked` where this keys off
`[aria-checked="true"]`.

More than two states is neither: that is one choice out of a few, which is
[`<segmented-elemental>`](segmented.html) — the same track and sliding knob, over a
native radio group.

## Layout

`<switch-elemental>` is `display: contents`: a switch is usually a flex or grid item next
to its label, and an extra box in between is one the parent lays out instead of the
button. Dropping the element around an existing button changes no layout at all. Give it
`display: block` in your own CSS if you want something to style.

<script src="{{ relativePathPrefix }}dist/elementals/switch.js"></script>

<!-- Demo-only: the theme toggle at the top of the page, wired to this site's own
     [data-theme]. The observer is docs-specific - the topbar has a theme button too, and
     the two must not disagree. -->
<script>
  (function () {
    var toggle = document.getElementById("switch-theme-demo");
    var root = document.documentElement;
    if (!toggle) return;
    // The label does not move - only [checked] does, and the state text keys off it.
    function sync() {
      toggle.checked = root.dataset.theme === "dark";
    }
    toggle.addEventListener("switch-toggle", function (e) {
      root.dataset.theme = e.detail.checked ? "dark" : "light";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (err) {}
      sync();
    });
    new MutationObserver(sync).observe(root, { attributeFilter: ["data-theme"] });
    sync();
  })();
</script>

<!-- Demo-only: prints the form's live FormData under the form sample. `switch-toggle`,
     not `change`: the control is a button, so there is no `change` event to hear. It
     bubbles, so one listener on the form covers all three. -->
<script>
  (function () {
    var form = document.querySelector(".demo-form");
    if (!form) return;
    var out = form.querySelector(".demo-form-out");
    function show() {
      var pairs = [];
      new FormData(form).forEach(function (value, name) {
        pairs.push(name + "=" + value);
      });
      out.textContent = pairs.length
        ? "new FormData(form) → " + pairs.join("  ")
        : "new FormData(form) → (empty, every switch is off)";
    }
    // Pro tier gates the beta fieldset, which is the one line the page claims it is.
    var tier = document.getElementById("form-tier-switch");
    var beta = document.getElementById("form-beta-fieldset");
    function gate() {
      beta.disabled = !tier.checked;
    }
    form.addEventListener("switch-toggle", function () {
      gate();
      show();
    });
    // Reset fires before the controls are back at their defaults, so read after it.
    form.addEventListener("reset", function () {
      setTimeout(function () {
        gate();
        show();
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      out.textContent = "submitted → " + out.textContent.replace(/^[^→]*→ /, "");
    });
    gate();
    show();
  })();
</script>
