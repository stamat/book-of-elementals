<!--
Delete whatever doesn't apply. A one-line fix does not need six headings — the
point of this file is that nothing important gets forgotten, not that every
section gets filled in.
-->

## What and why

<!-- What changes, and what was wrong before. The reviewer should not have to
open the linked issue to understand the diff. -->

Fixes #

## How to check it

<!-- The command you ran, or the steps to see the difference. For keyboard or
screen reader behaviour, the keys pressed and what was announced, and with
which browser and assistive technology. For anything visible, a before/after
screenshot. -->

## Checklist

- [ ] `script/test` passes
- [ ] `script/lint` passes
- [ ] Tests cover the change — a bug fix has one that fails without it
- [ ] `CHANGELOG.md` has an entry under `## [Unreleased]`
- [ ] Changes to the DOM an element writes, or the CSS authors target, are
      described in the changelog entry in those words — that's the public API
- [ ] Roles, states, focus order and keyboard handling checked against the
      [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) the element
      implements, if this touches any of them
- [ ] New attributes and custom properties have JSDoc tags — `cem analyze`
      builds `custom-elements.json` from them, and the docs read that
- [ ] Breaking change is called out above, in those words
