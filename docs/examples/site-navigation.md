---
layout: poops-docs-theme/docs
title: Site navigation
description: A whole site header built around navbar-elemental — logo, search, icon links, a theme switch and two calls to action beside a row of links that folds itself away.
order: 5
---

# Site navigation

[`<navbar-elemental>`](../elementals/navbar.html) is the row of links and the two ways it
gets out of the way. A header is that plus everything a header actually has in it: a logo,
a search field, links to npm and GitHub, a theme switch, and two calls to action. None of
those are the element's business — which is the point of this page. Here is the assembly.

<!-- demo navbar switch viewport-widths="375 768 900 1024" style="--code-preview-height:26rem" -->

```html
<!-- one copy of each icon, used wherever it is needed -->
<svg class="sprite" aria-hidden="true">
  <symbol id="i-search" viewBox="0 0 16 16"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></symbol>
  <symbol id="i-npm" viewBox="0 0 24 24"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></symbol>
  <symbol id="i-github" viewBox="0 0 16 16"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></symbol>
  <symbol id="i-sun" viewBox="0 0 16 16"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm8-5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm10.657-5.657a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.061a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Zm9.193 2.121a.75.75 0 0 1-1.06 0l-1.061-1.06a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l1.06 1.061a.75.75 0 0 1 0 1.06ZM4.464 4.464a.75.75 0 0 1-1.06 0L2.343 3.404a.75.75 0 0 1 1.06-1.06l1.061 1.06a.75.75 0 0 1 0 1.06Z"/></symbol>
  <symbol id="i-moon" viewBox="0 0 16 16"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"/></symbol>
  <symbol id="i-price" viewBox="0 0 16 16"><path d="M10.75 9a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z"/><path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25ZM14.5 6.5h-13v5.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Zm0-2.75a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25V5h13Z"/></symbol>
  <symbol id="i-tag" viewBox="0 0 16 16"><path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></symbol>
</svg>

<nav aria-label="Kestrel">
  <navbar-elemental class="bar" media="(min-width: 48rem)" min-bar-items="2" hover>
    <a class="brand" href="#"><span aria-hidden="true">🪶</span> Kestrel</a>

    <div class="rail">
      <ul>
        <li><a href="#">Overview</a></li>
        <li>
          <button>Products</button>
          <ul>
            <li><a href="#">Kestrel Cloud</a></li>
            <li><a href="#">Kestrel Edge</a></li>
            <li><a href="#">Status page</a></li>
          </ul>
        </li>
        <!-- an icon on one link and not on the next: the rows line up anyway, because
             every row is a flex line rather than a block with an image dropped in it -->
        <li><a href="#"><svg class="link-icon"><use href="#i-price"/></svg> Pricing</a></li>
        <li>
          <button>Resources</button>
          <ul>
            <li><a href="#">Docs</a></li>
            <li><a href="#">Guides</a></li>
            <li><a href="#"><svg class="link-icon"><use href="#i-tag"/></svg> Changelog</a></li>
          </ul>
        </li>

        <li data-navbar-more>
          <button>More</button>
          <ul></ul>
        </li>

        <!-- the drawer's own items: not on the bar, so not measured against it -->
        <li data-navbar-stack class="drawer-tools">
          <a class="icon" href="#" aria-label="npm"><svg><use href="#i-npm"/></svg></a>
          <a class="icon" href="#" aria-label="GitHub"><svg><use href="#i-github"/></svg></a>
        </li>
        <li data-navbar-stack class="drawer-cta">
          <a class="btn" href="#">Sign in</a>
          <a class="btn btn-primary" href="#">Sign up</a>
        </li>
      </ul>
    </div>

    <div class="search">
      <svg aria-hidden="true"><use href="#i-search"/></svg>
      <input type="search" placeholder="Search" aria-label="Search Kestrel" autocomplete="off">
    </div>

    <a class="icon" href="#" aria-label="npm"><svg><use href="#i-npm"/></svg></a>
    <a class="icon" href="#" aria-label="GitHub"><svg><use href="#i-github"/></svg></a>

    <switch-elemental class="switch-elemental-small switch-elemental-thin">
      <button aria-label="Dark mode">
        <span class="switch-elemental-off" aria-hidden="true"><svg><use href="#i-sun"/></svg></span>
        <span class="switch-elemental-on" aria-hidden="true"><svg><use href="#i-moon"/></svg></span>
      </button>
    </switch-elemental>

    <div class="cta">
      <a class="btn" href="#">Sign in</a>
      <a class="btn btn-primary" href="#">Sign up</a>
    </div>

    <button data-navbar-toggle aria-label="Navigation"></button>
  </navbar-elemental>
</nav>

<main class="content">
  <h1>Ship it before the weather turns</h1>
  <p>Narrow the frame. The links go behind <strong>More</strong> one at a time, and under
    48rem the bar is a drawer — with the icon links and the two buttons inside it. The
    theme switch stays on the bar at every width.</p>
  <p>Everything under the header is here so an open panel has a page to hang over, which is
    also what a header does on a real site.</p>
</main>
```

