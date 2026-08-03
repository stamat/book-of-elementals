import { ElementBase, define } from '../../core.js';

/**
 * `<switch-elemental>` custom element.
 *
 * A real `<button>` turned into an on/off switch, per the
 * [APG Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).
 *
 * A switch and a checkbox are the same boolean wearing different promises. A checkbox
 * is a value you are *about to submit*; a switch is a setting that takes effect the
 * moment you flip it - a theme toggle, a mute, an autoplay preference. Which is why
 * this is a `<button>` and not a checkbox: pressing it *is* the action, and there is no
 * third indeterminate state a switch is allowed to have. That the setting also has to be
 * submitted somewhere does not change what it is, so it submits too - see below.
 *
 * What it does, and nothing more: marks the button `role="switch"`, keeps `aria-checked`
 * in step with a reflected `checked` attribute on the host, and flips it on click.
 * Enter, Space, focus and the disabled state are the button's, which is the point of
 * using one. There is no animation here at all - the knob slides in CSS, so with no
 * theme imported there is nothing to time.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped.
 *
 * Give it a `name` and it submits with its form, exactly as a checkbox does - the value
 * when on, nothing at all when off - and resets and restores with it too. That is
 * `ElementInternals` rather than a hidden `<input>` mirroring the state: a second node
 * holding the same boolean is a second node that can disagree with the first, and it
 * would still leave `reset` and back-navigation to be hand-written. The platform owns
 * all three here, and there is nothing to keep in step.
 *
 * ponytail: being in a form is not what picks the control - a switch in a form is still
 * this element. Two specific things send you to `<input type="checkbox" role="switch">`
 * instead: it needs no JavaScript at all, so it survives scripting being off, and being a
 * real form control it can be labelled by a `<label>`. Neither is reachable from here, and
 * neither is worth growing this element to fake.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */
/**
 * What a form takes from the switch: the value when it is on, and nothing at all when it
 * is off or disabled. `null` rather than an empty string, because an unchecked checkbox
 * does not submit an empty value - it does not appear in the form data at all, and that
 * absence is what every server-side "was this box ticked" check is already written
 * against. A disabled control submits nothing either, which is the platform's rule for
 * every other form control and has to be honoured by hand here.
 */
export function formValue(checked, disabled, value) {
  return checked && !disabled ? value : null;
}

/**
 * The validity a switch can have, which is one thing: a required switch has to be on.
 * A custom message wins, as it does on a native control - it is the author saying the
 * value is wrong for a reason the browser cannot know.
 */
export function validityState(required, checked, customMessage, missingMessage) {
  if (customMessage) return { flags: { customError: true }, message: customMessage };
  if (required && !checked) return { flags: { valueMissing: true }, message: missingMessage };
  return { flags: {}, message: '' };
}

let borrowed;

/**
 * What a required switch says while it is off, when nobody has said otherwise.
 *
 * `setValidity` throws on an empty message, and a form-associated custom element gets no
 * platform default to ask for - so the nearest true thing is borrowed: the browser's own
 * message for a required checkbox, which arrives already translated into the reader's
 * language. It says "box" rather than "switch", and a reader given the right language
 * with the wrong noun is better served than one given English. Read once and kept.
 */
export function borrowedValueMissingMessage() {
  if (borrowed === undefined) {
    let message = '';
    if (typeof document !== 'undefined') {
      const probe = document.createElement('input');
      probe.type = 'checkbox';
      probe.required = true;
      message = probe.validationMessage;
    }
    borrowed = message || 'Please switch this on.';
  }
  return borrowed;
}

