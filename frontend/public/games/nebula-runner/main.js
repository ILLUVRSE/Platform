import { GridEngine } from './gridEngine.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Bridge } from './bridge.js';
import { UI } from './ui.js';
import { getDailySeed } from './utils.js';
import { AudioHandler } from './audio.js';

// Parse params
const params = new URLSearchParams(window.location.search);
const seed = params.get('seed') || getDailySeed();

const bridge = new Bridge('nebula-runner');
const ui = new UI('ui-layer');
const input = new InputHandler();
const audio = new AudioHandler();
const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);

let engine;
let lastTime = 0;
let tickAccumulator = 0;
let gameActive = false;
let startTime = 0;

function init() {
    bridge.sendReady(canvas.width, canvas.height);
    startGame();
    requestAnimationFrame(loop);
}

function startGame() {
    engine = new GridEngine(seed);
    input.reset();
    gameActive = true;
    tickAccumulator = 0;
    lastTime = performance.now();
    startTime = Date.now();
    ui.gameOverEl.style.display = 'none';
    ui.updateHUD(0, 0, seed);
}

function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (gameActive) {
        tickAccumulator += dt;

        if (tickAccumulator >= engine.tileAdvanceMs) {
            // Tick
            const move = input.popMove();
            const res = engine.advanceColumn(move);

            if (res.events) {
                res.events.forEach(e => {
                    if (e === 'move') audio.play('move');
                    if (e === 'pickup') audio.play('pickup');
                    if (e === 'teleport') audio.play('pickup');
                    if (e === 'shield_break') audio.play('warning');
                });
            }

            if (res && res.gameOver) {
                audio.play('crash');
                gameOver(res.crashType);
            }

            tickAccumulator -= engine.tileAdvanceMs;

            ui.updateHUD(engine.score, engine.distance, seed);
        }
    }

    // Render
    const progress = Math.min(1, Math.max(0, tickAccumulator / engine.tileAdvanceMs));
    renderer.render(engine, dt, progress, input.queuedMove);

    requestAnimationFrame(loop);
}

function gameOver(crashType) {
    gameActive = false;
    const durationMs = Date.now() - startTime;

    bridge.sendScore(engine.score, seed, durationMs, { crashType, distance: engine.distance });

    ui.showGameOver(engine.score, engine.distance, seed, () => {
        startGame();
    });
}

init();
