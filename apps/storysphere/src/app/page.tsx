import Link from "next/link";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import { GeneratePanel } from "../components/GeneratePanel";

const pipeline = [
  "Prompt + script (Ollama)",
  "Voice (ElevenLabs)",
  "Frames (ComfyUI)",
  "Assembly (FFmpeg/HLS)",
  "Publish to LiveLoop"
];

export default function StorySphereStudioPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-teal-600/20 text-teal-200">Studio</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Prompt → Preview → MP4 → LiveLoop</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          The personal studio of ILLUVRSE. Generate previews, approve finals, publish to LiveLoop,
          and embed the Player with PIP Arcade. Everything is signed and auditable.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/liveloop"
            className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
          >
            Open LiveLoop
          </Link>
          <Link
            href="/gamegrid"
            className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
          >
            Open GameGrid
          </Link>
        </div>
      </section>

      <PageSection eyebrow="Pipeline" title="Golden path to air">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card
            title="Creator workflow"
            body={
              <div className="space-y-3">
                <p>Preview fast, then render finals with proofs.</p>
                <ol className="list-decimal space-y-2 pl-4 text-sm text-slate-200/80">
                  {pipeline.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            }
          />
          <Card
            title="Publishing"
            body={
              <div className="space-y-3 text-sm">
                <p>Add to LiveLoop with schedule slots. Player surfaces captions, dub tracks, and PIP Arcade.</p>
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">
                    LiveLoop slot
                  </div>
                  <div className="mt-2 flex items-center justify-between text-cream">
                    <span>Arcadia Dawn · 00:18</span>
                    <Pill className="bg-gold-500/30 text-gold-100">On Air</Pill>
                  </div>
                </div>
              </div>
            }
          />
          <Card
            title="Proofs"
            body={
              <div className="space-y-3 text-sm">
                <p>Every render produces a signed manifest + SentinelNet verdict.</p>
                <ProofCard
                  sha="c3db:901a...8ff1"
                  signer="Kernel multisig"
                  timestamp="2025-02-03 15:22 UTC"
                  policyVerdict="SentinelNet PASS"
                />
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Generate" title="Submit a prompt and see jobs">
        <GeneratePanel />
      </PageSection>

      <PageSection eyebrow="Status" title="LiveLoop + jobs at a glance">
        <div className="grid gap-4 md:grid-cols-3">
          <StatBadge label="LiveLoop" value="On Air" variant="success" />
          <StatBadge label="Jobs in queue" value="3" variant="warning" />
          <StatBadge label="Signed outputs" value="24" variant="neutral" />
        </div>
      </PageSection>
    </div>
  );
}
