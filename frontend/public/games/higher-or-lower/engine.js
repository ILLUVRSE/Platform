const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export class GameEngine {
  constructor(seed, mode = 'arcade') {
    this.seed = seed;
    this.mode = mode;
    this.rng = null; // Set in init
    this.deck = [];
    this.discardPile = [];
    this.currentCard = null;
    this.nextCard = null;
    this.score = 0;
    this.streak = 0;
    this.streakMax = 0;
    this.correctCount = 0;
    this.roundsPlayed = 0;
    this.gameOver = false;

    // Powerups
    this.shieldActive = false;
    this.shieldUsed = false;
    this.hintUsed = false;
    this.doubleOrNothingActive = false;

    // Constants
    this.BASE_POINTS = 10;
  }

  init(rngFunc) {
    this.rng = rngFunc;
    this.createDeck();
    this.shuffleDeck();
    this.drawInitialCards();
  }

  createDeck() {
    this.deck = [];
    for (let s of SUITS) {
      for (let r of RANKS) {
        this.deck.push({
          suit: s,
          rank: r,
          value: VALUES[r],
          color: (s === '♥' || s === '♦') ? 'red' : 'black'
        });
      }
    }
  }

  shuffleDeck() {
    // Fisher-Yates with seeded RNG
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawInitialCards() {
    if (this.deck.length === 0) return; // Should not happen on init
    this.currentCard = this.deck.pop();
    // Peek next card logic is handled dynamically, we just need to ensure deck has cards
    if (this.deck.length === 0) {
        // Reshuffle if empty? For MVP we assume one deck pass or reshuffle.
        // Let's implement reshuffle of discard if empty
        this.reshuffleDiscard();
    }
  }

  reshuffleDiscard() {
    if (this.discardPile.length === 0) {
      // Create new deck if absolutely everything is gone
      this.createDeck();
    } else {
      this.deck = [...this.discardPile];
      this.discardPile = [];
    }
    this.shuffleDeck();
  }

  getNextCard() {
    if (this.deck.length === 0) {
      this.reshuffleDiscard();
    }
    return this.deck[this.deck.length - 1]; // Peek
  }

  dealNext() {
      // Actually move next card to current
      if (this.deck.length === 0) this.reshuffleDiscard();
      this.discardPile.push(this.currentCard);
      this.currentCard = this.deck.pop();
  }

  guess(choice) { // 'higher' or 'lower'
    if (this.gameOver) return { result: 'game_over' };

    const next = this.getNextCard();
    const currentVal = this.currentCard.value;
    const nextVal = next.value;

    let correct = false;
    if (choice === 'higher' && nextVal >= currentVal) correct = true;
    if (choice === 'lower' && nextVal <= currentVal) correct = true;

    // Handle Double or Nothing logic
    let points = 0;
    let multiplier = 1 + 0.2 * (this.streak);

    if (this.doubleOrNothingActive) {
        if (correct) {
            multiplier *= 2;
        }
        // Reset flag after use
        this.doubleOrNothingActive = false;
    }

    if (correct) {
      points = Math.floor(this.BASE_POINTS * multiplier);
      this.score += points;
      this.streak++;
      if (this.streak > this.streakMax) this.streakMax = this.streak;
      this.correctCount++;

      // Advance cards
      this.dealNext();

      return { result: 'correct', points, card: this.currentCard };
    } else {
      // Incorrect
      if (this.shieldActive && !this.shieldUsed) {
          this.shieldUsed = true; // Consumed
          // Don't lose streak, just don't gain points.
          // Still advance card? Yes, reveal it.
          this.dealNext();
          return { result: 'saved', points: 0, card: this.currentCard };
      }

      this.gameOver = true;
      this.roundsPlayed++;
      // Return the card that killed them (which is now current)
      this.dealNext();
      return { result: 'game_over', points: 0, card: this.currentCard };
    }
  }

  activatePowerup(type) {
      if (type === 'shield' && !this.shieldUsed) {
          this.shieldActive = true;
          return true;
      }
      if (type === 'hint' && !this.hintUsed) {
          this.hintUsed = true;
          const next = this.getNextCard();
          // Return hint data: 'red', 'black', 'high' (>=8), 'low' (<8)
          return {
              color: next.color,
              range: next.value >= 8 ? 'High (8-A)' : 'Low (2-7)'
          };
      }
      if (type === 'double') {
          this.doubleOrNothingActive = true;
          return true;
      }
      return false;
  }
}
