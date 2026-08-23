---
layout: poops-docs-theme/docs
title: Elementals
description: Every element in the book — the pattern each one implements, and the gap the platform left for it.
order: 1
---

# Elementals

One page per element, and one question behind every one of them: what is the
smallest element that deserves to exist? Each takes a chunk of ARIA, state and
keyboard handling off your hands and does nothing else.

Installing, the CDN bundles and the optional themes are on the
[home page](../index.html).

## Where an APG pattern applies

The pattern is the specification. Roles, states, focus order and keyboard
handling follow it; anything the pattern does not cover is named on the
element's own page.

| Element                                                        | Pattern                                                                                                                                                                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`<accordion-elemental>`](accordion.html)                      | [APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), over native `<details>`                                                                                                                     |
| [`<carousel-elemental>`](carousel.html)                        | [APG Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), on a scroll-snapping list — the scroller is the state, so there is nothing to measure on resize                                               |
| [`<checkbox-group-elemental>`](checkbox-group.html)             | [APG Checkbox (Mixed-State)](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/), a select-all that shows the dash when it is some of them                                                                        |
| [`<combobox-elemental>`](combobox.html)                        | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), a `<select>` you can type your way down, one value or many                                                                                    |
| [`<disclosure-elemental>`](disclosure.html)                     | [APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), where `<details>` cannot go                                                                                                               |
| [`<menu-elemental>`](menu.html)                                | [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), nested, and not a menu below a breakpoint                                                                                               |
| [`<modal-elemental>`](modal.html)                              | [APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) on native `<dialog>` — nested, animated out, and dismissed the way the platform says                                                   |
| [`<navbar-elemental>`](navbar.html)                            | [APG Disclosure Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/), that folds itself away when the links stop fitting                                              |
| [`<segmented-elemental>`](segmented.html)                      | [APG Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) on native radios, drawn as a track with a knob that slides                                                                                     |
| [`<slider-elemental>`](slider.html)                            | [APG Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) on native range inputs, and [Slider (Multi-Thumb)](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/) when you write two of them — the thumb count is the markup                    |
| [`<splitter-elemental>`](splitter.html)                        | [APG Window Splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) — two panes and a draggable seam, keyboard included, for the one pattern the APG has never written an example for |
| [`<suggest-elemental>`](suggest.html)                          | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox popup — the results panel, minus any opinion about where the results came from                                                  |
| [`<switch-elemental>`](switch.html)                            | [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), for a setting that takes effect at once                                                                                                           |
| [`<tabs-elemental>`](tabs.html)                                | [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), horizontal or vertical, written on a list of in-page links                                                                                            |
| [`<toolbar-elemental>`](toolbar.html)                          | [APG Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) — a row of buttons the arrows walk and <kbd>Tab</kbd> passes in one step                                                                                  |
| [`<tooltip-elemental>`](tooltip.html)                          | [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) as far as it has consensus — a description on hover and focus, and a sentence on the page without script                                         |
| [`<tree-view-elemental>`](tree-view.html)                      | [APG Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) on a nested list of links — one tab stop for the whole sidebar, and the arrows for the rest. The last pattern with no native equivalent at all |

## Where none does

No pattern is not a licence to invent one. These implement what WCAG and the
platform ask for, and the page says which part of the APG is missing and why
that is fine.

| Element                        | What it is instead                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`<copy-elemental>`](copy.html) | No APG pattern, because there is no widget — a `<button>`, the clipboard write behind it, and the [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html) every copy button forgets |
| [`<field-elemental>`](field.html) | No APG pattern, because there is no widget — the control is already accessible and the constraints already enforced, so this is only what the platform leaves undone after a refused submit: the bubble cancelled, the browser's own message in a paragraph, and the [`aria-describedby`](https://adrianroselli.com/2023/04/exposing-field-errors.html) and `aria-invalid` that tie it to the field |
| [`<marquee-elemental>`](marquee.html) | No APG pattern, because nothing is operated — a strip that loops, the copies counted against the container rather than guessed at, kept out of the keyboard's way with `inert`, and the [stop button](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) every other marquee leaves you to write |
| [`<password-elemental>`](password.html) | No APG pattern, because there is no widget — a `<button>` beside an `<input>`, and the state neither of them carries: `aria-pressed` rather than a swapped name, a live region rather than a swapped icon, and the field masked again before the form is submitted |
| [`<progress-elemental>`](progress.html) | No APG pattern, because `<progress>` already is one — this adds the two things it has never had: where its fill ends, as something CSS can draw with, and a second value beside it for the part that is loaded but not played |
| [`<search-elemental>`](search.html) | No APG pattern, because the widget is next door — the query half of a search field: the debounce, the abort, the loading state, and the [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) a panel filling itself does not make |
| [`<sortable-table-elemental>`](sortable-table.html) | No APG pattern, because `<table>` already is one — this adds only what the APG's own [sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/) describes: a button in the header, `aria-sort` on the column, and the caption note that explains them once instead of once per column |
| [`<tilt-elemental>`](tilt.html) | No APG pattern, because nothing is operated — a card that leans under the pointer, layers that rise out of it, a glare that follows, and the [reduced-motion switch](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) every other tilt library animates straight through |

## Not in the book

More pages are being written, and three custom elements are published separately
today. They keep their own packages, because this book does not break anyone's
install to absorb them.

| Element | What it is |
| ------- | ---------- |
| [`<media-player>`](https://github.com/stamat/media-player) | A player over the `<audio>` or `<video>` you already wrote — and **you** write the controls, in your markup, in the order you put them. `npm i media-player-element` |
| [`<compare-images-slider>`](https://github.com/stamat/compare-images-slider) | A before/after reveal: two layers, one clipped over the other, and a handle between them |
| [`<code-preview>`](https://github.com/stamat/code-preview-element) | A code block that renders itself in an isolated iframe. It is what builds the live previews on these pages |

**`<media-player>` is worth a look even if you never want a player**, because its
control bar is a `<toolbar-elemental>` with a `<slider-elemental>` scrubber inside
it — these elements composing into something bigger. The
[media player example](../examples/media-player.html) builds that skeleton by hand
so you can see what the composition costs; `<media-player>` is what it looks like
finished.

**`<compare-images-slider>` is worth telling apart from
[`<splitter-elemental>`](splitter.html)**, because both put `role="separator"` on a
handle you drag and they do opposite things. A splitter *resizes* two panes that
share a width. The compare slider *reveals*: its two layers are both full size,
one clipped over the other, and nothing on the page changes size at all. The
[before and after example](../examples/before-and-after.html) fakes the second out
of the first and says where that stops working.
