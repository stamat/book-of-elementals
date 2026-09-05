import { ElementBase, define } from '../../core.js';

/** Pixels a second, when `speed` says nothing usable. The figure the ecosystem settled on. */
export const DEFAULT_SPEED = 50;

/**
 * The most copies of the track this will ever make.
 *
 * Every copy is a full subtree in the document - `inert` and out of the accessibility tree,
 * but still nodes to lay out and paint. A track one narrow item wide against a wide screen
 * asks for hundreds, and the honest answer there is a visible gap the author can see and fix
 * with more content, rather than a page that quietly grew a thousand elements.
 */
export const MAX_CLONES = 20;

/**
 * How many copies of the track it takes to cover the container without a gap.
 *
 * The strip repeats every `track + gap`, which is also how far one lap travels. A lap ends
 * with the original translated that far out of frame, and what the reader sees at that moment
 * is whatever is behind it - so the strip minus one repeat has to still cover the container.
 *
 * **The gap on the end is the one the strip does not have**, and it is the whole reason this
 * is not simply `container / repeat`. A strip of `n + 1` copies carries `n` gaps and none
 * after the last, so it is `(n + 1) x repeat - gap` long, not `(n + 1) x repeat`. Solve
 * `(n + 1) x repeat - gap - repeat >= container` and the gap moves to the other side:
 * `n >= (container + gap) / repeat`. Count it the shorter way and the strip is up to one gap
 * short of the frame, which is a sliver of empty container in the last moments before the
 * lap wraps - visible as a blink, and blamed on the wrap rather than on the arithmetic.
 *
 * **One is the floor, and zero is not an option while it moves.** A track already wider than
 * the container still needs a copy behind it: without one, the lap ends on empty container
 * and the loop reads as a jump. The formula gives that on its own - any positive container
 * rounds up to at least one - so there is nothing here enforcing it. Zero is what a track
 * with no width gets, because there is nothing to loop, and what a container with no width
 * gets, because a `display: none` panel and a closed `<details>` both measure zero and
 * cloning against that number fills the page the moment it opens.
 */
export function cloneCount(trackWidth, gapWidth, containerWidth, max = MAX_CLONES) {
  if (!(trackWidth > 0) || !(containerWidth > 0)) return 0;
  const gap = gapWidth > 0 ? gapWidth : 0;
  return Math.min(max, Math.ceil((containerWidth + gap) / (trackWidth + gap)));
}

/** One lap, in seconds: the distance between two copies at the speed asked for. A speed that
 * is not a positive number falls back rather than resolving to a `NaN` duration, which is an
 * animation that never runs with the strip parked wherever the clones left it. */
export function cycleDuration(distance, speed) {
  if (!(distance > 0)) return 0;
  return distance / (speed > 0 ? speed : DEFAULT_SPEED);
}

