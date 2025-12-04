// engine.js
import { mulberry32, GRID_W, GRID_H, getNeighbors } from './utils.js';

export const TILE_TYPES = {
    EMPTY: 'empty',
    WIRE: 'wire',
    GENERATOR: 'generator',
    SINK: 'sink',
    BREAKER: 'breaker',
    SWITCH: 'switch' // Simple toggle
};

export const WIRE_VARIANTS = {
    STRAIGHT: 'straight', // ─
    CORNER: 'corner',     // ┐
    T_SHAPE: 't_shape',   // ┬
    CROSS: 'cross'        // ┼
};

// Connections mask: [Up, Right, Down, Left] (0 or 1)
// Rotations shift this array.
const BASE_CONNECTIVITY = {
    'straight': [0, 1, 0, 1], // Left-Right
    'corner':   [1, 1, 0, 0], // Up-Right
    't_shape':  [0, 1, 1, 1], // Right-Down-Left (T pointing down)
    'cross':    [1, 1, 1, 1]
};

export class CircuitEngine {
    constructor(seed = Date.now()) {
        this.grid = [];
        this.width = GRID_W;
        this.height = GRID_H;
        this.rand = mulberry32(seed);
        this.generators = [];
        this.sinks = [];
        this.tickCount = 0;
        this.score = 0;
        this.gameOver = false;
        this.maxTicks = 900; // 3 minutes at 5 ticks/s (200ms)
        this.cooldowns = { action: 0 };

        this.initGrid();
    }

