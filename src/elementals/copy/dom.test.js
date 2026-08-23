/**
 * The half after the click: the clipboard write, the `data-state` CSS reads, the live region that
 * says the same thing to the reader who cannot see an icon change, and the two ways this element
 * refuses to be a button that lies.
 *
 * `index.test.js` pins `sourceText`, which decides what goes on the clipboard. This file is what
 * happens to it — including the part the element exists for, which is that a swapped icon is not
 * an announcement.
 *
 * jsdom has no `navigator.clipboard`, which is the same shape as the plain-`http` page the
 * element degrades for — so the absence is tested as itself, and a stub stands in for the rest.
 * What a screen reader does with the live region is a screen reader's business; what is checked
 * here is that the text lands in a region that exists, and is taken back down again.
 *
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';

import './index.js';

const MARKUP = `
  <copy-elemental for="source">
    <button type="button">Copy</button>
  </copy-elemental>
  <pre id="source">npm i book-of-elementals</pre>`;

/** How long the copied state stays up, per the element. */
const FEEDBACK_MS = 2000;

let written;

/** The clipboard the element asks for. `writes` is what it was given; `refuse` is a clipboard
 * that says no, which is a page that is not the active document or a policy saying so. */
function clipboard ({ refuse = false } = {}) {
  written = [];
  const writeText = (text) => {
    written.push(text);
    return refuse ? Promise.reject(new Error('denied')) : Promise.resolve();
  };
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

function noClipboard () {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
}

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('copy-elemental');
}

const button = (copy) => copy.querySelector('button');
const status = (copy) => copy.querySelector('.copy-elemental-status');

/** Let the clipboard promise settle, then let the announce timer fire. */
async function settle () {
  await Promise.resolve();
  await Promise.resolve();
  jest.advanceTimersByTime(0);
}

beforeEach(() => {
  jest.useFakeTimers();
  clipboard();
});

afterEach(() => {
  jest.useRealTimers();
});

test('the element upgrades over the button the author wrote and adds a live region to it', () => {
  const copy = mount();
  expect(copy.constructor.name).toBe('CopyElemental');
  expect(status(copy).getAttribute('role')).toBe('status');
  expect(copy.dataset.unavailable).toBeUndefined();
});

test('a button with no type is made a plain one, so a copy does not post the page away', () => {
  const copy = mount(MARKUP.replace('<button type="button">', '<button>'));
  expect(button(copy).type).toBe('button');
});

test('a press puts what `for` names on the clipboard', async () => {
  const copy = mount();
  button(copy).click();
  await settle();
  expect(written).toEqual(['npm i book-of-elementals']);
});

test('a press says it landed, on screen and out loud', async () => {
  // Every copy button swaps an icon, and a swapped icon tells a screen reader nothing at all.
  // That gap is what this element is.
  const copy = mount();
  button(copy).click();
  await settle();
  expect(copy.dataset.state).toBe('copied');
  expect(status(copy).textContent).toBe('Copied');
});

test('both go quiet again, rather than leaving a line a reader meets later with nothing behind it', async () => {
  const copy = mount();
  button(copy).click();
  await settle();
  jest.advanceTimersByTime(FEEDBACK_MS);
  expect(copy.dataset.state).toBeUndefined();
  expect(status(copy).textContent).toBe('');
});

test('the region is cleared before the message goes back in, so a second copy still announces', async () => {
  // A live region announces a *change*. Two identical writes in a row coalesce into silence,
  // which would make every copy after the first one say nothing.
  const copy = mount();
  button(copy).click();
  await settle();
  expect(status(copy).textContent).toBe('Copied');
  button(copy).click();
  await Promise.resolve();
  await Promise.resolve();
  expect(status(copy).textContent).toBe('');
  jest.advanceTimersByTime(0);
  expect(status(copy).textContent).toBe('Copied');
});

test('a press says what happened, and what went on the clipboard', async () => {
  const copy = mount();
  const done = [];
  document.addEventListener('copy-done', (e) => done.push(e.detail));
  button(copy).click();
  await settle();
  expect(done).toEqual([{ ok: true, text: 'npm i book-of-elementals' }]);
});

test('value wins over `for`, and is copied exactly as it was written', async () => {
  const copy = mount(MARKUP.replace('for="source"', 'for="source" value="  spaced  "'));
  button(copy).click();
  await settle();
  expect(written).toEqual(['  spaced  ']);
});

test('value set from script is what the next press copies', async () => {
  const copy = mount();
  copy.value = 'https://example.test/#anchor';
  button(copy).click();
  await settle();
  expect(written).toEqual(['https://example.test/#anchor']);
});

