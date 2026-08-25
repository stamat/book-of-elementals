---
layout: poops-docs-theme/docs
title: Infinite scroll feed
description: A feed that loads more as you reach the end and puts you back where you were when you return — feed-elemental over a mocked API, and the two dozen lines that make a saved scroll offset mean anything.
order: 10
---

# Infinite scroll feed

Loading more as the reader reaches the end is the easy half. The half every infinite feed
gets wrong is the way back: open one of the things in it, press back, and you are at the top
of a feed you had walked eight pages into.

[`<feed-elemental>`](../elementals/feed.html) does not fetch and does not scroll forever, and
both of those are refusals rather than gaps — so the loading and the coming back are the
page's, which is what this example is. A mocked endpoint behind `feed-load`, a scroll pane,
and the two dozen lines that make a saved offset mean something when the reader comes back
to it.

<!-- demo feed style="--code-preview-height:321px" -->

```html
<div class="pane">
  <feed-elemental aria-label="Ethics, Part I" auto-load="2"></feed-elemental>
  <button type="button" class="more">Load more</button>
</div>

<section class="detail" hidden>
  <h3 tabindex="-1"></h3>
  <p></p>
  <button type="button" class="back">Back to the argument</button>
</section>
```

```css demo
/* The feed scrolls in its own box rather than with the page - the case worth showing,
   because the offset that matters is then a pane's and the articles in it arrive late. */
.pane {
  box-sizing: border-box;
  max-inline-size: 32rem;
  block-size: 18rem;
  overflow-y: auto;
  padding: 0.75rem;
  border: 1px solid color-mix(in srgb, currentcolor 20%, transparent);
  border-radius: 0.375rem;
}
.detail { max-inline-size: 32rem; }
feed-elemental h3, .detail h3 { margin: 0 0 0.25rem; font-size: 1rem; }
feed-elemental p, .detail p { margin: 0; }
/* The busy state is the element's to set and the page's to draw. The button is a sibling
   of the feed, so `+` is the whole of reaching it - and dimmed rather than `disabled`,
   because disabling a focused button drops focus to the body, and Ctrl+End just put it
   here. */
feed-elemental[aria-busy="true"] { opacity: 0.6; }
feed-elemental[aria-busy="true"] + .more { opacity: 0.6; cursor: progress; }
.more, .back {
  margin-block-start: 1rem;
  padding: 0.35rem 0.75rem;
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: color-mix(in srgb, currentcolor 6%, Canvas);
  border: 1px solid color-mix(in srgb, currentcolor 35%, transparent);
  border-radius: 0.375rem;
}
```

