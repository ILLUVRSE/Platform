// Wheel configuration
export const WHEEL_SECTORS = [
    { type: 'CASH', value: 500, color: '#f44336' }, // Red
    { type: 'CASH', value: 300, color: '#ff9800' }, // Orange
    { type: 'CASH', value: 200, color: '#ffeb3b' }, // Yellow
    { type: 'LOSE_TURN', value: 0, label: 'LOSE', color: '#ffffff' }, // White
    { type: 'CASH', value: 400, color: '#4caf50' }, // Green
    { type: 'CASH', value: 200, color: '#2196f3' }, // Blue
    { type: 'CASH', value: 900, color: '#3f51b5' }, // Indigo
    { type: 'BANKRUPT', value: 0, label: 'BANK', color: '#000000', textColor: '#ffffff' }, // Black
    { type: 'CASH', value: 600, color: '#9c27b0' }, // Purple
    { type: 'CASH', value: 300, color: '#e91e63' }, // Pink
    { type: 'CASH', value: 250, color: '#795548' }, // Brown
    { type: 'CASH', value: 1000, color: '#ffd700' }, // Gold
    { type: 'CASH', value: 100, color: '#607d8b' }, // Blue Grey
    { type: 'CASH', value: 550, color: '#00bcd4' }, // Cyan
    { type: 'FREE_SPIN', value: 0, label: 'FREE', color: '#8bc34a' }, // Light Green
    { type: 'CASH', value: 350, color: '#cddc39' }, // Lime
];

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ".split('');
export const VOWEL_COST = 250;

export class WheelEngine {
    constructor(puzzles, seed) {
        this.puzzles = puzzles;
        this.rng = seed; // Function
        this.currentPuzzleIndex = 0;
        this.score = 0; // Total accumulated score
        this.roundCash = 0; // Current round cash
        this.spinsLeft = 50; // Total spins allowed per session (optional constraint, or infinite)
        this.maxPuzzles = 5;

        this.state = 'SPIN'; // SPIN, SPINNING, RESULT, GUESS_CONSONANT, BUY_ACTION, SOLVE_INPUT, ROUND_END, GAME_OVER
        this.puzzle = null;
        this.revealed = []; // Array of booleans
        this.guessedLetters = new Set();

        this.wheelAngle = 0;
        this.wheelVelocity = 0;
        this.currentSector = null;

        this.message = "SPIN THE WHEEL!";

        this.loadNextPuzzle();
    }

    loadNextPuzzle() {
        if (this.currentPuzzleIndex >= this.maxPuzzles) {
            this.state = 'GAME_OVER';
            this.message = "GAME OVER! Final Score: " + this.score;
            return;
        }

        const p = this.puzzles[this.currentPuzzleIndex % this.puzzles.length];
        this.puzzle = {
            category: p.category,
            text: p.text.toUpperCase(),
            grid: this.createPuzzleGrid(p.text.toUpperCase())
        };
        this.revealed = this.puzzle.text.split('').map(c => !/[A-Z]/.test(c)); // Auto reveal non-letters
        this.guessedLetters.clear();
        this.roundCash = 0;
        this.state = 'SPIN';
        this.message = "Category: " + this.puzzle.category;
    }

    createPuzzleGrid(text) {
        // Simple logic to wrap text into lines (max width approx 12-14 chars)
        const words = text.split(' ');
        let lines = [];
        let currentLine = "";

        for (let word of words) {
            if ((currentLine + word).length > 12) {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine += word + " ";
            }
        }
        lines.push(currentLine.trim());
        return lines;
    }

    spin() {
        if (this.state !== 'SPIN') return;
        // Initial velocity randomized slightly but deterministic if we used the RNG (but for animation feeling we usually add some flux)
        // For gameplay fairness, we can determine result first, but for simple arcade, physics simulation is fine.
        // Let's use physics for visual fun.
        this.wheelVelocity = 0.3 + (this.rng() * 0.2); // Random velocity
        this.state = 'SPINNING';
        this.message = "ROUND AND ROUND...";
    }

    update() {
        if (this.state === 'SPINNING') {
            this.wheelAngle += this.wheelVelocity;
            this.wheelVelocity *= 0.985; // Drag

            if (this.wheelVelocity < 0.002) {
                this.wheelVelocity = 0;
                this.resolveSpin();
            }
        }
    }

