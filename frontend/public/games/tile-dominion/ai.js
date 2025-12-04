import { GRID_W, GRID_H, PLAYERS } from './engine.js';

const TICK_RATE = 8; // Bot moves every 8 ticks (~1s)
let tickCounter = 0;

export function updateBot(grid, beacons, addActionCallback) {
  tickCounter++;
  if (tickCounter < TICK_RATE) return;
  tickCounter = 0;

  // Simple Greedy Logic for P2
  const p2Beacons = beacons.filter(b => b.owner === PLAYERS.P2);
  if (p2Beacons.length >= 2) return; // Cap reached

  // Evaluate all valid moves
  let bestMove = null;
  let bestScore = -1;

  // Try random subset of moves to save perf? Or all 100? 100 is cheap.
  for (let c = 0; c < GRID_W; c++) {
    for (let r = 0; r < GRID_H; r++) {
      const tile = grid[c][r];
      if (tile.blocked) continue;

      // Score heuristic:
      // +10 for claiming neutral
      // +20 for flipping enemy
      // +5 for reinforcing own
      // +Distance factor (prefer near enemies?)

      let score = 0;

      // Simulate (simplified)
      // Check neighbors
      const neighbors = [
        {c:c+1,r:0}, {c:c-1,r:0}, {c:c,r:r+1}, {c:c,r:r-1}
      ];

      for (const n of neighbors) {
         if(n.c<0||n.c>=GRID_W||n.r<0||n.r>=GRID_H) continue;
         const nt = grid[n.c][n.r];
         if (!nt || nt.blocked) continue;

         if (nt.owner === PLAYERS.P1) score += 20; // Attack!
         else if (nt.owner === null) score += 10; // Expand
         else if (nt.owner === PLAYERS.P2) score += 2; // Defend (small)
      }

      if (tile.owner === PLAYERS.P2) score += 5; // Reinforce self

      // Random jitter to prevent deterministic loops
      score += Math.random() * 5;

      if (score > bestScore) {
        bestScore = score;
        bestMove = { col: c, row: r };
      }
    }
  }

  if (bestMove) {
    addActionCallback({ player: PLAYERS.P2, col: bestMove.col, row: bestMove.row });
  }
}
