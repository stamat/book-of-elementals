import { ElementBase, define } from '../../core.js';

/**
 * The closing rule a `closedby` value names, defaulting the way the platform defaults it.
 *
 * `closerequest` for anything unrecognised rather than nothing at all, because that is what
 * an invalid value does to an enumerated attribute in HTML - and because the alternative,
 * a typo silently producing a dialog that Escape cannot close, is the worst of the three.
 *
 * @param {string|null} value
 * @returns {"any"|"closerequest"|"none"}
 */
export function dismissMode(value) {
  const mode = (value || '').trim().toLowerCase();
  return mode === 'any' || mode === 'none' ? mode : 'closerequest';
}

/**
 * Whether a close request from `source` gets through, under `mode`.
 *
 * @param {"any"|"closerequest"|"none"} mode
 * @param {"escape"|"pointer"} source
 * @returns {boolean}
 */
export function dismissible(mode, source) {
  if (mode === 'none') return false;
  if (source === 'pointer') return mode === 'any';
  return true;
}

/**
 * What an invoker's `command` asks of a dialog, or null for one that is not ours.
 *
 * `request-close` and `close` land in the same place here, and the difference the platform
 * draws between them - one fires `cancel` and can be stopped, the other cannot - is drawn
 * again in {@link ModalElemental#close}, which is the only path either of them takes.
 *
 * @param {string|null} command
 * @returns {"open"|"close"|null}
 */
export function commandAction(command) {
  const name = (command || '').trim().toLowerCase();
  if (name === 'show-modal') return 'open';
  if (name === 'close' || name === 'request-close') return 'close';
  return null;
}

/**
 * What to do about a dialog that has just become open, when this element is not the one
 * that opened it - `null` for nothing at all.
 *
 * Because `document.getElementById('…')` gives an author the `<dialog>` and not the element
 * around it, so `showModal()` on it is the call they will reach for. Left alone, that is a
 * modal that never gets `data-state`, which the stylesheet draws at `opacity: 0` - a
 * backdrop over the page with nothing on it. Same for a `show()`, minus the backdrop.
 *
 * @param {boolean} open Whether the dialog is open now.
 * @param {boolean} modal Whether it is open *modally* - `:modal`, not just `[open]`.
 * @param {boolean} known Whether this element opened it and has it in the stack already.
 * @returns {"modal"|"inline"|null}
 */
export function adoption(open, modal, known) {
  if (!open || known) return null;
  return modal ? 'modal' : 'inline';
}

/**
 * Whether a point is outside a box - the backdrop rather than the dialog.
 *
 * The edge counts as inside, since a click landing exactly on the border of a box is a
 * click on the box.
 *
 * @param {{left: number, top: number, right: number, bottom: number}} rect
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function outside(rect, x, y) {
  return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
}

/** Every open modal on the page, innermost last. Modules do not share it - one bundle
 * per page is the supported way to load the book - and it is what `data-depth` and
 * `close-others` are counted from. */
const stack = [];

// Monotonic counter for generating an `id` for a dialog authored without one. Every modal
// needs one: it is what an invoker's `commandfor` and a fragment in the URL point at.
let dialogCount = 0;

let listening = false;

/** One pair of document listeners for the whole page, however many modals are on it. */
function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener('click', onCommand);
  window.addEventListener('hashchange', syncHash);
}

/** The `<modal-elemental>` a `commandfor` or a fragment names, or null. */
function hostOf(id) {
  const dialog = id ? document.getElementById(id) : null;
  if (!dialog || dialog.localName !== 'dialog') return null;
  const host = dialog.parentElement;
  return host && host.localName === 'modal-elemental' && host.initialized ? host : null;
}

/**
 * Invoker commands, taken over from the browser rather than left to it.
 *
 * Native `command="show-modal"` and `command="close"` are `showModal()` and `close()` with
 * no frame in between, which is a dialog that appears and vanishes - the element exists to
 * animate both ends, so it cancels the activation and runs its own. Cancelling is also what
 * makes this a polyfill for browsers that have no invoker commands: there, the click has no
 * default behaviour to cancel and this is the only thing that fires.
 */
