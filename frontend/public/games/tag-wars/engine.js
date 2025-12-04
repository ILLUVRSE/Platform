import { mulberry32, clamp, dist, checkCircleRectCollision } from './utils.js';
import { AI } from './ai.js';

export class Engine {
  constructor(sfx, bridge) {
    this.sfx = sfx;
    this.bridge = bridge;
    this.state = null;
    this.tickRate = 120; // 120ms logical tick
    this.w = 9;
    this.h = 7;
    this.rng = null;
    this.tagRadius = 0.8;
    // Tile types: 0=floor, 1=wall, 2=slow, 3=fast, 4=trap, 5=bounce
  }

  init(seed, mode = 'ffa', playerCount = 2, fillBots = true) {
    this.rng = mulberry32(seed);
    this.state = {
      w: this.w,
      h: this.h,
      grid: [],
      entities: [],
      powerups: [],
      particles: [],
      mode: mode, // 'ffa' or 'infection'
      timeRemaining: 60, // seconds
      maxTime: 60,
      gameOver: false,
      tick: 0,
      scores: {}, // playerId -> score obj
      infectionState: {
        survivors: [],
        zombies: [],
        startTime: 0
      }
    };

    // Generate Map
    this.generateMap();

    // Spawn Players
    this.spawnPlayers(playerCount, fillBots);

    this.bridge.notifyReady();
  }

  generateMap() {
    this.state.grid = [];
    for (let y = 0; y < this.h; y++) {
      const row = [];
      for (let x = 0; x < this.w; x++) {
        let type = 0;
        const r = this.rng();
        if (r < 0.1) type = 1; // wall
        else if (r < 0.15) type = 2; // slow
        else if (r < 0.18) type = 3; // fast
        else if (r < 0.20) type = 5; // bounce
        // Traps (4) are rare or player placed? Let's add some procedural traps
        else if (r < 0.22) type = 4; // trap

        // Clear spawns and center for fairness
        if ((x < 2 && y < 2) || (x > 6 && y > 4) || (x===4 && y===3)) type = 0;

        row.push({ x, y, type, timer: 0 });
      }
      this.state.grid.push(row);
    }
  }

  spawnPlayers(count, fillBots) {
    const spawns = [
      {x: 0, y: 0}, {x: 8, y: 6}, {x: 8, y: 0}, {x: 0, y: 6}
    ];

    // Determine total players (humans + bots)
    // If fillBots is true, always fill to 4? Or just fill remaining slots?
    // Let's assume fill to 4 for chaotic fun, or just count if fillBots is false
    const totalPlayers = fillBots ? 4 : count;

    for (let i = 0; i < totalPlayers; i++) {
      const isBot = i >= count;
      const spawn = spawns[i % spawns.length];
      this.spawnEntity(i, spawn.x, spawn.y, isBot);
    }

    // Pick Initial IT
    const itIndex = Math.floor(this.rng() * this.state.entities.length);
    this.state.entities[itIndex].isIt = true;

    // Init scores
    this.state.entities.forEach(e => {
        this.state.scores[e.id] = {
            tags: 0,
            timeSurvived: 0,
            infections: 0,
            wasIt: e.isIt
        };
    });
  }

  spawnEntity(id, x, y, isBot) {
    const ent = {
      id: id,
      x: x + 0.5,
      y: y + 0.5,
      vx: 0,
      vy: 0,
      speedBase: 5,
      speedMod: 1,
      isIt: false,
      isBot: isBot,
      color: this.getPlayerColor(id),
      cooldowns: { tag: 0, trap: 0, ability: 0 },
      effects: [], // list of active effects {type, timer}
      input: { x: 0, y: 0, action: false, special: false },
      ai: null
    };
    // Placeholder for AI init
    if (isBot) ent.ai = new AI(ent);
    this.state.entities.push(ent);
  }

  getPlayerColor(id) {
    const colors = ['#e91e63', '#2196f3', '#4caf50', '#ffc107'];
    return colors[id % colors.length];
  }

  update(dt, inputState) {
    if (this.state.gameOver) return;

    this.state.timeRemaining -= dt;
    if (this.state.timeRemaining <= 0) {
      this.endGame('time');
      return;
    }

    // Process Inputs
    this.applyInputs(inputState);

    // AI Update (Placeholder)
    this.state.entities.forEach(e => { if (e.isBot && e.ai) e.ai.update(dt, this.state); });

    // Physics & Movement
    this.updatePhysics(dt);

    // Tag Logic
    this.updateTagging(dt);

    // Powerups Spawning & Cleanup
    this.updatePowerups(dt);

    // Game Mode Specific Checks
    this.checkWinConditions();

    this.state.tick++;
  }

