import { swipe } from 'book-of-spells/src/dom.mjs';
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
 * How far a finger has to travel before it is a swipe and not a tap: forty CSS pixels.
 *
 * Absolute rather than a fraction of the slide, because it is answering about the hand and
 * not the layout - a tap wobbles by the same few pixels whether the slide is a phone wide or
 * a thumbnail. Well past the slop a browser allows a tap before it stops synthesising a
 * `click`, which is what keeps a swipe over a slide with a link on it from following it.
 */
const SWIPE = 40;

/**
 * Which way a finger that has just come up was asking to go: `1` for next, `-1` for previous.
 *
 * Only `fade` ever asks. A scrolled row is a real scroll container and swipes natively, and
 * a second answer laid over the browser's would fight it; stacked slides have nothing to
 * scroll, so the gesture is read for them or the mode does not have one.
 *
 * The one part of that gesture book-of-spells cannot answer, because it reads the screen and
 * not the writing direction: where the carousel runs right to left the next slide is the one
 * to the *right*, the same way round as the arrows under it.
 *
 * @param {string} direction - `left` or `right`, as the gesture reported it.
 * @param {boolean} rtl - Whether the carousel's direction is right to left.
 * @returns {number}
 */
export function swipeStep(direction, rtl) {
  return direction === (rtl ? 'right' : 'left') ? 1 : -1;
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

/**
 * How far short of the row's own edge a slide has to stop: its `scroll-padding` on the start
 * side.
 *
 * A row that bleeds past the text it sits under puts the column's inset back as padding, and
 * moves the snap point with it - which is the only way the first card lines up with the
 * heading while the row still runs to the edge of the page. Scrolling a slide flush to the
 * row's own edge there lands the same distance *past* its snap point, and a mandatory snap
 * then carries on to the next slide: one press, two slides, and it reads as the element
 * losing count.
 *
 * Physical rather than logical, because the number is about to be added to `scrollLeft`: the
 * start side is the left one, or the right one where the row runs the other way.
 *
 * @param {CSSStyleDeclaration|object} styles - The scroller's computed style.
 * @param {boolean} rtl - Whether the scroller's direction is right to left.
 * @returns {number} Pixels, and zero for `auto` or anything else that is not a length.
 */
export function startInset(styles, rtl) {
  const inset = parseFloat(rtl ? styles.scrollPaddingRight : styles.scrollPaddingLeft);
  return Number.isFinite(inset) ? inset : 0;
}

/**
 * Whether a swap in `fade` has a height worth travelling between.
 *
 * Both refusals are the same bug approached from opposite sides: a pinned height comes back
 * off when the transition it was written for ends, so a pin with no transition behind it is
 * one nothing ever takes off - and from then on the stack answers a resize, a font arriving
 * or a picture that finally loaded with a pixel count taken before any of them happened.
 * Reduced motion is one road there, because the stylesheet drops the transition under it;
 * two slides that measure the same is the other, because a transition between one value and
 * the same value never starts and so never ends.
 *
 * @param {number} from - The height the stack had before the current marker moved.
 * @param {number} to - The height it has now.
 * @param {boolean} reduced - Whether the reader asked for less movement.
 * @returns {boolean}
 */
export function swapHeight(from, to, reduced) {
  return !reduced && from !== to;
}

/**
 * Whether the rotation stays held: while the pointer or the keyboard is in the carousel, and
 * while the carousel is off the screen.
 *
 * Hover and focus are two facts rather than one flag, because either can end while the other
 * holds - and the APG asks that rotation not resume until hover *and* focus have both left.
 * One flag is the version that breaks: a mouse crossing a carousel a keyboard reader is
 * inside leaves again, and its leaving restarts the slides under someone mid-caption.
 *
 * **`pinned` outranks those two and does not outrank `offscreen`, and that ordering is the
 * whole of this function.** Pinned is the reader having pressed Start, and the APG's rule is
 * that a rotation asked for by hand is not stopped again by a stray mouse - so ignoring hover
 * and focus there is honouring a choice somebody made. Off the screen there is no such
 * choice to honour, because there is nobody at the carousel: the timer would spend the life
 * of the page advancing slides for no one, and hand the reader who scrolls back a carousel
 * parked mid-set, on a slide nothing they did chose.
 *
 * @param {boolean} hovering
 * @param {boolean} focused
 * @param {boolean} [offscreen=false]
 * @param {boolean} [pinned=false]
 * @returns {boolean}
 */
export function rotationHeld(hovering, focused, offscreen, pinned) {
  if (offscreen) return true;
  if (pinned) return false;
  return hovering || focused;
}

/** The place in the set a slide is named by, where `position-text` said nothing. */
const POSITION = '{n} of {total}';

/**
 * The name a slide gets when the markup gave it none: its place in the set.
 *
 * `1 of 10` is English, and it is the name a screen reader reads out for every slide in the
 * carousel - so leaving it as the only string on this element a page cannot reach is
 * leaving the most-read one. `position-text` is the whole template rather than the word
 * between the numbers, because "of" between them is English's shape too: Japanese counts
 * the other way round, `10 中の 3`.
 *
 * An empty attribute falls back rather than being honoured. It would otherwise write
 * `aria-label=""`, and a slide with no name at all is worse than a slide named in the
 * wrong language.
 *
 * @param {number} index - Which slide, from zero.
 * @param {number} count - How many slides there are.
 * @param {string|null} [template] - `position-text`, with `{n}` and `{total}` in it.
 * @returns {string}
 * @example
 * slideName(2, 10) // => '3 of 10'
 * slideName(2, 10, '{n} od {total}') // => '3 od 10'
 */
export function slideName(index, count, template) {
  const text = template == null || template.trim() === '' ? POSITION : template;
  return text.replace(/\{n\}/g, index + 1).replace(/\{total\}/g, count);
}

/**
 * A picker button's accessible name: `slide-text` with the slide's number in it.
 *
 * `Slide 3` is English's order, and putting the number after the word is a decision this
 * element has no business making for a language it cannot read. Hungarian writes `3. dia`,
 * Japanese `3枚目`. A `slide-text` holding `{n}` says where the number goes and the element
 * only fills it in; one that does not gets the number appended, which is what every
 * `slide-text` written before this did.
 *
 * @param {string} word - `slide-text`, with or without `{n}` in it.
 * @param {number} index - Which slide, from zero.
 * @returns {string}
 * @example
 * markerName('Slide', 2) // => 'Slide 3'
 * markerName('{n}. dia', 2) // => '3. dia'
 */
export function markerName(word, index) {
  const number = index + 1;
  if (word.indexOf('{n}') === -1) return word + ' ' + number;
  return word.replace(/\{n\}/g, number);
}

/**
 * The word a screen reader says in place of the role: `carousel` here, `slide` on each of
 * them.
 *
 * `aria-roledescription` is author-localized by definition - it overrides the name assistive
 * technology has for a role, in whatever language that technology had it in, so "the value
 * should be translated when a page is localized"
 * ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription)).
 * English baked into the element is a Serbian page whose slides announce themselves in
 * English, and there is nothing the page can do about it.
 *
 * Whitespace is refused rather than written, which the same page asks for: the value must be
 * "not empty and contains more than just whitespace characters". Honouring `" "` would
 * override the role announcement with nothing at all, so a reader stops hearing "group" and
 * hears nothing in its place - worse than the English it replaced.
 *
 * @param {string|null} raw - The attribute, as authored.
 * @param {string} fallback - The English word to use when it said nothing usable.
 * @returns {string}
 */
export function roleDescription(raw, fallback) {
  return raw == null || raw.trim() === '' ? fallback : raw;
}

/**
 * Which slide the carousel is on: the first one that has not gone past the row's start edge.
 *
 * Measured against the *snap* edge rather than the scroller's box, which is the only version
 * that survives a row with `scroll-padding` on it. A shelf that bleeds past its text keeps the
 * column's inset as padding, and the slide before the current one sits in that padding, still
 * two thirds on screen - so "the earliest slide more than half visible" answers with the slide
 * you just left, the index never advances, and the next button stops doing anything after one
 * press. This asks the question the snap points already answer.
 *
 * A pixel of slack because a fractional layout lands a hair either side of the edge, and the
 * last slide as the fallback for a row scrolled past every start - which is where a row whose
 * final slides are narrower than the viewport ends up.
 *
 * @param {number[]} starts - Each slide's start edge, relative to the scroller's own.
 * @param {number} inset - The row's `scroll-padding` on the start side.
 * @param {number} fallback - The index to keep when there is nothing to measure.
 * @returns {number}
 */
export function currentSlide(starts, inset, fallback) {
  if (!starts.length) return fallback;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] >= inset - 1) return i;
  }
  return starts.length - 1;
}

