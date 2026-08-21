/* book-of-elementals v1.0.0 | https://stamat.github.io/book-of-elementals/ | MIT License */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/book-of-spells/src/elements.mjs
  var ElementBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {
  };
  function define(tag, ctor) {
    if (typeof customElements === "undefined" || customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }

  // src/elementals/marquee/index.js
  var DEFAULT_SPEED = 50;
  var MAX_CLONES = 20;
  function cloneCount(trackWidth, gapWidth, containerWidth, max = MAX_CLONES) {
    if (!(trackWidth > 0) || !(containerWidth > 0)) return 0;
    const gap = gapWidth > 0 ? gapWidth : 0;
    return Math.min(max, Math.ceil((containerWidth + gap) / (trackWidth + gap)));
  }
  function cycleDuration(distance, speed) {
    if (!(distance > 0)) return 0;
    return distance / (speed > 0 ? speed : DEFAULT_SPEED);
  }
  function reducedMotion() {
    return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  var ICON = {
    play: {
      d: "M9.5 15.584V8.416a.5.5 0 0 1 .77-.42l5.576 3.583a.5.5 0 0 1 0 .842l-5.576 3.584a.5.5 0 0 1-.77-.42Z",
      box: "5.47 5.25 13.5 13.5"
    },
    stop: {
      d: "M7.75 6h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 16.25 18h-8.5A1.75 1.75 0 0 1 6 16.25v-8.5C6 6.784 6.784 6 7.75 6Z",
      box: "0 0 24 24"
    }
  };
  function icon({ d, box }) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", box);
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    svg.append(path);
    return svg;
  }
  var MarqueeElemental = class extends ElementBase {
    constructor() {
      super(...arguments);
      /** What the author wrote, captured at upgrade. Held rather than re-read, because after the
       * first lap the element's own children are mostly copies of it. */
      __publicField(this, "track", []);
    }
    /** The copies. */
    get clones() {
      return Array.from(this.querySelectorAll(":scope > [data-marquee-clone]"));
    }
    /** The pause button, when this wrote one. */
    get control() {
      return this.querySelector(":scope > .marquee-elemental-control");
    }
    /** Pixels a second. */
    get speed() {
      return Number(this.getAttribute("speed"));
    }
    set speed(value) {
      this.setAttribute("speed", value);
    }
    /** Whether it is moving. Setting it is the same as pressing the button. */
    get playing() {
      return !this.hasAttribute("data-marquee-paused");
    }
    set playing(value) {
      if (value) this.play();
      else this.pause();
    }
    connectedCallback() {
      if (this.initialized) return;
      this.track = Array.from(this.children);
      if (!this.track.length) return;
      this.initialized = true;
      this.track.forEach((node) => {
        if ((node.tagName === "UL" || node.tagName === "OL") && !node.hasAttribute("role")) {
          node.setAttribute("role", "list");
        }
      });
      if (!this.hasAttribute("no-controls")) this.addControl();
      if (reducedMotion()) this.pause();
      else this.play();
      if (typeof ResizeObserver === "function") {
        this.observer = new ResizeObserver(() => this.measure());
        this.observer.observe(this);
        this.track.forEach((node) => this.observer.observe(node));
      }
    }
    disconnectedCallback() {
      if (!this.initialized) return;
      if (this.observer) this.observer.disconnect();
      this.observer = null;
      this.initialized = false;
    }
    static get observedAttributes() {
      return ["speed"];
    }
    attributeChangedCallback(name, previous, value) {
      if (!this.initialized || previous === value) return;
      if (name === "speed") this.applyTiming();
    }
    /**
     * Write the pause button.
     *
     * Appended rather than expected in the markup, for the reason the carousel's controls are:
     * a button authored by hand is a button that does nothing until the script lands, and a
     * dead control is a worse promise than no control.
     *
     * Its name says what pressing it will do and it carries no `aria-pressed` - the APG's own
     * answer for this button, rather than both, which would have a screen reader read the two
     * against each other.
     */
    addControl() {
      if (this.control) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "marquee-elemental-control";
      button.addEventListener("click", () => {
        this.playing = !this.playing;
      });
      this.append(button);
      this.labelControl();
    }
    labelControl() {
      const button = this.control;
      if (!button) return;
      const stop = this.getAttribute("pause-text") || "Stop the moving content";
      const start = this.getAttribute("play-text") || "Start the moving content";
      button.setAttribute("aria-label", this.playing ? stop : start);
      button.replaceChildren(icon(this.playing ? ICON.stop : ICON.play));
    }
    /**
     * Measure the track against the container, and make the strip cover it.
     *
     * **Guarded on the width it last saw**, and that guard is load-bearing twice over. Rebuilding
     * the copies restarts the animation from its first frame, so doing it on a resume would put
     * a jump behind the one gesture that means hold still - and an observer that rebuilt on
     * every callback would be one whose own writes are what it hears next, which is a loop with
     * no bottom to it.
     *
     * The clones come off before the read, because the number wanted is the width of what the
     * author wrote and a strip with copies in it is the width of the last answer. It is
     * measured across the track's own boxes and **not** off the element's `scrollWidth`, which
     * is the trap here: `scrollWidth` never reports less than the box it is on, so a short
     * track in a wide container measures as the container - one copy, and a hole in the loop
     * exactly where more copies were needed. Both ends are taken by extent rather than in
     * order, because `dir="rtl"` lays the same children out the other way round.
     *
     * The gap goes into the distance rather than beside it: a lap has to land the second copy
     * exactly where the first one started, which with a gap between them is one track plus one
     * gap. It is read off the computed style, so an author's own `--marquee-elemental-gap` is
     * in the sum without this having to parse it.
     */
    measure() {
      if (!this.initialized || !this.playing) return;
      const width = this.clientWidth;
      const gap = parseFloat(getComputedStyle(this).columnGap) || 0;
      const edges = this.track.map((node) => node.getBoundingClientRect());
      const track = Math.max(...edges.map((box) => box.right)) - Math.min(...edges.map((box) => box.left));
      const distance = track + gap;
      const copies = cloneCount(track, gap, width);
      if (copies === this.copies && distance === this.distance) return;
      this.copies = copies;
      this.distance = distance;
      this.removeAttribute("data-marquee-running");
      this.removeClones();
      void this.offsetWidth;
      if (!copies) {
        this.style.removeProperty("--marquee-elemental-distance");
        this.style.removeProperty("--marquee-elemental-duration");
        return;
      }
      for (let i = 0; i < copies; i++) this.append(...this.copyTrack());
      this.applyTiming();
      this.setAttribute("data-marquee-running", "");
    }
    /** How far a lap goes and how long it takes, onto the element for the keyframes to read.
     * Split out of the measuring because `speed` changes the second number and not the first,
     * and remeasuring to answer it would rebuild the strip to say the same thing. */
    applyTiming() {
      if (!(this.distance > 0)) return;
      this.style.setProperty("--marquee-elemental-distance", this.distance + "px");
      this.style.setProperty("--marquee-elemental-duration", cycleDuration(this.distance, this.speed) + "s");
    }
    /**
     * One copy of the track.
     *
     * `inert` and `aria-hidden` are two different readers and both are owed an answer: the
     * second keeps the copies out of the accessibility tree, and the first is the one every
     * other marquee is missing - without it <kbd>Tab</kbd> walks into copies of the same links,
     * scrolling past under the focus ring. `id`s come off on the way out, because a document
     * with twenty of the same `id` is one where every `aria-labelledby` and every `#anchor`
     * resolves to whichever came first.
     */
    copyTrack() {
      return this.track.map((node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute("data-marquee-clone", "");
        clone.setAttribute("aria-hidden", "true");
        clone.inert = true;
        if (clone.id) clone.removeAttribute("id");
        clone.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"));
        return clone;
      });
    }
    removeClones() {
      this.clones.forEach((clone) => clone.remove());
    }
    /** Start moving, making the copies it takes to do it seamlessly if they are not there yet. */
    play() {
      this.removeAttribute("data-marquee-paused");
      this.measure();
      this.labelControl();
      this.dispatchEvent(new CustomEvent("marquee-toggle", { bubbles: true, detail: { playing: true } }));
    }
    /**
     * Stop.
     *
     * The copies stay where they are. Taking them out would reflow the strip back to the
     * author's one track under a reader who has just asked for the movement to stop, which is
     * a jump asked for by the one gesture that means "hold still".
     */
    pause() {
      this.setAttribute("data-marquee-paused", "");
      this.labelControl();
      this.dispatchEvent(new CustomEvent("marquee-toggle", { bubbles: true, detail: { playing: false } }));
    }
  };
  define("marquee-elemental", MarqueeElemental);
})();
//# sourceMappingURL=marquee.js.map
