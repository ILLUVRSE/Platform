// bridge.js
// Standard arcade bridge
export class ArcadeBridge {
  constructor() {
    this.ready = false;
  }

  init() {
    console.log("[Bridge] Initializing");
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'arcade-ready' }, '*');
      this.ready = true;
    }
  }

  submitScore(score, meta = {}) {
    console.log(`[Bridge] Submit Score: ${score}`, meta);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'arcade-score',
        score: Math.floor(score),
        meta
      }, '*');
    } else {
      // Local fallback
      this.updateLocalHighScore(score);
    }
  }

  updateLocalHighScore(score) {
    const key = 'gravity-drop-highscore';
    const current = parseInt(localStorage.getItem(key) || '0');
    if (score > current) {
      localStorage.setItem(key, score.toString());
      console.log("New local high score!", score);
    }
  }
}

export const bridge = new ArcadeBridge();
