import { ElementBase, define } from '../../core.js';

/** Monotonic counter, so a message has an `id` for its field to point at. */
let fieldCount = 0;

/**
 * When the field is allowed to speak, and what happens when it does.
 *
 * The browser's own rule is one moment and no others: nothing at all until a submit is
 * refused, and then a bubble that vanishes on the next click. The rule every hand-written
 * validator reaches for instead is the opposite - validate on every keystroke - which tells
 * a reader their email address is invalid after they have typed `n`.
 *
 * So the moments here are three, and the ordering between them is the whole design.
 * A refused submit always speaks: that is the reader asking. Leaving a field speaks only if
 * they put something in it, so tabbing through a form does not light it up. And typing
 * never *starts* a complaint - it only keeps one already on screen current, and takes it
 * down the moment the value is right, which is the half that turns a complaint into
 * progress.
 *
 * `dirty` is whether the reader has put anything in the field, not whether they have been
 * in it. A field they typed into and emptied again is back to untouched, which is the
 * kinder reading of the same gesture.
 *
 * @param {string} type The event: `invalid`, `blur`, `input`, `change`, `reset`.
 * @param {boolean} valid What `control.validity.valid` says right now.
 * @param {boolean} showing Whether a message is already on screen.
 * @param {boolean} dirty Whether the reader has put anything in the field.
 * @returns {"show"|"clear"|"ignore"}
 * @example
 * fieldAction('invalid', false, false, false) // => 'show', a refused submit always says why
 * fieldAction('input', false, false, true) // => 'ignore', typing never starts one
 * fieldAction('input', true, true, true) // => 'clear', but it does end one
 * fieldAction('blur', false, false, false) // => 'ignore', nothing was filled in
 */
export function fieldAction(type, valid, showing, dirty) {
  if (type === 'invalid') return 'show';
  if (type === 'reset') return 'clear';
  if (type === 'blur') {
    if (valid) return showing ? 'clear' : 'ignore';
    return dirty ? 'show' : 'ignore';
  }
  if (type === 'input' || type === 'change') {
    if (!showing) return 'ignore';
    return valid ? 'clear' : 'show';
  }
  return 'ignore';
}

/** Field-shaped children that are never the control being validated. */
const NOT_THE_CONTROL = new Set(['hidden', 'submit', 'reset', 'button', 'image']);

