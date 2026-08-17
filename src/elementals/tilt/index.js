import { ElementBase, define } from '../../core.js';

/** Degrees at the edge, when `max` says nothing usable. Chosen rather than derived: the card
 * this was extracted from leans 2, which is slight enough that most readers never see it. */
export const DEFAULT_MAX = 10;

function clamp01(value) {
  if (!(value > 0)) return 0;
  return value > 1 ? 1 : value;
}

/** Three decimals is past the point a pixel can show the difference, and the raw number ends
 * up in an inline style for anyone reading the DOM. */
function round3(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

/**
 * Where the pointer is inside the box, as the two angles the card is drawn at and the point
 * the glare is centred on.
 *
 * **The sign convention is the whole of it, and nothing about `rotateX` announces which way
 * it goes.** A positive `rotateX` sends the top edge away from the reader and a positive
 * `rotateY` sends the right edge away, so the card leans *away* from the pointer - the feel
 * of pressing a corner rather than of the card following a magnet. `reverse` is the other
 * one, and it is an attribute rather than a default because both look deliberate and only
 * one of them can be first.
 *
 * The glare does not flip with it. Reverse changes which way the card leans; the light is
 * still where the reader is pointing.
 *
 * Angles are unitless and so is the glare position - the stylesheet multiplies by `1deg` and
 * `1%`. That is what lets the theme's shadow read the same two numbers as an offset without
 * dividing a `deg` back out of them.
 *
 * @param {DOMRect|{left: number, top: number, width: number, height: number}} rect The box.
 * @param {number} pointerX Viewport coordinates, as `PointerEvent.clientX` gives them.
 * @param {number} pointerY
 * @param {{max?: number, axis?: string|null, reverse?: boolean}} [options]
 * @returns {{x: number, y: number, glareX: number, glareY: number}}
 */
export function tiltFrom(rect, pointerX, pointerY, options = {}) {
  const { axis, reverse } = options;
  const max = Number.isFinite(options.max) && options.max >= 0 ? options.max : DEFAULT_MAX;
  // No area is a closed `<details>`, a hidden tab panel, or the frame before layout. Flat,
  // and the glare in the middle: `NaN%` in a gradient drops the whole background rather than
  // the one value that was wrong.
  if (!(rect.width > 0) || !(rect.height > 0)) return { x: 0, y: 0, glareX: 50, glareY: 50 };

  // Clamped, because the pointer is outside the box on the frame the reader leaves on, and a
  // child that captured it can report a position beyond the box at any time. Unclamped, one
  // flick off the corner is a card standing on its side.
  const across = clamp01((pointerX - rect.left) / rect.width);
  const down = clamp01((pointerY - rect.top) / rect.height);
  const sign = reverse ? -1 : 1;

  return {
    x: axis === 'y' ? 0 : round3(sign * (0.5 - down) * 2 * max),
    y: axis === 'x' ? 0 : round3(sign * (across - 0.5) * 2 * max),
    glareX: round3(across * 100),
    glareY: round3(down * 100)
  };
}

/**
 * A layer's `data-tilt-depth` as a number, or `null` when it is not one.
 *
 * `Number` rather than `parseFloat`, so `data-tilt-depth="40px"` is refused instead of
 * half-honoured: the value is multiplied by `--tilt-elemental-depth-step`, and a length
 * times a length is a `calc()` that does not resolve - which invalidates the whole
 * `transform` and takes the card's rotation down with the layer's rise.
 */
export function layerDepth(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const depth = Number(value);
  return Number.isFinite(depth) ? depth : null;
}

/**
 * `<tilt-elemental>` custom element.
 *
 * A card that leans under the pointer: the 3D tilt every product page has, wrapped round the
 * markup you already wrote rather than poured into a structure of its own.
 *
 * There is no APG pattern for this, because there is no widget - nothing is operated, and the
 * content is the same content lying flat. What there is instead is an obligation nobody in
 * this corner of the ecosystem meets.
 * [WCAG 2.2 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
 * says motion animation triggered by interaction has to be able to be turned off unless it is
 * essential - and a decorative tilt is never essential, so there is no exemption to claim.
 * `prefers-reduced-motion` is the technique the criterion names, and **this element reads it
 * and then does not listen at all**: no pointer handlers, no transform, no glare. It follows
 * the setting live, because unlike a marquee there is no button here for a reader to have
 * pressed, so nothing is being overridden by keeping up with them.
 *
 * The pointer is a mouse or it is nothing. A finger dragging across a card is a page trying
 * to scroll, and a card that tilts under it is a card fighting the gesture it intercepted.
 * There is no keyboard equivalent either, and that is deliberate rather than missing: motion
 * that a reader cannot avoid triggering is the failure the criterion is about.
 *
 * Light DOM, no shadow root. Nothing you wrote is moved or wrapped - the element writes four
 * numbers into its own `style` and the stylesheet spends them. With no script it is a `<div>`
 * that does nothing, with your content inside it in reading order.
 *
 * **The tilt is a CSS transition, not a loop.** Every library on this shelf runs a `lerp`
 * inside `requestAnimationFrame` to smooth the movement; a transition on `transform` is the
 * same easing done by the compositor, off the main thread, and it stops on its own. All the
 * frame callback is left with is collapsing a burst of pointer events into one write.
 *
 * ponytail: no gyroscope. `DeviceOrientationEvent.requestPermission()` needs transient
 * activation and a permission prompt on iOS, and a card that asks for sensor access to wobble
 * is a worse trade than a card that does not wobble on a phone. If it is ever wanted it is an
 * attribute plus a method the author calls from their own gesture, never an automatic prompt.
 *
 * ponytail: no scale on hover, because `data-tilt-active` is public and
 * `tilt-elemental[data-tilt-active] { scale: 1.03 }` is the whole feature.
 *
 * @tag tilt-elemental
 * @attr {number} [max=10] - Degrees at the edge of the box. `0` is a card that does not move, for a glare on its own. Anything that is not a number at or above zero is the default.
 * @attr {x | y} axis - Keep one rotation and drop the other. `x` is the card nodding as the pointer moves up and down, `y` is it turning as the pointer moves across. Absent is both.
 * @attr {boolean} [reverse=false] - Lean towards the pointer instead of away from it. The glare does not move.
 * @attr {boolean} [glare=false] - Draw a highlight that follows the pointer across the card.
 *
 * `--tilt-elemental-x`, `--tilt-elemental-y`, `--tilt-elemental-glare-x` and
 * `--tilt-elemental-glare-y` are deliberately not tagged below. The element writes them into
 * its own `style` attribute, and an inline declaration beats any stylesheet - so a knob for
 * one would be a control that cannot move anything, and the docs panel is built out of these
 * tags. They are outputs, and the page describes them as such.
 *
 * @cssprop {<length>} [--tilt-elemental-perspective=1000px] - How near the reader is. Smaller is a wider lens and a stronger lean for the same angle.
 * @cssprop {<time>} [--tilt-elemental-duration=120ms] - How long the card takes to catch up with the pointer. The trailing feel every tilt library calls speed.
 * @cssprop {<time>} [--tilt-elemental-return-duration=400ms] - How long it takes to settle flat once the pointer has gone. Longer than the chase on purpose.
 * @cssprop {ease | ease-in | ease-out | ease-in-out | linear} [--tilt-elemental-easing=ease-out] - How both of those move.
 * @cssprop {<length>} [--tilt-elemental-depth-step=1px] - What one unit of `data-tilt-depth` is worth, so `data-tilt-depth="40"` rises 40px.
 * @cssprop {<color>} [--tilt-elemental-glare-color=rgb(255 255 255 / 35%)] - The highlight, alpha included. One property rather than a colour and an opacity, because a glare is the two together.
 * @cssprop {<length-percentage>} [--tilt-elemental-glare-size=60%] - How far it spreads before it is gone. Small is a hotspot, large is a wash.
 * @cssprop {<length-percentage>} [--tilt-elemental-radius=0.75rem] - Theme. The card's corners, which the glare follows. Rounded with `border-radius` alone, because `overflow: hidden` over it would flatten every layer.
 * @cssprop {<length>} [--tilt-elemental-shadow-size=1.5rem] - Theme. How soft the shadow under the card is. Spent as half of itself, because the shadow is a blurred fill and a blur takes the deviation where a `box-shadow` takes twice it.
 * @cssprop {<color>} [--tilt-elemental-shadow-color=currentcolor at 30%] - Theme. Its colour, and the fill of the layer it is drawn on - so a card with a see-through background wants this at `transparent`. The offset is not a knob: it is the lean, a pixel per degree, moving against it.
 *
 * @slot - The card. Anything at all; mark a descendant `data-tilt-depth="40"` to have it rise out of the surface while the card is leaning.
 */
export class TiltElemental extends ElementBase {
  /** The frame callback's handle, `0` when none is queued. */
  frame = 0;

  /** The last position the pointer reported, `null` when it is not over the card. */
  pointer = null;

  /**
   * The card's box as it is with nothing leaning it, held for the length of one hover and
   * `null` at rest.
   *
   * **Every decision is made against this and not against the box the card is currently
   * drawn in**, which is the whole of why this element does not flicker at its own border.
   * The card leans *away* from the pointer, so the edge the pointer is nearest is always the
   * edge that swings back - and a receding edge projects inwards. Hit-test against the
   * leaning card and a pointer a pixel inside that edge falls outside it: `pointerleave`
   * fires, the card straightens, the edge lands back under the pointer, and it leans again.
   *
   * A lift towards the reader looks like it would cover the gap and does not: what the
   * rotation gives away grows with the square of the card's size, where a lift only scales
   * it, so any fixed lift is a card size away from flickering again. Measured on a
   * `640x400` card at ten degrees, `2.5rem` of lift was still nine pixels short.
   *
   * It can only be read at the one moment the card is flat, which is the first pointer event
   * of a hover - so it is read there and kept. Stale after a scroll, which is what the
   * scroll listener is for.
   */
  box = null;

  /** Degrees at the edge. The trust boundary for `max`: past here it is a number at or above
   * zero, and `0` is a value an author means rather than one to fall back from. */
  get max() {
    const raw = this.getAttribute('max');
    if (raw === null || raw.trim() === '') return DEFAULT_MAX;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_MAX;
  }

  set max(value) {
    this.setAttribute('max', value);
  }

  /** `'x'`, `'y'`, or `null` for both. Anything else is both, rather than a card that has
   * silently stopped moving because of a typo. */
  get axis() {
    const raw = (this.getAttribute('axis') || '').trim().toLowerCase();
    return raw === 'x' || raw === 'y' ? raw : null;
  }

  set axis(value) {
    if (value === null || value === undefined || value === '') {
      this.removeAttribute('axis');
      return;
    }
    this.setAttribute('axis', value);
  }

  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onDocumentMove = this.onDocumentMove.bind(this);
    this.onMotionChange = this.onMotionChange.bind(this);
    this.rest = this.rest.bind(this);

    this.update();

    // Followed rather than read once. `<marquee-elemental>` reads the same setting a single
    // time because it writes a Start button, and a reader who has pressed it must not be
    // overruled by the system preference changing later. There is no control here, so there
    // is nothing to overrule: keeping up with the setting is the whole of respecting it.
    this.motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (this.motion) this.motion.addEventListener('change', this.onMotionChange);
    this.onMotionChange();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    if (this.motion) this.motion.removeEventListener('change', this.onMotionChange);
    this.motion = null;
    this.stop();
    // The glare's last position outlives a hover on purpose; it does not outlive the element.
    this.style.removeProperty('--tilt-elemental-glare-x');
    this.style.removeProperty('--tilt-elemental-glare-y');
    this.initialized = false;
  }

  /**
   * Copy every `data-tilt-depth` in the card onto a custom property the stylesheet can
   * multiply.
   *
   * CSS cannot read an attribute as a number - `attr()` with a type is not in the browsers
   * this book targets - so the number has to be carried across, and this is the one place it
   * happens.
   *
   * ponytail: read at upgrade and on demand, with no observer behind it. A card whose layers
   * arrive from a render after that calls `.update()`; a `MutationObserver` over the whole
   * subtree is the upgrade if that turns out to be the common case rather than the rare one.
   */
  update() {
    this.querySelectorAll('[data-tilt-depth]').forEach((layer) => {
      const depth = layerDepth(layer.getAttribute('data-tilt-depth'));
      if (depth === null) layer.style.removeProperty('--tilt-elemental-depth');
      else layer.style.setProperty('--tilt-elemental-depth', depth);
    });
  }

  onMotionChange() {
    if (this.motion && this.motion.matches) this.stop();
    else this.start();
  }

  /** Listen. Nothing is drawn until the pointer arrives, so this is safe to call twice. */
  start() {
    if (this.listening) return;
    this.listening = true;
    this.addEventListener('pointermove', this.onPointerMove);
  }

  /** Stop listening and lie flat. The card animates back rather than snapping, because the
   * transition is on the transform and the transform is what changed. */
  stop() {
    if (this.listening) {
      this.listening = false;
      this.removeEventListener('pointermove', this.onPointerMove);
    }
    this.rest();
  }

  onPointerMove(event) {
    if (event.pointerType !== 'mouse') return;
    this.track(event.clientX, event.clientY);
  }

  /**
   * The pointer, once the card is leaning: the card's own `pointermove` stops being the
   * authority the moment there is a transform in the way of it.
   *
   * Capture, so nothing on the page can swallow the event that decides the card is done, and
   * the containment test is against the flat box rather than against whether the event
   * reached the element at all.
   */
  onDocumentMove(event) {
    if (event.pointerType !== 'mouse' || !this.box) return;
    const { left, top, right, bottom } = this.box;
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      this.rest();
      return;
    }
    this.track(event.clientX, event.clientY);
  }

  /**
   * Note where the pointer is and ask for a frame.
   *
   * The first call of a hover is the one that matters: the card is still flat, so this is the
   * only moment `getBoundingClientRect` answers with the untransformed box, and it is kept
   * for the rest of the hover. Everything after it - the angles, and whether the pointer has
   * left - is measured against that.
   *
   * One write a frame. `pointermove` outruns the display, and every extra pass is a style
   * invalidation for a frame nobody will see.
   */
  track(x, y) {
    this.pointer = { x, y };
    if (!this.box) {
      this.box = this.getBoundingClientRect();
      document.addEventListener('pointermove', this.onDocumentMove, true);
      // The pointer leaving the window stops the moves rather than reporting one outside the
      // box, so without this the card holds its last angle until something else touches it.
      document.addEventListener('pointerleave', this.rest);
      // A scroll moves the box out from under a cached rect that cannot be re-read while the
      // card is leaning. Straightening is the honest answer: the next pointer event takes a
      // fresh measurement of a card that is flat again.
      window.addEventListener('scroll', this.rest, { passive: true, capture: true });
    }
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => this.apply());
  }

  /** Draw the card at the last position the pointer reported. */
  apply() {
    this.frame = 0;
    if (!this.pointer || !this.box) return;
    const angles = tiltFrom(this.box, this.pointer.x, this.pointer.y, {
      max: this.max,
      axis: this.axis,
      reverse: this.hasAttribute('reverse')
    });
    this.style.setProperty('--tilt-elemental-x', `${angles.x}`);
    this.style.setProperty('--tilt-elemental-y', `${angles.y}`);
    this.style.setProperty('--tilt-elemental-glare-x', `${angles.glareX}`);
    this.style.setProperty('--tilt-elemental-glare-y', `${angles.glareY}`);
    // Guarded, because setting an attribute to the value it already has is still a mutation
    // record for anything observing the card and still a pass through the selectors that
    // match on it - sixty times a second, for a value that changes twice a hover.
    if (!this.hasAttribute('data-tilt-active')) this.setAttribute('data-tilt-active', '');
  }

  /**
   * Flat, and nothing queued.
   *
   * The two angles are removed rather than set to zero, so the fallbacks in the stylesheet
   * are the only place the resting angle is written down. Removing one still animates: what
   * transitions is `transform`, which is recomputed from whatever the `var()` resolves to.
   *
   * **The glare's position is deliberately left where it was.** Removing it too would send
   * the highlight sliding back to the middle of the card as it fades - a light travelling to
   * a place the pointer never was, and the one movement in this element that nobody asked
   * for. Fading out where it stood is what a highlight does. The next hover writes over it
   * before anything is visible again.
   *
   * The attribute comes off in the same task, which is what makes the way back slower than
   * the way out - the longer duration is the rule that applies once it is gone.
   */
  rest() {
    if (this.box) {
      document.removeEventListener('pointermove', this.onDocumentMove, true);
      document.removeEventListener('pointerleave', this.rest);
      window.removeEventListener('scroll', this.rest, { capture: true });
      this.box = null;
    }
    if (this.frame) window.cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.pointer = null;
    this.removeAttribute('data-tilt-active');
    this.style.removeProperty('--tilt-elemental-x');
    this.style.removeProperty('--tilt-elemental-y');
  }
}

define('tilt-elemental', TiltElemental);
