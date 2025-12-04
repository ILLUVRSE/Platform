// Utility functions for Grid Kart

export class SeededRNG {
    constructor(seedString) {
        // Simple hash of the seed string to get a starting number
        let h = 2166136261 >>> 0;
        for (let i = 0; i < seedString.length; i++) {
            h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
        }
        this.state = h >>> 0;
    }

    // Mulberry32
    next() {
        let t = (this.state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Range [min, max)
    range(min, max) {
        return min + this.next() * (max - min);
    }

    // Integer range [min, max]
    rangeInt(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    // Pick random item from array
    pick(array) {
        return array[Math.floor(this.next() * array.length)];
    }
}

export const MathUtils = {
    // Linear interpolation
    lerp: (a, b, t) => a + (b - a) * t,

    // Clamp value between min and max
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),

    // Distance between two points
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),

    // Format milliseconds to MM:SS.ms
    formatTime: (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const millis = Math.floor((ms % 1000) / 10); // Display centiseconds

        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(minutes)}:${pad(seconds)}.${pad(millis)}`;
    }
};
