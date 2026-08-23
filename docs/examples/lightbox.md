---
layout: poops-docs-theme/docs
title: Lightbox
description: A gallery that opens the picture you clicked full size and pages through the rest — modal-elemental holding carousel-elemental, and six lines of glue.
order: 3
---

# Lightbox

Click a thumbnail, the picture opens over the page, and the arrows walk through the whole
gallery from wherever you came in. Escape closes it and the focus goes back to the thumbnail
you started from.

It is [`<modal-elemental>`](../elementals/modal.html) with
[`<carousel-elemental>`](../elementals/carousel.html) inside it, and neither of them needed a
line of new code to do this. What the page adds is six lines saying *which* picture to open
on.

<ul class="demo-thumbs">
  <li><button type="button" command="show-modal" commandfor="lightbox-dialog" data-index="0"><img src="https://picsum.photos/id/62/480/360" alt="Rolling green hills at dawn, dark conifers along the right-hand ridge and mist in the valley" width="480" height="360" loading="lazy"></button></li>
  <li><button type="button" command="show-modal" commandfor="lightbox-dialog" data-index="1"><img src="https://picsum.photos/id/66/480/360" alt="A flat plain of low scrub with a bare mountain ridge behind it under heavy cloud" width="480" height="360" loading="lazy"></button></li>
  <li><button type="button" command="show-modal" commandfor="lightbox-dialog" data-index="2"><img src="https://picsum.photos/id/74/480/360" alt="A lone kayaker on flat blue water, a city skyline low on the far shore" width="480" height="360" loading="lazy"></button></li>
  <li><button type="button" command="show-modal" commandfor="lightbox-dialog" data-index="3"><img src="https://picsum.photos/id/77/480/360" alt="A wooden pier running out to a small hut over pale green sea" width="480" height="360" loading="lazy"></button></li>
  <li><button type="button" command="show-modal" commandfor="lightbox-dialog" data-index="4"><img src="https://picsum.photos/id/70/480/360" alt="A straight road under an avenue of trees, fading into fog" width="480" height="360" loading="lazy"></button></li>
  <li><button type="button" command="show-modal" commandfor="lightbox-dialog" data-index="5"><img src="https://picsum.photos/id/85/480/360" alt="A tractor and round hay bales on a cut field under a wide blue sky" width="480" height="360" loading="lazy"></button></li>
</ul>

<modal-elemental close-text="Close the gallery">
  <dialog id="lightbox-dialog" aria-label="Gallery" class="demo-lightbox">
    <carousel-elemental fade aria-label="Gallery" picker-text="Choose a picture">
      <ul>
        <li><img src="https://picsum.photos/id/62/1280/960" alt="Rolling green hills at dawn, dark conifers along the right-hand ridge and mist in the valley" width="1280" height="960" loading="lazy"></li>
        <li><img src="https://picsum.photos/id/66/1280/960" alt="A flat plain of low scrub with a bare mountain ridge behind it under heavy cloud" width="1280" height="960" loading="lazy"></li>
        <li><img src="https://picsum.photos/id/74/1280/960" alt="A lone kayaker on flat blue water, a city skyline low on the far shore" width="1280" height="960" loading="lazy"></li>
        <li><img src="https://picsum.photos/id/77/1280/960" alt="A wooden pier running out to a small hut over pale green sea" width="1280" height="960" loading="lazy"></li>
        <li><img src="https://picsum.photos/id/70/1280/960" alt="A straight road under an avenue of trees, fading into fog" width="1280" height="960" loading="lazy"></li>
        <li><img src="https://picsum.photos/id/85/1280/960" alt="A tractor and round hay bales on a cut field under a wide blue sky" width="1280" height="960" loading="lazy"></li>
      </ul>
    </carousel-elemental>
  </dialog>
</modal-elemental>

<small>Photographs by Daniel Genser, Nicholas Swanson, Isaak Dury, May Pamintuan, Dorothy Lin, Gozha Net, from <a href="https://unsplash.com/license">Unsplash</a>, served here through <a href="https://picsum.photos">Lorem Picsum</a>.</small>

## The markup

The gallery is a list of buttons. `command` and `commandfor` open the dialog — that is the
platform's own invoker, not something this book invented — and `data-index` is the page's own
note of which picture the button belongs to. `fade` is the carousel's other mode: the slides
stack and cross-fade instead of scrolling past each other, which is what a lightbox wants —
nobody opening the fourth picture asked to watch the three before it go by. The dialog then
grows and shrinks with the picture showing, since a stack takes the height of the slide it is
on rather than of the tallest one.

