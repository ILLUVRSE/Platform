// shapes.js
export const SHAPES = [
  { id: 0, name: 'dot', cells: [{c:0, r:0}], color: '#FFD700' },
  { id: 1, name: 'line2', cells: [{c:0, r:0}, {c:0, r:1}], color: '#00E5FF' },
  { id: 2, name: 'L', cells: [{c:0, r:0}, {c:0, r:1}, {c:1, r:1}], color: '#FF4081' },
  { id: 3, name: 'square', cells: [{c:0, r:0}, {c:1, r:0}, {c:0, r:1}, {c:1, r:1}], color: '#76FF03' },
  { id: 4, name: 'T', cells: [{c:0, r:0}, {c:1, r:0}, {c:2, r:0}, {c:1, r:1}], color: '#D500F9' }
];

export class ShapeGenerator {
  constructor(rng) {
    this.rng = rng;
  }

  next() {
    const idx = Math.floor(this.rng() * SHAPES.length);
    return SHAPES[idx];
  }
}
