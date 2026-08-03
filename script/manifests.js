// Cuts the cumulative custom-elements.json into one manifest per elemental.
//
// Both halves are wired into `poops.json` as an `exec.scripts` hook, so `poops -b` stays
// the one build command - the analyzer runs, then this. `scripts` rather than the `build`
// stage for one reason: `build` fires *after* `copy`, and these files have to be in dist/
// before dist/ is swept into _site/, or the docs pages have nothing to fetch.
//
// Run straight after the analyzer, which writes `dist/custom-elements.json` covering
// every element in the book. That cumulative file is what an editor and a converter
// want - one file, every tag, and it is the one `package.json`'s `customElements` key
// points at. A docs page wants the opposite: the switch's page loads the switch's
// bundle and the switch's stylesheet, and a manifest carrying the other five elements
// is the same waste again in a third file.
//
// So both ship, and the per-element ones are cut out of the cumulative one rather than
// analyzed separately: two passes over the same source is two chances for them to
// disagree, and this way there is exactly one description of the switch in existence.
//
// Named after the directory, like every other file an elemental ships -
// `switch-manifest.json` beside `switch.js`, `switch.css` and `switch-theme.css`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const cumulative = join('dist', 'custom-elements.json');
const manifest = JSON.parse(readFileSync(cumulative, 'utf8'));

// The analyzer's glob returns files in readdir order, which is not stable between
// runs - the same source produced a differently-ordered manifest every build, and
// the committed file churned. Sorted here and written back, so the cumulative file
// is deterministic before anything is cut from it.
manifest.modules.sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(cumulative, `${JSON.stringify(manifest, null, 2)}\n`);

for (const module of manifest.modules) {
  const name = /elementals\/([^/]+)\//.exec(module.path);
  // A module that is not an elemental's entry - core, a helper - travels in the
  // cumulative file and gets no file of its own, because nothing would load it.
  if (!name) continue;
  const out = join('dist', 'elementals', `${name[1]}-manifest.json`);
  mkdirSync(dirname(out), { recursive: true });
  // Spread rather than rebuilt, so `schemaVersion` and anything the analyzer adds
  // later travel with the slice without this script having to know about them.
  writeFileSync(out, `${JSON.stringify({ ...manifest, modules: [module] }, null, 2)}\n`);
  console.log(`manifest ${out}`);
}

console.log(`manifest ${cumulative} (${manifest.modules.length} elements)`);
