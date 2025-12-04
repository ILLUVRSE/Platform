// renderer.js
import { TILE_SIZE, GRID_W, GRID_H } from './utils.js';
import { TILE_TYPES, WIRE_VARIANTS } from './engine.js';

export class CircuitRenderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;

        // Scale canvas for high DPI
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = GRID_W * TILE_SIZE * dpr;
        this.canvas.height = GRID_H * TILE_SIZE * dpr;
        this.canvas.style.width = `${GRID_W * TILE_SIZE}px`;
        this.canvas.style.height = `${GRID_H * TILE_SIZE}px`;
        this.ctx.scale(dpr, dpr);

        this.cols = {
            bg: '#1a1a1a',
            grid: '#2a2a2a',
            wire: '#555',
            wireActive: '#00e5ff', // Cyan
            wireOverload: '#ff3300',
            gen: '#00aa00',
            sink: '#0044aa',
            breaker: '#aa6600',
            text: '#fff'
        };
    }

    draw() {
        this.ctx.fillStyle = this.cols.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid lines
        this.ctx.strokeStyle = this.cols.grid;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for(let x=0; x<=GRID_W; x++) {
            this.ctx.moveTo(x*TILE_SIZE, 0);
            this.ctx.lineTo(x*TILE_SIZE, GRID_H*TILE_SIZE);
        }
        for(let y=0; y<=GRID_H; y++) {
            this.ctx.moveTo(0, y*TILE_SIZE);
            this.ctx.lineTo(GRID_W*TILE_SIZE, y*TILE_SIZE);
        }
        this.ctx.stroke();

        // Tiles
        for(let y=0; y<GRID_H; y++) {
            for(let x=0; x<GRID_W; x++) {
                this.drawTile(x, y, this.engine.grid[y][x]);
            }
        }

        // HUD Overlay
        this.ctx.fillStyle = this.cols.text;
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`Score: ${this.engine.score}`, 10, 20);
        this.ctx.fillText(`Time: ${Math.floor(this.engine.tickCount / 10)}s`, 10, 40); // Approx
    }

    drawTile(x, y, tile) {
        const cx = x * TILE_SIZE + TILE_SIZE/2;
        const cy = y * TILE_SIZE + TILE_SIZE/2;
        const s = TILE_SIZE;

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(tile.rotation * Math.PI / 2);

        // Base Type
        if (tile.type === TILE_TYPES.GENERATOR) {
            this.ctx.fillStyle = this.cols.gen;
            this.ctx.fillRect(-s/2 + 4, -s/2 + 4, s - 8, s - 8);
            // Label
            this.ctx.rotate(-tile.rotation * Math.PI / 2); // Unrotate text
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("GEN", 0, 4);
            this.ctx.fillText(tile.value, 0, 16);
        }
        else if (tile.type === TILE_TYPES.SINK) {
            this.ctx.fillStyle = this.cols.sink;
            this.ctx.fillRect(-s/2 + 4, -s/2 + 4, s - 8, s - 8);
             // Label
            this.ctx.rotate(-tile.rotation * Math.PI / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("SINK", 0, 4);
            this.ctx.fillText(`${tile.power}/${tile.value}`, 0, 16);
        }
        else if (tile.type === TILE_TYPES.WIRE || tile.type === TILE_TYPES.BREAKER || tile.type === TILE_TYPES.SWITCH) {
            // Determine Color based on power/state
            let color = this.cols.wire;
            if (tile.power > 0) color = this.cols.wireActive;
            if (tile.state === 'overloaded') color = this.cols.wireOverload;

            // Draw Connections
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 6;
            if (tile.type === TILE_TYPES.BREAKER) this.ctx.lineWidth = 10;

            this.ctx.beginPath();

            // Logic based on Subtype
            // Map subtype to connections (unrotated)
            // Straight: Top-Bottom (wait, base definition in engine: Left-Right [0,1,0,1]?)
            // Let's re-read engine.
            // STRAIGHT: [0, 1, 0, 1] -> Right(1), Left(3). So horizontal line.

            const subtype = tile.subtype || 'straight'; // default

            if (subtype === 'straight' || tile.type === TILE_TYPES.BREAKER || tile.type === TILE_TYPES.SWITCH) {
                // Horizontal line (Left-Right)
                this.ctx.moveTo(-s/2, 0);
                this.ctx.lineTo(s/2, 0);

                // Box for component
                if (tile.type === TILE_TYPES.BREAKER) {
                    this.ctx.fillStyle = '#442200';
                    this.ctx.fillRect(-10, -10, 20, 20);
                }
                 if (tile.type === TILE_TYPES.SWITCH) {
                     this.ctx.fillStyle = tile.subtype === 'on' ? '#00cc00' : '#cc0000';
                    this.ctx.fillRect(-8, -8, 16, 16);
                }
            } else if (subtype === 'corner') {
                // Top-Right [1,1,0,0]
                this.ctx.moveTo(0, -s/2);
                this.ctx.lineTo(0, 0);
                this.ctx.lineTo(s/2, 0);
            } else if (subtype === 't_shape') {
                // Right-Down-Left [0,1,1,1]
                this.ctx.moveTo(-s/2, 0);
                this.ctx.lineTo(s/2, 0); // Horiz
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(0, s/2); // Down
            } else if (subtype === 'cross') {
                this.ctx.moveTo(-s/2, 0);
                this.ctx.lineTo(s/2, 0);
                this.ctx.moveTo(0, -s/2);
                this.ctx.lineTo(0, s/2);
            }

            this.ctx.stroke();

            // Show Power Number (Debug/Info)
            if (tile.power > 0) {
                this.ctx.rotate(-tile.rotation * Math.PI / 2);
                this.ctx.fillStyle = '#000';
                this.ctx.font = '10px monospace';
                this.ctx.fillText(tile.power, 0, -10);
            }
        }
        else if (tile.health <= 0 && tile.state === 'broken') {
             this.ctx.fillStyle = '#333';
             this.ctx.fillText("X", 0, 0);
        }

        this.ctx.restore();
    }
}
