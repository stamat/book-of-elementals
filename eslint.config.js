import js from '@eslint/js';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  HTMLElement: 'readonly',
  customElements: 'readonly',
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
  }
];
