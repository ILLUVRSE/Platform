export const Bridge = {
  sendReady() {
    if (window.parent) {
      window.parent.postMessage({ type: 'arcade-ready' }, '*');
    }
  },

  sendScore(score) {
    if (window.parent) {
      window.parent.postMessage({ type: 'arcade-score', score }, '*');
    }
    // Fallback: local storage
    try {
      const prev = parseInt(localStorage.getItem('tile-dominion-score') || '0');
      if (score > prev) {
        localStorage.setItem('tile-dominion-score', score.toString());
      }
    } catch (e) {
      // ignore
    }
  },

  sendGameOver(score) {
    // Some arcade implementations might use a specific game-over event
    // For now we just send the final score
    this.sendScore(score);
  }
};
