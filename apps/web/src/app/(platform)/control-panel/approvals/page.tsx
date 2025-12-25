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
      return "bg-amber-100 text-amber-700";
    case "approved":
    case "executed":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "failed":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function ApprovalsPage() {
  const approvals = await prisma.agentApproval.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-card">
        <Pill className="bg-gold-500/20 text-gold-400">Control-Panel</Pill>
        <h1 className="mt-3 text-4xl font-semibold">Approval ledger</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-700">
          Persistent record of agent approvals and execution outcomes. Latest 200 requests shown.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/control-panel"
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
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
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusStyles(approval.status)}`}>
                        {approval.status}
                      </span>
                      <span className="text-slate-500">Agent: {approval.agentId}</span>
                    </div>
                    <div className="grid gap-2 text-[12px] text-slate-500 md:grid-cols-2">
                      <div>Requested: {formatTime(approval.createdAt)}</div>
                      <div>Decided: {formatTime(approval.decidedAt)}</div>
                      <div>Requested by: {approval.requestedBy ?? "-"}</div>
                      <div>Approved by: {approval.approvedBy ?? "-"}</div>
                    </div>
                    {approval.execution ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600">
                        <div>Execution: {approval.execution.ok ? "ok" : "failed"}</div>
                        {"jobId" in approval.execution && approval.execution.jobId ? <div>Job: {approval.execution.jobId as string}</div> : null}
                        {"error" in approval.execution && approval.execution.error ? <div>Error: {approval.execution.error as string}</div> : null}
                      </div>
                    ) : null}
                    {approval.payload || approval.manifest ? (
                      <details className="text-[12px] text-slate-500">
                        <summary className="cursor-pointer text-slate-600">View payload</summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-slate-700">
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No approval records yet. Trigger an agent action to populate the ledger.
          </div>
        )}
      </PageSection>
    </div>
  );
}
