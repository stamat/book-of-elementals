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
 * Activating the trigger is deliberately not Escape's dismissal. The click has already
 * given the button focus, and a `dismissed` waiting for that focus to leave would kill
 * hover on the control for as long as it stays - a mouse never blurs what it clicked. So
 * `activate` forgets both holds instead: the bubble hides now, and whichever of hover or
 * focus arrives next opens it anew.
 *
 * @param {{hovering: boolean, focused: boolean, dismissed: boolean, open: boolean}} state
 * @param {'pointerenter'|'pointerleave'|'focus'|'blur'|'escape'|'activate'} event
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
    case 'activate': next.hovering = false; next.focused = false; break;
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
 * Centred on the trigger, always: a tooltip is a bubble with a caret, and a caret coming
 * out of a corner points at whatever happens to be beside the control. The viewport is the
 * one thing allowed to move it off the middle - the clamp slides the bubble just far enough
 * in to fit, so a trigger near an edge keeps the most centred bubble there is room for. It
 * does not spoil the caret, which is measured against wherever the bubble actually landed.
 *
 * `placeFlyout`'s own alignment used to decide this: it declines to centre where a fully
 * centred bubble would not fit and hands back the trigger's edge instead - a position that
 * fits the viewport on its own, so the clamp never fired and the bubble jumped from centred
 * to edge-aligned with nothing in between.
 *
 * @param {number} start Trigger's near edge on this axis, in viewport coordinates
 * @param {number} end Trigger's far edge
 * @param {number} size The bubble's extent on the same axis
 * @param {number} limit The viewport's, on that axis
 * @param {number} [margin=0] Breathing room kept from either edge, so a slid bubble stops
 *   short of the glass rather than on it. A bubble too big for the margined viewport sits
 *   at the near margin.
 * @returns {number} Where the bubble's near edge goes
 */
export function alignOnAxis(start, end, size, limit, margin = 0) {
  const at = (start + end) / 2 - size / 2;
  return Math.min(Math.max(at, margin), Math.max(limit - size - margin, margin));
}

/**
 * Where the bubble ended up relative to its trigger's middle, as the `data-align` a
 * stylesheet reads.
 *
 * Measured from where the bubble landed rather than taken from what was asked for, because
 * the centre is asked for every time now: the viewport's clamp is the only thing that can
 * take a bubble off the middle, and the attribute is worth nothing if it says `center` for
 * a bubble the edge of the screen has slid halfway off its trigger. `center` is the answer
 * on a page with room, which is most of them.
 *
 * The token names the end of the *bubble* the caret comes out near, which is the corner a
 * stylesheet has to care about - and it is logical, so RTL names the other one.
 *
 * @param {number} at Where the bubble's near edge landed on this axis, in viewport coordinates
 * @param {number} size The bubble's extent on the same axis
 * @param {number} start Trigger's near edge on it
 * @param {number} end Trigger's far edge
 * @param {boolean} rtl Whether this axis runs right to left - the inline one, in RTL
 * @returns {string} `center`, `start` or `end`
 */
export function landedAlign(at, size, start, end, rtl) {
  const off = Math.round(at + size / 2) - Math.round((start + end) / 2);
  if (!off) return 'center';
  return (off > 0) !== rtl ? 'start' : 'end';
}

/**
 * A token list with one token taken back out, or `null` for a list left empty - the shape
 * `removeAttribute` wants to hear.
 *
 * For `aria-describedby` on teardown: the element only ever appended its bubble's `id`, so
 * only that one comes off, and every token the page had written there is kept - order,
 * unknown ids and all.
 *
 * @param {string|null} list
 * @param {string} token
 * @returns {string|null}
 */
