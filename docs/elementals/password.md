---
layout: poops-docs-theme/docs
title: Password
description: A password field you can look at, and a button that says so out loud.
order: 21
navGroup: No APG pattern
---

# `<password-elemental>`

A reveal button for a password field: the state in `aria-pressed`, the change announced, and
the mask back on before the value is submitted. Light DOM, no shadow root, nothing moved.

<!-- demo password field -->

```html
<form>
  <field-elemental>
    <label for="pw">Password</label>
    <password-elemental>
      <input type="password" id="pw" name="password" required minlength="8"
             autocomplete="current-password">
      <button type="button"><span class="visually-hidden">Show password</span></button>
    </password-elemental>
  </field-elemental>

  <button type="submit">Sign in</button>
</form>
```

```css demo
form { display: grid; gap: 1.25rem; max-width: 24rem; }
field-elemental { display: grid; gap: 0.35rem; }
field-elemental label { font-size: 0.875rem; font-weight: 500; }

/* the element ships `display: contents`, so it costs no layout wherever you drop it. giving
   it a box here is what makes `position: relative` mean anything, and it is the page's
   choice rather than the element's — which is the whole reason it does not ship one */
password-elemental { position: relative; display: block; }

input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.6rem 0.75rem;
  font: inherit;
  color: CanvasText;
  background: Canvas;
  border: 1px solid color-mix(in srgb, CanvasText 30%, transparent);
  border-radius: 0.375rem;
}

/* room for the eye, so a long password does not run under it */
password-elemental input { padding-inline-end: 2.5rem; }

/* inset by the field's own border width, so the button sits inside the rim rather than on
   top of it */
password-elemental > button {
  position: absolute;
  inset-block: 1px;
  inset-inline-end: 1px;
  padding-inline: 0.6rem;
  color: color-mix(in srgb, CanvasText 65%, transparent);
}
password-elemental > button:hover { color: CanvasText; }
input:focus-visible { outline: 2px solid CanvasText; outline-offset: 1px; }
input[aria-invalid="true"] { border-color: var(--field-elemental-error-color); }


.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

form > button[type="submit"] {
  justify-self: start;
  padding: 0.5rem 1rem;
  font: inherit;
  color: Canvas;
  background: CanvasText;
  border: 0;
  border-radius: 0.375rem;
}
```

Type something and press the eye. Submit with fewer than eight characters and
[`<field-elemental>`](field.html) beside it says why, with the field left however you left it —
nothing was submitted. Submit a long enough one and it masks itself on the way out.

## Why this needs script at all

There is no APG pattern, because there is no widget: a `<button>` next to an `<input>`, both
already accessible. What is missing is everything about the **state**.

| What most reveal buttons do | What the reader gets |
| --- | --- |
| Swap an eye icon for a crossed-out eye | a sighted reader knows which way round it is; nobody else does |
| Change the field from dots to letters | the single change on the page most worth announcing, announced nowhere |
| Nothing on submit | the value posts from an `<input type="text">`, and browsers remember what was typed into text fields |

That last row is the one that is not an accessibility bug but a security one, and it is why
this element masks the field before the form is submitted.

## The one thing the sources disagree about

Whether the button's name changes, or `aria-pressed` carries the state. All three answers
exist in the wild and one of them is self-contradictory:

