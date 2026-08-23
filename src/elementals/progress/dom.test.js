/**
 * What this element writes, which is the whole of what it does: the fill percentage, the buffer
 * beside it, and `data-indeterminate` where there is no percentage to write.
 *
 * `index.test.js` pins `percent`. This file is the wiring around it — and the part worth having
 * both halves for is the observer: `<progress>` fires no event of its own, so an element that
 * only read the bar at upgrade would draw the first frame of a download and then nothing.
 *
 * Deliberately not covered: the bar itself, which is CSS reading these properties, and belongs to
 * the docs page.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <progress-elemental>
    <progress id="upload" value="35" max="100">35%</progress>
  </progress-elemental>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('progress-elemental');
}

const read = (bar, name) => bar.style.getPropertyValue(`--progress-elemental-${name}`);
/** A MutationObserver callback is a microtask; nothing it does has happened on the line after. */
const settled = () => Promise.resolve();

test('the element upgrades over the native bar the author wrote and says how far along it is', () => {
  const bar = mount();
  expect(bar.constructor.name).toBe('ProgressElemental');
  expect(read(bar, 'value')).toBe('35%');
});

test('nothing is moved, wrapped or given a role - the child stays a native progress', () => {
  // `role="progressbar"`, `max`, the indeterminate state and the name a `<label>` gives it are
  // all the platform's here. Rewriting any of them could only be a worse copy.
  const bar = mount();
  expect(bar.querySelector('progress').tagName).toBe('PROGRESS');
  expect(bar.querySelector('[role]')).toBe(null);
  expect(bar.querySelector('[aria-valuenow]')).toBe(null);
});

test('the percentage is of the bar\'s own max, not of a hundred', () => {
  const bar = mount(MARKUP.replace('value="35" max="100"', 'value="1" max="4"'));
  expect(read(bar, 'value')).toBe('25%');
});

test('a whole percentage is written whole, because this number is read in the DOM', () => {
  const bar = mount(MARKUP.replace('value="35"', 'value="55"'));
  expect(read(bar, 'value')).toBe('55%');
});

test('a bar moved by script is followed, which is the one thing progress announces no other way', async () => {
  // `<progress>` fires no event, and `value` is a reflecting IDL attribute - so `progress.value
  // = 40` writes `value="40"` and the observer is what hears it.
  const bar = mount();
  bar.querySelector('progress').value = 40;
  await settled();
  expect(read(bar, 'value')).toBe('40%');
});

test('a bar moved by setAttribute is followed the same way', async () => {
  const bar = mount();
  bar.querySelector('progress').setAttribute('value', '80');
  await settled();
  expect(read(bar, 'value')).toBe('80%');
});

test('changing max re-reads the fill, since the percentage is of it', async () => {
  const bar = mount();
  bar.querySelector('progress').max = 70;
  await settled();
  expect(read(bar, 'value')).toBe('50%');
});

test('a bar with no value is indeterminate, and no percentage is written at all', () => {
  // An unset custom property inside `calc()` is a bar sitting at zero, which is a claim that
  // nothing has happened yet rather than that nobody knows.
  const bar = mount(MARKUP.replace(' value="35"', ''));
  expect(bar.hasAttribute('data-indeterminate')).toBe(true);
  expect(read(bar, 'value')).toBe('');
});

test('going back to indeterminate takes the percentage away with it', async () => {
  const bar = mount();
  expect(bar.hasAttribute('data-indeterminate')).toBe(false);
  bar.value = null;
  await settled();
  expect(bar.hasAttribute('data-indeterminate')).toBe(true);
  expect(read(bar, 'value')).toBe('');
});

test('a value put back leaves indeterminate again', async () => {
  const bar = mount(MARKUP.replace(' value="35"', ''));
  bar.value = 20;
  await settled();
  expect(bar.hasAttribute('data-indeterminate')).toBe(false);
  expect(read(bar, 'value')).toBe('20%');
});

test('a buffer is a second value on the same scale', () => {
  const bar = mount(MARKUP.replace('<progress-elemental>', '<progress-elemental buffer="70">'));
  expect(read(bar, 'buffer')).toBe('70%');
  expect(read(bar, 'value')).toBe('35%');
});

test('no buffer attribute is no buffer bar at all', () => {
  const bar = mount();
  expect(read(bar, 'buffer')).toBe('');
});

test('the buffer follows the attribute both ways', () => {
  const bar = mount();
  bar.buffer = 90;
  expect(bar.getAttribute('buffer')).toBe('90');
  expect(read(bar, 'buffer')).toBe('90%');
  bar.buffer = null;
  expect(bar.hasAttribute('buffer')).toBe(false);
  expect(read(bar, 'buffer')).toBe('');
});

test('a buffer that is not a number is no buffer, rather than a bar drawn at zero', () => {
  const bar = mount(MARKUP.replace('<progress-elemental>', '<progress-elemental buffer="soon">'));
  expect(read(bar, 'buffer')).toBe('');
});

test('a buffer past the end is the end, not a bar running off it', () => {
  const bar = mount(MARKUP.replace('<progress-elemental>', '<progress-elemental buffer="500">'));
  expect(read(bar, 'buffer')).toBe('100%');
});

test('a progress swapped out from under the element is caught by apply()', () => {
  // The observer is watching the old child. Replacing it is the one move no event covers.
  const bar = mount();
  bar.innerHTML = '<progress value="10" max="20"></progress>';
  bar.apply();
  expect(read(bar, 'value')).toBe('50%');
});

test('a progress inside a card this element happens to wrap is not the one being measured', () => {
  // The nested one first, so a search that is not scoped to a direct child finds it and not the
  // bar the author meant.
  const bar = mount(`
    <progress-elemental>
      <div><progress value="90" max="100"></progress></div>
      <progress value="35" max="100"></progress>
    </progress-elemental>`);
  expect(read(bar, 'value')).toBe('35%');
});

test('an element with no progress in it yet is left alone, and reads it when next connected', () => {
  const bar = mount('<progress-elemental></progress-elemental>');
  expect(read(bar, 'value')).toBe('');
  expect(bar.hasAttribute('data-indeterminate')).toBe(false);
  bar.innerHTML = '<progress value="10" max="100"></progress>';
  bar.remove();
  document.body.append(bar);
  expect(read(bar, 'value')).toBe('10%');
});

test('the drawing goes when the element does, rather than freezing over a bar that carries on', () => {
  const bar = mount(MARKUP.replace('<progress-elemental>', '<progress-elemental buffer="70">'));
  expect(read(bar, 'value')).toBe('35%');
  bar.remove();
  expect(read(bar, 'value')).toBe('');
  expect(read(bar, 'buffer')).toBe('');
});

test('an indeterminate bar takes its mark with it, so the CSS is not left animating nothing', () => {
  const bar = mount(MARKUP.replace(' value="35"', ''));
  expect(bar.hasAttribute('data-indeterminate')).toBe(true);
  bar.remove();
  expect(bar.hasAttribute('data-indeterminate')).toBe(false);
});

test('an element that has gone stops watching the bar it was drawing', async () => {
  const bar = mount();
  bar.remove();
  bar.querySelector('progress').value = 90;
  await settled();
  expect(read(bar, 'value')).toBe('');
});
