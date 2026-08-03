---
layout: poops-docs-theme/docs
title: Site navigation
description: A whole site header built around navbar-elemental — logo, search, icon links, a theme switch and two calls to action beside a row of links that folds itself away.
order: 1
---

# Site navigation

[`<navbar-elemental>`](../elementals/navbar.html) is the row of links and the two ways it
gets out of the way. A header is that plus everything a header actually has in it: a logo,
a search field, links to npm and GitHub, a theme switch, and two calls to action. None of
those are the element's business — which is the point of this page. Here is the assembly.

<nav class="demo-sitenav" aria-label="Kestrel">
  <navbar-elemental class="demo-sitenav-bar" media="(min-width: 40rem)" hover>
    <a class="demo-sitenav-brand" href="#site-navigation">
      <span class="demo-sitenav-logo" aria-hidden="true">🪶</span> Kestrel
    </a>
    <div class="demo-sitenav-rail">
      <ul>
        <li><a href="#site-navigation">Overview</a></li>
        <li>
          <button>Products</button>
          <ul>
            <li><a href="#site-navigation">Kestrel Cloud</a></li>
            <li><a href="#site-navigation">Kestrel Edge</a></li>
            <li><a href="#site-navigation">Status page</a></li>
          </ul>
        </li>
        <li><a href="#site-navigation">Pricing</a></li>
        <li>
          <button>Resources</button>
          <ul>
            <li><a href="#site-navigation">Docs</a></li>
            <li><a href="#site-navigation">Guides</a></li>
            <li><a href="#site-navigation">Changelog</a></li>
          </ul>
        </li>
        <li data-navbar-more>
          <button>More</button>
          <ul></ul>
        </li>
        <li data-navbar-stack class="demo-sitenav-drawer-cta">
          <a class="demo-sitenav-btn" href="#site-navigation">Sign in</a>
          <a class="demo-sitenav-btn demo-sitenav-btn-primary" href="#site-navigation">Sign up</a>
        </li>
      </ul>
    </div>
    <div class="demo-sitenav-search">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path></svg>
      <input type="search" placeholder="Search" aria-label="Search Kestrel" autocomplete="off">
    </div>
    <a class="demo-sitenav-icon" href="#site-navigation" aria-label="npm"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"></path></svg></a>
    <a class="demo-sitenav-icon" href="#site-navigation" aria-label="GitHub"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg></a>
    <switch-elemental class="switch-elemental-small">
      <button aria-label="Dark mode">
        <span class="switch-elemental-off" aria-hidden="true"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm8-5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm10.657-5.657a.75.75 0 0 1 0 1.061l-1.061 1.06a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.061a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Zm9.193 2.121a.75.75 0 0 1-1.06 0l-1.061-1.06a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l1.06 1.061a.75.75 0 0 1 0 1.06ZM4.464 4.464a.75.75 0 0 1-1.06 0L2.343 3.404a.75.75 0 0 1 1.06-1.06l1.061 1.06a.75.75 0 0 1 0 1.06Z"></path></svg></span>
        <span class="switch-elemental-on" aria-hidden="true"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"></path></svg></span>
      </button>
    </switch-elemental>
    <div class="demo-sitenav-cta">
      <a class="demo-sitenav-btn" href="#site-navigation">Sign in</a>
      <a class="demo-sitenav-btn demo-sitenav-btn-primary" href="#site-navigation">Sign up</a>
    </div>
    <button class="demo-sitenav-toggle" data-navbar-toggle aria-label="Navigation"></button>
  </navbar-elemental>
</nav>

This column is 46rem wide, so the bar is already out of room and the links that did not fit
are under **More**. Drag the window narrower and they go in one at a time; wider and they
come back out. Keep going narrower and the last one goes with them, at which point the bar
becomes a drawer. Past 40rem the two buttons join it and the search field shrinks to its
icon.

## The assembly

