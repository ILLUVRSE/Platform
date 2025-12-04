import { MathUtils } from './utils.js';
import { TILE } from './generator.js';
import { SFX } from './sfx.js';

const CONSTANTS = {
    MAX_SPEED: 0.2, // Tiles per tick
    ACCEL: 0.004,
    BRAKE: 0.008,
    DRAG_ROAD: 0.97,
    DRAG_OFFROAD: 0.85,
    DRAG_MUD: 0.90,
    DRAG_DRIFT: 0.98, // Slide more when drifting
    TURN_SPEED: 0.07,
    DRIFT_TURN_MOD: 1.3, // Turn sharper while drifting
    BOOST_FORCE: 0.3,
    JUMP_DURATION: 40, // Ticks
    MIN_DRIFT_TIME: 60, // Ticks to get boost
};

export class Kart {
    constructor(startPos) {
        this.reset(startPos);
    }

    reset(startPos) {
        this.x = startPos.x + 0.5;
        this.y = startPos.y + 0.5;
        this.angle = startPos.angle || 0;
        this.vx = 0;
        this.vy = 0;

        // Drifting state
        this.isDrifting = false;
        this.driftDirection = 0; // -1 left, 1 right
        this.driftTime = 0;

        // Airborne
        this.z = 0; // Height
        this.vz = 0;
        this.isJumping = false;

        // Checkpoints
        this.nextCheckpointIndex = 0;
        this.lap = 0;
        this.lapTimes = [];
        this.currentLapTime = 0;
        this.finished = false;
    }

    update(input, map, dt) {
        if (this.finished) {
            // AI autopilot or just stop
            this.vx *= 0.9;
            this.vy *= 0.9;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            return;
        }

        const tileX = Math.floor(this.x);
        const tileY = Math.floor(this.y);

        // 1. Get Surface Properties
        let surfaceDrag = CONSTANTS.DRAG_ROAD;
        let isOffroad = false;
        let onMud = false;

        // Check bounds
        if (tileY >= 0 && tileY < map.rows && tileX >= 0 && tileX < map.cols) {
            const tile = map.grid[tileY][tileX];

            if (tile === TILE.GRASS || tile === TILE.WALL) {
                isOffroad = true;
                surfaceDrag = CONSTANTS.DRAG_OFFROAD;
            } else if (tile === TILE.MUD) {
                onMud = true;
                surfaceDrag = CONSTANTS.DRAG_MUD;
            } else if (tile === TILE.BOOST) {
                // Apply instant boost if not already super fast
                const speed = Math.hypot(this.vx, this.vy);
                if (speed < CONSTANTS.MAX_SPEED * 1.5) {
                    this.vx += Math.cos(this.angle) * 0.02 * dt;
                    this.vy += Math.sin(this.angle) * 0.02 * dt;
                    SFX.playBoost();
                }
            } else if (tile === TILE.JUMP && !this.isJumping) {
                this.isJumping = true;
                this.vz = 0.2; // Launch
                SFX.playBoost(); // Jump sound
            }
        } else {
            isOffroad = true;
            surfaceDrag = CONSTANTS.DRAG_OFFROAD;
        }

        // 2. Handle Jumping logic
        if (this.isJumping) {
            this.z += this.vz * dt;
            this.vz -= 0.01 * dt; // Gravity
            if (this.z <= 0) {
                this.z = 0;
                this.isJumping = false;
                this.vz = 0;
                SFX.playBump();
            }
        }

        // 3. Acceleration & Steering
        const speed = Math.hypot(this.vx, this.vy);

        // Drifting Logic
        // Initiate drift: Hops + turning + speed threshold
        if (input.drift && !this.isDrifting && speed > 0.05 && !this.isJumping) {
            if (input.left || input.right) {
                this.isDrifting = true;
                this.driftDirection = input.left ? -1 : 1;
                this.driftTime = 0;
                // Small hop
                this.z = 0.1;
                this.vz = 0.05;
                this.isJumping = true; // Visual hop
            }
        } else if ((!input.drift || speed < 0.05) && this.isDrifting) {
            // Exit drift
            this.isDrifting = false;
            // Mini-turbo
            if (this.driftTime > CONSTANTS.MIN_DRIFT_TIME) {
                const boost = CONSTANTS.BOOST_FORCE * 0.2;
                this.vx += Math.cos(this.angle) * boost;
                this.vy += Math.sin(this.angle) * boost;
                SFX.playBoost();
            }
            this.driftTime = 0;
        }

        if (this.isDrifting) {
            this.driftTime += dt;
            surfaceDrag = CONSTANTS.DRAG_DRIFT;
            if(isOffroad) surfaceDrag = CONSTANTS.DRAG_OFFROAD; // Drift doesn't save you from grass
        }

        // Turning
        if (speed > 0.01) { // Can't turn if not moving
            let turn = 0;
            if (input.left) turn = -1;
            if (input.right) turn = 1;

            // Reverse steering
            const direction = (input.down && !input.up) ? -1 : 1;

            let turnRate = CONSTANTS.TURN_SPEED;
            if (this.isDrifting) turnRate *= CONSTANTS.DRIFT_TURN_MOD;
            if (onMud) turnRate *= 0.5;

            this.angle += turn * turnRate * direction * dt * (speed / CONSTANTS.MAX_SPEED);
        }

        // Gas / Brake
        if (input.up) {
            this.vx += Math.cos(this.angle) * CONSTANTS.ACCEL * dt;
            this.vy += Math.sin(this.angle) * CONSTANTS.ACCEL * dt;
        } else if (input.down) {
            this.vx -= Math.cos(this.angle) * CONSTANTS.BRAKE * dt;
            this.vy -= Math.sin(this.angle) * CONSTANTS.BRAKE * dt;
        }

        // 4. Apply Physics (Drag & Integration)
        this.vx *= Math.pow(surfaceDrag, dt);
        this.vy *= Math.pow(surfaceDrag, dt);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Collision with Walls (Simple bounce)
        if (map.grid[tileY] && map.grid[tileY][tileX] === TILE.WALL && !this.isJumping) {
            this.x -= this.vx * dt; // Undo move
            this.y -= this.vy * dt;
            this.vx *= -0.5;
            this.vy *= -0.5;
            SFX.playBump();
        }

        // 5. Checkpoints & Laps
        this.handleCheckpoints(map, dt);
    }