  applyInputs(inputState) {
      // P1
      const p1 = this.state.entities.find(e => e.id === 0 && !e.isBot);
      if (p1 && inputState.p1) {
          p1.input = { ...inputState.p1 };
      }
      // P2
      const p2 = this.state.entities.find(e => e.id === 1 && !e.isBot);
      if (p2 && inputState.p2) {
          p2.input = { ...inputState.p2 };
      }
      // ... P3, P4 if supported locally
  }

  updatePhysics(dt) {
      this.state.entities.forEach(e => {
          // Calculate effective speed based on tile
          const tx = Math.floor(e.x);
          const ty = Math.floor(e.y);
          let tileSpeedMult = 1.0;

          if (tx >= 0 && tx < this.w && ty >= 0 && ty < this.h) {
              const tile = this.state.grid[ty][tx];
              if (tile.type === 2) tileSpeedMult = 0.6; // Slow
              if (tile.type === 3) tileSpeedMult = 1.5; // Fast
              if (tile.type === 4 && tile.timer > 0) tileSpeedMult = 0; // Trap active
          }

          // Apply Powerup Speed Mods
          const speedEffect = e.effects.find(ef => ef.type === 'speed');
          const boost = speedEffect ? 1.5 : 1.0;

          const speed = e.speedBase * e.speedMod * tileSpeedMult * boost * dt;

          let nx = e.x + e.input.x * speed;
          let ny = e.y + e.input.y * speed;

          // Wall Collisions
          nx = clamp(nx, 0.5, this.w - 0.5);
          ny = clamp(ny, 0.5, this.h - 0.5);

          if (this.isWall(nx, e.y)) nx = e.x;
          if (this.isWall(nx, ny)) ny = e.y;

          e.x = nx;
          e.y = ny;

          // Decrement effect timers
          for (let i = e.effects.length - 1; i >= 0; i--) {
              e.effects[i].timer -= dt;
              if (e.effects[i].timer <= 0) e.effects.splice(i, 1);
          }
      });
  }

  isWall(x, y) {
      const tx = Math.floor(x);
      const ty = Math.floor(y);
      if (tx < 0 || tx >= this.w || ty < 0 || ty >= this.h) return true;
      return this.state.grid[ty][tx].type === 1;
  }

  updateTagging(dt) {
    // Only update tagging on logic ticks or just interpolation?
    // Logic tick is safer, but dt works if we have cooldowns.

    const its = this.state.entities.filter(e => e.isIt);
    const others = this.state.entities.filter(e => !e.isIt);

    its.forEach(it => {
        if (it.cooldowns.tag > 0) {
            it.cooldowns.tag -= dt;
            return;
        }

        others.forEach(victim => {
             // Check collision
             if (dist(it.x, it.y, victim.x, victim.y) < this.tagRadius) {
                 // Check if victim is shielded
                 const shield = victim.effects.find(ef => ef.type === 'shield');
                 if (shield) {
                     // Pop shield
                     victim.effects = victim.effects.filter(ef => ef.type !== 'shield');
                     it.cooldowns.tag = 1.0; // Stun attacker briefly
                     // Sound: Shield Pop
                     return;
                 }

                 this.handleTag(it, victim);
             }
        });
    });
  }

  handleTag(tagger, victim) {
      if (this.state.mode === 'ffa') {
          // Swap IT roles
          tagger.isIt = false;
          tagger.cooldowns.tag = 2.0; // Can't get tagged immediately back? Or grace period?
          // Actually, usually victim becomes IT and has a cooldown before they can tag back
          victim.isIt = true;
          victim.cooldowns.tag = 1.0; // Grace period before new IT can tag

          this.state.scores[tagger.id].tags++;
          // SFX
          if (this.sfx) this.sfx.playTag();

      } else if (this.state.mode === 'infection') {
          victim.isIt = true; // Spreads
          this.state.scores[tagger.id].infections++;
          if (this.sfx) this.sfx.playInfect();
      }
  }

  updatePowerups(dt) {
      // Spawn logic
      if (this.rng() < 0.005) { // Random low chance per tick
          this.spawnPowerup();
      }

      // Pickup logic
      this.state.entities.forEach(e => {
          for (let i = this.state.powerups.length - 1; i >= 0; i--) {
              const p = this.state.powerups[i];
              if (dist(e.x, e.y, p.x, p.y) < 0.6) {
                  this.applyPowerup(e, p.type);
                  this.state.powerups.splice(i, 1);
                  if (this.sfx) this.sfx.playPowerup();
              }
          }
      });
  }

