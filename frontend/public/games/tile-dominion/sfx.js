// Procedural Audio Context
let ctx = null;
let masterGain = null;

export function initSFX() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.3; // Low volume default
    masterGain.connect(ctx.destination);
  } catch (e) {
    console.warn('WebAudio not supported');
  }
}

function playTone(freq, type, duration, vol=1.0) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playPlace() {
  // High blip
  playTone(600, 'sine', 0.1, 0.5);
  setTimeout(() => playTone(800, 'sine', 0.1, 0.5), 50);
}

export function playFlip() {
  // Crunchy square
  playTone(200 + Math.random()*100, 'square', 0.1, 0.2);
}

export function playEmit() {
  // Low pulse
  playTone(150, 'triangle', 0.3, 0.3);
}

export function playError() {
  playTone(100, 'sawtooth', 0.2, 0.4);
}

export function playWin() {
  // Arpeggio
  [0, 100, 200, 300, 400].forEach((delay, i) => {
    setTimeout(() => playTone(400 + i*100, 'sine', 0.3, 0.4), delay);
  });
}
