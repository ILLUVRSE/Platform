import {
  initEngine, initGrid, getGrid, getBeacons, placeBeacon, updateBeacons,
  PLAYERS
} from './engine.js';
import {
  initRenderer, render, addFloatingText, addRipple, getBounds
} from './renderer.js';
import {
  initInput, popActions, getCursors, setInputBounds
} from './input.js';
import { updateBot } from './ai.js';
import { Bridge } from './bridge.js';
import { initSFX, playPlace, playFlip, playEmit, playError, playWin } from './sfx.js';
import { hashStringToInt } from './utils.js';

// Game Loop
let lastTime = 0;
const TICK_MS = 120; // 120ms physics tick (approx 8.33 ticks/sec)
let tickAccumulator = 0;
let currentTick = 0;
let isGameOver = false;

// Score
let scoreP1 = 0;
let scoreP2 = 0;

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  tickAccumulator += dt;
  while (tickAccumulator >= TICK_MS) {
    update(TICK_MS);
    tickAccumulator -= TICK_MS;
  }

  // Render uses interpolation or just latest state (simple: latest)
  // We pass dt in seconds for animations
  render(dt / 1000, getGrid(), getBeacons(), getCursors(), scoreP1, scoreP2);

  // Sync input bounds with renderer
  setInputBounds(getBounds());

  requestAnimationFrame(loop);
}

function update(dtMs) {
  if (isGameOver) return;

  currentTick++;

  // 1. Process Input
  const actions = popActions();
  for (const a of actions) {
    const res = placeBeacon(a.player, a.col, a.row, currentTick);
    if (res.success) {
      playPlace();
      handlePropagationResult(res, a.player);
    } else {
      if (a.player === PLAYERS.P1) playError(); // Only feedback for human
    }
  }

  // 2. AI (Bot) - controls P2
  updateBot(getGrid(), getBeacons(), (action) => {
    const res = placeBeacon(action.player, action.col, action.row, currentTick);
    if (res.success) {
      // AI placed
      handlePropagationResult(res, action.player);
    }
  });

  // 3. Update Beacons (emits)
  const events = updateBeacons(currentTick);
  for (const e of events) {
    if (e.type === 'emit') {
       // e.flippedCount, e.points
       if (e.flippedCount > 0) playEmit();
       if (e.points > 0) addScore(e.owner, e.points);

       // Visuals
       addRipple(e.col, e.row, e.owner === PLAYERS.P1 ? '#009688' : '#FFD700');
       if (e.chainTiles) {
         e.chainTiles.forEach(t => {
            // highlight flipped
         });
       }
    }
  }

  // 4. Win Condition (Optional: Time limit or Domination?)
  // For now, endless score attack or until board full?
  // Let's check if board is full or one player has 0 tiles?
  // Arcade games usually have a time limit or specific end.
  // "Scoring: base points = flipped tiles".
  // Let's just track score.
  // Maybe explicit Game Over if one player owns 0 tiles and has 0 beacons?
  // Or just let it run.

  // Sync Score to parent
  if (currentTick % 10 === 0) { // Every ~1s
    Bridge.sendScore(scoreP1);
  }
}

function handlePropagationResult(res, owner) {
  if (res.flippedCount > 0) playFlip();

  if (res.totalPoints > 0) {
    addScore(owner, res.totalPoints);
    // Show float text at first flipped tile or origin
    const origin = res.chainTiles[0] || {col:0, row:0}; // fallback
    const color = owner === PLAYERS.P1 ? '#fff' : '#ffe082';
    // addFloatingText(origin.col, origin.row, `+${res.totalPoints}`, color);
  }

  // Visuals for chain
  if (res.chainTiles) {
    res.chainTiles.forEach((t, i) => {
      setTimeout(() => {
        addFloatingText(t.col, t.row, '!', owner === PLAYERS.P1 ? '#fff' : '#000');
      }, i * 50); // Stagger visual
    });
  }
}

function addScore(owner, points) {
  if (owner === PLAYERS.P1) scoreP1 += points;
  else scoreP2 += points;
}

// Boot
window.onload = () => {
  const canvas = document.getElementById('game-canvas');

  // Seed
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('seed') || 'daily-seed';

  initEngine(TICK_MS);
  initGrid(seed);
  initRenderer(canvas);
  initInput(canvas);
  initSFX(); // Note: needs user gesture to unlock AudioContext usually

  // Unlock audio on first click
  const unlock = () => {
    initSFX();
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('keydown', unlock);

  Bridge.sendReady();
  requestAnimationFrame(loop);
};
