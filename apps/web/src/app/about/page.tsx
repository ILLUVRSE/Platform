import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-teal-50 text-teal-700">About / Trust</Pill>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Trust-first by design</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          ILLUVRSE is the governed platform for creators and operators: every artifact, agent, and publish event ships with signatures, policy verdicts, and explainability.
        </p>
      </section>

      <PageSection eyebrow="Platform Mission" title="ILLUVRSE">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Governed creation & delivery"
            body={<p>Provide a trust layer where every artifact is signed, auditable, and policy-enforced—from creation through delivery—so creators and operators can ship with confidence.</p>}
          />
          <Card
            title="Explainable by default"
            body={<p>Kernel signatures, Sentinel policy verdicts, and Reasoning Graph traces keep changes defensible, with proofs attached end-to-end.</p>}
          />
        </div>
      </PageSection>

      <PageSection eyebrow="ACE Mission" title="Agent Creation Experience">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Build and validate agents"
            body={<p>Design, validate, and register agents with manifests, proofs, and policies baked in—moving from idea to signed, deployable agents quickly and safely.</p>}
          />
          <Card
            title="Handoff ready"
            body={<p>One-click to Playground or registration; autosave, import/export, and policy/proof checks ensure agents are production-ready.</p>}
          />
        </div>
      </PageSection>

      <PageSection eyebrow="StorySphere Mission" title="Studio & LiveLoop">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Proof-backed media"
            body={<p>Provide a creator-facing studio to turn prompts and agent workflows into playable, proof-backed media (previews, MP4s, LiveLoop slots), showcasing signed outputs in an always-on stream.</p>}
          />
          <Card
            title="Agent ops + LiveLoop"
            body={<p>Generator, Scheduler, Proof Guardian, Curator, Moderator, Voice Stylist, and Engagement Monitor workers keep LiveLoop on-air, safe, and explainable.</p>}
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Playground Mission" title="3D / VR control room">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Sandbox with proofs"
            body={<p>Load, inspect, and exercise agents end-to-end—including validation, proofs, and quick handoff back to ACE or live runtimes—via a 3D/VR control room.</p>}
          />
          <Card
            title="Command & status"
            body={<p>Trigger agent commands (generate, publish, verify) and watch live status/metrics/proofs stream into nodes; sync selections with ACE.</p>}
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Marketplace Mission" title="Trusted exchange">
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Signed listings"
            body={<p>List agents and artifacts with clear proofs, policies, and provenance so buyers trust what they get and sellers publish with auditability.</p>}
          />
          <Card
            title="Delivery with receipts"
            body={<p>Finance receipts and ArtifactPublisher flows carry signatures and verification, ensuring end-to-end integrity.</p>}
          />
        </div>
      </PageSection>

      <PageSection eyebrow="Proof" title="Sample signed artifact">
        <ProofCard
          sha="f41c:0022...aa9b"
          signer="Kernel multisig"
          timestamp="2025-02-03 15:00 UTC"
          ledgerLink="/developers#ledger"
          policyVerdict="SentinelNet PASS"
        />
      </PageSection>
    </div>
  );
}
