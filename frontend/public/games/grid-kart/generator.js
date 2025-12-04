import { SeededRNG } from './utils.js';

export const TILE = {
    GRASS: 0,
    ROAD: 1,
    START: 2,
    BOOST: 3,
    MUD: 4,
    JUMP: 5,
    WALL: 6
};

// Fixed layouts to guarantee closed loops on small 20x12 grid
// 1 = Road, 0 = Grass
const LAYOUTS = [
    // The Oval
    [
        "00000000000000000000",
        "00111111111111111100",
        "01111111111111111110",
        "01100000000000000110",
        "01100000000000000110",
        "01100000000000000110",
        "01100000000000000110",
        "01100000000000000110",
        "01100000000000000110",
        "01111111111111111110",
        "00111111111111111100",
        "00000000000000000000"
    ],
    // The Figure 8
    [
        "00000000000000000000",
        "00111111000011111100",
        "01100001100110000110",
        "01100000111100000110",
        "01100000011000000110",
        "01100000111100000110",
        "01100001100110000110",
        "01100000000000000110",
        "01100000000000000110",
        "01111111111111111110",
        "00111111111111111100",
        "00000000000000000000"
    ],
    // The Snake / S-Bend
    [
        "00000000000000000000",
        "01111111111111111000",
        "01100000000000011000",
        "01100000000000011000",
        "01111111111000011000",
        "00000000011000011000",
        "00000000011000011000",
        "00011111111000011000",
        "00011000000000011000",
        "00011111111111111000",
        "00000000000000000000",
        "00000000000000000000"
    ]
];

export const TrackGenerator = {
    generate: (seedString) => {
        const rng = new SeededRNG(seedString);

        // 1. Pick a layout
        const layoutTemplate = rng.pick(LAYOUTS);
        const rows = layoutTemplate.length;
        const cols = layoutTemplate[0].length;

        // Initialize grid
        const grid = [];
        const checkpoints = []; // Array of {x, y, r} (radius) or just tile indices
        let roadTiles = [];

        // Parse template
        for (let y = 0; y < rows; y++) {
            const row = [];
            for (let x = 0; x < cols; x++) {
                const char = layoutTemplate[y][x];
                let type = parseInt(char);
                row.push(type);
                if (type === TILE.ROAD) {
                    roadTiles.push({x, y});
                }
            }
            grid.push(row);
        }

        // 2. Determine Start Position (Find a flat straight section, preferably bottom or top)
        // For simplicity in this layout set, let's look for a road tile in the bottom-middle
        let startX = 0, startY = 0;
        // Search from bottom up, middle out
        let foundStart = false;
        for (let y = rows - 2; y >= 1; y--) {
            for (let x = Math.floor(cols/2); x < cols - 2; x++) {
                 if (grid[y][x] === TILE.ROAD && grid[y][x+1] === TILE.ROAD && grid[y][x-1] === TILE.ROAD) {
                     startX = x;
                     startY = y;
                     foundStart = true;
                     break;
                 }
            }
            if (foundStart) break;
        }

        // Mark Start Line
        if (foundStart) {
            grid[startY][startX] = TILE.START;
            // Also mark adjacent to ensure width
            if (grid[startY-1][startX] === TILE.ROAD) grid[startY-1][startX] = TILE.START;
            if (grid[startY+1][startX] === TILE.ROAD) grid[startY+1][startX] = TILE.START;
        }

        // 3. Decorate with Boosts and Mud
        // Strategy: Iterate road tiles. If surrounded by road (straight), chance of Boost.
        // If corner (has grass neighbor), chance of Mud.

        roadTiles.forEach(pt => {
            const {x, y} = pt;
            if (grid[y][x] === TILE.START) return; // Don't mess with start line

            // Check neighbors
            let roadNeighbors = 0;
            const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            dirs.forEach(([dx, dy]) => {
                if (grid[y+dy] && grid[y+dy][x+dx] === TILE.ROAD) roadNeighbors++;
            });

            const roll = rng.next();

            if (roadNeighbors === 4) {
                // Interior or straight
                if (roll < 0.05) {
                    grid[y][x] = TILE.BOOST;
                } else if (roll > 0.98) {
                    grid[y][x] = TILE.JUMP; // Rare jump
                }
            } else if (roadNeighbors <= 3) {
                // Edge/Corner
                if (roll < 0.1) {
                    grid[y][x] = TILE.MUD;
                }
            }
        });

        // 4. Generate Checkpoints (simple approach: quadrant based or just points along the path)
        // Since we don't have a path graph, we can use the "center of mass" angle method
        // if the track is roughly circular.
        // Calculate center of track
        let minX=cols, maxX=0, minY=rows, maxY=0;
        roadTiles.forEach(p => {
            if(p.x < minX) minX = p.x;
            if(p.x > maxX) maxX = p.x;
            if(p.y < minY) minY = p.y;
            if(p.y > maxY) maxY = p.y;
        });
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Sort road tiles by angle from center
        roadTiles.sort((a, b) => {
            const angleA = Math.atan2(a.y - centerY, a.x - centerX);
            const angleB = Math.atan2(b.y - centerY, b.x - centerX);
            return angleA - angleB;
        });

        // Place checkpoints at 0, 90, 180, 270 degrees approx
        // Or just take every Nth tile from the sorted list
        const numCheckpoints = 4;
        for(let i=0; i<numCheckpoints; i++) {
            const idx = Math.floor(roadTiles.length * (i / numCheckpoints));
            checkpoints.push(roadTiles[idx]);
        }

        // Ensure start position is included or handled separately

        return {
            grid,
            rows,
            cols,
            tileSize: 40, // Visual size, logic might use 1.0
            start: { x: startX, y: startY, angle: -Math.PI/2 }, // Pointing up?
            checkpoints
        };
    }
};
