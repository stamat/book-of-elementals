/**
 * The wiring: the role, the axis, the one `tabindex="0"` that moves, and what keeps that stop
 * inside a bar whose buttons enable and disable as the document changes.
 *
 * `index.test.js` pins `toolbarKey`, which decides whose key a press is. This file is the other
 * half — that the answer lands on focus and on the tab stop together. Either one alone is the
 * bug: focus without the stop leaves Tab returning to the start of the bar, and the stop without
 * focus leaves the reader where they were.
 *
 * Deliberately not covered: the look of a pressed control, which is CSS and belongs to the docs
 * page; `stepIndex`, which is book-of-spells' and tested there; and a control hidden by a
 * stylesheet rather than by `hidden`, which takes `checkVisibility` and so a layout to see.
 * jsdom has neither, so the hiding below is always the attribute, and the CSS half of the same
 * behaviour is covered by nothing that runs on its own.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <toolbar-elemental aria-label="Formatting">
    <button type="button" aria-pressed="true">Bold</button>
    <button type="button" aria-pressed="false">Italic</button>
    <a href="#link">Link</a>
  </toolbar-elemental>`;

function mount (markup = MARKUP) {
  document.body.innerHTML = markup;
  return document.querySelector('toolbar-elemental');
}

function controls (bar) {
  return Array.from(bar.querySelectorAll('button, a[href]'));
}

/** The tab stops a reader can actually land on, by label — a bar in a good state has exactly one.
 * A `disabled` button is left out because no `tabindex` makes one focusable. */
function stops (bar) {
  return controls(bar)
    .filter((control) => !control.disabled && control.getAttribute('tabindex') === '0')
    .map((control) => control.textContent);
}

function press (target, key, options = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  target.dispatchEvent(event);
  return event;
}

/** A MutationObserver callback is a microtask; nothing it does has happened yet on the line after. */
const settled = () => Promise.resolve();

test('the element upgrades over the buttons the author wrote and calls itself a toolbar', () => {
  const bar = mount();
  expect(bar.constructor.name).toBe('ToolbarElemental');
  expect(bar.getAttribute('role')).toBe('toolbar');
});

