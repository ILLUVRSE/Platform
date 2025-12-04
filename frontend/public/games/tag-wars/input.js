export class Input {
  constructor() {
    this.keys = {};
    this.p1 = { x: 0, y: 0, action: false, special: false };
    this.p2 = { x: 0, y: 0, action: false, special: false };

    // Mobile Touch
    this.touch = { active: false, x: 0, y: 0, originX: 0, originY: 0 };

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Touch listeners
    window.addEventListener('touchstart', (e) => this.onTouchStart(e), {passive: false});
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), {passive: false});
    window.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }

  onKeyDown(e) {
    this.keys[e.code] = true;
    // Prevent scrolling for arrows/space
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
  }

  onTouchStart(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.touch.active = true;
      this.touch.originX = t.clientX;
      this.touch.originY = t.clientY;
      this.touch.x = 0;
      this.touch.y = 0;
  }

  onTouchMove(e) {
      e.preventDefault();
      if(!this.touch.active) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this.touch.originX;
      const dy = t.clientY - this.touch.originY;

      // Normalize to -1..1
      const maxDist = 50; // pixels range
      const dist = Math.sqrt(dx*dx + dy*dy);
      const clampedDist = Math.min(dist, maxDist);

      if (dist > 0) {
          this.touch.x = (dx / dist) * (clampedDist / maxDist);
          this.touch.y = (dy / dist) * (clampedDist / maxDist);
      }
  }

  onTouchEnd(e) {
      e.preventDefault();
      this.touch.active = false;
      this.touch.x = 0;
      this.touch.y = 0;
  }

  update() {
    // P1: WASD
    this.p1.x = 0;
    this.p1.y = 0;
    if (this.keys['KeyW']) this.p1.y = -1;
    if (this.keys['KeyS']) this.p1.y = 1;
    if (this.keys['KeyA']) this.p1.x = -1;
    if (this.keys['KeyD']) this.p1.x = 1;

    // Normalize diagonal
    if (this.p1.x !== 0 && this.p1.y !== 0) {
        const len = Math.sqrt(this.p1.x*this.p1.x + this.p1.y*this.p1.y);
        this.p1.x /= len;
        this.p1.y /= len;
    }

    // P1 Ability
    this.p1.action = this.keys['KeyE'] || false;
    this.p1.special = this.keys['KeyQ'] || false;

    // Mobile override for P1 if touch active
    if (this.touch.active) {
        this.p1.x = this.touch.x;
        this.p1.y = this.touch.y;
    }

    // P2: Arrows
    this.p2.x = 0;
    this.p2.y = 0;
    if (this.keys['ArrowUp']) this.p2.y = -1;
    if (this.keys['ArrowDown']) this.p2.y = 1;
    if (this.keys['ArrowLeft']) this.p2.x = -1;
    if (this.keys['ArrowRight']) this.p2.x = 1;

    if (this.p2.x !== 0 && this.p2.y !== 0) {
        const len = Math.sqrt(this.p2.x*this.p2.x + this.p2.y*this.p2.y);
        this.p2.x /= len;
        this.p2.y /= len;
    }

    this.p2.action = this.keys['ShiftRight'] || this.keys['Enter'] || false;
  }
}
