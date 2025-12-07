import Link from "next/link";
import { Card, PageSection, Pill } from "@illuvrse/ui";
import { gameGridManifest } from "../../lib/gameGridManifest";

export default function GameGridPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-teal-600/20 text-teal-200">GameGrid</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Arcade built into StorySphere</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          Lightweight HTML5/tile games playable in PIP alongside LiveLoop. Manifest-driven so new
          games can be added by updating one file.
        </p>
      </section>

      <PageSection eyebrow="Manifest" title="Games available today">
        <div className="grid gap-4 md:grid-cols-3">
          {gameGridManifest.map((game) => (
            <Card
              key={game.id}
              title={game.title}
              body={
                <div className="space-y-2 text-sm">
                  <p>{game.description}</p>
                  <Pill className="bg-slate-700 text-slate-200 capitalize">{game.genre}</Pill>
                  <div className="text-[12px] text-slate-200/80">
                    playPath: <code>{game.playPath}</code>
                  </div>
                </div>
              }
              footer={
                <div className="flex items-center justify-between">
                  <Link
                    href={game.playPath}
                    className="text-sm font-semibold text-teal-300 underline underline-offset-4"
                  >
                    Launch
                  </Link>
                  <Link
                    href={`/games/${game.id}`}
                    className="text-sm font-semibold text-cream underline underline-offset-4"
                  >
                    Details
                  </Link>
                </div>
              }
            />
          ))}
        </div>
        <div className="mt-4 text-sm text-slate-200/80">
          Canonical manifest: <code>apps/storysphere/src/lib/gameGridManifest.ts</code>
        </div>
      </PageSection>
    </div>
  );
}
