---
layout: poops-docs-theme/docs
title: Field
description: The browser's own validation message, on the page instead of in a bubble that floats away.
order: 23
navGroup: No APG pattern
---

# `<field-elemental>`

Wrap a label and a control, and the browser's refusal to submit becomes a sentence under the
field — tied to it, announced, and yours to style. Light DOM, no shadow root, nothing moved.

<!-- demo field style="--code-preview-height:282px" -->

```html
<form>
  <field-elemental>
    <label for="email">Email address</label>
    <input type="email" id="email" name="email" required>
  </field-elemental>

  <field-elemental>
    <label for="handle">Handle</label>
    <input id="handle" name="handle" required pattern="[a-z0-9_]{3,20}"
           aria-describedby="handle-hint">
    <p id="handle-hint">Three to twenty lowercase letters, numbers or underscores.</p>
  </field-elemental>

  <button type="submit">Sign up</button>
</form>
```

```css demo
/* the page's own look, all of it — the element styles no control, on the reasoning that a
   field is what a design system already owns. what it does give you is the hook two rules
   down */
form { display: grid; gap: 1.25rem; max-width: 24rem; }
field-elemental { display: grid; gap: 0.35rem; }
field-elemental label { font-size: 0.875rem; font-weight: 500; }

field-elemental input {
  box-sizing: border-box;
  padding: 0.6rem 0.75rem;
  font: inherit;
  color: CanvasText;
  background: Canvas;
  border: 1px solid color-mix(in srgb, CanvasText 30%, transparent);
  border-radius: 0.375rem;
}
field-elemental input:focus-visible { outline: 2px solid CanvasText; outline-offset: 1px; }

/* the hook: `aria-invalid` is on the control the whole time the message is up and off it
   the rest of the time, so the rim is one selector and asks nothing of JavaScript. it is
   never the only cue — the message under it says what is wrong in words */
field-elemental input[aria-invalid="true"] { border-color: var(--field-elemental-error-color); }

field-elemental [id$="-hint"] {
  margin: 0;
  font-size: 0.8125rem;
  color: color-mix(in srgb, CanvasText 60%, transparent);
}


form > button {
  justify-self: start;
  padding: 0.5rem 1rem;
  font: inherit;
  color: Canvas;
  background: CanvasText;
  border: 0;
  border-radius: 0.375rem;
}
```

Submit it empty. Then put one character in the email field and tab away. The hint under the
handle field is still described when the error arrives — the element appends to
`aria-describedby`, it does not take it over.

Every line of that CSS is the page's. The element contributes one thing to it,
`[aria-invalid="true"]` on the control, and that is the whole of its styling contract.


## Why this needs script at all

The validation is already there. `required`, `type="email"`, `pattern`, `minlength` are
attributes, the browser enforces them, and nothing here re-implements any of it. What the
platform leaves undone is the half after the refusal.

| What the native bubble does                                       | Why it is a problem                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Cannot be styled                                                  | it is the one part of your form that is not your form                                        |
| Disappears when the field takes focus                             | the reader reads it, clicks the field to fix it, and the instruction is gone                 |
| Shown for the first invalid control and no other                  | a form with four problems reports one, three times over                                      |
| Not reliably announced                                            | a screen reader user is told the submit did nothing, and not what to do about it             |
| Gone on the next paint                                            | nothing to come back to, and nothing a second reader can point at over a shoulder            |

So every form on the web either lives with it or hand-writes a replacement — and the
replacement is where the accessibility goes. A red paragraph that no `aria` attribute ties to
the field is a message a screen reader user never meets, which trades
[WCAG 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)
for a colour.

## Prior art

