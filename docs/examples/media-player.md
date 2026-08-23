---
layout: poops-docs-theme/docs
title: Media player
description: A play button, a scrubber and a volume over the audio element you already wrote — toolbar-elemental holding two slider-elementals, and the twenty lines that wire them to the media.
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
    <slider-elemental class="demo-media-scrubber">
      <input type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek" aria-valuetext="0:00 of 0:00">
    </slider-elemental>
    <p class="demo-media-time"><span class="demo-media-now">0:00</span> / <span class="demo-media-total">0:00</span></p>
    <button type="button" class="demo-media-mute" aria-label="Mute" aria-pressed="false">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 2.5 4.5 5.5H2v5h2.5L8 13.5z"/><path class="demo-media-icon-sound" d="M10.5 5.8a3 3 0 0 1 0 4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path class="demo-media-icon-silent" d="m11 6 3.5 4m0-4L11 10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </button>
    <slider-elemental class="demo-media-volume">
      <input type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
    </slider-elemental>
  </toolbar-elemental>
</figure>

<p class="demo-credit">Audio: <a href="https://github.com/mdn/shared-assets">MDN's shared assets</a>, the same source the <a href="video-gallery.html">video gallery</a> plays from — convenient for docs, wrong for a site you ship: host your own.</p>

_<kbd>Tab</kbd> through the bar and it is three stops for four controls: the two buttons share
one, because that is what a toolbar is, and each slider keeps its own. <kbd>→</kbd> on the play
button lands on mute, straight past the scrubber between them; <kbd>←</kbd> on the volume moves
the volume. Nothing on this page had to say which control was which._

## The markup

```html
<figure>
  <audio controls preload="metadata" src="/episode.mp3"></audio>

  <toolbar-elemental aria-label="Playback" hidden>
    <button type="button" class="play" aria-label="Play">▶</button>

    <slider-elemental class="scrubber">
      <input type="range" min="0" max="100" step="0.01" value="0"
             aria-label="Seek" aria-valuetext="0:00 of 0:00" />
    </slider-elemental>

    <p class="time"><span class="now">0:00</span> / <span class="total">0:00</span></p>

    <button type="button" class="mute" aria-label="Mute" aria-pressed="false">🔊</button>

    <slider-elemental class="volume">
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
const player = document.querySelector("figure");
const audio = player.querySelector("audio");
const bar = player.querySelector("toolbar-elemental");
const seek = player.querySelector(".scrubber input");
const volume = player.querySelector(".volume input");
const play = player.querySelector(".play");
const mute = player.querySelector(".mute");
const now = player.querySelector(".now");
const total = player.querySelector(".total");

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// the swap: the browser's controls go and ours arrive, and only now that there is script here
audio.controls = false;
bar.hidden = false;

audio.addEventListener("loadedmetadata", () => {
  seek.max = audio.duration;
  total.textContent = clock(audio.duration);
});

let scrubbing = false;
seek.addEventListener("pointerdown", () => { scrubbing = true; });
document.addEventListener("pointerup", () => { scrubbing = false; });

audio.addEventListener("timeupdate", () => {
  if (!scrubbing) seek.value = audio.currentTime;
  now.textContent = clock(audio.currentTime);
  seek.setAttribute("aria-valuetext", `${clock(audio.currentTime)} of ${clock(audio.duration)}`);
});

audio.addEventListener("play", () => { player.dataset.playing = ""; play.setAttribute("aria-label", "Pause"); });
audio.addEventListener("pause", () => { delete player.dataset.playing; play.setAttribute("aria-label", "Play"); });

play.addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()));
seek.addEventListener("input", () => { audio.currentTime = Number(seek.value); });
volume.addEventListener("input", () => { audio.volume = Number(volume.value); });
mute.addEventListener("click", () => {
  audio.muted = !audio.muted;
  mute.setAttribute("aria-pressed", String(audio.muted));
});
```

