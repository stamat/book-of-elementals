import { ElementBase, define } from '../../core.js';

/** Monotonic counter, so a live region has an `id` even where nothing else has one. */
let passwordCount = 0;

/**
 * Whether the field is showing its value after `event`, given whether it was before.
 *
 * Two of these three are about security rather than about the button. A revealed field is an
 * `<input type="text">`, and browsers remember what has been typed into text fields - so a
 * value submitted while revealed can be offered back in an autofill list on some other page
 * later. Masking before the value leaves costs nothing and is the whole of the fix.
 *
 * Reset is the same argument from the other end: the page loaded masked, and putting the
 * value back without putting the mask back would leave a password on screen that the reader
 * never asked to see again.
 *
 * @param {string} event `toggle`, `submit`, `reset`, or anything else.
 * @param {boolean} shown Whether the value is visible now.
 * @returns {boolean} Whether it should be visible after.
 * @example
 * revealAfter('toggle', false) // => true
 * revealAfter('submit', true) // => false, always
 */
export function revealAfter(event, shown) {
  if (event === 'toggle') return !shown;
  if (event === 'submit' || event === 'reset') return false;
  return shown;
}

/**
 * `<password-elemental>` custom element.
 *
 * A password field you can look at, and a button that says so out loud.
 *
 * There is no APG pattern for this, because there is no widget: it is a `<button>` next to an
 * `<input>`, and both are already accessible. What is missing is everything about the
 * *state*. A button that swaps an eye for a crossed-out eye has told a sighted reader which
 * way round it is and told everyone else nothing, and the field it controls has changed from
 * masked to plain with no announcement at all - which is the one change on the page a reader
 * most needs to know about, because it is the one with a shoulder-surfer behind it.
 *
 * What it does, and nothing more: gives the button `aria-pressed` and keeps it in step,
 * flips the field between `password` and `text`, says which in a live region, and masks the
 * field again before the form is submitted or reset. No strength meter, no generator, no
 * confirmation field - see below.
 *
 * `aria-pressed` with a *fixed* name, which is the one place the sources disagree:
 *
 * | Prior art | Button name | State |
 * | --- | --- | --- |
 * | [GOV.UK](https://design-system.service.gov.uk/components/password-input/) | swaps, `Show` ⇄ `Hide` | implied by the name |
 * | [Make Things Accessible](https://www.makethingsaccessible.com/guides/make-an-accessible-password-reveal-input/) | fixed | `aria-pressed` |
 * | [hexagoncircle](https://github.com/hexagoncircle/password-input-components) | swaps | `aria-pressed` - both at once |
 * | this | fixed | `aria-pressed` |
 *
 * The third row is what the second explicitly warns against: with `aria-pressed` carrying the
 * state, a name that also changes says it twice and disagrees with itself half the time. Of
 * the two that are self-consistent, the toggle is the one ARIA is written for - the name is
 * the thing being switched and `pressed` is whether it is on, exactly as a Bold button in an
 * editor works - and it is the one where nothing changes under a reader's focus. The live
 * region is what settles the ambiguity either way, and both sources agree on having one.
 *
 * Light DOM, no shadow root, nothing moved. One node is added: the live region, because a
 * live region only announces text that lands in one already in the document.
 *
 * Degrades honestly: the stylesheet keeps the button out of reach until the element has
 * upgraded, so with no script there is no dead button - just a password field, which is what
 * the page had before and still works. Nothing is taken away before there is something to
 * replace it with.
 *
 * ponytail: no caret to save and restore. Flipping `input.type` keeps focus and the selection
 * range in Chromium and WebKit - measured - so the obvious defensive code would have been
 * fifteen lines guarding against nothing. Pressing the button still moves focus to the
 * button, because that is what pressing a button does; what the preserved selection buys is
 * `el.shown = true` from script leaving the reader's place in the field alone.
 *
 * @tag password-elemental
 * @attr {boolean} [shown=false] - Whether the value is visible. Reflected, so `[shown]` is a styling hook, and settable from script.
 * @attr {string} [label=Show password] - The button's accessible name. Fixed on purpose: `aria-pressed` is what carries the state.
 * @attr {string} [shown-text=Your password is visible] - What the live region says when the value is revealed.
 * @attr {string} [hidden-text=Your password is hidden] - What it says when the mask goes back on.
 *
 * @cssprop {<length>} [--password-elemental-gap=0.5rem] - Between the field and the button.
 *
 * @fires password-reveal - `detail.shown` is whether the value is now visible.
 *
 * @slot - An `<input type="password">` and the `<button>` that reveals it.
 */
export class PasswordElemental extends ElementBase {
  static get observedAttributes() {
    return ['shown'];
  }

  /** The field being revealed: the first password or text input in here. Both, because
   * once it has been revealed the type is what this element changed it to. */
  get control() {
    return this.querySelector('input[type="password"], input[type="text"]');
  }