    initGrid() {
        // Initialize empty grid
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(this.createTile(TILE_TYPES.EMPTY));
            }
            this.grid.push(row);
        }

        this.generateMap();
    }

    generateMap() {
        // Procedural placement based on seed
        const numGens = 2 + Math.floor(this.rand() * 2); // 2 or 3
        const numSinks = 2 + Math.floor(this.rand() * 2); // 2 or 3

        // Generators on left (col 0 or 1)
        for(let i=0; i<numGens; i++) {
            let placed = false;
            let attempts = 0;
            while(!placed && attempts < 20) {
                const y = Math.floor(this.rand() * this.height);
                const x = 0; // Stick to edge for now
                if(this.grid[y][x].type === TILE_TYPES.EMPTY) {
                    this.addEntity(x, y, TILE_TYPES.GENERATOR, 10 + Math.floor(this.rand() * 10));
                    placed = true;
                }
                attempts++;
            }
        }

        // Sinks on right (last col or last-1)
        for(let i=0; i<numSinks; i++) {
             let placed = false;
            let attempts = 0;
            while(!placed && attempts < 20) {
                const y = Math.floor(this.rand() * this.height);
                const x = this.width - 1;
                if(this.grid[y][x].type === TILE_TYPES.EMPTY) {
                    this.addEntity(x, y, TILE_TYPES.SINK, 5 + Math.floor(this.rand() * 10));
                    placed = true;
                }
                attempts++;
            }
        }
    }

    createTile(type, subtype = null, rotation = 0) {
        return {
            type,
            subtype, // For wires
            rotation, // 0, 1, 2, 3 (x90 degrees clockwise)
            power: 0,
            capacity: type === TILE_TYPES.BREAKER ? 50 : 15, // Breakers handle more
            health: 100, // 0 = broken
            state: 'normal', // normal, overloaded, broken
            value: 0, // For Gen/Sink (output/demand)
            connections: [0, 0, 0, 0] // Calculated connectivity
        };
    }

    addEntity(x, y, type, value = 10) {
        if (this.grid[y][x].type !== TILE_TYPES.EMPTY) return;
        const tile = this.createTile(type);
        tile.value = value;
        this.grid[y][x] = tile;
        if (type === TILE_TYPES.GENERATOR) this.generators.push({x, y});
        if (type === TILE_TYPES.SINK) this.sinks.push({x, y});
    }

    // Helper to rotate connectivity array
    getRotatedConnections(baseConn, rotation) {
        const newConn = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            if (baseConn[i] === 1) {
                const newIndex = (i + rotation) % 4;
                newConn[newIndex] = 1;
            }
        }
        return newConn;
    }

    canInteract() {
        return Date.now() >= this.cooldowns.action && !this.gameOver;
    }

    triggerCooldown(ms = 120) {
        this.cooldowns.action = Date.now() + ms;
    }

    placeWire(x, y, subtype, rotation) {
        if (!this.canInteract()) return false;

        if (this.grid[y][x].type !== TILE_TYPES.EMPTY && this.grid[y][x].type !== TILE_TYPES.WIRE && this.grid[y][x].type !== TILE_TYPES.BREAKER && this.grid[y][x].type !== TILE_TYPES.SWITCH) return false;

        this.grid[y][x] = this.createTile(TILE_TYPES.WIRE, subtype, rotation);
        this.triggerCooldown();
        return true;
    }

    placeComponent(x, y, type, rotation = 0) {
        if (!this.canInteract()) return false;
        if (this.grid[y][x].type !== TILE_TYPES.EMPTY && this.grid[y][x].type !== TILE_TYPES.WIRE) return false;
        this.grid[y][x] = this.createTile(type, null, rotation);
        if(type === TILE_TYPES.SWITCH) {
            this.grid[y][x].subtype = 'on'; // default on
        }
        this.triggerCooldown();
        return true;
    }

    removeTile(x, y) {
        if (!this.canInteract()) return false;
        const tile = this.grid[y][x];
        if (tile.type === TILE_TYPES.GENERATOR || tile.type === TILE_TYPES.SINK) return false; // Can't delete infra
        this.grid[y][x] = this.createTile(TILE_TYPES.EMPTY);
        this.triggerCooldown();
        return true;
    }

    rotateTile(x, y) {
        if (!this.canInteract()) return false;
        const tile = this.grid[y][x];
        if (tile.type === TILE_TYPES.WIRE || tile.type === TILE_TYPES.BREAKER || tile.type === TILE_TYPES.SWITCH) {
            tile.rotation = (tile.rotation + 1) % 4;
        }
        this.triggerCooldown();
    }

    toggleSwitch(x, y) {
        if (!this.canInteract()) return false;
        const tile = this.grid[y][x];
        if (tile.type === TILE_TYPES.SWITCH) {
            tile.subtype = tile.subtype === 'on' ? 'off' : 'on';
        }
        this.triggerCooldown();
    }

    tick() {
        if (this.gameOver) return;

        this.tickCount++;

        if (this.tickCount >= this.maxTicks) {
            this.gameOver = true;
            return;
        }

        this.calculatePower();
        this.updateOverloads();

        // Random event: Move generator every 100 ticks (~20s)
        if (this.tickCount % 100 === 0) {
            this.moveRandomGenerator();
        }
    }

    moveRandomGenerator() {
         // Pick a random generator
         if (this.generators.length === 0) return;
         const genIndex = Math.floor(this.rand() * this.generators.length);
         const gen = this.generators[genIndex];

         // Find a new spot on the left edge (column 0 or 1) that is empty
         // Simplified: Just try 10 times to find a spot
         for(let i=0; i<10; i++) {
             const ny = Math.floor(this.rand() * this.height);
             const nx = 0; // Keep on left edge for sanity

             if (this.grid[ny][nx].type === TILE_TYPES.EMPTY || this.grid[ny][nx].type === TILE_TYPES.WIRE) {
                 // Move
                 const oldVal = this.grid[gen.y][gen.x].value;

                 // Reset old tile to empty
                 this.grid[gen.y][gen.x] = this.createTile(TILE_TYPES.EMPTY);

                 // Set new tile
                 this.grid[ny][nx] = this.createTile(TILE_TYPES.GENERATOR);
                 this.grid[ny][nx].value = oldVal;

                 // Update ref
                 this.generators[genIndex] = {x: nx, y: ny};
                 return;
             }
         }
    }

    calculatePower() {
        // 1. Reset all power and update connections
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].power = 0;

                // Update connections based on dynamic state (rotation)
                const tile = this.grid[y][x];
                if (tile.type === TILE_TYPES.WIRE) {
                    tile.connections = this.getRotatedConnections(BASE_CONNECTIVITY[tile.subtype], tile.rotation);
                } else if (tile.type === TILE_TYPES.GENERATOR) {
                    // Generators output to all sides
                    tile.connections = [1, 1, 1, 1];
                } else if (tile.type === TILE_TYPES.SINK) {
                    // Sinks connect to all sides
                    tile.connections = [1, 1, 1, 1];
                } else if (tile.type === TILE_TYPES.BREAKER) {
                     tile.connections = this.getRotatedConnections(BASE_CONNECTIVITY['straight'], tile.rotation);
                } else if (tile.type === TILE_TYPES.SWITCH) {
                     if (tile.subtype === 'on') {
                         tile.connections = this.getRotatedConnections(BASE_CONNECTIVITY['straight'], tile.rotation);
                     } else {
                         tile.connections = [0, 0, 0, 0];
                     }
                } else {
                    tile.connections = [0, 0, 0, 0];
                }

                // If broken, no connections
                if (tile.health <= 0) {
                    tile.connections = [0, 0, 0, 0];
                }
            }
        }

        // 2. BFS from Generators
        let queue = [];

        // Add all generators
        for (const genPos of this.generators) {
            const gen = this.grid[genPos.y][genPos.x];
            // Generators start with their output value
            // We don't set gen.power yet, that's for display/overload checking.
            // We push the initial pulses.

            const neighbors = getNeighbors(genPos.x, genPos.y, this.width, this.height);
            for (const n of neighbors) {
                let exitSide;
                if (n.dir === 'up') exitSide = 0;
                if (n.dir === 'right') exitSide = 1;
                if (n.dir === 'down') exitSide = 2;
                if (n.dir === 'left') exitSide = 3;

                if (gen.connections[exitSide]) {
                    queue.push({x: n.x, y: n.y, inputPower: gen.value, source: genPos});
                }
            }

            // Generator self-power for display
            gen.power = gen.value;
        }

        let activePulses = queue;
        const MAX_STEPS = 50;
        let step = 0;

        while (activePulses.length > 0 && step < MAX_STEPS) {
            const nextPulses = [];
            const tilePulses = {}; // Map coordinates to list of pulses

            for (const p of activePulses) {
                const key = `${p.x},${p.y}`;
                if (!tilePulses[key]) {
                    tilePulses[key] = [];
                }
                tilePulses[key].push(p);
            }

            // Apply inputs to tiles
            for (const key in tilePulses) {
                const [tx, ty] = key.split(',').map(Number);
                const tile = this.grid[ty][tx];
                const pulses = tilePulses[key];

                if (tile.type === TILE_TYPES.EMPTY) continue;
                if (tile.health <= 0) continue;

                let validTotalInput = 0;
                let validSources = [];

                for(const p of pulses) {
                    const source = p.source;
                    // Where is source relative to me?
                    let fromDir = null;
                    if (source.x === tx && source.y === ty - 1) fromDir = 'up'; // Source is above me
                    if (source.x === tx && source.y === ty + 1) fromDir = 'down';
                    if (source.x === tx - 1 && source.y === ty) fromDir = 'left';
                    if (source.x === tx + 1 && source.y === ty) fromDir = 'right';

                    if (!fromDir) continue;

                    // My connection index required to accept input:
                    // If source is UP, I must connect UP(0).
                    let myConnIdx = -1;
                    if (fromDir === 'up') myConnIdx = 0;
                    if (fromDir === 'right') myConnIdx = 1;
                    if (fromDir === 'down') myConnIdx = 2;
                    if (fromDir === 'left') myConnIdx = 3;

                    if (tile.connections[myConnIdx]) {
                        validTotalInput += p.inputPower;
                        validSources.push(source);
                    }
                }

                validTotalInput = Math.floor(validTotalInput);

                // Generators have fixed output state, ignore inputs for propagation
                if (tile.type === TILE_TYPES.GENERATOR) {
                    validTotalInput = tile.value;
                }

                if (validTotalInput <= 0) continue;

                // Accumulate power (load) for the tick
                tile.power += validTotalInput;

                // Calculate outputs
                const neighbors = getNeighbors(tx, ty, this.width, this.height);
                let validOutputs = [];

                for (const n of neighbors) {
                    let myExit;
                    if (n.dir === 'up') myExit = 0;
                    if (n.dir === 'right') myExit = 1;
                    if (n.dir === 'down') myExit = 2;
                    if (n.dir === 'left') myExit = 3;

                    if (!tile.connections[myExit]) continue;

                    // Don't flow back to where we got power this tick
                    const isSource = validSources.some(s => s.x === n.x && s.y === n.y);
                    if (isSource) continue;

                    validOutputs.push(n);
                }

                if (validOutputs.length > 0) {
                    const outputPerPath = Math.floor(validTotalInput / validOutputs.length);
                    if (outputPerPath > 0) {
                        for (const out of validOutputs) {
                             nextPulses.push({
                                 x: out.x,
                                 y: out.y,
                                 inputPower: outputPerPath,
                                 source: {x: tx, y: ty}
                             });
                        }
                    }
                }

                if (tile.type === TILE_TYPES.SINK) {
                    const absorbed = Math.min(validTotalInput, tile.value);
                    this.score += absorbed;
                }
            }

            activePulses = nextPulses;
            step++;
        }
    }

    updateOverloads() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.grid[y][x];
                if (tile.type === TILE_TYPES.EMPTY) continue;

                if (tile.power > tile.capacity) {
                    tile.state = 'overloaded';
                    tile.health -= 10;
                    if (tile.health <= 0) {
                        tile.health = 0;
                        tile.state = 'broken';
                        tile.type = TILE_TYPES.EMPTY; // Clear it, effectively destroying it
                        tile.power = 0;
                    }
                } else {
                    if (tile.health > 0) tile.state = 'normal';
                }
            }
        }
    }
}
