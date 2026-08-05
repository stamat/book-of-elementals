// Covers `svg.icon()` in `_svg.scss`: which characters it percent-encodes and in what
// order, compiled by the same Dart Sass the build uses. Deliberately not covered: that the
// data URI a browser gets back is the SVG that went in - that is the browser's decoder, not
// this function's job - and the icons themselves, whose bytes the build already pins.

import { compileString } from 'sass'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const STYLES = path.dirname(fileURLToPath(import.meta.url))

function icon (svg) {
  const { css } = compileString(`@use "svg";\na { mask: svg.icon(${JSON.stringify(svg)}); }`, {
    loadPaths: [STYLES]
  })
  return css.match(/mask: url\("data:image\/svg\+xml,(.*)"\)/s)[1]
}

describe('svg.icon()', () => {
  test('the angle brackets that make it markup are what url() cannot take', () => {
    expect(icon('<svg><path/></svg>')).toBe('%3Csvg%3E%3Cpath/%3E%3C/svg%3E')
  })

  test('a hash colour is encoded, or the URL ends at the fragment it starts', () => {
    expect(icon("<svg fill='#0af'/>")).toBe("%3Csvg fill='%230af'/%3E")
  })

  test('a double quote in the payload cannot close the url() it sits in', () => {
    expect(icon('<svg fill="red"/>')).toBe('%3Csvg fill=%22red%22/%3E')
  })

  test('a literal percent is encoded first, so the escapes are not escaped in turn', () => {
    expect(icon("<svg width='100%'/>")).toBe("%3Csvg width='100%25'/%3E")
  })

  test('an already-encoded source is encoded again rather than passed through', () => {
    expect(icon('%3Csvg%3E')).toBe('%253Csvg%253E')
  })
})