| | What it gives you | Shape |
| --- | --- | --- |
| [afova](https://github.com/ulfschneider/afova) | the fullest of these: per-constraint messages from `data-*` attributes, message placeholders, async validation, a violation summary, focus to the first invalid | `afova()`, called once, over every form on the page |
| [GOV.UK error message](https://design-system.service.gov.uk/components/error-message/) | a house style, an error summary at the top of the page, and the research behind both | markup and classes you write yourself; no script does the wiring |
| [Shoelace](https://github.com/shoelace-style/shoelace/issues/1191) | nothing, on purpose — *"The 'correct' solution to this is probably a separate form validation library"* | closed; the repo was archived in May 2026 |
| this | the bubble cancelled, the browser's own message in a paragraph, `aria-describedby`, `aria-invalid` | an element around markup you already wrote |

afova is the more capable library and the better answer if you want a message vocabulary —
it is worth reading before you pick this. The difference is where the work lands: it
configures forms from JavaScript, and this is a tag you put around a field, which is what
the rest of this book is and what makes it work from a `<script>` tag with nothing called.

## When it speaks

The rule the native bubble uses is one moment and no others. The rule most hand-written
validators use is every keystroke, which tells a reader their email address is invalid after
they have typed `n`. Neither is right, so the rule is this:

| Moment                                       | With no message showing                     | With one showing                    |
| -------------------------------------------- | ------------------------------------------- | ----------------------------------- |
| A submit was refused                         | say why, always                             | say why                             |
| Focus leaves the field                       | say why, but only if something was typed in | take it down once the value is right |
| Typing, or a `change`                        | nothing — typing never *starts* a complaint | keep it current, and end it when answered |
| The form was reset                           | nothing to do                               | take it down — or put back the one the page was [rendered with](#errors-from-the-server) |

"Something was typed in" is about the value, not the visit: a field typed into and emptied
again is back to untouched, and tabbing through a form never lights it up.

`novalidate` on the form turns off the submit half. No `invalid` event is fired, so nothing
stops the submit and nothing is said about it — only the blur rule is left. That is the
attribute doing exactly what it says, and it is worth knowing before you reach for it here.

## What it writes

Given the markup above, an invalid field ends up as:

```html
<field-elemental>
  <label for="email">Email address</label>
  <input type="email" id="email" name="email" required
         aria-invalid="true" aria-describedby="email-error">
  <p class="field-elemental-error" id="email-error">Please fill out this field.</p>
</field-elemental>
```

Valid again, the `<p>` is `hidden` and empty, `aria-invalid` is removed rather than set to
`false`, and `aria-describedby` goes back to whatever it held before — a hint you wrote is
never lost, and never left describing a field with nothing wrong with it.

The control gets an `id` if it did not have one. The message takes the control's `id` plus
`-error`.

### `aria-describedby`, not `aria-errormessage`

`aria-errormessage` is the attribute written for exactly this, and it is still not the one
that works. [Adrian Roselli's testing](https://adrianroselli.com/2023/04/exposing-field-errors.html)
found the message behind it "generally not exposed when navigating through fields", against
`aria-describedby` being "consistently exposed"; support was
[still not there](https://cerovac.com/a11y/2024/06/support-for-aria-errormessage-is-getting-better-but-still-not-there-yet/)
in mid-2024. The day it lands this is one attribute name to change.

There is no live region on the message either, which is the counter-intuitive half.
`aria-describedby` is already announced when focus leaves the field and the message appears,
so `aria-live` on top of it is the same sentence twice in NVDA and JAWS, and stops VoiceOver
reading the description at all.

## Errors from the server

Write the paragraph yourself with the message in it and the element adopts it — same class,
same wiring, no second code path:

```html
<field-elemental>
  <label for="email">Email address</label>
  <input type="email" id="email" name="email" value="taken@example.com" required>
  <p class="field-elemental-error">That address is already registered.</p>
</field-elemental>
```

With no script that is a paragraph under a field, which is a working page. With the script it
becomes an announced, described error at upgrade.

Editing the field takes it down, because editing it is the reader answering it. Whether the
new value is any better is the server's to say on the next submit — the element does not
call `setCustomValidity()` with a server message, because that would block the form on a
sentence nothing on the page can clear.

Resetting the form puts it back. A reset restores the values the page was rendered with, and
a message the page was rendered with was about exactly those — taking it down would leave the
form holding the value the server already refused with nothing on screen saying so.

## Custom messages

There is no message vocabulary here — no `data-required-message`, no `invalid-message`. The
platform already has one call for it:

```javascript
input.setCustomValidity('We need this to send your receipt.');
input.setCustomValidity(''); // and this is how it goes away again
```

The element shows whatever `validationMessage` holds, so a custom validity appears the same
way the browser's own wording does — already in the reader's language when it is the
browser's, and yours when it is not. The trap comes with the platform call and is worth
knowing: a control with a custom validity set stays invalid until that second call is made.

**`title` is not a substitute, and this is the one thing the element makes worse.** A `title`
beside a `pattern` is folded into the bubble by every browser, but only some fold it into
`validationMessage` — measured, WebKit does and Chromium does not:

| Browser  | `validationMessage` for a failed `pattern` with a `title`               |
| -------- | ----------------------------------------------------------------------- |
| Chromium | `Please match the requested format.` — the `title` is in the bubble only |
| WebKit   | `Match the requested format: Three to twenty lowercase…`                 |

Cancel the bubble and Chromium's half of that hint has nowhere left to go. So say what the
field wants in a hint next to it, the way the demo above does — which is
[WCAG 3.3.2 Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)
and worth doing whether or not anything is ever wrong — and use `setCustomValidity()` when the
message itself has to be specific.

### Two fields that have to agree

A confirm field is the constraint HTML has no attribute for, and `setCustomValidity()` is
where it goes. There is no `match` attribute here, because this is already the whole of it:

```javascript
const check = () => confirm.setCustomValidity(
  confirm.value === password.value ? '' : 'Passwords do not match.'
);
confirm.addEventListener('input', check);
password.addEventListener('input', check); // the half that is usually forgotten
```

That second listener is the bug in most hand-written versions: editing the *password* after
the confirmation was already filled in leaves a mismatch nothing re-checks. The element
shows, announces and clears whatever those four lines decide, so the accessible half is not
written twice.

What it cannot do is speak for a field the reader is not in. Changing the password says
nothing under the confirm field until they come back to it or submit — an element watching
one control cannot know another one moved, and shouting about the second field while they
are still typing in the first would be the wrong answer anyway.

The element reads the validity at the *end* of the event rather than during it, which is
what makes the above work at all: a page's `input` listener is registered after the element
upgraded, so it runs after the element's. Reading any sooner would report the answer from
before your rule ran, and the message would clear a keystroke late.

## What it does not do

| | Why |
| --- | --- |
| Validate anything | `required`, `pattern`, `type` and `setCustomValidity()` are the whole constraint layer, and they are the browser's |
| Style the control | this book is not a design system. `[aria-invalid="true"]` is on the control the whole time the message is up — the rim, the ring, the tint are your CSS |
| Leave focus where the browser put it | it cannot. Cancelling `invalid` to drop the bubble drops the browser's focus with it — a refused submit leaves focus on the button in Chromium and on `<body>` in WebKit. So the element does focus the first invalid control, and only that one. Firefox was not checked |
| Summarise errors at the top of the form | that is a page-level component, not a field, and [GOV.UK's error summary](https://design-system.service.gov.uk/components/error-summary/) is the one to copy |
| Handle a radio or checkbox group | one message belongs to one answer. A group is a `<fieldset>`, and pointing this at the first radio would describe the group by whichever one the reader landed on |
| Reserve space for the message | the message is `hidden` until there is one, so the field below it moves down a line when it appears. Holding the line open costs a blank gap under every field that is never wrong, which is the more visible of the two — and it means overriding `[hidden]` back to `display: block`, so the space is held by an element saying it is not there. Add it in your own CSS if your layout needs it |

## Events

| Event            | When                                    | `detail`                                                  |
| ---------------- | --------------------------------------- | --------------------------------------------------------- |
| `field-validity` | the message appears, changes, or goes   | `valid`, and `message` — the text now on screen, empty when there is none |

## Installation

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/field.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/field.css">
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/field-theme.css">
```

```javascript
import 'book-of-elementals/field';
```

```scss
@use "book-of-elementals/field/style.scss";
@use "book-of-elementals/field/theme.scss"; // optional look
```