/**
 * How far a slide's start edge is past the row's, in the direction the row scrolls.
 *
 * Left edges where the row reads left to right, right edges where it reads the other way.
 * Measured by its left edge, a right-to-left row's first slide - the one against the right
 * edge - reads as the furthest along of them all and every slide after it as behind: the
 * index never leaves zero, the picker never moves, and next sends the row a slide's width the
 * wrong way. `scrollEdges` and `startInset` already read the direction; this is the third
 * measurement that has to.
 *
 * @param {{left: number, right: number}} slide - The slide's box.
 * @param {{left: number, right: number}} scroller - The scroller's box.
 * @param {boolean} rtl - Whether the row reads right to left.
 * @returns {number} Positive past the start edge, negative behind it.
 */
export function startEdge(slide, scroller, rtl) {
  return rtl ? scroller.right - slide.right : slide.left - scroller.left;
}

/**
 * What to add to `scrollLeft` to bring a slide's start to the row's snap edge.
 *
 * The start is measured in reading direction and `scrollLeft` is not: a right-to-left row
 * counts down from zero, so the same distance is travelled by taking it off.
 *
 * @param {number} start - The slide's `startEdge()`.
 * @param {number} inset - The row's `scroll-padding` on the start side.
 * @param {boolean} rtl - Whether the row reads right to left.
 * @returns {number}
 */
export function scrollDelta(start, inset, rtl) {
  return rtl ? inset - start : start - inset;
}

