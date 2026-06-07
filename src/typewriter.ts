export class Typewriter {
  private el: HTMLElement;
  private phrases: string[];
  private phraseIndex = 0;
  private charIndex = 0;
  private deleting = false;
  private pauseCount = 0;
  private readonly PAUSE = 55;
  private readonly TYPE_MS = 85;
  private readonly DELETE_MS = 42;

  constructor(el: HTMLElement, phrases: string[]) {
    this.el = el;
    this.phrases = phrases;
  }

  start(): void {
    setTimeout(() => this.tick(), 800);
  }

  private tick(): void {
    const current = this.phrases[this.phraseIndex];

    if (this.pauseCount > 0) {
      this.pauseCount--;
      setTimeout(() => this.tick(), this.TYPE_MS);
      return;
    }

    if (this.deleting) {
      this.charIndex--;
      this.el.textContent = current.slice(0, this.charIndex);

      if (this.charIndex === 0) {
        this.deleting = false;
        this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
        setTimeout(() => this.tick(), 500);
        return;
      }

      setTimeout(() => this.tick(), this.DELETE_MS);
    } else {
      this.charIndex++;
      this.el.textContent = current.slice(0, this.charIndex);

      if (this.charIndex === current.length) {
        this.deleting = true;
        this.pauseCount = this.PAUSE;
      }

      setTimeout(() => this.tick(), this.TYPE_MS);
    }
  }
}
