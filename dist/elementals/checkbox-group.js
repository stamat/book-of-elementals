/* book-of-elementals v1.0.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/checkbox-group/index.js
  function classify(states) {
    if (states.every((on) => on)) return states.length ? "all" : "none";
    return states.some((on) => on) ? "some" : "none";
  }
  function cycle(states, memory) {
    const now = classify(states);
    if (now === "some") return states.map(() => true);
    if (now === "all") return states.map(() => false);
    const restorable = memory && memory.length === states.length && classify(memory) === "some";
    return restorable ? memory.slice() : states.map(() => true);
  }
  var CheckboxGroupElemental = class extends ElementBase {
    /**
     * The "select all". The first checkbox in the element, in document order, which is where
     * it has to be for the reader too - a heading for a list comes before the list.
     */
    get parent() {
      return this.boxes()[0] || null;
    }
    /**
     * The checkboxes the parent stands for: every one below it, minus a nested group's own.
     *
     * Not `children`, which is `Element`'s own and means every child node that is an
     * element. Shadowing it would leave this element lying to any code that walks the DOM
     * generically - including the browser's own devtools.
     */
    get checkboxes() {
      return this.boxes().slice(1);
    }
    /** Every checkbox this element owns. A nested group keeps its own, parent included. */
    boxes() {
      return Array.from(this.querySelectorAll('input[type="checkbox"]')).filter((box) => box.closest("checkbox-group-elemental") === this);
    }
    /**
     * The checkboxes the parent can actually move, which is the set it speaks for.
     *
     * A disabled one is not in it, and that decides both halves at once. It cannot be
     * counted, because a group holding one disabled and unticked box could never reach "all"
     * - every press would compute "some", set everything it is allowed to, change nothing,
     * and the cycle would be stuck on the step it was already on. And it cannot be moved,
     * because a checkbox the reader could not have clicked is not one the parent gets to
     * click for them. So the parent's tick means "everything selectable is selected", which
     * is the only reading under which pressing it does what it says.
     */
    movable() {
      return this.checkboxes.filter((box) => !box.disabled);
    }
    /** `all`, `some` or `none` - the same word the element writes onto itself. */
    get state() {
      return classify(this.movable().map((box) => box.checked));
    }
    connectedCallback() {
      if (this.initialized) return;
      if (this.checkboxes.length === 0) return;
      this.initialized = true;
      this.onClick = this.onClick.bind(this);
      this.onChange = this.onChange.bind(this);
      this.onReset = this.onReset.bind(this);
      this.apply = this.apply.bind(this);
      this.parentWasHidden = this.parent.hasAttribute("hidden");
      if (this.parentWasHidden) this.parent.hidden = false;
      this.addEventListener("click", this.onClick);
      this.addEventListener("change", this.onChange);
      this.form = this.parent && this.parent.form;
      if (this.form) this.form.addEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.addEventListener("pageshow", this.apply);
      this.apply();
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      this.removeEventListener("click", this.onClick);
      this.removeEventListener("change", this.onChange);
      if (this.form) this.form.removeEventListener("reset", this.onReset);
      if (typeof window !== "undefined") window.removeEventListener("pageshow", this.apply);
      const parent = this.parent;
      if (parent) {
        parent.indeterminate = false;
        if (this.parentWasHidden) parent.hidden = true;
      }
      delete this.dataset.state;
      this.form = null;
      this.initialized = false;
    }
    /**
     * Read the children and put what they say onto the parent. Public because that is the
     * one thing no event announces: add or remove a checkbox and this is the call that
     * catches up.
     *
     * The memory is taken here rather than at the click, so a combination the reader built
     * by hand - ticking two of twenty themselves - is the one that comes back. Any way of
     * arriving at mixed is the group being mixed.
     */
    apply() {
      const parent = this.parent;
      if (!parent) return;
      const state = this.state;
      if (state === "some") this.memory = this.movable().map((box) => box.checked);
      parent.checked = state === "all";
      parent.indeterminate = state === "some";
      this.dataset.state = state;
    }
    /**
     * A press of the parent. `click` and not `keydown`, because `Space` on a checkbox *is* a
     * click - there is no keyboard here that the platform has not already written.
     *
     * The children are the source of truth, so the cycle is read off them and not off the
     * parent, whose `checked` the browser has already flipped and whose `indeterminate` it
     * has already cleared by the time this runs. `apply` puts both back.
     */
    onClick(e) {
      const parent = this.parent;
      if (!parent || e.target !== parent || parent.disabled) return;
      const children = this.movable();
      const next = cycle(children.map((box) => box.checked), this.memory);
      this.applying = true;
      for (let i = 0; i < children.length; i++) {
        const box = children[i];
        if (box.checked === next[i]) continue;
        box.checked = next[i];
        box.dispatchEvent(new Event("input", { bubbles: true }));
        box.dispatchEvent(new Event("change", { bubbles: true }));
      }
      this.applying = false;
      this.apply();
    }
    /** A child was ticked, so the parent has something new to say. */
    onChange(e) {
      if (this.applying || e.target === this.parent) return;
      this.apply();
    }
    /** A form is only put back to its defaults once the `reset` event has been dispatched,
     * so the checkboxes are read on the next task rather than in the handler. */
    onReset() {
      setTimeout(() => {
        this.memory = null;
        this.apply();
      });
    }
  };
  define("checkbox-group-elemental", CheckboxGroupElemental);
})();
//# sourceMappingURL=checkbox-group.js.map
