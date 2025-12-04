import { VOWELS, CONSONANTS, VOWEL_COST } from './engine.js';
import * as SFX from './sfx.js';

export class InputHandler {
    constructor(engine, renderer) {
        this.engine = engine;
        this.renderer = renderer;
        this.setupKeyboard();
        this.setupMouse();
        this.createUI();
    }

    createUI() {
        const container = document.getElementById('ui-container');
        if (!container) return;

        // Keyboard Container
        const kb = document.createElement('div');
        kb.style.display = 'inline-block';
        kb.style.maxWidth = '100%';

        // Consonants
        const cDiv = document.createElement('div');
        CONSONANTS.forEach(char => {
            const btn = this.createKeyBtn(char);
            cDiv.appendChild(btn);
        });
        kb.appendChild(cDiv);

        // Vowels
        const vDiv = document.createElement('div');
        vDiv.style.marginTop = '5px';
        const vLabel = document.createElement('span');
        vLabel.innerText = `BUY VOWEL ($${VOWEL_COST}): `;
        vLabel.style.color = '#ffd700';
        vLabel.style.fontSize = '12px';
        vDiv.appendChild(vLabel);

        VOWELS.forEach(char => {
             const btn = this.createKeyBtn(char);
             vDiv.appendChild(btn);
        });
        kb.appendChild(vDiv);

        // Actions
        const aDiv = document.createElement('div');
        aDiv.style.marginTop = '10px';

        const spinBtn = document.createElement('button');
        spinBtn.innerText = "SPIN";
        spinBtn.className = "game-btn spin-btn";
        spinBtn.onclick = () => {
             SFX.initAudio();
             if (this.engine.state === 'SPIN') this.engine.spin();
        };
        aDiv.appendChild(spinBtn);

        const solveBtn = document.createElement('button');
        solveBtn.innerText = "SOLVE";
        solveBtn.className = "game-btn solve-btn";
        solveBtn.onclick = () => this.openSolveDialog();
        aDiv.appendChild(solveBtn);

        kb.appendChild(aDiv);

        container.appendChild(kb);

        // Styles
        const style = document.createElement('style');
        style.innerHTML = `
            .game-btn {
                background: #eee;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 8px 12px;
                margin: 2px;
                font-family: monospace;
                font-weight: bold;
                cursor: pointer;
                min-width: 32px;
                font-size: 14px;
                color: #000;
            }
            .game-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            .spin-btn { background: #4caf50; color: white; padding: 10px 30px; font-size: 1.2em; }
            .solve-btn { background: #f44336; color: white; padding: 10px 30px; font-size: 1.2em; }
        `;
        document.head.appendChild(style);

        this.buttons = {}; // map char to btn

        // Collect buttons
        Array.from(container.querySelectorAll('button')).forEach(b => {
             if (b.innerText.length === 1) this.buttons[b.innerText] = b;
        });
    }

    createKeyBtn(char) {
        const btn = document.createElement('button');
        btn.innerText = char;
        btn.className = 'game-btn';
        btn.onclick = () => this.handleKey(char);
        return btn;
    }

    update() {
        // Update button states
        for (let char in this.buttons) {
            const btn = this.buttons[char];
            const isGuessed = this.engine.guessedLetters.has(char);
            btn.disabled = isGuessed ||
                           (this.engine.state !== 'GUESS_CONSONANT' && this.engine.state !== 'BUY_ACTION');

            // Highlight active group
            if (VOWELS.includes(char)) {
                if (this.engine.state === 'BUY_ACTION') btn.style.background = '#ffd700'; // Active
                else btn.style.background = '#eee';
            } else {
                if (this.engine.state === 'GUESS_CONSONANT') btn.style.background = '#81c784';
                else btn.style.background = '#eee';
            }
        }
    }

    handleKey(char) {
        SFX.initAudio();
        if (VOWELS.includes(char)) {
            if (this.engine.state === 'SPIN') {
                this.engine.buyVowel();
                if (this.engine.state === 'BUY_ACTION') {
                    const result = this.engine.guessLetter(char);
                    if (result) SFX.playCorrectLetter(); else SFX.playWrongLetter();
                } else {
                     SFX.playWrongLetter();
                }
            } else if (this.engine.state === 'BUY_ACTION') {
                 const result = this.engine.guessLetter(char);
                 if (result) SFX.playCorrectLetter(); else SFX.playWrongLetter();
            }
        } else {
            // Consonant
            if (this.engine.state === 'GUESS_CONSONANT') {
                const result = this.engine.guessLetter(char);
                if (result) SFX.playCorrectLetter(); else SFX.playWrongLetter();
            }
        }
    }

    openSolveDialog() {
        if (this.engine.state === 'SPINNING') return;
        SFX.playSolveOpen();
        const ans = prompt("ENTER SOLUTION:");
        if (ans) {
            const success = this.engine.solveAttempt(ans);
            if (success) SFX.playWinRound(); else SFX.playWrongLetter();
        }
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            const k = e.key.toUpperCase();
            if (CONSONANTS.includes(k) || VOWELS.includes(k)) {
                this.handleKey(k);
            }
            if (e.key === 'Enter') {
                this.engine.spin();
            }
        });
    }

    setupMouse() {
        this.renderer.canvas.addEventListener('mousedown', (e) => {
            const rect = this.renderer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const dx = x - this.renderer.centerX;
            const dy = y - this.renderer.centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < this.renderer.wheelRadius) {
                SFX.initAudio();
                this.engine.spin();
            }
        });
    }
}
