// The decisions `<tooltip-elemental>` makes that are not DOM plumbing: where a `title`'s
// words belong, what hover, focus and Escape do to each other, and what teardown may take
// back out of `aria-describedby`.
//
// Deliberately not covered here: the wiring itself - `aria-describedby`, the `hidden`
// toggle, the fixed-position maths - which needs a layout and belongs to `script/a11y`
// and the docs demo. The side decision is book-of-spells' `placeFlyout` and `placeSubmenu`,
// tested there.
import { titleRole, nextTooltipState, arrowOffset, alignOnAxis, landedAlign, withoutToken } from './index.js';

test('teardown takes only its own id out of aria-describedby', () => {
  // The trigger outlives the element in the `for` shape, and a description pointing at a
  // bubble that is gone is a description of nothing.
  expect(withoutToken('hint tip-1', 'tip-1')).toBe('hint');
  expect(withoutToken('tip-1 hint more', 'tip-1')).toBe('hint more');
});

test('an id this element alone appended leaves the attribute empty, so it comes off whole', () => {
  expect(withoutToken('tip-1', 'tip-1')).toBeNull();
  expect(withoutToken(null, 'tip-1')).toBeNull();
});

test('a describedby the page wrote keeps every token that is not the bubble\'s', () => {
  expect(withoutToken('hint  more', 'tip-1')).toBe('hint more');
});

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

test('focus out hides it, when no pointer is holding it open', () => {
  expect(run(['focus', 'blur']).open).toBe(false);
});

test('activating the control hides the bubble, though the click left focus on the button', () => {
  // A used control's tooltip has said its piece - and the focus the click leaves behind
  // would otherwise hold it open over the neighbour's bubble the pointer goes to next.
  expect(run(['pointerenter', 'focus', 'activate']).open).toBe(false);
});

// Not Escape's dismissal, on purpose: a `dismissed` cleared only when pointer and focus have
// both left would kill hover on the control for as long as the click's focus stays on it -
// and a mouse never blurs what it clicked. Activation forgets both holds instead, so the
// next arrival by either door opens it anew.
test('leaving and coming back after a click shows the bubble again', () => {
  expect(run(['pointerenter', 'focus', 'activate', 'pointerleave', 'pointerenter']).open).toBe(true);
  // The keyboard's way back is Tab out and in.
  expect(run(['focus', 'activate', 'blur', 'focus']).open).toBe(true);
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

// A 400-wide button at x=100, so its middle is at 300.
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
  expect(alignOnAxis(WIDE.left, WIDE.right, 120, 1000)).toBe(240);
  // Which is the middle of both, so the caret has nowhere to be but centred.
  expect(arrowOffset(WIDE, { ...BUBBLE, left: 240 }, false, false)).toBe(60);
});

// The width of the two used to decide this: a control narrower than its bubble was aligned
// to an edge instead, so most of a long sentence sat to one side of the small button it
// belonged to. A bubble that is only a little wider than its trigger - an icon button and
// one word - then looked plainly wrong, sitting off to the left of what it named. Centring
// is now the answer at every width, and the caret is what carries the pointing either way.
test('a bubble is centred on its trigger whatever the two of them measure', () => {
  // A 40-wide control against a 200-wide bubble: (100 + 140) / 2 - 100.
  expect(alignOnAxis(100, 140, 200, 1000)).toBe(20);
});

// The viewport used to snap rather than slide: where a fully centred bubble did not fit,
// `placeFlyout` handed back the trigger's edge - a position that fits the viewport on its
// own, so the clamp never fired and the bubble jumped from centred to edge-aligned with
// nothing in between. The centre is always asked for now, and the clamp moves the bubble
// only as far as the edge forces.
test('a trigger near the edge keeps the most centred bubble that fits, not its own edge', () => {
  // A 40-wide icon button at x=16 against a 200-wide bubble: centred would start at -64,
  // and the bubble slides just inside the viewport - not out to x=16 where the trigger is.
  expect(alignOnAxis(16, 56, 200, 1000)).toBe(0);
  // The same by the far edge: centred would be 864, the last place that fits is 800.
  expect(alignOnAxis(944, 984, 200, 1000)).toBe(800);
});

test('the slid bubble stops a margin short of the glass, not on it', () => {
  // The icon button at x=16 again, with 6px of viewport margin: pinned at 6, not 0.
  expect(alignOnAxis(16, 56, 200, 1000, 6)).toBe(6);
  expect(alignOnAxis(944, 984, 200, 1000, 6)).toBe(794);
  // Room to centre is room to centre - the margin only matters at the edges.
  expect(alignOnAxis(WIDE.left, WIDE.right, 120, 1000, 6)).toBe(240);
  // A bubble wider than the viewport sits at the near margin rather than at zero.
  expect(alignOnAxis(0, 400, 500, 300, 6)).toBe(6);
});

test('the bubble is never outside the viewport', () => {
  // A wide control reaching past the left edge: its middle still fits, so no clamp.
  expect(alignOnAxis(-40, 200, 120, 1000)).toBe(20);
  // One running off the far edge: centred would be 340, and the last place the bubble
  // fits is 180.
  expect(alignOnAxis(200, 600, 120, 300)).toBe(180);
  // A bubble wider than the viewport has nowhere to go, and is put at the near edge rather
  // than at a negative one.
  expect(alignOnAxis(0, 400, 500, 300)).toBe(0);
});

// Beside the trigger, the block axis used to take `placeSubmenu`'s answer whole - and that
// helper only knows `start` and `end`, because a submenu hangs down from the item that opened
// it. A tooltip inherited that and sat with its top edge on the trigger's, caret pointing out
// of its first line at whatever was above the button's middle. The same centring serves both
// axes now.
test('a bubble beside its trigger is centred on it, the same as one under it', () => {
  // A 40-tall control at y=40 against a 24-tall bubble: (40 + 80) / 2 - 12.
  expect(alignOnAxis(WIDE.top, WIDE.bottom, 24, 768)).toBe(48);
  // And the caret then comes out of the middle of the bubble, since both middles are at 60.
  expect(arrowOffset(WIDE, { ...BUBBLE, left: 506, top: 48, height: 24 }, true, false)).toBe(12);
});

test('a tall bubble beside a trigger near the top slides down only as far as the fold forces', () => {
  // Centred on a control at y=10..50, a 200-tall bubble would start at -70: it is pinned to
  // the top of the viewport, not hung from the trigger's own top edge.
  expect(alignOnAxis(10, 50, 200, 768)).toBe(0);
});

// `data-align` is measured from where the bubble landed rather than taken from what the
// placement asked for. Asked for, it would now read `center` on every tooltip in existence,
// including the one the edge of the screen has slid halfway off its trigger - which is the
// single case a stylesheet wants it for.
test('the alignment reads centred until the viewport slides the bubble, then names where the caret came out', () => {
  // The 400-wide button of WIDE against a 120-wide bubble, landed at 240: both middles at 300.
  expect(landedAlign(240, 120, WIDE.left, WIDE.right, false)).toBe('center');
  // A 40-wide icon button at x=16 with its 200-wide bubble pinned to the viewport's start:
  // the caret is 36px in, out near the bubble's start edge.
  expect(landedAlign(0, 200, 16, 56, false)).toBe('start');
  // And the same button at the far edge, where the caret is 164px along a 200-wide bubble.
  expect(landedAlign(800, 200, 944, 984, false)).toBe('end');
});

test('the alignment is logical, so the same two bubbles name the other edge in RTL', () => {
  expect(landedAlign(0, 200, 16, 56, true)).toBe('end');
  expect(landedAlign(800, 200, 944, 984, true)).toBe('start');
});
