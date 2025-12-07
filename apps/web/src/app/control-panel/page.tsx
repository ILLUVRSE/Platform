import { Card, PageSection, Pill, StatBadge, ProofCard } from "@illuvrse/ui";
import Link from "next/link";
import { TraceViewer } from "./trace-viewer";
import { AuditLog } from "./audit-log";

export default function ControlPanelPage() {
  const gated = process.env.NODE_ENV === "production";
  return (
    <div className="space-y-10">
        <section className="rounded-3xl border border-red-500/40 bg-red-950/30 px-8 py-6 shadow-card">
          <h2 className="text-xl font-semibold text-red-100">Restricted — admin only</h2>
          <p className="text-sm text-red-200/80">
            Control-Panel is gated and not visible on the public site. Authentication required.
          </p>
        </section>
        <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
          <Pill className="bg-slate-700 text-gold-200">Control-Panel</Pill>
          <h1 className="mt-3 text-4xl font-semibold">Operator surface with proofs and policy</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
            Gated operator controls backed by Kernel RBAC, SentinelNet policy verdicts, and
            Reasoning Graph traces. Use it to ship changes, run canaries, or roll back with audit
            evidence.
          </p>
        </section>

        <PageSection eyebrow="Operator controls" title="Built-in guardrails">
          <div className="grid gap-4 md:grid-cols-3">
            <Card
              title="Maintenance toggle"
              body={
                <div className="space-y-3 text-sm">
                  <p>
                    Pause user-facing systems with Kernel-signed change events and SentinelNet
                    approvals.
                  </p>
                  <StatBadge label="Status" value="Online" variant="success" />
                </div>
              }
            />
            <Card
              title="Policy & canary"
              body={
                <div className="space-y-3 text-sm">
                  <p>Attach deterministic rules and route high-risk changes through canaries.</p>
                  <StatBadge label="Current policy" value="v0.9.2 PASS" variant="neutral" />
                </div>
              }
            />
            <Card
              title="Reasoning Graph"
              body={
                <div className="space-y-3 text-sm">
                  <p>
                    Inspect decision traces for promotions, rollbacks, and Marketplace approvals with
                    linked audit proofs.
                  </p>
                  <StatBadge label="Recent events" value="12 traces" variant="warning" />
                  <Link
                    href="/api/reasoning/demo-trace"
                    className="text-sm font-semibold text-teal-300 underline underline-offset-4"
                  >
                    Fetch sample trace
                  </Link>
                </div>
              }
            />
          </div>
        </PageSection>

        <PageSection eyebrow="Proof" title="Recent signed change">
          <ProofCard
            sha="f41c:0022...aa9b"
            signer="Kernel multisig"
            timestamp="2025-02-03 15:00 UTC"
            ledgerLink="/developers#ledger"
            policyVerdict="SentinelNet PASS"
          />
          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Reasoning trace</div>
            <TraceViewer />
          </div>
          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-200/70">Audit log</div>
            <AuditLog />
          </div>
        </PageSection>
    </div>
  );
}
