import { hashStringToInt, mulberry32 } from './utils.js';

/* --- Constants --- */
const GRID_COLS = 9;
const GRID_ROWS = 7;
const LOGIC_MS = 60; // 16.66 ticks/sec

const TILE_TYPES = {
    EMPTY: 0,
    REFLECTOR: 1, // Reflects bullets
    SPLITTER: 2,  // Splits bullet into 2
    ABSORBER: 3,  // Destroys bullet
    ACCEL: 4,     // Speeds up bullet
    SLOW: 5,      // Slows down bullet
    SPAWN: 6,     // Where bullets spawn (visual only, logic handled by Wave)
    SHIELD: 7     // Pickup (not permanent)
};

const BULLET_POOL_SIZE = 512;
const MAX_ACTIVE_BULLETS = 300;

export class GridEngine {
    constructor(seedString) {
        // Setup PRNG
        this.rng = mulberry32(hashStringToInt(seedString));

        // State
        this.score = 0;
        this.ticks = 0;
        this.distance = 0; // survival time essentially
        this.lives = 1;
        this.shield = 0;
        this.gameOver = false;

        // Grid State (Player)
        this.player = { col: 4, row: 3, moveCooldown: 0 }; // Center
        this.grid = new Uint8Array(GRID_COLS * GRID_ROWS); // Tile Map
        this.initGrid();

        // Bullets
        this.bullets = [];
        for(let i=0; i<BULLET_POOL_SIZE; i++) this.bullets.push({ active: false });
        this.activeBulletCount = 0;

        // Wave System
        this.waveIdx = 0;
        this.nextWaveTick = 30; // Start shortly after load

        this.events = []; // Per-tick events for Audio/UI
    }

    initGrid() {
        // Basic empty grid
        this.grid.fill(TILE_TYPES.EMPTY);

        // Place some static obstacles based on RNG?
        // For MVP let's place 4 Reflectors in corners to make it interesting
        this.setTile(1, 1, TILE_TYPES.REFLECTOR);
        this.setTile(7, 1, TILE_TYPES.REFLECTOR);
        this.setTile(1, 5, TILE_TYPES.REFLECTOR);
        this.setTile(7, 5, TILE_TYPES.REFLECTOR);
    }

    setTile(c, r, type) {
        if(c>=0 && c<GRID_COLS && r>=0 && r<GRID_ROWS) {
            this.grid[r * GRID_COLS + c] = type;
        }
    }

    getTile(c, r) {
        if(c<0 || c>=GRID_COLS || r<0 || r>=GRID_ROWS) return TILE_TYPES.ABSORBER; // Walls absorb
        return this.grid[r * GRID_COLS + c];
    }

    update(playerMoveDir) {
        this.events = [];
        if (this.gameOver) return this.events;

        this.ticks++;
        if (this.ticks % 17 === 0) { // Approx 1 sec
             this.score += 10;
             this.distance += 1; // Used as 'time survived' seconds
        }

        // 1. Player Movement
        if (this.player.moveCooldown > 0) this.player.moveCooldown--;

        if (playerMoveDir && this.player.moveCooldown <= 0) {
            let nc = this.player.col;
            let nr = this.player.row;
            if (playerMoveDir === 'up') nr--;
            if (playerMoveDir === 'down') nr++;
            if (playerMoveDir === 'left') nc--;
            if (playerMoveDir === 'right') nc++;

            // Bounds check
            if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS) {
                this.player.col = nc;
                this.player.row = nr;
                this.player.moveCooldown = 2; // ~120ms cooldown
                // Check if moved into a hazard or pickup?
                // Future: Add pickup logic here
            }
        }

        // 2. Wave Spawning
        this.updateWaves();

        // 3. Bullet Updates
        let activeCount = 0;
        for (let i = 0; i < BULLET_POOL_SIZE; i++) {
            const b = this.bullets[i];
            if (!b.active) continue;

            activeCount++;

            // Move
            b.x += b.vx;
            b.y += b.vy;
            b.ttl--;

            // Check OOB or TTL
            if (b.ttl <= 0 || b.x < -1 || b.x > GRID_COLS+1 || b.y < -1 || b.y > GRID_ROWS+1) {
                b.active = false;
                continue;
            }

            // Tile Interactions
            const tc = Math.floor(b.x);
            const tr = Math.floor(b.y);

            // Only check interaction if changed tile or first frame?
            // Simple approach: check current tile every tick.
            // Avoid double-processing: store lastTileIdx
            const tidx = tr * GRID_COLS + tc;

            if (tidx !== b.lastTileIdx) {
                b.lastTileIdx = tidx;
                const tile = this.getTile(tc, tr);
                this.handleTileInteraction(b, tile, tc, tr);
            }

            // Player Collision
            // Simple box overlap. Player is at player.col, player.row (integers)
            // Bullet is small point.
            // Hitbox: Player center is col+0.5, row+0.5. Radius ~0.3
            const dx = Math.abs((this.player.col + 0.5) - b.x);
            const dy = Math.abs((this.player.row + 0.5) - b.y);
            if (dx < 0.4 && dy < 0.4) {
                 this.handlePlayerHit(b);
            }
        }
        this.activeBulletCount = activeCount;

