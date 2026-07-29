import { readOptions } from './core.js';

test('readOptions parses booleans, numbers and strings from attributes', () => {
  const attrs = { exclusive: '', 'page-step': '25', label: 'FAQ', muted: 'false' };
  const el = { dataset: {}, getAttribute: (n) => (n in attrs ? attrs[n] : null) };
  expect(readOptions(el, { exclusive: 'boolean', muted: 'boolean', pageStep: 'number', label: 'string' }))
    .toEqual({ exclusive: true, muted: false, pageStep: 25, label: 'FAQ' });
});

test('readOptions omits absent options instead of defaulting them', () => {
  const el = { dataset: {}, getAttribute: () => null };
  expect(readOptions(el, { exclusive: 'boolean' })).toEqual({});
});

test('readOptions prefers data-* over the bare attribute', () => {
  const el = { dataset: { exclusive: 'false' }, getAttribute: () => '' };
  expect(readOptions(el, { exclusive: 'boolean' })).toEqual({ exclusive: false });
});

test('readOptions ignores unparsable numbers', () => {
  const el = { dataset: {}, getAttribute: () => 'nope' };
  expect(readOptions(el, { pageStep: 'number' })).toEqual({});
});
