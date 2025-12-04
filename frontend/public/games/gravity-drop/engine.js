// engine.js
import { mulberry32, formatTime } from './utils.js';
import { SHAPES, ShapeGenerator } from './shapes.js';
import { bridge } from './bridge.js';
import { sfx } from './sfx.js';

export class Engine {
  constructor() {
    this.rows = 10;
    this.cols = 10;
    this.blocks = []; // Array of {c, r, color, id}
    this.goals = []; // Array of {c, r}

    this.gravity = {x: 0, y: 1}; // Default Down
    this.score = 0;
    this.movesLeft = 30; // Limit moves per round
    this.gameOver = false;

    // Drop piece state
    this.currentPiece = null;
    this.nextPiece = null;

    // Animation/Tick state
    this.tickRate = 140; // ms
    this.lastTick = 0;
    this.settled = true; // Are blocks moving?

    this.rng = Math.random;
  }

  init(seed) {
    if (seed) {
        // Simple hash of seed string to integer
        let h = 0xdeadbeef;
        for(let i = 0; i < seed.length; i++)
            h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
        this.rng = mulberry32(h);
    } else {
        this.rng = Math.random;
    }

    this.shapeGen = new ShapeGenerator(this.rng);
    this.reset();
  }

  reset() {
    this.blocks = [];
    this.goals = [];
    this.score = 0;
    this.movesLeft = 30;
    this.gameOver = false;
    this.gravity = {x: 0, y: 1};
    this.spawnGoals();
    this.spawnPiece();
    bridge.submitScore(0);
  }

  spawnGoals() {
    // Spawn 3 random goals not overlapping
    this.goals = [];
    for(let i=0; i<3; i++) {
        let c, r;
        let attempts = 0;
        do {
            c = Math.floor(this.rng() * this.cols);
            r = Math.floor(this.rng() * this.rows);
            attempts++;
        } while (this.goals.some(g => g.c === c && g.r === r) && attempts < 100);
        this.goals.push({c, r});
    }
  }

  spawnPiece() {
    if (this.movesLeft <= 0) {
        this.gameOver = true;
        bridge.submitScore(this.score, { complete: true });
        return;
    }

    const shape = this.shapeGen.next();
    // Start top middle
    this.currentPiece = {
        shape,
        col: Math.floor(this.cols / 2) - 1,
        row: -2, // Start above grid
        locked: false
    };

    // If collision on spawn (after moving down 1), game over?
    // Or just let it fall
  }

  // Inputs
  moveCurrent(dir) {
    if (!this.currentPiece || this.currentPiece.locked) return;

    const newCol = this.currentPiece.col + dir;
    if (this.isValidPos(newCol, this.currentPiece.row, this.currentPiece.shape)) {
        this.currentPiece.col = newCol;
    }
  }

  drop() {
    if (!this.currentPiece || this.currentPiece.locked) return;

    // Instant drop or just release to gravity?
    // Prompt says "Space to drop", likely implies release into gravity control
    // But since gravity is active, maybe it speeds it up?
    // Let's make it "release/confirm" placement, then it falls under gravity rules
    // Actually, "Drop" usually means instant hard drop or fast fall.
    // Let's convert currentPiece to blocks immediately at current pos, then let gravity take over.

    // Check if we can place it here (even if floating)
    // If it overlaps existing blocks, we can't drop
    if (!this.isValidPos(this.currentPiece.col, this.currentPiece.row, this.currentPiece.shape)) {
        // Maybe it's too high up?
        return;
    }

    // Commit to blocks
    this.commitPiece();
    this.movesLeft--;
    sfx.playDrop();
    this.settled = false;
  }

  commitPiece() {
      const p = this.currentPiece;
      p.shape.cells.forEach(cell => {
         this.blocks.push({
             c: p.col + cell.c,
             r: p.row + cell.r,
             color: p.shape.color
         });
      });
      this.currentPiece = null;
      // Spawn next immediately? No, wait until settled.
  }

  isValidPos(c, r, shape) {
      for (let cell of shape.cells) {
          const absC = c + cell.c;
          const absR = r + cell.r;

          if (absC < 0 || absC >= this.cols) return false;
          // We allow R < 0 for spawning, but check overlap

          if (this.isOccupied(absC, absR)) return false;
      }
      return true;
  }

  isOccupied(c, r) {
      return this.blocks.some(b => b.c === c && b.r === r);
  }

  changeGravity(dir) {
      if (!this.settled) return; // Wait for current cascade

      let newG = {x:0, y:0};
      if (dir === 'up') newG = {x:0, y:-1};
      if (dir === 'down') newG = {x:0, y:1};
      if (dir === 'left') newG = {x:-1, y:0};
      if (dir === 'right') newG = {x:1, y:0};

      // Update gravity
      if (this.gravity.x !== newG.x || this.gravity.y !== newG.y) {
          this.gravity = newG;
          this.settled = false; // Trigger slide
          sfx.playGravity();
          // Changing gravity might cost a move?
          // Prompt: "Player can change global gravity... limited number of times or with cooldown"
          // Let's make it cost 1 move for now to keep it simple
          this.movesLeft--;
      }
  }