        return this.events;
    }

    handleTileInteraction(b, tile, tc, tr) {
        if (tile === TILE_TYPES.EMPTY) return;

        if (tile === TILE_TYPES.REFLECTOR) {
            // Bounce
            // Simple reflection: determine which side was hit based on previous position?
            // Fallback: just invert velocity based on where it is relative to tile center
            const cx = tc + 0.5;
            const cy = tr + 0.5;
            // Vector from center to bullet
            const dx = b.x - cx;
            const dy = b.y - cy;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Hit vertical side
                b.vx = -b.vx;
            } else {
                // Hit horizontal side
                b.vy = -b.vy;
            }
            this.events.push({ type: 'bounce' });
        } else if (tile === TILE_TYPES.ABSORBER) {
            b.active = false;
            // Visual effect event?
        } else if (tile === TILE_TYPES.SPLITTER) {
             b.active = false; // Destroy original, spawn 2
             // Spawn 2 new bullets at +45 and -45 degrees
             const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
             const angle = Math.atan2(b.vy, b.vx);
             this.spawnBullet(b.x, b.y, angle + 0.5, speed, 'basic');
             this.spawnBullet(b.x, b.y, angle - 0.5, speed, 'basic');
        } else if (tile === TILE_TYPES.ACCEL) {
             b.vx *= 1.5;
             b.vy *= 1.5;
        }
    }

    handlePlayerHit(b) {
        if (!b.active) return;

        b.active = false;
        if (this.shield > 0) {
            this.shield--;
            this.events.push({ type: 'shield_break' });
        } else {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver = true;
                this.events.push({ type: 'gameover', meta: { wave: this.waveIdx } });
            } else {
                this.events.push({ type: 'hit' });
            }
        }
    }

    spawnBullet(x, y, angle, speed, type) {
        if (this.activeBulletCount >= MAX_ACTIVE_BULLETS) return; // Cap

        // Find free slot
        let b = null;
        for(let i=0; i<BULLET_POOL_SIZE; i++) {
            if (!this.bullets[i].active) {
                b = this.bullets[i];
                break;
            }
        }
        if (!b) return; // Pool full

        b.active = true;
        b.x = x;
        b.y = y;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
        b.type = type;
        b.ttl = 300; // 5 seconds @ 60 ticks
        b.lastTileIdx = -1;
    }

    updateWaves() {
        if (this.ticks >= this.nextWaveTick) {
            // Spawn Wave
            this.spawnWave();
            // Schedule next
            const difficulty = Math.min(10, this.waveIdx / 5);
            const delay = 100 - (difficulty * 5); // Faster over time
            this.nextWaveTick = this.ticks + Math.max(30, delay);
            this.waveIdx++;
        }
    }

    spawnWave() {
        // Pick random edge
        const side = Math.floor(this.rng() * 4); // 0:top, 1:right, 2:bottom, 3:left
        let x, y, angle;

        // Random offset along the edge
        const offset = this.rng() * (side % 2 === 0 ? GRID_COLS : GRID_ROWS);

        if (side === 0) { x = offset; y = -0.5; angle = Math.PI / 2; }
        else if (side === 1) { x = GRID_COLS + 0.5; y = offset; angle = Math.PI; }
        else if (side === 2) { x = offset; y = GRID_ROWS + 0.5; angle = -Math.PI / 2; }
        else { x = -0.5; y = offset; angle = 0; }

        // Variances
        const speed = 0.1 + (this.rng() * 0.1); // Tiles per tick

        // Spawn Burst
        const count = 3 + Math.floor(this.rng() * 3);
        for(let i=0; i<count; i++) {
             // Slight spread
             const a = angle + (this.rng() - 0.5) * 0.5;
             this.spawnBullet(x, y, a, speed, 'basic');
        }

        this.events.push({ type: 'spawn' });
    }
}
