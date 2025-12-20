import { Card, PageSection, Pill } from "@illuvrse/ui";

export default function PlayerPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-50 text-teal-700">Player</Pill>
        <h1 className="mt-3 text-4xl font-semibold">HLS player with PIP Arcade</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          Captions, dub tracks, wiki overlays, PIP for GameGrid, and inline proof badges so viewers
          know each piece is signed.
        </p>
      </section>

      <PageSection eyebrow="Controls" title="Viewer experience">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Playback"
            body={
              <div className="space-y-3 text-sm">
                <p>HLS with adaptive bitrate, captions, and multilingual audio.</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Tracks
                  </div>
                  <div className="mt-2 space-y-2 text-slate-900">
                    <div className="flex items-center justify-between">
                      <span>English (CC)</span>
                      <Pill className="bg-slate-100 text-slate-700">Default</Pill>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Spanish dub</span>
                      <Pill className="bg-teal-100 text-teal-700">Active</Pill>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
          <Card
            title="Arcade PIP"
            body={
              <div className="space-y-3 text-sm">
                <p>Embed a GameGrid title beside the stream; viewers can play while watching.</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Arcade
                  </div>
                  <div className="mt-2 text-slate-900">Grid Kart · playPath /studio/games/grid-kart/index.html</div>
                </div>
              </div>
            }
          />
        </div>
      </PageSection>
    </div>
  );
}
