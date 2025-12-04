// input.js
import { TILE_SIZE, GRID_W, GRID_H } from './utils.js';
import { TILE_TYPES, WIRE_VARIANTS } from './engine.js';

export class InputHandler {
    constructor(canvas, engine, renderer) {
        this.canvas = canvas;
        this.engine = engine;
        this.renderer = renderer;

        // State
        this.selectedType = TILE_TYPES.WIRE;
        this.selectedSubtype = WIRE_VARIANTS.STRAIGHT;
        this.selectedRotation = 0;

        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scroll
            const touch = e.changedTouches[0];
            // Simulate mouse event
            this.handleClick({
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0, // Left click
                target: this.canvas
            });
        }, { passive: false });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.selectedRotation = (this.selectedRotation + 1) % 4;
            }
            if (e.key === '1') { this.selectedType = TILE_TYPES.WIRE; this.selectedSubtype = WIRE_VARIANTS.STRAIGHT; }
            if (e.key === '2') { this.selectedType = TILE_TYPES.WIRE; this.selectedSubtype = WIRE_VARIANTS.CORNER; }
            if (e.key === '3') { this.selectedType = TILE_TYPES.WIRE; this.selectedSubtype = WIRE_VARIANTS.T_SHAPE; }
            if (e.key === '4') { this.selectedType = TILE_TYPES.WIRE; this.selectedSubtype = WIRE_VARIANTS.CROSS; }
            if (e.key === '5') { this.selectedType = TILE_TYPES.BREAKER; }
            if (e.key === '6') { this.selectedType = TILE_TYPES.SWITCH; }
        });
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width; // Should be handled by DPR
        // Actually event coordinates are in CSS pixels, need to map to grid

        const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;

        if (e.button === 0) { // Left Click
            // Interaction depends on existing tile
            const existing = this.engine.grid[y][x];

            if (existing.type === TILE_TYPES.SWITCH) {
                this.engine.toggleSwitch(x, y);
                return;
            }
            if (existing.type === TILE_TYPES.WIRE || existing.type === TILE_TYPES.BREAKER) {
                // Rotate existing
                this.engine.rotateTile(x, y);
                return;
            }

            // Place new
            if (this.selectedType === TILE_TYPES.WIRE) {
                this.engine.placeWire(x, y, this.selectedSubtype, this.selectedRotation);
            } else if (this.selectedType === TILE_TYPES.BREAKER || this.selectedType === TILE_TYPES.SWITCH) {
                this.engine.placeComponent(x, y, this.selectedType, this.selectedRotation);
            }

        } else if (e.button === 2) { // Right Click
            this.engine.removeTile(x, y);
        }
    }
}
