"use client";

import { useState } from "react";

export function CheckoutForm({ sha }: { sha: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const submit = async () => {
    setStatus("Submitting...");
    setError(null);
    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: "agent-bundle-grid-analyst",
          price: 49,
          currency: "USD",
          sha256: sha
        })
      });
      const json = await res.json();
      if (res.ok) {
        setStatus(`Receipt ${json.receipt?.id ?? "unknown"} | delivery ready`);
        setReceipt(json.receipt);
        setDelivery(json.finance?.delivery ?? json.delivery);
      } else {
        setError(`Checkout failed: ${json.error ?? res.status}`);
      }
    } catch (e) {
      setError((e as Error).message);
      setStatus(null);
    }
  };

  const verifyReceipt = async () => {
    setVerifyError(null);
    try {
      const res = await fetch("/api/finance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt })
      });
      if (!res.ok) {
        setVerifyError(`Verify failed: ${res.status}`);
        return;
      }
      const json = await res.json();
      setStatus(`Receipt verified: ${json.valid ? "valid" : "invalid"}`);
    } catch (e) {
      setVerifyError((e as Error).message);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <button
        onClick={submit}
        className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
      >
        Checkout demo
      </button>
      {status && <div className="text-teal-200">{status}</div>}
      {error && <div className="text-red-300">Error: {error}</div>}
      {receipt && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-200/80">
          <div>Receipt ID: {receipt.id}</div>
          <div>SHA: {receipt.sha256}</div>
          <div>Amount: {receipt.amount}</div>
          <div>Currency: {receipt.currency}</div>
          <div>Signature: {receipt.signature}</div>
        </div>
      )}
      {delivery && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-200/80">
          <div>Encrypted blob: {delivery.encryptedBlob}</div>
          <div>Proof: {delivery.proof}</div>
          <div>Policy: {delivery.policy ?? "stub"}</div>
        </div>
      )}
      {receipt && (
        <button
          onClick={verifyReceipt}
          className="rounded-full border border-slate-600 px-3 py-1 text-sm text-cream transition hover:border-teal-500/70 hover:text-teal-200"
        >
          Verify receipt
        </button>
      )}
      {verifyError && <div className="text-red-300">{verifyError}</div>}
    </div>
  );
}
