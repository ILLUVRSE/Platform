import Link from "next/link";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import { buildMetadata } from "@/lib/metadata";

const title = "StorySphere | Prompt to MP4 studio and LiveLoop";
const description =
  "StorySphere is the personal studio inside ILLUVRSE: prompt to MP4 previews, LiveLoop playlists, and GameGrid-ready playback with proofs.";
const pageUrl = "https://www.illuvrse.com/storysphere";

export const metadata = buildMetadata({
  title,
  description,
  path: "/storysphere"
});

const samplePrompt =
  "Cinematic sunrise over Arcadia Harbor, soft fog, neon reflections, 12 shots";
const studioPromptHref = `/studio?prompt=${encodeURIComponent(samplePrompt)}`;

const storysphereJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StorySphere",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description,
  url: pageUrl,
  publisher: {
    "@type": "Organization",
    name: "ILLUVRSE"
  }
};

const pipelineSteps = [
  {
    title: "Prompt & script",
    tool: "Ollama",
    description: "Draft beats, pacing, and shot intent from the prompt.",
    output: "Beat sheet + shot list",
    signal: "Review gates",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5 text-teal-800"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M3 21l3.5-1L18 8.5 15.5 6 4 17.5 3 21z" />
        <path d="M13.5 6.5l2.5 2.5" />
      </svg>
    )
  },
  {
    title: "Voice & dubbing",
    tool: "ElevenLabs",
    description: "Generate narration and localized tracks with tone control.",
    output: "Narration + dub tracks",
    signal: "Tone controls",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5 text-teal-800"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    )
  },
  {
    title: "Frames & motion",
    tool: "ComfyUI",
    description: "Render keyframes, style passes, and motion composites.",
    output: "Keyframes + style passes",
    signal: "Look locks",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5 text-teal-800"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="M7 15l3-3 3 3 4-4 3 3" />
      </svg>
    )
  },
  {
    title: "Assembly & proofs",
    tool: "FFmpeg/HLS",
    description: "Stitch MP4 + HLS, attach Kernel proofs, prep LiveLoop.",
    output: "MP4 + HLS + proofs",
    signal: "Kernel signature",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5 text-teal-800"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M4 7l8-4 8 4-8 4-8-4z" />
        <path d="M4 12l8 4 8-4" />
        <path d="M4 17l8 4 8-4" />
      </svg>
    )
  },
  {
    title: "Publish & schedule",
    tool: "LiveLoop",
    description: "Slot into playlists with PIP Arcade metadata.",
    output: "LiveLoop slot",
    signal: "PIP metadata",
    icon: (
      <svg
        aria-hidden="true"
        className="h-5 w-5 text-teal-800"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M12 3v12" />
        <path d="M7 8l5-5 5 5" />
        <path d="M5 21h14" />
      </svg>
    )
  }
];

const gameGridHighlights = [
  "Riverport Baseball League",
  "Nebula Runner",
  "Grid Kart",
  "Rogue Grid",
  "Wheel of Fortune"
];

const personas = [
  {
    title: "Indie creator",
    description: "Ship short previews fast, then scale to final MP4s with proofs attached.",
    bullets: [
      "Rapid iterations before final render",
      "Consistent look across episodes",
      "Proofs attached to every publish"
    ]
  },
  {
    title: "Studio lead",
    description: "Coordinate multi-shot runs, review approvals, and schedule LiveLoop drops.",
    bullets: [
      "Preview approvals with audit trail",
      "Unified publish + scheduling",
      "Shared GameGrid-ready metadata"
    ]
  },
  {
    title: "Operator",
    description: "Verify publish events, track policy verdicts, and keep LiveLoop compliant.",
    bullets: [
      "Proofs and policy verdicts on demand",
      "Signed artifacts in every slot",
      "Audit-friendly deployment history"
    ]
  }
];

const sampleRun = [
  {
    time: "00:00",
    title: "Prompt locked",
    detail: "Arcadia Dawn, coastal sunrise, 12 shots."
  },
  {
    time: "00:45",
    title: "Voice draft",
    detail: "Narration pass with a warm tone and a short dub track."
  },
  {
    time: "02:10",
    title: "Preview ready",
    detail: "7s MP4 with captions for approval."
  },
  {
    time: "06:30",
    title: "Final assembly",
    detail: "00:18 MP4 + HLS with proofs attached."
  },
  {
    time: "08:05",
    title: "LiveLoop scheduled",
    detail: "Slot 01 with PIP Arcade metadata."
  }
];

const sectionLinks = [
  { label: "For you", href: "#personas" },
  { label: "Pipeline", href: "#pipeline" }
];

