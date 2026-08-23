---
layout: poops-docs-theme/docs
title: Media player
description: A play button, a scrubber and a volume over the audio or video element you already wrote — toolbar-elemental holding two slider-elementals, and the forty lines that wire them to the media.
order: 8
---

# Media player

Every media player library starts by taking the player away from you: you hand over an
`<audio>` and a config object, and back comes someone else's control bar. This is the other
way round — **you** write the controls, in your markup, in the order you put them, and the page
wires them to the media.

It is [`<toolbar-elemental>`](../elementals/toolbar.html) holding two
[`<slider-elemental>`](../elementals/slider.html)s, and it is the composition that makes the
point: neither of them knows what media is, and neither needed a line of new code.

<figure class="demo-media">
  <audio class="demo-media-audio" controls preload="metadata" src="https://mdn.github.io/shared-assets/audio/voices-around-a-fire.mp3"></audio>
  <toolbar-elemental class="demo-media-bar" aria-label="Playback" hidden>
    <button type="button" class="demo-media-play" aria-label="Play">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path class="demo-media-icon-play" d="M4 2.5v11l9-5.5z"/><path class="demo-media-icon-pause" d="M4 3h3v10H4zm5 0h3v10H9z"/></svg>
    </button>
    <slider-elemental class="demo-media-scrubber" tooltip="thumb track">
      <input type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek" aria-valuetext="0:00 of 0:00">
    </slider-elemental>
    <p class="demo-media-time"><span class="demo-media-now">0:00</span> / <span class="demo-media-total">0:00</span></p>
    <button type="button" class="demo-media-mute" aria-label="Mute" aria-pressed="false">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5z"/><path class="demo-media-icon-sound" d="M10.5 5.8a3 3 0 0 1 0 4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path class="demo-media-icon-silent" d="m11 6 3.5 4m0-4L11 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </button>
    <slider-elemental class="demo-media-volume" tooltip>
      <input type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
    </slider-elemental>
  </toolbar-elemental>
</figure>

<small>Audio: <a href="https://github.com/mdn/shared-assets">MDN's shared assets</a>, the same source the <a href="video-gallery.html">video gallery</a> plays from.</small>

_<kbd>Tab</kbd> through the bar and it is three stops for four controls: the two buttons share
one, because that is what a toolbar is, and each slider keeps its own. <kbd>→</kbd> on the play
button lands on mute, straight past the scrubber between them; <kbd>←</kbd> on the volume moves
the volume. Nothing on this page had to say which control was which._

## The markup

```html
<figure class="player">
  <audio controls preload="metadata" src="/episode.mp3"></audio>

  <toolbar-elemental aria-label="Playback" hidden>
    <button type="button" class="play" aria-label="Play">▶</button>

    <slider-elemental class="scrubber" tooltip="thumb track">
      <input type="range" min="0" max="100" step="0.01" value="0"
             aria-label="Seek" aria-valuetext="0:00 of 0:00" />
    </slider-elemental>

    <p class="time"><span class="now">0:00</span> / <span class="total">0:00</span></p>

    <button type="button" class="mute" aria-label="Mute" aria-pressed="false">🔊</button>

    <slider-elemental class="volume" tooltip>
      <input type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume" />
    </slider-elemental>
  </toolbar-elemental>
</figure>
```

Two things in there are the whole progressive-enhancement story. **The `<audio>` keeps
`controls`**, so a browser with no script still shows a player that works. **The bar is
`hidden`**, so the controls nobody is driving yet are not on the page. The glue swaps them, and
that swap is the first thing it does.

## The glue

