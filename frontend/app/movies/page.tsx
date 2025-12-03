export default function MoviesPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="uppercase text-xs tracking-[0.3em] text-white/60 mb-2">
          Movies
        </p>
        <h1 className="text-3xl font-serif font-bold">Movies</h1>
        <p className="text-white/75">
          Long-form renders and feature-length experiments. Wire this to your HLS/MP4 catalog.
        </p>
      </header>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
        No movies yet. Upload or generate and surface them here.
      </div>
    </div>
  );
}
