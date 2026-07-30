import { borrowedValueMissingMessage, formValue, validityState } from './index.js';

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
