import { TILE } from './generator.js';
import { MathUtils } from './utils.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize
        this.width = canvas.width;
        this.height = canvas.height;
        this.tileSize = 40; // Default

        // Camera
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1.0;

        // Particles
        this.particles = [];

        // Colors
        this.colors = {
            [TILE.GRASS]: '#004d40', // Dark Teal
            [TILE.ROAD]: '#4e5d6c', // Asphalt Grey
            [TILE.START]: '#ffffff', // Checkered logic handled in draw
            [TILE.BOOST]: '#009688', // Teal accent
            [TILE.MUD]: '#5d4037', // Brown
            [TILE.JUMP]: '#ffc107', // Amber
            [TILE.WALL]: '#263238', // Dark Grey
        };
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Adjust zoom based on screen size?
        // Mobile needs bigger tiles relative to screen
        this.tileSize = Math.min(this.width / 12, this.height / 8);
        // Clamp tileSize
        if (this.tileSize < 32) this.tileSize = 32;
        if (this.tileSize > 80) this.tileSize = 80;
    }

    draw(engine, dt) {
        const { ctx, width, height } = this;
        const player = engine.karts[0];

        if (!player) return;

        // Update Camera (Smooth Follow)
        // Target is player position in pixels
        const targetX = player.x * this.tileSize;
        const targetY = player.y * this.tileSize;

        // Lerp camera
        this.camX = MathUtils.lerp(this.camX, targetX - width / 2, 0.1);
        this.camY = MathUtils.lerp(this.camY, targetY - height / 2, 0.1);

        // Clear
        ctx.fillStyle = '#00251a'; // Deep background
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(-this.camX, -this.camY);

        // Draw Map
        this.drawMap(engine.map);

        // Draw Particles (Under karts?)
        this.drawParticles(dt);

        // Draw Ghost
        if (engine.ghostKart && engine.ghostKart.active) {
            this.drawKart(engine.ghostKart, true);
        }

        // Draw Player
        this.drawKart(player, false);

        ctx.restore();
    }

    drawMap(map) {
        if (!map) return;
        const { ctx, tileSize } = this;

        // Optimization: Only draw visible tiles?
        // For MVP 20x12 grid, drawing all is fine.

        for (let y = 0; y < map.rows; y++) {
            for (let x = 0; x < map.cols; x++) {
                const tile = map.grid[y][x];
                const px = x * tileSize;
                const py = y * tileSize;

                ctx.fillStyle = this.colors[tile] || '#000';
                ctx.fillRect(px, py, tileSize, tileSize);

                // Detail / Texture
                if (tile === TILE.START) {
                    // Checkered pattern
                    ctx.fillStyle = '#000';
                    ctx.fillRect(px, py, tileSize/2, tileSize/2);
                    ctx.fillRect(px + tileSize/2, py + tileSize/2, tileSize/2, tileSize/2);
                } else if (tile === TILE.BOOST) {
                    // Chevrons
                    ctx.fillStyle = '#80cbc4';
                    ctx.beginPath();
                    ctx.moveTo(px + tileSize*0.2, py + tileSize*0.8);
                    ctx.lineTo(px + tileSize*0.5, py + tileSize*0.2);
                    ctx.lineTo(px + tileSize*0.8, py + tileSize*0.8);
                    ctx.fill();
                } else if (tile === TILE.JUMP) {
                    // Ramp lines
                    ctx.strokeStyle = '#fff3e0';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(px, py + tileSize);
                    ctx.lineTo(px + tileSize, py + tileSize);
                    ctx.moveTo(px, py + tileSize*0.7);
                    ctx.lineTo(px + tileSize, py + tileSize*0.7);
                    ctx.stroke();
                } else if (tile === TILE.ROAD) {
                    // Curb
                    // ctx.strokeStyle = '#fff';
                    // ctx.strokeRect(px, py, tileSize, tileSize);
                }
            }
        }
    }

    drawKart(kart, isGhost) {
        const { ctx, tileSize } = this;
        const px = kart.x * tileSize;
        const py = kart.y * tileSize; // Visual position
        const pz = (kart.z || 0) * tileSize; // Height offset

        ctx.save();
        ctx.translate(px, py - pz);

        // Shadow (if jumping)
        if (pz > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, pz, tileSize*0.3, tileSize*0.3, 0, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.rotate(kart.angle);

        // Kart Body
        ctx.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.4)' : '#ffd700'; // Gold for player
        ctx.beginPath();
        // Simple shape: Triangle/Arrow
        // Length 0.6 tile, Width 0.4
        const L = tileSize * 0.6;
        const W = tileSize * 0.3;

        ctx.rect(-L/2, -W/2, L, W);
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#000';
        ctx.fillRect(-L/2 + 2, -W/2 - 4, tileSize*0.15, 4); // Rear L
        ctx.fillRect(-L/2 + 2, W/2, tileSize*0.15, 4);      // Rear R
        ctx.fillRect(L/2 - 8, -W/2 - 4, tileSize*0.15, 4);  // Front L
        ctx.fillRect(L/2 - 8, W/2, tileSize*0.15, 4);       // Front R

        // Driver Head (Circle)
        ctx.fillStyle = isGhost ? 'rgba(200,200,200,0.5)' : '#fff';
        ctx.beginPath();
        ctx.arc(-5, 0, tileSize*0.12, 0, Math.PI*2);
        ctx.fill();

        // Drift Sparks
        if (kart.isDrifting && !isGhost) {
            const color = kart.driftTime > 60 ? '#ff5252' : '#ffab40'; // Red/Orange
            ctx.fillStyle = color;
            ctx.beginPath();
            // Emit sparks from rear wheels
            const yOffset = kart.driftDirection * W/2;
            ctx.arc(-L/2, yOffset, 4 + Math.random()*4, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Simple particle system for later polish
    spawnParticle(x, y, color) {}
    drawParticles(dt) {}
}