/**
 * `<field-elemental>` custom element.
 *
 * The label, the control and the message that belongs to it - wrapped so the browser's
 * refusal to submit becomes a sentence on the page instead of a bubble that floats away.
 *
 * There is no APG pattern for this, because there is no widget: the control inside is
 * already accessible and already validated. What the platform leaves undone is everything
 * after the refusal. The native bubble cannot be styled, disappears the moment the field
 * takes focus, is shown for the first invalid control and no other, and is not reliably
 * announced. So every form on the web either lives with it or hand-writes a replacement,
 * and the replacement is where the accessibility goes: a red paragraph that no `aria`
 * attribute ties to the field is a message a screen reader user never meets.
 *
 * What it does, and nothing more: cancels the bubble, puts the browser's own
 * `validationMessage` in a paragraph, points the control at it with `aria-describedby`, and
 * marks the control `aria-invalid` while - and only while - there is something wrong. The
 * constraints stay the author's `required`, `type`, `pattern`, `minlength`; the wording
 * stays the browser's, already translated into the reader's language. There is no
 * validation vocabulary to learn here, because there is no validation here.
 *
 * `aria-describedby` rather than `aria-errormessage`, which is the attribute written for
 * exactly this and is still not the one that works. [Adrian Roselli's
 * testing](https://adrianroselli.com/2023/04/exposing-field-errors.html) found the message
 * behind `aria-errormessage` "generally not exposed when navigating through fields", while
 * `aria-describedby` is "consistently exposed" - and [it was still not
 * there](https://cerovac.com/a11y/2024/06/support-for-aria-errormessage-is-getting-better-but-still-not-there-yet/)
 * in mid-2024. The day it lands, this is one attribute name to change.
 *
 * No live region on the message either, which is the counter-intuitive half. `describedby`
 * is announced when focus leaves the field and the message appears, so a live region on top
 * of it is the same sentence twice in NVDA and JAWS, and stops VoiceOver reading the
 * description at all.
 *
 * Light DOM, no shadow root, nothing moved. One node is added - the message - unless the
 * page already rendered one, which is how a server-side error survives: write the paragraph
 * with the message in it and the element adopts it, wires it up and marks the field invalid,
 * so the same markup works with the script and without it.
 *
 * Degrades honestly: with no script the browser's own bubble is still there, doing what it
 * has always done. Nothing is taken away before there is something to replace it with.
 *
 * ponytail: no message vocabulary - no `data-required-message`, no `invalid-message`. The
 * platform already has one call for this, `setCustomValidity()`, and a set of attributes
 * shadowing it would be a second place for the same string to live. Its own trap comes with
 * it and is the author's to know: a control with a custom validity set stays invalid until
 * the same call is made with an empty string.
 *
 * @tag field-elemental
 *
 * @cssprop {<color>} [--field-elemental-error-color=currentcolor mixed towards red] - The message's colour. The control is not styled at all - `[aria-invalid="true"]` is there for the page's own CSS.
 * @cssprop {<length>} [--field-elemental-gap=0.35em] - Between the control and the message under it.
 * @cssprop {<length>} [--field-elemental-message-size=0.85em] - The message's own size.
 *
 * @fires field-validity - Whenever the message appears or goes. `detail.valid` is what the control says, `detail.message` the text now on screen, empty when there is none.
 *
 * @slot - A label, one form control, and optionally the `<p class="field-elemental-error">` a server-rendered error was written into.
 */
export class FieldElemental extends ElementBase {
  /**
   * The control being validated: the first one in here that a reader could put a value in.
   *
   * First rather than every, because a message belongs to a field and a field holds one
   * answer. A set of radios or checkboxes sharing one question is a `<fieldset>` and a
   * different element - wrapping one here would point the message at the first radio and
   * describe the group by whichever of them the reader happened to land on.
   */
  get control() {
    for (const el of this.querySelectorAll('input, select, textarea')) {
      if (el.type && NOT_THE_CONTROL.has(el.type)) continue;
      return el;
    }
    return null;
  }

  /** The message. The author's if they rendered one, otherwise the one added at upgrade. */
  get error() {
    return this.querySelector(':scope > .field-elemental-error');
  }

  /** Whether a message is on screen. */
  get showing() {
    const error = this.error;
    return !!error && !error.hidden;
  }

  /**
   * Whether the reader has put anything in the field.
   *
   * A tick box holds its answer in `checked`; its `value` is the string that would be
   * submitted and is `"on"` whether or not it has been ticked, so reading `value` here
   * would call every untouched box filled in and complain at a reader tabbing past it.
   */
  get dirty() {
    const control = this.control;
    if (!control) return false;
    if (control.type === 'checkbox' || control.type === 'radio') return control.checked;
    return control.value !== '';
  }

