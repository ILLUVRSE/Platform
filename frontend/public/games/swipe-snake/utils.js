// Mulberry32 PRNG
export function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function shuffle(array, rng) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(rng() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

export function randomInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}
