// bridge.js
export class Bridge {
    constructor() {
        this.ready = false;
        // Listen for messages if needed
    }

    notifyReady() {
        if (window.parent) {
            window.parent.postMessage({ type: 'arcade-ready' }, '*');
        }
        this.ready = true;
    }

    submitScore(score) {
        if (window.parent) {
            window.parent.postMessage({ type: 'arcade-score', score: score }, '*');
        }
        console.log('Score submitted:', score);
    }
}