```css demo
/* the whole page is painted out of Canvas and CanvasText, so one property is the theme */
:root { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }

:root {
  --line: color-mix(in srgb, currentcolor 20%, transparent);
  /* the field is the one thing on the bar that is a surface rather than a control, so it
     gets the quieter pair: a tint you read as a slot, and a rim you have to look for */
  --line-soft: color-mix(in srgb, currentcolor 10%, transparent);
  --fill: color-mix(in srgb, currentcolor 4%, transparent);
  --muted: color-mix(in srgb, currentcolor 65%, transparent);
  --radius: 0.375rem;
}

*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; }

/* one type selector, so every class below outranks it — a `.bar a` reset here would win
   against `.btn-primary` and paint its label the same colour as its fill */
a { color: inherit; text-decoration: none; }

/* the icons live once, at the top of the document, and every copy is a `<use>`.
   The colour has to be set here, at the copies, and not on the sprite: `<use>` clones the
   symbol and its descendants, so anything the symbol inherited from the sprite around it is
   left behind - a `fill` up there resolves to nothing and the icons paint the default black,
   which in dark mode is a row of invisible icons. */
.sprite { display: none; }
svg { fill: currentcolor; }

/* the theme paints its own hover, a shade heavier than the one the icon links use — one
   re-pointing and every backdrop on the bar is the same lighter tint */
navbar-elemental { --navbar-elemental-hover: var(--fill); }

.bar {
  display: flex; flex-wrap: nowrap; align-items: center; gap: 0.5rem;
  padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--line);
}



/* two things the theme cannot know about this header. It is full-bleed, so the drawer's side
   borders would be lines drawn down the edges of the screen — off. And the drawer hangs off
   the bar's padding box, which is inside the border the bar draws, so its first row of pixels
   lands on that border: one pixel down is the header's own line handed back. */
.bar[data-mode="stack"] .rail > ul:not([data-navbar-probe]) {
  margin-block-start: 1px;
  border-inline: 0;
}

/* every row of the navigation is a flex line, which is what keeps a link carrying an icon
   the same height as the one under it that does not — an inline `<svg>` sits on the
   baseline and drags the line box down with it */
.bar li > a, .bar li > button { display: flex; align-items: center; gap: 0.4rem; }
.link-icon { flex: none; width: 1em; height: 1em; }

.brand { display: flex; flex: none; align-items: center; gap: 0.4rem; font-weight: 600; }
.brand span { font-size: 1.2em; }

/* the box the row is measured in — a flex item that takes what the rest of the bar leaves */
.rail { flex: 1 1 0; }

/* the field asks for 11rem and gives it up as the bar fills. `container-type` is safe here
   and nowhere above it: it brings a containing block with it, and a containing block over a
   panel is what stops the panel's fallbacks from firing */
.search {
  position: relative; flex: 0 1 11rem; min-width: 2.25rem;
  container-type: inline-size;
}
.search svg {
  position: absolute; inset-block-start: 50%; inset-inline-start: 0.5rem;
  width: 1rem; height: 1rem; translate: 0 -50%;
  pointer-events: none;
}
.search input {
  width: 100%; padding: 0.35rem 0.5rem 0.35rem 1.9rem;
  font: inherit; font-size: 0.9em; color: inherit;
  background: var(--fill); border: 1px solid var(--line-soft); border-radius: var(--radius);
}

/* under 150px a field is a slot too short to read what you typed into it, so it stops being
   one: transparent, its placeholder gone, the icon centred over it. Still the same input —
   the icon has `pointer-events: none`, so tapping it focuses the thing behind it */
@container (width < 150px) {
  .search input {
    width: 2.25rem; padding: 0.35rem; cursor: pointer;
    background: none; border-color: transparent;
  }
  .search input::placeholder { color: transparent; }
  .search input:hover { background: var(--fill); }
  .search svg { inset-inline-start: 50%; translate: -50% -50%; }
}

.icon {
  display: inline-flex; flex: none; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; border-radius: var(--radius);
}
.icon svg { width: 1.15rem; height: 1.15rem; }
/* the backdrop is the whole of the hover: an icon that also changes colour is two answers to
   one question, and the quieter of them was making the icons look disabled */
.icon:hover { background: var(--fill); }

/* the switch is `display: contents`, so the flex item in this row is its button — the shrink
   is the button's to refuse, and the element cannot refuse it on the button's behalf */
switch-elemental > button { flex: none; }
switch-elemental svg { width: 0.8rem; height: 0.8rem; }

.cta { display: flex; flex: none; align-items: center; gap: 0.4rem; }

/* the drawer's copies of what the bar keeps on its right-hand side */
.drawer-tools { display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.5rem; }
/* the drawer indents every row to clear the caret column, which is right for a label and
   wrong for a 2rem square */
.drawer-tools > .icon { padding: 0; }
.drawer-cta { display: grid; gap: 0.4rem; padding: 0.35rem 0.5rem; }
.drawer-cta .btn { justify-content: center; padding-block: 0.45rem; }

.btn {
  padding: 0.3rem 0.6rem; font-size: 0.9em; font-weight: 500; white-space: nowrap;
  border: 1px solid var(--line); border-radius: var(--radius);
}
.btn:hover { background: var(--fill); }

/* the page inverted, so the one filled thing on the bar needs no palette of its own and
   follows the theme switch beside it */
.btn-primary { color: Canvas; background: CanvasText; border-color: CanvasText; }
.btn-primary:hover { background: color-mix(in srgb, CanvasText 85%, Canvas); }

.content { padding: 0.5rem 0.9rem 1.5rem; }
.content h1 { font-size: 1.25rem; }

@media (width >= 48rem) {
  .drawer-tools, .drawer-cta { display: none; }
}

@media (width < 48rem) {
  .bar > .cta, .bar > .icon { display: none; }

  /* the field is handed 2.25rem here rather than a second copy of the collapsed look: that
     is under 150px, so the container query above is what turns it into the icon */
  .search { flex: 0 0 2.25rem; }

  /* and only here does focus open it, because only here is it a button. A field that is
     already a field has nothing to expand into and no reason to take the row.
     The expanded look needs no rules of its own: the box goes past 150px, so the container
     query stops matching and the field is a field again by the rules above. The room comes
     from hiding what is beside it — never by floating over it, which would put a positioned
     box over the panels. */
  .search:focus-within { flex: 1 1 auto; }

  .bar:has(.search:focus-within) > .rail,
  .bar:has(.search:focus-within) > .brand { display: none; }
}
```

