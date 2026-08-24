---
layout: poops-docs-theme/docs
title: Before and after
description: A retouch revealed by dragging a seam across it — splitter-elemental and four rules of CSS, plus an honest account of why this is not a compare slider and when to reach for the real one.
order: 9
---

# Before and after

Drag the seam and the picture changes from the graded version to the original. On a narrow
screen it is the same thing turned on its side — a top and a bottom rather than a left and a
right.

It is [`<splitter-elemental>`](../elementals/splitter.html), four rules of your own CSS for the
illusion and seven more for the knob over the seam — and it is worth knowing why it works,
because what it is doing is not what it looks like.

<!-- demo splitter style="--code-preview-height:501px" -->

```html
<splitter-elemental class="reveal" vertical-when="(width < 32rem)" label-text="Reveal the graded picture">
  <div><img src="https://picsum.photos/id/62/1200/800" alt="Rolling hills at dawn, before grading"></div>
  <div><img class="graded" src="https://picsum.photos/id/62/1200/800" alt="The same hills, graded to black and white"></div>
</splitter-elemental>
```

```css demo
/* the handle and the two tracks are the element's; the illusion is these four rules.
   `size` rather than `inline-size` once there is a handle, because the picture is measured
   against both axes below and `cqh` needs the block one — and `aspect-ratio` is what makes
   that height definite. Ungated it would be size containment with nothing to resolve
   against, which is a splitter 0 tall before the script arrives */
splitter-elemental.reveal { container-type: inline-size; }
.reveal[data-splitter-panes] { container-type: size; aspect-ratio: 3 / 2; }
.reveal[data-splitter-panes] > div:not([data-splitter-handle]) { position: relative; overflow: hidden; }

/* each pane holds a picture the size of the whole splitter, pinned to the corner its pane
   never leaves — so the two halves are the same frame and line up across the seam. Both
   corners, so the pins turn with the panes: pinning the first to the top left and the second
   to the bottom right is the same instruction side by side and stacked */
.reveal[data-splitter-panes] img {
  position: absolute;
  inline-size: 100cqw;
  max-inline-size: none;
  block-size: 100cqh;
  object-fit: cover;
}
.reveal[data-splitter-panes] > div:first-child img { inset-block-start: 0; inset-inline-start: 0; }
.reveal[data-splitter-panes] > div:last-child img { inset-block-end: 0; inset-inline-end: 0; }

/* the "after". A filter here so the sample needs one photograph rather than two */
.reveal .graded { filter: grayscale(1) contrast(1.15); }

/* a one-pixel seam, and the target moved off it into a knob. The handle's column is 1px
   wide, so the band of missing picture is a hairline; its `::before` is a 40px circle that
   overflows that box, and a pseudo element hit-tests as part of the element it belongs to,
   so the circle is what a pointer has to hit. Which is why the pane rule above says
   `:not([data-splitter-handle])` — the handle is a `<div>` as well, and an `overflow:
   hidden` meant for a pane would clip the knob back to one pixel */
.reveal[data-splitter-panes] { --splitter-elemental-size: 1px; }

.reveal[data-splitter-panes] > [data-splitter-handle]::before,
.reveal[data-splitter-panes] > [data-splitter-handle]::after {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  content: "";
}

/* the theme's three dots are this same `::before`, so this replaces them rather than
   landing beside them. `Canvas` and `CanvasText` are the page's own pair and follow a theme
   switch; the ring and the shadow are what keep a white knob off a pale sky */
.reveal[data-splitter-panes] > [data-splitter-handle]::before {
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border-radius: 50%;
  background: Canvas;
  box-shadow:
    0 0 0 1px color-mix(in srgb, CanvasText 20%, transparent),
    0 1px 3px rgb(0 0 0 / 0.3);
}

/* Octicon `arrow-both`, drawn as a mask rather than as a picture, so the ink is a colour
   this page sets and not one baked into the data URI */
.reveal[data-splitter-panes] > [data-splitter-handle]::after {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  background: CanvasText;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.72 3.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.56 7h10.88l-2.22-2.22a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l2.22-2.22H2.56l2.22 2.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-3.5-3.5a.75.75 0 0 1 0-1.06Z'/%3E%3C/svg%3E") center / contain no-repeat;
}

/* stacked, the arrows point the way the panes now move */
.reveal[vertical][data-splitter-panes] > [data-splitter-handle]::after { rotate: 90deg; }

/* the browser's ring would otherwise be drawn round the 1px handle, which is a hairline
   nobody can see. On the knob it is the size of the control it marks */
.reveal[data-splitter-panes] > [data-splitter-handle]:focus-visible { outline: none; }
.reveal[data-splitter-panes] > [data-splitter-handle]:focus-visible::before {
  outline: 3px solid Highlight;
  outline-offset: 2px;
}

/* ungated, so the picture is still a picture before the script arrives */
.reveal img { display: block; inline-size: 100%; }
```

