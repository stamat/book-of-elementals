/**
 * The pattern's lifecycle over markup: what `wire()` does when the list arrives after the
 * upgrade, when the slides go away and come back, and when `autoplay` is switched after the
 * fact - the paths nothing on a page looks wrong on until it has tried them.
 *
 * `index.test.js` pins the decisions as plain functions. This file is the element around them,
 * and it runs in `fade` on purpose: stacked slides need no layout, no scroll container and no
 * `ResizeObserver`, none of which jsdom has, and the lifecycle is the same code either way -
 * the scrolled mode is this `wire()` with an observer and a scroll listener on the end of it.
 *
 * The one test below that leaves `fade` is the wheel Safari will not hand back: it is about a
 * listener being on the scroller and nothing else about the row, so a stub `ResizeObserver` is
 * enough to get `wire()` through the scrolled branch, and the metrics it reads are written
 * onto the box by hand.
 *
 * Deliberately not covered: any number that comes off a box. Every rect in jsdom is zero and
 * `scrollLeft` does not move, so which slide is current, whether the row is at its end, what a
 * press does while the last one is still scrolling, and the right-to-left measurements are
 * `currentSlide`, `scrollEdges`, `pressOrigin` and `startEdge` in `index.test.js` - and the
 * docs page in a browser for the whole of it. Nor whether the handed-back scroll lands on the
 * right box: choosing it walks ancestors asking each what it can scroll, and every box here
 * answers zero.
 *
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import './index.js';

const slides = (n) => Array.from({ length: n }, (_, i) => `<li>Slide ${i + 1}</li>`).join('');

function mount (markup) {
  document.body.innerHTML = markup;
  return document.querySelector('carousel-elemental');
}

const rotating = (carousel) => carousel.hasAttribute('data-carousel-rotating');

beforeEach(() => jest.useFakeTimers());

afterEach(() => {
  // Disconnects every carousel, which is what takes its clock off the fake timers.
  document.body.innerHTML = '';
  jest.useRealTimers();
});

test('a carousel that upgraded with no list waits for one, and wire() then puts the pattern on it', () => {
  // The documented shape for a gallery built on demand, one step earlier than an empty list:
  // no list at all yet. `wire()` used to throw here, because the upgrade had returned before
  // binding anything - and a page that had appended the list and called it as the docs say
  // got `TypeError: Cannot read properties of undefined` for its trouble.
  const carousel = mount('<carousel-elemental fade aria-label="Gallery"></carousel-elemental>');
  expect(carousel.querySelector('[data-carousel-controls]')).toBeNull();
  expect(carousel.hasAttribute('role')).toBe(false);

  carousel.insertAdjacentHTML('beforeend', `<ul>${slides(3)}</ul>`);
  carousel.wire();
  expect(carousel.getAttribute('role')).toBe('region');
  expect(carousel.getAttribute('aria-roledescription')).toBe('carousel');
  expect(carousel.querySelectorAll('[data-carousel-marker]')).toHaveLength(3);
  expect(carousel.slides[0].getAttribute('aria-label')).toBe('1 of 3');
});

test('and the controls it wrote then drive the slides, because the listeners were bound at upgrade', () => {
  const carousel = mount('<carousel-elemental fade aria-label="Gallery"></carousel-elemental>');
  carousel.insertAdjacentHTML('beforeend', `<ul>${slides(3)}</ul>`);
  carousel.wire();

  carousel.querySelector('[data-carousel-next]').click();
  expect(carousel.index).toBe(1);
  expect(carousel.slides[1].hasAttribute('data-carousel-current')).toBe(true);
  expect(carousel.slides[0].hasAttribute('data-carousel-current')).toBe(false);
});

test('emptying the slides through wire() stops the rotation clock along with the pattern', () => {
  // Roles and controls came off an emptied carousel; the interval did not. It ticked at
  // nothing for the life of the page, and `data-carousel-rotating` kept saying so.
  const carousel = mount(`<carousel-elemental fade autoplay interval="2000" aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
  expect(rotating(carousel)).toBe(true);

  carousel.scroller.replaceChildren();
  carousel.wire();
  expect(carousel.querySelector('[data-carousel-rotate]')).toBeNull();
  expect(rotating(carousel)).toBe(false);
  expect(carousel.style.getPropertyValue('--carousel-elemental-tick')).toBe('');
});

test('and filling them again starts it, as the attribute still asks', () => {
  const carousel = mount(`<carousel-elemental fade autoplay interval="2000" aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
  carousel.scroller.replaceChildren();
  carousel.wire();

  carousel.scroller.insertAdjacentHTML('beforeend', slides(3));
  carousel.wire();
  expect(rotating(carousel)).toBe(true);
  expect(carousel.querySelector('[data-carousel-rotate]').getAttribute('aria-label')).toBe('Stop slide rotation');
  jest.advanceTimersByTime(2000);
  expect(carousel.index).toBe(1);
});

test('a rotation the reader stopped stays stopped when the slides change', () => {
  // The APG's rule: once stopped by hand, nothing but the same button starts it - and a page
  // adding a slide is not the reader.
  const carousel = mount(`<carousel-elemental fade autoplay aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
  carousel.querySelector('[data-carousel-rotate]').click();
  expect(rotating(carousel)).toBe(false);

  carousel.scroller.insertAdjacentHTML('beforeend', '<li>Slide 4</li>');
  carousel.wire();
  expect(rotating(carousel)).toBe(false);
  expect(carousel.querySelector('[data-carousel-rotate]').getAttribute('aria-label')).toBe('Start slide rotation');
});

test('and one the pointer is holding stays held, and resumes on the way out', () => {
  const carousel = mount(`<carousel-elemental fade autoplay aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
  carousel.dispatchEvent(new Event('mouseenter'));
  expect(rotating(carousel)).toBe(false);

  carousel.wire();
  expect(rotating(carousel)).toBe(false);

  carousel.dispatchEvent(new Event('mouseleave'));
  expect(rotating(carousel)).toBe(true);
});

test('autoplay switched on over a single slide writes nothing: one slide is a figure, whatever the attribute says', () => {
  // The attribute used to take a path of its own around `wire()`, without the under-two
  // refusal: controls over a list with no roles, pointed at `aria-controls=""`, and a clock.
  const carousel = mount(`<carousel-elemental fade aria-label="Gallery"><ul>${slides(1)}</ul></carousel-elemental>`);
  carousel.setAttribute('autoplay', '');
  expect(carousel.querySelector('[data-carousel-controls]')).toBeNull();
  expect(carousel.querySelector('[data-carousel-rotate]')).toBeNull();
  expect(rotating(carousel)).toBe(false);
  expect(carousel.hasAttribute('role')).toBe(false);
});

test('autoplay switched on after upgrade writes the rotation control first and starts the clock, and off takes both away', () => {
  const carousel = mount(`<carousel-elemental fade aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
  carousel.setAttribute('autoplay', '');
  const rotate = carousel.querySelector('[data-carousel-rotate]');
  expect(carousel.firstElementChild).toBe(rotate);
  expect(rotate.getAttribute('aria-label')).toBe('Stop slide rotation');
  expect(rotating(carousel)).toBe(true);

  carousel.removeAttribute('autoplay');
  expect(carousel.querySelector('[data-carousel-rotate]')).toBeNull();
  expect(rotating(carousel)).toBe(false);
});

test('a carousel leaving the document takes its clock with it', () => {
  const carousel = mount(`<carousel-elemental fade autoplay aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
  carousel.remove();
  expect(rotating(carousel)).toBe(false);
  expect(carousel.querySelector('[data-carousel-controls]')).toBeNull();
  expect(carousel.querySelector('ul').hasAttribute('role')).toBe(false);
});

describe('the wheel Safari holds on to', () => {
  // jsdom has neither, and the scrolled branch of `wire()` wants one of them.
  const noResizes = { observe() {}, unobserve() {}, disconnect() {} };
  let scrolled;

  beforeEach(() => {
    window.ResizeObserver = function () { return noResizes; };
    // `GestureEvent` is the gate: this listener goes on in Safari and nowhere else.
    window.GestureEvent = function () {};
    scrolled = jest.fn();
    document.documentElement.scrollBy = scrolled;
  });

  afterEach(() => {
    delete window.ResizeObserver;
    delete window.GestureEvent;
    delete document.documentElement.scrollBy;
  });

  /** A row wider than it shows and no taller than its slides, which jsdom will not do itself. */
  function row (carousel) {
    const list = carousel.querySelector('ul');
    for (const [name, value] of [['scrollWidth', 4000], ['clientWidth', 1400], ['scrollHeight', 500], ['clientHeight', 500]]) {
      Object.defineProperty(list, name, { configurable: true, value });
    }
    return list;
  }

  test('is taken off the row and given to the page, which is the only thing that unsticks it', () => {
    const carousel = mount(`<carousel-elemental aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
    const list = row(carousel);

    const wheel = new window.WheelEvent('wheel', { deltaX: 0, deltaY: 120, deltaMode: 0, bubbles: true, cancelable: true });
    list.dispatchEvent(wheel);

    expect(wheel.defaultPrevented).toBe(true);
    expect(scrolled).toHaveBeenCalledWith(0, 120);
  });

  test('and a sideways wheel is left alone, or the row could not be scrolled at all', () => {
    const carousel = mount(`<carousel-elemental aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
    const list = row(carousel);

    const wheel = new window.WheelEvent('wheel', { deltaX: 120, deltaY: 0, deltaMode: 0, bubbles: true, cancelable: true });
    list.dispatchEvent(wheel);

    expect(wheel.defaultPrevented).toBe(false);
    expect(scrolled).not.toHaveBeenCalled();
  });

  test('and no other browser pays for it: without Safari there, the wheel is never taken', () => {
    // Every engine but this one already hands the page a scroll the row cannot use. Taking
    // the wheel there would buy nothing and cost the browser's own scrolling over the row.
    delete window.GestureEvent;
    const carousel = mount(`<carousel-elemental aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
    const list = row(carousel);

    const wheel = new window.WheelEvent('wheel', { deltaX: 0, deltaY: 120, deltaMode: 0, bubbles: true, cancelable: true });
    list.dispatchEvent(wheel);

    expect(wheel.defaultPrevented).toBe(false);
    expect(scrolled).not.toHaveBeenCalled();
  });

  test('and the listener comes off with the pattern, so a stripped row is a plain list again', () => {
    const carousel = mount(`<carousel-elemental aria-label="Gallery"><ul>${slides(3)}</ul></carousel-elemental>`);
    const list = row(carousel);
    carousel.strip();

    const wheel = new window.WheelEvent('wheel', { deltaX: 0, deltaY: 120, deltaMode: 0, bubbles: true, cancelable: true });
    list.dispatchEvent(wheel);

    expect(wheel.defaultPrevented).toBe(false);
    expect(scrolled).not.toHaveBeenCalled();
  });
});
