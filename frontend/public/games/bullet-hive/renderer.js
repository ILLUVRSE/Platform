export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.width = canvas.width;
        this.height = canvas.height;

        // Theme Defaults (Dark Teal)
        this.theme = {
            '--color-primary': '#004d40',
            '--color-accent': '#009688',
            '--color-gold': '#ffd700',
            '--color-bg': '#071218',
            '--color-grid': '#1a262c',
            '--color-bullet': '#ff5722',
            '--color-player': '#ffffff'
        };

        // Listen for theme updates
        window.addEventListener('arcade-theme-received', (e) => {
             if (e.detail) {
                 Object.assign(this.theme, e.detail);
             }
        });

        // Cache grid metrics
        this.cols = 9;
        this.rows = 7;
        this.tileW = this.width / this.cols;
        this.tileH = this.height / this.rows;
    }

    render(engine, interpolation) {
        if (!engine) return;

        const ctx = this.ctx;
        ctx.fillStyle = this.theme['--color-bg'];
        ctx.fillRect(0, 0, this.width, this.height);

        // 1. Draw Grid
        ctx.strokeStyle = this.theme['--color-grid'];
        ctx.lineWidth = 1;

        // Vertical lines
        for(let c=0; c<=this.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * this.tileW, 0);
            ctx.lineTo(c * this.tileW, this.height);
            ctx.stroke();
        }
        // Horizontal lines
        for(let r=0; r<=this.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * this.tileH);
            ctx.lineTo(this.width, r * this.tileH);
            ctx.stroke();
        }

        // 2. Draw Tiles
        // Iterate all tiles
        for(let r=0; r<this.rows; r++) {
            for(let c=0; c<this.cols; c++) {
                const tile = engine.getTile(c, r);
                if (tile !== 0) { // Not Empty
                    this.drawTile(c, r, tile);
                }
            }
        }

        // 3. Draw Player
        // Interpolate position if we wanted smooth movement, but grid step is snappy.
        // We can add simple lerp if engine exposed prev pos. For now, snap.
        const px = engine.player.col * this.tileW + (this.tileW/2);
        const py = engine.player.row * this.tileH + (this.tileH/2);

        ctx.fillStyle = this.theme['--color-player'];
        ctx.beginPath();
        ctx.arc(px, py, this.tileW * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Shield visual
        if (engine.shield > 0) {
            ctx.strokeStyle = this.theme['--color-accent'];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, this.tileW * 0.4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 4. Draw Bullets
        ctx.fillStyle = this.theme['--color-bullet'];
        for(let i=0; i<engine.bullets.length; i++) {
            const b = engine.bullets[i];
            if (!b.active) continue;

            // Interpolate?
            // b.x is current tick pos. If we had prev pos we could interpolate.
            // For MVP 60fps, just draw current b.x
            const bx = b.x * this.tileW;
            const by = b.y * this.tileH;

            ctx.beginPath();
            ctx.arc(bx, by, this.tileW * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. HUD
        this.drawHUD(engine);
    }

    drawTile(c, r, type) {
        const ctx = this.ctx;
        const x = c * this.tileW;
        const y = r * this.tileH;

        // Inset
        const pad = 4;
        const w = this.tileW - pad*2;
        const h = this.tileH - pad*2;

        if (type === 1) { // Reflector
            ctx.fillStyle = this.theme['--color-accent']; // Teal
            ctx.beginPath();
            ctx.moveTo(x+pad, y+pad);
            ctx.lineTo(x+pad+w, y+pad+h);
            ctx.stroke(); // Just a diagonal for now?

            // Draw a box
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x+pad, y+pad, w, h);
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2;
            ctx.strokeRect(x+pad, y+pad, w, h);
        }
        else if (type === 3) { // Absorber
            ctx.fillStyle = '#444';
            ctx.fillRect(x+pad, y+pad, w, h);
        }
    }

    drawHUD(engine) {
        const ctx = this.ctx;
        ctx.fillStyle = this.theme['--color-gold'];
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${engine.score}`, 10, 30);

        ctx.textAlign = 'right';
        ctx.fillText(`TIME: ${engine.distance}`, this.width - 10, 30);

        // Lives
        ctx.fillStyle = '#ff5555';
        ctx.textAlign = 'center';
        // ctx.fillText(`♥ ${engine.lives}`, this.width/2, 30);
    }
}
