import { MathUtils } from './utils.js';

export const UI = {
    elements: {
        timer: document.getElementById('lap-timer'),
        counter: document.getElementById('lap-counter'),
        speed: document.getElementById('speedometer'),
        best: document.getElementById('best-time'),
        startScreen: document.getElementById('start-screen'),
        resultsScreen: document.getElementById('results-screen'),
        finalTime: document.getElementById('final-time'),
        newRecord: document.getElementById('new-record'),
        startBtn: document.getElementById('start-btn'),
        restartBtn: document.getElementById('restart-btn')
    },

    updateHUD(kart, bestTimeMs) {
        // Time
        this.elements.timer.innerText = MathUtils.formatTime(kart.currentLapTime);

        // Lap
        // kart.lap is 0-indexed completed laps.
        // If total laps is 3, we show "Lap 1/3", "Lap 2/3", "Lap 3/3"
        // If finished, show "Finished"
        const currentLap = Math.min(kart.lap + 1, 3);
        this.elements.counter.innerText = `LAP: ${currentLap}/3`;

        // Speed (approx)
        const speedVal = Math.hypot(kart.vx, kart.vy) * 1000; // Arbitrary scale
        this.elements.speed.innerText = `${Math.floor(speedVal)} KM/H`;

        // Best
        if (bestTimeMs) {
            this.elements.best.innerText = "BEST: " + MathUtils.formatTime(bestTimeMs);
        } else {
            this.elements.best.innerText = "BEST: --:--.--";
        }
    },

    showStartScreen(onStart) {
        this.elements.resultsScreen.classList.add('hidden');
        this.elements.startScreen.classList.remove('hidden');

        this.elements.startBtn.onclick = () => {
            this.elements.startScreen.classList.add('hidden');
            onStart();
        };
    },

    showResults(timeMs, isRecord, onRestart) {
        this.elements.resultsScreen.classList.remove('hidden');
        this.elements.finalTime.innerText = MathUtils.formatTime(timeMs);

        if (isRecord) {
            this.elements.newRecord.style.display = 'block';
        } else {
            this.elements.newRecord.style.display = 'none';
        }

        this.elements.restartBtn.onclick = () => {
            this.elements.resultsScreen.classList.add('hidden');
            onRestart();
        };
    }
};