export default function StorySpherePage() {
  return (
    <div className="relative space-y-12">
      <script type="application/ld+json">{JSON.stringify(storysphereJsonLd)}</script>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 px-6 py-10 shadow-card md:px-8 md:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-6 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-0 h-80 w-80 -translate-x-1/3 rounded-full bg-gold-500/20 blur-3xl"
        />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4 animate-rise motion-reduce:animate-none">
            <Pill className="bg-teal-100 text-teal-800 ring-1 ring-teal-200">StorySphere</Pill>
            <h1 className="text-balance text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Personal studio: prompt → MP4 → LiveLoop
            </h1>
            <p className="max-w-2xl text-lg text-slate-700">
              Generate previews, assemble final MP4s, and stream them 24/7 on LiveLoop with PIP
              Arcade and a GameGrid library. Every publish carries Kernel signatures and
              SentinelNet verdicts.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={studioPromptHref}
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Open Studio
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Request access
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                Local-first
              </span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                Signed publish
              </span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                PIP arcade
              </span>
            </div>
          </div>

          <div className="relative animate-rise animate-rise-delay-2 motion-reduce:animate-none">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-card">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Studio preview</span>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-[11px] font-semibold text-teal-800">
                  LiveLoop
                </span>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-teal-600/70">
                  <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    On Air
                  </div>
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    Live
                  </div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-sm font-semibold">Arcadia // 00:18</div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/70">
                      Signed - SentinelNet PASS
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    PIP Arcade
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatBadge label="Output" value="MP4 + HLS" variant="neutral" />
                <StatBadge label="Proofs" value="Kernel signed" variant="success" />
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Arcade lineup
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {gameGridHighlights.map((title) => (
                    <span
                      key={title}
                      className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="StorySphere sections" className="sticky top-20 z-20 -mt-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-card backdrop-blur">
            {sectionLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1 transition hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <PageSection
        eyebrow="Who it's for"
        title="Built for creators, studio teams, and operators"
        id="personas"
        className="scroll-mt-28"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {personas.map((persona, index) => (
            <Card
              key={persona.title}
              title={persona.title}
              className={`${
                index === 0 ? "bg-gradient-to-br from-white to-slate-50" : ""
              } animate-rise ${index === 1 ? "animate-rise-delay-1" : index === 2 ? "animate-rise-delay-2" : ""} motion-reduce:animate-none`}
              body={
                <div className="space-y-3">
                  <p>{persona.description}</p>
                  <ul className="list-disc space-y-2 pl-4 text-sm text-slate-700">
                    {persona.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection
        eyebrow="Pipeline"
        title="How StorySphere builds your piece"
        id="pipeline"
        className="relative scroll-mt-28 overflow-hidden bg-white/90"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-10 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"
        />
        <div className="relative grid gap-6 lg:grid-cols-3">
          <Card
            title="Pipeline flight plan"
            className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 animate-rise animate-rise-delay-1 motion-reduce:animate-none"
            body={
              <div className="space-y-4">
                <p>
                  The studio stays local-first for previews, then escalates to final MP4 assembly
                  when approved.
                </p>
                <ol className="grid gap-4 md:grid-cols-2">
                  {pipelineSteps.map((step, index) => (
                    <li key={step.title}>
                      <details
                        className="group rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                        open={index === 0}
                      >
                        <summary className="flex cursor-pointer list-none items-center gap-3 text-slate-700 transition group-open:text-teal-900">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-800 ring-1 ring-teal-200">
                            {step.icon}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              {step.tool}
                            </div>
                          </div>
                          <span className="ml-auto inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            Details
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4 transition-transform group-open:rotate-180"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </span>
                        </summary>
                        <div className="mt-3 text-sm text-slate-700">
                          <p>{step.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                              Output: {step.output}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                              Signal: {step.signal}
                            </span>
                          </div>
                        </div>
                      </details>
                    </li>
                  ))}
                </ol>
              </div>
            }
          />
          <div className="grid gap-6">
            <Card
              title="LiveLoop ready"
              className="animate-rise animate-rise-delay-2 motion-reduce:animate-none"
              body={
                <div className="space-y-3">
                  <p>
                    Every render can be added to LiveLoop with a schedule slot. The player exposes
                    PIP, captions, dub tracks, and watch-party hooks.
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      LiveLoop slot
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                        <span>Arcadia // 00:18</span>
                        <Pill className="bg-gold-500/20 text-slate-900 ring-1 ring-gold-500/30">
                          Next
                        </Pill>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                        <span>StorySphere LiveLoop</span>
                        <Pill className="bg-teal-100 text-slate-900 ring-1 ring-teal-200">
                          Signed
                        </Pill>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
            <Card
              title="Sample run"
              className="animate-rise animate-rise-delay-3 motion-reduce:animate-none"
              body={
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Prompt</div>
                    <div className="mt-2 text-sm text-slate-900">
                      {samplePrompt}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Timeline
                    </div>
                    <div className="mt-3 border-l border-slate-200 pl-4">
                      <ul className="space-y-3">
                        {sampleRun.map((step) => (
                          <li key={step.time} className="relative">
                            <span className="absolute -left-[22px] top-2 h-2 w-2 rounded-full bg-teal-500" />
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                              {step.time}
                            </div>
                            <div className="text-sm font-semibold text-slate-900">
                              {step.title}
                            </div>
                            <div className="text-sm text-slate-700">{step.detail}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Link
                    href={studioPromptHref}
                    className="text-sm font-semibold text-teal-800 underline underline-offset-4 transition hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Generate this prompt
                  </Link>
                </div>
              }
            />
            <Card
              title="Proofs built in"
              className="animate-rise animate-rise-delay-4 motion-reduce:animate-none"
              body={
                <div className="space-y-3">
                  <p>
                    Kernel signatures and SentinelNet policy verdicts ride along with every
                    publish, so LiveLoop and Player can display verifiable badges.
                  </p>
                  <ProofCard
                    sha="6d3a:92f1...aa7c"
                    signer="Kernel multisig"
                    timestamp="2025-02-03 14:35 UTC"
                    ledgerLink="/developers#ledger"
                    policyVerdict="SentinelNet PASS"
                  />
                  <p className="text-sm text-slate-600">
                    Proofs travel with each artifact so operators can verify without leaving the
                    studio.
                  </p>
                  <Link
                    href="/developers#verify"
                    className="text-sm font-semibold text-teal-800 underline underline-offset-4 transition hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Verify a proof
                  </Link>
                </div>
              }
            />
          </div>
        </div>
      </PageSection>
    </div>
  );
}
