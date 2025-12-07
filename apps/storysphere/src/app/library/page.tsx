import Link from "next/link";
import { Card, PageSection, Pill } from "@illuvrse/ui";
import { moviesCatalog, seriesCatalog } from "../../lib/libraryData";
import { readJson } from "../../lib/dataLoader";
import { Suspense } from "react";
import { bestFormat } from "../../lib/mediaStore";
import { AddToLiveLoopButton } from "../../components/AddToLiveLoopButton";
import { ProofCard } from "@illuvrse/ui";

async function loadLibrary() {
  const data = await readJson<{ series: typeof seriesCatalog; movies: typeof moviesCatalog }>(
    "data/library.json",
    { series: seriesCatalog, movies: moviesCatalog }
  );
  return {
    series: data.series ?? seriesCatalog,
    movies: data.movies ?? moviesCatalog
  };
}

export default function LibraryPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-slate-700 text-cream">Library</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Series and Movies</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          Reads Series and Movies from the filesystem manifests (`SERIES_ROOT`, `MOVIES_ROOT`) and
          renders typed Season/Episode models. Add any item to LiveLoop in one click.
        </p>
      </section>

      <Suspense fallback={<div>Loading library…</div>}>
        <LibrarySections />
      </Suspense>
    </div>
  );
}

async function LibrarySections() {
  const { series, movies } = await loadLibrary();
  return (
    <>
      <PageSection eyebrow="Series" title="Seasons and episodes">
        <div className="grid gap-4 md:grid-cols-3">
          {series.map((show) => (
            <Card
              key={show.title}
              title={show.title}
              body={
                <div className="text-sm text-slate-200/80">
                  {show.seasons.length} seasons ·{" "}
                  {show.seasons.reduce((acc, s) => acc + s.episodes.length, 0)} episodes
                </div>
              }
              footer={<AddToLiveLoopButton title={show.title} duration="00:00" />}
            />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Movies" title="Pick the best format">
        <div className="grid gap-4 md:grid-cols-3">
          {await Promise.all(
            movies.map(async (movie) => {
              const best = await bestFormat(movie.title);
              return (
                <Card
                  key={movie.title}
                  title={movie.title}
                  body={
                    <div className="text-sm text-slate-200/80">
                      Duration {movie.duration}
                      <div className="mt-1 text-[12px]">
                        Best format: {best ? best.path : "not found"}
                        {best?.sha256 && (
                          <ProofCard
                            sha={best.sha256}
                            signer="local-sha256"
                            timestamp={new Date().toISOString()}
                          />
                        )}
                      </div>
                    </div>
                  }
                  footer={<AddToLiveLoopButton title={movie.title} duration={movie.duration} />}
                />
              );
            })
          )}
        </div>
      </PageSection>
    </>
  );
}
