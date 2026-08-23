---
layout: poops-docs-theme/docs
title: Modal
description: A native dialog opened as a modal — nested, animated, and dismissed the way the platform says.
order: 7
---

# `<modal-elemental>`

A `<dialog>` opened as a modal, per the
[APG Modal Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — and
mostly by the browser, which is the point. Light DOM, no shadow root, nothing moved: the
dialog stays where your markup put it and every attribute on it is still the platform's own.

<div class="demo-block">
  <button type="button" command="show-modal" commandfor="intro-dialog">Open a modal</button>
  <modal-elemental>
    <dialog id="intro-dialog">
      <h2>Nothing up my sleeve</h2>
      <p>Escape closes it, and so does the cross. A click outside does not — that is
      <code>closedby="any"</code>, and it is opt-in.</p>
      <form method="dialog"><button type="submit">Close</button></form>
    </dialog>
  </modal-elemental>
</div>

```html
<button type="button" command="show-modal" commandfor="hello">Open a modal</button>

<modal-elemental>
  <dialog id="hello">
    <h2>Nothing up my sleeve</h2>
    <form method="dialog"><button type="submit">Close</button></form>
  </dialog>
</modal-elemental>
```

## What the browser already does

Nearly all of it, and better than script can. `showModal()` puts the dialog in the
[top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) — above every
`z-index`, out of every `overflow: hidden` ancestor — makes the rest of the page `inert`,
moves focus in, brings it back on close, and closes on <kbd>Esc</kbd>. **Nesting is part of
that**: a second modal is a second entry in the top layer, and the browser computes
inertness from the topmost one, so the dialog underneath goes quiet on its own. No focus
trap, no `z-index` arithmetic, no two libraries arguing over who owns the page.

What is left over is this element:

| The gap                     | Why the platform leaves it                                                                                                                                                                                     | What this does                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **an exit animation**       | a closing dialog leaves the top layer in the same frame, so it vanishes mid-fade. Deferring that is the [`overlay`](https://developer.mozilla.org/en-US/docs/Web/CSS/overlay) property — Chromium only, [no Firefox, no Safari](https://caniuse.com/mdn-css_properties_overlay) | holds the dialog open until its animation ends, then closes it    |
| **a click on the backdrop** | [`closedby="any"`](https://caniuse.com/mdn-html_elements_dialog_closedby) is Chrome 134, Firefox 141, and not in Safari or iOS at all                                                                            | the same three values, implemented here, in every browser         |
| **the page not scrolling**  | `inert` stops a click and a <kbd>Tab</kbd>. It never stopped a wheel                                                                                                                                             | `overflow: hidden` on the root while any modal is open, and a reserved gutter so the page does not jump when the scrollbar goes |
| **stacked backdrops**       | every modal paints its own, so three open is three sheets of dim                                                                                                                                                | numbers them, and only the bottom one dims                        |
| **a name on the dialog**    | a `<dialog>` takes no name from its contents, so an unlabelled one is announced as "dialog" and nothing more                                                                                                     | points `aria-labelledby` at the first heading inside              |
| **a close button**          | the APG [strongly recommends a visible one](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); HTML gives you `<form method="dialog">` and leaves the rest                                                 | writes the cross in the corner, unless `closedby="none"`          |

Everything else is the browser's, unchanged and unwrapped.

### Prior art

| | How it nests | Who contains focus |
| --- | --- | --- |
| [a11y-dialog](https://a11y-dialog.netlify.app/advanced/nested-dialogs) | supported, and called "a questionable design pattern" — the dialogs have to be nested in the DOM as well, or VoiceOver on Safari loses the inner one | the library |
| [modally](https://github.com/stamat/modally) | supported, with its own parent-child detection | the library, through a focus trap it writes |
| this | supported, in the DOM or not, because the top layer is not the DOM | the browser, through `inert` |

Containing focus is the line worth drawing. A focus trap in script is a `keydown` handler
racing everything else on the page; `showModal()` makes the rest of the document `inert`,
which takes it out of the tab order **and** out of the accessibility tree, so a screen
reader's own cursor cannot wander out either.

> [!NOTE]
> This element replaces [modally](https://github.com/stamat/modally), which is now
> deprecated. Nesting, `closeOthers` and hash-driven opening are all here; the width and
> alignment options are CSS custom properties, since that is what they always were. The
> YouTube and Vimeo helpers are not — an embed is markup you write once, and
> [the examples below](#video-and-lightboxes) are that markup.

## Usage

```javascript
import 'book-of-elementals/modal';
```

```scss
@use "book-of-elementals/modal/style.scss"; // structure, motion, and the sheet of dim
@use "book-of-elementals/modal/theme.scss"; // the look, optional
```

Or the single-element bundle — no build step, no script to write:

```html
<script src="https://unpkg.com/book-of-elementals/dist/elementals/modal.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/modal.min.css" />
<link rel="stylesheet" href="https://unpkg.com/book-of-elementals/dist/elementals/modal-theme.min.css" />
```

The `<dialog>` is **the element's own direct child**, and it needs an `id` — that is what a
trigger points at. Without one, the element writes a generated `id`, and the modal can only
be opened from script.

### Opening and closing it

The vocabulary is HTML's own: [invoker commands](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API),
`command` on the button and `commandfor` naming the dialog.

| Markup                                    | What it does                                          |
| ----------------------------------------- | ----------------------------------------------------- |
| `command="show-modal" commandfor="id"`    | opens it                                              |
| `command="request-close" commandfor="id"` | closes it                                             |
| `command="close" commandfor="id"`         | the same here — both are animated                     |
| `<form method="dialog">`                  | closes it on submit, and the button's `value` lands in `returnValue` |
| `<a href="#id">`                          | opens it too, and is the one that still works with no script |
| `dialog.showModal()`, `dialog.show()`     | from your own script, on the `<dialog>` — the element picks it up |

The element handles those clicks itself rather than leaving them to the browser, which is
what makes the close animated — and what makes the markup work in browsers with no invoker
commands of their own. Write it the same way either side of that line.

Every one of them is remote: the trigger is matched by `id` on the document, so it can sit
anywhere — a toolbar at the top of the page, a row in a table, another modal. Nothing has to
be inside the `<modal-elemental>` except the `<dialog>` itself.

That last row is the one worth knowing about. `document.getElementById("feedback")` hands you
the **dialog**, not the element around it, so `showModal()` on it is the call most people
reach for — and it works: the element notices, animates it in, counts its backdrop with the
rest and locks the page's scroll, exactly as though a button had opened it. A `show()` gets
the visible state and nothing else, because a non-modal dialog sits *in* the page rather than
over it. `el.show()` on the `<modal-elemental>` is the same open with `close-others` honoured.

<!-- demo modal style="--code-preview-height:353px" -->

```html
<button type="button" command="show-modal" commandfor="feedback">Send feedback</button>

<modal-elemental>
  <dialog id="feedback">
    <h2>Send feedback</h2>
    <form method="dialog">
      <p><label>What happened? <input name="what" autofocus /></label></p>
      <button type="submit" value="cancel">Cancel</button>
      <button type="submit" value="send">Send</button>
    </form>
  </dialog>
</modal-elemental>
```

```css demo
/* room for the dialog: the preview frame is measured from the sample, and the sample is a button */
body { min-block-size: 20rem; }
```

### What closes it

`closedby` is the platform's attribute, with the platform's three values and the platform's
default. Write it on the `<modal-elemental>`; written on the `<dialog>` it is moved up on
upgrade, because a browser that supports it natively would light-dismiss the modal itself —
instantly, with the fade cut off, and with a `cancel` event that
[cannot be prevented](https://html.spec.whatwg.org/multipage/interactive-elements.html#light-dismiss-open-dialogs).

| Value                     | <kbd>Esc</kbd> | Click outside | For                                        |
| ------------------------- | -------------- | ------------- | ------------------------------------------ |
| `closerequest` _(default)_ | closes         | no            | a form, anything with unsaved input        |
| `any`                     | closes         | closes        | a lightbox, a menu, anything glanced at    |
| `none`                    | no             | no            | a decision that has to be made             |

The default is the one to reach for when a stray click must not throw work away: **write no
`closedby` at all** and Escape is the only key out, plus the cross. `any` is the opt-in, and
the only one of the three that watches the backdrop.

`none` is not a lock. A close watcher only argues once, so a second <kbd>Esc</kbd> closes the
dialog anyway — that is the platform refusing to trap a reader, and it is not something this
element should undo. Use it to catch a stray press, not to hold someone hostage.

### The cross in the corner

Every modal gets one, written by the element — a `<button command="request-close">` as the
dialog's first child, so it is the first thing focus lands on and the first thing a screen
reader reaches, in the corner it is drawn in. Give it a name in your own language with
`close-text`:

```html
<modal-elemental closedby="any" close-text="Zatvori">
  <dialog id="…">…</dialog>
</modal-elemental>
```

Three things follow from where it sits:

- **It is absolute, against the dialog.** A modal dialog is `position: fixed` by the
  browser's own rule, so it is already the containing block — nothing has to be positioned to
  make the corner work. Being out of the flow, it moves nothing; `theme.scss` gives the
  element right after it room on that side, so a heading does not run under it.
- **A picture or a film right after it gets no room**, and the cross lands over it — which is
  where every lightbox puts one. Reserving the gutter there would cost the image a strip of
  dialog surface down one edge, and on a media box sized `width: 100%` without a border-box
  reset it is 100% *plus* the gutter, which is a dialog that scrolls sideways. What the corner
  costs instead is a repaint: the cross inherits the dialog's text colour, and no colour is
  safe over a picture nobody chose.

  ```css
  dialog#lightbox .modal-elemental-close { color: white; background: rgb(0 0 0 / 40%); }
  ```
- **A dialog long enough to scroll takes the cross with it.** That is the cost of the
  corner: an absolutely positioned box scrolls with the content it is positioned against.
  Give a long modal a close button of its own at the end of the content, where the reader
  ends up.
- **`closedby="none"` gets no cross.** That value is a dialog to be answered rather than
  dismissed, and a cross in the corner is a dismissal with a different shape. Write your own
  button there, saying what taking it means.

Focus starts on the cross, which is right for a dialog that is read and wrong for one that
is filled in. `autofocus` moves it:

```html
<dialog id="feedback">
  <h2>Send feedback</h2>
  <input name="what" autofocus>
</dialog>
```

## Nesting

Open a modal from inside a modal. There is nothing to turn on: the second `showModal()`
stacks, the first goes inert underneath it, <kbd>Esc</kbd> closes the innermost, and focus
walks back out the way it came in.

<!-- demo modal style="--code-preview-height:353px" -->

```html
<button type="button" command="show-modal" commandfor="settings">Settings</button>

<modal-elemental closedby="any">
  <dialog id="settings">
    <h2>Settings</h2>
    <p>Two devices are signed in.</p>
    <button type="button" command="show-modal" commandfor="confirm">Sign out everywhere</button>
  </dialog>
</modal-elemental>

<modal-elemental>
  <dialog id="confirm">
    <h2>Sign out everywhere?</h2>
    <p>You will have to sign in again on both devices.</p>
    <form method="dialog">
      <button type="submit" value="cancel">Cancel</button>
      <button type="submit" value="ok">Sign out</button>
    </form>
  </dialog>
</modal-elemental>
```

```css demo
/* room for the dialog: the preview frame is measured from the sample, and the sample is a button */
body { min-block-size: 20rem; }
```

The confirmation is a **sibling**, not a child. Either works — the browser does not care
where in the document a dialog sits, since the top layer is not the DOM — but a modal that
lives outside the one that opens it can be opened from anywhere else too, and it keeps the
markup of each one to the thing it says.

Only the bottom modal dims the page. Each dialog carries `data-depth`, and the stylesheet
paints the backdrop of `data-depth="1"` alone, so a stack of three is one sheet of dim with
three boxes on it rather than a page that gets darker the deeper you go.

Opening one **instead** of the others, rather than on top of them, is `close-others`:

```html
<modal-elemental close-others>
  <dialog id="terms">…</dialog>
</modal-elemental>
```

## Deep links and the back button

A modal whose `id` is the fragment of the URL opens itself. That is one mechanism doing three
jobs — an `<a href="#id">` that opens it, a link someone else can paste, and the **back
button closing it**, which is what a reader on a phone will press whether or not anyone told
them to.

```html
<a href="#pricing-details">What is included?</a>

<modal-elemental closedby="any">
  <dialog id="pricing-details">…</dialog>
</modal-elemental>
```

Closing it takes the fragment back off: the entry the link pushed is spent with
`history.back()`, so the next press does not reopen what was just closed. A modal opened by
a button does not touch the URL at all — the link is the thing that puts it there.

## Video and lightboxes

There is no video option, no lightbox mode and no player integration. A modal holds markup,
and markup is what an image or an embed already is. The one thing the element does for them
is the thing a modal has to: **when it closes, what was playing stops.** A closed dialog is
`display: none`, which pauses nothing — the sound would carry on over a page the reader has
already gone back to.

| Inside the dialog | On close                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `<video>`, `<audio>` | paused where it was, so reopening carries on from there        |
| `<iframe>`        | parked at `about:blank`, since a cross-origin player cannot be paused from here — the framed document is discarded, so it reopens at the start |

Starting it is the other half, and that one is yours: `modal-toggle` says when a modal
opened and hands you the dialog, `play()` is the platform's, and a player in an iframe takes
its instruction as a query parameter. Both are below.

### A lightbox

<!-- demo modal style="--code-preview-height:545px" -->

```html
<button type="button" class="thumb" command="show-modal" commandfor="lightbox">
  <img src="https://picsum.photos/id/136/320/200" alt="Tall sandstone towers rising out of pine woods" width="320" height="200">
</button>

<modal-elemental closedby="any">
  <dialog id="lightbox" aria-label="Tall sandstone towers rising out of pine woods">
    <img src="https://picsum.photos/id/136/1280/800" alt="Tall sandstone towers rising out of pine woods" width="1280" height="800">
  </dialog>
</modal-elemental>
```

```css demo
body { margin: 0; padding: 1rem; min-block-size: 32rem; font: 1rem/1.5 system-ui, sans-serif; }

.thumb { padding: 0; border: 0; background: none; cursor: pointer; }
.thumb img { display: block; border-radius: 0.25rem; }

/* the theme's box, opened out for a picture: no padding, no surface, wider */
modal-elemental > dialog#lightbox {
  --modal-elemental-max-width: 60rem;
  padding: 0;
  background: none;
  box-shadow: none;
  overflow: visible;
}

/* the picture is sized against the viewport, not against the box: the box is
   `fit-content` around the picture, so a percentage of it would be measuring itself.
   `object-fit` is for the short viewport, where the height cap is what bites */
#lightbox img {
  display: block;
  inline-size: min(60rem, calc(100vw - 3rem));
  block-size: auto;
  max-block-size: calc(100dvh - 3rem);
  object-fit: contain;
  border-radius: 0.5rem;
}

/* the element's own cross, repainted for a photograph: it inherits the page's text
   colour, and no page colour is safe over a picture nobody chose */
#lightbox .modal-elemental-close {
  color: white;
  background: rgb(0 0 0 / 40%);
}

#lightbox .modal-elemental-close:hover { background: rgb(0 0 0 / 65%); }
```

The dialog is named with `aria-label` here because there is no heading to point at — a
picture is the whole of it. The close button is not in the markup because the element writes
it; the CSS above only repaints it, since a cross in the page's own text colour is a cross
nobody finds against a photograph.

<small>Photograph by Marcin Czerwinski, from <a href="https://unsplash.com/license">Unsplash</a>, served here through <a href="https://picsum.photos">Lorem Picsum</a>.</small>

### A video

<!-- demo modal style="--code-preview-height:353px" -->

```html
<button type="button" command="show-modal" commandfor="clip">Watch the clip</button>

<modal-elemental closedby="any">
  <dialog id="clip" aria-label="A film clip, captioned">
    <video controls playsinline width="640" crossorigin="anonymous"
      src="https://mdn.github.io/shared-assets/videos/friday.mp4">
      <track kind="captions" label="English" srclang="en" default
        src="https://mdn.github.io/shared-assets/misc/friday.vtt">
    </video>
  </dialog>
</modal-elemental>
```

```css demo
body { margin: 0; padding: 1rem; min-block-size: 20rem; font: 1rem/1.5 system-ui, sans-serif; }

modal-elemental > dialog#clip { --modal-elemental-max-width: 40rem; padding: 0.5rem; }
#clip video { display: block; width: 100%; height: auto; }

/* the element's own cross, repainted for a film: it inherits the page's text colour, and a
   picture that moves has no colour that stays safe under it */
#clip .modal-elemental-close { color: white; background: rgb(0 0 0 / 40%); }
#clip .modal-elemental-close:hover { background: rgb(0 0 0 / 65%); }
```

```js demo
// One listener for every modal on the page: `modal-toggle` bubbles, and its detail carries
// the dialog that opened.
document.addEventListener('modal-toggle', (e) => {
  if (!e.detail.open) return;
  const video = e.detail.dialog.querySelector('video');
  if (!video) return;
  // A rejected promise here is the browser's autoplay policy, not a bug: a modal opened
  // from the URL arrives with no click behind it, and sound needs one.
  video.play().catch(() => {});
});
```

Open it and it plays; close it and it stops at the second the reader left it; reopen, and it
carries on from there. The pause is the element's, the play is that listener, and nothing
else is needed on either end.

Two things make it work. The listener runs inside the click that opened the modal, so the
gesture the [autoplay policy](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
asks for is still the browser's to spend — checked in Chrome on this page: the promise
resolves and the clip runs, with nothing muted to get it there. And `autoplay` on the
`<video>` is not the same thing and not what you want here: the attribute fires when the
page loads, not when the modal opens, on a video nobody has asked for yet.

The `<track>` is not decoration and not this element's doing —
[WCAG 2.2 SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)
asks for captions on anything prerecorded that has audio, and a video in a modal is still a
video. `crossorigin="anonymous"` is what makes it work from another origin: a caption file
is fetched under CORS, and without that attribute the track loads as nothing at all, silently.
Same origin, drop it.

<small>The clip and its caption file are MDN's, from
[mdn/shared-assets](https://github.com/mdn/shared-assets).</small>

### YouTube and Vimeo

The same markup, with the player's own iframe in it. Autoplay is a query parameter rather
than a listener, because the frame is not loaded until the modal is opened — `autoplay=1` is
read at that load, and the click that opened the dialog is the gesture behind it, handed to
the player by `allow="autoplay"`. Checked in Chrome on this page: opening the modal starts
the film. A browser that blocks autoplay with sound — Firefox does, by default — loads the
same frame and leaves it on its own play button, which is the failure worth having.

<!-- demo modal style="--code-preview-height:353px" -->

```html
<button type="button" command="show-modal" commandfor="talk">Watch the film</button>

<modal-elemental closedby="any">
  <dialog id="talk" aria-label="Big Buck Bunny">
    <iframe
      src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?autoplay=1"
      title="Big Buck Bunny, a Blender Foundation short film"
      width="560" height="315" loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
      allowfullscreen
    ></iframe>
  </dialog>
</modal-elemental>
```

```css demo
body { margin: 0; padding: 1rem; min-block-size: 20rem; font: 1rem/1.5 system-ui, sans-serif; }

modal-elemental > dialog#talk { --modal-elemental-max-width: 40rem; padding: 0.5rem; }
#talk iframe { display: block; width: 100%; aspect-ratio: 16 / 9; height: auto; border: 0; }
```

<small><em>Big Buck Bunny</em> © Blender Foundation, <a href="https://peach.blender.org/">peach.blender.org</a>, CC BY 3.0 — played here from YouTube, which is a third party this page hands nothing to until you press the button.</small>

Vimeo is the same shape, with the parameter it uses for the same thing:

```html
<modal-elemental closedby="any">
  <dialog id="reel" aria-label="The reel">
    <iframe
      src="https://player.vimeo.com/video/VIDEO_ID?autoplay=1"
      title="The reel"
      width="640" height="360" loading="lazy"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
    ></iframe>
  </dialog>
</modal-elemental>
```

Both players are sized by ratio rather than by height, which is the `aspect-ratio` line in
the sample's CSS: an iframe's `height` attribute is a starting number, and a width in
percent with a height in pixels is a letterbox at every size but one.

Four things that are not optional on an embed. `title`, because an iframe with no title is
announced as "frame" and nothing else. `youtube-nocookie.com` over `youtube.com`, which is
the same player without the tracking cookie. `allowfullscreen`, since a video in a modal is
exactly where someone will reach for it. And `loading="lazy"`, which is what holds the fetch
until the modal is opened — without it the player is loaded, and told who is reading, on
every page view that never opens the dialog. Checked in Chromium: a plain iframe in a closed
`<dialog>` requests its source immediately, a lazy one waits for `showModal()`.

Closing the modal points the frame at `about:blank`, which is what stops the player: the
document that was playing is discarded, and the `src` and `loading` the markup above wrote
are put back on the next open.

Reloading the frame in place — setting `src` to the value it already had — is the version
that looks right and is not. A `loading="lazy"` frame inside a closed dialog is `display:
none`, so that navigation is deferred until the frame is on screen again, and the player goes
on running behind the dialog the reader has dismissed. Measured with this demo's markup on a
page of its own: closing the modal left the YouTube document loaded in Chromium 151 and
Firefox 153, where parking leaves the frame at `about:blank` in both. Firefox defers a lazy
navigation to `about:blank` too, which is why `loading` is `eager` for that one hop and back
to what the author wrote afterwards — a parked frame reads `src="about:blank"
loading="eager"` for as long as its modal is closed.

Counting requests, with a frame of one's own in the player's place, in Chromium 151, Firefox
153 and WebKit 26.5: one when the modal is opened, none when it is closed, one more on each
reopen. What a reader gets from that is the video from the beginning each time, which is the
price of a player that only takes instructions from its own origin.

## Degrading

| Missing                      | What you get                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| the script never loads       | `<a href="#id">` still reaches the dialog: `style.scss` shows it **in the page**, in flow, not modal. No cross either — the element writes that — so what closes it is whatever you wrote yourself |
| the script never loads, and the browser has invoker commands | `command="show-modal"` opens it natively — modal, and without the animation |
| `prefers-reduced-motion`     | no transition either way. The element waits for an animation that is not there and closes at once |
| the theme is not imported    | the browser's own dialog box, with the backdrop and the motion from `style.scss`           |

That first row is why the fragment is worth supporting at all: a modal is usually a piece of
the page, and a piece of the page a reader cannot get to is a piece of the page that is gone.

> [!NOTE]
> On iOS, touch scrolling gets past `overflow: hidden` on the root, so the page behind can
> still be dragged. `overscroll-behavior: contain` on the dialog and its backdrop is what
> closes that, and it is in `style.scss` already — Chrome 144 was the first to honour it
> there, and the rest will follow.

## The page does not jump when a modal opens

Locking the scroll takes the scrollbar away with it, and on every platform that draws a
classic one — Windows, most Linux, macOS set to _always show_ — the page behind is handed
that width back as content and shifts sideways under the backdrop. The old fix was to
measure the scrollbar in script and pad the body by it. `style.scss` reserves the space in
CSS instead:

```css
html:has(modal-elemental) {
  scrollbar-gutter: stable;
}
```

[`scrollbar-gutter: stable`](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-gutter)
holds the gutter whether the box overflows or not, and holds it under `overflow: hidden` as
well, so opening a modal changes no width at all. It is on the page from the first paint
rather than added with the modal, because a gutter that arrives on open is the same jump in
the other direction on a page too short to have had a scrollbar — and it is scoped to a page
that has a `<modal-elemental>` in it, so a page that can never lock keeps its layout
untouched.

What it costs: on those same classic-scrollbar platforms a page short enough not to scroll
still shows the empty gutter. That is the trade — a strip that is always there against a
layout that moves — and if you would rather have neither, `html { scrollbar-gutter: auto }`
in your own stylesheet puts the jump back.

Two things worth knowing. Safari before 18.2 does not implement the property and shifts as
it always did; its scrollbars overlay the content by default, so there is usually nothing
there to shift. And a `<modal-elemental>` **appended to the page later** brings the gutter
with it, which is one jump at insertion instead of one at open — put the dialog in the
markup, or set `scrollbar-gutter: stable` on `html` yourself, if a page builds its modals
on the fly.

## API

### Attributes

| Attribute       | Type    | Default        | Description                                                         |
| --------------- | ------- | -------------- | ------------------------------------------------------------------- |
| `closedby`      | enum    | `closerequest` | `any`, `closerequest` or `none`. Moved up from the `<dialog>` if written there |
| `close-others`  | boolean | —              | Opening this one closes every modal already open, instead of stacking |
| `close-text`    | string  | `Close`        | The close button's accessible name                                    |

### Properties

| Property   | Type                | Description                                            |
| ---------- | ------------------- | ------------------------------------------------------ |
| `dialog`   | `HTMLDialogElement` | Read-only. The direct child it upgrades                |
| `open`     | boolean             | Read-only. True until the closing animation is over    |
| `closedBy` | string              | Read-only. What `closedby` resolves to                 |

### Methods

| Method             | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `show()`           | Opens it, honouring `close-others`                                 |
| `close(value?)`    | Animates it out, then closes with that `returnValue`               |

Calling `close()` on the `<dialog>` itself still works — the platform performs it
immediately, without the animation, and the element tidies up after it. `showModal()` and
`show()` on the dialog are picked up in full, animation included.

### Events

| Event          | Detail                                                              |
| -------------- | ------------------------------------------------------------------- |
| `modal-toggle` | `open` — the new state. `dialog` — the dialog. `depth` — how deep in a stack it sits, `0` once closed |

The dialog's own `close` and `cancel` events are untouched and still fire, on the `<dialog>`,
where the platform puts them.

### Styling hooks

```css
modal-elemental > dialog[data-state="open"] {
} /* on screen, or arriving */
modal-elemental > dialog[data-state="closing"] {
} /* leaving, and still in the top layer */
modal-elemental > dialog[data-depth="1"] {
} /* the bottom modal — the one that dims the page */
modal-elemental:not(:defined) {
} /* before upgrade */
.modal-elemental-close {
} /* the cross the element writes */
```

`data-state` is the animation's hook, and `[open]` is not: the dialog is still open through
the whole of its exit, which is what keeps it in the top layer while it fades.

## The look

`style.scss` is structure, motion and the sheet of dim — the last of which is not decoration:
the APG only lets a dialog call itself modal when the content behind it is
[obscured as well as inert](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). `theme.scss`
is the box, and is optional.

| Property                        | Default              | Description                                              |
| ------------------------------- | -------------------- | -------------------------------------------------------- |
| `--modal-elemental-duration`    | `200ms`              | Both ends of the animation. `0s` closes instantly        |
| `--modal-elemental-easing`      | `ease`               | Both ends                                                |
| `--modal-elemental-backdrop`    | `rgb(0 0 0 / 50%)`   | The sheet over the page                                  |
| `--modal-elemental-max-width`   | `32rem`              | Capped again at `100% - 2rem`, so a phone keeps its gutter |
| `--modal-elemental-padding`     | `1.5rem`             | Inside the box                                           |
| `--modal-elemental-radius`      | `0.75rem`            | Its corners                                              |
| `--modal-elemental-close-size`  | `2rem`               | The cross in the corner, both axes. Its glyph is sized from it |
| `--modal-elemental-close-inset` | `0.75rem`            | How far the cross sits from the box's corner             |
| `--modal-elemental-margin-block` | `auto`              | Where it sits: `auto` centres, `5vh auto` pins it near the top |

<!-- demo modal tab="options" style="--code-preview-options-height:523px" -->

```html
<button type="button" command="show-modal" commandfor="options-dialog">Open it</button>

<modal-elemental closedby="any">
  <dialog id="options-dialog">
    <h2>Turn the knobs</h2>
    <p>The Options tab restyles this box. Copy the rule out of the bottom of the panel.</p>
    <form method="dialog"><button type="submit">Close</button></form>
  </dialog>
</modal-elemental>
```

```css demo
/* room for the dialog: the preview frame is measured from the sample, and the sample is a button */
body { min-block-size: 20rem; }
```

A dialog whose height changes while it is being read — a search, a form that reveals a field
— is the case for `--modal-elemental-margin-block: 5vh auto`. Centred, the box moves under
the reader every time it grows.

Two more things the theme does that are worth knowing before you restyle it. The element
right after the cross — usually the heading — is given room on that side, since the cross is
out of the flow and would otherwise sit on top of the last word; a dialog with no cross
reserves nothing. And the close waits for the animation **the stylesheet** describes: the
element reads how long each transition says it takes and gives up on one that overruns it, up
to two seconds, so a transition that stalls can never leave a modal that cannot be closed.

## Modal, or something else?

| Wanted                                          | Element                                                       |
| ----------------------------------------------- | ------------------------------------------------------------- |
| a window that takes over the page until it is answered | this                                                    |
| a panel that shows and hides in place          | [`<disclosure-elemental>`](disclosure.html)                    |
| a drawer that is a panel at one breakpoint and a sheet at another | [`<disclosure-elemental media>`](disclosure.html) |
| a list of actions hanging off a button          | [`<menu-elemental>`](menu.html)                                |
| a hint on hover and focus                       | [`<tooltip-elemental>`](tooltip.html)                          |

A modal is the heaviest thing on this list: it takes the page away, and everything else on it
has to wait. Reach for one when the answer is genuinely needed before anything else can
happen — and when it is not, a disclosure in the flow of the page is the thing that does not
interrupt.

<script src="{{ relativePathPrefix }}dist/elementals/modal.js"></script>
