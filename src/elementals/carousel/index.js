import { ElementBase, define } from '../../core.js';

/**
 * How long between slides, out of the `interval` attribute.
 *
 * Anything that is not a positive number of milliseconds is the default rather than an
 * error: a typo in one attribute is not a reason for a carousel to stand still. The floor
 * is the part worth writing down - under a second is a strobe, and it is also shorter than
 * the smooth scroll it would be interrupting, so the carousel would never finish arriving
 * anywhere.
 *
 * @param {string|null} value - The attribute, as authored.
 * @param {number} [fallback=5000] - Milliseconds to use when it says nothing usable.
 * @returns {number}
 */
export function rotationInterval(value, fallback = 5000) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return fallback;
  return Math.max(ms, 1000);
}

/**
 * Which slide a press of previous or next asks for.
 *
 * It stops at the ends rather than wrapping, because the buttons say so: at the end of the
 * row the next button is `aria-disabled` and dimmed, and a control that looks spent and then
 * jumps you back to the first slide is a control that lied. The rotation is the other
 * behaviour and keeps it - see `advance()`, which is the only thing here that wraps.
 *
 * @param {number} current - Index the carousel is on.
 * @param {number} delta - `1` for next, `-1` for previous.
 * @param {number} count - How many slides there are.
 * @returns {number}
 */
export function stepSlide(current, delta, count) {
  if (count <= 0) return 0;
  return Math.min(Math.max(current + delta, 0), count - 1);
}

/**
 * Whether a scroller is as far back, or as far on, as it goes.
 *
 * The scroller's own answer and not arithmetic on the index, which is the only one that
 * holds when more than one slide is on screen: with three of five showing, the row is at its
 * end while the current slide is the third, and an index that counted to the last slide
 * would leave two presses doing nothing. A row short enough to fit is at both ends at once,
 * and that is the honest reading - there is nowhere to go either way.
 *
 * `abs` on the offset because a right-to-left scroller counts down from zero, and a pixel of
 * slack at each end because a fractional layout - a percentage width, a zoomed page - lands
 * a hair short of the number the arithmetic wants.
 *
 * @param {number} offset - `scrollLeft`.
 * @param {number} visible - `clientWidth`.
 * @param {number} total - `scrollWidth`.
 * @returns {{start: boolean, end: boolean}}
 */
export function scrollEdges(offset, visible, total) {
  const at = Math.abs(offset);
  return { start: at <= 1, end: at + visible >= total - 1 };
}

/** The name a slide gets when the markup gave it none: its place in the set. */
export function slideName(index, count) {
  return (index + 1) + ' of ' + count;
}

/**
 * Which of the slides on screen the carousel is on: the earliest of them.
 *
 * A row of slides is read from its start, so with three on screen the carousel is on the
 * first of the three. Nothing on screen is not slide zero - a scroller inside a closed
 * `<details>` reports every slide gone, and moving the carousel because something folded
 * over it is a change nobody asked for - so that case keeps the index it had.
 *
 * @param {Iterable<number>} visible - Indices of the slides currently in the scroller.
 * @param {number} fallback - The index to keep when none are.
 * @returns {number}
 */
export function currentSlide(visible, fallback) {
  let at = -1;
  for (const index of visible) {
    if (at < 0 || index < at) at = index;
  }
  return at < 0 ? fallback : at;
}

/**
 * What counts as something the keyboard can already reach inside the scroller.
 *
 * ponytail: the same heuristic `<tabs-elemental>` uses, and deliberately not a focusability
 * engine. Being wrong costs one tab stop too many on a row of slides whose only control is
 * disabled - and a scroll container the keyboard cannot reach is content the keyboard
 * cannot read, which is the more expensive way to be wrong.
 */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';

/** Monotonic counter for generating `id`s for markup authored without them. */
let carouselCount = 0;

/**
 * The chevrons on the previous and next buttons: `chevron-left-16` and `chevron-right-16`
 * from [Octicons](https://primer.style/foundations/icons/), MIT, © GitHub Inc.
 *
 * Two path strings rather than a dependency - this is the whole of what the package would
 * have been imported for, and a build step to tree-shake an icon set down to two shapes is a
 * build step this project promises its users they will not need.
 *
 * Drawn rather than typed, which is the point: a glyph is centred wherever the font's
 * designer put it inside the em box, and in a round button an off-centre chevron is visible
 * at a glance. A path is centred on its own viewBox, in every font and on every platform.
 */
