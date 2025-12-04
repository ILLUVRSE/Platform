export function sendScore(score, engine) {
    const message = {
        type: 'arcade-score',
        game: 'higher-or-lower',
        score: score,
        seed: engine.seed,
        meta: {
            streakMax: engine.streakMax,
            correctCount: engine.correctCount,
            roundsPlayed: engine.roundsPlayed,
            mode: engine.mode
        }
    };

    // Post to parent (GameGrid)
    window.parent.postMessage(message, '*');

    // Attempt backend submit if configured (MVP skipped direct fetch, relying on parent or local bridge?)
    // The prompt says "Submit single numeric score via POST /api/v1/arcade/score"
    // So we should try to fetch too.

    fetch('/api/v1/arcade/score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_slug: 'higher-or-lower',
            score: score,
            metadata: message.meta
        })
    }).catch(err => console.warn("Score submit failed:", err));
}
