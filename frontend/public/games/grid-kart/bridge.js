// Bridge to StorySphere Arcade
// Handles 'arcade-ready' and 'arcade-score' events

export const ArcadeBridge = {
    init: () => {
        // Notify parent that we are ready
        if (window.parent) {
            window.parent.postMessage({ type: 'arcade-ready' }, '*');
        }
        console.log("ArcadeBridge: Ready");
    },

    submitScore: (scoreData) => {
        // scoreData = { timeMs, seed, ghostData, ... }
        if (window.parent) {
            window.parent.postMessage({
                type: 'arcade-score',
                score: scoreData.timeMs, // Main metric for leaderboard sorting
                meta: scoreData // Full payload
            }, '*');
        } else {
            console.log("ArcadeBridge: No parent window, skipping postMessage.");
        }

        // Local storage fallback for best times
        try {
            const key = `grid-kart-best-${scoreData.seed}`;
            const existing = localStorage.getItem(key);
            if (!existing || scoreData.timeMs < parseInt(existing)) {
                localStorage.setItem(key, scoreData.timeMs);
                console.log("ArcadeBridge: New local best saved!", scoreData.timeMs);
                return true; // New record
            }
        } catch (e) {
            console.warn("ArcadeBridge: LocalStorage error", e);
        }
        return false;
    },

    getLocalBest: (seed) => {
        try {
            return localStorage.getItem(`grid-kart-best-${seed}`);
        } catch (e) {
            return null;
        }
    }
};