| Prior art | Button name | State | |
| --- | --- | --- | --- |
| [GOV.UK](https://design-system.service.gov.uk/components/password-input/) | swaps, `Show` ⇄ `Hide` | implied by the name | consistent |
| [Make Things Accessible](https://www.makethingsaccessible.com/guides/make-an-accessible-password-reveal-input/) | fixed | `aria-pressed` | consistent |
| [hexagoncircle](https://github.com/hexagoncircle/password-input-components) | swaps | `aria-pressed` | says it twice |
| this | fixed | `aria-pressed` | |

Make Things Accessible names the third row as the mistake: *"We're using `aria-pressed` on the
button, so remember not to change the accessible name as that will be confusing for our
users."* Of the two that are self-consistent, this takes the toggle, for two reasons — the
state is exposed programmatically rather than left for the reader to infer from a verb, and
nothing changes under a reader's focus, which is where a swapped name is re-announced by some
screen readers and silently not by others.

It is the shape ARIA is written for: the name is the thing being switched and `pressed` is
whether it is on, exactly as a **Bold** button in an editor works.

Both sources agree on the half that settles any remaining ambiguity, and it is here: a live
region says *"Your password is visible"* or *"Your password is hidden"* on every press.
`role="status"`, not `alert` — the reader pressed the button, so they are not being
interrupted with the answer to their own question.

## What it writes

```html
<password-elemental shown>
  <input type="text" id="pw" name="password">
  <button type="button" aria-pressed="true" aria-controls="pw">…</button>
  <span class="password-elemental-status" role="status">Your password is visible</span>
</password-elemental>
```

`shown` is reflected, so `password-elemental[shown]` is a styling hook and setting
`el.shown = true` reveals from script. The field gets an `id` if it had none, so the button
can point at it.

## What masks the field again

| | |
| --- | --- |
| The button | pressed a second time |
| **Submitting the form** | always, whichever way the button was left |
| Resetting the form | always — the page loaded masked, and the value goes back with it |

Submitting is the security rule and it is not configurable. A revealed field posts from an
`<input type="text">`, which browsers remember; a reader who revealed their password and
pressed the button would be offered it back in an autofill list on some unrelated page later.

There is no trade hiding in that, because `submit` fires only when the form is *really* being
submitted — a browser that refuses the submit on a constraint never dispatches it, measured in
Chromium. So a refused submit leaves the field exactly as the reader left it, revealed if that
is how they wanted it, and nothing went anywhere to be remembered.

## Composing with `<field-elemental>`

They nest, and neither knows about the other. The demo above is the whole of it:
`<field-elemental>` finds the control wherever it is inside, so the reveal button can sit
between them, and revealing mid-error disturbs nothing — the message, the `aria-invalid` and
the `aria-describedby` all stay put.

## What it does not do

| | Why |
| --- | --- |
| Measure strength | [NIST SP 800-63B Rev 4](https://pages.nist.gov/800-63-4/sp800-63b.html) prohibits the composition rules a character-class meter scores. An honest measure needs a guessability library or a breach-list lookup — a dependency, or a network call, and this book has neither to spare |
| Generate a password | not an accessibility gap. `crypto.getRandomValues` is four lines and [`<copy-elemental>`](copy.html) is the button beside it |
| Confirm a second field | `setCustomValidity()` does it in four lines and [`<field-elemental>`](field.html#two-fields-that-have-to-agree) reports it. GOV.UK's research argues against the second field at all when there is a reveal button |
| Style the field | this book is not a design system. The theme draws the button and nothing else |
| Save and restore the caret | it does not have to. Flipping `input.type` keeps focus **and** the selection range — measured in Chromium and WebKit, Firefox not checked. Pressing the button still moves focus to the button, as pressing any button does; what the preserved selection buys is `el.shown = true` from script leaving the reader's place alone |

## Events

| Event | When | `detail` |
| --- | --- | --- |
| `password-reveal` | the value is revealed or masked, by any of the three | `shown` |

## Degrading

| Missing | What you get |
| --- | --- |
| The script never loads | A password field, which is what the markup was. The stylesheet keeps the button out of reach rather than leaving a dead one |
| The theme is not imported | The button, unstyled and unlabelled if you gave it no text of its own — the theme is what draws the eye |

## Installation

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/password.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/password.css">
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/password-theme.css">
```

```javascript
import "book-of-elementals/password";
```

```scss
@use "book-of-elementals/password/style.scss";
@use "book-of-elementals/password/theme.scss"; // optional look
```
