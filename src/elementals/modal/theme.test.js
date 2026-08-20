// Covers the one rule in `theme.scss` that reserves room beside the cross: who is given the
// gutter and who must not be, compiled by the same Dart Sass the build uses. Deliberately
// not covered: what that padding does on screen, which is the cascade's job and there is no
// DOM here to run it in, and every other declaration in the theme - a look is shown on the
// docs page, not asserted here.

import { compile } from 'sass'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const THEME = path.join(path.dirname(fileURLToPath(import.meta.url)), 'theme.scss')

// The selector of the rule that pads whatever follows the cross, whitespace flattened.
function gutterSelector () {
  const { css } = compile(THEME)
  const rule = css.match(/([^{}]*\.modal-elemental-close \+ [^{]*)\{[^}]*padding-inline-end[^}]*\}/)
  return rule[1].replace(/\s+/g, ' ').trim()
}

describe('the room the cross is given', () => {
  test('whatever follows the cross is padded, so a heading cannot run under the corner', () => {
    expect(gutterSelector()).toContain('.modal-elemental-close + *')
  })

  // A replaced element sized `width: 100%` adds this padding to that 100% wherever the page
  // has no border-box reset, and the dialog scrolls sideways by the width of the gutter.
  test.each(['img', 'picture', 'video', 'iframe', 'embed', 'object', 'canvas', 'svg'])(
    'a %s directly after the cross is not padded, so it cannot outgrow the dialog',
    (tag) => {
      const excluded = gutterSelector().match(/:not\(:is\(([^)]*)\)\)/)
      expect(excluded?.[1].split(',').map((s) => s.trim())).toContain(tag)
    }
  )
})
