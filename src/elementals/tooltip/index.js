import { ElementBase, define, placeFlyout, placeSubmenu } from '../../core.js';

/**
 * Whether the words in a `title` are the trigger's *name* or a *description* of it.
 *
 * A `title` is the accessible name of a control that has no other one - an icon-only
 * button is called "Save" by nothing else. Moving those words into a description and
 * dropping the attribute would leave that button nameless, which is a worse page than the
 * one that started with a native tooltip. So the words go back where they were already
 * working: as a name when the trigger had none, as a description when it did.
 *
 * @param {{text: string, ariaLabel: ?string, ariaLabelledby: ?string}} trigger
 * @returns {'name'|'description'}
 */
export function titleRole(trigger) {
  const named = (trigger.text && trigger.text.trim()) || trigger.ariaLabel || trigger.ariaLabelledby;
  return named ? 'description' : 'name';
}

/**
 * Where hover, focus and Escape leave a tooltip.
 *
 * A tooltip has no state to a screen reader - the description is on the trigger the whole
 * time, and this is only about what is drawn. Which is why it is a reducer over four
 * facts rather than an `open` flag: hover and focus can each hold it open, so neither
 * leaving is on its own a reason to close.
 *
 * Escape is the part worth writing down. [WCAG 2.2 SC 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
 * asks for dismissible, and a dismissal that is undone by the next `pointermove` over the
 * same button is no dismissal at all - so `dismissed` outlives the press and is cleared
 * only once the reader has actually left, by pointer and by focus both.
 *
 * @param {{hovering: boolean, focused: boolean, dismissed: boolean, open: boolean}} state
 * @param {'pointerenter'|'pointerleave'|'focus'|'blur'|'escape'} event
 * @returns {{hovering: boolean, focused: boolean, dismissed: boolean, open: boolean}}
 */
export function nextTooltipState(state, event) {
  const next = { ...state };
  switch (event) {
    case 'pointerenter': next.hovering = true; break;
    case 'pointerleave': next.hovering = false; break;
    case 'focus': next.focused = true; break;
    case 'blur': next.focused = false; break;
    case 'escape': next.dismissed = true; break;
    default: return state;
  }
  if (!next.hovering && !next.focused) next.dismissed = false;
  next.open = (next.hovering || next.focused) && !next.dismissed;
  return next;
}

/**
 * The text of an element as a name computation would see it, which is not `textContent`:
 * an `aria-hidden` glyph is exactly what an icon-only button is full of, and it names
 * nothing. Recursive, because the hidden part is usually a `<span>` around a `<svg>`.
 *
 * @param {Node} node
 * @returns {string}
 */
function nameText(node) {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1 || node.getAttribute('aria-hidden') === 'true') return '';
  return [...node.childNodes].map(nameText).join('');
}

/**
 * How far along the bubble the caret has to sit to point at the middle of its trigger,
 * measured from the bubble's own start edge on whichever axis the caret runs along.
 *
 * Aligning the bubble to an edge of the trigger is not the same as pointing at it: a
 * button wider than its tooltip is aligned at the left and centred nowhere near it. So the
 * trigger's middle is measured and handed over as one number, and where the caret may
 * actually go - off the rounded corner, past the end - is the stylesheet's to clamp, since
 * the corner radius and the caret's own size are its numbers and not this file's.
 *
 * Measured from the *inline start*, which in RTL is the right-hand edge - so a stylesheet
 * can spend it on `inset-inline-start` without knowing the direction.
 *
 * @param {DOMRect|object} trigger Rect of the trigger, in viewport coordinates
 * @param {{left: number, top: number, width: number, height: number}} bubble Where the bubble landed
 * @param {boolean} horizontal Whether the bubble sits beside the trigger rather than over or under it
 * @param {boolean} rtl
 * @returns {number} Pixels from the bubble's start edge on the caret's axis
 */
export function arrowOffset(trigger, bubble, horizontal, rtl) {
  if (horizontal) return (trigger.top + trigger.bottom) / 2 - bubble.top;
  const middle = (trigger.left + trigger.right) / 2;
  return rtl ? bubble.left + bubble.width - middle : middle - bubble.left;
}

