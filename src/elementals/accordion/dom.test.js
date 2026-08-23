/**
 * What this element adds to native `<details>`: the two boxes a height animation needs, the
 * exclusivity, the arrow-key walk along the headers, the event `toggle` cannot bubble, and the
 * deep link that opens the panel a fragment points into.
 *
 * `index.test.js` pins `exclusiveOpen`, which is the one decision. This file is the coordination
 * around it, and it is where the element could quietly stop being a coordinator: a wrapper
 * nested twice, a nested accordion's panels claimed by the one around it, a panel closed by the
 * shared `name` the instant a sibling opens.
 *
 * Deliberately not covered: the slide itself. jsdom has no layout and no stylesheet, so
 * `slide()` reads a transition duration of zero and finishes synchronously — which is the same
 * branch a reader with reduced motion takes, and it is the one that lets the state machine be
 * checked at all. What a panel looks like on its way open belongs to the docs page. Nor the
 * shared `name`: jsdom's `<details>` has no `name` property, so exclusivity is checked as the
 * element enforces it itself, which is the half that runs before the browser's ever would.
 *
 * Two things here are out of reach rather than left out. The `name` coming *off* a panel for the
 * length of a close has no window to be seen in when the slide finishes synchronously — only
 * that it is back afterwards is checked. And a detached group's `hashchange` listener cannot be
 * caught doing anything, because the panels went with it and `getElementById` no longer finds
 * them; the listener still comes off, and a browser is where that would show.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <accordion-elemental>
    <details>
      <summary>First</summary>
      <p id="first-body">First answer.</p>
    </details>
    <details>
      <summary>Second</summary>
      <p id="second-body">Second answer.</p>
    </details>
    <details>
      <summary>Third</summary>
      <p id="third-body">Third answer.</p>
    </details>
  </accordion-elemental>`;

function mount (markup = MARKUP) {
  window.location.hash = '';
  document.body.innerHTML = markup;
  return document.querySelector('accordion-elemental');
}

const panels = (group) => Array.from(group.querySelectorAll(':scope > details'));
const headers = (group) => panels(group).map((panel) => panel.querySelector(':scope > summary'));
const open = (group) => panels(group).map((panel) => panel.open);

function press (target, key) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

test('the element upgrades over the details the author wrote', () => {
  const group = mount();
  expect(group.constructor.name).toBe('AccordionElemental');
  expect(panels(group)).toHaveLength(3);
});

test('a panel body is moved into two boxes, because the animated one cannot be the padded one', () => {
  // `box-sizing: border-box` renders `height: 0` as the padding, so a panel with its inset on
  // the animated box slides shut down to that and then cuts.
  const group = mount();
  const wrapper = panels(group)[0].querySelector(':scope > .accordion-elemental-content-wrapper');
  const content = wrapper.querySelector(':scope > .accordion-elemental-content');
  expect(content).toBeTruthy();
  expect(content.querySelector('#first-body')).toBeTruthy();
  expect(panels(group)[0].querySelector(':scope > summary')).toBeTruthy();
});

test('the summary stays where it was, and everything after it is the body', () => {
  const group = mount();
  const panel = panels(group)[0];
  expect(panel.children[0].tagName).toBe('SUMMARY');
  expect(panel.children[1].className).toBe('accordion-elemental-content-wrapper');
  expect(panel.children).toHaveLength(2);
});

test('a move in the DOM does not nest a second wrapper inside the first', () => {
  const group = mount();
  for (let i = 0; i < 3; i++) {
    group.remove();
    document.body.append(group);
  }
  expect(panels(group)[0].querySelectorAll('.accordion-elemental-content-wrapper')).toHaveLength(1);
});

test('a details with no summary is left alone, since there is nothing to open it with', () => {
  const group = mount(MARKUP.replace('<summary>First</summary>', ''));
  expect(panels(group)[0].querySelector('.accordion-elemental-content-wrapper')).toBe(null);
});

test('a press on a summary opens its panel, and the element takes the toggle over to do it', () => {
  // The close has to outlive the click: `<details>` sets its contents to `display: none` the
  // moment it closes, which would cut the slide off at frame one.
  const group = mount();
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  headers(group)[1].dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(open(group)).toEqual([false, true, false]);
});

test('a second press closes it again', () => {
  const group = mount();
  headers(group)[1].click();
  headers(group)[1].click();
  expect(open(group)).toEqual([false, false, false]);
});

test('a plain group lets the reader open as many panels as they like', () => {
  const group = mount();
  headers(group)[0].click();
  headers(group)[2].click();
  expect(open(group)).toEqual([true, false, true]);
});

test('an exclusive group opens one panel and closes whichever was open', () => {
  const group = mount(MARKUP.replace('<accordion-elemental>', '<accordion-elemental exclusive>'));
  headers(group)[0].click();
  expect(open(group)).toEqual([true, false, false]);
  headers(group)[2].click();
  expect(open(group)).toEqual([false, false, true]);
});

test('an exclusive group authored with several panels open keeps the first, everywhere', () => {
  // Naming several already-open panels leaves it to the browser which survives, and a group
  // that opens on a different panel depending on the engine is not a group anybody authored.
  const group = mount(MARKUP.replace(/<details>/g, '<details open>').replace('<accordion-elemental>', '<accordion-elemental exclusive>'));
  expect(open(group)).toEqual([true, false, false]);
});

test('a plain group authored with several panels open keeps all of them', () => {
  const group = mount(MARKUP.replace(/<details>/g, '<details open>'));
  expect(open(group)).toEqual([true, true, true]);
});

test('the exclusivity name is taken off for the length of a close, and put back after', () => {
  // With it in place the browser slams the closing panel shut the moment a sibling opens, and
  // the panel has to stay `open` for the whole slide.
  const group = mount(MARKUP.replace(/<details>/g, '<details name="faq">').replace('<accordion-elemental>', '<accordion-elemental exclusive>'));
  headers(group)[0].click();
  expect(panels(group)[0].getAttribute('name')).toBe('faq');
  headers(group)[0].click();
  expect(panels(group)[0].getAttribute('name')).toBe('faq');
  expect(panels(group)[0].open).toBe(false);
});

test('the arrows walk the headers and wrap at both ends', () => {
  const group = mount();
  headers(group)[0].focus();
  press(headers(group)[0], 'ArrowDown');
  expect(document.activeElement).toBe(headers(group)[1]);
  press(headers(group)[1], 'ArrowUp');
  expect(document.activeElement).toBe(headers(group)[0]);
  press(headers(group)[0], 'ArrowUp');
  expect(document.activeElement).toBe(headers(group)[2]);
});

test('Home and End reach the ends of the group', () => {
  const group = mount();
  headers(group)[1].focus();
  press(headers(group)[1], 'End');
  expect(document.activeElement).toBe(headers(group)[2]);
  press(headers(group)[2], 'Home');
  expect(document.activeElement).toBe(headers(group)[0]);
});

test('a key the group answers is taken from the page, and one it does not is left alone', () => {
  const group = mount();
  headers(group)[0].focus();
  expect(press(headers(group)[0], 'ArrowDown').defaultPrevented).toBe(true);
  expect(press(headers(group)[0], 'Tab').defaultPrevented).toBe(false);
  expect(press(headers(group)[0], 'PageDown').defaultPrevented).toBe(false);
});

test('a nested accordion handles itself, and the group around it does not claim its panels', () => {
  const group = mount(`
    <accordion-elemental id="outer">
      <details>
        <summary>Outer</summary>
        <accordion-elemental id="inner">
          <details><summary>Inner one</summary><p>A</p></details>
          <details><summary>Inner two</summary><p>B</p></details>
        </accordion-elemental>
      </details>
      <details><summary>Outer two</summary><p>C</p></details>
    </accordion-elemental>`);
  const inner = document.getElementById('inner');
  expect(panels(group)).toHaveLength(2);
  expect(panels(inner)).toHaveLength(2);

  const innerHeaders = headers(inner);
  innerHeaders[0].focus();
  press(innerHeaders[0], 'ArrowDown');
  expect(document.activeElement).toBe(innerHeaders[1]);

  innerHeaders[0].click();
  expect(open(inner)).toEqual([true, false]);
  expect(open(group)).toEqual([false, false]);
});

test('a panel toggling says so on the group, because toggle does not bubble', async () => {
  const group = mount();
  const heard = [];
  document.addEventListener('accordion-toggle', (e) => heard.push([e.detail.panel, e.detail.open]));
  headers(group)[1].click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(heard).toEqual([[panels(group)[1], true]]);
});

test('a link to a single question lands on it opened', () => {
  window.location.hash = '#second-body';
  document.body.innerHTML = MARKUP;
  const group = document.querySelector('accordion-elemental');
  expect(open(group)).toEqual([false, true, false]);
});

test('a deep link into a nested panel opens its ancestors too', () => {
  window.location.hash = '#deep';
  document.body.innerHTML = `
    <accordion-elemental>
      <details>
        <summary>Outer</summary>
        <details><summary>Inner</summary><p id="deep">Deep</p></details>
      </details>
    </accordion-elemental>`;
  const group = document.querySelector('accordion-elemental');
  expect(group.querySelector(':scope > details').open).toBe(true);
  expect(group.querySelector('details details').open).toBe(true);
});

test('a fragment naming something outside the group opens nothing', () => {
  window.location.hash = '#elsewhere';
  document.body.innerHTML = MARKUP + '<p id="elsewhere">Elsewhere</p>';
  const group = document.querySelector('accordion-elemental');
  expect(open(group)).toEqual([false, false, false]);
});

test('the group follows the URL changing under it', () => {
  const group = mount();
  window.location.hash = '#third-body';
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  expect(open(group)).toEqual([false, false, true]);
});

test('an element with no panels in it yet is left alone, and coordinates when next connected', () => {
  const group = mount('<accordion-elemental></accordion-elemental>');
  expect(group.querySelector('.accordion-elemental-content-wrapper')).toBe(null);
  group.innerHTML = '<details><summary>One</summary><p>A</p></details>';
  group.remove();
  document.body.append(group);
  expect(group.querySelector('.accordion-elemental-content-wrapper')).toBeTruthy();
});

test('an element that has gone hands the panels back to the browser', () => {
  // Which is the honest end state: the click is not taken over any more, so `<details>` opens
  // itself the way it did before this element existed.
  const group = mount();
  group.remove();
  const click = new MouseEvent('click', { bubbles: true, cancelable: true });
  headers(group)[1].dispatchEvent(click);
  expect(click.defaultPrevented).toBe(false);
  expect(open(group)).toEqual([false, true, false]);
});

test('an element that has gone stops walking the headers', () => {
  const group = mount();
  group.remove();
  headers(group)[0].focus();
  expect(press(headers(group)[0], 'ArrowDown').defaultPrevented).toBe(false);
  expect(document.activeElement).not.toBe(headers(group)[1]);
});
