// sfx.js
export class Sfx {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // safe volume
    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playOsc(type, freq, duration, slide = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide !== 0) {
        osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playDrop() {
    this.playOsc('triangle', 300, 0.1, -100);
  }

  playSlide() {
    this.playOsc('sine', 150, 0.05, -50);
  }

  playGravity() {
    this.playOsc('square', 200, 0.3, 200);
  }

  playGoal() {
    this.playOsc('sine', 440, 0.1);
    setTimeout(() => this.playOsc('sine', 660, 0.2), 100);
  }

  playCombo(chain) {
    const base = 440;
    const notes = [0, 4, 7, 12, 14, 16]; // Major chord-ish
    const note = base * Math.pow(2, (notes[(chain - 1) % notes.length]) / 12);
    this.playOsc('triangle', note, 0.3);
  }
}

export const sfx = new Sfx();
