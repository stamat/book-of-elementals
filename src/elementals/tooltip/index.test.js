// The two decisions `<tooltip-elemental>` makes that are not DOM plumbing: where a
// `title`'s words belong, and what hover, focus and Escape do to each other.
//
// Deliberately not covered here: the wiring itself - `aria-describedby`, the `hidden`
// toggle, the fixed-position maths - which needs a document and belongs to `script/a11y`
// and the docs demo. The placement decision is book-of-spells' `placeFlyout`, tested there.
import { titleRole, nextTooltipState, arrowOffset, alignOnAxis } from './index.js';

const CLOSED = { hovering: false, focused: false, dismissed: false, open: false };

const run = (events, from = CLOSED) => events.reduce(nextTooltipState, from);

test('a title on a control that has a name of its own describes it', () => {
  expect(titleRole({ text: 'Save', ariaLabel: null, ariaLabelledby: null })).toBe('description');
  expect(titleRole({ text: '', ariaLabel: 'Save', ariaLabelledby: null })).toBe('description');
  expect(titleRole({ text: '', ariaLabel: null, ariaLabelledby: 'label-1' })).toBe('description');
});

test('a title on an icon-only control is the only name it has, so it stays its name', () => {
  expect(titleRole({ text: '', ariaLabel: null, ariaLabelledby: null })).toBe('name');
  // Whitespace is what an icon-only button's markup is full of, and it names nothing.
  expect(titleRole({ text: '\n  ', ariaLabel: null, ariaLabelledby: null })).toBe('name');
});

test('hover shows it and leaving hides it', () => {
  expect(run(['pointerenter']).open).toBe(true);
  expect(run(['pointerenter', 'pointerleave']).open).toBe(false);
});

test('focus shows it, and the pointer leaving does not take it away from a keyboard', () => {
  expect(run(['focus']).open).toBe(true);
  expect(run(['focus', 'pointerenter', 'pointerleave']).open).toBe(true);
  expect(run(['pointerenter', 'focus', 'blur']).open).toBe(true);
});

test('Escape dismisses it, and moving the pointer over the same control does not bring it back', () => {
  const dismissed = run(['pointerenter', 'escape']);
  expect(dismissed.open).toBe(false);
  expect(nextTooltipState(dismissed, 'pointerenter').open).toBe(false);
});

test('leaving is what arms Escape again, by pointer and by focus both', () => {
  // Dismissed while hovering: the pointer leaving is the reader having left.
  expect(run(['pointerenter', 'escape', 'pointerleave', 'pointerenter']).open).toBe(true);
  // Dismissed while focused *and* hovered: one of the two leaving is not leaving.
  const held = run(['pointerenter', 'focus', 'escape', 'pointerleave']);
  expect(held.open).toBe(false);
  expect(nextTooltipState(held, 'pointerenter').open).toBe(false);
  expect(run([...['pointerenter', 'focus', 'escape', 'pointerleave', 'blur'], 'focus']).open).toBe(true);
});

test('an event it does not handle changes nothing at all', () => {
  const open = run(['pointerenter']);
  expect(nextTooltipState(open, 'click')).toBe(open);
});

// A 200-wide button at x=100, so its middle is at 300.
const WIDE = { left: 100, right: 500, top: 40, bottom: 80 };
const BUBBLE = { left: 100, top: 86, width: 120, height: 24 };

test('the caret is offered the middle of the trigger, not the edge the bubble was aligned to', () => {
  // Aligned at the button's left edge, the bubble ends long before its middle - which is
  // the case a fixed inset from the corner gets wrong.
  expect(arrowOffset(WIDE, BUBBLE, false, false)).toBe(200);
});

test('in RTL the same offset is measured from the other edge, so one property serves both', () => {
  expect(arrowOffset(WIDE, BUBBLE, false, true)).toBe(-80);
  // Aligned to the inline start in RTL - the right edges meet - it lands inside the bubble.
  expect(arrowOffset(WIDE, { ...BUBBLE, left: 380 }, false, true)).toBe(200);
});

test('beside the trigger the caret runs down the other axis', () => {
  expect(arrowOffset(WIDE, { ...BUBBLE, left: 506, top: 40 }, true, false)).toBe(20);
});

test('a control wider than its bubble gets the bubble centred on it, caret out of the middle', () => {
  // The 400-wide button of WIDE against a 120-wide bubble: 100 + (400 - 120) / 2.
  expect(alignOnAxis(WIDE.left, WIDE.right, 120, 1000, true, true)).toBe(240);
  // Which is the middle of both, so the caret has nowhere to be but centred.
  expect(arrowOffset(WIDE, { ...BUBBLE, left: 240 }, false, false)).toBe(60);
});

// The width of the two used to decide this: a control narrower than its bubble was aligned
// to an edge instead, so most of a long sentence sat to one side of the small button it
// belonged to. A bubble that is only a little wider than its trigger - an icon button and
// one word - then looked plainly wrong, sitting off to the left of what it named. Centring
// is now the answer at every width, and the caret is what carries the pointing either way.
test('a bubble is centred on its trigger whatever the two of them measure', () => {
  // A 40-wide control against a 200-wide bubble: (100 + 140) / 2 - 100. Which edge the
  // placement preferred does not come into it, because centring has no sides.
  expect(alignOnAxis(100, 140, 200, 1000, true, true)).toBe(20);
  expect(alignOnAxis(100, 140, 200, 1000, false, true)).toBe(20);
});

test('an edge-aligned bubble is still the placement the caller asked for', () => {
  expect(alignOnAxis(100, 400, 200, 1000, true, false)).toBe(100);
  expect(alignOnAxis(100, 400, 200, 1000, false, false)).toBe(200);
});

// The viewport is the last word on both answers. `placeFlyout` refuses to centre where a
// centred bubble would not fit, but the edge it falls back to can run off just as easily -
// so the clamp is here, after either of them, rather than trusted to the choice above it.
test('neither answer is allowed to put the bubble outside the viewport', () => {
  // A wide control against the left edge, and against the right.
  expect(alignOnAxis(-40, 200, 120, 1000, true, true)).toBe(20);
  expect(alignOnAxis(800, 1040, 120, 1000, true, true)).toBe(860);
  // A control running off the far edge: centred would be 340, and the last place the bubble
  // fits is 180.
  expect(alignOnAxis(200, 600, 120, 300, true, true)).toBe(180);
  // A bubble wider than the viewport has nowhere to go, and is put at the near edge rather
  // than at a negative one.
  expect(alignOnAxis(0, 400, 500, 300, true, true)).toBe(0);
  // And the edge answer, which used to be handed back unchecked: a bubble aligned to the
  // near edge of a control at the viewport's start, and to the far edge of one at its end.
  expect(alignOnAxis(-60, 20, 200, 1000, true, false)).toBe(0);
  expect(alignOnAxis(980, 1060, 200, 1000, false, false)).toBe(800);
});