/**
 * Where the bubble starts on the axis it runs *along* - the one the caret slides on.
 *
 * Two answers, because a control wider than its bubble and a control narrower than it want
 * opposite things. Wider: centre the bubble on it, so the caret comes out of the middle of
 * both. Narrower: line the two up at the edge the placement chose, because a small button
 * centred under a long sentence puts most of that sentence to one side of the thing it
 * belongs to, and the caret already carries the pointing.
 *
 * Centring is then held inside the viewport, which is the one thing that outranks either
 * rule - and it does not spoil the caret, since that is measured against wherever the
 * bubble actually landed.
 *
 * @param {number} start Trigger's near edge on this axis, in viewport coordinates
 * @param {number} end Trigger's far edge
 * @param {number} size The bubble's extent on the same axis
 * @param {number} limit The viewport's, on that axis
 * @param {boolean} toStart Whether the placement asked for the near edge, in physical terms
 * @returns {number} Where the bubble's near edge goes
 */
export function alignOnAxis(start, end, size, limit, toStart) {
  if (end - start >= size) {
    const centred = (start + end) / 2 - size / 2;
    return Math.min(Math.max(centred, 0), Math.max(limit - size, 0));
  }
  return toStart ? start : end - size;
}

/** What counts as the trigger when the element wraps one. Focusable by the platform's own
 * rules, since the description has to reach a reader who arrived on it with Tab. */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Long enough to cross the gap between the trigger and the bubble with a pointer, short
 * enough that a tooltip left behind reads as a bug. The gap is why this exists at all:
 * "hoverable" means the reader can put the pointer on the bubble, and between the two
 * boxes there is a strip that belongs to neither. */
const CLOSE_DELAY = 120;

/** Between the trigger and the bubble, when the page has not said. */
const FALLBACK_GAP = 6;

let sequence = 0;

/**
 * `<tooltip-elemental>` custom element.
 *
 * A description that shows on hover and on focus, wired to the control it describes - and
 * still on the page when the script is not.
 *
 * The [APG's tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) says of
 * itself that it "is work in progress; it does not yet have task force consensus", so this
 * implements the half every source does agree on - `aria-describedby` from the trigger to
 * the words, Escape to dismiss, hover and focus to show - and refuses the half they do
 * not. `role="tooltip"` is set because the pattern says so, and
 * [buys nothing on its own](https://sarahmhigley.com/writing/tooltips-in-wcag-21/):
 * `aria-describedby` is what any screen reader actually reads.
 *
 * Two ways to write it, and they are the same element:
 *
 * ```html
 * <tooltip-elemental>
 *   <button type="button">Save</button>
 *   <span>Saves to your drafts, without publishing</span>
 * </tooltip-elemental>
 *
 * <button type="button" id="save">Save</button>
 * <tooltip-elemental for="save">Saves to your drafts, without publishing</tooltip-elemental>
 * ```
 *
 * Wrapping is the one to reach for. `for` exists because a bubble is sometimes written far
 * from the button it belongs to - a table of controls, a template that emits its help text
 * in one block - and it costs nothing at the markup level, since the element works out
 * which shape it is in by whether it contains something focusable.
 *
 * A `title` on the trigger is read as the words when there is no other source for them,
 * and the attribute is removed so the native tooltip does not double up. Where those words
 * end up depends on what the trigger already had: see `titleRole`.
 *
 * **It is unreachable by touch, and that is not a bug to work around.** There is no hover
 * on a touch screen, and a tap is activation rather than focus, so pointer events from a
 * touch are ignored outright rather than half-handled. Nothing essential belongs in one.
 * A control that needs its description read on every device wants visible text, and one
 * that reveals content on a press wants `<disclosure-elemental>`.
 *
 * Light DOM, no shadow root. Nothing is moved and nothing is wrapped: the bubble is the
 * element the author wrote, given a `role`, an `id` if it had none, and a `hidden` while
 * it is not showing - which still leaves it readable, because
 * [`aria-describedby` reaches hidden content](https://www.w3.org/TR/accname-1.2/).
 *
 * Degrades honestly: with no script the words are a sentence beside the control, which is
 * what the markup says on its own. Nothing is hidden until there is something able to show
 * it again.
 *
 * ponytail: fixed positioning rather than the popover API, so a bubble is not clipped by a
 * scrolling ancestor. Popover would put it in the top layer and take the Escape handling
 * with it; it is worth revisiting once CSS anchor positioning is in Firefox and Safari,
 * which is the half that would then be missing.
 *
 * @tag tooltip-elemental
 * @attr {string} for - `id` of the control this describes. Only read when the element does not wrap one.
 * @attr {boolean} [horizontal=false] - Beside the control rather than over or under it. Which of the two sides is still the viewport's call.
 *
 * @cssprop {<length>} [--tooltip-elemental-gap=6px] - Between the trigger and the bubble.
 * @cssprop {<length>} [--tooltip-elemental-caret=5px] - Half the caret, since it is drawn as a border.
 * @cssprop {<time>} [--tooltip-elemental-duration=120ms] - The fade, in and out. `prefers-reduced-motion` turns it off.
 * @cssprop {<length>} [--tooltip-elemental-padding-block=0.5em] - Above and below the words.
 * @cssprop {<length>} [--tooltip-elemental-padding-inline=0.75em] - Either side of them.
 * @cssprop {<length>} [--tooltip-elemental-radius=6px] - The bubble's corners.
 * @cssprop {<length>} [--tooltip-elemental-border-width=1px] - The rim, which the caret takes too.
 * @cssprop {<color>} [--tooltip-elemental-border-color=Canvas 28% into the surface] - That rim's colour.
 * @cssprop {<length>} [--tooltip-elemental-max-width=250px] - Where the words wrap. A tooltip is a sentence, not a paragraph.
 * @cssprop {<color>} [--tooltip-elemental-surface=CanvasText] - What the bubble is painted in.
 * @cssprop {<color>} [--tooltip-elemental-color=Canvas] - The words on it.
 */
