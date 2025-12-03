// Entry point
import { GridEngine } from './engine.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Bridge } from './utils.js'; // Bridge is inside utils.js
import { getDailySeed } from './utils.js';
import { AudioHandler } from './audio.js';

const params = new URLSearchParams(window.location.search);
const seed = params.get('seed') || getDailySeed();

const canvas = document.getElementById('game-canvas');
const uiLayer = document.getElementById('ui-layer');

const bridge = new Bridge('bullet-hive');
const audio = new AudioHandler();
const input = new InputHandler();
const renderer = new Renderer(canvas);
let engine = null;

let lastTime = 0;
let tickAccumulator = 0;
let gameActive = false;
let startTime = 0;

function init() {
    bridge.sendReady(canvas.width, canvas.height);
    bridge.requestTheme(); // Request theme from parent

    // Wait a brief moment for theme or just start
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

    // Clear UI
    uiLayer.innerHTML = '';
}

function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (gameActive && engine) {
        tickAccumulator += dt;
        const logicStep = 60; // 60ms tick

        while (tickAccumulator >= logicStep) {
            // Process input
            const move = input.popMove();

            // Step engine
            const events = engine.update(move);

            // Handle audio events
            if (events.length > 0) {
                events.forEach(e => {
                    switch(e.type) {
                        case 'spawn': audio.playSpawn(); break;
                        case 'bounce': audio.playReflect(); break;
                        case 'hit': audio.playHit(); break;
                        case 'pickup': audio.playPickup(); break;
                        case 'gameover':
                            audio.playHit();
                            gameOver(e.meta);
                            break;
                    }
                });
            }

            tickAccumulator -= logicStep;
        }
    }

    // Render
    const progress = Math.min(1, Math.max(0, tickAccumulator / 60));
    renderer.render(engine, progress);

    requestAnimationFrame(loop);
}

function gameOver(meta) {
    gameActive = false;
    const durationMs = Date.now() - startTime;
    const score = engine ? engine.score : 0;

    bridge.sendScore(score, seed, durationMs, meta);

    // Simple Game Over UI
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;background:rgba(0,0,0,0.8);padding:20px;text-align:center;border:2px solid #009688;';
    div.innerHTML = `
        <h2 style="margin:0 0 10px 0;color:#009688">GAME OVER</h2>
        <p>Score: ${score}</p>
        <p>Time: ${(durationMs/1000).toFixed(1)}s</p>
        <button id="retry-btn" style="background:#009688;color:white;border:none;padding:10px 20px;margin-top:10px;cursor:pointer;font-size:16px;">RETRY</button>
    `;
    uiLayer.appendChild(div);

    document.getElementById('retry-btn').onclick = () => {
        startGame();
    };
}

init();