/**
 * A real `<button>` turned into an on/off switch, per the APG Switch pattern. Submits
 * with its form when given a `name`. The prose above is the whole story; these tags are
 * the same API in the form a machine can read - `custom-elements.json` is generated from
 * them, and the docs tables, editor autocomplete and the live options panel in the docs
 * all come out of that one file rather than out of four hand-kept copies.
 *
 * Curated by omission: `--switch-elemental-inset`, `--switch-elemental-knob-size` and
 * `--switch-elemental-travel` are `calc()`-derived from the four geometry properties and
 * are deliberately not tagged. Setting them by hand is how a knob ends up overshooting
 * its own track, and anything tagged here is something a reader is being invited to turn.
 *
 * @tag switch-elemental
 * @attr {boolean} [checked=false] - Whether it is on. Reflected, so markup, script and CSS read the same thing.
 * @attr {string} name - Submits under this name. No name, no form data.
 * @attr {string} [value=on] - What it submits while on.
 * @attr {boolean} [disabled=false] - Disables the button and submits nothing. A `<fieldset disabled>` does the same.
 * @attr {boolean} [required=false] - The form will not submit while it is off.
 * @attr {string} required-message - What this one says while it is required and off.
 *
 * @cssprop {<length>} [--switch-elemental-width=3.625rem] - Track width.
 * @cssprop {<length>} [--switch-elemental-height=2rem] - Track height.
 * @cssprop {<length>} [--switch-elemental-radius=var(--switch-elemental-height)] - Track corners. The height is a pill.
 * @cssprop {<length>} [--switch-elemental-border-width=2px] - Track border width.
 * @cssprop {<color>} [--switch-elemental-border-color=currentcolor] - Track border, off.
 * @cssprop {<color>} [--switch-elemental-border-color-checked=var(--switch-elemental-border-color)] - Track border, on.
 * @cssprop {<length>} [--switch-elemental-gap=2px] - Between the knob and the inside of the track.
 * @cssprop {<color>} [--switch-elemental-track=transparent] - Track fill, off.
 * @cssprop {<color>} [--switch-elemental-track-checked=currentcolor] - Track fill, on.
 * @cssprop {<color>} [--switch-elemental-knob=currentcolor] - Knob fill, off.
 * @cssprop {<color>} [--switch-elemental-knob-checked=Canvas] - Knob fill, on. The page's own background, so re-point it on a card.
 * @cssprop {<length-percentage>} [--switch-elemental-knob-radius=50%] - Knob shape. `50%` is a circle, `0` a square.
 * @cssprop {<time>} [--switch-elemental-duration=250ms] - Slide and cross-fade.
 * @cssprop {ease | ease-in | ease-out | ease-in-out | linear} [--switch-elemental-easing=ease-in-out] - Slide and cross-fade.
 *
 * @fires switch-toggle - `detail.checked` is the new state. Fires on flip, not on `value` or `required` changing.
 *
 * @slot - The `<button>` that flips, and optionally a `.switch-elemental-on` and a `.switch-elemental-off` icon inside it.
 */
export class SwitchElemental extends ElementBase {
  // Opts the element into form ownership: `name`, submission, reset, state restore,
  // validation and the disabled state a `<fieldset disabled>` hands down.
  static get formAssociated() {
    return true;
  }

  static get observedAttributes() {
    return ['checked', 'value', 'disabled', 'required', 'required-message'];
  }

  /**
   * The page-wide default for what a required switch says while it is off. `null` means
   * the browser's own translated message is used, which is the right answer until a page
   * has a reason of its own - one line at boot changes every switch on it.
   */
  static requiredMessage = null;

  constructor() {
    super();
    // Guarded because `attachInternals` is the one part of this element that is not
    // everywhere - Safari only got it in 16.4 - and because `ElementBase` is a plain
    // class under Node. Without it the switch is simply a switch that does not submit,
    // which is what it was before it had a name to submit under.
    if (typeof this.attachInternals === 'function') this.internals = this.attachInternals();
  }

  /** The `<button>` that flips. Direct child, so a button in a label beside it - or
   * in a second switch nested somewhere below - is not mistaken for the control. */
  get button() {
    return this.querySelector(':scope > button');
  }

  /** Whether the switch is on. Reflected, so `[checked]` is a styling hook too. */
  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(value) {
    this.toggleAttribute('checked', !!value);
  }

  /**
   * Disabled by its own attribute, or by a `<fieldset disabled>` somewhere above it -
   * which the button already answers for, since `:disabled` matches a button inside a
   * disabled fieldset whether or not it carries the attribute itself.
   */
  get disabled() {
    const button = this.button;
    return this.hasAttribute('disabled') || !!(button && button.matches(':disabled'));
  }

  set disabled(value) {
    this.toggleAttribute('disabled', !!value);
  }

  /** Whether the form refuses to submit while this is off. */
  get required() {
    return this.hasAttribute('required');
  }

  set required(value) {
    this.toggleAttribute('required', !!value);
  }

  /**
   * What this switch says while it is required and off, in three steps: its own
   * `required-message`, then whatever the page put on `SwitchElemental.requiredMessage`,
   * then the browser's own translated one. One switch, one page, or every language.
   */
  get requiredMessage() {
    return this.getAttribute('required-message')
      || this.constructor.requiredMessage
      || borrowedValueMissingMessage();
  }

  set requiredMessage(value) {
    this.setAttribute('required-message', value);
  }

  // The rest of the constraint API is the platform's, read straight off the internals so
  // there is no second copy of the state to disagree with it. Without `attachInternals`
  // there is no validation either, and a switch that always validates is the honest
  // answer there - the form it is in has no value from it to check in the first place.
  get validity() {
    return this.internals && this.internals.validity;
  }

  get validationMessage() {
    return this.internals ? this.internals.validationMessage : '';
  }

  get willValidate() {
    return this.internals ? this.internals.willValidate : false;
  }

  checkValidity() {
    return this.internals ? this.internals.checkValidity() : true;
  }

