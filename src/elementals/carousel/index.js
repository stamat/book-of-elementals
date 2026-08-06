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
 * `atEdge` is the scroller's answer to "is there anywhere left to scroll", not arithmetic
 * on the index, and that is the whole reason it is a parameter. With more than one slide on
 * screen the last few can never be the earliest visible one, so `current + 1` at the end
 * would be a press that scrolls nowhere - a carousel that looks broken exactly where a
 * reader is most likely to try it.
 *
 * Both ends wrap. That is what the APG's own carousel does, and the rotation has to wrap
 * anyway, so the alternative is two behaviours for one direction.
 *
 * @param {number} current - Index the carousel is on.
 * @param {number} delta - `1` for next, `-1` for previous.
 * @param {number} count - How many slides there are.
 * @param {boolean} atEdge - Whether the scroller is already as far that way as it goes.
 * @returns {number}
 */
export function stepSlide(current, delta, count, atEdge) {
  if (count <= 0) return 0;
  if (delta > 0) return atEdge ? 0 : Math.min(current + 1, count - 1);
  return atEdge ? count - 1 : Math.max(current - 1, 0);
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
 * **No live region, and that is deliberate.** The APG's example flips `aria-live` between
 * `off` and `polite` because there one slide exists at a time and a reader who cannot see
 * the swap would otherwise never hear about it. Here every slide is in the DOM, in the
 * accessibility tree and in reading order the whole time, so there is nothing to announce
 * and nothing hidden to miss - and no `aria-hidden` on the slides off screen either, which
 * is the bug that puts a focusable link inside a hidden subtree.
 *
 * ponytail: one axis, horizontal. A vertical carousel is the same code with the block
 * properties, and nothing has asked for one; the refusal is on the page rather than an
 * `orientation` attribute nobody sets.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 *
 * @tag carousel-elemental
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
 * @cssprop {<length>} [--carousel-elemental-gap=0px] - Between the slides.
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
    return ['autoplay', 'interval'];
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
    this.suspend = this.suspend.bind(this);
    this.resume = this.resume.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);

    this.index = 0;
    this.visible = new Set();
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

    this.removeControls();

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
    for (const slide of this.slides) {
      slide.removeAttribute('role');
      slide.removeAttribute('aria-roledescription');
      slide.removeAttribute('data-carousel-slide');
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
    // (WCAG 2.1.1). A row of slides full of links already has stops enough.
    if (scroller.querySelector(FOCUSABLE)) scroller.removeAttribute('tabindex');
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

    if (this.observer) this.observer.disconnect();
    this.visible.clear();
    // Half plus a little: a slide has to be more on screen than off to be the one being
    // read, and asking for a bare half makes two slides equally current at the midpoint of
    // every scroll.
    this.observer = new IntersectionObserver(this.onIntersect, { root: scroller, threshold: 0.6 });
    for (const slide of slides) this.observer.observe(slide);

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
    // Text, not a background image, so a page that loaded the script but not the stylesheet
    // still has a button with something in it. The arrow is a shape and reads as nothing,
    // which is what the label is for.
    this.prevButton.textContent = '‹';

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
    this.nextButton.textContent = '›';

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

  /** Push the current slide onto the picker, and tell the page when it moved. */
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
    if (!changed) return;
    this.dispatchEvent(new CustomEvent('carousel-change', {
      bubbles: true,
      detail: { index: at, slide: this.slides[at] || null }
    }));
  }

  /** Whether the scroller is as far back as it goes. `abs`, because RTL scrolls negative. */
  atStart() {
    return Math.abs(this.scroller.scrollLeft) <= 1;
  }

  /** Whether the scroller is as far on as it goes. */
  atEnd() {
    const scroller = this.scroller;
    return Math.abs(scroller.scrollLeft) + scroller.clientWidth >= scroller.scrollWidth - 1;
  }

  /**
   * Scroll a slide to the start of the row.
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
    const scroller = this.scroller;
    scroller.scrollLeft += slide.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
  }

  next() {
    this.to(stepSlide(this.index, 1, this.slides.length, this.atEnd()));
  }

  previous() {
    this.to(stepSlide(this.index, -1, this.slides.length, this.atStart()));
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
  }

  pause() {
    this.rotating = false;
    this.pinned = false;
    this.clearTimer();
    this.labelRotation();
  }

  tick() {
    this.clearTimer();
    this.timer = setInterval(() => this.next(), this.interval);
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
