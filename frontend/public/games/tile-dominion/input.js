import { GRID_W, GRID_H, PLAYERS } from './engine.js';

const KEY_MAP = {
  // P1: WASD + Space
  87: { p: 'P1', action: 'up' },    // W
  83: { p: 'P1', action: 'down' },  // S
  65: { p: 'P1', action: 'left' },  // A
  68: { p: 'P1', action: 'right' }, // D
  32: { p: 'P1', action: 'place' }, // Space

  // P2: Arrows + Enter
  38: { p: 'P2', action: 'up' },
  40: { p: 'P2', action: 'down' },
  37: { p: 'P2', action: 'left' },
  39: { p: 'P2', action: 'right' },
  13: { p: 'P2', action: 'place' }
};

const cursors = {
  P1: { col: 0, row: 0 },
  P2: { col: GRID_W - 1, row: GRID_H - 1 }
};

let inputState = {
  P1: { place: false },
  P2: { place: false }
};

// Queue of actions to process in tick
let actionQueue = [];

export function initInput(canvas) {
  window.addEventListener('keydown', handleKey);

  // Mouse support for P1 (or single player)
  canvas.addEventListener('mousemove', (e) => handleMouse(e, canvas));
  canvas.addEventListener('mousedown', (e) => handleClick(e, canvas));

  // Prevent scrolling
  window.addEventListener('keydown', function(e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
  }, false);
}

function handleKey(e) {
  const binding = KEY_MAP[e.keyCode];
  if (!binding) return;

  const c = cursors[binding.p];
  if (binding.action === 'up') c.row = Math.max(0, c.row - 1);
  if (binding.action === 'down') c.row = Math.min(GRID_H - 1, c.row + 1);
  if (binding.action === 'left') c.col = Math.max(0, c.col - 1);
  if (binding.action === 'right') c.col = Math.min(GRID_W - 1, c.col + 1);

  if (binding.action === 'place') {
    actionQueue.push({ player: PLAYERS[binding.p], col: c.col, row: c.row });
  }
}

// Transform mouse coords to grid coords (requires access to renderer bounds)
// For simplicity, we'll re-calculate bounds or expose them.
// Ideally Input shouldn't know about Renderer internals, but for Arcade it's fine.
// We'll pass a bounds getter or just approximate.
// Actually, let's just make input.js export a function to set bounds from renderer.
let renderBounds = { x:0, y:0, scale:1 };

export function setInputBounds(b) {
  renderBounds = b;
}

function getGridPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width); // scaled x
  const y = (e.clientY - rect.top) * (canvas.height / rect.height); // scaled y

  const gx = Math.floor((x - renderBounds.x) / (64 * renderBounds.scale)); // 64 is TILE_SIZE
  const gy = Math.floor((y - renderBounds.y) / (64 * renderBounds.scale));

  return { col: gx, row: gy };
}

function handleMouse(e, canvas) {
  const p = getGridPos(e, canvas);
  if (p.col >= 0 && p.col < GRID_W && p.row >= 0 && p.row < GRID_H) {
    cursors.P1.col = p.col;
    cursors.P1.row = p.row;
  }
}

function handleClick(e, canvas) {
  // P1 places on click
  const p = getGridPos(e, canvas);
  if (p.col >= 0 && p.col < GRID_W && p.row >= 0 && p.row < GRID_H) {
     actionQueue.push({ player: PLAYERS.P1, col: p.col, row: p.row });
  }
}

export function getCursors() {
  return cursors;
}

export function popActions() {
  const a = [...actionQueue];
  actionQueue = [];
  return a;
}
