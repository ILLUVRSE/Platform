import { WheelEngine } from './engine.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { mulberry32, getDailySeed, shuffle } from './utils.js';
import * as SFX from './sfx.js';
import './bridge.js';

let engine, renderer, input;
let lastTime = 0;
let puzzles = [];

async function init() {
    // Load Puzzles
    try {
        const resp = await fetch('puzzles/puzzles.json');
        const data = await resp.json();
        puzzles = data;
    } catch (e) {
        console.error("Failed to load puzzles", e);
        puzzles = [{ category: 'ERROR', text: 'RELOAD GAME' }];
    }

    // Determine Mode/Seed
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'daily'; // 'daily' or 'arcade'

    let seedVal;
    if (mode === 'daily') {
        seedVal = getDailySeed();
    } else {
        seedVal = Date.now();
    }

    // Shuffle puzzles deterministically
    const rng = mulberry32(seedVal);
    shuffle(puzzles, rng);

    // Setup Engine
    engine = new WheelEngine(puzzles, rng);

    // Setup Renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new Renderer(canvas, engine);
    renderer.resize();
    window.addEventListener('resize', () => renderer.resize());

    // Setup Input
    input = new InputHandler(engine, renderer);

    // Start Loop
    requestAnimationFrame(loop);
}

function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    engine.update();
    input.update();
    renderer.draw();

    // Check game over
    if (engine.state === 'GAME_OVER') {
        // Send Score
        // Debounce or single send
        if (!engine.scoreSent) {
            engine.scoreSent = true;
            window.parent.postMessage({
                type: 'arcade-score',
                score: engine.score
            }, '*');
        }
    }

    requestAnimationFrame(loop);
}

window.onload = init;
