export class Renderer {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.cardWidth = 140;
        this.cardHeight = 200;

        // Colors from theme
        this.colors = {
            bg: '#004d40',
            cardBack: '#009688',
            cardFace: '#fdfbf7',
            gold: '#ffd700',
            text: '#fdfbf7',
            red: '#e53935',
            black: '#212121'
        };

        this.animations = [];
    }

    resize() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        // Responsive card size
        this.cardHeight = Math.min(200, this.height * 0.4);
        this.cardWidth = this.cardHeight * 0.7;
    }

    clear() {
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawCard(card, x, y, faceUp = true, scale = 1) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);

        // Shadow
        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;

        // Base
        this.ctx.fillStyle = faceUp ? this.colors.cardFace : this.colors.cardBack;
        this.ctx.beginPath();
        this.ctx.roundRect(-this.cardWidth/2, -this.cardHeight/2, this.cardWidth, this.cardHeight, 10);
        this.ctx.fill();

        // Pattern for back
        if (!faceUp) {
            this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-this.cardWidth/2 + 10, -this.cardHeight/2 + 10);
            this.ctx.lineTo(this.cardWidth/2 - 10, this.cardHeight/2 - 10);
            this.ctx.stroke();
        } else {
            // Face content
            this.ctx.shadowColor = 'transparent';
            this.ctx.fillStyle = card.color === 'red' ? this.colors.red : this.colors.black;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Rank
            this.ctx.font = `bold ${this.cardHeight * 0.3}px sans-serif`;
            this.ctx.fillText(card.rank, 0, -this.cardHeight * 0.15);

            // Suit
            this.ctx.font = `${this.cardHeight * 0.4}px serif`;
            this.ctx.fillText(card.suit, 0, this.cardHeight * 0.25);

            // Corner indices
            this.ctx.font = `bold ${this.cardHeight * 0.15}px sans-serif`;
            this.ctx.textAlign = 'center';
            const cornerX = 20;

            this.ctx.fillText(card.rank, -this.cardWidth/2 + cornerX, -this.cardHeight/2 + 15);
            this.ctx.fillText(card.suit, -this.cardWidth/2 + cornerX, -this.cardHeight/2 + 35);

            this.ctx.save();
            this.ctx.translate(this.cardWidth/2 - cornerX, this.cardHeight/2 - 15);
            this.ctx.rotate(Math.PI);
            this.ctx.fillText(card.rank, 0, 0);
            this.ctx.fillText(card.suit, 0, 20);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawHUD(engine) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 24px sans-serif';

        // Score
        this.ctx.fillText(`SCORE: ${engine.score}`, this.width / 2, 40);

        // Streak
        this.ctx.fillStyle = this.colors.gold;
        this.ctx.font = '18px sans-serif';
        this.ctx.fillText(`Streak: ${engine.streak} (x${(1 + 0.2 * Math.max(0, engine.streak - 1)).toFixed(1)})`, this.width / 2, 70);

        // Messages
        if (engine.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, this.height/2 - 50, this.width, 100);
            this.ctx.fillStyle = this.colors.gold;
            this.ctx.font = 'bold 40px sans-serif';
            this.ctx.fillText("GAME OVER", this.width / 2, this.height / 2 + 10);
            this.ctx.font = '20px sans-serif';
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText("Tap to Restart", this.width / 2, this.height / 2 + 40);
        }
    }

    render(engine) {
        this.clear();

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Draw deck/next card pile (placeholder)
        this.drawCard({}, centerX + this.cardWidth * 0.8, centerY, false, 0.9);

        // Draw current card
        if (engine.currentCard) {
            this.drawCard(engine.currentCard, centerX - this.cardWidth * 0.2, centerY);
        }

        this.drawHUD(engine);
    }
}
