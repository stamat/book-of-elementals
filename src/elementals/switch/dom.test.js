/**
 * The wiring: the role and `aria-checked` on the button, the flip, the seeded state a theme
 * toggle needs before first paint, and the form callbacks the platform hands a form-associated
 * element.
 *
 * `index.test.js` pins `formValue`, `validityState` and `seedChecked`, which are the decisions.
 * This file is where they land — and the one worth both halves is the seed: a theme switch
 * painted off over an already-dark page and sliding across a moment later is the failure the
 * `checked-if` attribute exists to prevent, and only the element can get that wrong.
 *
 * Deliberately not covered: submission, validation and restore against a real form. jsdom hands
 * out an `ElementInternals` with none of the form-associated half on it — no `setFormValue`, no
 * `setValidity` — so there is nothing here to submit to. What *is* covered is that the element
 * stays a working switch in exactly that environment, which is the same shape as a browser
 * without `attachInternals`. The knob and its slide are CSS, and belong to the docs page.
 *
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';

import './index.js';

const MARKUP = `
  <form>
    <span id="dark-label">Dark mode</span>
    <switch-elemental>
      <button aria-labelledby="dark-label" type="button"></button>
    </switch-elemental>
  </form>`;

function mount (markup = MARKUP) {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = markup;
  return document.querySelector('switch-elemental');
}

const button = (toggle) => toggle.querySelector(':scope > button');

test('the element upgrades over the button the author wrote and makes it a switch', () => {
  const toggle = mount();
  expect(toggle.constructor.name).toBe('SwitchElemental');
  expect(button(toggle).getAttribute('role')).toBe('switch');
  expect(button(toggle).getAttribute('aria-checked')).toBe('false');
});

test('a button with no type is made a plain one, so a setting does not post the page away', () => {
  const toggle = mount(MARKUP.replace('<button aria-labelledby="dark-label" type="button">', '<button aria-labelledby="dark-label">'));
  expect(button(toggle).type).toBe('button');
});

test('a switch the markup turned on says so from the start', () => {
  const toggle = mount(MARKUP.replace('<switch-elemental>', '<switch-elemental checked>'));
  expect(button(toggle).getAttribute('aria-checked')).toBe('true');
});

test('a press flips it, and the button says which way round it is', () => {
  const toggle = mount();
  button(toggle).click();
  expect(toggle.checked).toBe(true);
  expect(button(toggle).getAttribute('aria-checked')).toBe('true');
  button(toggle).click();
  expect(toggle.checked).toBe(false);
  expect(button(toggle).getAttribute('aria-checked')).toBe('false');
});

test('the state is a reflected attribute, so markup, script and CSS all read the same thing', () => {
  const toggle = mount();
  toggle.checked = true;
  expect(toggle.hasAttribute('checked')).toBe(true);
  expect(button(toggle).getAttribute('aria-checked')).toBe('true');
  toggle.removeAttribute('checked');
  expect(button(toggle).getAttribute('aria-checked')).toBe('false');
});

test('a flip says so, and it says which way', () => {
  const toggle = mount();
  const heard = [];
  document.addEventListener('switch-toggle', (e) => heard.push(e.detail.checked));
  button(toggle).click();
  button(toggle).click();
  expect(heard).toEqual([true, false]);
});

test('the state a switch arrives in is not a flip, so nothing is announced at boot', () => {
  // A page that hears `switch-toggle` at boot is a page that writes the theme back out before
  // anyone has touched anything. The condition matches here, so the seed really does turn the
  // switch on - and still says nothing.
  const heard = [];
  document.addEventListener('switch-toggle', () => heard.push(true));
  document.documentElement.setAttribute('data-theme', 'dark');
  document.body.innerHTML = MARKUP.replace('<switch-elemental>', '<switch-elemental checked-if="[data-theme=dark]">');
  expect(document.querySelector('switch-elemental').checked).toBe(true);
  expect(heard).toEqual([]);
});

test('a new value or a new required is not a flip either', () => {
  const toggle = mount();
  const heard = [];
  document.addEventListener('switch-toggle', () => heard.push(true));
  toggle.value = 'yes';
  toggle.required = true;
  toggle.requiredMessage = 'Switch it on';
  expect(heard).toEqual([]);
});

test('checked-if starts the switch on when the document already says so', () => {
  // The theme is stamped on the root before first paint. Without this the switch is painted off
  // over an already-dark page and slides across when a later script catches up.
  document.documentElement.setAttribute('data-theme', 'dark');
  document.body.innerHTML = MARKUP.replace('<switch-elemental>', '<switch-elemental checked-if="[data-theme=dark]">');
  const toggle = document.querySelector('switch-elemental');
  expect(toggle.checked).toBe(true);
  expect(button(toggle).getAttribute('aria-checked')).toBe('true');
});

test('checked-if that does not match leaves the switch off', () => {
  const toggle = mount(MARKUP.replace('<switch-elemental>', '<switch-elemental checked-if="[data-theme=dark]">'));
  expect(toggle.checked).toBe(false);
});

test('checked-if is asked only of the root, so a condition naming something further down never matches', () => {
  const toggle = mount(MARKUP.replace('<switch-elemental>', '<switch-elemental checked-if="#dark-label">'));
  expect(toggle.checked).toBe(false);
});

test('a selector the browser cannot parse leaves the markup\'s own state standing', () => {
  // By upgrade there is a visible button. An exception out of `connectedCallback` leaves it
  // sitting there with no `role` on it - a switch that stopped being a switch because of a typo.
  jest.useFakeTimers();
  try {
    const toggle = mount(MARKUP.replace('<switch-elemental>', '<switch-elemental checked checked-if="[[[">'));
    expect(toggle.checked).toBe(true);
    expect(button(toggle).getAttribute('role')).toBe('switch');
    // Reported, not swallowed: a condition that quietly never matches is the kind of bug you
    // look for everywhere else first.
    expect(() => jest.advanceTimersByTime(0)).toThrow();
  } finally {
    jest.useRealTimers();
  }
});

test('the element\'s own disabled attribute disables the button and stops the flip', () => {
  const toggle = mount(MARKUP.replace('<switch-elemental>', '<switch-elemental disabled>'));
  expect(button(toggle).disabled).toBe(true);
  button(toggle).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(toggle.checked).toBe(false);
});

test('disabling from script disables the button, and enabling gives it back', () => {
  const toggle = mount();
  toggle.disabled = true;
  expect(button(toggle).disabled).toBe(true);
  toggle.disabled = false;
  expect(button(toggle).disabled).toBe(false);
});

test('a button the markup disabled stays disabled when the element is enabled again', () => {
  // A fieldset re-enabling everything below it must not quietly enable a button that was never
  // meant to be.
  const toggle = mount(MARKUP.replace('type="button">', 'type="button" disabled>'));
  toggle.formDisabledCallback(true);
  expect(button(toggle).disabled).toBe(true);
  toggle.formDisabledCallback(false);
  expect(button(toggle).disabled).toBe(true);
});

test('a reset goes back to the state the markup arrived in, not to the last flip', () => {
  // `checked` here is the live state, so what the markup arrived in has to be remembered
  // separately or it is gone the first time anyone flips the switch.
  const toggle = mount(MARKUP.replace('<switch-elemental>', '<switch-elemental checked>'));
  button(toggle).click();
  expect(toggle.checked).toBe(false);
  toggle.formResetCallback();
  expect(toggle.checked).toBe(true);
  expect(button(toggle).getAttribute('aria-checked')).toBe('true');
});

test('a restore reads off what was submitted: nothing coming back is off', () => {
  const toggle = mount();
  toggle.formStateRestoreCallback('on');
  expect(toggle.checked).toBe(true);
  toggle.formStateRestoreCallback(null);
  expect(toggle.checked).toBe(false);
});

test('a button beside the switch, or one nested inside it, is not the control', () => {
  // The nested one is written first, so a search that is not scoped to a direct child finds it.
  const toggle = mount(`
    <switch-elemental>
      <span><button type="button" id="inner">Reset</button></span>
      <button type="button"></button>
    </switch-elemental>`);
  document.getElementById('inner').click();
  expect(toggle.checked).toBe(false);
  button(toggle).click();
  expect(toggle.checked).toBe(true);
});

test('an element with no button in it is left alone', () => {
  const toggle = mount('<switch-elemental></switch-elemental>');
  expect(toggle.querySelector('[role="switch"]')).toBe(null);
});

test('the role and aria-checked stay when the element goes, since an inert switch is still honest', () => {
  const toggle = mount();
  const control = button(toggle);
  toggle.remove();
  expect(control.getAttribute('role')).toBe('switch');
  expect(control.getAttribute('aria-checked')).toBe('false');
});

test('an element that has gone stops flipping', () => {
  const toggle = mount();
  const control = button(toggle);
  toggle.remove();
  control.click();
  expect(toggle.checked).toBe(false);
});

test('a platform with no form half of ElementInternals still gets a working switch', () => {
  // jsdom is exactly that environment, and so is any browser without `attachInternals`. The
  // switch has no value for a form to check, so it validates - it does not throw.
  const toggle = mount(MARKUP.replace('<switch-elemental>', '<switch-elemental name="theme" required>'));
  expect(() => toggle.checkValidity()).not.toThrow();
  expect(() => toggle.reportValidity()).not.toThrow();
  expect(() => toggle.setCustomValidity('Switch it on')).not.toThrow();
  expect(toggle.validationMessage).toBe('');
  expect(toggle.willValidate).toBe(false);
  button(toggle).click();
  expect(toggle.checked).toBe(true);
});
