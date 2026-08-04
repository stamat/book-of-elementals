// The four decisions `<modal-elemental>` makes that are not DOM plumbing: what a
// `closedby` value lets close the dialog, which invoker command means what, and whether a
// pointer landed on the backdrop or on the box.
//
// Deliberately not covered here: `showModal()`, the top layer, the inertness of the page
// behind and the focus that comes back on close - all of which are the browser's, not this
// element's, and none of which jsdom implements. The exit animation is timed off
// `getAnimations()`, which jsdom does not have either. Both belong to `script/a11y` and to
// the docs demos, where a real browser is running.
import { dismissMode, dismissible, commandAction, outside, adoption } from './index.js';

test('a dialog that says nothing closes the way the platform closes one: Escape, not a click outside', () => {
  expect(dismissMode(null)).toBe('closerequest');
  expect(dismissible('closerequest', 'escape')).toBe(true);
  expect(dismissible('closerequest', 'pointer')).toBe(false);
});

test('closedby="any" is the one that closes on the backdrop', () => {
  expect(dismissMode('any')).toBe('any');
  expect(dismissible('any', 'pointer')).toBe(true);
  expect(dismissible('any', 'escape')).toBe(true);
});

test('closedby="none" refuses both, so only a close button gets out', () => {
  expect(dismissMode('none')).toBe('none');
  expect(dismissible('none', 'escape')).toBe(false);
  expect(dismissible('none', 'pointer')).toBe(false);
});

test('a value nobody recognises is the platform default rather than a broken dialog', () => {
  expect(dismissMode('yes please')).toBe('closerequest');
  expect(dismissMode('')).toBe('closerequest');
});

test('closedby is matched however it is cased or spaced, like every enumerated attribute', () => {
  expect(dismissMode('Any')).toBe('any');
  expect(dismissMode(' NONE ')).toBe('none');
});

test('show-modal opens, and both closing commands close', () => {
  expect(commandAction('show-modal')).toBe('open');
  expect(commandAction('close')).toBe('close');
  expect(commandAction('request-close')).toBe('close');
});

test('a command the element does not own is left to the browser', () => {
  expect(commandAction('toggle-popover')).toBe(null);
  expect(commandAction('--custom')).toBe(null);
  expect(commandAction(null)).toBe(null);
});

test('a modal opened by somebody else is taken over, backdrop counted with the rest', () => {
  expect(adoption(true, true, false)).toBe('modal');
});

test('a dialog shown in the page rather than over it is made visible and left out of the stack', () => {
  // `show()` rather than `showModal()`: no backdrop, no inert page, so nothing to count and
  // no reason to lock the page's scroll.
  expect(adoption(true, false, false)).toBe('inline');
});

test('the element does not take over what it opened itself', () => {
  expect(adoption(true, true, true)).toBe(null);
});

test('a closed dialog is nothing to take over, whatever else is true of it', () => {
  expect(adoption(false, false, false)).toBe(null);
  expect(adoption(false, true, false)).toBe(null);
});

const BOX = { left: 100, top: 100, right: 300, bottom: 200 };

test('a click on the backdrop is outside the box, whichever side it lands on', () => {
  expect(outside(BOX, 50, 150)).toBe(true);
  expect(outside(BOX, 350, 150)).toBe(true);
  expect(outside(BOX, 200, 50)).toBe(true);
  expect(outside(BOX, 200, 250)).toBe(true);
});

test('a click on the dialog itself is inside it, including on its own padding and its edge', () => {
  expect(outside(BOX, 200, 150)).toBe(false);
  expect(outside(BOX, 100, 100)).toBe(false);
  expect(outside(BOX, 300, 200)).toBe(false);
});