/** Whether the reader has asked the system for less movement. */
function reducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The icons on the control: `play-24` and `square-fill-24` from
 * [Octicons](https://primer.style/foundations/icons/), MIT, © GitHub Inc. The same two
 * `<carousel-elemental>` draws, copied rather than imported - importing one elemental has to
 * pull in one elemental, and two path strings are a cheaper price for that than a shared
 * module every subpath drags along.
 *
 * Drawn rather than typed: `▶` and `⏸` are missing from enough system fonts to come out as a
 * box, and where the pause glyph is present it is often the emoji face rather than the shape.
 */
const ICON = {
  play: {
    d: 'M9.5 15.584V8.416a.5.5 0 0 1 .77-.42l5.576 3.583a.5.5 0 0 1 0 .842l-5.576 3.584a.5.5 0 0 1-.77-.42Z',
    box: '5.47 5.25 13.5 13.5'
  },
  stop: {
    d: 'M7.75 6h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 16.25 18h-8.5A1.75 1.75 0 0 1 6 16.25v-8.5C6 6.784 6.784 6 7.75 6Z',
    box: '0 0 24 24'
  }
};

/** One icon, as an element. `aria-hidden`, because the button is already named. */
function icon({ d, box }) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', box);
  // Sized in the markup as well as the viewBox: an `<svg>` with neither is laid out at the
  // replaced-element default, 300 by 150, so a page that took the script without the
  // stylesheet would get an icon the size of a paragraph.
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

/**
 * `<marquee-elemental>` custom element.
 *
 * A row of content that scrolls forever - a logo strip, a ticker - built out of the list you
 * already wrote.
 *
 * There is no APG pattern for this, because there is no widget: nothing here is operated, and
 * the content is the same content it was standing still. What there is instead is an
 * obligation, and it is a Level A one.
 * [WCAG 2.2 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
 * says movement that starts on its own, runs longer than five seconds and sits beside other
 * content has to have a mechanism to stop it - and an infinite loop is longer than five
 * seconds. Every marquee in the ecosystem leaves that mechanism to you: the CSS-only recipes
 * pause on `:hover`, which no keyboard has, and the component libraries hand you a `play`
 * prop and a hook to build the button out of. **This writes the button.**
 *
 * The second half is the one nobody has at all. A seamless loop is copies of the track, and a
 * copy of a logo strip is a copy of its links: `aria-hidden` keeps them out of the screen
 * reader, and does nothing whatever about <kbd>Tab</kbd>, so the keyboard walks into copies of
 * the same links scrolling past under the focus ring. The copies here are `inert` as well as
 * `aria-hidden`, and their `id`s are stripped on the way out, because a duplicated `id` is
 * the same bug one layer down.
 *
 * **The copies are counted, not guessed.** Two of everything is the usual recipe and it is
 * right for one screen width: cover a wide monitor with a short track and the loop shows a
 * hole. This measures the track against the container and clones until the strip covers it,
 * again whenever a resize changes the answer - one clone when the track already fills the
 * container, more when it does not, and none at all while nothing is moving, so a reader on
 * reduced motion is not handed copies of the page they never asked to see move.
 *
 * Light DOM, no shadow root. Nothing you wrote is moved or wrapped - the copies are appended
 * after it and the control after those. With no script it is a list, wrapped or scrolling the
 * way any list of things does, every item in the page and in reading order.
 *
 * ponytail: no vertical axis, no `pauseOnClick`, no gradient-mask props. The fade at the
 * edges is the theme's, the gap is a custom property, and the axis is one someone can ask
 * for when they have a ticker that needs it.
 *
 * @tag marquee-elemental
 * @attr {number} [speed=50] - Pixels a second. Anything that is not a positive number is the default.
 * @attr {boolean} [reverse=false] - Travel the other way. Flipped again under `dir="rtl"`, where the other way is the default one.
 * @attr {boolean} [no-controls=false] - Do not write the pause button. For a page that provides the mechanism itself - one control over several strips, a site-wide motion switch - through `.play()` and `.pause()`. With nothing else on the page it is 2.2.2 unmet, and yours to meet.
 * @attr {string} [play-text=Start the moving content] - The control's accessible name while stopped.
 * @attr {string} [pause-text=Stop the moving content] - Its name while moving.
 *
 * `--marquee-elemental-distance` and `--marquee-elemental-duration` are deliberately not
 * tagged below. The element writes them into its own `style` attribute, and an inline
 * declaration beats any stylesheet - so a knob for either would be a control that cannot move
 * anything, and the docs panel is built out of these tags. They are outputs, and the page
 * describes them as such.
 *
 * @cssprop {<length>} [--marquee-elemental-gap=2rem] - Between one copy of the track and the next, and between the items inside a `<ul>` or `<ol>` track.
 * @cssprop {<length>} [--marquee-elemental-fade=2rem] - Theme. How far the two edges fade out. `0` is a hard edge.
 * @cssprop {<color>} [--marquee-elemental-surface=Canvas] - Theme. What the edges fade into and the button is painted on: the page's own background, so re-point it on a card.
 * @cssprop {<color>} [--marquee-elemental-border-color=currentcolor at 30%] - Theme. The rim around the button.
 * @cssprop {<color>} [--marquee-elemental-hover=currentcolor at 10% over the surface] - Theme. Its fill under the pointer.
 * @cssprop {<color>} [--marquee-elemental-hover-color=inherit] - Theme. Its icon under the pointer. Setting it tints the fill above with it, which is 10% of whatever the icon is.
 * @cssprop {<length>} [--marquee-elemental-control-size=2rem] - Theme. The button's box.
 * @cssprop {<length>} [--marquee-elemental-control-radius=50%] - Theme. Its corners.
 *
 * @fires marquee-toggle - `detail.playing` is whether it is moving now.
 *
 * @slot - The content to loop, usually one `<ul>`. Whatever you write is the track, and the track is what gets copied.
 */
export class MarqueeElemental extends ElementBase {
  /** What the author wrote, captured at upgrade. Held rather than re-read, because after the
   * first lap the element's own children are mostly copies of it. */
  track = [];

  /** The copies. */
  get clones() {
    return Array.from(this.querySelectorAll(':scope > [data-marquee-clone]'));
  }

  /** The pause button, when this wrote one. */
  get control() {
    return this.querySelector(':scope > .marquee-elemental-control');
  }

  /** Pixels a second. */
  get speed() {
    return Number(this.getAttribute('speed'));
  }

  set speed(value) {
    this.setAttribute('speed', value);
  }

  /** Whether it is moving. Setting it is the same as pressing the button. */
  get playing() {
    return !this.hasAttribute('data-marquee-paused');
  }

  set playing(value) {
    if (value) this.play();
    else this.pause();
  }

  connectedCallback() {
    if (this.initialized) return;
    // Everything the author wrote, elements only: a newline between two tags is a text node
    // and not something to clone twenty times.
    this.track = Array.from(this.children);
    // Nothing to move. No control either - a button that stops nothing is worse than none,
    // and this is markup that has not been written yet rather than markup that failed.
    if (!this.track.length) return;
    this.initialized = true;

    // The stylesheet takes the markers off a `<ul>`, because a row of logos with bullets
    // between them is not a row of logos - and `list-style: none` is what stops VoiceOver in
    // Safari calling it a list at all. The role it already had, written back where the CSS
    // took it from. Nothing else about the author's markup is touched.
    this.track.forEach((node) => {
      if ((node.tagName === 'UL' || node.tagName === 'OL') && !node.hasAttribute('role')) {
        node.setAttribute('role', 'list');
      }
    });

    if (!this.hasAttribute('no-controls')) this.addControl();

    // Reduced motion is read once, at upgrade, and it is the one case where it wins over the
    // markup: no lap, and no copies made to run one. The control still says Start, because
    // the reader asking their system for less movement is not the same as never wanting this
    // strip to move - the APG's rule for the carousel's rotation button, and the same one.
    if (reducedMotion()) this.pause();
    else this.play();

    // A resize changes how many copies it takes to cover the container - and so does anything
    // else that changes either box: a container query, a webfont landing, an image arriving,
    // a page turning `--marquee-elemental-gap` up. The observer is what makes all of those one
    // case instead of a listener each.
    //
    // The track is watched as well as the element, and that is the half a container-only
    // observer misses: everything that changes how wide the content is leaves the element
    // exactly the size it was, so nothing would fire and the strip would keep looping on the
    // arithmetic of a layout it no longer has.
    if (typeof ResizeObserver === 'function') {
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(this);
      this.track.forEach((node) => this.observer.observe(node));
    }

    // A lap off the screen is the compositor moving pixels nobody is looking at, for as long
    // as the page stays open - the one animation here that never ends on its own, and so the
    // one worth holding. It holds by a second attribute rather than by `pause()`, and that
    // separation is the point: this is not the reader's answer, so the button's name must not
    // change with it and the reader's own pause must survive a scroll past. The stylesheet
    // stops the strip on either.
    //
    // The margin is what keeps the strip from arriving already still: it is moving a couple of
    // hundred pixels of scrolling before it is in frame. Where there is no
    // `IntersectionObserver` there is no hold, which is what every strip did before this.
    if (typeof IntersectionObserver === 'function') {
      this.visibility = new IntersectionObserver((entries) => {
        // The last entry, not the first: a burst coalesced into one callback ends on the
        // state the element is actually in now.
        const entry = entries[entries.length - 1];
        if (entry) this.toggleAttribute('data-marquee-offscreen', !entry.isIntersecting);
      }, { rootMargin: '200px' });
      this.visibility.observe(this);
    }
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    if (this.observer) this.observer.disconnect();
    this.observer = null;
    if (this.visibility) this.visibility.disconnect();
    this.visibility = null;
    // Out of the document is not off the screen, and a strip put back in has to start from
    // what the next observer says rather than from what the last one saw.
    this.removeAttribute('data-marquee-offscreen');
    this.initialized = false;
  }

  static get observedAttributes() {
    return ['speed'];
  }

  attributeChangedCallback(name, previous, value) {
    if (!this.initialized || previous === value) return;
    if (name === 'speed') this.applyTiming();
  }

  /**
   * Write the pause button.
   *
   * Appended rather than expected in the markup, for the reason the carousel's controls are:
   * a button authored by hand is a button that does nothing until the script lands, and a
   * dead control is a worse promise than no control.
   *
   * Its name says what pressing it will do and it carries no `aria-pressed` - the APG's own
   * answer for this button, rather than both, which would have a screen reader read the two
   * against each other.
   */
  addControl() {
    if (this.control) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'marquee-elemental-control';
    button.addEventListener('click', () => { this.playing = !this.playing; });
    this.append(button);
    this.labelControl();
  }

  labelControl() {
    const button = this.control;
    if (!button) return;
    const stop = this.getAttribute('pause-text') || 'Stop the moving content';
    const start = this.getAttribute('play-text') || 'Start the moving content';
    button.setAttribute('aria-label', this.playing ? stop : start);
    button.replaceChildren(icon(this.playing ? ICON.stop : ICON.play));
  }

  /**
   * Measure the track against the container, and make the strip cover it.
   *
   * **Guarded on the width it last saw**, and that guard is load-bearing twice over. Rebuilding
   * the copies restarts the animation from its first frame, so doing it on a resume would put
   * a jump behind the one gesture that means hold still - and an observer that rebuilt on
   * every callback would be one whose own writes are what it hears next, which is a loop with
   * no bottom to it.
   *
   * The clones come off before the read, because the number wanted is the width of what the
   * author wrote and a strip with copies in it is the width of the last answer. It is
   * measured across the track's own boxes and **not** off the element's `scrollWidth`, which
   * is the trap here: `scrollWidth` never reports less than the box it is on, so a short
   * track in a wide container measures as the container - one copy, and a hole in the loop
   * exactly where more copies were needed. Both ends are taken by extent rather than in
   * order, because `dir="rtl"` lays the same children out the other way round.
   *
   * The gap goes into the distance rather than beside it: a lap has to land the second copy
   * exactly where the first one started, which with a gap between them is one track plus one
   * gap. It is read off the computed style, so an author's own `--marquee-elemental-gap` is
   * in the sum without this having to parse it.
   */
  measure() {
    if (!this.initialized || !this.playing) return;
    const width = this.clientWidth;
    const gap = parseFloat(getComputedStyle(this).columnGap) || 0;
    // Read off the author's own nodes, with the copies left where they are. A `translate` does
    // not change a box's width, so the extent of the track is the same number mid-lap as it is
    // at rest - which is what makes this safe to ask at any moment, and what lets the answer
    // be compared before anything is torn down.
    const edges = this.track.map((node) => node.getBoundingClientRect());
    const track = Math.max(...edges.map((box) => box.right)) - Math.min(...edges.map((box) => box.left));
    const distance = track + gap;
    const copies = cloneCount(track, gap, width);
    // Nothing about the strip changed, so nothing is rebuilt. Rebuilding restarts the lap,
    // and an observer that rebuilt on every callback would be one whose own writes are what
    // it hears next, which is a loop with no bottom to it.
    if (copies === this.copies && distance === this.distance) return;
    this.copies = copies;
    this.distance = distance;
    // **The animation comes off before the copies change and goes back on after the numbers
    // are written.** A keyframe here is `translateX(calc(var(--marquee-elemental-distance) *
    // -1))`, and WebKit resolves the custom properties in a keyframe once, when the animation
    // is created - a later change to the property does not reach it, where Chromium
    // re-resolves and hides the whole problem. Leave the animation in place across this and
    // Safari runs the author's track against a distance of zero while every copy appended
    // afterwards moves properly: the original stands still, and the strip pulls apart at the
    // seam.
    this.removeAttribute('data-marquee-running');
    this.removeClones();
    // A forced layout, on purpose, and the one line here that looks like it does nothing.
    // Taking the attribute off and putting it back inside one task is no change at all to a
    // browser that has not recalculated in between: the author's track keeps the animation it
    // already had, running from whenever it started, while every copy appended below gets a
    // fresh one starting now. The strip is then permanently a fraction of a lap out of step
    // with itself, which shows up as a seam wider than the gap everywhere else. Reading a
    // layout property is what makes the cancellation real before the copies arrive.
    void this.offsetWidth;
    if (!copies) {
      // Measured zero: no width to cover, or nothing with width to cover it. Not a failure
      // and not a state to remember - a `display: none` panel and a closed `<details>` both
      // land here, and the observer fires again when the box is real.
      this.style.removeProperty('--marquee-elemental-distance');
      this.style.removeProperty('--marquee-elemental-duration');
      return;
    }
    for (let i = 0; i < copies; i++) this.append(...this.copyTrack());
    this.applyTiming();
    this.setAttribute('data-marquee-running', '');
  }

  /** How far a lap goes and how long it takes, onto the element for the keyframes to read.
   * Split out of the measuring because `speed` changes the second number and not the first,
   * and remeasuring to answer it would rebuild the strip to say the same thing. */
  applyTiming() {
    if (!(this.distance > 0)) return;
    this.style.setProperty('--marquee-elemental-distance', this.distance + 'px');
    this.style.setProperty('--marquee-elemental-duration', cycleDuration(this.distance, this.speed) + 's');
  }

  /**
   * One copy of the track.
   *
   * `inert` and `aria-hidden` are two different readers and both are owed an answer: the
   * second keeps the copies out of the accessibility tree, and the first is the one every
   * other marquee is missing - without it <kbd>Tab</kbd> walks into copies of the same links,
   * scrolling past under the focus ring. `id`s come off on the way out, because a document
   * with twenty of the same `id` is one where every `aria-labelledby` and every `#anchor`
   * resolves to whichever came first.
   */
  copyTrack() {
    return this.track.map((node) => {
      const clone = node.cloneNode(true);
      clone.setAttribute('data-marquee-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      if (clone.id) clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach((child) => child.removeAttribute('id'));
      return clone;
    });
  }

  removeClones() {
    this.clones.forEach((clone) => clone.remove());
  }

  /** Start moving, making the copies it takes to do it seamlessly if they are not there yet. */
  play() {
    this.removeAttribute('data-marquee-paused');
    this.measure();
    this.labelControl();
    this.dispatchEvent(new CustomEvent('marquee-toggle', { bubbles: true, detail: { playing: true } }));
  }

  /**
   * Stop.
   *
   * The copies stay where they are. Taking them out would reflow the strip back to the
   * author's one track under a reader who has just asked for the movement to stop, which is
   * a jump asked for by the one gesture that means "hold still".
   */
  pause() {
    this.setAttribute('data-marquee-paused', '');
    this.labelControl();
    this.dispatchEvent(new CustomEvent('marquee-toggle', { bubbles: true, detail: { playing: false } }));
  }
}

define('marquee-elemental', MarqueeElemental);