/**
 * The slide a press counts from: the one the row is on its way to, or, once it has landed,
 * the one it is on.
 *
 * The index catches up at the end of the trip - the scroll event that moves it comes when the
 * row has crossed the next slide's start - so a second press during the smooth scroll the
 * first one started would count from where the row still was, and send it to the slide it
 * was already going to: two quick presses of next, one slide.
 *
 * @param {number} index - The slide the row is on.
 * @param {number|null} destination - The slide the last press asked for, or null once the row has landed.
 * @returns {number}
 */
export function pressOrigin(index, destination) {
  return destination === null ? index : destination;
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
 * The icons on the controls: `chevron-left-16`, `chevron-right-16`, `play-24` and
 * `square-fill-24` from [Octicons](https://primer.style/foundations/icons/), MIT, © GitHub Inc.
 *
 * Four path strings rather than a dependency - this is the whole of what the package would
 * have been imported for, and a build step to tree-shake an icon set down to four shapes is a
 * build step this project promises its users they will not need.
 *
 * Drawn rather than typed, which is the point: a glyph is centred wherever the font's
 * designer put it inside the em box, and in a round button an off-centre chevron is visible
 * at a glance. A path is centred on its own viewBox, in every font and on every platform -
 * which `▶` and `⏸` are not: the pause glyph is missing from enough system fonts to come out
 * as a box, and where it is present it is often the emoji face rather than the shape.
 *
 * The box travels with the path, because these are not all drawn to one grid. Octicons sizes
 * a shape for the icon it is on its own, and two of these are cropped out of a bigger drawing
 * - which is the viewBox's job and needs no path edited, so there is nothing here to drift
 * from what Octicons ships.
 */
const ICON = {
  prev: {
    d: 'M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z',
    box: '0 0 16 16'
  },
  next: {
    d: 'M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z',
    box: '0 0 16 16'
  },
  // `play-24` is two paths, a triangle inside a ring, and this is the triangle: the button it
  // goes in is already a circle with a countdown ring around it, and the icon's own would be
  // the third concentric circle inside 28 pixels. `triangle-right-16` is the shape that looks
  // like the obvious answer and is not - it is drawn as a disclosure twisty, 3.8 units wide
  // against 7.1 tall, where a play triangle is nearly as wide as it is high.
  //
  // The box is cropped to 13.5 of the 24 it is drawn in, which renders the triangle at the
  // height of the chevrons it is read beside, and sits half a unit left of the shape's centre.
  // That half unit is the correction every play button wants and no geometry gives you: a
  // triangle carries its area behind its point, so one centred on its bounding box reads as
  // too far left. The square is symmetrical and keeps the box it came with.
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
  // Sized in the markup as well as the viewBox, because an `<svg>` with neither is laid out
  // at the replaced-element default - 300 by 150 - and a page that took the script without
  // the stylesheet would get an icon the size of a paragraph. The theme sizes it in `em`
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
 * `aria-disabled` on a control, written only when it changes. The edges are pushed on every
 * scroll event, and an attribute rewritten to the value it already has still queues a
 * mutation record - two of them a frame, to say nothing changed.
 */
function disable(button, disabled) {
  if (!button) return;
  const value = String(disabled);
  if (button.getAttribute('aria-disabled') !== value) button.setAttribute('aria-disabled', value);
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
 * read off the boxes themselves. That is what buys the responsiveness for nothing - resize
 * the window, change how many slides fit in CSS, or put the whole thing in a container
 * query, and the answer is measured from the layout that came out of it rather than from an
 * index some earlier layout wrote down.
 *
 * Light DOM, no shadow root. Nothing you wrote is moved or wrapped; the element adds the
 * roles to your list and its items, and appends the controls - which is also why the
 * controls are its to write rather than yours. A previous button authored in the markup is
 * a button that does nothing until the script lands, and this element's promise is the
 * other way round: with no script the slides are a plain list, every one of them on the page
 * and in reading order. The row, the snap and the controls all arrive with the script - the
 * stylesheet keys on what the upgrade writes - so nothing is ever there to press before it
 * works.
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
 * **One gesture, and only in `fade`.** A scrolling row swipes because it is a scroll
 * container, and a second answer laid over the browser's would fight it. A stack is not one,
 * so there the swipe is read here - touch and pen, never the mouse, which has the buttons and
 * the keyboard and would pay for a drag with the page's text selection and link clicks.
 *
 * ponytail: one axis, horizontal. A vertical carousel is the same code with the block
 * properties, and nothing has asked for one; the refusal is on the page rather than an
 * `orientation` attribute nobody sets.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 *
 * @tag carousel-elemental
 * @attr {boolean} [fade=false] - Cross-fade one slide at a time in place, instead of scrolling a row. The slides stack, the box takes the height of the slide showing - animated, over the same duration as the fade - and a touch swipe across them moves one slide.
 * @attr {boolean} [autoplay=false] - Rotate on a timer, and write the control that stops it. Ignored at upgrade when the reader asked for reduced motion - the control is still there to start it.
 * @attr {number} [interval=5000] - Milliseconds between slides while rotating. Under 1000 is treated as 1000.
 * @attr {string} [prev-text=Previous slide] - The previous button's accessible name.
 * @attr {string} [next-text=Next slide] - The next button's accessible name.
 * @attr {string} [play-text=Start slide rotation] - The rotation control's accessible name while stopped.
 * @attr {string} [pause-text=Stop slide rotation] - The rotation control's accessible name while rotating.
 * @attr {string} [slide-text=Slide] - The word in front of the number on a picker button. `Slide 3`. Holding `{n}` it says where the number goes instead: `{n}. dia`.
 * @attr {string} [position-text={n} of {total}] - The name a slide gets where the markup gave it none. `{n}` is its number, `{total}` how many there are.
 * @attr {string} [roledescription-text=carousel] - The word a screen reader says for the element instead of "group". Whitespace is refused, since a role announcement overridden with nothing is worse than one in the wrong language.
 * @attr {string} [slide-roledescription-text=slide] - The same for each slide, instead of "group". Whitespace is refused for the same reason.
 * @attr {string} [picker-text=Choose slide to display] - The picker group's accessible name.
 *
 * @cssprop {<length-percentage>} [--carousel-elemental-slide-size=100%] - How wide one slide is. This is how many slides fit: `50%` for two, `33.333%` for three, or any expression - it is the flex basis.
 * @cssprop {<length>} [--carousel-elemental-gap=0px] - Between the slides. Nothing in `fade`, where they are stacked.
 * @cssprop {<time>} [--carousel-elemental-fade=400ms] - How long the cross-fade takes in `fade`, and how long the box takes to travel between two slides' heights. Zero under reduced motion, whatever this says.
 * @cssprop {<length>} [--carousel-elemental-controls-gap=0.5rem] - Between the controls under the row.
 * @cssprop {<length>} [--carousel-elemental-marker-size=1.75rem] - Diameter of a picker button.
 * @cssprop {<color>} [--carousel-elemental-control=currentcolor] - Text and border of the controls.
 * @cssprop {<color>} [--carousel-elemental-border=color-mix(in srgb, currentcolor 20%, transparent)] - Border of a control that is not the current slide's.
 * @cssprop {<color>} [--carousel-elemental-hover=color-mix(in srgb, currentcolor 10%, transparent)] - Control background under the pointer.
 * @cssprop {<color>} [--carousel-elemental-current=CanvasText] - Fill of the picker button for the slide on screen. `CanvasText` and not `currentcolor`: that button's text inverts to `Canvas`, and `currentcolor` in its background would resolve against that.
 * @cssprop {<color>} [--carousel-elemental-chip=Canvas] - Fill behind the rotation control - the one control drawn over a slide rather than over the page, which is why it is opaque and does not follow `currentcolor`.
 * @cssprop {<color>} [--carousel-elemental-rotate-hover-color=CanvasText] - The rotation control's foreground under the pointer: its icon, and the countdown ring with it.
 * @cssprop {<length>} [--carousel-elemental-ring=3px] - How thick the rotation control's countdown ring is. A hairline is a countdown nobody reads at a glance.
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

    this.onClick = this.onClick.bind(this);
    this.onLayout = this.onLayout.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onSwipe = this.onSwipe.bind(this);
    this.onHeightEnd = this.onHeightEnd.bind(this);
    this.onHoverIn = this.onHoverIn.bind(this);
    this.onHoverOut = this.onHoverOut.bind(this);
    this.onFocusIn = this.onFocusIn.bind(this);
    this.onFocusOut = this.onFocusOut.bind(this);
    this.onVisibility = this.onVisibility.bind(this);

    this.hovering = false;
    this.focused = false;
    // Until an observer says otherwise, and where there is none, on the screen: no observer
    // means no hold, which is what every carousel did before this.
    this.offscreen = false;
    // Whether the `role` on the element is this element's own writing - `wire()` only
    // writes one where the page wrote none, and `strip()` may only take that one back.
    this.wroteRole = false;
    this.index = 0;
    // The row's `scroll-padding` on the start side, and which way the row reads - both
    // re-read whenever the layout changes, and once more on a press.
    this.inset = 0;
    this.rtl = false;
    this.painted = false;
    // Null rather than absent: `applyEdges` runs before the first move.
    this.settling = null;
    this.settleTimer = null;
    // The slide the last press sent the row to, until it lands there - see `pressOrigin`.
    this.destination = null;
    // The handle `swipe()` gives back, so the gesture can be taken off again.
    this.swipes = null;
    // The scroller whose height this element has pinned, and which it owes back.
    this.heights = null;
    // The name this element gave each slide, so a later `wire()` renumbers its own labels
    // and keeps its hands off the ones the markup wrote. The name and not just the slide,
    // because a page is free to name a slide *after* the upgrade - and a label that no
    // longer reads as the one written here is somebody else's.
    this.named = new WeakMap();

    this.addEventListener('click', this.onClick);
    // Hovering or tabbing into a carousel stops it rotating, which the APG asks for and a
    // reader halfway through a caption asks for louder. `mouseenter` and `mouseleave` do not
    // bubble, and do not need to: they fire here for the whole subtree.
    this.addEventListener('mouseenter', this.onHoverIn);
    this.addEventListener('mouseleave', this.onHoverOut);
    this.addEventListener('focusin', this.onFocusIn);
    this.addEventListener('focusout', this.onFocusOut);

    this.initialized = true;
    // Bound before `wire()` looks for anything, and whatever it finds. A gallery whose slides
    // are built later starts with an empty row - or with no list at all - and the listeners
    // have to be on the element by the time `wire()` is called on what arrived, or the
    // controls that come with it drive nothing. Returning early on a missing list was the
    // version where that `wire()` threw.
    this.wire();

    // The third hold, and the only one nobody is present for - see `rotationHeld` for why it
    // outranks the reader's own Start where hover and focus do not. The element is watched
    // and not the row, because the row is what `wire()` replaces and this outlives that.
    //
    // The margin is what keeps a carousel from arriving already still: it is rotating a
    // couple of hundred pixels of scrolling before it is in frame.
    if (typeof IntersectionObserver === 'function') {
      this.visibility = new IntersectionObserver(this.onVisibility, { rootMargin: '200px' });
      this.visibility.observe(this);
    }

    // Reduced motion is the one case where `autoplay` is read and not obeyed. The control
    // is still written, so a reader who wants the rotation can still have it - which is the
    // difference between honouring a preference and overruling a person.
    // Nothing to rotate is the other: a timer over an empty row would tick for the life of the
    // page to move between no slides.
    if (this.autoplay && this.slides.length > 1 && !reducedMotion()) this.play();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.clearTimer();
    this.rotating = false;
    this.pinned = false;

    this.removeEventListener('click', this.onClick);
    this.removeEventListener('mouseenter', this.onHoverIn);
    this.removeEventListener('mouseleave', this.onHoverOut);
    this.removeEventListener('focusin', this.onFocusIn);
    this.removeEventListener('focusout', this.onFocusOut);
    if (this.visibility) this.visibility.disconnect();
    this.visibility = null;
    this.hovering = false;
    this.focused = false;
    // Out of the document is not off the screen, and a carousel put back in has to start from
    // what the next observer says rather than from what the last one saw.
    this.offscreen = false;

    this.strip();
    this.initialized = false;
  }

  /**
   * Take the pattern back off, leaving the markup the page wrote: a list.
   *
   * Two callers, which are the same event approached from opposite sides - a carousel leaving
   * the document, and one whose page has taken its slides away. Everything written comes back
   * off in both, because a `role="group"` with `aria-roledescription="slide"` on a row nothing
   * is driving is a carousel announced to a screen reader that no longer has controls, and a
   * scroller left with a tab stop is a stop onto nothing.
   */
  strip() {
    if (this.observer) this.observer.disconnect();
    this.observer = null;
    if (this.scrolls) this.scrolls.removeEventListener('scroll', this.onScroll);
    this.scrolls = null;
    this.unswipe();
    this.unpin();
    this.arrived();
    // The clock too, or an emptied carousel ticks at nothing for the life of the page with
    // `data-carousel-rotating` still on. `rotating` stays as it was: it is the reader's
    // answer, and `wire()` restarts the clock from it when the slides come back.
    this.clearTimer();

    this.removeControls();
    this.painted = false;
    this.removeAttribute('data-carousel-at-start');
    this.removeAttribute('data-carousel-at-end');
    this.removeAttribute('aria-roledescription');
    // Only a role this element wrote: one the page authored is its own to keep.
    if (this.wroteRole) this.removeAttribute('role');
    this.wroteRole = false;

    const scroller = this.scroller;
    if (scroller) {
      scroller.removeAttribute('data-carousel-slides');
      scroller.removeAttribute('role');
      scroller.removeAttribute('tabindex');
      scroller.removeAttribute('aria-live');
    }
    for (const slide of this.slides) {
      slide.removeAttribute('role');
      slide.removeAttribute('aria-roledescription');
      slide.removeAttribute('data-carousel-slide');
      slide.removeAttribute('data-carousel-current');
      if (slide.getAttribute('aria-label') === this.named.get(slide)) slide.removeAttribute('aria-label');
    }
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
    // One slide is a figure, not a carousel, and an element that wrote a picker with a single
    // button in it would be worse than the markup it upgraded. An empty row is the same answer
    // for a different reason: a gallery builds its slides when the reader asks for them, and
    // until then there is nothing to put a pattern on. Either way this is the pass that takes
    // it back off, so a page that empties its carousel is left with a list rather than with
    // controls driving nothing.
    if (slides.length < 2) {
      this.strip();
      return;
    }

    this.setAttribute('aria-roledescription', roleDescription(this.getAttribute('roledescription-text'), 'carousel'));
    // `region` when the author named it, `group` when they did not. A region is a landmark,
    // and a landmark with no name is one more unnamed stop in the landmark list - while
    // `aria-roledescription` on an element with no role at all is silently nothing, which is
    // the failure this project does not ship.
    if (!this.hasAttribute('role')) {
      const named = this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby');
      this.setAttribute('role', named ? 'region' : 'group');
      this.wroteRole = true;
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

    const position = this.getAttribute('position-text');
    const slideRole = roleDescription(this.getAttribute('slide-roledescription-text'), 'slide');
    slides.forEach((slide, at) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', slideRole);
      slide.setAttribute('data-carousel-slide', '');
      const label = slide.getAttribute('aria-label');
      const authored = slide.hasAttribute('aria-labelledby')
        || (label !== null && label !== this.named.get(slide));
      if (authored) return;
      const name = slideName(at, slides.length, position);
      slide.setAttribute('aria-label', name);
      this.named.set(slide, name);
    });

    this.writeControls();
    this.painted = false;
    this.applyLive();

    if (this.observer) this.observer.disconnect();
    this.observer = null;
    if (this.scrolls) this.scrolls.removeEventListener('scroll', this.onScroll);
    this.scrolls = null;
    this.unswipe();
    this.unpin();
    // A move that was in flight was aimed at a row that has since changed.
    this.arrived();

    if (this.fade) {
      // The gesture the other mode gets from the platform. Stacked slides are not a scroll
      // container, so nothing here is being doubled up on - see `swipeStep`.
      this.swipes = swipe(scroller, { callback: this.onSwipe, threshold: SWIPE, mouse: false });
      // `cancel` as well as `end`: a stack taken off the screen mid-swap - a dialog closing
      // over it - ends no transition, and the pinned height would be the box's answer for the
      // rest of the page's life.
      scroller.addEventListener('transitionend', this.onHeightEnd);
      scroller.addEventListener('transitioncancel', this.onHeightEnd);
      this.heights = scroller;
    } else {
      // A resize observer and not an intersection one, which is what this was and is the bug
      // it had. Nothing here ever read an entry - the callback re-measures the row from the
      // boxes - so the observer was only ever a notifier, and an intersection notifier speaks
      // in thresholds: between `0.75` and `1` there is no value to cross, so a row that
      // overflowed by less than a quarter of a slide changed no ratio and said nothing. That
      // is a quarter of a slide's worth of window widths where the row can scroll, the next
      // button is dim, and `next()` refuses because the button is dim. Measured in Chromium
      // at 300px slides: 75px of scrollable row behind a dead arrow. A size is a size.
      //
      // The slides are watched as well as the scroller, and that is the half a
      // container-only observer misses: a breakpoint changing
      // `--carousel-elemental-slide-size` inside a fixed-width column resizes every slide
      // and leaves the scroller exactly the size it was.
      this.measure(scroller);
      this.observer = new ResizeObserver(this.onLayout);
      this.observer.observe(scroller);
      for (const slide of slides) this.observer.observe(slide);
      // The observer answers a row that changed shape; this answers a row that changed
      // place, which is every swipe, wheel and key press and none of them a resize. Passive,
      // and reads of numbers the browser has already computed for the scroll it is
      // dispatching.
      scroller.addEventListener('scroll', this.onScroll, { passive: true });
      this.scrolls = scroller;
    }

    this.apply(Math.min(this.index, Math.max(slides.length - 1, 0)));
    // The clock, where `strip()` took it off a row that had nothing to rotate and the slides
    // are back: only if the rotation is still on and nothing is holding it - a pointer, a
    // focus, or the row being off the screen. See `rotationHeld` for which of those a
    // rotation the reader started by hand gets to ignore.
    if (this.rotating && !this.timer && !this.held) this.tick();
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
    this.prevButton.append(icon(ICON.prev));

    this.picker = document.createElement('div');
    this.picker.setAttribute('data-carousel-markers', '');
    this.picker.setAttribute('role', 'group');
    this.picker.setAttribute('aria-label', this.getAttribute('picker-text') || 'Choose slide to display');

    const word = this.getAttribute('slide-text') || 'Slide';
    this.slides.forEach((slide, at) => {
      const marker = this.control('data-carousel-marker', markerName(word, at), id);
      // The number stays visible: it is the accessible name's own visible half, so a theme
      // that draws these as dots is a choice a page makes rather than a label hidden by
      // default. `Slide 3` contains `3`, which is what WCAG asks of a name over a label.
      marker.textContent = String(at + 1);
      this.picker.append(marker);
    });

    this.nextButton = this.control('data-carousel-next', this.getAttribute('next-text') || 'Next slide', id);
    this.nextButton.append(icon(ICON.next));

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
    // The icon says the same thing the name does, and swaps with it: what pressing will do.
    // Not whether the timer is ticking - hovering the row holds it without the button meaning
    // anything different, and that is what the ring around it is for.
    this.rotateButton.replaceChildren(icon(this.rotating ? ICON.stop : ICON.play));
  }

  /**
   * Where the row is now, read off the layout.
   *
   * Called for a scroll and for a resize alike, which is not belt and braces: a scroll moves
   * the row without changing its shape, a resize changes its shape without moving it, and the
   * index is stale after either. A stale index is not a cosmetic problem: the next press is
   * measured from it, so previous appears to work once and then do nothing at all, and next
   * jumps several slides at a time.
   */
  readIndex() {
    const scroller = this.scroller;
    // A scroller inside a closed `<details>`, or on a page that has just hidden it, measures
    // zero - and moving the carousel because something folded over it is a change nobody
    // asked for.
    if (!scroller || !scroller.clientWidth) return;
    const box = scroller.getBoundingClientRect();
    const starts = this.slides.map((slide) => startEdge(slide.getBoundingClientRect(), box, this.rtl));
    this.apply(currentSlide(starts, this.inset, this.index));
  }

  /** Which way the row reads, and how far in from its box the snap edge sits. */
  measure(scroller) {
    const styles = getComputedStyle(scroller);
    this.rtl = styles.direction === 'rtl';
    this.inset = startInset(styles, this.rtl);
  }

  /**
   * The observer's whole job: notice that the layout changed and re-read it.
   *
   * A resize, a container query flipping how many slides fit, a webfont landing - none of
   * them fire a scroll event, and a row measured before any of them is a row whose current
   * slide and whose dim arrows both belong to a layout that is gone. The `scroll-padding` is
   * re-read here rather than on every scroll, because a media query is the only thing that
   * changes it and this is where layout changes arrive.
   *
   * What it still does not catch: a slide that moves without resizing and without a scroll -
   * `--carousel-elemental-gap` changing at a breakpoint is the one. Nothing observes
   * position, and a rule that watches for it would be watching every carousel on every page
   * for the few that change their gap mid-life.
   */
  onLayout() {
    const scroller = this.scroller;
    if (!scroller) return;
    this.measure(scroller);
    this.readIndex();
  }

  /** Scrolled: the edges are the scroller's to report, and they change without the set of
   * visible slides changing. */
  onScroll() {
    const scroller = this.scroller;
    if (this.settling !== null && scroller && Math.abs(scroller.scrollLeft - this.settling) <= 1) {
      this.arrived();
    }
    this.readIndex();
  }

  /** The programmatic scroll is over: the scroller speaks for itself again. */
  arrived() {
    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = null;
    this.settling = null;
    this.destination = null;
  }

  /**
   * Push the current slide onto the picker and the slides, and tell the page when it moved.
   */
  apply(at) {
    const moved = at !== this.index;
    this.index = at;
    // The edges move without the slide changing - the last stretch of a scroll brings nothing
    // new into view - so they are pushed every time, and the rest only when there is something
    // to say. This runs on every scroll event; writing every marker and every slide each
    // frame would be a hundred attribute writes to say nothing changed.
    this.applyEdges();
    // `painted` is the first pass, and it is not the same question as `moved`. A carousel
    // opens on slide zero having never moved, and `fade` draws entirely from
    // `data-carousel-current` - so skipping the first write because nothing changed leaves a
    // stack of slides with none of them shown.
    if (!moved && this.painted) return;
    // A swap, rather than the first paint: the height travels between two slides, and on the
    // pass that puts the first slide up there is no height to travel from - the stack is empty
    // until this loop runs, so animating that would be every carousel unfolding on load.
    const swap = this.fade && this.painted && moved;
    this.painted = true;
    this.markers.forEach((marker, index) => {
      // `aria-disabled` rather than `disabled`: the button for the slide you are on has
      // nowhere to go, and a `disabled` one taken out from under the focus that just pressed
      // it drops the reader back to the top of the page.
      if (index === at) marker.setAttribute('aria-disabled', 'true');
      else marker.removeAttribute('aria-disabled');
    });
    // Read before the marker moves, because moving it is what changes the height: the slide
    // leaving goes out of flow and the one arriving comes into it, both in the same frame.
    const from = swap ? this.scroller.getBoundingClientRect().height : 0;
    // The hook the fade mode is drawn from, and a styling hook for the scrolled one - which
    // is why it is written in both, rather than only where the CSS needs it.
    this.slides.forEach((slide, index) => {
      if (index === at) slide.setAttribute('data-carousel-current', '');
      else slide.removeAttribute('data-carousel-current');
    });
    if (swap) this.resize(from);
    // The event is the other half: an element settling onto the slide it opened on has not
    // changed anything, and a page listening for a change is owed silence.
    if (!moved) return;
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
    disable(this.prevButton, at.start);
    disable(this.nextButton, at.end);
  }

  /**
   * Carry the stack's height from the slide that left to the slide that arrived.
   *
   * A transition needs two numbers and `auto` is neither of them, so the height the box had a
   * moment ago is written back on, read once so the browser takes it as a start, and replaced
   * with the height it is going to. `transitionend` hands the box back to `auto` as soon as it
   * lands - which is what leaves a resize, a font arriving or an image that finally loaded to
   * the layout, instead of to a pixel count taken before any of them happened.
   *
   * Measured off the scroller rather than off the slide, so whatever padding or `box-sizing`
   * the page gave the list is inside both numbers instead of neither.
   *
   * @param {number} from The height the stack had before the current marker moved.
   */
  resize(from) {
    const scroller = this.scroller;
    // Whatever a swap left pinned mid-flight, so `to` below is the layout's own answer and not
    // a number this method wrote.
    scroller.style.height = '';
    const to = scroller.getBoundingClientRect().height;
    if (!swapHeight(from, to, reducedMotion())) return;
    scroller.style.height = from + 'px';
    // Not a tidy-up and not dead: the read forces the layout the browser would otherwise fold
    // into the next one. Without it both writes land in the same frame, and a transition given
    // one value has nothing to travel between.
    scroller.getBoundingClientRect();
    scroller.style.height = to + 'px';
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
    // Re-read rather than trusted: the observer refreshes this on layout changes, and a page
    // is free to change `scroll-padding` without moving anything - which fires nothing at all.
    // A press is once per reader, so it can afford to ask.
    this.measure(scroller);
    const delta = scrollDelta(startEdge(slide.getBoundingClientRect(), scroller.getBoundingClientRect(), this.rtl), this.inset, this.rtl);
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
    this.destination = at;
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
    this.to(stepSlide(pressOrigin(this.index, this.destination), 1, this.slides.length));
  }

  previous() {
    if (this.hasAttribute('data-carousel-at-start')) return;
    this.to(stepSlide(pressOrigin(this.index, this.destination), -1, this.slides.length));
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
    else this.to(stepSlide(pressOrigin(this.index, this.destination), 1, this.slides.length));
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
    // Pressing Start while the pointer is on the row rotates - that is what `pinned` is for.
    // Pressing it on a row that is off the screen cannot happen, but `.play()` from a script
    // can, and a clock started there would be one nobody asked for and nobody sees.
    if (!this.held) this.tick();
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

  /**
   * Start the clock, and say so on the element.
   *
   * `data-carousel-rotating` is the timer and not `rotating`: the two part company every time
   * a pointer crosses the row, where the rotation is held but the button still says `Stop`.
   * A theme drawing a countdown off `rotating` would be one that keeps counting while nothing
   * is moving - so the hook is written where the clock is, out of the same two calls that
   * start and stop it, and cannot say otherwise. `--carousel-elemental-tick` goes with it for
   * the same reason: an animation is only honest at the length of the interval it is drawing,
   * and only this knows what that is.
   */
  tick() {
    this.clearTimer();
    this.timer = setInterval(() => this.advance(), this.interval);
    this.style.setProperty('--carousel-elemental-tick', this.interval + 'ms');
    this.setAttribute('data-carousel-rotating', '');
  }

  clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.removeAttribute('data-carousel-rotating');
    this.style.removeProperty('--carousel-elemental-tick');
  }

  /**
   * A finger has come up on a stacked slide, having travelled far enough across to have meant
   * it. The ends hold, exactly as they do for the buttons: the arrow is dim there, and a
   * gesture that still moved would be the carousel disagreeing with its own controls.
   *
   * A gesture more down the page than across it is the page scrolling and never arrives here -
   * `swipe` reports the axis it travelled furthest along, and only that one.
   */
  onSwipe(e) {
    // The list can be gone between the finger landing and it lifting - a page is free to
    // swap its slides out, and `getComputedStyle(null)` throws.
    const scroller = this.scroller;
    if (!e.horizontal || !scroller) return;
    const step = swipeStep(e.horizontalDirection, getComputedStyle(scroller).direction === 'rtl');
    if (step > 0) this.next();
    else this.previous();
  }

  /** Every swipe listener comes back off, and the half-finished gesture with it. */
  unswipe() {
    if (this.swipes) this.swipes.destroy();
    this.swipes = null;
  }

  /** Give the stack its height back, and stop listening for the swap that pinned it. The
   * inline height is this element's own writing, so leaving one behind is leaving the list a
   * size the page never asked for. */
  unpin() {
    if (!this.heights) return;
    this.heights.removeEventListener('transitionend', this.onHeightEnd);
    this.heights.removeEventListener('transitioncancel', this.onHeightEnd);
    this.heights.style.height = '';
    this.heights = null;
  }

  /** The end of the height the swap pinned - or the end of any hope of one. */
  onHeightEnd(e) {
    // The box's own height and nothing else: every slide's opacity transition bubbles through
    // here on its way up, and one of those ending says nothing about the height.
    if (e.target !== this.heights || e.propertyName !== 'height') return;
    this.heights.style.height = '';
  }

  /** Whether anything is holding the clock right now. One question, asked in the four places
   * that start or stop it, so none of them can answer it differently from the others. */
  get held() {
    return rotationHeld(this.hovering, this.focused, this.offscreen, this.pinned);
  }

  /** Rotation held while the pointer or the focus is in the carousel, or while it is off the
   * screen - still rotating as far as the button's name is concerned, because it will be
   * again on the way out. */
  suspend() {
    if (this.rotating && this.held) this.clearTimer();
  }

  resume() {
    // Every hold gone, not just the one that ended - see `rotationHeld`.
    if (this.rotating && !this.held && !this.timer) this.tick();
  }

  /**
   * The element crossing into or out of the viewport.
   *
   * The last entry and not the first: a burst of crossings coalesced into one callback ends
   * on the state the element is actually in now, and reading `entries[0]` there is acting on
   * a position it has already left.
   */
  onVisibility(entries) {
    const entry = entries[entries.length - 1];
    if (!entry) return;
    this.offscreen = !entry.isIntersecting;
    if (this.offscreen) this.suspend();
    else this.resume();
  }

  onHoverIn() {
    this.hovering = true;
    this.suspend();
  }

  onHoverOut() {
    this.hovering = false;
    this.resume();
  }

  onFocusIn() {
    this.focused = true;
    this.suspend();
  }

  /** Focus moving between two controls is focus that never left. */
  onFocusOut(e) {
    if (this.contains(e.relatedTarget)) return;
    this.focused = false;
    this.resume();
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
      return;
    }
    if (name === 'autoplay') {
      // Off is decided before the re-wire, so `wire()` finds no rotation to restart; on is
      // decided after it, because `play()` labels a control that `wire()` writes - and refuses
      // to write over fewer than two slides, exactly as the upgrade does.
      if (!this.autoplay) this.pause();
      this.wire();
      if (this.autoplay && this.slides.length > 1 && !reducedMotion()) this.play();
      return;
    }
    if (this.rotating && this.timer) this.tick();
  }
}

define('carousel-elemental', CarouselElemental);
