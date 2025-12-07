import { Card, PageSection, Pill } from "@illuvrse/ui";
import Link from "next/link";

export default function DevelopersPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-slate-700 text-teal-200">Developers</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Specs, legal, and support for ACE + platform</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          Official specs for ACE agents, Kernel/Marketplace contracts, and legal claims. Submit issues directly to Ryan’s team when you hit errors.
        </p>
      </section>

      <PageSection eyebrow="ACE Manifest" title="Agent Creation Experience spec" id="ace-spec">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Required fields"
            body={
              <div className="text-sm text-slate-200/80 space-y-2">
                <div>Identity: archetype, biological style, alignment sliders.</div>
                <div>Appearance: style preset, morph params, surface/animation settings.</div>
                <div>Personality: traits (3–5), interaction style, emotional range.</div>
                <div>Attributes: sliders, perks, preset build id.</div>
                <div>Voice: base, modifiers, FX, activation line.</div>
              </div>
            }
          />
          <Card
            title="Kernel + SentinelNet"
            body={
              <div className="text-sm text-slate-200/80 space-y-2">
                <div>Manifest must be SHA-256 hashed and signed by Kernel.</div>
                <div>SentinelNet policy verdict required before publish.</div>
                <div>Audit events emitted for activation/publish/update.</div>
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="APIs" title="Platform endpoints" id="api">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Kernel & SentinelNet"
            body={
              <div className="space-y-2 text-sm">
                <code>POST /api/kernel/sign</code> – sign ACE manifest (SHA-256).<br />
                <code>POST /api/kernel/verify</code> – verify signature.<br />
                <code>POST /api/sentinel/evaluate</code> – policy verdict / canary.
              </div>
            }
          />
          <Card
            title="Marketplace / Finance / ArtifactPublisher"
            body={
              <div className="space-y-2 text-sm">
                <code>GET /api/marketplace/listing</code> – fetch SKU.<br />
                <code>POST /api/marketplace/checkout</code> – checkout, Finance receipt.<br />
                <code>POST /api/artifact/publish</code> – deliver encrypted artifact with proof.
              </div>
            }
          />
          <Card
            title="StorySphere / LiveLoop"
            body={
              <div className="space-y-2 text-sm">
                <code>POST /api/v1/generate</code> – create job.<br />
                <code>POST /api/v1/liveloop/publish</code> – publish asset to LiveLoop.<br />
                <code>POST /api/v1/media/best-format</code> – resolve best media variant.
              </div>
            }
          />
          <Card
            title="Docs & legal"
            body={
              <div className="text-sm text-slate-200/80 space-y-2">
                <p>Legal claims: signed delivery, auditability, policy enforcement. Document data handling, privacy, and usage of ACE assets.</p>
                <Link href="/legal" className="text-teal-300 underline underline-offset-4 text-sm">
                  View legal
                </Link>
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Issues" title="Submit problems or errors">
        <Card
          title="Support channel"
          body={
            <div className="text-sm text-slate-200/80 space-y-2">
              <p>Report ACE manifest issues, API failures, or policy verdict discrepancies.</p>
              <p>Include: request body, response, timestamp, and SHA.</p>
              <Link href="mailto:support@illuvrse.com" className="text-teal-300 underline underline-offset-4">
                Email support@illuvrse.com
              </Link>
            </div>
          }
        />
      </PageSection>
    </div>
  );
}