test('a `for` pointing at nothing is a failure, not an empty clipboard', async () => {
  // Writing an empty string would clear whatever the reader already had, and report it as a
  // success.
  const copy = mount(MARKUP.replace('for="source"', 'for="gone"'));
  button(copy).click();
  await settle();
  expect(written).toEqual([]);
  expect(copy.dataset.state).toBe('error');
  expect(status(copy).textContent).toBe('Copy failed');
});

test('an empty value is an author saying there is nothing to copy, and is reported as such', async () => {
  const copy = mount(MARKUP.replace('for="source"', 'value=""'));
  button(copy).click();
  await settle();
  expect(written).toEqual([]);
  expect(copy.dataset.state).toBe('error');
});

test('a clipboard that refuses is a failure the reader is told about', async () => {
  // A page that is not the active document, a permission policy, a browser that wants the write
  // closer to the gesture than a promise allows.
  clipboard({ refuse: true });
  const copy = mount();
  button(copy).click();
  await settle();
  expect(copy.dataset.state).toBe('error');
  expect(status(copy).textContent).toBe('Copy failed');
});

test('what the region says is the page\'s to write', async () => {
  const copy = mount(MARKUP.replace('for="source"', 'for="gone" copied-text="Kopirano" error-text="Kopiranje nije uspelo"'));
  button(copy).click();
  await settle();
  expect(status(copy).textContent).toBe('Kopiranje nije uspelo');
});

test('a target re-rendered since the last press is the one copied, because it is resolved each time', async () => {
  const copy = mount();
  button(copy).click();
  await settle();
  document.getElementById('source').replaceWith(Object.assign(document.createElement('pre'), { id: 'source', textContent: 'npm i poops' }));
  button(copy).click();
  await settle();
  expect(written).toEqual(['npm i book-of-elementals', 'npm i poops']);
});

test('a page with no clipboard API gets no button rather than a dead one', () => {
  // `navigator.clipboard` is absent over plain `http`, and a copy button that cannot copy is a
  // button that lies. The stylesheet keeps it out of reach on this attribute.
  noClipboard();
  const copy = mount();
  expect(copy.dataset.unavailable).toBe('');
  expect(status(copy)).toBe(null);
  button(copy).click();
  expect(copy.dataset.state).toBeUndefined();
});

test('an element naming nothing to copy is the same refusal', () => {
  const copy = mount(MARKUP.replace('for="source"', ''));
  expect(copy.dataset.unavailable).toBe('');
  expect(status(copy)).toBe(null);
});

test('data-for is read as `for` is, for a page whose framework claims the attribute', () => {
  const copy = mount(MARKUP.replace('for="source"', 'data-for="source"'));
  expect(copy.dataset.unavailable).toBeUndefined();
});

test('the refusal is lifted when the element is connected somewhere it can copy', () => {
  noClipboard();
  const copy = mount();
  expect(copy.dataset.unavailable).toBe('');
  clipboard();
  copy.remove();
  document.body.append(copy);
  expect(copy.dataset.unavailable).toBeUndefined();
  expect(status(copy).getAttribute('role')).toBe('status');
});

test('the trigger is the element\'s own button, not one nested inside it', async () => {
  // A button in an icon wrapper, in a second copy button below, or in the block being copied.
  // The nested one is written first, so a search that is not scoped to a direct child finds it.
  const copy = mount(`
    <copy-elemental for="source">
      <span><button type="button" id="inner">Run</button></span>
      <button type="button">Copy</button>
    </copy-elemental>
    <pre id="source">npm i book-of-elementals</pre>`);
  document.getElementById('inner').click();
  await settle();
  expect(written).toEqual([]);
  expect(copy.dataset.state).toBeUndefined();

  copy.querySelector(':scope > button').click();
  await settle();
  expect(written).toEqual(['npm i book-of-elementals']);
});

test('a disabled button does nothing, even for a click the page synthesized', async () => {
  const copy = mount(MARKUP.replace('<button type="button">', '<button type="button" disabled>'));
  button(copy).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await settle();
  expect(written).toEqual([]);
});

test('an element with no button in it is left alone', () => {
  const copy = mount('<copy-elemental for="source"></copy-elemental><pre id="source">x</pre>');
  expect(copy.querySelector('.copy-elemental-status')).toBe(null);
  expect(copy.dataset.unavailable).toBeUndefined();
});

test('an element that has gone stops copying, and its timers go with it', async () => {
  const copy = mount();
  const press = button(copy);
  press.click();
  await settle();
  copy.remove();
  press.click();
  await settle();
  expect(written).toEqual(['npm i book-of-elementals']);
  jest.advanceTimersByTime(FEEDBACK_MS);
  // The reset timer was cancelled with the element, so the state it left is the state it left.
  expect(copy.dataset.state).toBe('copied');
});
