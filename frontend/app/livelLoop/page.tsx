const shows = [
  { title: "Lighthouse Storm", duration: "7m", status: "Ready", thumb: "🌊" },
  { title: "Nebula Drift", duration: "12m", status: "Queued", thumb: "✨" },
  { title: "Midnight Market", duration: "9m", status: "Ready", thumb: "🏮" },
  { title: "Aurora Bloom", duration: "5m", status: "Ready", thumb: "🌌" },
];

export default function LiveLoopPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="uppercase text-xs tracking-[0.3em] text-white/60">
          LiveLoop
        </p>
        <h1 className="text-3xl font-serif font-bold">Roku-style Channel</h1>
        <p className="text-white/75">
          Grid of on-deck items with an inline player. Hook this to your HLS or
          MP4 playlist when ready.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
        <div className="relative aspect-video bg-gradient-to-br from-[var(--color-primary)] to-black/60 flex items-center justify-center text-white/80">
          <div className="text-center space-y-2">
            <div className="text-sm uppercase tracking-[0.2em] text-white/60">
              Live Player
            </div>
            <div className="text-2xl font-semibold">Preview stream</div>
            <div className="text-xs text-white/50">
              Wire this to your HLS/MP4 source.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Up Next</h2>
          <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15">
            Playlist length: {shows.length}
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shows.map((show) => (
            <div
              key={show.title}
              className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 hover:border-[var(--color-accent)]/40 transition"
            >
              <div className="rounded-lg bg-black/30 aspect-video flex items-center justify-center text-3xl">
                {show.thumb}
              </div>
              <div className="space-y-1">
                <div className="font-semibold">{show.title}</div>
                <div className="text-sm text-white/60">{show.duration}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15 self-start">
                {show.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
