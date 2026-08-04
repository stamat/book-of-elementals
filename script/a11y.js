// Runs axe-core over every live demo in the built site, in a real browser.
//
// The unit suite tests the decisions each element makes as plain functions - it runs under
// Node with no DOM, so the roles, the states and the contrast were until now checked by
// hand against the docs page. This is that check, automated: `script/build` renders every
// element into `_site`, and this drives it.
//
// Only the `<code-preview>` iframes are audited, not the pages around them. A preview is
// the sample alone in a bare document with the element's own CSS and theme, so every
// violation found inside one belongs to this project. The docs page itself is the theme's
// markup - auditing it would report poops-docs-theme's chrome as our failures.
//
// Both themes, in full: every preview is loaded once light and once dark, because contrast
// is the half of this that a theme can break on its own - a border that reads at 4.6:1 on
// white is a different number on the dark surface, and only one of the two is measured by
// a pass that never switched.
//
// Deliberately not covered:
// - anything a click cannot reach. The states below are opened by clicking what says it
//   opens - a flyout that only appears on hover, or a state only a key can reach, is not
//   in this sweep.
// - the pages' own markup, per above, and the inline (non-preview) samples that sit in it.

// The callbacks handed to `evaluate` and `waitForFunction` are serialised and run in the
// page, not here - which is the one place in this repo where a Node script writes browser code.
/* global window, document, customElements */
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { join, sep } from 'node:path';
import { chromium } from 'playwright-core';
// poops' own static handler rather than a hand-rolled one: it already resolves directory
// indexes and extensionless urls the way the deployed site does. An internal path, which
// is a coupling this repo accepts - poops is a devDependency here and ships no exports map.
import { createStaticHandler } from 'poops/lib/server.js';

const SITE = '_site';
const AXE = fileURLToPath(import.meta.resolve('axe-core/axe.min.js'));

// WCAG only. axe's best-practice tag adds `region` and the landmark rules, which every
// fragment fails by definition - a sample is not a page and has no business having a main.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// The same argument one level down: these are document-level rules, and the document here
// is a srcdoc wrapper this project does not ship. Everything else stays on.
const OFF = ['html-has-lang', 'html-lang-valid', 'html-xml-lang-mismatch', 'document-title', 'bypass'];

// Rounds of "open everything that says it is closed", because opening a menu reveals the
// submenu triggers inside it. Bounded rather than looping to exhaustion: a widget that
// re-closes itself on click would otherwise spin here forever.
const EXPAND_ROUNDS = 5;

// Long enough for a click to be a bug rather than a slow machine, short enough that a
// sample which cannot be driven does not hold the sweep for a minute.
const CLICK_TIMEOUT = 2000;

// Set on the host page, mirrored into every preview. Light first because that is the
// state a page loads in; each theme gets its own load, so both start from the sample as
// authored rather than from whatever the previous pass left open.
const THEMES = ['light', 'dark'];

const options = { runOnly: TAGS, rules: Object.fromEntries(OFF.map((id) => [id, { enabled: false }])) };

// A closed `hidden="until-found"` region is audited open, one state further down, and that is
// the audit worth having. Left in, it is audited twice - once as the panel a reader will see,
// and once as a rendered-but-skipped copy of it that no rule reads correctly: `content-visibility`
// empties the subtree, so a closed drawer reads to axe as a scrollable region with nothing
// focusable in it, when what it holds is a list of links a click away.
const context = { exclude: ['[hidden="until-found"]'] };

/** Every built page carrying at least one live preview. */
function demoPages() {
  return readdirSync(SITE, { recursive: true })
    .filter((f) => f.endsWith('.html'))
    .filter((f) => readFileSync(join(SITE, f), 'utf8').includes('<code-preview'))
    .map((f) => f.split(sep).join('/'))
    .sort();
}

/**
 * Puts the page in a theme and waits for the previews to be in it too.
 *
 * A preview copies the host's `[data-theme]` into its frame through a MutationObserver,
 * under whatever attribute its own `theme-attribute` names. Waited on rather than assumed:
 * a dark pass that never reached the frames is a light pass counted twice, and it would
 * report as coverage.
 */
async function setTheme(page, theme) {
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForFunction((t) => [...document.querySelectorAll('code-preview')].every((preview) => {
    const name = preview.getAttribute('theme-attribute') || 'data-theme';
    return preview.querySelector('iframe')?.contentDocument?.documentElement.getAttribute(name) === t;
  }), theme, { timeout: 5000 });
}

