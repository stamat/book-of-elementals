/* book-of-elementals v2.0.1 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/core.js
  function define2(tag, ctor) {
    if (typeof document === "undefined" || document.readyState !== "loading") {
      define(tag, ctor);
      return;
    }
    document.addEventListener("DOMContentLoaded", () => define(tag, ctor), { once: true });
  }

  // src/elementals/modal/index.js
  function dismissMode(value) {
    const mode = (value || "").trim().toLowerCase();
    return mode === "any" || mode === "none" ? mode : "closerequest";
  }
  function dismissible(mode, source) {
    if (mode === "none") return false;
    if (source === "pointer") return mode === "any";
    return true;
  }
  function commandAction(command) {
    const name = (command || "").trim().toLowerCase();
    if (name === "show-modal") return "open";
    if (name === "close" || name === "request-close") return "close";
    return null;
  }
  function adoption(open, modal, known) {
    if (!open || known) return null;
    return modal ? "modal" : "inline";
  }
  function settleLimit(endTimes) {
    const times = endTimes.filter((time) => typeof time === "number" && isFinite(time));
    if (!times.length) return 0;
    return Math.min(SETTLE_CEILING, Math.max(...times) + 50);
  }
  function outside(rect, x, y) {
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
  }
  var stack = [];
  var dialogCount = 0;
  var SETTLE_CEILING = 2e3;
  var listening = false;
  function listen() {
    if (listening) return;
    listening = true;
    document.addEventListener("click", onCommand);
    window.addEventListener("hashchange", syncHash);
  }
  function hostOf(id) {
    const dialog = id ? document.getElementById(id) : null;
    if (!dialog || dialog.localName !== "dialog") return null;
    const host = dialog.parentElement;
    return host && host.localName === "modal-elemental" && host.initialized ? host : null;
  }
  function onCommand(e) {
    if (e.defaultPrevented) return;
    const invoker = e.target.closest && e.target.closest("[commandfor]");
    if (!invoker) return;
    const action = commandAction(invoker.getAttribute("command"));
    const host = action && hostOf(invoker.getAttribute("commandfor"));
    if (!host) return;
    e.preventDefault();
    if (action === "open") host.show();
    else host.close();
  }
  function syncHash() {
    const id = window.location.hash.slice(1);
    for (const modal of [...stack]) {
      if (modal.fromHash && modal.dialog.id !== id) modal.close();
    }
    const host = hostOf(id);
    if (host && !host.open) host.show({ fromHash: true, pushed: true });
  }
  function settle(dialog) {
    if (typeof dialog.getAnimations !== "function") return Promise.resolve();
    let running;
    try {
      running = dialog.getAnimations({ subtree: true }).filter((animation) => {
        const effect = animation.effect;
        return effect && effect.target === dialog && effect.getComputedTiming().iterations !== Infinity;
      });
    } catch {
      return Promise.resolve();
    }
    const limit = settleLimit(running.map((animation) => animation.effect.getComputedTiming().endTime));
    if (!limit) return Promise.resolve();
    return Promise.race([
      Promise.allSettled(running.map((animation) => animation.finished)),
      new Promise((resolve) => setTimeout(resolve, limit))
    ]);
  }
  var PARKED = "about:blank";
  var parked = /* @__PURE__ */ new WeakMap();
  function stopMedia(dialog) {
    for (const media of dialog.querySelectorAll("video, audio")) {
      if (!media.paused) media.pause();
    }
    for (const frame of dialog.querySelectorAll("iframe[src]")) {
      if (parked.has(frame)) continue;
      parked.set(frame, { src: frame.getAttribute("src"), loading: frame.getAttribute("loading") });
      frame.loading = "eager";
      frame.src = PARKED;
    }
  }
  function restoreMedia(dialog) {
    for (const frame of dialog.querySelectorAll("iframe")) {
      const state = parked.get(frame);
      if (!state) continue;
      parked.delete(frame);
      if (state.loading === null) frame.removeAttribute("loading");
      else frame.setAttribute("loading", state.loading);
      if (state.src !== null) frame.setAttribute("src", state.src);
    }
  }
  var CLOSE_CLASS = "modal-elemental-close";
  function writesClose(mode) {
    return mode !== "none";
  }
  var ModalElemental = class extends ElementBase {
    /** The dialog this element upgrades. Direct child, so a nested modal's dialog is not
     * mistaken for this one's. */
    get dialog() {
      return this.querySelector(":scope > dialog");
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
      if (!dialog.id) dialog.id = "modal-elemental-" + ++dialogCount;
      const authored = dialog.getAttribute("closedby");
      if (authored !== null && !this.hasAttribute("closedby")) this.setAttribute("closedby", authored);
      dialog.removeAttribute("closedby");
      this.name(dialog);
      this.writeClose(dialog);
      this.adopt();
      this.observer = new MutationObserver(() => this.adopt());
      this.observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
      this.onCancel = this.onCancel.bind(this);
      this.onNativeClose = this.onNativeClose.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
      dialog.addEventListener("cancel", this.onCancel);
      dialog.addEventListener("close", this.onNativeClose);
      dialog.addEventListener("pointerdown", this.onPointerDown);
      dialog.addEventListener("click", this.onClick);
      dialog.addEventListener("submit", this.onSubmit, true);
      if (!dialog.open && window.location.hash.slice(1) === dialog.id) this.show({ fromHash: true });
    }
    /**
     * Write the cross in the corner.
     *
     * First child rather than last, so the tab order and the reading order agree with where it
     * is drawn - and so focus lands on it when the dialog opens, which is the right first stop
     * for a dialog that is read rather than filled in. Put `autofocus` on a field to move it.
     *
     * `command="request-close"` rather than a handler of its own: it is the same door the
     * Escape key uses, animation and all, and it is markup an author could have written.
     *
     * The cross is text, not a background image, so a page that loaded the script but not the
     * stylesheet still has a button with something in it. `aria-label` is what is announced -
     * a cross is a shape and reads as nothing.
     */
    writeClose(dialog) {
      if (!writesClose(this.closedBy)) return;
      if (dialog.querySelector(":scope > ." + CLOSE_CLASS)) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = CLOSE_CLASS;
      button.setAttribute("command", "request-close");
      button.setAttribute("commandfor", dialog.id);
      button.setAttribute("aria-label", this.getAttribute("close-text") || "Close");
      button.textContent = "\u2715";
      dialog.prepend(button);
      this.closeButton = button;
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
      const modal = typeof dialog.matches === "function" && dialog.matches(":modal");
      const what = adoption(dialog.open, modal, stack.includes(this) || this.closing);
      if (!what) return;
      if (what === "modal") {
        stack.push(this);
        depths();
      }
      dialog.getBoundingClientRect();
      dialog.dataset.state = "open";
      restoreMedia(dialog);
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
      if (this.closeButton) this.closeButton.remove();
      this.closeButton = null;
      if (dialog) {
        dialog.removeEventListener("cancel", this.onCancel);
        dialog.removeEventListener("close", this.onNativeClose);
        dialog.removeEventListener("pointerdown", this.onPointerDown);
        dialog.removeEventListener("click", this.onClick);
        dialog.removeEventListener("submit", this.onSubmit, true);
        delete dialog.dataset.state;
        delete dialog.dataset.depth;
      }
      this.closing = false;
      this.initialized = false;
    }
    /** What `closedby` says, whether it was written here or on the dialog. */
    get closedBy() {
      return dismissMode(this.getAttribute("closedby"));
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
      if (dialog.hasAttribute("aria-label") || dialog.hasAttribute("aria-labelledby")) return;
      const headings = dialog.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const heading = [...headings].find((node) => node.closest("dialog") === dialog);
      if (!heading) return;
      if (!heading.id) heading.id = dialog.id + "-title";
      dialog.setAttribute("aria-labelledby", heading.id);
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
        if (this.closing) {
          this.closing = false;
          stack.push(this);
          depths();
          dialog.dataset.state = "open";
        }
        return;
      }
      if (this.hasAttribute("close-others")) {
        for (const modal of [...stack]) modal.close();
      }
      this.fromHash = !!(options && options.fromHash);
      this.hashPushed = !!(options && options.pushed);
      stack.push(this);
      depths();
      dialog.showModal();
      restoreMedia(dialog);
      dialog.getBoundingClientRect();
      dialog.dataset.state = "open";
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
      const index = stack.indexOf(this);
      if (index !== -1) stack.splice(index, 1);
      depths();
      dialog.dataset.state = "closing";
      try {
        await settle(dialog);
      } catch {
      }
      if (!this.closing) return;
      this.closing = false;
      if (returnValue === void 0) dialog.close();
      else dialog.close(returnValue);
    }
    /** Bookkeeping for a dialog that has closed, however it closed - including from script
     * that never went through this element. */
    onNativeClose() {
      const dialog = this.dialog;
      if (!dialog) return;
      const index = stack.indexOf(this);
      if (index !== -1) stack.splice(index, 1);
      depths();
      this.closing = false;
      delete dialog.dataset.state;
      delete dialog.dataset.depth;
      stopMedia(dialog);
      if (this.fromHash && window.location.hash.slice(1) === dialog.id) {
        if (this.hashPushed) window.history.back();
        else window.history.replaceState(null, "", window.location.pathname + window.location.search);
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
      if (dismissible(this.closedBy, "escape")) this.close();
    }
    /** Where a click started, since a selection dragged out of the dialog and released on
     * the backdrop is not a click on the backdrop. */
    onPointerDown(e) {
      this.fromBackdrop = e.target === this.dialog && outside(this.dialog.getBoundingClientRect(), e.clientX, e.clientY);
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
      if (dismissible(this.closedBy, "pointer")) this.close();
    }
    /** `<form method="dialog">`, held back long enough to animate and then performed by
     * hand, `returnValue` and all. */
    onSubmit(e) {
      const form = e.target;
      const submitter = e.submitter;
      const method = submitter && submitter.getAttribute("formmethod") || form.getAttribute("method");
      if ((method || "").toLowerCase() !== "dialog") return;
      e.preventDefault();
      this.close(submitter ? submitter.value : "");
    }
    toggled(open) {
      const dialog = this.dialog;
      this.dispatchEvent(new CustomEvent("modal-toggle", {
        bubbles: true,
        detail: { open, dialog, depth: open ? stack.indexOf(this) + 1 : 0 }
      }));
    }
  };
  function depths() {
    stack.forEach((modal, index) => {
      const dialog = modal.dialog;
      if (dialog) dialog.dataset.depth = index + 1;
    });
  }
  define2("modal-elemental", ModalElemental);
})();
//# sourceMappingURL=modal.js.map
