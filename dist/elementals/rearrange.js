/* book-of-elementals v2.0.1 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/helpers.mjs
  function shallowMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      target[key] = source[key];
    }
    return target;
  }
  var objProto = Object.prototype;
  var foldF64 = new Float64Array(1);
  var foldU32 = new Uint32Array(foldF64.buffer);
  function isObject(o) {
    return typeof o === "object" && !Array.isArray(o) && o !== null;
  }
  function isFunction(o) {
    return typeof o === "function";
  }
  var PLAIN = {
    \u00C6: "AE",
    \u00E6: "ae",
    \u0152: "OE",
    \u0153: "oe",
    \u00DF: "ss",
    "\u1E9E": "SS",
    \u00DE: "TH",
    \u00FE: "th",
    \u0110: "D",
    \u0111: "d",
    \u00D0: "D",
    \u00F0: "d",
    \u00D8: "O",
    \u00F8: "o",
    \u0141: "L",
    \u0142: "l",
    \u013F: "L",
    \u0140: "l",
    \u0126: "H",
    \u0127: "h",
    \u0166: "T",
    \u0167: "t",
    \u01E4: "G",
    \u01E5: "g",
    \u014A: "N",
    \u014B: "n",
    \u0131: "i"
  };
  var PLAIN_RE = new RegExp(`[${Object.keys(PLAIN).join("")}]`, "g");
  function percentage(num, total) {
    if (Number.isNaN(num) || Number.isNaN(total) || total === 0) return 0;
    return num / total * 100;
  }
  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }
  function sampleVelocity(samples, windowMs = 80) {
    const result = {};
    if (!samples || !samples.length) return result;
    const last = samples[samples.length - 1];
    const keys = Object.keys(last).filter((key) => key !== "t" && typeof last[key] === "number");
    for (const key of keys) result[key] = 0;
    if (samples.length < 2) return result;
    let start = samples[0];
    for (let i = samples.length - 1; i >= 0; i--) {
      start = samples[i];
      if (last.t - samples[i].t >= windowMs) break;
    }
    const dt = last.t - start.t;
    if (dt <= 0) return result;
    for (const key of keys) result[key] = (last[key] - start[key]) / dt;
    return result;
  }

  // node_modules/book-of-spells/src/dom.mjs
  var dragging = /* @__PURE__ */ new WeakSet();
  function drag(target, opts) {
    const fromEvent = !!target && typeof target === "object" && target.type === "pointerdown" && "pointerId" in target;
    const element = fromEvent ? isObject(opts) && opts.target || target.currentTarget || target.target : target;
    if (!element || !(element instanceof Element)) return;
    if (!fromEvent && element.getAttribute("drag-enabled") === "true") return;
    if (fromEvent && dragging.has(element)) return;
    const doc = element.ownerDocument;
    let x = 0;
    let y = 0;
    let clientX = 0;
    let clientY = 0;
    let prevX = 0;
    let prevY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let pointerId = null;
    let pointerType = "";
    let rect = null;
    let inertiaId = null;
    let inertiaTime = 0;
    let samples = [];
    const options = {
      within: null,
      inertia: false,
      bounce: false,
      friction: 0.9,
      bounceFactor: 0.2,
      velocityWindow: 80,
      maxVelocity: 2,
      axis: null,
      callback: null,
      preventDefaultTouch: true
    };
    if (isFunction(opts)) {
      options.callback = opts;
    } else if (isObject(opts)) {
      shallowMerge(options, opts);
    }
    options.friction = Math.abs(options.friction);
    options.bounceFactor = Math.abs(options.bounceFactor);
    const capInPercent = typeof options.maxVelocity === "string" && options.maxVelocity.trim().endsWith("%");
    const cap = Math.abs(parseFloat(options.maxVelocity));
    options.maxVelocity = Number.isNaN(cap) ? 2 : cap;
    let capX = options.maxVelocity;
    let capY = options.maxVelocity;
    const measureVelocity = function() {
      const v = sampleVelocity(samples, options.velocityWindow);
      velocityX = options.axis === "y" ? 0 : clamp(v.x || 0, -capX, capX);
      velocityY = options.axis === "x" ? 0 : clamp(v.y || 0, -capY, capY);
    };
    if (!fromEvent) {
      element.setAttribute("drag-enabled", "true");
      element.setAttribute("dragging", "false");
    }
    const ownTouchAction = element.style.touchAction || "";
    if (!fromEvent && options.preventDefaultTouch) element.style.touchAction = "none";
    const measured = options.within instanceof Element ? options.within : element;
    const calcPageRelativeRect = function() {
      const origRect = measured.getBoundingClientRect();
      const rect2 = {
        top: origRect.top + window.scrollY,
        left: origRect.left + window.scrollX,
        width: origRect.width,
        height: origRect.height
      };
      return rect2;
    };
    const handleStart = function(e) {
      if (dragging.has(element)) return;
      dragging.add(element);
      samples = [];
      pointerId = e.pointerId;
      pointerType = e.pointerType || "";
      setXY(e);
      prevX = x;
      prevY = y;
      rect = calcPageRelativeRect();
      if (capInPercent) {
        capX = rect.width * options.maxVelocity / 100;
        capY = rect.height * options.maxVelocity / 100;
      }
      if (!fromEvent) element.setAttribute("dragging", "true");
      if (element.setPointerCapture) {
        try {
          element.setPointerCapture(e.pointerId);
        } catch {
        }
      }
      doc.addEventListener("pointermove", handleMove);
      doc.addEventListener("pointerup", handleEnd);
      doc.addEventListener("pointercancel", handleCancel);
      if (inertiaId) {
        cancelAnimationFrame(inertiaId);
        inertiaId = null;
      }
      const event = new CustomEvent("dragstart", { detail: getDetail() });
      element.dispatchEvent(event);
    };
    const handleMove = function(e) {
      if (e.pointerId !== pointerId) return;
      if (e.clientX === clientX && e.clientY === clientY && e.pageX === x && e.pageY === y) return;
      setXY(e);
      measureVelocity();
      const detail = getDetail();
      if (options.callback) options.callback(detail);
      const event = new CustomEvent("drag", { detail });
      element.dispatchEvent(event);
    };
    const stop = function() {
      dragging.delete(element);
      if (!fromEvent) element.setAttribute("dragging", "false");
      doc.removeEventListener("pointermove", handleMove);
      doc.removeEventListener("pointerup", handleEnd);
      doc.removeEventListener("pointercancel", handleCancel);
      if (element.hasPointerCapture && element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
      pointerId = null;
    };
    const handleEnd = function(e) {
      if (e.pointerId !== pointerId) return;
      stop();
      const t = performance.now();
      samples.push({ t, x, y });
      measureVelocity();
      inertiaTime = t;
      if (options.inertia) inertiaId = requestAnimationFrame(inertia);
      const event = new CustomEvent("dragend", { detail: getDetail() });
      element.dispatchEvent(event);
    };
    const handleCancel = function(e) {
      if (e.pointerId !== pointerId) return;
      stop();
      velocityX = 0;
      velocityY = 0;
      samples = [];
      const event = new CustomEvent("dragcancel", { detail: getDetail() });
      element.dispatchEvent(event);
    };
    const setXY = function(e) {
      prevX = x;
      prevY = y;
      x = e.pageX;
      y = e.pageY;
      clientX = e.clientX;
      clientY = e.clientY;
      samples.push({ t: performance.now(), x, y });
      if (samples.length > 12) samples.shift();
    };
    const getDetail = function() {
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      const xPercentage = percentage(relativeX, rect.width);
      const yPercentage = percentage(relativeY, rect.height);
      const detail = {
        target: element,
        x,
        y,
        clientX,
        clientY,
        relativeX,
        relativeY,
        xPercentage,
        yPercentage,
        velocityX,
        velocityY,
        prevX,
        prevY,
        pointerType
      };
      if (xPercentage < 0) detail.xPercentage = 0;
      if (xPercentage > 100) detail.xPercentage = 100;
      if (yPercentage < 0) detail.yPercentage = 0;
      if (yPercentage > 100) detail.yPercentage = 100;
      return detail;
    };
    const inertia = function() {
      const t = performance.now();
      const dt = t - inertiaTime;
      inertiaTime = t;
      x += velocityX * dt;
      y += velocityY * dt;
      const decay = Math.pow(options.friction, dt / 16.6667);
      velocityX *= decay;
      velocityY *= decay;
      if (options.bounce) {
        if (x < rect.left) {
          x = rect.left;
          velocityX *= -options.bounceFactor;
        }
        if (x > rect.width + rect.left) {
          x = rect.width + rect.left;
          velocityX *= -options.bounceFactor;
        }
        if (y < rect.top) {
          y = rect.top;
          velocityY *= -options.bounceFactor;
        }
        if (y > rect.height + rect.top) {
          y = rect.height + rect.top;
          velocityY *= -options.bounceFactor;
        }
      }
      if (Math.abs(velocityX) < 0.01) velocityX = 0;
      if (Math.abs(velocityY) < 0.01) velocityY = 0;
      const detail = getDetail();
      if (velocityX !== 0 || velocityY !== 0) {
        inertiaId = requestAnimationFrame(inertia);
        if (options.callback) options.callback(detail);
        const event = new CustomEvent("draginertia", { detail });
        element.dispatchEvent(event);
      } else {
        inertiaId = null;
        if (options.callback) options.callback(detail);
        const event = new CustomEvent("draginertiaend", { detail });
        element.dispatchEvent(event);
      }
    };
    if (fromEvent) handleStart(target);
    else element.addEventListener("pointerdown", handleStart);
    return {
      //TODO: add manual start, move and end methods - for programmatic control
      destroy: function() {
        if (pointerId !== null) stop();
        if (!fromEvent) {
          element.removeEventListener("pointerdown", handleStart);
          element.style.touchAction = ownTouchAction;
          element.removeAttribute("drag-enabled");
          element.removeAttribute("dragging");
        }
        if (inertiaId) {
          cancelAnimationFrame(inertiaId);
          inertiaId = null;
        }
      }
    };
  }

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

  // src/elementals/rearrange/index.js
  var DEFAULT_UP_TEXT = "Move {label} up";
  var DEFAULT_DOWN_TEXT = "Move {label} down";
  var DEFAULT_MOVED_TEXT = "{label} moved to position {position} of {total}";
  var LABEL_MAX = 80;
  var ANNOUNCE_MS = 100;
  function namingCell(row) {
    return row.querySelector(':scope > th[scope="row"]') || row.querySelector(":scope > th, :scope > td") || row;
  }
  function ownText(item) {
    const source = item.tagName === "TR" ? namingCell(item) : item;
    let text = "";
    for (const node of source.childNodes || []) {
      const skip = node.nodeType === 1 && node.hasAttribute && (node.hasAttribute("data-rearrange-controls") || node.hasAttribute("data-rearrange-handle"));
      if (skip) continue;
      text += node.textContent || "";
    }
    return text;
  }
  function itemLabel(item, max = LABEL_MAX) {
    if (!item) return "";
    const explicit = item.getAttribute ? item.getAttribute("data-label") : null;
    const text = (explicit ?? ownText(item)).replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const space = cut.lastIndexOf(" ");
    return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}\u2026`;
  }
  function format(template, values) {
    return String(template).replace(/\{(\w+)\}/g, (whole, key) => Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole);
  }
  function dropIndex(y, boxes) {
    let index = 0;
    while (index < boxes.length && y >= boxes[index].top + boxes[index].height / 2) index++;
    return index;
  }
  var RearrangeElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["drag", "up-text", "down-text", "moved-text"];
    }
    /** Whether a pointer can drag as well as press. The buttons do not depend on it. */
    get drag() {
      return this.hasAttribute("drag");
    }
    set drag(on) {
      if (on) this.setAttribute("drag", "");
      else this.removeAttribute("drag");
    }
    get upText() {
      return this.getAttribute("up-text") || DEFAULT_UP_TEXT;
    }
    set upText(value) {
      this.setAttribute("up-text", value);
    }
    get downText() {
      return this.getAttribute("down-text") || DEFAULT_DOWN_TEXT;
    }
    set downText(value) {
      this.setAttribute("down-text", value);
    }
    get movedText() {
      return this.getAttribute("moved-text") || DEFAULT_MOVED_TEXT;
    }
    set movedText(value) {
      this.setAttribute("moved-text", value);
    }
    /**
     * What holds the items: the list, or a table's first `<tbody>`.
     *
     * A direct child either way, so a list inside one of the items is not mistaken for this one's.
     * The first `<tbody>` only - a table with several is using them to group, and moving a row
     * between groups would be rearranging the grouping away.
     */
    get container() {
      return this.querySelector(":scope > ol, :scope > ul, :scope > menu, :scope > table > tbody");
    }
    /** The items that move: the container's own children, never a nested list's. */
    get items() {
      const container = this.container;
      return container ? Array.from(container.querySelectorAll(":scope > li, :scope > tr")) : [];
    }
    /**
     * Where an item's controls go: the item itself, and for a table row one of its cells.
     *
     * A `<span>` between two `<td>`s is not something table layout has anywhere to put - the
     * parser fosters it out of the table entirely, and a node appended through the DOM instead
     * lands in an anonymous cell of its own that widens the row by a column nothing declared. The
     * last cell is the default because it needs no `<th>` adding to the header; `data-rearrange-cell`
     * is how a table that keeps a column for this says which one.
     */
    controlsHost(item) {
      if (item.tagName !== "TR") return item;
      const marked = item.querySelector(":scope > [data-rearrange-cell]");
      if (marked) return marked;
      const cells = item.querySelectorAll(":scope > td, :scope > th");
      return cells[cells.length - 1] || item;
    }
    /** The live region. Added at upgrade, because a live region only announces text that lands
     * in one already in the document. */
    get status() {
      return this.querySelector(":scope > .rearrange-elemental-status");
    }
    connectedCallback() {
      if (this.initialized) return;
      if (!this.container) return;
      this.initialized = true;
      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onDragEnd = this.onDragEnd.bind(this);
      this.onDragKey = this.onDragKey.bind(this);
      this.onDragScroll = this.onDragScroll.bind(this);
      this.addEventListener("click", this.onClick);
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("pointerdown", this.onPointerDown);
      this.update();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.initialized = false;
      this.endDrag(false);
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("pointerdown", this.onPointerDown);
      clearTimeout(this.announceTimer);
      for (const controls of this.querySelectorAll("[data-rearrange-controls]")) {
        if (controls.closest("rearrange-elemental") === this) controls.remove();
      }
      const status = this.status;
      if (status) status.remove();
    }
    attributeChangedCallback(name, previous, value) {
      if (!this.initialized || previous === value) return;
      if (name === "drag" && !this.drag) this.endDrag(true);
      this.refresh();
    }
    /**
     * Give every item its controls, and bring the names and the ends of travel up to date.
     *
     * ponytail: called at upgrade and on demand, with no observer behind it. Items that arrive
     * from a render after that call `.update()`; a `MutationObserver` over the list is the
     * upgrade if that turns out to be the common case rather than the rare one.
     */
    update() {
      if (!this.initialized) return;
      if (!this.status) {
        const status = document.createElement("p");
        status.className = "rearrange-elemental-status";
        status.setAttribute("role", "status");
        this.append(status);
      }
      for (const item of this.items) this.controlsFor(item);
      this.refresh();
    }
    /** The controls for one item, made if they are not there yet. */
    controlsFor(item) {
      const host = this.controlsHost(item);
      let controls = host.querySelector(":scope > [data-rearrange-controls]");
      if (controls) return controls;
      controls = document.createElement("span");
      controls.className = "rearrange-elemental-controls";
      controls.setAttribute("data-rearrange-controls", "");
      controls.append(this.moveButton("up"), this.moveButton("down"));
      host.append(controls);
      return controls;
    }
    /**
     * One move button.
     *
     * **The name is the visible text, not an `aria-label` over an icon.** A button labelled
     * "Up" on the screen and "Move Bananas up" to the accessibility tree is
     * [WCAG 2.2 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)
     * failed, and a reader speaking to their computer cannot say a name that is not written
     * anywhere. The theme clips the span and draws an arrow over it, which leaves the name where
     * it was; with no theme loaded the button reads what it does, which is a working control
     * rather than an empty box.
     */
    moveButton(direction) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rearrange-elemental-move";
      button.setAttribute("data-move", direction);
      button.setAttribute("aria-keyshortcuts", direction === "up" ? "Alt+ArrowUp" : "Alt+ArrowDown");
      const label = document.createElement("span");
      label.className = "rearrange-elemental-label";
      button.append(label);
      return button;
    }
    /** The item's drag handle - the author's if they wrote one, ours if `drag` is set. Nested
     * lists have their own element, so a handle belonging to one is not taken for this one's. */
    handleFor(item) {
      const found = item.querySelector("[data-rearrange-handle]");
      return found && found.closest("rearrange-elemental") === this ? found : null;
    }
    /** Names on the buttons, ends of travel marked, handles present or gone. Cheap enough to run
     * on every move: the labels are read from the DOM each time, because the DOM is where the
     * page may have just changed them. */
    refresh() {
      const items = this.items;
      const total = items.length;
      items.forEach((item, index) => {
        const controls = this.controlsHost(item).querySelector(":scope > [data-rearrange-controls]");
        if (!controls) return;
        const label = itemLabel(item);
        for (const button of controls.querySelectorAll(":scope > [data-move]")) {
          const up = button.getAttribute("data-move") === "up";
          button.querySelector(".rearrange-elemental-label").textContent = format(up ? this.upText : this.downText, { label });
          if (up ? index === 0 : index === total - 1) button.setAttribute("aria-disabled", "true");
          else button.removeAttribute("aria-disabled");
        }
        let handle = this.handleFor(item);
        if (!this.drag) {
          if (handle && handle.hasAttribute("data-rearrange-own")) handle.remove();
          return;
        }
        if (!handle) {
          handle = document.createElement("span");
          handle.className = "rearrange-elemental-handle";
          handle.setAttribute("data-rearrange-handle", "");
          handle.setAttribute("data-rearrange-own", "");
          handle.setAttribute("aria-hidden", "true");
          controls.prepend(handle);
        }
      });
    }
    /**
     * Move an item to a position, and say so.
     *
     * @param {Element} item
     * @param {number} to Zero-based, in the list as it is now. Out of range is a no-op, which is
     *   what the first item's up and the last item's down are.
     * @returns {boolean} Whether anything moved.
     */
    move(item, to) {
      const from = this.place(item, to);
      if (from < 0) return false;
      this.report(item, from, this.items.indexOf(item));
      return true;
    }
    /**
     * The DOM half of a move, with nothing announced and nothing dispatched.
     *
     * Apart from `move`, because a drag crosses several positions on the way to one landing: the
     * page wants one event describing where the item ended up, not one per item passed over, and
     * a server told about each of them is a drag that costs six requests.
     *
     * @returns {number} Where the item was, or `-1` if it did not move.
     */
    place(item, to) {
      const items = this.items;
      const from = items.indexOf(item);
      if (from < 0 || to < 0 || to >= items.length || to === from) return -1;
      const before = to > from ? items[to].nextSibling : items[to];
      const focused = item.contains(document.activeElement) ? document.activeElement : null;
      const container = this.container;
      if (container.moveBefore) {
        try {
          container.moveBefore(item, before);
        } catch {
          container.insertBefore(item, before);
        }
      } else {
        container.insertBefore(item, before);
      }
      if (focused && document.activeElement !== focused) focused.focus();
      this.refresh();
      return from;
    }
    /** Tell the reader and tell the page. Both halves in one place, so a drag can never announce
     * something a press would not. */
    report(item, from, to) {
      this.announce(format(this.movedText, {
        label: itemLabel(item),
        position: to + 1,
        total: this.items.length
      }));
      this.dispatchEvent(new CustomEvent("rearrange-move", {
        bubbles: true,
        detail: { item, from, to }
      }));
    }
    /**
     * Say something in the live region.
     *
     * Cleared first and set back in a later task, because a live region announces a *change* and
     * the same sentence written twice running is no change at all - which is what an item moved
     * up and then down again would be.
     */
    announce(message) {
      const status = this.status;
      if (!status) return;
      status.textContent = "";
      clearTimeout(this.announceTimer);
      this.announceTimer = setTimeout(() => {
        status.textContent = message;
      }, ANNOUNCE_MS);
    }
    onClick(event) {
      const button = event.target.closest && event.target.closest("[data-move]");
      if (!button || button.closest("rearrange-elemental") !== this) return;
      if (button.getAttribute("aria-disabled") === "true") return;
      const item = button.closest("li, tr");
      const index = this.items.indexOf(item);
      if (index < 0) return;
      this.move(item, index + (button.getAttribute("data-move") === "up" ? -1 : 1));
    }
    /**
     * Alt+Arrow, from anywhere in the item.
     *
     * The fast path the APG's rearrangeable listbox names, and the reason focus stays on the
     * button after a move: an item three places from where it belongs is three presses of one
     * key, not three round trips through the tab order. Announced on the buttons with
     * `aria-keyshortcuts`, which is how a reader finds out it exists.
     */
    onKeyDown(event) {
      if (!event.altKey || event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      const item = event.target.closest && event.target.closest("li, tr");
      const index = item && item.closest("rearrange-elemental") === this ? this.items.indexOf(item) : -1;
      if (index < 0) return;
      event.preventDefault();
      this.move(item, index + (event.key === "ArrowUp" ? -1 : 1));
    }
    /**
     * Take hold of an item.
     *
     * The gesture is `drag()` from book-of-spells, started from the `pointerdown` already in hand -
     * the shape that lets one delegated listener serve a list whose rows come and go, rather than
     * an instance per handle re-made every time the list grows one. What it owns is the pointer:
     * the capture, the `pointercancel` path, and the move listeners on the *document* rather than
     * on the handle, which is what keeps a drag alive across the `insertBefore` fallback in
     * `place` - a captured element loses its capture the moment it is disconnected, and
     * `insertBefore` disconnects before it re-inserts.
     *
     * What stays here is this element's rather than a gesture helper's: the box map, the
     * re-basing, Escape, and where the item lands.
     */
    onPointerDown(event) {
      if (!this.drag || this.dragging || event.button !== 0) return;
      const handle = event.target.closest && event.target.closest("[data-rearrange-handle]");
      if (!handle || handle.closest("rearrange-elemental") !== this) return;
      const item = handle.closest("li, tr");
      const from = this.items.indexOf(item);
      if (from < 0) return;
      event.preventDefault();
      this.dragging = { item, handle, from, index: from, translate: 0, base: event.clientY };
      this.dataset.dragging = "";
      item.dataset.dragging = "";
      this.measure();
      handle.addEventListener("dragend", this.onDragEnd);
      handle.addEventListener("dragcancel", this.onDragEnd);
      document.addEventListener("keydown", this.onDragKey, true);
      document.addEventListener("scroll", this.onDragScroll, true);
      this.dragging.gesture = drag(event, { target: handle, callback: (d) => this.follow(d.clientY) });
    }
    /**
     * Where every item is, once, for the drag in progress.
     *
     * **Measured on the way in and again after each change of places, never per pointer event.** A
     * pointer reports faster than the screen refreshes, and `getBoundingClientRect` inside a
     * handler that has just written a transform forces layout every time it is asked - so the
     * naive loop is a forced layout per item per event. Between two crossings nothing here moves,
     * which is what makes the cache correct rather than merely cheaper.
     */
    measure() {
      const drag2 = this.dragging;
      if (!drag2) return;
      drag2.boxes = this.items.filter((element) => element !== drag2.item).map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, height: rect.height };
      });
    }
    onDragScroll() {
      this.measure();
    }
    /**
     * Follow the pointer, and change places on the way.
     *
     * The item is translated to stay under the finger *and* moved in the DOM as it passes its
     * neighbours - so what the reader is dragging is the real item in its real position, and
     * letting go is not a separate animation that has to land somewhere.
     *
     * The re-basing is the part that is easy to miss: moving the item in the DOM changes where
     * layout puts it, so the same translate would jump it by a row. The two rects either side of
     * the move differ by exactly that layout shift, and adding it to the origin cancels it out.
     */
    follow(clientY) {
      const drag2 = this.dragging;
      if (!drag2) return;
      const to = dropIndex(clientY, drag2.boxes);
      if (to !== drag2.index) {
        const was = drag2.item.getBoundingClientRect().top;
        this.place(drag2.item, to);
        drag2.base += drag2.item.getBoundingClientRect().top - was;
        drag2.index = to;
        drag2.translate = clientY - drag2.base;
        this.measure();
      }
      drag2.translate = clientY - drag2.base;
      drag2.item.style.transform = `translateY(${drag2.translate}px)`;
    }
    /**
     * The end of the gesture, either way it ended.
     *
     * A `dragcancel` is the platform taking the gesture away - a scroll it decided was one, a call
     * arriving - and not the reader letting go. Putting the item back is the only honest reading
     * of a gesture that never finished.
     *
     * Both names are the native drag and drop API's too, and the native ones bubble - an `<img>`
     * inside an author's own handle is draggable without being asked. book-of-spells sends an
     * object as `detail`; a native `dragend` carries the number `UIEvent` gives it, which is what
     * tells the two apart before this ends a drag nobody started.
     */
    onDragEnd(event) {
      if (!event.detail || typeof event.detail !== "object") return;
      this.endDrag(event.type === "dragcancel");
    }
    onDragKey(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      this.endDrag(true);
    }
    /**
     * Let go of whatever is being dragged.
     *
     * @param {boolean} cancel Put the item back where the drag started, and say nothing.
     */
    endDrag(cancel) {
      const drag2 = this.dragging;
      if (!drag2) return;
      this.dragging = null;
      document.removeEventListener("keydown", this.onDragKey, true);
      document.removeEventListener("scroll", this.onDragScroll, true);
      drag2.handle.removeEventListener("dragend", this.onDragEnd);
      drag2.handle.removeEventListener("dragcancel", this.onDragEnd);
      if (drag2.gesture) drag2.gesture.destroy();
      drag2.item.style.transform = "";
      delete drag2.item.dataset.dragging;
      delete this.dataset.dragging;
      if (cancel) {
        this.place(drag2.item, drag2.from);
        return;
      }
      const to = this.items.indexOf(drag2.item);
      if (to !== drag2.from) this.report(drag2.item, drag2.from, to);
    }
  };
  define2("rearrange-elemental", RearrangeElemental);
})();
//# sourceMappingURL=rearrange.js.map
