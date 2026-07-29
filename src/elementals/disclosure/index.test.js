import { disclosureState } from './index.js';

test('an open disclosure is expanded and not hidden', () => {
  expect(disclosureState(true)).toEqual({ expanded: 'true', hidden: null });
});

test('a closed disclosure hides with until-found, so find-in-page still reaches it', () => {
  expect(disclosureState(false)).toEqual({ expanded: 'false', hidden: 'until-found' });
});
