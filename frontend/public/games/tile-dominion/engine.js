import { mulberry32, hashStringToInt, clamp } from './utils.js';

// CONFIG
export const GRID_W = 10;
export const GRID_H = 10;
const DEFAULT_STABILITY = 1;
const FORTIFIED_STABILITY = 2;
const MAX_STABILITY = 3;
const MAX_ACTIVE_BEACONS_PER_PLAYER = 2;
const BEACON_LIFETIME_MS = 10000;
const BEACON_EMIT_MS = 1000;
// We'll set these after we know TICK_MS, or pass TICK_MS in
let BEACON_LIFETIME_TICKS = 1;
let BEACON_EMIT_TICKS = 1;

// Grid state: 10x10 array of { owner, stability, blocked, fortified }
let grid = [];
let beacons = []; // {owner,col,row,placedTick,expireTick,nextEmitTick}

// State for players
export const PLAYERS = {
  P1: 1, // Blue/Teal
  P2: 2  // Orange/Gold
};

// helpers
const inBounds = (c, r) => c >= 0 && c < GRID_W && r >= 0 && r < GRID_H;
const tileKey = (c, r) => `${c},${r}`;

export function initEngine(tickMs) {
  BEACON_LIFETIME_TICKS = Math.max(1, Math.round(BEACON_LIFETIME_MS / tickMs));
  BEACON_EMIT_TICKS = Math.max(1, Math.round(BEACON_EMIT_MS / tickMs));
}

export function initGrid(seedStr) {
  const seed = hashStringToInt(seedStr);
  const rand = mulberry32(seed);

  grid = [];
  beacons = [];

  // 1. Initialize blank grid
  for (let c = 0; c < GRID_W; c++) {
    grid[c] = [];
    for (let r = 0; r < GRID_H; r++) {
      grid[c][r] = {
        owner: null,
        stability: 0,
        blocked: false,
        fortified: false
      };
    }
  }

  // 2. Mark safe zones (corners + neighbors)
  // P1: (0,0), P2: (9,9)
  const safeZones = new Set();
  const safeList = [
    {c:0, r:0}, {c:1, r:0}, {c:0, r:1}, {c:1, r:1}, // Top-left
    {c:9, r:9}, {c:8, r:9}, {c:9, r:8}, {c:8, r:8}  // Bottom-right
  ];
  safeList.forEach(p => safeZones.add(tileKey(p.c, p.r)));

  // 3. Place Fortified Tiles (8-12)
  const numFortified = 8 + Math.floor(rand() * 5); // 8 to 12
  let placed = 0;
  let attempts = 0;
  while (placed < numFortified && attempts < 100) {
    attempts++;
    const c = Math.floor(rand() * GRID_W);
    const r = Math.floor(rand() * GRID_H);
    const k = tileKey(c, r);
    if (!safeZones.has(k) && !grid[c][r].fortified) {
      grid[c][r].fortified = true;
      grid[c][r].stability = FORTIFIED_STABILITY;
      placed++;
    }
  }

  // 4. Optional Pillars (Blocked) - let's add a few symmetric ones for interest
  // e.g. (3,3), (6,3), (3,6), (6,6)
  const pillars = [
    {c:3, r:3}, {c:6, r:3},
    {c:3, r:6}, {c:6, r:6}
  ];
  for (const p of pillars) {
     // Ensure we didn't accidentally put a pillar on a fortified tile (though low chance)
     // or just overwrite it
     grid[p.c][p.r].blocked = true;
     grid[p.c][p.r].fortified = false;
     grid[p.c][p.r].stability = 0;
     grid[p.c][p.r].owner = null;
  }
}

export function getGrid() {
  return grid;
}

export function getBeacons() {
  return beacons;
}

// Place beacon; returns { success, flippedCount, chainTiles, reinforced, totalPoints }
export function placeBeacon(owner, col, row, currentTick) {
  if (!inBounds(col, row)) return { success: false };

  // Check active beacon limit
  if ((beacons.filter(b => b.owner === owner).length) >= MAX_ACTIVE_BEACONS_PER_PLAYER) {
    return { success: false, reason: 'limit' };
  }

  const tile = grid[col][row];
  if (!tile || tile.blocked) return { success: false, reason: 'blocked' };

  beacons.push({
    owner, col, row,
    placedTick: currentTick,
    expireTick: currentTick + BEACON_LIFETIME_TICKS,
    nextEmitTick: currentTick + BEACON_EMIT_TICKS
  });

  let result;
  // If placing on own tile => reinforce stability
  if (tile.owner === owner) {
    tile.stability = Math.min(MAX_STABILITY, (tile.stability || DEFAULT_STABILITY) + 1);
    // small neighbor emit
    result = propagate([{ col, row }], owner, 1);
    result.reinforced = true;
  } else {
    // full propagation
    result = propagate([{ col, row }], owner, Infinity);
    result.reinforced = false;
  }

  // Calculate Score
  result.totalPoints = calculateScore(result.flippedCount);

  return result;
}


