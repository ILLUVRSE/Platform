export class Sfx {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

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

    playMove() {
        this.playTone(300, 'triangle', 0.1, 0.05);
    }

    playSwap() {
        this.playTone(400, 'sine', 0.1, 0.05);
    }

    playEat() {
        this.playTone(600, 'square', 0.15, 0.05);
        setTimeout(() => this.playTone(800, 'square', 0.15, 0.05), 50);
    }

    playDie() {
        this.playTone(150, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.5, 0.2), 200);
    }

    playInvalid() {
        this.playTone(150, 'sawtooth', 0.1, 0.1);
    }
}
