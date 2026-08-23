/**
 * The DOM half: the button's `aria-pressed` and its name, the `aria-controls` tying it to the
 * field, the live region that says which way round it is, and the field's `type` flipping.
 *
 * `index.test.js` pins `revealAfter`, which is the decision. This file is where it lands — and
 * the rule worth having both halves for is that **submitting always masks**: a value posted from
 * an `<input type="text">` is a value the browser remembers and offers back in an autofill list
 * later, on a page that has nothing to do with passwords.
 *
 * Deliberately not covered: what a screen reader does with the live region, which is a screen
 * reader's business — what is checked here is that the text lands in a region that exists, and
 * that the same message twice is written as a change rather than as silence.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <form>
    <password-elemental>
      <input type="password" id="pw" name="password" autocomplete="current-password">
      <button type="button"></button>
    </password-elemental>
  </form>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('password-elemental');
}

const control = (field) => field.querySelector('input');
const button = (field) => field.querySelector('button');
const status = (field) => field.querySelector('.password-elemental-status');

/** The live region is cleared and set back a task later, so the two writes cannot coalesce. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

test('the element upgrades over the field and the button the author wrote', () => {
  const field = mount();
  expect(field.constructor.name).toBe('PasswordElemental');
  expect(button(field).getAttribute('aria-pressed')).toBe('false');
});

test('a button with no type is made a plain one, so a reveal does not post the form away', () => {
  const field = mount(MARKUP.replace('<button type="button">', '<button>'));
  expect(button(field).type).toBe('button');
});

test('a button with nothing in it is given a name, since an unnamed button is announced as nothing', () => {
  const field = mount();
  expect(button(field).getAttribute('aria-label')).toBe('Show password');
});

test('a button the author named keeps its name', () => {
  const withText = mount(MARKUP.replace('<button type="button"></button>', '<button type="button">Prikaži</button>'));
  expect(button(withText).hasAttribute('aria-label')).toBe(false);
  const labelled = mount(MARKUP.replace('<button type="button">', '<button type="button" aria-label="Otkrij lozinku">'));
  expect(button(labelled).getAttribute('aria-label')).toBe('Otkrij lozinku');
});

test('the name does not change with the state, because aria-pressed is what carries it', () => {
  // A name that also changes says the state twice and disagrees with itself half the time.
  const field = mount();
  const name = button(field).getAttribute('aria-label');
  button(field).click();
  expect(button(field).getAttribute('aria-label')).toBe(name);
  expect(button(field).getAttribute('aria-pressed')).toBe('true');
});

test('the label attribute is what says the name in the page\'s own language', () => {
  const field = mount(MARKUP.replace('<password-elemental>', '<password-elemental label="Prikaži lozinku">'));
  expect(button(field).getAttribute('aria-label')).toBe('Prikaži lozinku');
});

test('the button says which field it controls, and a field with no id is given one', () => {
  const field = mount(MARKUP.replace(' id="pw"', ''));
  expect(control(field).id).toMatch(/^password-elemental-/);
  expect(button(field).getAttribute('aria-controls')).toBe(control(field).id);
});

test('an id the page put on the field is used rather than replaced', () => {
  const field = mount();
  expect(control(field).id).toBe('pw');
  expect(button(field).getAttribute('aria-controls')).toBe('pw');
});

test('a press reveals the value, and a second one masks it again', () => {
  const field = mount();
  button(field).click();
  expect(control(field).type).toBe('text');
  expect(field.hasAttribute('shown')).toBe(true);
  expect(button(field).getAttribute('aria-pressed')).toBe('true');

  button(field).click();
  expect(control(field).type).toBe('password');
  expect(field.hasAttribute('shown')).toBe(false);
  expect(button(field).getAttribute('aria-pressed')).toBe('false');
});

test('the state is an attribute, so a page can reveal the field from script', () => {
  const field = mount();
  field.shown = true;
  expect(control(field).type).toBe('text');
  expect(button(field).getAttribute('aria-pressed')).toBe('true');
  field.shown = false;
  expect(control(field).type).toBe('password');
});

test('a field the markup asked to start revealed is revealed on upgrade', () => {
  const field = mount(MARKUP.replace('<password-elemental>', '<password-elemental shown>'));
  expect(control(field).type).toBe('text');
  expect(button(field).getAttribute('aria-pressed')).toBe('true');
});

test('the change is said out loud, in a region that was already in the document', async () => {
  // A live region only announces text that lands in one the reader was already on.
  const field = mount();
  expect(status(field).getAttribute('role')).toBe('status');
  button(field).click();
  await nextTask();
  expect(status(field).textContent).toBe('Your password is visible');
  button(field).click();
  await nextTask();
  expect(status(field).textContent).toBe('Your password is hidden');
});

test('the region is cleared before the message goes back in, so the same message twice still announces', async () => {
  // A live region announces a *change*. Two identical writes in a row coalesce into silence.
  const field = mount();
  button(field).click();
  await nextTask();
  button(field).click();
  await nextTask();
  button(field).click();
  expect(status(field).textContent).toBe('');
  await nextTask();
  expect(status(field).textContent).toBe('Your password is visible');
});

test('what the region says is the page\'s to write', async () => {
  const field = mount(MARKUP.replace('<password-elemental>', '<password-elemental shown-text="Lozinka je vidljiva" hidden-text="Lozinka je skrivena">'));
  button(field).click();
  await nextTask();
  expect(status(field).textContent).toBe('Lozinka je vidljiva');
  button(field).click();
  await nextTask();
  expect(status(field).textContent).toBe('Lozinka je skrivena');
});

test('submitting masks the field, whatever state the reader left it in', () => {
  // A revealed field posts from an `<input type="text">`, and browsers remember what was typed
  // into a text field - so the value comes back in an autofill list on some other page later.
  const field = mount();
  button(field).click();
  expect(control(field).type).toBe('text');
  document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(control(field).type).toBe('password');
  expect(field.hasAttribute('shown')).toBe(false);
});

test('a reset masks it too, because the page loaded masked', () => {
  const field = mount();
  button(field).click();
  document.querySelector('form').reset();
  expect(control(field).type).toBe('password');
});

test('a reveal says so, and a state that did not change says nothing', () => {
  const field = mount();
  const heard = [];
  document.addEventListener('password-reveal', (e) => heard.push(e.detail.shown));
  button(field).click();
  document.querySelector('form').reset();
  // Already masked by the reset: a second reset has nothing to announce.
  document.querySelector('form').reset();
  expect(heard).toEqual([true, false]);
});

test('another button beside the field is not the reveal button', () => {
  // A generator or a copy button sits in the same wrapper and is not this element's to press.
  const field = mount(MARKUP.replace('<button type="button"></button>', '<button type="button"></button><button type="button" id="gen">Generate</button>'));
  document.getElementById('gen').click();
  expect(control(field).type).toBe('password');
});

test('a disabled reveal button does nothing, even for a click the page synthesized', () => {
  // A browser does not send a click to a disabled button, so the guard is there for the click a
  // page dispatches itself - which is the only way this arrives, and the only way to check it.
  const field = mount(MARKUP.replace('<button type="button">', '<button type="button" disabled>'));
  button(field).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(control(field).type).toBe('password');
});

test('an element with no field or no button in it is left alone', () => {
  const noButton = mount('<password-elemental><input type="password"></password-elemental>');
  expect(noButton.querySelector('.password-elemental-status')).toBe(null);
  const noField = mount('<password-elemental><button type="button"></button></password-elemental>');
  expect(noField.querySelector('button').hasAttribute('aria-pressed')).toBe(false);
});

test('an element that has gone stops listening to its button', () => {
  const field = mount();
  const press = button(field);
  field.remove();
  press.click();
  expect(control(field).type).toBe('password');
  expect(field.hasAttribute('shown')).toBe(false);
});

test('an element that has gone stops masking on the form\'s behalf', () => {
  // The form outlives the element. A submit listener left on it is a detached element still
  // reaching into a page it is no longer part of.
  const field = mount();
  button(field).click();
  field.remove();
  document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(control(field).type).toBe('text');
  expect(field.hasAttribute('shown')).toBe(true);
});
