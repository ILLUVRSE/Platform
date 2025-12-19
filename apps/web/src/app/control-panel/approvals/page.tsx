import Link from "next/link";
import { prisma } from "@illuvrse/db";
import { Card, PageSection, Pill } from "@illuvrse/ui";

function formatTime(value: Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusStyles(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-200";
    case "approved":
    case "executed":
      return "bg-emerald-500/20 text-emerald-200";
    case "rejected":
      return "bg-rose-500/20 text-rose-200";
    case "failed":
      return "bg-slate-700 text-slate-200";
    default:
      return "bg-slate-800 text-slate-200";
  }
}

export default async function ApprovalsPage() {
  const approvals = await prisma.agentApproval.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-700/70 bg-slate-800/70 px-8 py-10 shadow-card">
        <Pill className="bg-slate-700 text-gold-200">Control-Panel</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Approval ledger</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-200/90">
          Persistent record of agent approvals and execution outcomes. Latest 200 requests shown.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/control-panel"
            className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-cream transition hover:border-teal-500/70 hover:text-teal-200"
          >
            Back to Control-Panel
          </Link>
        </div>
      </section>

      <PageSection eyebrow="Approvals" title="All requests">
        {approvals.length ? (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <Card
                key={approval.id}
                title={approval.action}
                body={
                  <div className="space-y-3 text-sm text-slate-200/80">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusStyles(approval.status)}`}>
                        {approval.status}
                      </span>
                      <span className="text-slate-400">Agent: {approval.agentId}</span>
                    </div>
                    <div className="grid gap-2 text-[12px] text-slate-400 md:grid-cols-2">
                      <div>Requested: {formatTime(approval.createdAt)}</div>
                      <div>Decided: {formatTime(approval.decidedAt)}</div>
                      <div>Requested by: {approval.requestedBy ?? "-"}</div>
                      <div>Approved by: {approval.approvedBy ?? "-"}</div>
                    </div>
                    {approval.execution ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-[12px] text-slate-300">
                        <div>Execution: {approval.execution.ok ? "ok" : "failed"}</div>
                        {"jobId" in approval.execution && approval.execution.jobId ? <div>Job: {approval.execution.jobId as string}</div> : null}
                        {"error" in approval.execution && approval.execution.error ? <div>Error: {approval.execution.error as string}</div> : null}
                      </div>
                    ) : null}
                    {approval.payload || approval.manifest ? (
                      <details className="text-[12px] text-slate-400">
                        <summary className="cursor-pointer text-slate-300">View payload</summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-slate-200">
                          {JSON.stringify({ payload: approval.payload, manifest: approval.manifest }, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200/70">
            No approval records yet. Trigger an agent action to populate the ledger.
          </div>
        )}
      </PageSection>
    </div>
  );
}
