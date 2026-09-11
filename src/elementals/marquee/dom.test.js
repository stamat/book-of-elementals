/**
 * What a copy of the track carries - out of the screen reader and out of <kbd>Tab</kbd>, and
 * still under the pointer - and how the lap is held: on the time it was read at rather than
 * one the browser works out, with the pointer and focus on the button left out of it.
 *
 * `index.test.js` pins the sums - how many copies, how long a lap, when to rebuild.
 *
 * Deliberately not covered: the pointer itself, and a real animation. jsdom does no
 * hit-testing, so what stands in for "clickable" is the absence of `inert`; and it has no Web
 * Animations, so the laps here are stand-ins that misbehave the way Safari's did - a pause that
 * freezes on the last resume, a play that starts from nowhere in particular. Whether a real
 * Safari stays put is a reader's hand on a real strip.
 *
 * @jest-environment jsdom
 */

import './index.js';

function copyOf(html) {
  document.body.innerHTML = `<marquee-elemental no-controls>${html}</marquee-elemental>`;
  return document.querySelector('marquee-elemental').copyTrack();
}

/** A lap that pauses the way Safari's did after enough holds: frozen on the time of its last
 * resume, and restarted from wherever `play()` pleases. */
function staleLap(time, name = 'marquee-elemental-lap') {
  return {
    animationName: name,
    playState: 'running',
    currentTime: time,
    startTime: 0,
    timeline: { currentTime: 5000 },
    pause() { this.playState = 'paused'; this.currentTime = 1000; },
    play() { this.playState = 'running'; this.startTime = 0; }
  };
}

function strip(...laps) {
  document.body.innerHTML = '<marquee-elemental><ul><li><a href="/a">A</a></li></ul></marquee-elemental>';
  const el = document.querySelector('marquee-elemental');
  el.querySelector(':scope > ul').getAnimations = () => laps;
  return el;
}

test('a copy of a strip of links is still a strip of links, because the pointer is not the keyboard', () => {
  const [copy] = copyOf('<ul><li><a href="/a">A</a></li></ul>');
  expect(copy.inert).toBeFalsy();
  expect(copy.hasAttribute('inert')).toBe(false);
});

test('everything focusable in a copy is out of the tab order, and nothing else is handed a tabindex', () => {
  const [copy] = copyOf(`<ul>
    <li><a href="/a">A</a></li>
    <li><button>B</button></li>
    <li><span tabindex="0">C</span></li>
    <li><a>no href</a></li>
  </ul>`);
  expect([...copy.querySelectorAll('a[href], button, span')].map((node) => node.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1']);
  expect(copy.querySelector('a:not([href])').hasAttribute('tabindex')).toBe(false);
  expect(copy.hasAttribute('tabindex')).toBe(false);
});

test('a track that is itself a link is taken out of the tab order too, not only what is inside it', () => {
  const [copy] = copyOf('<a href="/a">A</a>');
  expect(copy.getAttribute('tabindex')).toBe('-1');
});

test('a copy is hidden from the screen reader and carries none of the original\'s ids', () => {
  const [copy] = copyOf('<ul id="brands"><li><a id="first" href="/a">A</a></li></ul>');
  expect(copy.getAttribute('aria-hidden')).toBe('true');
  expect(copy.hasAttribute('data-marquee-clone')).toBe(true);
  expect(copy.querySelectorAll('[id]').length + (copy.id ? 1 : 0)).toBe(0);
  expect(document.getElementById('brands')).not.toBe(copy);
});

test('a hold freezes the lap on the time it was read at, not on one the browser works out', () => {
  const lap = staleLap(1234);
  const el = strip(lap);
  el.dispatchEvent(new Event('pointerenter'));
  expect(lap.playState).toBe('paused');
  expect(lap.currentTime).toBe(1234);
});

test('letting go starts the lap from the time it was held at, off the page\'s own clock', () => {
  const lap = staleLap(1234);
  const el = strip(lap);
  el.dispatchEvent(new Event('pointerenter'));
  lap.timeline.currentTime = 9000;
  el.dispatchEvent(new Event('pointerleave'));
  expect(lap.playState).toBe('running');
  expect(lap.startTime).toBe(9000 - 1234);
});

test('every copy is held on the first one\'s time, so a hold puts the strip back in step', () => {
  const first = staleLap(1234);
  const copy = staleLap(1250);
  const el = strip(first, copy);
  el.dispatchEvent(new Event('pointerenter'));
  expect([first.currentTime, copy.currentTime]).toEqual([1234, 1234]);
});

test('the pointer on the button lets the strip run, and on the logos holds it, whatever has focus', () => {
  const lap = staleLap(1234);
  const el = strip(lap);
  el.dispatchEvent(new Event('pointerenter'));
  el.control.dispatchEvent(new Event('pointerenter'));
  expect(el.held).toBe(false);
  expect(lap.playState).toBe('running');
  el.control.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  el.control.dispatchEvent(new Event('pointerleave'));
  expect(el.held).toBe(true);
  expect(lap.playState).toBe('paused');
});

test('focus on a link in the strip holds it, and focus leaving the strip lets it go', () => {
  const lap = staleLap(1234);
  const el = strip(lap);
  const link = el.querySelector('a');
  link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  expect(lap.playState).toBe('paused');
  link.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
  expect(lap.playState).toBe('running');
});

test('off the screen holds the strip, even with the pointer resting on the button', () => {
  const lap = staleLap(1234);
  const el = strip(lap);
  el.dispatchEvent(new Event('pointerenter'));
  el.control.dispatchEvent(new Event('pointerenter'));
  el.setAttribute('data-marquee-offscreen', '');
  el.sync();
  expect(lap.playState).toBe('paused');
  expect(lap.currentTime).toBe(1234);
});

test('the button stops a strip nobody is pointing at, and starts it again from the same frame', () => {
  const lap = staleLap(1234);
  const el = strip(lap);
  el.control.click();
  expect(el.playing).toBe(false);
  expect(lap.currentTime).toBe(1234);
  lap.timeline.currentTime = 7000;
  el.control.click();
  expect(lap.startTime).toBe(7000 - 1234);
});

test('a hold leaves alone any animation that is not the lap', () => {
  const other = staleLap(1234, 'fade-in');
  const el = strip(other);
  el.dispatchEvent(new Event('pointerenter'));
  expect(other.playState).toBe('running');
});

test('a strip taken out of the document forgets the pointer and focus it had, so putting it back does not hold it', () => {
  const lap = staleLap(1234);
  const el = strip(lap);
  el.dispatchEvent(new Event('pointerenter'));
  el.querySelector('a').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  el.remove();
  expect([el.pointerOver, el.focusInside]).toEqual([false, false]);
});
