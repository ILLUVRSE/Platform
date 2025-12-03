import SeriesBrowser from "./series-browser";
import { loadYuGiOhSeasons } from "@/lib/ygo";

export default function SeriesPage() {
  const seasons = loadYuGiOhSeasons();

  return (
    <div className="space-y-6">
      <header>
        <p className="uppercase text-xs tracking-[0.3em] text-white/60 mb-2">
          Series
        </p>
        <h1 className="text-3xl font-serif font-bold">Yu-Gi-Oh!</h1>
        <p className="text-white/75">
          Browse each season, pick an episode, and play instantly from the local
          library.
        </p>
      </header>

      {seasons.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          No episodes found in <code className="font-mono text-white">public/</code>.
          Drop MP4s named like "001 - S01 E01 - Title.mp4" to populate the
          library.
        </div>
      ) : (
        <SeriesBrowser seasons={seasons} />
      )}
    </div>
  );
}