export class TooltipElemental extends ElementBase {
  /** The control being described: what the element wraps, or what `for` names. */
  get trigger() {
    const own = this.querySelector(`:scope > ${FOCUSABLE}`);
    if (own) return own;
    const id = this.getAttribute('for');
    return id ? document.getElementById(id) : null;
  }

  /** The words. A direct child that is not the trigger, or - when `for` named the trigger
   * from somewhere else on the page - this element itself. */
  get bubble() {
    const own = this.querySelector(`:scope > ${FOCUSABLE}`);
    if (!own) return this;
    return [...this.children].find((child) => child !== own) || null;
  }

  connectedCallback() {
    if (this.initialized) return;
    const trigger = this.trigger;
    if (!trigger) return;

    let bubble = this.bubble;
    // Nothing written for it to say, so the last place to look is the attribute the author
    // would have used if this element were not here.
    if (!bubble || bubble === this) {
      if (bubble === this && this.textContent.trim()) {
        // `for` shape: this element is the words.
      } else if (trigger.title) {
        bubble = document.createElement('span');
        bubble.textContent = trigger.title;
        this.appendChild(bubble);
      } else {
        return;
      }
    }

    const fromTitle = trigger.title && bubble.textContent.trim() === trigger.title.trim();
    if (fromTitle) trigger.removeAttribute('title');

    this.initialized = true;
    this.triggerElement = trigger;
    this.bubbleElement = bubble;
    this.state = { hovering: false, focused: false, dismissed: false, open: false };

    bubble.setAttribute('role', 'tooltip');
    if (!bubble.id) bubble.id = `tooltip-elemental-${++sequence}`;

    const names = fromTitle && titleRole({
      text: nameText(trigger),
      ariaLabel: trigger.getAttribute('aria-label'),
      ariaLabelledby: trigger.getAttribute('aria-labelledby')
    }) === 'name';

    if (names) {
      // The words were this control's only name. Described *and* named by the same string
      // is a screen reader saying it twice, so it is named and nothing more.
      trigger.setAttribute('aria-label', bubble.textContent.trim());
    } else {
      const described = trigger.getAttribute('aria-describedby');
      trigger.setAttribute('aria-describedby', [described, bubble.id].filter(Boolean).join(' '));
    }

    bubble.hidden = true;

    this.onPointer = this.onPointer.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.reposition = this.reposition.bind(this);

    for (const el of [trigger, bubble]) {
      el.addEventListener('pointerenter', this.onPointer);
      el.addEventListener('pointerleave', this.onPointer);
    }
    trigger.addEventListener('focus', this.onFocus);
    trigger.addEventListener('blur', this.onBlur);
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    for (const el of [this.triggerElement, this.bubbleElement]) {
      el.removeEventListener('pointerenter', this.onPointer);
      el.removeEventListener('pointerleave', this.onPointer);
    }
    this.triggerElement.removeEventListener('focus', this.onFocus);
    this.triggerElement.removeEventListener('blur', this.onBlur);
    this.stopWatching();
    clearTimeout(this.closeTimer);
    this.initialized = false;
  }

  onPointer(e) {
    // A tap is not a hover. Half-handling touch is how a tooltip ends up stuck open on a
    // phone, and the description is on the trigger for a screen reader either way.
    if (e.pointerType === 'touch') return;
    if (e.type === 'pointerenter') this.apply('pointerenter');
    else this.close(CLOSE_DELAY);
  }

