# Circuit Commander

A fast-paced tile-based wiring puzzle game. Route power from generators to sinks under time pressure, avoid overloads, and optimize for score.

## How to Play

*   **Goal:** Connect Generators (Green) to Sinks (Blue) using Wires.
*   **Controls:**
    *   **Left Click:** Place Wire / Rotate Component / Toggle Switch.
    *   **Right Click:** Remove Tile.
    *   **Keys 1-4:** Select Wire Types (Line, Corner, T-Shape, Cross).
    *   **Key 5:** Select Breaker.
    *   **Key 6:** Select Switch.
    *   **R Key:** Rotate current selection.
*   **Mechanics:**
    *   **Power:** Generators emit power pulses every tick.
    *   **Sinks:** Sinks require power. Filling them awards points.
    *   **Overload:** Wires have a capacity (15 units). If power exceeds capacity, the wire overloads and eventually breaks.
    *   **Breakers:** Have higher capacity (50) and can protect sensitive wiring.
    *   **Moving Hazards:** Generators move periodically! You must adapt your circuit on the fly.

## Development

Entry point: `index.html`
Core logic: `engine.js`
Rendering: `renderer.js`

Built with vanilla JS and HTML5 Canvas.