  connectedCallback() {
    // Light-DOM children have to be parsed before there is a control to find. The bundle
    // is loaded deferred or at the end of the body, so by upgrade time they are.
    if (this.initialized) return;
    const control = this.control;
    if (!control) return;
    this.initialized = true;

    if (!control.id) control.id = 'field-elemental-' + (++fieldCount);

    let error = this.error;
    if (!error) {
      error = document.createElement('p');
      error.className = 'field-elemental-error';
      error.hidden = true;
      this.append(error);
    }
    if (!error.id) error.id = control.id + '-error';
    this.describedBy = control.getAttribute('aria-describedby') || '';

    // A message the page arrived with is a message from the server about a value the
    // browser has no constraint for - an address already registered, a code that expired.
    // It is wired up exactly as one this element raised, and then left to the same rules:
    // the reader editing the field takes it down, because they are answering it, and
    // whether the new value is any better is the server's to say next time.
    // Read once and never again. Moving the element in the DOM disconnects and reconnects
    // it, and a browser message standing on screen at that moment would be read back here
    // as one the page was rendered with - which a reset would then restore forever.
    if (this.serverMessage === undefined) this.serverMessage = error.textContent.trim();
    if (this.serverMessage) this.show(this.serverMessage);
    else this.clear();

    this.onEvent = this.onEvent.bind(this);
    // `invalid` and `blur` do not bubble, so both are listened for on the control itself
    // rather than here. `reset` is the form's and does bubble, but not through this element
    // - the form is above it, not inside it.
    for (const type of ['invalid', 'blur', 'input', 'change']) control.addEventListener(type, this.onEvent);
    if (control.form) control.form.addEventListener('reset', this.onEvent);
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    const control = this.control;
    if (control) {
      for (const type of ['invalid', 'blur', 'input', 'change']) control.removeEventListener(type, this.onEvent);
      if (control.form) control.form.removeEventListener('reset', this.onEvent);
    }
    this.initialized = false;
  }

  onEvent(e) {
    const control = this.control;
    if (!control) return;
    // `validity.valid` rather than `checkValidity()`, which is the same answer with an
    // `invalid` event fired alongside it - straight back into this handler, where every
    // blur would arrive as a refused submit and light up a field nobody has filled in yet.
    const action = fieldAction(e.type, control.validity.valid, this.showing, this.dirty);
    // The bubble goes whether or not the message changes. It is the one thing this element
    // is replacing, and a submit refused twice would otherwise show it the second time.
    if (e.type === 'invalid') e.preventDefault();
    // A reset puts the values back to the ones the page was rendered with, and a message
    // the page was rendered with was about exactly those. Taking it down would leave the
    // form holding the value the server already refused, with nothing on screen saying so.
    if (action === 'clear' && e.type === 'reset' && this.serverMessage) this.show(this.serverMessage);
    else if (action === 'show') this.show(control.validationMessage);
    else if (action === 'clear') this.clear();
    if (e.type === 'invalid') this.takeFocus();
  }

  /**
   * Put focus on this control if it is the first thing in the form standing in the way.
   *
   * Cancelling `invalid` is what drops the bubble, and it drops the browser's focus with
   * it: measured in Chromium and WebKit, a refused submit then leaves focus on the button
   * (Chromium) or on `<body>` (WebKit). Either one is a form that says nothing and goes
   * nowhere, which is worse than the bubble this element was replacing.
   *
   * Every invalid control in the form gets its own `invalid` event, so without the check
   * the last of them would win the race and the reader would land past the field that
   * stopped the submit.
   */
  takeFocus() {
    const control = this.control;
    const form = control && control.form;
    if (!form) return;
    const first = form.querySelector(':is(input, select, textarea):invalid');
    if (!first || first === control) control.focus();
  }

  /** Put the message on screen and tie the control to it. */
  show(message) {
    const control = this.control;
    const error = this.error;
    if (!control || !error) return;
    error.textContent = message;
    error.hidden = false;
    control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', [this.describedBy, error.id].filter(Boolean).join(' '));
    this.announce(false, message);
  }

  /**
   * Take it down.
   *
   * Hidden rather than emptied, and unpointed-at rather than pointed at an empty
   * paragraph: a description that is there and says nothing is still read out as part of
   * the field, and `aria-invalid` left on a field that is now fine is the field lying about
   * itself.
   */
  clear() {
    const control = this.control;
    const error = this.error;
    if (!control || !error) return;
    const was = this.showing;
    error.textContent = '';
    error.hidden = true;
    control.removeAttribute('aria-invalid');
    if (this.describedBy) control.setAttribute('aria-describedby', this.describedBy);
    else control.removeAttribute('aria-describedby');
    if (was) this.announce(true, '');
  }

  announce(valid, message) {
    this.dispatchEvent(new CustomEvent('field-validity', {
      bubbles: true,
      detail: { valid, message }
    }));
  }
}

define('field-elemental', FieldElemental);
