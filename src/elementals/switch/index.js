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
 * this is a `<button>` and not a checkbox: there is no form, nothing to submit, and no
 * third indeterminate state a switch is allowed to have. Put the setting in a form and
 * the platform already has the answer - see below.
 *
 * What it does, and nothing more: marks the button `role="switch"`, keeps `aria-checked`
 * in step with a reflected `checked` attribute on the host, and flips it on click.
 * Enter, Space, focus and the disabled state are the button's, which is the point of
 * using one. There is no animation here at all - the knob slides in CSS, so with no
 * theme imported there is nothing to time.
 *
 * Light DOM, no shadow root, and nothing is moved or wrapped.
 *
 * ponytail: for a switch that lives *in a form*, `<input type="checkbox" role="switch">`
 * is the whole answer - it submits, resets, restores on back-navigation and derives
 * `aria-checked` from `checked` on its own, with no JavaScript whatsoever. This element
 * is for the other case, and deliberately does not grow a form-associated mode.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */
export class SwitchElemental extends ElementBase {
  static get observedAttributes() {
    return ['checked'];
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

  /** Push the current state onto the button. The one thing this element writes. */
  apply() {
    const button = this.button;
    if (button) button.setAttribute('aria-checked', this.checked ? 'true' : 'false');
  }

  /**
   * `checked` is the single source of truth, so everything that changes it - a click,
   * a script, a boot script stamping the saved preference - lands here and nowhere else.
   */
  attributeChangedCallback(name, previous, current) {
    if (!this.initialized || previous === current) return;
    this.apply();
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