  cycleGravity(dir) {
      // dir 1 or -1
      const dirs = [
          {x:0, y:1}, // Down
          {x:-1, y:0}, // Left
          {x:0, y:-1}, // Up
          {x:1, y:0}   // Right
      ];

      // Find current index
      let idx = dirs.findIndex(d => d.x === this.gravity.x && d.y === this.gravity.y);
      if (idx === -1) idx = 0;

      let newIdx = (idx + dir + 4) % 4;
      const newG = dirs[newIdx];

      this.gravity = newG;
      this.settled = false;
      sfx.playGravity();
      this.movesLeft--;
  }

  update(dt) {
    if (this.gameOver) return;

    // Handle current piece falling (if not dropped yet)
    // Actually, "drop" commits it. Before drop, it floats at top?
    // "A shape appears at top spawn column and falls under active gravity."
    // So the current piece SHOULD be affected by gravity even before "drop"?
    // If so, player just steers it.
    // BUT prompt says: "Space to drop". This implies it stays at top until dropped.
    // Let's implement: Piece spawns at top, stays there (maybe slow fall?), player moves it, hits Drop to release it.
    // MVP: Piece is static at top until Drop.

    if (!this.settled) {
        // Sliding logic
        // We accumulate time until tick
        const now = performance.now();
        if (now - this.lastTick > this.tickRate) {
            this.tick();
            this.lastTick = now;
        }
    } else if (!this.currentPiece) {
        // If settled and no piece, spawn one
        this.spawnPiece();
    }
  }

  tick() {
      let moved = false;

      // Sort blocks based on gravity to prevent overlapping issues during move
      // If gravity is Down (+y), sort by Y descending (bottom first)
      // If gravity Up (-y), sort by Y ascending (top first)
      // If Right (+x), sort by X descending
      // If Left (-x), sort by X ascending

      const g = this.gravity;

      // Create a copy to iterate
      const blocksToMove = [...this.blocks];

      blocksToMove.sort((a, b) => {
          if (g.y > 0) return b.r - a.r;
          if (g.y < 0) return a.r - b.r;
          if (g.x > 0) return b.c - a.c;
          if (g.x < 0) return a.c - b.c;
          return 0;
      });

      for (let b of blocksToMove) {
          const targetC = b.c + g.x;
          const targetR = b.r + g.y;

          // Check bounds
          if (targetC < 0 || targetC >= this.cols || targetR < 0 || targetR >= this.rows) {
              // Hit wall, stop
              continue;
          }

          // Check collision with other blocks
          if (!this.isOccupied(targetC, targetR)) {
              // Move
              b.c = targetC;
              b.r = targetR;
              moved = true;
          }
      }

      if (moved) {
          sfx.playSlide();
      } else {
          // Settle
          this.settled = true;
          this.checkGoals();
      }
  }

  checkGoals() {
      // Check if any goals are filled
      let goalsMet = 0;

      // For each goal, is there a block on it?
      // MVP: Any block type fills goal
      const filledGoals = this.goals.filter(g => this.isOccupied(g.c, g.r));

      if (filledGoals.length > 0) {
          goalsMet = filledGoals.length;

          // Score
          const points = goalsMet * 100 * (1 + (goalsMet-1)*0.25);
          this.score += Math.floor(points);
          bridge.submitScore(this.score);
          sfx.playCombo(goalsMet);

          // Remove blocks on goals?
          // "Score by filling goals and triggering cascades."
          // "When goals clear, adjacent blocks above fall..."
          // So yes, remove the blocks.

          filledGoals.forEach(g => {
             const idx = this.blocks.findIndex(b => b.c === g.c && b.r === g.r);
             if (idx !== -1) this.blocks.splice(idx, 1);
          });

          // Respawn goals?
          // Or just clear them and spawn new ones?
          // Let's remove satisfied goals and spawn new ones to keep game going
          this.goals = this.goals.filter(g => !filledGoals.includes(g));

          // Spawn new goals equal to cleared count
          for(let i=0; i<goalsMet; i++) {
              let c, r;
            let attempts = 0;
            do {
                c = Math.floor(this.rng() * this.cols);
                r = Math.floor(this.rng() * this.rows);
                attempts++;
            } while ((this.goals.some(g => g.c === c && g.r === r) || this.isOccupied(c,r)) && attempts < 100);
            this.goals.push({c, r});
          }

          // Since blocks removed, gravity might cause more falls
          this.settled = false;
      }
  }
}
