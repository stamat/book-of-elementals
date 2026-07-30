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
export class SwitchElemental extends ElementBase {
  // Opts the element into form ownership: `name`, submission, reset and state restore.
  static get formAssociated() {
    return true;
  }

  static get observedAttributes() {
    return ['checked', 'value'];
  }

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
    // `null` rather than an empty string, because an unchecked checkbox does not submit
    // an empty value - it does not appear in the form data at all, and that absence is
    // what every server-side "was this box ticked" check is already written against.
    if (this.internals) this.internals.setFormValue(this.checked ? this.value : null);
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
    this.apply();
    // A new `value` is what the switch would submit, not a change in whether it is on.
    // It still has to reach the form, which `apply` has just done, but there is no
    // toggle to announce.
    if (name === 'value') return;
    this.dispatchEvent(new CustomEvent('switch-toggle', {
      bubbles: true,
      detail: { checked: this.checked }
    }));
  }

  onClick(e) {
    const button = e.target.closest && e.target.closest('button');
    // Not the control means a button beside it, or a nested switch's.
    if (!button || button !== this.button) return;
    this.checked = !this.checked;
  }
}

define('switch-elemental', SwitchElemental);
