"use client";

import { gameGridManifest } from "@/lib/gameGridManifest";

export default function GameGridPage() {
  const games: GameCardProps[] = gameGridManifest.map((game) => {
    const href = game.playPath ?? `/games/${game.slug}/index.html`;
    const pipHref = game.pipPath ?? href;

    return {
      emoji: game.emoji,
      title: game.title,
      desc: game.shortDesc,
      href,
      pipHref,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="uppercase text-xs tracking-[0.3em] text-white/60 mb-2">
          GameGrid
        </p>
        <h1 className="text-3xl font-serif font-bold">GameGrid</h1>
        <p className="text-white/75">
          Short, lightweight browser games — click to play or pop into a mini-player.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
        <h2 className="text-xl font-semibold">Featured</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {games.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
        <h2 className="text-xl font-semibold">Basic arcade for now</h2>
        <p className="text-sm text-white/70">
          GameGrid is a simple arcade today. We’ll wire deeper PIP integration and a richer catalog
          once the viewer shell and LiveLoop pairing are ready.
        </p>
      </section>
    </div>
  );
}

type GameCardProps = {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  pipHref: string;
};

function GameCard({ emoji, title, desc, href, pipHref }: GameCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="text-2xl">{emoji}</div>
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-white/70">{desc}</p>
      <div className="flex gap-2 text-xs">
        <a
          href={href}
          className="px-3 py-2 rounded-full bg-[var(--color-gold)] text-black font-semibold shadow hover:opacity-90"
          target="_blank"
          rel="noreferrer"
        >
          Play
        </a>
        <a
          href={pipHref}
          className="px-3 py-2 rounded-full border border-white/15 hover:bg-white/10"
          target="_blank"
          rel="noreferrer"
        >
          Open in PIP window
        </a>
      </div>
    </div>
  );
}