Twenty-odd lines, and every one of them is about the *media* — not about focus, not about
roles, not about which key does what. That is the whole return on the two elements.

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
seek.setAttribute("aria-valuetext", `${clock(audio.currentTime)} of ${clock(audio.duration)}`);
```

That is the page's job rather than the element's, and deliberately.
[`<slider-elemental>`](../elementals/slider.html) writes no ARIA at all — no `role="slider"`, no
`aria-valuenow` — because the `<input type="range">` inside it already is the APG Slider pattern
and rewriting it would be replacing something correct with something copied. What it cannot know
is that this particular slider is seconds, and that seconds are read as minutes and seconds.

`aria-valuemin` and `aria-valuemax` stay off for the reason that page gives:
[HTML-ARIA](https://www.w3.org/TR/html-aria/) says authors should not put them on a range input.

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

## Without script

The `<audio controls>` you wrote, playing, with the browser's own player and every keyboard
shortcut it comes with. The custom bar is `hidden` in the markup, so it is not there at all —
and the swap happens in script, which means it cannot happen when there is no script to do it.

This is the one arrangement where a custom media player is not a downgrade. The usual one writes
`<audio>` with no `controls` and builds a bar next to it, and a script that fails to load leaves
a silent rectangle.

## What the two elements are already doing

| Part | What it already does |
| --- | --- |
| `<audio>` | Decoding, buffering, `currentTime`, `duration`, `volume`, `muted`, and every event above |
| `<toolbar-elemental>` | `role="toolbar"`, one tab stop for the buttons, the arrows walking them, and staying out of the sliders' way |
| `<slider-elemental>` | The track fill CSS cannot place on its own — `--slider-elemental-start` and `--slider-elemental-end` — with the half-thumb correction that makes the fill line up with the thumb at both ends |
| `<input type="range">` | The whole APG Slider pattern: arrows, <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd>, touch, and `step` |
| Neither element | Anything about media. This page is the only thing here that knows what a scrubber is |

## When you want the whole thing

This is a demonstration of composition, not a media player. What it leaves out is most of one:
captions and `<track>`, playback rate, picture-in-picture, a buffered range behind the scrubber,
keyboard shortcuts on the media itself, a playlist, remembering where you stopped.

**That is [`<media-player>`](https://github.com/stamat/media-player)** — one custom element over
the `<audio>` or `<video>` you already wrote, which keeps this arrangement and finishes it: you
still write the controls, and it wires them by name instead of by the twenty lines above. Its
own control bar is a `<toolbar-elemental>` with a `<slider-elemental>` scrubber inside it, so
what you have just read is that element's skeleton. `npm i media-player-element`.

The buffered range is the one omission with a piece already in the book:
[`<progress-elemental>`](../elementals/progress.html)'s `buffer` exists for exactly the part that
is loaded but not played.

<script src="{{ relativePathPrefix }}dist/elementals/toolbar.js"></script>
<script src="{{ relativePathPrefix }}dist/elementals/slider.js"></script>
<script>
  (() => {
    const player = document.querySelector(".demo-media");
    const audio = player.querySelector(".demo-media-audio");
    const bar = player.querySelector(".demo-media-bar");
    const seek = player.querySelector(".demo-media-scrubber input");
    const volume = player.querySelector(".demo-media-volume input");
    const play = player.querySelector(".demo-media-play");
    const mute = player.querySelector(".demo-media-mute");
    const now = player.querySelector(".demo-media-now");
    const total = player.querySelector(".demo-media-total");

    const clock = (s) =>
      Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

    audio.controls = false;
    bar.hidden = false;

    audio.addEventListener("loadedmetadata", () => {
      seek.max = audio.duration;
      total.textContent = clock(audio.duration);
    });

    let scrubbing = false;
    seek.addEventListener("pointerdown", () => { scrubbing = true; });
    document.addEventListener("pointerup", () => { scrubbing = false; });

    audio.addEventListener("timeupdate", () => {
      if (!scrubbing) seek.value = audio.currentTime;
      now.textContent = clock(audio.currentTime);
      seek.setAttribute("aria-valuetext", `${clock(audio.currentTime)} of ${clock(audio.duration)}`);
    });

    audio.addEventListener("play", () => {
      player.dataset.playing = "";
      play.setAttribute("aria-label", "Pause");
    });
    audio.addEventListener("pause", () => {
      delete player.dataset.playing;
      play.setAttribute("aria-label", "Play");
    });

    play.addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()));
    seek.addEventListener("input", () => { audio.currentTime = Number(seek.value); });
    volume.addEventListener("input", () => { audio.volume = Number(volume.value); });
    mute.addEventListener("click", () => {
      audio.muted = !audio.muted;
      mute.setAttribute("aria-pressed", String(audio.muted));
    });
  })();
</script>
