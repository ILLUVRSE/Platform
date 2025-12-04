import { mulberry32, randomInt } from './utils.js';

export const TILE = {
    FLOOR: 0,
    WALL: 1,
    FOOD: 2
};

export const DIR = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

export const DIR_VEC = [
    {x: 0, y: -1}, // UP
    {x: 1, y: 0},  // RIGHT
    {x: 0, y: 1},  // DOWN
    {x: -1, y: 0}  // LEFT
];

export class Engine {
    constructor(seed, onGameOver, sfx) {
        this.width = 10;
        this.height = 10;
        this.seed = seed || Date.now();
        this.rng = mulberry32(this.seed);
        this.onGameOver = onGameOver;
        this.sfx = sfx;

        // Game State
        this.grid = new Array(this.width * this.height).fill(TILE.FLOOR);
        this.snake = []; // Array of indices. [0] is HEAD.
        this.heading = DIR.RIGHT;
        this.score = 0;
        this.ticks = 0;
        this.gameOver = false;

        // Config
        this.tickRate = 200;
        this.lastTickTime = 0;
        this.speedUpInterval = 5; // Decrease tickRate every 5 food
        this.foodEaten = 0;

        this.init();
    }

    init() {
        // Clear grid
        this.grid.fill(TILE.FLOOR);

        // Spawn walls (procedural simple pattern or noise)
        // For MVP: Simple random walls, ensuring center is clear
        for(let i=0; i<this.grid.length; i++) {
            if (this.rng() < 0.15) { // 15% walls
                this.grid[i] = TILE.WALL;
            }
        }

        // Clear center area for safe spawn
        const safeZone = [
            this.idx(4,4), this.idx(5,4), this.idx(6,4),
            this.idx(4,5), this.idx(5,5), this.idx(6,5)
        ];
        safeZone.forEach(idx => this.grid[idx] = TILE.FLOOR);

        // Spawn Snake (Length 3, Horizontal)
        const startHead = this.idx(5, 5);
        this.snake = [startHead, this.idx(4, 5), this.idx(3, 5)];
        this.heading = DIR.RIGHT;

        // Spawn first Food
        this.spawnFood();
    }

    idx(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
        return y * this.width + x;
    }

    xy(idx) {
        return { x: idx % this.width, y: Math.floor(idx / this.width) };
    }

    tick(dt) {
        if (this.gameOver) return;

        // Deterministic Move Logic
        const headIdx = this.snake[0];
        const headPos = this.xy(headIdx);

        // Priority: Forward -> Left -> Right -> Back (Last Resort)
        // "Back" is logically DIR + 2 % 4.

        const priorities = [
            this.heading,
            (this.heading + 3) % 4, // Left
            (this.heading + 1) % 4, // Right
            (this.heading + 2) % 4  // Back
        ];

        let nextDir = -1;
        let nextIdx = -1;

        // Evaluate valid moves
        for (let dir of priorities) {
            const vec = DIR_VEC[dir];
            const targetX = headPos.x + vec.x;
            const targetY = headPos.y + vec.y;
            const targetIdx = this.idx(targetX, targetY);

            // Bounds check
            if (targetIdx === -1) continue;

            // Wall check
            if (this.grid[targetIdx] === TILE.WALL) continue;

            // Body check (Immediate next tile)
            // Note: We check against current snake body.
            // But technically the tail will move forward too, freeing up the last spot.
            // However, typical snake rules often treat head-butting tail as death.
            // We will disallow moving into ANY body part unless it's the very last tail segment
            // which effectively disappears this frame.
            // SIMPLIFICATION: If target is in snake, it's blocked.
            if (this.snake.includes(targetIdx) && targetIdx !== this.snake[this.snake.length - 1]) {
                continue;
            }

            // If we get here, it's valid
            nextDir = dir;
            nextIdx = targetIdx;
            break;
        }

        if (nextIdx === -1) {
            this.die("Trapped! No moves.");
            return;
        }

        // Apply Move
        this.heading = nextDir;

        // Check collision (Double check for body/wall logic consistency)
        // If we picked a direction, we already checked walls/bounds.
        // But we need to handle "Crash into Tail" properly if we allowed back-move?
        // Actually, our priority search FILTERS out body collisions.
        // So if we found a move, it is safe.
        // Unless... the only move was "Back" and it was blocked by body?
        // If all 4 blocked, we already returned.

        // Execute Move
        this.snake.unshift(nextIdx); // Add new head

        const tileType = this.grid[nextIdx];

        if (tileType === TILE.FOOD) {
            this.score += 10;
            this.foodEaten++;
            this.grid[nextIdx] = TILE.FLOOR; // Consume food
            this.spawnFood();
            if (this.sfx) this.sfx.playEat();

            // Speed up
            if (this.foodEaten % this.speedUpInterval === 0) {
                this.tickRate = Math.max(80, this.tickRate - 10);
            }
        } else {
            this.snake.pop(); // Remove tail (maintain length)
            if (this.sfx) this.sfx.playMove();
        }
    }

    swapTiles(idxA, idxB) {
        if (this.gameOver) return;

        // 1. Validation: Bounds
        if (idxA < 0 || idxA >= this.grid.length || idxB < 0 || idxB >= this.grid.length) return false;

        // 2. Validation: Adjacency (Orthogonal)
        const posA = this.xy(idxA);
        const posB = this.xy(idxB);
        const dx = Math.abs(posA.x - posB.x);
        const dy = Math.abs(posA.y - posB.y);
        if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
            return false; // Not adjacent
        }

        // 3. Validation: Snake Occupancy
        // Cannot swap any tile occupied by the snake
        if (this.snake.includes(idxA) || this.snake.includes(idxB)) {
             if (this.sfx) this.sfx.playInvalid();
             return false;
        }

        // 4. Perform Swap
        const temp = this.grid[idxA];
        this.grid[idxA] = this.grid[idxB];
        this.grid[idxB] = temp;

        if (this.sfx) this.sfx.playSwap();

        return true;
    }

    spawnFood() {
        let attempts = 0;
        while (attempts < 50) {
            const idx = randomInt(this.rng, 0, this.grid.length - 1);
            if (this.grid[idx] === TILE.FLOOR && !this.snake.includes(idx)) {
                this.grid[idx] = TILE.FOOD;
                return;
            }
            attempts++;
        }
        // Fallback: Linear search
        for(let i=0; i<this.grid.length; i++) {
             if (this.grid[i] === TILE.FLOOR && !this.snake.includes(i)) {
                this.grid[i] = TILE.FOOD;
                return;
            }
        }
    }

    die(reason) {
        console.log("Game Over:", reason);
        this.gameOver = true;
        if (this.sfx) this.sfx.playDie();
        if (this.onGameOver) this.onGameOver(this.score);
    }
}
