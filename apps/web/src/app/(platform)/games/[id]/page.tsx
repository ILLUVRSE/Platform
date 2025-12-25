import { notFound } from "next/navigation";
import { gameGridManifest } from "@/lib/gameGridManifest";
import { PageSection, Pill, Card } from "@illuvrse/ui";
import Link from "next/link";

export default function GamePage({ params }: { params: { id: string } }) {
  const game = gameGridManifest.find((g) => g.id === params.id);
  if (!game) return notFound();
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-50 text-teal-700">GameGrid</Pill>
        <h1 className="mt-3 text-4xl font-semibold">{game.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">{game.description}</p>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Pill className="bg-slate-100 text-slate-700 capitalize">{game.genre}</Pill>
          <Link
            href={game.playPath}
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-card"
          >
            Play
          </Link>
        </div>
      </section>

      <PageSection eyebrow="Use in StorySphere" title="PIP + Player">
        <Card
          title="PIP configuration"
          body={<div className="text-sm text-slate-700">Set PIP to {game.playPath}.</div>}
        />
      </PageSection>
    </div>
  );
}
