// input.js
export class Input {
  constructor(canvas) {
    this.keys = {};
    this.callbacks = {};
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Mouse/Touch
    this.canvas.addEventListener('mousedown', (e) => this.onClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.onTouch(e), {passive: false});

    // Prevent default scrolling for game keys
    this.preventDefaultKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ', 'g', 'h', 'e'];
  }

  on(event, fn) {
    this.callbacks[event] = fn;
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  onKeyDown(e) {
    this.keys[e.key] = true;
    if (this.preventDefaultKeys.includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowLeft') this.emit('move', -1);
    if (e.key === 'ArrowRight') this.emit('move', 1);
    if (e.key === ' ' || e.key === 'Space') this.emit('drop', null);

    // Gravity controls
    if (e.key === 'ArrowUp') this.emit('gravity', 'up');
    if (e.key === 'ArrowDown') this.emit('gravity', 'down'); // Might conflict with drop if we used arrow down for drop, but prompt says Space for drop

    if (e.key.toLowerCase() === 'g') this.emit('gravityCycle', -1);
    if (e.key.toLowerCase() === 'h') this.emit('gravityCycle', 1);

    if (e.key.toLowerCase() === 'e') this.emit('activate', null);
  }

  onKeyUp(e) {
    this.keys[e.key] = false;
  }

  getClickPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  onClick(e) {
    const pos = this.getClickPos(e);
    this.emit('click', pos);
  }

  onTouch(e) {
    if (e.target === this.canvas) e.preventDefault();
    const touch = e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const pos = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
    this.emit('click', pos);
  }
}
