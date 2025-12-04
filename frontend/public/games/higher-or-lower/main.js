import { mulberry32, getDailySeed, cyrb128 } from './utils.js';
import { GameEngine } from './engine.js';
import { Renderer } from './renderer.js';
import { SoundManager } from './sfx.js';
import { sendScore } from './bridge.js';

// Setup
const canvas = document.getElementById('gameCanvas');
const sfx = new SoundManager();
const renderer = new Renderer(canvas);

// Seed Logic
const urlParams = new URLSearchParams(window.location.search);
let mode = urlParams.get('mode') || 'daily';
let seedStr = urlParams.get('seed') || getDailySeed();
if (mode === 'daily') seedStr = getDailySeed();
let seedVal = cyrb128(seedStr);

let engine = new GameEngine(seedStr, mode);

// UI Elements
const btnHigher = document.getElementById('btn-higher');
const btnLower = document.getElementById('btn-lower');
const btnDouble = document.getElementById('btn-double');
const btnHint = document.getElementById('btn-hint');
const hintText = document.getElementById('hint-text');

function initGame() {
    const rng = mulberry32(seedVal);
    engine = new GameEngine(seedStr, mode);
    engine.init(rng);
    resize();
    render();
    updateUI();
    hintText.innerText = '';
}

function handleGuess(choice) {
    sfx.ensureContext();
    const result = engine.guess(choice);
    if (result.result === 'correct') {
        sfx.playWin();
        sfx.playFlip();
    } else if (result.result === 'saved') {
        sfx.playTone(200, 'square', 0.1);
        hintText.innerText = "Shield Saved You!";
        setTimeout(() => hintText.innerText = "", 1500);
    } else if (result.result === 'game_over') {
        sfx.playLoss();
        sendScore(engine.score, engine);
    }
    render();
    updateUI();
}

function updateUI() {
    btnDouble.disabled = engine.gameOver || engine.streak < 1 || engine.doubleOrNothingActive;
    btnHint.disabled = engine.gameOver || engine.hintUsed;
    btnHigher.disabled = engine.gameOver;
    btnLower.disabled = engine.gameOver;

    if (engine.doubleOrNothingActive) {
        btnDouble.classList.add('active');
    } else {
        btnDouble.classList.remove('active');
    }
}

// Bindings
btnHigher.onclick = () => handleGuess('higher');
btnLower.onclick = () => handleGuess('lower');

btnDouble.onclick = () => {
    sfx.ensureContext();
    if (engine.activatePowerup('double')) {
        updateUI();
    }
};

btnHint.onclick = () => {
    sfx.ensureContext();
    const info = engine.activatePowerup('hint');
    if (info) {
        hintText.innerText = `Hint: ${info.range}, ${info.color}`;
        updateUI();
    }
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') handleGuess('higher');
    if (e.code === 'ArrowDown') handleGuess('lower');
    if (e.code === 'KeyD') btnDouble.click();
    if (e.code === 'KeyH') btnHint.click();
    if (engine.gameOver && (e.code === 'Enter' || e.code === 'Space')) {
        // Restart (simple reload or re-init for random mode)
        // For Daily, restart means retry same deck? Usually Daily is one-shot, but arcade is infinite retries.
        // Let's just re-init with same seed for now to allow practice.
        initGame();
    }
});

// Canvas tap to restart
canvas.addEventListener('click', () => {
    if (engine.gameOver) initGame();
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.resize();
    render();
}
window.addEventListener('resize', resize);

function render() {
    renderer.render(engine);
}

// Boot
initGame();
