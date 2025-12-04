// renderer.js
export class Renderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;

    // Config
    this.tileSize = 40;
    this.gridOffsetX = 20;
    this.gridOffsetY = 60;
  }

  resize() {
    // Basic responsiveness
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;

    // Fit 10x10 grid plus UI
    // Target logical width: 10 * 40 + 40 = 440
    // Target logical height: 10 * 40 + 100 = 500

    // Maintain aspect ratio or scale
    this.canvas.width = 440;
    this.canvas.height = 600;
  }

  draw() {
    // Clear
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();
    this.drawGoals();
    this.drawBlocks();
    this.drawCurrentPiece();
    this.drawUI();
    this.drawGravity();
  }

  drawGrid() {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;

    for (let r = 0; r <= this.engine.rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.gridOffsetX, this.gridOffsetY + r * this.tileSize);
      this.ctx.lineTo(this.gridOffsetX + this.engine.cols * this.tileSize, this.gridOffsetY + r * this.tileSize);
      this.ctx.stroke();
    }

    for (let c = 0; c <= this.engine.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.gridOffsetX + c * this.tileSize, this.gridOffsetY);
      this.ctx.lineTo(this.gridOffsetX + c * this.tileSize, this.gridOffsetY + this.engine.rows * this.tileSize);
      this.ctx.stroke();
    }
  }

  drawGoals() {
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;

    this.engine.goals.forEach(g => {
        const x = this.gridOffsetX + g.c * this.tileSize;
        const y = this.gridOffsetY + g.r * this.tileSize;

        this.ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        this.ctx.strokeRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
    });
  }

  drawBlocks() {
    this.engine.blocks.forEach(b => {
      this.ctx.fillStyle = b.color || '#888';
      const x = this.gridOffsetX + b.c * this.tileSize;
      const y = this.gridOffsetY + b.r * this.tileSize;

      // Interpolation could go here using engine.state.lastTick time
      // For now, draw static

      this.ctx.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);

      // Draw 3D effect
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.fillRect(x+1, y+1, this.tileSize-2, 4);
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fillRect(x+1, y+this.tileSize-5, this.tileSize-2, 4);
    });
  }

  drawCurrentPiece() {
    if (!this.engine.currentPiece) return;

    const p = this.engine.currentPiece;
    // ghost or preview?

    // Draw actual piece
    this.ctx.fillStyle = p.shape.color;
    p.shape.cells.forEach(cell => {
        const c = p.col + cell.c;
        const r = p.row + cell.r;

        // Don't draw if outside grid (top spawn area)
        if (r < 0) {
            // Draw slightly faded or clip?
            // We'll draw it anyway for spawn visibility
        }

        const x = this.gridOffsetX + c * this.tileSize;
        const y = this.gridOffsetY + r * this.tileSize;

        this.ctx.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
    });
  }

  drawGravity() {
      const g = this.engine.gravity;
      const x = this.canvas.width - 50;
      const y = 30;

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '20px monospace';
      this.ctx.fillText("G", x, y);

      // Draw arrow
      this.ctx.strokeStyle = '#00E5FF';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();

      const cx = x + 20;
      const cy = y - 5;

      if (g.x === 0 && g.y === 1) { // Down
          this.ctx.moveTo(cx, cy - 10); this.ctx.lineTo(cx, cy + 10);
          this.ctx.lineTo(cx - 5, cy + 5); this.ctx.moveTo(cx, cy + 10); this.ctx.lineTo(cx + 5, cy + 5);
      } else if (g.x === 0 && g.y === -1) { // Up
          this.ctx.moveTo(cx, cy + 10); this.ctx.lineTo(cx, cy - 10);
          this.ctx.lineTo(cx - 5, cy - 5); this.ctx.moveTo(cx, cy - 10); this.ctx.lineTo(cx + 5, cy - 5);
      } else if (g.x === 1 && g.y === 0) { // Right
          this.ctx.moveTo(cx - 10, cy); this.ctx.lineTo(cx + 10, cy);
          this.ctx.lineTo(cx + 5, cy - 5); this.ctx.moveTo(cx + 10, cy); this.ctx.lineTo(cx + 5, cy + 5);
      } else if (g.x === -1 && g.y === 0) { // Left
          this.ctx.moveTo(cx + 10, cy); this.ctx.lineTo(cx - 10, cy);
          this.ctx.lineTo(cx - 5, cy - 5); this.ctx.moveTo(cx - 10, cy); this.ctx.lineTo(cx - 5, cy + 5);
      }
      this.ctx.stroke();
  }

  drawUI() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px monospace';
    this.ctx.fillText(`Score: ${this.engine.score}`, 20, 30);
    this.ctx.fillText(`Moves: ${this.engine.movesLeft}`, 200, 30);

    if (this.engine.gameOver) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '40px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("GAME OVER", this.canvas.width/2, this.canvas.height/2);
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`Final Score: ${this.engine.score}`, this.canvas.width/2, this.canvas.height/2 + 40);
        this.ctx.textAlign = 'left';
    }
  }

  getBounds() {
      // Export bounds for click handlers
      return {
          gridX: this.gridOffsetX,
          gridY: this.gridOffsetY,
          tileSize: this.tileSize,
          width: this.engine.cols * this.tileSize,
          height: this.engine.rows * this.tileSize
      };
  }
}