function onCommand(e) {
  if (e.defaultPrevented) return;
  const invoker = e.target.closest && e.target.closest('[commandfor]');
  if (!invoker) return;

  const action = commandAction(invoker.getAttribute('command'));
  const host = action && hostOf(invoker.getAttribute('commandfor'));
  if (!host) return;

  // Before anything else: a `<button>` with no `type` in a form is a submit button, and
  // in a browser without invoker commands that is what this click still is.
  e.preventDefault();
  if (action === 'open') host.show();
  else host.close();
}

/**
 * The fragment in the URL, opening and closing whatever it names.
 *
 * Which is one mechanism doing three jobs: a link to a modal, a deep link that arrives with
 * one already open, and the back button closing it - the last being the one people on a
 * phone press without being taught to.
 */
function syncHash() {
  const id = window.location.hash.slice(1);
  // Copied, because closing a modal takes it out of the stack this is walking.
  for (const modal of [...stack]) {
    if (modal.fromHash && modal.dialog.id !== id) modal.close();
  }
  const host = hostOf(id);
  if (host && !host.open) host.show({ fromHash: true, pushed: true });
}

/**
 * Every animation the dialog and its backdrop are running, settled.
 *
 * The subtree is asked for because `::backdrop` is in it and there is no other way to reach
 * a pseudo-element's animations - and then filtered back down to the dialog's own, because
 * a spinner inside a modal is a real thing to put in one and an infinite animation would
 * mean a close that never finishes. Infinite ones on the dialog itself go the same way, for
 * the same reason.
 *
 * `allSettled` rather than `all`: an animation cancelled mid-close - by a reopen, by a
 * stylesheet swap - rejects its `finished`, and a rejection here is still an ending.
 *
 * @param {HTMLDialogElement} dialog
 * @returns {Promise}
 */
function settle(dialog) {
  if (typeof dialog.getAnimations !== 'function') return Promise.resolve();
  const running = dialog.getAnimations({ subtree: true }).filter((animation) => {
    const effect = animation.effect;
    return effect && effect.target === dialog &&
      effect.getComputedTiming().iterations !== Infinity;
  });
  return Promise.allSettled(running.map((animation) => animation.finished));
}

/**
 * Stop whatever the modal was playing, now that it is closed.
 *
 * A closed dialog is `display: none`, which stops nothing: a video keeps playing and an
 * embed keeps talking to a reader who has already dismissed it. `pause()` covers the
 * elements; an embedded player is a cross-origin document that cannot be paused from here,
 * so its frame is reloaded instead - which is why reopening a lightbox starts the video at
 * the beginning rather than where it was.
 */
function stopMedia(dialog) {
  for (const media of dialog.querySelectorAll('video, audio')) {
    if (!media.paused) media.pause();
  }
  for (const frame of dialog.querySelectorAll('iframe[src]')) {
    // Every framed document, not only a player: there is no way to ask a cross-origin one
    // whether it was making noise. An opt-out belongs here the day something inside one is
    // worth keeping across a close.
    const src = frame.src;
    frame.src = src;
  }
}

/**
 * `<modal-elemental>` custom element.
 *
 * A `<dialog>` opened as a modal, per the
 * [APG Modal Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) - and
 * mostly by the browser rather than by this element. `showModal()` already puts the dialog
 * in the top layer, makes the rest of the page inert, moves focus in, brings it back on
 * close and closes on Escape, and it does all of that better than a focus trap in script
 * can: nesting one modal inside another is the browser stacking two entries in the top
 * layer, not two libraries arguing over which one owns the page.
 *
 * What is left over is what this element is: an exit animation that the platform cannot
 * give a dialog without the `overlay` property, which Firefox and Safari do not have; a
 * click on the backdrop, which needs `closedby` support Safari does not have either; the
 * page behind not scrolling; and the pile of backdrops a stack of modals would otherwise
 * paint on top of each other.
 *
 * Light DOM, no shadow root, nothing moved: the `<dialog>` stays exactly where it was
 * written, and every attribute on it is still the platform's own.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * @tag modal-elemental
 * @attr {"any"|"closerequest"|"none"} [closedby=closerequest] - What closes the dialog besides a close button: `closerequest` is Escape, `any` adds a click on the backdrop, `none` neither. The same three values HTML gives `<dialog>`, read from here so the element can animate the close instead of the browser cutting it short - written on the `<dialog>` it is moved up here on upgrade.
 * @attr {boolean} [close-others=false] - Opening this one closes every modal already open, instead of stacking on top of them.
 *
 * @cssprop {<time>} [--modal-elemental-duration=200ms] - How long the dialog and its backdrop take to arrive and to leave. The element waits for the animation it starts, so `0s` closes instantly.
 * @cssprop {<easing-function>} [--modal-elemental-easing=ease] - Easing for both ends.
 *
 * @fires modal-toggle - `detail.open` is the new state, `detail.dialog` the dialog, `detail.depth` how deep in a stack of modals it sits.
 *
 * @slot - The `<dialog>`. One direct child, with the modal's content inside it.
 */
