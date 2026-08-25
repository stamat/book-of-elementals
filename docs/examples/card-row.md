---
layout: poops-docs-theme/docs
title: Card row
description: The marketing shelf — a row of cards wider than the column it sits in, the next one peeking past the edge, arrows and no dots. All of it CSS over carousel-elemental.
order: 2
---

# Card row

The shelf every product page has: cards in a row wider than the text above them, the next one
cut off by the edge of the screen so you can see there is more, and a pair of arrows in the
corner. Apple's store pages are the version everyone recognises.

It is [`<carousel-elemental>`](../elementals/carousel.html) with **nothing added**. The
element is the same one the docs page shows full-width slides in — the shelf is a slide width,
two paddings and a `display: none`, and that is the whole point of it having no
`slides-per-page` attribute.

## The shelf

Scroll it sideways, or use the arrows. The cards line up with the heading above them while
the row itself runs off the edge of the page:

<carousel-elemental class="demo-card-row" aria-label="What the bindery does">
  <ul>
    <li>
      <div class="card">
        <p class="eyebrow">Repairs</p>
        <h3>Rebound while you wait.</h3>
        <p>A spine that has given up, a block coming away from its boards. Most of it is an afternoon.</p>
      </div>
    </li>
    <li>
      <div class="card">
        <p class="eyebrow">Paper</p>
        <h3>Mould-made, by the sheet.</h3>
        <p>Cotton rag in four weights, cut to any size, and offcuts by the kilo for anyone learning.</p>
      </div>
    </li>
    <li>
      <div class="card">
        <p class="eyebrow">Lettering</p>
        <h3>Foil, blind, or not at all.</h3>
        <p>Titles stamped on the spine in whatever the cloth will take. Bring a rubbing of the original.</p>
      </div>
    </li>
    <li>
      <div class="card">
        <p class="eyebrow">Boxes</p>
        <h3>A case for the ones that need one.</h3>
        <p>Clamshells measured to the book rather than to a standard size, lined with something soft.</p>
      </div>
    </li>
    <li>
      <div class="card">
        <p class="eyebrow">Evenings</p>
        <h3>Learn to sew a signature.</h3>
        <p>Six people, four Thursdays, and a bound notebook to take home whether or not it is straight.</p>
      </div>
    </li>
  </ul>
</carousel-elemental>

The markup is a list of cards, and that is all it is:

```html
<carousel-elemental class="shelf" aria-label="What the bindery does">
  <ul>
    <li><div class="card">…</div></li>
    <li><div class="card">…</div></li>
    <li><div class="card">…</div></li>
  </ul>
</carousel-elemental>
```

## The CSS behind it

```css
.shelf {
  /* A fixed card, not a fraction of the row. That is what makes the peek: the row is
     never a whole number of cards wide, so the next one is always half in view. */
  --carousel-elemental-slide-size: 17rem;
  --carousel-elemental-gap: 1.25rem;

  /* Out of the text column and to the edge of the window: half of what the window has left
     after the column. A real length rather than `100%`, because a custom property holds
     tokens - a `100%` in one means the width of whichever element ends up using it, which
     here is the column in one place and the scroller in the other, and it would come out as
     zero in the second. On a page with a sidebar, subtract it too. */
  --bleed: max(2rem, calc((100vw - 46rem) / 2));
  margin-inline: calc(-1 * var(--bleed));
}

.shelf > [data-carousel-slides] {
  /* Put the column's inset back as padding, so the first card lines up with the heading
     while the row itself runs to the edge of the page. */
  padding-inline: var(--bleed);
  /* And move the snap point with it, or every card after the first snaps flush against
     the window instead of under the text. This is the line people miss. */
  scroll-padding-inline-start: var(--bleed);
}

.shelf > [data-carousel-controls] {
  justify-content: flex-end;
  padding-inline: var(--bleed);
}

/* Arrows only. Three selectors deep because the theme's own rule is two — see below. */
.shelf > [data-carousel-controls] [data-carousel-markers] {
  display: none;
}
```

## The three things that are not obvious

**A scroll container cannot have visible overflow.** The cards are not escaping the row —
the row is wider than the text. Per
[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow), `overflow-y: visible`
computes to `auto` "if one of `overflow-x` or `overflow-y` is neither `visible` nor `clip`",
so `overflow-x: auto; overflow-y: visible` is not a state that exists. Every full-bleed
carousel on the web is a wider scroller with padding inside it, this one included.

**`scroll-padding` has to match the padding.** Without it the first card lines up correctly
and every other card snaps hard against the left edge of the window, which looks like a bug
in the element and is a missing line in the page.

**Hiding the picker needs three selectors.** The theme's rule is
`carousel-elemental > [data-carousel-controls] [data-carousel-markers]` — specificity (0,2,1)
— so `.shelf [data-carousel-markers]` at (0,2,0) loses and the dots stay put. Adding
`> [data-carousel-controls]` to your own selector is enough.

## What it costs

`display: none` takes the picker away from everybody, not just from sighted readers — which
is the honest way to do it, and it is why the arrows have to stay. They are the
"single pointer without dragging" alternative that
[WCAG 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) asks for
next to a row you can also swipe, and with the dots gone they are the only way through it
that is not a gesture.

Everything else the element does is unchanged: the row is a `region` with
`aria-roledescription="carousel"`, each card is a slide named `3 of 5`, every card stays in
the accessibility tree and in reading order whether it is on screen or not, and the arrow with
nowhere to go is `aria-disabled` and dimmed rather than removed.

With no script, the same markup is a list of five cards down the page, every one of them
readable: the row, the snap and the bleed all hang off `[data-carousel-slides]`, which the
element writes as it upgrades, so nothing here applies until the controls exist to drive it.

<script src="{{ relativePathPrefix }}dist/elementals/carousel.js"></script>
