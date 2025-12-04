export class Input {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            drift: false
        };

        this.touchZones = {
            left: null,
            right: null
        };

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Touch setup
        if ('ontouchstart' in window) {
            this.setupTouch();
        }
    }

    handleKey(e, isDown) {
        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = isDown;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = isDown;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = isDown;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = isDown;
                break;
            case 'Space':
            case 'ShiftLeft':
                this.keys.drift = isDown;
                break;
        }
    }

    setupTouch() {
        const leftZone = document.getElementById('zone-left');
        const rightZone = document.getElementById('zone-right');
        const mobileControls = document.getElementById('mobile-controls');

        if (mobileControls) mobileControls.style.display = 'block';

        const handleTouch = (zone, type, e) => {
            e.preventDefault();
            const touches = e.changedTouches;
            // Simple logic:
            // Left Zone: Left/Right based on X relative to center of zone
            // Right Zone: Tap/Hold = Gas. Double Tap or low Y = Brake.
            // Center Screen = Drift?

            // Actually, let's keep it simple:
            // Left Zone: Touch left half of zone -> Left, Right half -> Right
            // Right Zone: Touch -> Gas.
            // Drift is tricky. Maybe a dedicated button?
            // Or: Right Zone Top = Gas, Right Zone Bottom = Drift+Gas?

            if (zone === 'left') {
                if (type === 'end') {
                    this.keys.left = false;
                    this.keys.right = false;
                    return;
                }
                const rect = leftZone.getBoundingClientRect();
                const t = touches[0];
                const relX = t.clientX - rect.left;
                if (relX < rect.width / 2) {
                    this.keys.left = true;
                    this.keys.right = false;
                } else {
                    this.keys.left = false;
                    this.keys.right = true;
                }
            }

            if (zone === 'right') {
                if (type === 'end') {
                    this.keys.up = false;
                    this.keys.drift = false;
                    return;
                }
                this.keys.up = true;
                // If touching bottom half, drift
                const rect = rightZone.getBoundingClientRect();
                const t = touches[0];
                const relY = t.clientY - rect.top;
                if (relY > rect.height * 0.6) {
                    this.keys.drift = true;
                } else {
                    this.keys.drift = false;
                }
            }
        };

        if (leftZone) {
            leftZone.addEventListener('touchstart', (e) => handleTouch('left', 'start', e));
            leftZone.addEventListener('touchmove', (e) => handleTouch('left', 'move', e));
            leftZone.addEventListener('touchend', (e) => handleTouch('left', 'end', e));
        }
        if (rightZone) {
            rightZone.addEventListener('touchstart', (e) => handleTouch('right', 'start', e));
            rightZone.addEventListener('touchmove', (e) => handleTouch('right', 'move', e));
            rightZone.addEventListener('touchend', (e) => handleTouch('right', 'end', e));
        }
    }

    getState() {
        return { ...this.keys };
    }
}
