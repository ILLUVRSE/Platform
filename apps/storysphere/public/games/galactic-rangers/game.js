// Game Configuration
const CONFIG = {
    playerSpeed: 300,
    bulletSpeed: 500,
    fireRate: 0.15, // seconds between shots
    enemyBaseSpeed: 100,
    spawnRate: 2.5, // seconds between waves
    colors: {
        player: '#00f3ff',
        enemy: '#ff0055',
        bullet: '#fff',
        powerup: '#00ff9d'
    }
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.scoreEl = document.getElementById('score');
        this.finalScoreEl = document.getElementById('final-score');

        // State
        this.lastTime = 0;
        this.score = 0;
        this.isPlaying = false;
        this.gameOver = false;

        // Entities
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];

        // Inputs
        this.keys = {
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            w: false, s: false, a: false, d: false,
            " ": false
        };

        // Spawning
        this.spawnTimer = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();

        // Start loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = false;
        });

        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());
    }

    start() {
        this.score = 0;
        this.scoreEl.innerText = '0';
        this.isPlaying = true;
        this.gameOver = false;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.spawnTimer = 0;

        // Initialize Player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            fireTimer: 0,
            hp: 3
        };

        this.startScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
    }

    endGame() {
        this.isPlaying = false;
        this.gameOver = true;
        this.finalScoreEl.innerText = this.score;
        this.gameOverScreen.classList.add('active');
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.isPlaying) {
            this.update(dt);
            this.draw();
        } else if (!this.gameOver) {
            // Idle animation or attract mode could go here
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawStars(timestamp);
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Player Movement
        if (this.keys.ArrowLeft || this.keys.a) this.player.x -= CONFIG.playerSpeed * dt;
        if (this.keys.ArrowRight || this.keys.d) this.player.x += CONFIG.playerSpeed * dt;

        // Clamp player
        this.player.x = Math.max(20, Math.min(this.canvas.width - 20, this.player.x));

        // Shooting
        this.player.fireTimer -= dt;
        if (this.keys[" "] && this.player.fireTimer <= 0) {
            this.bullets.push({
                x: this.player.x,
                y: this.player.y - 20,
                vy: -CONFIG.bulletSpeed,
                width: 4,
                height: 15,
                color: CONFIG.colors.bullet
            });
            this.player.fireTimer = CONFIG.fireRate;
        }

        // Bullets
        this.bullets.forEach(b => {
            b.y += b.vy * dt;
        });
        this.bullets = this.bullets.filter(b => b.y > -50 && b.y < this.canvas.height + 50);

        // Enemies
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnWave();
            this.spawnTimer = CONFIG.spawnRate;
        }

        this.enemies.forEach(e => {
            e.y += e.vy * dt;
            e.x += Math.sin(e.y * 0.02 + e.offset) * 100 * dt; // Wavy movement
        });

        // Cleanup off-screen enemies
        this.enemies = this.enemies.filter(e => {
            if (e.y > this.canvas.height + 50) {
                // Penalty for missing enemies? Maybe later.
                return false;
            }
            return true;
        });

        // Collision Detection
        // Bullets vs Enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                let e = this.enemies[j];
                if (Math.abs(b.x - e.x) < (e.width/2 + b.width/2) &&
                    Math.abs(b.y - e.y) < (e.height/2 + b.height/2)) {

                    // Hit!
                    this.createExplosion(e.x, e.y, CONFIG.colors.enemy);
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.score += 100;
                    this.scoreEl.innerText = this.score;
                    break;
                }
            }
        }

        // Enemies vs Player
        for (let e of this.enemies) {
            if (Math.abs(e.x - this.player.x) < (e.width/2 + this.player.width/2) &&
                Math.abs(e.y - this.player.y) < (e.height/2 + this.player.height/2)) {
                this.createExplosion(this.player.x, this.player.y, CONFIG.colors.player);
                this.endGame();
                return;
            }
        }

        // Particles
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.alpha = p.life / p.maxLife;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw() {
        this.ctx.fillStyle = CONFIG.colors.darkBg; // Actually using css bg
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawStars(Date.now());

        // Draw Player
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.fillStyle = CONFIG.colors.player;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = CONFIG.colors.player;

        // Ship shape
        this.ctx.beginPath();
        this.ctx.moveTo(0, -20);
        this.ctx.lineTo(15, 15);
        this.ctx.lineTo(0, 10);
        this.ctx.lineTo(-15, 15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Draw Bullets
        this.ctx.fillStyle = CONFIG.colors.bullet;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#fff';
        this.bullets.forEach(b => {
            this.ctx.fillRect(b.x - b.width/2, b.y - b.height/2, b.width, b.height);
        });

        // Draw Enemies
        this.enemies.forEach(e => {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            this.ctx.fillStyle = CONFIG.colors.enemy;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = CONFIG.colors.enemy;

            // Enemy shape (bug-like)
            this.ctx.beginPath();
            this.ctx.moveTo(0, 15);
            this.ctx.lineTo(15, -10);
            this.ctx.lineTo(0, -5);
            this.ctx.lineTo(-15, -10);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0;
    }

    drawStars(time) {
        // Simple scrolling starfield effect
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            let x = (Math.sin(i * 132.1) * 43758.5453 * this.canvas.width) % this.canvas.width;
            let y = ((time * 0.05 * (1 + (i % 5)*0.2)) + (i * 453.2)) % this.canvas.height;
            if (x < 0) x += this.canvas.width;

            this.ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
            this.ctx.fillRect(x, y, 2, 2);
        }
        this.ctx.globalAlpha = 1.0;
    }

    spawnWave() {
        const count = 3 + Math.floor(this.score / 1000); // Difficulty ramp
        for (let i = 0; i < count; i++) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: -50 - (i * 50),
                vy: CONFIG.enemyBaseSpeed + (Math.random() * 50),
                width: 30,
                height: 30,
                offset: Math.random() * 100
            });
        }
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
}

// Start Game
window.onload = () => {
    new Game();
};
