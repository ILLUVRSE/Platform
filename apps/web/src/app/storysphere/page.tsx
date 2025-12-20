import Link from "next/link";
import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";
import { GameGridListing } from "../../components/GameGridListing";

const pipelineSteps = [
  "Prompt & script (Ollama)",
  "Voice (ElevenLabs)",
  "Frames (ComfyUI)",
  "Assembly (FFmpeg/HLS)",
  "Publish to LiveLoop"
];

const gameGridHighlights = [
  "Riverport Baseball League",
  "Nebula Runner",
  "Grid Kart",
  "Rogue Grid",
  "Wheel of Fortune"
];

export default function StorySpherePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-50 text-teal-700">StorySphere</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Personal studio: prompt → MP4 → LiveLoop</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          Generate previews, assemble final MP4s, and stream them 24/7 on LiveLoop with PIP Arcade
          and a GameGrid library. Every publish carries Kernel signatures and SentinelNet verdicts.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/playground"
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Generate a 7s preview
          </Link>
          <Link
            href="#liveloop"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
          >
            View LiveLoop
          </Link>
        </div>
      </section>

      <PageSection eyebrow="Pipeline" title="How StorySphere builds your piece">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card
            title="Prompt to preview"
            body={
              <div className="space-y-3">
                <p>
                  The studio runs locally-first with fast previews, then escalates to final MP4
                  assembly when approved.
                </p>
                <ul className="list-disc space-y-2 pl-4 text-sm text-slate-700">
                  {pipelineSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            }
          />
          <Card
            title="LiveLoop ready"
            body={
              <div className="space-y-3">
                <p>
                  Every render can be added to LiveLoop with a schedule slot. The player exposes PIP,
                  captions, dub tracks, and watch-party hooks.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    LiveLoop slot
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span>Arcadia // 00:18</span>
                      <Pill className="bg-gold-500/20 text-gold-400">Next</Pill>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span>StorySphere LiveLoop</span>
                      <Pill className="bg-teal-100 text-teal-700">Signed</Pill>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
          <Card
            title="Proofs built in"
            body={
              <div className="space-y-3">
                <p>
                  Kernel signatures and SentinelNet policy verdicts ride along with every publish,
                  so LiveLoop and Player can display verifiable badges.
                </p>
                <ProofCard
                  sha="6d3a:92f1...aa7c"
                  signer="Kernel multisig"
                  timestamp="2025-02-03 14:35 UTC"
                  policyVerdict="SentinelNet PASS"
                />
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="LiveLoop" title="24/7 stream, playlist-driven" id="liveloop">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Playlist editor"
            body={
              <div className="space-y-3">
                <p>Drag/drop ordering, scheduled start windows, and on-air indicator.</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-900">
                    <span>Slot 01 · Arcadia Dawn</span>
                    <Pill className="bg-gold-500/20 text-gold-400">Live</Pill>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Next: Neon Runner · 00:21 — proof: <code>c1e7...901a</code>
                  </div>
                </div>
              </div>
            }
          />
          <Card
            title="Player surface"
            body={
              <div className="space-y-3">
                <p>
                  HLS with captions, dub tracks, and Arcade PIP from GameGrid. Suitable for embedding
                  across www.illuvrse.com.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    PIP Arcade
                  </div>
                  <div className="mt-2 text-slate-900">Play “Grid Kart” while the stream runs.</div>
                </div>
              </div>
            }
          />
        </div>
      </PageSection>

      <GameGridListing />
    </div>
  );
}
