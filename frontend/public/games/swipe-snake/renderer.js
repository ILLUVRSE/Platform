import { TILE } from './engine.js';

export class Renderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;

        // Theme Colors
        this.colors = {
            bg: '#071218',
            floor: '#083234',
            wall: '#122326',
            snakeHead: '#7fffd4',
            snakeBody: '#00D1B2',
            food: '#FFD166',
            highlight: 'rgba(255, 255, 255, 0.2)'
        };

        this.tileSize = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.selection = null; // { idx: number } or null
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const size = Math.min(parent.clientWidth, parent.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.tileSize = size / this.engine.width;

        this.render();
    }

    setSelection(idx) {
        this.selection = idx;
        this.render();
    }

    render() {
        if (!this.ctx) return;

        // Clear
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const pad = 1; // 1px padding for grid look

        // Draw Grid
        for (let i = 0; i < this.engine.grid.length; i++) {
            const pos = this.engine.xy(i);
            const x = pos.x * this.tileSize;
            const y = pos.y * this.tileSize;
            const size = this.tileSize;

            const type = this.engine.grid[i];

            // Base Tile
            if (type === TILE.WALL) {
                this.ctx.fillStyle = this.colors.wall;
            } else {
                this.ctx.fillStyle = this.colors.floor;
            }
            this.ctx.fillRect(x + pad, y + pad, size - pad*2, size - pad*2);

            // A11y / Details
            if (type === TILE.WALL) {
                this.ctx.fillStyle = 'rgba(255,255,255,0.05)';
                this.ctx.fillRect(x + pad + 4, y + pad + 4, size - pad*2 - 8, size - pad*2 - 8);
                // Hash pattern
                this.ctx.strokeStyle = '#2A3C40';
                this.ctx.beginPath();
                this.ctx.moveTo(x + pad, y + pad);
                this.ctx.lineTo(x + size - pad, y + size - pad);
                this.ctx.stroke();
            } else if (type === TILE.FOOD) {
                // Drawn below with snake layer usually? Or here.
                // Let's draw food here.
                const cx = x + size/2;
                const cy = y + size/2;
                const r = size * 0.3;

                this.ctx.fillStyle = this.colors.food;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
                this.ctx.fill();

                // Glow
                this.ctx.shadowColor = this.colors.food;
                this.ctx.shadowBlur = 10;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }

            // Selection Highlight
            if (this.selection === i) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(x, y, size, size);
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x+1, y+1, size-2, size-2);
            }
        }

        // Draw Snake
        // Draw from tail to head
        for (let i = this.engine.snake.length - 1; i >= 0; i--) {
            const idx = this.engine.snake[i];
            const pos = this.engine.xy(idx);
            const x = pos.x * this.tileSize;
            const y = pos.y * this.tileSize;
            const size = this.tileSize;

            const isHead = (i === 0);

            this.ctx.fillStyle = isHead ? this.colors.snakeHead : this.colors.snakeBody;

            // Simple Rect for now, connect adjacent segments later for polish
            const s = size * 0.8;
            const offset = (size - s) / 2;
            this.ctx.fillRect(x + offset, y + offset, s, s);

            if (isHead) {
                // Eyes
                this.ctx.fillStyle = '#000';
                const eyeSize = s * 0.15;
                // Determine direction for eyes?
                // Just generic eyes for now
                 this.ctx.fillRect(x + offset + s*0.2, y + offset + s*0.2, eyeSize, eyeSize);
                 this.ctx.fillRect(x + offset + s*0.6, y + offset + s*0.2, eyeSize, eyeSize);
            }
        }
    }
}
