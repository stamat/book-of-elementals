/**
 * The value bubble while a thumb is held: that a drag is drawn from the value the browser is
 * writing rather than from where the pointer happens to be, and that a hover is still drawn
 * from the pointer, because that is the only thing that knows the value under it.
 *
 * `index.test.js` pins the arithmetic - `alongTrack`, `thumbUnder`, `ratio`. This file is the
 * other half: which of those a press, a move and an `input` are allowed to reach for. It is
 * worth its own file because the cost is invisible to the arithmetic - a drag that measures
 * two rects it never reads is correct and slow, and only a test that counts the measuring can
 * say so.
 *
 * Deliberately not covered: everything that needs a real layout. jsdom has no boxes, so the
 * two rects a press measures are handed in by hand below and nothing here asserts a position
 * on screen - the bubble landing over the thumb it reads out is `script/a11y` and the docs
 * previews. Touch is not covered either: `pointerType` is the whole of the difference and
 * jsdom has no PointerEvent to carry it.
 *
 * @jest-environment jsdom
 */

import './index.js';

const MARKUP = `
  <slider-elemental tooltip="thumb track">
    <input type="range" min="0" max="100" value="20" />
    <input type="range" min="0" max="100" value="70" />
  </slider-elemental>`;

/** The track, 600px across at x=0, with 20px thumbs - the numbers a press would have read off
 * a real layout, handed in because jsdom has none. */
function mount() {
  document.body.innerHTML = MARKUP;
  const slider = document.querySelector('slider-elemental');
  slider.getBoundingClientRect = () => ({ left: 0, top: 0, right: 600, bottom: 20, width: 600, height: 20 });
  for (const input of slider.querySelectorAll('input')) {
    input.getBoundingClientRect = () => ({ left: 0, top: 0, right: 600, bottom: 20, width: 600, height: 20 });
  }
  return slider;
}

const bubbleOf = (slider) => slider.querySelector('output[data-tooltip]');
const at = (slider) => bubbleOf(slider).style.getPropertyValue('--slider-elemental-at');

/** Where a thumb's centre sits on the 600px track above, in the same arithmetic the element
 * uses: half a thumb in, then its ratio of what is left. */
const centre = (value) => 10 + (value / 100) * 580;

function point(type, x, target) {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: 10 }));
}

/** Counts what a stretch of the interaction measured, without changing what it answers. */
function countMeasuring(slider) {
  const count = { metrics: 0, rects: 0 };
  const metrics = slider.metrics.bind(slider);
  slider.metrics = (x, y) => {
    count.metrics += 1;
    return metrics(x, y);
  };
  const rect = slider.getBoundingClientRect;
  slider.getBoundingClientRect = () => {
    count.rects += 1;
    return rect();
  };
  return count;
}

test('a press pins the bubble to the thumb it grabbed and reads that thumb out', () => {
  const slider = mount();
  point('pointerdown', centre(70), slider.inputs[1]);
  expect(slider.dragging).toBe(1);
  expect(bubbleOf(slider).textContent).toBe('70');
  expect(bubbleOf(slider).hidden).toBe(false);
});

test('while the thumb is held, a pointer move measures nothing at all', () => {
  // The press already answered which thumb this is, and a held thumb can only be moved by a
  // value. Measuring here would be two rects and a forced layout per move for a number
  // already written on the input.
  const slider = mount();
  point('pointerdown', centre(70), slider.inputs[1]);
  const measured = countMeasuring(slider);
  point('pointermove', centre(45), slider.inputs[1]);
  point('pointermove', centre(30), slider.inputs[1]);
  expect(measured).toEqual({ metrics: 0, rects: 0 });
});

test('the value is what redraws it: an input event moves the bubble, a pointer move does not', () => {
  const slider = mount();
  point('pointerdown', centre(70), slider.inputs[1]);

  point('pointermove', centre(20), slider.inputs[1]);
  expect(bubbleOf(slider).textContent).toBe('70');

  slider.inputs[1].value = '55';
  slider.inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  expect(bubbleOf(slider).textContent).toBe('55');
  expect(at(slider)).toBe('0.55');
});

test('a formatter is called for the drag too, and only when the value actually changes', () => {
  // The bubble is redrawn on `input` rather than on every move, so a page's own formatter is
  // called once per value and not once per frame.
  const slider = mount();
  const seen = [];
  slider.format = (value) => {
    seen.push(value);
    return `${value}%`;
  };
  point('pointerdown', centre(70), slider.inputs[1]);
  point('pointermove', centre(65), slider.inputs[1]);
  point('pointermove', centre(60), slider.inputs[1]);
  slider.inputs[1].value = '61';
  slider.inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  expect(bubbleOf(slider).textContent).toBe('61%');
  expect(seen).toEqual([70, 61]);
});

test('letting go hands the bubble back to the pointer', () => {
  const slider = mount();
  point('pointerdown', centre(70), slider.inputs[1]);
  point('pointerup', centre(70), slider.inputs[1]);
  expect(slider.dragging).toBe(-1);

  const measured = countMeasuring(slider);
  point('pointermove', centre(30), slider.inputs[1]);
  expect(measured.metrics).toBe(1);
});

test('a hover with nothing held is measured, because only the layout knows the value under a pointer', () => {
  const slider = mount();
  const measured = countMeasuring(slider);
  point('pointermove', centre(30), slider.inputs[0]);
  expect(measured.metrics).toBe(1);
  expect(bubbleOf(slider).dataset.tooltip).toBe('track');
  expect(bubbleOf(slider).textContent).toBe('30');
});

test('a bubble the attribute is keeping hidden is not redrawn by a drag', () => {
  // `tooltip="track"` asks for the readout under the pointer and not for one on the thumb, so
  // a press hides it - and a drag is not the moment to overrule that.
  document.body.innerHTML = MARKUP.replace('tooltip="thumb track"', 'tooltip="track"');
  const slider = document.querySelector('slider-elemental');
  slider.getBoundingClientRect = () => ({ left: 0, top: 0, right: 600, bottom: 20, width: 600, height: 20 });
  for (const input of slider.querySelectorAll('input')) {
    input.getBoundingClientRect = () => ({ left: 0, top: 0, right: 600, bottom: 20, width: 600, height: 20 });
  }
  point('pointerdown', centre(70), slider.inputs[1]);
  expect(bubbleOf(slider).hidden).toBe(true);

  slider.inputs[1].value = '55';
  slider.inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  expect(bubbleOf(slider).hidden).toBe(true);
  expect(bubbleOf(slider).textContent).toBe('');
});
