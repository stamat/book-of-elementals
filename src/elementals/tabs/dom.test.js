/**
 * The pattern written onto the markup: the roles, the pairing of a tab to its panel, the roving
 * tabindex, the panels going up and down, and the four ways a selection is made — a click, an
 * arrow, a deep link and find-in-page.
 *
 * `index.test.js` pins `tabKey`, `selectedIndex` and `barBox`, which are the sums. This file is
 * the pattern around them, and it is where the promises live: `role="tab"` says Space activates,
 * one tab stop says Tab passes the strip in one press, and both are things only the element can
 * keep.
 *
 * Deliberately not covered: the sliding bar. jsdom has no `ResizeObserver` and no layout, so the
 * element takes the branch it takes in a browser without one — the border mark, and no numbers
 * written at all, which is asserted here as itself. What a measured bar does over a real layout
 * belongs to the docs page, and `barBox` is where the geometry is pinned.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <tabs-elemental>
    <ul>
      <li><a href="#install">Install</a></li>
      <li><a href="#usage">Usage</a></li>
      <li><a href="#support">Support</a></li>
    </ul>
    <div id="install">One npm install.</div>
    <div id="usage">Import it and write the markup.</div>
    <div id="support">Every browser with custom elements.</div>
  </tabs-elemental>`;

function mount (markup = MARKUP) {
  window.location.hash = '';
  document.body.innerHTML = markup;
  return document.querySelector('tabs-elemental');
}

const tabs = (set) => Array.from(set.querySelectorAll('[role="tab"]'));
const panels = (set) => Array.from(set.querySelectorAll('[data-tabs-panel]'));
const shown = (set) => panels(set).filter((panel) => !panel.hasAttribute('hidden')).map((panel) => panel.id);

function press (target, key, options = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  target.dispatchEvent(event);
  return event;
}

test('the element upgrades over the list of links the author wrote and makes it a tablist', () => {
  const set = mount();
  expect(set.constructor.name).toBe('TabsElemental');
  const list = set.querySelector('ul');
  expect(list.getAttribute('role')).toBe('tablist');
  expect(list.hasAttribute('data-tabs-list')).toBe(true);
  expect(tabs(set)).toHaveLength(3);
});

test('the list items are role="none", because counting list items in a tab strip counts the wrong thing', () => {
  const set = mount();
  for (const item of set.querySelectorAll('li')) expect(item.getAttribute('role')).toBe('none');
});

test('a tab and its panel each say what the other is', () => {
  const set = mount();
  const [install] = tabs(set);
  const panel = document.getElementById('install');
  expect(install.id).toBeTruthy();
  expect(install.getAttribute('aria-controls')).toBe('install');
  expect(panel.getAttribute('role')).toBe('tabpanel');
  expect(panel.getAttribute('aria-labelledby')).toBe(install.id);
});

test('a tab authored as a link to its own panel needs no aria-controls, which is why the markup works without script', () => {
  // The relationship is stated once, in the `href`, rather than in an `id` and an
  // `aria-controls` that can drift apart. The panels are written out of order here, so a
  // pairing that fell back to position would pair them wrongly rather than the same.
  const set = mount(`
    <tabs-elemental>
      <ul>
        <li><a href="#install">Install</a></li>
        <li><a href="#usage">Usage</a></li>
      </ul>
      <div id="usage">Import it and write the markup.</div>
      <div id="install">One npm install.</div>
    </tabs-elemental>`);
  expect(tabs(set).map((tab) => tab.getAttribute('aria-controls'))).toEqual(['install', 'usage']);
  expect(shown(set)).toEqual(['install']);
});

test('aria-controls wins over the fragment where the page wrote both', () => {
  const set = mount(MARKUP.replace('<a href="#install">', '<a href="#install" aria-controls="usage">'));
  expect(tabs(set)[0].getAttribute('aria-controls')).toBe('usage');
});

test('a tab naming nothing takes the child sitting in the same position', () => {
  const set = mount(`
    <tabs-elemental>
      <ul><li><button>One</button></li><li><button>Two</button></li></ul>
      <section>First</section>
      <section>Second</section>
    </tabs-elemental>`);
  const sections = set.querySelectorAll('section');
  expect(tabs(set)[0].getAttribute('aria-controls')).toBe(sections[0].id);
  expect(tabs(set)[1].getAttribute('aria-controls')).toBe(sections[1].id);
  expect(sections[0].id).toMatch(/^tabs-elemental-panel-/);
});

test('a tab that is a button is made a plain one, so changing tabs does not post the page away', () => {
  const set = mount('<tabs-elemental><ul><li><button>One</button></li></ul><div>First</div></tabs-elemental>');
  expect(tabs(set)[0].type).toBe('button');
});

test('the first tab is selected when the markup says nothing, because one tab is always current', () => {
  const set = mount();
  expect(tabs(set).map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  expect(shown(set)).toEqual(['install']);
});

test('the strip is one tab stop, and it is the selected tab', () => {
  // A tab strip is one stop on the way through the page, not one stop per tab.
  const set = mount();
  expect(tabs(set).map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
});

test('the panels nobody is looking at are hidden until-found, so find-in-page still searches them', () => {
  mount();
  expect(document.getElementById('usage').getAttribute('hidden')).toBe('until-found');
  expect(document.getElementById('install').hasAttribute('hidden')).toBe(false);
});

test('a selected attribute is which tab, and a press of another one moves it', () => {
  const set = mount(MARKUP.replace('<tabs-elemental>', '<tabs-elemental selected="1">'));
  expect(shown(set)).toEqual(['usage']);
  tabs(set)[2].click();
  expect(set.getAttribute('selected')).toBe('2');
  expect(shown(set)).toEqual(['support']);
  expect(tabs(set).map((tab) => tab.tabIndex)).toEqual([-1, -1, 0]);
});

test('a selected past the end lands on the last tab, which is the nearest one still there', () => {
  const set = mount(MARKUP.replace('<tabs-elemental>', '<tabs-elemental selected="9">'));
  expect(shown(set)).toEqual(['support']);
});

test('a press on a link-shaped tab does not follow the link, since the panel is already on screen', () => {
  // Following it would scroll to something the reader is looking at and write a fragment they
  // did not ask for into the URL.
  const set = mount();
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  tabs(set)[1].dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(shown(set)).toEqual(['usage']);
});

test('a modified click is asking for a new tab, and it is left to the browser', () => {
  const set = mount();
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
  tabs(set)[1].dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  expect(shown(set)).toEqual(['install']);
});

test('the arrows walk the strip and the selection follows, which is what automatic activation is', () => {
  const set = mount();
  tabs(set)[0].focus();
  press(tabs(set)[0], 'ArrowRight');
  expect(document.activeElement).toBe(tabs(set)[1]);
  expect(shown(set)).toEqual(['usage']);
});

test('the strip wraps at both ends', () => {
  const set = mount();
  tabs(set)[0].focus();
  press(tabs(set)[0], 'ArrowLeft');
  expect(document.activeElement).toBe(tabs(set)[2]);
  press(tabs(set)[2], 'ArrowRight');
  expect(document.activeElement).toBe(tabs(set)[0]);
});

test('Home and End reach the ends of the strip', () => {
  const set = mount();
  tabs(set)[1].focus();
  press(tabs(set)[1], 'End');
  expect(shown(set)).toEqual(['support']);
  press(tabs(set)[2], 'Home');
  expect(shown(set)).toEqual(['install']);
});

test('the other axis is left where it was pressed, so the page still scrolls under the strip', () => {
  const set = mount();
  tabs(set)[0].focus();
  expect(press(tabs(set)[0], 'ArrowDown').defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(tabs(set)[0]);
});

test('a vertical strip says so and swaps which arrows are its own', () => {
  const set = mount(MARKUP.replace('<tabs-elemental>', '<tabs-elemental vertical>'));
  expect(set.querySelector('ul').getAttribute('aria-orientation')).toBe('vertical');
  tabs(set)[0].focus();
  expect(press(tabs(set)[0], 'ArrowRight').defaultPrevented).toBe(false);
  press(tabs(set)[0], 'ArrowDown');
  expect(shown(set)).toEqual(['usage']);
});

test('a horizontal strip writes no aria-orientation, since horizontal is the role\'s own default', () => {
  const set = mount();
  expect(set.querySelector('ul').hasAttribute('aria-orientation')).toBe(false);
});

test('turning the strip on its side turns the arrows with it', () => {
  const set = mount();
  set.vertical = true;
  expect(set.querySelector('ul').getAttribute('aria-orientation')).toBe('vertical');
  tabs(set)[0].focus();
  press(tabs(set)[0], 'ArrowDown');
  expect(shown(set)).toEqual(['usage']);
  set.vertical = false;
  expect(set.querySelector('ul').hasAttribute('aria-orientation')).toBe(false);
});

test('manual activation moves the focus and leaves the panel alone until the tab is pressed', () => {
  // For a panel whose content arrives over the network, where arrowing past four tabs would
  // start four requests nobody asked for.
  const set = mount(MARKUP.replace('<tabs-elemental>', '<tabs-elemental manual>'));
  tabs(set)[0].focus();
  press(tabs(set)[0], 'ArrowRight');
  expect(document.activeElement).toBe(tabs(set)[1]);
  expect(shown(set)).toEqual(['install']);
  tabs(set)[1].click();
  expect(shown(set)).toEqual(['usage']);
});

test('Space on a link-shaped tab selects, because role="tab" promised it would', () => {
  // On a link Space scrolls. On the one element where the role is a promise the platform does
  // not keep, the element keeps it.
  const set = mount(MARKUP.replace('<tabs-elemental>', '<tabs-elemental manual>'));
  tabs(set)[1].focus();
  const event = press(tabs(set)[1], ' ');
  expect(event.defaultPrevented).toBe(true);
  expect(shown(set)).toEqual(['usage']);
});

test('a key pressed on a link inside a panel is not the strip\'s', () => {
  const set = mount(MARKUP.replace('<div id="install">One npm install.</div>', '<div id="install"><a href="/elsewhere" id="inner">Elsewhere</a></div>'));
  const inner = document.getElementById('inner');
  inner.focus();
  expect(press(inner, 'ArrowRight').defaultPrevented).toBe(false);
  expect(shown(set)).toEqual(['install']);
});

test('a panel with nothing focusable in it is given a tab stop, and one full of links is not', () => {
  // A panel a keyboard cannot reach is a panel it cannot scroll either.
  mount();
  expect(document.getElementById('install').tabIndex).toBe(0);

  const withLink = mount(MARKUP.replace('<div id="install">One npm install.</div>', '<div id="install"><a href="/a">A</a></div>'));
  expect(document.getElementById('install').hasAttribute('tabindex')).toBe(false);
  expect(withLink.querySelector('#usage').hasAttribute('tabindex')).toBe(false);
});

test('a panel going back under keeps no tab stop, since its contents are skipped', () => {
  const set = mount();
  expect(document.getElementById('install').tabIndex).toBe(0);
  tabs(set)[1].click();
  expect(document.getElementById('install').hasAttribute('tabindex')).toBe(false);
  expect(document.getElementById('usage').tabIndex).toBe(0);
});

test('a selection says which tab, which panel and where it is', () => {
  const set = mount();
  const heard = [];
  document.addEventListener('tabs-select', (e) => heard.push(e.detail));
  tabs(set)[2].click();
  expect(heard).toEqual([{ tab: tabs(set)[2], panel: document.getElementById('support'), index: 2 }]);
});

test('asking for the sliding bar is not a selection, and says nothing', () => {
  const set = mount();
  const heard = [];
  document.addEventListener('tabs-select', () => heard.push(true));
  set.sliding = true;
  set.vertical = true;
  expect(heard).toEqual([]);
});

test('a browser with no ResizeObserver keeps the border mark rather than a bar measured once', () => {
  // jsdom is that browser. A number taken once and never corrected is a bar parked under a tab
  // that has since moved - worse than the border it replaced.
  const set = mount(MARKUP.replace('<tabs-elemental>', '<tabs-elemental sliding>'));
  expect(set.hasAttribute('data-tabs-sliding')).toBe(false);
  expect(set.style.getPropertyValue('--tabs-elemental-tab-start')).toBe('');
});

test('a link into a panel lands on that panel showing, and says nothing about it', () => {
  // The no-script story arriving: the tabs are in-page links, and following one before this
  // element upgrades leaves exactly this fragment in the URL. The reader is owed the panel, not
  // an event.
  const heard = [];
  document.addEventListener('tabs-select', () => heard.push(true));
  window.location.hash = '#support';
  document.body.innerHTML = MARKUP;
  const set = document.querySelector('tabs-elemental');
  expect(shown(set)).toEqual(['support']);
  expect(heard).toEqual([]);
});

test('a fragment naming something inside a panel selects that panel', () => {
  window.location.hash = '#deep';
  document.body.innerHTML = MARKUP.replace('<div id="usage">Import it and write the markup.</div>', '<div id="usage"><p id="deep">Deep</p></div>');
  const set = document.querySelector('tabs-elemental');
  expect(shown(set)).toEqual(['usage']);
});

test('a percent-encoded fragment finds the id it names', () => {
  window.location.hash = '#caf%C3%A9';
  document.body.innerHTML = MARKUP.replace('id="usage"', 'id="café"');
  const set = document.querySelector('tabs-elemental');
  expect(shown(set)).toEqual(['café']);
});

test('the tab set follows the URL changing under it', () => {
  const set = mount();
  window.location.hash = '#support';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(shown(set)).toEqual(['support']);
});

test('find-in-page reaching a hidden panel selects its tab rather than leaving the strip disagreeing', () => {
  const set = mount();
  document.getElementById('support').dispatchEvent(new Event('beforematch', { bubbles: true }));
  expect(shown(set)).toEqual(['support']);
  expect(tabs(set)[2].getAttribute('aria-selected')).toBe('true');
});

test('a tab added by the page joins the set when wire() says so', () => {
  // Nothing observes the markup on the element's behalf, which would be a `MutationObserver`
  // running on every page that never touches its tabs.
  const set = mount();
  set.querySelector('ul').insertAdjacentHTML('beforeend', '<li><a href="#extra">Extra</a></li>');
  set.insertAdjacentHTML('beforeend', '<div id="extra">Extra panel</div>');
  set.wire();
  expect(tabs(set)).toHaveLength(4);
  expect(document.getElementById('extra').getAttribute('role')).toBe('tabpanel');
  expect(document.getElementById('extra').getAttribute('hidden')).toBe('until-found');
});

test('a panel whose tab has gone is handed back, not left hidden by an element with nothing to show it', () => {
  const set = mount();
  const orphan = document.getElementById('support');
  set.querySelector('li:last-child').remove();
  set.wire();
  expect(orphan.hasAttribute('hidden')).toBe(false);
  expect(orphan.hasAttribute('role')).toBe(false);
  expect(orphan.hasAttribute('data-tabs-panel')).toBe(false);
});

test('an element whose only list belongs to a nested set has no strip of its own', () => {
  // The guard that keeps the outer element from claiming the inner one's tabs. Without a list
  // of its own there is nothing here to upgrade.
  const set = mount(`
    <tabs-elemental id="outer">
      <div>
        <tabs-elemental id="inner">
          <ul><li><a href="#a">A</a></li><li><a href="#b">B</a></li></ul>
          <div id="a">A panel</div>
          <div id="b">B panel</div>
        </tabs-elemental>
      </div>
    </tabs-elemental>`);
  expect(set.tablist).toBe(null);
  const inner = document.getElementById('inner');
  expect(inner.querySelector('ul').getAttribute('role')).toBe('tablist');
  expect(inner.tabs.map((tab) => tab.textContent)).toEqual(['A', 'B']);
});

test('a nested tab set keeps its own strip', () => {
  const set = mount(`
    <tabs-elemental id="outer">
      <ul><li><a href="#one">One</a></li><li><a href="#two">Two</a></li></ul>
      <div id="one">
        <tabs-elemental id="inner">
          <ul><li><a href="#a">A</a></li><li><a href="#b">B</a></li></ul>
          <div id="a">A panel</div>
          <div id="b">B panel</div>
        </tabs-elemental>
      </div>
      <div id="two">Two panel</div>
    </tabs-elemental>`);
  const inner = document.getElementById('inner');
  expect(set.tabs.map((tab) => tab.textContent)).toEqual(['One', 'Two']);
  expect(inner.tabs.map((tab) => tab.textContent)).toEqual(['A', 'B']);
});

test('an element with no list in it yet is left alone, and builds when it is next connected', () => {
  const set = mount('<tabs-elemental></tabs-elemental>');
  expect(set.querySelector('[role="tablist"]')).toBe(null);
  set.innerHTML = '<ul><li><a href="#p">P</a></li></ul><div id="p">P panel</div>';
  set.remove();
  document.body.append(set);
  expect(set.querySelector('ul').getAttribute('role')).toBe('tablist');
});

test('everything the element wrote comes off when it goes, and every panel comes back', () => {
  // A `role="tab"` nobody is driving is a keyboard contract with no keyboard behind it, and a
  // panel hidden by an element that is no longer here has nothing left to show it again.
  const set = mount(MARKUP.replace('<tabs-elemental>', '<tabs-elemental vertical>'));
  const list = set.querySelector('ul');
  const strip = tabs(set);
  const boxes = [document.getElementById('install'), document.getElementById('usage')];
  set.remove();

  expect(list.hasAttribute('role')).toBe(false);
  expect(list.hasAttribute('aria-orientation')).toBe(false);
  expect(list.hasAttribute('data-tabs-list')).toBe(false);
  expect(set.querySelector('li').hasAttribute('role')).toBe(false);
  for (const tab of strip) {
    expect(tab.hasAttribute('role')).toBe(false);
    expect(tab.hasAttribute('aria-selected')).toBe(false);
    expect(tab.hasAttribute('aria-controls')).toBe(false);
    expect(tab.hasAttribute('tabindex')).toBe(false);
  }
  for (const panel of boxes) {
    expect(panel.hasAttribute('hidden')).toBe(false);
    expect(panel.hasAttribute('role')).toBe(false);
    expect(panel.hasAttribute('aria-labelledby')).toBe(false);
    expect(panel.hasAttribute('data-tabs-panel')).toBe(false);
    expect(panel.hasAttribute('tabindex')).toBe(false);
  }
});

test('an element that has gone stops answering clicks and the URL', () => {
  // The panels are outside the element here, so they are still in the document after it goes -
  // which is the only way a hashchange handler left behind would have anything to find.
  const set = mount(`
    <tabs-elemental>
      <ul><li><a href="#p1">One</a></li><li><a href="#p2">Two</a></li></ul>
    </tabs-elemental>
    <div id="p1">One panel</div>
    <div id="p2">Two panel</div>`);
  const strip = tabs(set);
  expect(document.getElementById('p2').getAttribute('hidden')).toBe('until-found');

  set.remove();
  expect(document.getElementById('p2').hasAttribute('hidden')).toBe(false);

  strip[1].click();
  window.location.hash = '#p2';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(set.getAttribute('selected')).toBe(null);
});
