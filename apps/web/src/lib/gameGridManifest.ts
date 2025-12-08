export type GameEntry = {
  id: string;
  title: string;
  description: string;
  playPath: string;
  genre: string;
};

export const gameGridManifest: GameEntry[] = [
  {
    id: "riverport",
    title: "Riverport Baseball League",
    description: "Arcade baseball on a tile grid with quickfire innings.",
    playPath: "/games/riverport-baseball/index.html",
    genre: "sports"
  },
  {
    id: "nebula-runner",
    title: "Nebula Runner",
    description: "Dodge hazards in a neon nebula with speed boosts.",
    playPath: "/games/nebula-runner/index.html",
    genre: "runner"
  },
  {
    id: "grid-kart",
    title: "Grid Kart",
    description: "Grid-based kart racing with track editor.",
    playPath: "/games/grid-kart/index.html",
    genre: "racing"
  },
  {
    id: "lighthouse-defense",
    title: "Lighthouse Defense",
    description: "Defend the lighthouse against waves on a tile map.",
    playPath: "/games/lighthouse-defense/index.html",
    genre: "tower-defense"
  },
  {
    id: "tile-forge",
    title: "Tile Forge",
    description: "Merge, craft, and fight through a grid-based forge.",
    playPath: "/games/tile-forge/index.html",
    genre: "puzzle"
  },
  {
    id: "rogue-grid",
    title: "Rogue Grid",
    description: "Roguelike dungeon runs on a tight grid system.",
    playPath: "/games/rogue-grid/index.html",
    genre: "roguelike"
  },
  {
    id: "grid-tycoon",
    title: "Grid Tycoon",
    description: "Build and optimize a tile economy.",
    playPath: "/games/grid-tycoon/index.html",
    genre: "strategy"
  },
  {
    id: "spy-grid",
    title: "Spy Grid",
    description: "Stealth puzzles with gadgets on a grid.",
    playPath: "/games/spy-grid/index.html",
    genre: "puzzle"
  },
  {
    id: "mirror-maze",
    title: "Mirror Maze",
    description: "Reflective labyrinth with portals and traps.",
    playPath: "/games/mirror-maze/index.html",
    genre: "puzzle"
  },
  {
    id: "grid-bomber",
    title: "Grid Bomber",
    description: "Bomb-drop tactics across destructible tiles.",
    playPath: "/games/grid-bomber/index.html",
    genre: "action"
  },
  {
    id: "wheel-of-fortune",
    title: "Wheel of Fortune",
    description: "Spin, guess, and unlock bonus puzzles.",
    playPath: "/games/wheel-of-fortune/index.html",
    genre: "trivia"
  },
  {
    id: "tile-dominion",
    title: "Tile Dominion",
    description: "Claim territory across a shifting tile map.",
    playPath: "/games/tile-dominion/index.html",
    genre: "strategy"
  },
  {
    id: "grid-gladiators",
    title: "Grid Gladiators",
    description: "Tactical arena bouts on a tile grid.",
    playPath: "/games/grid-gladiators/index.html",
    genre: "action"
  },
  {
    id: "higher-or-lower",
    title: "Higher or Lower",
    description: "Quickfire card guessing with streak multipliers.",
    playPath: "/games/higher-or-lower/index.html",
    genre: "casual"
  },
  {
    id: "tag-wars",
    title: "Tag Wars",
    description: "Competitive tag with powerups on a tight grid.",
    playPath: "/games/tag-wars/index.html",
    genre: "action"
  }
];
