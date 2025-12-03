import { CONSTANTS } from './utils.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.resize();
    // In a real app we might handle resize events, but here we assume fixed logical size
  }

  resize() {
      this.canvas.width = CONSTANTS.CANVAS_WIDTH;
      this.canvas.height = CONSTANTS.CANVAS_HEIGHT;
      this.tileW = this.canvas.width / CONSTANTS.COLS;
      this.tileH = this.canvas.height / CONSTANTS.ROWS;
  }

  render(engine, dt, progress, queuedMove) {
    const ctx = this.ctx;

    // Clear Background
    ctx.fillStyle = '#004d40';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Starfield effect (procedural background)
    // We can use the engine distance/tick to scroll stars slightly slower
    const starOffset = (engine.distance * 0.5 + progress * 0.5) * this.tileW;
    this.drawStars(ctx, starOffset);

    // Draw Grid Columns
    // Shift by progress (0..1) * tileW
    const offsetX = -progress * this.tileW;

    for (let c = 0; c < engine.grid.length; c++) {
        const col = engine.grid[c];
        const x = c * this.tileW + offsetX;

        // Culling
        if (x < -this.tileW || x > this.canvas.width) continue;

        for (let r = 0; r < col.length; r++) {
            const tile = col[r];
            if (tile.type === 'empty') continue;
            this.drawTile(ctx, tile, x, r * this.tileH, this.tileW, this.tileH);
        }
    }

    // Draw Ship
    // Ship is logically at CONSTANTS.SHIP_COL
    const shipX = (CONSTANTS.SHIP_COL * this.tileW) + (this.tileW / 2);

    // Interpolate Y for smooth movement
    // Logical row is engine.shipRow. Target is engine.shipRow + queuedMove.
    const targetRow = Math.max(0, Math.min(CONSTANTS.ROWS - 1, engine.shipRow + queuedMove));
    const currentY = engine.shipRow * this.tileH;
    const targetY = targetRow * this.tileH;
    const interpY = currentY + (targetY - currentY) * progress;

    const shipCenterY = interpY + (this.tileH / 2);

    this.drawShip(ctx, shipX, shipCenterY, this.tileW, this.tileH, engine.shield > 0);
  }

  drawStars(ctx, scrollX) {
      ctx.fillStyle = '#009688';
      // Deterministic stars based on modulo
      for (let i = 0; i < 50; i++) {
          const x = (i * 137 + scrollX * 0.2) % this.canvas.width;
          const y = (i * 233) % this.canvas.height;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(this.canvas.width - x, y, 2, 2);
          ctx.globalAlpha = 1.0;
      }
  }

  drawShip(ctx, x, y, w, h, hasShield) {
      // Body
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      // Triangle pointing right
      ctx.moveTo(x + w*0.4, y);
      ctx.lineTo(x - w*0.3, y - h*0.25);
      ctx.lineTo(x - w*0.3, y + h*0.25);
      ctx.fill();

      // Exhaust
      ctx.fillStyle = '#009688';
      ctx.beginPath();
      ctx.moveTo(x - w*0.3, y);
      ctx.lineTo(x - w*0.5, y - h*0.1);
      ctx.lineTo(x - w*0.5, y + h*0.1);
      ctx.fill();

      if (hasShield) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, w*0.45, 0, Math.PI*2);
          ctx.stroke();
      }
  }

  drawTile(ctx, tile, x, y, w, h) {
      const cx = x + w/2;
      const cy = y + h/2;

      if (tile.type === 'meteor') {
          ctx.fillStyle = '#ff8c42';
          ctx.beginPath();
          ctx.arc(cx, cy, w * 0.35, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = '#a64d19';
          ctx.lineWidth = 2;
          ctx.stroke();
      } else if (tile.type === 'laser') {
          if (tile.state === 'warning') {
              ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
              ctx.lineWidth = 2;
              ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
              // Blink
              if (Date.now() % 200 < 100) {
                  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                  ctx.fillRect(x, y, w, h);
              }
          } else {
              // Firing
              ctx.fillStyle = '#ff0040';
              ctx.fillRect(x, y + h*0.35, w, h*0.3);
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#ff0040';
              ctx.fillRect(x, y + h*0.45, w, h*0.1);
              ctx.shadowBlur = 0;
          }
      } else if (tile.type === 'bounce') {
          ctx.fillStyle = '#009688';
          ctx.beginPath();
          ctx.moveTo(x + w*0.2, y + h*0.8);
          ctx.lineTo(x + w*0.8, y + h*0.8);
          ctx.lineTo(x + w*0.5, y + h*0.2);
          ctx.fill();
      } else if (tile.type === 'pickup') {
           if (tile.variant === 'shield') {
              ctx.strokeStyle = '#00ffff';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(cx, cy, w*0.25, 0, Math.PI*2);
              ctx.stroke();
          } else if (tile.variant === 'portal') {
              ctx.fillStyle = '#9c27b0';
              ctx.beginPath();
              ctx.arc(cx, cy, w*0.3, 0, Math.PI*2);
              ctx.fill();
          } else {
              // Boost
              ctx.fillStyle = '#ffd700';
              ctx.beginPath();
              ctx.moveTo(x+w*0.3, y+h*0.3);
              ctx.lineTo(x+w*0.7, y+h*0.5);
              ctx.lineTo(x+w*0.3, y+h*0.7);
              ctx.fill();
          }
      }
  }
}
