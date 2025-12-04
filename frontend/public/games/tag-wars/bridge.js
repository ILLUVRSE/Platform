export class Bridge {
    constructor() {
        this.ready = false;
        // Listen for parent messages if needed?
    }

    notifyReady() {
        if (this.ready) return;
        this.ready = true;
        if (window.parent) {
            window.parent.postMessage({ type: 'arcade-ready' }, '*');
        }
    }

    submitScore(score, meta) {
        console.log('Bridge: submitting score', score, meta);

        // Post Message to Parent
        if (window.parent) {
            window.parent.postMessage({
                type: 'arcade-score',
                game: 'tag-wars',
                score: Math.round(score),
                meta: meta
            }, '*');
        }

        // Fire and Forget API call
        fetch('/api/v1/arcade/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                game: 'tag-wars',
                score: Math.round(score),
                meta: meta
            })
        }).catch(err => console.error('Score submit failed', err));
    }
}
