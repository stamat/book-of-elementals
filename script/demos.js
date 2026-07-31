// Turns marked code fences in the built pages into live, editable previews.
//
//     <!-- demo switch -->
//
//     ```html
//     <switch-elemental><button>…</button></switch-elemental>
//     ```
//
// becomes a `<code-preview>` wrapping that same fence: the sample rendered in an iframe
// above the code that produced it, the code editable, and - because every element in the
// book now ships a manifest - a second tab of controls generated from it.
//
// Post-markup rather than in the markdown, which is the whole point of the marker. The
// fence stays a fence in `docs/*.md`, so the sample is still one block of real html to
// read, to copy, to highlight at build time, and to end up in `llms.txt` and the search
// index. Writing `<code-preview>` by hand in the markdown would mean escaping every
// sample into `&lt;switch-elemental&gt;` and losing all four.
//
// Opting in per fence is deliberate: a docs page is full of html fences that are not
// demos - install snippets, markup being described rather than shown - so wrapping every
// one of them is the wrong default.
//
// The element and the fence are left *between* the marker and the code, so the pattern no
// longer matches and a second pass is a no-op. That matters in watch mode, where poops
// recompiles the page that changed and this runs over all of them again.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = '_site';

// `<!-- demo switch tab="options" -->` followed by an html fence. The fence markup is
// what poops' markdown stage emits, hljs classes and all.
const MARKER = /<!-- demo([^>]*)-->\s*(<pre><code class="hljs language-html">[\s\S]*?<\/code><\/pre>)/g;

// Loaded once per page that has a demo on it, and not at all on the pages that do not.
// The bundle with highlight.js inside it, because the fences here are highlighted at
// build time and the page carries no runtime highlighter for the editor to borrow.
const SCRIPTS = ['js/code-preview-hljs.min.js', 'js/code-preview-options.min.js'];

// The frame is a bare document: it loads the element's own two stylesheets and nothing
// else, so without this it is black on white inside a dark page.
//
// `color-scheme` rather than a copy of the docs palette, and the system colors rather than
// hex: the whole book is painted out of `currentcolor`, so a foreground and a background
// is the entire palette it needs - and `Canvas`/`CanvasText` follow `color-scheme`, which
// follows the `[data-theme]` that `theme-attribute` is already mirroring in. Nothing here
// has to know what the docs theme's greys are, and re-theming the site cannot leave the
// previews behind.
//
// It replaces the element's default head, which is only the body padding, so that comes
// back here.
const HEAD = [
  '<style>',
  ':root{color-scheme:light}',
  ':root[data-theme=dark]{color-scheme:dark}',
  'body{margin:0;padding:1rem;background:Canvas;color:CanvasText;',
  'font:1rem/1.5 system-ui,sans-serif}',
  '</style>'
].join('');

/** Every .html file under _site, at any depth. */
function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return path.endsWith('.html') ? [path] : [];
  });
}

/**
 * What a page at this path has to prefix a site-root-relative url with. The same job
 * `relativePathPrefix` does in the markdown, done again here because this stage is past
 * the templating and only has the file path to go on.
 */
function prefixFor(path) {
  const depth = relative(SITE, path).split(sep).length - 1;
  return '../'.repeat(depth);
}

/**
 * The attributes for one marker.
 *
 * A bare word is an elemental to load - its structure stylesheet, its optional theme and
 * its bundle - and anything with an `=` in it is passed through untouched, which is how a
 * demo asks for `tab="options"` or a set of `viewport-widths`.
 */
function attributesFor(spec, prefix) {
  const names = [];
  const extra = [];
  for (const token of spec.match(/\S+="[^"]*"|\S+/g) || []) {
    if (token.includes('=')) extra.push(token);
    else names.push(token);
  }

  const css = names.flatMap((name) => [
    `${prefix}dist/elementals/${name}.css`,
    `${prefix}dist/elementals/${name}-theme.css`
  ]);
  const js = names.map((name) => `${prefix}dist/elementals/${name}.js`);
  // One element takes its own manifest; a sample using two takes the cumulative one, which
  // is the reason both are shipped. `manifest-tag` is not needed either way - the panel
  // drives the first documented tag the sample actually contains.
  const manifest = names.length === 1
    ? `${prefix}dist/elementals/${names[0]}-manifest.json`
    : `${prefix}dist/custom-elements.json`;

  return [
    `css="${css.join(' ')}"`,
    `js="${js.join(' ')}"`,
    `manifest="${manifest}"`,
    // The docs theme's own switcher writes [data-theme] on the page; this is what carries
    // it into the frame, so a demo in dark mode is demonstrated in dark mode.
    'theme-attribute="data-theme"',
    `head="${HEAD.replace(/"/g, '&quot;')}"`,
    ...extra
  ].join(' ');
}

let wrapped = 0;
let touched = 0;

for (const path of pages(SITE)) {
  const before = readFileSync(path, 'utf8');
  const prefix = prefixFor(path);
  let count = 0;

  let after = before.replace(MARKER, (whole, spec, fence) => {
    count += 1;
    return `<!-- demo${spec}--><code-preview ${attributesFor(spec, prefix)}>${fence}</code-preview>`;
  });

  if (!count) continue;
  // Only the pages that ended up with a preview on them pay for the bundles.
  if (!after.includes(SCRIPTS[0])) {
    const tags = SCRIPTS.map((src) => `<script src="${prefix}${src}"></script>`).join('');
    after = after.replace('</body>', `${tags}</body>`);
  }

  writeFileSync(path, after);
  wrapped += count;
  touched += 1;
}

console.log(`demos: ${wrapped} previews across ${touched} pages`);
