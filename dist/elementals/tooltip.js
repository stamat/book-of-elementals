/* book-of-elementals v0.11.1 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }
  function fits(at, size, limit) {
    return at >= 0 && at + size <= limit;
  }
  function placeFlyout(trigger, panel, viewport, rtl, centred) {
    const below = fits(trigger.bottom, panel.height, viewport.height);
    const above = fits(trigger.top - panel.height, panel.height, viewport.height);
    const side = below || !above ? "block-end" : "block-start";
    const middle = trigger.left + (trigger.right - trigger.left - panel.width) / 2;
    if (centred && fits(middle, panel.width, viewport.width)) return { side, align: "center" };
    const start = rtl ? trigger.right - panel.width : trigger.left;
    const end = rtl ? trigger.left : trigger.right - panel.width;
    return {
      side,
      align: fits(start, panel.width, viewport.width) || !fits(end, panel.width, viewport.width) ? "start" : "end"
    };
  }
  function placeSubmenu(item, panel, viewport, rtl) {
    const inlineEnd = rtl ? item.left - panel.width : item.right;
    const inlineStart = rtl ? item.right : item.left - panel.width;
    const down = fits(item.top, panel.height, viewport.height);
    const up = fits(item.bottom - panel.height, panel.height, viewport.height);
    return {
      side: fits(inlineEnd, panel.width, viewport.width) || !fits(inlineStart, panel.width, viewport.width) ? "inline-end" : "inline-start",
      align: down || !up ? "start" : "end"
    };
  }

  // src/elementals/tooltip/index.js
  function titleRole(trigger) {
    const named = trigger.text && trigger.text.trim() || trigger.ariaLabel || trigger.ariaLabelledby;
    return named ? "description" : "name";
  }
  function nextTooltipState(state, event) {
    const next = { ...state };
    switch (event) {
      case "pointerenter":
        next.hovering = true;
        break;
      case "pointerleave":
        next.hovering = false;
        break;
      case "focus":
        next.focused = true;
        break;
      case "blur":
        next.focused = false;
        break;
      case "escape":
        next.dismissed = true;
        break;
      default:
        return state;
    }
    if (!next.hovering && !next.focused) next.dismissed = false;
    next.open = (next.hovering || next.focused) && !next.dismissed;
    return next;
  }
  function nameText(node) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1 || node.getAttribute("aria-hidden") === "true") return "";
    return [...node.childNodes].map(nameText).join("");
  }
  function arrowOffset(trigger, bubble, horizontal, rtl) {
    if (horizontal) return (trigger.top + trigger.bottom) / 2 - bubble.top;
    const middle = (trigger.left + trigger.right) / 2;
    return rtl ? bubble.left + bubble.width - middle : middle - bubble.left;
  }
  function alignOnAxis(start, end, size, limit, toStart, centred) {
    const at = centred ? (start + end) / 2 - size / 2 : toStart ? start : end - size;
    return Math.min(Math.max(at, 0), Math.max(limit - size, 0));
  }
  function withoutToken(list, token) {
    const kept = (list || "").split(/\s+/).filter((one) => one && one !== token);
    return kept.length ? kept.join(" ") : null;
  }
  var FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var CLOSE_DELAY = 120;
  var FALLBACK_GAP = 6;
  var sequence = 0;
  var TooltipElemental = class extends ElementBase {
    /** The control being described: what the element wraps, or what `for` names. */
    get trigger() {
      const own = this.querySelector(`:scope > ${FOCUSABLE}`);
      if (own) return own;
      const id = this.getAttribute("for");
      return id ? document.getElementById(id) : null;
    }
    /** The words. A direct child that is not the trigger, or - when `for` named the trigger
     * from somewhere else on the page - this element itself. */
    get bubble() {
      const own = this.querySelector(`:scope > ${FOCUSABLE}`);
      if (!own) return this;
      return [...this.children].find((child) => child !== own) || null;
    }
    connectedCallback() {
      if (this.initialized) return;
      const trigger = this.trigger;
      if (!trigger) return;
      let bubble = this.bubble;
      this.wroteBubble = false;
      if (!bubble || bubble === this) {
        if (bubble === this && this.textContent.trim()) {
        } else if (trigger.title) {
          bubble = document.createElement("span");
          bubble.textContent = trigger.title;
          this.appendChild(bubble);
          this.wroteBubble = true;
        } else {
          return;
        }
      }
      const fromTitle = trigger.title && bubble.textContent.trim() === trigger.title.trim();
      this.removedTitle = fromTitle ? trigger.getAttribute("title") : null;
      if (fromTitle) trigger.removeAttribute("title");
      this.initialized = true;
      this.triggerElement = trigger;
      this.bubbleElement = bubble;
      this.state = { hovering: false, focused: false, dismissed: false, open: false };
      bubble.setAttribute("role", "tooltip");
      if (!bubble.id) bubble.id = `tooltip-elemental-${++sequence}`;
      const names = fromTitle && titleRole({
        text: nameText(trigger),
        ariaLabel: trigger.getAttribute("aria-label"),
        ariaLabelledby: trigger.getAttribute("aria-labelledby")
      }) === "name";
      this.wroteName = names;
      if (names) {
        trigger.setAttribute("aria-label", bubble.textContent.trim());
      } else {
        const described = trigger.getAttribute("aria-describedby");
        trigger.setAttribute("aria-describedby", [described, bubble.id].filter(Boolean).join(" "));
      }
      bubble.hidden = true;
      this.onPointer = this.onPointer.bind(this);
      this.onFocus = this.onFocus.bind(this);
      this.onBlur = this.onBlur.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.reposition = this.reposition.bind(this);
      for (const el of [trigger, bubble]) {
        el.addEventListener("pointerenter", this.onPointer);
        el.addEventListener("pointerleave", this.onPointer);
      }
      trigger.addEventListener("focus", this.onFocus);
      trigger.addEventListener("blur", this.onBlur);
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      const trigger = this.triggerElement;
      const bubble = this.bubbleElement;
      for (const el of [trigger, bubble]) {
        el.removeEventListener("pointerenter", this.onPointer);
        el.removeEventListener("pointerleave", this.onPointer);
      }
      trigger.removeEventListener("focus", this.onFocus);
      trigger.removeEventListener("blur", this.onBlur);
      this.stopWatching();
      clearTimeout(this.closeTimer);
      if (this.wroteName) trigger.removeAttribute("aria-label");
      else {
        const described = withoutToken(trigger.getAttribute("aria-describedby"), bubble.id);
        if (described) trigger.setAttribute("aria-describedby", described);
        else trigger.removeAttribute("aria-describedby");
      }
      if (this.removedTitle !== null) trigger.setAttribute("title", this.removedTitle);
      bubble.hidden = false;
      bubble.removeAttribute("role");
      if (this.wroteBubble) bubble.remove();
      this.initialized = false;
    }
    onPointer(e) {
      if (e.pointerType === "touch") return;
      if (e.type === "pointerenter") this.apply("pointerenter");
      else this.close(CLOSE_DELAY);
    }
    onFocus() {
      this.apply("focus");
    }
    onBlur() {
      this.apply("blur");
    }
    onKeydown(e) {
      if (e.key !== "Escape") return;
      this.apply("escape");
    }
    /** Runs one event through the state machine and draws whatever came out of it. */
    apply(event) {
      clearTimeout(this.closeTimer);
      const was = this.state.open;
      this.state = nextTooltipState(this.state, event);
      if (this.state.open === was) return;
      if (this.state.open) this.show();
      else this.hide();
    }
    /** Leaving with a pointer waits, so the strip between the trigger and the bubble can be
     * crossed - the bubble has to be reachable to satisfy "hoverable". */
    close(delay) {
      clearTimeout(this.closeTimer);
      this.closeTimer = setTimeout(() => this.apply("pointerleave"), delay);
    }
    show() {
      this.bubbleElement.hidden = false;
      this.place();
      document.addEventListener("keydown", this.onKeydown);
      window.addEventListener("scroll", this.reposition, { capture: true, passive: true });
      window.addEventListener("resize", this.reposition);
    }
    hide() {
      this.bubbleElement.hidden = true;
      this.stopWatching();
    }
    stopWatching() {
      document.removeEventListener("keydown", this.onKeydown);
      window.removeEventListener("scroll", this.reposition, { capture: true });
      window.removeEventListener("resize", this.reposition);
    }
    reposition() {
      if (this.state.open) this.place();
    }
    /**
     * Puts the bubble beside the trigger, in viewport coordinates.
     *
     * `position: fixed` rather than an offset parent, because the two are not always in the
     * same one - and because a tooltip inside anything scrolling would otherwise be clipped
     * by it. The side and the alignment are written out as attributes as well, since a caret
     * has to point back the way the bubble came from and nothing in CSS can read a number
     * this file computed.
     *
     * The axis is the author's, the side is the viewport's: `horizontal` says beside rather
     * than over or under, and which of the two sides that turns out to be is measured. Which
     * is the whole reason there is no `placement="e"` here - a fixed side is a tooltip off
     * the edge of the screen on the one page where it did not fit.
     */
    place() {
      const trigger = this.triggerElement.getBoundingClientRect();
      const bubble = this.bubbleElement.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const rtl = window.getComputedStyle(this.triggerElement).direction === "rtl";
      const gap = parseFloat(window.getComputedStyle(this.bubbleElement).getPropertyValue("--tooltip-elemental-gap")) || FALLBACK_GAP;
      const horizontal = this.hasAttribute("horizontal");
      const panel = {
        width: bubble.width + (horizontal ? gap : 0),
        height: bubble.height + (horizontal ? 0 : gap)
      };
      const { side, align } = horizontal ? placeSubmenu(trigger, panel, viewport, rtl) : placeFlyout(trigger, panel, viewport, rtl, true);
      const after = side === "inline-end" !== rtl;
      const toStart = align === "start" !== rtl;
      const centred = align === "center";
      const top = horizontal ? alignOnAxis(trigger.top, trigger.bottom, bubble.height, viewport.height, align === "start", centred) : side === "block-end" ? trigger.bottom + gap : trigger.top - bubble.height - gap;
      const left = horizontal ? after ? trigger.right + gap : trigger.left - bubble.width - gap : alignOnAxis(trigger.left, trigger.right, bubble.width, viewport.width, toStart, centred);
      this.bubbleElement.dataset.side = side;
      this.bubbleElement.dataset.align = align;
      this.bubbleElement.style.top = `${Math.round(top)}px`;
      this.bubbleElement.style.left = `${Math.round(left)}px`;
      this.bubbleElement.style.setProperty(
        "--tooltip-elemental-arrow-offset",
        `${Math.round(arrowOffset(trigger, { left, top, width: bubble.width, height: bubble.height }, horizontal, rtl))}px`
      );
    }
  };
  define("tooltip-elemental", TooltipElemental);
})();
//# sourceMappingURL=tooltip.js.map
