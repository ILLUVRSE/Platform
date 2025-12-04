// main.js
import { CircuitEngine, TILE_TYPES, WIRE_VARIANTS } from './engine.js';
import { CircuitRenderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Bridge } from './bridge.js';
import { SoundManager } from './sfx.js';

const canvas = document.getElementById('gameCanvas');
const engine = new CircuitEngine();
const renderer = new CircuitRenderer(canvas, engine);
const input = new InputHandler(canvas, engine, renderer);
const bridge = new Bridge();
const sfx = new SoundManager();

// Game Loop
let lastTime = 0;
const TICK_RATE = 200; // ms
let tickAccumulator = 0;

function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    tickAccumulator += dt;
    while (tickAccumulator >= TICK_RATE) {
        engine.tick();
        tickAccumulator -= TICK_RATE;
    }

    renderer.draw();

    if (engine.gameOver) {
        // Draw Game Over Overlay
        const ctx = renderer.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("CIRCUIT COMPLETE", renderer.canvas.width/2, renderer.canvas.height/2 - 20);
        ctx.font = '20px monospace';
        ctx.fillText(`Final Score: ${engine.score}`, renderer.canvas.width/2, renderer.canvas.height/2 + 20);

        // Submit once
        if (!engine.scoreSubmitted) {
            engine.scoreSubmitted = true;
            bridge.submitScore(engine.score);
        }
        return; // Stop loop
    }

    requestAnimationFrame(loop);
}

// UI Binding
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Clear active
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const type = e.target.dataset.type;
        const subtype = e.target.dataset.subtype;

        if (type === 'wire') {
            input.selectedType = TILE_TYPES.WIRE;
            input.selectedSubtype = subtype;
        } else if (type === 'breaker') {
            input.selectedType = TILE_TYPES.BREAKER;
        } else if (type === 'switch') {
            input.selectedType = TILE_TYPES.SWITCH;
        }
    });
});

bridge.notifyReady();
requestAnimationFrame(loop);