const CHEVRON = {
  prev: 'M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z',
  next: 'M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z'
};

/** One chevron, as an element. `aria-hidden`, because the button is already named. */
function chevron(d) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  // Sized in the markup as well as the viewBox, because an `<svg>` with neither is laid out
  // at the replaced-element default - 300 by 150 - and a page that took the script without
  // the stylesheet would get a chevron the size of a paragraph. The theme sizes it in `em`
  // over the top of this.
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

/** Whether the reader has asked the system for less movement. */
function reducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * `<carousel-elemental>` custom element.
 *
 * A row of slides you scroll through, per the
 * [APG Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) - previous and
 * next, a picker with one button per slide, and, when it is asked for, automatic rotation
 * with the control that stops it.
 *
 * **The scroll container is the state.** There is no transform engine, no clones and no
 * index attribute to keep in step with where the row actually is: the slides sit in a
 * scroll-snapping scroller, moving means setting `scrollLeft`, and which slide is current is
 * whatever an `IntersectionObserver` says is on screen. That is what buys the
 * responsiveness for nothing - resize the window, change how many slides fit in CSS, or put
 * the whole thing in a container query, and there is no listener to fire and no measurement
 * to redo, because nothing was measured in the first place.
 *
 * Light DOM, no shadow root. Nothing you wrote is moved or wrapped; the element adds the
 * roles to your list and its items, and appends the controls - which is also why the
 * controls are its to write rather than yours. A previous button authored in the markup is
 * a button that does nothing until the script lands, and this element's promise is the
 * other way round: with no script the slides are a scroll-snapping row you swipe, drag the
 * scrollbar of, or reach with the keyboard, every slide in the page and in reading order.
 *
 * **No live region while it scrolls, and that is deliberate.** The APG's example flips
 * `aria-live` between `off` and `polite` because there one slide exists at a time and a
 * reader who cannot see the swap would otherwise never hear about it. Scrolling, every slide
 * is in the DOM, in the accessibility tree and in reading order the whole time, so there is
 * nothing to announce and nothing hidden to miss - and no `aria-hidden` on the slides off
 * screen either, which is the bug that puts a focusable link inside a hidden subtree.
 * `fade` is the mode where one slide really is all there is, and there the live region comes
 * back, off while rotating and polite when it is not, exactly as the pattern asks.
 *
 * ponytail: one axis, horizontal. A vertical carousel is the same code with the block
 * properties, and nothing has asked for one; the refusal is on the page rather than an
 * `orientation` attribute nobody sets.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 *
 * @tag carousel-elemental
 * @attr {boolean} [fade=false] - Cross-fade one slide at a time in place, instead of scrolling a row. The slides stack, so the row is as tall as the tallest.
 * @attr {boolean} [autoplay=false] - Rotate on a timer, and write the control that stops it. Ignored at upgrade when the reader asked for reduced motion - the control is still there to start it.
 * @attr {number} [interval=5000] - Milliseconds between slides while rotating. Under 1000 is treated as 1000.
 * @attr {string} [prev-text=Previous slide] - The previous button's accessible name.
 * @attr {string} [next-text=Next slide] - The next button's accessible name.
 * @attr {string} [play-text=Start slide rotation] - The rotation control's accessible name while stopped.
 * @attr {string} [pause-text=Stop slide rotation] - The rotation control's accessible name while rotating.
 * @attr {string} [slide-text=Slide] - The word in front of the number on a picker button. `Slide 3`.
 * @attr {string} [picker-text=Choose slide to display] - The picker group's accessible name.
 *
 * @cssprop {<length-percentage>} [--carousel-elemental-slide-size=100%] - How wide one slide is. This is how many slides fit: `50%` for two, `33.333%` for three, or any expression - it is the flex basis.
 * @cssprop {<length>} [--carousel-elemental-gap=0px] - Between the slides. Nothing in `fade`, where they are stacked.
 * @cssprop {<time>} [--carousel-elemental-fade=400ms] - How long the cross-fade takes in `fade`. Zero under reduced motion, whatever this says.
 * @cssprop {<length>} [--carousel-elemental-controls-gap=0.5rem] - Between the controls under the row.
 * @cssprop {<length>} [--carousel-elemental-marker-size=1.75rem] - Diameter of a picker button.
 * @cssprop {<color>} [--carousel-elemental-control=currentcolor] - Text and border of the controls.
 * @cssprop {<color>} [--carousel-elemental-border=color-mix(in srgb, currentcolor 20%, transparent)] - Border of a control that is not the current slide's.
 * @cssprop {<color>} [--carousel-elemental-hover=color-mix(in srgb, currentcolor 10%, transparent)] - Control background under the pointer.
 * @cssprop {<color>} [--carousel-elemental-current=currentcolor] - Fill of the picker button for the slide on screen.
 * @cssprop {<length-percentage>} [--carousel-elemental-radius=999px] - Corner radius of the controls.
 *
 * @fires carousel-change - `detail.index` is the slide now on screen, `detail.slide` the element itself.
 *
 * @slot - One `<ul>`, `<ol>` or `<menu>` of `<li>` slides.
 */
