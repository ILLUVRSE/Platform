import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";
import { playlist as defaultPlaylist } from "../../lib/liveloopData";
import { readJson } from "../../lib/dataLoader";
import { Suspense } from "react";
import { AddToLiveLoopButton } from "../../components/AddToLiveLoopButton";

async function loadPlaylist() {
  const data = await readJson<{ playlist: typeof defaultPlaylist }>("data/playlist.json", {
    playlist: defaultPlaylist
  });
  return data.playlist ?? defaultPlaylist;
}

export default function LiveLoopPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-gold-500/30 text-gold-100">LiveLoop</Pill>
        <h1 className="mt-3 text-4xl font-semibold">24/7 playlist, signed and auditable</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          Schedule generated media, drag/drop ordering, and publish with Kernel signatures +
          SentinelNet policy verdicts. Player exposes captions, dub tracks, and PIP Arcade.
        </p>
      </section>

      <Suspense fallback={<div>Loading playlist…</div>}>
        <PlaylistSection />
      </Suspense>
    </div>
  );
}

async function PlaylistSection() {
  const playlist = await loadPlaylist();
  return (
    <PageSection eyebrow="Playlist" title="Schedule and reorder">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Now playing"
          body={
            <div className="space-y-3 text-sm">
              {playlist.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3"
                >
                  <div className="text-cream">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-slate-200/70">{item.duration}</div>
                  </div>
                  <Pill
                    className={`${
                      item.status === "On Air"
                        ? "bg-gold-500/30 text-gold-100"
                        : item.status === "Next"
                          ? "bg-teal-600/30 text-teal-100"
                          : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {item.status}
                  </Pill>
                </div>
              ))}
              <div className="mt-4">
                <AddToLiveLoopButton title="New slot" duration="00:10" />
              </div>
            </div>
          }
        />
        <Card
          title="Proofs + publish"
          body={
            <div className="space-y-4 text-sm">
              <p>Every slot carries proofs so the Player can display them inline.</p>
              <ProofCard
                sha="9eaf:11d0...bc21"
                signer="Kernel multisig"
                timestamp="2025-02-03 15:34 UTC"
                policyVerdict="SentinelNet PASS"
              />
            </div>
          }
        />
      </div>
    </PageSection>
  );
}
