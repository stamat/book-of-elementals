---
layout: poops-docs-theme/docs
title: Video gallery
description: A poster grid where every link opens the same dialog with the right player in it — YouTube, Vimeo or a file you host — built on open and thrown away on close. modally's video landing, without modally.
order: 6
---

# Video gallery

Press a poster and the film opens over the page. Close it and the player is not paused behind
a `display: none` — it is gone, taken out of the document, because an embed nobody can pause
is an embed you throw away.

One dialog serves all four films below, and they are not the same kind of thing: two are on
YouTube, one is on Vimeo, one is an `.mp4` on somebody's own server with a caption file beside
it. The link says which, the way [modally](https://github.com/stamat/modally)'s video landing
worked — and **nothing reaches a player until the press**: no script, no cookie, no
`<iframe>` sitting in a closed dialog telling anyone who is reading.

<ul class="video-gallery">
  <li><a href="https://www.youtube.com/watch?v=eRsGyueVLvQ"><img src="https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg" alt="" width="480" height="360" loading="lazy"><span>Sintel</span></a><small>YouTube</small></li>
  <li><a href="https://www.youtube.com/watch?v=R6MlUcmOul8"><img src="https://i.ytimg.com/vi/R6MlUcmOul8/hqdefault.jpg" alt="" width="480" height="360" loading="lazy"><span>Tears of Steel</span></a><small>YouTube</small></li>
  <li><a href="https://vimeo.com/1084537"><img src="https://i.vimeocdn.com/video/20963649-f02817456fc48e7c317ef4c07ba259cd4b40a3649bd8eb50a4418b59ec3f5af5-d_640x360?region=us" alt="" width="640" height="360" loading="lazy"><span>Big Buck Bunny</span></a><small>Vimeo</small></li>
  <li><a class="no-poster" href="https://mdn.github.io/shared-assets/videos/friday.mp4" data-captions="https://mdn.github.io/shared-assets/misc/friday.vtt"><span>Friday</span></a><small>an .mp4, captioned</small></li>
</ul>

<modal-elemental closedby="any" close-text="Close the player">
  <dialog id="player-dialog" aria-label="Video player" class="demo-player">
    <div class="player-stage"></div>
  </dialog>
</modal-elemental>

<p class="demo-credit">Open movies by the <a href="https://studio.blender.org/films/">Blender Foundation</a>, CC BY. The clip and its captions are MDN's, from <a href="https://github.com/mdn/shared-assets">mdn/shared-assets</a>. The posters are the players' own — <a href="#what-it-still-costs">what that costs</a> is below.</p>

## The markup

A link per film and an empty dialog. The order matters: the links are what the page is made
of, the dialog is what the script fills.

```html
<ul class="video-gallery">
  <li>
    <a href="https://www.youtube.com/watch?v=eRsGyueVLvQ">
      <img src="sintel.jpg" alt="" width="480" height="360" loading="lazy" />
      <span>Sintel</span>
    </a>
    <small>YouTube</small>
  </li>
  <li>
    <a href="https://vimeo.com/1084537">…</a>
  </li>
  <li>
    <a href="friday.mp4" data-captions="friday.vtt">…</a>
  </li>
</ul>

<modal-elemental closedby="any" close-text="Close the player">
  <dialog id="player-dialog" aria-label="Video player">
    <div class="player-stage"></div>
  </dialog>
</modal-elemental>
```

**The `href` is the fallback and the data at once.** With no script the link goes to the film
and the reader watches it, which is what a link to a film has always done; with script, the id
in it is what the player is built from. There is no `data-video` to keep in step with the
`href`, because the `href` already said it.

**The `alt` is empty on purpose.** The link's own text names it, and a poster described as
"Sintel" inside a link that says *Sintel* is the same name read twice.

**Nothing but the name goes inside the link.** The label saying where the film is hosted sits
after it, in the `<li>` — the link's text is what the script hands to the iframe's `title` and
to the dialog's `aria-label`, so a "YouTube" tucked in beside the name is a dialog announced
as "Friday an .mp4, captioned, dialog". Found by reading the built page back, which is the
only place that kind of mistake shows up.

**The dialog holds a `<div>`, not the player.** `<modal-elemental>` writes its close button as
the dialog's first child, so a script replacing the dialog's own children would throw that
away with the last film. The stage inside it is the part the script owns.

## The glue

```javascript
// The three shapes a video url comes in — the patterns book-of-spells ships as RE_YOUTUBE,
// RE_VIMEO and RE_VIDEO, which is where modally read them from too.
const YOUTUBE = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
const VIMEO = /(?:www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/i;
const FILE = /\.(?:mp4|m4v|ogv|webm|mov)(?:[?#].*)?$/i;

const gallery = document.querySelector(".video-gallery");
const dialog = document.querySelector("#player-dialog");
const stage = dialog.querySelector(".player-stage");

/** The player a link asks for, or null for a link this knows nothing about. */
function playerFor(link) {
  const title = link.textContent.trim();
  const youtube = link.href.match(YOUTUBE);
  const vimeo = link.href.match(VIMEO);

  // Both ids are safe in a url by the shape of the pattern that found them: eleven characters
  // with no quote, ampersand or slash among them, and a run of digits. Nothing else from the
  // page is interpolated here.
  if (youtube) return embed(`https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1`, title);
  if (vimeo) return embed(`https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&dnt=1`, title);
  return FILE.test(link.href) ? file(link) : null;
}

/** A player on somebody else's origin: an iframe, and a name for it. */
function embed(src, title) {
  const player = document.createElement("iframe");
  player.src = src;
  // Without this an iframe is announced as "frame", and a dialog holding one is a dialog
  // holding nothing.
  player.title = title;
  player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  player.allowFullscreen = true;
  return player;
}

/** A file you host: a real element, which is why this one can still be paused. */
function file(link) {
  const player = document.createElement("video");
  player.src = link.href;
  player.controls = true;
  player.playsInline = true;

  if (link.dataset.captions) {
    const track = document.createElement("track");
    track.kind = "captions";
    track.src = link.dataset.captions;
    track.srclang = "en";
    track.label = "English";
    track.default = true;
    // A caption file from another origin is fetched under CORS. Without this the track loads
    // as nothing at all, and says nothing about it.
    player.crossOrigin = "anonymous";
    player.append(track);
  }
  return player;
}

gallery.addEventListener("click", (e) => {
  const link = e.target.closest("a[href]");
  if (!link) return;
  const player = playerFor(link);
  // Not a film this knows how to play: leave the link alone and let the browser follow it.
  if (!player) return;
  e.preventDefault();

  stage.replaceChildren(player);
  // Named after what is in it, so a screen reader says "Sintel, dialog" rather than "video
  // player, dialog" four films running.
  dialog.setAttribute("aria-label", link.textContent.trim());
  dialog.showModal();
  // Autoplay is a url parameter for the embeds, because their frame is built inside this same
  // click; a `<video>` is asked directly, and a rejected promise is the browser's autoplay
  // policy rather than a bug.
  if (player.localName === "video") player.play().catch(() => {});
});

// Gone rather than paused, whichever kind it was. `<modal-elemental>` pauses a `<video>` and
// reloads an `<iframe>` that is still there on close — this is the version with nothing left
// to stop.
document.addEventListener("modal-toggle", (e) => {
  if (!e.detail.open) stage.replaceChildren();
});
```

`dialog.showModal()` is the platform's own call on the platform's own element, and the element
notices: it animates the open, counts the backdrop, locks the page's scroll and returns focus
to the poster afterwards, exactly as though an invoker had opened it. Nothing here talks to
`<modal-elemental>` at all except that last listener, which is the element saying a modal
closed.

## What modally did, and what this does instead

[modally](https://github.com/stamat/modally) had a video landing: one modal, a
`data-video` attribute on the trigger, three url shapes told apart by regex, autoplay on by
default, and the embed unmounted on close. This is the same feature, as page code — which is
why `<modal-elemental>` has no video option and is not getting one.

| modally | here |
| --- | --- |
| `new Modally({ video: true })` and `data-video="…"` on the trigger | a link to the film: the `href` is the data, and the fallback |
| YouTube, Vimeo or a file, matched by `RE_YOUTUBE`, `RE_VIMEO`, `RE_VIDEO` | the same three, the same patterns |
| hidden `<iframe>` templates in the library, cloned and filled | built in the page, in `playerFor` |
| `autoplay: true` by default | `autoplay=1` on the embeds, `play()` on a `<video>` |
| the embed unmounted on close | the stage emptied on close |
| — | `youtube-nocookie.com`, and `dnt=1` on Vimeo |
| — | `data-captions` on the link becomes a `<track>` |
| an image landing as well | that is the [lightbox example](lightbox.html) |
| a focus trap it wrote itself | `showModal()`, so the browser's `inert` does it |

The two rows with nothing on the left are the reason this is worth writing down rather than
porting. A library's template has to be one string for everybody; a builder in your own page
can know that this film has captions and that player has a do-not-track parameter
([`dnt=1`](https://developer.vimeo.com/player/sdk/embed), which stops Vimeo's session cookie
and third-party tracking).

## Why the frame is built and not left there

Measured in Chrome by counting requests — the first two rows against a stand-in frame, the
last one on this page itself:

| How | Before the press | On the press | What it costs |
| --- | --- | --- | --- |
| an `<iframe>` per film in the markup | every player loads with the page — a closed `<dialog>` is `display: none`, and that has never stopped a fetch | already there | every reader is announced to Google and Vimeo, including the ones who watch nothing |
| `<iframe loading="lazy">` per film | nothing: the frame is not being rendered, so the lazy load never resolves | that player loads, then the film | one frame in the markup per film, and one dialog each |
| a poster, and the player built on open | the poster only | the player loads, then the film | one dialog for the whole gallery, and the script above |

The middle row is enough for a single video and is what the
[modal page shows](../elementals/modal.html#youtube-and-vimeo). This page is the last one,
which is the row that survives a gallery: four films are four `<iframe>`s and four dialogs
against one `<div>` here, and at forty the difference is the page.

## What it still costs

**The posters belong to the players.** `i.ytimg.com` and `i.vimeocdn.com` are Google's and
Vimeo's, and asking them for a still is a request with the reader's IP on it — quieter than a
player, but not silence. Counted in Chrome on this page: three requests for the three stills
on load, against eighteen to the player's own host the moment one film is opened — and that
last number moves, because what a player fetches is the player's business. The honest
version self-hosts the stills: download each one once, serve it from your own origin, and the
gallery says nothing to anybody until it is pressed. This page does not, because a docs page
that ships four JPEGs to make a point about privacy has made a different point.

**A `<video>` loses its place; an embed always did.** The element pauses a video on close and
it carries on where the reader left it — but this gallery empties the stage instead, so all
four films restart. That is the price of one dialog serving every kind: keeping the position
means keeping the element, and keeping the element means a dialog per film. Reach for
[the modal page's version](../elementals/modal.html#a-video) when there is one video and the
position matters.

**Captions are yours to provide.** [WCAG 2.2 SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)
asks for them on anything prerecorded with audio, and a film in a modal is still a film.
YouTube and Vimeo carry their own; a file you host has whatever you put beside it, which is
what `data-captions` is for. One language here — a page with several carries the pair of
`srclang` and `label` on the link too.

## What the element is already doing

| Part | What it already does |
| --- | --- |
| `<dialog>` + `showModal()` | The top layer, the page behind going inert, Escape, and focus returning to the poster you opened from |
| `<modal-elemental>` | The animated open and close, the close button, the click on the backdrop that `closedby="any"` asks for, the page's scroll, and `modal-toggle` |
| This page | What a video gallery is: which film, which player it needs, and throwing it away afterwards |

<script src="{{ relativePathPrefix }}dist/elementals/modal.js"></script>
<script>
  (() => {
    const YOUTUBE = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const VIMEO = /(?:www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/i;
    const FILE = /\.(?:mp4|m4v|ogv|webm|mov)(?:[?#].*)?$/i;

    const gallery = document.querySelector(".video-gallery");
    const dialog = document.querySelector("#player-dialog");
    const stage = dialog.querySelector(".player-stage");

    function embed(src, title) {
      const player = document.createElement("iframe");
      player.src = src;
      player.title = title;
      player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      player.allowFullscreen = true;
      return player;
    }

    function file(link) {
      const player = document.createElement("video");
      player.src = link.href;
      player.controls = true;
      player.playsInline = true;

      if (link.dataset.captions) {
        const track = document.createElement("track");
        track.kind = "captions";
        track.src = link.dataset.captions;
        track.srclang = "en";
        track.label = "English";
        track.default = true;
        player.crossOrigin = "anonymous";
        player.append(track);
      }
      return player;
    }

    function playerFor(link) {
      const title = link.textContent.trim();
      const youtube = link.href.match(YOUTUBE);
      const vimeo = link.href.match(VIMEO);

      if (youtube) return embed(`https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1`, title);
      if (vimeo) return embed(`https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&dnt=1`, title);
      return FILE.test(link.href) ? file(link) : null;
    }

    gallery.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;
      const player = playerFor(link);
      if (!player) return;
      e.preventDefault();

      stage.replaceChildren(player);
      dialog.setAttribute("aria-label", link.textContent.trim());
      dialog.showModal();
      if (player.localName === "video") player.play().catch(() => {});
    });

    document.addEventListener("modal-toggle", (e) => {
      if (!e.detail.open) stage.replaceChildren();
    });
  })();
</script>
