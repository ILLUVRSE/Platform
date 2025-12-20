"use client";

import { useEffect, useMemo, useState } from "react";

type ApprovalRequest = {
  id: string;
  agentId: string;
  action: string;
  status: "pending" | "approved" | "rejected" | "executed" | "failed";
  requestedBy?: string;
  approvedBy?: string;
  createdAt: number;
  decidedAt?: number;
  reason?: string;
  payload?: Record<string, unknown>;
  manifest?: Record<string, unknown>;
  execution?: { ok: boolean; jobId?: string; status?: number; error?: string };
};

const APPROVER_KEY = "illuvrse-approver";

function formatTime(ts?: number) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

function StatusPill({ status }: { status: ApprovalRequest["status"] }) {
  const style =
    status === "pending"
      ? "bg-amber-100 text-amber-700"
      : status === "approved" || status === "executed"
        ? "bg-emerald-100 text-emerald-700"
        : status === "rejected"
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${style}`}>{status}</span>;
}

export function ApprovalQueue() {
  const [pending, setPending] = useState<ApprovalRequest[]>([]);
  const [history, setHistory] = useState<ApprovalRequest[]>([]);
  const [approver, setApprover] = useState("Ryan Lueckenotte");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPROVER_KEY);
      if (stored) setApprover(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APPROVER_KEY, approver);
    } catch {
      // ignore
    }
  }, [approver]);

  async function loadQueue() {
    try {
      setError(null);
      const res = await fetch("/api/agent/requests", { cache: "no-store" });
      const data = await res.json();
      setPending(data.pending ?? []);
      setHistory(data.history ?? []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  async function decide(id: string, decision: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, approvedBy: approver })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : `Failed ${res.status}`);
      }
      await loadQueue();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const hasPending = pending.length > 0;
  const recentHistory = useMemo(() => history.slice(0, 8), [history]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Approver</div>
        <input
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          value={approver}
          onChange={(e) => setApprover(e.target.value)}
          placeholder="Approver name"
        />
        <button
          type="button"
          onClick={loadQueue}
          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
        >
          Refresh
        </button>
      </div>

      {error ? <div className="text-sm text-rose-600">Queue error: {error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending approvals</div>
          {hasPending ? (
            pending.map((req) => (
              <div key={req.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{req.action}</div>
                    <div className="text-xs text-slate-500">Agent: {req.agentId}</div>
                  </div>
                  <StatusPill status={req.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>Requested {formatTime(req.createdAt)}</span>
                  {req.requestedBy ? <span>By {req.requestedBy}</span> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => decide(req.id, "approve")}
                    disabled={busyId === req.id}
                    className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(req.id, "reject")}
                    disabled={busyId === req.id}
                    className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
                {req.payload || req.manifest ? (
                  <details className="mt-3 text-[11px] text-slate-500">
                    <summary className="cursor-pointer text-slate-600">View request details</summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-slate-700">
                      {JSON.stringify({ payload: req.payload, manifest: req.manifest }, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No pending approvals right now.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent decisions</div>
          {recentHistory.length ? (
            recentHistory.map((req) => (
              <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{req.action}</div>
                    <div className="text-[11px] text-slate-500">Agent: {req.agentId}</div>
                  </div>
                  <StatusPill status={req.status} />
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {req.approvedBy ? `Approved by ${req.approvedBy}` : "Decision recorded"}
                </div>
                {req.execution?.jobId ? (
                  <div className="mt-2 text-[11px] text-slate-500">Job: {req.execution.jobId}</div>
                ) : null}
                {req.execution?.error ? (
                  <div className="mt-2 text-[11px] text-rose-600">Error: {req.execution.error}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No approvals processed yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