export class ModalElemental extends ElementBase {
  /** The dialog this element upgrades. Direct child, so a nested modal's dialog is not
   * mistaken for this one's. */
  get dialog() {
    return this.querySelector(':scope > dialog');
  }

  /** Whether the modal is on screen. Closing counts as open until the animation is over,
   * which is what the dialog is doing for that quarter second. */
  get open() {
    const dialog = this.dialog;
    return !!dialog && dialog.open;
  }

  connectedCallback() {
    if (this.initialized) return;
    const dialog = this.dialog;
    if (!dialog) return;

    this.initialized = true;
    listen();

    if (!dialog.id) dialog.id = 'modal-elemental-' + (++dialogCount);

    // Taken off the dialog rather than read where it sits. Left there, a browser with
    // `closedby` support would light-dismiss the modal itself, and the `cancel` event it
    // fires for that is not cancelable - so the close could not be held back for its
    // animation, and the same markup would fade out in Safari and blink out in Chrome.
    const authored = dialog.getAttribute('closedby');
    if (authored !== null && !this.hasAttribute('closedby')) this.setAttribute('closedby', authored);
    dialog.removeAttribute('closedby');

    this.name(dialog);

    // A `<dialog open>` in the markup is already showing when this runs, and there will be
    // no mutation to hear about it.
    this.adopt();

    // Every other way the dialog can be opened by something that is not this element:
    // `showModal()` or `show()` from a page's own script, or the `open` attribute set by
    // hand. The observer is what keeps "the dialog is open" and "the element knows" from
    // being two different facts.
    this.observer = new MutationObserver(() => this.adopt());
    this.observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });

    this.onCancel = this.onCancel.bind(this);
    this.onNativeClose = this.onNativeClose.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    dialog.addEventListener('cancel', this.onCancel);
    dialog.addEventListener('close', this.onNativeClose);
    dialog.addEventListener('pointerdown', this.onPointerDown);
    dialog.addEventListener('click', this.onClick);
    // Captured: `method="dialog"` closes the dialog as the form's default action, and the
    // element has to be ahead of a page's own submit handler to hold that back.
    dialog.addEventListener('submit', this.onSubmit, true);

    // A page loaded on `#some-dialog` opens it, which is the deep link half of hash
    // support. `dialog.open` is checked because a `<dialog open>` in the markup is already
    // showing - inline and not modal, which is the author's decision, not this element's.
    if (!dialog.open && window.location.hash.slice(1) === dialog.id) this.show({ fromHash: true });
  }

  /**
   * Take over a dialog somebody else opened, so it looks like one this element opened.
   *
   * A modal joins the stack and is numbered with the rest, since the backdrops have to be
   * counted whoever asked for them. A non-modal `show()` gets the visible state and nothing
   * else: it is a dialog in the page, not over it, and putting it in the stack would dim
   * the page and lock its scroll for a box the reader can still click past.
   */
  adopt() {
    const dialog = this.dialog;
    if (!dialog) return;
    const modal = typeof dialog.matches === 'function' && dialog.matches(':modal');
    const what = adoption(dialog.open, modal, stack.includes(this) || this.closing);
    if (!what) return;

    if (what === 'modal') {
      stack.push(this);
      depths();
    }
    // The same flush `show()` needs, for the same reason: the state it opens from has to be
    // computed before the state it opens into is set, or there is nothing to transition
    // between. This runs in a microtask, before the frame is rendered, so there is still
    // time for it to count.
    dialog.getBoundingClientRect();
    dialog.dataset.state = 'open';
    this.toggled(true);
  }

  disconnectedCallback() {
    if (!this.initialized) return;
    const dialog = this.dialog;
    const index = stack.indexOf(this);
    if (index !== -1) stack.splice(index, 1);
    depths();

    if (this.observer) this.observer.disconnect();
    this.observer = null;

    if (dialog) {
      dialog.removeEventListener('cancel', this.onCancel);
      dialog.removeEventListener('close', this.onNativeClose);
      dialog.removeEventListener('pointerdown', this.onPointerDown);
      dialog.removeEventListener('click', this.onClick);
      dialog.removeEventListener('submit', this.onSubmit, true);
      delete dialog.dataset.state;
      delete dialog.dataset.depth;
    }

    this.closing = false;
    this.initialized = false;
  }

  /** What `closedby` says, whether it was written here or on the dialog. */
  get closedBy() {
    return dismissMode(this.getAttribute('closedby'));
  }

  /**
   * Give the dialog a name if it has none, from the first heading inside it.
   *
   * A dialog with no accessible name is announced as "dialog" and nothing else, which is
   * the most common failure of the pattern and the one an author is least likely to see -
   * their own modal has a heading at the top of it, right there on screen. `aria-labelledby`
   * points at that heading rather than copying its words, so the two cannot drift apart.
   *
   * Only a heading of this dialog: a nested modal written inside this one has headings too,
   * and they name a different dialog.
   */
  name(dialog) {
    if (dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby')) return;
    const headings = dialog.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const heading = [...headings].find((node) => node.closest('dialog') === dialog);
    if (!heading) return;
    if (!heading.id) heading.id = dialog.id + '-title';
    dialog.setAttribute('aria-labelledby', heading.id);
  }

  /**
   * Open the modal.
   *
   * @param {{fromHash?: boolean, pushed?: boolean}} [options] - `fromHash` marks the URL as
   *   what opened it, so closing takes the fragment back off again. `pushed` says that
   *   fragment was navigated to rather than loaded with, which decides how it comes off.
   */
  show(options) {
    const dialog = this.dialog;
    if (!dialog) return;

    if (dialog.open) {
      // Caught mid-close: the dialog never left, so this is the animation turning round
      // rather than a second modal opening.
      if (this.closing) {
        this.closing = false;
        stack.push(this);
        depths();
        dialog.dataset.state = 'open';
      }
      return;
    }

    if (this.hasAttribute('close-others')) {
      for (const modal of [...stack]) modal.close();
    }

    this.fromHash = !!(options && options.fromHash);
    // Only a fragment that was navigated to has an entry to go back to. One the page loaded
    // with is the first entry there is, and going back from it leaves the site.
    this.hashPushed = !!(options && options.pushed);

    stack.push(this);
    depths();
    dialog.showModal();

    // The style the dialog opens from has to be computed before the one it opens into is
    // set, or the two land in the same frame and there is nothing to transition between.
    // Reading layout is what forces that, and is why this is not in a
    // `requestAnimationFrame`: a frame later is a frame the modal spends invisible.
    dialog.getBoundingClientRect();
    dialog.dataset.state = 'open';

    this.toggled(true);
  }

  /**
   * Close the modal, once its animation has finished.
   *
   * Every way out lands here - Escape, the backdrop, a close button, a form, the fragment
   * changing - so there is one close, and it is animated whichever door was used. The
   * exception is an author calling `close()` on the `<dialog>` itself, which the platform
   * performs immediately and this element only tidies up after.
   *
   * @param {string} [returnValue] - What `dialog.returnValue` should say afterwards.
   */
  async close(returnValue) {
    const dialog = this.dialog;
    if (!dialog || !dialog.open || this.closing) return;

    this.closing = true;
    // Out of the stack now rather than when the animation ends, so a modal replacing this
    // one - `close-others`, a link to another - is numbered as though this one had already
    // gone. Its own depth is left where it was: it is still on screen, still painting the
    // backdrop it was painting, until the fade is over.
    const index = stack.indexOf(this);
    if (index !== -1) stack.splice(index, 1);
    depths();

    dialog.dataset.state = 'closing';
    await settle(dialog);
    // The modal can have been reopened while the animation ran, and closing it now would
    // be closing something the reader has just been given.
    if (!this.closing) return;
    this.closing = false;

    // `close(undefined)` is not `close()`: the first writes the string "undefined" into
    // `returnValue`, over whatever a form put there.
    if (returnValue === undefined) dialog.close();
    else dialog.close(returnValue);
  }

  /** Bookkeeping for a dialog that has closed, however it closed - including from script
   * that never went through this element. */
  onNativeClose() {
    const dialog = this.dialog;
    if (!dialog) return;
    // Idempotent, and reached twice by design: an animated close takes itself out of the
    // stack when it starts, and a `dialog.close()` from a page's own script never went
    // through that at all.
    const index = stack.indexOf(this);
    if (index !== -1) stack.splice(index, 1);
    depths();

    this.closing = false;
    delete dialog.dataset.state;
    delete dialog.dataset.depth;
    stopMedia(dialog);

    if (this.fromHash && window.location.hash.slice(1) === dialog.id) {
      // Back rather than a rewrite, so the entry the link pushed is spent rather than
      // stranded - otherwise the next back press reopens the modal that was just closed.
      if (this.hashPushed) window.history.back();
      else window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    this.fromHash = false;

    this.toggled(false);
  }

  /**
   * Escape, and every other close request the platform makes.
   *
   * Always prevented, never because the dialog should stay: the close it would perform is
   * instant, and this element owns an animated one. `closedby="none"` is the one case where
   * preventing it is the whole answer - and a second Escape will still force the dialog
   * shut, because a close watcher only lets itself be argued with once.
   */
  onCancel(e) {
    e.preventDefault();
    if (dismissible(this.closedBy, 'escape')) this.close();
  }

  /** Where a click started, since a selection dragged out of the dialog and released on
   * the backdrop is not a click on the backdrop. */
  onPointerDown(e) {
    this.fromBackdrop = e.target === this.dialog &&
      outside(this.dialog.getBoundingClientRect(), e.clientX, e.clientY);
  }

  /**
   * A click on the backdrop, which is a click on the dialog: the backdrop is a
   * pseudo-element and cannot be a target of its own.
   *
   * Two things have to agree for it to count. The target, so a click on a button inside is
   * never one - including the click a keyboard makes, which reports its position as the
   * origin of the viewport and would otherwise read as the far corner of the backdrop. And
   * the geometry, because the dialog's own padding is part of the dialog.
   */
  onClick(e) {
    const dialog = this.dialog;
    if (e.target !== dialog || !this.fromBackdrop) return;
    this.fromBackdrop = false;
    if (!outside(dialog.getBoundingClientRect(), e.clientX, e.clientY)) return;
    if (dismissible(this.closedBy, 'pointer')) this.close();
  }

  /** `<form method="dialog">`, held back long enough to animate and then performed by
   * hand, `returnValue` and all. */
  onSubmit(e) {
    const form = e.target;
    const submitter = e.submitter;
    const method = (submitter && submitter.getAttribute('formmethod')) || form.getAttribute('method');
    if ((method || '').toLowerCase() !== 'dialog') return;
    e.preventDefault();
    this.close(submitter ? submitter.value : '');
  }

  toggled(open) {
    const dialog = this.dialog;
    this.dispatchEvent(new CustomEvent('modal-toggle', {
      bubbles: true,
      detail: { open, dialog, depth: open ? stack.indexOf(this) + 1 : 0 }
    }));
  }
}

/**
 * Number every open modal by how deep in the stack it sits, innermost highest.
 *
 * Which exists because each modal paints its own `::backdrop`, and three of them stacked is
 * three sheets of dim over the page instead of one - the second modal looks like it is
 * further away than the first, when it is the one being read. The theme keys off this to
 * paint the top one only.
 */
function depths() {
  stack.forEach((modal, index) => {
    const dialog = modal.dialog;
    if (dialog) dialog.dataset.depth = index + 1;
  });
}

define('modal-elemental', ModalElemental);
