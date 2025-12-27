import Link from "next/link";
import { Card, PageSection, Pill, ProofCard, StatBadge } from "@illuvrse/ui";
import { buildMetadata, buildJsonLd } from "@/lib/metadata";

const title = "Status | ILLUVRSE system health";
const description = "Current system status for LiveLoop, Kernel, and Marketplace services.";

export const metadata = buildMetadata({
  title,
  description,
  path: "/status",
  noIndex: true
});

const pageJsonLd = buildJsonLd({
  title,
  description,
  path: "/status",
  type: "WebPage"
});

const serviceStatuses = [
  {
    name: "Kernel",
    status: "Online",
    detail: "Signing + RBAC healthy",
    variant: "success" as const
  },
  {
    name: "SentinelNet",
    status: "Online",
    detail: "Policy engine + canaries passing",
    variant: "success" as const
  },
  {
    name: "LiveLoop",
    status: "Online",
    detail: "Low-latency stream nodes green",
    variant: "success" as const
  },
  {
    name: "Marketplace",
    status: "Online",
    detail: "Checkout + receipts stable",
    variant: "success" as const
  }
];

const kernelSentinelMetrics = [
  {
    name: "Kernel",
    latencyMs: 182,
    p95LatencyMs: 241,
    passRate: "99.98%",
    policyVerdict: "PASS v1.0.3",
    proofSha: "f41c:0022...aa9b",
    signer: "Kernel multisig",
    description: "Signing, verification, and RBAC attestations"
  },
  {
    name: "SentinelNet",
    latencyMs: 205,
    p95LatencyMs: 289,
    passRate: "99.92%",
    policyVerdict: "PASS (canary clean)",
    proofSha: "c9aa:44b1...bb7d",
    signer: "Sentinel council",
    description: "Policy evaluation + red team canaries"
  }
];

const faqItems = [
  {
    title: "What counts as a proof?",
    body:
      "Every artifact and manifest ships with a SHA-256 hash, Kernel signature, and ledger link so you can replay the change and audit the signer."
  },
  {
    title: "How are signatures verified?",
    body:
      "Kernel verify recomputes the hash, checks the multisig, and compares against the ledger. Control-Panel snapshots include proofSha and signer for every toggle."
  },
  {
    title: "How are policy verdicts decided?",
    body:
      "SentinelNet runs deterministic rules plus canaries. Verdicts (PASS/FAIL) ride alongside Kernel signatures so developers can block deploys when policy changes."
  }
];

export default function StatusPage() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(pageJsonLd)}</script>
      <div className="space-y-10">
        <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
          <Pill className="bg-teal-50 text-teal-700">Status</Pill>
          <h1 className="mt-3 text-4xl font-semibold">Platform uptime and verification</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-700">
            LiveLoop, Kernel, Marketplace, and SentinelNet are all online. Kernel/Sentinel metrics
            feed the latency and pass-rate widgets below so you can spot regressions before they
            ship.
          </p>
        </section>

        <PageSection eyebrow="Core systems" title="Operational overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {serviceStatuses.map((service) => (
              <Card
                key={service.name}
                title={service.name}
                body={
                  <div className="space-y-3 text-sm">
                    <StatBadge label="Status" value={service.status} variant={service.variant} />
                    <p className="text-slate-700">{service.detail}</p>
                  </div>
                }
              />
            ))}
          </div>
        </PageSection>

        <PageSection eyebrow="Kernel/Sentinel metrics" title="Latency and pass-rate" id="metrics">
          <div className="grid gap-4 md:grid-cols-2">
            {kernelSentinelMetrics.map((metric) => (
              <Card
                key={metric.name}
                title={`${metric.name} health`}
                body={
                  <div className="space-y-4 text-sm text-slate-700">
                    <p>{metric.description}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <StatBadge label="p50 latency" value={`${metric.latencyMs} ms`} variant="success" />
                      <StatBadge label="p95 latency" value={`${metric.p95LatencyMs} ms`} variant="warning" />
                      <StatBadge label="Pass rate" value={metric.passRate} variant="success" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[12px] text-slate-800">{metric.proofSha}</span>
                      <span className="h-3 w-px bg-slate-300" />
                      <span className="font-semibold text-slate-800">{metric.signer}</span>
                      <span className="h-3 w-px bg-slate-300" />
                      <span className="text-teal-700">{metric.policyVerdict}</span>
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        </PageSection>

        <PageSection eyebrow="Ledger proofs" title="Recent signed change">
          <ProofCard
            sha="f41c:0022...aa9b"
            signer="Kernel multisig"
            timestamp="2025-02-03 15:00 UTC"
            ledgerLink="/developers#ledger"
            policyVerdict="SentinelNet PASS"
          />
        </PageSection>

        <PageSection eyebrow="FAQ" title="Proofs, signatures, policy">
          <div className="grid gap-4 md:grid-cols-3">
            {faqItems.map((item) => (
              <Card
                key={item.title}
                title={item.title}
                body={<p className="text-sm text-slate-700">{item.body}</p>}
                footer={
                  <Link href="/developers" className="text-sm font-semibold text-teal-700 underline underline-offset-4">
                    View developer docs
                  </Link>
                }
              />
            ))}
          </div>
          <div className="mt-4 text-sm text-slate-700">
            Need operational controls? Head to the{" "}
            <Link href="/control-panel" className="text-teal-700 underline underline-offset-4">
              Control-Panel
            </Link>{" "}
            for policy verdicts, approval queue, and audit traces.
          </div>
        </PageSection>
      </div>
    </>
  );
}