    handleCheckpoints(map, dt) {
        if (this.finished) return;

        this.currentLapTime += (16.66 * dt); // Approx ms

        // Check distance to next checkpoint
        const nextCP = map.checkpoints[this.nextCheckpointIndex];
        if (!nextCP) return; // Should not happen

        const dist = MathUtils.dist(this.x, this.y, nextCP.x + 0.5, nextCP.y + 0.5);
        if (dist < 1.5) { // Within 1.5 tiles
            this.nextCheckpointIndex++;
            SFX.playBump(); // reuse bump for CP sound for now, or add chime

            // Lap complete?
            if (this.nextCheckpointIndex >= map.checkpoints.length) {
                // Must also be near start/finish line?
                // In this simplified model, the last checkpoint IS the finish requirement
                // But usually we want to cross the line.
                // Let's say checkpoinst are 0..N-1, and N is back to start.

                // Let's simplify: Checkpoints guide the player.
                // Must cross start line tile to finish lap ONLY IF all checkpoints hit.
            }
        }

        // Check start/finish line crossing
        const tileX = Math.floor(this.x);
        const tileY = Math.floor(this.y);
        if (map.grid[tileY] && map.grid[tileY][tileX] === TILE.START) {
            if (this.nextCheckpointIndex >= map.checkpoints.length) {
                // Lap Finished
                this.lap++;
                this.lapTimes.push(this.currentLapTime);
                this.currentLapTime = 0;
                this.nextCheckpointIndex = 0;

                // Flash message
                // console.log("Lap " + this.lap + " Time: " + this.lapTimes[this.lapTimes.length-1]);
            }
        }
    }
}

export class Engine {
    constructor() {
        this.karts = [];
        this.map = null;
        this.state = 'MENU'; // MENU, RUNNING, FINISHED
        this.totalLaps = 3;
    }

    loadMap(mapData) {
        this.map = mapData;
    }

    addKart(kart) {
        this.karts.push(kart);
    }

    update(dt) {
        // SFX Update
        const player = this.karts[0];
        if (player) {
            const speed = Math.hypot(player.vx, player.vy);
            SFX.updateEngine(Math.min(speed / CONSTANTS.MAX_SPEED, 1.0));

            if (player.isDrifting) {
                if (Math.random() > 0.8) SFX.playDrift();
            }
        }
    }
}
