// main.js
import { Engine } from './engine.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { sfx } from './sfx.js';
import { bridge } from './bridge.js';

const canvas = document.getElementById('gameCanvas');
const engine = new Engine();
const renderer = new Renderer(canvas, engine);
const input = new Input(canvas);

// Config
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    engine.update(dt);
    renderer.draw();

    requestAnimationFrame(gameLoop);
}

// Init
function init() {
    renderer.resize();

    // Parse seed from URL
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed') || new Date().toISOString().slice(0, 10); // Daily seed default

    engine.init(seed);
    bridge.init();

    // Input wiring
    input.on('move', (dir) => engine.moveCurrent(dir));
    input.on('drop', () => engine.drop());
    input.on('gravity', (dir) => engine.changeGravity(dir));
    input.on('gravityCycle', (dir) => engine.cycleGravity(dir));
    input.on('click', (pos) => {
        // Resume Audio Context
        sfx.ensureContext();

        // Simple touch controls for mobile
        // If click in top half, rotate gravity?
        // If click in bottom half, drop?
        // Let's implement quadrants or buttons if UI was complex
        // For MVP, click anywhere to drop?

        // Let's rely on on-screen buttons handled by HTML/CSS overlay if we had them
        // But we don't.
        // Let's implement basic zones logic for touch
        const bounds = renderer.getBounds();
        if (pos.y < bounds.gridY) {
            // Top area -> Gravity toggle
            engine.cycleGravity(1);
        } else {
            // Grid area -> Drop
            // Maybe left/right side of grid for move?
            if (pos.x < bounds.width * 0.3) engine.moveCurrent(-1);
            else if (pos.x > bounds.width * 0.7) engine.moveCurrent(1);
            else engine.drop();
        }
    });

    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => renderer.resize());
init();