```js demo
const root = document.documentElement;
const theme = document.querySelector("switch-elemental");

// the page arrives carrying a theme, so the switch starts where it is rather than at "off"
theme.checked = root.dataset.theme === "dark";

// `color-scheme` is what the whole page is painted out of, and it follows this attribute
theme.addEventListener("switch-toggle", (event) => {
  root.dataset.theme = event.detail.checked ? "dark" : "light";
});
```

Edit the sample and the preview follows. At 1024 every link is on the bar; take it to 768
and the ones that stopped fitting are under **More**, one at a time as the room goes; at 375
the bar is a drawer, with the icon links and the two buttons inside it. The theme switch
stays on the bar at every width, and it works — it writes `[data-theme]` onto the preview's
own document, which is what the sample's six lines of JavaScript are for. Flipping it also
flips this site, and flipping this site's flips it back: that part is not the sample's, it is
a dozen lines at the bottom of this page handing the two switches to each other.

## The assembly

The element is the bar: a flex row the page lays out, holding the row of links and
everything else the header has. Five things in there are worth explaining.

**The rail is a box the row needs, and the element cannot make it.** It is where the copy of
the row being measured goes — see
[Measuring instead of guessing](../elementals/navbar.html#measuring-instead-of-guessing).
The element marks it `data-navbar-rail` and puts the copy in beside the row; it does not
create it, because creating it would mean wrapping your list in it, and then every selector
you had written against the list's parent would be pointing somewhere else.

**The `<nav>` landmark is outside the element, not inside it.** A landmark called
"Kestrel" holding a search field and a sign-up button is a landmark that has stopped being
useful. If you would rather it fit the links exactly, make the rail the landmark — the rail
is whatever element you like, and a `<nav>` is a perfectly good box for a list:

```html
<nav class="rail" aria-label="Main">
  <ul>…</ul>
</nav>
```

The copy inside it is `visibility: hidden`, which keeps it out of the accessibility tree as
well as out of the tab order, so the landmark holds one navigation rather than two.

**The right-hand side of the bar is in the markup twice**, and the two copies are never on
screen at once. On the bar it is a row of buttons, two icon links and a switch; in the
drawer it is two `data-navbar-stack` items, which tell the element they are the drawer's
alone — not on the bar, so not competing for room on it and not measured against it. One
media query swaps them:

```css
@media (width < 48rem) {
  .bar > .cta, .bar > .icon { display: none; }

  /* the field is handed 2.25rem here rather than a second copy of the collapsed look: that
     is under 150px, so the container query above is what turns it into the icon */
  .search { flex: 0 0 2.25rem; }

  /* and only here does focus open it, because only here is it a button. A field that is
     already a field has nothing to expand into and no reason to take the row.
     The expanded look needs no rules of its own: the box goes past 150px, so the container
     query stops matching and the field is a field again by the rules above. The room comes
     from hiding what is beside it — never by floating over it, which would put a positioned
     box over the panels. */
  .search:focus-within { flex: 1 1 auto; }

  .bar:has(.search:focus-within) > .rail,
  .bar:has(.search:focus-within) > .brand { display: none; }
}

@media (width >= 48rem) {
  .drawer-tools, .drawer-cta { display: none; }
}
```

That number is the one in `media` on the element, and it has to be: a `data-navbar-stack`
item only shows in the drawer, so furniture taken off the bar at a width where the element
is still a bar is furniture that has gone nowhere. Pinning both to 48rem means the moment
the icons leave the bar, the drawer they moved into is the thing on screen.

**That media query is still not the element's breakpoint.** The links fold away when they
stop fitting, whatever the width, and the element works that out for itself. This is about
the things that never stop fitting and still have to go.

**One link and a More button is not a bar**, which is what `min-bar-items="2"` says. Left to
itself the element keeps a bar until nothing at all fits on it, and the last stop before
that is a header showing one link beside an overflow button — a drawer wearing a bar's
clothes. The threshold is the element's because only the element knows how many fitted:

```html
<navbar-elemental media="(min-width: 48rem)" min-bar-items="2" hover>
```

## Why the buttons move on a query and the links do not

Because a button that says "Sign up" does not overflow — it squeezes everything else until
nothing fits. That is a width decision, and a media query is the honest way to make one.

There is a more interesting reason not to key it off the element's own state, though, and it
is the trap worth knowing about when composing anything around this element:

```css
/* Do not do this. */
navbar-elemental[data-mode="stack"] .cta {
  display: none;
}
```

Taking the buttons off the bar hands the row a hundred and fifty pixels. Which lets the
links fit. Which brings the bar back. Which puts the buttons back. Which takes the room
away again. A media query cannot oscillate, because nothing the element does changes the
width of the window — so anything that changes the bar's own width belongs on a query, and
`data-mode` is for the things that do not: which caret to draw, which panel gets a frame,
whether the drawer's own items are on screen.

## Search: a field, or a button

The field asks for 11rem and gives it up as the bar fills. Under 150px it stops being a
field at all — a slot too short to read back what you typed into it — and becomes the icon
alone. There is no second control in that: the icon is drawn over the input with
`pointer-events: none`, so the input _is_ the button, and tapping the icon focuses the thing
behind it.

The rule is a container query rather than a breakpoint, because the question is about the
field and not about the window. A phone with two links in the header has room for a search
field; a laptop with nine has none:

```css
.search { flex: 0 1 11rem; min-width: 2.25rem; container-type: inline-size; }

@container (width < 150px) {
  .search input {
    width: 2.25rem; padding: 0.35rem;
    background: none; border-color: transparent;
  }
  .search input::placeholder { color: transparent; }
}
```

Below 48rem it is a button whatever else is going on, and that costs one declaration rather
than a second copy of the collapsed look — the field is handed 2.25rem, which is under 150px,
so the same container query does the collapsing:

```css
@media (width < 48rem) {
  .search { flex: 0 0 2.25rem; }
}
```

**`container-type` is safe on the field and on nothing above it.** It brings layout
containment, and layout containment makes a containing block — which over a panel is the
thing that
[stops its `position-try-fallbacks` from firing](../elementals/navbar.html#staying-on-screen).
On the bar it would break every dropdown in the header; on a box holding one input it breaks
nothing.

**Only the button form opens on focus**, and only below 48rem, where the button form is the
only form. A field that is already a field has nothing to expand into and no business taking
the row from the navigation. The room it does take comes from hiding what is beside it, which
is what `:has` is for:

```css
@media (width < 48rem) {
  .search:focus-within { flex: 1 1 auto; }

  .bar:has(.search:focus-within) > .rail,
  .bar:has(.search:focus-within) > .brand { display: none; }
}
```

The open field needs no rules of its own, which is the part worth stealing: growing past
150px is what stops the container query matching, so the collapsed look comes off by itself
and what is left is the field described at the top of this section. One description of each
state, and the state is the width.

No absolute positioning, and that is not a preference. A positioned ancestor becomes the
containing block for the element's panels, and their
[`position-try-fallbacks` are judged against it](../elementals/navbar.html#staying-on-screen)
— so a field that floated over the bar would quietly stop every dropdown in the header from
flipping away from the window's edge.

Floating it has a second cost this bar happens to show. The switch's button is
`position: relative` — the knob is positioned against it — so a field floated over the row
would be one `z-index: auto` element covered by another, and dom order would decide which
won: the pill would paint on top of the open field. Hiding what is beside the field instead
of covering it means there is nothing to stack.

A class of your own on the field, with the same declarations the container query holds, is
the icon-button form at every width — for a bar that would rather spend its room on links
than on a field nobody has typed in yet.

## What the element brought

Everything on this page that is not the furniture:

- **The links fold into More one at a time** as the room runs out, measured rather than
  guessed — including after a webfont lands and changes every label's width.
- **The bar becomes a drawer** below the breakpoint `media` names, and above it as soon as
  fewer links fit than `min-bar-items` asks for.
- **The hamburger crosses into an X** while the drawer is open, out of the theme, on a
  `<span>` the element writes into the button — three bars need three boxes and a button
  brings two.
- **The drawer slides out from under the bar** and scrolls itself when it is taller than
  what is left of the screen, so a long navigation on a phone ends in a scrollbar rather
  than below the fold.
- **The keyboard** is the APG's disclosure navigation, arrow keys included:
  [the table](../elementals/navbar.html#keyboard).
- **Hover** opens a panel and closes the others, mouse only, never under the keyboard, and
  never in the drawer.
- **Escape, focus leaving, and a click outside** all close an open panel, which is
  [1.4.13](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html) for
  a header that opens things on hover.
- **Find-in-page** reaches a link inside a closed drawer, because a closed drawer is
  `hidden="until-found"` rather than `display: none`.

What is left for the page is a flex row, a logo, a field, two icon links, a switch, two
buttons, one media query and one container query — which is about the right amount of CSS
for a header, and none of it is about how a navigation works. The six lines of JavaScript
are not about it either: they are the theme switch writing `[data-theme]`, which is the
page's business and would be there whatever the navigation was.

<script type="module">
  // Docs plumbing, and deliberately not part of the sample above: the preview is a page of its
  // own, so its theme switch flips a document nobody else can see. `<code-preview>` already
  // carries this site's `[data-theme]` into the frame; what it cannot know is that this
  // particular sample holds a control that means the same thing. So the two ends are handed to
  // each other here.
  //
  // The site's own switch is what gets set, not the attribute: that switch owns the
  // preference, writes `[data-theme]` and remembers it. Writing the attribute directly would
  // leave the topbar's switch saying the opposite of the page it sits on, and the choice
  // forgotten on the next page.
  const preview = document.querySelector("code-preview");
  const site = document.querySelector("switch-elemental");

  const wire = (frame) => {
    const doc = frame.contentDocument;
    if (!doc || !doc.documentElement.dataset.themeWired) {
      if (!doc) return;
      doc.documentElement.dataset.themeWired = "true";
    } else {
      return;
    }

    // Looked up each time rather than held: this may have wired a document whose body was
    // still being parsed, and a control captured then is a control that was not there.
    const follow = () => {
      const sample = doc.querySelector("switch-elemental");
      const dark = doc.documentElement.dataset.theme === "dark";
      if (sample && sample.checked !== dark) sample.checked = dark;
    };

    doc.addEventListener("switch-toggle", (e) => {
      if (site.checked !== e.detail.checked) site.checked = e.detail.checked;
    });

    // The other way, so the sample's switch is not left saying "light" on a dark page. It runs
    // once immediately as well as on every change: the frame is themed by `<code-preview>`
    // *after* it loads, which is after the sample's own script has read the attribute and
    // seeded the control from it - so on a dark page the switch starts out disagreeing with
    // the page it is sitting in.
    new MutationObserver(follow).observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
    follow();
  };

  // The frame is the element's, built when it upgrades - so it is not here yet when this runs,
  // and it is replaced whenever the sample is edited. Watching for it covers both.
  const attach = () => {
    const frame = preview && preview.querySelector("iframe");
    if (!frame) return;
    if (!frame.dataset.themeWatched) {
      frame.dataset.themeWatched = "true";
      frame.addEventListener("load", () => wire(frame));
    }
    wire(frame);
  };

  if (preview && site) {
    new MutationObserver(attach).observe(preview, { childList: true, subtree: true });
    attach();
  }
</script>
