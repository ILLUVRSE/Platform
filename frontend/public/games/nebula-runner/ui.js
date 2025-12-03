import { CONSTANTS } from './utils.js';

export class UI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupDOM();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div id="hud" style="position: absolute; top: 10px; left: 10px; color: #7fffd4; font-family: monospace; font-size: 16px; pointer-events: none; z-index: 10;">
        <div>SCORE: <span id="score">0</span></div>
        <div>DIST: <span id="dist">0</span>m</div>
        <div style="font-size: 10px; opacity: 0.7; margin-top: 4px;">SEED: <span id="seed-display"></span></div>
      </div>

      <div id="game-over" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #00382e; border: 2px solid #009688; padding: 20px; color: #fdfbf7; text-align: center; font-family: sans-serif; min-width: 280px; z-index: 20; box-shadow: 0 0 20px rgba(0,0,0,0.5); pointer-events: auto;">
        <h2 style="margin: 0 0 10px; color: #ffd700; text-transform: uppercase;">Game Over</h2>
        <div style="font-size: 24px; margin-bottom: 10px; color: #fff;">Score: <span id="final-score">0</span></div>
        <div style="font-size: 14px; margin-bottom: 20px; opacity: 0.8;">Distance: <span id="final-dist">0</span>m</div>

        <div style="text-align: left; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">
            <div style="border-bottom: 1px solid #009688; margin-bottom: 5px; font-size: 12px; color: #009688; font-weight: bold;">TOP SCORES (This Seed)</div>
            <div id="leaderboard" style="font-size: 12px; max-height: 100px; overflow-y: auto; font-family: monospace;"></div>
        </div>

        <button id="retry-btn" style="background: #ffd700; color: #000; border: none; padding: 12px 24px; font-weight: bold; cursor: pointer; border-radius: 4px; font-size: 16px;">PLAY AGAIN</button>
      </div>

      <div id="mobile-hints" style="display: none; pointer-events: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5;">
         <div style="position: absolute; top: 25%; left: 50%; transform: translateX(-50%); opacity: 0.4; color: white; font-size: 40px;">▲</div>
         <div style="position: absolute; bottom: 25%; left: 50%; transform: translateX(-50%); opacity: 0.4; color: white; font-size: 40px;">▼</div>
         <div style="position: absolute; bottom: 10%; width: 100%; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px;">Swipe to Move</div>
      </div>
    `;

    this.scoreEl = document.getElementById('score');
    this.distEl = document.getElementById('dist');
    this.seedEl = document.getElementById('seed-display');
    this.gameOverEl = document.getElementById('game-over');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalDistEl = document.getElementById('final-dist');
    this.leaderboardEl = document.getElementById('leaderboard');
    this.retryBtn = document.getElementById('retry-btn');

    if ('ontouchstart' in window) {
        const hints = document.getElementById('mobile-hints');
        hints.style.display = 'block';
        setTimeout(() => {
            hints.style.transition = 'opacity 1s';
            hints.style.opacity = '0';
        }, 3500);
    }
  }

  updateHUD(score, distance, seed) {
    this.scoreEl.textContent = Math.floor(score);
    this.distEl.textContent = Math.floor(distance);
    if (seed) this.seedEl.textContent = seed;
  }

  showGameOver(score, distance, seed, onRetry) {
    this.gameOverEl.style.display = 'block';
    this.finalScoreEl.textContent = Math.floor(score);
    this.finalDistEl.textContent = Math.floor(distance);

    this.updateLocalLeaderboard(score, distance, seed);

    this.retryBtn.onclick = () => {
      this.gameOverEl.style.display = 'none';
      onRetry();
    };
  }

  updateLocalLeaderboard(score, distance, seed) {
    const key = 'nebula-runner:leaderboard';
    let data = [];
    try {
        data = JSON.parse(localStorage.getItem(key) || '[]');
    } catch(e) {}

    // Add current run
    data.push({
        score: Math.floor(score),
        distance: Math.floor(distance),
        seed,
        date: new Date().toISOString()
    });

    // Sort globally by score first to keep top list clean
    data.sort((a, b) => b.score - a.score);

    // Keep top 50 globally
    if (data.length > 50) data = data.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(data));

    // Display filter: Only this seed
    const relevant = data.filter(d => d.seed === seed).slice(0, 5);

    if (relevant.length === 0) {
         this.leaderboardEl.innerHTML = '<div style="opacity: 0.5">No scores yet</div>';
    } else {
         this.leaderboardEl.innerHTML = relevant.map((d, i) =>
            `<div style="display: flex; justify-content: space-between; padding: 2px 0;">
                <span>${i+1}. ${d.score}</span>
                <span style="opacity: 0.7">${d.distance}m</span>
            </div>`
        ).join('');
    }
  }
}