```javascript
const clock = (s) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';

function wire(player) {
  const media = player.querySelector('audio, video');
  const bar = player.querySelector('toolbar-elemental');
  const scrubber = player.querySelector('.scrubber');
  const volume = player.querySelector('.volume');
  const seek = scrubber.querySelector('input');
  const level = volume.querySelector('input');
  const play = player.querySelector('.play');
  const mute = player.querySelector('.mute');
  const now = player.querySelector('.now');
  const total = player.querySelector('.total');

  // the swap: the browser's controls go and ours arrive, and only now that there is script here
  media.controls = false;
  bar.hidden = false;

  // what the bubbles say, because a scrubber reading 137 and a volume reading 0.4 are both
  // the number and neither is the answer
  scrubber.format = clock;
  volume.format = (value) => `${Math.round(value * 100)}%`;

  media.addEventListener('loadedmetadata', () => {
    seek.max = media.duration;
    total.textContent = clock(media.duration);
    scrubber.apply();
  });

  let scrubbing = false;
  seek.addEventListener('pointerdown', () => { scrubbing = true; });
  document.addEventListener('pointerup', () => { scrubbing = false; });

  media.addEventListener('timeupdate', () => {
    if (!scrubbing) {
      seek.value = media.currentTime;
      scrubber.apply();
    }
    now.textContent = clock(media.currentTime);
    seek.setAttribute('aria-valuetext', `${clock(media.currentTime)} of ${clock(media.duration)}`);
  });

  media.addEventListener('play', () => { player.dataset.playing = ''; play.setAttribute('aria-label', 'Pause'); });
  media.addEventListener('pause', () => { delete player.dataset.playing; play.setAttribute('aria-label', 'Play'); });

  play.addEventListener('click', () => (media.paused ? media.play() : media.pause()));
  seek.addEventListener('input', () => { media.currentTime = Number(seek.value); });
  level.addEventListener('input', () => { media.volume = Number(level.value); });
  mute.addEventListener('click', () => {
    media.muted = !media.muted;
    mute.setAttribute('aria-pressed', String(media.muted));
  });
}

document.querySelectorAll('.player').forEach(wire);
```

Forty lines, ten of them a `querySelector`, and every one of the rest is about the *media* —
not about focus, not about roles, not about which key does what. That is the whole return on
the two elements.