  /** The button that reveals it. Direct child or not - a reveal button is often inside a
   * wrapper holding it against the field's right edge. */
  get button() {
    return this.querySelector('button');
  }

  /** Whether the value is visible. Reflected, so a page can reveal one from script. */
  get shown() {
    return this.hasAttribute('shown');
  }

  set shown(value) {
    if (value) this.setAttribute('shown', '');
    else this.removeAttribute('shown');
  }

  /** The button's accessible name. Does not change with the state - `aria-pressed` does. */
  get label() {
    return this.getAttribute('label') || 'Show password';
  }

  /** What the live region says once the value is on screen. */
  get shownText() {
    return this.getAttribute('shown-text') || 'Your password is visible';
  }

  /** And once it is not. */
  get hiddenText() {
    return this.getAttribute('hidden-text') || 'Your password is hidden';
  }

  connectedCallback() {
    // Light-DOM children have to be parsed before there is a field to find. The bundle is
    // loaded deferred or at the end of the body, so by upgrade time they are.
    if (this.initialized) return;
    const control = this.control;
    const button = this.button;
    if (!control || !button) return;
    this.initialized = true;

    // A button in a form submits it unless told otherwise, and a reveal button that posts
    // the form away is not a reveal button.
    if (!button.hasAttribute('type')) button.type = 'button';
    button.setAttribute('aria-pressed', this.shown ? 'true' : 'false');
    if (!button.hasAttribute('aria-label') && !button.textContent.trim()) button.setAttribute('aria-label', this.label);
    if (!button.hasAttribute('aria-controls')) {
      if (!control.id) control.id = 'password-elemental-' + (++passwordCount);
      button.setAttribute('aria-controls', control.id);
    }

    if (!this.status) {
      const status = document.createElement('span');
      status.className = 'password-elemental-status';
      // `status` rather than `alert`: the reader pressed the button and is not being
      // interrupted with the answer to their own action. It waits for a gap in what is
      // already being read.
      status.setAttribute('role', 'status');
      this.appendChild(status);
    }

    this.onClick = this.onClick.bind(this);
    this.onForm = this.onForm.bind(this);
    this.addEventListener('click', this.onClick);
    // Masking has to happen before the value leaves, and `submit` is the last moment it can.
    // On the form rather than here, because that is where both events are raised.
    if (control.form) {
      control.form.addEventListener('submit', this.onForm);
      control.form.addEventListener('reset', this.onForm);
    }
    this.render();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('click', this.onClick);
    const control = this.control;
    if (control && control.form) {
      control.form.removeEventListener('submit', this.onForm);
      control.form.removeEventListener('reset', this.onForm);
    }
    clearTimeout(this.announceTimer);
    this.initialized = false;
  }

  attributeChangedCallback() {
    if (this.initialized) this.render();
  }

  /** The live region. Added at upgrade, because a live region only announces text that
   * lands in one already in the document. */
  get status() {
    return this.querySelector(':scope > .password-elemental-status');
  }

  /** Put the field and the button into the state the `shown` attribute says they are in. */
  render() {
    const control = this.control;
    const button = this.button;
    if (!control || !button) return;
    const shown = this.shown;
    // Focus and the selection range survive this in Chromium and WebKit, so there is
    // nothing to save and put back.
    control.type = shown ? 'text' : 'password';
    button.setAttribute('aria-pressed', shown ? 'true' : 'false');
  }

  /**
   * Say something in the live region.
   *
   * A live region announces a *change*, so the same message set twice in a row is silent.
   * Cleared first and set back in a later task, so the two writes cannot coalesce into no
   * change at all.
   */
  announce(message) {
    const status = this.status;
    if (!status) return;
    status.textContent = '';
    clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => { status.textContent = message; }, 0);
  }

  /** Move to the state `event` calls for, and say so if it changed anything. */
  update(event) {
    const was = this.shown;
    const now = revealAfter(event, was);
    if (now === was) return;
    this.shown = now;
    this.render();
    this.announce(now ? this.shownText : this.hiddenText);
    this.dispatchEvent(new CustomEvent('password-reveal', {
      bubbles: true,
      detail: { shown: now }
    }));
  }

  onClick(e) {
    const button = e.target.closest && e.target.closest('button');
    // Not the control means another button beside it - a generator, a copy button.
    if (!button || button !== this.button || button.disabled) return;
    this.update('toggle');
  }

  /**
   * A submit or a reset masks the field.
   *
   * `submit` fires only when the form is really being submitted - a browser that refuses
   * the submit on a constraint never dispatches it, measured in Chromium - so this lands
   * exactly at the moment the value is about to leave the page and at no other. There is
   * no trade to weigh: a reader whose submit was refused keeps the field the way they left
   * it, and nothing was submitted for a browser to remember.
   */
  onForm(e) {
    this.update(e.type);
  }
}

define('password-elemental', PasswordElemental);
