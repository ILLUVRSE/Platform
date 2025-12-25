"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageSection } from "@illuvrse/ui";
import { gameGridManifest, type GameEntry } from "../app/studio/lib/gameGridManifest";

function formatGenre(genre: string) {
  return genre
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function GameGridListing() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const sections = useMemo(() => {
    const featured = gameGridManifest.slice(0, 8);
    const genreMap = new Map<string, GameEntry[]>();
    gameGridManifest.forEach((game) => {
      if (!genreMap.has(game.genre)) {
        genreMap.set(game.genre, []);
      }
      genreMap.get(game.genre)?.push(game);
    });
    const genreSections = Array.from(genreMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([genre, items]) => ({
        id: `genre-${genre}`,
        title: `${formatGenre(genre)} picks`,
        items,
        variant: "genre" as const
      }));
    return [
      {
        id: "featured",
        title: "Featured on GameGrid",
        items: featured,
        variant: "featured" as const
      },
      ...genreSections
    ];
  }, []);

  const activeGame = activeGameId
    ? gameGridManifest.find((game) => game.id === activeGameId)
    : null;

  return (
    <PageSection
      eyebrow="GameGrid"
      title="Playable arcade inside StorySphere"
      id="gamegrid"
      className="scroll-mt-28"
    >
      <div className="space-y-8">
        {sections.map((section) => {
          const isFeatured = section.variant === "featured";
          const tileWidth = isFeatured
            ? "min-w-[260px] sm:min-w-[320px] lg:min-w-[360px]"
            : "min-w-[220px] sm:min-w-[260px] lg:min-w-[300px]";
          const tileGradient = isFeatured
            ? "from-slate-900 via-slate-800 to-teal-700/70"
            : "from-slate-900 via-slate-800 to-slate-700";
          return (
            <div key={section.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Row</div>
                  <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                </div>
                <Link
                  href="/studio/gamegrid"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800 underline underline-offset-4 transition hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  View all
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#fffbf4] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#fffbf4] to-transparent" />
                <div
                  role="region"
                  aria-label={`${section.title} row`}
                  className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth"
                >
                  {section.items.map((game) => (
                    <div key={game.id} className={`${tileWidth} shrink-0`}>
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-card transition hover:-translate-y-1 focus-within:-translate-y-1">
                        <div className={`relative aspect-[16/9] bg-gradient-to-br ${tileGradient}`}>
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                          <div className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                            {formatGenre(game.genre)}
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 space-y-1">
                            <div className="text-sm font-semibold">{game.title}</div>
                            <p className="text-xs text-white/70">{game.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-slate-950/80 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setActiveGameId(game.id)}
                            aria-label={`Play ${game.title}`}
                            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-teal-200 hover:text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          >
                            Play now
                          </button>
                          <Link
                            href={`/games/${game.id}`}
                            aria-label={`${game.title} details`}
                            className="text-[11px] font-semibold text-white/80 underline underline-offset-4 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/70"
            onClick={() => setActiveGameId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${activeGame.title} preview`}
            className="relative z-10 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">GameGrid</div>
                <div className="text-lg font-semibold text-slate-900">{activeGame.title}</div>
                <div className="text-sm text-slate-600">{activeGame.description}</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGameId(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-teal-200 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Close
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
              <iframe
                title={`${activeGame.title} preview`}
                src={activeGame.playPath}
                className="h-[60vh] w-full"
                loading="lazy"
                allowFullScreen
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/games/${activeGame.id}`}
                className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-teal-200 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Details
              </Link>
              <a
                href={activeGame.playPath}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-teal-200 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Open full screen
              </a>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {formatGenre(activeGame.genre)}
              </span>
            </div>
          </div>
        </div>
      )}
    </PageSection>
  );
}