```js demo
// The page owns the data, the fetching and the cursor. This one owns none of them for real:
// a mock answering out of an array a few hundred milliseconds late, so the busy state has
// something to be busy about and the way back has something to wait for.
//
// The set is the whole of Spinoza's argument for God's existence - eight definitions, seven
// axioms and the eleven propositions that get there - which makes it the honest shape for a
// feed: an order that matters, and an end worth reaching.
const ETHICS = [
  ['Definition I', 'By that which is self-caused, I mean that of which the essence involves existence, or that of which the nature is only conceivable as existent.'],
  ['Definition II', 'A thing is called finite after its kind, when it can be limited by another thing of the same nature; for instance, a body is called finite because we always conceive another greater body.'],
  ['Definition III', 'By substance, I mean that which is in itself, and is conceived through itself: in other words, that of which a conception can be formed independently of any other conception.'],
  ['Definition IV', 'By attribute, I mean that which the intellect perceives as constituting the essence of substance.'],
  ['Definition V', 'By mode, I mean the modifications of substance, or that which exists in, and is conceived through, something other than itself.'],
  ['Definition VI', 'By God, I mean a being absolutely infinite - that is, a substance consisting in infinite attributes, of which each expresses eternal and infinite essentiality.'],
  ['Definition VII', 'That thing is called free, which exists solely by the necessity of its own nature, and of which the action is determined by itself alone.'],
  ['Definition VIII', 'By eternity, I mean existence itself, in so far as it is conceived necessarily to follow solely from the definition of that which is eternal.'],
  ['Axiom I', 'Everything which exists, exists either in itself or in something else.'],
  ['Axiom II', 'That which cannot be conceived through anything else must be conceived through itself.'],
  ['Axiom III', 'From a given definite cause an effect necessarily follows; and, on the other hand, if no definite cause be granted, it is impossible that an effect can follow.'],
  ['Axiom IV', 'The knowledge of an effect depends on and involves the knowledge of a cause.'],
  ['Axiom V', 'Things which have nothing in common cannot be understood, the one by means of the other; the conception of one does not involve the conception of the other.'],
  ['Axiom VI', 'A true idea must correspond with its ideate or object.'],
  ['Axiom VII', 'If a thing can be conceived as non-existing, its essence does not involve existence.'],
  ['Proposition I', 'Substance is by nature prior to its modifications.'],
  ['Proposition II', 'Two substances, whose attributes are different, have nothing in common.'],
  ['Proposition III', 'Things which have nothing in common cannot be one the cause of the other.'],
  ['Proposition IV', 'Two or more distinct things are distinguished one from the other, either by the difference of the attributes of the substances, or by the difference of their modifications.'],
  ['Proposition V', 'There cannot exist in the universe two or more substances having the same nature or attribute.'],
  ['Proposition VI', 'One substance cannot be produced by another substance.'],
  ['Proposition VII', 'Existence belongs to the nature of substances.'],
  ['Proposition VIII', 'Every substance is necessarily infinite.'],
  ['Proposition IX', 'The more reality or being a thing has, the greater the number of its attributes.'],
  ['Proposition X', 'Each particular attribute of the one substance must be conceived through itself.'],
  ['Proposition XI', 'God, or substance, consisting of infinite attributes, of which each expresses eternal and infinite essentiality, necessarily exists.']
];
const POSTS = ETHICS.map(([title, body], at) => ({ id: 'ethics-' + (at + 1), title, body }));
const PAGE = 4;

/** The mocked endpoint: `count` posts from `from`, late. */
function api(from, count) {
  return new Promise((send) => setTimeout(() => send(POSTS.slice(from, from + count)), 300));
}

const pane = document.querySelector('.pane');
const feed = pane.querySelector('feed-elemental');
const more = pane.querySelector('.more');
const detail = document.querySelector('.detail');

// `textContent`, not a template string: escaping the text at the one place it is
// interpolated is a rule easier to keep than to remember.
function render(post) {
  const article = document.createElement('article');
  const heading = document.createElement('h3');
  const link = document.createElement('a');
  const body = document.createElement('p');
  link.href = '#' + post.id;
  link.textContent = post.title;
  body.textContent = post.body;
  heading.append(link);
  article.append(heading, body);
  return article;
}

// The end of the set is the page's to declare: `total` is what stops every article saying
// "of -1", and the button is what stops being a lie.
function ended() {
  const loaded = feed.querySelectorAll('article').length;
  if (loaded >= POSTS.length) feed.setAttribute('total', String(POSTS.length));
  more.hidden = loaded >= POSTS.length;
}

feed.addEventListener('feed-load', (event) => {
  event.detail.wait(api(event.detail.count, PAGE).then((posts) => {
    feed.append(...posts.map(render));
    ended();
  }));
});

more.addEventListener('click', () => feed.load());
feed.load();

// What the page remembers while the reader is somewhere else. A real one keeps this in
// `history.state`, so it belongs to the history entry it describes; this one is a variable,
// because the demo never leaves the document.
let saved = null;

pane.addEventListener('click', (event) => {
  const link = event.target.closest('article a[href]');
  if (!link) return;
  event.preventDefault();

  // Read before anything is hidden. A box that is `display: none` has no scroll offset to
  // read and none to set, which is the whole trap of restoring one.
  saved = { count: feed.querySelectorAll('article').length, scroll: pane.scrollTop, id: link.hash.slice(1) };

  const post = POSTS.find((entry) => entry.id === saved.id);
  detail.querySelector('h3').textContent = post.title;
  detail.querySelector('p').textContent = post.body;
  // The feed is torn down on the way out, because that is what leaving does to it - a router
  // unmounting the view, or a browser building the next document. Leaving it in the DOM would
  // make the section below a demo of nothing.
  feed.replaceChildren();
  pane.hidden = true;
  detail.hidden = false;
  detail.querySelector('h3').focus();
});

detail.querySelector('.back').addEventListener('click', () => {
  detail.hidden = true;
  pane.hidden = false;

  // One request for everything that was loaded, not one per page. However many pages the
  // reader walked down, the way back is not that many round trips.
  api(0, saved.count).then((posts) => {
    feed.replaceChildren(...posts.map(render));
    ended();
    // `preventScroll`, then the offset. `focus()` scrolls what it lands on into view, and a
    // scroll of the browser's choosing is not the one that was saved.
    const link = pane.querySelector('a[href="#' + saved.id + '"]');
    if (link) link.focus({ preventScroll: true });
    pane.scrollTop = saved.scroll;
  });
});
```

