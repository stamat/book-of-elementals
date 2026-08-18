// The decisions `<modal-elemental>` makes that are not DOM plumbing: what a `closedby`
// value lets close the dialog, which invoker command means what, whether a pointer landed
// on the backdrop or on the box, which dialogs get a cross written into them, what to do
// about one somebody else opened, and how long a close is willing to wait for its
// animation.
//
// Deliberately not covered here: `showModal()`, the top layer, the inertness of the page
// behind and the focus that comes back on close - all of which are the browser's, not this
// element's, and none of which jsdom implements. The exit animation is timed off
// `getAnimations()`, which jsdom does not have either. Both belong to `script/a11y` and to
// the docs demos, where a real browser is running.
import {
  dismissMode, dismissible, commandAction, outside, adoption, writesClose, settleLimit,
  stopMedia, restoreMedia
} from './index.js';

test('a dialog that says nothing closes the way the platform closes one: Escape, not a click outside', () => {
  expect(dismissMode(null)).toBe('closerequest');
  expect(dismissible('closerequest', 'escape')).toBe(true);
  expect(dismissible('closerequest', 'pointer')).toBe(false);
});

test('closedby="any" is the one that closes on the backdrop', () => {
  expect(dismissMode('any')).toBe('any');
  expect(dismissible('any', 'pointer')).toBe(true);
  expect(dismissible('any', 'escape')).toBe(true);
});

test('closedby="none" refuses both, so only a close button gets out', () => {
  expect(dismissMode('none')).toBe('none');
  expect(dismissible('none', 'escape')).toBe(false);
  expect(dismissible('none', 'pointer')).toBe(false);
});

test('a value nobody recognises is the platform default rather than a broken dialog', () => {
  expect(dismissMode('yes please')).toBe('closerequest');
  expect(dismissMode('')).toBe('closerequest');
});

test('closedby is matched however it is cased or spaced, like every enumerated attribute', () => {
  expect(dismissMode('Any')).toBe('any');
  expect(dismissMode(' NONE ')).toBe('none');
});

test('show-modal opens, and both closing commands close', () => {
  expect(commandAction('show-modal')).toBe('open');
  expect(commandAction('close')).toBe('close');
  expect(commandAction('request-close')).toBe('close');
});

test('a command the element does not own is left to the browser', () => {
  expect(commandAction('toggle-popover')).toBe(null);
  expect(commandAction('--custom')).toBe(null);
  expect(commandAction(null)).toBe(null);
});

test('a dialog that can be dismissed is written a cross in the corner', () => {
  expect(writesClose('closerequest')).toBe(true);
  expect(writesClose('any')).toBe(true);
});

test('a dialog that says none is not, because a cross is a dismissal with a different shape', () => {
  expect(writesClose('none')).toBe(false);
});

test('a modal opened by somebody else is taken over, backdrop counted with the rest', () => {
  expect(adoption(true, true, false)).toBe('modal');
});

test('a dialog shown in the page rather than over it is made visible and left out of the stack', () => {
  // `show()` rather than `showModal()`: no backdrop, no inert page, so nothing to count and
  // no reason to lock the page's scroll.
  expect(adoption(true, false, false)).toBe('inline');
});

test('the element does not take over what it opened itself', () => {
  expect(adoption(true, true, true)).toBe(null);
});

test('a closed dialog is nothing to take over, whatever else is true of it', () => {
  expect(adoption(false, false, false)).toBe(null);
  expect(adoption(false, true, false)).toBe(null);
});

test('a close waits for the longest animation it started, and a frame more', () => {
  expect(settleLimit([200, 150])).toBe(250);
});

test('a close with nothing animating does not wait at all', () => {
  expect(settleLimit([])).toBe(0);
  // What an engine that reports its timing in something other than milliseconds looks like
  // from here, and what a stylesheet that never loaded looks like too.
  expect(settleLimit([null, undefined, Infinity])).toBe(0);
});

