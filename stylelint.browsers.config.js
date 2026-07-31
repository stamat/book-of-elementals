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
        'css-scrollbar'
      ]
    }]
  }
}
