/* book-of-elementals v0.6.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/helpers.mjs
  var objProto = Object.prototype;
  var foldF64 = new Float64Array(1);
  var foldU32 = new Uint32Array(foldF64.buffer);
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
  function removeAccents(inputString) {
    return inputString.replace(PLAIN_RE, (c) => PLAIN[c]).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
  }
  function matchesSearch(label, search) {
    const needle = removeAccents(search.trim()).toLowerCase();
    return needle === "" || removeAccents(label).toLowerCase().includes(needle);
  }

  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }
  function nextIndex(current, key, length) {
    if (length === 0) return null;
    switch (key) {
      case "ArrowDown":
        return (current + 1) % length;
      case "ArrowUp":
        return current <= 0 ? length - 1 : current - 1;
      case "Home":
        return 0;
      case "End":
        return length - 1;
      default:
        return null;
    }
  }

  // src/elementals/combobox/index.js
  function flipsUp(field, panelHeight, viewportHeight) {
    const below = viewportHeight - field.bottom;
    if (panelHeight <= below) return false;
    return field.top > below;
  }
  function focusAfterRemoval(count, index) {
    return index < count - 1 ? index : -1;
  }
  var comboboxCount = 0;
  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }
  var ComboboxElemental = class extends ElementBase {
    static get observedAttributes() {
      return ["open", "placeholder", "empty-text", "remove-text"];
    }
    /** The control. Direct child, so a `<select>` inside a popover of your own is not
     * mistaken for it. */
    get select() {
      return this.querySelector(":scope > select");
    }
    /** Whether the popup is showing. Reflected, so `[open]` is a styling hook too. */
    get open() {
      return this.hasAttribute("open");
    }
    set open(value) {
      this.toggleAttribute("open", !!value);
    }
    /** Whether this holds more than one value, which is the `<select>`'s own `multiple`. */
    get multiple() {
      const select = this.select;
      return !!select && select.multiple;
    }
    /** Disabled by its own attribute or by a `<fieldset disabled>` above it, which
     * `:disabled` answers for in one selector. */
    get disabled() {
      const select = this.select;
      return !!select && select.matches(":disabled");
    }
    /**
     * What the empty field says. A single select usually has the answer in its own markup
     * already - the `<option value="">Choose a fruit</option>` at the top is a placeholder
     * that has been written down as an option since forms had options.
     */
    get placeholder() {
      if (this.hasAttribute("placeholder")) return this.getAttribute("placeholder");
      const select = this.select;
      if (!select || select.multiple) return "";
      const blank = Array.from(select.options).find((option) => option.value === "");
      return blank ? blank.text : "";
    }
    set placeholder(value) {
      this.setAttribute("placeholder", value);
    }
    get emptyText() {
      return this.getAttribute("empty-text") || "No matches";
    }
    get removeText() {
      return this.getAttribute("remove-text") || "Remove";
    }
    /** The `<select>`'s value, so a single select reads as one string and a multiple one
     * as the first of its selections - exactly as the native property does. */
    get value() {
      const select = this.select;
      return select ? select.value : "";
    }
    set value(value) {
      const select = this.select;
      if (!select) return;
      select.value = value;
      this.sync();
    }
    /** Every selected value, in document order. The one a multiple select has no property
     * for. */
    get values() {
      const select = this.select;
      return select ? Array.from(select.selectedOptions).map((option) => option.value) : [];
    }
    connectedCallback() {
      if (this.initialized) return;
      const select = this.select;
      if (!select) return;
      this.initialized = true;
      this.query = "";
      this.onInput = this.onInput.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onSelectChange = this.onSelectChange.bind(this);
      this.onPointerOver = this.onPointerOver.bind(this);
      this.onInvalid = this.onInvalid.bind(this);
      this.onReset = this.onReset.bind(this);
      this.place = this.place.bind(this);
      this.sync = this.sync.bind(this);
      this.build();
      this.addEventListener("keydown", this.onKeyDown);
      this.addEventListener("pointerdown", this.onPointerDown);
      this.addEventListener("pointerover", this.onPointerOver);
      this.addEventListener("click", this.onClick);
      this.addEventListener("focusout", this.onFocusOut);
      this.input.addEventListener("input", this.onInput);
      select.addEventListener("invalid", this.onInvalid);
      select.addEventListener("change", this.onSelectChange);
      document.addEventListener("click", this.onDocumentClick);
      window.addEventListener("resize", this.place);
      this.form = select.form;
      if (this.form) this.form.addEventListener("reset", this.onReset);
      window.addEventListener("pageshow", this.sync);
      this.apply();
      this.applyOpen();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("keydown", this.onKeyDown);
      this.removeEventListener("pointerdown", this.onPointerDown);
      this.removeEventListener("pointerover", this.onPointerOver);
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("focusout", this.onFocusOut);
      this.input.removeEventListener("input", this.onInput);
      document.removeEventListener("click", this.onDocumentClick);
      window.removeEventListener("resize", this.place);
      window.removeEventListener("pageshow", this.sync);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      const select = this.select;
      if (select) {
        select.removeEventListener("change", this.onSelectChange);
        select.removeEventListener("invalid", this.onInvalid);
      }
      this.form = null;
      this.teardown();
      this.initialized = false;
    }
    // ---- structure ----
    /**
     * Build the view: a field holding the chips, the text input and the popup indicator,
     * and the listbox under it.
     *
     * Inserted **before** the `<select>` rather than after, because a `<label>` wrapping
     * this element names the first labelable thing inside it, and the `<select>` staying
     * first would leave the visible field anonymous while the hidden control wore the name.
     */
    build() {
      const select = this.select;
      const id = "combobox-elemental-" + ++comboboxCount;
      this.field = el("div", "combobox-elemental-field");
      this.chips = el("span", "combobox-elemental-chips");
      this.input = el("input", "combobox-elemental-input");
      this.list = el("ul", "combobox-elemental-list");
      this.error = el("p", "combobox-elemental-error");
      this.indicator = select.multiple ? null : el("button", "combobox-elemental-indicator");
      this.input.id = id;
      this.input.type = "text";
      this.input.autocomplete = "off";
      this.input.spellcheck = false;
      this.input.setAttribute("role", "combobox");
      this.input.setAttribute("aria-expanded", "false");
      this.input.setAttribute("aria-controls", id + "-list");
      this.input.setAttribute("aria-autocomplete", "list");
      if (this.indicator) {
        this.indicator.type = "button";
        this.indicator.tabIndex = -1;
        this.indicator.setAttribute("aria-hidden", "true");
      }
      this.list.id = id + "-list";
      this.list.setAttribute("role", "listbox");
      this.list.hidden = true;
      if (select.multiple) this.list.setAttribute("aria-multiselectable", "true");
      this.error.id = id + "-error";
      this.error.setAttribute("role", "alert");
      this.error.hidden = true;
      this.field.append(this.chips, this.input);
      if (this.indicator) this.field.append(this.indicator);
      this.insertBefore(this.field, select);
      this.insertBefore(this.list, select);
      this.insertBefore(this.error, select);
      this.labels = Array.from(select.labels || []).filter((label) => label.htmlFor);
      for (const label of this.labels) label.htmlFor = this.input.id;
      for (const name of ["aria-label", "aria-labelledby", "aria-describedby"]) {
        if (select.hasAttribute(name)) this.input.setAttribute(name, select.getAttribute(name));
      }
      this.describedBy = select.getAttribute("aria-describedby") || "";
      select.tabIndex = -1;
      select.setAttribute("aria-hidden", "true");
      select.classList.add("combobox-elemental-native");
    }
    /** Put the markup back the way it arrived: the view goes, the `<select>` returns to
     * being an ordinary, focusable, announced control. An element that is no longer here
     * leaves nothing behind that only it knew how to drive. */
    teardown() {
      const select = this.select;
      if (select) {
        select.removeAttribute("tabindex");
        select.removeAttribute("aria-hidden");
        select.classList.remove("combobox-elemental-native");
        for (const label of this.labels || []) label.htmlFor = select.id;
      }
      if (this.field) this.field.remove();
      if (this.list) this.list.remove();
      if (this.error) this.error.remove();
      this.pairs = [];
    }
    /**
     * Read the `<select>` again: rebuild the options and redraw everything from them.
     * Public because that is the one thing no event announces - replace the `<option>`s
     * from script and this is the call that catches up.
     */
    apply() {
      const select = this.select;
      if (!select) return;
      this.list.textContent = "";
      this.pairs = [];
      for (const node of select.children) {
        if (node.tagName === "OPTGROUP") {
          const holder = el("li", "combobox-elemental-group");
          holder.setAttribute("role", "presentation");
          const label = el("span", "combobox-elemental-group-label");
          label.setAttribute("aria-hidden", "true");
          label.textContent = node.label;
          const group = el("ul");
          group.setAttribute("role", "group");
          group.setAttribute("aria-label", node.label);
          holder.append(label, group);
          for (const option of node.children) this.addOption(option, group);
          this.list.append(holder);
          continue;
        }
        if (node.tagName === "OPTION") this.addOption(node, this.list);
      }
      this.empty = el("li", "combobox-elemental-empty");
      this.empty.setAttribute("role", "option");
      this.empty.setAttribute("aria-disabled", "true");
      this.empty.hidden = true;
      this.list.append(this.empty);
      this.filter();
      this.sync();
    }
    addOption(option, parent) {
      if (option.tagName !== "OPTION") return;
      const item = el("li", "combobox-elemental-option");
      item.id = this.list.id + "-" + this.pairs.length;
      item.setAttribute("role", "option");
      item.textContent = option.text;
      if (option.disabled) item.setAttribute("aria-disabled", "true");
      parent.append(item);
      this.pairs.push({ option, item });
    }
    // ---- state ----
    /**
     * Push the `<select>` onto the view: the chips, the selected states, the field's text
     * and whether any of it can be touched.
     *
     * The field's text is the selection and nothing else, so a query typed and abandoned -
     * by tabbing away, by Escape, by picking something - never survives as a label for a
     * value it does not name.
     */
    sync() {
      const select = this.select;
      if (!select || !this.initialized) return;
      const multiple = select.multiple;
      const disabled = this.disabled;
      for (const pair of this.pairs) {
        pair.item.setAttribute("aria-selected", pair.option.selected ? "true" : "false");
      }
      this.chips.textContent = "";
      if (multiple) {
        for (const option of select.selectedOptions) {
          const chip = el("span", "combobox-elemental-chip");
          const label = el("span", "combobox-elemental-chip-label");
          label.textContent = option.text;
          const remove = el("button", "combobox-elemental-chip-remove");
          remove.type = "button";
          remove.disabled = disabled;
          remove.setAttribute("aria-label", this.removeText + " " + option.text);
          chip.append(label, remove);
          this.chips.append(chip);
        }
      } else {
        const option = select.selectedOptions[0];
        this.input.value = option && option.value !== "" ? option.text : "";
      }
      this.input.placeholder = this.placeholder;
      this.input.disabled = disabled;
      if (this.indicator) this.indicator.disabled = disabled;
      if (select.required) this.input.setAttribute("aria-required", "true");
      else this.input.removeAttribute("aria-required");
      if (disabled && this.open) this.open = false;
      if (!this.error.hidden && select.checkValidity()) this.clearError();
    }
    /**
     * The browser has refused to submit. Its own bubble is dropped and the message kept,
     * because the bubble would be pointing at the `<select>` - which is transparent,
     * `aria-hidden`, and about to take focus away from the field the reader has to fill in.
     *
     * The text is the browser's own `validationMessage`, so it arrives already translated
     * into the reader's language and says what the platform would have said.
     */
    onInvalid(e) {
      e.preventDefault();
      this.error.textContent = this.select.validationMessage;
      this.error.hidden = false;
      this.input.setAttribute("aria-invalid", "true");
      this.input.setAttribute("aria-describedby", [this.describedBy, this.error.id].filter(Boolean).join(" "));
      const form = this.select.form;
      const first = form && form.querySelector(":is(input, select, textarea, fieldset):invalid");
      if (!first || first === this.select) this.input.focus();
    }
    clearError() {
      this.error.hidden = true;
      this.error.textContent = "";
      this.input.removeAttribute("aria-invalid");
      if (this.describedBy) this.input.setAttribute("aria-describedby", this.describedBy);
      else this.input.removeAttribute("aria-describedby");
    }
    /** Hide the options the query does not answer, and the groups that are left holding
     * none of them. */
    filter() {
      let shown = 0;
      for (const pair of this.pairs) {
        const hit = matchesSearch(pair.option.text, this.query);
        pair.item.hidden = !hit;
        if (hit) shown++;
      }
      for (const group of this.list.querySelectorAll(".combobox-elemental-group")) {
        group.hidden = !group.querySelector('[role="option"]:not([hidden])');
      }
      this.empty.textContent = this.emptyText;
      this.empty.hidden = shown > 0;
    }
    /** The options an arrow key can reach: on screen, and not disabled. */
    navigable() {
      return this.pairs.filter((pair) => !pair.item.hidden && !pair.option.disabled);
    }
    /** Where the popup's own cursor is - `aria-activedescendant`, read back as an index
     * into the list the arrows walk. */
    activeIndex() {
      const id = this.input.getAttribute("aria-activedescendant");
      return id ? this.navigable().findIndex((pair) => pair.item.id === id) : -1;
    }
    /**
     * Move the popup's cursor. Focus itself never moves - it stays in the field, which is
     * what `aria-activedescendant` is for and what lets typing carry on narrowing the list
     * while an option is "focused".
     */
    setActive(index) {
      for (const pair2 of this.pairs) pair2.item.removeAttribute("data-active");
      const pair = this.navigable()[index];
      if (!pair) {
        this.input.removeAttribute("aria-activedescendant");
        return;
      }
      pair.item.setAttribute("data-active", "");
      this.input.setAttribute("aria-activedescendant", pair.item.id);
      pair.item.scrollIntoView({ block: "nearest" });
    }
    /**
     * Point the popup at whichever side of the field it fits on, and write that on it for
     * the stylesheet to act on - the measuring is the element's, the positioning is CSS's.
     */
    place() {
      if (!this.open) return;
      const up = flipsUp(this.field.getBoundingClientRect(), this.list.offsetHeight, window.innerHeight);
      this.list.setAttribute("data-side", up ? "block-start" : "block-end");
      this.list.scrollIntoView({ block: "nearest" });
    }
    /**
     * `open` is the single source of truth for the popup, so a click, a key and a script
     * setting the attribute all land here.
     */
    attributeChangedCallback(name, previous, current) {
      if (!this.initialized || previous === current) return;
      if (name === "open") this.applyOpen();
      else {
        this.filter();
        this.sync();
      }
    }
    /** Show or hide the popup, and put the cursor somewhere sensible inside it. */
    applyOpen() {
      const open = this.open;
      this.input.setAttribute("aria-expanded", open ? "true" : "false");
      this.list.hidden = !open;
      if (!open) {
        this.setActive(-1);
        this.list.removeAttribute("data-side");
        return;
      }
      this.place();
      const selected = this.navigable().findIndex((pair) => pair.option.selected);
      this.setActive(selected < 0 ? 0 : selected);
    }
    // ---- editing ----
    /** Choose, or in a multiple select un-choose, one option. */
    pick(pair) {
      if (!pair || pair.option.disabled || this.disabled) return;
      if (this.multiple) {
        pair.option.selected = !pair.option.selected;
        this.query = "";
        this.input.value = "";
        this.filter();
        this.sync();
        this.emit();
        this.place();
        this.setActive(this.navigable().indexOf(pair));
      } else {
        pair.option.selected = true;
        this.query = "";
        this.open = false;
        this.filter();
        this.sync();
        this.emit();
      }
      this.input.focus();
    }
    /** Drop the `index`th selection, and put focus somewhere that still exists. */
    removeAt(index) {
      if (this.disabled) return;
      const selected = Array.from(this.select.selectedOptions);
      const option = selected[index];
      if (!option || option.disabled) return;
      option.selected = false;
      this.sync();
      this.emit();
      const to = focusAfterRemoval(selected.length, index);
      const buttons = this.chips.querySelectorAll(".combobox-elemental-chip-remove");
      if (to >= 0 && buttons[to]) buttons[to].focus();
      else this.input.focus();
    }
    /**
     * Tell the page, in the events it is already listening for. The `<select>` is the
     * control, so `input` and `change` fire on it and in that order, exactly as they do
     * when a reader uses a native one - which is why this element has no event of its own.
     */
    emit() {
      this.emitting = true;
      this.select.dispatchEvent(new Event("input", { bubbles: true }));
      this.select.dispatchEvent(new Event("change", { bubbles: true }));
      this.emitting = false;
    }
    // ---- input ----
    onSelectChange() {
      if (!this.emitting) this.sync();
    }
    /** A form is only put back to its defaults after the `reset` event has been
     * dispatched, so the options are read on the next task rather than in the handler. */
    onReset() {
      setTimeout(() => {
        this.query = "";
        this.open = false;
        this.filter();
        this.sync();
      });
    }
    onInput() {
      this.query = this.input.value;
      this.filter();
      if (!this.open) this.open = true;
      else this.place();
      this.setActive(0);
    }
    /**
     * A pointer press inside the popup would blur the field before the click landed, and a
     * combobox whose field loses focus is one whose popup has just closed. The press is
     * cancelled instead; the click that follows still arrives.
     */
    onPointerDown(e) {
      if (this.list.contains(e.target)) e.preventDefault();
    }
    /**
     * Pointing at an option moves the popup's cursor onto it, so the mouse and the arrow
     * keys drive the same one thing. Without this the pointer lights up one option while
     * `aria-activedescendant` sits on another, and two options look chosen at once - with
     * Enter belonging to the one the reader is not pointing at.
     */
    onPointerOver(e) {
      const item = e.target.closest && e.target.closest('[role="option"]');
      if (!item || !this.list.contains(item)) return;
      const index = this.navigable().findIndex((pair) => pair.item === item);
      if (index >= 0) this.setActive(index);
    }
    onClick(e) {
      if (this.disabled) return;
      const remove = e.target.closest(".combobox-elemental-chip-remove");
      if (remove) {
        const buttons = Array.from(this.chips.querySelectorAll(".combobox-elemental-chip-remove"));
        this.removeAt(buttons.indexOf(remove));
        return;
      }
      const item = e.target.closest('[role="option"]');
      if (item) {
        this.pick(this.pairs.find((pair) => pair.item === item));
        return;
      }
      if (!this.field.contains(e.target)) return;
      this.open = this.indicator && this.indicator.contains(e.target) ? !this.open : true;
      this.input.focus();
    }
    onKeyDown(e) {
      if (this.disabled || e.target !== this.input) return;
      const key = e.key;
      if (key === "Escape") {
        if (!this.open) return;
        e.preventDefault();
        this.query = "";
        this.open = false;
        this.filter();
        this.sync();
        return;
      }
      if (key === "Tab") {
        if (this.open) this.open = false;
        this.query = "";
        this.filter();
        this.sync();
        return;
      }
      if (key === "Enter") {
        if (!this.open) return;
        e.preventDefault();
        this.pick(this.navigable()[this.activeIndex()]);
        return;
      }
      if (key === "Backspace" && this.multiple && !this.input.value) {
        const count = this.select.selectedOptions.length;
        if (!count) return;
        e.preventDefault();
        this.removeAt(count - 1);
        return;
      }
      if (e.altKey && (key === "ArrowDown" || key === "ArrowUp")) {
        e.preventDefault();
        this.open = key === "ArrowDown";
        return;
      }
      const items = this.navigable();
      const to = nextIndex(this.activeIndex(), key, items.length);
      if (to === null) return;
      e.preventDefault();
      if (!this.open) {
        this.open = true;
        return;
      }
      this.setActive(to);
    }
    onFocusOut(e) {
      if (e.relatedTarget && this.contains(e.relatedTarget)) return;
      this.query = "";
      this.open = false;
      this.filter();
      this.sync();
    }
    onDocumentClick(e) {
      if (this.contains(e.target) || !this.open) return;
      this.query = "";
      this.open = false;
      this.filter();
      this.sync();
    }
  };
  define("combobox-elemental", ComboboxElemental);
})();
//# sourceMappingURL=combobox.js.map
