// utils.js
export function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

export function getNeighbors(x, y, width, height) {
    const n = [];
    if (x > 0) n.push({x: x-1, y, dir: 'left'});
    if (x < width - 1) n.push({x: x+1, y, dir: 'right'});
    if (y > 0) n.push({x, y: y-1, dir: 'up'});
    if (y < height - 1) n.push({x, y: y+1, dir: 'down'});
    return n;
}

export const TILE_SIZE = 48; // Base tile size for rendering
export const GRID_W = 12;
export const GRID_H = 8;
