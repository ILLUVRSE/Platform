import Link from "next/link";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import { surfaceUrls } from "@/lib/navigation";

const productTiles = [
  {
    title: "IDEA",
    body: "Creator surface to build artifacts, compute SHA-256, sandbox, and request Kernel signatures.",
    href: "/developers#idea"
  },
  {
    title: "Kernel",
    body: "Signer, RBAC, audit ledger, multisig, and SentinelNet policy enforcement.",
    href: "/developers#kernel"
  },
  {
    title: "Marketplace",
    body: "List, preview, and deliver signed artifacts with checkout and Finance integration.",
    href: "/marketplace"
  },
  {
    title: "StorySphere",
    body: "Prompt → preview → MP4 → LiveLoop; personal studio with Player + GameGrid.",
    href: "/storysphere"
  },
  {
    title: "LiveLoop",
    body: "24/7 playlist stream; publish generated media with proofs and PIP Arcade.",
    href: "/storysphere#liveloop"
  },
  {
    title: "Control-Panel",
    body: "Operator surface with policy verdicts, audit log explorer, and maintenance toggles.",
    href: "/control-panel"
  },
  {
    title: "Mom Kitech",
    body: "FoodNetwork-style kitchen and recipes hub with AI-assisted menus.",
    href: surfaceUrls.food
  },
  {
    title: "Gridstock",
    body: "CNBC/Bloomberg-style market terminal with live dashboards and trading play.",
    href: surfaceUrls.gridstock
  }
];

const journeys = [
  {
    label: "Creator",
    steps: "IDEA → Kernel signature → Marketplace listing → buyer checkout → signed delivery"
  },
  {
    label: "Studio",
    steps: "Prompt → preview → MP4 → publish to LiveLoop → watch in Player + Arcade"
  },
  {
    label: "Operator",
    steps: "Control-Panel → SentinelNet policy → Reasoning Graph trace → audit-proof snapshot"
  }
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-12 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <Pill className="bg-teal-50 text-teal-700">Governed creator platform</Pill>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Create, sign, deliver — ILLUVRSE is trust-first creator tooling and a personal studio.
            </h1>
            <p className="text-lg text-slate-700">
              Build artifacts in IDEA, get Kernel signatures, publish to Marketplace, and show the
              output in StorySphere: prompt to MP4, LiveLoop streaming, and GameGrid Arcade.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/developers"
                className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
              >
                Get started in IDEA
              </Link>
              <Link
                href="/storysphere#liveloop"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
              >
                Try StorySphere LiveLoop
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-card md:w-[340px]">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Live demo</div>
            <div className="aspect-video rounded-xl bg-gradient-to-br from-slate-700 via-teal-600/40 to-gold-500/60" />
            <div className="text-sm text-slate-700">
              StorySphere LiveLoop preview — streaming generated MP4s with inline proofs.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBadge label="LiveLoop" value="ON AIR" variant="success" />
              <StatBadge label="Signed artifacts" value="100% verified" variant="neutral" />
            </div>
          </div>
        </div>
      </section>

      <PageSection
        eyebrow="Trust layer"
        title="Signed, auditable, policy-enforced"
        cta={
          <Link
            href="/developers#verify"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
          >
            Verify a signed artifact
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <ProofCard
            sha="1f0b:bc9e...c2d1"
            signer="Kernel multisig"
            timestamp="2025-02-03 14:22 UTC"
            ledgerLink="/developers#ledger"
            policyVerdict="SentinelNet PASS"
          />
          <Card
            title="Reasoning Graph"
            body={
              <p>
                Every promotion and rollback emits a trace with deterministic policy verdicts and
                causal context so operators can explain decisions.
              </p>
            }
          />
          <Card
            title="Audit everywhere"
            body={
              <p>
                Kernel signatures, SentinelNet badges, Marketplace manifests, and LiveLoop publish
                events all ship with proofs and local verification.
              </p>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Products" title="Everything you need in one platform">
        <div className="grid gap-4 md:grid-cols-3">
          {productTiles.map((tile) => (
            <Card
              key={tile.title}
              title={tile.title}
              body={<p>{tile.body}</p>}
              footer={
                <Link
                  href={tile.href}
                  className="text-sm font-semibold text-teal-700 underline underline-offset-4"
                >
                  Explore {tile.title}
                </Link>
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Journeys" title="Clear golden paths to production">
        <div className="grid gap-4 md:grid-cols-3">
          {journeys.map((journey) => (
            <Card
              key={journey.label}
              title={journey.label}
              body={<p>{journey.steps}</p>}
              footer={
                <Link
                  href="/developers"
                  className="text-sm font-semibold text-teal-700 underline underline-offset-4"
                >
                  View quickstart
                </Link>
              }
            />
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Live demo" title="Player, LiveLoop, and GameGrid everywhere">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="StorySphere Player"
            body={
              <div className="space-y-3">
                <p>
                  HLS player with PIP Arcade (GameGrid), captions, language tracks, and proof
                  badges. Embed on any page to show what creators make.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Playlist
                  </div>
                  <div className="mt-2 space-y-2 text-sm text-slate-900">
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span>Chronicles of the Grid · 00:24</span>
                      <Pill className="bg-teal-100 text-teal-700">Signed</Pill>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                      <span>LiveLoop // Next on Air</span>
                      <Pill className="bg-gold-500/20 text-gold-400">Live</Pill>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
          <Card
            title="Developer playground"
            body={
              <div className="space-y-4">
                <p>
                  Call <code>POST /api/v1/generate</code> with a prompt, watch preview generation,
                  and publish to LiveLoop with a signed manifest.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Example request
                  </div>
                  <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 text-[12px] leading-relaxed text-slate-900">
{`POST /api/v1/generate
{
  "prompt": "neon harbor at dawn, tilt-shift",
  "duration": 7,
  "publishToLiveLoop": true
}`}
                  </pre>
                </div>
              </div>
            }
          />
        </div>
      </PageSection>
    </div>
  );
}
