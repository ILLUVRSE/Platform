import { GRID_W, GRID_H, PLAYERS } from './engine.js';
import { lerp, easeOutBack } from './utils.js';

// Theme Colors
const COLORS = {
  bg: '#071218',
  gridLine: '#1a2e38',
  neutral: '#2f4f5d',
  p1: '#009688',      // Teal
  p1Dark: '#004d40',
  p2: '#FFD700',      // Gold
  p2Dark: '#b39700', // Darker Gold
  blocked: '#0d1b22', // Darker than bg
  text: '#e0f2f1',
  highlight: '#ffffff'
};

const TILE_SIZE = 64; // Base size, will scale
let canvas, ctx;
let pixelRatio = 1;
let bounds = { x: 0, y: 0, w: 640, h: 640, scale: 1 };

// Animation state
const anims = []; // { type, x, y, t, life, color, text? }

export function initRenderer(cvs) {
  canvas = cvs;
  ctx = canvas.getContext('2d', { alpha: false });
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  const p = canvas.parentElement;
  if (!p) return;

  const w = p.clientWidth;
  const h = p.clientHeight;

  pixelRatio = window.devicePixelRatio || 1;
  canvas.width = w * pixelRatio;
  canvas.height = h * pixelRatio;

  // Fit 10x10 grid into view
  const aspect = 1;
  let viewH = h;
  let viewW = h * aspect;

  if (viewW > w) {
    viewW = w;
    viewH = w / aspect;
  }

  const scale = viewW / (GRID_W * TILE_SIZE);

  bounds = {
    x: (w - viewW) / 2,
    y: (h - viewH) / 2,
    w: viewW,
    h: viewH,
    scale: scale
  };
}

export function getBounds() {
  return bounds;
}

export function addFloatingText(col, row, text, color) {
  anims.push({
    type: 'float',
    col, row,
    t: 0,
    life: 1.0,
    text,
    color
  });
}

export function addRipple(col, row, color) {
  anims.push({
    type: 'ripple',
    col, row,
    t: 0,
    life: 0.6,
    color
  });
}

export function render(dt, grid, beacons, cursors, scoreP1, scoreP2) {
  // Clear
  ctx.resetTransform();
  ctx.scale(pixelRatio, pixelRatio);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);

  // Apply Game Transform
  ctx.translate(bounds.x, bounds.y);
  ctx.scale(bounds.scale, bounds.scale);

  // Draw Grid
  for (let c = 0; c < GRID_W; c++) {
    for (let r = 0; r < GRID_H; r++) {
      drawTile(ctx, c, r, grid[c][r]);
    }
  }

  // Draw Beacons
  for (const b of beacons) {
    drawBeacon(ctx, b);
  }

  // Draw Cursors
  if (cursors.P1) drawCursor(ctx, cursors.P1.col, cursors.P1.row, COLORS.p1, 'P1');
  if (cursors.P2) drawCursor(ctx, cursors.P2.col, cursors.P2.row, COLORS.p2, 'P2');

  // Draw Animations
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    a.t += dt / a.life;
    if (a.t >= 1) {
      anims.splice(i, 1);
      continue;
    }

    if (a.type === 'float') drawFloatText(ctx, a);
    else if (a.type === 'ripple') drawRipple(ctx, a);
  }

  // Draw HUD (Score) - Draw in screen space
  ctx.resetTransform();
  ctx.scale(pixelRatio, pixelRatio);
  drawHUD(scoreP1, scoreP2);
}

function drawTile(ctx, c, r, tile) {
  const x = c * TILE_SIZE;
  const y = r * TILE_SIZE;
  const gap = 2;
  const size = TILE_SIZE - gap * 2;

  let color = COLORS.neutral;
  if (tile.blocked) color = COLORS.blocked;
  else if (tile.owner === PLAYERS.P1) color = COLORS.p1;
  else if (tile.owner === PLAYERS.P2) color = COLORS.p2;

  // Darken if fortified
  if (tile.fortified) {
    // We can draw a border or inner rect
  }

  ctx.fillStyle = color;

  // Stability visual: shrink slighty if damaged?
  // Or just alpha? Let's use simple rect first.
  ctx.fillRect(x + gap, y + gap, size, size);

  if (tile.fortified) {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + gap + 4, y + gap + 4, size - 8, size - 8);

    // Draw stability dots or number?
    // Only if owner is set, show stability?
    if (tile.owner) {
       ctx.fillStyle = 'rgba(0,0,0,0.5)';
       // 2 dots for fortified max
       if (tile.stability >= 1) ctx.fillRect(x + size/2 - 4, y + size/2 - 4, 8, 8);
    }
  } else if (tile.owner && tile.stability < 1) {
      // Damaged normal tile
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 4, 0, Math.PI*2);
      ctx.fill();
  }

  if (tile.blocked) {
    ctx.strokeStyle = '#1a2e38';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + gap, y + gap);
    ctx.lineTo(x + gap + size, y + gap + size);
    ctx.moveTo(x + gap + size, y + gap);
    ctx.lineTo(x + gap, y + gap + size);
    ctx.stroke();
  }
}

function drawBeacon(ctx, b) {
  const x = b.col * TILE_SIZE + TILE_SIZE/2;
  const y = b.row * TILE_SIZE + TILE_SIZE/2;

  // Pulsing
  // We don't have exact tick interpolation here, assume 60fps
  const pulse = (Date.now() % 1000) / 1000;
  const r = 10 + pulse * 5;
  const alpha = 1 - pulse;

  ctx.strokeStyle = b.owner === PLAYERS.P1 ? COLORS.highlight : COLORS.p2Dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.stroke();

  // Core
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI*2);
  ctx.fill();
}

function drawCursor(ctx, c, r, color, label) {
  const x = c * TILE_SIZE;
  const y = r * TILE_SIZE;
  const gap = 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

  // Label P1/P2
  ctx.fillStyle = color;
  ctx.font = '10px monospace';
  ctx.fillText(label, x + 4, y + 12);
}

function drawFloatText(ctx, a) {
  const x = a.col * TILE_SIZE + TILE_SIZE/2;
  const y = a.row * TILE_SIZE + TILE_SIZE/2 - (a.t * 30); // float up
  const alpha = 1 - a.t;

  ctx.fillStyle = a.color; // Should be hex? Canvas doesn't support hex+alpha easily unless rgba
  // Quick fix: assumes a.color is a hex string
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(a.text, x, y);
  ctx.globalAlpha = 1.0;
}

function drawRipple(ctx, a) {
  const x = a.col * TILE_SIZE + TILE_SIZE/2;
  const y = a.row * TILE_SIZE + TILE_SIZE/2;
  const r = a.t * (TILE_SIZE * 1.5);
  const alpha = 1 - a.t;

  ctx.strokeStyle = a.color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

function drawHUD(s1, s2) {
  const h = 40;
  // P1 Score (Top Left)
  ctx.fillStyle = COLORS.p1;
  ctx.fillRect(0, 0, 120, h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`P1: ${s1}`, 10, 26);

  // P2 Score (Top Right)
  const w = canvas.width / pixelRatio;
  ctx.fillStyle = COLORS.p2;
  ctx.fillRect(w - 120, 0, 120, h);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';
  ctx.fillText(`P2: ${s2}`, w - 10, 26);
}
