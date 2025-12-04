// PCG PRNG (Permuted Congruential Generator) - Simple and seeded
export function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

export function generateSeed() {
    return Math.floor(Math.random() * 2147483647);
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function dist(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx*dx + dy*dy);
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Simple collision between circle and rectangle (tile)
export function checkCircleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const testX = cx < rx ? rx : (cx > rx + rw ? rx + rw : cx);
    const testY = cy < ry ? ry : (cy > ry + rh ? ry + rh : cy);
    const dx = cx - testX;
    const dy = cy - testY;
    return (dx*dx + dy*dy) <= cr*cr;
}