_Scroll to the end of the pane twice and the feed loads on its own, then **Load more** is
what is left — `auto-load="2"` is a budget and it runs out. Keep going and the argument ends
where Spinoza ends it, at Proposition XI. Open any one of them and press **Back to the
argument**: the articles you had are back, the pane is at the offset you left it at, and
focus is on the proposition you opened._

## The markup

An empty feed, a button after it, and a second view to leave for:

```html
<div class="pane">
  <feed-elemental aria-label="Ethics, Part I" auto-load="2"></feed-elemental>
  <button type="button" class="more">Load more</button>
</div>

<section class="detail" hidden>
  <h3 tabindex="-1"></h3>
  <p></p>
  <button type="button" class="back">Back to the argument</button>
</section>
```

**The button is inside the pane and after the feed**, which is where <kbd>Ctrl</kbd> +
<kbd>End</kbd> lands — so the way out of the feed and the way on through it are one key. It
is not inside the element, because [a feed owns articles](../elementals/feed.html#the-markup)
and nothing else.

**The button does not go busy on its own.** `aria-busy` is written on the *feed*, and the
button is the thing the reader is actually looking at when they press it — so a press on a
slow connection looks like nothing happened, and the second and third press look like nothing
happened either, because `load()` ignores an ask while one is in flight. One sibling selector
is the whole fix, and it needs no script:

```css
feed-elemental[aria-busy="true"] + .more { opacity: 0.6; cursor: progress; }
```

**Dimmed, not `disabled`.** Disabling a button takes focus off it — straight to the body, from
where <kbd>Shift</kbd> + <kbd>Tab</kbd> is a walk back through the whole feed — and this is
the button <kbd>Ctrl</kbd> + <kbd>End</kbd> just moved the reader to. The press that arrives
anyway costs nothing: the element drops it.

**The feed starts empty here and the first page comes from the mock**, so the sample has one
source of data rather than a copy in the markup that has to agree with it. A real page sends
the first articles in the HTML and the cursor picks up from there — that is the version that
still works with no script, and it costs this page nothing to say so and everything to fake.

## The cursor is a count

`feed-load` hands over `detail.count`: how many articles are loaded right now. That is the
only cursor the element has, and it is the one worth having — it is true whether the first
page came from the server, from the mock, or from a restore that fetched six pages at once.

```js
feed.addEventListener('feed-load', (event) => {
  event.detail.wait(api(event.detail.count, PAGE).then((posts) => {
    feed.append(...posts.map(render));
    ended();
  }));
});
```

`wait()` is what buys the busy state: without it the element settles the moment the listener
returns, which is right for a page appending from something it already has and wrong for a
request. A real endpoint takes `event.detail.signal` as well, and gets aborted if the feed
leaves the document mid-flight.

## If it should never stop

`auto-load` is a budget rather than a switch, and
[deliberately so](../elementals/feed.html#bounded-on-purpose) — so there is no
`auto-load="infinite"` to write, and a page that wants one is asking for the thing the
element refuses. It is still your page, and there are three ways to have it:

| Way | What it takes | What it costs |
| --- | --- | --- |
| A ceiling | `auto-load="999"` on the element | Nothing, and the bound is honest: at `PAGE` of four that is just under four thousand articles before the button comes back. A number large enough to never be reached is a lie about intent, not about behaviour |
| Refill the budget | `feed.setAttribute('auto-load', String(Number(feed.getAttribute('auto-load')) + 1))` in the `feed-load` listener | Genuinely unbounded. The attribute stops describing anything after the first load, and <kbd>Ctrl</kbd> + <kbd>End</kbd> becomes the only way past a feed that now has no end |
| Own the sentinel | Your own `IntersectionObserver` on the last article, calling `feed.load()` | Everything the element's sentinel already gets right — one load out at a time, giving up when a load fails, tearing itself down when the feed leaves the document — is yours to write again |

**Setting the same number again does not refill it.** An attribute write that does not change
the value is dropped, so a refill has to be a number the element has not seen — which is why
the middle row counts up rather than writing `2` over `2`. Driven in Chromium over this page:
re-setting `auto-load="2"` on every load stops at the same twelve articles a plain budget of
two does, and incrementing runs to the end of the mock's twenty-six.

**The reason not to** is the one the element is built round, and it is
[argued on its own page](../elementals/feed.html#bounded-on-purpose) rather than twice here: a
feed that never stops is a footer nobody reaches. The budget is what a reader gets instead —
and the button is the reader asking, which was never the thing that needed bounding.

## Leaving, and coming back

Three things go out of scope when the reader opens one of them, and all three have to come back:

| Saved | What it is | What goes wrong without it |
| --- | --- | --- |
| `count` | How many articles were loaded | The reader gets page one and has to walk back down through six pages they already read |
| `scroll` | The pane's offset | They are at the top of the right amount of content, which is the same failure wearing a better disguise |
| `id` | The article they opened | Focus is on nothing, so a keyboard starts from the top of the document and a screen reader has no idea the feed came back |

```js
saved = { count: feed.querySelectorAll('article').length, scroll: pane.scrollTop, id: link.hash.slice(1) };
```

**Read the offset before hiding anything.** A box that is `display: none` has no layout, so
its `scrollTop` reads `0` and refuses to be set — the same trap as
[a carousel inside a closed dialog](lightbox.html#why-that-is-six-lines-and-not-sixteen)
having no width. On the way back the pane is unhidden first and scrolled after, for the same
reason.

**The way back is one request, not a replay.** `api(0, saved.count)` asks for the whole
prefix in one go. Paging back up to where the reader was, `PAGE` at a time, is one round trip
per page to rebuild something they had already waited for once — and every one of them is a
chance to render a feed halfway and scroll it before the rest lands.

```js
api(0, saved.count).then((posts) => {
  feed.replaceChildren(...posts.map(render));
  ended();
  const link = pane.querySelector('a[href="#' + saved.id + '"]');
  if (link) link.focus({ preventScroll: true });
  pane.scrollTop = saved.scroll;
});
```

**Focus first, offset second, and focus without scrolling.**
[`focus({ preventScroll: true })`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#preventscroll)
is the whole of that line: `focus()` scrolls what it lands on into view, and where the
browser decides to put an article is not where the reader left it — off by
`--feed-elemental-scroll-margin` at best, and by a screenful when the article is taller than
the pane. Restoring the offset after the focus, rather than before it, is what makes the two
agree.

**The element is the same instance here, so its `auto-load` budget stays spent** across the
swap. On a real navigation the document is new and so is the budget, which is the more
generous behaviour of the two — this demo is the stingy version, and it is stingy in the
direction that cannot surprise anybody.

## What the platform restores on its own

Some of this is already done for you, and knowing which part is the difference between
two dozen lines and a hundred:

| Mechanism | What it puts back | Why it is not enough here |
| --- | --- | --- |
| [bfcache](https://developer.mozilla.org/en-US/docs/Glossary/bfcache) | "A complete snapshot of a page", the JavaScript heap included | Only on a back or forward across documents, and only when the page qualifies. A view swapped inside one document never left it, so there is no snapshot to come back to |
| [`history.scrollRestoration`](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration) at its `auto` setting | "The location on the page to which the user has scrolled" | An offset is a number about content that exists. Restore one into a document holding four articles and it clamps to the bottom of four |
| Either | The articles | Nothing does. They came out of a request, and the only thing that knows how many of them there were is the page that counted |

So the order matters: **content first, then focus, then the offset** — and a page that sets
`history.scrollRestoration = 'manual'` is a page saying it will do all three itself rather
than watch the browser get the middle one right at the wrong moment.

## What this costs

**A count is not a snapshot.** Asking for the first `count` posts assumes the set has not
changed underneath the reader. For a set that only grows at the end — a log, or a dead
philosopher — it has not. For a feed that grows at the *front*, anything with new posts at
the top, the same request returns a window that has slid: the reader comes back one article
above where they were and none the wiser. The fix is a cursor the server owns: save the id of the oldest article and ask for
everything since it, which is the same request in a shape that cannot slide.

**Nothing here is virtualised.** Twenty-six articles restore in one paint; twenty-six
hundred is a different example and probably a different element — the feed
[does not unload what scrolls past](../elementals/feed.html#what-it-will-not-do), on the
reasoning that dropping an article a reader is standing in is a bug you want written where
the data is.

**The heights have to be stable.** The offset is restored the moment the articles are in the
DOM, so anything that grows afterwards — an image with no `width` and `height`, a font swap,
an embed — moves the content out from under the number. Give the articles their dimensions,
or restore the offset after the growing has stopped, but do not do neither and call it
flaky.

<small>The text is Part I of Spinoza's <i>Ethics</i> in R. H. M. Elwes' translation, from
<a href="https://www.gutenberg.org/ebooks/3800">Project Gutenberg</a> — public domain. The
statements only; the proofs that carry the argument are not here, and Spinoza would mind.</small>