```html
<ul class="gallery">
  <li>
    <button type="button" command="show-modal" commandfor="lightbox-dialog" data-index="0">
      <img src="hills-thumb.jpg" alt="Rolling green hills at dawn" />
    </button>
  </li>
  …
</ul>

<modal-elemental close-text="Close the gallery">
  <dialog id="lightbox-dialog" aria-label="Gallery">
    <carousel-elemental fade aria-label="Gallery" picker-text="Choose a picture">
      <ul>
        <li><img src="hills.jpg" alt="Rolling green hills at dawn" /></li>
        …
      </ul>
    </carousel-elemental>
  </dialog>
</modal-elemental>
```

## The glue

```javascript
const carousel = document.querySelector('#lightbox-dialog carousel-elemental');

document.querySelector('.gallery').addEventListener('click', (e) => {
  const button = e.target.closest('[data-index]');
  if (button) carousel.to(Number(button.dataset.index));
});
```

That is the whole of it. The click says which picture, the invoker opens the dialog, and the
two happen in either order without caring.

## Why that is six lines and not sixteen

**A carousel inside a closed dialog has no width.** `<dialog>` without `open` is
`display: none`, so a scrolling row measures zero — and scrolling a box with no layout does
nothing at all. A page using the row would have to hold the number and wait for
`modal-toggle` before spending it. `fade` has nothing to measure: the slide to show is an
attribute, so `to()` lands on a dialog that is still shut and the picture is already the
current one by the time it opens.

**Which is also what makes the jump instant.** A transition on a box that is not being
rendered does not run, so the fourth picture is simply there on open rather than fading in
from the first. The arrows inside the modal still cross-fade, because by then the dialog is on
screen and the transition has something to animate.

## What the two elements are already doing

| Part | What it already does |
| --- | --- |
| `<dialog>` + `showModal()` | The top layer, the page behind going inert, <kbd>Escape</kbd>, and the focus returning to the thumbnail you opened from |
| `<modal-elemental>` | The close button, the animated close, and `modal-toggle` |
| `<carousel-elemental>` | `aria-roledescription="carousel"`, each picture named `3 of 6`, the picker, the cross-fade, the live region `fade` owes a screen reader, and arrows that dim at the ends |
| Neither | Anything new. This page is the only thing that knows what a lightbox is |

## What it costs

The pictures exist twice: once as thumbnails, once as slides. That is inherent to a lightbox
whose thumbnails are a grid and whose slides are a row — the alternative is moving the same
nodes between two layouts, which loses focus and scroll position every time it happens. It is
not doubled for a screen reader, because a `<dialog>` that is not open is `display: none` and
nothing inside it is in the tree at all. **Keep the two `alt` texts identical**, or the same
picture answers to two different descriptions depending on how you got to it. Give every one
of them a `width` and a `height` too, so neither the grid nor the row resizes under the reader
while they load.

At six pictures that is all it costs. At two hundred it is two hundred `alt` texts that have
to agree with two hundred others, which is the version below.

## A gallery at scale

Write each picture once, as a link to it. The dialog starts empty, and the slides are built
the first time somebody opens it:

<ul class="demo-thumbs demo-gallery">
  <li><a href="https://picsum.photos/id/62/1280/960"><img src="https://picsum.photos/id/62/480/360" alt="Rolling green hills at dawn, dark conifers along the right-hand ridge and mist in the valley" width="480" height="360" loading="lazy"></a></li>
  <li><a href="https://picsum.photos/id/66/1280/960"><img src="https://picsum.photos/id/66/480/360" alt="A flat plain of low scrub with a bare mountain ridge behind it under heavy cloud" width="480" height="360" loading="lazy"></a></li>
  <li><a href="https://picsum.photos/id/74/1280/960"><img src="https://picsum.photos/id/74/480/360" alt="A lone kayaker on flat blue water, a city skyline low on the far shore" width="480" height="360" loading="lazy"></a></li>
  <li><a href="https://picsum.photos/id/77/1280/960"><img src="https://picsum.photos/id/77/480/360" alt="A wooden pier running out to a small hut over pale green sea" width="480" height="360" loading="lazy"></a></li>
  <li><a href="https://picsum.photos/id/70/1280/960"><img src="https://picsum.photos/id/70/480/360" alt="A straight road under an avenue of trees, fading into fog" width="480" height="360" loading="lazy"></a></li>
  <li><a href="https://picsum.photos/id/85/1280/960"><img src="https://picsum.photos/id/85/480/360" alt="A tractor and round hay bales on a cut field under a wide blue sky" width="480" height="360" loading="lazy"></a></li>