/** The site on an ephemeral port, so a running `script/server` is not in the way. */
function serve() {
  return new Promise((resolve) => {
    const server = createServer(createStaticHandler(SITE));
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function runAxe(frame) {
  // Once per frame: a frame is audited in several states, and axe is half a megabyte to parse.
  if (!await frame.evaluate(() => 'axe' in window)) await frame.addScriptTag({ path: AXE });
  return frame.evaluate(([ctx, opts]) => window.axe.run(ctx, opts), [context, options]);
}

/**
 * Clicks what advertises itself as closed, until nothing new opens.
 * @returns {boolean} Whether anything opened, so the caller can skip a duplicate audit.
 */
async function expandAll(frame, skipped) {
  let opened = false;
  for (let round = 0; round < EXPAND_ROUNDS; round++) {
    const triggers = await frame.locator('[aria-expanded="false"]:visible').all();
    if (!triggers.length) return opened;
    for (const trigger of triggers) {
      // An earlier click in this round can move or replace a later trigger - a submenu
      // that closes its siblings. Gone is not skipped: the next round re-queries.
      if (!await trigger.count()) continue;
      try {
        await trigger.click({ timeout: CLICK_TIMEOUT });
        opened = true;
      } catch {
        skipped.push(await describe(trigger));
      }
    }
  }
  return opened;
}

async function describe(locator) {
  return locator.evaluate((el) => el.outerHTML.slice(0, 80)).catch(() => '<detached>');
}

/**
 * Element tags present in the frame that never registered. The audit is worth nothing
 * without this: a preview whose script failed to load is plain markup with no roles on
 * it, and plain markup passes - a green run over an element that is not there.
 */
function notUpgraded(frame) {
  return frame.evaluate(() => [...new Set(
    [...document.querySelectorAll('*')].map((el) => el.localName).filter((tag) => tag.includes('-'))
  )].filter((tag) => !customElements.get(tag)));
}

/** One frame, audited as authored and again in each state a click can reach. */
async function auditFrame(frame, report) {
  const skipped = [];
  report.dead.push(...await notUpgraded(frame));
  const states = [['as authored', await runAxe(frame)]];

  if (await expandAll(frame, skipped)) states.push(['expanded', await runAxe(frame)]);

  const tabs = await frame.locator('[role="tab"]').all();
  for (const [i, tab] of tabs.entries()) {
    try {
      await tab.click({ timeout: CLICK_TIMEOUT });
      states.push([`tab ${i + 1} of ${tabs.length} selected`, await runAxe(frame)]);
    } catch {
      skipped.push(await describe(tab));
    }
  }

  const switches = await frame.locator('[role="switch"]:not([disabled])').all();
  for (const [i, control] of switches.entries()) {
    try {
      await control.click({ timeout: CLICK_TIMEOUT });
      states.push([`switch ${i + 1} of ${switches.length} toggled`, await runAxe(frame)]);
    } catch {
      skipped.push(await describe(control));
    }
  }

  report.states += states.length;
  report.skipped.push(...skipped);
  return states;
}

/** Every violation, one line of heading and one line per failing node, capped. */
function print(page, frameIndex, state, violations) {
  for (const v of violations) {
    console.log(`\n  ✗ ${v.id} (${v.impact}) — ${page} › preview ${frameIndex} › ${state}`);
    console.log(`    ${v.help}`);
    for (const node of v.nodes.slice(0, 5)) {
      console.log(`    ${node.target.join(' ')}`);
      console.log(`      ${node.failureSummary.replace(/\n/g, '\n      ')}`);
    }
    if (v.nodes.length > 5) console.log(`    …and ${v.nodes.length - 5} more nodes`);
    console.log(`    ${v.helpUrl}`);
  }
}

const pages = demoPages();
if (!pages.length) {
  console.error(`No previews in ${SITE}/. Run script/build first.`);
  process.exit(1);
}

const { server, port } = await serve();
const browser = await chromium.launch();
// Every element switches its motion off under `reduce`, which is what makes a state
// stable enough to measure: sampled mid-transition, a colour reads as whatever the fade
// is currently on, and contrast comes out different on every run.
const page = await browser.newPage({ reducedMotion: 'reduce' });
const report = { violations: 0, frames: 0, states: 0, skipped: [], dead: [], review: new Map() };

for (const path of pages) {
  for (const theme of THEMES) {
    await page.goto(`http://127.0.0.1:${port}/${path}`, { waitUntil: 'load' });
    // The previews write their srcdoc from `connectedCallback`, so the frames exist before
    // the page's load event but their documents do not - wait for the content, not the count.
    await page.waitForFunction(
      () => [...document.querySelectorAll('code-preview iframe')].every(
        (f) => f.contentDocument?.readyState === 'complete' && f.contentDocument.body?.children.length
      ),
      null,
      { timeout: 15000 }
    );
    await setTheme(page, theme);

    const frames = page.frames().filter((f) => f !== page.mainFrame());
    for (const [i, frame] of frames.entries()) {
      // On the first theme only: the second pass is the same previews again, not more of them.
      if (theme === THEMES[0]) report.frames++;
      for (const [state, result] of await auditFrame(frame, report)) {
        report.violations += result.violations.length;
        // Counted by rule and named, never as a bare total: "needing review" is a checked
        // element axe could not decide about - a colour over a gradient, say - and a number
        // with no rule beside it is a number nobody can act on.
        for (const r of result.incomplete) report.review.set(r.id, (report.review.get(r.id) ?? 0) + r.nodes.length);
        print(path, i + 1, `${theme} › ${state}`, result.violations);
      }
    }
  }
}

await browser.close();
server.close();

console.log(
  `\naxe: ${report.states} audits over ${report.frames} previews on ${pages.length} pages,` +
  ` ${THEMES.join(' and ')} — ${report.violations} violations`
);
if (report.review.size) {
  const byRule = [...report.review].map(([id, n]) => `${id} ×${n}`).join(', ');
  console.log(`needing review, decided by hand rather than here: ${byRule}`);
}
if (report.skipped.length) {
  console.log(`${report.skipped.length} controls could not be clicked, and were not audited open:`);
  for (const markup of report.skipped) console.log(`  ${markup}`);
}
if (report.dead.length) {
  console.log(`\n✗ never registered, so the preview audited was plain markup: ${[...new Set(report.dead)].join(', ')}`);
}
process.exit(report.violations || report.dead.length ? 1 : 0);
