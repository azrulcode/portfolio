/* ============================================================
   typewriter.js — the "typing then deleting" text effect

   This is the blinking line under the AZRUL banner. It types a
   phrase out one letter at a time, pauses, deletes it, then moves
   to the next phrase — forever.

   JS CONCEPTS USED HERE:
   - class                → a reusable blueprint for creating objects
                            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
   - this                 → "the object I belong to"
                            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
   - setTimeout()         → run a function once, after N milliseconds
                            https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
   - String.slice()       → take part of a string (here: the first N letters)
                            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice
   - the modulo operator % → used to "wrap around" back to phrase 0
                            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder

   HOW THE TIMING WORKS (important idea):
   Instead of one big loop, we call `tick()` once, and at the END of
   each tick we schedule the NEXT tick with setTimeout. So the effect
   "drives itself forward" one frame at a time. This keeps the page
   responsive — the browser is free between ticks.
   ============================================================ */

export class Typewriter {
  // `constructor` runs when you write `new Typewriter(...)`.
  // It just stores the inputs and sets up starting values.
  constructor(element, phrases) {
    this.element = element;       // the <span> on the page we type into
    this.phrases = phrases;       // the array of strings to cycle through

    this.phraseIndex = 0;         // which phrase we're on (0 = the first)
    this.charIndex = 0;           // how many letters are currently shown
    this.isDeleting = false;      // are we typing forward, or erasing?
    this.pauseTicks = 0;          // a countdown used to "hold" a finished phrase

    // Speeds, in milliseconds. Smaller = faster.
    this.typeSpeed = 85;          // delay between typing each letter
    this.deleteSpeed = 42;        // delay between deleting each letter
    this.holdTicks = 55;          // how long to wait once a phrase is fully typed
  }

  // Call this once to kick everything off.
  start() {
    // Wait 0.8s before the first letter, so the page settles first.
    setTimeout(() => this.tick(), 800);
  }

  // One "tick" = decide what the text should look like right now,
  // update the page, then schedule the next tick.
  tick() {
    const currentPhrase = this.phrases[this.phraseIndex];

    // 1) If we're in a "hold" pause, just count down and come back later.
    if (this.pauseTicks > 0) {
      this.pauseTicks = this.pauseTicks - 1;
      setTimeout(() => this.tick(), this.typeSpeed);
      return; // stop here; nothing else to do this tick
    }

    if (this.isDeleting) {
      // 2) DELETING: show one fewer letter than before.
      this.charIndex = this.charIndex - 1;
      this.element.textContent = currentPhrase.slice(0, this.charIndex);

      // Once nothing is left, switch to the next phrase and start typing again.
      if (this.charIndex === 0) {
        this.isDeleting = false;
        // `% this.phrases.length` makes the index wrap back to 0 at the end,
        // so the phrases loop forever.
        this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
        setTimeout(() => this.tick(), 500); // small gap before the next word
        return;
      }

      setTimeout(() => this.tick(), this.deleteSpeed);
    } else {
      // 3) TYPING: show one more letter than before.
      this.charIndex = this.charIndex + 1;
      this.element.textContent = currentPhrase.slice(0, this.charIndex);

      // Reached the end of the phrase? Pause, then begin deleting.
      if (this.charIndex === currentPhrase.length) {
        this.isDeleting = true;
        this.pauseTicks = this.holdTicks;
      }

      setTimeout(() => this.tick(), this.typeSpeed);
    }
  }
}
