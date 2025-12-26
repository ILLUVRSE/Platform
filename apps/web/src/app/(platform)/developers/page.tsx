import { Card, PageSection, Pill } from "@illuvrse/ui";
import Link from "next/link";
import { ManifestViewer } from "@/components/ManifestViewer";
import type { AceAgentManifest } from "@illuvrse/contracts";

const sampleManifest: AceAgentManifest = {
  id: "agent.story-weaver.001",
  name: "StoryWeaver",
  version: "0.1.0",
  description: "Generator + catalog agent for StorySphere previews",
  archetype: "Oracle",
  capabilities: ["generator", "catalog"],
  triggers: [{ type: "event", event: "job.requested" }],
  modelBindings: { llm: { id: "gpt-4o-mini", provider: "openai" }, tts: { id: "eleven.v1", voice: "calm" } },
  permissions: { storage: { write: ["previews/", "final/"] }, network: { outbound: true } },
  resources: { cpu: "500m", memory: "1Gi" },
  runtime: { container: { image: "illuvrse/agent-storyweaver:dev" } },
  metadata: { owner: "ryan", env: "dev" }
};

export default function DevelopersPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-50 text-teal-700">Developers</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Specs, legal, and support for ACE + platform</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          Official specs for ACE agents, Kernel/Marketplace contracts, and legal claims. Submit issues directly to Ryan’s team when you hit errors.
        </p>
      </section>

      <PageSection eyebrow="Starter pack" title="Get up and running fast" id="starter-pack">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            title="Clone + run locally"
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <div>
                  <code>pnpm install</code> → <code>pnpm dev</code> to boot the platform at <code>http://localhost:3000</code>.
                </div>
                <div>
                  Set <code>AGENT_BACKEND_URL</code> if pointing to a remote AgentManager; leave empty to use local stubs.
                </div>
                <Link href="https://github.com/illuvrse/platform#local-dev-flow-agentmanager--studio" className="text-teal-700 underline underline-offset-4">
                  Read the local dev flow
                </Link>
              </div>
            }
          />
          <Card
            title="Good first issues"
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <p>Pick up scoped, beginner-friendly tickets to learn the stack.</p>
                <Link href="https://github.com/illuvrse/platform/labels/good%20first%20issue" className="text-teal-700 underline underline-offset-4">
                  Platform good-first-issues
                </Link>
                <br />
                <Link href="https://github.com/illuvrse/platform/contribute" className="text-teal-700 underline underline-offset-4">
                  Contribution checklist
                </Link>
              </div>
            }
          />
          <Card
            title="ACE manifest templates"
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <p>Start from prebuilt JSON seeds for Oracle, Performer, and Producer archetypes.</p>
                <Link href="/ace/create" className="text-teal-700 underline underline-offset-4">
                  Open the ACE creator
                </Link>
                <br />
                <Link href="https://github.com/illuvrse/platform/blob/main/apps/web/src/app/(platform)/developers/page.tsx#L5" className="text-teal-700 underline underline-offset-4">
                  Download the StoryWeaver sample manifest
                </Link>
              </div>
            }
          />
          <Card
            title="AgentManager config"
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <div>Tune port, hostname, and queue concurrency for local + remote queues.</div>
                <Link href="https://github.com/illuvrse/platform/blob/main/packages/agent-manager/src/config.ts" className="text-teal-700 underline underline-offset-4">
                  View config defaults
                </Link>
                <br />
                <Link href="https://github.com/illuvrse/platform#environment" className="text-teal-700 underline underline-offset-4">
                  Environment variable reference
                </Link>
              </div>
            }
          />
          <Card
            title="Sandbox instructions"
            body={
              <div className="space-y-2 text-sm text-slate-700">
                <div>Run with local stubs for Kernel, Sentinel, and Marketplace to validate flows without external services.</div>
                <div>Use the Playground to stream status/proof data and the Developers tools to verify SHA + policy verdicts.</div>
                <Link href="https://github.com/illuvrse/platform#api-stubs" className="text-teal-700 underline underline-offset-4">
                  View sandbox stub endpoints
                </Link>
              </div>
            }
          />
        </div>
      </PageSection>

      <PageSection eyebrow="ACE Manifest" title="Agent Creation Experience spec" id="ace-spec">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Required fields"
            body={
              <div className="text-sm text-slate-700 space-y-2">
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
              <div className="text-sm text-slate-700 space-y-2">
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
              <div className="text-sm text-slate-700 space-y-2">
                <p>Legal claims: signed delivery, auditability, policy enforcement. Document data handling, privacy, and usage of ACE assets.</p>
                <Link href="/legal" className="text-teal-700 underline underline-offset-4 text-sm">
                  View legal
                </Link>
              </div>
            }
          />
            <Card
              title="Agent / Playground"
              body={
                <div className="space-y-2 text-sm">
                  <code>POST /api/agent/exec</code> – enqueue actions (preview/publish/verify).<br />
                  <code>GET /api/agent/stream</code> – SSE with status, proofSha, policyVerdict, latencyMs.<br />
                  <code>AGENT_BACKEND_URL</code> – AgentManager base URL for exec/status/stream polling.<br />
                  <code>approvedBy</code> – required on exec when <code>AGENT_APPROVAL_REQUIRED</code> is not <code>false</code>.<br />
                  <code>GET /api/agent/requests</code> – approval queue for operators.<br />
                  <code>POST /api/agent/approve</code> – approve or reject pending requests.<br />
                  <code>GET /api/ace/registry</code> – list local ACE manifests (registry).<br />
                  <code>POST /api/ace/handoff</code> – set active handoff manifest.
                </div>
              }
            />
        </div>
      </PageSection>

      <PageSection eyebrow="Viewer" title="Validate & inspect a manifest">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="How to use"
            body={
              <div className="text-sm text-slate-700 space-y-2">
                <p>Paste your ACE Agent Manifest and ensure it passes validation, signing, and policy verdicts.</p>
                <p>The viewer computes SHA-256, calls Kernel verify, and shows SentinelNet stub verdicts.</p>
                <p>Handoff: build in ACE, click “Send to Playground” to store manifest (cookie + localStorage), then open `/playground?source=ace` to preview actions.</p>
              </div>
            }
          />
          {/* @ts-expect-error Server Component */}
          <ManifestViewer manifest={sampleManifest} />
        </div>
      </PageSection>

      <PageSection eyebrow="Issues" title="Submit problems or errors">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Support channel"
            body={
              <div className="text-sm text-slate-700 space-y-2">
                <p>Report ACE manifest issues, API failures, or policy verdict discrepancies.</p>
                <p>Include: request body, response, timestamp, and SHA.</p>
                <Link href="mailto:support@illuvrse.com" className="text-teal-700 underline underline-offset-4">
                  Email support@illuvrse.com
                </Link>
              </div>
            }
          />
          <Card
            title="Contribution guidelines"
            body={
              <div className="text-sm text-slate-700 space-y-2">
                <p>When filing issues or PRs, include repro steps, expected vs. actual behavior, and manifest snippets when relevant.</p>
                <p>Link the Git commit or branch you tested against, and tag whether it impacts Kernel, Sentinel, Marketplace, or AgentManager.</p>
                <Link href="https://github.com/illuvrse/platform/blob/main/README.md" className="text-teal-700 underline underline-offset-4">
                  Read contribution expectations
                </Link>
              </div>
            }
          />
        </div>
      </PageSection>
    </div>
  );
}