export function withoutToken(list, token) {
  const kept = (list || '').split(/\s+/).filter((one) => one && one !== token);
  return kept.length ? kept.join(' ') : null;
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

/** Between the bubble and the edge of the viewport, when the page has not said. The same
 * six as the gap: the bubble keeps the distance from the glass that it keeps from its
 * trigger. */
const FALLBACK_VIEWPORT_MARGIN = 6;

/** A custom property as a number of pixels, with `0` kept apart from "not set": read with
 * `|| fallback`, a page that wrote `0px` would be handed the fallback instead. */
function styleLength(styles, name, fallback) {
  const value = parseFloat(styles.getPropertyValue(name));
  return Number.isNaN(value) ? fallback : value;
}

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
 * **It is all but unreachable by touch, and that is not a bug to work around.** There is no
 * hover on a touch screen and a tap is activation rather than hover, so pointer events from
 * a touch are ignored outright rather than half-handled. Focus is the one way in that is
 * left, and whether a tap moves it is the engine's: Chromium focuses a `<button>` on tap and
 * the bubble opens, WebKit does not focus buttons on tap and nothing appears - measured, not
 * assumed. Focus is deliberately not filtered by how it arrived, because that would take the
 * words away from the readers who do get them; what it means is that nothing essential
 * belongs in one. A control that needs its description read on every device wants visible
 * text, and one that reveals content on a press wants `<disclosure-elemental>`.
 *
 * Activating the trigger - click, Enter, Space - hides the bubble: a used control's tooltip
 * has said its piece, and the focus the click leaves on the button would otherwise hold it
 * open over the neighbour's bubble the pointer goes to next. It is not Escape's held
 * dismissal - hovering away and back, or Tab out and in, shows it again. A tap's click is
 * the one exemption, since on Chromium the tap is how touch opens the bubble at all.
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
 * @cssprop {<length>} [--tooltip-elemental-viewport-margin=6px] - The least the bubble keeps between itself and the edge of the viewport, sliding along its trigger and flipping sides to honour it. `0` lets it kiss the edge again.
 * @cssprop {<length>} [--tooltip-elemental-caret=5px] - Half the caret, since it is drawn as a border.
 * @cssprop {<time>} [--tooltip-elemental-duration=0s] - The fade, in and out. Off by default; `prefers-reduced-motion` keeps it off however high it is turned.
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
    this.wroteBubble = false;
    // Nothing written for it to say, so the last place to look is the attribute the author
    // would have used if this element were not here.
    if (!bubble || bubble === this) {
      if (bubble === this && this.textContent.trim()) {
        // `for` shape: this element is the words.
      } else if (trigger.title) {
        bubble = document.createElement('span');
        bubble.textContent = trigger.title;
        this.appendChild(bubble);
        this.wroteBubble = true;
      } else {
        return;
      }
    }

    const fromTitle = trigger.title && bubble.textContent.trim() === trigger.title.trim();
    // Remembered for teardown: the trigger outlives the element in the `for` shape, and the
    // attribute is its to have back - the native tooltip it stands for included.
    this.removedTitle = fromTitle ? trigger.getAttribute('title') : null;
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

    this.wroteName = names;
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
    this.onClick = this.onClick.bind(this);
    this.reposition = this.reposition.bind(this);

    for (const el of [trigger, bubble]) {
      el.addEventListener('pointerenter', this.onPointer);
      el.addEventListener('pointerleave', this.onPointer);
    }
    trigger.addEventListener('focus', this.onFocus);
    trigger.addEventListener('blur', this.onBlur);
    trigger.addEventListener('click', this.onClick);
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    const trigger = this.triggerElement;
    const bubble = this.bubbleElement;
    for (const el of [trigger, bubble]) {
      el.removeEventListener('pointerenter', this.onPointer);
      el.removeEventListener('pointerleave', this.onPointer);
    }
    trigger.removeEventListener('focus', this.onFocus);
    trigger.removeEventListener('blur', this.onBlur);
    trigger.removeEventListener('click', this.onClick);
    this.stopWatching();
    clearTimeout(this.closeTimer);

    // Everything written on the trigger comes back off, because in the `for` shape it
    // outlives the element: the name this element gave goes, or the description un-points,
    // and the `title` the upgrade took returns with the native tooltip it stood for. The
    // bubble is unhidden and unmarked - a sentence beside the control again, which is what
    // the markup says with no script.
    if (this.wroteName) trigger.removeAttribute('aria-label');
    else {
      const described = withoutToken(trigger.getAttribute('aria-describedby'), bubble.id);
      if (described) trigger.setAttribute('aria-describedby', described);
      else trigger.removeAttribute('aria-describedby');
    }
    if (this.removedTitle !== null) trigger.setAttribute('title', this.removedTitle);
    bubble.hidden = false;
    bubble.removeAttribute('role');
    // Only a bubble this element wrote out of the `title`: one the page authored is its own.
    if (this.wroteBubble) bubble.remove();

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
    // Every focus, however it arrived. Chromium focuses a `<button>` on tap, so this is the
    // one path a touch reader reaches the words by - narrowing it to `:focus-visible` or to a
    // remembered pointer type would take them away from the only engine that offers them.
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

  onClick(e) {
    // Every activation but a tap's. A tap opens the bubble through the focus it gives the
    // trigger - the one way in touch has - and its own click arriving here would take the
    // words back in the same breath. A keyboard's click carries no `pointerType`, and on an
    // engine still raising `click` as a MouseEvent neither does a mouse's; both dismiss,
    // which for the latter is the same answer it would get spelled out.
    if (e.pointerType === 'touch') return;
    this.apply('activate');
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
    const styles = window.getComputedStyle(this.bubbleElement);
    const gap = styleLength(styles, '--tooltip-elemental-gap', FALLBACK_GAP);
    const margin = styleLength(styles, '--tooltip-elemental-viewport-margin', FALLBACK_VIEWPORT_MARGIN);
    const horizontal = this.hasAttribute('horizontal');

    // The gap is spent on the axis the bubble travels along, and only there: counting it on
    // both would refuse a placement that fits by a few pixels sideways. The viewport margin
    // rides along with it, so a side is refused while the bubble's far edge still has
    // breathing room - which is what lands the flipped bubble exactly a margin off the edge.
    const panel = {
      width: bubble.width + (horizontal ? gap + margin : 0),
      height: bubble.height + (horizontal ? 0 : gap + margin)
    };
    // Only the side is taken from these. They answer the alignment too, in the `start` /
    // `end` a menu hangs from the item that opened it with, and a tooltip is centred on its
    // trigger at every width instead - `alignOnAxis` is where that is decided, and the
    // caret is the reason.
    const { side } = horizontal
      ? placeSubmenu(trigger, panel, viewport, rtl)
      : placeFlyout(trigger, panel, viewport, rtl);

    // `side` is logical and these are physical pixels, so the direction decides which edge
    // it names: the inline start is the left in LTR and the right in RTL, which is what the
    // xor says.
    const after = (side === 'inline-end') !== rtl;

    const top = horizontal
      ? alignOnAxis(trigger.top, trigger.bottom, bubble.height, viewport.height, margin)
      : (side === 'block-end' ? trigger.bottom + gap : trigger.top - bubble.height - gap);
    const left = horizontal
      ? (after ? trigger.right + gap : trigger.left - bubble.width - gap)
      : alignOnAxis(trigger.left, trigger.right, bubble.width, viewport.width, margin);

    this.bubbleElement.dataset.side = side;
    // The block axis has no direction to mirror: with `horizontal` the bubble runs down the
    // page, where the start is the top whichever way the text goes.
    this.bubbleElement.dataset.align = horizontal
      ? landedAlign(top, bubble.height, trigger.top, trigger.bottom, false)
      : landedAlign(left, bubble.width, trigger.left, trigger.right, rtl);
    this.bubbleElement.style.top = `${Math.round(top)}px`;
    this.bubbleElement.style.left = `${Math.round(left)}px`;
    this.bubbleElement.style.setProperty(
      '--tooltip-elemental-arrow-offset',
      `${Math.round(arrowOffset(trigger, { left, top, width: bubble.width, height: bubble.height }, horizontal, rtl))}px`
    );
  }
}

define('tooltip-elemental', TooltipElemental);