  reportValidity() {
    return this.internals ? this.internals.reportValidity() : true;
  }

  /** Your own message, for the constraint the browser cannot know about. `''` clears it. */
  setCustomValidity(message) {
    this.customMessage = message || '';
    this.validate();
  }

  /**
   * Push the current constraint onto the form. The button is the anchor, so the
   * browser's own bubble points at the control the reader has to flip - and not at an
   * element that is `display: contents` and has no box to point at.
   */
  validate() {
    if (!this.internals || !this.internals.setValidity) return;
    const { flags, message } = validityState(this.required, this.checked, this.customMessage, this.requiredMessage);
    this.internals.setValidity(flags, message, this.button || undefined);
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded
    // deferred or at the end of the body, so by upgrade time the button is there.
    if (this.initialized) return;
    const button = this.button;
    if (!button) return;
    this.initialized = true;

    // A button in a form submits it unless told otherwise, and a setting that posts
    // the page away on its first flip is not a setting.
    if (!button.hasAttribute('type')) button.type = 'button';
    button.setAttribute('role', 'switch');

    // What a form reset goes back to. A native checkbox keeps this as the `checked`
    // content attribute and the live state as the IDL property; here `checked` is the
    // live state - reflected, so markup, script and CSS all read the same thing - so the
    // state the markup arrived in has to be remembered separately or it is gone the
    // first time anyone flips the switch.
    this.defaultChecked = this.checked;
    // Whether the markup disabled the button on its own, so a fieldset re-enabling
    // everything below it does not quietly enable a button that was never meant to be.
    this.buttonDisabled = button.hasAttribute('disabled');
    if (this.hasAttribute('disabled')) button.disabled = true;

    this.onClick = this.onClick.bind(this);
    this.addEventListener('click', this.onClick);

    this.apply();
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('click', this.onClick);
    // The role and `aria-checked` stay: unlike a hidden region, a button left with
    // them is still an honest, if inert, switch - and the element is usually taken
    // out of the document along with it.
    this.initialized = false;
  }

  /** What the form submits when the switch is on. `on`, as a checkbox's is. */
  get value() {
    const value = this.getAttribute('value');
    return value === null ? 'on' : value;
  }

  set value(value) {
    this.setAttribute('value', value);
  }

  /** Push the current state onto the button, and onto the form if there is one. */
  apply() {
    const button = this.button;
    if (button) button.setAttribute('aria-checked', this.checked ? 'true' : 'false');
    // Same guard as `validate()` below, and for the same reason: `attachInternals` exists in
    // environments where the form-associated half of `ElementInternals` does not. jsdom is
    // the one that matters - it returns an internals object with no `setFormValue` on it, so
    // an unguarded call throws inside `customElements.define` and takes down every test in a
    // consumer's suite, form or no form.
    if (this.internals && this.internals.setFormValue) {
      this.internals.setFormValue(formValue(this.checked, this.disabled, this.value));
    }
    this.validate();
  }

  /**
   * The element's own `disabled` attribute, or a `<fieldset disabled>` above it. The
   * button is disabled with it, because a switch that takes focus and then does nothing
   * is worse than one that is plainly out of reach - and the form value goes with it.
   */
  formDisabledCallback(disabled) {
    const button = this.button;
    if (button) button.disabled = disabled || this.buttonDisabled;
    this.apply();
  }

  /** The form is putting its controls back to the state the markup arrived in. */
  formResetCallback() {
    this.checked = this.defaultChecked;
  }

  /**
   * The browser is restoring this control after a back-navigation or a session restore,
   * with whatever `setFormValue` last put in. Off submitted nothing, so nothing coming
   * back is off.
   */
  formStateRestoreCallback(state) {
    this.checked = state !== null;
  }

  /**
   * `checked` is the single source of truth, so everything that changes it - a click,
   * a script, a boot script stamping the saved preference - lands here and nowhere else.
   */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    // `formDisabledCallback` is the platform's, and only arrives where `attachInternals`
    // does; routing the attribute through it means the same one place handles both.
    if (name === 'disabled') {
      this.formDisabledCallback(current !== null);
      return;
    }
    this.apply();
    // A new `value` is what the switch would submit, and `required` and its message are
    // what the form makes of it being off - none of them is a change in whether it is
    // on. All three have to reach the form, which `apply` has just done, but there is no
    // toggle to announce.
    if (name !== 'checked') return;
    this.dispatchEvent(new CustomEvent('switch-toggle', {
      bubbles: true,
      detail: { checked: this.checked }
    }));
  }

  onClick(e) {
    const button = e.target.closest && e.target.closest('button');
    // Not the control means a button beside it, or a nested switch's.
    if (!button || button !== this.button || this.disabled) return;
    this.checked = !this.checked;
  }
}

define('switch-elemental', SwitchElemental);
