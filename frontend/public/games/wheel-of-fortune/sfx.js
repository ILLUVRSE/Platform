// Procedural audio context
let audioCtx = null;
let masterGain = null;

export function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Default volume
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type, duration, startTime = 0, vol = 1.0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);

  gain.gain.setValueAtTime(vol, audioCtx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(audioCtx.currentTime + startTime);
  osc.stop(audioCtx.currentTime + startTime + duration);
}

export function playSpinClick() {
  // Short click for wheel passing a peg
  if (!audioCtx) return;
  // High pitched noise burst
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

export function playCorrectLetter() {
  // Ding
  playTone(880, 'sine', 0.3, 0, 0.5);
  playTone(1760, 'sine', 0.5, 0.1, 0.3);
}

export function playWrongLetter() {
  // Buzzer
  playTone(150, 'sawtooth', 0.3, 0, 0.5);
  playTone(140, 'sawtooth', 0.3, 0.05, 0.5);
}

export function playBankrupt() {
  // Sad slide
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 1.0);
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.0);
}

export function playWinRound() {
  if (!audioCtx) return;
  // Fanfare
  playTone(523.25, 'square', 0.2, 0); // C5
  playTone(659.25, 'square', 0.2, 0.1); // E5
  playTone(783.99, 'square', 0.2, 0.2); // G5
  playTone(1046.50, 'square', 0.6, 0.3); // C6
}

export function playSolveOpen() {
    playTone(600, 'sine', 0.1);
}