```html
<nav aria-label="Kestrel">
  <navbar-elemental class="bar" media="(min-width: 40rem)" hover>
    <a class="brand" href="/"><span aria-hidden="true">🪶</span> Kestrel</a>

    <div class="rail">
      <ul>
        <li><a href="/overview">Overview</a></li>
        <li>
          <button>Products</button>
          <ul>
            <li><a href="/cloud">Kestrel Cloud</a></li>
            <li><a href="/edge">Kestrel Edge</a></li>
          </ul>
        </li>
        <li><a href="/pricing">Pricing</a></li>

        <li data-navbar-more>
          <button>More</button>
          <ul></ul>
        </li>

        <!-- the drawer's own items: not on the bar, so not measured against it -->
        <li data-navbar-stack class="drawer-cta">
          <a class="btn" href="/sign-in">Sign in</a>
          <a class="btn btn-primary" href="/sign-up">Sign up</a>
        </li>
      </ul>
    </div>

    <div class="search">
      <svg …></svg>
      <input type="search" placeholder="Search" aria-label="Search Kestrel">
    </div>

    <a class="icon" href="https://npmjs.com/…" aria-label="npm"><svg …></svg></a>
    <a class="icon" href="https://github.com/…" aria-label="GitHub"><svg …></svg></a>

    <switch-elemental class="switch-elemental-small">
      <button aria-label="Dark mode">
        <span class="switch-elemental-off" aria-hidden="true"><svg …><!-- sun --></svg></span>
        <span class="switch-elemental-on" aria-hidden="true"><svg …><!-- moon --></svg></span>
      </button>
    </switch-elemental>

    <div class="cta">
      <a class="btn" href="/sign-in">Sign in</a>
      <a class="btn btn-primary" href="/sign-up">Sign up</a>
    </div>

    <button class="toggle" data-navbar-toggle aria-label="Navigation"></button>
  </navbar-elemental>
</nav>
```

The element is the bar: a flex row the page lays out, holding the row of links and
everything else the header has. Four things in there are worth explaining.

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

**The calls to action are in the markup twice**, and the two copies are never on screen at
once. The bar's copy is the row of buttons; the drawer's is a `data-navbar-stack` item,
which tells the element the item is the drawer's alone — not on the bar, so not competing
for room on it and not measured against it. One media query swaps them:

```css
@media (width < 40rem) {
  .bar > .cta { display: none; }
}

@media (width >= 40rem) {
  .drawer-cta { display: none; }
}
```

**That media query is not the element's breakpoint**, and the difference matters. The links
fold away when they stop fitting, whatever the width, and the element works that out for
itself. This is about the two things that never stop fitting and still have to go.

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

The field is a field on a wide bar and an icon button on a narrow one, and there is no
second control involved in that — the icon is drawn over the input with `pointer-events:
none`, so the input _is_ the button, and tapping the icon focuses the thing behind it.
Collapsed it is 2.25rem of transparent border with a transparent placeholder; focused it
takes the row.

The room it takes comes from hiding what is beside it, which is what `:has` is for:

```css
.search { width: 2.25rem; margin-inline-start: auto; }
.search:focus-within { flex: 1 1 auto; width: auto; }

.bar:has(.search:focus-within) > .rail,
.bar:has(.search:focus-within) .icon,
.bar:has(.search:focus-within) switch-elemental {
  display: none;
}
```

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

The same rules keyed to a class instead of the breakpoint give you the icon-button form at
every width, for a bar that would rather spend its room on links:

```html
<div class="search search-compact">…</div>
```

## What the element brought

Everything on this page that is not the furniture:

- **The links fold into More one at a time** as the room runs out, measured rather than
  guessed — including after a webfont lands and changes every label's width.
- **The bar becomes a drawer** when the last link goes in, and below the breakpoint the
  `media` attribute names.
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
buttons and one media query — which is about the right amount of CSS for a header, and none
of it is about how a navigation works.

<script src="{{ relativePathPrefix }}dist/elementals/navbar.js"></script>
<script src="{{ relativePathPrefix }}dist/elementals/switch.js"></script>
