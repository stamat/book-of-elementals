---
layout: poops-docs-theme/docs
title: Sidebar drawer
description: The documentation sidebar this site is built on — a rail on a wide screen, a drawer on a phone — assembled from disclosure-elemental and one media query.
order: 2
---

# Sidebar drawer

The navigation to the left of this page is a rail while there is room for one and a drawer
when there is not. That is the whole of the pattern, and every docs site has a version of
it: a hamburger in the header, a panel that slides in from the edge, a scrim over what it
covers, and a wide screen where none of it happens because the panel is simply there.

[`<disclosure-elemental>`](../elementals/disclosure.html) is the part of it that is not
layout — a button, a region somewhere else in the document, and the ARIA holding the two
together. What is left for the page is where the panel sits at each width, and that is a
media query. Here is the assembly.

<!-- demo disclosure viewport-widths="375 768 1024" -->

```html
<header class="topbar">
  <disclosure-elemental for="sidebar">
    <button class="nav-toggle" aria-label="Documentation navigation">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75Zm.75 4.25h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"/>
      </svg>
    </button>
  </disclosure-elemental>
  <a class="brand" href="#">📓 Handbook</a>
</header>

<div class="layout">
  <aside class="sidebar" id="sidebar">
    <nav aria-label="Documentation">
      <details open>
        <summary>Getting started</summary>
        <ul>
          <li><a href="#" aria-current="page">Install</a></li>
          <li><a href="#">Configuration</a></li>
        </ul>
      </details>
      <details>
        <summary>Guides</summary>
        <ul>
          <li><a href="#">Layouts</a></li>
          <li><a href="#">Theming</a></li>
          <li><a href="#">Deploying</a></li>
        </ul>
      </details>
    </nav>
  </aside>

  <div class="scrim"></div>

  <main class="content">
    <h1>Install</h1>
    <p>Narrow the frame and the rail becomes a drawer. Open it and search the page for
      &ldquo;Deploying&rdquo; with it shut.</p>
  </main>
</div>
```

```css demo
body { margin: 0; padding: 0; --line: color-mix(in srgb, currentcolor 15%, transparent); }

.topbar {
  position: sticky; top: 0; z-index: 2;
  display: flex; align-items: center; gap: 0.75rem;
  height: 3.25rem; padding: 0 1rem;
  background: Canvas; border-bottom: 1px solid var(--line);
}
.brand { color: inherit; font-weight: 700; text-decoration: none; }
.nav-toggle {
  display: none; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; padding: 0;
  border: 0; border-radius: 0.375rem; background: none; color: inherit; cursor: pointer;
}

.layout { display: flex; align-items: flex-start; }
.content { flex: 1 1 auto; min-width: 0; padding: 0 1.5rem; }
.scrim { display: none; }

.sidebar { flex: 0 0 14rem; position: sticky; top: 3.25rem; border-right: 1px solid var(--line); }
/* the inset goes on a box inside the region, never on the region itself */
.sidebar nav { padding: 1rem 0.75rem; }
.sidebar summary { padding: 0.35rem 0.6rem; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; cursor: pointer; }
.sidebar ul { margin: 0; padding-left: 0.75rem; list-style: none; }
.sidebar a { display: block; padding: 0.3rem 0.6rem; border-radius: 0.375rem; color: inherit; text-decoration: none; opacity: 0.75; }
.sidebar a[aria-current] { background: var(--line); opacity: 1; font-weight: 600; }

/* the drawer travels, it does not grow: transform instead of the element's height slide */
#sidebar { transition: transform 0.2s ease, content-visibility 0.2s allow-discrete; }
@media (prefers-reduced-motion: reduce) { #sidebar { transition: none; } }

@media (width < 60rem) {
  /* only once the element is there to open it — see below */
  :root:has(disclosure-elemental:defined) {
    .nav-toggle { display: inline-flex; }

    .sidebar {
      position: fixed; inset: 3.25rem auto 0 0; z-index: 2;
      width: 14rem; border: 0; background: Canvas;
      box-shadow: 0 0 2rem rgb(0 0 0 / 25%);
    }
    #sidebar[hidden] { transform: translateX(-100%); }

    #sidebar:not([hidden]) ~ .scrim {
      display: block; position: fixed; inset: 3.25rem 0 0; z-index: 1;
      background: rgb(0 0 0 / 35%);
    }
  }
}
```

```js demo
const drawer = document.querySelector("disclosure-elemental");
const wide = matchMedia("(min-width: 60rem)");

// the breakpoint owns the state: a rail is a disclosure that is always open
const sync = () => { drawer.open = wide.matches; };
const close = () => { if (!wide.matches) drawer.open = false; };

sync();
wide.addEventListener("change", sync);
document.querySelector(".scrim").addEventListener("click", close);
addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
```

## The button is in the header, the panel is not

Which is the reason this is the element and not a `<details>`. The panel has to be a child
of the layout — a flex item beside the content, sticky against the topbar — and the button
has to be in the header, several boxes away. Wrapping the two in a `<details>` would mean
moving one of them somewhere it cannot do its job.

`for` points across that distance:

```html
<disclosure-elemental for="sidebar">
  <button class="nav-toggle" aria-label="Documentation navigation">…</button>
</disclosure-elemental>

<aside class="sidebar" id="sidebar">…</aside>
```

The element itself is `display: contents`, so dropping it around the button changes no
layout at all — the flex row the header lays out is the same row it was before.

