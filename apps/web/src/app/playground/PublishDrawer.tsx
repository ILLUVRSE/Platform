"use client";

import { useEffect, useState } from "react";
import type { AceAgentManifest } from "@illuvrse/contracts";

const APPROVER_KEY = "illuvrse-approver";

export function PublishDrawer() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string>("ace-playground");
  const [approvedBy, setApprovedBy] = useState<string>("Ryan Lueckenotte");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPROVER_KEY);
      if (stored) setApprovedBy(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APPROVER_KEY, approvedBy);
    } catch {
      // ignore
    }
  }, [approvedBy]);

  function getStoredManifest(): AceAgentManifest | null {
    try {
      const raw = localStorage.getItem("ace-playground-manifest");
      if (!raw) return null;
      return JSON.parse(raw) as AceAgentManifest;
    } catch {
      return null;
    }
  }

  function hydrate() {
    try {
      const parsed = getStoredManifest();
      if (parsed) {
        setAgentId(parsed.id ?? agentId);
      }
    } catch {
      // ignore
    }
  }

  async function callEndpoint(path: string, options?: RequestInit) {
    try {
      const res = await fetch(path, { method: options?.method ?? "POST", headers: { "Content-Type": "application/json" }, ...options });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : `Failed ${res.status}`);
      const message = typeof data?.message === "string" ? data.message : `${path} ok`;
      setStatus(message);
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Publish preview</div>
          <div className="text-sm text-slate-800">Stub checkout + publish flow</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="rounded-full border border-slate-300 px-3 py-1 text-[12px] font-semibold text-slate-800 transition hover:border-teal-500/70"
        >
          {open ? "Close" : "Open"}
        </button>
      </div>
      {open ? (
        <div className="mt-3 space-y-2 text-[12px] text-slate-700">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-800">Selected agent</div>
            <p className="text-slate-600">Reads from Playground manifest storage.</p>
            <div className="mt-1 flex items-center gap-2">
              <input className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm" value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent id" />
              <button
                type="button"
                onClick={hydrate}
                className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-800 transition hover:border-teal-500/70"
              >
                Load from storage
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-800">Operator approval</div>
            <p className="text-slate-600">Required before agent actions run.</p>
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-800"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              placeholder="approver name"
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-800">Marketplace checkout</div>
            <p>Calls `/api/marketplace/checkout` stub.</p>
            <button
              type="button"
              onClick={() => callEndpoint("/api/marketplace/checkout")}
              className="mt-1 rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-800 transition hover:border-teal-500/70"
            >
              Run checkout
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-800">Publish artifact</div>
            <p>Calls `/api/artifact/publish` stub for delivery proof.</p>
            <button
              type="button"
              onClick={() => callEndpoint("/api/artifact/publish")}
              className="mt-1 rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-800 transition hover:border-teal-500/70"
            >
              Publish stub
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-800">Verify proofs</div>
            <p>Triggers `/api/agent/exec` verify action for the selected manifest stored in Playground.</p>
            <button
              type="button"
              onClick={() => {
                const manifest = getStoredManifest();
                const payload = { agentId, action: "verify.proofs", approvedBy, manifest, requestedBy: "Playground" };
                callEndpoint("/api/agent/exec", { body: JSON.stringify(payload) });
              }}
              className="mt-1 rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-800 transition hover:border-teal-500/70"
            >
              Verify stub
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-800">Finance receipt</div>
            <p>Calls `/api/finance/receipt` stub to show a mock receipt.</p>
            <button
              type="button"
              onClick={() => callEndpoint("/api/finance/receipt", { body: JSON.stringify({ sha256: `demo-${agentId}`, amount: 10 }) })}
              className="mt-1 rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-800 transition hover:border-teal-500/70"
            >
              Generate receipt
            </button>
          </div>
          {status ? <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">Status: {status}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
