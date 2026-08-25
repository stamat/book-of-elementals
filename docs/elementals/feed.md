---
layout: poops-docs-theme/docs
title: Feed
description: A stream of articles that keeps growing — the APG Feed pattern, with the loading left to you and the scrolling bounded.
order: 6
---

# `<feed-elemental>`

A feed is the one APG pattern that is a contract rather than a widget. The page promises
that every article says where it sits in a set that keeps growing, that the keyboard can
walk the articles and get past them, and that nobody is read a half-written DOM — and in
return a screen reader keeps its browse-mode cursor running through content that arrives
while it reads.

`role="feed"` on its own is not that contract, it is the announcement of one. The
[standing criticism](https://www.deque.com/blog/infinite-scrolling-rolefeed-accessibility-issues/)
of the role is that pages ship the announcement and none of the rest, leaving a keyboard
with content it cannot reach and a footer it can never get to. This element is the rest,
and it refuses the half that earns the criticism: it does not fetch, and it does not
scroll forever.

<!-- demo feed style="--code-preview-height:479px" -->

```html
<feed-elemental aria-label="Reviews" auto-load="2">
  <article>
    <h3>Gino's</h3>
    <p>Thin crust, long queue, worth it by about ten minutes.</p>
  </article>
  <article>
    <h3>La Bella</h3>
    <p>Four things on the menu and all four are the right one.</p>
  </article>
</feed-elemental>

<button type="button" class="more">Load more</button>
```

```css demo
feed-elemental { max-width: 32rem; }
feed-elemental h3 { margin: 0 0 0.25rem; font-size: 1rem; }
feed-elemental p { margin: 0; }
/* the busy state is the element's to set and the page's to draw — there is no spinner in
   the box, on the reasoning that a spinner is a look and this is a contract */
feed-elemental[aria-busy="true"] { opacity: 0.6; }
.more { margin-block-start: 1rem; padding: 0.35rem 0.75rem; font: inherit; }
```

```js demo
// The page owns the data and the fetching. This one has neither: it hands back six entries
// from an array, a couple of hundred milliseconds late, so the busy state has something to
// be busy about.
const REVIEWS = [
  ['Kod Mije', 'Ćevapi, and nothing else, which is the point.'],
  ['Nostromo', 'Loud, dark, and the only place open past one.'],
  ['Tri Šešira', 'The tablecloths have opinions about you.'],
  ['Zeleni Venac', 'A counter, two stools, the best burek in the city.']
];

const feed = document.querySelector('feed-elemental');
const more = document.querySelector('.more');
let at = 0;

// `textContent`, not a template string: the text is a page's own and escaping it at the one
// place it is interpolated is a rule easier to keep than to remember.
function render([name, line]) {
  const article = document.createElement('article');
  const heading = document.createElement('h3');
  const body = document.createElement('p');
  heading.textContent = name;
  body.textContent = line;
  article.append(heading, body);
  return article;
}

// One listener for both ways of asking: the sentinel while `auto-load` has budget left, and
// the button after that. `wait()` is what buys the busy state — without it the element
// settles the moment this listener returns, which is right for a page appending from an
// array it already has.
feed.addEventListener('feed-load', (event) => {
  event.detail.wait(new Promise((done) => {
    setTimeout(() => {
      if (at < REVIEWS.length) feed.append(render(REVIEWS[at++]));
      // Nothing left: the size stops being undetermined and the button stops being a lie.
      if (at === REVIEWS.length) {
        feed.setAttribute('total', String(feed.querySelectorAll('article').length));
        more.remove();
      }
      done();
    }, 250);
  }));
});

more.addEventListener('click', () => feed.load());
```

_There are four articles here and the sample writes two. The preview opens with its last
article already in view, so the sentinel fired twice before you got here and `auto-load="2"`
is spent — which is the whole point of a budget: it runs out. **Load more** is what is left,
and it is the same `feed-load` listener answering. Stand in an article and press
<kbd>Page Down</kbd> to walk them, or <kbd>Ctrl</kbd> + <kbd>End</kbd> to leave the feed,
which lands on that same button._

## The markup

The articles you would have written anyway, wrapped, and named:

```html
<feed-elemental aria-label="Reviews">
  <article>
    <h3>Gino's</h3>
    <p>Thin crust, long queue.</p>
  </article>
</feed-elemental>
```

**Name it.** A feed takes its name from `aria-label`, or `aria-labelledby` where something
on the page already says it. The element cannot invent one and does not pretend to.

**Articles only.** `role="feed"` owns articles and nothing else, so a button between two of
them is not a child of the feed — it goes after the element, where <kbd>Ctrl</kbd> +
<kbd>End</kbd> lands on it. `<article>` is what the element looks for, and anything already
carrying `role="article"` counts too, which is the escape hatch for a feed whose items are
`<li>`s for reasons of its own.

## What it writes

| On | What | Why |
| --- | --- | --- |
| the element | `role="feed"` | The contract |
| the element | `aria-busy="true"` | While a load is out, so nothing is read half-written |
| each article | `tabindex="0"` | The pattern's own [example](https://www.w3.org/WAI/ARIA/apg/patterns/feed/examples/feed/) does the same — every article is a stop, and <kbd>Ctrl</kbd> + <kbd>End</kbd> is how you get past all of them |
| each article | `aria-posinset`, `aria-setsize` | Where this one sits, and how big the set is said to be |
| each article | `aria-labelledby` | Pointed at the article's own first heading, when the article has no name of its own |

An article with no heading is left unnamed rather than named something invented — a name
made out of the first sentence of the body would be a summary this element is in no
position to write. `aria-describedby` is the pattern's other recommendation and is not
written either: which node is the article's primary content is yours to say, and a guess
gets the wrong paragraph read to every reader.

Articles appended after upgrade are picked up on their own. Nothing has to call a refresh.

## Attributes

| Attribute | Type | Default | What it does |
| --- | --- | --- | --- |
| `auto-load` | number | — | How many times the feed may ask for more on its own as the last article comes into view. Absent, or `0`, and it never does. |
| `total` | number | — | How many articles there are in all. Absent and every article says `aria-setsize="-1"`. |

`-1` is the pattern's own word for a set whose size is not known yet, and a feed still
loading is exactly that. Counting what happens to be in the DOM instead would announce
"article 10 of 10" to a reader one scroll away from the eleventh, so a total is only ever
claimed when the page states one — and a `total` the DOM has already overtaken loses to
what is actually there.

## Loading more

The element does not fetch. It asks, the same way
[`<search-elemental>`](search.html) does, and whatever you append is what it indexes:

```js
feed.addEventListener('feed-load', (event) => {
  event.detail.wait(
    fetch(`/reviews?after=${event.detail.count}`, { signal: event.detail.signal })
      .then((response) => response.json())
      .then((rows) => feed.append(...rows.map(toArticle)))
  );
});
```

| In `detail` | What it is |
| --- | --- |
| `count` | How many articles are loaded now — the cursor, in the only terms the element knows |
| `signal` | An `AbortSignal` that fires if the feed leaves the document |
| `wait(promise)` | Hands the element the work, so `aria-busy` covers it |

Without `wait()` the element settles the moment your listener returns, which is right for a
page appending from something it already has and wrong for a request — there is no spinner
to draw and nothing to stop. One load is out at a time: asking again while one is in flight
is the same page of results twice, so it is ignored.

`feed.load()` is the same ask from script, and it is what the button after the feed calls.
The budget belongs to the sentinel alone — a press is a reader asking, and a reader asking
was never the thing that needed bounding.

**A failed load stops the sentinel.** A feed that asks a broken endpoint again every time
someone scrolls is a retry loop nobody wants; the button still works, which is the reader
back in control rather than out of options.

## Bounded on purpose

`auto-load` is a budget rather than a switch, and that is the whole design. Every critique
of infinite scroll — [Deque's](https://www.deque.com/blog/infinite-scrolling-rolefeed-accessibility-issues/),
[DigitalA11Y's](https://www.digitala11y.com/ok-aria-rolefeed-is-here-its-not-ready-for-prime-time/) —
lands on the same place: content that never stops arriving is a page speech control cannot
address, a screen a magnifier cannot keep up with, and a footer nobody reaches. Both ask for
the same fix, which is that loading stays under the reader's control.

So the sentinel is off unless you ask for it, it is spent after the number you gave, and
what is left when it stops is a button. A feed with no `auto-load` never watches anything at
all.

## Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Page Down</kbd> | Next article |
| <kbd>Page Up</kbd> | Previous article |
| <kbd>Ctrl</kbd> + <kbd>End</kbd> | The first focusable thing after the feed |
| <kbd>Ctrl</kbd> + <kbd>Home</kbd> | The first focusable thing before it |
| <kbd>Tab</kbd> | The next stop — every article is one, and so is anything focusable inside it |

**The ends do not wrap.** Running off one is not how you leave a feed — <kbd>Ctrl</kbd> +
<kbd>End</kbd> is — and one that looped would be one a reader can walk forever without
noticing they had.

Bare <kbd>Home</kbd> and <kbd>End</kbd> are left alone, because inside a comment box in a
feed they belong to the box, and a reader typing there should not be thrown out of the
article mid-word. <kbd>Ctrl</kbd> with <kbd>Page Up</kbd> or <kbd>Page Down</kbd> is left
alone too: that is the browser changing tabs.

Where nothing focusable sits after the feed, <kbd>Ctrl</kbd> + <kbd>End</kbd> is handed back
to the browser rather than swallowed — the key still has its own meaning, and a press that
does nothing at all is worse than one that scrolls.

## Without script

Articles, in order, each one readable. That is a feed that never grows rather than a broken
one — nothing is authored `tabindex="-1"` and nothing is hidden, so nothing is lost when the
script never arrives.

## What it will not do

No fetching, no wire format, no cursor bookkeeping: owning those is owning an escaping
boundary and someone else's API. No virtualisation and no unloading of articles scrolled
past — the pattern permits both and neither is this element's business, since dropping an
article a reader is standing in is a bug you want written where the data is. No "new posts"
banner, no scroll restoration, no empty state.

Scroll restoration is the one of those an infinite feed actually needs, and it needs things
this element has no way to know — how many articles were loaded, what the request that
rebuilds them looks like, which article the reader left from. [The infinite scroll feed
example](../examples/infinite-scroll-feed.html) is that written out on the page's side: what
to save, what order to put it back in, and which parts the browser already does.

## Styling

The structure stylesheet gives the element a box and keeps a focused article off the edge of
the screen. That second part is not decoration: focus is how this element moves the reader,
the browser scrolls what it focuses into view, and an article landing under a sticky header
is one the reader has to scroll back to after every press. The theme is optional and draws
the articles.

| Custom property | Default | What it does |
| --- | --- | --- |
| `--feed-elemental-scroll-margin` | `1rem` | How far a focused article is kept off the edge of the viewport |
| `--feed-elemental-gap` | `1rem` | Between one article and the next |
| `--feed-elemental-inset` | `1rem` | Padding inside an article |
| `--feed-elemental-radius` | `0.375rem` | Corners of an article |
| `--feed-elemental-border` | `color-mix(in srgb, currentcolor 20%, transparent)` | An article's outline |

`[aria-busy="true"]` is the loading hook, and the element sets it on itself. The theme draws
nothing for it — a spinner is a look, and this is a contract.

```scss
@use "book-of-elementals/feed/style.scss";
@use "book-of-elementals/feed/theme.scss"; // optional
```

```javascript
import 'book-of-elementals/feed';
```
