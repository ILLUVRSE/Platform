import { WHEEL_SECTORS } from './engine.js';

export class Renderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;

        // Font setup
        this.ctx.font = 'bold 20px monospace';

        this.wheelRadius = 0;
        this.centerX = 0;
        this.centerY = 0;
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;

        // Layout: Wheel on Left (or Top on mobile), Board on Right/Center
        const isLandscape = this.canvas.width > this.canvas.height;

        if (isLandscape) {
            this.wheelRadius = this.canvas.height * 0.4;
            this.centerX = this.wheelRadius + 20;
            this.centerY = this.canvas.height / 2;
        } else {
            // Portrait
            this.wheelRadius = this.canvas.width * 0.35;
            this.centerX = this.canvas.width / 2;
            this.centerY = this.wheelRadius + 20;
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#004d40'; // Dark Teal Theme
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawWheel();
        this.drawBoard();
        this.drawHUD();
        this.drawControls();
    }

    drawWheel() {
        const ctx = this.ctx;
        const cx = this.centerX;
        const cy = this.centerY;
        const r = this.wheelRadius;
        const numSectors = WHEEL_SECTORS.length;
        const arc = (Math.PI * 2) / numSectors;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.engine.wheelAngle);

        for (let i = 0; i < numSectors; i++) {
            const sector = WHEEL_SECTORS[i];
            const angle = i * arc;

            ctx.beginPath();
            ctx.fillStyle = sector.color;
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, r, angle, angle + arc);
            ctx.lineTo(0, 0);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.save();
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = sector.textColor || '#000';
            ctx.font = `bold ${r/10}px sans-serif`;
            const text = sector.label || (sector.value > 0 ? "$" + sector.value : "");
            ctx.fillText(text, r - 10, 5);
            ctx.restore();
        }

        // Center cap
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Pointer (Fixed at top/12 o'clock relative to canvas, which is -PI/2)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-10, -r + 10);
        ctx.lineTo(10, -r + 10);
        ctx.lineTo(0, -r - 10);
        ctx.fill();
        ctx.restore();
    }

    drawBoard() {
        if (!this.engine.puzzle) return;

        const ctx = this.ctx;
        const isLandscape = this.canvas.width > this.canvas.height;

        // Calculate board area
        let boardX, boardY, boardW, boardH;
        if (isLandscape) {
            boardX = this.centerX + this.wheelRadius + 20;
            boardY = 50;
            boardW = this.canvas.width - boardX - 20;
            boardH = this.canvas.height * 0.6;
        } else {
            boardX = 20;
            boardY = this.centerY + this.wheelRadius + 20;
            boardW = this.canvas.width - 40;
            boardH = this.canvas.height * 0.3;
        }

        // Draw puzzle tiles
        const text = this.engine.puzzle.text;
        const grid = this.engine.puzzle.grid; // Lines array

        // Determine tile size based on max line length
        const maxLineLen = Math.max(...grid.map(l => l.length));
        const tileSize = Math.min(boardW / (maxLineLen + 2), boardH / (grid.length + 2));

        const totalW = maxLineLen * tileSize;
        const totalH = grid.length * tileSize;
        const startX = boardX + (boardW - totalW) / 2;
        const startY = boardY + (boardH - totalH) / 2;

        let charIndex = 0; // To track global index in original text (ignoring spaces logic if simple... actually spaces count)
        // Wait, text is one string, grid is lines.
        // We need to map back to original indices to check revealed status.
        // Let's iterate original text and flow it.

        let cursorX = startX;
        let cursorY = startY;

        // Re-flow logic must match engine's grid creation?
        // Actually, let's just use the grid lines and assume they map sequentially.
        // This is tricky if engine just splits by space.
        // Let's assume the engine grid creation is the source of truth for display.
        // We need to know which character in the grid corresponds to which in the linear text string for `revealed` array.

        let globalIdx = 0;

        ctx.font = `bold ${tileSize * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let line of grid) {
            // Center each line?
            const lineWidth = line.length * tileSize;
            let lineX = startX + (totalW - lineWidth) / 2;

            for (let char of line) {
                 if (char !== ' ') {
                     // Draw Tile
                     ctx.fillStyle = '#fdfbf7'; // Cream
                     ctx.fillRect(lineX, cursorY, tileSize - 2, tileSize - 2);
                     ctx.strokeStyle = '#000';
                     ctx.strokeRect(lineX, cursorY, tileSize - 2, tileSize - 2);

                     // Draw Letter if revealed
                     // Find index in original text... this is fragile if we don't track it.
                     // Let's just scan ahead in original text skipping spaces until we match char?
                     // Assuming text structure matches grid structure perfectly.
                     while(this.engine.puzzle.text[globalIdx] === ' ') globalIdx++;

                     if (this.engine.revealed[globalIdx]) {
                         ctx.fillStyle = '#000';
                         ctx.fillText(char, lineX + tileSize/2, cursorY + tileSize/2);
                     }
                     globalIdx++;
                 }
                 lineX += tileSize;
            }
            cursorY += tileSize;
        }
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = '#ffd700'; // Gold
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`CASH: $${this.engine.roundCash}`, 20, 30);
        ctx.fillText(`SCORE: ${this.engine.score}`, 200, 30);

        // Message Bar
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(this.engine.message, this.canvas.width / 2, this.canvas.height - 100);
    }

    drawControls() {
        // Only if interaction needed?
        // Input logic is mostly keyboard or overlaid HTML buttons?
        // Let's draw a visual indicator of Spin state
        /*
        const ctx = this.ctx;
        if (this.engine.state === 'SPIN') {
             ctx.fillStyle = 'rgba(255,255,255,0.2)';
             ctx.beginPath();
             ctx.arc(this.centerX, this.centerY, this.wheelRadius, 0, Math.PI*2);
             ctx.fill();
             ctx.fillStyle = '#fff';
             ctx.fillText("TAP TO SPIN", this.centerX, this.centerY);
        }
        */
    }
}
