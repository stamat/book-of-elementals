import { ElementBase, define } from '../../core.js';

/**
 * What goes on the clipboard: the `value` attribute when there is one, otherwise the text
 * of the element `for` names.
 *
 * A field is what is in it - `.value`, not the markup between its tags, which for an
 * `<input>` is nothing at all and for a `<textarea>` is only what it loaded with.
 *
 * The trimming is one-sided on purpose. A code block written in markdown carries a newline
 * before its first line and after its last, neither of which is code - and the trailing one
 * pasted into a terminal runs the command the reader was still reading. Indentation at the
 * start of a line is code, in Python and YAML especially, so nothing there is touched.
 *
 * `value` is taken exactly as written, empty string included: an author who set it to
 * nothing has said there is nothing to copy, and the element reports that as the failure it
 * is rather than quietly copying something else instead.
 */
export function sourceText(target, value) {
  if (value != null) return value;
  if (!target) return '';
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return target.value == null ? '' : String(target.value);
  }
  // `innerText` is what the reader sees, which is what they mean by "this text" - it
  // leaves out a `display: none` sibling and gives the line breaks the block was drawn
  // with. It is undefined on a non-rendering base class, so `textContent` is the fallback.
  const text = target.innerText != null ? target.innerText : target.textContent;
  return text == null ? '' : text.replace(/^\n+/, '').replace(/\s+$/, '');
}

/** How long the copied state and its announcement stay up. */
const FEEDBACK_MS = 2000;

/**
 * `<copy-elemental>` custom element.
 *
 * A real `<button>` that puts text on the clipboard and says so - out loud as well as on
 * screen.
 *
 * There is no APG pattern for this, because there is no widget: it is a button, and a
 * button is already accessible. What is missing is the half after the click. Every copy
 * button swaps an icon or shows a tick, and a swapped icon is not an announcement - a
 * screen reader user presses it and is told nothing at all, which is
 * [WCAG 2.2 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html)
 * unmet. That gap is this element and the whole of it: the clipboard write, a
 * `data-state` for CSS to read, and a live region that says the same thing to the reader
 * who cannot see the icon change.
 *
 * What it does, and nothing more. The button, its label, its focus ring and Enter and
 * Space are the button's - which is the point of using one. There is no tooltip, no
 * timer to configure and no icon: what the button looks like before and after is CSS on
 * `[data-state="copied"]`, and the text it announces is two attributes.
 *
 * Light DOM, no shadow root. One node is added - the live region - because a live region
 * has to be in the document *before* the text lands in it, so it cannot be created at the
 * moment there is something to say.
 *
 * Degrades honestly: `navigator.clipboard` is absent over plain `http`, and a copy button
 * that cannot copy is a button that lies. The stylesheet keeps it out of reach until the
 * element has upgraded and found the API - so with no script, an insecure page, or nothing
 * named to copy, there is no button rather than a dead one. Put the text somewhere
 * selectable and the reader still has it.
 *
 * ponytail: no `<a href>` special case, no `from="el[attr]"` micro-syntax. Copying
 * something that is not text on the page is what `value` is for, and one attribute beats a
 * selector dialect nobody remembers.
 *
 * @tag copy-elemental
 * @attr {string} for - `id` of the element to copy. Also read as `data-for`.
 * @attr {string} value - Literal text to copy, exactly as written. Wins over `for`.
 * @attr {string} [copied-text=Copied] - What the live region announces on success.
 * @attr {string} [error-text=Copy failed] - What it announces when there was nothing to copy, or the clipboard refused.
 *
 * @cssprop {<length>} [--copy-elemental-icon-size=1em] - The icon the theme draws, both axes.
 * @cssprop {<length>} [--copy-elemental-gap=0.4em] - Between the icon and the label beside it.
 * @cssprop {<length>} [--copy-elemental-padding-block=0.4em] - Above and below the label.
 * @cssprop {<length>} [--copy-elemental-padding-inline=0.6em] - Either side of it.
 * @cssprop {<length>} [--copy-elemental-radius=0.35rem] - Button corners.
 * @cssprop {<color>} [--copy-elemental-surface=Canvas] - What the button is painted on. The page's own background, so re-point it on a card.
 * @cssprop {<color>} [--copy-elemental-border-color=currentcolor at 30%] - The rim around it.
 * @cssprop {<color>} [--copy-elemental-hover=currentcolor at 8% over the surface] - Fill under the pointer.
 * @cssprop {<color>} [--copy-elemental-copied-color=currentcolor mixed towards green] - Icon, label and rim once it landed.
 * @cssprop {<color>} [--copy-elemental-error-color=currentcolor mixed towards red] - The same three when it did not.
 * @cssprop {<time>} [--copy-elemental-duration=150ms] - The cross-fade between those states.
 *
 * @fires copy-done - `detail.ok` is whether it landed, `detail.text` what went on the clipboard.
 *
 * @slot - The `<button>` that copies, with whatever label or icon you give it.
 */
