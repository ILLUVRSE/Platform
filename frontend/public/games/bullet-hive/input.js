export class InputHandler {
    constructor() {
        this.queuedMove = null;
        this.touchStartX = 0;
        this.touchStartY = 0;

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'w', 'W'].includes(e.key)) this.queue('up');
            if (['ArrowDown', 's', 'S'].includes(e.key)) this.queue('down');
            if (['ArrowLeft', 'a', 'A'].includes(e.key)) this.queue('left');
            if (['ArrowRight', 'd', 'D'].includes(e.key)) this.queue('right');
        });

        // Touch
        window.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, {passive: false});

        window.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].screenX - this.touchStartX;
            const dy = e.changedTouches[0].screenY - this.touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) this.queue(dx > 0 ? 'right' : 'left');
            } else {
                if (Math.abs(dy) > 30) this.queue(dy > 0 ? 'down' : 'up');
            }
        }, {passive: false});
    }

    queue(dir) {
        // Only queue if empty to prevent jitter, or overwrite?
        // Overwrite allows quick corrections.
        this.queuedMove = dir;
    }

    popMove() {
        const m = this.queuedMove;
        this.queuedMove = null;
        return m;
    }

    reset() {
        this.queuedMove = null;
    }
}