  onFocus() {
    this.apply('focus');
  }

  onBlur() {
    this.apply('blur');
  }

  onKeydown(e) {
    if (e.key !== 'Escape') return;
    // Not prevented: Escape belongs to whatever else is listening for it too - a dialog
    // this tooltip happens to be inside has the better claim on closing.
    this.apply('escape');
  }

  /** Runs one event through the state machine and draws whatever came out of it. */
  apply(event) {
    clearTimeout(this.closeTimer);
    const was = this.state.open;
    this.state = nextTooltipState(this.state, event);
    if (this.state.open === was) return;
    if (this.state.open) this.show();
    else this.hide();
  }

  /** Leaving with a pointer waits, so the strip between the trigger and the bubble can be
   * crossed - the bubble has to be reachable to satisfy "hoverable". */
  close(delay) {
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => this.apply('pointerleave'), delay);
  }

  show() {
    this.bubbleElement.hidden = false;
    // Placed before the frame is painted: unhiding and measuring in the same task means
    // the first paint already has the coordinates, so there is no flash at 0,0.
    this.place();
    document.addEventListener('keydown', this.onKeydown);
    window.addEventListener('scroll', this.reposition, { capture: true, passive: true });
    window.addEventListener('resize', this.reposition);
  }

  hide() {
    this.bubbleElement.hidden = true;
    this.stopWatching();
  }

  stopWatching() {
    document.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('scroll', this.reposition, { capture: true });
    window.removeEventListener('resize', this.reposition);
  }

  reposition() {
    if (this.state.open) this.place();
  }

  /**
   * Puts the bubble beside the trigger, in viewport coordinates.
   *
   * `position: fixed` rather than an offset parent, because the two are not always in the
   * same one - and because a tooltip inside anything scrolling would otherwise be clipped
   * by it. The side and the alignment are written out as attributes as well, since a caret
   * has to point back the way the bubble came from and nothing in CSS can read a number
   * this file computed.
   *
   * The axis is the author's, the side is the viewport's: `horizontal` says beside rather
   * than over or under, and which of the two sides that turns out to be is measured. Which
   * is the whole reason there is no `placement="e"` here - a fixed side is a tooltip off
   * the edge of the screen on the one page where it did not fit.
   */
  place() {
    const trigger = this.triggerElement.getBoundingClientRect();
    const bubble = this.bubbleElement.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const rtl = window.getComputedStyle(this.triggerElement).direction === 'rtl';
    const gap = parseFloat(window.getComputedStyle(this.bubbleElement).getPropertyValue('--tooltip-elemental-gap')) || FALLBACK_GAP;
    const horizontal = this.hasAttribute('horizontal');

    // The gap is spent on the axis the bubble travels along, and only there: counting it on
    // both would refuse a placement that fits by a few pixels sideways.
    const panel = {
      width: bubble.width + (horizontal ? gap : 0),
      height: bubble.height + (horizontal ? 0 : gap)
    };
    const { side, align } = horizontal
      ? placeSubmenu(trigger, panel, viewport, rtl)
      : placeFlyout(trigger, panel, viewport, rtl);

    // `side` and `align` are logical and these are physical pixels, so the direction
    // decides which edge each one names: the inline start is the left in LTR and the right
    // in RTL, which is what both of these xors say.
    const after = (side === 'inline-end') !== rtl;
    const toStart = (align === 'start') !== rtl;

    const top = horizontal
      ? alignOnAxis(trigger.top, trigger.bottom, bubble.height, viewport.height, align === 'start')
      : (side === 'block-end' ? trigger.bottom + gap : trigger.top - bubble.height - gap);
    const left = horizontal
      ? (after ? trigger.right + gap : trigger.left - bubble.width - gap)
      : alignOnAxis(trigger.left, trigger.right, bubble.width, viewport.width, toStart);

    this.bubbleElement.dataset.side = side;
    this.bubbleElement.dataset.align = align;
    this.bubbleElement.style.top = `${Math.round(top)}px`;
    this.bubbleElement.style.left = `${Math.round(left)}px`;
    this.bubbleElement.style.setProperty(
      '--tooltip-elemental-arrow-offset',
      `${Math.round(arrowOffset(trigger, { left, top, width: bubble.width, height: bubble.height }, horizontal, rtl))}px`
    );
  }
}

define('tooltip-elemental', TooltipElemental);
