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
| [`<suggest-elemental>`](suggest.html)                          | [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox popup — the results panel, minus any opinion about where the results came from                                                  |
| [`<switch-elemental>`](switch.html)                            | [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), for a setting that takes effect at once                                                                                                           |
| [`<tabs-elemental>`](tabs.html)                                | [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), horizontal or vertical, written on a list of in-page links                                                                                            |
| [`<toolbar-elemental>`](toolbar.html)                          | [APG Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) — a row of buttons the arrows walk and <kbd>Tab</kbd> passes in one step                                                                                  |
| [`<tooltip-elemental>`](tooltip.html)                          | [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) as far as it has consensus — a description on hover and focus, and a sentence on the page without script                                         |

## Where none does

No pattern is not a licence to invent one. These implement what WCAG and the
platform ask for, and the page says which part of the APG is missing and why
that is fine.

| Element                        | What it is instead                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`<copy-elemental>`](copy.html) | No APG pattern, because there is no widget — a `<button>`, the clipboard write behind it, and the [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html) every copy button forgets |
| [`<search-elemental>`](search.html) | No APG pattern, because the widget is next door — the query half of a search field: the debounce, the abort, the loading state, and the [status message](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) a panel filling itself does not make |

## Not in the book

More pages are being written. Elements published separately today —
[compare-images-slider](https://github.com/stamat/compare-images-slider),
[youtube-background](https://github.com/stamat/youtube-background) — keep their
own packages; this book does not break anyone's install to absorb them.
