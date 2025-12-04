import { Engine } from './engine.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Bridge } from './bridge.js';
import { Sfx } from './sfx.js';

window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    const startOverlay = document.getElementById('startOverlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const finalScoreSpan = document.getElementById('finalScore');
    const scoreValSpan = document.getElementById('scoreVal');
    const restartBtn = document.getElementById('restartBtn');
    const startBtn = document.getElementById('startBtn');

    // Dependencies
    const bridge = new Bridge();
    const sfx = new Sfx();
    let engine = null;
    let renderer = null;
    let input = null;

    let lastTime = 0;
    let accumulator = 0;
    let gameActive = false;
    let animationId = null;

    // Initialize logic
    function initGame() {
        const seed = Date.now();
        engine = new Engine(seed, onGameOver, sfx);

        if (!renderer) {
            renderer = new Renderer(canvas, engine);
            input = new Input(canvas, engine, renderer);
        } else {
            renderer.engine = engine;
            input.engine = engine;
            renderer.resize();
        }

        // Notify parent
        bridge.sendReady(engine.width, engine.height);

        // UI
        startOverlay.style.display = 'none';
        gameOverOverlay.style.display = 'none';
        scoreValSpan.innerText = '0';

        gameActive = true;
        lastTime = performance.now();
        accumulator = 0;

        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(loop);
    }

    function onGameOver(score) {
        gameActive = false;
        gameOverOverlay.style.display = 'flex';
        finalScoreSpan.innerText = score;

        // Send score
        bridge.sendScore(score, engine.seed, 0 /* duration not tracked well yet */);
    }

    function loop(now) {
        if (!gameActive) return;

        const dt = now - lastTime;
        lastTime = now;
        accumulator += dt;

        // Tick Loop
        while (accumulator >= engine.tickRate) {
            engine.tick();
            accumulator -= engine.tickRate;

            // Update UI Score
            scoreValSpan.innerText = engine.score;
        }

        // Render (Interpolation? No, strict grid for now)
        renderer.render();

        animationId = requestAnimationFrame(loop);
    }

    // Input Listeners
    startBtn.addEventListener('click', () => {
        // Unlock Audio Context
        sfx.ctx.resume();
        initGame();
    });

    restartBtn.addEventListener('click', () => {
        initGame();
    });

    // Initial Render
    // Just to show something behind the menu
    // Mock engine for renderer
    const tempEngine = new Engine(Date.now(), null, null);
    renderer = new Renderer(canvas, tempEngine);
    renderer.render();
};