</ul>

<modal-elemental close-text="Close the gallery">
  <dialog id="gallery-dialog" aria-label="Gallery" class="demo-lightbox">
    <carousel-elemental fade aria-label="Gallery" picker-text="Choose a picture">
      <ul></ul>
    </carousel-elemental>
  </dialog>
</modal-elemental>

```html
<ul class="gallery">
  <li>
    <a href="hills.jpg">
      <img src="hills-thumb.jpg" alt="Rolling green hills at dawn" width="480" height="360" />
    </a>
  </li>
  …
</ul>

<modal-elemental close-text="Close the gallery">
  <dialog id="gallery-dialog" aria-label="Gallery">
    <carousel-elemental fade aria-label="Gallery" picker-text="Choose a picture">
      <ul></ul>
    </carousel-elemental>
  </dialog>
</modal-elemental>
```

```javascript
const gallery = document.querySelector('.gallery');
const dialog = document.querySelector('#gallery-dialog');
const carousel = dialog.querySelector('carousel-elemental');

gallery.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  e.preventDefault();

  const links = [...gallery.querySelectorAll('a[href]')];
  if (!carousel.slides.length) {
    carousel.scroller.append(
      ...links.map((a) => {
        const li = document.createElement('li');
        const img = new Image();
        img.src = a.href;
        img.alt = a.querySelector('img').alt;
        li.append(img);
        return li;
      })
    );
    carousel.wire();
  }

  carousel.to(links.indexOf(link));
  dialog.showModal();
});
```

**The `href` is the fallback.** A gallery of links to pictures is a working gallery before a
line of this arrives: click a thumbnail with no script and the browser shows you the picture,
which is the oldest gallery on the web and still the one that never breaks. The version above
gets its fallback from `command`/`commandfor`; this one gets it from `href`, and pays for that
with the `preventDefault()` the invoker did not need.

**The `alt` is written once.** The slide borrows the thumbnail's, so the bolded warning in the
section above has nothing left to warn about — there is one description of each picture and
one place to fix it.

**`wire()` is what turns the pattern on.** The carousel upgrades over an empty list and does
nothing, because one slide is a figure and none is not even that; it binds its listeners and
waits. Appending the slides and calling
[`wire()`](../elementals/carousel.html#slides-that-change) writes the roles, the names and the
picker over what is now there. It is guarded on `carousel.slides.length`, so the building
happens on the first open and never again — no teardown, and nothing to get wrong while the
close animation is still running.

Two things this owes you. The built `<img>` has no `width` and `height`, because the gallery
does not know the full-size dimensions — so give the slide an `aspect-ratio` in CSS or the
dialog resizes as the first picture lands. And opening fetches **every** picture rather than
the one you asked for, since `fade` stacks them and the whole list stops being `display: none`
at once. That is true of the version above too; at two hundred pictures it stops being free,
and building only the slides on either side of the one you opened is the next thing this
example would have to grow.

<small>Same photographs as above, served through <a href="https://picsum.photos">Lorem Picsum</a>.</small>

<script src="{{ relativePathPrefix }}dist/elementals/carousel.js"></script>
<script src="{{ relativePathPrefix }}dist/elementals/modal.js"></script>
<script>
  (() => {
    const carousel = document.querySelector("#lightbox-dialog carousel-elemental");

    document.querySelector(".demo-thumbs").addEventListener("click", (e) => {
      const button = e.target.closest("[data-index]");
      if (button) carousel.to(Number(button.dataset.index));
    });
  })();

  (() => {
    const gallery = document.querySelector(".demo-gallery");
    const dialog = document.querySelector("#gallery-dialog");
    const carousel = dialog.querySelector("carousel-elemental");

    gallery.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;
      e.preventDefault();

      const links = [...gallery.querySelectorAll("a[href]")];
      if (!carousel.slides.length) {
        carousel.scroller.append(
          ...links.map((a) => {
            const li = document.createElement("li");
            const img = new Image();
            img.src = a.href;
            img.alt = a.querySelector("img").alt;
            li.append(img);
            return li;
          })
        );
        carousel.wire();
      }

      carousel.to(links.indexOf(link));
      dialog.showModal();
    });
  })();
</script>
