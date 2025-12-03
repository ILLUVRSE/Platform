export class InputHandler {
  constructor() {
    this.queuedMove = 0;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        this.queuedMove = -1;
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        this.queuedMove = 1;
        e.preventDefault();
      }
    });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchEndY - touchStartY;

      if (Math.abs(diff) > 30) {
        this.queuedMove = diff > 0 ? 1 : -1; // Swipe
      } else {
        // Tap zones
        if (touchEndY < window.innerHeight / 2) {
          this.queuedMove = -1;
        } else {
          this.queuedMove = 1;
        }
      }
    }, { passive: false });
  }

  popMove() {
    const move = this.queuedMove;
    this.queuedMove = 0; // Consumption is one-time per tick
    return move;
  }

  reset() {
    this.queuedMove = 0;
  }
}