export class CopyElemental extends ElementBase {
  /** The `<button>` that copies. Direct child, so a button inside the block being
   * copied - or in a second copy button below - is not mistaken for the trigger. */
  get button() {
    return this.querySelector(':scope > button');
  }

  /** The element being copied: what `for` names, or nothing. Resolved on every press
   * rather than held, so a block that was re-rendered since the last one still copies. */
  get target() {
    const id = this.dataset.for != null ? this.dataset.for : this.getAttribute('for');
    return id ? document.getElementById(id) : null;
  }

  /** What a press would put on the clipboard, right now. */
  get text() {
    return sourceText(this.target, this.value);
  }

  /** The literal text to copy, or `null` for whatever `for` names. Reflected, so setting it
   * is how a page copies something it computed - a link's `href`, a formatted number. */
  get value() {
    return this.getAttribute('value');
  }

  set value(value) {
    if (value == null) this.removeAttribute('value');
    else this.setAttribute('value', value);
  }

  /** What the live region says on success. */
  get copiedText() {
    return this.getAttribute('copied-text') || 'Copied';
  }

  /** What it says when there was nothing to copy, or the clipboard refused. */
  get errorText() {
    return this.getAttribute('error-text') || 'Copy failed';
  }

  connectedCallback() {
    // Wait until the light-DOM children have been parsed. The bundle is loaded deferred
    // or at the end of the body, so by upgrade time the button is there.
    if (this.initialized) return;
    const button = this.button;
    if (!button) return;

    // Two ways to be a button that cannot copy, and they are told apart nowhere else
    // because the answer to both is the same: say so, and let the stylesheet keep it out
    // of reach. Nothing named to copy is the author's slip; no clipboard API is a page
    // served over plain `http`, where the API is not there to be asked.
    const named = this.hasAttribute('for') || this.dataset.for != null || this.hasAttribute('value');
    if (!named || typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
      this.dataset.unavailable = '';
      return;
    }
    delete this.dataset.unavailable;
    this.initialized = true;

    // A button in a form submits it unless told otherwise, and a copy button that posts
    // the page away is not a copy button.
    if (!button.hasAttribute('type')) button.type = 'button';

    if (!this.status) {
      const status = document.createElement('span');
      status.className = 'copy-elemental-status';
      // `status` rather than `alert`: the reader asked for this and is not being
      // interrupted with it, so it waits for a gap in what is already being read.
      status.setAttribute('role', 'status');
      this.appendChild(status);
    }

    this.onClick = this.onClick.bind(this);
    this.addEventListener('click', this.onClick);
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    this.removeEventListener('click', this.onClick);
    clearTimeout(this.announceTimer);
    clearTimeout(this.resetTimer);
    this.initialized = false;
  }

  /** The live region. Added at upgrade, because a live region only announces text that
   * lands in one already in the document. */
  get status() {
    return this.querySelector(':scope > .copy-elemental-status');
  }

  /**
   * Say something in the live region.
   *
   * A live region announces a *change*, so the same message set twice in a row is silent -
   * which would make every copy after the first one say nothing. Cleared first and set back
   * in a later task, so the two writes cannot coalesce into no change at all.
   */
  announce(message) {
    const status = this.status;
    if (!status) return;
    status.textContent = '';
    clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => { status.textContent = message; }, 0);
  }

  /** Show and say how it went, then go quiet again. */
  feedback(ok, text) {
    this.dataset.state = ok ? 'copied' : 'error';
    this.announce(ok ? this.copiedText : this.errorText);
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      delete this.dataset.state;
      const status = this.status;
      // Emptied rather than left standing: a live region still holding "Copied" is a line
      // a reader browsing the page later meets again, with nothing behind it.
      if (status) status.textContent = '';
    }, FEEDBACK_MS);
    this.dispatchEvent(new CustomEvent('copy-done', {
      bubbles: true,
      detail: { ok, text }
    }));
  }

  onClick(e) {
    const button = e.target.closest && e.target.closest('button');
    // Not the control means a button beside it, or a nested copy button's.
    if (!button || button !== this.button || button.disabled) return;
    const text = this.text;
    // `for` pointing at nothing, or an empty `value`. Writing an empty string would clear
    // whatever the reader already had on the clipboard and report it as a success.
    if (!text) {
      this.feedback(false, '');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => this.feedback(true, text),
      // The clipboard can refuse: a page that is not the active document, a permission
      // policy, a browser that wants the write closer to the gesture than a promise allows.
      () => this.feedback(false, text)
    );
  }
}

define('copy-elemental', CopyElemental);