test('a duration nobody meant to ship still lets go of the modal', () => {
  expect(settleLimit([86400000])).toBe(2000);
});

const BOX = { left: 100, top: 100, right: 300, bottom: 200 };

test('a click on the backdrop is outside the box, whichever side it lands on', () => {
  expect(outside(BOX, 50, 150)).toBe(true);
  expect(outside(BOX, 350, 150)).toBe(true);
  expect(outside(BOX, 200, 50)).toBe(true);
  expect(outside(BOX, 200, 250)).toBe(true);
});

test('a click on the dialog itself is inside it, including on its own padding and its edge', () => {
  expect(outside(BOX, 200, 150)).toBe(false);
  expect(outside(BOX, 100, 100)).toBe(false);
  expect(outside(BOX, 300, 200)).toBe(false);
});

// A frame and a player, with only the surface `stopMedia` touches. What a real browser does
// with the attributes these record - discard the framed document, defer a load on a lazy
// frame nobody can see - is the part no fake can stand in for, and is measured by hand in
// three engines rather than here; the note on `stopMedia` says what was seen.
function fakeFrame(attributes) {
  const state = { ...attributes };
  return {
    attributes: state,
    get src() { return state.src; },
    set src(value) { state.src = value; },
    get loading() { return state.loading; },
    set loading(value) { state.loading = value; },
    getAttribute: (name) => (name in state ? state[name] : null),
    setAttribute: (name, value) => { state[name] = value; },
    removeAttribute: (name) => { delete state[name]; }
  };
}

function fakeDialog(frames, players = []) {
  return {
    querySelectorAll: (selector) => (selector.includes('iframe') ? frames : players)
  };
}

test('a closed modal parks its frames at about:blank, which is what discards a player nothing here can pause', () => {
  const frame = fakeFrame({ src: 'https://example.test/embed?autoplay=1', loading: 'lazy' });
  stopMedia(fakeDialog([frame]));
  expect(frame.src).toBe('about:blank');
  // Eager for that one navigation: a lazy frame in a display:none dialog defers the load
  // and leaves the document that was playing alive behind it.
  expect(frame.loading).toBe('eager');
});

test('opening it again gives the frame back the src and the loading its author wrote', () => {
  const frame = fakeFrame({ src: 'https://example.test/embed?autoplay=1', loading: 'lazy' });
  const dialog = fakeDialog([frame]);
  stopMedia(dialog);
  restoreMedia(dialog);
  expect(frame.src).toBe('https://example.test/embed?autoplay=1');
  expect(frame.loading).toBe('lazy');
});

test('a frame that never said loading does not come back saying eager', () => {
  const frame = fakeFrame({ src: 'https://example.test/embed' });
  const dialog = fakeDialog([frame]);
  stopMedia(dialog);
  restoreMedia(dialog);
  expect(frame.getAttribute('loading')).toBe(null);
});

test('closing twice does not file about:blank as the thing to come back to', () => {
  const frame = fakeFrame({ src: 'https://example.test/embed', loading: 'lazy' });
  const dialog = fakeDialog([frame]);
  // Both closes a real one performs: the element's own, and the `close` event after it.
  stopMedia(dialog);
  stopMedia(dialog);
  restoreMedia(dialog);
  expect(frame.src).toBe('https://example.test/embed');
});

test('a frame nobody parked is left exactly as it is, opened over and over', () => {
  const frame = fakeFrame({ src: 'https://example.test/embed', loading: 'lazy' });
  const dialog = fakeDialog([frame]);
  restoreMedia(dialog);
  restoreMedia(dialog);
  expect(frame.src).toBe('https://example.test/embed');
  expect(frame.loading).toBe('lazy');
});

test('a video is paused where the reader left it, and one already paused is not touched', () => {
  const played = { paused: false, pause() { this.paused = true; } };
  const stopped = { paused: true, pause() { throw new Error('pause() on an already paused player'); } };
  stopMedia(fakeDialog([], [played, stopped]));
  expect(played.paused).toBe(true);
});