export class CarouselElemental extends ElementBase {
  static get observedAttributes() {
    return ['autoplay', 'interval', 'fade'];
  }

  /** The scroller: the first list in the element. A carousel inside a slide keeps its own. */
  get scroller() {
    const list = this.querySelector('ul, ol, menu');
    return list && list.closest('carousel-elemental') === this ? list : null;
  }

  /** The slides, in order. What the list holds, so a list inside a slide is not one. */
  get slides() {
    const list = this.scroller;
    return list ? Array.from(list.querySelectorAll(':scope > li')) : [];
  }

  /** The picker buttons, in slide order. */
  get markers() {
    return this.picker ? Array.from(this.picker.children) : [];
  }

  /**
   * Cross-fade in place rather than scroll a row.
   *
   * The one mode where the scroller is not the state: stacked slides have nothing to scroll,
   * so the index is what this element holds and the stylesheet reads through
   * `data-carousel-current`. Everything above it - the controls, the picker, the rotation,
   * the events - is the same code either way.
   */
  get fade() {
    return this.hasAttribute('fade');
  }

  set fade(value) {
    this.toggleAttribute('fade', !!value);
  }

  /** Rotate on a timer. Reflected, so `[autoplay]` is a styling hook too. */
  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(value) {
    this.toggleAttribute('autoplay', !!value);
  }

  /** Milliseconds between slides while rotating. */
  get interval() {
    return rotationInterval(this.getAttribute('interval'));
  }

  set interval(value) {
    this.setAttribute('interval', value);
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded deferred or
    // at the end of the body, so by upgrade time they are there.
    if (this.initialized) return;
    // One slide is a figure, not a carousel, and a carousel that writes a picker with one
    // button in it is worse than the markup it upgraded.
    if (!this.scroller || this.slides.length < 2) return;

    this.onClick = this.onClick.bind(this);
    this.onIntersect = this.onIntersect.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.suspend = this.suspend.bind(this);
    this.resume = this.resume.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);

    this.index = 0;
    this.visible = new Set();
    // Null rather than absent: `applyEdges` runs before the first move.
    this.settling = null;
    this.settleTimer = null;
    // The name this element gave each slide, so a later `wire()` renumbers its own labels
    // and keeps its hands off the ones the markup wrote. The name and not just the slide,
    // because a page is free to name a slide *after* the upgrade - and a label that no
    // longer reads as the one written here is somebody else's.
    this.named = new WeakMap();

    this.addEventListener('click', this.onClick);
    // Hovering or tabbing into a carousel stops it rotating, which the APG asks for and a
    // reader halfway through a caption asks for louder. `mouseenter` and `mouseleave` do not
    // bubble, and do not need to: they fire here for the whole subtree.
    this.addEventListener('mouseenter', this.suspend);
    this.addEventListener('mouseleave', this.resume);
    this.addEventListener('focusin', this.suspend);
    this.addEventListener('focusout', this.onFocusOut);

    this.initialized = true;
    this.wire();

    // Reduced motion is the one case where `autoplay` is read and not obeyed. The control
    // is still written, so a reader who wants the rotation can still have it - which is the
    // difference between honouring a preference and overruling a person.
    if (this.autoplay && !reducedMotion()) this.play();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.clearTimer();
    this.rotating = false;
    this.pinned = false;

    this.removeEventListener('click', this.onClick);
    this.removeEventListener('mouseenter', this.suspend);
    this.removeEventListener('mouseleave', this.resume);
    this.removeEventListener('focusin', this.suspend);
    this.removeEventListener('focusout', this.onFocusOut);

