// Procedural Audio
const AudioContext = window.AudioContext || window.webkitAudioContext;

export class SoundManager {
  constructor() {
    this.ctx = new AudioContext();
    this.enabled = true;
  }

  ensureContext() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, vol = 0.1) {
    if (!this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.playTone(400, 'sine', 0.1, 0.1);
  }

  playFlip() {
    // White noise burst for card flip
    if (!this.enabled) return;
    const bufferSize = this.ctx.sampleRate * 0.1; // 0.1s
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playWin() {
    this.playTone(600, 'triangle', 0.1, 0.1);
    setTimeout(() => this.playTone(800, 'triangle', 0.2, 0.1), 100);
  }

  playLoss() {
    this.playTone(300, 'sawtooth', 0.3, 0.2);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.4, 0.2), 200);
  }
}
