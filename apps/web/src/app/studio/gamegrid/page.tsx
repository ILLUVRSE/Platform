import Link from "next/link";
import { Card, PageSection, Pill } from "@illuvrse/ui";
import { gameGridManifest } from "@studio/lib/gameGridManifest";

export default function GameGridPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-50 text-teal-700">GameGrid</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Arcade built into StorySphere</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
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
                  <Pill className="bg-slate-100 text-slate-700 capitalize">{game.genre}</Pill>
                  <div className="text-[12px] text-slate-600">
                    playPath: <code>{game.playPath}</code>
                  </div>
                </div>
              }
              footer={
                <div className="flex items-center justify-between">
                  <Link
                    href={game.playPath}
                    className="text-sm font-semibold text-teal-700 underline underline-offset-4"
                  >
                    Launch
                  </Link>
                  <Link
                    href={`/studio/games/${game.id}`}
                    className="text-sm font-semibold text-slate-700 underline underline-offset-4"
                  >
                    Details
                  </Link>
                </div>
              }
            />
          ))}
        </div>
        <div className="mt-4 text-sm text-slate-600">
          Canonical manifest: <code>apps/web/src/app/studio/lib/gameGridManifest.ts</code>
        </div>
      </PageSection>
    </div>
  );
}
