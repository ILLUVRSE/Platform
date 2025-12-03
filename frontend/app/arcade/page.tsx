"use client";

const games = [
  { title: "Nebula Runner", desc: "Endless runner prototype for PIP.", status: "Coming soon" },
  { title: "Lighthouse Defense", desc: "Tower defense built for browser play.", status: "Coming soon" },
];

export default function ArcadePage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="uppercase text-xs tracking-[0.3em] text-white/60 mb-2">
          Arcade
        </p>
        <h1 className="text-3xl font-serif font-bold">Arcade</h1>
        <p className="text-white/75">
          Embed WebGL/HTML5 games and dock them in the player PIP.
        </p>
      </header>
      <div className="grid sm:grid-cols-2 gap-4">
        {games.map((game) => (
          <div
            key={game.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{game.title}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15">
                {game.status}
              </span>
            </div>
            <p className="text-white/70 text-sm">{game.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
