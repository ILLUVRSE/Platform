"use client";

import { useState } from "react";

export function CheckoutForm({ sha }: { sha: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [manifestProof, setManifestProof] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const submit = async () => {
    setStatus("Submitting checkout...");
    setError(null);
    setVerifyResult(null);
    setVerifyError(null);
    const manifest = {
      sha256: sha,
      signer: "kernel-multisig",
      timestamp: new Date().toISOString(),
      ledgerUrl: "/developers#ledger",
      policyVerdict: "SentinelNet PASS",
      signature: `sig-${sha.slice(0, 8)}`
    };
    try {
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: "agent-bundle-grid-analyst",
          price: 49,
          currency: "USD",
          sha256: sha,
          manifestProof: manifest
        })
      });
      const json = await res.json();
      if (res.ok) {
        setStatus(
          `Payment ${json.payment?.status ?? "stubbed"} • Receipt ${json.receipt?.id ?? "unknown"} • ${
            json.delivery?.downloadUrl ? "Delivery ready" : "Awaiting delivery"
          }`
        );
        setReceipt(json.receipt);
        setDelivery(json.finance?.delivery ?? json.delivery);
        setPayment(json.payment);
        setManifestProof(json.manifestProof ?? json.proof);
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
    setVerifyResult(null);
    try {
      const res = await fetch("/api/finance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt, delivery, manifestProof, payment })
      });
      if (!res.ok) {
        setVerifyError(`Verify failed: ${res.status}`);
        return;
      }
      const json = await res.json();
      setVerifyResult(json);
      setStatus(`Receipt verified: ${json.valid ? "valid" : "invalid"}`);
    } catch (e) {
      setVerifyError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <button
        onClick={submit}
        className="rounded-full bg-gradient-to-r from-gold-500 to-teal-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-card transition hover:opacity-95"
      >
        Checkout demo
      </button>
      {status && <div className="text-teal-700">{status}</div>}
      {error && <div className="text-rose-600">Error: {error}</div>}
      {payment && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-900">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">Stripe payment</div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-700">
              {payment.mode}
            </span>
          </div>
          <div>Status: {payment.status}</div>
          <div>Intent: {payment.intentId}</div>
          <div>
            Amount: {typeof payment.amount === "number" ? (payment.amount / 100).toFixed(2) : "n/a"}{" "}
            {payment.currency?.toUpperCase?.() ?? "USD"}
          </div>
          {payment.receiptUrl && (
            <a className="text-teal-700 underline" href={payment.receiptUrl} target="_blank" rel="noreferrer">
              Receipt link
            </a>
          )}
          {payment.error && <div className="text-amber-700">Fallback: {payment.error}</div>}
        </div>
      )}
      {manifestProof && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Manifest proof</div>
            <span className="font-semibold text-teal-700">{manifestProof.policyVerdict}</span>
          </div>
          <div>SHA: {manifestProof.sha256}</div>
          <div>Signer: {manifestProof.signer}</div>
          <div>Ledger: {manifestProof.ledgerUrl}</div>
          <div>Signature: {manifestProof.signature}</div>
        </div>
      )}
      {receipt && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div>Receipt ID: {receipt.id}</div>
          <div>SHA: {receipt.sha256}</div>
          <div>
            Amount: {receipt.amount} {receipt.currency}
          </div>
          <div>SKU: {receipt.sku ?? "n/a"}</div>
          <div>Signature: {receipt.signature ?? "stub"}</div>
        </div>
      )}
      {delivery && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div>Encrypted blob: {delivery.encryptedBlob}</div>
          <div>Policy: {delivery.policy ?? "stub"}</div>
          {delivery.proof ? (
            <div className="mt-1 text-[11px] text-slate-600">
              Proof signer: {delivery.proof.signer} | Signature: {delivery.proof.signature}
            </div>
          ) : null}
          {delivery.downloadUrl && (
            <div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Download</div>
              <a className="font-semibold text-teal-700 underline" href={delivery.downloadUrl} target="_blank" rel="noreferrer">
                {delivery.downloadUrl}
              </a>
              <div className="text-[11px] text-slate-500">Token: {delivery.downloadToken}</div>
              <div className="text-[11px] text-slate-500">Expires: {delivery.expiresAt}</div>
            </div>
          )}
          {delivery.proof?.signature ? (
            <div className="mt-2 text-[11px] text-slate-500">Delivery signature: {delivery.proof.signature}</div>
          ) : null}
        </div>
      )}
      {receipt && (
        <button
          onClick={verifyReceipt}
          className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:border-teal-500/70 hover:text-teal-700"
        >
          Verify receipt
        </button>
      )}
      {verifyResult && (
        <div className="rounded-xl border border-teal-200 bg-white p-3 text-xs text-teal-900 shadow-card">
          <div className="font-semibold">Verification</div>
          <div>Valid: {verifyResult.valid ? "yes" : "no"}</div>
          <div>Download verified: {verifyResult.downloadVerified ? "yes" : "no"}</div>
          <div>Payment status: {verifyResult.paymentStatus}</div>
          <div>Proof signer: {verifyResult.proof?.signer}</div>
          <div>Ledger: {verifyResult.proof?.ledgerUrl}</div>
          {verifyResult.deliverySummary?.downloadUrl && (
            <div className="text-[11px] text-slate-700">
              Delivery: {verifyResult.deliverySummary.downloadUrl} (exp {verifyResult.deliverySummary.expiresAt})
            </div>
          )}
        </div>
      )}
      {verifyError && <div className="text-rose-600">Verify error: {verifyError}</div>}
    </div>
  );
}