test('a bar of six buttons becomes one tab stop, and it starts at the first control', () => {
  // The whole of what the pattern buys: Tab past the bar in one press instead of six.
  const bar = mount();
  expect(stops(bar)).toEqual(['Bold']);
  expect(controls(bar).map((control) => control.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
});

test('an arrow moves focus and takes the tab stop with it', () => {
  const bar = mount();
  const [bold] = controls(bar);
  bold.focus();
  press(bold, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Italic');
  expect(stops(bar)).toEqual(['Italic']);
});

test('the arrows walk links as well as buttons, since both are controls in a bar', () => {
  const bar = mount();
  const italic = controls(bar)[1];
  italic.focus();
  press(italic, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Link');
});

test('the ends do not wrap, because Tab is how you leave and a loop hides that', () => {
  const bar = mount();
  const [bold,, link] = controls(bar);
  bold.focus();
  press(bold, 'ArrowLeft');
  expect(document.activeElement).toBe(bold);
  link.focus();
  press(link, 'ArrowRight');
  expect(document.activeElement).toBe(link);
});

test('Home and End reach the ends of the bar', () => {
  const bar = mount();
  const italic = controls(bar)[1];
  italic.focus();
  press(italic, 'End');
  expect(document.activeElement.textContent).toBe('Link');
  press(document.activeElement, 'Home');
  expect(document.activeElement.textContent).toBe('Bold');
});

test('a key the bar answers is taken from the page', () => {
  const bar = mount();
  const [bold] = controls(bar);
  bold.focus();
  expect(press(bold, 'ArrowRight').defaultPrevented).toBe(true);
});

test('the other axis is left where it was pressed, so the page still scrolls under the bar', () => {
  const bar = mount();
  const [bold] = controls(bar);
  bold.focus();
  expect(press(bold, 'ArrowDown').defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(bold);
});

test('an arrow at an end is not swallowed either, so the page still scrolls there', () => {
  const bar = mount();
  const [bold] = controls(bar);
  bold.focus();
  expect(press(bold, 'ArrowLeft').defaultPrevented).toBe(false);
});

test('Enter and Space stay with the button, which is how a button gets pressed', () => {
  const bar = mount();
  const [bold] = controls(bar);
  bold.focus();
  for (const key of ['Enter', ' ', 'Tab']) expect(press(bold, key).defaultPrevented).toBe(false);
});

test('a vertical bar says so and swaps which arrows are its own', () => {
  const bar = mount(MARKUP.replace('<toolbar-elemental', '<toolbar-elemental vertical'));
  expect(bar.getAttribute('aria-orientation')).toBe('vertical');
  const [bold] = controls(bar);
  bold.focus();
  expect(press(bold, 'ArrowRight').defaultPrevented).toBe(false);
  press(bold, 'ArrowDown');
  expect(document.activeElement.textContent).toBe('Italic');
});

test('a horizontal bar writes no aria-orientation, since horizontal is what the role already means', () => {
  // A second copy of the same fact is a second thing to keep in step, and one of the two rots.
  const bar = mount();
  expect(bar.hasAttribute('aria-orientation')).toBe(false);
});

test('turning the bar on its side turns the arrows with it', () => {
  const bar = mount();
  bar.vertical = true;
  expect(bar.getAttribute('aria-orientation')).toBe('vertical');
  const [bold] = controls(bar);
  bold.focus();
  press(bold, 'ArrowDown');
  expect(document.activeElement.textContent).toBe('Italic');
  bar.vertical = false;
  expect(bar.hasAttribute('aria-orientation')).toBe(false);
});

test('a disabled control is stepped over, because focus cannot land on one', () => {
  // A cursor that lands where focus cannot follow is a bar that stops moving.
  const bar = mount(MARKUP.replace('<button type="button" aria-pressed="false">Italic</button>', '<button type="button" disabled>Italic</button>'));
  const [bold] = controls(bar);
  bold.focus();
  press(bold, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Link');
});

test('aria-disabled is the way to keep a control in the walk, unreachable as it is', () => {
  const bar = mount(MARKUP.replace('aria-pressed="false"', 'aria-disabled="true"'));
  const [bold] = controls(bar);
  bold.focus();
  press(bold, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Italic');
});

test('the tab stop moves off a control that goes disabled, so the bar is never left without one', async () => {
  // A bar whose buttons enable and disable as the document changes is the ordinary case - undo,
  // redo - and the control holding the stop going `disabled` is a bar Tab can no longer enter.
  const bar = mount();
  const [bold] = controls(bar);
  expect(stops(bar)).toEqual(['Bold']);
  bold.disabled = true;
  await settled();
  expect(stops(bar)).toEqual(['Italic']);
});

test('a control hidden from the page is stepped over, because focus cannot land on one either', () => {
  // The same defect as an arrow reaching a `disabled` control, from the other side: the platform
  // declines the focus either way, and an arrow that moves nothing is a bar that stops moving.
  const bar = mount(MARKUP.replace('aria-pressed="false"', 'hidden'));
  const [bold] = controls(bar);
  bold.focus();
  press(bold, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Link');
});

test('a control inside a region that has folded away goes with it', () => {
  // Which is how a crowded bar sheds its rarely-used half on a narrow screen: the region carries
  // the `hidden`, and every control under it is one the arrows must not stop on.
  const bar = mount(`
    <toolbar-elemental aria-label="Formatting">
      <button type="button">Bold</button>
      <div hidden><button type="button">Italic</button></div>
      <a href="#link">Link</a>
    </toolbar-elemental>`);
  const [bold] = controls(bar);
  bold.focus();
  press(bold, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Link');
});

test('the tab stop leaves a control that goes hidden, so Tab still reaches the bar', async () => {
  // A stop sitting on a control the reader cannot see is a bar Tab enters and lands nowhere in.
  const bar = mount();
  expect(stops(bar)).toEqual(['Bold']);
  controls(bar)[0].hidden = true;
  await settled();
  expect(stops(bar)).toEqual(['Italic']);
});

test('a bar with nothing left on screen keeps the stop it had, for when it comes back', async () => {
  // A bar hidden whole is one waiting - on its media, on a breakpoint - rather than one being
  // torn down. Rewriting the stop while there is nowhere to put it would move it to the first
  // control instead of leaving it where the reader put it.
  const bar = mount();
  controls(bar)[2].focus();
  expect(stops(bar)).toEqual(['Link']);
  bar.hidden = true;
  await settled();
  expect(stops(bar)).toEqual(['Link']);
  bar.hidden = false;
  await settled();
  expect(stops(bar)).toEqual(['Link']);
});

test('a bar faded to transparent is still a bar the arrows walk', () => {
  // A control row over a video fades out while it plays and comes back when focus arrives in it,
  // so "can it be seen" is not the question this element asks and must not become it.
  const bar = mount();
  bar.style.opacity = '0';
  const [bold] = controls(bar);
  bold.focus();
  press(bold, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Italic');
});

test('a control added later joins the walk without anyone calling a refresh', async () => {
  // A button appended by the page and left with no `tabindex` is a second tab stop in a bar
  // whose whole point is having one.
  const bar = mount();
  bar.insertAdjacentHTML('beforeend', '<button type="button">Undo</button>');
  await settled();
  expect(stops(bar)).toEqual(['Bold']);
  expect(controls(bar).map((control) => control.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
  const link = controls(bar)[2];
  link.focus();
  press(link, 'ArrowRight');
  expect(document.activeElement.textContent).toBe('Undo');
});

test('focus arriving from a click keeps the tab stop where the reader put it', () => {
  const bar = mount();
  const link = controls(bar)[2];
  link.focus();
  link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  expect(stops(bar)).toEqual(['Link']);
});

test('a key pressed on something in the bar that is not one of its controls is not the bar\'s', () => {
  // A `<select>` or a text field wants the arrows for itself, and the pattern's advice is to
  // leave it its own tab stop rather than guess which press was meant for whom.
  const bar = mount(MARKUP.replace('</toolbar-elemental>', '<select><option>a</option></select></toolbar-elemental>'));
  const select = bar.querySelector('select');
  select.focus();
  expect(press(select, 'ArrowRight').defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(select);
});

test('an empty element is left alone, and wires itself when it has controls and is next connected', () => {
  const bar = mount('<toolbar-elemental aria-label="Formatting"></toolbar-elemental>');
  expect(bar.hasAttribute('role')).toBe(false);
  bar.innerHTML = '<button type="button">Bold</button>';
  bar.remove();
  document.body.append(bar);
  expect(bar.getAttribute('role')).toBe('toolbar');
  expect(stops(bar)).toEqual(['Bold']);
});

test('everything the element wrote comes off when it goes, tabindex included', () => {
  // A `role="toolbar"` with no keyboard behind it is a contract the page cannot keep, and a
  // `tabindex="-1"` left on a button is a button the reader can no longer reach at all.
  const bar = mount(MARKUP.replace('<toolbar-elemental', '<toolbar-elemental vertical'));
  const buttons = controls(bar);
  bar.remove();
  expect(bar.hasAttribute('role')).toBe(false);
  expect(bar.hasAttribute('aria-orientation')).toBe(false);
  for (const control of buttons) expect(control.hasAttribute('tabindex')).toBe(false);
});

test('a bar that has gone stops listening, so a mutation in it is nobody\'s business any more', async () => {
  const bar = mount();
  const [bold] = controls(bar);
  bar.remove();
  bold.disabled = true;
  await settled();
  expect(controls(bar).some((control) => control.hasAttribute('tabindex'))).toBe(false);
});