    if (this.observer) this.observer.disconnect();
    this.observer = null;
    this.visible.clear();
    if (this.scrolls) this.scrolls.removeEventListener('scroll', this.onScroll);
    this.scrolls = null;
    this.arrived();

    this.removeControls();
    this.removeAttribute('data-carousel-at-start');
    this.removeAttribute('data-carousel-at-end');

    // Everything written comes back off. A `role="group"` with `aria-roledescription="slide"`
    // on a row nothing is driving is a carousel announced to a screen reader that no longer
    // has controls, and a scroller left with a tab stop is a stop onto nothing.
    this.removeAttribute('aria-roledescription');
    const scroller = this.scroller;
    if (scroller) {
      scroller.removeAttribute('data-carousel-slides');
      scroller.removeAttribute('role');
      scroller.removeAttribute('tabindex');
    }
    if (scroller) scroller.removeAttribute('aria-live');
    for (const slide of this.slides) {
      slide.removeAttribute('role');
      slide.removeAttribute('aria-roledescription');
      slide.removeAttribute('data-carousel-slide');
      slide.removeAttribute('data-carousel-current');
      if (slide.getAttribute('aria-label') === this.named.get(slide)) slide.removeAttribute('aria-label');
    }

    this.initialized = false;
  }

  /**
   * Read the markup and put the pattern on it - the roles, the controls, the observer that
   * watches the row - then push the current state onto the controls.
   *
   * Public and idempotent, because the slides are the page's to change: add one, remove one,
   * reorder them, and this is the one call that says so. Nothing observes the markup on the
   * element's behalf, which would be a `MutationObserver` running on every page that never
   * touches its slides to save this one line on the pages that do.
   */
  wire() {
    const scroller = this.scroller;
    if (!scroller) return;
    const slides = this.slides;

    this.setAttribute('aria-roledescription', 'carousel');
    // `region` when the author named it, `group` when they did not. A region is a landmark,
    // and a landmark with no name is one more unnamed stop in the landmark list - while
    // `aria-roledescription` on an element with no role at all is silently nothing, which is
    // the failure this project does not ship.
    if (!this.hasAttribute('role')) {
      const named = this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby');
      this.setAttribute('role', named ? 'region' : 'group');
    }

    if (!scroller.id) scroller.id = 'carousel-elemental-slides-' + (++carouselCount);
    scroller.setAttribute('data-carousel-slides', '');
    // The list stops being a list. Its children are slides - `role="group"`, which is what
    // the pattern asks of them - and a list whose children are not list items is a broken
    // list to a screen reader, not a carousel. `role="none"` would not do it either: the
    // scroller can end up focusable two lines below, and a presentational role on a
    // focusable element is thrown away and the list role comes back. A screen reader
    // counting list items here would be counting the wrong thing anyway - each slide is
    // already named `3 of 10`.
    scroller.setAttribute('role', 'group');
    // A scrollable region with nothing focusable in it is content no keyboard can scroll to
    // (WCAG 2.1.1). A row of slides full of links already has stops enough - and stacked
    // slides do not scroll at all, so there is nothing there to reach.
    if (this.fade || scroller.querySelector(FOCUSABLE)) scroller.removeAttribute('tabindex');
    else scroller.tabIndex = 0;

    slides.forEach((slide, at) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('data-carousel-slide', '');
      const label = slide.getAttribute('aria-label');
      const authored = slide.hasAttribute('aria-labelledby')
        || (label !== null && label !== this.named.get(slide));
      if (authored) return;
      const name = slideName(at, slides.length);
      slide.setAttribute('aria-label', name);
      this.named.set(slide, name);
    });

    this.writeControls();
    this.applyLive();

    if (this.observer) this.observer.disconnect();
    this.observer = null;
    this.visible.clear();
    if (this.scrolls) this.scrolls.removeEventListener('scroll', this.onScroll);
    this.scrolls = null;
    // A move that was in flight was aimed at a row that has since changed.
    this.arrived();

    if (!this.fade) {
      // Half plus a little: a slide has to be more on screen than off to be the one being
      // read, and asking for a bare half makes two slides equally current at the midpoint of
      // every scroll.
      this.observer = new IntersectionObserver(this.onIntersect, { root: scroller, threshold: 0.6 });
      for (const slide of slides) this.observer.observe(slide);
      // The observer answers "which slide", and cannot answer "is there anywhere left to
      // go": the last stretch of a row whose slides are narrower than it brings nothing new
      // into view, and that is exactly where the next button has to go dim. Passive, and two
      // reads of numbers the browser has already computed for the scroll it is dispatching.
      scroller.addEventListener('scroll', this.onScroll, { passive: true });
      this.scrolls = scroller;
    }

    this.apply(Math.min(this.index, Math.max(slides.length - 1, 0)));
  }

  /**
   * Write the controls, or write them again after the slides changed.
   *
   * The rotation control is a child of the element rather than of the control bar, and it is
   * first: the APG asks for it at the head of the tab sequence inside the carousel, so that
   * a reader who lands in a moving carousel can stop it before reading anything. Putting it
   * in the bar under the row and moving it visually would be a tab order that disagrees with
   * the page, which is the trade this project does not make - so it is drawn where it sits,
   * over the top corner of the row.
   */
  writeControls() {
    this.removeControls();
    const id = this.scroller.id;

    if (this.autoplay) {
      this.rotateButton = this.control('data-carousel-rotate', '', id);
      this.prepend(this.rotateButton);
      this.labelRotation();
    }

    this.controls = document.createElement('div');
    this.controls.setAttribute('data-carousel-controls', '');

    this.prevButton = this.control('data-carousel-prev', this.getAttribute('prev-text') || 'Previous slide', id);
    // An element and not a background image, so a page that loaded the script but not the
    // stylesheet still has a button with something in it. The chevron is a shape and reads as
    // nothing, which is what the label is for.
    this.prevButton.append(chevron(CHEVRON.prev));

    this.picker = document.createElement('div');
    this.picker.setAttribute('data-carousel-markers', '');
    this.picker.setAttribute('role', 'group');
    this.picker.setAttribute('aria-label', this.getAttribute('picker-text') || 'Choose slide to display');

    const word = this.getAttribute('slide-text') || 'Slide';
    this.slides.forEach((slide, at) => {
      const marker = this.control('data-carousel-marker', word + ' ' + (at + 1), id);
      // The number stays visible: it is the accessible name's own visible half, so a theme
      // that draws these as dots is a choice a page makes rather than a label hidden by
      // default. `Slide 3` contains `3`, which is what WCAG asks of a name over a label.
      marker.textContent = String(at + 1);
      this.picker.append(marker);
    });

    this.nextButton = this.control('data-carousel-next', this.getAttribute('next-text') || 'Next slide', id);
    this.nextButton.append(chevron(CHEVRON.next));

    this.controls.append(this.prevButton, this.picker, this.nextButton);
    this.append(this.controls);
  }

  /** One control button: named, typed, and pointed at the row it drives. */
  control(flag, label, id) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute(flag, '');
    button.setAttribute('aria-controls', id);
    if (label) button.setAttribute('aria-label', label);
    return button;
  }

  /** Take the controls back out, so `wire()` and `disconnectedCallback` leave the markup as
   * they found it. */
  removeControls() {
    if (this.rotateButton) this.rotateButton.remove();
    if (this.controls) this.controls.remove();
    this.rotateButton = null;
    this.controls = null;
    this.picker = null;
    this.prevButton = null;
    this.nextButton = null;
  }

  /**
   * The rotation control's name says what pressing it will do, and it has no `aria-pressed`.
   * That is the APG's own answer for this button: a name that changes and a state that does
   * not, rather than both, which would have a screen reader read the two against each other.
   */
  labelRotation() {
    if (!this.rotateButton) return;
    const stop = this.getAttribute('pause-text') || 'Stop slide rotation';
    const start = this.getAttribute('play-text') || 'Start slide rotation';
    this.rotateButton.setAttribute('aria-label', this.rotating ? stop : start);
    this.rotateButton.textContent = this.rotating ? '⏸' : '▶';
  }

  /** Where the row is now, out of what the observer has seen. */
  onIntersect(entries) {
    const slides = this.slides;
    for (const entry of entries) {
      const at = slides.indexOf(entry.target);
      if (at < 0) continue;
      if (entry.isIntersecting) this.visible.add(at);
      else this.visible.delete(at);
    }
    this.apply(currentSlide(this.visible, this.index));
  }

  /** Scrolled: the edges are the scroller's to report, and they change without the set of
   * visible slides changing. */
  onScroll() {
    const scroller = this.scroller;
    if (this.settling !== null && scroller && Math.abs(scroller.scrollLeft - this.settling) <= 1) {
      this.arrived();
    }
    this.applyEdges();
  }

  /** The programmatic scroll is over: the scroller speaks for itself again. */
  arrived() {
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = null;
    this.settling = null;
  }

  /**
   * Push the current slide onto the picker and the slides, and tell the page when it moved.
   */
  apply(at) {
    const changed = at !== this.index;
    this.index = at;
    this.markers.forEach((marker, index) => {
      // `aria-disabled` rather than `disabled`: the button for the slide you are on has
      // nowhere to go, and a `disabled` one taken out from under the focus that just pressed
      // it drops the reader back to the top of the page.
      if (index === at) marker.setAttribute('aria-disabled', 'true');
      else marker.removeAttribute('aria-disabled');
    });
    // The hook the fade mode is drawn from, and a styling hook for the scrolled one - which
    // is why it is written in both, rather than only where the CSS needs it.
    this.slides.forEach((slide, index) => {
      if (index === at) slide.setAttribute('data-carousel-current', '');
      else slide.removeAttribute('data-carousel-current');
    });
    this.applyEdges();
    if (!changed) return;
    this.dispatchEvent(new CustomEvent('carousel-change', {
      bubbles: true,
      detail: { index: at, slide: this.slides[at] || null }
    }));
  }

  /**
   * Whether there is anywhere left to go, either way - onto the two buttons as `aria-disabled`
   * and onto the element as a styling hook.
   *
   * Both at once is a row short enough to fit, and both buttons go dim: a carousel with
   * nothing to scroll is a list, and two live buttons over a list that cannot move is the
   * kind of thing that gets pressed twice and then distrusted.
   */
  applyEdges() {
    const scroller = this.scroller;
    if (!scroller) return;
    // Where the row is *going*, not where it is. A smooth scroll takes a few hundred
    // milliseconds, and reading `scrollLeft` during it dims the button only once the
    // animation lands - so the last press of next looks live all the way through the move
    // that spends it, and the state arrives after the reader has already decided to press
    // again. `settling` is the position the browser was asked for, and it answers for the
    // buttons until the scroll gets there.
    const offset = this.settling === null || this.settling === undefined
      ? scroller.scrollLeft
      : this.settling;
    const at = this.fade
      ? { start: this.index <= 0, end: this.index >= this.slides.length - 1 }
      : scrollEdges(offset, scroller.clientWidth, scroller.scrollWidth);

    this.toggleAttribute('data-carousel-at-start', at.start);
    this.toggleAttribute('data-carousel-at-end', at.end);
    if (this.prevButton) this.prevButton.setAttribute('aria-disabled', String(at.start));
    if (this.nextButton) this.nextButton.setAttribute('aria-disabled', String(at.end));
  }

  /**
   * Show a slide: scroll it to the start of the row, or cross-fade to it.
   *
   * The delta comes from the two boxes rather than from `offsetLeft`, which is measured
   * against whichever ancestor happens to be positioned and is a different number for the
   * slide and the scroller as soon as a page positions one of them. Assigning `scrollLeft`
   * rather than calling `scrollTo` leaves the smoothness to CSS, where the reduced-motion
   * query already lives - see `index.scss`.
   */
  to(at) {
    const slide = this.slides[at];
    if (!slide) return;
    if (this.fade) {
      this.apply(at);
      return;
    }
    const scroller = this.scroller;
    const delta = slide.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    // Recorded before the scroll rather than after it, so the buttons answer for the move as
    // it starts. Clamped to the scrollable range, which is not tidying: the last slide of a
    // row that shows three at a time is asked for from further away than the row can scroll,
    // and an unclamped target is a number the scroller will never reach - so the state would
    // stay frozen on a prediction until the backstop below fired, instead of unfreezing the
    // moment the scroll lands. Clamped by magnitude, because a right-to-left scroller counts
    // down from zero.
    const wanted = scroller.scrollLeft + delta;
    const reach = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
    this.settling = Math.sign(wanted) * Math.min(Math.abs(wanted), reach);
    if (this.settleTimer) clearTimeout(this.settleTimer);
    // The backstop, and the reason this cannot get stuck: a scroll the reader interrupts
    // with a swipe never reaches the position it was sent to, and there is no event for
    // "that scroll was abandoned". A second is longer than any smooth scroll and shorter
    // than anyone's patience, and when it fires the scroller speaks for itself again.
    this.settleTimer = setTimeout(() => {
      this.arrived();
      this.applyEdges();
    }, 1000);
    scroller.scrollLeft += delta;
    this.applyEdges();
  }

  /** One on, stopping at the end - where the button is dim and says so. */
  next() {
    if (this.hasAttribute('data-carousel-at-end')) return;
    this.to(stepSlide(this.index, 1, this.slides.length));
  }

  previous() {
    if (this.hasAttribute('data-carousel-at-start')) return;
    this.to(stepSlide(this.index, -1, this.slides.length));
  }

  /**
   * One on for the rotation, which is the only thing here that wraps.
   *
   * A carousel that rotates to its last slide and stops is a carousel that quietly died, so
   * the end goes back to the beginning. The buttons do not, because they are dim there and a
   * control that looks spent must not still act.
   */
  advance() {
    if (this.hasAttribute('data-carousel-at-end')) this.to(0);
    else this.to(stepSlide(this.index, 1, this.slides.length));
  }

  /**
   * Start rotating.
   *
   * `pinned` is what the rotation control sets, and it is the APG's rule that a rotation the
   * reader asked for by hand is not stopped again by a stray mouse crossing the row: hover
   * and focus are ignored until the same button stops it.
   */
  play(pinned) {
    this.rotating = true;
    this.pinned = !!pinned;
    this.tick();
    this.labelRotation();
    this.applyLive();
  }

  pause() {
    this.rotating = false;
    this.pinned = false;
    this.clearTimer();
    this.labelRotation();
    this.applyLive();
  }

  /**
   * The live region, and only in `fade`.
   *
   * Stacked, one slide is all there is, so a reader who cannot see the cross-fade is owed the
   * announcement - `polite` when the slides move because somebody pressed something. `off`
   * while it rotates, which is the half people leave out: a carousel announcing itself every
   * five seconds interrupts whatever else is being read, forever.
   *
   * Scrolling there is no region at all. Every slide is in the tree the whole time, so there
   * is nothing to announce that the reader cannot already reach.
   */
  applyLive() {
    const scroller = this.scroller;
    if (!scroller) return;
    if (!this.fade) {
      scroller.removeAttribute('aria-live');
      return;
    }
    scroller.setAttribute('aria-live', this.rotating ? 'off' : 'polite');
  }

  tick() {
    this.clearTimer();
    this.timer = setInterval(() => this.advance(), this.interval);
  }

  clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Rotation held while the pointer or the focus is in the carousel - still rotating as far
   * as the button's name is concerned, because it will be again on the way out. */
  suspend() {
    if (this.rotating && !this.pinned) this.clearTimer();
  }

  resume() {
    if (this.rotating && !this.pinned && !this.timer) this.tick();
  }

  /** Focus moving between two controls is focus that never left. */
  onFocusOut(e) {
    if (!this.contains(e.relatedTarget)) this.resume();
  }

  onClick(e) {
    const button = e.target.closest && e.target.closest('button');
    // A button in a slide is the page's, not a control - and neither is one belonging to a
    // carousel nested inside this one.
    if (!button || button.closest('carousel-elemental') !== this) return;

    if (button === this.rotateButton) {
      if (this.rotating) this.pause();
      else this.play(true);
      return;
    }
    if (button === this.prevButton) {
      this.previous();
      return;
    }
    if (button === this.nextButton) {
      this.next();
      return;
    }
    const at = this.markers.indexOf(button);
    if (at >= 0) this.to(at);
  }

  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    if (name === 'fade') {
      // The mode change swaps what the element watches - an observer and a scroll listener,
      // or neither - so the whole wiring is re-read rather than patched in place.
      this.wire();
      this.applyLive();
      return;
    }
    if (name === 'autoplay') {
      // The control appears and disappears with the attribute, so the rotation has to be
      // re-decided after it: `play()` labels a button that has to exist by then.
      this.writeControls();
      this.apply(this.index);
      if (this.autoplay && !reducedMotion()) this.play();
      else this.pause();
      return;
    }
    if (this.rotating && this.timer) this.tick();
  }
}

define('carousel-elemental', CarouselElemental);
