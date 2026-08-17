// The one sum this element does: where the pointer sits inside the box, turned into the two
// angles the card is drawn at and the point the glare is centred on. Plus the one number it
// copies out of the markup, `data-tilt-depth` — a parse, and therefore the place a typo
// becomes a `calc()` that will not resolve and a layer that never moves.
//
// The sign convention is the part worth pinning to numbers rather than to a browser, because
// nothing about `rotateX` says which way is which: a positive angle sends the top edge away
// from the reader, and reading that off a screen once is how a library ends up tilting the
// wrong way on the axis nobody demoed.
//
// Deliberately not covered: the listeners, the reduced-motion branch, the frame batching and
// the layer walk. Jest runs under Node here with no jsdom, so an element test would assert
// against a stub base class — and "the card holds still for a reader who asked for less
// motion" is a thing only a real browser shows. `script/a11y` drives the docs demo instead.

import { tiltFrom, layerDepth, DEFAULT_MAX } from './index.js';

/** A 200x100 box at the origin. Wider than it is tall, so a bug that swaps the two axes
 * cannot hide behind a square. */
const box = { left: 0, top: 0, width: 200, height: 100 };

test('the middle of the box is a card lying flat, with the glare in the middle of it', () => {
  expect(tiltFrom(box, 100, 50)).toEqual({ x: 0, y: 0, glareX: 50, glareY: 50 });
});

test('the edge the pointer is nearest is the edge that goes away from the reader', () => {
  // A positive `rotateX` sends the top edge back, a positive `rotateY` sends the right edge
  // back. Pointer at the top-left corner: the top goes back, and so does the left, which is
  // the negative half of the second angle.
  expect(tiltFrom(box, 0, 0)).toEqual({ x: DEFAULT_MAX, y: -DEFAULT_MAX, glareX: 0, glareY: 0 });
  expect(tiltFrom(box, 200, 100)).toEqual({ x: -DEFAULT_MAX, y: DEFAULT_MAX, glareX: 100, glareY: 100 });
});

test('the box is measured from where it is, not from the corner of the screen', () => {
  const scrolled = { left: 500, top: 300, width: 200, height: 100 };
  expect(tiltFrom(scrolled, 600, 350)).toEqual({ x: 0, y: 0, glareX: 50, glareY: 50 });
});

test('reverse turns the card towards the pointer instead of away from it', () => {
  expect(tiltFrom(box, 0, 0, { reverse: true })).toEqual({
    x: -DEFAULT_MAX, y: DEFAULT_MAX, glareX: 0, glareY: 0
  });
});

test('the glare stays where the pointer is, whichever way the card is tilting', () => {
  // Reverse flips the angles and not the highlight: the light is where the reader is
  // pointing, and it does not move to the other side of the card because the card leaned
  // the other way.
  const forward = tiltFrom(box, 150, 25);
  const back = tiltFrom(box, 150, 25, { reverse: true });
  expect(forward.glareX).toBe(75);
  expect(forward.glareY).toBe(25);
  expect(back.glareX).toBe(forward.glareX);
  expect(back.glareY).toBe(forward.glareY);
});

test('axis locks the rotation it does not name, and leaves the one it does alone', () => {
  // `axis="x"` keeps the rotation about the x-axis — the card nodding as the pointer moves
  // up and down — and takes the other away. vanilla-tilt spells the same word the other way
  // round, which is exactly why this is a test and not a comment.
  expect(tiltFrom(box, 0, 0, { axis: 'x' })).toEqual({ x: DEFAULT_MAX, y: 0, glareX: 0, glareY: 0 });
  expect(tiltFrom(box, 0, 0, { axis: 'y' })).toEqual({ x: 0, y: -DEFAULT_MAX, glareX: 0, glareY: 0 });
});

test('a pointer outside the box cannot tilt it further than its own edge does', () => {
  // The pointer is outside on the frame the reader leaves, and a child that captured the
  // pointer can report a position beyond the box at any time. Unclamped, one flick off the
  // corner is a card standing on its side.
  expect(tiltFrom(box, -5000, -5000)).toEqual(tiltFrom(box, 0, 0));
  expect(tiltFrom(box, 5000, 5000)).toEqual(tiltFrom(box, 200, 100));
});

test('a max of zero is a card that does not tilt, and the glare still follows the pointer', () => {
  // Zero is a number an author means: a glare with no movement under it. It is the reason
  // this cannot fall back on falsiness the way a speed or a duration can.
  expect(tiltFrom(box, 0, 0, { max: 0 })).toEqual({ x: 0, y: 0, glareX: 0, glareY: 0 });
});

test('a max that is not a number tilts by the default rather than by NaN degrees', () => {
  // `max="a lot"` is the attribute someone writes once. A NaN angle is a transform the
  // browser drops entirely, which is a card that never moves and no error anywhere.
  expect(tiltFrom(box, 0, 0, { max: NaN }).x).toBe(DEFAULT_MAX);
  expect(tiltFrom(box, 0, 0, { max: -20 }).x).toBe(DEFAULT_MAX);
  expect(tiltFrom(box, 0, 0, { max: Infinity }).x).toBe(DEFAULT_MAX);
});

test('a box with no area is flat, with the glare in the middle rather than at NaN per cent', () => {
  // A closed `<details>`, a hidden tab panel, or the frame before layout. Dividing by that
  // zero puts `NaN%` into a gradient, which drops the whole background rather than the one
  // value that was wrong.
  expect(tiltFrom({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toEqual({
    x: 0, y: 0, glareX: 50, glareY: 50
  });
});

test('the angle is rounded, because the raw one ends up in the DOM for anyone to read', () => {
  const odd = { left: 0, top: 0, width: 300, height: 300 };
  expect(tiltFrom(odd, 100, 100, { max: 20 })).toEqual({
    x: 6.667, y: -6.667, glareX: 33.333, glareY: 33.333
  });
});

test('a layer depth is the number the author wrote', () => {
  expect(layerDepth('40')).toBe(40);
  expect(layerDepth('-12.5')).toBe(-12.5);
  expect(layerDepth('0')).toBe(0);
});

test('a depth that is not a number is no depth, rather than a transform that will not parse', () => {
  // The value is copied into a custom property and multiplied by a length. Anything that is
  // not a number makes the whole `transform` invalid at computed-value time, which takes the
  // card's rotation down with the layer's rise.
  expect(layerDepth('far')).toBe(null);
  expect(layerDepth('')).toBe(null);
  expect(layerDepth(null)).toBe(null);
  expect(layerDepth('40px')).toBe(null);
});
