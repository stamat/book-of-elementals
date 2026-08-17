import { borrowedValueMissingMessage, formValue, seedChecked, validityState } from './index.js';

// A stand-in for `<html>`: `checked-if` only ever asks the root element whether it matches,
// so the whole of what the DOM contributes here is one method.
const root = (answer) => ({
  matches(selector) {
    if (answer instanceof Error) throw answer;
    return answer(selector);
  }
});

test('an on switch submits its value', () => {
  expect(formValue(true, false, 'on')).toBe('on');
  expect(formValue(true, false, 'pro')).toBe('pro');
});

test('an off switch submits nothing at all, as an unticked checkbox does', () => {
  expect(formValue(false, false, 'on')).toBeNull();
});

test('a disabled switch submits nothing, on or off', () => {
  expect(formValue(true, true, 'on')).toBeNull();
  expect(formValue(false, true, 'on')).toBeNull();
});

test('a required switch that is off is missing its value, and says so', () => {
  expect(validityState(true, false, '', 'Switch this on.')).toEqual({
    flags: { valueMissing: true },
    message: 'Switch this on.'
  });
});

test('nothing else is invalid: on, or not required at all', () => {
  expect(validityState(true, true, '', 'x')).toEqual({ flags: {}, message: '' });
  expect(validityState(false, false, '', 'x')).toEqual({ flags: {}, message: '' });
});

test('a custom message wins over the required check', () => {
  expect(validityState(true, false, 'Pick a tier first.', 'x')).toEqual({
    flags: { customError: true },
    message: 'Pick a tier first.'
  });
});

test('the borrowed default is a message, with or without a document', () => {
  expect(borrowedValueMissingMessage()).toBeTruthy();
});

test('a checked-if switch starts in the state the document is in, whatever the markup said', () => {
  expect(seedChecked('[data-theme=dark]', root(() => true), false)).toBe(true);
  expect(seedChecked('[data-theme=dark]', root(() => false), true)).toBe(false);
});

test('the selector is the one the author wrote, handed to the root unchanged', () => {
  const seen = [];
  seedChecked('[data-theme=dark]', root((selector) => seen.push(selector) && false), false);
  expect(seen).toEqual(['[data-theme=dark]']);
});

test('no condition at all leaves the markup to say whether it is on', () => {
  expect(seedChecked(null, root(() => true), false)).toBe(false);
  expect(seedChecked('', root(() => true), true)).toBe(true);
});

// Under Node there is no document to ask, and an element that threw there would take every
// test in a consumer's suite with it - the same reason `attachInternals` is guarded.
test('with no root to ask, the markup stands', () => {
  expect(seedChecked('[data-theme=dark]', null, true)).toBe(true);
});

// Degrading rather than throwing: a selector with a typo in it is the author's mistake to see
// reported, not a reason for the switch to stop being a switch - the upgrade is already past
// the point where the button is visible, so a throw here leaves a button with no role.
test('a selector the browser cannot parse leaves the markup alone, and is reported rather than swallowed', () => {
  const reported = [];
  expect(seedChecked('[unclosed', root(new SyntaxError('bad selector')), true, (e) => reported.push(e))).toBe(true);
  expect(reported).toHaveLength(1);
  expect(reported[0].name).toBe('SyntaxError');
});

test('nobody listening for the error is still not a reason to throw one', () => {
  expect(seedChecked('[unclosed', root(new SyntaxError('bad selector')), false)).toBe(false);
});
