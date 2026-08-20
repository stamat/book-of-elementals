// Browser-compatibility gate for the compiled CSS, checked against
// .browserslistrc. Not a style linter — .stylelintrc.json does that job on the
// SCSS sources, and the only rule here is the compat one, so it never argues
// about formatting. Passed explicitly with --config, since .stylelintrc.json
// is what stylelint finds on its own.
export default {
  plugins: ['stylelint-no-unsupported-browser-features'],
  // A dependency's `/* stylelint-disable */` would otherwise mute this gate —
  // and two of them compiled together are a CssSyntaxError, because the second
  // disables what is already disabled. Renaming the prefix demotes them to
  // ordinary comments, which is what we want anyway.
  configurationComment: 'stylelint-poops',
  rules: {
    'plugin/no-unsupported-browser-features': [true, {
      // "Partial support" is mostly caniuse flagging a spec corner nobody
      // uses — without this the report is dozens of multicolumn notes about
      // column-fill and nothing else.
      ignorePartialSupport: true,
      // Features that degrade to nothing on the platforms that lack them:
      // pointer cursors are inert on touch, custom scrollbars fall back to
      // the native one. Anything not on this list should fail the build.
      ignore: [
        'css3-cursors',
        'css3-cursors-grab',
        'css-scrollbar',
        // caniuse marks this "n" for desktop Safari and "y" for iOS Safari
        // since 13. It only ever governs touch gestures, so the one platform
        // reported as missing it is the one with no touch input to govern.
        'css-touch-action',
        // caniuse carries the feature with every browser marked "n", current
        // versions included, which is not what shipped: MDN has the `scripting`
        // media feature as Baseline widely available since December 2023, so
        // every target in .browserslistrc has it. Ignoring the data point, not
        // the support gap.
        'css-media-scripting'
      ]
    }]
  }
}