    resolveSpin() {
        // Normalize angle
        const angle = this.wheelAngle % (Math.PI * 2);
        // Calculate sector index. 0 is at 3 o'clock usually in canvas arc.
        // We render 0 at 3 o'clock (0 rad). pointer is at 12 o'clock (-PI/2) or 270 deg.
        // Actually simplest is: Index = Math.floor(TotalSectors * (1 - (Angle / 2PI))) % TotalSectors
        // Need to calibrate based on renderer.
        // Let's assume standard math:
        const sectorSize = (Math.PI * 2) / WHEEL_SECTORS.length;
        // Pointer at top (3*PI/2 or -PI/2).
        // If wheel rotates clockwise (angle increases), the sector under the pointer changes counter-index-wise.

        // Effective angle under pointer
        let effectiveAngle = (this.wheelAngle + Math.PI / 2) % (Math.PI * 2);
        // Invert for index mapping
        effectiveAngle = (Math.PI * 2) - effectiveAngle;

        const index = Math.floor(effectiveAngle / sectorSize) % WHEEL_SECTORS.length;
        this.currentSector = WHEEL_SECTORS[index];

        this.handleSectorResult(this.currentSector);
    }

    handleSectorResult(sector) {
        if (sector.type === 'BANKRUPT') {
            this.roundCash = 0;
            this.message = "BANKRUPT!";
            this.state = 'RESULT';
            setTimeout(() => { this.state = 'SPIN'; }, 1500);
            return { type: 'BANKRUPT' };
        } else if (sector.type === 'LOSE_TURN') {
            this.message = "LOST A TURN!";
            this.state = 'RESULT';
             setTimeout(() => { this.state = 'SPIN'; }, 1500);
            return { type: 'LOSE_TURN' };
        } else if (sector.type === 'FREE_SPIN') {
             this.message = "FREE SPIN!";
             // For MVP, just treat as spin again, or maybe logic similar to cash but no value.
             // Let's treat it as a turn keeper.
             this.state = 'GUESS_CONSONANT';
             this.message = "PICK A CONSONANT";
             return { type: 'FREE' };
        } else {
            // CASH
            this.message = `$${sector.value} - PICK A CONSONANT`;
            this.state = 'GUESS_CONSONANT';
            return { type: 'CASH', value: sector.value };
        }
    }

    guessLetter(letter) {
        if (this.state !== 'GUESS_CONSONANT' && this.state !== 'BUY_ACTION') return;

        if (this.guessedLetters.has(letter)) {
            this.message = "ALREADY GUESSED!";
            return false;
        }

        const isVowel = VOWELS.includes(letter);
        if (this.state === 'GUESS_CONSONANT' && isVowel) {
            this.message = "VOWELS MUST BE BOUGHT!";
            return false;
        }

        this.guessedLetters.add(letter);

        let count = 0;
        const text = this.puzzle.text;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === letter) {
                this.revealed[i] = true;
                count++;
            }
        }

        if (count > 0) {
            if (!isVowel) {
                this.roundCash += (this.currentSector ? (this.currentSector.value || 0) : 0) * count;
                this.message = `FOUND ${count} ${letter}'s! SPIN, BUY, OR SOLVE.`;
                this.state = 'SPIN'; // Can spin again
            } else {
                this.message = `FOUND ${count} ${letter}'s!`;
                this.state = 'SPIN';
            }

            // Check full solve auto? No, usually you have to solve. But for arcade speed, let's auto-solve if complete.
            if (this.checkComplete()) {
                this.solveSuccess();
            }
            return true;
        } else {
            // Wrong guess
            this.message = `NO ${letter}!`;
            this.state = 'SPIN'; // In single player, just next spin (maybe penalty?)
            // For arcade difficulty, maybe deduct cash?
            // Let's keep it simple: just lose turn (spin again).
            return false;
        }
    }

    buyVowel() {
        if (this.state !== 'SPIN') {
             this.message = "CAN ONLY BUY BEFORE SPINNING";
             return;
        }
        if (this.roundCash < VOWEL_COST) {
            this.message = "NEED $" + VOWEL_COST;
            return;
        }
        this.roundCash -= VOWEL_COST;
        this.state = 'BUY_ACTION';
        this.message = "PICK A VOWEL";
    }

    checkComplete() {
        return this.puzzle.text.split('').every((char, i) => this.revealed[i]);
    }

    solveAttempt(input) {
        if (input.toUpperCase() === this.puzzle.text) {
            this.solveSuccess();
            return true;
        } else {
            this.message = "WRONG ANSWER!";
            this.state = 'SPIN';
            return false;
        }
    }

    solveSuccess() {
        this.score += this.roundCash;
        // Bonus for solving early?
        this.score += 1000;
        this.currentPuzzleIndex++;
        this.state = 'ROUND_END';
        this.message = "PUZZLE SOLVED! +$" + this.roundCash;
        setTimeout(() => {
            this.loadNextPuzzle();
        }, 3000);
    }
}