  spawnPowerup() {
      if (this.state.powerups.length >= 3) return;
      // Find valid spot
      let tries = 10;
      while(tries-- > 0) {
          const x = Math.floor(this.rng() * this.w);
          const y = Math.floor(this.rng() * this.h);
          if (this.state.grid[y][x].type !== 1) { // Not wall
             const types = ['speed', 'shield']; // MVP types
             const type = types[Math.floor(this.rng() * types.length)];
             this.state.powerups.push({x: x+0.5, y: y+0.5, type});
             return;
          }
      }
  }

  applyPowerup(ent, type) {
      if (type === 'speed') {
          ent.effects.push({type: 'speed', timer: 5.0});
      } else if (type === 'shield') {
          ent.effects.push({type: 'shield', timer: 10.0});
      }
  }

  checkWinConditions() {
      if (this.state.mode === 'infection') {
          const survivors = this.state.entities.filter(e => !e.isIt);
          if (survivors.length === 0) {
              this.endGame('infection_complete');
          }
      } else {
           // FFA Time checks handled in main update
      }

      // Update survival times
      this.state.entities.forEach(e => {
          if (!e.isIt) {
              this.state.scores[e.id].timeSurvived += (1/this.tickRate); // approximate
          }
      });
  }

  endGame(reason) {
      this.state.gameOver = true;
      let winnerId = -1;
      let winningScore = -1;

      // Final Score Calculation
      this.state.entities.forEach(e => {
          let score = 0;
          const s = this.state.scores[e.id];

          if (this.state.mode === 'ffa') {
              // FFA: (win ? 1M : 0) + tags*100 + surv*0.1
              // Who wins FFA? Last not it? Or most tags? Usually FFA tag is about avoiding IT.
              // Let's say Winner is the one who was IT the LEAST amount of time?
              // Or standard Tag: "Game Over" doesn't have a winner until time runs out.
              // At time out, winner is the one NOT it, or if multiple, least IT time.
              // Let's stick to the prompt: "Last player not it wins" (elimination) or "Time".
              // Prompt MVP: "most tags in time" or "last player not it".
              // Let's go with Prompt Formula: tags * 100 + timeSurvived * 0.1
              // And whoever has highest score gets the 1M bonus?

              // Actually prompt said: "winner determined by survival/time or most tags"
              // Let's declare winner as: currently NOT it (if game ends by time), or player with most tags?
              // Let's prioritize Not Being It at end.

              const isWinner = !e.isIt && reason === 'time'; // Simple rule: If time runs out, non-its win?
              // But multiple can be non-it.
              // Let's sort by Time Survived.

              score = s.tags * 100 + Math.round(s.timeSurvived * 1000 * 0.1);
              // We'll apply Win Bonus later after sorting
              s.rawScore = score;
          } else {
              // Infection
              // Zombie: (infectedAll ? 1M : 0) + inf*1000 + remainingRound*0.2
              // Survivor: (survived ? 1M : 0) + survivedTime*0.1 + remainingSurvivors*2000

              if (e.isIt || s.wasIt) { // Was infected or started as IT
                  // Is Zombie Team
                  const infectedAll = this.state.entities.every(ent => ent.isIt);
                  score = (infectedAll ? 1000000 : 0) + s.infections * 1000 + Math.round(this.state.timeRemaining * 1000 * 0.2);
                  s.role = 'zombie';
              } else {
                  // Survivor
                  const survived = !e.isIt; // Should be true if we are here and game ended by time
                  const remainingSurvivors = this.state.entities.filter(ent => !ent.isIt).length;
                  score = (survived ? 1000000 : 0) + Math.round(s.timeSurvived * 1000 * 0.1) + (remainingSurvivors * 2000);
                  s.role = 'survivor';
              }
              s.rawScore = score;
          }
      });

      // Sort to find Winner
      const sorted = [...this.state.entities].sort((a, b) => this.state.scores[b.id].rawScore - this.state.scores[a.id].rawScore);
      winnerId = sorted[0].id;

      // Apply Win Bonus for FFA (if not already applied in formula)
      if (this.state.mode === 'ffa') {
          // Add 1M to the winner
           this.state.scores[winnerId].rawScore += 1000000;
      }

      const p1Score = this.state.scores[0].rawScore;

      if (this.bridge) {
          this.bridge.submitScore(p1Score, {
              mode: this.state.mode,
              scores: this.state.scores,
              winnerId: winnerId
          });
      }

      if (this.sfx) this.sfx.playWin();
  }
}
