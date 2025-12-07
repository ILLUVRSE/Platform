import { Card, PageSection, Pill, ProofCard } from "@illuvrse/ui";

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-slate-700 text-cream">About / Trust</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Trust-first by design</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          ILLUVRSE is a governed, auditable platform for creators and operators. Kernel signatures,
          SentinelNet policy, and the Reasoning Graph keep every change explainable and verifiable.
        </p>
      </section>

      <PageSection eyebrow="Principles" title="Non-negotiables">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Sign everything" body={<p>Artifacts, promotions, finance events, and operator changes are all signed.</p>} />
          <Card title="Deterministic policy" body={<p>SentinelNet enforces rules with predictable verdicts and canaries for high risk.</p>} />
          <Card title="Explainable ops" body={<p>Reasoning Graph provides traces with causality so operators can defend every decision.</p>} />
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