<small>Photograph by Daniel Genser, from <a href="https://unsplash.com/license">Unsplash</a>, served here through <a href="https://picsum.photos">Lorem Picsum</a>.</small>

**Nothing is being revealed.** The two panes genuinely resize, exactly as they do on the
[splitter's own page](../elementals/splitter.html); the illusion is that each one holds a picture
the size of the whole splitter, pinned to the corner its pane never leaves — the first to the top
left, the second to the bottom right. `100cqw` and `100cqh` are what make "the size of the whole
splitter" numbers the panes cannot change, which is why the two `container-type` declarations are
the first rules and not a detail: `inline-size` on the bare tag, so the no-script version still
takes its height from the pictures in it, and `size` once there is a handle, because `cqh` needs a
block axis and `aspect-ratio` is what makes that one definite. Measured on a 600px splitter: both
pictures 600 wide at the same x, and still there after the separator has moved to 144.

**It turns with the screen.** `vertical-when="(width < 32rem)"` is the only thing in the markup that is not
the element's usual two panes, and while that matches the reveal is a top and a bottom rather than
a left and a right — the same frame, the same drag, one axis over. Nothing in the CSS is about the
new axis: a corner pin is the same instruction read either way round, and the height does not
change with the flip because `aspect-ratio` is what sets it — which is also the height a
[stacked splitter needs](../elementals/splitter.html#which-way-round-vertical-is) and would
otherwise have to be given.

**The handle is a band of missing picture, so here it is one pixel of one.** It has a column of
its own wherever this element is used, and the two halves are `--splitter-elemental-size` apart
rather than edge to edge — where a real reveal has a hairline over a continuous image.
`--splitter-elemental-size: 1px` is as close to that hairline as this can get.

**What the band was carrying was the target, and the knob takes it back.** Narrowing the handle
to a pixel spends the
[24px target](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) that made it
a control anyone can hit — so the CSS puts a 40px circle on the handle's `::before`, overflowing
its 1px box, and a pseudo element hit-tests as part of the element it belongs to. The circle is
what a pointer has to hit; the pixel is only what it looks like. The browser's focus ring is
moved onto the knob for the same reason: drawn round a 1px handle it is a hairline nobody can
see.

That arrangement is [`<compare-images-slider>`](https://github.com/stamat/compare-images-slider)'s
own — a 2px handle under a 42px knob — and the arrows in the middle are the same
[Octicon `arrow-both`](https://primer.style/octicons/arrow-both-16), masked rather than embedded
so the ink is a colour this page sets. `Canvas` and `CanvasText` are that colour pair, so the
knob turns with the theme; the ring and the shadow are what keep a white circle off a pale sky.

**It is images only.** A pane holding text would reflow as it narrows, because it is genuinely
narrowing — there is nothing to pin. That is the difference from a real reveal, where the layer in
front is full size and clipped.

**Without script it is two pictures, one above the other** — before over after, in reading order,
which is the honest flat version of a before/after. Every rule above but the last is gated on
`data-splitter-panes`, so none of them applies until there is a handle; the ungated one is what
keeps the pictures inside the column in the meantime.

## The real one

[`<compare-images-slider>`](https://github.com/stamat/compare-images-slider) is a separate package
that does this properly. It wears the same `role="separator"` on the same kind of handle and does
the opposite thing with it:

| | `<splitter-elemental>` | `<compare-images-slider>` |
| --- | --- | --- |
| What moves | both panes: one gets the width the other gives up | nothing. Both layers stay full size |
| How | three grid tracks, resized | a `clip-path` on the layer in front |
| What it is for | a sidebar, an editor beside its preview | before and after — a retouch, a renovation, a map at two dates |
| Where the content is | side by side, and both readable at once | stacked, and you reveal one by hiding the other |
| What can go behind the seam | pictures, because they are what can be pinned | anything, because nothing is resized |

The tell is whether anything changes size. If the two things are the *same* thing in two states,
you want the compare slider. If they are two different things sharing a width, you want the
splitter.

So build it out of the splitter when the two things are the same frame and you want no dependency
at all. Reach for the real one when you want inertia, a double-tap to either extreme, a drag that
starts anywhere, or anything but an image behind the seam.
