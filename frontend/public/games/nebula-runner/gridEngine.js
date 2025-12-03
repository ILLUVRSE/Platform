import { CONSTANTS, mulberry32, cyrb128 } from './utils.js';

export class GridEngine {
  constructor(seedStr) {
    this.seedStr = seedStr;
    this.init();
  }

  init() {
    // Seed PRNG
    const seed = cyrb128(this.seedStr);
    this.random = mulberry32(seed);

    // State
    this.grid = [];
    this.shipRow = Math.floor(CONSTANTS.ROWS / 2);
    this.distance = 0;
    this.score = 0;
    this.shield = 0;
    this.alive = true;
    this.tileAdvanceMs = CONSTANTS.TILE_ADVANCE_START;
    this.columnsSinceSpeedUp = 0;

    // Pre-fill grid with empty tiles
    for (let c = 0; c < CONSTANTS.COLS; c++) {
      this.grid.push(this.createEmptyColumn());
    }
  }

  createEmptyColumn() {
      return Array(CONSTANTS.ROWS).fill().map(() => ({ type: 'empty' }));
  }

  advanceColumn(queuedMove) {
      if (!this.alive) return { gameOver: true };

      const events = [];

      // 1. Execute Player Move
      const prevRow = this.shipRow;
      this.shipRow += queuedMove;
      if (this.shipRow < 0) this.shipRow = 0;
      if (this.shipRow >= CONSTANTS.ROWS) this.shipRow = CONSTANTS.ROWS - 1;

      // Note: We don't trigger 'move' sound here because visual movement happened earlier/continuously
      // But maybe a 'click' sound for locking in the row?
      // Spec says "SFX (move, collide, pickup)".
      // If I queue a move, and it executes here.
      // Or maybe sound on input?
      // I'll trigger 'move' event here if logical row changed.
      if (this.shipRow !== prevRow) events.push('move');

      // 2. Advance Grid
      this.grid.shift();
      const newCol = this.generateColumn();
      this.grid.push(newCol);

      this.distance++;
      this.score += 1;

      // 3. Update Speed
      this.columnsSinceSpeedUp++;
      if (this.columnsSinceSpeedUp >= CONSTANTS.SPEED_RAMP_COLUMNS) {
          this.tileAdvanceMs = Math.max(
              CONSTANTS.TILE_ADVANCE_MIN,
              this.tileAdvanceMs * CONSTANTS.SPEED_RAMP_DECAY
          );
          this.columnsSinceSpeedUp = 0;
      }

      // 4. Update Tile States (Lasers)
      for (const col of this.grid) {
          for (const tile of col) {
              if (tile.type === 'laser' && tile.state === 'warning') {
                  tile.state = 'firing';
                  // maybe warning sound was on spawn?
              }
          }
      }

      // 5. Check Collisions
      const shipTile = this.grid[CONSTANTS.SHIP_COL][this.shipRow];
      let crashType = null;

      if (shipTile.type === 'empty') {
          // Safe
      } else if (shipTile.type === 'pickup') {
          this.collectPickup(shipTile, events);
          shipTile.type = 'empty';
          delete shipTile.variant;
      } else if (shipTile.type === 'bounce') {
          // Safe
      } else if (shipTile.type === 'laser') {
          if (shipTile.state === 'firing') {
               crashType = 'laser';
          }
      } else {
          // Meteor
          crashType = shipTile.type;
      }

      if (crashType) {
          if (this.shield > 0) {
              this.shield--;
              shipTile.type = 'empty';
              events.push('shield_break'); // Optional sound
          } else {
              this.alive = false;
              return { gameOver: true, crashType, events };
          }
      }

      return { gameOver: false, events };
  }

  collectPickup(tile, events) {
      if (tile.variant === 'boost') {
          this.score += 50;
          events.push('pickup');
      } else if (tile.variant === 'shield') {
          this.shield++;
          events.push('pickup');
      } else if (tile.variant === 'portal') {
          const dir = this.random() > 0.5 ? 2 : -2;
          this.shipRow += dir;
          if (this.shipRow < 0) this.shipRow = 0;
          if (this.shipRow >= CONSTANTS.ROWS) this.shipRow = CONSTANTS.ROWS - 1;
          events.push('teleport');
      }
  }

  generateColumn() {
      const hazardProb = Math.min(0.08 + this.distance / 2000, 0.5);
      const col = Array(CONSTANTS.ROWS).fill().map(() => ({ type: 'empty' }));

      if (this.random() < hazardProb) {
          const patternType = Math.floor(this.random() * 5);

          if (patternType === 0) { // Single Meteor
              const r = Math.floor(this.random() * CONSTANTS.ROWS);
              col[r] = { type: 'meteor' };
          } else if (patternType === 1) { // Wide Meteor
              const r = Math.floor(this.random() * (CONSTANTS.ROWS - 1));
              col[r] = { type: 'meteor', variant: 'wide' };
              col[r+1] = { type: 'meteor', variant: 'wide' };
          } else if (patternType === 2) { // Laser
               const r = Math.floor(this.random() * CONSTANTS.ROWS);
               col[r] = { type: 'laser', state: 'warning' };
          } else if (patternType === 3) { // Wall with gap
               const gap = Math.floor(this.random() * CONSTANTS.ROWS);
               for(let i=0; i<CONSTANTS.ROWS; i++) {
                   if (i !== gap) col[i] = { type: 'meteor' };
               }
          } else if (patternType === 4) { // Bounce field
               const r = Math.floor(this.random() * CONSTANTS.ROWS);
               col[r] = { type: 'bounce' };
          }
      }

      if (this.random() < 0.05) {
           const empties = col.map((t, i) => t.type === 'empty' ? i : -1).filter(i => i !== -1);
           if (empties.length > 0) {
               const idx = empties[Math.floor(this.random() * empties.length)];
               const pType = this.random();
               let variant = 'boost';
               if (pType < 0.2) variant = 'shield';
               else if (pType < 0.3) variant = 'portal';

               col[idx] = { type: 'pickup', variant };
           }
      }

      return col;
  }
}