Two things follow from where the button sits. It is the first thing in the header, so the
tab that leaves it lands on the brand and the next one is in the drawer: the panel is
reachable in the order it appears on screen, without anything being moved. And its label
lives on the button rather than on the icon, because the icon is
`aria-hidden` — an unlabelled button that says nothing is the most common way this pattern
breaks.

## The breakpoint is the page's, the state is the element's

The element tracks one boolean and puts it everywhere it belongs: `aria-expanded` on the
button, `hidden` on the panel, `aria-controls` between them. It does not know what a
breakpoint is, and it should not — a rail is not a second mode to build, it is a
disclosure that is always open:

```javascript
const sync = () => { drawer.open = wide.matches; };

sync();
wide.addEventListener("change", sync);
```

That is the whole desktop story. On a wide screen the panel is open and the button that
would close it is `display: none`; narrow the window and the same line shuts it again, so
a drawer left open never survives a rotation into a layout that has no drawer.

`close()` is the same idea from the other end — the scrim and Escape only mean anything
below the breakpoint, so it checks before it writes:

```javascript
const close = () => { if (!wide.matches) drawer.open = false; };
```

Everything writes to `open` and nothing writes to `hidden` or `aria-expanded` directly,
which is what keeps the two from ever disagreeing.

One thing to carry across when you copy it. Those nine lines go in a
`<script type="module">`, and the `type` is not about the scoping — it is about when the
script runs. A classic `<script>` in the body runs while the page is still parsing, before
a deferred bundle has defined anything, and `drawer.open = true` against an element that
has not upgraded yet writes an ordinary property onto the instance. It shadows the accessor
the class is about to bring, permanently: the first sync appears to work, and then nothing
else ever does, silently. A module is deferred, so it runs after the definition lands.
`drawer.toggleAttribute("open", wide.matches)` is the other way out, and the one to reach
for when the script genuinely has to run early — the attribute is the state, and it does
not care whether the element is alive yet.

## Sliding on transform, not on height

The element animates its region's height, because the thing a disclosure usually reveals
grows into the space it needs. A drawer does not grow — it is already full height and
arrives from off-screen — so the page takes the animation back:

```css
#sidebar {
  transition: transform 0.2s ease, content-visibility 0.2s allow-discrete;
}

@media (width < 60rem) {
  #sidebar[hidden] { transform: translateX(-100%); }
}
```

The height slide is not switched off with a flag. The element
[reads the transition back out of the computed styles](../elementals/disclosure.html#animation)
to time itself, so a region with no `height` transition has nothing to time and the state
lands at once — leaving the transform to do the moving. The rule sits outside the media
query on purpose: at the wide end there is no transform to animate either, and a rail that
slid open on every page load would be a page load you can watch happening.

`allow-discrete` is the other half. `hidden="until-found"` computes to `content-visibility:
hidden`, which is what keeps the closed drawer's links out of the tab order and out of the
accessibility tree — but applied on the first frame it would also empty the panel before it
had finished leaving. Transitioning a discrete property defers the flip to the end of the
close and brings it forward to the start of the open, which is exactly the timing this
needs, and it is one keyword rather than a `transitionend` listener.

Note where the padding is: on the `<nav>` inside the panel, not on the panel. That is the
element's [one rule about its region](../elementals/disclosure.html#animation) and it is
worth keeping even here — the region is the animated box, and the shipped stylesheet strips its
padding and borders while closed so a collapsed region cannot leave a strip behind.

## Without the script

The panel is not authored `hidden`, so with the bundle blocked or still in flight it is
just an `<aside>` full of links — visible, reachable, in the flow where the markup put it.
The button is already handled: the element's own stylesheet hides a trigger that would
toggle nothing until the element is defined.

The layout has to agree with that, which is what the `:has()` is doing:

```css
@media (width < 60rem) {
  :root:has(disclosure-elemental:defined) {
    .sidebar { position: fixed; /* … */ }
  }
}
```

Without it a narrow page with no script would pin the panel over the article with nothing
able to move it. Guarded, the drawer is off-canvas only while something can bring it back,
and every other state degrades to a page that scrolls.

## A disclosure, not a dialog

The drawer here is not modal: focus is not trapped in it, the article behind the scrim is
not `inert`, and tabbing past the last link leaves it. That is the
[APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) exactly, and
for navigation it is usually the right amount — the panel is a list of links to the same
site, and a keyboard user who tabs out of it has not lost anything.

If your drawer is modal — a filter panel with a form and an apply button, something where
leaving without a decision is a mistake — that is a different pattern with a different
element behind it, and the platform has both. `<dialog>` with `showModal()` gives the trap,
the `inert` background and the `::backdrop` for free; `popover` gives light dismiss and
Escape without the trap. Neither can be a sticky rail at 1024px, which is why they are not
in this example, and the honest version of "modal below the breakpoint" is switching
between the two at the breakpoint.

## What the element brought

Everything on this page that is not furniture:

- **`aria-expanded`, `aria-controls` and `hidden` stay in step**, across a click, the
  breakpoint sync, the scrim, Escape and find-in-page, because all five write one boolean.
- **The panel is not moved or wrapped**, so it stays the flex item its layout expects and
  `display: contents` keeps the header's row intact.
- **Find-in-page reaches a link inside a closed drawer**, because closed is
  `hidden="until-found"` rather than `display: none`, and the element hears the reveal on
  `beforematch` and stops disagreeing with it.
- **The button gets `type="button"`** whether or not you remembered, so a drawer inside a
  form does not submit it.

What is left for the page is a flex row, a fixed panel, a scrim and nine lines of script —
and none of those nine lines is about a disclosure.