It is a function rather than a script because the same bar goes over
[a `<video>` further down](#the-same-bar-over-a-video) without a line changed:
`querySelector("audio, video")` is the only place on this page that had to know which it is.

## A value written from script has to say so

`scrubber.apply()` in there is not decoration, and leaving it out is the bug this page had
until it did not. **Assigning `input.value` fires no event.** Not `input`, not `change` —
that is the HTML spec's rule for programmatic value changes, and it is what stops a script
that syncs two fields from looping forever. `<slider-elemental>` paints its fill from the
`input` event, so a scrubber driven by `timeupdate` moves its thumb — the browser draws
that — while the fill behind it stays frozen wherever the last drag left it.

[`apply()`](../elementals/slider.html#properties) is the element's public catch-up for exactly
this case: it re-reads the inputs and rewrites `--slider-elemental-start` and
`--slider-elemental-end`. Two places on this page need it, and both are places where script
moved something the element could not see:

| After | Why the element cannot see it |
| --- | --- |
| `seek.value = media.currentTime` | An assigned value fires nothing |
| `seek.max = media.duration` | The scale moved under a value that did not, so every ratio is stale |

`<media-player>` [does the same thing in its `paint()`](https://github.com/stamat/media-player),
and for the same reason — this is the one line of glue that a hand-rolled player and a finished
one have identically.

Nothing else needs it. A drag, an arrow key, <kbd>Home</kbd>, a form reset, a
back-navigation — the element hears all of those on its own.

## The arrows do not fight the scrubber

A control bar with sliders in it is where the toolbar pattern usually breaks: the bar wants
<kbd>←</kbd> and <kbd>→</kbd> for walking between controls, and a range input wants exactly the
same two keys for its own value. One of them has to lose, and in most implementations it is the
slider — a scrubber you cannot move with the keyboard.

**[`<toolbar-elemental>`](../elementals/toolbar.html) walks `button` and `a[href]` and nothing
else**, so the question never comes up. The sliders are not in the roving tabindex, so they keep
their own arrows and their own tab stop, and the two buttons share one between them. Nothing on
this page configures that; it is the element's own answer to
[MDN's advice](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/toolbar_role)
that a control wanting the arrow keys should be kept out of a toolbar or put last.

## What a scrubber announces

A range input at 137 announces *137*, and 137 of what is the reader's problem. So the glue keeps
`aria-valuetext` on it:

```javascript
seek.setAttribute('aria-valuetext', `${clock(media.currentTime)} of ${clock(media.duration)}`);
```

That is the page's job rather than the element's, and deliberately.
[`<slider-elemental>`](../elementals/slider.html) writes no ARIA at all — no `role="slider"`, no
`aria-valuenow` — because the `<input type="range">` inside it already is the APG Slider pattern
and rewriting it would be replacing something correct with something copied. What it cannot know
is that this particular slider is seconds, and that seconds are read as minutes and seconds.

`aria-valuemin` and `aria-valuemax` stay off for the reason that page gives:
[HTML-ARIA](https://www.w3.org/TR/html-aria/) says authors should not put them on a range input.

## What the bubbles say

The same problem again, for the reader who is looking rather than listening. Hover the scrubber
and the bubble reads `1:12`, not `72`; hover the volume and it reads `60%`, not `0.6`. Both are
[`tooltip`](../elementals/slider.html#the-value-bubble) in the markup and
[`format`](../elementals/slider.html#saying-something-other-than-the-number) in the glue:

| Slider | Attribute | `format` | What it buys |
| --- | --- | --- | --- |
| Scrubber | `tooltip="thumb track"` | `clock` | The time under the thumb, **and the time under the pointer anywhere on the track** — which is the "where would this seek to" every media player has |
| Volume | `tooltip` (bare, so `thumb` only) | `(v) => Math.round(v * 100) + "%"` | The one thing `0.6` will not say |

`clock` is already there for the `<span>`s and the `aria-valuetext`, so the scrubber's formatter
is that same function handed over — one spelling of a time on this page, in three places that
would otherwise be three chances to disagree.

**The bubbles are pointer-only and `aria-hidden`.** A keyboard reader never sees one and is not
missing anything: the input under it announces its own value, with `aria-valuetext` already
saying it as a time. That is why the clock beside the scrubber stays — the bubble is a
convenience for a hovering hand, never the only place a number lives.

## Two buttons, two conventions

| Button | Name | State |
| --- | --- | --- |
| Play / pause | swaps — `Play`, then `Pause` | none |
| Mute | fixed — `Mute` | `aria-pressed` |

That looks inconsistent and is not. Mute is a **setting**: it stays on until you turn it off,
which is exactly the shape `aria-pressed` is for and the reasoning
[`<password-elemental>`](../elementals/password.html) spells out at length. Play is an
**action**, and the action changes: the button that was going to start the audio is now going to
stop it, and a name that stayed `Play` while `aria-pressed="true"` would be describing the state
rather than the press.

The icons swap on one attribute — `player.dataset.playing` — and CSS shows one of the two paths.
Nothing in the glue touches an icon.

## The same bar over a video

Same markup, same glue, `<video>` instead of `<audio>`:

<figure class="demo-media">
  <video class="demo-media-video" controls playsinline preload="metadata" src="https://mdn.github.io/shared-assets/videos/friday.mp4#t=0.1"></video>
  <toolbar-elemental class="demo-media-bar" aria-label="Playback" hidden>
    <button type="button" class="demo-media-play" aria-label="Play">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path class="demo-media-icon-play" d="M4 2.5v11l9-5.5z"/><path class="demo-media-icon-pause" d="M4 3h3v10H4zm5 0h3v10H9z"/></svg>
    </button>
    <slider-elemental class="demo-media-scrubber" tooltip="thumb track">
      <input type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek" aria-valuetext="0:00 of 0:00">
    </slider-elemental>
    <p class="demo-media-time"><span class="demo-media-now">0:00</span> / <span class="demo-media-total">0:00</span></p>
    <button type="button" class="demo-media-mute" aria-label="Mute" aria-pressed="false">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5z"/><path class="demo-media-icon-sound" d="M10.5 5.8a3 3 0 0 1 0 4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path class="demo-media-icon-silent" d="m11 6 3.5 4m0-4L11 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </button>
    <slider-elemental class="demo-media-volume" tooltip>
      <input type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
    </slider-elemental>
  </toolbar-elemental>
</figure>

<small>Video: <em>Friday</em>, from <a href="https://github.com/mdn/shared-assets">MDN's shared assets</a> — convenient for docs, wrong for a site you ship: host your own.</small>

```html
<figure class="player">
  <video controls playsinline preload="metadata" src="/clip.mp4"></video>

  <toolbar-elemental aria-label="Playback" hidden>
    <!-- byte for byte the bar from the top of this page -->
  </toolbar-elemental>
</figure>
```

The demo above adds one thing the sample does not: its `src` ends `#t=0.1`. A `<video>` with
no `poster` and `preload="metadata"` has a duration but no decoded frame, so it sits there as
an empty box until something plays it — and a
[media fragment](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_concepts#specifying_playback_range)
asking for a tenth of a second in is a frame the browser has to fetch and paint. A real page
writes `poster` instead; this one is borrowing a file it does not host.

**Nothing in the glue changed.** `currentTime`, `duration`, `volume`, `muted`, `play`, `pause`
and `timeupdate` are `HTMLMediaElement`'s, not `HTMLAudioElement`'s, so the glue that knew how
to drive an `<audio>` already knew how to drive this. The one edit is
`querySelector("audio, video")`, and it exists so a page can hold both.

`playsinline` is the one attribute a video wants and audio has no use for: without it, an
iPhone takes a playing video into its own fullscreen player, and the bar you wrote is not the
one on screen.

What a video wants next is a fullscreen button and a `<track>` of captions, and neither is
composition — the first is `requestFullscreen()` on the figure, and on an iPhone only the
`<video>` itself can go fullscreen, by `webkitEnterFullscreen()`; the second is real work.
[That is where `<media-player>` starts](#when-you-want-the-whole-thing).

## Without script

The `<audio controls>` or `<video controls>` you wrote, playing, with the browser's own player
and every keyboard shortcut it comes with. The custom bar is `hidden` in the markup, so it is
not there at all — and the swap happens in script, which means it cannot happen when there is no
script to do it.

This is the one arrangement where a custom media player is not a downgrade. The usual one writes
`<audio>` with no `controls` and builds a bar next to it, and a script that fails to load leaves
a silent rectangle.

## What the two elements are already doing

| Part | What it already does |
| --- | --- |
| `<audio>` / `<video>` | Decoding, buffering, `currentTime`, `duration`, `volume`, `muted`, and every event above |
| `<toolbar-elemental>` | `role="toolbar"`, one tab stop for the buttons, the arrows walking them, and staying out of the sliders' way |
| `<slider-elemental>` | The track fill CSS cannot place on its own — `--slider-elemental-start` and `--slider-elemental-end` — with the half-thumb correction that makes the fill line up with the thumb at both ends; the pointer bubble, and `apply()` for the values script moves |
| `<input type="range">` | The whole APG Slider pattern: arrows, <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd>, touch, and `step` |
| Neither element | Anything about media. This page is the only thing here that knows what a scrubber is |

## When you want the whole thing

This is a demonstration of composition, not a media player. What it leaves out is most of one:
captions and `<track>`, fullscreen, playback rate, picture-in-picture, a buffered range behind
the scrubber, keyboard shortcuts on the media itself, a playlist, remembering where you stopped.

**That is [`<media-player>`](https://github.com/stamat/media-player)** — one custom element over
the `<audio>` or `<video>` you already wrote, which keeps this arrangement and finishes it: you
still write the controls, and it wires them by name instead of by the forty lines above. Its
own control bar is a `<toolbar-elemental>` with a `<slider-elemental>` scrubber inside it, so
what you have just read is that element's skeleton. `npm i media-player-element`.

The buffered range is the one omission with a piece already in the book:
[`<progress-elemental>`](../elementals/progress.html)'s `buffer` exists for exactly the part that
is loaded but not played.

<script src="{{ relativePathPrefix }}dist/elementals/toolbar.js"></script>
<script src="{{ relativePathPrefix }}dist/elementals/slider.js"></script>
<script>
  (() => {
    const clock = (s) =>
      Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

    function wire(player) {
      const media = player.querySelector("audio, video");
      const bar = player.querySelector(".demo-media-bar");
      const scrubber = player.querySelector(".demo-media-scrubber");
      const volume = player.querySelector(".demo-media-volume");
      const seek = scrubber.querySelector("input");
      const level = volume.querySelector("input");
      const play = player.querySelector(".demo-media-play");
      const mute = player.querySelector(".demo-media-mute");
      const now = player.querySelector(".demo-media-now");
      const total = player.querySelector(".demo-media-total");

      media.controls = false;
      bar.hidden = false;

      scrubber.format = clock;
      volume.format = (value) => `${Math.round(value * 100)}%`;

      media.addEventListener("loadedmetadata", () => {
        seek.max = media.duration;
        total.textContent = clock(media.duration);
        // The scale moved; the fill is a ratio against it and every one of them is now stale.
        scrubber.apply();
      });

      let scrubbing = false;
      seek.addEventListener("pointerdown", () => { scrubbing = true; });
      document.addEventListener("pointerup", () => { scrubbing = false; });

      media.addEventListener("timeupdate", () => {
        if (!scrubbing) {
          seek.value = media.currentTime;
          // An assigned value fires no `input`, so the element has no idea the thumb moved.
          scrubber.apply();
        }
        now.textContent = clock(media.currentTime);
        seek.setAttribute("aria-valuetext", `${clock(media.currentTime)} of ${clock(media.duration)}`);
      });

      media.addEventListener("play", () => {
        player.dataset.playing = "";
        play.setAttribute("aria-label", "Pause");
      });
      media.addEventListener("pause", () => {
        delete player.dataset.playing;
        play.setAttribute("aria-label", "Play");
      });

      play.addEventListener("click", () => (media.paused ? media.play() : media.pause()));
      seek.addEventListener("input", () => { media.currentTime = Number(seek.value); });
      level.addEventListener("input", () => { media.volume = Number(level.value); });
      mute.addEventListener("click", () => {
        media.muted = !media.muted;
        mute.setAttribute("aria-pressed", String(media.muted));
      });
    }

    document.querySelectorAll(".demo-media").forEach(wire);
  })();
</script>
