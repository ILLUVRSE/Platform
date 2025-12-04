export class Input {
    constructor(canvas, engine, renderer) {
        this.canvas = canvas;
        this.engine = engine;
        this.renderer = renderer;

        this.selectedIdx = -1;
        this.isDragging = false;

        this.setupEvents();
    }

    setupEvents() {
        const getIdx = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Handle touch or mouse
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const col = Math.floor(x / this.renderer.tileSize);
            const row = Math.floor(y / this.renderer.tileSize);

            return this.engine.idx(col, row);
        };

        // Mouse
        this.canvas.addEventListener('mousedown', (e) => {
            const idx = getIdx(e);
            this.handleStart(idx);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.selectedIdx !== -1 && (e.buttons === 1)) {
                const idx = getIdx(e);
                if (idx !== -1 && idx !== this.selectedIdx) {
                    this.attemptSwap(this.selectedIdx, idx);
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            // If we didn't drag-swap, we might be selecting for a 2-click swap
            // But for now, let's reset selection if we release?
            // "Click two adjacent tiles": Click A (Select), Click B (Swap)
            // "Click+Drag": Click A (Select), Drag B (Swap)

            // Logic:
            // If dragging, we already swapped.
            // If just clicking:
            //   If no selection: Select A
            //   If selection A:
            //      If Click B is adjacent: Swap
            //      If Click B is A or non-adjacent: Reselect B
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scroll
            const idx = getIdx(e);
            this.handleStart(idx);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.selectedIdx !== -1) {
                const idx = getIdx(e);
                if (idx !== -1 && idx !== this.selectedIdx) {
                    this.attemptSwap(this.selectedIdx, idx);
                }
            }
        }, { passive: false });
    }

    handleStart(idx) {
        if (idx === -1) return;

        // If we already have a selection, try to swap
        if (this.selectedIdx !== -1) {
             const success = this.attemptSwap(this.selectedIdx, idx);
             if (success) {
                 this.selectedIdx = -1; // Deselect after successful swap
             } else {
                 // If swap failed (not adjacent, or same tile), update selection
                 // Unless it was invalid because of snake?
                 // Let's just select the new one.
                 this.selectedIdx = idx;
             }
        } else {
            this.selectedIdx = idx;
        }

        this.renderer.setSelection(this.selectedIdx);
    }

    attemptSwap(idxA, idxB) {
        const success = this.engine.swapTiles(idxA, idxB);
        if (success) {
            this.renderer.render(); // Immediate update
            return true;
        }
        return false;
    }
}