// BFS propagate from start cells. maxDepth=1 for neighbor-only emits, Infinity for full.
export function propagate(starts, owner, maxDepth = Infinity) {
  const q = [];
  const visited = new Set();

  for (const s of starts) {
    q.push({ col: s.col, row: s.row, depth: 0 });
  }

  let flipped = 0;
  const chainTiles = []; // {col, row}

  while (q.length) {
    const n = q.shift();
    const key = tileKey(n.col, n.row);

    if (visited.has(key)) continue;
    visited.add(key);

    if (!inBounds(n.col, n.row)) continue;
    const tile = grid[n.col][n.row];
    if (!tile || tile.blocked) continue;

    // Logic depending on ownership
    if (tile.owner === owner) {
      // Already owned: just propagate through (no flip, no damage)
      // Check depth
      if (n.depth < maxDepth) {
        pushNeighbors(q, n.col, n.row, n.depth + 1, visited);
      }
      continue;
    }

    if (tile.owner === null) {
      // Neutral -> claim
      tile.owner = owner;
      tile.stability = tile.fortified ? FORTIFIED_STABILITY : DEFAULT_STABILITY;
      flipped++;
      chainTiles.push({ col: n.col, row: n.row });
      // Propagate further
      if (n.depth < maxDepth) {
        pushNeighbors(q, n.col, n.row, n.depth + 1, visited);
      }
      continue;
    }

    // Owned by opponent -> damage stability
    // Note: In some variations, you only damage if stability > 0.
    // If stability reaches 0, it flips.
    tile.stability = (tile.stability || DEFAULT_STABILITY) - 1;

    if (tile.stability <= 0) {
      // FLIP
      tile.owner = owner;
      tile.stability = tile.fortified ? FORTIFIED_STABILITY : DEFAULT_STABILITY;
      flipped++;
      chainTiles.push({ col: n.col, row: n.row });

      // Cascade: continue propagation from this flipped tile
      if (n.depth < maxDepth) {
        pushNeighbors(q, n.col, n.row, n.depth + 1, visited);
      }
    } else {
      // Damaged but didn't flip.
      // Do NOT propagate through an enemy tile that wasn't flipped.
      continue;
    }
  }

  return { success: true, flippedCount: flipped, chainTiles };
}

function pushNeighbors(q, c, r, depth, visited) {
  const ds = [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }];
  for (const d of ds) {
    const nc = c + d.dc;
    const nr = r + d.dr;
    // We don't check visited here to allow multiple paths to reach queue,
    // but visited set in loop prevents re-processing.
    // However, to keep queue size small, we can check visited if we want.
    // The original code checked visited here?
    // "if (!inBounds(nc,nr) || visited.has(k)) continue;"
    // Yes, let's stick to that for efficiency.
    const k = tileKey(nc, nr);
    if (!inBounds(nc, nr) || visited.has(k)) continue;
    q.push({ col: nc, row: nr, depth });
  }
}

// Call each tick: manage beacon emits & expirations
// Returns array of events (e.g. emits) for rendering/sfx
export function updateBeacons(currentTick) {
  const events = [];

  for (let i = beacons.length - 1; i >= 0; i--) {
    const b = beacons[i];

    // Check expiration
    if (currentTick >= b.expireTick) {
      beacons.splice(i, 1);
      events.push({ type: 'expire', col: b.col, row: b.row });
      continue;
    }

    // Check emit
    if (currentTick >= b.nextEmitTick) {
      // neighbor-only emit
      const res = propagate([{ col: b.col, row: b.row }], b.owner, 1);
      b.nextEmitTick += BEACON_EMIT_TICKS;

      // Score from emit?
      const pts = calculateScore(res.flippedCount);

      events.push({
        type: 'emit',
        col: b.col,
        row: b.row,
        flippedCount: res.flippedCount,
        chainTiles: res.chainTiles,
        points: pts,
        owner: b.owner
      });
    }
  }
  return events;
}

// Scoring: Base + Chain Bonus
export function calculateScore(flippedCount) {
  if (flippedCount <= 0) return 0;

  const chainMultiplierPerStep = 0.2;
  let chainPoints = 0;
  // sum_{k=1..N} (1 * (1 + (k-1)*0.2))
  for (let k = 1; k <= flippedCount; k++) {
    chainPoints += 1 * (1 + (k - 1) * chainMultiplierPerStep);
  }
  return Math.round(chainPoints);
}
