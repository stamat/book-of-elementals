import js from '@eslint/js';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  HTMLElement: 'readonly',
  customElements: 'readonly',
  navigator: 'readonly',
  IntersectionObserver: 'readonly',
  decodeURIComponent: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly'
};

export default [
  { ignores: ['dist/**', '_site/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browserGlobals }
  },
  {
    files: ['**/*.test.js', 'eslint.config.js', 'script/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly', test: 'readonly', expect: 'readonly', describe: 'readonly' }
    }
  },
  {
    // `script/a11y` twice over: named by its exact path, because eslint globs `.js` and this
    // one is an entry point in `script/`, where everything is called by its bare name - and
    // given both sets of globals, because half of it is closures handed to `page.evaluate`
    // and `waitForFunction`, which run in the page rather than in node. Here rather than in
    // a `/* global */` comment at the top of the file: that one cannot say *where* in the
    // file a browser global is legitimate either, but it does say it in the file that would
    // then be lying about what it runs in.
    files: ['script/a11y'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly', ...browserGlobals }
    }
  }
];
