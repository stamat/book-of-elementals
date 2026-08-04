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
// A sample that needs more than markup adds fences to the group, one per language, and
// they become the preview's other tabs. Joining is opt-in per fence and never positional,
// because the fence after a demo is usually the install snippet:
//
//     ```css demo
//     .sidebar { transition: transform 0.2s ease; }
//     ```
//
// `demo` there is the fence's info string, which poops turns into a class on the `<code>`
// - a bare word becomes a class, `key=value` becomes `data-key` - so this needs nothing
// from the markdown that markdown does not already have.
//
// Post-markup rather than in the markdown, which is the whole point of the marker. The
// fences stay fences in `docs/*.md`, so each one is still a block of real code to read, to
// copy, to highlight at build time, and to end up in `llms.txt` and the search index.
// Writing `<code-preview>` by hand in the markdown would mean escaping every sample into
// `&lt;switch-elemental&gt;` and losing all four.
//
// Opting in per fence is deliberate: a docs page is full of html fences that are not
// demos - install snippets, markup being described rather than shown - so wrapping every
// one of them is the wrong default.
//
// The element and the fences are left *between* the marker and the code, so the pattern no
// longer matches and a second pass is a no-op. That matters in watch mode, where poops
// recompiles the page that changed and this runs over all of them again.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = '_site';

// `<!-- demo switch tab="options" -->`, and the whitespace to the fence under it.
const MARKER = /<!-- demo([^>]*)-->\s*/g;

// One fence, as poops' markdown stage emits it. Sticky rather than searching: both of
// these are asked "does a fence start exactly here", never "where is the next one".
//
// Matched loosely on purpose. The class list and the data attributes carry the fence's
// own info string, so `class="hljs language-html"` is only what a fence with nothing to
// say looks like - pinning that exact string is a matcher that breaks the first time a
// demo needs a setting.
const FENCE = /<pre><code class="hljs language-[\w-]+[^"]*"[^>]*>[\s\S]*?<\/code><\/pre>/y;

// A fence that has said `demo` in its info string, and the whitespace above it. The
// lookahead is what keeps `language-demo` from reading as one.
const JOINED = /\s*<pre><code class="hljs language-[\w-]+[^"]*\sdemo(?=[\s"])[^"]*"[^>]*>[\s\S]*?<\/code><\/pre>/y;

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
  // A field's own label, which several samples open with. `body >` and not `label`: a
  // label *inside* an elemental is part of that elemental - the segmented control is a row
  // of them - and giving those a block display and a margin would take the sample apart to
  // fix the line above it.
  'body>label{display:block;margin-block-end:0.35rem}',
  '</style>',
  // A placeholder `href="#"` is a link to nowhere on an ordinary page, and something else
  // entirely in a srcdoc frame: srcdoc has no url of its own, so it borrows this page's as
  // its base and `#` resolves to the docs page - clicking a nav item in a preview loads the
  // whole site back inside it. The samples are full of them, because a nav demo is mostly
  // links. Cheaper here than a fake `href` per sample: the fences stay the markup an author
  // would write, and this stays frame furniture like the padding above it.
  '<script>addEventListener("click",(e)=>{const a=e.target.closest?.("a");',
  'if(a?.getAttribute("href")?.startsWith("#"))e.preventDefault()});</script>'
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

/**
 * Wrap every marked group on one page.
 *
 * A scan rather than a `replace`, because a group is a marker plus a run of fences whose
 * length is not known until the run stops - which a single pattern can express only by
 * being greedy enough to swallow the install snippet under the sample.
 *
 * @param {string} html The built page.
 * @param {string} prefix What this page prefixes a site-root-relative url with.
 * @returns {{ html: string, count: number }}
 */
function wrapDemos(html, prefix) {
  let out = '';
  let at = 0;
  let count = 0;
  let marker;

  MARKER.lastIndex = 0;
  while ((marker = MARKER.exec(html))) {
    FENCE.lastIndex = MARKER.lastIndex;
    // A marker with no fence under it - or one whose fences this pass has already
    // wrapped, which is what makes a second pass a no-op.
    if (!FENCE.exec(html)) continue;

    let end = FENCE.lastIndex;
    for (;;) {
      JOINED.lastIndex = end;
      if (!JOINED.exec(html)) break;
      end = JOINED.lastIndex;
    }

    out += html.slice(at, MARKER.lastIndex);
    out += `<code-preview ${attributesFor(marker[1], prefix)}>${html.slice(MARKER.lastIndex, end)}</code-preview>`;
    at = end;
    count += 1;
    // Past the group, so a fence inside it can never be read as the start of the next.
    MARKER.lastIndex = end;
  }

  return { html: out + html.slice(at), count };
}

let wrapped = 0;
let touched = 0;

for (const path of pages(SITE)) {
  const prefix = prefixFor(path);
  const { html, count } = wrapDemos(readFileSync(path, 'utf8'), prefix);
  let after = html;

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
